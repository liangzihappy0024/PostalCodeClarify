import express from 'express';
import cors from 'cors';
import postalRoutes from './routes/postalRoutes';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3006;

app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/postal', postalRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`邮编清洗服务运行在 http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('服务器启动失败:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise rejection:', reason);
  process.exit(1);
});