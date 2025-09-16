import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool, initSchema } from './db.js';
import { z } from 'zod';

export const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

type Role = 'admin' | 'manager' | 'affiliate';

function signJwt(sub: string, role: Role) {
  return jwt.sign({ role }, JWT_SECRET, { subject: sub, expiresIn: '7d' });
}

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Signup (admin creates or public? allow both, default affiliate)
app.post('/auth/signup', async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(6), role: z.enum(['admin','manager','affiliate']).optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid body', details: body.error.flatten() });
  const { email, password, role } = body.data;
  const r: Role = (role as Role) ?? 'affiliate';
  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await pool.query(
      'INSERT INTO users(email, password_hash, role) VALUES ($1,$2,$3) RETURNING id, email, role, created_at',
      [email, hash, r]
    );
    const user = rows[0];
    const token = signJwt(user.id, user.role);
    res.status(201).json({ user, token });
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ error: 'email exists' });
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(6) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid body', details: body.error.flatten() });
  const { email, password } = body.data;
  const { rows } = await pool.query('SELECT id, email, password_hash, role FROM users WHERE email=$1', [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = signJwt(user.id, user.role);
  res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
});

// Middleware
declare global {
  namespace Express { interface Request { user?: { id: string; role: Role } } }
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(roles: Role[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// Users CRUD (admin only for listing and creating with role)
app.get('/users', requireAuth, requireRole(['admin']), async (_req, res) => {
  const { rows } = await pool.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC');
  res.json(rows);
});

app.post('/users', requireAuth, requireRole(['admin']), async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(6), role: z.enum(['admin','manager','affiliate']) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid body', details: body.error.flatten() });
  const { email, password, role } = body.data;
  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await pool.query(
      'INSERT INTO users(email, password_hash, role) VALUES ($1,$2,$3) RETURNING id, email, role, created_at',
      [email, hash, role]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ error: 'email exists' });
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id, email, role, created_at FROM users WHERE id=$1', [req.user!.id]);
  res.json(rows[0]);
});

if (process.env.NODE_ENV !== 'test') {
  initSchema()
    .then(() => app.listen(PORT, () => console.log(`Auth service listening on :${PORT}`)))
    .catch((e) => { console.error('Failed to init schema', e); process.exit(1); });
}
app.put('/users/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const body = z.object({ role: z.enum(['admin','manager','affiliate']).optional(), password: z.string().min(6).optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid body', details: body.error.flatten() });
  const { role, password } = body.data;
  const { id } = req.params as any;
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password_hash=$2 WHERE id=$1', [id, hash]);
    }
    if (role) {
      await pool.query('UPDATE users SET role=$2 WHERE id=$1', [id, role]);
    }
    const { rows } = await pool.query('SELECT id, email, role, created_at FROM users WHERE id=$1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'server error' }); }
});

app.delete('/users/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  const { id } = req.params as any;
  await pool.query('DELETE FROM users WHERE id=$1', [id]);
  res.status(204).end();
});
