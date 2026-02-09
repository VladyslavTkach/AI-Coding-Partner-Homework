# Transaction Dispute Center - Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

---

## High-Level Objective

Build a **Transaction Dispute Center** web application that enables users to view their recent transactions, initiate disputes for problematic charges, track dispute resolution status, and receive notifications about dispute updates—all within a regulated FinTech environment requiring full auditability.

---

## Mid-Level Objectives

### 1. Transaction Management
- Display paginated list of recent transactions with merchant, amount, date, and status
- Provide visual indicators distinguishing normal, disputed, pending, and resolved transactions
- Enable filtering and searching of transactions by date range, amount, or merchant

### 2. Dispute Initiation Flow
- Allow users to initiate disputes from any eligible transaction
- Capture dispute reason (unauthorized charge, incorrect amount, duplicate charge, item not received)
- Collect additional details via text description (max 1000 characters)
- Support optional single image attachment (receipt/screenshot, max 5MB, JPEG/PNG only)
- Validate all inputs before submission

### 3. Dispute Status Tracking
- Display all user disputes with current status badges (Under Review, Resolved - Approved, Resolved - Denied)
- Show dispute ID, submission date, transaction reference, and refund amount (if approved)
- Provide dispute detail view with full timeline of status changes

### 4. Notification System
- Generate in-app notifications for dispute status changes
- Support notification types: submission confirmation, status update, resolution
- Display unread notification count and notification history

### 5. Audit & Compliance
- Log all dispute-related actions with timestamps and actor identification
- Maintain immutable audit trail for regulatory compliance
- Ensure all monetary values use precise decimal handling

---

## Implementation Notes

### Technical Stack
| Layer | Technology |
|-------|------------|
| Backend | Node.js with TypeScript, Express.js |
| Frontend | React with TypeScript |
| State Management | React Context or Redux Toolkit |
| Validation | Zod (backend), React Hook Form + Zod (frontend) |
| Testing | Jest, React Testing Library, Supertest |
| File Storage | Local filesystem (abstracted for future cloud migration) |
| Logging | Winston with structured JSON logging |

### Data Handling
- Use `Decimal.js` or similar library for all monetary calculations
- Store amounts in smallest currency unit (cents) as integers
- All dates stored and transmitted in ISO 8601 format (UTC)
- Sanitize all user inputs to prevent XSS and injection attacks

### Security Considerations
- Validate file uploads: check MIME type, file size, and scan for malicious content
- Rate limit dispute submissions (max 5 per hour per user session)
- Implement CORS with strict origin policies
- Sanitize all text inputs before storage and display

### Audit Requirements
- Every dispute action creates an immutable audit log entry
- Audit entries include: timestamp, action type, actor ID, affected entity, before/after state
- Audit logs must be queryable but not modifiable
- Retain audit logs for minimum 7 years (configurable)

### API Design
- RESTful API with consistent error response format
- All endpoints return standardized response envelope: `{ success, data, error, meta }`
- Use HTTP status codes correctly (201 for creation, 404 for not found, 422 for validation errors)
- Include request correlation IDs for traceability
- Use API versioning prefix: `/api/v1/`

### API Contract Brief (DSL-style)

```
# Transactions
GET    /api/v1/transactions          → List (paginated, filterable)
GET    /api/v1/transactions/:id      → Detail

# Disputes  
POST   /api/v1/disputes              → Create (multipart/form-data)
GET    /api/v1/disputes              → List user disputes
GET    /api/v1/disputes/:id          → Detail with timeline

# Notifications
GET    /api/v1/notifications         → List with unread count
PATCH  /api/v1/notifications/:id/read    → Mark single read
PATCH  /api/v1/notifications/read-all    → Mark all read

# Health
GET    /health                       → Service health check

# Response Envelope
Success: { success: true, data: T, meta?: {...} }
Error:   { success: false, error: { code, message, correlationId } }
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `LOG_LEVEL` | No | `info` | Winston log level |
| `UPLOAD_DIR` | No | `./uploads` | File upload directory |
| `RATE_LIMIT_WINDOW_MS` | No | `3600000` | Rate limit window (1 hour) |
| `RATE_LIMIT_MAX_DISPUTES` | No | `5` | Max disputes per window |
| `CORS_ORIGIN` | Yes | - | Allowed CORS origins |

### Performance Requirements
- Transaction list page load < 500ms for 100 items
- Dispute submission response < 2 seconds
- Support concurrent users: 1000+ simultaneous sessions

---

## Context

### Beginning Context
```
homework-3/
├── specification.md          # This file
├── agents.md                 # AI agent guidelines
├── README.md                 # Project rationale
├── .github/
│   └── copilot-instructions.md
└── (empty src/ directory)
```

### Ending Context
```
homework-3/
├── specification.md
├── agents.md
├── README.md
├── .github/
│   └── copilot-instructions.md
└── src/
    ├── backend/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── src/
    │   │   ├── index.ts              # Application entry point
    │   │   ├── app.ts                # Express app configuration
    │   │   ├── config/
    │   │   │   └── index.ts          # Environment configuration
    │   │   ├── models/
    │   │   │   ├── transaction.ts
    │   │   │   ├── dispute.ts
    │   │   │   ├── notification.ts
    │   │   │   └── auditLog.ts
    │   │   ├── controllers/
    │   │   │   ├── transactionController.ts
    │   │   │   ├── disputeController.ts
    │   │   │   └── notificationController.ts
    │   │   ├── services/
    │   │   │   ├── transactionService.ts
    │   │   │   ├── disputeService.ts
    │   │   │   ├── notificationService.ts
    │   │   │   └── auditService.ts
    │   │   ├── routes/
    │   │   │   ├── index.ts
    │   │   │   ├── transactions.ts
    │   │   │   ├── disputes.ts
    │   │   │   └── notifications.ts
    │   │   ├── middleware/
    │   │   │   ├── errorHandler.ts
    │   │   │   ├── rateLimiter.ts
    │   │   │   ├── requestLogger.ts
    │   │   │   └── fileUpload.ts
    │   │   ├── validators/
    │   │   │   ├── disputeValidator.ts
    │   │   │   └── queryValidator.ts
    │   │   ├── store/
    │   │   │   └── inMemoryStore.ts
    │   │   ├── utils/
    │   │   │   ├── logger.ts
    │   │   │   ├── decimal.ts
    │   │   │   └── constants.ts
    │   │   └── types/
    │   │       └── index.ts
    │   └── tests/
    │       ├── unit/
    │       └── integration/
    └── frontend/
        ├── package.json
        ├── tsconfig.json
        ├── src/
        │   ├── index.tsx
        │   ├── App.tsx
        │   ├── components/
        │   │   ├── TransactionList/
        │   │   ├── DisputeForm/
        │   │   ├── DisputeTracker/
        │   │   ├── NotificationBell/
        │   │   └── common/
        │   ├── pages/
        │   │   ├── TransactionsPage.tsx
        │   │   ├── DisputePage.tsx
        │   │   └── DisputeDetailPage.tsx
        │   ├── hooks/
        │   ├── services/
        │   ├── types/
        │   └── utils/
        └── tests/
```

---

## Low-Level Tasks

### Phase 1: Project Foundation

#### Task 1.1: Backend Project Setup

**Prompt:**
> Initialize a Node.js TypeScript backend project with Express.js. Configure ESLint, Prettier, and Jest. Set up the project structure with separate directories for models, controllers, services, routes, middleware, and utilities.

**Files to CREATE:**
- `src/backend/package.json`
- `src/backend/tsconfig.json`
- `src/backend/.eslintrc.js`
- `src/backend/.prettierrc`
- `src/backend/jest.config.js`
- `src/backend/src/index.ts`
- `src/backend/src/app.ts`

**Details:**
- Node.js 18+ with ES modules
- Strict TypeScript configuration
- Jest with ts-jest for testing
- Scripts: dev, build, test, lint

---

#### Task 1.2: Core Types and Models

**Prompt:**
> Create TypeScript interfaces and types for Transaction, Dispute, Notification, and AuditLog entities. Use enums for status values and dispute reasons. Ensure all monetary fields use a Money type with amount (integer cents) and currency code.

**Files to CREATE:**
- `src/backend/src/types/index.ts`
- `src/backend/src/models/transaction.ts`
- `src/backend/src/models/dispute.ts`
- `src/backend/src/models/notification.ts`
- `src/backend/src/models/auditLog.ts`

**Details:**
```typescript
// Key types to define:
TransactionStatus: 'completed' | 'pending' | 'disputed' | 'refunded'
DisputeReason: 'unauthorized' | 'incorrect_amount' | 'duplicate' | 'not_received'
DisputeStatus: 'under_review' | 'approved' | 'denied'
NotificationType: 'dispute_submitted' | 'status_update' | 'resolution'

// Money type for precise monetary handling
interface Money { amountCents: number; currency: string }
```

---

#### Task 1.3: In-Memory Data Store

**Prompt:**
> Create an in-memory store with CRUD operations for transactions, disputes, notifications, and audit logs. Include methods for querying with filters and pagination. Seed with sample transaction data for development.

**Files to CREATE:**
- `src/backend/src/store/inMemoryStore.ts`

**Details:**
- Generic store pattern with type safety
- Support for filtering, sorting, pagination
- Seed data: 20 sample transactions with varied merchants, amounts, dates
- Thread-safe operations (for future scaling)

---

### Phase 2: Transaction Management

#### Task 2.1: Transaction Service

**Prompt:**
> Create a TransactionService class with methods to list transactions (with pagination and filters), get transaction by ID, and update transaction status. Include proper error handling and logging.

**Files to CREATE:**
- `src/backend/src/services/transactionService.ts`

**Details:**
- `listTransactions(filters, pagination)` - returns paginated results
- `getTransactionById(id)` - returns single transaction or throws NotFoundError
- `updateTransactionStatus(id, status)` - updates and logs change
- Filter options: dateRange, amountRange, status, merchantSearch

---

#### Task 2.2: Transaction Controller and Routes

**Prompt:**
> Create TransactionController with Express route handlers for GET /transactions (list) and GET /transactions/:id (detail). Include query parameter validation using Zod.

**Files to CREATE:**
- `src/backend/src/controllers/transactionController.ts`
- `src/backend/src/routes/transactions.ts`
- `src/backend/src/validators/queryValidator.ts`

**Details:**
- Standardized response format: `{ success, data, meta: { page, limit, total } }`
- Query params: page, limit, startDate, endDate, minAmount, maxAmount, status
- Error responses with proper HTTP status codes

---

### Phase 3: Dispute Flow

#### Task 3.1: Dispute Service

**Prompt:**
> Create a DisputeService class with methods to create disputes, list user disputes, get dispute details, and update dispute status. Each action must create an audit log entry. Validate that transactions can only be disputed once.

**Files to CREATE:**
- `src/backend/src/services/disputeService.ts`
- `src/backend/src/services/auditService.ts`

**Details:**
- `createDispute(transactionId, reason, description, attachmentPath?)` 
  - Validate transaction exists and is not already disputed
  - Generate unique dispute ID (format: DSP-YYYYMMDD-XXXXX)
  - Create audit entry for dispute creation
  - Update transaction status to 'disputed'
- `getDisputesByUser(userId, pagination)`
- `getDisputeById(id)` - includes full status history
- `updateDisputeStatus(id, newStatus, refundAmount?)` - admin action with audit

---

#### Task 3.2: Dispute Validator

**Prompt:**
> Create Zod schemas for dispute creation request validation. Validate dispute reason is from allowed list, description is 10-1000 characters, and optional attachment meets requirements.

**Files to CREATE:**
- `src/backend/src/validators/disputeValidator.ts`


---

#### Task 3.3: File Upload Middleware

**Prompt:**
> Create Express middleware for handling single file uploads using multer. Validate file type (JPEG, PNG only), size (max 5MB), and scan filename for suspicious patterns. Store files with randomized names.

**Files to CREATE:**
- `src/backend/src/middleware/fileUpload.ts`

**Details:**
- Use multer with memory storage
- Validate MIME type via magic bytes, not just extension
- Generate UUID-based filenames
- Store in `uploads/disputes/` directory
- Return file path in request for controller use

---

#### Task 3.4: Dispute Controller and Routes

**Prompt:**
> Create DisputeController with route handlers for POST /disputes (create), GET /disputes (list), and GET /disputes/:id (detail). Apply file upload middleware to create endpoint.

**Files to CREATE:**
- `src/backend/src/controllers/disputeController.ts`
- `src/backend/src/routes/disputes.ts`

**Details:**
- POST /disputes - multipart/form-data with optional image
- Rate limit: 5 disputes per hour per session
- Response includes dispute ID and initial status
- GET endpoints with pagination support

---

### Phase 4: Notifications

#### Task 4.1: Notification Service

**Prompt:**
> Create a NotificationService class to create notifications, list unread notifications, mark as read, and get notification history. Notifications are triggered by dispute status changes.

**Files to CREATE:**
- `src/backend/src/services/notificationService.ts`

**Details:**
- `createNotification(userId, type, disputeId, message)`
- `getUnreadCount(userId)`
- `listNotifications(userId, pagination, includeRead?)`
- `markAsRead(notificationId)` / `markAllAsRead(userId)`
- Notification messages are templated based on type

---

#### Task 4.2: Notification Controller and Routes

**Prompt:**
> Create NotificationController with handlers for GET /notifications (list with count), PATCH /notifications/:id/read (mark read), and PATCH /notifications/read-all (mark all read).

**Files to CREATE:**
- `src/backend/src/controllers/notificationController.ts`
- `src/backend/src/routes/notifications.ts`

**Details:**
- GET response includes unreadCount in meta
- Support query param: includeRead (default false)
- Bulk mark-all-read operation

---

### Phase 5: Middleware and Error Handling

#### Task 5.1: Error Handler and Request Logger

**Prompt:**
> Create centralized error handling middleware that catches all errors, logs them appropriately, and returns standardized error responses. Create request logging middleware that logs all incoming requests with correlation IDs.

**Files to CREATE:**
- `src/backend/src/middleware/errorHandler.ts`
- `src/backend/src/middleware/requestLogger.ts`
- `src/backend/src/utils/logger.ts`

**Details:**
- Custom error classes: NotFoundError, ValidationError, RateLimitError
- Error response format: `{ success: false, error: { code, message, details? } }`
- Winston logger with JSON format for production
- Correlation ID via `X-Request-ID` header or generated UUID

---

#### Task 5.2: Rate Limiter

**Prompt:**
> Create rate limiting middleware specifically for dispute submission endpoint. Track submissions by session/IP and enforce 5 per hour limit. Return appropriate 429 response when exceeded.

**Files to CREATE:**
- `src/backend/src/middleware/rateLimiter.ts`

**Details:**
- In-memory rate tracking (can be replaced with Redis later)
- Sliding window algorithm
- Response headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- Configurable limits per route

---

### Phase 6: Frontend Implementation

#### Task 6.1: Frontend Project Setup

**Prompt:**
> Initialize a React TypeScript project using Vite. Configure ESLint, Prettier, and React Testing Library. Set up project structure with components, pages, hooks, and services directories.

**Files to CREATE:**
- `src/frontend/package.json`
- `src/frontend/vite.config.ts`
- `src/frontend/tsconfig.json`
- `src/frontend/src/index.tsx`
- `src/frontend/src/App.tsx`

**Details:**
- React 18 with TypeScript strict mode
- React Router for navigation
- Axios for API calls
- CSS Modules or Tailwind CSS for styling

---

#### Task 6.2: API Service Layer

**Prompt:**
> Create typed API service modules for transactions, disputes, and notifications. Include error handling, request/response interceptors, and type-safe responses.

**Files to CREATE:**
- `src/frontend/src/services/api.ts`
- `src/frontend/src/services/transactionService.ts`
- `src/frontend/src/services/disputeService.ts`
- `src/frontend/src/services/notificationService.ts`
- `src/frontend/src/types/index.ts`

**Details:**
- Axios instance with base URL configuration
- Request interceptor for correlation ID
- Response interceptor for error normalization
- TypeScript generics for response types

---

#### Task 6.3: Transaction List Component

**Prompt:**
> Create a TransactionList component that displays paginated transactions in a table/card format. Include status badges with appropriate colors, amount formatting, and a "Dispute" button for eligible transactions. Add filtering controls.

**Files to CREATE:**
- `src/frontend/src/components/TransactionList/TransactionList.tsx`
- `src/frontend/src/components/TransactionList/TransactionCard.tsx`
- `src/frontend/src/components/TransactionList/TransactionFilters.tsx`
- `src/frontend/src/components/common/StatusBadge.tsx`
- `src/frontend/src/components/common/Pagination.tsx`

**Details:**
- Status colors: completed (green), pending (yellow), disputed (orange), refunded (blue)
- Amount formatted with currency symbol and 2 decimal places
- Dispute button disabled for already-disputed or refunded transactions
- Responsive design for mobile and desktop

---

#### Task 6.4: Dispute Form Component

**Prompt:**
> Create a DisputeForm component with React Hook Form and Zod validation. Include reason dropdown, description textarea with character counter, and file upload with preview. Show validation errors inline.

**Files to CREATE:**
- `src/frontend/src/components/DisputeForm/DisputeForm.tsx`
- `src/frontend/src/components/DisputeForm/FileUpload.tsx`
- `src/frontend/src/components/DisputeForm/disputeSchema.ts`

**Details:**
- Pre-populate with transaction details (read-only display)
- Reason options with user-friendly labels
- Description: 10-1000 chars with live counter
- File upload: drag-and-drop zone, preview thumbnail, remove option
- Submit button with loading state
- Success modal with dispute ID

---

#### Task 6.5: Dispute Tracker Component

**Prompt:**
> Create a DisputeTracker component that lists all user disputes with status badges, dates, and refund amounts. Include a detail view showing dispute timeline and attached documents.

**Files to CREATE:**
- `src/frontend/src/components/DisputeTracker/DisputeTracker.tsx`
- `src/frontend/src/components/DisputeTracker/DisputeCard.tsx`
- `src/frontend/src/components/DisputeTracker/DisputeTimeline.tsx`
- `src/frontend/src/pages/DisputeDetailPage.tsx`

**Details:**
- Status badges: Under Review (blue), Approved (green), Denied (red)
- Show original transaction amount and refund amount if approved
- Timeline shows all status changes with timestamps
- Link to view attached image

---

#### Task 6.6: Notification Component

**Prompt:**
> Create a NotificationBell component showing unread count badge. Clicking opens a dropdown with recent notifications. Include "Mark all read" action and link to full notification history.

**Files to CREATE:**
- `src/frontend/src/components/NotificationBell/NotificationBell.tsx`
- `src/frontend/src/components/NotificationBell/NotificationDropdown.tsx`
- `src/frontend/src/components/NotificationBell/NotificationItem.tsx`

**Details:**
- Bell icon with red badge showing unread count (99+ for over 99)
- Dropdown shows last 5 notifications
- Click notification to navigate to related dispute
- Real-time update not required (poll on focus or manual refresh)

---

### Phase 7: Testing

#### Task 7.1: Backend Unit Tests

**Prompt:**
> Create comprehensive unit tests for all services: TransactionService, DisputeService, NotificationService, and AuditService. Mock the data store and test all methods including error conditions.

**Files to CREATE:**
- `src/backend/tests/unit/transactionService.test.ts`
- `src/backend/tests/unit/disputeService.test.ts`
- `src/backend/tests/unit/notificationService.test.ts`
- `src/backend/tests/unit/auditService.test.ts`

**Details:**
- Test happy paths and error conditions
- Verify audit log creation on dispute actions
- Test pagination and filtering logic
- Test validation rejections
- Aim for 80%+ code coverage

---

#### Task 7.2: Backend Integration Tests

**Prompt:**
> Create integration tests for all API endpoints using Supertest. Test complete request/response cycles including validation errors, success responses, and error handling.

**Files to CREATE:**
- `src/backend/tests/integration/transactions.test.ts`
- `src/backend/tests/integration/disputes.test.ts`
- `src/backend/tests/integration/notifications.test.ts`

**Details:**
- Test with real Express app instance
- Verify response format and status codes
- Test file upload scenarios
- Test rate limiting behavior
- Verify audit trail creation

---

#### Task 7.3: Frontend Component Tests

**Prompt:**
> Create React Testing Library tests for key components: TransactionList, DisputeForm, DisputeTracker, and NotificationBell. Mock API calls and test user interactions.

**Files to CREATE:**
- `src/frontend/tests/TransactionList.test.tsx`
- `src/frontend/tests/DisputeForm.test.tsx`
- `src/frontend/tests/DisputeTracker.test.tsx`
- `src/frontend/tests/NotificationBell.test.tsx`

**Details:**
- Test rendering with mock data
- Test user interactions (clicks, form submission)
- Test loading and error states
- Test validation error display
- Use MSW or similar for API mocking

---

### Phase 8: Documentation and Polish

#### Task 8.1: API Documentation

**Prompt:**
> Create OpenAPI 3.0 specification documenting all endpoints. Include request/response schemas, error codes, and example payloads.

**Files to CREATE:**
- `src/backend/docs/openapi.yaml`

**Details:**
- All endpoints with full schema definitions
- Authentication placeholder for future implementation
- Error response schemas
- Example requests and responses

---

#### Task 8.2: Developer Documentation

**Prompt:**
> Create README files for both backend and frontend with setup instructions, environment configuration, and development workflow. Include architecture decision records.

**Files to CREATE:**
- `src/backend/README.md`
- `src/frontend/README.md`

**Details:**
- Prerequisites and installation steps
- Environment variable documentation
- Running tests and development server
- Build and deployment notes
- Architecture overview

---

## Appendix: Test Scenarios Reference

### Dispute Creation Test Cases
1. ✅ Valid dispute with all fields creates dispute and audit log
2. ✅ Valid dispute without attachment succeeds
3. ❌ Dispute on already-disputed transaction fails
4. ❌ Description under 10 characters fails validation
5. ❌ Invalid dispute reason fails validation
6. ❌ File over 5MB rejected
7. ❌ Non-image file rejected

### Notification Test Cases
1. ✅ Dispute creation triggers notification
2. ✅ Status change triggers notification
3. ✅ Mark as read updates notification state
4. ✅ Unread count reflects current state

### Audit Log Test Cases
1. ✅ Dispute creation logged with full details
2. ✅ Status change logged with before/after state
3. ✅ Audit logs are immutable (no update/delete operations)

