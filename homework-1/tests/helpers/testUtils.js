const { resetStore } = require('../../src/store/inMemoryStore');

const testUtils = {
  resetStore: () => {
    resetStore();
  },

  validDeposit: {
    toAccount: 'ACC-12345',
    amount: 100.00,
    currency: 'USD',
    type: 'deposit'
  },

  validWithdrawal: {
    fromAccount: 'ACC-12345',
    amount: 50.00,
    currency: 'USD',
    type: 'withdrawal'
  },

  validTransfer: {
    fromAccount: 'ACC-12345',
    toAccount: 'ACC-67890',
    amount: 25.00,
    currency: 'USD',
    type: 'transfer'
  },

  invalidTransactions: {
    negativeAmount: {
      toAccount: 'ACC-12345',
      amount: -100.00,
      currency: 'USD',
      type: 'deposit'
    },
    tooManyDecimals: {
      toAccount: 'ACC-12345',
      amount: 100.123,
      currency: 'USD',
      type: 'deposit'
    },
    invalidAccountFormat: {
      toAccount: '12345',
      amount: 100.00,
      currency: 'USD',
      type: 'deposit'
    },
    invalidCurrency: {
      toAccount: 'ACC-12345',
      amount: 100.00,
      currency: 'XXX',
      type: 'deposit'
    },
    invalidType: {
      toAccount: 'ACC-12345',
      amount: 100.00,
      currency: 'USD',
      type: 'payment'
    }
  },

  createTestTransactions: async (request, app, transactions) => {
    const results = [];
    for (const tx of transactions) {
      const response = await request(app)
        .post('/transactions')
        .send(tx);
      results.push(response.body);
    }
    return results;
  }
};

module.exports = testUtils;
