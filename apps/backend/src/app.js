import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './config/logger.js';
import router from './routes/index.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Logging sencillo de cada request
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'incoming request');
  next();
});

app.use('/api', router);

// Health
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'backend-hgf' });
});

export default app;
