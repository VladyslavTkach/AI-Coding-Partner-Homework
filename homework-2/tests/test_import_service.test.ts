import { detectFileFormat, importTickets, parseFile } from '../src/services/importService';
import { store } from '../src/store/inMemoryStore';
import { classificationLogger } from '../src/utils/logger';
import { BadRequestError } from '../src/middleware/errorHandler';

describe('Import Service', () => {
  beforeEach(() => {
    store.clear();
    classificationLogger.clearLogs();
  });

  describe('detectFileFormat', () => {
    describe('content type detection', () => {
      it('should detect CSV from content type text/csv', () => {
        const format = detectFileFormat('file.txt', 'text/csv');
        expect(format).toBe('csv');
      });

      it('should detect CSV from content type containing csv', () => {
        const format = detectFileFormat('file.txt', 'application/csv');
        expect(format).toBe('csv');
      });

      it('should detect JSON from content type application/json', () => {
        const format = detectFileFormat('file.txt', 'application/json');
        expect(format).toBe('json');
      });

      it('should detect JSON from content type containing json', () => {
        const format = detectFileFormat('file.txt', 'text/json');
        expect(format).toBe('json');
      });

      it('should detect XML from content type application/xml', () => {
        const format = detectFileFormat('file.txt', 'application/xml');
        expect(format).toBe('xml');
      });

      it('should detect XML from content type text/xml', () => {
        const format = detectFileFormat('file.txt', 'text/xml');
        expect(format).toBe('xml');
      });

      it('should detect XML from content type containing xml', () => {
        const format = detectFileFormat('file.txt', 'somexml/format');
        expect(format).toBe('xml');
      });
    });

    describe('extension detection', () => {
      it('should detect CSV from .csv extension', () => {
        const format = detectFileFormat('data.csv');
        expect(format).toBe('csv');
      });

      it('should detect JSON from .json extension', () => {
        const format = detectFileFormat('data.json');
        expect(format).toBe('json');
      });

      it('should detect XML from .xml extension', () => {
        const format = detectFileFormat('data.xml');
        expect(format).toBe('xml');
      });

      it('should be case insensitive for extensions', () => {
        expect(detectFileFormat('DATA.CSV')).toBe('csv');
        expect(detectFileFormat('DATA.JSON')).toBe('json');
        expect(detectFileFormat('DATA.XML')).toBe('xml');
      });

      it('should throw for unsupported file format', () => {
        expect(() => detectFileFormat('data.txt')).toThrow(BadRequestError);
        expect(() => detectFileFormat('data.txt')).toThrow('Unsupported file format: txt');
      });

      it('should throw for file without extension', () => {
        expect(() => detectFileFormat('noextension')).toThrow(BadRequestError);
      });
    });

    describe('content type precedence', () => {
      it('should use content type over extension when provided', () => {
        // File has .xml extension but content type says json
        const format = detectFileFormat('file.xml', 'application/json');
        expect(format).toBe('json');
      });

      it('should fall back to extension when content type is not recognized', () => {
        const format = detectFileFormat('file.csv', 'application/octet-stream');
        expect(format).toBe('csv');
      });
    });
  });

  describe('parseFile', () => {
    it('should parse CSV format', async () => {
      const content = `customer_id,customer_email,customer_name,subject,description,category,priority
CUST001,test@example.com,Test User,Test Subject,Test description text,technical_issue,medium`;

      const result = await parseFile(content, 'csv');
      expect(result).toHaveLength(1);
      expect(result[0].customer_id).toBe('CUST001');
    });

    it('should parse JSON format', async () => {
      const content = JSON.stringify({
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'Test description text'
      });

      const result = await parseFile(content, 'json');
      expect(result).toHaveLength(1);
      expect(result[0].customer_id).toBe('CUST001');
    });

    it('should parse XML format', async () => {
      const content = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>Test description text</description>
  </ticket>
</tickets>`;

      const result = await parseFile(content, 'xml');
      expect(result).toHaveLength(1);
      expect(result[0].customer_id).toBe('CUST001');
    });
  });

  describe('importTickets', () => {
    it('should import valid CSV tickets', async () => {
      const content = `customer_id,customer_email,customer_name,subject,description,category,priority
CUST001,test@example.com,Test User,Test Subject,This is a valid description text,technical_issue,medium`;

      const result = await importTickets(content, 'csv');

      expect(result.total).toBe(1);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.created_ids).toHaveLength(1);
    });

    it('should import valid JSON tickets', async () => {
      const content = JSON.stringify([{
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'This is a valid description text',
        category: 'technical_issue',
        priority: 'medium'
      }]);

      const result = await importTickets(content, 'json');

      expect(result.total).toBe(1);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should handle validation errors during import', async () => {
      const content = `customer_id,customer_email,customer_name,subject,description,category,priority
CUST001,invalid-email,Test User,Test Subject,Short,technical_issue,medium`;

      const result = await importTickets(content, 'csv');

      expect(result.total).toBe(1);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(1);
    });

    it('should normalize invalid category to OTHER', async () => {
      const content = `customer_id,customer_email,customer_name,subject,description,category,priority
CUST001,test@example.com,Test User,Test Subject,This is a valid description text,invalid_category,medium`;

      const result = await importTickets(content, 'csv');

      expect(result.successful).toBe(1);
      const ticket = store.findById(result.created_ids[0]);
      expect(ticket?.category).toBe('other');
    });

    it('should normalize invalid priority to MEDIUM', async () => {
      const content = `customer_id,customer_email,customer_name,subject,description,category,priority
CUST001,test@example.com,Test User,Test Subject,This is a valid description text,technical_issue,invalid_priority`;

      const result = await importTickets(content, 'csv');

      expect(result.successful).toBe(1);
      const ticket = store.findById(result.created_ids[0]);
      expect(ticket?.priority).toBe('medium');
    });

    it('should normalize string tags to array', async () => {
      const content = `customer_id,customer_email,customer_name,subject,description,category,priority,tags
CUST001,test@example.com,Test User,Test Subject,This is a valid description text,technical_issue,medium,"tag1,tag2"`;

      const result = await importTickets(content, 'csv');

      expect(result.successful).toBe(1);
      const ticket = store.findById(result.created_ids[0]);
      expect(ticket?.tags).toEqual(['tag1', 'tag2']);
    });

    it('should throw error for invalid file content', async () => {
      await expect(importTickets('', 'csv')).rejects.toThrow('Import failed');
    });

    it('should handle XML import', async () => {
      const content = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>This is a valid description text</description>
    <category>technical_issue</category>
    <priority>medium</priority>
  </ticket>
</tickets>`;

      const result = await importTickets(content, 'xml');

      expect(result.total).toBe(1);
      expect(result.successful).toBe(1);
    });

    it('should handle metadata normalization', async () => {
      const content = JSON.stringify([{
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'This is a valid description text',
        category: 'technical_issue',
        priority: 'medium',
        metadata: {
          source: 'web_form',
          browser: 'Chrome',
          device_type: 'desktop'
        }
      }]);

      const result = await importTickets(content, 'json');

      expect(result.successful).toBe(1);
      const ticket = store.findById(result.created_ids[0]);
      expect(ticket?.metadata.source).toBe('web_form');
      expect(ticket?.metadata.device_type).toBe('desktop');
    });

    it('should filter out invalid metadata source', async () => {
      const content = JSON.stringify([{
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'This is a valid description text',
        category: 'technical_issue',
        priority: 'medium',
        metadata: {
          source: 'invalid_source',
          device_type: 'invalid_device'
        }
      }]);

      const result = await importTickets(content, 'json');

      expect(result.successful).toBe(1);
      const ticket = store.findById(result.created_ids[0]);
      expect(ticket?.metadata.source).toBeUndefined();
      expect(ticket?.metadata.device_type).toBeUndefined();
    });

    it('should normalize valid status', async () => {
      const content = `customer_id,customer_email,customer_name,subject,description,category,priority,status
CUST001,test@example.com,Test User,Test Subject,This is a valid description text,technical_issue,medium,in_progress`;

      const result = await importTickets(content, 'csv');

      expect(result.successful).toBe(1);
      const ticket = store.findById(result.created_ids[0]);
      expect(ticket?.status).toBe('in_progress');
    });

    it('should handle tags as array from JSON', async () => {
      const content = JSON.stringify([{
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'This is a valid description text',
        category: 'technical_issue',
        priority: 'medium',
        tags: ['tag1', 'tag2', 'tag3']
      }]);

      const result = await importTickets(content, 'json');

      expect(result.successful).toBe(1);
      const ticket = store.findById(result.created_ids[0]);
      expect(ticket?.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle metadata with browser only', async () => {
      const content = JSON.stringify([{
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'This is a valid description text',
        category: 'technical_issue',
        priority: 'medium',
        metadata: {
          browser: 'Firefox 120'
        }
      }]);

      const result = await importTickets(content, 'json');

      expect(result.successful).toBe(1);
      const ticket = store.findById(result.created_ids[0]);
      expect(ticket?.metadata.browser).toBe('Firefox 120');
    });

    it('should handle assigned_to field', async () => {
      const content = `customer_id,customer_email,customer_name,subject,description,category,priority,assigned_to
CUST001,test@example.com,Test User,Test Subject,This is a valid description text,technical_issue,medium,agent-1`;

      const result = await importTickets(content, 'csv');

      expect(result.successful).toBe(1);
      const ticket = store.findById(result.created_ids[0]);
      expect(ticket?.assigned_to).toBe('agent-1');
    });

    it('should normalize string tags from JSON', async () => {
      const content = JSON.stringify([{
        customer_id: 'CUST001',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        subject: 'Test Subject',
        description: 'This is a valid description text',
        category: 'technical_issue',
        priority: 'medium',
        tags: 'tag1, tag2, tag3'
      }]);

      const result = await importTickets(content, 'json');

      expect(result.successful).toBe(1);
      const ticket = store.findById(result.created_ids[0]);
      expect(ticket?.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  describe('parseFile edge cases', () => {
    it('should throw for unsupported format', async () => {
      await expect(parseFile('content', 'xyz' as any)).rejects.toThrow(BadRequestError);
      await expect(parseFile('content', 'xyz' as any)).rejects.toThrow('Unsupported file format');
    });
  });
});
