import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function Track() {
  const [clickId, setClickId] = useState('');
  const [payout, setPayout] = useState(10);
  const [message, setMessage] = useState('');

  async function createClick() {
    try {
      const res = await apiFetch('/clicks', { method: 'POST', body: JSON.stringify({ offerId: 'offer-1', affiliateId: 'aff-1', ip: '1.2.3.4', ua: 'web' }) });
      setClickId(res.id);
      setMessage('Click recorded');
    } catch (e: any) { setMessage(e.message); }
  }

  async function createConversion() {
    if (!clickId) return setMessage('Click ID required');
    try {
      await apiFetch('/conversions', { method: 'POST', body: JSON.stringify({ clickId, payout }) });
      setMessage('Conversion queued');
    } catch (e: any) { setMessage(e.message); }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Track Demo</h1>
      <div style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
        <button onClick={createClick}>Record Click</button>
        <input placeholder="Click ID" value={clickId} onChange={(e) => setClickId(e.target.value)} />
        <input type="number" placeholder="Payout" value={payout} onChange={(e) => setPayout(Number(e.target.value))} />
        <button onClick={createConversion}>Record Conversion</button>
        {message && <p>{message}</p>}
      </div>
    </main>
  );
}

