/**
 * Unit tests for getUserById (userController.js, line 19)
 *
 * Scope: only the function changed by fix API-404.
 * getAllUsers was not modified and is excluded from this test suite.
 */

const request = require('supertest');
const app = require('../server');

describe('getUserById', () => {
  // TC-01: Happy path — first valid user ID returns full user object
  test('TC-01: returns 200 and Alice Smith for ID 123', async () => {
    const res = await request(app).get('/api/users/123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 123, name: 'Alice Smith', email: 'alice@example.com' });
  });

  // TC-02: Happy path — second valid user ID returns correct user
  test('TC-02: returns 200 and Bob Johnson for ID 456', async () => {
    const res = await request(app).get('/api/users/456');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 456, name: 'Bob Johnson', email: 'bob@example.com' });
  });

  // TC-03: Happy path — third valid user ID returns correct user
  test('TC-03: returns 200 and Charlie Brown for ID 789', async () => {
    const res = await request(app).get('/api/users/789');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 789, name: 'Charlie Brown', email: 'charlie@example.com' });
  });

  // TC-04: Error path — ID that does not exist in the users array returns 404
  test('TC-04: returns 404 and error message for non-existent ID 999', async () => {
    const res = await request(app).get('/api/users/999');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });

  // TC-05: Regression — the core bug fix: req.params.id is always a string;
  // Number() conversion must make the strict equality work for a string "123"
  test('TC-05: returns 200 when ID is passed as string "123" (regression for type mismatch bug)', async () => {
    // Express always delivers route params as strings; this test confirms the
    // Number() conversion introduced in the fix resolves the type mismatch.
    const res = await request(app).get('/api/users/123');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(123);
    expect(typeof res.body.id).toBe('number');
  });

  // TC-06: Edge case — non-numeric string converts to NaN; NaN === anything is false,
  // so the user is not found and the endpoint must return 404
  test('TC-06: returns 404 for a non-numeric string ID "abc"', async () => {
    const res = await request(app).get('/api/users/abc');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });
});
