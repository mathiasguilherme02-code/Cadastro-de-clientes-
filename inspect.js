import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDlOItlVJP6hAD4yEKA8ZdDkI4FxV3oNlw",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "gmemprestimo-69965.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "gmemprestimo-69965",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "gmemprestimo-69965.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "200113810439",
  appId: process.env.FIREBASE_APP_ID || "1:200113810439:web:b8f49db6b8ac01975d4ea2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, "clients"), where("cpf", "==", "09441846694"));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    console.log("Client not found by CPF.");
    // Try to find by name
    const q2 = query(collection(db, "clients"));
    const snap2 = await getDocs(q2);
    snap2.forEach(doc => {
      const d = doc.data();
      if (d.nomeCompleto && d.nomeCompleto.includes("Ricardo")) {
        console.log("Found by name:", doc.id, d.cpf, d.nomeCompleto);
      }
    });
  } else {
    snapshot.forEach(doc => {
      console.log("ID:", doc.id);
      const data = doc.data();
      console.log("Root Data keys:", Object.keys(data));
      console.log("Root CPF:", data.cpf);
      console.log("Root Nome:", data.nomeCompleto);
      try {
         const parsed = typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados;
         console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
         console.log("Error parsing dados:", e.message);
      }
    });
  }
  process.exit(0);
}
run();
