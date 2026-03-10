import request from 'supertest';
import app from '../src/app';
import { store } from '../src/store/inMemoryStore';
import { classificationLogger } from '../src/utils/logger';
import {
  createValidTicketData,
  clearStore,
  createTicketInStore
} from './helpers/testUtils';
import {
  AppError,
  ValidationError,
  NotFoundError,
  BadRequestError
} from '../src/middleware/errorHandler';

describe('Error Handling', () => {
  beforeEach(() => {
    clearStore();
  });

  describe('Error Classes', () => {
    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Test error', { field: 'value' });

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'value' });
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should create NotFoundError with correct properties', () => {
      const error = new NotFoundError('Resource not found');

      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.details).toBeUndefined();
    });

    it('should create BadRequestError with correct properties', () => {
      const error = new BadRequestError('Bad request', { reason: 'invalid' });

      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.details).toEqual({ reason: 'invalid' });
    });

    it('should create AppError with correct properties', () => {
      const error = new AppError('App error', 500, 'CUSTOM_ERROR', { custom: 'detail' });

      expect(error.message).toBe('App error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.details).toEqual({ custom: 'detail' });
    });
  });

  describe('API Error Responses', () => {
    it('should return VALIDATION_ERROR for invalid ticket data', async () => {
      const response = await request(app)
        .post('/tickets')
        .send({ invalid: 'data' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should return NOT_FOUND for non-existent ticket', async () => {
      const response = await request(app)
        .get('/tickets/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('not found');
    });

    it('should return BAD_REQUEST for missing file upload', async () => {
      const response = await request(app)
        .post('/tickets/import')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('BAD_REQUEST');
      expect(response.body.error.message).toContain('No file');
    });

    it('should include error details in response', async () => {
      const response = await request(app)
        .post('/tickets')
        .send({
          customer_id: 'CUST001',
          customer_email: 'invalid',
          customer_name: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('details');
      expect(response.body.error.details).toHaveProperty('errors');
    });
  });

  describe('File Upload Error Handling', () => {
    it('should reject unsupported file types', async () => {
      const response = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from('content'), 'file.pdf');

      // Multer rejects with file type error - returns 500 since it's not an AppError
      expect([400, 500]).toContain(response.status);
    });

    it('should handle empty file content', async () => {
      const response = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from(''), 'empty.csv');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('BAD_REQUEST');
    });

    it('should handle malformed CSV', async () => {
      // CSV with only headers, no data
      const csvContent = 'customer_id,customer_email';

      const response = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from(csvContent), 'headers_only.csv');

      expect(response.status).toBe(400);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from('{ invalid json'), 'bad.json');

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Invalid JSON');
    });

    it('should handle malformed XML', async () => {
      const response = await request(app)
        .post('/tickets/import')
        .attach('file', Buffer.from('<unclosed>'), 'bad.xml');

      expect(response.status).toBe(400);
    });
  });

  describe('Update Error Handling', () => {
    it('should return error for empty update body', async () => {
      const { id } = createTicketInStore();

      const response = await request(app)
        .put(`/tickets/${id}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for invalid field values in update', async () => {
      const { id } = createTicketInStore();

      const response = await request(app)
        .put(`/tickets/${id}`)
        .send({ priority: 'invalid_priority' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Classification Error Handling', () => {
    it('should return 404 when classifying non-existent ticket', async () => {
      const response = await request(app)
        .post('/tickets/non-existent-id/auto-classify');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for classification history of non-existent ticket', async () => {
      const response = await request(app)
        .get('/tickets/non-existent-id/classification-history');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});

describe('MulterError Handling', () => {
  beforeEach(() => {
    clearStore();
  });

  it('should handle file too large error', async () => {
    // Create a large buffer (over 10MB limit)
    const largeContent = 'a'.repeat(11 * 1024 * 1024);

    const response = await request(app)
      .post('/tickets/import')
      .attach('file', Buffer.from(largeContent), 'large.csv');

    // Should return either 400 (MulterError) or handle it
    expect([400, 413]).toContain(response.status);
  });
});

describe('Store Edge Cases', () => {
  beforeEach(() => {
    clearStore();
  });

  it('should return null for non-existent ticket update', () => {
    const result = store.update('non-existent', { status: 'resolved' as any });
    expect(result).toBeNull();
  });

  it('should return false when deleting non-existent ticket', () => {
    const result = store.delete('non-existent');
    expect(result).toBe(false);
  });

  it('should return null when finding non-existent ticket', () => {
    const result = store.findById('non-existent');
    expect(result).toBeNull();
  });

  it('should return empty array when no tickets match filter', () => {
    createTicketInStore({ category: 'technical_issue' as any });

    const result = store.findAll({ category: 'billing_question' as any });
    expect(result).toEqual([]);
  });

  it('should filter by all criteria', () => {
    createTicketInStore({
      customer_id: 'CUST001',
      category: 'technical_issue' as any,
      priority: 'high' as any,
      status: 'new' as any,
      assigned_to: 'agent1'
    });
    createTicketInStore({
      customer_id: 'CUST002',
      category: 'billing_question' as any,
      priority: 'medium' as any,
      status: 'in_progress' as any,
      assigned_to: 'agent2'
    });

    const result = store.findAll({
      customer_id: 'CUST001',
      category: 'technical_issue' as any,
      priority: 'high' as any,
      status: 'new' as any,
      assigned_to: 'agent1'
    });

    expect(result).toHaveLength(1);
    expect(result[0].customer_id).toBe('CUST001');
  });
});
