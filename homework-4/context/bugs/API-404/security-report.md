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

### SEC-001 — No Authentication or Authorization on User Endpoints

| Property | Value |
|----------|-------|
| **Category** | Authentication / Authorization |
| **Severity** | HIGH |
| **File:Line** | `demo-bug-fix/server.js:13` |

**Description**: The middleware chain in `server.js` only registers `express.json()` before mounting the user routes at line 16. There is no authentication middleware (e.g., JWT verification, session check, API key validation) protecting `GET /api/users` or `GET /api/users/:id`. Any unauthenticated client can retrieve all user records, including names and email addresses. This represents a complete lack of access control on personal data endpoints.

**Remediation**: Add an authentication middleware (e.g., `app.use('/api', requireAuth)`) before `app.use(userRoutes)` in `server.js`. The middleware should validate a bearer token or session cookie and reject unauthenticated requests with HTTP 401.

---

### SEC-002 — No Rate Limiting on API Endpoints

| Property | Value |
|----------|-------|
| **Category** | Rate Limiting |
| **Severity** | MEDIUM |
| **File:Line** | `demo-bug-fix/server.js:13-16` |

**Description**: No rate-limiting or throttling middleware (e.g., `express-rate-limit`) is configured in `server.js`. The absence of rate limiting on `GET /api/users/:id` allows an attacker to enumerate all valid user IDs at high speed, and on `GET /api/users` allows repeated bulk-data harvesting. It also exposes the server to denial-of-service through request flooding.

**Remediation**: Add `express-rate-limit` (or equivalent) to `package.json` and apply it globally or specifically to the `/api` prefix in `server.js`. A reasonable starting limit for a user API is 100 requests per 15-minute window per IP.

---

### SEC-003 — Missing Input Validation for the `:id` Parameter

| Property | Value |
|----------|-------|
| **Category** | Missing Input Validation |
| **Severity** | LOW |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:19` |

**Description**: `req.params.id` is converted with `Number(req.params.id)` on line 19 but is never validated before use. Several edge cases produce silently incorrect behaviour without returning an informative error:

- `Number("abc")` → `NaN` — the `.find()` on line 23 returns `undefined`, so a 404 is sent. This is safe but misleading to clients.
- `Number("")` → `0` — a zero-ID lookup silently falls through to 404.
- `Number("1e300")` → `1e300` — an astronomically large number is accepted without complaint.
- Negative numbers (e.g., `-1`) are accepted without validation.

No HTTP 400 Bad Request is ever returned for syntactically invalid input, making the API harder to consume correctly and masking bad client behaviour.

**Remediation**: Before the array lookup, add an explicit guard such as:

```js
const userId = Number(req.params.id);
if (!Number.isInteger(userId) || userId <= 0) {
  return res.status(400).json({ error: 'Invalid user ID' });
}
```

This rejects non-integer, non-positive, and NaN values with a clear 400 status.

---

### SEC-004 — Stale Bug Comment Left in Production Code

| Property | Value |
|----------|-------|
| **Category** | Information Leakage |
| **Severity** | INFO |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:21-22` |

**Description**: Lines 21–22 contain the original bug description as a code comment:

```
// BUG: req.params.id returns a string, but users array uses numeric IDs
// Strict equality (===) comparison will always fail: "123" !== 123
```

These comments describe how the code previously behaved and hint at historical weaknesses in the type-handling logic. While the bug is fixed and these comments pose no direct security risk, they constitute unnecessary information leakage about the implementation's past vulnerabilities. In a real production codebase they could assist an attacker in understanding the data model and prior quality standards.

**Remediation**: Remove or replace the stale bug comments with a forward-facing note such as `// Convert string param to integer for strict equality match`.

---

**Category — Injection: No issues found.**

**Category — Hardcoded Secrets: No issues found.**

**Category — Insecure Comparison: No issues found.** (The fix correctly uses strict equality `===` after converting the input with `Number()` at line 19.)

**Category — Unsafe Dependencies: No issues found.** (`express ^4.18.2`, `jest ^29.0.0`, `nodemon ^3.0.1`, and `supertest ^6.3.0` have no known critical CVEs as of the scan date.)

**Category — XSS / CSRF: No issues found.** (All responses are JSON; no user input is reflected into HTML output.)

---

## Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 1 |
| MEDIUM   | 1 |
| LOW      | 1 |
| INFO     | 1 |
| **Total**| **4** |

---

## Recommendations

Prioritized action items for the development team:

1. **[HIGH] Add authentication middleware** before the user routes in `demo-bug-fix/server.js`. The endpoints currently expose names and email addresses to any unauthenticated caller. Implement bearer-token or session-based auth and reject unauthenticated requests with HTTP 401.

2. **[MEDIUM] Add rate-limiting middleware** (e.g., `express-rate-limit`) to prevent ID enumeration, bulk data harvesting, and denial-of-service. Apply it globally or specifically to the `/api` prefix in `server.js`.

3. **[LOW] Add explicit input validation** in `getUserById` (`userController.js` line 19) to return HTTP 400 for non-integer, negative, or zero ID values. Use `Number.isInteger()` combined with a positivity check rather than relying on the silent NaN/0 fallthrough.

4. **[INFO] Remove stale bug-description comments** from `userController.js` lines 21–22. Replace with a concise forward-facing comment that describes intent rather than historical defects.

---

## References

Files read during this scan:
- `demo-bug-fix/src/controllers/userController.js`
- `demo-bug-fix/src/routes/users.js`
- `demo-bug-fix/server.js`
- `demo-bug-fix/package.json`
- `context/bugs/API-404/fix-summary.md`
