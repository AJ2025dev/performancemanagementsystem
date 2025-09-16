import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { pool, initSchema } from './db.js';
import { z } from 'zod';

export const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Public read (via gateway auth + RBAC): /catalog/*
app.get('/catalog/offers', async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const { rows } = await pool.query(
    'SELECT id, name, advertiser, payout, postback_template, created_at FROM offers ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  res.json(rows);
});

app.get('/catalog/affiliates', async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const { rows } = await pool.query(
    'SELECT id, name, contact_email, created_at FROM affiliates ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  res.json(rows);
});

// Admin write (proxied under /admin/catalog/* by gateway)
app.post('/admin/catalog/offers', async (req, res) => {
  const body = z.object({ name: z.string().min(2), advertiser: z.string().optional(), payout: z.number().nonnegative().optional(), postback_template: z.string().optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid body', details: body.error.flatten() });
  const { name, advertiser, payout = 0, postback_template } = body.data as any;
  const { rows } = await pool.query(
    'INSERT INTO offers(name, advertiser, payout, postback_template) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, advertiser || null, Number(payout), postback_template || null]
  );
  res.status(201).json(rows[0]);
});

app.put('/admin/catalog/offers/:id', async (req, res) => {
  const { id } = req.params;
  const body = z.object({ name: z.string().min(2).optional(), advertiser: z.string().optional(), payout: z.number().nonnegative().optional(), postback_template: z.string().optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid body', details: body.error.flatten() });
  const { name, advertiser, payout, postback_template } = body.data as any;
  const { rows } = await pool.query(
    'UPDATE offers SET name=COALESCE($2,name), advertiser=COALESCE($3,advertiser), payout=COALESCE($4,payout), postback_template=COALESCE($5,postback_template) WHERE id=$1 RETURNING *',
    [id, name || null, advertiser || null, payout == null ? null : Number(payout), postback_template || null]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

app.delete('/admin/catalog/offers/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM offers WHERE id=$1', [id]);
  res.status(204).end();
});

app.post('/admin/catalog/affiliates', async (req, res) => {
  const body = z.object({ name: z.string().min(2), contact_email: z.string().email().optional(), manager_id: z.string().uuid().optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid body', details: body.error.flatten() });
  const { name, contact_email, manager_id } = body.data as any;
  const { rows } = await pool.query(
    'INSERT INTO affiliates(name, contact_email, manager_id) VALUES ($1,$2,$3) RETURNING *',
    [name, contact_email || null, manager_id || null]
  );
  res.status(201).json(rows[0]);
});

app.put('/admin/catalog/affiliates/:id', async (req, res) => {
  const { id } = req.params;
  const body = z.object({ name: z.string().min(2).optional(), contact_email: z.string().email().optional(), manager_id: z.string().uuid().optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid body', details: body.error.flatten() });
  const { name, contact_email, manager_id } = body.data as any;
  const { rows } = await pool.query(
    'UPDATE affiliates SET name=COALESCE($2,name), contact_email=COALESCE($3,contact_email), manager_id=COALESCE($4,manager_id) WHERE id=$1 RETURNING *',
    [id, name || null, contact_email || null, manager_id || null]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

app.delete('/admin/catalog/affiliates/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM affiliates WHERE id=$1', [id]);
  res.status(204).end();
});

if (process.env.NODE_ENV !== 'test') {
  initSchema()
    .then(() => app.listen(PORT, () => console.log(`Catalog service listening on :${PORT}`)))
    .catch((e) => { console.error('Failed to init schema', e); process.exit(1); });
}
