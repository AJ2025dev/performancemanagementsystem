import { useEffect, useState } from 'react';
import { apiFetch, getAuthToken } from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function Affiliates() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('Affiliate X');
  const [email, setEmail] = useState('aff@example.com');
  const [msg, setMsg] = useState('');
  const { push } = useToast();

  async function load() {
    const rows = await apiFetch('/catalog/affiliates');
    setItems(rows);
  }

  async function create() {
    try {
      await apiFetch('/admin/catalog/affiliates', { method: 'POST', body: JSON.stringify({ name, contact_email: email }) });
      setMsg('Affiliate created'); push('Affiliate created','success');
      load();
    } catch (e: any) { setMsg(e.message); push('Failed to create affiliate','error'); }
  }

  useEffect(() => { load().catch(() => setItems([])); }, []);
  const authed = !!getAuthToken();

  return (
    <main style={{ padding: 24 }}>
      <h1>Affiliates</h1>
      {!items.length ? <p>No affiliates</p> : (
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Created</th><th>Summary</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(a => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.contact_email}</td>
                <td>{new Date(a.created_at).toLocaleString()}</td>
                <td><a href={`/dashboard?affiliateId=${a.id}&days=14`}>View summary</a></td>
                <td><button onClick={async ()=>{ try { await apiFetch(`/admin/catalog/affiliates/${a.id}`, { method: 'DELETE' }); push('Affiliate deleted','success'); } catch { push('Failed to delete affiliate','error'); } load(); }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h2>Create Affiliate</h2>
      {!authed ? <p>Login required</p> : (
        <div style={{ display:'grid', gap: 8, maxWidth: 480 }}>
          <input placeholder="name" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="contact email" value={email} onChange={e=>setEmail(e.target.value)} />
          <button onClick={create}>Create</button>
          {msg && <p>{msg}</p>}
        </div>
      )}
    </main>
  );
}
