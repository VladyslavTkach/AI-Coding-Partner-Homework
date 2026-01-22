const { VALID_CURRENCIES, ACCOUNT_PATTERN, TRANSACTION_TYPES } = require('../utils/constants');

function validateTransaction(data) {
  const errors = [];

  // Amount validation
  if (data.amount === undefined || data.amount === null) {
    errors.push({ field: 'amount', message: 'Amount is required' });
  } else if (typeof data.amount !== 'number' || data.amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be a positive number' });
  } else {
    // Check decimal places (max 2)
    const decimalParts = data.amount.toString().split('.');
    if (decimalParts[1] && decimalParts[1].length > 2) {
      errors.push({ field: 'amount', message: 'Amount must be a positive number with maximum 2 decimal places' });
    }
  }

  // Type validation
  if (!data.type) {
    errors.push({ field: 'type', message: 'Transaction type is required' });
  } else if (!TRANSACTION_TYPES.includes(data.type)) {
    errors.push({ field: 'type', message: 'Invalid transaction type' });
  }

  // Currency validation
  if (!data.currency) {
    errors.push({ field: 'currency', message: 'Currency is required' });
  } else if (!VALID_CURRENCIES.includes(data.currency)) {
    errors.push({ field: 'currency', message: 'Invalid currency code' });
  }

  // Account validation based on transaction type
  if (data.type === 'deposit') {
    if (!data.toAccount) {
      errors.push({ field: 'toAccount', message: 'toAccount is required for deposits' });
    } else if (!ACCOUNT_PATTERN.test(data.toAccount)) {
      errors.push({ field: 'toAccount', message: 'Account number must follow format ACC-XXXXX' });
    }
  } else if (data.type === 'withdrawal') {
    if (!data.fromAccount) {
      errors.push({ field: 'fromAccount', message: 'fromAccount is required for withdrawals' });
    } else if (!ACCOUNT_PATTERN.test(data.fromAccount)) {
      errors.push({ field: 'fromAccount', message: 'Account number must follow format ACC-XXXXX' });
    }
  } else if (data.type === 'transfer') {
    if (!data.fromAccount) {
      errors.push({ field: 'fromAccount', message: 'fromAccount is required for transfers' });
    } else if (!ACCOUNT_PATTERN.test(data.fromAccount)) {
      errors.push({ field: 'fromAccount', message: 'Account number must follow format ACC-XXXXX' });
    }

    if (!data.toAccount) {
      errors.push({ field: 'toAccount', message: 'toAccount is required for transfers' });
    } else if (!ACCOUNT_PATTERN.test(data.toAccount)) {
      errors.push({ field: 'toAccount', message: 'Account number must follow format ACC-XXXXX' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateTransaction
};
