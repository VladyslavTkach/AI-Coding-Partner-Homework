# Specification: AI-Powered Multi-Agent Banking Pipeline

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

---

## 1. High-Level Objective

Build a 3-agent Node.js + TypeScript pipeline that validates, scores for fraud risk, and settles banking transactions using file-based JSON message passing, with an optional Express HTTP API for status queries.

---

## 2. Mid-Level Objectives

- Transactions with missing or invalid required fields (transaction_id, amount, currency, source_account, destination_account) are rejected with a specific reason code (e.g., `MISSING_FIELD`, `INVALID_AMOUNT`, `INVALID_CURRENCY`)
- Transactions above $10,000 are assigned `fraud_risk: "HIGH"` by the Fraud Detector agent; transactions between $1,000–$10,000 are `"MEDIUM"`; below $1,000 are `"LOW"`
- Validated, low-risk transactions are written to `shared/results/` with `status: "settled"`; rejected or high-risk transactions are written with `status: "declined"` and a `reason` field
- All agent operations produce an audit log entry with ISO 8601 timestamp, agent name, transaction_id, and outcome — account numbers are masked to last 4 characters in all log output
- The pipeline processes all 8 transactions from `sample-transactions.json` without crashing, even if individual transactions contain errors

---

## 3. Implementation Notes

- **Language**: TypeScript (strict mode) compiled with `tsc`; all source files in `src/`, compiled output in `dist/`
- **Framework**: Express for the optional HTTP status API — `GET /status/:transaction_id` and `GET /results`
- **Monetary values**: use `big.js` (or `decimal.js`) for all amount comparisons and arithmetic — never use TypeScript `number` for monetary amounts
- **Types**: define shared TypeScript interfaces in `src/types.ts` — at minimum: `Transaction`, `Message`, `AgentResult`
- **Currency validation**: ISO 4217 whitelist — at minimum: `USD`, `EUR`, `GBP`, `JPY`
- **Logging**: write an audit trail entry per agent operation including `timestamp` (ISO 8601), `agentName`, `transactionId`, and `outcome`; log to both console and `shared/logs/audit.log`
- **PII masking**: all log output must show only the last 4 characters of account numbers (e.g., `****1234`)
- **File I/O**: agents read input from `shared/inbox/` and write output to `shared/results/`; the integrator seeds the inbox from `sample-transactions.json`
- **Error handling**: uncaught errors within any agent must be caught, logged with the reason, and must not crash the pipeline — process remaining transactions

---

## 4. Context

- **Beginning state**: `sample-transactions.json` exists at the project root with 8 raw transaction records. No agent source files exist. No `shared/` directories exist. A `package.json` and `tsconfig.json` are present (or will be created as part of setup).
- **Ending state**: All 8 transactions processed. Result files written to `shared/results/` (one JSON file per transaction). Audit log at `shared/logs/audit.log`. Test coverage ≥ 90% (Jest). `README.md` and `HOWTORUN.md` are complete and accurate.

---

## 5. Low-Level Tasks

---

### Task: Types

**Prompt**:
"Context: We are building a Node.js + TypeScript multi-agent banking pipeline. All source files live in `src/`. TypeScript strict mode is enabled.

Task: Create `src/types.ts` defining shared TypeScript interfaces used across all agents and the integrator.

Rules:
- Define `Transaction` with fields: `transaction_id: string`, `amount: string` (raw string from JSON — will be parsed with big.js), `currency: string`, `source_account: string`, `destination_account: string`, `timestamp: string`, and optional `cross_border?: boolean`
- Define `Message` with fields: `transaction: Transaction`, `status: 'pending' | 'validated' | 'rejected' | 'settled' | 'declined'`, optional `reason?: string`, optional `fraud_risk?: 'LOW' | 'MEDIUM' | 'HIGH'`, optional `fraud_risk_score?: number`, optional `agent_log?: AgentLogEntry[]`
- Define `AgentLogEntry` with fields: `timestamp: string`, `agentName: string`, `transactionId: string`, `outcome: string`
- Define `AgentResult` as `{ message: Message; log: AgentLogEntry }`
- Export all interfaces

Output: A single file `src/types.ts` with all interfaces. No runtime logic."

**File to CREATE**: `src/types.ts`
**Function to CREATE**: N/A (interfaces only)
**Details**: All interfaces must be exported. `amount` stays as `string` in `Transaction` so agents can parse it with `big.js` without precision loss. `agent_log` accumulates entries as the message passes through the pipeline.

---

### Task: Transaction Validator

**Prompt**:
"Context: We are building a Node.js + TypeScript multi-agent banking pipeline. `src/types.ts` already exists with `Transaction`, `Message`, and `AgentLogEntry` interfaces. Install `big.js` and `@types/big.js` if not present.

Task: Create `src/agents/transaction_validator.ts` — a Transaction Validator agent.

Rules:
- Export an async function `processMessage(message: Message): Promise<Message>`
- Validate that required fields exist and are non-empty: `transaction_id`, `amount`, `currency`, `source_account`, `destination_account`, `timestamp`
- Parse `amount` using `big.js`; reject if parsing fails or if the value is ≤ 0 (reason code: `INVALID_AMOUNT`)
- Validate `currency` against ISO 4217 whitelist: `['USD', 'EUR', 'GBP', 'JPY']`; reject with reason `INVALID_CURRENCY` if not in list
- If any required field is missing or empty, reject with reason `MISSING_FIELD: <field_name>`
- On success, return message with `status: 'validated'`
- On failure, return message with `status: 'rejected'` and the `reason` field set
- Append an `AgentLogEntry` to `message.agent_log` with `agentName: 'TransactionValidator'`, the transaction's `transactionId`, ISO 8601 `timestamp`, and `outcome` ('validated' or 'rejected: <reason>')
- Mask account numbers in log output (show only last 4 chars, prefix with ****)
- Wrap the entire function body in try/catch; on unexpected error log it and return message with `status: 'rejected'` and `reason: 'INTERNAL_ERROR'`

Examples:
- Input: `{ transaction_id: 'T001', amount: '-50', currency: 'USD', ... }` → Output: `status: 'rejected', reason: 'INVALID_AMOUNT'`
- Input: `{ transaction_id: 'T002', amount: '100', currency: 'XYZ', ... }` → Output: `status: 'rejected', reason: 'INVALID_CURRENCY'`
- Input: valid transaction → Output: `status: 'validated'`

Output: `src/agents/transaction_validator.ts` with the exported `processMessage` function."

**File to CREATE**: `src/agents/transaction_validator.ts`
**Function to CREATE**: `processMessage(message: Message) => Promise<Message>`
**Details**: Uses `big.js` for amount parsing. Rejects with specific reason codes. Appends to `agent_log`. Never throws — catches all errors internally.

---

### Task: Fraud Detector

**Prompt**:
"Context: We are building a Node.js + TypeScript multi-agent banking pipeline. `src/types.ts` exists with `Message`, `Transaction`, `AgentLogEntry` interfaces. `big.js` is installed. The Transaction Validator has already run and set `status: 'validated'` or `status: 'rejected'`.

Task: Create `src/agents/fraud_detector.ts` — a Fraud Detector agent.

Rules:
- Export an async function `processMessage(message: Message): Promise<Message>`
- If `message.status` is `'rejected'`, return the message unchanged (skip fraud scoring)
- Score the transaction on a 0–10 integer scale using these additive rules (parsed with big.js):
  - Amount > 50,000: +4 points
  - Amount > 10,000 (and ≤ 50,000): +3 points
  - Amount > 1,000 (and ≤ 10,000): +1 point
  - Transaction timestamp hour between 02:00–05:00 (UTC): +2 points
  - `cross_border === true`: +1 point
- Map score to risk level: 0–2 → `'LOW'`, 3–6 → `'MEDIUM'`, 7–10 → `'HIGH'`
- Set `message.fraud_risk_score` and `message.fraud_risk` on the returned message
- Append an `AgentLogEntry` with `agentName: 'FraudDetector'`, transactionId, ISO 8601 timestamp, and outcome (e.g., `'scored: HIGH (8)'`)
- Mask account numbers in any log output
- Wrap in try/catch; on unexpected error log it and return message unchanged with an error log entry

Examples:
- Amount: 75000, cross_border: true, hour: 03:00 UTC → score: 4+2+1 = 7 → `'HIGH'`
- Amount: 500, no flags → score: 0 → `'LOW'`
- Amount: 5000, hour: 14:00 → score: 1 → `'LOW'`

Output: `src/agents/fraud_detector.ts` with the exported `processMessage` function."

**File to CREATE**: `src/agents/fraud_detector.ts`
**Function to CREATE**: `processMessage(message: Message) => Promise<Message>`
**Details**: Uses `big.js` for threshold comparisons. Skips already-rejected messages. Scoring is additive with the listed point rules. Appends to `agent_log`.

---

### Task: Settlement Processor

**Prompt**:
"Context: We are building a Node.js + TypeScript multi-agent banking pipeline. `src/types.ts` exists with `Message`, `AgentLogEntry` interfaces. The Transaction Validator and Fraud Detector have already run and set `status` and `fraud_risk` fields.

Task: Create `src/agents/settlement_processor.ts` — a Settlement Processor agent.

Rules:
- Export an async function `processMessage(message: Message): Promise<Message>`
- If `message.status === 'rejected'`, return message with `status: 'declined'` and preserve the existing `reason`
- If `message.fraud_risk === 'HIGH'`, set `status: 'declined'` and `reason: 'HIGH_FRAUD_RISK'`
- If `message.status === 'validated'` and `fraud_risk` is `'LOW'` or `'MEDIUM'`, set `status: 'settled'`
- Append an `AgentLogEntry` with `agentName: 'SettlementProcessor'`, transactionId, ISO 8601 timestamp, and outcome (`'settled'` or `'declined: <reason>'`)
- Write the final message as a JSON file to `shared/results/<transaction_id>.json` (create the directory if it does not exist)
- Mask account numbers in log output
- Wrap in try/catch; on unexpected error log it, set `status: 'declined'`, `reason: 'INTERNAL_ERROR'`, and still attempt to write the result file

Output: `src/agents/settlement_processor.ts` with the exported `processMessage` function."

**File to CREATE**: `src/agents/settlement_processor.ts`
**Function to CREATE**: `processMessage(message: Message) => Promise<Message>`
**Details**: Final decision point of the pipeline. Writes one result file per transaction to `shared/results/`. Creates the directory if absent. Declined transactions always include a `reason`.

---

### Task: Integrator

**Prompt**:
"Context: We are building a Node.js + TypeScript multi-agent banking pipeline. `src/types.ts`, `src/agents/transaction_validator.ts`, `src/agents/fraud_detector.ts`, and `src/agents/settlement_processor.ts` all exist. `sample-transactions.json` is at the project root and contains an array of 8 `Transaction` objects. `big.js` is installed.

Task: Create `src/integrator.ts` — the pipeline orchestrator.

Rules:
- Export an async function `runPipeline(): Promise<void>`
- Read `sample-transactions.json` from the project root and parse it as `Transaction[]`
- For each transaction, construct an initial `Message` with `status: 'pending'` and empty `agent_log: []`
- Pass the message sequentially through: `transactionValidator.processMessage` → `fraudDetector.processMessage` → `settlementProcessor.processMessage`
- After the full pipeline, write the complete audit log for that transaction to `shared/logs/audit.log` (append mode, create directory if absent), one line per `AgentLogEntry` in JSON format
- If any individual transaction throws an uncaught error, log the error and continue to the next transaction — do not crash the pipeline
- After all transactions, print a summary to stdout: total processed, settled count, declined count
- Also export the `runPipeline` function so it can be called from tests
- In a `main` block (e.g., `if (require.main === module)`), call `runPipeline()` so `node dist/integrator.js` runs the pipeline

Output: `src/integrator.ts` with the exported `runPipeline` function and a main block."

**File to CREATE**: `src/integrator.ts`
**Function to CREATE**: `runPipeline() => Promise<void>`
**Details**: Orchestrates the full pipeline. Reads from `sample-transactions.json`. Appends audit log lines. Prints summary. Never crashes on individual transaction failures.

---

### Task: Express API

**Prompt**:
"Context: We are building a Node.js + TypeScript multi-agent banking pipeline. `src/types.ts` and `src/integrator.ts` exist. Result files are written to `shared/results/<transaction_id>.json` by the Settlement Processor. Express and `@types/express` are installed (or install them).

Task: Create `src/server.ts` — an Express HTTP API for querying pipeline results.

Rules:
- Create an Express app and export it (for testing)
- Implement `GET /status/:transaction_id`: read `shared/results/<transaction_id>.json`; return the JSON contents with HTTP 200 if found, or `{ error: 'NOT_FOUND' }` with HTTP 404 if the file does not exist
- Implement `GET /results`: list all files in `shared/results/`, read each, and return an array of all result objects with HTTP 200; return an empty array if the directory does not exist
- Sanitize the `:transaction_id` path parameter — reject any value containing path traversal characters (`..`, `/`, `\\`) with HTTP 400 and `{ error: 'INVALID_ID' }`
- Listen on `PORT` from environment variable, defaulting to 3000
- In a `main` block (`if (require.main === module)`), start the server and log the port
- Do not call `runPipeline` from the server — the server is read-only

Output: `src/server.ts` with the exported Express app and two GET endpoints."

**File to CREATE**: `src/server.ts`
**Function to CREATE**: Express app with `GET /status/:transaction_id` and `GET /results`
**Details**: Read-only API over `shared/results/`. Sanitizes transaction_id to prevent path traversal. Exports the app for Jest/supertest integration tests.

---

## Prompt Engineering Notes

Each Low-Level Task prompt follows this structure:

```
Context:     [What exists — files, tech stack, installed packages]
Task:        [Exactly what to build — file path and function signature]
Rules:       [Non-negotiable requirements — big.js, logging, masking, error handling]
Examples:    [Sample input/output where helpful]
Output:      [Expected file and exported symbol]
```

Prompts are self-contained — paste any single prompt into Claude Code and get a working, tested result without needing additional context.
