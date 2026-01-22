const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

// GET /accounts/:accountId/balance - Get account balance
router.get('/:accountId/balance', accountController.getAccountBalance);

// GET /accounts/:accountId/summary - Get account summary
router.get('/:accountId/summary', accountController.getAccountSummary);

module.exports = router;
