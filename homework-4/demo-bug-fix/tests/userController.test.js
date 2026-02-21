/**
 * Unit Tests: getUserById (userController.js, line 18)
 *
 * Scope: covers only the function changed by fix API-404.
 * The fix converts req.params.id from string to Number before the
 * array lookup, resolving the strict-equality type mismatch.
 */

const request = require('supertest');
const app = require('../server');

describe('GET /api/users/:id — getUserById', () => {
  // Happy path: each known numeric ID must return 200 + correct user object

  test('TC-01: returns 200 and user object for existing ID 123', async () => {
    const res = await request(app).get('/api/users/123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 123, name: 'Alice Smith', email: 'alice@example.com' });
  });

  test('TC-02: returns 200 and user object for existing ID 456', async () => {
    const res = await request(app).get('/api/users/456');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 456, name: 'Bob Johnson', email: 'bob@example.com' });
  });

  test('TC-03: returns 200 and user object for existing ID 789', async () => {
    const res = await request(app).get('/api/users/789');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 789, name: 'Charlie Brown', email: 'charlie@example.com' });
  });

  // Error path: an ID that is a valid number but not in the array must return 404

  test('TC-04: returns 404 and error message for non-existent ID 999', async () => {
    const res = await request(app).get('/api/users/999');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });

  // Edge cases: values that would have exposed or been affected by the type-coercion fix

  test('TC-05: returns 404 for non-numeric segment (NaN after Number())', async () => {
    // Number("abc") === NaN; NaN === NaN is false, so no user will match — expect 404
    const res = await request(app).get('/api/users/abc');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });

  test('TC-06: returns 404 for ID 0 (not present in the dataset)', async () => {
    const res = await request(app).get('/api/users/0');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });

  test('TC-07: returns 404 for negative ID -1 (not present in the dataset)', async () => {
    const res = await request(app).get('/api/users/-1');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });

  test('TC-08: returns 200 for ID passed with leading zeros (Number("0123") === 123)', async () => {
    // Demonstrates that Number() coercion handles leading-zero strings correctly
    const res = await request(app).get('/api/users/0123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 123, name: 'Alice Smith', email: 'alice@example.com' });
  });
});
