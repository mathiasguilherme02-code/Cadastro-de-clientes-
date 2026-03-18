import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDlOItlVJP6hAD4yEKA8ZdDkI4FxV3oNlw",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "gmemprestimo-69965.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "gmemprestimo-69965",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "gmemprestimo-69965.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "200113810439",
  appId: process.env.FIREBASE_APP_ID || "1:200113810439:web:b1d8e121e7d206f4058d20"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkClient() {
  try {
    const cpfTarget = '09441846694';
    console.log(`Searching for CPF: ${cpfTarget}`);
    
    // Search by root cpf
    const qRoot = query(collection(db, 'clients'), where('cpf', '==', cpfTarget));
    const snapRoot = await getDocs(qRoot);
    console.log(`Found ${snapRoot.size} clients with root cpf == ${cpfTarget}`);
    
    snapRoot.forEach(doc => {
      console.log(`\n--- Root Match: ${doc.id} ---`);
      const data = doc.data();
      console.log(`Root nomeCompleto: ${data.nomeCompleto}`);
      console.log(`Root cpf: ${data.cpf}`);
      
      let parsed = data.dados;
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch(e) {}
      }
      console.log(`Dados:`, JSON.stringify(parsed, null, 2));
    });

    const docUndefined = await getDoc(doc(db, 'clients', 'undefined'));
    if (docUndefined.exists()) {
      console.log('Found document with ID "undefined"!');
    } else {
      console.log('No document with ID "undefined".');
    }
    const snapAll = await getDocs(collection(db, 'clients'));
    console.log(`\nChecking all ${snapAll.size} clients for nested CPF match...`);
    
    snapAll.forEach(doc => {
      const data = doc.data();
      let parsed = data.dados;
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch(e) {}
      }
      
      const nestedCpf = parsed?.cpf?.replace(/[^\d]+/g, '');
      const rootCpf = data.cpf;
      
      if (nestedCpf === cpfTarget || rootCpf === cpfTarget || data.nomeCompleto?.includes('Ricardo Fabrício')) {
        console.log(`\n--- Potential Match: ${doc.id} ---`);
        console.log(`Root nomeCompleto: ${data.nomeCompleto}`);
        console.log(`Root cpf: ${data.cpf}`);
        console.log(`Dados nomeCompleto: ${parsed?.nomeCompleto}`);
        console.log(`Dados cpf: ${parsed?.cpf}`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkClient();
