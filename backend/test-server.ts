import express from 'express';

const app = express();
const PORT = 3007;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`测试服务运行在 http://localhost:${PORT}`);
});
