import { parseCSV } from '../src/parsers/csvParser';
import * as fs from 'fs';
import * as path from 'path';

describe('CSV Parser', () => {
  const fixturesPath = path.join(__dirname, 'fixtures');

  // CSV-01: Parse valid CSV with headers
  it('should parse valid CSV content', () => {
    const csv = `customer_id,customer_email,customer_name,subject,description,category,priority
CUST001,test@example.com,Test User,Test Subject,This is a test ticket description with enough chars,technical_issue,medium`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0].customer_id).toBe('CUST001');
    expect(result[0].customer_email).toBe('test@example.com');
    expect(result[0].customer_name).toBe('Test User');
    expect(result[0].subject).toBe('Test Subject');
    expect(result[0].category).toBe('technical_issue');
    expect(result[0].priority).toBe('medium');
  });

  // CSV-02: Handle comma-separated tags
  it('should handle comma-separated tags', () => {
    const csv = `customer_id,customer_email,customer_name,subject,description,category,priority,tags
CUST001,test@example.com,Test User,Test Subject,Test description here,technical_issue,medium,"tag1,tag2,tag3"`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0].tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  // CSV-03: Parse metadata columns
  it('should parse metadata columns (source, browser, device_type)', () => {
    const csv = `customer_id,customer_email,customer_name,subject,description,category,priority,source,browser,device_type
CUST001,test@example.com,Test User,Test Subject,Test description here,technical_issue,medium,web_form,Chrome 120,desktop`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0].metadata).toBeDefined();
    expect(result[0].metadata?.source).toBe('web_form');
    expect(result[0].metadata?.browser).toBe('Chrome 120');
    expect(result[0].metadata?.device_type).toBe('desktop');
  });

  // CSV-04: Empty content throws error
  it('should throw error for empty content', () => {
    expect(() => parseCSV('')).toThrow('CSV content is empty');
    expect(() => parseCSV('   ')).toThrow('CSV content is empty');
    expect(() => parseCSV('\n\n')).toThrow('CSV content is empty');
  });

  // CSV-05: Missing optional columns handled
  it('should handle missing optional columns', () => {
    const csv = `customer_id,customer_email,customer_name,subject,description,category,priority
CUST001,test@example.com,Test User,Test Subject,Test description here,technical_issue,medium`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0].tags).toBeUndefined();
    expect(result[0].metadata).toBeUndefined();
    expect(result[0].assigned_to).toBeUndefined();
  });

  // CSV-06: Empty lines skipped
  it('should skip empty lines', () => {
    const csv = `customer_id,customer_email,customer_name,subject,description,category,priority
CUST001,test1@example.com,Test User 1,Subject 1,Description for ticket 1,technical_issue,medium

CUST002,test2@example.com,Test User 2,Subject 2,Description for ticket 2,billing_question,high

`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(2);
    expect(result[0].customer_id).toBe('CUST001');
    expect(result[1].customer_id).toBe('CUST002');
  });

  describe('CSV Fixture Tests', () => {
    it('should parse valid_tickets.csv fixture', () => {
      const csvContent = fs.readFileSync(path.join(fixturesPath, 'valid_tickets.csv'), 'utf-8');
      const result = parseCSV(csvContent);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('customer_id');
      expect(result[0]).toHaveProperty('customer_email');
      expect(result[0]).toHaveProperty('subject');
      expect(result[0]).toHaveProperty('description');
    });

    it('should parse invalid_tickets.csv fixture but return records', () => {
      const csvContent = fs.readFileSync(path.join(fixturesPath, 'invalid_tickets.csv'), 'utf-8');
      const result = parseCSV(csvContent);

      // Parser should return records even if they're invalid - validation happens later
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle CSV with only headers', () => {
      const csv = 'customer_id,customer_email,customer_name,subject,description';

      expect(() => parseCSV(csv)).toThrow('No records found');
    });

    it('should handle values with special characters', () => {
      const csv = `customer_id,customer_email,customer_name,subject,description,category,priority
CUST001,test@example.com,O'Connor,Test's Subject,"Description with ""quotes"" and special chars",technical_issue,medium`;

      const result = parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].customer_name).toBe("O'Connor");
      expect(result[0].subject).toBe("Test's Subject");
    });

    it('should handle multiple records', () => {
      const csv = `customer_id,customer_email,customer_name,subject,description,category,priority
CUST001,test1@example.com,User 1,Subject 1,Description 1,account_access,high
CUST002,test2@example.com,User 2,Subject 2,Description 2,billing_question,medium
CUST003,test3@example.com,User 3,Subject 3,Description 3,feature_request,low`;

      const result = parseCSV(csv);

      expect(result).toHaveLength(3);
      expect(result[0].customer_id).toBe('CUST001');
      expect(result[1].customer_id).toBe('CUST002');
      expect(result[2].customer_id).toBe('CUST003');
      expect(result[0].category).toBe('account_access');
      expect(result[1].category).toBe('billing_question');
      expect(result[2].category).toBe('feature_request');
    });

    it('should trim whitespace from values', () => {
      const csv = `customer_id,customer_email,customer_name,subject,description,category,priority
  CUST001  ,  test@example.com  ,  Test User  ,  Test Subject  ,  Test description  ,  technical_issue  ,  medium  `;

      const result = parseCSV(csv);

      expect(result[0].customer_id).toBe('CUST001');
      expect(result[0].customer_email).toBe('test@example.com');
      expect(result[0].customer_name).toBe('Test User');
    });

    it('should handle missing values as undefined', () => {
      const csv = `customer_id,customer_email,customer_name,subject,description,category,priority,assigned_to
CUST001,test@example.com,Test User,Test Subject,Test description,,medium,`;

      const result = parseCSV(csv);

      expect(result[0].category).toBeUndefined();
      expect(result[0].assigned_to).toBeUndefined();
    });
  });
});
