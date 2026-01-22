const accountService = require('../services/accountService');

function getAccountBalance(req, res) {
  try {
    const balance = accountService.getBalance(req.params.accountId);
    if (!balance) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.status(200).json(balance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve account balance' });
  }
}

function getAccountSummary(req, res) {
  try {
    const summary = accountService.getSummary(req.params.accountId);
    if (!summary) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve account summary' });
  }
}

module.exports = {
  getAccountBalance,
  getAccountSummary
};
