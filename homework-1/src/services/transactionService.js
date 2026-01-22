const { v4: uuidv4 } = require('uuid');
const {
  getTransactions,
  addTransaction,
  getTransactionById,
  getAccount,
  updateAccountBalance
} = require('../store/inMemoryStore');

function create(transactionData) {
  const transaction = {
    id: uuidv4(),
    ...transactionData,
    timestamp: new Date().toISOString(),
    status: 'completed'
  };

  // Update account balances based on transaction type
  if (transaction.type === 'deposit') {
    updateAccountBalance(transaction.toAccount, transaction.amount, 'add');
  } else if (transaction.type === 'withdrawal') {
    updateAccountBalance(transaction.fromAccount, transaction.amount, 'subtract');
  } else if (transaction.type === 'transfer') {
    updateAccountBalance(transaction.fromAccount, transaction.amount, 'subtract');
    updateAccountBalance(transaction.toAccount, transaction.amount, 'add');
  }

  addTransaction(transaction);
  return transaction;
}

function getAll(filters = {}) {
  let transactions = getTransactions();

  // Filter by accountId (matches fromAccount OR toAccount)
  if (filters.accountId) {
    transactions = transactions.filter(t =>
      t.fromAccount === filters.accountId || t.toAccount === filters.accountId
    );
  }

  // Filter by type
  if (filters.type) {
    transactions = transactions.filter(t => t.type === filters.type);
  }

  // Filter by date range (from)
  if (filters.from) {
    const fromDate = new Date(filters.from);
    transactions = transactions.filter(t => new Date(t.timestamp) >= fromDate);
  }

  // Filter by date range (to)
  if (filters.to) {
    const toDate = new Date(filters.to);
    toDate.setHours(23, 59, 59, 999); // Include the entire "to" day
    transactions = transactions.filter(t => new Date(t.timestamp) <= toDate);
  }

  return transactions;
}

function getById(id) {
  return getTransactionById(id);
}

module.exports = {
  create,
  getAll,
  getById
};
