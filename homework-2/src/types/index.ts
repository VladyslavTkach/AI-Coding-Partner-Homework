// Category enum
export enum Category {
  ACCOUNT_ACCESS = 'account_access',
  TECHNICAL_ISSUE = 'technical_issue',
  BILLING_QUESTION = 'billing_question',
  FEATURE_REQUEST = 'feature_request',
  BUG_REPORT = 'bug_report',
  OTHER = 'other'
}

// Priority enum
export enum Priority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Status enum
export enum Status {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

// Source enum
export enum Source {
  WEB_FORM = 'web_form',
  EMAIL = 'email',
  API = 'api',
  CHAT = 'chat',
  PHONE = 'phone'
}

// Device type enum
export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet'
}

// Metadata interface
export interface TicketMetadata {
  source?: Source;
  browser?: string;
  device_type?: DeviceType;
}

// Ticket interface
export interface Ticket {
  id: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
  assigned_to: string | null;
  tags: string[];
  metadata: TicketMetadata;
}

// Create ticket DTO
export interface CreateTicketDTO {
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  status?: Status;
  assigned_to?: string | null;
  tags?: string[];
  metadata?: TicketMetadata;
}

// Update ticket DTO
export interface UpdateTicketDTO {
  customer_id?: string;
  customer_email?: string;
  customer_name?: string;
  subject?: string;
  description?: string;
  category?: Category;
  priority?: Priority;
  status?: Status;
  assigned_to?: string | null;
  tags?: string[];
  metadata?: TicketMetadata;
}

// Import result interface
export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; errors: string[] }>;
  created_ids: string[];
}

// Filter interface
export interface TicketFilters {
  category?: Category;
  priority?: Priority;
  status?: Status;
  customer_id?: string;
  assigned_to?: string;
}

// Parsed ticket data from file imports
export interface ParsedTicketData {
  customer_id?: string;
  customer_email?: string;
  customer_name?: string;
  subject?: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  assigned_to?: string;
  tags?: string | string[];
  metadata?: {
    source?: string;
    browser?: string;
    device_type?: string;
  };
}

// File format type
export type FileFormat = 'csv' | 'json' | 'xml';

// Classification result for a category
export interface CategoryClassificationResult {
  category: Category;
  confidence: number;
  keywords_found: string[];
  reasoning: string;
}

// Classification result for priority
export interface PriorityClassificationResult {
  priority: Priority;
  confidence: number;
  keywords_found: string[];
  reasoning: string;
}

// Combined classification result
export interface ClassificationResult {
  ticket_id: string;
  category: CategoryClassificationResult;
  priority: PriorityClassificationResult;
  overall_confidence: number;
  classified_at: Date;
  auto_applied: boolean;
}

// Classification decision log entry
export interface ClassificationLogEntry {
  timestamp: Date;
  ticket_id: string;
  original_category: Category | null;
  original_priority: Priority | null;
  new_category: Category;
  new_priority: Priority;
  category_confidence: number;
  priority_confidence: number;
  keywords_found: string[];
  reasoning: string;
  was_override: boolean;
}

// Options for ticket creation with auto-classification
export interface CreateTicketOptions {
  auto_classify?: boolean;
}
