const request = require('supertest');
const app = require('../../../src/app');
const { resetStore } = require('../../../src/store/inMemoryStore');

describe('Transaction Routes', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('POST /transactions', () => {
    it('should return 201 and transaction object for valid deposit', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          toAccount: 'ACC-12345',
          amount: 100.00,
          currency: 'USD',
          type: 'deposit'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(100);
      expect(response.body.type).toBe('deposit');
    });

    it('should return 201 and transaction object for valid withdrawal', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          fromAccount: 'ACC-12345',
          amount: 50.00,
          currency: 'USD',
          type: 'withdrawal'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('withdrawal');
    });

    it('should return 201 and transaction object for valid transfer', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          fromAccount: 'ACC-12345',
          toAccount: 'ACC-67890',
          amount: 25.00,
          currency: 'USD',
          type: 'transfer'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('transfer');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          amount: 100.00
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 400 for invalid amount (negative)', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          toAccount: 'ACC-12345',
          amount: -100,
          currency: 'USD',
          type: 'deposit'
        });

      expect(response.status).toBe(400);
      expect(response.body.details.some(e => e.field === 'amount')).toBe(true);
    });

    it('should return 400 for invalid account format', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          toAccount: '12345',
          amount: 100,
          currency: 'USD',
          type: 'deposit'
        });

      expect(response.status).toBe(400);
      expect(response.body.details.some(e => e.field === 'toAccount')).toBe(true);
    });

    it('should return 400 for invalid currency', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          toAccount: 'ACC-12345',
          amount: 100,
          currency: 'XXX',
          type: 'deposit'
        });

      expect(response.status).toBe(400);
      expect(response.body.details.some(e => e.field === 'currency')).toBe(true);
    });

    it('should return 400 for invalid type', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          toAccount: 'ACC-12345',
          amount: 100,
          currency: 'USD',
          type: 'payment'
        });

      expect(response.status).toBe(400);
      expect(response.body.details.some(e => e.field === 'type')).toBe(true);
    });

    it('should include auto-generated id in response', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          toAccount: 'ACC-12345',
          amount: 100,
          currency: 'USD',
          type: 'deposit'
        });

      expect(response.body.id).toBeDefined();
      expect(typeof response.body.id).toBe('string');
    });

    it('should include timestamp in response', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          toAccount: 'ACC-12345',
          amount: 100,
          currency: 'USD',
          type: 'deposit'
        });

      expect(response.body.timestamp).toBeDefined();
    });

    it('should include status "completed" in response', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          toAccount: 'ACC-12345',
          amount: 100,
          currency: 'USD',
          type: 'deposit'
        });

      expect(response.body.status).toBe('completed');
    });
  });

  describe('GET /transactions', () => {
    it('should return 200 with empty array initially', async () => {
      const response = await request(app).get('/transactions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 200 with all transactions', async () => {
      await request(app).post('/transactions').send({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      await request(app).post('/transactions').send({
        fromAccount: 'ACC-12345',
        amount: 50,
        currency: 'USD',
        type: 'withdrawal'
      });

      const response = await request(app).get('/transactions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should return 200 with filtered results by accountId', async () => {
      await request(app).post('/transactions').send({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      await request(app).post('/transactions').send({
        toAccount: 'ACC-67890',
        amount: 50,
        currency: 'USD',
        type: 'deposit'
      });

      const response = await request(app).get('/transactions?accountId=ACC-12345');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].toAccount).toBe('ACC-12345');
    });

    it('should return 200 with filtered results by type', async () => {
      await request(app).post('/transactions').send({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      await request(app).post('/transactions').send({
        fromAccount: 'ACC-12345',
        amount: 50,
        currency: 'USD',
        type: 'withdrawal'
      });

      const response = await request(app).get('/transactions?type=deposit');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].type).toBe('deposit');
    });

    it('should return 200 with empty array when no matches', async () => {
      await request(app).post('/transactions').send({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });

      const response = await request(app).get('/transactions?type=transfer');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /transactions/:id', () => {
    it('should return 200 with transaction for valid id', async () => {
      const createResponse = await request(app)
        .post('/transactions')
        .send({
          toAccount: 'ACC-12345',
          amount: 100,
          currency: 'USD',
          type: 'deposit'
        });

      const response = await request(app)
        .get(`/transactions/${createResponse.body.id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createResponse.body.id);
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app)
        .get('/transactions/non-existent-id');

      expect(response.status).toBe(404);
    });

    it('should have error message in 404 response body', async () => {
      const response = await request(app)
        .get('/transactions/non-existent-id');

      expect(response.body).toHaveProperty('error');
    });
  });
});
