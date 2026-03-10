import { Request, Response, NextFunction } from 'express';
import { classificationService } from '../services/classificationService';
import { store } from '../store/inMemoryStore';
import { NotFoundError } from '../middleware/errorHandler';

export class ClassificationController {
  /**
   * POST /tickets/:id/auto-classify
   * Automatically classify a ticket
   */
  autoClassify = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if ticket exists
      const ticket = store.findById(id);
      if (!ticket) {
        throw new NotFoundError(`Ticket with id '${id}' not found`);
      }

      // Classify the ticket
      const result = classificationService.classifyTicket(ticket, true);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /tickets/:id/classification-history
   * Get classification history for a ticket
   */
  getHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      // Check if ticket exists
      const ticket = store.findById(id);
      if (!ticket) {
        throw new NotFoundError(`Ticket with id '${id}' not found`);
      }

      const history = classificationService.getClassificationHistory(id);

      res.status(200).json({
        ticket_id: id,
        history
      });
    } catch (error) {
      next(error);
    }
  };
}

export const classificationController = new ClassificationController();
