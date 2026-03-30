import { parse } from 'csv-parse/sync';
import { ParsedTicketData } from '../types';

export function parseCSV(content: string): ParsedTicketData[] {
  if (!content || content.trim() === '') {
    throw new Error('CSV content is empty');
  }

  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });

    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('No records found in CSV');
    }

    return records.map((record: Record<string, string>) => {
      const parsed: ParsedTicketData = {
        customer_id: record.customer_id || undefined,
        customer_email: record.customer_email || undefined,
        customer_name: record.customer_name || undefined,
        subject: record.subject || undefined,
        description: record.description || undefined,
        category: record.category || undefined,
        priority: record.priority || undefined,
        status: record.status || undefined,
        assigned_to: record.assigned_to || undefined
      };

      // Parse tags (comma-separated in CSV)
      if (record.tags) {
        parsed.tags = record.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
      }

      // Parse metadata fields
      if (record.source || record.browser || record.device_type) {
        parsed.metadata = {
          source: record.source || undefined,
          browser: record.browser || undefined,
          device_type: record.device_type || undefined
        };
      }

      return parsed;
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('CSV')) {
        throw error;
      }
      throw new Error(`Failed to parse CSV: ${error.message}`);
    }
    throw new Error('Failed to parse CSV: Unknown error');
  }
}
