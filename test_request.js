import http from 'http';
http.get('http://localhost:3000/', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { console.log("DATA HTML:", data.substring(0, 200)); });
}).on("error", (err) => { console.log("Error: " + err.message); });
http.get('http://localhost:3000/api/clients', { headers: { authorization: 'Bearer secret-admin-token-123'} }, (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { console.log("DATA API:", data.substring(0, 200)); });
}).on("error", (err) => { console.log("Error: " + err.message); });
