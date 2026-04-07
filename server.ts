import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { readFileSync } from "fs";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service account
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (e) {
  console.error("Failed to load serviceAccountKey.json", e);
}

let db: any;
let storage: any;

try {
  if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "gmemprestimo-69965.firebasestorage.app"
    });
    db = admin.firestore();
    storage = admin.storage().bucket();
    console.log("Firebase Admin initialized successfully");
  } else {
    console.error("No service account found, Firebase Admin not initialized");
  }
} catch (e) {
  console.error("Firebase Admin initialization error:", e);
}

// --- Firebase Client SDK Mock Wrappers ---
const collection = (db: any, ...pathSegments: string[]) => db.collection(pathSegments.join('/'));
const doc = (db: any, ...pathSegments: string[]) => db.doc(pathSegments.join('/'));
const setDoc = (ref: any, data: any, options?: any) => options?.merge ? ref.set(data, { merge: true }) : ref.set(data);
const getDoc = async (ref: any) => {
  const snap = await ref.get();
  return { exists: () => snap.exists, data: () => snap.data(), id: snap.id, ref: snap.ref };
};
const getDocs = (query: any) => query.get();
const updateDoc = (ref: any, data: any) => ref.update(data);
const deleteDoc = (ref: any) => ref.delete();
const query = (ref: any, ...constraints: any[]) => {
  let q = ref;
  for (const c of constraints) q = c(q);
  return q;
};
const where = (field: string, op: string, value: any) => (q: any) => q.where(field, op, value);
const orderBy = (field: string, dir: string = 'asc') => (q: any) => q.orderBy(field, dir);
const addDoc = async (ref: any, data: any) => {
  const docRef = await ref.add(data);
  return { id: docRef.id, ...docRef };
};
const increment = (n: number) => admin.firestore.FieldValue.increment(n);
const writeBatch = (db: any) => db.batch();

const ref = (storage: any, path: string) => storage.file(path);
const uploadString = async (fileRef: any, dataString: string, format: string) => {
  const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) throw new Error('Invalid input string');
  const buffer = Buffer.from(matches[2], 'base64');
  await fileRef.save(buffer, { metadata: { contentType: matches[1] } });
};
const getDownloadURL = async (fileRef: any) => {
  try { await fileRef.makePublic(); } catch (e) { /* ignore if already public or not allowed */ }
  return `https://storage.googleapis.com/${fileRef.bucket.name}/${fileRef.name}`;
};
// -----------------------------------------

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
    res.json({ 
      ...clientData, 
      id: querySnapshot.docs[0].id,
      cpf: data.cpf,
      nomeCompleto: data.nomeCompleto || clientData.nomeCompleto
    });
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
      return res.json({ taxaJuros: '40', taxaAtrasoDia: '8', tipoTaxa: 'mensal' });
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
    const { taxaJuros, taxaAtrasoDia, tipoTaxa } = req.body;
    await setDoc(doc(db, "admin_settings", "1"), { taxaJuros, taxaAtrasoDia, tipoTaxa }, { merge: true });
      
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
      const dados = typeof c.dados === 'string' ? JSON.parse(c.dados) : c.dados;
      return { ...dados, id: doc.id };
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
    if (client.dataCadastro) {
      if (client.dataCadastro.includes('/')) {
        const [day, month, year] = client.dataCadastro.split('/');
        if (day && month && year) {
          pgDate = `${year}-${month}-${day}`;
        }
      } else if (client.dataCadastro.includes('-')) {
        pgDate = client.dataCadastro;
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
    broadcastUpdate('NEW_CLIENT', { id: client.id, nomeCompleto: client.nomeCompleto });
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
      
      let dbCpf = docSnap.data().cpf;
      if (!dbCpf) {
        const dados = typeof docSnap.data().dados === 'string' ? JSON.parse(docSnap.data().dados) : docSnap.data().dados;
        dbCpf = dados.cpf;
      }
      dbCpf = dbCpf?.replace(/[^\d]+/g, '');
      
      const payloadCpf = client.cpf?.replace(/[^\d]+/g, '');
      if (dbCpf !== payloadCpf) {
        return res.status(403).json({ error: "Acesso negado para atualizar este cliente" });
      }
    } else if (client.cpf) {
      // If admin, check if the new CPF already exists for a different client
      const formattedCpf = client.cpf.replace(/[^\d]+/g, '');
      const q = query(collection(db, "clients"), where("cpf", "==", formattedCpf));
      const querySnapshot = await getDocs(q);
      
      const existingClient = querySnapshot.docs.find(doc => doc.id !== id);
      if (existingClient) {
        return res.status(400).json({ error: "CPF já cadastrado para outro cliente" });
      }
    }
    
    // Process files (upload to Firebase Storage)
    const processedClient = await processClientFiles(client);
    
    const updateData: any = { dados: processedClient };
    if (client.nomeCompleto) updateData.nomeCompleto = client.nomeCompleto;
    if (client.cpf) updateData.cpf = client.cpf.replace(/[^\d]+/g, '');
    
    await updateDoc(doc(db, "clients", id), updateData);
      
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

// Restore Client (Protected)
app.post("/api/clients/:id/restore", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const clientData = req.body;
    await setDoc(doc(db, "clients", id), clientData);
    broadcastUpdate('UPDATE_CLIENTS');
    res.json({ success: true });
  } catch (error) {
    console.error("Error restoring client:", error);
    res.status(500).json({ error: "Falha ao restaurar cliente" });
  }
});

// Get Chat Messages
app.get("/api/chat/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const q = query(collection(db, "chats", clientId, "messages"), orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(messages);
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ error: "Falha ao buscar mensagens" });
  }
});

// Send Chat Message
app.post("/api/chat/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const { text, sender, clientName } = req.body; // sender: 'admin' | 'client'
    const message = {
      text,
      sender,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Add to subcollection
    const docRef = await addDoc(collection(db, "chats", clientId, "messages"), message);
    
    // Also update a summary document for the admin to see unread counts
    const chatDocRef = doc(db, "chats", clientId);
    const chatDoc = await getDoc(chatDocRef);
    
    const updateData: any = {
      lastMessage: text,
      lastMessageTimestamp: message.timestamp,
      lastSender: sender,
      unreadAdmin: sender === 'client' ? increment(1) : 0,
      unreadClient: sender === 'admin' ? increment(1) : 0,
    };
    
    if (clientName) {
      updateData.clientName = clientName;
    }

    await setDoc(chatDocRef, updateData, { merge: true });

    broadcastUpdate('CHAT_UPDATE', { clientId });
    res.json({ id: docRef.id, ...message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Falha ao enviar mensagem" });
  }
});

// Mark messages as read
app.put("/api/chat/:clientId/read", async (req, res) => {
  try {
    const { clientId } = req.params;
    const { reader } = req.body; // 'admin' | 'client'
    
    // Reset unread count
    const updateData = reader === 'admin' ? { unreadAdmin: 0 } : { unreadClient: 0 };
    await setDoc(doc(db, "chats", clientId), updateData, { merge: true });
    
    // Update individual messages
    const messagesRef = collection(db, "chats", clientId, "messages");
    const q = query(messagesRef, where("sender", "==", reader === 'admin' ? 'client' : 'admin'), where("read", "==", false));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    }
    
    broadcastUpdate('CHAT_READ', { clientId, reader });
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ error: "Falha ao atualizar status" });
  }
});

// Get all chats summary for admin
app.get("/api/chats", requireAdmin, async (req, res) => {
  try {
    const q = query(collection(db, "chats"), orderBy("lastMessageTimestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const chats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Falha ao buscar chats" });
  }
});

// Delete Chat Message
app.delete("/api/chat/:clientId/messages/:messageId", requireAdmin, async (req, res) => {
  try {
    const { clientId, messageId } = req.params;
    
    await deleteDoc(doc(db, "chats", clientId, "messages", messageId));
    
    broadcastUpdate('CHAT_UPDATE', { clientId });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Falha ao apagar mensagem" });
  }
});

// Delete Chat
app.delete("/api/chat/:clientId", requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Delete all messages in the subcollection
    const messagesRef = collection(db, "chats", clientId, "messages");
    const querySnapshot = await getDocs(messagesRef);
    
    if (!querySnapshot.empty) {
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    
    // Delete the chat summary document
    await deleteDoc(doc(db, "chats", clientId));
    
    broadcastUpdate('CHAT_UPDATE', { clientId });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ error: "Falha ao apagar conversa" });
  }
});

// Restore Chat
app.post("/api/chat/:clientId/restore", requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { chatData, messages } = req.body;
    
    if (chatData) {
      await setDoc(doc(db, "chats", clientId), chatData);
    }
    
    if (messages && messages.length > 0) {
      const batch = writeBatch(db);
      messages.forEach((msg: any) => {
        const msgRef = doc(db, "chats", clientId, "messages", msg.id);
        batch.set(msgRef, msg);
      });
      await batch.commit();
    }
    
    broadcastUpdate('CHAT_UPDATE', { clientId });
    res.json({ success: true });
  } catch (error) {
    console.error("Error restoring chat:", error);
    res.status(500).json({ error: "Falha ao restaurar conversa" });
  }
});

// Restore Message
app.post("/api/chat/:clientId/messages/:messageId/restore", requireAdmin, async (req, res) => {
  try {
    const { clientId, messageId } = req.params;
    const messageData = req.body;
    await setDoc(doc(db, "chats", clientId, "messages", messageId), messageData);
    
    const chatRef = doc(db, "chats", clientId);
    await setDoc(chatRef, {
      lastMessage: messageData.text,
      lastMessageTimestamp: messageData.timestamp,
      clientId: clientId
    }, { merge: true });

    broadcastUpdate('CHAT_UPDATE', { clientId });
    res.json({ success: true });
  } catch (error) {
    console.error("Error restoring message:", error);
    res.status(500).json({ error: "Falha ao restaurar mensagem" });
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
