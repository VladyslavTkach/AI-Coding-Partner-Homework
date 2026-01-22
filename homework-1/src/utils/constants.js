const VALID_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR', 'MXN',
  'BRL', 'KRW', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'NZD', 'ZAR', 'RUB'
];

const ACCOUNT_PATTERN = /^ACC-[A-Za-z0-9]{5}$/;

const TRANSACTION_TYPES = ['deposit', 'withdrawal', 'transfer'];

const TRANSACTION_STATUSES = ['pending', 'completed', 'failed'];

module.exports = {
  VALID_CURRENCIES,
  ACCOUNT_PATTERN,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES
};
