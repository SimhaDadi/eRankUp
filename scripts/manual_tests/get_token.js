
const http = require('http');

const data = JSON.stringify({
    email: 'admin@erankup.com',
    password: 'adminpassword'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log(body);
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.write(data);
req.end();
