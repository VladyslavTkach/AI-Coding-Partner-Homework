# Task 2: Bug Implementer Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

## High-Level Objective

- Build a Bug Implementer agent that reads an implementation plan, applies the specified code fix to the Express app, verifies the fix with a manual test command, and outputs a structured `fix-summary.md` report for downstream agents.

---

## Mid-Level Objectives

- Create `context/bugs/API-404/implementation-plan.md` with an exact before/after code diff, the affected file and line, and a curl verification command
- Create `agents/bug-implementer.agent.md` as a Claude Code sub-agent definition that follows a strict read → apply → verify → report process
- Apply the one-line type-coercion fix to `demo-bug-fix/src/controllers/userController.js:19` so that `GET /api/users/:id` returns a 200 with the correct user object
- Produce `context/bugs/API-404/fix-summary.md` with all required sections: Changes Made, Overall Status, Manual Verification, References
- Ensure the fix summary is complete enough for the Security Verifier and Unit Test Generator agents to identify the changed file, the exact line, and what changed

---

## Implementation Notes

- Agent file format: markdown system prompt (`.agent.md`), used as a Claude Code sub-agent definition
- The agent is **read-then-write**: it reads the plan fully before touching any file
- The bug root cause: `req.params.id` is always a `string`; user IDs in the array are `number`; strict equality `===` always returns `false` → fix by coercing with `Number(req.params.id)` at `userController.js:19`
- The fix is a one-line change — the agent must not modify any other file
- Test command available at this stage: manual `curl http://localhost:3000/api/users/123` (Jest tests do not exist yet — they are generated in Task 4)
- If the fix causes any endpoint to regress (`GET /api/users` must still return all users), the agent must document that in fix-summary.md and set Overall Status to PARTIAL
- The agent outputs a report and the fixed source file — it must not edit `implementation-plan.md` or any context document
- All context artifacts live under `homework-4/context/bugs/API-404/`; the demo app source is under `homework-4/demo-bug-fix/`

---

## Context

### Beginning context

- `homework-4/TASKS.md` — assignment requirements for Task 2
- `homework-4/context/bugs/API-404/research/verified-research.md` — confirmed root cause and exact line reference (`userController.js:23` — `u.id === userId`)
- `homework-4/context/bugs/API-404/research/codebase-research.md` — original research tracing execution path
- `homework-4/demo-bug-fix/bugs/API-404/bug-context.md` — bug report with expected/actual behavior and reproduction steps
- `homework-4/demo-bug-fix/src/controllers/userController.js` — source file containing the bug (line 19 and 23)
- `homework-4/demo-bug-fix/src/routes/users.js` — route definitions (no change needed)
- `homework-4/demo-bug-fix/server.js` — app entry point (no change needed)
- `homework-4/demo-bug-fix/package.json` — project metadata and scripts
- `homework-4/agents/` — directory where the new agent file will be placed
- `homework-4/context/bugs/API-404/` — directory where plan and summary artifacts will be placed

### Ending context

- `homework-4/context/bugs/API-404/implementation-plan.md` — **new** — precise fix plan consumed by the agent
- `homework-4/agents/bug-implementer.agent.md` — **new** — agent system prompt definition
- `homework-4/demo-bug-fix/src/controllers/userController.js` — **modified** — line 19 changed from `const userId = req.params.id` to `const userId = Number(req.params.id)`
- `homework-4/context/bugs/API-404/fix-summary.md` — **new** — agent output artifact consumed by Task 3 and Task 4

---

## Low-Level Tasks

### 1. Create the implementation plan

What prompt would you run to complete this task?
Write an implementation plan for bug API-404 that specifies the single-line fix required in `userController.js`, including the exact before and after code, affected file and line number, and a manual verification command.

What file do you want to CREATE or UPDATE?
`homework-4/context/bugs/API-404/implementation-plan.md`

What function do you want to CREATE or UPDATE?
N/A (planning document)

What are details you want to add to drive the code changes?
- **Bug summary**: `req.params.id` is a `string`; user IDs are `number`; `===` never matches
- **Root cause reference**: `src/controllers/userController.js:19` (capture) and `:23` (comparison)
- **Fix location**: `src/controllers/userController.js`, function `getUserById`, line 19
- **Before**: `const userId = req.params.id;`
- **After**: `const userId = Number(req.params.id);`
- **Rationale**: `Number()` coerces `"123"` → `123`; the `===` comparison at line 23 then succeeds
- **Files to change**: only `src/controllers/userController.js` — no other files need modification
- **Verification command**:
  ```bash
  curl http://localhost:3000/api/users/123
  # Expected: {"id":123,"name":"Alice Smith","email":"alice@example.com"}  with HTTP 200
  curl http://localhost:3000/api/users
  # Expected: array of 3 users (regression check)
  ```
- **Required sections**: Bug Summary, Fix Location, Code Change (before/after), Verification Steps, Files Changed

---

### 2. Create the Bug Implementer agent

What prompt would you run to complete this task?
Create a Claude Code sub-agent definition that reads an implementation plan, applies the specified code changes to the source files, documents the before/after diff, runs manual verification commands, and writes a structured fix-summary.md report.

What file do you want to CREATE or UPDATE?
`homework-4/agents/bug-implementer.agent.md`

What function do you want to CREATE or UPDATE?
N/A (agent system prompt)

What are details you want to add to drive the code changes?
- **Input**: `context/bugs/API-404/implementation-plan.md`
- **Step-by-step process the agent must follow**:
  1. Read `implementation-plan.md` in full before touching any file
  2. For each file listed in the plan: read the file, locate the exact before-code block, apply the replacement using the Edit tool
  3. After applying changes, run the verification command(s) from the plan (Bash tool)
  4. Record the actual command output verbatim
  5. If any verification step fails (non-200 response, unexpected output), set Overall Status to FAIL and stop
  6. Write `context/bugs/API-404/fix-summary.md` with the sections below
- **Output file**: `context/bugs/API-404/fix-summary.md`
- **Required sections in output**:
  - `## Changes Made` — table: File | Location | Before | After | Verification Result
  - `## Overall Status` — PASS / FAIL / PARTIAL with one-line explanation
  - `## Manual Verification` — exact curl commands and actual responses received
  - `## References` — list of all files read and changed
- **Constraints**:
  - Read-only on plan and context files — only modify files listed in the plan
  - Must not guess or infer changes — apply exactly what the plan specifies
  - Must not run `npm test` if no test script is configured in `package.json`; use manual curl verification instead
  - If a file listed in the plan does not exist, set Overall Status to FAIL immediately

---

### 3. Apply the code fix

What prompt would you run to complete this task?
In `src/controllers/userController.js`, replace the string assignment `const userId = req.params.id` with `const userId = Number(req.params.id)` so that the strict equality comparison at line 23 correctly matches numeric user IDs.

What file do you want to CREATE or UPDATE?
`homework-4/demo-bug-fix/src/controllers/userController.js`

What function do you want to CREATE or UPDATE?
`getUserById` (lines 18–30)

What are details you want to add to drive the code changes?
- **Line to change**: line 19 inside `getUserById`
- **Before** (exact string to match):
  ```js
  const userId = req.params.id;
  ```
- **After** (exact replacement):
  ```js
  const userId = Number(req.params.id);
  ```
- **Why this fix**: `Number("123")` returns the number `123`; the existing `u.id === userId` at line 23 then compares `123 === 123` which is `true`
- **No other changes**: the `if (!user)` branch at line 25, the `getAllUsers` function, and all other code must remain unchanged
- **Acceptance criteria**: `users.find(u => u.id === userId)` returns the correct user for IDs 123, 456, and 789; `getAllUsers` still returns all 3 users

---

### 4. Produce the fix summary report

What prompt would you run to complete this task?
Write the fix-summary.md artifact documenting the change made to `userController.js`, the before/after code, the curl verification commands and their actual output, and the overall pass/fail status.

What file do you want to CREATE or UPDATE?
`homework-4/context/bugs/API-404/fix-summary.md`

What function do you want to CREATE or UPDATE?
N/A (agent output artifact)

What are details you want to add to drive the code changes?
- **Changes Made table** must include:
  - File: `demo-bug-fix/src/controllers/userController.js`
  - Location: `getUserById`, line 19
  - Before: `const userId = req.params.id;`
  - After: `const userId = Number(req.params.id);`
  - Verification Result: actual HTTP status and JSON body from curl
- **Overall Status** must be PASS if both curl checks return expected output; FAIL otherwise
- **Manual Verification section** must show:
  - The exact curl command run
  - The full JSON response body received
  - The HTTP status code
  - A note that regression check (`GET /api/users`) still returns 3 users
- **References section** must list:
  - `context/bugs/API-404/implementation-plan.md` (read)
  - `demo-bug-fix/src/controllers/userController.js` (read and modified)
- The report must not contain guessed output — all values must come from actually running the server
