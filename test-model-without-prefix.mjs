/*
 * @Author: px007 q13547983465@163.com
 * @LastEditTime: 2026-01-03 17:54:15
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
// Test with model name without prefix
import https from 'https';

const apiKey = 'cat-b151fb90d3a9c752fd4b047744a9cf439ae7c32200cf5c16';

const SYSTEM_PROMPT = `你是Excel表格生成助手。根据用户描述生成JSON格式的表格数据。

列类型: text, number, date, currency, percentage, email, phone, boolean

输出JSON格式:
{"tableName":"表名","columns":[{"name":"列名","type":"类型"}],"rows":[{"列名":值}]}

规则:
1. 只输出纯JSON，不要任何解释
2. 使用中文列名和真实数据
3. 默认5行数据
4. 从{开始到}结束`;

console.log('=== Test WITHOUT model prefix ===');

const requestBody = JSON.stringify({
  model: 'gemini-2.5-flash', // 不带前缀
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: '创建一个员工信息表' },
  ],
  stream: false,
  temperature: 0.7,
});

console.log('Model: gemini-2.5-flash (no prefix)');
console.log('');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/chat/completions',
  method: 'POST',
  rejectUnauthorized: false,
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
    console.log('Status:', res.statusCode, res.statusMessage);
    console.log('Time:', elapsed, 'ms');
    console.log('');
    if (res.statusCode === 200) {
      console.log('SUCCESS! Model without prefix works.');
    } else {
      console.log('Response:', data.substring(0, 500));
    }
  });
});

req.on('error', e => {
  console.log('Error:', e.message);
});

req.setTimeout(60000, () => {
  console.log('Timeout after 60 seconds');
  req.destroy();
});

req.write(requestBody);
req.end();
