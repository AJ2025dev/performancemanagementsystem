import request from 'supertest';
import { app } from '../src/index';

describe('AI Tools Service', () => {
  it('POST /ai/generate-copy returns copy', async () => {
    const res = await request(app).post('/ai/generate-copy').send({ prompt: 'Summer Sale' });
    expect(res.status).toBe(200);
    expect(res.body.copy).toContain('Summer Sale');
  });

  it('POST /ai/generate-image returns url', async () => {
    const res = await request(app).post('/ai/generate-image').send({ prompt: 'Blue Ad' });
    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/^https?:\/\//);
  });
});

