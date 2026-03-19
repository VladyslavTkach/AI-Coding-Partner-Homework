# AI-Powered Multi-Agent Banking Pipeline — Project Context & Rules

## Project Overview

This is a Node.js + TypeScript multi-agent pipeline that processes banking transactions through three sequential agents: Transaction Validator → Fraud Detector → Settlement Processor. The integrator orchestrates the pipeline; an optional Express server exposes read-only HTTP endpoints over the results.

## Directory Structure

```
homework-6/
├── src/
│   ├── types.ts                        # Shared TypeScript interfaces
│   ├── integrator.ts                   # Pipeline orchestrator (entry point)
│   ├── server.ts                       # Express HTTP API
│   └── agents/
│       ├── transaction_validator.ts
│       ├── fraud_detector.ts
│       └── settlement_processor.ts
├── dist/                               # Compiled output (tsc)
├── shared/
│   ├── results/                        # One JSON file per processed transaction
│   └── logs/
│       └── audit.log                   # Append-only audit trail
├── tests/
│   └── *.test.ts                       # Jest test files
├── sample-transactions.json            # 8 raw input transactions
├── specification.md                    # Full project specification
├── package.json
├── tsconfig.json
└── HOWTORUN.md
```

## Non-Negotiable Rules

### Language & Build
- TypeScript strict mode (`"strict": true` in `tsconfig.json`)
- All source in `src/`, compiled output in `dist/`
- Run with: `node dist/integrator.js` (after `tsc`)
- Tests with Jest + ts-jest; target ≥ 90% coverage

### Monetary Values
- **Never use `number` for monetary amounts**
- Always parse `transaction.amount` with `big.js` (`new Big(transaction.amount)`)
- Use `big.js` for all threshold comparisons (`.gt()`, `.lte()`, etc.)

### Shared Types (`src/types.ts`)
- `Transaction` — raw input shape; `amount` is `string`
- `Message` — pipeline envelope; carries `transaction`, `status`, `reason`, `fraud_risk`, `fraud_risk_score`, `agent_log`
- `AgentLogEntry` — `{ timestamp: string; agentName: string; transactionId: string; outcome: string }`
- `AgentResult` — `{ message: Message; log: AgentLogEntry }`

### Agent Contract
Every agent file exports exactly one function:
```typescript
export async function processMessage(message: Message): Promise<Message>
```
Agents must:
1. Append an `AgentLogEntry` to `message.agent_log` before returning
2. Never throw — wrap all logic in try/catch and return a `rejected`/`declined` message on error
3. Mask account numbers in all log/console output (last 4 chars only, prefix `****`)

### Pipeline Status Flow
```
pending → validated → settled
pending → rejected  → declined
validated → declined  (if fraud_risk === 'HIGH')
```

### Currency Whitelist (ISO 4217)
Accepted values: `USD`, `EUR`, `GBP`, `JPY`

### Fraud Scoring (additive, 0–10)
| Condition                        | Points |
|----------------------------------|--------|
| amount > 50,000                  | +4     |
| 10,000 < amount ≤ 50,000         | +3     |
| 1,000 < amount ≤ 10,000          | +1     |
| hour 02:00–05:00 UTC             | +2     |
| cross_border === true            | +1     |

Risk levels: 0–2 → `LOW`, 3–6 → `MEDIUM`, 7–10 → `HIGH`

### File I/O
- Results: `shared/results/<transaction_id>.json` (written by SettlementProcessor)
- Audit log: `shared/results/` and `shared/logs/` directories — create if absent
- Audit log format: one JSON line per `AgentLogEntry`, appended to `shared/logs/audit.log`

### Error Handling
- Uncaught errors inside an agent must be caught; return `status: 'rejected'` with `reason: 'INTERNAL_ERROR'`
- The integrator must catch per-transaction failures and continue processing remaining transactions
- The pipeline must never crash — process all 8 transactions regardless of individual errors

### Express API (`src/server.ts`)
- `GET /status/:transaction_id` — returns result JSON (200) or `{ error: 'NOT_FOUND' }` (404)
- `GET /results` — returns array of all result objects (200)
- Reject `transaction_id` values containing `..`, `/`, or `\\` with 400 + `{ error: 'INVALID_ID' }`
- Default port: `process.env.PORT ?? 3000`
- Export the Express `app` for testing (do not call `.listen()` when imported as a module)

## Key Reason Codes

| Code                      | Set by                  | Meaning                              |
|---------------------------|-------------------------|--------------------------------------|
| `MISSING_FIELD: <name>`   | TransactionValidator    | Required field absent or empty       |
| `INVALID_AMOUNT`          | TransactionValidator    | Amount unparseable or ≤ 0            |
| `INVALID_CURRENCY`        | TransactionValidator    | Currency not in ISO 4217 whitelist   |
| `HIGH_FRAUD_RISK`         | SettlementProcessor     | fraud_risk === 'HIGH'                |
| `INTERNAL_ERROR`          | Any agent               | Unexpected exception caught          |

## Sample Transaction Shape

```json
{
  "transaction_id": "T001",
  "amount": "1500.00",
  "currency": "USD",
  "source_account": "ACC-0001",
  "destination_account": "ACC-0002",
  "timestamp": "2024-01-15T14:30:00Z",
  "cross_border": false
}
```

## Running the Project

```bash
npm install
npx tsc
node dist/integrator.js          # run the pipeline
node dist/server.js              # start the API server (optional)
npm test                         # run Jest tests
npm run test:coverage            # coverage report
```
