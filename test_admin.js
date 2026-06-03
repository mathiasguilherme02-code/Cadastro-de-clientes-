import http from 'http';

const data = JSON.stringify({ password: "Gustavo@01" });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let d = '';
  res.on('data', chunk => d += chunk);
  res.on('end', () => console.log('Response admin login:', d));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
