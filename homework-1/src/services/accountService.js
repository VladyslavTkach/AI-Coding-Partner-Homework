const { getAccount, getTransactions } = require('../store/inMemoryStore');

function getBalance(accountId) {
  const account = getAccount(accountId);
  if (!account) {
    return null;
  }

  return {
    accountId,
    balance: account.balance,
    currency: account.currency
  };
}

function getSummary(accountId) {
  const account = getAccount(accountId);
  if (!account) {
    return null;
  }

  const transactions = getTransactions();
  const accountTransactions = transactions.filter(t =>
    t.fromAccount === accountId || t.toAccount === accountId
  );

  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let transfersSent = 0;
  let transfersReceived = 0;
  let mostRecentTransaction = null;

  accountTransactions.forEach(t => {
    if (t.type === 'deposit' && t.toAccount === accountId) {
      totalDeposits += t.amount;
    } else if (t.type === 'withdrawal' && t.fromAccount === accountId) {
      totalWithdrawals += t.amount;
    } else if (t.type === 'transfer') {
      if (t.fromAccount === accountId) {
        transfersSent += t.amount;
      }
      if (t.toAccount === accountId) {
        transfersReceived += t.amount;
      }
    }

    if (!mostRecentTransaction || new Date(t.timestamp) > new Date(mostRecentTransaction)) {
      mostRecentTransaction = t.timestamp;
    }
  });

  return {
    accountId,
    summary: {
      totalDeposits,
      totalWithdrawals,
      totalTransfers: {
        sent: transfersSent,
        received: transfersReceived
      },
      transactionCount: accountTransactions.length,
      mostRecentTransaction
    },
    currentBalance: account.balance
  };
}

module.exports = {
  getBalance,
  getSummary
};
