import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function Media() {
  const [platform, setPlatform] = useState('facebook');
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const s = await apiFetch(`/media/stats?platform=${platform}&from=2024-01-01&to=2024-12-31`);
      setStats(s);
    } catch (e: any) { setError(e.message); }
  }

  useEffect(() => { load(); }, [platform]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Media Stats</h1>
      <label>
        Platform:
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="facebook">Facebook</option>
          <option value="google">Google</option>
          <option value="tiktok">TikTok</option>
        </select>
      </label>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!stats ? <p>Loading...</p> : (
        <ul>
          <li>Impressions: {stats.impressions}</li>
          <li>Clicks: {stats.clicks}</li>
          <li>Conversions: {stats.conversions}</li>
          <li>Spend: ${stats.spend}</li>
        </ul>
      )}
    </main>
  );
}

