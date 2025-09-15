import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function Tools() {
  const [prompt, setPrompt] = useState('Amazing product for summer');
  const [copy, setCopy] = useState('');
  const [img, setImg] = useState('');

  return (
    <main style={{ padding: 24 }}>
      <h1>AI Tools</h1>
      <div style={{ display: 'grid', gap: 8, maxWidth: 600 }}>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={async () => { const r = await apiFetch('/ai/generate-copy', { method: 'POST', body: JSON.stringify({ prompt }) }); setCopy(r.copy); }}>Generate Copy</button>
          <button onClick={async () => { const r = await apiFetch('/ai/generate-image', { method: 'POST', body: JSON.stringify({ prompt }) }); setImg(r.url); }}>Generate Image</button>
        </div>
        {copy && <pre style={{ background: '#f6f8fa', padding: 12 }}>{copy}</pre>}
        {img && <img src={img} alt="generated" style={{ maxWidth: '100%' }} />}
      </div>
    </main>
  );
}

