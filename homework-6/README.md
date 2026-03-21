# AI-Powered Multi-Agent Banking Pipeline

> **Student Name**: Vladyslav Tkach
> **Date Submitted**: March 21, 2026
> **AI Tools Used**: Claude Code

---

## What This System Does

This project implements a three-stage banking transaction processing pipeline built with Node.js and TypeScript. Raw transactions are read from a JSON file and passed sequentially through three cooperating agents: a validator, a fraud scorer, and a settlement processor. Each agent enriches the transaction message and hands it to the next. At the end of the pipeline every transaction lands in `shared/results/` as a JSON file with a final status of either `settled` or `declined`.

The system is designed to be resilient — if a single transaction fails unexpectedly the pipeline keeps going and processes all remaining transactions. An append-only audit log records every agent decision with ISO 8601 timestamps. An optional Express HTTP server lets you query results over a REST API, and a custom MCP server makes pipeline results queryable directly from Claude Code.

---

## Pipeline Architecture

```
sample-transactions.json
         │
         ▼
  ┌─────────────┐
  │  Integrator │  reads transactions, orchestrates agents, writes audit log
  └──────┬──────┘
         │  Message { status: "pending" }
         ▼
┌──────────────────────┐
│ TransactionValidator │  checks required fields, amount > 0, ISO 4217 currency
└──────────┬───────────┘
           │  status: "validated" or "rejected"
           ▼
  ┌─────────────────┐
  │  FraudDetector  │  scores 0–10 (amount, time-of-day, cross-border)
  └────────┬────────┘
           │  + fraud_risk: LOW / MEDIUM / HIGH
           ▼
┌──────────────────────┐
│ SettlementProcessor  │  settles LOW/MEDIUM, declines HIGH or rejected
└──────────┬───────────┘
           │
           ▼
  shared/results/<txId>.json   (status: "settled" | "declined")
  shared/logs/audit.log        (one JSON line per agent decision)
```

---

## Agent Responsibilities

- **TransactionValidator** — checks that all required fields are present and non-empty, parses the amount with `big.js` and rejects anything ≤ 0, and validates the currency against the ISO 4217 whitelist (`USD`, `EUR`, `GBP`, `JPY`). Returns `status: "rejected"` with a specific reason code on failure.

- **FraudDetector** — scores validated transactions on a 0–10 additive scale: high amounts add up to 4 points, transactions between 02:00–05:00 UTC add 2, and cross-border transactions add 1. Maps the score to `LOW` (0–2), `MEDIUM` (3–6), or `HIGH` (7–10). Skips already-rejected messages.

- **SettlementProcessor** — makes the final decision: settles `LOW` and `MEDIUM` risk transactions, declines `HIGH` risk ones with reason `HIGH_FRAUD_RISK`, and converts any earlier rejections to `declined`. Writes one result file per transaction to `shared/results/` and is the only agent that touches the filesystem.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5 (strict mode) |
| Runtime | Node.js 18+ |
| Build | `tsc` → `dist/` |
| Monetary arithmetic | `big.js` |
| HTTP API | Express 4 |
| Tests | Jest + ts-jest + Supertest |
| MCP server | Python 3 + FastMCP |
| MCP context | context7 (`@upstash/context7-mcp`) |

---

## Project Structure

```
homework-6/
├── src/
│   ├── types.ts                    # Shared TypeScript interfaces
│   ├── integrator.ts               # Pipeline orchestrator (entry point)
│   ├── server.ts                   # Express HTTP API
│   └── agents/
│       ├── transaction_validator.ts
│       ├── fraud_detector.ts
│       └── settlement_processor.ts
├── tests/                          # Jest test suites (105 tests, ~95% coverage)
├── mcp/
│   └── server.py                   # FastMCP server (pipeline status tools)
├── shared/
│   ├── results/                    # One JSON result per transaction
│   └── logs/
│       └── audit.log               # Append-only agent audit trail
├── sample-transactions.json        # 8 input transactions
├── mcp.json                        # MCP server configuration
├── package.json
└── tsconfig.json
```

---

## Quick Start

```bash
npm install
npx tsc
node dist/integrator.js
```

See [HOWTORUN.md](./HOWTORUN.md) for full setup instructions including the HTTP API, MCP server, and running tests.

---

## Key Reason Codes

| Code | Meaning |
|---|---|
| `MISSING_FIELD: <name>` | Required field absent or empty |
| `INVALID_AMOUNT` | Amount unparseable or ≤ 0 |
| `INVALID_CURRENCY` | Currency not in ISO 4217 whitelist |
| `HIGH_FRAUD_RISK` | Fraud score ≥ 7 |
| `INTERNAL_ERROR` | Unexpected exception caught inside an agent |
