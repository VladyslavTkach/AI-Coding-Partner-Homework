Generate a complete `specification.md` file for the AI-Powered Multi-Agent Banking Pipeline project implemented in Node.js with TypeScript and Express.

The specification must follow this exact structure and be saved as `homework-6/specification.md`.

---

## Reference templates

Before generating the specification, read and incorporate patterns from these two template files:
- `homework-6/specification-TEMPLATE-hint.md` — quick-reference template for this project
- `homework-3/specification-TEMPLATE-example.md` — full example template with detailed section guidance and prompt engineering best practices

Use the homework-3 template for section structure and prompt engineering patterns (Context / Task / Constraints / Examples / Output Format). Use the homework-6 hint for project-specific constraints (Node.js, TypeScript, big.js, ISO 4217, shared/ directories).

---

## Structure to follow

### 1. High-Level Objective
One sentence describing what the Node.js + TypeScript pipeline does end-to-end.

### 2. Mid-Level Objectives (4–5 items)
Concrete, testable requirements. Each must be something you can write a unit or integration test for. Examples of the kind of requirements to include:
- Transactions with invalid or missing fields are rejected with a specific reason code
- Transactions above $10,000 are flagged with fraud_risk: "HIGH"
- Rejected transactions are written to `shared/results/` with a `reason` field
- All agent operations are logged with ISO 8601 timestamps
- The pipeline processes all 8 transactions from `sample-transactions.json`

### 3. Implementation Notes
Include all of the following constraints:
- Language: TypeScript (strict mode) compiled with `tsc`; all source files in `src/`, compiled output in `dist/`
- Framework: Express for the optional HTTP status API (e.g. `GET /status/:transaction_id`)
- Monetary values: use a precise decimal library (e.g. `big.js` or `decimal.js`) — never use TypeScript `number` for amounts
- Types: define shared TypeScript interfaces in `src/types.ts` (e.g. `Transaction`, `Message`, `AgentResult`)
- Currency validation: ISO 4217 whitelist (at minimum: USD, EUR, GBP, JPY)
- Logging: audit trail per operation with timestamp, agent name, transaction_id, and outcome
- PII: mask account numbers in all log output (e.g. show only last 4 chars)
- File I/O: agents read/write JSON files through `shared/` directories
- Error handling: uncaught errors must not crash the pipeline; log and continue

### 4. Context
- **Beginning state**: `sample-transactions.json` exists with 8 raw transaction records. No agents exist. No `shared/` directories exist.
- **Ending state**: All transactions processed. Results in `shared/results/`. Test coverage ≥ 90%. `README.md` and `HOWTORUN.md` complete.

### 5. Low-Level Tasks
One entry per agent in this exact format:

```
Task: [Agent Name]
Prompt: "[Exact prompt to give Claude Code to build this agent]"
File to CREATE: src/agents/[agent_name].ts
Function to CREATE: processMessage(message: Message) => Promise<Message>
Details: [What the agent checks, transforms, or decides]
```

Include entries for:
- **Types** (`src/types.ts`) — shared TypeScript interfaces: `Transaction`, `Message`, `AgentResult`
- **Transaction Validator** — validates required fields, positive amount, ISO 4217 currency
- **Fraud Detector** — scores risk based on amount thresholds, time of day, cross-border flag
- **Settlement Processor** (third agent) — marks validated+low-risk transactions as settled, rejected/high-risk as declined
- **Integrator** (`src/integrator.ts`) — orchestrates the full pipeline end-to-end
- **Express API** (`src/server.ts`) — Express app with `GET /status/:transaction_id` and `GET /results` endpoints

---

## Rules
- Use Node.js + TypeScript throughout (not Python, not plain JavaScript)
- Every prompt in Section 5 must be self-contained — someone should be able to paste it directly into Claude Code and get a working result
- All file paths must reflect the TypeScript project structure (`src/` for source, compiled to `dist/`)
- Save the result to `homework-6/specification.md`
