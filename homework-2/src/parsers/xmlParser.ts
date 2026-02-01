import { parseString } from 'xml2js';
import { ParsedTicketData } from '../types';

export function parseXML(content: string): Promise<ParsedTicketData[]> {
  return new Promise((resolve, reject) => {
    if (!content || content.trim() === '') {
      reject(new Error('XML content is empty'));
      return;
    }

    parseString(content, { explicitArray: false, trim: true }, (err, result) => {
      if (err) {
        reject(new Error(`Failed to parse XML: ${err.message}`));
        return;
      }

      try {
        const tickets = extractTickets(result);
        if (tickets.length === 0) {
          reject(new Error('No tickets found in XML'));
          return;
        }
        resolve(tickets);
      } catch (error) {
        if (error instanceof Error) {
          reject(error);
        } else {
          reject(new Error('Failed to extract tickets from XML'));
        }
      }
    });
  });
}

function extractTickets(result: unknown): ParsedTicketData[] {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid XML structure');
  }

  const root = result as Record<string, unknown>;

  // Try to find tickets in common structures: <tickets><ticket>...</ticket></tickets>
  // or <root><ticket>...</ticket></root>
  let ticketData: unknown[] = [];

  if (root.tickets && typeof root.tickets === 'object') {
    const ticketsContainer = root.tickets as Record<string, unknown>;
    if (Array.isArray(ticketsContainer.ticket)) {
      ticketData = ticketsContainer.ticket;
    } else if (ticketsContainer.ticket && typeof ticketsContainer.ticket === 'object') {
      ticketData = [ticketsContainer.ticket];
    }
  } else if (root.ticket) {
    if (Array.isArray(root.ticket)) {
      ticketData = root.ticket;
    } else {
      ticketData = [root.ticket];
    }
  } else {
    // Try to use the root element directly if it has ticket-like properties
    const firstKey = Object.keys(root)[0];
    if (firstKey && typeof root[firstKey] === 'object') {
      const container = root[firstKey] as Record<string, unknown>;
      if (container.ticket) {
        if (Array.isArray(container.ticket)) {
          ticketData = container.ticket;
        } else {
          ticketData = [container.ticket];
        }
      }
    }
  }

  return ticketData.map((item) => mapXmlToTicketData(item as Record<string, unknown>));
}

function mapXmlToTicketData(obj: Record<string, unknown>): ParsedTicketData {
  const getValue = (val: unknown): string | undefined => {
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val !== null && '_' in val) {
      return String((val as { _: unknown })._ );
    }
    if (val !== undefined && val !== null) return String(val);
    return undefined;
  };

  const parsed: ParsedTicketData = {
    customer_id: getValue(obj.customer_id),
    customer_email: getValue(obj.customer_email),
    customer_name: getValue(obj.customer_name),
    subject: getValue(obj.subject),
    description: getValue(obj.description),
    category: getValue(obj.category),
    priority: getValue(obj.priority),
    status: getValue(obj.status),
    assigned_to: getValue(obj.assigned_to)
  };

  // Parse tags
  if (obj.tags) {
    if (typeof obj.tags === 'object' && obj.tags !== null) {
      const tagsObj = obj.tags as Record<string, unknown>;
      if (Array.isArray(tagsObj.tag)) {
        parsed.tags = tagsObj.tag.map(t => getValue(t)).filter((t): t is string => t !== undefined);
      } else if (tagsObj.tag) {
        const tagValue = getValue(tagsObj.tag);
        parsed.tags = tagValue ? [tagValue] : [];
      }
    } else if (typeof obj.tags === 'string') {
      parsed.tags = obj.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  // Parse metadata
  if (obj.metadata && typeof obj.metadata === 'object') {
    const meta = obj.metadata as Record<string, unknown>;
    parsed.metadata = {
      source: getValue(meta.source),
      browser: getValue(meta.browser),
      device_type: getValue(meta.device_type)
    };
  }

  return parsed;
}
