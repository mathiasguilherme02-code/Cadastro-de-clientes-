import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function createAndFormat() {
  const testId = "test-client-123";
  await setDoc(doc(db, "clients", testId), {
    id: testId,
    nomeCompleto: "Test Client",
    cpf: "11122233344",
    dados: {}
  });

  const res = await fetch(`http://localhost:3000/api/clients/${testId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer secret-admin-token-123' },
    body: JSON.stringify({
      id: testId,
      nomeCompleto: "Test Client Updated",
      cpf: "11122233344",
      dados: { simulacoes: [] }
    })
  });
  console.log("PUT status", res.status);
  console.log("PUT text", await res.text());
}
createAndFormat().catch(console.error).finally(() => process.exit(0));
