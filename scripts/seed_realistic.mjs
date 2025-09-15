// More realistic seeding: multiple affiliates and offers over past 14 days
// Persists Offers and Affiliates via Catalog Service, then uses their UUIDs in clicks/conversions
// Usage: node scripts/seed_realistic.mjs (env: GATEWAY_URL)

const BASE = process.env.GATEWAY_URL || 'http://localhost:3000';

function randBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function req(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`${method} ${path} -> ${res.status} ${t}`); }
  return res.json();
}

async function createUser(email, role) {
  const r = await req('/auth/signup', { method: 'POST', body: { email, password: 'password', role } });
  return { id: r.user.id, email: r.user.email, token: r.token };
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

(async () => {
  console.log(`Seeding realistic dataset against ${BASE}`);
  // Create admin
  const admin = await createUser(`admin+${Date.now()}@demo.test`, 'admin');
  console.log('Admin:', admin.email);

  // Create affiliates (Auth users + Catalog records)
  const affiliates = [];
  const catalogAffiliates = [];
  for (let i = 1; i <= 5; i++) {
    const user = await createUser(`aff${i}+${Date.now()}@demo.test`, 'affiliate');
    affiliates.push(user);
    const cat = await req('/admin/catalog/affiliates', {
      method: 'POST', token: admin.token,
      body: { name: `Affiliate ${i}`, contact_email: user.email }
    });
    catalogAffiliates.push(cat);
    await sleep(150);
  }
  console.log(`Created ${affiliates.length} affiliates (auth) and catalog entries`);

  // Create offers in Catalog
  const offerDefs = [
    { name: 'US Nutra', advertiser: 'HealthCorp', payout: 25, postback_template: '' },
    { name: 'EU Gaming', advertiser: 'GameAds', payout: 3, postback_template: '' },
    { name: 'Global Sweeps', advertiser: 'Sweepy', payout: 1.2, postback_template: '' },
  ];
  const offers = [];
  for (const od of offerDefs) {
    const o = await req('/admin/catalog/offers', { method: 'POST', token: admin.token, body: od });
    offers.push({ id: o.id, payoutAvg: Number(o.payout) });
    await sleep(100);
  }
  console.log(`Created ${offers.length} offers in catalog`);

  // Generate events for last 14 days
  for (let day = 14; day >= 0; day--) {
    const dayTs = daysAgo(day);
    for (let ai = 0; ai < affiliates.length; ai++) {
      const affUser = affiliates[ai];
      const affCat = catalogAffiliates[ai];
      for (const offer of offers) {
        const clicks = randBetween(3, 12);
        const clickIds = [];
        for (let c = 0; c < clicks; c++) {
          // Distribute timestamps within the day by adjusting minutes
          const t = new Date(dayTs);
          t.setHours(randBetween(0, 23), randBetween(0, 59), randBetween(0, 59));
          const ts = t.toISOString();
          const click = await req('/clicks', {
            method: 'POST',
            token: affUser.token,
            body: { offerId: offer.id, affiliateId: affCat.id, sub1: `ad${c}`, sub2: 'grpA', ip: `1.2.3.${randBetween(2,200)}`, ua: 'seed-realistic', ts }
          });
          clickIds.push({ id: click.id, ts });
          await sleep(50);
        }
        // Convert some clicks (20-40%) with random payout near offer avg, plus rare fraud spikes
        const toConvert = Math.floor(clickIds.length * randBetween(20, 40) / 100);
        for (let k = 0; k < toConvert; k++) {
          const { id: clickId, ts } = clickIds[k];
          let payout = Math.max(0.5, Number((offer.payoutAvg * (0.8 + Math.random() * 0.6)).toFixed(2)));
          // ~1% fraud spike to trigger rejection
          if (Math.random() < 0.01) payout = 1500;
          await req('/conversions', { method: 'POST', token: admin.token, body: { clickId, payout, ts } });
          await sleep(50);
        }
      }
    }
    // Respect gateway rate limits
    await sleep(500);
  }

  console.log('Realistic seed completed');
})().catch((e) => { console.error(e); process.exit(1); });
