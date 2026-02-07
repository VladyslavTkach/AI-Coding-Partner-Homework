import { CreateTicketDTO, Category, Priority, Status } from '../../src/types';
import { store } from '../../src/store/inMemoryStore';
import { classificationLogger } from '../../src/utils/logger';
import { createTicket } from '../../src/models/ticket';

/**
 * Factory for creating valid ticket data with optional overrides
 */
export function createValidTicketData(overrides?: Partial<CreateTicketDTO>): CreateTicketDTO {
  return {
    customer_id: 'CUST001',
    customer_email: 'test@example.com',
    customer_name: 'Test User',
    subject: 'Test ticket subject',
    description: 'This is a test ticket description with enough characters to pass validation',
    category: Category.TECHNICAL_ISSUE,
    priority: Priority.MEDIUM,
    ...overrides
  };
}

/**
 * Factory for creating invalid ticket data based on the specified invalid field
 */
export function createInvalidTicketData(invalidField: string): Record<string, unknown> {
  const base = createValidTicketData();
  switch (invalidField) {
    case 'email':
      return { ...base, customer_email: 'invalid-email' };
    case 'subject_empty':
      return { ...base, subject: '' };
    case 'subject_long':
      return { ...base, subject: 'a'.repeat(201) };
    case 'description_short':
      return { ...base, description: 'Short' };
    case 'description_long':
      return { ...base, description: 'a'.repeat(2001) };
    case 'category':
      return { ...base, category: 'invalid_category' };
    case 'priority':
      return { ...base, priority: 'super-high' };
    case 'missing_customer_id':
      const { customer_id: _cid, ...withoutCustomerId } = base;
      return withoutCustomerId;
    case 'missing_subject':
      const { subject: _subj, ...withoutSubject } = base;
      return withoutSubject;
    default:
      return { ...base };
  }
}

/**
 * Clear the in-memory store and classification logs
 */
export function clearStore(): void {
  store.clear();
  classificationLogger.clearLogs();
}

/**
 * Seed the store with a specified number of tickets
 * Returns the IDs of created tickets
 */
export function seedStore(count: number, categoryDistribution?: boolean): string[] {
  const ids: string[] = [];
  const categories = Object.values(Category);
  const priorities = Object.values(Priority);

  for (let i = 0; i < count; i++) {
    const ticketData = createValidTicketData({
      customer_id: `CUST${i.toString().padStart(3, '0')}`,
      customer_email: `user${i}@example.com`,
      customer_name: `Test User ${i}`,
      subject: `Test ticket subject ${i}`,
      description: `This is test ticket description number ${i} with enough characters`,
      category: categoryDistribution ? categories[i % categories.length] : Category.TECHNICAL_ISSUE,
      priority: categoryDistribution ? priorities[i % priorities.length] : Priority.MEDIUM
    });

    const ticket = createTicket(ticketData);
    store.create(ticket);
    ids.push(ticket.id);
  }

  return ids;
}

/**
 * Create a ticket directly in the store and return it
 */
export function createTicketInStore(overrides?: Partial<CreateTicketDTO>): { id: string; ticket: ReturnType<typeof createTicket> } {
  const ticketData = createValidTicketData(overrides);
  const ticket = createTicket(ticketData);
  store.create(ticket);
  return { id: ticket.id, ticket };
}

/**
 * Generate a random UUID-like string for testing non-existent tickets
 */
export function generateNonExistentId(): string {
  return 'non-existent-' + Math.random().toString(36).substring(2, 15);
}

/**
 * Create valid CSV content for testing
 */
export function createValidCSV(count: number = 3): string {
  const header = 'customer_id,customer_email,customer_name,subject,description,category,priority,tags,source,browser,device_type';
  const rows: string[] = [];

  for (let i = 0; i < count; i++) {
    rows.push(
      `CUST${i.toString().padStart(3, '0')},user${i}@example.com,User ${i},Test Subject ${i},This is a valid description for ticket ${i} with enough chars,technical_issue,medium,"tag1,tag2",web_form,Chrome,desktop`
    );
  }

  return header + '\n' + rows.join('\n');
}

/**
 * Create valid JSON content for testing
 */
export function createValidJSON(count: number = 3): string {
  const tickets = [];

  for (let i = 0; i < count; i++) {
    tickets.push({
      customer_id: `CUST${i.toString().padStart(3, '0')}`,
      customer_email: `user${i}@example.com`,
      customer_name: `User ${i}`,
      subject: `Test Subject ${i}`,
      description: `This is a valid description for ticket ${i} with enough characters`,
      category: 'technical_issue',
      priority: 'medium',
      tags: ['tag1', 'tag2'],
      metadata: {
        source: 'web_form',
        browser: 'Chrome',
        device_type: 'desktop'
      }
    });
  }

  return JSON.stringify(tickets, null, 2);
}

/**
 * Create valid XML content for testing
 */
export function createValidXML(count: number = 3): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<tickets>\n';

  for (let i = 0; i < count; i++) {
    xml += `  <ticket>
    <customer_id>CUST${i.toString().padStart(3, '0')}</customer_id>
    <customer_email>user${i}@example.com</customer_email>
    <customer_name>User ${i}</customer_name>
    <subject>Test Subject ${i}</subject>
    <description>This is a valid description for ticket ${i} with enough characters</description>
    <category>technical_issue</category>
    <priority>medium</priority>
    <tags>
      <tag>tag1</tag>
      <tag>tag2</tag>
    </tags>
    <metadata>
      <source>web_form</source>
      <browser>Chrome</browser>
      <device_type>desktop</device_type>
    </metadata>
  </ticket>\n`;
  }

  xml += '</tickets>';
  return xml;
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Options for seeding store with specific distribution
 */
export interface SeedDistributionOptions {
  categories?: Category[];
  priorities?: Priority[];
  statuses?: Status[];
}

/**
 * Seed the store with a specified distribution of tickets
 * Allows more control over the distribution of categories, priorities, and statuses
 */
export function seedStoreWithDistribution(
  count: number,
  options?: SeedDistributionOptions
): string[] {
  const ids: string[] = [];
  const categories = options?.categories || Object.values(Category);
  const priorities = options?.priorities || Object.values(Priority);
  const statuses = options?.statuses || [Status.NEW];

  for (let i = 0; i < count; i++) {
    const ticketData = createValidTicketData({
      customer_id: `CUST${i.toString().padStart(3, '0')}`,
      customer_email: `user${i}@example.com`,
      customer_name: `Test User ${i}`,
      subject: `Test ticket subject ${i}`,
      description: `This is test ticket description number ${i} with enough characters`,
      category: categories[i % categories.length],
      priority: priorities[i % priorities.length],
      status: statuses[i % statuses.length]
    });

    const ticket = createTicket(ticketData);
    store.create(ticket);
    ids.push(ticket.id);
  }

  return ids;
}

/**
 * Create concurrent requests and return Promise.all result
 * @param count Number of requests to create
 * @param requestFn Function that creates and returns a request promise
 */
export async function createConcurrentRequests<T>(
  count: number,
  requestFn: (index: number) => Promise<T>
): Promise<T[]> {
  const requests = Array(count)
    .fill(null)
    .map((_, index) => requestFn(index));
  return Promise.all(requests);
}

/**
 * Measure response time for a request
 * @param requestFn Function that performs the request
 * @returns Object containing the response and duration in milliseconds
 */
export async function measureResponseTime<T>(
  requestFn: () => Promise<T>
): Promise<{ response: T; duration: number }> {
  const start = Date.now();
  const response = await requestFn();
  const duration = Date.now() - start;
  return { response, duration };
}
