export function getApiBase() {
  return process.env.NEXT_PUBLIC_GATEWAY_URL || '';
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const headers = new Headers(opts.headers as any);
  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  const res = await fetch(`${getApiBase()}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

