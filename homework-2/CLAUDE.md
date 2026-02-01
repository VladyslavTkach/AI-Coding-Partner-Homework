# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Homework 2 for the "AI as a Personalized Coding Partner" course. The project is a **Customer Support Ticket Management System** - a REST API that imports tickets from multiple file formats (CSV, JSON, XML), auto-categorizes issues, and assigns priorities.

**Tech Stack:** Node.js + Express + TypeScript

## Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run development server (with ts-node)
npm run dev

# Run production server (after build)
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for tests
npm run test:watch
```

## Architecture

The project follows a layered architecture:

```
src/
├── controllers/     # HTTP request handlers (thin layer)
├── services/        # Business logic (ticketService, importService)
├── parsers/         # File format parsers (CSV, JSON, XML)
├── validators/      # Input validation using Joi
├── models/          # Ticket data model
├── store/           # In-memory data store (singleton)
├── middleware/      # Error handling middleware
├── routes/          # Express route definitions
├── types/           # TypeScript interfaces and enums
└── utils/           # Constants and helpers
```

**Key Design Patterns:**
- Singleton pattern for in-memory store
- Service layer for business logic (controllers stay thin)
- Custom error classes (ValidationError, NotFoundError) with consistent error response format

## Ticket Model Enums

- **Category:** account_access, technical_issue, billing_question, feature_request, bug_report, other
- **Priority:** urgent, high, medium, low
- **Status:** new, in_progress, waiting_customer, resolved, closed
- **Source:** web_form, email, api, chat, phone
- **DeviceType:** desktop, mobile, tablet

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /tickets | Create ticket |
| POST | /tickets/import | Bulk import (multipart file) |
| GET | /tickets | List with filters (category, priority, status, customer_id, assigned_to) |
| GET | /tickets/:id | Get by ID |
| PUT | /tickets/:id | Update |
| DELETE | /tickets/:id | Delete |

Note: Auto-classification endpoint (`POST /tickets/:id/auto-classify`) is planned for Task 2.

## Validation Rules

- `subject`: 1-200 characters
- `description`: 10-2000 characters
- `customer_email`: valid email format
- All enum fields validated against allowed values

## Test Requirements

Target >85% code coverage. Test files should be organized as:
- test_ticket_api - API endpoint tests
- test_ticket_model - Data validation
- test_import_csv/json/xml - Parser tests
- test_categorization - Classification logic
- test_integration - End-to-end workflows
- test_performance - Benchmarks
