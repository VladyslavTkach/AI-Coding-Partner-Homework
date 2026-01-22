const accountService = require('../../../src/services/accountService');
const transactionService = require('../../../src/services/transactionService');
const { resetStore } = require('../../../src/store/inMemoryStore');

describe('Account Service', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('getBalance()', () => {
    it('should return balance info for existing account', () => {
      const balance = accountService.getBalance('ACC-12345');
      expect(balance).toBeDefined();
      expect(balance).toHaveProperty('accountId', 'ACC-12345');
      expect(balance).toHaveProperty('balance');
      expect(balance).toHaveProperty('currency');
    });

    it('should return null for non-existent account', () => {
      const balance = accountService.getBalance('ACC-99999');
      expect(balance).toBeNull();
    });

    it('should return correct balance after transactions', () => {
      const initialBalance = accountService.getBalance('ACC-12345').balance;

      transactionService.create({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });

      const newBalance = accountService.getBalance('ACC-12345').balance;
      expect(newBalance).toBe(initialBalance + 100);
    });
  });

  describe('getSummary()', () => {
    it('should return correct totalDeposits', () => {
      transactionService.create({ toAccount: 'ACC-12345', amount: 100, currency: 'USD', type: 'deposit' });
      transactionService.create({ toAccount: 'ACC-12345', amount: 200, currency: 'USD', type: 'deposit' });

      const summary = accountService.getSummary('ACC-12345');
      expect(summary.summary.totalDeposits).toBe(300);
    });

    it('should return correct totalWithdrawals', () => {
      transactionService.create({ fromAccount: 'ACC-12345', amount: 50, currency: 'USD', type: 'withdrawal' });
      transactionService.create({ fromAccount: 'ACC-12345', amount: 30, currency: 'USD', type: 'withdrawal' });

      const summary = accountService.getSummary('ACC-12345');
      expect(summary.summary.totalWithdrawals).toBe(80);
    });

    it('should return correct transfers sent amount', () => {
      transactionService.create({
        fromAccount: 'ACC-12345',
        toAccount: 'ACC-67890',
        amount: 100,
        currency: 'USD',
        type: 'transfer'
      });

      const summary = accountService.getSummary('ACC-12345');
      expect(summary.summary.totalTransfers.sent).toBe(100);
    });

    it('should return correct transfers received amount', () => {
      transactionService.create({
        fromAccount: 'ACC-67890',
        toAccount: 'ACC-12345',
        amount: 75,
        currency: 'USD',
        type: 'transfer'
      });

      const summary = accountService.getSummary('ACC-12345');
      expect(summary.summary.totalTransfers.received).toBe(75);
    });

    it('should return correct transaction count', () => {
      transactionService.create({ toAccount: 'ACC-12345', amount: 100, currency: 'USD', type: 'deposit' });
      transactionService.create({ fromAccount: 'ACC-12345', amount: 50, currency: 'USD', type: 'withdrawal' });
      transactionService.create({ fromAccount: 'ACC-12345', toAccount: 'ACC-67890', amount: 25, currency: 'USD', type: 'transfer' });

      const summary = accountService.getSummary('ACC-12345');
      expect(summary.summary.transactionCount).toBe(3);
    });

    it('should return most recent transaction timestamp', () => {
      transactionService.create({ toAccount: 'ACC-12345', amount: 100, currency: 'USD', type: 'deposit' });

      const summary = accountService.getSummary('ACC-12345');
      expect(summary.summary.mostRecentTransaction).toBeDefined();
    });

    it('should return null for non-existent account', () => {
      const summary = accountService.getSummary('ACC-99999');
      expect(summary).toBeNull();
    });

    it('should handle account with no transactions', () => {
      const summary = accountService.getSummary('ACC-12345');
      expect(summary).toBeDefined();
      expect(summary.summary.transactionCount).toBe(0);
      expect(summary.summary.totalDeposits).toBe(0);
      expect(summary.summary.totalWithdrawals).toBe(0);
    });
  });
});
