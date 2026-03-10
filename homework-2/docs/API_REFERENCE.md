# API Reference

## Base URL

```
http://localhost:3000
```

## Headers

| Header | Value |
|--------|-------|
| Content-Type | application/json |

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /tickets | Create ticket |
| POST | /tickets/import | Bulk import from file |
| GET | /tickets | List tickets with filters |
| GET | /tickets/:id | Get ticket by ID |
| PUT | /tickets/:id | Update ticket |
| DELETE | /tickets/:id | Delete ticket |
| POST | /tickets/:id/auto-classify | Auto-classify ticket |
| GET | /tickets/:id/classification-history | Get classification history |

---

## Ticket Endpoints

### Create Ticket

Creates a new support ticket.

```
POST /tickets
POST /tickets?auto_classify=true  # With auto-classification
```

**Request Body:**

```json
{
  "customer_id": "CUST001",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "subject": "Cannot login to my account",
  "description": "I've been trying to login but keep getting an error message",
  "category": "account_access",
  "priority": "high",
  "tags": ["login", "urgent"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome 120",
    "device_type": "desktop"
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "CUST001",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "subject": "Cannot login to my account",
  "description": "I've been trying to login but keep getting an error message",
  "category": "account_access",
  "priority": "high",
  "status": "new",
  "created_at": "2026-02-01T10:00:00.000Z",
  "updated_at": "2026-02-01T10:00:00.000Z",
  "resolved_at": null,
  "assigned_to": null,
  "tags": ["login", "urgent"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome 120",
    "device_type": "desktop"
  }
}
```

**cURL:**

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST001",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "subject": "Cannot login to my account",
    "description": "I have been trying to login but keep getting an error message",
    "category": "account_access",
    "priority": "high"
  }'
```

---

### Bulk Import Tickets

Import multiple tickets from CSV, JSON, or XML file.

```
POST /tickets/import
Content-Type: multipart/form-data
```

**Request:** File upload with field name `file`

**Response:** `200 OK`

```json
{
  "summary": {
    "total": 50,
    "successful": 48,
    "failed": 2
  },
  "errors": [
    {
      "row": 12,
      "errors": ["Invalid email format"]
    }
  ],
  "created_ids": ["uuid1", "uuid2", "..."]
}
```

**cURL:**

```bash
curl -X POST http://localhost:3000/tickets/import \
  -F "file=@tickets.csv"
```

---

### List Tickets

Get all tickets with optional filtering.

```
GET /tickets
GET /tickets?category=account_access&priority=high&status=new
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| priority | string | Filter by priority |
| status | string | Filter by status |
| customer_id | string | Filter by customer |
| assigned_to | string | Filter by assignee |

**Response:** `200 OK`

```json
{
  "tickets": [...],
  "count": 25
}
```

**cURL:**

```bash
curl "http://localhost:3000/tickets?category=account_access"
```

---

### Get Ticket

Get a specific ticket by ID.

```
GET /tickets/:id
```

**Response:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customer_id": "CUST001",
  ...
}
```

**cURL:**

```bash
curl http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

---

### Update Ticket

Update ticket fields (partial update supported).

```
PUT /tickets/:id
```

**Request Body:**

```json
{
  "status": "in_progress",
  "assigned_to": "agent-001",
  "priority": "urgent"
}
```

**Response:** `200 OK` - Updated ticket object

**cURL:**

```bash
curl -X PUT http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress", "assigned_to": "agent-001"}'
```

---

### Delete Ticket

Delete a ticket by ID.

```
DELETE /tickets/:id
```

**Response:** `200 OK`

```json
{
  "message": "Ticket deleted successfully",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**cURL:**

```bash
curl -X DELETE http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

---

## Classification Endpoints

### Auto-Classify Ticket

Automatically classify a ticket's category and priority based on content analysis.

```
POST /tickets/:id/auto-classify
```

**Response:** `200 OK`

```json
{
  "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
  "category": {
    "category": "account_access",
    "confidence": 0.85,
    "keywords_found": ["login", "password"],
    "reasoning": "High confidence match for 'account_access' category based on keywords: login, password."
  },
  "priority": {
    "priority": "urgent",
    "confidence": 0.92,
    "keywords_found": ["critical", "can't access"],
    "reasoning": "Urgent priority assigned due to critical keywords: critical, can't access."
  },
  "overall_confidence": 0.88,
  "classified_at": "2026-02-01T10:00:00.000Z",
  "auto_applied": true
}
```

**cURL:**

```bash
curl -X POST http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000/auto-classify
```

---

### Get Classification History

Get the classification decision history for a ticket.

```
GET /tickets/:id/classification-history
```

**Response:** `200 OK`

```json
{
  "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
  "history": [
    {
      "timestamp": "2026-02-01T10:00:00.000Z",
      "original_category": "other",
      "new_category": "account_access",
      "original_priority": "medium",
      "new_priority": "urgent",
      "category_confidence": 0.85,
      "priority_confidence": 0.92,
      "keywords_found": ["login", "password", "critical"],
      "was_override": true
    }
  ]
}
```

**cURL:**

```bash
curl http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000/classification-history
```

---

## Data Models

### Ticket

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | auto | Unique identifier |
| customer_id | string | yes | Customer identifier |
| customer_email | email | yes | Customer email |
| customer_name | string | yes | Customer name |
| subject | string | yes | 1-200 characters |
| description | string | yes | 10-2000 characters |
| category | enum | yes | See categories below |
| priority | enum | yes | urgent, high, medium, low |
| status | enum | no | new (default), in_progress, waiting_customer, resolved, closed |
| tags | array | no | Array of strings |
| metadata | object | no | source, browser, device_type |
| assigned_to | string | no | Assignee identifier |
| created_at | datetime | auto | Creation timestamp |
| updated_at | datetime | auto | Last update timestamp |
| resolved_at | datetime | auto | Resolution timestamp |

### Categories

- `account_access` - Login, password, 2FA issues
- `technical_issue` - Bugs, errors, crashes
- `billing_question` - Payments, invoices, refunds
- `feature_request` - Enhancements, suggestions
- `bug_report` - Defects with reproduction steps
- `other` - Uncategorizable

### Metadata

| Field | Type | Values |
|-------|------|--------|
| source | enum | web_form, email, api, chat, phone |
| browser | string | Any browser identifier |
| device_type | enum | desktop, mobile, tablet |

---

## Error Responses

All errors return a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input data |
| 400 | BAD_REQUEST | Malformed request |
| 404 | NOT_FOUND | Resource not found |
| 500 | INTERNAL_ERROR | Server error |
