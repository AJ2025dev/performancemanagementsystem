import 'dotenv/config';
import express, { Application } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { gql } from 'apollo-server-express';
import { Pool } from 'pg';

export const app: Application = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'affnet',
  user: process.env.POSTGRES_USER || 'affnet',
  password: process.env.POSTGRES_PASSWORD || 'affnetpass',
});

const typeDefs = gql`
  scalar Date
  type Summary { clicks: Int!, conversions: Int!, revenue: Float!, epc: Float! }
  type Query {
    summary(offerId: String, affiliateId: String, from: String!, to: String!): Summary!
  }
`;

const resolvers = {
  Query: {
    summary: async (_: any, args: { offerId?: string; affiliateId?: string; from: string; to: string }) => {
      const { offerId, affiliateId, from, to } = args;
      const conds: string[] = [];
      const params: any[] = [];
      if (offerId) { params.push(offerId); conds.push(`offer_id = $${params.length}`); }
      if (affiliateId) { params.push(affiliateId); conds.push(`affiliate_id = $${params.length}`); }
      params.push(from); conds.push(`ts >= $${params.length}`);
      params.push(to); conds.push(`ts <= $${params.length}`);
      const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
      const clicksSql = `SELECT COUNT(*)::int AS c FROM clicks ${where}`;
      const convSql = `SELECT COUNT(*)::int AS c, COALESCE(SUM(payout),0)::float AS sum FROM conversions ${where}`;
      const [cl, cv] = await Promise.all([
        pool.query(clicksSql, params),
        pool.query(convSql, params),
      ]);
      const clicks = cl.rows[0]?.c || 0;
      const conversions = cv.rows[0]?.c || 0;
      const revenue = cv.rows[0]?.sum || 0;
      const epc = clicks ? revenue / clicks : 0;
      return { clicks, conversions, revenue, epc };
    },
  },
};

async function start() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  // Cast to any to avoid type version mismatch between apollo-server-express and express types
  server.applyMiddleware({ app: app as any, path: '/graphql' });
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.listen(PORT, () => console.log(`Reporting service listening on :${PORT}`));
}

if (process.env.NODE_ENV !== 'test') {
  start().catch((e) => { console.error('Reporting service failed to start', e); process.exit(1); });
}
