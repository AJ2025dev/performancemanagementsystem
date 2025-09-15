import request from 'supertest';
import { app } from '../src/index';

describe('Media-buy Service', () => {
  it('creates, updates and fetches stats', async () => {
    const created = await request(app)
      .post('/media/campaigns')
      .send({ platform: 'facebook', input: { name: 'Test', budget: 100, objective: 'conversions' } });
    expect(created.status).toBe(201);
    const id = created.body.id;

    const updated = await request(app)
      .put(`/media/campaigns/${id}`)
      .send({ platform: 'facebook', input: { status: 'paused' } });
    expect(updated.status).toBe(200);

    const stats = await request(app)
      .get('/media/stats')
      .query({ platform: 'facebook', from: '2024-01-01', to: '2024-12-31' });
    expect(stats.status).toBe(200);
    expect(stats.body).toHaveProperty('clicks');
  });
});

