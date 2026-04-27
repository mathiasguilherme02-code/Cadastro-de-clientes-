import fs from 'fs';
fetch('http://localhost:3000/api/clients', { headers: { 'Authorization': 'Bearer secret-admin-token-123' } })
  .then(res => res.json())
  .then(clients => {
    if (!clients || !clients.length) return console.log("No clients");
    const client = clients[0];
    console.log("Client ID", client.id);
    const updatedClient = { ...client };
    fetch(`http://localhost:3000/api/clients/${client.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer secret-admin-token-123' },
      body: JSON.stringify(updatedClient)
    }).then(res => res.text().then(text => console.log(res.status, text)));
  });
