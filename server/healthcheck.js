const https = require('https');

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/',
  method: 'GET',
  rejectUnauthorized: false
};

const req = https.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.end();
