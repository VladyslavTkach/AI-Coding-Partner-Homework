import { processMessage } from '../src/agents/transaction_validator';
import { Message, Transaction } from '../src/types';

function makeMessage(txOverrides: Partial<Transaction> = {}): Message {
  return {
    transaction: {
      transaction_id: 'TXN_TEST',
      amount: '100.00',
      currency: 'USD',
      source_account: 'ACC-0001',
      destination_account: 'ACC-0002',
      timestamp: '2024-01-15T14:30:00Z',
      ...txOverrides,
    },
    status: 'pending',
    agent_log: [],
  };
}

describe('TransactionValidator', () => {
  describe('valid transactions', () => {
    test('returns status validated for a valid transaction', async () => {
      const result = await processMessage(makeMessage());
      expect(result.status).toBe('validated');
    });

    test('appends an agent_log entry', async () => {
      const result = await processMessage(makeMessage());
      expect(result.agent_log).toHaveLength(1);
      expect(result.agent_log![0].agentName).toBe('TransactionValidator');
      expect(result.agent_log![0].outcome).toBe('validated');
      expect(result.agent_log![0].transactionId).toBe('TXN_TEST');
    });

    test('log entry timestamp is an ISO 8601 string', async () => {
      const result = await processMessage(makeMessage());
      expect(result.agent_log![0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('preserves existing agent_log entries', async () => {
      const msg = makeMessage();
      msg.agent_log = [
        { timestamp: 't', agentName: 'Prior', transactionId: 'TXN_TEST', outcome: 'ok' },
      ];
      const result = await processMessage(msg);
      expect(result.agent_log).toHaveLength(2);
      expect(result.agent_log![0].agentName).toBe('Prior');
    });

    test.each(['USD', 'EUR', 'GBP', 'JPY'])('accepts currency %s', async (currency) => {
      const result = await processMessage(makeMessage({ currency }));
      expect(result.status).toBe('validated');
    });
  });

  describe('missing required fields', () => {
    test.each([
      'transaction_id',
      'amount',
      'currency',
      'source_account',
      'destination_account',
      'timestamp',
    ])('rejects when %s is empty string', async (field) => {
      const result = await processMessage(makeMessage({ [field]: '' } as any));
      expect(result.status).toBe('rejected');
      expect(result.reason).toBe(`MISSING_FIELD: ${field}`);
    });

    test('appends agent_log entry on rejection', async () => {
      const result = await processMessage(makeMessage({ amount: '' }));
      expect(result.agent_log).toHaveLength(1);
      expect(result.agent_log![0].agentName).toBe('TransactionValidator');
      expect(result.agent_log![0].outcome).toContain('rejected');
    });
  });

  describe('invalid amount', () => {
    test('rejects non-numeric amount', async () => {
      const result = await processMessage(makeMessage({ amount: 'abc' }));
      expect(result.status).toBe('rejected');
      expect(result.reason).toBe('INVALID_AMOUNT');
    });

    test('rejects zero amount', async () => {
      const result = await processMessage(makeMessage({ amount: '0' }));
      expect(result.status).toBe('rejected');
      expect(result.reason).toBe('INVALID_AMOUNT');
    });

    test('rejects negative amount', async () => {
      const result = await processMessage(makeMessage({ amount: '-100' }));
      expect(result.status).toBe('rejected');
      expect(result.reason).toBe('INVALID_AMOUNT');
    });
  });

  describe('invalid currency', () => {
    test('rejects unsupported currency code', async () => {
      const result = await processMessage(makeMessage({ currency: 'XYZ' }));
      expect(result.status).toBe('rejected');
      expect(result.reason).toBe('INVALID_CURRENCY');
    });

    test('rejects lowercase currency', async () => {
      const result = await processMessage(makeMessage({ currency: 'usd' }));
      expect(result.status).toBe('rejected');
      expect(result.reason).toBe('INVALID_CURRENCY');
    });
  });

  describe('null field values', () => {
    test.each([
      'transaction_id',
      'amount',
      'currency',
      'source_account',
      'destination_account',
      'timestamp',
    ])('rejects when %s is null', async (field) => {
      const result = await processMessage(makeMessage({ [field]: null } as any));
      expect(result.status).toBe('rejected');
      expect(result.reason).toBe(`MISSING_FIELD: ${field}`);
    });

    test.each([
      'transaction_id',
      'amount',
      'currency',
      'source_account',
      'destination_account',
      'timestamp',
    ])('rejects when %s is whitespace-only', async (field) => {
      const result = await processMessage(makeMessage({ [field]: '   ' } as any));
      expect(result.status).toBe('rejected');
      expect(result.reason).toBe(`MISSING_FIELD: ${field}`);
    });
  });

  describe('INTERNAL_ERROR catch block', () => {
    test('returns rejected with INTERNAL_ERROR when transaction is null', async () => {
      const msg = { transaction: null, status: 'pending', agent_log: [] } as any;
      const result = await processMessage(msg);
      expect(result.status).toBe('rejected');
      expect(result.reason).toBe('INTERNAL_ERROR');
    });

    test('appends INTERNAL_ERROR to agent_log', async () => {
      const msg = { transaction: null, status: 'pending', agent_log: [] } as any;
      const result = await processMessage(msg);
      expect(result.agent_log).toHaveLength(1);
      expect(result.agent_log![0].outcome).toContain('INTERNAL_ERROR');
    });
  });
});
