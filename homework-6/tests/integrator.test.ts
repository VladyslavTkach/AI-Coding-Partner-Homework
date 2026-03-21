jest.mock('fs');

import fs from 'fs';
import { runPipeline } from '../src/integrator';
import { Transaction } from '../src/types';
import * as transactionValidator from '../src/agents/transaction_validator';

const validTx: Transaction = {
  transaction_id: 'TXN001',
  amount: '1500.00',
  currency: 'USD',
  source_account: 'ACC-0001',
  destination_account: 'ACC-0002',
  timestamp: '2024-01-15T14:30:00Z',
  cross_border: false,
};

const invalidAmountTx: Transaction = {
  transaction_id: 'TXN002',
  amount: 'not-a-number',
  currency: 'USD',
  source_account: 'ACC-0003',
  destination_account: 'ACC-0004',
  timestamp: '2024-01-15T14:30:00Z',
};

const invalidCurrencyTx: Transaction = {
  transaction_id: 'TXN003',
  amount: '200.00',
  currency: 'XYZ',
  source_account: 'ACC-0005',
  destination_account: 'ACC-0006',
  timestamp: '2024-01-15T14:30:00Z',
};

const highRiskTx: Transaction = {
  transaction_id: 'TXN004',
  amount: '75000.00',
  currency: 'USD',
  source_account: 'ACC-0007',
  destination_account: 'ACC-0008',
  timestamp: '2024-01-15T03:00:00Z', // night-time
  cross_border: true,
};

function setupFsMocks(transactionsJson: string): void {
  (fs.readFileSync as jest.Mock).mockReturnValue(transactionsJson);
  (fs.existsSync as jest.Mock).mockReturnValue(true);
  (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
  (fs.appendFileSync as jest.Mock).mockImplementation(() => undefined);
  (fs.writeFileSync as jest.Mock).mockImplementation(() => undefined);
}

describe('Pipeline Integrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    test('processes a valid transaction and settles it', async () => {
      setupFsMocks(JSON.stringify([validTx]));
      await runPipeline();
      const written = (fs.writeFileSync as jest.Mock).mock.calls[0][1] as string;
      expect(JSON.parse(written).status).toBe('settled');
    });

    test('writes one result file per transaction', async () => {
      setupFsMocks(JSON.stringify([validTx, invalidAmountTx]));
      await runPipeline();
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    test('writes result file named after transaction_id', async () => {
      setupFsMocks(JSON.stringify([validTx]));
      await runPipeline();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('TXN001.json'),
        expect.any(String),
        'utf-8',
      );
    });
  });

  describe('invalid transactions', () => {
    test('declines transaction with invalid amount', async () => {
      setupFsMocks(JSON.stringify([invalidAmountTx]));
      await runPipeline();
      const written = (fs.writeFileSync as jest.Mock).mock.calls[0][1] as string;
      const result = JSON.parse(written);
      expect(result.status).toBe('declined');
      expect(result.reason).toBe('INVALID_AMOUNT');
    });

    test('declines transaction with invalid currency', async () => {
      setupFsMocks(JSON.stringify([invalidCurrencyTx]));
      await runPipeline();
      const written = (fs.writeFileSync as jest.Mock).mock.calls[0][1] as string;
      const result = JSON.parse(written);
      expect(result.status).toBe('declined');
      expect(result.reason).toBe('INVALID_CURRENCY');
    });

    test('declines high-risk transaction', async () => {
      setupFsMocks(JSON.stringify([highRiskTx]));
      await runPipeline();
      const written = (fs.writeFileSync as jest.Mock).mock.calls[0][1] as string;
      const result = JSON.parse(written);
      expect(result.status).toBe('declined');
      expect(result.reason).toBe('HIGH_FRAUD_RISK');
    });
  });

  describe('resilience', () => {
    test('does not crash when one transaction fails', async () => {
      setupFsMocks(JSON.stringify([validTx, invalidAmountTx]));
      await expect(runPipeline()).resolves.not.toThrow();
    });

    test('processes all transactions even if some are invalid', async () => {
      setupFsMocks(JSON.stringify([validTx, invalidAmountTx, invalidCurrencyTx]));
      await runPipeline();
      expect(fs.writeFileSync).toHaveBeenCalledTimes(3);
    });
  });

  describe('audit log', () => {
    test('appends to audit log after each transaction', async () => {
      setupFsMocks(JSON.stringify([validTx]));
      await runPipeline();
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('audit.log'),
        expect.any(String),
        'utf-8',
      );
    });

    test('creates audit log directory if absent', async () => {
      setupFsMocks(JSON.stringify([validTx]));
      (fs.existsSync as jest.Mock).mockImplementation((p: fs.PathLike) =>
        !String(p).includes('logs'),
      );
      await runPipeline();
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('logs'),
        { recursive: true },
      );
    });

    test('audit log lines are valid JSON', async () => {
      setupFsMocks(JSON.stringify([validTx]));
      await runPipeline();
      const calls = (fs.appendFileSync as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const logContent = calls[0][1] as string;
      const lines = logContent.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    });
  });

  describe('integration: full pipeline flow', () => {
    test('all 4 sample transactions produce expected statuses', async () => {
      setupFsMocks(JSON.stringify([validTx, invalidAmountTx, invalidCurrencyTx, highRiskTx]));
      await runPipeline();

      const writeCalls = (fs.writeFileSync as jest.Mock).mock.calls;
      const results = writeCalls.map(([, json]) => JSON.parse(json as string));

      const settled = results.filter((r) => r.status === 'settled');
      const declined = results.filter((r) => r.status === 'declined');

      expect(settled).toHaveLength(1);
      expect(declined).toHaveLength(3);
    });
  });

  describe('per-transaction error catch block', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('counts failed transaction as declined and continues', async () => {
      setupFsMocks(JSON.stringify([validTx, validTx]));
      jest
        .spyOn(transactionValidator, 'processMessage')
        .mockRejectedValueOnce(new Error('agent crash'));

      await expect(runPipeline()).resolves.not.toThrow();
      // Second transaction should still be processed
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });

    test('pipeline still runs remaining transactions after one throws', async () => {
      setupFsMocks(JSON.stringify([validTx, validTx, validTx]));
      jest
        .spyOn(transactionValidator, 'processMessage')
        .mockRejectedValueOnce(new Error('agent crash'));

      await runPipeline();
      // 2 of 3 transactions make it through
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });
  });
});
