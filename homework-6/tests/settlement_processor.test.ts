jest.mock('fs');

import fs from 'fs';
import { processMessage } from '../src/agents/settlement_processor';
import { Message } from '../src/types';

function makeMessage(status: Message['status'] = 'validated', fraudRisk?: Message['fraud_risk']): Message {
  return {
    transaction: {
      transaction_id: 'TXN_TEST',
      amount: '1500.00',
      currency: 'USD',
      source_account: 'ACC-0001',
      destination_account: 'ACC-0002',
      timestamp: '2024-01-15T14:30:00Z',
    },
    status,
    fraud_risk: fraudRisk,
    agent_log: [],
  };
}

describe('SettlementProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
  });

  describe('settlement decisions', () => {
    test('settles a validated LOW risk transaction', async () => {
      const result = await processMessage(makeMessage('validated', 'LOW'));
      expect(result.status).toBe('settled');
      expect(result.reason).toBeUndefined();
    });

    test('settles a validated MEDIUM risk transaction', async () => {
      const result = await processMessage(makeMessage('validated', 'MEDIUM'));
      expect(result.status).toBe('settled');
    });

    test('declines HIGH fraud risk transaction', async () => {
      const result = await processMessage(makeMessage('validated', 'HIGH'));
      expect(result.status).toBe('declined');
      expect(result.reason).toBe('HIGH_FRAUD_RISK');
    });

    test('declines a rejected transaction', async () => {
      const result = await processMessage(makeMessage('rejected'));
      expect(result.status).toBe('declined');
    });

    test('preserves the reason from a rejected transaction', async () => {
      const msg = makeMessage('rejected');
      msg.reason = 'INVALID_CURRENCY';
      const result = await processMessage(msg);
      expect(result.status).toBe('declined');
      expect(result.reason).toBe('INVALID_CURRENCY');
    });
  });

  describe('file I/O', () => {
    test('writes result to shared/results/<txId>.json', async () => {
      await processMessage(makeMessage('validated', 'LOW'));
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('TXN_TEST.json'),
        expect.any(String),
        'utf-8',
      );
    });

    test('written JSON contains the correct status', async () => {
      await processMessage(makeMessage('validated', 'LOW'));
      const written = (fs.writeFileSync as jest.Mock).mock.calls[0][1] as string;
      const parsed = JSON.parse(written);
      expect(parsed.status).toBe('settled');
    });

    test('creates results directory when it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      await processMessage(makeMessage('validated', 'LOW'));
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('results'),
        { recursive: true },
      );
    });

    test('does not create directory when it already exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      await processMessage(makeMessage('validated', 'LOW'));
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('agent log', () => {
    test('appends an agent_log entry', async () => {
      const result = await processMessage(makeMessage('validated', 'LOW'));
      const entry = result.agent_log!.find((e) => e.agentName === 'SettlementProcessor');
      expect(entry).toBeDefined();
      expect(entry!.transactionId).toBe('TXN_TEST');
    });

    test('log outcome is "settled" for settled transactions', async () => {
      const result = await processMessage(makeMessage('validated', 'LOW'));
      const entry = result.agent_log!.find((e) => e.agentName === 'SettlementProcessor');
      expect(entry!.outcome).toBe('settled');
    });

    test('log outcome contains "declined" for declined transactions', async () => {
      const result = await processMessage(makeMessage('validated', 'HIGH'));
      const entry = result.agent_log!.find((e) => e.agentName === 'SettlementProcessor');
      expect(entry!.outcome).toContain('declined');
    });

    test('preserves existing log entries', async () => {
      const msg = makeMessage('validated', 'LOW');
      msg.agent_log = [
        { timestamp: 't', agentName: 'TransactionValidator', transactionId: 'TXN_TEST', outcome: 'validated' },
        { timestamp: 't', agentName: 'FraudDetector', transactionId: 'TXN_TEST', outcome: 'scored: LOW (1)' },
      ];
      const result = await processMessage(msg);
      expect(result.agent_log).toHaveLength(3);
    });
  });

  describe('INTERNAL_ERROR catch block', () => {
    test('returns declined with INTERNAL_ERROR when transaction is null', async () => {
      const msg = { transaction: null, status: 'validated', agent_log: [] } as any;
      const result = await processMessage(msg);
      expect(result.status).toBe('declined');
      expect(result.reason).toBe('INTERNAL_ERROR');
    });

    test('appends INTERNAL_ERROR log entry on unexpected error', async () => {
      const msg = { transaction: null, status: 'validated', agent_log: [] } as any;
      const result = await processMessage(msg);
      expect(result.agent_log).toHaveLength(1);
      expect(result.agent_log![0].agentName).toBe('SettlementProcessor');
      expect(result.agent_log![0].outcome).toContain('INTERNAL_ERROR');
    });
  });

  describe('file write error', () => {
    test('does not throw when writeFileSync fails', async () => {
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('disk full');
      });
      await expect(processMessage(makeMessage('validated', 'LOW'))).resolves.not.toThrow();
    });

    test('still returns the result message even when write fails', async () => {
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('disk full');
      });
      const result = await processMessage(makeMessage('validated', 'LOW'));
      expect(result.status).toBe('settled');
    });
  });
});
