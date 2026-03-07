async function test() {
  const res = await fetch('http://localhost:3000/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: "1234567890",
      nomeCompleto: "Test User",
      cpf: "12345678901",
      dataCadastro: "01/01/2023"
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
