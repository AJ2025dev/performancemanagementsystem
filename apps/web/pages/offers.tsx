import { useEffect, useState } from 'react';
import { apiFetch, getAuthToken } from '@/lib/api';

export default function Offers() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('New Offer');
  const [advertiser, setAdvertiser] = useState('Demo Adv');
  const [payout, setPayout] = useState(10);
  const [postback, setPostback] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    const rows = await apiFetch('/catalog/offers');
    setItems(rows);
  }

  async function create() {
    try {
      await apiFetch('/admin/catalog/offers', { method: 'POST', body: JSON.stringify({ name, advertiser, payout, postback_template: postback }) });
      setMsg('Offer created');
      load();
    } catch (e: any) { setMsg(e.message); }
  }

  useEffect(() => { load().catch(() => setItems([])); }, []);

  const authed = !!getAuthToken();

  return (
    <main style={{ padding: 24 }}>
      <h1>Offers</h1>
      {!items.length ? <p>No offers</p> : (
        <table>
          <thead><tr><th>Name</th><th>Advertiser</th><th>Payout</th><th>Created</th><th>Summary</th></tr></thead>
          <tbody>
            {items.map(o => (
              <tr key={o.id}>
                <td>{o.name}</td>
                <td>{o.advertiser}</td>
                <td>${o.payout}</td>
                <td>{new Date(o.created_at).toLocaleString()}</td>
                <td><a href={`/dashboard?offerId=${o.id}&days=14`}>View summary</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h2>Create Offer</h2>
      {!authed ? <p>Login required</p> : (
        <div style={{ display:'grid', gap: 8, maxWidth: 480 }}>
          <input placeholder="name" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="advertiser" value={advertiser} onChange={e=>setAdvertiser(e.target.value)} />
          <input type="number" step="0.01" placeholder="payout" value={payout} onChange={e=>setPayout(Number(e.target.value))} />
          <input placeholder="postback template" value={postback} onChange={e=>setPostback(e.target.value)} />
          <button onClick={create}>Create</button>
          {msg && <p>{msg}</p>}
        </div>
      )}
    </main>
  );
}
