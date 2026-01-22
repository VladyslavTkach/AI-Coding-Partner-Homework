const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// POST /transactions - Create a new transaction
router.post('/', transactionController.createTransaction);

// GET /transactions - Get all transactions (with optional filters)
router.get('/', transactionController.getAllTransactions);

// GET /transactions/:id - Get a specific transaction by ID
router.get('/:id', transactionController.getTransactionById);

module.exports = router;
