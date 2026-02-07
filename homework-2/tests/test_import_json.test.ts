import { parseJSON } from '../src/parsers/jsonParser';
import * as fs from 'fs';
import * as path from 'path';

describe('JSON Parser', () => {
  const fixturesPath = path.join(__dirname, 'fixtures');

  // JSON-01: Parse valid JSON array
  it('should parse valid JSON array', () => {
    const jsonContent = JSON.stringify([
      {
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'Test description here',
        category: 'technical_issue',
        priority: 'medium'
      },
      {
        customer_id: 'CUST002',
        customer_email: 'test2@example.com',
        customer_name: 'Test User 2',
        subject: 'Test Subject 2',
        description: 'Test description 2',
        category: 'billing_question',
        priority: 'high'
      }
    ]);

    const result = parseJSON(jsonContent);

    expect(result).toHaveLength(2);
    expect(result[0].customer_id).toBe('CUST001');
    expect(result[1].customer_id).toBe('CUST002');
  });

  // JSON-02: Parse single ticket object (not array)
  it('should parse single ticket object (not array)', () => {
    const jsonContent = JSON.stringify({
      customer_id: 'CUST001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Test Subject',
      description: 'Test description here',
      category: 'technical_issue',
      priority: 'medium'
    });

    const result = parseJSON(jsonContent);

    expect(result).toHaveLength(1);
    expect(result[0].customer_id).toBe('CUST001');
  });

  // JSON-03: Empty content throws error
  it('should throw error for empty content', () => {
    expect(() => parseJSON('')).toThrow('JSON content is empty');
    expect(() => parseJSON('   ')).toThrow('JSON content is empty');
    expect(() => parseJSON('\n\t\n')).toThrow('JSON content is empty');
  });

  // JSON-04: Invalid JSON syntax throws error
  it('should throw error for invalid JSON syntax', () => {
    expect(() => parseJSON('{ invalid json')).toThrow('Invalid JSON syntax');
    expect(() => parseJSON('{"key": value}')).toThrow('Invalid JSON syntax');
    expect(() => parseJSON('[{}, {]')).toThrow('Invalid JSON syntax');
  });

  // JSON-05: Nested metadata parsed correctly
  it('should parse nested metadata correctly', () => {
    const jsonContent = JSON.stringify({
      customer_id: 'CUST001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Test Subject',
      description: 'Test description here',
      category: 'technical_issue',
      priority: 'medium',
      metadata: {
        source: 'web_form',
        browser: 'Chrome 120',
        device_type: 'desktop'
      }
    });

    const result = parseJSON(jsonContent);

    expect(result[0].metadata).toBeDefined();
    expect(result[0].metadata?.source).toBe('web_form');
    expect(result[0].metadata?.browser).toBe('Chrome 120');
    expect(result[0].metadata?.device_type).toBe('desktop');
  });

  describe('JSON Fixture Tests', () => {
    it('should parse valid_tickets.json fixture', () => {
      const jsonContent = fs.readFileSync(path.join(fixturesPath, 'valid_tickets.json'), 'utf-8');
      const result = parseJSON(jsonContent);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('customer_id');
      expect(result[0]).toHaveProperty('customer_email');
    });

    it('should parse invalid_tickets.json fixture but return records', () => {
      const jsonContent = fs.readFileSync(path.join(fixturesPath, 'invalid_tickets.json'), 'utf-8');
      const result = parseJSON(jsonContent);

      // Parser should return records even if they're invalid - validation happens later
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should throw error for empty array', () => {
      expect(() => parseJSON('[]')).toThrow('No records found in JSON');
    });

    it('should throw error for invalid structure (primitive)', () => {
      expect(() => parseJSON('"string"')).toThrow('Invalid JSON structure');
      expect(() => parseJSON('123')).toThrow('Invalid JSON structure');
      expect(() => parseJSON('null')).toThrow('Invalid JSON structure');
    });

    it('should throw error for array with non-object items', () => {
      expect(() => parseJSON('["string", 123]')).toThrow('array items must be objects');
    });

    it('should handle tags as array', () => {
      const jsonContent = JSON.stringify({
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'Test description here',
        category: 'technical_issue',
        priority: 'medium',
        tags: ['tag1', 'tag2', 'tag3']
      });

      const result = parseJSON(jsonContent);

      expect(result[0].tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle tags as comma-separated string', () => {
      const jsonContent = JSON.stringify({
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'Test description here',
        category: 'technical_issue',
        priority: 'medium',
        tags: 'tag1, tag2, tag3'
      });

      const result = parseJSON(jsonContent);

      expect(result[0].tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle missing optional fields', () => {
      const jsonContent = JSON.stringify({
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'Test description here'
      });

      const result = parseJSON(jsonContent);

      expect(result[0].category).toBeUndefined();
      expect(result[0].priority).toBeUndefined();
      expect(result[0].tags).toBeUndefined();
      expect(result[0].metadata).toBeUndefined();
    });

    it('should filter out non-string tags', () => {
      const jsonContent = JSON.stringify({
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'Test description here',
        tags: ['valid', 123, null, 'another']
      });

      const result = parseJSON(jsonContent);

      expect(result[0].tags).toEqual(['valid', 'another']);
    });

    it('should handle non-string values gracefully', () => {
      const jsonContent = JSON.stringify({
        customer_id: 123,
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'Test description here'
      });

      const result = parseJSON(jsonContent);

      expect(result[0].customer_id).toBeUndefined();
    });
  });
});
