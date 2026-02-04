import request from 'supertest';
import app from '../src/app';
import { store } from '../src/store/inMemoryStore';
import { classificationLogger } from '../src/utils/logger';
import {
  createValidTicketData,
  clearStore,
  createTicketInStore,
  generateNonExistentId
} from './helpers/testUtils';
import { Category, Priority, Status } from '../src/types';

describe('Ticket API', () => {
  beforeEach(() => {
    clearStore();
  });

  describe('POST /tickets', () => {
    // API-01: Create ticket with valid data
    it('should create ticket with valid data', async () => {
      const ticketData = createValidTicketData();

      const response = await request(app)
        .post('/tickets')
        .send(ticketData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.customer_id).toBe(ticketData.customer_id);
      expect(response.body.customer_email).toBe(ticketData.customer_email);
      expect(response.body.subject).toBe(ticketData.subject);
      expect(response.body.status).toBe(Status.NEW);
    });

    // API-02: Create ticket with auto-classify flag
    it('should create ticket with auto-classify and return classification result', async () => {
      const ticketData = createValidTicketData({
        subject: "Can't login to my account",
        description: 'URGENT: I forgot my password and cannot access my account. This is critical!',
        category: Category.OTHER,
        priority: Priority.MEDIUM
      });

      const response = await request(app)
        .post('/tickets?auto_classify=true')
        .send(ticketData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('ticket');
      expect(response.body).toHaveProperty('classification');
      expect(response.body.ticket).toHaveProperty('id');
      expect(response.body.classification).toHaveProperty('category');
      expect(response.body.classification).toHaveProperty('priority');
      expect(response.body.classification.category).toHaveProperty('confidence');
    });

    // API-03: Return 400 for invalid email
    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/tickets')
        .send({ ...createValidTicketData(), customer_email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.errors).toContain('Invalid email format');
    });

    // API-04: Return 400 for missing required field
    it('should return 400 for missing required field (customer_id)', async () => {
      const { customer_id: _cid, ...ticketWithoutCustomerId } = createValidTicketData();

      const response = await request(app)
        .post('/tickets')
        .send(ticketWithoutCustomerId);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error).toHaveProperty('details');
    });
  });

  describe('GET /tickets/:id', () => {
    // API-05: Get existing ticket by ID
    it('should get existing ticket by ID', async () => {
      const { id, ticket } = createTicketInStore();

      const response = await request(app).get(`/tickets/${id}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(id);
      expect(response.body.customer_id).toBe(ticket.customer_id);
      expect(response.body.subject).toBe(ticket.subject);
    });

    // API-06: Return 404 for non-existent ticket
    it('should return 404 for non-existent ticket', async () => {
      const nonExistentId = generateNonExistentId();

      const response = await request(app).get(`/tickets/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /tickets', () => {
    // API-07: List all tickets
    it('should list all tickets', async () => {
      createTicketInStore({ customer_id: 'CUST001' });
      createTicketInStore({ customer_id: 'CUST002' });
      createTicketInStore({ customer_id: 'CUST003' });

      const response = await request(app).get('/tickets');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tickets');
      expect(response.body).toHaveProperty('count');
      expect(response.body.tickets).toHaveLength(3);
      expect(response.body.count).toBe(3);
    });

    // API-08: Filter tickets by category
    it('should filter tickets by category', async () => {
      createTicketInStore({ category: Category.BILLING_QUESTION, customer_id: 'CUST001' });
      createTicketInStore({ category: Category.BILLING_QUESTION, customer_id: 'CUST002' });
      createTicketInStore({ category: Category.TECHNICAL_ISSUE, customer_id: 'CUST003' });

      const response = await request(app).get('/tickets?category=billing_question');

      expect(response.status).toBe(200);
      expect(response.body.tickets).toHaveLength(2);
      expect(response.body.count).toBe(2);
      response.body.tickets.forEach((ticket: { category: Category }) => {
        expect(ticket.category).toBe(Category.BILLING_QUESTION);
      });
    });

    it('should filter tickets by priority', async () => {
      createTicketInStore({ priority: Priority.HIGH, customer_id: 'CUST001' });
      createTicketInStore({ priority: Priority.HIGH, customer_id: 'CUST002' });
      createTicketInStore({ priority: Priority.LOW, customer_id: 'CUST003' });

      const response = await request(app).get('/tickets?priority=high');

      expect(response.status).toBe(200);
      expect(response.body.tickets).toHaveLength(2);
      response.body.tickets.forEach((ticket: { priority: Priority }) => {
        expect(ticket.priority).toBe(Priority.HIGH);
      });
    });

    it('should filter tickets by status', async () => {
      createTicketInStore({ status: Status.IN_PROGRESS, customer_id: 'CUST001' });
      createTicketInStore({ status: Status.NEW, customer_id: 'CUST002' });

      const response = await request(app).get('/tickets?status=in_progress');

      expect(response.status).toBe(200);
      expect(response.body.tickets).toHaveLength(1);
      expect(response.body.tickets[0].status).toBe(Status.IN_PROGRESS);
    });

    it('should filter tickets by assigned_to', async () => {
      createTicketInStore({ assigned_to: 'agent-1', customer_id: 'CUST001' });
      createTicketInStore({ assigned_to: 'agent-2', customer_id: 'CUST002' });
      createTicketInStore({ customer_id: 'CUST003' }); // No assigned_to

      const response = await request(app).get('/tickets?assigned_to=agent-1');

      expect(response.status).toBe(200);
      expect(response.body.tickets).toHaveLength(1);
      expect(response.body.tickets[0].assigned_to).toBe('agent-1');
    });

    it('should ignore invalid filter values', async () => {
      createTicketInStore({ category: Category.BILLING_QUESTION, customer_id: 'CUST001' });
      createTicketInStore({ category: Category.TECHNICAL_ISSUE, customer_id: 'CUST002' });

      // Invalid category should be ignored and return all tickets
      const response = await request(app).get('/tickets?category=invalid_category');

      expect(response.status).toBe(200);
      expect(response.body.tickets).toHaveLength(2);
    });
  });

  describe('PUT /tickets/:id', () => {
    // API-09: Update ticket successfully
    it('should update ticket successfully', async () => {
      const { id } = createTicketInStore();
      const originalTicket = store.findById(id);
      const originalUpdatedAt = originalTicket!.updated_at;

      // Small delay to ensure updated_at changes
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .put(`/tickets/${id}`)
        .send({ status: Status.IN_PROGRESS, assigned_to: 'agent-1' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(Status.IN_PROGRESS);
      expect(response.body.assigned_to).toBe('agent-1');
      expect(new Date(response.body.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });

    it('should return 404 when updating non-existent ticket', async () => {
      const nonExistentId = generateNonExistentId();

      const response = await request(app)
        .put(`/tickets/${nonExistentId}`)
        .send({ status: Status.IN_PROGRESS });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /tickets/:id', () => {
    // API-10: Delete ticket successfully
    it('should delete ticket successfully', async () => {
      const { id } = createTicketInStore();

      const response = await request(app).delete(`/tickets/${id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Ticket deleted successfully');
      expect(response.body.id).toBe(id);

      // Verify ticket is actually deleted
      const getResponse = await request(app).get(`/tickets/${id}`);
      expect(getResponse.status).toBe(404);
    });

    // API-11: Return 404 deleting non-existent ticket
    it('should return 404 when deleting non-existent ticket', async () => {
      const nonExistentId = generateNonExistentId();

      const response = await request(app).delete(`/tickets/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /tickets/:id/auto-classify', () => {
    it('should auto-classify an existing ticket', async () => {
      const { id } = createTicketInStore({
        subject: 'Password reset not working',
        description: 'I cannot login to my account. The password reset email is not arriving.',
        category: Category.OTHER,
        priority: Priority.MEDIUM
      });

      const response = await request(app).post(`/tickets/${id}/auto-classify`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ticket_id');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('priority');
      expect(response.body.category.category).toBe(Category.ACCOUNT_ACCESS);
    });

    it('should return 404 for non-existent ticket', async () => {
      const nonExistentId = generateNonExistentId();

      const response = await request(app).post(`/tickets/${nonExistentId}/auto-classify`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /tickets/:id/classification-history', () => {
    it('should get classification history for a ticket', async () => {
      const { id } = createTicketInStore({
        subject: 'Critical system error',
        description: 'Production is down. This is an emergency situation.',
        category: Category.OTHER,
        priority: Priority.MEDIUM
      });

      // Classify the ticket first
      await request(app).post(`/tickets/${id}/auto-classify`);

      const response = await request(app).get(`/tickets/${id}/classification-history`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ticket_id');
      expect(response.body).toHaveProperty('history');
      expect(Array.isArray(response.body.history)).toBe(true);
      expect(response.body.history.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for non-existent ticket', async () => {
      const nonExistentId = generateNonExistentId();

      const response = await request(app).get(`/tickets/${nonExistentId}/classification-history`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
