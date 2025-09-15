import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { facebookConnector } from './connectors/facebook.js';
import { googleConnector } from './connectors/google.js';
import { tiktokConnector } from './connectors/tiktok.js';
import { Connector } from './connectors/types.js';

export const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;

const connectors: Record<string, Connector> = {
  facebook: facebookConnector,
  google: googleConnector,
  tiktok: tiktokConnector,
};

function getConnector(platform?: string): Connector {
  if (!platform || !connectors[platform]) throw new Error('Unsupported platform');
  return connectors[platform];
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/media/campaigns', async (req, res) => {
  try {
    const { platform, input } = req.body;
    const id = await getConnector(platform).createCampaign(input);
    res.status(201).json(id);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/media/campaigns/:id', async (req, res) => {
  try {
    const { platform, input } = req.body;
    const id = await getConnector(platform).updateCampaign(req.params.id, input);
    res.json(id);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/media/stats', async (req, res) => {
  try {
    const { platform, from, to } = req.query as any;
    const stats = await getConnector(platform).fetchStats({ from, to });
    res.json(stats);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Media-buy service listening on :${PORT}`));
}
