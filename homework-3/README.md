# Transaction Dispute Center

A FinTech specification package for building a transaction dispute management system.

> **Student Name**: Vladyslav Tkach
> **Date Submitted**: 09.02.20226
> **AI Tools Used**: GitHub Copilot
> 
**Homework:** Specification-Driven Design (Homework 3)

---

## What's Included

| File | Description |
|------|-------------|
| `docs/DOMAIN_RULES.md` | **Core conventions** — Single source of truth |
| `specification.md` | Implementation tasks (20+ tasks across 8 phases) |
| `agents.md` | General AI assistant guidelines |
| `.github/copilot-instructions.md` | GitHub Copilot quick-reference |
| `.claude/rules.md` | Claude AI project conventions |

## Key Features

- **Transaction List** — View recent transactions with dispute status
- **Dispute Flow** — Submit disputes with reason, description, and evidence
- **Status Tracking** — Monitor dispute resolution with timeline
- **Notifications** — Receive updates on dispute progress

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express + TypeScript |
| Frontend | React + TypeScript + Vite |
| Validation | Zod (runtime type safety) |
| Testing | Jest + React Testing Library |

---

## Critical Domain Rules

1. **Money as integers** — Store cents, never floats (`1099` = $10.99)
2. **Immutable audit logs** — Every state change is logged permanently
3. **Multi-layer validation** — Zod on both client and server
4. **Rate limiting** — 5 disputes/hour max per user

---

## Implementation Phases

| # | Phase | Focus |
|---|-------|-------|
| 1 | Foundation | Project setup, types, data store |
| 2 | Transactions | List, filter, display |
| 3 | Disputes | Create, validate, track |
| 4 | Notifications | Alerts and history |
| 5 | Infrastructure | Error handling, logging |
| 6 | Frontend | React components |
| 7 | Testing | Unit + integration tests |
| 8 | Documentation | API docs, READMEs |

---

## AI Tools Integration

All tools reference the central `docs/DOMAIN_RULES.md` for consistency.

| Tool | Configuration |
|------|---------------|
| GitHub Copilot | `.github/copilot-instructions.md` |
| Claude Code | `.claude/rules.md` |
| Claude/ChatGPT | Use `agents.md` as context |
| Any AI | Load `docs/DOMAIN_RULES.md` first |

---

## Quick Start

```bash
# After implementation, run:
cd src/backend && npm install && npm run dev
cd src/frontend && npm install && npm run dev
```

---

## Best Practices Applied

| Practice | Why |
|----------|-----|
| Integer cents for money | Avoids floating-point errors |
| Immutable audit trail | Regulatory compliance |
| Zod validation (client+server) | Security boundary enforcement |
| Correlation IDs | End-to-end request tracing |
| Rate limiting | Abuse prevention |
| Magic byte file validation | Upload security |

---

## Project Structure

```
homework-3/
├── docs/
│   └── DOMAIN_RULES.md      ← Core conventions (single source of truth)
├── specification.md         ← Implementation tasks
├── agents.md                ← General AI guidelines (references DOMAIN_RULES)
├── .github/
│   └── copilot-instructions.md  ← Copilot-specific (references DOMAIN_RULES)
└── .claude/
    └── rules.md             ← Claude-specific (references DOMAIN_RULES)
```
