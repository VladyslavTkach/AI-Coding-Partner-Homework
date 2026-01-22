# How to Run the Banking Transactions API

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

## Installation

```bash
# Navigate to the project directory
cd homework-1

# Install dependencies
npm install
```

## Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The API will start on `http://localhost:3000` (or the port specified in the `PORT` environment variable).

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## API Endpoints

### Health Check
```
GET /health
```
Returns: `{ "status": "ok" }`

### Transactions

#### Create Transaction
```
POST /transactions
Content-Type: application/json

{
  "toAccount": "ACC-12345",    // Required for deposit/transfer
  "fromAccount": "ACC-67890",  // Required for withdrawal/transfer
  "amount": 100.00,            // Positive number, max 2 decimals
  "currency": "USD",           // ISO 4217 code
  "type": "deposit"            // deposit | withdrawal | transfer
}
```

#### Get All Transactions
```
GET /transactions
GET /transactions?accountId=ACC-12345
GET /transactions?type=transfer
GET /transactions?from=2024-01-01&to=2024-12-31
```

#### Get Transaction by ID
```
GET /transactions/:id
```

### Accounts

#### Get Account Balance
```
GET /accounts/:accountId/balance
```
Returns: `{ "accountId": "ACC-12345", "balance": 1000.00, "currency": "USD" }`

#### Get Account Summary
```
GET /accounts/:accountId/summary
```
Returns detailed summary with deposits, withdrawals, transfers, and transaction count.

## Sample Requests

### Using curl

```bash
# Health check
curl http://localhost:3000/health

# Create a deposit
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"toAccount":"ACC-12345","amount":100.00,"currency":"USD","type":"deposit"}'

# Get all transactions
curl http://localhost:3000/transactions

# Get account balance
curl http://localhost:3000/accounts/ACC-12345/balance
```

### Using VS Code REST Client

Open `demo/sample-requests.http` in VS Code with the REST Client extension.

## Pre-configured Test Accounts

| Account ID | Initial Balance | Currency |
|------------|-----------------|----------|
| ACC-12345  | 1000.00         | USD      |
| ACC-67890  | 500.00          | USD      |
| ACC-11111  | 2500.00         | EUR      |

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200  | Success |
| 201  | Created |
| 400  | Validation Error |
| 404  | Not Found |
| 500  | Server Error |
