const request = require('supertest');
const app = require('../../../src/app');

describe('Health Check', () => {
  it('should return 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });

  it('should return { status: "ok" }', async () => {
    const response = await request(app).get('/health');
    expect(response.body).toEqual({ status: 'ok' });
  });
});
