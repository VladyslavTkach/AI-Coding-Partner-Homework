# 🏦 Banking Transactions API - Implementation Plan

> **Technology Stack**: Node.js with Express.js  
> **Storage**: In-memory (JavaScript objects/arrays)  
> **Purpose**: This document serves as a comprehensive prompt for LLM-assisted implementation

---

## 📐 Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (curl/Postman)                     │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express.js Application                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Middleware Layer                          ││
│  │  • JSON Body Parser                                          ││
│  │  • Error Handler                                             ││
│  │  • Rate Limiter (Optional)                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Routes Layer                             ││
│  │  • /transactions (POST, GET)                                 ││
│  │  • /transactions/:id (GET)                                   ││
│  │  • /accounts/:accountId/balance (GET)                        ││
│  │  • /accounts/:accountId/summary (GET) [Optional]             ││
│  │  • /transactions/export (GET) [Optional]                     ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Validators Layer                           ││
│  │  • Transaction Validator                                     ││
│  │  • Account Format Validator                                  ││
│  │  • Currency Validator                                        ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Services Layer                            ││
│  │  • Transaction Service                                       ││
│  │  • Account Service                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 In-Memory Data Store                         ││
│  │  • transactions[] - Array of transaction objects             ││
│  │  • accounts{} - Object for account balances                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
homework-1/
├── src/
│   ├── index.js                 # Application entry point
│   ├── app.js                   # Express app configuration
│   ├── routes/
│   │   ├── index.js             # Route aggregator
│   │   ├── transactions.js      # Transaction routes
│   │   └── accounts.js          # Account routes
│   ├── controllers/
│   │   ├── transactionController.js
│   │   └── accountController.js
│   ├── services/
│   │   ├── transactionService.js
│   │   └── accountService.js
│   ├── validators/
│   │   └── transactionValidator.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js       # Optional
│   ├── models/
│   │   └── transaction.js       # Transaction model/schema
│   ├── store/
│   │   └── inMemoryStore.js     # In-memory data storage
│   └── utils/
│       ├── constants.js         # Currency codes, validation patterns
│       └── helpers.js           # Utility functions
├── tests/
│   ├── unit/
│   │   ├── validators/
│   │   │   └── transactionValidator.test.js
│   │   ├── services/
│   │   │   ├── transactionService.test.js
│   │   │   └── accountService.test.js
│   │   └── utils/
│   │       └── constants.test.js
│   ├── integration/
│   │   └── routes/
│   │       ├── transactions.test.js
│   │       ├── accounts.test.js
│   │       └── health.test.js
│   └── helpers/
│       └── testUtils.js         # Test utilities and fixtures
├── demo/
│   ├── run.sh
│   ├── sample-requests.http
│   └── sample-data.json
├── package.json
├── jest.config.js               # Jest configuration
├── .gitignore
├── README.md
└── HOWTORUN.md
```

### Data Models

#### Transaction Model
```javascript
{
  id: "string (UUID auto-generated)",
  fromAccount: "string (format: ACC-XXXXX)",
  toAccount: "string (format: ACC-XXXXX)",
  amount: "number (positive, max 2 decimal places)",
  currency: "string (ISO 4217: USD, EUR, GBP, JPY, etc.)",
  type: "string (deposit | withdrawal | transfer)",
  timestamp: "string (ISO 8601 datetime)",
  status: "string (pending | completed | failed)"
}
```

#### In-Memory Store Structure
```javascript
{
  transactions: [], // Array of transaction objects
  accounts: {
    "ACC-12345": {
      balance: 1000.00,
      currency: "USD"
    }
  }
}
```

---

## 📝 Implementation Plan

### Task 1: Project Setup & Core API Implementation

#### Step 1.1: Initialize Project
**Prompt:**
```
Create a new Node.js project with Express.js for a banking transactions API.

Requirements:
1. Initialize npm project with package.json
2. Install dependencies: express, uuid, cors
3. Install dev dependencies: nodemon
4. Create .gitignore file excluding node_modules, .env, coverage/, *.log
5. Set up npm scripts:
   - "start": "node src/index.js"
   - "dev": "nodemon src/index.js"
6. Create basic folder structure as specified in the architecture
```

#### Step 1.2: Create In-Memory Store
**Prompt:**
```
Create an in-memory data store module at src/store/inMemoryStore.js

Requirements:
1. Export an object containing:
   - transactions: empty array to store transaction objects
   - accounts: empty object to store account balances
2. Pre-populate with sample accounts for testing:
   - ACC-12345 with balance 1000.00 USD
   - ACC-67890 with balance 500.00 USD
   - ACC-11111 with balance 2500.00 EUR
3. Export helper functions:
   - getTransactions()
   - addTransaction(transaction)
   - getTransactionById(id)
   - getAccount(accountId)
   - updateAccountBalance(accountId, amount, operation)
```

#### Step 1.3: Create Express Application
**Prompt:**
```
Create the Express application setup at src/app.js

Requirements:
1. Import and configure express
2. Use express.json() middleware for parsing JSON bodies
3. Use cors middleware for cross-origin requests
4. Set up routes (to be implemented)
5. Add a health check endpoint GET /health returning { status: "ok" }
6. Export the configured app
```

#### Step 1.4: Implement Transaction Routes
**Prompt:**
```
Create transaction routes at src/routes/transactions.js

Implement the following endpoints:

1. POST /transactions
   - Create a new transaction
   - Auto-generate UUID for id
   - Set timestamp to current ISO 8601 datetime
   - Set initial status to "completed"
   - Update account balances based on transaction type
   - Return 201 with created transaction

2. GET /transactions
   - Return all transactions
   - Support query parameters for filtering (Task 3)
   - Return 200 with array of transactions

3. GET /transactions/:id
   - Return specific transaction by ID
   - Return 404 if not found with error message
   - Return 200 with transaction object

Use controller pattern - routes should call controller functions.
```

#### Step 1.5: Implement Account Routes
**Prompt:**
```
Create account routes at src/routes/accounts.js

Implement the following endpoint:

1. GET /accounts/:accountId/balance
   - Return current balance for the account
   - Return 404 if account not found
   - Response format: { accountId, balance, currency }

Use controller pattern - routes should call controller functions.
```

#### Step 1.6: Implement Controllers
**Prompt:**
```
Create controllers at src/controllers/

1. transactionController.js:
   - createTransaction(req, res)
   - getAllTransactions(req, res)
   - getTransactionById(req, res)

2. accountController.js:
   - getAccountBalance(req, res)

Controllers should:
- Handle HTTP request/response
- Call service layer for business logic
- Return appropriate status codes (200, 201, 400, 404)
- Handle errors gracefully
```

#### Step 1.7: Implement Services
**Prompt:**
```
Create services at src/services/

1. transactionService.js:
   - create(transactionData) - creates transaction and updates balances
   - getAll(filters) - returns filtered transactions
   - getById(id) - returns single transaction
   - Logic for updating account balances based on transaction type:
     * deposit: add to toAccount
     * withdrawal: subtract from fromAccount
     * transfer: subtract from fromAccount, add to toAccount

2. accountService.js:
   - getBalance(accountId) - returns account balance info
   - calculateBalance(accountId) - calculates balance from transactions

Services contain business logic and interact with the data store.
```

---

### Task 2: Transaction Validation

#### Step 2.1: Create Validation Constants
**Prompt:**
```
Create constants file at src/utils/constants.js

Include:
1. VALID_CURRENCIES array with ISO 4217 codes:
   ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR", "MXN", "BRL", "KRW", "SGD", "HKD", "NOK", "SEK", "DKK", "NZD", "ZAR", "RUB"]

2. ACCOUNT_PATTERN regex: /^ACC-[A-Za-z0-9]{5}$/

3. TRANSACTION_TYPES array: ["deposit", "withdrawal", "transfer"]

4. TRANSACTION_STATUSES array: ["pending", "completed", "failed"]
```

#### Step 2.2: Create Transaction Validator
**Prompt:**
```
Create validator at src/validators/transactionValidator.js

Implement validateTransaction(data) function that validates:

1. Amount validation:
   - Must be present
   - Must be a positive number
   - Maximum 2 decimal places
   - Error: "Amount must be a positive number with maximum 2 decimal places"

2. Account validation (fromAccount and toAccount):
   - Must match format ACC-XXXXX (X is alphanumeric)
   - For deposits: only toAccount required
   - For withdrawals: only fromAccount required
   - For transfers: both required
   - Error: "Account number must follow format ACC-XXXXX"

3. Currency validation:
   - Must be valid ISO 4217 code from VALID_CURRENCIES
   - Error: "Invalid currency code"

4. Type validation:
   - Must be one of: deposit, withdrawal, transfer
   - Error: "Invalid transaction type"

Return format for errors:
{
  isValid: false,
  errors: [
    { field: "amount", message: "Amount must be a positive number" },
    { field: "currency", message: "Invalid currency code" }
  ]
}

Return format for success:
{
  isValid: true,
  errors: []
}
```

#### Step 2.3: Integrate Validation into Controller
**Prompt:**
```
Update transactionController.js to use the validator

In createTransaction:
1. Call validateTransaction(req.body) before processing
2. If validation fails, return 400 with error response:
   {
     "error": "Validation failed",
     "details": [array of error objects]
   }
3. Only proceed with transaction creation if validation passes
```

---

### Task 3: Transaction Filtering

#### Step 3.1: Implement Filtering Logic
**Prompt:**
```
Update transactionService.js getAll() to support filtering

Implement filtering for GET /transactions with query parameters:

1. Filter by accountId:
   ?accountId=ACC-12345
   - Match transactions where fromAccount OR toAccount equals accountId

2. Filter by type:
   ?type=transfer
   - Match transactions with specified type

3. Filter by date range:
   ?from=2024-01-01&to=2024-01-31
   - from: include transactions on or after this date
   - to: include transactions on or before this date
   - Dates in ISO 8601 format

4. Combine multiple filters:
   ?accountId=ACC-12345&type=transfer&from=2024-01-01
   - All filters should be applied together (AND logic)

Implementation:
- Accept filters object from controller
- Apply each filter in sequence
- Return filtered array
```

---

### Task 4: Additional Feature - Transaction Summary Endpoint (Option A)

#### Step 4.1: Implement Summary Endpoint
**Prompt:**
```
Add transaction summary endpoint

Route: GET /accounts/:accountId/summary

Implementation:
1. Add route in src/routes/accounts.js
2. Add controller method getAccountSummary in accountController.js
3. Add service method getSummary in accountService.js

Response format:
{
  "accountId": "ACC-12345",
  "summary": {
    "totalDeposits": 1500.00,
    "totalWithdrawals": 300.00,
    "totalTransfers": {
      "sent": 200.00,
      "received": 100.00
    },
    "transactionCount": 10,
    "mostRecentTransaction": "2024-01-15T10:30:00Z"
  },
  "currentBalance": 1100.00
}

Logic:
- Calculate totalDeposits: sum of amounts where toAccount matches and type is "deposit"
- Calculate totalWithdrawals: sum of amounts where fromAccount matches and type is "withdrawal"
- Calculate transfers sent: sum where fromAccount matches and type is "transfer"
- Calculate transfers received: sum where toAccount matches and type is "transfer"
- Count all transactions involving the account
- Find most recent transaction timestamp
- Return 404 if account not found
```

---

### Task 5: Error Handling & Middleware

#### Step 5.1: Create Error Handler Middleware
**Prompt:**
```
Create error handler middleware at src/middleware/errorHandler.js

Requirements:
1. Catch all unhandled errors
2. Log error details to console
3. Return consistent error response format:
   {
     "error": "Error message",
     "details": [] (optional)
   }
4. Don't expose stack traces in production
5. Handle specific error types:
   - ValidationError: 400
   - NotFoundError: 404
   - Default: 500

Create custom error classes if needed.
```

---

### Task 6: Application Entry Point & Startup

#### Step 6.1: Create Entry Point
**Prompt:**
```
Create application entry point at src/index.js

Requirements:
1. Import configured app from app.js
2. Set PORT from environment variable or default to 3000
3. Start server listening on PORT
4. Log startup message: "Banking API running on port {PORT}"
5. Handle graceful shutdown on SIGTERM/SIGINT
```

---

### Task 7: Testing

#### Step 7.1: Setup Testing Framework
**Prompt:**
```
Set up testing framework for the Banking Transactions API

Requirements:
1. Install test dependencies:
   - jest (test runner)
   - supertest (HTTP assertions)
2. Add npm scripts to package.json:
   - "test": "jest"
   - "test:watch": "jest --watch"
   - "test:coverage": "jest --coverage"
3. Create jest.config.js with:
   - testEnvironment: "node"
   - coverageDirectory: "coverage"
   - collectCoverageFrom: ["src/**/*.js"]
4. Create test folder structure:
   tests/
   ├── unit/
   │   ├── validators/
   │   ├── services/
   │   └── utils/
   └── integration/
       └── routes/
```

#### Step 7.2: Unit Tests - Transaction Validator
**Prompt:**
```
Create unit tests at tests/unit/validators/transactionValidator.test.js

Test cases for validateTransaction():

1. Valid Transactions:
   - Valid deposit with all required fields → isValid: true
   - Valid withdrawal with all required fields → isValid: true
   - Valid transfer with all required fields → isValid: true

2. Amount Validation:
   - Missing amount → error for amount field
   - Negative amount → error "Amount must be a positive number"
   - Zero amount → error for amount field
   - Amount with 3+ decimal places → error about 2 decimal places
   - Valid amount with 2 decimals → isValid: true
   - Valid integer amount → isValid: true

3. Account Format Validation:
   - Invalid format "12345" → error about ACC-XXXXX format
   - Invalid format "ACC-1234" (4 chars) → error
   - Invalid format "ACC-123456" (6 chars) → error
   - Invalid format "acc-12345" → should pass (case insensitive) or fail based on implementation
   - Valid format "ACC-12345" → isValid: true
   - Valid format "ACC-Ab1C2" → isValid: true

4. Currency Validation:
   - Missing currency → error
   - Invalid currency "XXX" → error "Invalid currency code"
   - Lowercase "usd" → error or transform (based on implementation)
   - Valid currency "USD" → isValid: true
   - Valid currency "EUR" → isValid: true

5. Type Validation:
   - Missing type → error
   - Invalid type "payment" → error "Invalid transaction type"
   - Valid type "deposit" → isValid: true
   - Valid type "withdrawal" → isValid: true
   - Valid type "transfer" → isValid: true

6. Account Requirements by Type:
   - Deposit without toAccount → error
   - Withdrawal without fromAccount → error
   - Transfer without fromAccount → error
   - Transfer without toAccount → error
   - Transfer with both accounts → isValid: true

Use Jest describe/it blocks for organization.
```

#### Step 7.3: Unit Tests - Transaction Service
**Prompt:**
```
Create unit tests at tests/unit/services/transactionService.test.js

Test cases for transactionService:

1. create() method:
   - Creates transaction with auto-generated UUID
   - Sets timestamp to current datetime
   - Sets status to "completed"
   - Stores transaction in data store
   - Returns created transaction object
   - Updates account balance for deposit (increases toAccount)
   - Updates account balance for withdrawal (decreases fromAccount)
   - Updates account balances for transfer (both accounts)

2. getAll() method:
   - Returns empty array when no transactions
   - Returns all transactions when no filters
   - Filters by accountId (matches fromAccount)
   - Filters by accountId (matches toAccount)
   - Filters by type
   - Filters by date range (from only)
   - Filters by date range (to only)
   - Filters by date range (both from and to)
   - Combines multiple filters correctly

3. getById() method:
   - Returns transaction when found
   - Returns null/undefined when not found

Mock the in-memory store for isolated unit tests.
Use beforeEach to reset store state between tests.
```

#### Step 7.4: Unit Tests - Account Service
**Prompt:**
```
Create unit tests at tests/unit/services/accountService.test.js

Test cases for accountService:

1. getBalance() method:
   - Returns balance info for existing account
   - Returns null/undefined for non-existent account
   - Returns correct balance after transactions

2. getSummary() method (if implemented):
   - Returns correct totalDeposits
   - Returns correct totalWithdrawals
   - Returns correct transfers sent amount
   - Returns correct transfers received amount
   - Returns correct transaction count
   - Returns most recent transaction timestamp
   - Returns null for non-existent account
   - Handles account with no transactions

Mock dependencies and reset state between tests.
```

#### Step 7.5: Integration Tests - Transaction Routes
**Prompt:**
```
Create integration tests at tests/integration/routes/transactions.test.js

Use supertest to test HTTP endpoints:

1. POST /transactions:
   describe('POST /transactions')
   - Returns 201 and transaction object for valid deposit
   - Returns 201 and transaction object for valid withdrawal
   - Returns 201 and transaction object for valid transfer
   - Returns 400 for missing required fields
   - Returns 400 for invalid amount (negative)
   - Returns 400 for invalid account format
   - Returns 400 for invalid currency
   - Returns 400 for invalid type
   - Response includes auto-generated id
   - Response includes timestamp
   - Response includes status "completed"

2. GET /transactions:
   describe('GET /transactions')
   - Returns 200 with empty array initially
   - Returns 200 with all transactions
   - Returns 200 with filtered results by accountId
   - Returns 200 with filtered results by type
   - Returns 200 with filtered results by date range
   - Returns 200 with empty array when no matches

3. GET /transactions/:id:
   describe('GET /transactions/:id')
   - Returns 200 with transaction for valid id
   - Returns 404 for non-existent id
   - Response body contains error message for 404

Example test structure:
const request = require('supertest');
const app = require('../../../src/app');

describe('Transaction Routes', () => {
  beforeEach(() => {
    // Reset in-memory store
  });

  describe('POST /transactions', () => {
    it('should create a valid deposit transaction', async () => {
      const response = await request(app)
        .post('/transactions')
        .send({
          toAccount: 'ACC-12345',
          amount: 100.00,
          currency: 'USD',
          type: 'deposit'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(100.00);
    });
  });
});
```

#### Step 7.6: Integration Tests - Account Routes
**Prompt:**
```
Create integration tests at tests/integration/routes/accounts.test.js

Use supertest to test HTTP endpoints:

1. GET /accounts/:accountId/balance:
   describe('GET /accounts/:accountId/balance')
   - Returns 200 with balance for existing account
   - Returns correct balance amount
   - Returns correct currency
   - Returns 404 for non-existent account
   - Balance updates correctly after deposit
   - Balance updates correctly after withdrawal
   - Balance updates correctly after transfer

2. GET /accounts/:accountId/summary (if implemented):
   describe('GET /accounts/:accountId/summary')
   - Returns 200 with summary for existing account
   - Returns correct totalDeposits
   - Returns correct totalWithdrawals
   - Returns correct transfer amounts
   - Returns correct transaction count
   - Returns 404 for non-existent account

Example test:
describe('Account Routes', () => {
  describe('GET /accounts/:accountId/balance', () => {
    it('should return balance for existing account', async () => {
      const response = await request(app)
        .get('/accounts/ACC-12345/balance');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accountId', 'ACC-12345');
      expect(response.body).toHaveProperty('balance');
      expect(response.body).toHaveProperty('currency');
    });
  });
});
```

#### Step 7.7: Integration Tests - Health Check
**Prompt:**
```
Create integration test at tests/integration/routes/health.test.js

Test cases:
1. GET /health returns 200
2. GET /health returns { status: "ok" }

Example:
describe('Health Check', () => {
  it('should return status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
```

#### Step 7.8: Test Utilities and Helpers
**Prompt:**
```
Create test utilities at tests/helpers/testUtils.js

Include:
1. Function to reset in-memory store to initial state
2. Sample valid transaction objects for reuse
3. Sample invalid transaction objects for error testing
4. Helper to create multiple test transactions

Example:
const testUtils = {
  resetStore: () => { /* reset store */ },
  
  validDeposit: {
    toAccount: 'ACC-12345',
    amount: 100.00,
    currency: 'USD',
    type: 'deposit'
  },
  
  validWithdrawal: {
    fromAccount: 'ACC-12345',
    amount: 50.00,
    currency: 'USD',
    type: 'withdrawal'
  },
  
  validTransfer: {
    fromAccount: 'ACC-12345',
    toAccount: 'ACC-67890',
    amount: 25.00,
    currency: 'USD',
    type: 'transfer'
  },
  
  createTestTransactions: async (app, transactions) => {
    // Helper to seed test data
  }
};

module.exports = testUtils;
```

---

### Task 8: Demo Files & Documentation

#### Step 8.1: Create Run Script
**Prompt:**
```
Create run.sh script at demo/run.sh

Requirements:
1. Make executable with #!/bin/bash
2. Navigate to project root
3. Check if node_modules exists, if not run npm install
4. Start the application with npm start
5. Add helpful output messages
```

#### Step 8.2: Create Sample Requests File
**Prompt:**
```
Create sample-requests.http at demo/sample-requests.http

Include test requests for all endpoints:

1. Health Check
2. Create deposit transaction
3. Create withdrawal transaction
4. Create transfer transaction
5. Create invalid transaction (to test validation)
6. Get all transactions
7. Get transactions with filters
8. Get transaction by ID
9. Get non-existent transaction (404 test)
10. Get account balance
11. Get account summary (if implemented)

Use .http format compatible with VS Code REST Client.
```

#### Step 8.3: Create Sample Data
**Prompt:**
```
Create sample-data.json at demo/sample-data.json

Include sample transactions for testing:
- 3 deposits to different accounts
- 2 withdrawals
- 3 transfers between accounts
- Mix of currencies (USD, EUR, GBP)
- Different dates for filter testing
```

#### Step 8.4: Update Documentation
**Prompt:**
```
Update HOWTORUN.md with complete instructions:

1. Prerequisites (Node.js version, npm)
2. Installation steps
3. Running the application
4. Testing with sample requests
5. API endpoints documentation with examples
6. Error codes and their meanings
```

---

## ✅ Implementation Checklist

### Task 1: Core API Implementation
- [ ] Project initialized with package.json
- [ ] Dependencies installed (express, uuid, cors)
- [ ] Folder structure created
- [ ] In-memory store implemented
- [ ] Express app configured
- [ ] POST /transactions working
- [ ] GET /transactions working
- [ ] GET /transactions/:id working
- [ ] GET /accounts/:accountId/balance working

### Task 2: Transaction Validation
- [ ] Constants file created
- [ ] Validator implemented
- [ ] Amount validation (positive, 2 decimals)
- [ ] Account format validation (ACC-XXXXX)
- [ ] Currency validation (ISO 4217)
- [ ] Type validation (deposit/withdrawal/transfer)
- [ ] Error response format correct

### Task 3: Transaction Filtering
- [ ] Filter by accountId
- [ ] Filter by type
- [ ] Filter by date range (from/to)
- [ ] Multiple filters combined

### Task 4: Additional Feature
- [ ] Transaction summary endpoint
- [ ] Total deposits calculation
- [ ] Total withdrawals calculation
- [ ] Transaction count
- [ ] Most recent transaction date

### Task 7: Testing
- [ ] Jest and supertest installed
- [ ] Jest configuration created
- [ ] Test folder structure created
- [ ] Unit tests - Transaction Validator
- [ ] Unit tests - Transaction Service
- [ ] Unit tests - Account Service
- [ ] Integration tests - Transaction Routes
- [ ] Integration tests - Account Routes
- [ ] Integration tests - Health Check
- [ ] Test utilities and helpers created
- [ ] All tests passing
- [ ] Test coverage > 80%

### Demo & Documentation
- [ ] run.sh script created
- [ ] sample-requests.http created
- [ ] sample-data.json created
- [ ] HOWTORUN.md updated
- [ ] README.md updated

---

## 🧪 Testing Checklist

Test each endpoint with the following scenarios:

### POST /transactions
- [x] Valid deposit transaction → 201
- [x] Valid withdrawal transaction → 201
- [x] Valid transfer transaction → 201
- [x] Invalid amount (negative) → 400
- [x] Invalid amount (too many decimals) → 400
- [x] Invalid account format → 400
- [x] Invalid currency → 400
- [x] Missing required fields → 400

### GET /transactions
- [x] Get all transactions → 200
- [x] Filter by accountId → 200
- [x] Filter by type → 200
- [x] Filter by date range → 200
- [x] Combined filters → 200
- [x] No matching results → 200 with empty array

### GET /transactions/:id
- [x] Existing transaction → 200
- [x] Non-existent ID → 404

### GET /accounts/:accountId/balance
- [x] Existing account → 200
- [x] Non-existent account → 404

### GET /accounts/:accountId/summary (Optional)
- [x] Existing account with transactions → 200
- [x] Existing account without transactions → 200
- [x] Non-existent account → 404

---

## 📋 HTTP Status Codes Reference

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET requests |
| 201 | Created | Successful POST (transaction created) |
| 400 | Bad Request | Validation errors, malformed requests |
| 404 | Not Found | Transaction or account not found |
| 429 | Too Many Requests | Rate limit exceeded (if implemented) |
| 500 | Internal Server Error | Unexpected server errors |

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Start in production mode
npm start

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Test health endpoint
curl http://localhost:3000/health

# Create a test transaction
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"fromAccount":"ACC-12345","toAccount":"ACC-67890","amount":50.00,"currency":"USD","type":"transfer"}'
```

---

*This implementation plan is designed to be executed step-by-step using AI coding assistants. Each prompt is self-contained and builds upon the previous steps.*
