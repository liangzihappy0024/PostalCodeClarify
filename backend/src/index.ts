import express from 'express';
import cors from 'cors';
import postalRoutes from './routes/postalRoutes';

const app = express();
const PORT = Number(process.env.PORT) || 3006;

app.use(cors({
  origin: true, // 允许所有来源访问
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/postal', postalRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`邮编清洗服务运行在 http://localhost:${PORT}`);
});
