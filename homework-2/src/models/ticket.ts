import { v4 as uuidv4 } from 'uuid';
import { Ticket, CreateTicketDTO, Status } from '../types';

export function createTicket(data: CreateTicketDTO): Ticket {
  const now = new Date();

  return {
    id: uuidv4(),
    customer_id: data.customer_id,
    customer_email: data.customer_email,
    customer_name: data.customer_name,
    subject: data.subject,
    description: data.description,
    category: data.category,
    priority: data.priority,
    status: data.status ?? Status.NEW,
    created_at: now,
    updated_at: now,
    resolved_at: null,
    assigned_to: data.assigned_to ?? null,
    tags: data.tags ?? [],
    metadata: data.metadata ?? {}
  };
}
