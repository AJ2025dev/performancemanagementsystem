import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '@/lib/api';

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [offerId, setOfferId] = useState('');
  const [affiliateId, setAffiliateId] = useState('');
  const [days, setDays] = useState(7);
  const router = useRouter();

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(Date.now() - days*24*60*60*1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [days]);

  async function load() {
    const args = [
      offerId ? `offerId: \"${offerId}\"` : '',
      affiliateId ? `affiliateId: \"${affiliateId}\"` : '',
      `from: \"${range.from}\"`,
      `to: \"${range.to}\"`
    ].filter(Boolean).join(', ');
    const query = `{ summary(${args}) { clicks conversions revenue epc } }`;
    try {
      const d = await apiFetch('/reporting/graphql', { method: 'POST', body: JSON.stringify({ query }) });
      setSummary(d.data?.summary || null);
    } catch {
      setSummary(null);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [offerId, affiliateId, range.from, range.to]);

  // Pre-fill filters from query params
  useEffect(() => {
    if (!router.isReady) return;
    const { offerId: qOffer, affiliateId: qAff, days: qDays } = router.query as Record<string, string>;
    if (qOffer) setOfferId(qOffer);
    if (qAff) setAffiliateId(qAff);
    if (qDays && !Number.isNaN(Number(qDays))) setDays(Number(qDays));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label>Days:
          <select value={days} onChange={(e)=>setDays(Number(e.target.value))}>
            <option value={1}>1</option>
            <option value={7}>7</option>
            <option value={14}>14</option>
            <option value={30}>30</option>
          </select>
        </label>
        <input placeholder="Filter by offerId (UUID)" value={offerId} onChange={(e)=>setOfferId(e.target.value)} style={{ width: 300 }} />
        <input placeholder="Filter by affiliateId (UUID)" value={affiliateId} onChange={(e)=>setAffiliateId(e.target.value)} style={{ width: 300 }} />
        <button onClick={load}>Refresh</button>
      </div>
      {!summary ? <p>Loading...</p> : (
        <ul>
          <li>Clicks: {summary.clicks}</li>
          <li>Conversions: {summary.conversions}</li>
          <li>Revenue: ${summary.revenue.toFixed(2)}</li>
          <li>EPC: ${summary.epc.toFixed(4)}</li>
        </ul>
      )}
    </main>
  );
}
