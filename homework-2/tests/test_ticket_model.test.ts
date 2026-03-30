import { validateTicket, validatePartialTicket } from '../src/validators/ticketValidator';
import { createTicket } from '../src/models/ticket';
import { createValidTicketData, createInvalidTicketData } from './helpers/testUtils';
import { Category, Priority, Status, Source, DeviceType } from '../src/types';

describe('Ticket Validation', () => {
  // VAL-01: Valid ticket passes all validations
  it('should pass validation with valid data', () => {
    const { error, value } = validateTicket(createValidTicketData());

    expect(error).toBeUndefined();
    expect(value).toBeDefined();
    expect(value.customer_id).toBe('CUST001');
    expect(value.customer_email).toBe('test@example.com');
  });

  // VAL-02: Invalid email format rejected
  it('should reject invalid email format', () => {
    const { error } = validateTicket(createInvalidTicketData('email'));

    expect(error).toBeDefined();
    expect(error!.details[0].message).toContain('email');
  });

  // VAL-03: Missing customer_id rejected
  it('should reject missing customer_id', () => {
    const { error } = validateTicket(createInvalidTicketData('missing_customer_id'));

    expect(error).toBeDefined();
    expect(error!.details.some(d => d.message.includes('customer_id'))).toBe(true);
  });

  // VAL-04: Empty subject rejected
  it('should reject empty subject', () => {
    const { error } = validateTicket(createInvalidTicketData('subject_empty'));

    expect(error).toBeDefined();
    expect(error!.details.some(d => d.message.toLowerCase().includes('subject'))).toBe(true);
  });

  // VAL-05: Subject exceeding 200 chars rejected
  it('should reject subject exceeding 200 characters', () => {
    const { error } = validateTicket(createInvalidTicketData('subject_long'));

    expect(error).toBeDefined();
    expect(error!.details.some(d => d.message.includes('200'))).toBe(true);
  });

  // VAL-06: Description under 10 chars rejected
  it('should reject description under 10 characters', () => {
    const { error } = validateTicket(createInvalidTicketData('description_short'));

    expect(error).toBeDefined();
    expect(error!.details.some(d => d.message.includes('10'))).toBe(true);
  });

  // VAL-07: Invalid category enum rejected
  it('should reject invalid category enum', () => {
    const { error } = validateTicket(createInvalidTicketData('category'));

    expect(error).toBeDefined();
    expect(error!.details.some(d => d.message.toLowerCase().includes('category'))).toBe(true);
  });

  // VAL-08: Invalid priority enum rejected
  it('should reject invalid priority enum', () => {
    const { error } = validateTicket(createInvalidTicketData('priority'));

    expect(error).toBeDefined();
    expect(error!.details.some(d => d.message.toLowerCase().includes('priority'))).toBe(true);
  });

  // VAL-09: Optional fields accepted as undefined
  it('should accept data with only required fields', () => {
    const minimalData = {
      customer_id: 'CUST001',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      subject: 'Test Subject',
      description: 'This is a valid description with enough characters',
      category: Category.OTHER,
      priority: Priority.MEDIUM
    };

    const { error, value } = validateTicket(minimalData);

    expect(error).toBeUndefined();
    expect(value).toBeDefined();
    expect(value.tags).toBeUndefined();
    expect(value.metadata).toBeUndefined();
    expect(value.assigned_to).toBeUndefined();
  });

  describe('Optional Fields Validation', () => {
    it('should accept valid tags array', () => {
      const data = createValidTicketData({ tags: ['tag1', 'tag2', 'tag3'] });
      const { error, value } = validateTicket(data);

      expect(error).toBeUndefined();
      expect(value.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should accept valid metadata', () => {
      const data = createValidTicketData({
        metadata: {
          source: Source.WEB_FORM,
          browser: 'Chrome 120',
          device_type: DeviceType.DESKTOP
        }
      });
      const { error, value } = validateTicket(data);

      expect(error).toBeUndefined();
      expect(value.metadata?.source).toBe(Source.WEB_FORM);
      expect(value.metadata?.browser).toBe('Chrome 120');
      expect(value.metadata?.device_type).toBe(DeviceType.DESKTOP);
    });

    it('should accept valid status', () => {
      const data = createValidTicketData({ status: Status.IN_PROGRESS });
      const { error, value } = validateTicket(data);

      expect(error).toBeUndefined();
      expect(value.status).toBe(Status.IN_PROGRESS);
    });

    it('should reject invalid status', () => {
      const data = { ...createValidTicketData(), status: 'invalid_status' };
      const { error } = validateTicket(data);

      expect(error).toBeDefined();
      expect(error!.details.some(d => d.message.toLowerCase().includes('status'))).toBe(true);
    });

    it('should accept null assigned_to', () => {
      const data = createValidTicketData({ assigned_to: null });
      const { error, value } = validateTicket(data);

      expect(error).toBeUndefined();
      expect(value.assigned_to).toBeNull();
    });
  });

  describe('Partial Update Validation', () => {
    it('should allow updating single field', () => {
      const { error, value } = validatePartialTicket({ status: Status.RESOLVED });

      expect(error).toBeUndefined();
      expect(value.status).toBe(Status.RESOLVED);
    });

    it('should allow updating multiple fields', () => {
      const { error, value } = validatePartialTicket({
        status: Status.IN_PROGRESS,
        assigned_to: 'agent-1',
        priority: Priority.HIGH
      });

      expect(error).toBeUndefined();
      expect(value.status).toBe(Status.IN_PROGRESS);
      expect(value.assigned_to).toBe('agent-1');
      expect(value.priority).toBe(Priority.HIGH);
    });

    it('should reject empty update', () => {
      const { error } = validatePartialTicket({});

      expect(error).toBeDefined();
      expect(error!.details[0].message).toContain('At least one field');
    });

    it('should reject invalid field values in partial update', () => {
      const { error } = validatePartialTicket({ customer_email: 'invalid-email' });

      expect(error).toBeDefined();
      expect(error!.details[0].message).toContain('email');
    });
  });
});

describe('Ticket Model Creation', () => {
  it('should create a ticket with all required fields', () => {
    const data = createValidTicketData();
    const ticket = createTicket(data);

    expect(ticket).toHaveProperty('id');
    expect(ticket.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(ticket.customer_id).toBe(data.customer_id);
    expect(ticket.customer_email).toBe(data.customer_email);
    expect(ticket.customer_name).toBe(data.customer_name);
    expect(ticket.subject).toBe(data.subject);
    expect(ticket.description).toBe(data.description);
    expect(ticket.category).toBe(data.category);
    expect(ticket.priority).toBe(data.priority);
  });

  it('should set default status to NEW', () => {
    const data = createValidTicketData();
    const ticket = createTicket(data);

    expect(ticket.status).toBe(Status.NEW);
  });

  it('should set created_at and updated_at to current time', () => {
    const before = new Date();
    const ticket = createTicket(createValidTicketData());
    const after = new Date();

    expect(ticket.created_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(ticket.created_at.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(ticket.updated_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(ticket.updated_at.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should set resolved_at to null', () => {
    const ticket = createTicket(createValidTicketData());

    expect(ticket.resolved_at).toBeNull();
  });

  it('should set assigned_to to null if not provided', () => {
    const ticket = createTicket(createValidTicketData());

    expect(ticket.assigned_to).toBeNull();
  });

  it('should set empty tags array if not provided', () => {
    const ticket = createTicket(createValidTicketData());

    expect(ticket.tags).toEqual([]);
  });

  it('should set empty metadata object if not provided', () => {
    const ticket = createTicket(createValidTicketData());

    expect(ticket.metadata).toEqual({});
  });

  it('should preserve provided optional fields', () => {
    const data = createValidTicketData({
      status: Status.IN_PROGRESS,
      assigned_to: 'agent-1',
      tags: ['urgent', 'login'],
      metadata: { source: Source.EMAIL, browser: 'Firefox' }
    });
    const ticket = createTicket(data);

    expect(ticket.status).toBe(Status.IN_PROGRESS);
    expect(ticket.assigned_to).toBe('agent-1');
    expect(ticket.tags).toEqual(['urgent', 'login']);
    expect(ticket.metadata.source).toBe(Source.EMAIL);
    expect(ticket.metadata.browser).toBe('Firefox');
  });
});
