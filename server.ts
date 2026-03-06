import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://iqeinzphgeajjwnkpewr.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_jFhefXNwrSR74wZzfxK6TQ_hKT7n9OT';
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Gustavo@01';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'secret-admin-token-123';

const requireAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${ADMIN_TOKEN}`) {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado' });
  }
};

const app = express();
const PORT = 3000;

// Increase payload limit for file uploads (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- API ROUTES ---

// Server-Sent Events for Real-time Updates
const sseClients = new Set<express.Response>();

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

function broadcastUpdate(type: string, payload?: any) {
  const message = `data: ${JSON.stringify({ type, payload })}\n\n`;
  for (const client of sseClients) {
    client.write(message);
  }
}

// Admin Login
app.post("/api/admin/login", (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ error: "Senha incorreta" });
  }
});

// Client Login (Securely fetch only one client's data)
app.post("/api/clients/login", async (req, res) => {
  try {
    const { cpf } = req.body;
    const formattedCpf = cpf.replace(/[^\d]+/g, '');
    
    const { data, error } = await supabase
      .from('clients')
      .select('dados')
      .eq('cpf', formattedCpf)
      .single();
      
    if (error || !data) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }
    
    const clientData = typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados;
    res.json(clientData);
  } catch (error) {
    console.error("Error logging in client:", error);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

// Get Admin Settings (Public, needed for simulation)
app.get("/api/settings", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('taxaJuros, taxaAtrasoDia')
      .eq('id', 1)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        return res.json({ taxaJuros: '40', taxaAtrasoDia: '8' });
      }
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Falha ao buscar configurações" });
  }
});

// Update Admin Settings (Protected)
app.put("/api/settings", requireAdmin, async (req, res) => {
  try {
    const { taxaJuros, taxaAtrasoDia } = req.body;
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ id: 1, taxaJuros, taxaAtrasoDia });
      
    if (error) throw error;
    broadcastUpdate('UPDATE_SETTINGS');
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Falha ao atualizar configurações" });
  }
});

// Get All Clients (Protected)
app.get("/api/clients", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('dados')
      .order('dataCadastro', { ascending: false });
      
    if (error) throw error;
    
    const parsedClients = data.map((c: any) => typeof c.dados === 'string' ? JSON.parse(c.dados) : c.dados);
    res.json(parsedClients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Falha ao buscar clientes" });
  }
});

// Add New Client (Public, for registration)
app.post("/api/clients", async (req, res) => {
  try {
    const client = req.body;
    const formattedCpf = client.cpf.replace(/[^\d]+/g, '');
    
    const { error } = await supabase
      .from('clients')
      .insert([{
        id: client.id,
        nomeCompleto: client.nomeCompleto,
        cpf: formattedCpf,
        dataCadastro: client.dataCadastro,
        dados: client
      }]);
      
    if (error) {
      if (error.code === '23505') { // unique violation
        return res.status(400).json({ error: "CPF já cadastrado" });
      }
      throw error;
    }
      
    broadcastUpdate('UPDATE_CLIENTS');
    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error("Error saving client:", error);
    res.status(500).json({ error: "Falha ao salvar cliente" });
  }
});

// Update Client (Public for now, but requires CPF validation to prevent unauthorized updates)
app.put("/api/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const client = req.body;
    
    // Basic authorization: check if the request comes from an admin OR if the client's CPF matches the payload
    const authHeader = req.headers.authorization;
    const isAdmin = authHeader === `Bearer ${ADMIN_TOKEN}`;
    
    if (!isAdmin) {
      // If not admin, verify that the CPF in the payload matches the CPF in the database for this ID
      const { data: existingClient, error: fetchError } = await supabase
        .from('clients')
        .select('cpf')
        .eq('id', id)
        .single();
        
      if (fetchError || !existingClient) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      
      const payloadCpf = client.cpf?.replace(/[^\d]+/g, '');
      if (existingClient.cpf !== payloadCpf) {
        return res.status(403).json({ error: "Acesso negado para atualizar este cliente" });
      }
    }
    
    const { error } = await supabase
      .from('clients')
      .update({ dados: client })
      .eq('id', id);
      
    if (error) throw error;
    broadcastUpdate('UPDATE_CLIENTS');
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Falha ao atualizar cliente" });
  }
});

// Delete Client (Protected)
app.delete("/api/clients/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    broadcastUpdate('UPDATE_CLIENTS');
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Falha ao excluir cliente" });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  async function startVite() {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  startVite();
} else if (!process.env.VERCEL) {
  // Serve static files in production (non-Vercel)
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
