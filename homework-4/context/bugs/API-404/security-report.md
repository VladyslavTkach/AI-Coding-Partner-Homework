# Security Report: Bug API-404

**Scan Date**: 2026-02-21
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

**Description**: The application mounts only `express.json()` middleware (line 13 of `server.js`). No authentication or authorization middleware is applied to any route. Both `GET /api/users` and `GET /api/users/:id` are fully accessible to any unauthenticated caller. In a real deployment this means any party with network access can enumerate all users or fetch any user record without credentials.

**Remediation**: Apply an authentication middleware (e.g., JWT verification, session check, or API key validation) to the user router before it is mounted in `server.js`. Restrict `GET /api/users` to admin roles and `GET /api/users/:id` to the authenticated user themselves or an authorized role.

---

### SEC-002 — No Rate Limiting on Any Endpoint

| Property | Value |
|----------|-------|
| **Category** | Rate Limiting |
| **Severity** | MEDIUM |
| **File:Line** | `demo-bug-fix/server.js:13` |

**Description**: `server.js` applies no rate-limiting or throttling middleware. An attacker can send an unbounded number of requests to enumerate user IDs (e.g., iterating over `GET /api/users/:id`) or to mount a denial-of-service attack against the server. No retry-after or request-per-minute cap exists.

**Remediation**: Add a rate-limiting middleware such as `express-rate-limit` globally or scoped to the `/api/` prefix. Enforce a reasonable per-IP request limit (e.g., 100 requests per 15-minute window) and return HTTP 429 with a `Retry-After` header when the limit is exceeded.

---

### SEC-003 — Missing Input Validation on the `:id` Parameter

| Property | Value |
|----------|-------|
| **Category** | Missing Input Validation |
| **Severity** | MEDIUM |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:19` |

**Description**: `req.params.id` is converted with `Number()` at line 19 but is never validated before use. `Number()` silently coerces non-numeric strings (e.g., `"abc"`) to `NaN`, empty strings to `0`, and allows negative integers and floating-point values (e.g., `-1`, `1.5`). None of these inputs trigger a 400 Bad Request — the controller falls through to a 404, which conflates "invalid input" with "resource not found". This makes input-related errors invisible to callers and prevents upstream validation layers from rejecting malformed requests early.

**Remediation**: Add an explicit guard immediately after line 19:

```js
if (!Number.isInteger(userId) || userId <= 0) {
  return res.status(400).json({ error: 'Invalid user ID: must be a positive integer' });
}
```

This ensures only positive integers proceed to the array lookup, and clients receive a semantically correct HTTP 400 for malformed input.

---

### SEC-004 — User ID Enumeration via Distinct 404 Response

| Property | Value |
|----------|-------|
| **Category** | Information Leakage |
| **Severity** | LOW |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:26` |

**Description**: When a requested user ID is not found, the controller returns HTTP 404 with the body `{ "error": "User not found" }`. This response explicitly confirms that the resource does not exist at a given ID. Combined with the absence of rate limiting (SEC-002) and authentication (SEC-001), an attacker can iterate over integer IDs and use the 404/200 distinction to compile a full list of valid user IDs without any resistance.

**Remediation**: In a production system, consider returning a uniform 404 for both "not found" and "unauthorized" cases to prevent confirming resource existence to unauthenticated callers. Pair with authentication (SEC-001) and rate limiting (SEC-002) to make enumeration impractical.

---

### SEC-005 — Dependency Version Ranges Allow Unreviewed Updates

| Property | Value |
|----------|-------|
| **Category** | Unsafe Dependencies |
| **Severity** | INFO |
| **File:Line** | `demo-bug-fix/package.json:15` |

**Description**: The production dependency `"express": "^4.18.2"` uses a caret range, which permits npm to automatically install any compatible minor or patch release up to (but not including) 5.0.0. While Express 4.18.x has no known active critical CVEs as of the scan date, semver range specifiers mean that a future patch release containing a newly-disclosed vulnerability could be installed on the next `npm install` without an explicit review step. Dev dependencies (`jest ^29.0.0`, `nodemon ^3.0.1`, `supertest ^6.3.0`) carry the same characteristic but pose lower runtime risk.

**Remediation**: Pin the production dependency to an exact version (e.g., `"express": "4.18.2"`) in `package.json` and use a lock file (`package-lock.json`) committed to version control. Adopt a dependency update workflow (e.g., Dependabot or Renovate) to review and approve version bumps deliberately.

---

**Injection**: No issues found. `req.params.id` is passed only to `Number()` and then used in a safe in-memory array lookup (`Array.prototype.find`). No SQL, shell command, `eval`, or other dangerous sink is involved.

**Hardcoded Secrets**: No issues found. No credentials, API keys, passwords, or tokens are present in any scanned file.

**Insecure Comparison**: No issues found. The fix at line 19 of `userController.js` converts the parameter to a number before the strict equality (`===`) comparison at line 23. No loose `==` involving untrusted input remains after the fix.

**XSS / CSRF**: No issues found. All endpoints return `application/json` responses. No user input is reflected into an HTML response body. No HTML rendering engine is in use.

---

## Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 1 |
| MEDIUM   | 2 |
| LOW      | 1 |
| INFO     | 1 |
| **Total**| **5** |

---

## Recommendations

Prioritized action items for the development team:

1. **Add authentication and authorization middleware** (SEC-001, HIGH) — Protect all `/api/users` endpoints with an authentication layer before any further deployment. This is the highest-impact gap: without it, all other hardening is undermined.
2. **Add rate limiting** (SEC-002, MEDIUM) — Apply a per-IP request cap to the API prefix to prevent both enumeration and denial-of-service abuse.
3. **Validate the `:id` parameter before use** (SEC-003, MEDIUM) — Return HTTP 400 for non-integer, zero, or negative IDs so malformed input is rejected early and callers receive semantically correct responses.
4. **Review 404 response wording to limit enumeration** (SEC-004, LOW) — Once authentication is in place, ensure that unauthenticated requests receive a uniform response that does not confirm resource existence.
5. **Pin production dependency versions and adopt automated dependency review** (SEC-005, INFO) — Lock `express` to an exact version in `package.json`, commit `package-lock.json`, and configure a dependency update bot to review version bumps before they land.

---

## References

Files read during this scan:
- `demo-bug-fix/src/controllers/userController.js`
- `demo-bug-fix/src/routes/users.js`
- `demo-bug-fix/server.js`
- `demo-bug-fix/package.json`
- `context/bugs/API-404/fix-summary.md`
