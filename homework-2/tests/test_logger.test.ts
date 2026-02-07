import { ClassificationLogger, classificationLogger } from '../src/utils/logger';
import { ClassificationLogEntry, Category, Priority } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Classification Logger', () => {
  beforeEach(() => {
    classificationLogger.clearLogs();
  });

  describe('log', () => {
    it('should log classification entries', () => {
      const entry: ClassificationLogEntry = {
        timestamp: new Date(),
        ticket_id: 'test-ticket-1',
        original_category: Category.OTHER,
        original_priority: Priority.MEDIUM,
        new_category: Category.TECHNICAL_ISSUE,
        new_priority: Priority.HIGH,
        category_confidence: 0.8,
        priority_confidence: 0.75,
        keywords_found: ['error', 'crash'],
        reasoning: 'Found technical keywords',
        was_override: false
      };

      classificationLogger.log(entry);

      const logs = classificationLogger.getLogsByTicketId('test-ticket-1');
      expect(logs).toHaveLength(1);
      expect(logs[0].ticket_id).toBe('test-ticket-1');
      expect(logs[0].new_category).toBe(Category.TECHNICAL_ISSUE);
    });

    it('should log entries with null original values', () => {
      const entry: ClassificationLogEntry = {
        timestamp: new Date(),
        ticket_id: 'test-ticket-2',
        original_category: null,
        original_priority: null,
        new_category: Category.ACCOUNT_ACCESS,
        new_priority: Priority.URGENT,
        category_confidence: 0.9,
        priority_confidence: 0.85,
        keywords_found: ['login', 'password'],
        reasoning: 'Found login keywords',
        was_override: true
      };

      classificationLogger.log(entry);

      const logs = classificationLogger.getLogsByTicketId('test-ticket-2');
      expect(logs).toHaveLength(1);
      expect(logs[0].original_category).toBeNull();
      expect(logs[0].original_priority).toBeNull();
    });
  });

  describe('getRecentLogs', () => {
    it('should return recent logs', () => {
      for (let i = 0; i < 5; i++) {
        classificationLogger.log({
          timestamp: new Date(),
          ticket_id: `ticket-${i}`,
          original_category: Category.OTHER,
          original_priority: Priority.MEDIUM,
          new_category: Category.TECHNICAL_ISSUE,
          new_priority: Priority.HIGH,
          category_confidence: 0.8,
          priority_confidence: 0.75,
          keywords_found: [],
          reasoning: 'Test',
          was_override: false
        });
      }

      const recent = classificationLogger.getRecentLogs(3);
      expect(recent).toHaveLength(3);
      expect(recent[0].ticket_id).toBe('ticket-2');
      expect(recent[1].ticket_id).toBe('ticket-3');
      expect(recent[2].ticket_id).toBe('ticket-4');
    });

    it('should return all logs if count exceeds total', () => {
      classificationLogger.log({
        timestamp: new Date(),
        ticket_id: 'ticket-1',
        original_category: Category.OTHER,
        original_priority: Priority.MEDIUM,
        new_category: Category.BILLING_QUESTION,
        new_priority: Priority.LOW,
        category_confidence: 0.7,
        priority_confidence: 0.6,
        keywords_found: [],
        reasoning: 'Test',
        was_override: false
      });

      const recent = classificationLogger.getRecentLogs(100);
      expect(recent).toHaveLength(1);
    });
  });

  describe('getLogsByTicketId', () => {
    it('should return logs for specific ticket', () => {
      classificationLogger.log({
        timestamp: new Date(),
        ticket_id: 'ticket-a',
        original_category: Category.OTHER,
        original_priority: Priority.MEDIUM,
        new_category: Category.FEATURE_REQUEST,
        new_priority: Priority.LOW,
        category_confidence: 0.6,
        priority_confidence: 0.5,
        keywords_found: ['feature'],
        reasoning: 'Test',
        was_override: false
      });

      classificationLogger.log({
        timestamp: new Date(),
        ticket_id: 'ticket-b',
        original_category: Category.OTHER,
        original_priority: Priority.MEDIUM,
        new_category: Category.BUG_REPORT,
        new_priority: Priority.HIGH,
        category_confidence: 0.8,
        priority_confidence: 0.7,
        keywords_found: ['bug'],
        reasoning: 'Test',
        was_override: false
      });

      const logsA = classificationLogger.getLogsByTicketId('ticket-a');
      const logsB = classificationLogger.getLogsByTicketId('ticket-b');

      expect(logsA).toHaveLength(1);
      expect(logsA[0].new_category).toBe(Category.FEATURE_REQUEST);
      expect(logsB).toHaveLength(1);
      expect(logsB[0].new_category).toBe(Category.BUG_REPORT);
    });

    it('should return empty array for non-existent ticket', () => {
      const logs = classificationLogger.getLogsByTicketId('non-existent');
      expect(logs).toEqual([]);
    });

    it('should return multiple logs for same ticket', () => {
      for (let i = 0; i < 3; i++) {
        classificationLogger.log({
          timestamp: new Date(),
          ticket_id: 'ticket-multi',
          original_category: Category.OTHER,
          original_priority: Priority.MEDIUM,
          new_category: Category.TECHNICAL_ISSUE,
          new_priority: Priority.HIGH,
          category_confidence: 0.8,
          priority_confidence: 0.75,
          keywords_found: [],
          reasoning: `Classification ${i + 1}`,
          was_override: i > 0
        });
      }

      const logs = classificationLogger.getLogsByTicketId('ticket-multi');
      expect(logs).toHaveLength(3);
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      classificationLogger.log({
        timestamp: new Date(),
        ticket_id: 'ticket-to-clear',
        original_category: Category.OTHER,
        original_priority: Priority.MEDIUM,
        new_category: Category.ACCOUNT_ACCESS,
        new_priority: Priority.URGENT,
        category_confidence: 0.9,
        priority_confidence: 0.85,
        keywords_found: [],
        reasoning: 'Test',
        was_override: false
      });

      expect(classificationLogger.getRecentLogs(10).length).toBeGreaterThan(0);

      classificationLogger.clearLogs();

      expect(classificationLogger.getRecentLogs(10)).toHaveLength(0);
    });
  });

  describe('ClassificationLogger constructor', () => {
    it('should create logger with custom log file', () => {
      const customPath = path.join(process.cwd(), 'logs', 'custom.log');
      const customLogger = new ClassificationLogger(customPath);

      // Logger should be created without error
      expect(customLogger).toBeDefined();
    });

    it('should create logs directory if it does not exist', () => {
      // This test verifies the directory creation logic
      const testPath = path.join(process.cwd(), 'logs', 'test-subdir', 'test.log');
      const testLogger = new ClassificationLogger(testPath);

      // Logger should be created and directory should exist
      const dir = path.dirname(testPath);
      expect(fs.existsSync(dir)).toBe(true);

      // Clean up
      fs.rmSync(path.join(process.cwd(), 'logs', 'test-subdir'), { recursive: true, force: true });
    });
  });
});
