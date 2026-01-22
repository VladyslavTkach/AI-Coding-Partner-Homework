const store = {
  transactions: [],
  accounts: {
    'ACC-12345': { balance: 1000.00, currency: 'USD' },
    'ACC-67890': { balance: 500.00, currency: 'USD' },
    'ACC-11111': { balance: 2500.00, currency: 'EUR' }
  }
};

function getTransactions() {
  return store.transactions;
}

function addTransaction(transaction) {
  store.transactions.push(transaction);
  return transaction;
}

function getTransactionById(id) {
  return store.transactions.find(t => t.id === id);
}

function getAccount(accountId) {
  return store.accounts[accountId];
}

function updateAccountBalance(accountId, amount, operation) {
  if (!store.accounts[accountId]) {
    return null;
  }

  if (operation === 'add') {
    store.accounts[accountId].balance += amount;
  } else if (operation === 'subtract') {
    store.accounts[accountId].balance -= amount;
  }

  return store.accounts[accountId];
}

function getAccounts() {
  return store.accounts;
}

function resetStore() {
  store.transactions = [];
  store.accounts = {
    'ACC-12345': { balance: 1000.00, currency: 'USD' },
    'ACC-67890': { balance: 500.00, currency: 'USD' },
    'ACC-11111': { balance: 2500.00, currency: 'EUR' }
  };
}

module.exports = {
  store,
  getTransactions,
  addTransaction,
  getTransactionById,
  getAccount,
  updateAccountBalance,
  getAccounts,
  resetStore
};
