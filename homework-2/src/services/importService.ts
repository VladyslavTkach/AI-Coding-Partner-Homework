import { parseCSV } from '../parsers/csvParser';
import { parseJSON } from '../parsers/jsonParser';
import { parseXML } from '../parsers/xmlParser';
import {
  ParsedTicketData,
  FileFormat,
  ImportResult,
  CreateTicketDTO,
  Category,
  Priority,
  Status,
  Source,
  DeviceType
} from '../types';
import { validateTicket } from '../validators/ticketValidator';
import { createTicket } from '../models/ticket';
import { store } from '../store/inMemoryStore';
import { BadRequestError } from '../middleware/errorHandler';

export function detectFileFormat(filename: string, contentType?: string): FileFormat {
  const extension = filename.toLowerCase().split('.').pop();

  if (contentType) {
    if (contentType.includes('csv') || contentType === 'text/csv') {
      return 'csv';
    }
    if (contentType.includes('json') || contentType === 'application/json') {
      return 'json';
    }
    if (contentType.includes('xml') || contentType === 'application/xml' || contentType === 'text/xml') {
      return 'xml';
    }
  }

  switch (extension) {
    case 'csv':
      return 'csv';
    case 'json':
      return 'json';
    case 'xml':
      return 'xml';
    default:
      throw new BadRequestError(`Unsupported file format: ${extension}`);
  }
}

export async function parseFile(content: string, format: FileFormat): Promise<ParsedTicketData[]> {
  switch (format) {
    case 'csv':
      return parseCSV(content);
    case 'json':
      return parseJSON(content);
    case 'xml':
      return parseXML(content);
    default:
      throw new BadRequestError(`Unsupported file format: ${format}`);
  }
}

function normalizeTicketData(data: ParsedTicketData): CreateTicketDTO {
  // Normalize category
  let category = Category.OTHER;
  if (data.category && Object.values(Category).includes(data.category as Category)) {
    category = data.category as Category;
  }

  // Normalize priority
  let priority = Priority.MEDIUM;
  if (data.priority && Object.values(Priority).includes(data.priority as Priority)) {
    priority = data.priority as Priority;
  }

  // Normalize status
  let status: Status | undefined;
  if (data.status && Object.values(Status).includes(data.status as Status)) {
    status = data.status as Status;
  }

  // Normalize tags
  let tags: string[] = [];
  if (Array.isArray(data.tags)) {
    tags = data.tags;
  } else if (typeof data.tags === 'string') {
    tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  // Normalize metadata
  const metadata: CreateTicketDTO['metadata'] = {};
  if (data.metadata) {
    if (data.metadata.source && Object.values(Source).includes(data.metadata.source as Source)) {
      metadata.source = data.metadata.source as Source;
    }
    if (data.metadata.browser) {
      metadata.browser = data.metadata.browser;
    }
    if (data.metadata.device_type && Object.values(DeviceType).includes(data.metadata.device_type as DeviceType)) {
      metadata.device_type = data.metadata.device_type as DeviceType;
    }
  }

  return {
    customer_id: data.customer_id ?? '',
    customer_email: data.customer_email ?? '',
    customer_name: data.customer_name ?? '',
    subject: data.subject ?? '',
    description: data.description ?? '',
    category,
    priority,
    status,
    assigned_to: data.assigned_to,
    tags,
    metadata
  };
}

export async function importTickets(content: string, format: FileFormat): Promise<ImportResult> {
  const result: ImportResult = {
    total: 0,
    successful: 0,
    failed: 0,
    errors: [],
    created_ids: []
  };

  try {
    const parsedData = await parseFile(content, format);
    result.total = parsedData.length;

    for (let i = 0; i < parsedData.length; i++) {
      const rowNumber = i + 1;
      const normalizedData = normalizeTicketData(parsedData[i]);
      const { error, value } = validateTicket(normalizedData);

      if (error) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          errors: error.details.map(d => d.message)
        });
        continue;
      }

      const ticket = createTicket(value);
      store.create(ticket);
      result.successful++;
      result.created_ids.push(ticket.id);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new BadRequestError(`Import failed: ${error.message}`);
    }
    throw new BadRequestError('Import failed: Unknown error');
  }

  return result;
}
