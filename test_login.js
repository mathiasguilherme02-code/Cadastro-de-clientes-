import http from 'http';

const data = JSON.stringify({ cpf: "12345678901" });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/clients/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let d = '';
  res.on('data', chunk => d += chunk);
  res.on('end', () => console.log('Response:', d));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
