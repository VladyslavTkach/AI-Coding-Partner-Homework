import { store } from '../store/inMemoryStore';
import { createTicket } from '../models/ticket';
import { validateTicket, validatePartialTicket } from '../validators/ticketValidator';
import { importTickets, detectFileFormat } from './importService';
import {
  Ticket,
  CreateTicketDTO,
  UpdateTicketDTO,
  TicketFilters,
  ImportResult,
  FileFormat
} from '../types';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

export function createNewTicket(data: unknown): Ticket {
  const { error, value } = validateTicket(data);

  if (error) {
    throw new ValidationError('Validation failed', {
      errors: error.details.map(d => d.message)
    });
  }

  const ticket = createTicket(value);
  return store.create(ticket);
}

export async function importTicketsFromFile(
  content: string,
  filename: string,
  contentType?: string
): Promise<ImportResult> {
  const format = detectFileFormat(filename, contentType);
  return importTickets(content, format);
}

export async function importTicketsWithFormat(
  content: string,
  format: FileFormat
): Promise<ImportResult> {
  return importTickets(content, format);
}

export function getAllTickets(filters?: TicketFilters): { tickets: Ticket[]; count: number } {
  const tickets = store.findAll(filters);
  return {
    tickets,
    count: tickets.length
  };
}

export function getTicketById(id: string): Ticket {
  const ticket = store.findById(id);
  if (!ticket) {
    throw new NotFoundError(`Ticket with id '${id}' not found`);
  }
  return ticket;
}

export function updateTicket(id: string, data: unknown): Ticket {
  // Check if ticket exists
  const existingTicket = store.findById(id);
  if (!existingTicket) {
    throw new NotFoundError(`Ticket with id '${id}' not found`);
  }

  const { error, value } = validatePartialTicket(data);

  if (error) {
    throw new ValidationError('Validation failed', {
      errors: error.details.map(d => d.message)
    });
  }

  const updatedTicket = store.update(id, value);
  if (!updatedTicket) {
    throw new NotFoundError(`Ticket with id '${id}' not found`);
  }

  return updatedTicket;
}

export function deleteTicket(id: string): { message: string; id: string } {
  const ticket = store.findById(id);
  if (!ticket) {
    throw new NotFoundError(`Ticket with id '${id}' not found`);
  }

  store.delete(id);
  return {
    message: 'Ticket deleted successfully',
    id
  };
}
