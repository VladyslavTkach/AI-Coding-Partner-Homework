# 🏦 Homework 1: Banking Transactions API

> **Student Name**: Vladyslav Tkach  
> **Date Submitted**: January 24, 2026  
> **AI Tools Used**: GitHub Copilot, Claude Code

---

## 📋 Project Overview

This project implements a RESTful Banking Transactions API built with Node.js and Express.js. The API provides core banking operations including creating transactions (deposits, withdrawals, transfers), querying transaction history with filtering capabilities, and checking account balances. All data is stored in-memory, making it ideal for development and testing purposes.

### Key Features
- ✅ Create and manage banking transactions (deposit, withdrawal, transfer)
- ✅ Query transactions with multiple filter options (account, type, date range)
- ✅ Real-time account balance tracking
- ✅ Account summary with transaction statistics
- ✅ Comprehensive input validation with meaningful error messages
- ✅ Full test coverage (unit and integration tests)

---

## 🏗️ Solution Architecture

### Layered Architecture

The application follows a clean layered architecture pattern for maintainability and testability:

```
┌─────────────────────────────────────────────┐
│              Routes Layer                    │
│    (HTTP request/response handling)          │
├─────────────────────────────────────────────┤
│            Controllers Layer                 │
│    (Request orchestration)                   │
├─────────────────────────────────────────────┤
│            Validators Layer                  │
│    (Input validation & sanitization)         │
├─────────────────────────────────────────────┤
│             Services Layer                   │
│    (Business logic & data processing)        │
├─────────────────────────────────────────────┤
│           In-Memory Store                    │
│    (Data persistence)                        │
└─────────────────────────────────────────────┘
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `routes/` | Define API endpoints and HTTP methods |
| `controllers/` | Handle request/response flow |
| `validators/` | Validate input data (amount, account format, currency) |
| `services/` | Implement business logic for transactions and accounts |
| `store/` | Manage in-memory data storage |
| `middleware/` | Handle cross-cutting concerns (error handling) |
| `utils/` | Store constants and helper functions |

---

## 🛠️ Approach & Methodology

### Development Workflow

1. **Planning Phase**: Created a detailed implementation plan using AI assistance
2. **Incremental Development**: Built features in small, testable increments
3. **Test-Driven Development**: Wrote tests alongside implementation
4. **Iterative Refinement**: Used AI feedback to improve code quality

### Design Decisions

- **In-Memory Storage**: Chose JavaScript objects/arrays for simplicity and fast development
- **UUID for IDs**: Used `uuid` library for generating unique transaction identifiers
- **ISO Standards**: Followed ISO 4217 for currencies and ISO 8601 for timestamps
- **Validation Pattern**: Account numbers follow `ACC-XXXXX` format for consistency

---

## 🤖 AI Tools Usage

### GitHub Copilot - Implementation Planning

**Used For**: Creating the comprehensive implementation plan (`IMPLEMENTATION_PLAN.md`)

**How It Helped**:
- Generated the complete architecture diagram and project structure
- Outlined all API endpoints with request/response specifications
- Defined the data models and validation rules
- Created a phased implementation roadmap with clear tasks
- Specified test cases for unit, integration, and E2E testing

**Prompting Strategy**:
- Provided the task requirements from `TASKS.md` as context
- Asked for a structured implementation plan suitable for LLM-assisted coding
- Requested architecture diagrams, code examples, and test specifications

### Claude Code - Implementation

**Used For**: Writing the actual application code and tests

**How It Helped**:
- Implemented the Express.js application structure
- Created services with business logic for transactions and accounts
- Built comprehensive input validation with detailed error messages
- Wrote unit tests for validators and services
- Wrote integration tests for all API endpoints
- Set up Jest configuration for test coverage

**Prompting Strategy**:
- Used the implementation plan as a reference document
- Asked for incremental feature implementation
- Requested tests to be written alongside each feature
- Iterated on error handling and edge cases

---

## 📊 Test Coverage

The project includes comprehensive test coverage:

### Unit Tests
- **Validators**: Transaction validation logic (amount, currency, account format)
- **Services**: Transaction and account service business logic

### Integration Tests
- **Routes**: Full API endpoint testing with HTTP requests
- **Error Handling**: Validation errors and edge cases

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

The API will be available at `http://localhost:3000`

---

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/transactions` | Create a new transaction |
| `GET` | `/transactions` | List all transactions (with filters) |
| `GET` | `/transactions/:id` | Get transaction by ID |
| `GET` | `/accounts/:accountId/balance` | Get account balance |
| `GET` | `/accounts/:accountId/summary` | Get account summary |

---

<div align="center">

*This project was completed as part of the AI-Assisted Development course.*

</div>
