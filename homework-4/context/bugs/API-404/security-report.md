# Security Report: Bug API-404

**Scan Date**: 2026-02-21
**Agent**: Security Verifier
**Fix reviewed**: `fix-summary.md` — Overall Status: PASS

---

## Scan Scope

Files read:

- `context/bugs/API-404/fix-summary.md` — fix description and verification results
- `demo-bug-fix/src/controllers/userController.js` — modified file containing the fix
- `demo-bug-fix/src/routes/users.js` — surrounding routing context
- `demo-bug-fix/server.js` — application entry point and middleware configuration
- `demo-bug-fix/package.json` — dependency declarations

Pipeline stage reviewed: Bug Implementer output (Task 2 → Task 3)

---

## Findings

### SEC-001 — No Authentication or Authorization on Any Endpoint

| Property | Value |
|----------|-------|
| **Category** | Authentication / Authorization |
| **Severity** | MEDIUM |
| **File:Line** | `demo-bug-fix/server.js:16`, `demo-bug-fix/src/routes/users.js:11-14` |

**Description**: No authentication or authorization middleware is applied anywhere in the application. `server.js` mounts `userRoutes` directly at line 16 with `app.use(userRoutes)` without any preceding auth middleware. Both `GET /api/users` and `GET /api/users/:id` in `users.js` are therefore fully public. Any client — authenticated or not — can enumerate or retrieve all user records, including names and email addresses. In a production system that serves real user data this would constitute unauthorized data exposure.

**Remediation**: Add an authentication middleware (e.g., JWT verification via `express-jwt`, or session-based auth) and mount it before the user routes. Apply route-level authorization checks where different roles require different access levels.

---

### SEC-002 — No Rate Limiting on Any Endpoint

| Property | Value |
|----------|-------|
| **Category** | Rate Limiting |
| **Severity** | MEDIUM |
| **File:Line** | `demo-bug-fix/server.js:9-16` |

**Description**: The `server.js` middleware configuration (lines 9-16) includes only `express.json()`. No rate-limiting middleware (such as `express-rate-limit`) is present. Without rate limiting, the `GET /api/users/:id` and `GET /api/users` endpoints are vulnerable to brute-force enumeration of user IDs and denial-of-service through request flooding. An attacker can trivially walk all integer IDs to enumerate valid accounts.

**Remediation**: Add `express-rate-limit` (or equivalent) to `server.js` before route mounting. Configure a sensible window (e.g., 15 minutes) and a maximum request count (e.g., 100 requests per window per IP). Apply stricter limits to sensitive data endpoints.

---

### SEC-003 — Missing Input Validation: Non-Numeric ID Returns 404 Instead of 400

| Property | Value |
|----------|-------|
| **Category** | Missing Input Validation |
| **Severity** | LOW |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:19` |

**Description**: The fix at line 19 applies `Number(req.params.id)` to coerce the path parameter to a number. `Number()` silently converts invalid strings to `NaN` (e.g., `"abc"`, `"1abc"`) and empty strings to `0`. There is no guard that checks whether `userId` is a valid finite positive integer before the lookup. When an invalid string like `"abc"` is supplied, `userId` becomes `NaN`, the `.find()` call returns `undefined`, and the handler responds with `404 Not Found`. The semantically correct response for a malformed request is `400 Bad Request`. Beyond the incorrect HTTP status code, if the in-memory user store were ever extended to include a user with `id: 0`, then a request for `/api/users/` (empty segment) or `/api/users/%00` would resolve to that record — a potential logic vulnerability.

**Remediation**: Add an explicit validation guard immediately after line 19:

```js
if (!Number.isInteger(userId) || userId <= 0) {
  return res.status(400).json({ error: 'Invalid user ID' });
}
```

This ensures only positive integers reach the lookup, returns the correct HTTP 400 for bad input, and is safe against future data-store changes.

---

### SEC-004 — Dependency Versions Not Pinned (No Lockfile in Scope)

| Property | Value |
|----------|-------|
| **Category** | Unsafe Dependencies |
| **Severity** | LOW |
| **File:Line** | `demo-bug-fix/package.json:15-21` |

**Description**: All dependency ranges in `package.json` use the caret (`^`) prefix (e.g., `"express": "^4.18.2"`, `"jest": "^29.0.0"`), which permits automatic minor and patch upgrades. No `package-lock.json` or `yarn.lock` was present in the scan scope, meaning `npm install` will always resolve the latest compatible versions at install time. If a future minor or patch release of any dependency introduces a vulnerability, the application will silently adopt it without any explicit version-bump decision by a developer. Express 4.18.2 itself has no known critical CVEs as of the scan date, and the devDependencies (`jest`, `nodemon`, `supertest`) do not ship to production. This is a supply-chain hygiene issue.

**Remediation**: Commit a `package-lock.json` to version control and use `npm ci` in CI/CD pipelines to enforce exact dependency resolution. Integrate a dependency scanning tool (e.g., `npm audit`, Dependabot, or Snyk) to receive automated alerts on newly disclosed CVEs.

---

### SEC-005 — Server Startup URLs Logged to stdout

| Property | Value |
|----------|-------|
| **Category** | Information Leakage |
| **Severity** | INFO |
| **File:Line** | `demo-bug-fix/server.js:27-30` |

**Description**: Lines 27-30 of `server.js` call `console.log` to print the server URL and example API paths to standard output on startup. In a containerized or managed production environment these logs are typically aggregated and may be visible to personnel who should not have access to internal endpoint listings. The risk is minimal for a demo application but constitutes a minor information disclosure pattern.

**Remediation**: Replace bare `console.log` with a structured logger (e.g., `pino`, `winston`) that supports log-level filtering. Suppress or redact endpoint documentation output in production builds by checking `NODE_ENV`.

---

**Category: Injection — No issues found.** `req.params.id` is passed only to `Number()` and then used exclusively in an in-memory `Array.prototype.find()` call. It is never concatenated into a SQL query, passed to `exec`/`spawn`, or evaluated dynamically.

**Category: Hardcoded Secrets — No issues found.** No credentials, API keys, tokens, passwords, or other secrets appear in any scanned file.

**Category: Insecure Comparison — No issues found.** The fix correctly uses strict equality (`===`) after type coercion at the comparison site (`users.find(u => u.id === userId)`, line 23). No loose `==` comparisons involving untrusted input were observed.

**Category: XSS / CSRF — No issues found.** The application serves only `application/json` responses. No HTML is rendered and no user-supplied input is reflected into markup. There are no state-changing requests that require CSRF protection in the scanned scope.

---

## Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 2 |
| LOW | 2 |
| INFO | 1 |
| **Total** | **5** |

---

## Recommendations

1. **Add authentication middleware** (SEC-001, MEDIUM): Before deploying to any non-local environment, mount an auth middleware ahead of all user routes in `server.js`. User PII (name, email) must not be publicly accessible without credentials.

2. **Add rate limiting** (SEC-002, MEDIUM): Install and configure `express-rate-limit` to prevent brute-force ID enumeration and denial-of-service against all API endpoints.

3. **Validate and reject non-integer IDs with HTTP 400** (SEC-003, LOW): Add a `Number.isInteger(userId) && userId > 0` guard in `getUserById` to return `400 Bad Request` for malformed inputs instead of silently returning `404`.

4. **Commit a lockfile and enable dependency scanning** (SEC-004, LOW): Check `package-lock.json` into version control and integrate `npm audit` or Dependabot to detect future CVEs in transitive dependencies.

5. **Use structured logging** (SEC-005, INFO): Replace `console.log` startup output with a configurable logger so that endpoint listings are not emitted in production log streams.

---

## References

Files read:

- `context/bugs/API-404/fix-summary.md`
- `demo-bug-fix/src/controllers/userController.js`
- `demo-bug-fix/src/routes/users.js`
- `demo-bug-fix/server.js`
- `demo-bug-fix/package.json`
