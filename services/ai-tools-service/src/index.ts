import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

export const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;

app.get('/health', (_req, res) => res.json({ ok: true }));

// Generate ad copy stub (optionally uses OPENAI_API_KEY if present - network disabled here)
app.post('/ai/generate-copy', async (req, res) => {
  const { prompt } = req.body as { prompt: string };
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const copy = `Promo: ${prompt} — Limited time offer!`;
  res.json({ copy, provider: process.env.OPENAI_API_KEY ? 'openai' : 'stub' });
});

// Generate image stub
app.post('/ai/generate-image', async (req, res) => {
  const { prompt } = req.body as { prompt: string };
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const url = 'https://placehold.co/600x400?text=Generated+Image';
  res.json({ url, provider: process.env.STABILITY_API_KEY ? 'stability' : 'stub' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`AI Tools service listening on :${PORT}`));
}
