import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDlOItlVJP6hAD4yEKA8ZdDkI4FxV3oNlw",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "gmemprestimo-69965.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "gmemprestimo-69965",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "gmemprestimo-69965.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "200113810439",
  appId: process.env.FIREBASE_APP_ID || "1:200113810439:web:b8f49db6b8ac01975d4ea2"
};

let db: any;
let storage: any;
try {
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);
} catch (e) {
  console.error("Firebase initialization error:", e);
}

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
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// --- API ROUTES ---

const checkFirebaseConfig = (req: any, res: any, next: any) => {
  // Config is now hardcoded as fallback, so it's always available
  next();
};

app.use('/api/clients', checkFirebaseConfig);
app.use('/api/settings', checkFirebaseConfig);

// Server-Sent Events for Real-time Updates
const sseClients = new Set<express.Response>();

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Prevent proxy buffering
  res.flushHeaders();

  sseClients.add(res);

  // Send a ping every 15 seconds to keep the connection alive
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
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
    
    const q = query(collection(db, "clients"), where("cpf", "==", formattedCpf));
    const querySnapshot = await getDocs(q);
      
    if (querySnapshot.empty) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }
    
    const data = querySnapshot.docs[0].data();
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
    const docRef = doc(db, "admin_settings", "1");
    const docSnap = await getDoc(docRef);
      
    if (!docSnap.exists()) {
      return res.json({ taxaJuros: '40', taxaAtrasoDia: '8' });
    }
    res.json(docSnap.data());
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Falha ao buscar configurações" });
  }
});

// Update Admin Settings (Protected)
app.put("/api/settings", requireAdmin, async (req, res) => {
  try {
    const { taxaJuros, taxaAtrasoDia } = req.body;
    await setDoc(doc(db, "admin_settings", "1"), { taxaJuros, taxaAtrasoDia }, { merge: true });
      
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
    const q = query(collection(db, "clients"), orderBy("dataCadastro", "desc"));
    const querySnapshot = await getDocs(q);
      
    const parsedClients = querySnapshot.docs.map(doc => {
      const c = doc.data();
      return typeof c.dados === 'string' ? JSON.parse(c.dados) : c.dados;
    });
    res.json(parsedClients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Falha ao buscar clientes" });
  }
});

async function processClientFiles(client: any) {
  if (client.arquivos && Array.isArray(client.arquivos)) {
    for (let i = 0; i < client.arquivos.length; i++) {
      const arquivo = client.arquivos[i];
      if (arquivo.url && arquivo.url.startsWith('data:')) {
        try {
          const fileRef = ref(storage, `clients/${client.id}/${Date.now()}_${arquivo.name}`);
          await uploadString(fileRef, arquivo.url, 'data_url');
          const downloadURL = await getDownloadURL(fileRef);
          arquivo.url = downloadURL;
        } catch (error) {
          console.error("Error uploading file to storage:", error);
          // Fallback: keep the base64 string.
          // Note: If the base64 string is too large, Firestore will reject the document.
          // We don't throw here to allow small files to still be saved in Firestore if Storage is unconfigured.
        }
      }
    }
  }
  return client;
}

// Add New Client (Public, for registration)
app.post("/api/clients", async (req, res) => {
  try {
    const client = req.body;
    if (!client || !client.cpf) {
      return res.status(400).json({ error: "CPF é obrigatório" });
    }
    const formattedCpf = client.cpf.replace(/[^\d]+/g, '');
    
    // Check if CPF already exists
    const q = query(collection(db, "clients"), where("cpf", "==", formattedCpf));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return res.status(400).json({ error: "CPF já cadastrado" });
    }
    
    // Convert DD/MM/YYYY to YYYY-MM-DD for sorting
    let pgDate = new Date().toISOString();
    if (client.dataCadastro && client.dataCadastro.includes('/')) {
      const [day, month, year] = client.dataCadastro.split('/');
      if (day && month && year) {
        pgDate = `${year}-${month}-${day}`;
      }
    }
    
    // Process files (upload to Firebase Storage)
    const processedClient = await processClientFiles(client);
    
    await setDoc(doc(db, "clients", client.id), {
      id: client.id,
      nomeCompleto: client.nomeCompleto,
      cpf: formattedCpf,
      dataCadastro: pgDate,
      dados: processedClient
    });
      
    broadcastUpdate('UPDATE_CLIENTS');
    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error("Error saving client:", error);
    res.status(500).json({ error: "Falha ao salvar cliente", details: error.message || error });
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
      const docRef = doc(db, "clients", id);
      const docSnap = await getDoc(docRef);
        
      if (!docSnap.exists()) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      
      const payloadCpf = client.cpf?.replace(/[^\d]+/g, '');
      if (docSnap.data().cpf !== payloadCpf) {
        return res.status(403).json({ error: "Acesso negado para atualizar este cliente" });
      }
    }
    
    // Process files (upload to Firebase Storage)
    const processedClient = await processClientFiles(client);
    
    await updateDoc(doc(db, "clients", id), { dados: processedClient });
      
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
    await deleteDoc(doc(db, "clients", id));
      
    broadcastUpdate('UPDATE_CLIENTS');
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Falha ao excluir cliente" });
  }
});

// Error handler middleware
app.use((err: any, req: any, res: any, next: any) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: "Payload muito grande. Os arquivos enviados são muito pesados." });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Erro interno do servidor", details: err.message });
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
