import { processMessage } from '../src/agents/fraud_detector';
import { Message, Transaction } from '../src/types';

function makeMessage(txOverrides: Partial<Transaction> = {}, status: Message['status'] = 'validated'): Message {
  return {
    transaction: {
      transaction_id: 'TXN_TEST',
      amount: '500.00',
      currency: 'USD',
      source_account: 'ACC-0001',
      destination_account: 'ACC-0002',
      timestamp: '2024-01-15T14:00:00Z', // 14:00 UTC — no night bonus
      cross_border: false,
      ...txOverrides,
    },
    status,
    agent_log: [],
  };
}

describe('FraudDetector', () => {
  describe('skips rejected messages', () => {
    test('returns the same object unchanged if already rejected', async () => {
      const msg = makeMessage({}, 'rejected');
      const result = await processMessage(msg);
      expect(result).toBe(msg);
      expect(result.fraud_risk).toBeUndefined();
      expect(result.fraud_risk_score).toBeUndefined();
    });
  });

  describe('amount scoring', () => {
    test('amount > 50000 scores +4', async () => {
      const result = await processMessage(makeMessage({ amount: '60000' }));
      expect(result.fraud_risk_score).toBe(4);
    });

    test('amount exactly 50000 scores +3 (not > 50000)', async () => {
      const result = await processMessage(makeMessage({ amount: '50000' }));
      expect(result.fraud_risk_score).toBe(3);
    });

    test('amount between 10001 and 50000 scores +3', async () => {
      const result = await processMessage(makeMessage({ amount: '25000' }));
      expect(result.fraud_risk_score).toBe(3);
    });

    test('amount exactly 10000 scores +1 (not > 10000)', async () => {
      const result = await processMessage(makeMessage({ amount: '10000' }));
      expect(result.fraud_risk_score).toBe(1);
    });

    test('amount between 1001 and 10000 scores +1', async () => {
      const result = await processMessage(makeMessage({ amount: '5000' }));
      expect(result.fraud_risk_score).toBe(1);
    });

    test('amount exactly 1000 scores 0 (not > 1000)', async () => {
      const result = await processMessage(makeMessage({ amount: '1000' }));
      expect(result.fraud_risk_score).toBe(0);
    });

    test('amount ≤ 1000 scores 0', async () => {
      const result = await processMessage(makeMessage({ amount: '500' }));
      expect(result.fraud_risk_score).toBe(0);
    });
  });

  describe('time-of-day scoring', () => {
    test('hour 02:00 UTC adds +2', async () => {
      const result = await processMessage(makeMessage({ timestamp: '2024-01-15T02:00:00Z', amount: '100' }));
      expect(result.fraud_risk_score).toBe(2);
    });

    test('hour 03:30 UTC adds +2', async () => {
      const result = await processMessage(makeMessage({ timestamp: '2024-01-15T03:30:00Z', amount: '100' }));
      expect(result.fraud_risk_score).toBe(2);
    });

    test('hour 05:59 UTC adds +2', async () => {
      const result = await processMessage(makeMessage({ timestamp: '2024-01-15T05:59:00Z', amount: '100' }));
      expect(result.fraud_risk_score).toBe(2);
    });

    test('hour 01:59 UTC does not add night bonus', async () => {
      const result = await processMessage(makeMessage({ timestamp: '2024-01-15T01:59:00Z', amount: '100' }));
      expect(result.fraud_risk_score).toBe(0);
    });

    test('hour 06:00 UTC does not add night bonus', async () => {
      const result = await processMessage(makeMessage({ timestamp: '2024-01-15T06:00:00Z', amount: '100' }));
      expect(result.fraud_risk_score).toBe(0);
    });

    test('hour 14:00 UTC does not add night bonus', async () => {
      const result = await processMessage(makeMessage({ timestamp: '2024-01-15T14:00:00Z', amount: '100' }));
      expect(result.fraud_risk_score).toBe(0);
    });
  });

  describe('cross-border scoring', () => {
    test('cross_border true adds +1', async () => {
      const result = await processMessage(makeMessage({ cross_border: true, amount: '100' }));
      expect(result.fraud_risk_score).toBe(1);
    });

    test('cross_border false adds 0', async () => {
      const result = await processMessage(makeMessage({ cross_border: false, amount: '100' }));
      expect(result.fraud_risk_score).toBe(0);
    });

    test('cross_border undefined adds 0', async () => {
      const { cross_border: _, ...txWithoutCross } = makeMessage().transaction;
      const result = await processMessage({ ...makeMessage(), transaction: txWithoutCross });
      expect(result.fraud_risk_score).toBe(0);
    });
  });

  describe('risk level classification', () => {
    test('score 0 → LOW', async () => {
      const result = await processMessage(makeMessage({ amount: '500' }));
      expect(result.fraud_risk).toBe('LOW');
    });

    test('score 2 → LOW', async () => {
      // night +2, amount ≤ 1000 +0 = 2
      const result = await processMessage(makeMessage({ timestamp: '2024-01-15T03:00:00Z', amount: '500' }));
      expect(result.fraud_risk_score).toBe(2);
      expect(result.fraud_risk).toBe('LOW');
    });

    test('score 3 → MEDIUM', async () => {
      // amount 25000 +3 = 3
      const result = await processMessage(makeMessage({ amount: '25000' }));
      expect(result.fraud_risk_score).toBe(3);
      expect(result.fraud_risk).toBe('MEDIUM');
    });

    test('score 6 → MEDIUM', async () => {
      // amount 25000 (+3) + night (+2) + cross_border (+1) = 6
      const result = await processMessage(makeMessage({
        amount: '25000',
        timestamp: '2024-01-15T03:00:00Z',
        cross_border: true,
      }));
      expect(result.fraud_risk_score).toBe(6);
      expect(result.fraud_risk).toBe('MEDIUM');
    });

    test('score 7 → HIGH', async () => {
      // amount > 50000 (+4) + night (+2) + cross_border (+1) = 7
      const result = await processMessage(makeMessage({
        amount: '75000',
        timestamp: '2024-01-15T03:00:00Z',
        cross_border: true,
      }));
      expect(result.fraud_risk_score).toBe(7);
      expect(result.fraud_risk).toBe('HIGH');
    });
  });

  describe('additive scoring', () => {
    test('combines all three factors correctly', async () => {
      // amount > 50000 (+4) + night (+2) + cross_border (+1) = 7
      const result = await processMessage(makeMessage({
        amount: '100000',
        timestamp: '2024-01-15T04:00:00Z',
        cross_border: true,
      }));
      expect(result.fraud_risk_score).toBe(7);
    });
  });

  describe('agent log', () => {
    test('appends agent_log entry with scored outcome', async () => {
      const result = await processMessage(makeMessage());
      expect(result.agent_log).toHaveLength(1);
      expect(result.agent_log![0].agentName).toBe('FraudDetector');
      expect(result.agent_log![0].outcome).toMatch(/^scored:/);
      expect(result.agent_log![0].transactionId).toBe('TXN_TEST');
    });

    test('preserves existing log entries', async () => {
      const msg = makeMessage();
      msg.agent_log = [
        { timestamp: 't', agentName: 'TransactionValidator', transactionId: 'TXN_TEST', outcome: 'validated' },
      ];
      const result = await processMessage(msg);
      expect(result.agent_log).toHaveLength(2);
      expect(result.agent_log![0].agentName).toBe('TransactionValidator');
    });
  });

  describe('INTERNAL_ERROR catch block', () => {
    test('returns message with INTERNAL_ERROR log entry when transaction is null', async () => {
      const msg = { transaction: null, status: 'validated', agent_log: [] } as any;
      const result = await processMessage(msg);
      expect(result.agent_log).toHaveLength(1);
      expect(result.agent_log![0].agentName).toBe('FraudDetector');
      expect(result.agent_log![0].outcome).toBe('INTERNAL_ERROR');
    });

    test('returns message unchanged (no fraud_risk set) on internal error', async () => {
      const msg = { transaction: null, status: 'validated', agent_log: [] } as any;
      const result = await processMessage(msg);
      expect(result.fraud_risk).toBeUndefined();
      expect(result.fraud_risk_score).toBeUndefined();
    });
  });
});
