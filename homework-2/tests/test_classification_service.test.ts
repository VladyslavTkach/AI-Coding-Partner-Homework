import { classificationService, ClassificationService } from '../src/services/classificationService';
import { store } from '../src/store/inMemoryStore';
import { classificationLogger } from '../src/utils/logger';
import { createTicket } from '../src/models/ticket';
import { createValidTicketData, clearStore } from './helpers/testUtils';
import { Category, Priority } from '../src/types';
import { NotFoundError } from '../src/middleware/errorHandler';

describe('Classification Service', () => {
  beforeEach(() => {
    clearStore();
  });

  describe('classifyTicket', () => {
    it('should classify a ticket and apply results', () => {
      const ticketData = createValidTicketData({
        subject: 'Cannot login to my account',
        description: 'I forgot my password and cannot access my account',
        category: Category.OTHER,
        priority: Priority.MEDIUM
      });
      const ticket = createTicket(ticketData);
      store.create(ticket);

      const result = classificationService.classifyTicket(ticket, true);

      expect(result).toHaveProperty('ticket_id');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('priority');
      expect(result).toHaveProperty('overall_confidence');
      expect(result).toHaveProperty('classified_at');
      expect(result.auto_applied).toBe(true);

      // Verify ticket was updated
      const updatedTicket = store.findById(ticket.id);
      expect(updatedTicket?.category).toBe(result.category.category);
      expect(updatedTicket?.priority).toBe(result.priority.priority);
    });

    it('should classify a ticket without applying results', () => {
      const ticketData = createValidTicketData({
        subject: 'Payment issue',
        description: 'I need a refund for an invoice charge',
        category: Category.OTHER,
        priority: Priority.LOW
      });
      const ticket = createTicket(ticketData);
      store.create(ticket);

      const originalCategory = ticket.category;
      const originalPriority = ticket.priority;

      const result = classificationService.classifyTicket(ticket, false);

      expect(result.auto_applied).toBe(false);

      // Verify ticket was NOT updated
      const unchangedTicket = store.findById(ticket.id);
      expect(unchangedTicket?.category).toBe(originalCategory);
      expect(unchangedTicket?.priority).toBe(originalPriority);
    });

    it('should calculate overall confidence correctly', () => {
      const ticketData = createValidTicketData({
        subject: 'CRITICAL: Production system down',
        description: 'Emergency - our production server is completely down and we cannot access it at all'
      });
      const ticket = createTicket(ticketData);
      store.create(ticket);

      const result = classificationService.classifyTicket(ticket, false);

      // Overall confidence should be weighted: 60% category + 40% priority
      const expectedConfidence = result.category.confidence * 0.6 + result.priority.confidence * 0.4;
      expect(result.overall_confidence).toBeCloseTo(expectedConfidence, 2);
    });

    it('should log classification to history', () => {
      const ticketData = createValidTicketData({
        subject: 'Bug in the checkout',
        description: 'I found a bug that I can reproduce consistently'
      });
      const ticket = createTicket(ticketData);
      store.create(ticket);

      classificationService.classifyTicket(ticket, true);

      const history = classificationLogger.getLogsByTicketId(ticket.id);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].ticket_id).toBe(ticket.id);
    });

    it('should mark as override when original values differ from defaults', () => {
      const ticketData = createValidTicketData({
        subject: 'General question',
        description: 'I have a question about your services',
        category: Category.TECHNICAL_ISSUE, // Non-default category
        priority: Priority.HIGH // Non-default priority
      });
      const ticket = createTicket(ticketData);
      store.create(ticket);

      classificationService.classifyTicket(ticket, true);

      const history = classificationLogger.getLogsByTicketId(ticket.id);
      expect(history[0].was_override).toBe(true);
    });
  });

  describe('reclassifyTicket', () => {
    it('should reclassify an existing ticket by ID', () => {
      const ticketData = createValidTicketData({
        subject: 'Feature suggestion',
        description: 'I would like to suggest adding a new feature to improve the user experience'
      });
      const ticket = createTicket(ticketData);
      store.create(ticket);

      const result = classificationService.reclassifyTicket(ticket.id, true);

      expect(result).toHaveProperty('ticket_id');
      expect(result.ticket_id).toBe(ticket.id);
      expect(result.category.category).toBe(Category.FEATURE_REQUEST);
    });

    it('should throw NotFoundError for non-existent ticket', () => {
      expect(() => {
        classificationService.reclassifyTicket('non-existent-id', true);
      }).toThrow(NotFoundError);
    });

    it('should reclassify without applying results', () => {
      const ticketData = createValidTicketData({
        subject: 'Minor cosmetic issue',
        description: 'When you have time, there is a small issue that is not urgent'
      });
      const ticket = createTicket(ticketData);
      store.create(ticket);

      const result = classificationService.reclassifyTicket(ticket.id, false);

      expect(result.auto_applied).toBe(false);
    });
  });

  describe('getClassificationHistory', () => {
    it('should return empty array for ticket with no history', () => {
      const history = classificationService.getClassificationHistory('no-history-ticket');
      expect(history).toEqual([]);
    });

    it('should return classification history for ticket', () => {
      const ticketData = createValidTicketData({
        subject: 'Test ticket',
        description: 'This is a test ticket for checking classification history'
      });
      const ticket = createTicket(ticketData);
      store.create(ticket);

      // Classify multiple times
      classificationService.classifyTicket(ticket, true);
      classificationService.classifyTicket(ticket, true);

      const history = classificationService.getClassificationHistory(ticket.id);

      expect(history.length).toBeGreaterThanOrEqual(2);
      history.forEach(entry => {
        expect(entry.ticket_id).toBe(ticket.id);
      });
    });
  });

  describe('classification scenarios', () => {
    it('should classify account access ticket correctly', () => {
      const ticket = createTicket(createValidTicketData({
        subject: 'Password reset not working',
        description: 'I cannot login because my password reset is not working'
      }));
      store.create(ticket);

      const result = classificationService.classifyTicket(ticket, false);

      expect(result.category.category).toBe(Category.ACCOUNT_ACCESS);
      expect(result.category.keywords_found).toContain('login');
    });

    it('should classify technical issue correctly', () => {
      const ticket = createTicket(createValidTicketData({
        subject: 'Application crashes',
        description: 'The application keeps crashing with an error when I try to use it'
      }));
      store.create(ticket);

      const result = classificationService.classifyTicket(ticket, false);

      expect(result.category.category).toBe(Category.TECHNICAL_ISSUE);
    });

    it('should classify billing question correctly', () => {
      const ticket = createTicket(createValidTicketData({
        subject: 'Invoice question',
        description: 'I have a question about my invoice and the recent charges'
      }));
      store.create(ticket);

      const result = classificationService.classifyTicket(ticket, false);

      expect(result.category.category).toBe(Category.BILLING_QUESTION);
    });

    it('should classify urgent priority correctly', () => {
      const ticket = createTicket(createValidTicketData({
        subject: 'CRITICAL: Emergency',
        description: 'This is an urgent emergency that needs immediate attention ASAP'
      }));
      store.create(ticket);

      const result = classificationService.classifyTicket(ticket, false);

      expect(result.priority.priority).toBe(Priority.URGENT);
    });

    it('should classify low priority correctly', () => {
      const ticket = createTicket(createValidTicketData({
        subject: 'Minor suggestion',
        description: 'When you have time, no rush, this is just a minor enhancement idea'
      }));
      store.create(ticket);

      const result = classificationService.classifyTicket(ticket, false);

      expect(result.priority.priority).toBe(Priority.LOW);
    });
  });
});
