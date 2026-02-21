# Security Report: Bug API-404

**Scan Date**: 2026-02-21
**Agent**: Security Verifier
**Fix reviewed**: `fix-summary.md` — Overall Status: PASS

---

## Scan Scope

Files read during this review:

| File | Reason |
|------|--------|
| `context/bugs/API-404/fix-summary.md` | Fix scope source — identifies modified files and change |
| `demo-bug-fix/src/controllers/userController.js` | Modified file — contains the one-line fix at line 19 |
| `demo-bug-fix/src/routes/users.js` | Route context — defines endpoint paths and middleware chain |
| `demo-bug-fix/server.js` | App context — entry point, middleware registration, route mounting |
| `demo-bug-fix/package.json` | Dependency manifest — reviewed for known-vulnerable or abandoned packages |

Pipeline stage reviewed: Bug Implementer output (Task 2 → Task 3)

Change under review: `userController.js:19` — `const userId = req.params.id` → `const userId = Number(req.params.id)`

---

## Findings

### SEC-001 — Missing Input Validation on Route Parameter

| Property | Value |
|----------|-------|
| **Category** | Missing Input Validation |
| **Severity** | LOW |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:19` |

**Description**: `Number(req.params.id)` coerces the route parameter to a number without an explicit validity check. Non-numeric strings (e.g. `"abc"`) produce `NaN`; since `NaN === NaN` is `false`, the `users.find()` at line 23 safely returns `undefined` and the handler returns 404. However, the API never returns `400 Bad Request` for structurally invalid input. A caller sending `GET /api/users/abc` receives a 404 response indistinguishable from "user does not exist", making error diagnosis harder and silently accepting malformed requests at the application boundary.

**Remediation**: Add an explicit guard before the lookup:
```js
const userId = Number(req.params.id);
if (!Number.isInteger(userId) || userId <= 0) {
  return res.status(400).json({ error: 'Invalid user ID' });
}
```
This rejects non-integer and negative IDs with a semantically correct 400 and keeps 404 reserved for "valid ID, user not found".

---

### SEC-002 — No Authentication or Authorization on User Endpoints

| Property | Value |
|----------|-------|
| **Category** | Missing Authentication / Authorization |
| **Severity** | MEDIUM |
| **File:Line** | `demo-bug-fix/src/routes/users.js:11,14` |

**Description**: Both `GET /api/users` (line 11) and `GET /api/users/:id` (line 14) are registered without any authentication or authorization middleware. Any unauthenticated HTTP client can enumerate the full user list and retrieve individual user records including names and email addresses. In a production system this represents an unauthorized data exposure of PII.

**Remediation**: Add an authentication middleware (e.g. JWT verification or session check) before the route handlers:
```js
router.get('/api/users', authenticate, userController.getAllUsers);
router.get('/api/users/:id', authenticate, userController.getUserById);
```
Where `authenticate` validates a bearer token or session cookie and calls `next()` only on success, or returns 401 otherwise.

---

### SEC-003 — No Rate Limiting on API Endpoints

| Property | Value |
|----------|-------|
| **Category** | Missing Rate Limiting |
| **Severity** | INFO |
| **File:Line** | `demo-bug-fix/server.js:16` |

**Description**: `app.use(userRoutes)` at line 16 mounts all routes with no rate-limiting middleware in front. There is no throttle on `GET /api/users` (which returns the full user list) or `GET /api/users/:id` (which can be used to enumerate valid IDs by probing for 200 vs 404 responses). This is a hardening gap rather than an immediate vulnerability; in a demo context it is acceptable.

**Remediation**: Apply `express-rate-limit` before mounting routes:
```js
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({ windowMs: 60_000, max: 60 });
app.use(limiter);
app.use(userRoutes);
```

---

### SEC-004 — Dependency Versions Not Pinned; Audit Recommended

| Property | Value |
|----------|-------|
| **Category** | Unsafe Dependencies |
| **Severity** | INFO |
| **File:Line** | `demo-bug-fix/package.json:14` |

**Description**: `express` is declared as `^4.18.2` (line 14), which allows npm to install any `4.x.y` release up to (but not including) `5.0.0`. If a CVE is published for a later `4.x` release and the lockfile is not committed or is regenerated, the deployed version may be vulnerable. `nodemon ^3.0.1` (line 17) is a dev dependency and is not bundled into production, limiting its attack surface.

No CVEs are known for `express 4.18.2` at the time of this scan. A `package-lock.json` is present in the repository, which pins the resolved version at install time.

**Remediation**: Run `npm audit` before each release pipeline. Consider pinning the exact version (`"4.18.2"` rather than `"^4.18.2"`) in production images to prevent unintended upgrades.

---

### SEC-005 — 404 Response Confirms Endpoint Reachability

| Property | Value |
|----------|-------|
| **Category** | Information Disclosure |
| **Severity** | INFO |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:26` |

**Description**: The error response at line 26 — `{ "error": "User not found" }` with HTTP 404 — distinguishes "this ID does not exist" from "this endpoint does not exist" (which would be a generic 404 from Express with no body). An attacker can use this distinction to confirm that the `/api/users/:id` route is active and to enumerate valid user IDs by observing 200 vs 404 responses. In combination with SEC-002 (no authentication) this is more significant; in isolation it is a minor observation.

**Remediation**: In a production API, consider returning a uniform 404 for both "route not found" and "resource not found" to prevent endpoint enumeration. For a demo API the current behaviour is acceptable.

---

### Injection — No issues found.

`req.params.id` is passed only to `Number()` and then to an in-memory `Array.prototype.find()` call (`userController.js:23`). It is never interpolated into a SQL query, shell command, `eval`, or any external sink. No injection risk exists in the current code.

---

### Hardcoded Secrets — No issues found.

The `users` array at `userController.js:7–11` contains mock names and email addresses but no credentials, API keys, passwords, or tokens. These are demo data and do not constitute secrets.

---

### Insecure Comparison — No issues found.

After the fix, the only comparison involving the user-controlled value is `u.id === userId` at `userController.js:23`, which uses strict equality (`===`). No loose-equality (`==`) comparisons involving untrusted input exist in the scanned files.

---

### XSS / CSRF — No issues found.

All endpoints return `application/json` responses. No user-supplied input is reflected into an HTML response. There is no browser-rendered UI, no session cookie, and no state-changing POST/PUT/DELETE endpoint in scope. No XSS or CSRF vectors are present.

---

## Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 1 |
| LOW | 1 |
| INFO | 3 |
| **Total** | **5** |

---

## Recommendations

Prioritized action items for the development team:

1. **(MEDIUM — do first)** Add authentication middleware to `GET /api/users` and `GET /api/users/:id` before deploying to any non-development environment. User PII (name, email) must not be publicly accessible.

2. **(LOW)** Replace `Number(req.params.id)` with an explicit integer validation guard that returns `400 Bad Request` for non-integer or non-positive IDs. This improves API contract clarity and makes client-side error handling straightforward.

3. **(INFO — before production)** Run `npm audit` in CI on every pull request and before each release to detect newly published CVEs in `express` or other dependencies.

4. **(INFO — hardening)** Add `express-rate-limit` (or equivalent) in front of all routes to prevent ID enumeration and denial-of-service through request flooding.

5. **(INFO — low priority)** Consider returning a uniform 404 message for both missing routes and missing resources to reduce information available to an unauthenticated enumerator.

---

## References

Files read during this scan:

- `context/bugs/API-404/fix-summary.md` — fix scope and status
- `demo-bug-fix/src/controllers/userController.js` — lines reviewed: 7–11, 19, 23, 25–27, 37–39
- `demo-bug-fix/src/routes/users.js` — lines reviewed: 11, 14
- `demo-bug-fix/server.js` — lines reviewed: 9–10, 13, 16, 19–21
- `demo-bug-fix/package.json` — lines reviewed: 6–18
