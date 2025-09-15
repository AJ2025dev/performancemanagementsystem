import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { Kafka } from 'kafkajs';
import Redis from 'ioredis';
import { pool, initSchema } from './db.js';

export const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = Number(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const kafka = new Kafka({ brokers: KAFKA_BROKERS });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'conversion-service' });
const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD });

// Fraud detection stub
function assessFraud({ payout }: { payout: number }) {
  if (payout > 1000) return { ok: false, reason: 'payout_threshold' };
  return { ok: true };
}

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Ingest conversion event (from advertiser postback or internal). Publishes to Kafka
app.post('/conversions', async (req, res) => {
  const { clickId, payout = 0, ts: tsOverride } = req.body as { clickId: string; payout?: number; ts?: string };
  if (!clickId) return res.status(400).json({ error: 'clickId required' });
  const event = { clickId, payout: Number(payout), ts: tsOverride || new Date().toISOString() };
  await producer.send({ topic: 'conversions', messages: [{ key: clickId, value: JSON.stringify(event) }] });
  res.status(202).json({ accepted: true });
});

// Consume clicks and conversions to match and persist
async function runConsumers() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'clicks', fromBeginning: false });
  await consumer.subscribe({ topic: 'conversions', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const payload = message.value?.toString();
      if (!payload) return;
      if (topic === 'clicks') {
        const click = JSON.parse(payload);
        // Optionally persist clicks for reporting
        try {
          await pool.query(
            'INSERT INTO clicks(id, offer_id, affiliate_id, sub1, sub2, ip, ua, ts) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING',
            [click.id, click.offerId, click.affiliateId, click.sub1, click.sub2, click.ip, click.ua, click.ts]
          );
        } catch (e) { console.error('Failed to persist click', e); }
      } else if (topic === 'conversions') {
        const conv = JSON.parse(payload);
        const { ok, reason } = assessFraud({ payout: conv.payout });
        let click: any = null;
        try {
          const cached = await redis.get(`click:${conv.clickId}`);
          if (cached) click = JSON.parse(cached);
        } catch {}
        // Fallback to DB
        if (!click) {
          const { rows } = await pool.query('SELECT * FROM clicks WHERE id=$1', [conv.clickId]);
          click = rows[0] || {};
        }
        const status = ok ? 'approved' : 'rejected';
        await pool.query(
          'INSERT INTO conversions(click_id, offer_id, affiliate_id, payout, status, reason, ts) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [conv.clickId, click.offer_id || click.offerId, click.affiliate_id || click.affiliateId, conv.payout, status, reason || null, conv.ts]
        );
      }
    }
  });
}

async function start() {
  await initSchema();
  await producer.connect();
  runConsumers().catch((e) => console.error('Consumer error', e));
  app.listen(PORT, () => console.log(`Conversion service listening on :${PORT}`));
}

if (process.env.NODE_ENV !== 'test') {
  start().catch((e) => { console.error('Conversion service failed to start', e); process.exit(1); });
}
