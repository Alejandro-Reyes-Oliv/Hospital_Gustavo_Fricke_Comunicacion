import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import webhook from './routes/webhook.js';

const app = express();

/**
 * 
 * bBuffer original en req.rawBody + parse JSON.
 */
app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buf) => { req.rawBody = buf; }
}));

app.use(morgan('dev'));

// health simple
app.get('/health', (_req, res) => res.json({ ok: true, service: 'bot-gateway', ts: new Date().toISOString() }));

// webhook
app.use(webhook);

// 404
app.use((req, res) => res.status(404).json({ error: 'not_found' }));

const port = process.env.PORT || 8081;
app.listen(port, () => {
  console.log(`bot-gateway listening on :${port}`);
});
