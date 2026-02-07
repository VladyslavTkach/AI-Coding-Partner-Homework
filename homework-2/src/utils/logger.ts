import * as fs from 'fs';
import * as path from 'path';
import { ClassificationLogEntry } from '../types';

export class ClassificationLogger {
  private logFile: string;
  private logs: ClassificationLogEntry[] = [];

  constructor(logFile?: string) {
    this.logFile = logFile || path.join(process.cwd(), 'logs', 'classification.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(entry: ClassificationLogEntry): void {
    // Store in memory
    this.logs.push(entry);

    // Log to console
    console.log(`[CLASSIFICATION] Ticket ${entry.ticket_id}: ${entry.original_category || 'none'} → ${entry.new_category}, ${entry.original_priority || 'none'} → ${entry.new_priority}`);

    // Append to file
    try {
      const logLine = JSON.stringify({
        ...entry,
        timestamp: entry.timestamp.toISOString()
      }) + '\n';

      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write classification log:', error);
    }
  }

  getRecentLogs(count: number): ClassificationLogEntry[] {
    return this.logs.slice(-count);
  }

  getLogsByTicketId(ticketId: string): ClassificationLogEntry[] {
    return this.logs.filter(log => log.ticket_id === ticketId);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const classificationLogger = new ClassificationLogger();
