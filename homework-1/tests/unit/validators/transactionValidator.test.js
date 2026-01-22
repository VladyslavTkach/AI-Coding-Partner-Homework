const { validateTransaction } = require('../../../src/validators/transactionValidator');

describe('Transaction Validator', () => {
  describe('Valid Transactions', () => {
    it('should validate a valid deposit', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: 100.00,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid withdrawal', () => {
      const result = validateTransaction({
        fromAccount: 'ACC-12345',
        amount: 50.00,
        currency: 'USD',
        type: 'withdrawal'
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid transfer', () => {
      const result = validateTransaction({
        fromAccount: 'ACC-12345',
        toAccount: 'ACC-67890',
        amount: 25.00,
        currency: 'USD',
        type: 'transfer'
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Amount Validation', () => {
    it('should reject missing amount', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'amount')).toBe(true);
    });

    it('should reject negative amount', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: -100,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('positive'))).toBe(true);
    });

    it('should reject zero amount', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: 0,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'amount')).toBe(true);
    });

    it('should reject amount with more than 2 decimal places', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: 100.123,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('2 decimal'))).toBe(true);
    });

    it('should accept valid amount with 2 decimals', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: 100.99,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(true);
    });

    it('should accept valid integer amount', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('Account Format Validation', () => {
    it('should reject invalid format without ACC prefix', () => {
      const result = validateTransaction({
        toAccount: '12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('ACC-XXXXX'))).toBe(true);
    });

    it('should reject invalid format with 4 chars', () => {
      const result = validateTransaction({
        toAccount: 'ACC-1234',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'toAccount')).toBe(true);
    });

    it('should reject invalid format with 6 chars', () => {
      const result = validateTransaction({
        toAccount: 'ACC-123456',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'toAccount')).toBe(true);
    });

    it('should accept valid format ACC-12345', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(true);
    });

    it('should accept valid format with alphanumeric ACC-Ab1C2', () => {
      const result = validateTransaction({
        toAccount: 'ACC-Ab1C2',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('Currency Validation', () => {
    it('should reject missing currency', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: 100,
        type: 'deposit'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'currency')).toBe(true);
    });

    it('should reject invalid currency code', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'XXX',
        type: 'deposit'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid currency'))).toBe(true);
    });

    it('should accept valid currency USD', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(true);
    });

    it('should accept valid currency EUR', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'EUR',
        type: 'deposit'
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('Type Validation', () => {
    it('should reject missing type', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'type')).toBe(true);
    });

    it('should reject invalid type', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'payment'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid transaction type'))).toBe(true);
    });

    it('should accept valid type deposit', () => {
      const result = validateTransaction({
        toAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(true);
    });

    it('should accept valid type withdrawal', () => {
      const result = validateTransaction({
        fromAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'withdrawal'
      });
      expect(result.isValid).toBe(true);
    });

    it('should accept valid type transfer', () => {
      const result = validateTransaction({
        fromAccount: 'ACC-12345',
        toAccount: 'ACC-67890',
        amount: 100,
        currency: 'USD',
        type: 'transfer'
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('Account Requirements by Type', () => {
    it('should reject deposit without toAccount', () => {
      const result = validateTransaction({
        amount: 100,
        currency: 'USD',
        type: 'deposit'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'toAccount')).toBe(true);
    });

    it('should reject withdrawal without fromAccount', () => {
      const result = validateTransaction({
        amount: 100,
        currency: 'USD',
        type: 'withdrawal'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'fromAccount')).toBe(true);
    });

    it('should reject transfer without fromAccount', () => {
      const result = validateTransaction({
        toAccount: 'ACC-67890',
        amount: 100,
        currency: 'USD',
        type: 'transfer'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'fromAccount')).toBe(true);
    });

    it('should reject transfer without toAccount', () => {
      const result = validateTransaction({
        fromAccount: 'ACC-12345',
        amount: 100,
        currency: 'USD',
        type: 'transfer'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'toAccount')).toBe(true);
    });

    it('should accept transfer with both accounts', () => {
      const result = validateTransaction({
        fromAccount: 'ACC-12345',
        toAccount: 'ACC-67890',
        amount: 100,
        currency: 'USD',
        type: 'transfer'
      });
      expect(result.isValid).toBe(true);
    });
  });
});
