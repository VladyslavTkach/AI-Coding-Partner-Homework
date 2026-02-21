# Task 3: Security Verifier Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

## High-Level Objective

- Build a Security Verifier agent that reviews the changed source files identified in `fix-summary.md`, scans the modified and surrounding code for security vulnerabilities, rates each finding with a CRITICAL/HIGH/MEDIUM/LOW/INFO severity, and outputs a read-only `security-report.md` artifact without making any code changes.

---

## Mid-Level Objectives

- Create `agents/security-verifier.agent.md` as a Claude Code sub-agent that reads `fix-summary.md`, reads every changed file, and scans for the required vulnerability categories
- Check all mandatory vulnerability categories: injection, hardcoded secrets, insecure comparisons, missing input validation, unsafe dependencies, and XSS/CSRF where applicable
- Assign a severity rating (CRITICAL / HIGH / MEDIUM / LOW / INFO) and a `file:line` reference to every finding
- Include a concrete remediation recommendation for every finding
- Produce `context/bugs/API-404/security-report.md` with all required sections: Scan Scope, Findings, Severity Summary, Recommendations, and References

---

## Implementation Notes

- Agent file format: markdown system prompt (`.agent.md`), used as a Claude Code sub-agent definition
- The agent is **read-only**: it must not edit source files, `fix-summary.md`, or any context document
- Severity scale to use verbatim: **CRITICAL** → **HIGH** → **MEDIUM** → **LOW** → **INFO**
- Each finding must have: ID, Category, Severity, File:Line, Description, and Remediation
- The agent reads `fix-summary.md` first to scope the review to changed files only, then broadens to surrounding context (module-level, app-level) as needed
- Key security concerns for this specific fix (`Number(req.params.id)`):
  - `Number()` with a non-numeric string returns `NaN`; `NaN === NaN` is always `false`, so invalid IDs safely return 404 — this is secure behavior worth noting
  - `Number("")` (empty string) returns `0`; no user has ID 0, so it also safely returns 404
  - No explicit input validation (`isNaN` check, integer range check) is present — document as LOW
  - No authentication or authorization guard on the route — document as MEDIUM
  - No rate limiting on any endpoint — document as INFO
  - Express `^4.18.2` dependency version — check for known CVEs, document as INFO
  - Error response body `{"error":"User not found"}` reveals that the endpoint exists and is reachable — document as INFO
- The report must not contain guessed findings — every finding must cite a line number the agent has actually read

---

## Context

### Beginning context

- `homework-4/TASKS.md` — assignment requirements for Task 3
- `homework-4/context/bugs/API-404/fix-summary.md` — lists the changed file (`demo-bug-fix/src/controllers/userController.js`, line 19) and overall PASS status
- `homework-4/context/bugs/API-404/implementation-plan.md` — describes the one-line change and its rationale
- `homework-4/demo-bug-fix/src/controllers/userController.js` — the modified file (line 19 changed to `Number(req.params.id)`)
- `homework-4/demo-bug-fix/src/routes/users.js` — route definitions; in scope as surrounding context
- `homework-4/demo-bug-fix/server.js` — app entry point; in scope as surrounding context
- `homework-4/demo-bug-fix/package.json` — dependency versions; in scope for unsafe-deps check
- `homework-4/agents/bug-implementer.agent.md` — previous pipeline stage, for reference only

### Ending context

- `homework-4/agents/security-verifier.agent.md` — **new** — agent system prompt definition
- `homework-4/context/bugs/API-404/security-report.md` — **new** — agent output artifact consumed by humans and downstream reviewers

---

## Low-Level Tasks

### 1. Create the Security Verifier agent

What prompt would you run to complete this task?
Create a Claude Code sub-agent definition that reads `fix-summary.md` to identify changed files, reads those files and their surrounding context, scans for injection, secrets, insecure comparisons, missing validation, unsafe deps, and XSS/CSRF issues, assigns a CRITICAL/HIGH/MEDIUM/LOW/INFO severity to each finding with a file:line reference and remediation note, and writes `security-report.md`. The agent must not edit any source file.

What file do you want to CREATE or UPDATE?
`homework-4/agents/security-verifier.agent.md`

What function do you want to CREATE or UPDATE?
N/A (agent system prompt)

What are details you want to add to drive the code changes?
- **Inputs**:
  - `context/bugs/API-404/fix-summary.md` — scope source (identifies changed files and their locations)
  - Changed source files listed in the fix summary
- **Step-by-step process the agent must follow**:
  1. Read `fix-summary.md` in full; extract every file listed under "Files modified"
  2. Read each modified file using the Read tool; also read directly referenced context files (`routes/users.js`, `server.js`, `package.json`)
  3. Scan for each required vulnerability category (see checklist below); record findings as a numbered list
  4. For each finding, record: ID, Category, Severity, File:Line, Description, Remediation
  5. Write `context/bugs/API-404/security-report.md` with all required sections
- **Vulnerability checklist** the agent must work through:
  - [ ] **Injection** — is `req.params.id` passed to any database query, shell command, or eval? (check for safe: `Number()` only feeds array `.find()`)
  - [ ] **Hardcoded secrets** — are there credentials, API keys, or tokens in the source?
  - [ ] **Insecure comparison** — are there remaining `==` loose-equality comparisons involving untrusted input?
  - [ ] **Missing input validation** — is the ID validated for type (integer) and range before use?
  - [ ] **Unsafe dependencies** — are there any packages in `package.json` with known CVEs or abandoned maintenance?
  - [ ] **XSS/CSRF** — does any endpoint reflect unsanitized user input into an HTML response?
  - [ ] **Authentication/Authorization** — are the endpoints protected by any auth middleware?
  - [ ] **Rate limiting** — is there any throttling on the endpoints?
  - [ ] **Information leakage** — do error responses reveal internal details?
- **Output file**: `context/bugs/API-404/security-report.md`
- **Required sections in output**:
  - `## Scan Scope` — list of files read and what part of the pipeline was reviewed
  - `## Findings` — one subsection per finding: ID (SEC-001, SEC-002, …), Category, Severity, File:Line, Description, Remediation
  - `## Severity Summary` — table: Severity | Count
  - `## Recommendations` — 3–5 prioritized action items for the development team
  - `## References` — list of all files read during the scan
- **Constraints**:
  - Read-only — must not edit any source file or context document
  - Must not invent findings not backed by a line number the agent has actually read
  - If no findings are found for a category, the agent must explicitly state "No issues found" for that category in the Findings section
  - CRITICAL findings must be reported first, then HIGH, MEDIUM, LOW, INFO

---

### 2. Produce the security report artifact

What prompt would you run to complete this task?
Invoke the Security Verifier agent against the API-404 fix artifacts and write `security-report.md` covering all required vulnerability categories, with a severity rating and remediation for each finding.

What file do you want to CREATE or UPDATE?
`homework-4/context/bugs/API-404/security-report.md`

What function do you want to CREATE or UPDATE?
N/A (agent output artifact)

What are details you want to add to drive the code changes?
- **Scan Scope section** must name every file read (at minimum: `fix-summary.md`, `userController.js`, `routes/users.js`, `server.js`, `package.json`)
- **Findings section** must cover all 9 checklist categories from the agent definition; use "No issues found" for any category that is clean
- **Expected findings** based on reading the actual source (all must cite file:line):
  - `SEC-001` | Missing Input Validation | **LOW** | `userController.js:19` — `Number(req.params.id)` coerces without an explicit `isNaN` or integer-range guard; non-numeric IDs silently return 404 rather than a 400 Bad Request
  - `SEC-002` | Missing Authentication | **MEDIUM** | `routes/users.js:11,14` — both endpoints (`GET /api/users` and `GET /api/users/:id`) have no authentication or authorization middleware; any unauthenticated caller can enumerate all users
  - `SEC-003` | Missing Rate Limiting | **INFO** | `server.js:16` — no rate-limiting middleware (e.g. `express-rate-limit`) is applied to the router; the API is susceptible to enumeration or brute-force requests
  - `SEC-004` | Dependency Audit | **INFO** | `package.json:14` — `express ^4.18.2` should be verified against the current CVE database; `nodemon ^3.0.1` is a dev dependency and not deployed to production
  - `SEC-005` | Information Disclosure (minor) | **INFO** | `userController.js:26` — the 404 response body `{"error":"User not found"}` confirms that the endpoint is reachable and that the given ID does not exist; in a production API this distinction may aid enumeration
- **Severity Summary table** must reflect the actual counts from the Findings section
- **Recommendations section** must include prioritized items, e.g.: add explicit input validation with a 400 response for non-integer IDs; add authentication middleware; add rate limiting; run `npm audit` before each release
- **No CRITICAL or HIGH findings are expected** for this specific fix; if the agent finds any, it must cite the exact file and line
