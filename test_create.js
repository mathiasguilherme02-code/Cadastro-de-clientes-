fetch('http://localhost:3000/api/clients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nomeCompleto: 'Test User', cpf: '123.456.789-00', simulacoes: [{ valorSolicitado: 1000 }] })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
