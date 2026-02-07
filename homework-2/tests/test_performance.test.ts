import request from 'supertest';
import app from '../src/app';
import { store } from '../src/store/inMemoryStore';
import { classificationLogger } from '../src/utils/logger';
import {
  createValidTicketData,
  clearStore,
  seedStore,
  seedStoreWithDistribution,
  createValidCSV,
  createConcurrentRequests,
  measureResponseTime
} from './helpers/testUtils';
import { Category, Priority } from '../src/types';

describe('Performance Tests', () => {
  beforeEach(() => {
    clearStore();
  });

  // PERF-01: Single ticket creation (using measureResponseTime helper)
  it('should create ticket within 100ms', async () => {
    const ticketData = createValidTicketData();

    const { response, duration } = await measureResponseTime(() =>
      request(app).post('/tickets').send(ticketData)
    );

    expect(response.status).toBe(201);
    expect(duration).toBeLessThan(100);
  });

  // PERF-02: Get ticket by ID (using measureResponseTime helper)
  it('should get ticket by ID within 50ms', async () => {
    // Create a ticket first
    const createRes = await request(app)
      .post('/tickets')
      .send(createValidTicketData());
    const ticketId = createRes.body.id;

    const { response, duration } = await measureResponseTime(() =>
      request(app).get(`/tickets/${ticketId}`)
    );

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(50);
  });

  // PERF-03: List 100 tickets
  it('should list 100 tickets within 100ms', async () => {
    // Seed 100 tickets
    seedStore(100);

    const start = Date.now();
    const response = await request(app).get('/tickets');
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(100);
    expect(duration).toBeLessThan(100);
  });

  // PERF-04: Bulk import 50 tickets via CSV
  it('should import 50 tickets via CSV within 500ms', async () => {
    const csvContent = createValidCSV(50);

    const start = Date.now();
    const response = await request(app)
      .post('/tickets/import')
      .attach('file', Buffer.from(csvContent), 'tickets.csv');
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(response.body.summary.successful).toBe(50);
    expect(duration).toBeLessThan(500);
  });

  // PERF-05: Auto-classify single ticket
  it('should auto-classify ticket within 100ms', async () => {
    // Create a ticket first
    const createRes = await request(app)
      .post('/tickets')
      .send(createValidTicketData({
        subject: 'Cannot login to my account',
        description: 'Password reset not working and I am locked out of my account.'
      }));
    const ticketId = createRes.body.id;

    const start = Date.now();
    const response = await request(app).post(`/tickets/${ticketId}/auto-classify`);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(100);
  });

  describe('Extended Performance Tests', () => {
    it('should handle rapid sequential requests', async () => {
      const requestCount = 50;
      const maxTotalTime = 2000; // 2 seconds for 50 requests

      const start = Date.now();

      for (let i = 0; i < requestCount; i++) {
        const res = await request(app)
          .post('/tickets')
          .send(createValidTicketData({
            customer_id: `CUST${i.toString().padStart(3, '0')}`
          }));
        expect(res.status).toBe(201);
      }

      const totalDuration = Date.now() - start;
      expect(totalDuration).toBeLessThan(maxTotalTime);

      // Verify all tickets were created
      const listRes = await request(app).get('/tickets');
      expect(listRes.body.count).toBe(requestCount);
    });

    // PERF-07: Filter 500 tickets (using seedStoreWithDistribution helper)
    it('should filter 500 tickets efficiently', async () => {
      // Seed 500 tickets with specific distribution
      seedStoreWithDistribution(500, {
        categories: [Category.TECHNICAL_ISSUE, Category.BILLING_QUESTION, Category.ACCOUNT_ACCESS],
        priorities: [Priority.HIGH, Priority.MEDIUM, Priority.LOW]
      });

      const { response, duration } = await measureResponseTime(() =>
        request(app).get('/tickets?category=technical_issue')
      );

      expect(response.status).toBe(200);
      expect(response.body.tickets.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(200); // Should filter 500 tickets in < 200ms
    });

    it('should update tickets quickly', async () => {
      const { id } = (() => {
        const ticketData = createValidTicketData();
        const ticket = require('../src/models/ticket').createTicket(ticketData);
        store.create(ticket);
        return { id: ticket.id };
      })();

      const start = Date.now();
      const response = await request(app)
        .put(`/tickets/${id}`)
        .send({ status: 'resolved' });
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(15);
    });

    it('should delete tickets quickly', async () => {
      const { id } = (() => {
        const ticketData = createValidTicketData();
        const ticket = require('../src/models/ticket').createTicket(ticketData);
        store.create(ticket);
        return { id: ticket.id };
      })();

      const start = Date.now();
      const response = await request(app).delete(`/tickets/${id}`);
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(50);
    });

    // Using createConcurrentRequests helper for parallel classification
    it('should handle parallel classification requests', async () => {
      // Create 10 tickets
      const ticketIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .post('/tickets')
          .send(createValidTicketData({
            customer_id: `CUST${i}`,
            subject: 'Test ticket for classification',
            description: 'This is a test ticket that needs to be classified automatically.'
          }));
        ticketIds.push(res.body.id);
      }

      const start = Date.now();
      const results = await createConcurrentRequests(ticketIds.length, (index) =>
        request(app).post(`/tickets/${ticketIds[index]}/auto-classify`)
      );
      const duration = Date.now() - start;

      results.forEach(res => {
        expect(res.status).toBe(200);
      });

      // 10 parallel classifications should complete in < 500ms
      expect(duration).toBeLessThan(500);
    });

    it('should maintain performance with large ticket descriptions', async () => {
      // Max description is 2000 chars, use 1900 to be safe
      const largeDescription = 'a'.repeat(1400) + ' login password reset cannot access account ' + 'b'.repeat(450);

      const start = Date.now();
      const response = await request(app)
        .post('/tickets?auto_classify=true')
        .send(createValidTicketData({
          description: largeDescription
        }));
      const duration = Date.now() - start;

      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle clearing large stores efficiently', async () => {
      // Seed 1000 tickets
      seedStore(1000);

      const beforeCount = store.count();
      expect(beforeCount).toBe(1000);

      const start = Date.now();
      store.clear();
      classificationLogger.clearLogs();
      const duration = Date.now() - start;

      expect(store.count()).toBe(0);
      expect(duration).toBeLessThan(50);
    });
  });
});
