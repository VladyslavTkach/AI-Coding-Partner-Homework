const request = require('supertest');
const app = require('../server');

describe('GET /api/users/:id — getUserById', () => {
  test('TC-01: valid ID 123 returns 200 and Alice Smith', async () => {
    const res = await request(app).get('/api/users/123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 123, name: 'Alice Smith', email: 'alice@example.com' });
  });

  test('TC-02: valid ID 456 returns 200 and Bob Johnson', async () => {
    const res = await request(app).get('/api/users/456');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 456, name: 'Bob Johnson', email: 'bob@example.com' });
  });

  test('TC-03: valid ID 789 returns 200 and Charlie Brown', async () => {
    const res = await request(app).get('/api/users/789');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 789, name: 'Charlie Brown', email: 'charlie@example.com' });
  });

  test('TC-04: unknown ID 999 returns 404 with error body', async () => {
    const res = await request(app).get('/api/users/999');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });

  test('TC-05: non-numeric ID "abc" returns 404 (Number coercion → NaN, no match)', async () => {
    const res = await request(app).get('/api/users/abc');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });
});

describe('GET /api/users — getAllUsers regression', () => {
  test('TC-06: returns 200 and an array of 3 users with numeric id fields', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);
    expect(typeof res.body[0].id).toBe('number');
  });
});
