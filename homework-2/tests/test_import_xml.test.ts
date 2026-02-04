import { parseXML } from '../src/parsers/xmlParser';
import * as fs from 'fs';
import * as path from 'path';

describe('XML Parser', () => {
  const fixturesPath = path.join(__dirname, 'fixtures');

  // XML-01: Parse valid XML with tickets wrapper
  it('should parse valid XML with tickets wrapper', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>Test description here</description>
    <category>technical_issue</category>
    <priority>medium</priority>
  </ticket>
  <ticket>
    <customer_id>CUST002</customer_id>
    <customer_email>test2@example.com</customer_email>
    <customer_name>Test User 2</customer_name>
    <subject>Test Subject 2</subject>
    <description>Test description 2</description>
    <category>billing_question</category>
    <priority>high</priority>
  </ticket>
</tickets>`;

    const result = await parseXML(xml);

    expect(result).toHaveLength(2);
    expect(result[0].customer_id).toBe('CUST001');
    expect(result[1].customer_id).toBe('CUST002');
    expect(result[0].category).toBe('technical_issue');
    expect(result[1].category).toBe('billing_question');
  });

  // XML-02: Parse single ticket element
  it('should parse single ticket element', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>Test description here</description>
    <category>technical_issue</category>
    <priority>medium</priority>
  </ticket>
</tickets>`;

    const result = await parseXML(xml);

    expect(result).toHaveLength(1);
    expect(result[0].customer_id).toBe('CUST001');
  });

  // XML-03: Empty content throws error
  it('should throw error for empty content', async () => {
    await expect(parseXML('')).rejects.toThrow('XML content is empty');
    await expect(parseXML('   ')).rejects.toThrow('XML content is empty');
    await expect(parseXML('\n\t\n')).rejects.toThrow('XML content is empty');
  });

  // XML-04: Malformed XML throws error
  it('should throw error for malformed XML', async () => {
    const malformedXml = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>CUST001
  </ticket>
</tickets>`;

    await expect(parseXML(malformedXml)).rejects.toThrow('Failed to parse XML');
  });

  // XML-05: Nested metadata element parsed
  it('should parse nested metadata element', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>Test description here</description>
    <category>technical_issue</category>
    <priority>medium</priority>
    <metadata>
      <source>web_form</source>
      <browser>Chrome 120</browser>
      <device_type>desktop</device_type>
    </metadata>
  </ticket>
</tickets>`;

    const result = await parseXML(xml);

    expect(result[0].metadata).toBeDefined();
    expect(result[0].metadata?.source).toBe('web_form');
    expect(result[0].metadata?.browser).toBe('Chrome 120');
    expect(result[0].metadata?.device_type).toBe('desktop');
  });

  describe('XML Fixture Tests', () => {
    it('should parse valid_tickets.xml fixture', async () => {
      const xmlContent = fs.readFileSync(path.join(fixturesPath, 'valid_tickets.xml'), 'utf-8');
      const result = await parseXML(xmlContent);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('customer_id');
      expect(result[0]).toHaveProperty('customer_email');
    });
  });

  describe('Edge Cases', () => {
    it('should handle tags nested elements', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>Test description here</description>
    <category>technical_issue</category>
    <priority>medium</priority>
    <tags>
      <tag>tag1</tag>
      <tag>tag2</tag>
      <tag>tag3</tag>
    </tags>
  </ticket>
</tickets>`;

      const result = await parseXML(xml);

      expect(result[0].tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle single tag element', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>Test description here</description>
    <category>technical_issue</category>
    <priority>medium</priority>
    <tags>
      <tag>single-tag</tag>
    </tags>
  </ticket>
</tickets>`;

      const result = await parseXML(xml);

      expect(result[0].tags).toEqual(['single-tag']);
    });

    it('should handle tags as comma-separated string', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>Test description here</description>
    <category>technical_issue</category>
    <priority>medium</priority>
    <tags>tag1, tag2, tag3</tags>
  </ticket>
</tickets>`;

      const result = await parseXML(xml);

      expect(result[0].tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle missing optional elements', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>Test description here</description>
  </ticket>
</tickets>`;

      const result = await parseXML(xml);

      expect(result[0].category).toBeUndefined();
      expect(result[0].priority).toBeUndefined();
      expect(result[0].tags).toBeUndefined();
      expect(result[0].metadata).toBeUndefined();
    });

    it('should handle different root element structure', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>Test description here</description>
    <category>technical_issue</category>
    <priority>medium</priority>
  </ticket>
</root>`;

      const result = await parseXML(xml);

      expect(result).toHaveLength(1);
      expect(result[0].customer_id).toBe('CUST001');
    });

    it('should throw error for XML without tickets', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <item>Not a ticket</item>
</data>`;

      await expect(parseXML(xml)).rejects.toThrow('No tickets found');
    });

    it('should handle CDATA sections', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject><![CDATA[Test Subject with <special> chars]]></subject>
    <description><![CDATA[Test description with & special < > characters]]></description>
    <category>technical_issue</category>
    <priority>medium</priority>
  </ticket>
</tickets>`;

      const result = await parseXML(xml);

      expect(result[0].subject).toBe('Test Subject with <special> chars');
    });

    it('should handle root-level ticket array', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test1@example.com</customer_email>
    <customer_name>Test User 1</customer_name>
    <subject>Subject 1</subject>
    <description>Description for ticket 1</description>
  </ticket>
  <ticket>
    <customer_id>CUST002</customer_id>
    <customer_email>test2@example.com</customer_email>
    <customer_name>Test User 2</customer_name>
    <subject>Subject 2</subject>
    <description>Description for ticket 2</description>
  </ticket>
</root>`;

      const result = await parseXML(xml);
      expect(result).toHaveLength(2);
      expect(result[0].customer_id).toBe('CUST001');
      expect(result[1].customer_id).toBe('CUST002');
    });

    it('should handle wrapper element with multiple ticket array', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<wrapper>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>Test description here</description>
  </ticket>
  <ticket>
    <customer_id>CUST002</customer_id>
    <customer_email>test2@example.com</customer_email>
    <customer_name>Test User 2</customer_name>
    <subject>Test Subject 2</subject>
    <description>Test description 2 here</description>
  </ticket>
</wrapper>`;

      const result = await parseXML(xml);
      expect(result).toHaveLength(2);
    });

    it('should handle direct ticket element at root level (single ticket)', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ticket>
  <customer_id>CUST001</customer_id>
  <customer_email>test@example.com</customer_email>
  <customer_name>Test User</customer_name>
  <subject>Test Subject</subject>
  <description>Test description here</description>
  <category>technical_issue</category>
  <priority>medium</priority>
</ticket>`;

      const result = await parseXML(xml);
      expect(result).toHaveLength(1);
      expect(result[0].customer_id).toBe('CUST001');
    });

    it('should handle text with attributes (xml2js _ property)', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id type="external">CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>Test description here</description>
  </ticket>
</tickets>`;

      const result = await parseXML(xml);
      expect(result).toHaveLength(1);
      // With attributes, xml2js returns { _: 'value', $: { type: 'external' } }
      // getValue should extract the _ property
      expect(result[0].customer_id).toBeDefined();
    });

    it('should handle numeric values in XML', async () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<tickets>
  <ticket>
    <customer_id>12345</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Test Subject</subject>
    <description>Test description here</description>
  </ticket>
</tickets>`;

      const result = await parseXML(xml);
      expect(result[0].customer_id).toBe('12345');
    });
  });
});
