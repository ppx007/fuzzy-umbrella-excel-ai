/*
 * @Author: px007 q13547983465@163.com
 * @LastEditTime: 2026-01-03 17:26:42
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
// Simple API Test
import https from 'https';

// Hard-code the values from .env
const apiKey = 'cat-b151fb90d3a9c752fd4b047744a9cf439ae7c32200cf5c16';
const baseUrl = 'https://cat.beijixingxing.com/v1';
const model = 'gemini-2.5-flash';

console.log('=== API Test ===');
console.log('Base URL:', baseUrl);
console.log('Model:', model);
console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
console.log('');

const requestBody = JSON.stringify({
  model: model,
  messages: [{ role: 'user', content: 'Say hello' }],
  stream: false,
});

console.log('Request body:', requestBody);
console.log('');

const url = new URL(baseUrl + '/chat/completions');
console.log('Request URL:', url.href);
console.log('Sending request...');
console.log('');

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'Content-Length': Buffer.byteLength(requestBody),
  },
};

const startTime = Date.now();

const req = https.request(options, res => {
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
      console.log('Raw response:', data);
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
