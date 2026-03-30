import { ParsedTicketData } from '../types';

export function parseJSON(content: string): ParsedTicketData[] {
  if (!content || content.trim() === '') {
    throw new Error('JSON content is empty');
  }

  try {
    const parsed = JSON.parse(content);

    // Handle single ticket object
    if (!Array.isArray(parsed)) {
      if (typeof parsed === 'object' && parsed !== null) {
        return [mapToTicketData(parsed)];
      }
      throw new Error('Invalid JSON structure: expected object or array');
    }

    // Handle array of tickets
    if (parsed.length === 0) {
      throw new Error('No records found in JSON');
    }

    return parsed.map((item: unknown) => {
      if (typeof item !== 'object' || item === null) {
        throw new Error('Invalid JSON structure: array items must be objects');
      }
      return mapToTicketData(item as Record<string, unknown>);
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON syntax: ${error.message}`);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to parse JSON: Unknown error');
  }
}

function mapToTicketData(obj: Record<string, unknown>): ParsedTicketData {
  const parsed: ParsedTicketData = {
    customer_id: typeof obj.customer_id === 'string' ? obj.customer_id : undefined,
    customer_email: typeof obj.customer_email === 'string' ? obj.customer_email : undefined,
    customer_name: typeof obj.customer_name === 'string' ? obj.customer_name : undefined,
    subject: typeof obj.subject === 'string' ? obj.subject : undefined,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    category: typeof obj.category === 'string' ? obj.category : undefined,
    priority: typeof obj.priority === 'string' ? obj.priority : undefined,
    status: typeof obj.status === 'string' ? obj.status : undefined,
    assigned_to: typeof obj.assigned_to === 'string' ? obj.assigned_to : undefined
  };

  // Parse tags
  if (Array.isArray(obj.tags)) {
    parsed.tags = obj.tags.filter((tag): tag is string => typeof tag === 'string');
  } else if (typeof obj.tags === 'string') {
    parsed.tags = obj.tags.split(',').map(tag => tag.trim()).filter(Boolean);
  }

  // Parse metadata
  if (typeof obj.metadata === 'object' && obj.metadata !== null) {
    const meta = obj.metadata as Record<string, unknown>;
    parsed.metadata = {
      source: typeof meta.source === 'string' ? meta.source : undefined,
      browser: typeof meta.browser === 'string' ? meta.browser : undefined,
      device_type: typeof meta.device_type === 'string' ? meta.device_type : undefined
    };
  }

  return parsed;
}
