/*
 * @Author: px007 q13547983465@163.com
 * @LastEditTime: 2026-01-03 17:33:59
 * @LastEditors: px007
 * @ FilePath: Do not edit
 * sa~ka~na~
 */
// Test table generation request via proxy
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

console.log('=== Table Generation Test ===');
console.log('System prompt length:', SYSTEM_PROMPT.length, 'chars');
console.log('');

const requestBody = JSON.stringify({
  model: '假流式/gemini-2.5-flash',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: '创建一个员工信息表，包含姓名、部门、工资、入职日期' },
  ],
  stream: false,
  temperature: 0.7,
});

console.log('Request body length:', requestBody.length, 'chars');
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

console.log('Sending request via https://localhost:3000/api/v1/chat/completions');
console.log('Model: 假流式/gemini-2.5-flash');
console.log('');

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
      console.log('Response:', JSON.stringify(json, null, 2).substring(0, 1000));
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
