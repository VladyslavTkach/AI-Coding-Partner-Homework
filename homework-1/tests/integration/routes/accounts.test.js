const request = require('supertest');
const app = require('../../../src/app');
const { resetStore } = require('../../../src/store/inMemoryStore');

describe('Account Routes', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('GET /accounts/:accountId/balance', () => {
    it('should return 200 with balance for existing account', async () => {
      const response = await request(app)
        .get('/accounts/ACC-12345/balance');

      expect(response.status).toBe(200);
    });

    it('should return correct balance amount', async () => {
      const response = await request(app)
        .get('/accounts/ACC-12345/balance');

      expect(response.body).toHaveProperty('balance', 1000);
    });

    it('should return correct currency', async () => {
      const response = await request(app)
        .get('/accounts/ACC-12345/balance');

      expect(response.body).toHaveProperty('currency', 'USD');
    });

    it('should return 404 for non-existent account', async () => {
      const response = await request(app)
        .get('/accounts/ACC-99999/balance');

      expect(response.status).toBe(404);
    });

    it('should update balance correctly after deposit', async () => {
      const initialResponse = await request(app)
        .get('/accounts/ACC-12345/balance');
      const initialBalance = initialResponse.body.balance;

      await request(app)
        .post('/transactions')
        .send({
          toAccount: 'ACC-12345',
          amount: 100,
          currency: 'USD',
          type: 'deposit'
        });

      const response = await request(app)
        .get('/accounts/ACC-12345/balance');

      expect(response.body.balance).toBe(initialBalance + 100);
    });

    it('should update balance correctly after withdrawal', async () => {
      const initialResponse = await request(app)
        .get('/accounts/ACC-12345/balance');
      const initialBalance = initialResponse.body.balance;

      await request(app)
        .post('/transactions')
        .send({
          fromAccount: 'ACC-12345',
          amount: 50,
          currency: 'USD',
          type: 'withdrawal'
        });

      const response = await request(app)
        .get('/accounts/ACC-12345/balance');

      expect(response.body.balance).toBe(initialBalance - 50);
    });

    it('should update balance correctly after transfer', async () => {
      const fromInitial = (await request(app).get('/accounts/ACC-12345/balance')).body.balance;
      const toInitial = (await request(app).get('/accounts/ACC-67890/balance')).body.balance;

      await request(app)
        .post('/transactions')
        .send({
          fromAccount: 'ACC-12345',
          toAccount: 'ACC-67890',
          amount: 100,
          currency: 'USD',
          type: 'transfer'
        });

      const fromResponse = await request(app).get('/accounts/ACC-12345/balance');
      const toResponse = await request(app).get('/accounts/ACC-67890/balance');

      expect(fromResponse.body.balance).toBe(fromInitial - 100);
      expect(toResponse.body.balance).toBe(toInitial + 100);
    });
  });

  describe('GET /accounts/:accountId/summary', () => {
    it('should return 200 with summary for existing account', async () => {
      const response = await request(app)
        .get('/accounts/ACC-12345/summary');

      expect(response.status).toBe(200);
    });

    it('should return correct totalDeposits', async () => {
      await request(app).post('/transactions').send({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      await request(app).post('/transactions').send({
        toAccount: 'ACC-12345',
        amount: 200,
        currency: 'USD',
        type: 'deposit'
      });

      const response = await request(app).get('/accounts/ACC-12345/summary');

      expect(response.body.summary.totalDeposits).toBe(300);
    });

    it('should return correct totalWithdrawals', async () => {
      await request(app).post('/transactions').send({
        fromAccount: 'ACC-12345',
        amount: 50,
        currency: 'USD',
        type: 'withdrawal'
      });

      const response = await request(app).get('/accounts/ACC-12345/summary');

      expect(response.body.summary.totalWithdrawals).toBe(50);
    });

    it('should return correct transfer amounts', async () => {
      await request(app).post('/transactions').send({
        fromAccount: 'ACC-12345',
        toAccount: 'ACC-67890',
        amount: 100,
        currency: 'USD',
        type: 'transfer'
      });
      await request(app).post('/transactions').send({
        fromAccount: 'ACC-67890',
        toAccount: 'ACC-12345',
        amount: 75,
        currency: 'USD',
        type: 'transfer'
      });

      const response = await request(app).get('/accounts/ACC-12345/summary');

      expect(response.body.summary.totalTransfers.sent).toBe(100);
      expect(response.body.summary.totalTransfers.received).toBe(75);
    });

    it('should return correct transaction count', async () => {
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

      const response = await request(app).get('/accounts/ACC-12345/summary');

      expect(response.body.summary.transactionCount).toBe(2);
    });

    it('should return 404 for non-existent account', async () => {
      const response = await request(app)
        .get('/accounts/ACC-99999/summary');

      expect(response.status).toBe(404);
    });
  });
});
