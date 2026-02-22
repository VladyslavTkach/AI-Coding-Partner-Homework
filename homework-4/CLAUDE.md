# Homework 4 — 4-Agent Pipeline

## Project Overview

This homework implements a 4-agent pipeline for automated bug fixing of a demo Express API.

**Bug**: `GET /api/users/:id` returns 404 for valid user IDs.
**Root cause**: `req.params.id` is a string; user IDs in the array are numbers; strict equality `===` always fails.

## Directory Structure

```
homework-4/
├── CLAUDE.md                        # This file
├── TASKS.md                         # Assignment requirements
├── README.md                        # Project overview
├── HOWTORUN.md                      # How to run the pipeline and app
├── STUDENT.md                       # Student info
├── agents/                          # Agent definition files
│   ├── research-verifier.agent.md   # Entry point — chains to bug-implementer
│   ├── bug-implementer.agent.md     # Chains to security-verifier + unit-test-generator
│   ├── security-verifier.agent.md   # Terminal
│   └── unit-test-generator.agent.md # Terminal
├── skills/                          # Reusable skill definitions
│   ├── research-quality-measurement.md
│   └── unit-tests-FIRST.md
├── context/bugs/API-404/            # Per-bug context and artifacts
│   ├── bug-context.md
│   ├── research/
│   │   ├── codebase-research.md
│   │   └── verified-research.md
│   ├── implementation-plan.md
│   ├── fix-summary.md
│   ├── security-report.md
│   └── test-report.md
├── demo-bug-fix/                    # The Express app (source + fixed code)
│   ├── server.js
│   ├── package.json
│   ├── src/
│   │   ├── controllers/userController.js
│   │   └── routes/users.js
│   └── tests/
└── docs/screenshots/                # Pipeline run screenshots
```

## Agent Pipeline Run Order

Invoke `research-verifier` once — it chains to all subsequent agents automatically:

```
research-verifier
  → (PASS) bug-implementer
              → (PASS/PARTIAL) security-verifier   ─┐ parallel
              → (PASS/PARTIAL) unit-test-generator ─┘
```

## Demo App

Located in `demo-bug-fix/`. Node.js + Express.

```bash
cd demo-bug-fix
npm install
npm start          # http://localhost:3000
```

Key endpoints:
- `GET /api/users`      — list all users (works)
- `GET /api/users/:id`  — get user by ID (was broken, now fixed)
- `GET /health`         — health check

## Running Tests

```bash
cd demo-bug-fix
npm test
```

## Agents

Each `.agent.md` file in `agents/` is a Claude Code sub-agent definition (markdown system prompt). Invoke `research-verifier` to start the full pipeline; it chains to each subsequent agent automatically.

| Agent file | Input | Output | Chains to |
|---|---|---|---|
| `research-verifier.agent.md` | `demo-bug-fix/` source; `research/codebase-research.md` (created if missing) | `research/verified-research.md` | `bug-implementer` on PASS |
| `bug-implementer.agent.md` | `implementation-plan.md` | `fix-summary.md` + code changes | `security-verifier` + `unit-test-generator` on PASS/PARTIAL |
| `security-verifier.agent.md` | `fix-summary.md` + changed files | `security-report.md` | — |
| `unit-test-generator.agent.md` | `fix-summary.md` + changed files | `test-report.md` + test files | — |

## Skills

- `skills/research-quality-measurement.md` — defines research quality levels (used by Research Verifier)
- `skills/unit-tests-FIRST.md` — defines FIRST principles for unit tests (used by Unit Test Generator)
