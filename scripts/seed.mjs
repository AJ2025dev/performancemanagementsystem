// Simple seeding script to create demo users, clicks, and conversions via the API Gateway
// Usage: node scripts/seed.mjs (env: GATEWAY_URL, default http://localhost:3000)

const BASE = process.env.GATEWAY_URL || 'http://localhost:3000';

async function req(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`${method} ${path} -> ${res.status} ${txt}`);
  }
  return res.json();
}

async function waitHealthy() {
  const start = Date.now();
  while (Date.now() - start < 60_000) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Gateway not healthy');
}

(async () => {
  console.log(`Seeding against: ${BASE}`);
  await waitHealthy();

  // Create users
  const adminEmail = `admin+${Date.now()}@demo.test`;
  const affEmail = `aff+${Date.now()}@demo.test`;
  const admin = await req('/auth/signup', { method: 'POST', body: { email: adminEmail, password: 'password', role: 'admin' } });
  const affiliate = await req('/auth/signup', { method: 'POST', body: { email: affEmail, password: 'password', role: 'affiliate' } });
  const adminToken = admin.token;
  const affToken = affiliate.token;
  console.log(`Created admin: ${admin.user.email}`);
  console.log(`Created affiliate: ${affiliate.user.email}`);

  // Create clicks
  const clickIds = [];
  for (let i = 0; i < 5; i++) {
    const c = await req('/clicks', {
      method: 'POST',
      token: affToken,
      body: {
        offerId: 'offer-1', affiliateId: 'aff-1', sub1: `s${i}`, sub2: 'demo', ip: '1.2.3.4', ua: 'seed-script'
      }
    });
    clickIds.push(c.id);
  }
  console.log(`Created clicks: ${clickIds.join(', ')}`);

  // Create conversions for first 3 clicks
  for (let i = 0; i < 3; i++) {
    await req('/conversions', { method: 'POST', token: adminToken, body: { clickId: clickIds[i], payout: 9.99 + i } });
  }
  console.log('Created conversions for first 3 clicks');

  console.log('Seed completed');
})().catch((e) => { console.error(e); process.exit(1); });

