const transactionService = require('../../../src/services/transactionService');
const { resetStore, getAccount, getTransactions } = require('../../../src/store/inMemoryStore');

describe('Transaction Service', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('create()', () => {
    it('should create transaction with auto-generated UUID', () => {
      const tx = transactionService.create({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      expect(tx.id).toBeDefined();
      expect(typeof tx.id).toBe('string');
      expect(tx.id.length).toBeGreaterThan(0);
    });

    it('should set timestamp to current datetime', () => {
      const before = new Date().toISOString();
      const tx = transactionService.create({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      const after = new Date().toISOString();

      expect(tx.timestamp).toBeDefined();
      expect(tx.timestamp >= before).toBe(true);
      expect(tx.timestamp <= after).toBe(true);
    });

    it('should set status to completed', () => {
      const tx = transactionService.create({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      expect(tx.status).toBe('completed');
    });

    it('should store transaction in data store', () => {
      const tx = transactionService.create({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      const transactions = getTransactions();
      expect(transactions).toContainEqual(tx);
    });

    it('should return created transaction object', () => {
      const tx = transactionService.create({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      expect(tx).toHaveProperty('id');
      expect(tx).toHaveProperty('toAccount', 'ACC-12345');
      expect(tx).toHaveProperty('amount', 100);
      expect(tx).toHaveProperty('currency', 'USD');
      expect(tx).toHaveProperty('type', 'deposit');
    });

    it('should update account balance for deposit (increases toAccount)', () => {
      const initialBalance = getAccount('ACC-12345').balance;
      transactionService.create({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      const newBalance = getAccount('ACC-12345').balance;
      expect(newBalance).toBe(initialBalance + 100);
    });

    it('should update account balance for withdrawal (decreases fromAccount)', () => {
      const initialBalance = getAccount('ACC-12345').balance;
      transactionService.create({
        fromAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'withdrawal'
      });
      const newBalance = getAccount('ACC-12345').balance;
      expect(newBalance).toBe(initialBalance - 100);
    });

    it('should update account balances for transfer (both accounts)', () => {
      const initialFromBalance = getAccount('ACC-12345').balance;
      const initialToBalance = getAccount('ACC-67890').balance;

      transactionService.create({
        fromAccount: 'ACC-12345',
        toAccount: 'ACC-67890',
        amount: 100,
        currency: 'USD',
        type: 'transfer'
      });

      expect(getAccount('ACC-12345').balance).toBe(initialFromBalance - 100);
      expect(getAccount('ACC-67890').balance).toBe(initialToBalance + 100);
    });
  });

  describe('getAll()', () => {
    it('should return empty array when no transactions', () => {
      const transactions = transactionService.getAll();
      expect(transactions).toEqual([]);
    });

    it('should return all transactions when no filters', () => {
      transactionService.create({ toAccount: 'ACC-12345', amount: 100, currency: 'USD', type: 'deposit' });
      transactionService.create({ fromAccount: 'ACC-12345', amount: 50, currency: 'USD', type: 'withdrawal' });

      const transactions = transactionService.getAll();
      expect(transactions).toHaveLength(2);
    });

    it('should filter by accountId (matches fromAccount)', () => {
      transactionService.create({ fromAccount: 'ACC-12345', amount: 100, currency: 'USD', type: 'withdrawal' });
      transactionService.create({ fromAccount: 'ACC-67890', amount: 50, currency: 'USD', type: 'withdrawal' });

      const transactions = transactionService.getAll({ accountId: 'ACC-12345' });
      expect(transactions).toHaveLength(1);
      expect(transactions[0].fromAccount).toBe('ACC-12345');
    });

    it('should filter by accountId (matches toAccount)', () => {
      transactionService.create({ toAccount: 'ACC-12345', amount: 100, currency: 'USD', type: 'deposit' });
      transactionService.create({ toAccount: 'ACC-67890', amount: 50, currency: 'USD', type: 'deposit' });

      const transactions = transactionService.getAll({ accountId: 'ACC-12345' });
      expect(transactions).toHaveLength(1);
      expect(transactions[0].toAccount).toBe('ACC-12345');
    });

    it('should filter by type', () => {
      transactionService.create({ toAccount: 'ACC-12345', amount: 100, currency: 'USD', type: 'deposit' });
      transactionService.create({ fromAccount: 'ACC-12345', amount: 50, currency: 'USD', type: 'withdrawal' });

      const transactions = transactionService.getAll({ type: 'deposit' });
      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe('deposit');
    });

    it('should combine multiple filters correctly', () => {
      transactionService.create({ toAccount: 'ACC-12345', amount: 100, currency: 'USD', type: 'deposit' });
      transactionService.create({ fromAccount: 'ACC-12345', amount: 50, currency: 'USD', type: 'withdrawal' });
      transactionService.create({ toAccount: 'ACC-67890', amount: 75, currency: 'USD', type: 'deposit' });

      const transactions = transactionService.getAll({ accountId: 'ACC-12345', type: 'deposit' });
      expect(transactions).toHaveLength(1);
      expect(transactions[0].toAccount).toBe('ACC-12345');
      expect(transactions[0].type).toBe('deposit');
    });
  });

  describe('getById()', () => {
    it('should return transaction when found', () => {
      const created = transactionService.create({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });

      const found = transactionService.getById(created.id);
      expect(found).toEqual(created);
    });

    it('should return undefined when not found', () => {
      const found = transactionService.getById('non-existent-id');
      expect(found).toBeUndefined();
    });
  });
});
