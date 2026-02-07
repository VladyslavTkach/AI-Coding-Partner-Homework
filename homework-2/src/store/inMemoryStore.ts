import { Ticket, UpdateTicketDTO, TicketFilters, Status } from '../types';

class InMemoryStore {
  private static instance: InMemoryStore;
  private tickets: Map<string, Ticket> = new Map();

  private constructor() {}

  public static getInstance(): InMemoryStore {
    if (!InMemoryStore.instance) {
      InMemoryStore.instance = new InMemoryStore();
    }
    return InMemoryStore.instance;
  }

  public create(ticket: Ticket): Ticket {
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  public findAll(filters?: TicketFilters): Ticket[] {
    let results = Array.from(this.tickets.values());

    if (filters) {
      if (filters.category) {
        results = results.filter(t => t.category === filters.category);
      }
      if (filters.priority) {
        results = results.filter(t => t.priority === filters.priority);
      }
      if (filters.status) {
        results = results.filter(t => t.status === filters.status);
      }
      if (filters.customer_id) {
        results = results.filter(t => t.customer_id === filters.customer_id);
      }
      if (filters.assigned_to) {
        results = results.filter(t => t.assigned_to === filters.assigned_to);
      }
    }

    return results;
  }

  public findById(id: string): Ticket | null {
    return this.tickets.get(id) ?? null;
  }

  public update(id: string, data: UpdateTicketDTO): Ticket | null {
    const ticket = this.tickets.get(id);
    if (!ticket) {
      return null;
    }

    const updatedTicket: Ticket = {
      ...ticket,
      ...data,
      updated_at: new Date(),
      resolved_at: data.status === Status.RESOLVED && !ticket.resolved_at
        ? new Date()
        : ticket.resolved_at
    };

    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  public delete(id: string): boolean {
    return this.tickets.delete(id);
  }

  public clear(): void {
    this.tickets.clear();
  }

  public count(): number {
    return this.tickets.size;
  }
}

export const store = InMemoryStore.getInstance();
