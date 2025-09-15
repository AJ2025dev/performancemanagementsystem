import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';

export const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Rate limit global
const limiter = rateLimit({ windowMs: 60_000, max: 120 });
app.use(limiter);

// Simple JWT auth middleware
type Role = 'admin' | 'manager' | 'affiliate';

declare global {
  namespace Express {
    interface Request { user?: { id: string; role: Role } }
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Proxy helper
function proxy(path: string, target: string, auth = true, roles?: Role[]) {
  const middlewares: any[] = [];
  if (auth) middlewares.push(requireAuth);
  if (roles && roles.length) middlewares.push(requireRole(roles));
  middlewares.push(
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (p) => p.replace(new RegExp(`^${path}`), ''),
    })
  );
  app.use(path, ...middlewares);
}

// Targets from env
const AUTH = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const CLICK = process.env.CLICK_SERVICE_URL || 'http://localhost:3002';
const CONVERSION = process.env.CONVERSION_SERVICE_URL || 'http://localhost:3003';
const POSTBACK = process.env.POSTBACK_SERVICE_URL || 'http://localhost:3004';
const MEDIA = process.env.MEDIA_BUY_SERVICE_URL || 'http://localhost:3005';
const AI = process.env.AI_TOOLS_SERVICE_URL || 'http://localhost:3006';
const REPORTING = process.env.REPORTING_SERVICE_URL || 'http://localhost:3007';
const CATALOG = process.env.CATALOG_SERVICE_URL || 'http://localhost:3008';

// Public routes (login, signup) to auth service
proxy('/auth', AUTH, false);

// Protected proxies
proxy('/clicks', CLICK, true, ['admin', 'manager', 'affiliate']);
proxy('/conversions', CONVERSION, true, ['admin', 'manager']);
proxy('/postbacks', POSTBACK, true, ['admin', 'manager']);
proxy('/media', MEDIA, true, ['admin', 'manager']);
proxy('/ai', AI, true, ['admin', 'manager']);
proxy('/reporting', REPORTING, true, ['admin', 'manager', 'affiliate']);
// Catalog: read-only under /catalog for all roles; write under /admin/catalog
proxy('/catalog', CATALOG, true, ['admin', 'manager', 'affiliate']);
proxy('/admin/catalog', CATALOG, true, ['admin', 'manager']);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API Gateway listening on :${PORT}`);
  });
}
