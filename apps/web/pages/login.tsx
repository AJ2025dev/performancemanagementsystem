import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function Login() {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const [message, setMessage] = useState('');

  async function submit(path: '/auth/login' | '/auth/signup') {
    try {
      const res = await apiFetch(path, { method: 'POST', body: JSON.stringify({ email, password }) });
      if (typeof window !== 'undefined') localStorage.setItem('token', res.token);
      setMessage('Authenticated');
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Login</h1>
      <div style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => submit('/auth/login')}>Login</button>
          <button onClick={() => submit('/auth/signup')}>Signup</button>
        </div>
        {message && <p>{message}</p>}
      </div>
    </main>
  );
}

