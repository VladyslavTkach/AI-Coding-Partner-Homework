import { Request, Response, NextFunction } from 'express';
import {
  createNewTicket,
  importTicketsFromFile,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket
} from '../services/ticketService';
import { TicketFilters, Category, Priority, Status } from '../types';
import { BadRequestError } from '../middleware/errorHandler';

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ticket = createNewTicket(req.body);
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
}

export async function importTickets(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    const content = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;
    const contentType = req.file.mimetype;

    const result = await importTicketsFromFile(content, filename, contentType);

    res.status(200).json({
      summary: {
        total: result.total,
        successful: result.successful,
        failed: result.failed
      },
      errors: result.errors,
      created_ids: result.created_ids
    });
  } catch (error) {
    next(error);
  }
}

export function getAll(req: Request, res: Response): void {
  const filters: TicketFilters = {};

  if (req.query.category && Object.values(Category).includes(req.query.category as Category)) {
    filters.category = req.query.category as Category;
  }
  if (req.query.priority && Object.values(Priority).includes(req.query.priority as Priority)) {
    filters.priority = req.query.priority as Priority;
  }
  if (req.query.status && Object.values(Status).includes(req.query.status as Status)) {
    filters.status = req.query.status as Status;
  }
  if (req.query.customer_id && typeof req.query.customer_id === 'string') {
    filters.customer_id = req.query.customer_id;
  }
  if (req.query.assigned_to && typeof req.query.assigned_to === 'string') {
    filters.assigned_to = req.query.assigned_to;
  }

  const result = getAllTickets(Object.keys(filters).length > 0 ? filters : undefined);
  res.status(200).json(result);
}

export function getById(req: Request, res: Response, next: NextFunction): void {
  try {
    const ticket = getTicketById(req.params.id);
    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ticket = updateTicket(req.params.id, req.body);
    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
}

export function remove(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = deleteTicket(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
