import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { Kafka } from 'kafkajs';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

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
const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD });

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Record a click
app.post('/clicks', async (req, res) => {
  const { offerId, affiliateId, sub1, sub2, ip, ua, ts: tsOverride } = req.body as any;
  const id = uuidv4();
  const ts = tsOverride || new Date().toISOString();
  const click = { id, offerId, affiliateId, sub1, sub2, ip, ua, ts };
  try {
    // Cache in Redis (TTL 24h)
    await redis.set(`click:${id}`, JSON.stringify(click), 'EX', 60 * 60 * 24);
    // Publish to Kafka
    await producer.send({ topic: 'clicks', messages: [{ key: id, value: JSON.stringify(click) }] });
    res.status(201).json({ id, ts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to record click' });
  }
});

async function start() {
  await producer.connect();
  app.listen(PORT, () => console.log(`Click service listening on :${PORT}`));
}

if (process.env.NODE_ENV !== 'test') {
  start().catch((e) => { console.error('Click service failed to start', e); process.exit(1); });
}
