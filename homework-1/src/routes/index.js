const express = require('express');
const router = express.Router();

const transactionRoutes = require('./transactions');
const accountRoutes = require('./accounts');

router.use('/transactions', transactionRoutes);
router.use('/accounts', accountRoutes);

module.exports = router;
