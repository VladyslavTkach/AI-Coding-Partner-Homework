# How to Run

## Prerequisites

- Node.js 18+
- Claude Code CLI with an active Anthropic API key

---

## 1. Run the Pipeline

Open a Claude Code session from the repo root and paste:

```
Act as the agent defined in homework-4/agents/pipeline-orchestrator.agent.md. Run it now.
```

The orchestrator runs all four agents in order, gate-checks every output, and prints a final status board:

```
╔══════════════════════════════════════════╗
║         PIPELINE RUN COMPLETE            ║
╠══════════════════════════════════════════╣
║ Stage 1 — Research Verifier  : PASS/FAIL ║
║ Stage 2 — Bug Implementer    : PASS/FAIL ║
║ Stage 3 — Security Verifier  : PASS/FAIL ║
║ Stage 4 — Unit Test Generator: PASS/FAIL ║
╠══════════════════════════════════════════╣
║ Overall                      : PASS/FAIL ║
╚══════════════════════════════════════════╝
```

Artifacts are written to `context/bugs/<BUG-ID>/`:

| File | Contents |
|------|----------|
| `research/verified-research.md` | Quality rating + verified claims |
| `fix-summary.md` | Applied change + verification results |
| `security-report.md` | Severity-rated security findings |
| `test-report.md` | Test results + FIRST assessment |

---

## 2. Run the Demo App

```bash
cd demo-bug-fix
npm install
npm start        # → http://localhost:3000
```

```bash
curl http://localhost:3000/health       # → { status: "ok" }
curl http://localhost:3000/api/users    # → list of all users
```

---

## 3. Run the Tests

```bash
cd demo-bug-fix
npm test
```

Expected: **8 passed, 8 total**.
