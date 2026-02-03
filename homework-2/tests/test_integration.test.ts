import request from 'supertest';
import app from '../src/app';
import { store } from '../src/store/inMemoryStore';
import { classificationLogger } from '../src/utils/logger';
import {
  createValidTicketData,
  clearStore,
  createValidCSV
} from './helpers/testUtils';
import { Category, Priority, Status } from '../src/types';

describe('Integration Tests', () => {
  beforeEach(() => {
    clearStore();
  });

  // INT-01: Complete ticket lifecycle
  it('should handle complete ticket lifecycle: Create -> Update -> Resolve -> Delete', async () => {
    // Step 1: Create
    const createRes = await request(app)
      .post('/tickets')
      .send(createValidTicketData({
        subject: 'Test lifecycle ticket',
        description: 'Testing the complete ticket lifecycle from creation to deletion'
      }));

    expect(createRes.status).toBe(201);
    const ticketId = createRes.body.id;
    expect(ticketId).toBeDefined();
    expect(createRes.body.status).toBe(Status.NEW);

    // Step 2: Update to in_progress
    const updateRes = await request(app)
      .put(`/tickets/${ticketId}`)
      .send({ status: Status.IN_PROGRESS, assigned_to: 'agent-1' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe(Status.IN_PROGRESS);
    expect(updateRes.body.assigned_to).toBe('agent-1');
    expect(updateRes.body.resolved_at).toBeNull();

    // Step 3: Update to resolved
    const resolveRes = await request(app)
      .put(`/tickets/${ticketId}`)
      .send({ status: Status.RESOLVED });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.status).toBe(Status.RESOLVED);
    expect(resolveRes.body.resolved_at).not.toBeNull();

    // Step 4: Verify resolved_at is set
    const getRes = await request(app).get(`/tickets/${ticketId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.resolved_at).not.toBeNull();
    expect(new Date(getRes.body.resolved_at)).toBeInstanceOf(Date);

    // Step 5: Delete
    const deleteRes = await request(app).delete(`/tickets/${ticketId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe('Ticket deleted successfully');

    // Verify deletion
    const verifyRes = await request(app).get(`/tickets/${ticketId}`);
    expect(verifyRes.status).toBe(404);
  });

  // INT-02: Bulk import + classify
  it('should handle bulk import via CSV and auto-classify', async () => {
    // Step 1: Import CSV
    const csvContent = `customer_id,customer_email,customer_name,subject,description,category,priority
CUST001,user1@example.com,User One,Cannot login to account,I forgot my password and cannot access my account login page,other,medium
CUST002,user2@example.com,User Two,Invoice and billing question,I have a question about my invoice and need a refund for the charge,other,medium
CUST003,user3@example.com,User Three,Feature request for dark mode,Would like to suggest adding dark mode feature to the app,other,medium`;

    const importRes = await request(app)
      .post('/tickets/import')
      .attach('file', Buffer.from(csvContent), 'tickets.csv');

    expect(importRes.status).toBe(200);
    expect(importRes.body.summary.total).toBe(3);
    expect(importRes.body.summary.successful).toBe(3);
    expect(importRes.body.summary.failed).toBe(0);
    expect(importRes.body.created_ids).toHaveLength(3);

    // Step 2: Auto-classify each ticket
    const classifyPromises = importRes.body.created_ids.map((id: string) =>
      request(app).post(`/tickets/${id}/auto-classify`)
    );

    const classifyResults = await Promise.all(classifyPromises);

    classifyResults.forEach(res => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('category');
      expect(res.body).toHaveProperty('priority');
    });

    // Step 3: Verify classifications were applied
    const listRes = await request(app).get('/tickets');
    expect(listRes.body.count).toBe(3);

    // First ticket should be account_access (login keywords)
    const accountTicket = listRes.body.tickets.find(
      (t: { customer_id: string }) => t.customer_id === 'CUST001'
    );
    expect(accountTicket.category).toBe(Category.ACCOUNT_ACCESS);

    // Second ticket should be billing_question (payment/billing keywords)
    const billingTicket = listRes.body.tickets.find(
      (t: { customer_id: string }) => t.customer_id === 'CUST002'
    );
    expect(billingTicket.category).toBe(Category.BILLING_QUESTION);

    // Third ticket should be feature_request
    const featureTicket = listRes.body.tickets.find(
      (t: { customer_id: string }) => t.customer_id === 'CUST003'
    );
    expect(featureTicket.category).toBe(Category.FEATURE_REQUEST);
  });

  // INT-03: Classification history tracking
  it('should track classification history through multiple classifications', async () => {
    // Step 1: Create ticket
    const createRes = await request(app)
      .post('/tickets')
      .send(createValidTicketData({
        subject: 'Generic issue',
        description: 'This is a generic issue that needs classification',
        category: Category.OTHER,
        priority: Priority.MEDIUM
      }));

    const ticketId = createRes.body.id;

    // Step 2: First classification
    await request(app).post(`/tickets/${ticketId}/auto-classify`);

    // Step 3: Update ticket with new content and reclassify
    await request(app)
      .put(`/tickets/${ticketId}`)
      .send({
        subject: 'Critical login failure - URGENT',
        description: 'Cannot login to my account. This is an emergency situation affecting production.'
      });

    await request(app).post(`/tickets/${ticketId}/auto-classify`);

    // Step 4: Get classification history
    const historyRes = await request(app).get(`/tickets/${ticketId}/classification-history`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.ticket_id).toBe(ticketId);
    expect(historyRes.body.history).toHaveLength(2);
    expect(historyRes.body.history[0]).toHaveProperty('timestamp');
    expect(historyRes.body.history[0]).toHaveProperty('new_category');
    expect(historyRes.body.history[0]).toHaveProperty('new_priority');
    expect(historyRes.body.history[0]).toHaveProperty('category_confidence');
    expect(historyRes.body.history[0]).toHaveProperty('priority_confidence');
  });

  // INT-04: Multi-filter query
  it('should filter tickets by multiple criteria', async () => {
    // Create tickets with various categories and priorities
    const ticketConfigs = [
      { category: Category.BILLING_QUESTION, priority: Priority.HIGH, customer_id: 'CUST001' },
      { category: Category.BILLING_QUESTION, priority: Priority.HIGH, customer_id: 'CUST002' },
      { category: Category.BILLING_QUESTION, priority: Priority.MEDIUM, customer_id: 'CUST003' },
      { category: Category.TECHNICAL_ISSUE, priority: Priority.HIGH, customer_id: 'CUST004' },
      { category: Category.ACCOUNT_ACCESS, priority: Priority.URGENT, customer_id: 'CUST005' }
    ];

    for (const config of ticketConfigs) {
      await request(app)
        .post('/tickets')
        .send(createValidTicketData(config));
    }

    // Filter by category only
    const categoryRes = await request(app).get('/tickets?category=billing_question');
    expect(categoryRes.body.count).toBe(3);

    // Filter by priority only
    const priorityRes = await request(app).get('/tickets?priority=high');
    expect(priorityRes.body.count).toBe(3);

    // Filter by both category and priority
    const combinedRes = await request(app).get('/tickets?category=billing_question&priority=high');
    expect(combinedRes.body.count).toBe(2);
    combinedRes.body.tickets.forEach((ticket: { category: Category; priority: Priority }) => {
      expect(ticket.category).toBe(Category.BILLING_QUESTION);
      expect(ticket.priority).toBe(Priority.HIGH);
    });

    // Filter by status
    const statusRes = await request(app).get('/tickets?status=new');
    expect(statusRes.body.count).toBe(5);

    // Filter by customer_id
    const customerRes = await request(app).get('/tickets?customer_id=CUST001');
    expect(customerRes.body.count).toBe(1);
    expect(customerRes.body.tickets[0].customer_id).toBe('CUST001');
  });

  // INT-05: Concurrent ticket creation
  it('should handle concurrent ticket creation without race conditions', async () => {
    const concurrentCount = 20;

    // Create 20 tickets in parallel
    const promises = Array(concurrentCount).fill(null).map((_, index) =>
      request(app)
        .post('/tickets')
        .send(createValidTicketData({
          customer_id: `CUST${index.toString().padStart(3, '0')}`,
          customer_email: `user${index}@example.com`,
          subject: `Concurrent ticket ${index}`,
          description: `This is concurrent ticket number ${index} for testing purposes`
        }))
    );

    const results = await Promise.all(promises);

    // All requests should succeed
    results.forEach((res, index) => {
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.customer_id).toBe(`CUST${index.toString().padStart(3, '0')}`);
    });

    // Verify all tickets were created
    const listRes = await request(app).get('/tickets');
    expect(listRes.body.count).toBe(concurrentCount);

    // Verify all IDs are unique
    const ids = results.map(res => res.body.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(concurrentCount);
  });

  describe('Error Handling Integration', () => {
    it('should handle import with mixed valid and invalid records', async () => {
      const csvContent = `customer_id,customer_email,customer_name,subject,description,category,priority
CUST001,valid@example.com,Valid User,Valid Subject,This is a valid description with enough characters,technical_issue,medium
CUST002,invalid-email,Invalid User,Invalid,Short,technical_issue,high
CUST003,valid2@example.com,Valid User 2,Another Valid,This is another valid description with enough chars,billing_question,low`;

      const res = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from(csvContent), 'mixed.csv');

      expect(res.status).toBe(200);
      expect(res.body.summary.total).toBe(3);
      expect(res.body.summary.successful).toBe(2);
      expect(res.body.summary.failed).toBe(1);
      expect(res.body.errors).toHaveLength(1);
      expect(res.body.errors[0].row).toBe(2);
    });

    it('should handle JSON import format', async () => {
      const jsonContent = JSON.stringify([
        {
          customer_id: 'CUST001',
          customer_email: 'test@example.com',
          customer_name: 'Test User',
          subject: 'JSON Import Test',
          description: 'Testing JSON import functionality with valid data',
          category: 'technical_issue',
          priority: 'medium'
        }
      ]);

      const res = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from(jsonContent), 'tickets.json');

      expect(res.status).toBe(200);
      expect(res.body.summary.successful).toBe(1);
    });

    it('should return 400 when no file is uploaded', async () => {
      const res = await request(app)
        .post('/tickets/import')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });
  });

  describe('Auto-Classification on Create', () => {
    it('should auto-classify ticket when auto_classify=true on creation', async () => {
      const res = await request(app)
        .post('/tickets?auto_classify=true')
        .send(createValidTicketData({
          subject: 'URGENT: Production system down',
          description: 'Critical emergency - our production server is completely down and we cannot access it!',
          category: Category.OTHER,
          priority: Priority.MEDIUM
        }));

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('ticket');
      expect(res.body).toHaveProperty('classification');

      // The classification should have detected urgent priority
      expect(res.body.ticket.priority).toBe(Priority.URGENT);
      expect(res.body.classification.priority.priority).toBe(Priority.URGENT);
    });
  });
});
