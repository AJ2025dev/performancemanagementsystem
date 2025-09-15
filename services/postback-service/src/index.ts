import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { Kafka } from 'kafkajs';
import axios from 'axios';

export const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const DEFAULT_POSTBACK_URL = process.env.DEFAULT_POSTBACK_URL || '';

const kafka = new Kafka({ brokers: KAFKA_BROKERS });
const consumer = kafka.consumer({ groupId: 'postback-service' });

// In-memory mapping of offer -> endpoint template
// Example template: https://adv.example/track?cid={{click_id}}&payout={{payout}}
const mappings = new Map<string, string>();

// Admin endpoints
app.post('/postbacks/mappings', (req, res) => {
  const { offerId, template } = req.body as { offerId: string; template: string };
  if (!offerId || !template) return res.status(400).json({ error: 'offerId and template required' });
  mappings.set(offerId, template);
  res.status(201).json({ offerId });
});

// Manual trigger
app.post('/postbacks/trigger', async (req, res) => {
  const { url, payload } = req.body as { url: string; payload?: any };
  if (!url) return res.status(400).json({ error: 'url required' });
  await dispatch(url, payload || {});
  res.json({ ok: true });
});

function applyTemplate(template: string, ctx: Record<string, any>) {
  return template.replace(/\{\{(.*?)\}\}/g, (_m, k) => encodeURIComponent(ctx[k.trim()] ?? ''));
}

async function dispatch(url: string, payload: any, attempt = 1): Promise<void> {
  try {
    await axios.post(url, payload, { timeout: 5000 });
  } catch (e) {
    if (attempt >= 5) { console.error('Postback failed after retries', url); return; }
    const backoff = Math.min(30_000, 1000 * 2 ** attempt);
    setTimeout(() => dispatch(url, payload, attempt + 1).catch(() => {}), backoff);
  }
}

export async function runConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'conversions', fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const payload = message.value?.toString();
      if (!payload) return;
      const conv = JSON.parse(payload);
      const template = mappings.get(conv.offerId) || DEFAULT_POSTBACK_URL;
      if (!template) return;
      const url = applyTemplate(template, {
        click_id: conv.clickId,
        payout: conv.payout,
        offer_id: conv.offerId,
        affiliate_id: conv.affiliateId,
        ts: conv.ts,
      });
      dispatch(url, {}).catch(() => {});
    }
  });
}

export function applyTemplatePublic(template: string, ctx: Record<string, any>) {
  return applyTemplate(template, ctx);
}

app.get('/health', (_req, res) => res.json({ ok: true }));

if (process.env.NODE_ENV !== 'test') {
  runConsumer().catch((e) => console.error('Consumer error', e));
  app.listen(PORT, () => console.log(`Postback service listening on :${PORT}`));
}
