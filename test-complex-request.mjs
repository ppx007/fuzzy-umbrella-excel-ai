// Test complex attendance table request
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

const userPrompt = `创建一个个人员工考勤记录表，要求有日期，工时，出勤，备注这几个列，要求是11月得表格，内容：行内容为11月每天，我隔两天值班一次，也就是说1号值班那么三号值班，我现在是12.2号值班，反推我11月得值班，出勤是我值班必须出勤，同时周六周日如果不值班我就休息。 31行`;

console.log('=== Complex Attendance Table Test ===');
console.log('System prompt length:', SYSTEM_PROMPT.length, 'chars');
console.log('User prompt length:', userPrompt.length, 'chars');
console.log('');

const requestBody = JSON.stringify({
  model: '假流式/gemini-2.5-flash',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ],
  stream: false,
  temperature: 0.7,
  max_tokens: 8192,
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

console.log('Sending complex request via https://localhost:3000/api/v1/chat/completions');
console.log('This may take 30-60 seconds for AI to calculate...');
console.log('');

const startTime = Date.now();

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
    process.stdout.write('.');
  });
  res.on('end', () => {
    const elapsed = Date.now() - startTime;
    console.log('\n');
    console.log('=== Response ===');
    console.log('Status:', res.statusCode, res.statusMessage);
    console.log('Time:', elapsed, 'ms', '(' + (elapsed / 1000).toFixed(1) + ' seconds)');
    console.log('');
    try {
      const json = JSON.parse(data);
      if (json.choices?.[0]?.message?.content) {
        const content = json.choices[0].message.content;
        console.log('Response content length:', content.length, 'chars');
        console.log('');
        // 尝试解析 JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const tableData = JSON.parse(jsonMatch[0]);
          console.log('Table name:', tableData.tableName);
          console.log('Columns:', tableData.columns?.length);
          console.log('Rows:', tableData.rows?.length);
          if (tableData.rows?.length > 0) {
            console.log('First row:', JSON.stringify(tableData.rows[0]));
            console.log('Last row:', JSON.stringify(tableData.rows[tableData.rows.length - 1]));
          }
        }
      } else {
        console.log('Raw response:', JSON.stringify(json, null, 2).substring(0, 1000));
      }
    } catch (e) {
      console.log('Parse error:', e.message);
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', e => {
  const elapsed = Date.now() - startTime;
  console.log('\n');
  console.log('Error after', elapsed, 'ms:', e.message);
});

req.setTimeout(180000, () => {
  const elapsed = Date.now() - startTime;
  console.log('\n');
  console.log('Request timed out after', elapsed, 'ms');
  req.destroy();
});

req.write(requestBody);
req.end();
