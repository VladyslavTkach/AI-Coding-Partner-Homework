# Architecture

## System Overview

The Customer Support Ticket Management System is a RESTful API built with Node.js, Express, and TypeScript. It follows a layered architecture pattern with clear separation between API handling, business logic, and data storage. The system supports multi-format file imports and provides automatic ticket classification using keyword-based analysis.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        C([HTTP Clients])
    end

    subgraph "API Layer"
        R[Express Router]
        M[Middleware]
        R --> TC[Ticket Controller]
        R --> CC[Classification Controller]
        M --> EH[Error Handler]
    end

    subgraph "Business Layer"
        TC --> TS[Ticket Service]
        TC --> IS[Import Service]
        CC --> CS[Classification Service]
        CS --> CAT[Category Classifier]
        CS --> PRI[Priority Classifier]
        IS --> CSV[CSV Parser]
        IS --> JSON[JSON Parser]
        IS --> XML[XML Parser]
    end

    subgraph "Validation Layer"
        TC --> V[Joi Validator]
    end

    subgraph "Data Layer"
        TS --> Store[(In-Memory Store)]
        CS --> Store
        CS --> Log[Classification Logger]
    end

    C --> R
```

## Component Descriptions

| Component | Responsibility | Key Files |
|-----------|---------------|-----------|
| **Router** | Route HTTP requests to controllers | `src/routes/tickets.ts` |
| **Controllers** | Handle HTTP requests/responses | `src/controllers/*.ts` |
| **Services** | Business logic and orchestration | `src/services/*.ts` |
| **Classifiers** | Keyword matching and classification | `src/classifiers/*.ts` |
| **Parsers** | Parse CSV, JSON, XML files | `src/parsers/*.ts` |
| **Validators** | Input validation with Joi | `src/validators/ticketValidator.ts` |
| **Store** | In-memory ticket storage | `src/store/inMemoryStore.ts` |
| **Middleware** | Error handling | `src/middleware/errorHandler.ts` |

## Data Flow - Ticket Creation

```mermaid
sequenceDiagram
    participant Client
    participant Router
    participant Controller
    participant Validator
    participant Service
    participant Store

    Client->>Router: POST /tickets
    Router->>Controller: create(req, res)
    Controller->>Validator: validateTicket(body)

    alt Validation Failed
        Validator-->>Controller: ValidationError
        Controller-->>Client: 400 Bad Request
    end

    Validator-->>Controller: validated data
    Controller->>Service: createNewTicket(data)
    Service->>Store: create(ticket)
    Store-->>Service: ticket
    Service-->>Controller: ticket
    Controller-->>Client: 201 Created + ticket
```

## Data Flow - Auto-Classification

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant ClassificationService
    participant CategoryClassifier
    participant PriorityClassifier
    participant Store
    participant Logger

    Client->>Controller: POST /tickets/:id/auto-classify
    Controller->>Store: findById(id)

    alt Ticket Not Found
        Store-->>Controller: null
        Controller-->>Client: 404 Not Found
    end

    Store-->>Controller: ticket
    Controller->>ClassificationService: classifyTicket(ticket)
    ClassificationService->>CategoryClassifier: classifyCategory(subject, description)
    CategoryClassifier-->>ClassificationService: CategoryResult
    ClassificationService->>PriorityClassifier: classifyPriority(subject, description)
    PriorityClassifier-->>ClassificationService: PriorityResult
    ClassificationService->>Logger: log(decision)
    ClassificationService->>Store: update(id, classification)
    ClassificationService-->>Controller: ClassificationResult
    Controller-->>Client: 200 OK + result
```

## Data Flow - File Import

```mermaid
sequenceDiagram
    participant Client
    participant Multer
    participant Controller
    participant ImportService
    participant Parser
    participant Validator
    participant Store

    Client->>Multer: POST /tickets/import (file)
    Multer->>Controller: file buffer
    Controller->>ImportService: importTickets(content, format)
    ImportService->>Parser: parse(content)
    Parser-->>ImportService: parsed records[]

    loop For each record
        ImportService->>Validator: validate(record)
        alt Valid
            ImportService->>Store: create(ticket)
        else Invalid
            ImportService->>ImportService: collect error
        end
    end

    ImportService-->>Controller: ImportResult
    Controller-->>Client: 200 OK + summary
```

## Design Decisions

### In-Memory Store

**Decision:** Use an in-memory Map for ticket storage instead of a database.

**Rationale:**
- Simplifies development and testing
- No external dependencies required
- Fast read/write operations
- Suitable for demonstration purposes

**Trade-offs:**
- Data is lost on server restart
- Not suitable for production with high availability requirements
- Limited to single-server deployment

**Future Migration:** The store follows a repository pattern, making it easy to swap for a database implementation (MongoDB, PostgreSQL) by implementing the same interface.

### Keyword-Based Classification

**Decision:** Use keyword matching for automatic classification instead of ML models.

**Rationale:**
- Deterministic and explainable results
- No training data required
- Fast execution with no external API calls
- Easy to update keyword lists

**Trade-offs:**
- Less accurate than ML-based solutions
- Requires manual keyword curation
- Cannot learn from user corrections

**Confidence Scoring:**
- 3+ keyword matches: 0.9-1.0 confidence
- 2 matches: 0.75 confidence
- 1 match: 0.6 confidence
- No matches: 0.3 confidence (fallback)

### File Import Strategy

**Decision:** Parse entire file into memory, then process records sequentially.

**Rationale:**
- Simpler implementation
- Allows accurate row-level error reporting
- Suitable for files up to 10MB

**Trade-offs:**
- Memory usage scales with file size
- Not suitable for very large files (100MB+)

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Input Validation | Joi schema validation on all inputs |
| File Upload | File type and size restrictions (10MB max) |
| Error Messages | Sanitized errors without stack traces |
| Injection | No SQL (in-memory store), XML parser with safe defaults |

## Performance Considerations

| Operation | Performance Characteristic |
|-----------|---------------------------|
| Ticket CRUD | O(1) with Map-based storage |
| List with Filters | O(n) scan of all tickets |
| File Import | O(n) where n = number of records |
| Classification | O(k) where k = total keywords |

### Optimization Opportunities

1. Add indexing for common filter combinations
2. Implement pagination for large ticket lists
3. Use streaming parsers for large file imports
4. Cache classification results
