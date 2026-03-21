jest.mock('fs');

import fs from 'fs';
import request from 'supertest';
import { app } from '../src/server';

const sampleResult = {
  transaction: { transaction_id: 'TXN001', amount: '1500.00', currency: 'USD' },
  status: 'settled',
  fraud_risk: 'LOW',
  fraud_risk_score: 1,
};

describe('Express API Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /status/:transaction_id', () => {
    test('returns 200 with result when file exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(sampleResult));

      const res = await request(app).get('/status/TXN001');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('settled');
    });

    test('returns the full result JSON', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(sampleResult));

      const res = await request(app).get('/status/TXN001');
      expect(res.body.fraud_risk).toBe('LOW');
      expect(res.body.fraud_risk_score).toBe(1);
    });

    test('returns 404 when file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const res = await request(app).get('/status/TXN999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });

    test('returns 400 for transaction_id containing ..', async () => {
      const res = await request(app).get('/status/txn..evil');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_ID');
    });

    test('returns 400 for transaction_id containing backslash (URL encoded)', async () => {
      const res = await request(app).get('/status/TXN%5C001');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_ID');
    });
  });

  describe('GET /results', () => {
    test('returns empty array when results directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const res = await request(app).get('/results');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('returns array of all results', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(['TXN001.json', 'TXN002.json']);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(sampleResult));

      const res = await request(app).get('/results');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    test('filters out non-.json files', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(['TXN001.json', 'other.txt', '.DS_Store']);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(sampleResult));

      const res = await request(app).get('/results');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    test('returns empty array when results dir is empty', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([]);

      const res = await request(app).get('/results');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('500 READ_ERROR responses', () => {
    test('GET /status returns 500 when readFileSync throws', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('permission denied');
      });

      const res = await request(app).get('/status/TXN001');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('READ_ERROR');
    });

    test('GET /results returns 500 when readdirSync throws', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('permission denied');
      });

      const res = await request(app).get('/results');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('READ_ERROR');
    });

    test('GET /results returns 500 when readFileSync throws while reading a result', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(['TXN001.json']);
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('file corrupted');
      });

      const res = await request(app).get('/results');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('READ_ERROR');
    });
  });

  describe('path traversal edge cases', () => {
    test('returns 400 for transaction_id that IS only dots', async () => {
      const res = await request(app).get('/status/...');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_ID');
    });
  });
});
