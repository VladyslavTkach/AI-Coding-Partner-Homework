import {
  Ticket,
  ClassificationResult,
  ClassificationLogEntry,
  Category,
  Priority
} from '../types';
import { classifyCategory } from '../classifiers/categoryClassifier';
import { classifyPriority } from '../classifiers/priorityClassifier';
import { classificationLogger } from '../utils/logger';
import { store } from '../store/inMemoryStore';
import { NotFoundError } from '../middleware/errorHandler';

export class ClassificationService {
  /**
   * Classify a ticket and optionally apply the results
   */
  classifyTicket(ticket: Ticket, applyResults: boolean = true): ClassificationResult {
    const categoryResult = classifyCategory({
      subject: ticket.subject,
      description: ticket.description
    });

    const priorityResult = classifyPriority({
      subject: ticket.subject,
      description: ticket.description
    });

    const overallConfidence = this.calculateOverallConfidence(
      categoryResult.confidence,
      priorityResult.confidence
    );

    const result: ClassificationResult = {
      ticket_id: ticket.id,
      category: categoryResult,
      priority: priorityResult,
      overall_confidence: overallConfidence,
      classified_at: new Date(),
      auto_applied: applyResults
    };

    // Log the classification decision
    const logEntry: ClassificationLogEntry = {
      timestamp: new Date(),
      ticket_id: ticket.id,
      original_category: ticket.category,
      original_priority: ticket.priority,
      new_category: categoryResult.category,
      new_priority: priorityResult.priority,
      category_confidence: categoryResult.confidence,
      priority_confidence: priorityResult.confidence,
      keywords_found: [
        ...categoryResult.keywords_found,
        ...priorityResult.keywords_found
      ],
      reasoning: `Category: ${categoryResult.reasoning} Priority: ${priorityResult.reasoning}`,
      was_override: ticket.category !== Category.OTHER || ticket.priority !== Priority.MEDIUM
    };

    classificationLogger.log(logEntry);

    // Apply results to ticket if requested
    if (applyResults) {
      store.update(ticket.id, {
        category: categoryResult.category,
        priority: priorityResult.priority
      });
    }

    return result;
  }

  /**
   * Re-classify a ticket by ID
   */
  reclassifyTicket(ticketId: string, applyResults: boolean = true): ClassificationResult {
    const ticket = store.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError(`Ticket with id '${ticketId}' not found`);
    }

    return this.classifyTicket(ticket, applyResults);
  }

  /**
   * Get classification history for a ticket
   */
  getClassificationHistory(ticketId: string): ClassificationLogEntry[] {
    return classificationLogger.getLogsByTicketId(ticketId);
  }

  /**
   * Calculate overall confidence from category and priority confidence
   * Weighted average: category 60%, priority 40%
   */
  private calculateOverallConfidence(
    categoryConfidence: number,
    priorityConfidence: number
  ): number {
    const overall = categoryConfidence * 0.6 + priorityConfidence * 0.4;
    return Math.round(overall * 100) / 100;
  }
}

export const classificationService = new ClassificationService();
