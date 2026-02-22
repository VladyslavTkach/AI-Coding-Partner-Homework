# Security Report: Bug API-404

**Scan Date**: 2026-02-22
**Agent**: Security Verifier
**Fix reviewed**: `fix-summary.md` — Overall Status: PASS

---

## Scan Scope

Files read during this review:
- `demo-bug-fix/src/controllers/userController.js` — modified file
- `demo-bug-fix/src/routes/users.js` — route context
- `demo-bug-fix/server.js` — app context
- `demo-bug-fix/package.json` — dependency manifest

Pipeline stage reviewed: Bug Implementer output (Task 2 → Task 3)

---

## Findings

**Injection: No issues found.**
`req.params.id` is converted via `Number()` and used only in an in-memory array `.find()` call. No SQL, shell command, `eval`, or any external sink is involved.

**Hardcoded secrets: No issues found.**
No credentials, API keys, passwords, or tokens are present in any file within scope.

**Insecure comparison: No issues found.**
The comparison at `userController.js:23` uses strict equality (`===`). Both operands are numeric after the `Number()` conversion, so no loose-equality risk exists.

---

### SEC-001 — Missing Input Validation on ID Parameter

| Property | Value |
|----------|-------|
| **Category** | Missing input validation |
| **Severity** | MEDIUM |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:19` |

**Description**: The fix converts `req.params.id` to a number using `Number(req.params.id)` but applies no further validation before use. `Number('abc')` produces `NaN`, `Number('')` produces `0`, and `Number('1.5')` produces `1.5` (a float). In all these cases the code proceeds silently to the `.find()` call and returns a generic 404. This means:
- A client sending a non-integer value (e.g., `/api/users/abc`) receives a 404 rather than a 400, which incorrectly signals "no user" instead of "bad request".
- Negative numbers (e.g., `/api/users/-1`) and floats are silently accepted.
- Absence of a 400 response makes it harder for API consumers to distinguish input errors from legitimate not-found conditions.

**Remediation**: Add an explicit guard immediately after line 19:
```js
if (!Number.isInteger(userId) || userId <= 0) {
  return res.status(400).json({ error: 'Invalid user ID: must be a positive integer' });
}
```

---

### SEC-002 — No Authentication or Authorization on Any Endpoint

| Property | Value |
|----------|-------|
| **Category** | Authentication / Authorization |
| **Severity** | MEDIUM |
| **File:Line** | `demo-bug-fix/server.js:13` |

**Description**: The only middleware mounted globally (`server.js:13`) is `express.json()`. No authentication (token validation, session check) or authorization (role/scope check) middleware is present on any route. All three endpoints — `GET /api/users`, `GET /api/users/:id`, and `GET /health` — are publicly accessible to any caller without credentials. In a non-demo deployment this would expose the full user list and individual user records (including email addresses) to unauthenticated actors.

**Remediation**: Add authentication middleware (e.g., `express-jwt`, `passport`, or a custom API-key check) before the user routes in `server.js`. Apply it at the router level or per-route as appropriate for the intended access model.

---

### SEC-003 — No Rate Limiting on API Endpoints

| Property | Value |
|----------|-------|
| **Category** | Rate limiting |
| **Severity** | LOW |
| **File:Line** | `demo-bug-fix/server.js:16` |

**Description**: No rate-limiting or throttling middleware (e.g., `express-rate-limit`) is configured. Any caller can send an unlimited number of requests to `GET /api/users/:id`, enabling sequential enumeration of valid user IDs and facilitating denial-of-service against the Node.js process. Because the data store is in-memory and trivially small in the demo, the immediate impact is low, but the pattern would be dangerous with a real database.

**Remediation**: Install and configure `express-rate-limit` before the user routes:
```js
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({ windowMs: 60_000, max: 100 }));
```

---

### SEC-004 — Async Route Handlers Lack Error Handling (Express 4 Uncaught Promise Rejection)

| Property | Value |
|----------|-------|
| **Category** | Information leakage / Reliability |
| **Severity** | INFO |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:18` |

**Description**: Both `getUserById` (line 18) and `getAllUsers` (line 37) are declared `async` but contain no `try/catch` block and are not wrapped in an error-forwarding utility. In Express 4, an unhandled promise rejection inside an async route handler is not automatically forwarded to the error-handling middleware — it surfaces as an unhandledRejection process event, which can crash the Node.js process or leave the HTTP response hanging. While the current code has no awaited operation that could reject, future changes adding database calls or external I/O would silently inherit this gap.

**Remediation**: Either wrap each handler body in a `try/catch` that calls `next(err)`, use a utility wrapper such as `express-async-errors`, or upgrade to Express 5 which catches async errors automatically.

---

### SEC-005 — No Lock File Committed for Reproducible Dependency Resolution

| Property | Value |
|----------|-------|
| **Category** | Unsafe dependencies |
| **Severity** | INFO |
| **File:Line** | `demo-bug-fix/package.json:14` |

**Description**: All dependencies use the `^` (caret) range operator (e.g., `"express": "^4.18.2"`), which allows npm to resolve any compatible minor or patch release at install time. Without a checked-in `package-lock.json`, successive `npm install` runs may resolve different concrete versions, making the build non-reproducible and potentially pulling in a future release that introduces a vulnerability before the team is aware of it.

**Remediation**: Commit `package-lock.json` to the repository and use `npm ci` (instead of `npm install`) in CI/CD pipelines to enforce exact dependency versions.

---

**XSS / CSRF: No issues found.**
All responses are emitted via `res.json()`, producing `application/json` content. No user-controlled input is reflected into HTML output.

**Unsafe dependencies (CVEs): No issues found.**
`express@^4.18.2`, `jest@^29.0.0`, `nodemon@^3.0.1`, and `supertest@^6.3.0` have no known unpatched critical CVEs as of the scan date. See SEC-005 for a related reproducibility concern.

---

## Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0     |
| HIGH     | 0     |
| MEDIUM   | 2     |
| LOW      | 1     |
| INFO     | 2     |
| **Total**| **5** |

---

## Recommendations

Prioritized action items for the development team:

1. **Add input validation for the ID parameter** (SEC-001, MEDIUM). Return HTTP 400 for non-integer, negative, or zero values. This is the most directly related to the bug fix and should be addressed in the same pull request.
2. **Implement authentication middleware** (SEC-002, MEDIUM). Any real deployment of this API must gate access to user data behind a credential check. Design the auth model before exposing the service on a network.
3. **Add rate limiting** (SEC-003, LOW). Apply `express-rate-limit` to `/api/` to prevent enumeration and basic denial-of-service.
4. **Wrap async handlers with error forwarding** (SEC-004, INFO). Use `try/catch` + `next(err)` or `express-async-errors` so future async operations do not produce silent process crashes.
5. **Commit `package-lock.json` and use `npm ci`** (SEC-005, INFO). Ensures reproducible builds and prevents silent dependency drift in CI/CD.

---

## References

Files read during this scan:
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/context/bugs/API-404/fix-summary.md`
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/demo-bug-fix/src/controllers/userController.js`
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/demo-bug-fix/src/routes/users.js`
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/demo-bug-fix/server.js`
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/demo-bug-fix/package.json`
