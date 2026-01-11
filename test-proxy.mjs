/*
 * @Author: px007 q13547983465@163.com
 * @LastEditTime: 2026-01-03 17:29:59
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
// Test via local Vite proxy
import http from 'http';

const apiKey = 'cat-b151fb90d3a9c752fd4b047744a9cf439ae7c32200cf5c16';

console.log('=== Proxy Test ===');
console.log('Testing via localhost:3080/api/v1');
console.log('');

const requestBody = JSON.stringify({
  model: 'gemini-2.5-flash',
  messages: [{ role: 'user', content: 'Say hello' }],
  stream: false,
});

console.log('Request body:', requestBody);
console.log('');

const options = {
  hostname: 'localhost',
  port: 3080,
  path: '/api/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'Content-Length': Buffer.byteLength(requestBody),
  },
};

console.log('Request URL: http://localhost:3080/api/v1/chat/completions');
console.log('Sending request...');
console.log('');

const startTime = Date.now();

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    const elapsed = Date.now() - startTime;
    console.log('=== Response ===');
    console.log('Status:', res.statusCode, res.statusMessage);
    console.log('Time:', elapsed, 'ms');
    console.log('');
    try {
      const json = JSON.parse(data);
      console.log('Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', e => {
  console.log('Error:', e.message);
});

req.setTimeout(120000, () => {
  console.log('Request timed out after 120 seconds');
  req.destroy();
});

req.write(requestBody);
req.end();
