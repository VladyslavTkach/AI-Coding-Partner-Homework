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

### SEC-001 — No Authentication or Authorization on Any Endpoint

| Property | Value |
|----------|-------|
| **Category** | Authentication / Authorization |
| **Severity** | MEDIUM |
| **File:Line** | `demo-bug-fix/server.js:16` |

**Description**: `server.js` mounts the user routes at line 16 (`app.use(userRoutes)`) with no authentication or authorization middleware preceding them. Any unauthenticated caller can invoke `GET /api/users` (which returns all users including their email addresses) or `GET /api/users/:id` without presenting any credential, token, or session. In a production context this would constitute unauthorized disclosure of personally identifiable information (email addresses).

**Remediation**: Add an authentication middleware (e.g. JWT verification or API-key validation) before `app.use(userRoutes)`. For a demo application, at minimum document the intentional absence of auth so it is not cargo-culted into production code.

---

### SEC-002 — Missing Input Validation: Non-Integer IDs Return 404 Instead of 400

| Property | Value |
|----------|-------|
| **Category** | Missing input validation |
| **Severity** | LOW |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:19` |

**Description**: Line 19 converts `req.params.id` to a number with `Number(req.params.id)` but performs no type or range guard before using it. Non-numeric strings such as `abc` produce `NaN`; `NaN === <any>` is always `false`, so the request silently falls through to a 404 response. Floating-point strings such as `1.5` produce a non-integer number that also fails to match any stored ID. Both cases should be rejected with HTTP 400 Bad Request to clearly signal a malformed request, enforce the API contract, and prevent inadvertent enumeration by attackers who probe with alphabetic strings and observe only 404 responses.

**Remediation**: Add an explicit guard immediately after line 19:

```js
if (!Number.isInteger(userId) || userId <= 0) {
  return res.status(400).json({ error: 'Invalid user ID: must be a positive integer' });
}
```

---

### SEC-003 — No Rate Limiting on Any Endpoint

| Property | Value |
|----------|-------|
| **Category** | Rate limiting |
| **Severity** | LOW |
| **File:Line** | `demo-bug-fix/server.js:13` |

**Description**: The middleware chain at line 13 of `server.js` consists solely of `express.json()`. No throttling or rate-limiting middleware is present. An attacker or a misconfigured client can send an unbounded number of requests, enabling user-ID enumeration (incrementing the `:id` parameter) and denial-of-service via request flooding.

**Remediation**: Install and configure `express-rate-limit` (or an equivalent gateway-level control) before the route handlers. For example:

```js
const rateLimit = require('express-rate-limit');
app.use(rateLimit({ windowMs: 60_000, max: 100 }));
```

---

### SEC-004 — Caret-Range Dependency Pinning Allows Automatic Minor/Patch Upgrades

| Property | Value |
|----------|-------|
| **Category** | Unsafe dependencies |
| **Severity** | INFO |
| **File:Line** | `demo-bug-fix/package.json:15` |

**Description**: All four packages (`express`, `jest`, `nodemon`, `supertest`) are specified with a caret prefix (e.g. `"express": "^4.18.2"`). The caret range permits automatic installation of any higher minor or patch release within the same major version. If a future minor release introduces a vulnerability before the team updates its lockfile, the application could silently adopt a compromised version during a fresh `npm install`. No currently known CVEs affect the versions specified, but the practice warrants tracking.

**Remediation**: Commit a `package-lock.json` to the repository and rely on `npm ci` in CI/CD pipelines to guarantee reproducible installs. Use a dependency-scanning tool (e.g. `npm audit`, Dependabot, or Snyk) to monitor for newly disclosed CVEs against the locked versions.

---

**Injection**: No issues found.

**Hardcoded secrets**: No issues found.

**Insecure comparison**: No issues found. After the fix, strict equality (`===`) is used at `userController.js:22` against a `Number`-coerced value; edge-case inputs (`NaN`, `0`) do not produce a false-positive match.

**XSS / CSRF**: No issues found. All responses are JSON (`res.json()`); no user input is reflected into an HTML context.

**Information leakage**: No issues found. Error responses expose only `{ "error": "User not found" }` and do not reveal stack traces, internal file paths, or data-store metadata.

---

## Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 0 |
| MEDIUM   | 1 |
| LOW      | 2 |
| INFO     | 1 |
| **Total**| **4** |

---

## Recommendations

Prioritized action items for the development team:

1. **(MEDIUM — SEC-001)** Add authentication/authorization middleware (JWT, API key, or session-based) before all user routes in `server.js`. This is the highest-priority item because the endpoint currently exposes PII (email addresses) to unauthenticated callers.
2. **(LOW — SEC-002)** Add an explicit `Number.isInteger(userId) && userId > 0` guard in `getUserById` and return HTTP 400 for invalid input. This enforces the API contract and removes the ambiguity between "resource not found" and "malformed request".
3. **(LOW — SEC-003)** Introduce a rate-limiting middleware (e.g. `express-rate-limit`) to mitigate ID enumeration and denial-of-service risks.
4. **(INFO — SEC-004)** Commit `package-lock.json` to source control, use `npm ci` in CI/CD, and configure automated dependency-vulnerability scanning (Dependabot or Snyk) to receive alerts when new CVEs are disclosed against the locked package versions.

---

## References

Files read during this scan:
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/context/bugs/API-404/fix-summary.md`
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/demo-bug-fix/src/controllers/userController.js`
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/demo-bug-fix/src/routes/users.js`
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/demo-bug-fix/server.js`
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/demo-bug-fix/package.json`
