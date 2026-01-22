const transactionService = require('../services/transactionService');
const { validateTransaction } = require('../validators/transactionValidator');

function createTransaction(req, res) {
  try {
    const validation = validateTransaction(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const transaction = transactionService.create(req.body);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
}

function getAllTransactions(req, res) {
  try {
    const filters = {
      accountId: req.query.accountId,
      type: req.query.type,
      from: req.query.from,
      to: req.query.to
    };
    const transactions = transactionService.getAll(filters);
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
}

function getTransactionById(req, res) {
  try {
    const transaction = transactionService.getById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve transaction' });
  }
}

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById
};
