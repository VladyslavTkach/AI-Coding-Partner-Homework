# Task 3: Test Plan & Testing Scenarios

## 1. Overview

| Attribute | Value |
|-----------|-------|
| Project | Customer Support Ticket Management System |
| Test Coverage Target | >85% |
| Test Framework | Jest + TypeScript |
| Total Test Cases | 56 |

---

## 2. Scope

### In Scope
- Ticket CRUD API endpoints
- File import (CSV, JSON, XML)
- Data validation rules
- Auto-classification (category & priority)
- Filtering and querying
- Error handling
- Performance benchmarks

### Out of Scope
- Authentication/Authorization
- Database persistence
- External integrations
- UI/Frontend testing

---

## 3. Test Strategy

### Test Pyramid Distribution

| Level | Count | Focus |
|-------|-------|-------|
| Unit Tests | 40 | Parsers, validators, classifiers, models |
| API Tests | 11 | HTTP endpoints, status codes, responses |
| Integration Tests | 5 | End-to-end workflows |
| Performance Tests | 5 | Response time benchmarks |

### Test Data Strategy
- Use fixture files for repeatable tests
- Generate edge case data programmatically
- Clear store before each test for isolation

---

## 4. Testing Scenarios

### 4.1 Ticket API Scenarios (11 tests)

#### Create Ticket

| ID | Scenario | Precondition | Input | Expected Result |
|----|----------|--------------|-------|-----------------|
| API-01 | Create ticket with valid data | None | Valid ticket payload | 201 Created, returns ticket with generated ID |
| API-02 | Create ticket with auto-classify flag | None | Valid payload + `?auto_classify=true` | 201 Created, returns ticket + classification result |
| API-03 | Create ticket with invalid email | None | `customer_email: "invalid"` | 400 Bad Request, VALIDATION_ERROR |
| API-04 | Create ticket with missing required field | None | Omit `customer_id` | 400 Bad Request, error lists missing field |

#### Read Ticket

| ID | Scenario | Precondition | Input | Expected Result |
|----|----------|--------------|-------|-----------------|
| API-05 | Get existing ticket by ID | Ticket exists | Valid ticket ID | 200 OK, returns ticket object |
| API-06 | Get non-existent ticket | None | Random UUID | 404 Not Found, NOT_FOUND error |
| API-07 | List all tickets | Multiple tickets exist | None | 200 OK, returns `{ tickets: [], count: N }` |
| API-08 | Filter tickets by category | Tickets with various categories | `?category=billing_question` | 200 OK, only matching tickets returned |

#### Update & Delete Ticket

| ID | Scenario | Precondition | Input | Expected Result |
|----|----------|--------------|-------|-----------------|
| API-09 | Update ticket successfully | Ticket exists | Valid partial update | 200 OK, returns updated ticket, `updated_at` changed |
| API-10 | Delete ticket successfully | Ticket exists | Valid ticket ID | 200 OK, success message with ID |
| API-11 | Delete non-existent ticket | None | Random UUID | 404 Not Found, NOT_FOUND error |

---

### 4.2 Ticket Validation Scenarios (9 tests)

| ID | Scenario | Input | Expected Result |
|----|----------|-------|-----------------|
| VAL-01 | Valid ticket passes all validations | Complete valid data | No validation errors |
| VAL-02 | Invalid email format rejected | `customer_email: "not-an-email"` | Error: "Invalid email format" |
| VAL-03 | Missing customer_id rejected | Omit `customer_id` field | Error: "customer_id is required" |
| VAL-04 | Empty subject rejected | `subject: ""` | Error: "Subject is required" |
| VAL-05 | Subject exceeding 200 chars rejected | 201 character string | Error: "Subject must be at most 200 characters" |
| VAL-06 | Description under 10 chars rejected | `description: "Short"` | Error: "Description must be at least 10 characters" |
| VAL-07 | Invalid category enum rejected | `category: "unknown"` | Error: "Category must be one of: ..." |
| VAL-08 | Invalid priority enum rejected | `priority: "super-high"` | Error: "Priority must be one of: ..." |
| VAL-09 | Optional fields accepted as undefined | Only required fields | No validation errors |

---

### 4.3 CSV Parser Scenarios (6 tests)

| ID | Scenario | Input | Expected Result |
|----|----------|-------|-----------------|
| CSV-01 | Parse valid CSV with headers | Standard CSV content | Array of parsed ticket objects |
| CSV-02 | Handle comma-separated tags | `tags: "tag1,tag2,tag3"` | `tags: ['tag1', 'tag2', 'tag3']` |
| CSV-03 | Parse metadata columns | Columns: source, browser, device_type | Nested `metadata` object created |
| CSV-04 | Empty content throws error | Empty string `""` | Error: "CSV content is empty" |
| CSV-05 | Missing optional columns handled | CSV without tags column | `tags` field is undefined |
| CSV-06 | Empty lines skipped | CSV with blank rows | Only valid records returned |

---

### 4.4 JSON Parser Scenarios (5 tests)

| ID | Scenario | Input | Expected Result |
|----|----------|-------|-----------------|
| JSON-01 | Parse valid JSON array | Array of ticket objects | Array of parsed tickets |
| JSON-02 | Parse single ticket object | Single object (not array) | Array with one ticket |
| JSON-03 | Empty content throws error | Empty string `""` | Error: "JSON content is empty" |
| JSON-04 | Invalid JSON syntax throws error | `"{ invalid json"` | Error: "Invalid JSON syntax" |
| JSON-05 | Nested metadata parsed correctly | Object with `metadata` field | Metadata properly mapped |

---

### 4.5 XML Parser Scenarios (5 tests)

| ID | Scenario | Input | Expected Result |
|----|----------|-------|-----------------|
| XML-01 | Parse valid XML with tickets wrapper | `<tickets><ticket>...</ticket></tickets>` | Array of parsed tickets |
| XML-02 | Parse single ticket element | `<ticket>...</ticket>` | Array with one ticket |
| XML-03 | Empty content throws error | Empty string `""` | Error: "XML content is empty" |
| XML-04 | Malformed XML throws error | Unclosed tags | Error: "Failed to parse XML" |
| XML-05 | Nested metadata element parsed | `<metadata><source>web</source></metadata>` | Metadata object created |

---

### 4.6 Category Classification Scenarios (6 tests)

| ID | Scenario | Subject/Description Contains | Expected Category | Expected Confidence |
|----|----------|------------------------------|-------------------|---------------------|
| CAT-01 | Account access keywords | "can't login", "password reset", "locked out" | account_access | >0.6 |
| CAT-02 | Technical issue keywords | "error", "crash", "not working", "bug" | technical_issue | >0.6 |
| CAT-03 | Billing question keywords | "invoice", "refund", "payment", "charge" | billing_question | >0.6 |
| CAT-04 | Feature request keywords | "would like", "suggestion", "add feature" | feature_request | >0.6 |
| CAT-05 | Bug report keywords | "bug", "reproduce", "expected vs actual" | bug_report | >0.6 |
| CAT-06 | No matching keywords | Generic text without keywords | other | ~0.3 (low confidence) |

---

### 4.7 Priority Classification Scenarios (4 tests)

| ID | Scenario | Subject/Description Contains | Expected Priority | Expected Confidence |
|----|----------|------------------------------|-------------------|---------------------|
| PRI-01 | Urgent keywords | "critical", "emergency", "production down", "ASAP" | urgent | >0.8 |
| PRI-02 | High priority keywords | "important", "blocking", "severe", "deadline" | high | >0.8 |
| PRI-03 | Low priority keywords | "minor", "when you have time", "no rush" | low | >0.8 |
| PRI-04 | No priority keywords | Generic text | medium | ~0.5 (default) |

---

### 4.8 Integration Scenarios (5 tests)

| ID | Scenario | Steps | Expected Result |
|----|----------|-------|-----------------|
| INT-01 | Complete ticket lifecycle | 1. Create ticket<br>2. Update to in_progress<br>3. Update to resolved<br>4. Verify resolved_at set<br>5. Delete ticket | All operations succeed, state transitions correct |
| INT-02 | Bulk import with auto-classification | 1. Import CSV with 10 tickets<br>2. Auto-classify each<br>3. Verify categories assigned | All tickets imported and classified |
| INT-03 | Classification history tracking | 1. Create ticket<br>2. Auto-classify<br>3. Reclassify<br>4. Get history | History contains 2 entries with timestamps |
| INT-04 | Multi-filter query | 1. Create tickets with varied category/priority<br>2. Filter by category=billing AND priority=high | Only matching tickets returned |
| INT-05 | Concurrent ticket creation | 1. Send 20 parallel POST requests<br>2. All should succeed | All 20 tickets created, no race conditions |

---

### 4.9 Performance Scenarios (5 tests)

| ID | Scenario | Operation | Target Response Time |
|----|----------|-----------|---------------------|
| PERF-01 | Single ticket creation | POST /tickets | <50ms |
| PERF-02 | Get ticket by ID | GET /tickets/:id | <10ms |
| PERF-03 | List 100 tickets | GET /tickets (after seeding 100) | <100ms |
| PERF-04 | Bulk import 50 tickets | POST /tickets/import (CSV file) | <500ms |
| PERF-05 | Auto-classify single ticket | POST /tickets/:id/auto-classify | <20ms |

---

## 5. Test Data Requirements

### Fixture Files

| File | Records | Purpose |
|------|---------|---------|
| valid_tickets.csv | 50 | Bulk import positive tests |
| valid_tickets.json | 20 | JSON import positive tests |
| valid_tickets.xml | 30 | XML import positive tests |
| invalid_tickets.csv | 5 | Validation error tests |
| invalid_tickets.json | 5 | Validation error tests |
| invalid_tickets.xml | 5 | XML parsing error tests |

### Test Data Coverage

Fixtures should cover:
- All 6 categories (account_access, technical_issue, billing_question, feature_request, bug_report, other)
- All 4 priorities (urgent, high, medium, low)
- All 5 statuses (new, in_progress, waiting_customer, resolved, closed)
- Various metadata combinations (source, browser, device_type)
- Edge cases (empty tags, special characters, max-length fields)

---

## 6. Entry & Exit Criteria

### Entry Criteria
- All source code implemented and compiling
- Jest and dependencies installed
- Test fixtures created

### Exit Criteria
- All 56 test cases pass
- Code coverage >85% for all components
- No critical or high severity defects open
- Performance benchmarks met

---

## 7. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Singleton store causes test pollution | High | Clear store in beforeEach hook |
| Async tests timeout | Medium | Set appropriate Jest timeout |
| File upload tests fragile | Medium | Use buffer-based uploads, not file system |
| Performance tests flaky on CI | Low | Run performance tests separately, allow variance |

---

## 8. Test Environment

| Component | Specification |
|-----------|---------------|
| Runtime | Node.js 18+ |
| Test Framework | Jest 29.x |
| TypeScript | ts-jest preset |
| HTTP Testing | Supertest |
| Coverage Tool | Jest built-in (Istanbul) |

---

## 9. Deliverables

1. Test helper utilities (`tests/helpers/testUtils.ts`)
2. Eight test files covering all scenarios
3. Expanded test fixtures
4. Coverage report showing >85%
5. Test execution documentation
