/*
 * @Author: px007 q13547983465@163.com
 * @LastEditTime: 2026-01-03 17:21:59
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
// API Test Script
// Run with: node test-api.mjs

import fs from 'fs';
import https from 'https';

// Read .env file
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const apiKey = env.VITE_OPENAI_API_KEY || '';
const baseUrl = env.VITE_OPENAI_API_BASE || 'https://cat.beijixingxing.com/v1';
const model = env.VITE_OPENAI_MODEL || 'gemini-2.5-flash';

console.log('=== ENV Parsed ===');
console.log('Parsed keys:', Object.keys(env));
console.log('');

console.log('=== API Test ===');
console.log('Base URL:', baseUrl);
console.log('Model:', model);
console.log('API Key length:', apiKey ? apiKey.length : 0);
console.log('API Key (first 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : '(empty)');
console.log('');

const requestBody = JSON.stringify({
  model: model,
  messages: [
    {
      role: 'user',
      content: 'Say hello in one word',
    },
  ],
  stream: false,
});

console.log('Request body:', requestBody);
console.log('Request size:', requestBody.length, 'bytes');
console.log('');

const url = new URL(baseUrl + '/chat/completions');
console.log('Request URL:', url.href);
console.log('');
console.log('Sending request...');

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
    console.log('');
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
  const elapsed = Date.now() - startTime;
  console.log('');
  console.log('=== Error ===');
  console.log('Time:', elapsed, 'ms');
  console.log('Error:', e.message);
});

req.setTimeout(120000, () => {
  console.log('Request timed out after 120 seconds');
  req.destroy();
});

req.write(requestBody);
req.end();
