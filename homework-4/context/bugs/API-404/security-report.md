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

**Description**: The application mounts all user routes (`GET /api/users`, `GET /api/users/:id`) at `server.js:16` with no authentication or authorization middleware applied at any level — neither in `server.js` nor in `demo-bug-fix/src/routes/users.js`. Any unauthenticated caller with network access can enumerate all users and retrieve individual user records including email addresses. In a production setting this constitutes an access-control failure; in this demo context it is a structural gap that would block a safe promotion to any shared environment.

**Remediation**: Add an authentication middleware (e.g. JWT verification via `express-jwt`, or a simple API key check) before the `app.use(userRoutes)` call in `server.js`. Apply authorization checks per route if different roles have different access levels.

---

### SEC-002 — No Rate Limiting on Any Endpoint

| Property | Value |
|----------|-------|
| **Category** | Rate Limiting |
| **Severity** | MEDIUM |
| **File:Line** | `demo-bug-fix/server.js:13` |

**Description**: The middleware chain in `server.js` contains only `express.json()` (line 13). There is no rate-limiting or request-throttling middleware (e.g. `express-rate-limit`). Without a per-IP or per-token request cap, an attacker can send an unbounded number of requests — enabling brute-force enumeration of user IDs, denial-of-service via request flooding, or credential-stuffing if an auth layer is added later without also adding rate limiting.

**Remediation**: Add `express-rate-limit` (or an equivalent) as a middleware before the route handlers in `server.js`. Configure a conservative window (e.g. 100 requests per 15 minutes per IP) and return HTTP 429 on violation.

---

### SEC-003 — Missing Input Validation Returns HTTP 404 for Invalid ID Format

| Property | Value |
|----------|-------|
| **Category** | Missing Input Validation |
| **Severity** | LOW |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:19` |

**Description**: The fix converts `req.params.id` with `Number()` (line 19), which silently returns `NaN` for non-numeric strings such as `"abc"` or `"../etc/passwd"`, `0` for an empty string, and a float for `"1.5"`. None of these cases are validated: there is no `isNaN()` guard, no positive-integer check, and no HTTP 400 response for malformed input. As a result, a request such as `GET /api/users/abc` falls through to the `.find()` call, fails to match any user, and returns `HTTP 404 {"error":"User not found"}`. This conflates "bad input" with "record not found", making the API semantically incorrect and aiding ID-space enumeration (callers can infer that valid IDs are numeric).

**Remediation**: Add an explicit guard immediately after line 19:
```js
if (!Number.isInteger(userId) || userId <= 0) {
  return res.status(400).json({ error: 'Invalid user ID' });
}
```
This ensures non-numeric and non-positive inputs receive HTTP 400 before reaching the lookup logic.

---

### SEC-004 — Health Endpoint Discloses Application Identity

| Property | Value |
|----------|-------|
| **Category** | Information Leakage |
| **Severity** | LOW |
| **File:Line** | `demo-bug-fix/server.js:20` |

**Description**: The `/health` endpoint at `server.js:19-21` returns `{"status":"ok","message":"Demo API is running"}`. The `message` field confirms the application is alive and reveals its internal description string. While low-risk on its own, this is passive reconnaissance information that confirms the service fingerprint without requiring any credentials.

**Remediation**: Return only a minimal health payload, for example `{"status":"ok"}`, and omit descriptive strings that aid fingerprinting.

---

### SEC-005 — Semver Range Allows Unintended Dependency Upgrades

| Property | Value |
|----------|-------|
| **Category** | Unsafe Dependencies |
| **Severity** | INFO |
| **File:Line** | `demo-bug-fix/package.json:16` |

**Description**: `express` is declared as `"^4.18.2"` in `package.json` (line 16). The caret range allows `npm install` to resolve any version `>=4.18.2 <5.0.0`. If `package-lock.json` is absent, deleted, or regenerated, a newly published minor or patch release — including one that introduces a regression or an unpatched CVE window before a patch is released — could be pulled in silently. The same applies to `jest ^29.0.0` (line 18), `nodemon ^3.0.1` (line 19), and `supertest ^6.3.0` (line 20). No actively exploited CVEs in the declared ranges are known at the scan date; this is a hygiene observation.

**Remediation**: Commit `package-lock.json` to version control and run `npm ci` (instead of `npm install`) in CI/CD pipelines to pin exact resolved versions. Periodically run `npm audit` and upgrade deliberately.

---

### SEC-006 — Stale BUG Comment Left in Production Code

| Property | Value |
|----------|-------|
| **Category** | Information Leakage |
| **Severity** | INFO |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:21` |

**Description**: Lines 21-22 in the fixed file still contain:
```js
// BUG: req.params.id returns a string, but users array uses numeric IDs
// Strict equality (===) comparison will always fail: "123" !== 123
```
These comments were left over from the pre-fix state and now describe a bug that no longer exists. Stale comments that contradict the current code reduce code clarity and, if read by a developer, could mislead them into reverting the fix or introducing a similar bug elsewhere.

**Remediation**: Remove or update lines 21-22 to reflect the current correct behavior, e.g.:
```js
// req.params.id is coerced to a Number so strict equality matches numeric IDs.
```

---

**Injection**: No issues found. `req.params.id` is coerced with `Number()` and used exclusively in an in-memory array `.find()` — no SQL, shell command, `eval`, or other injection sink is present.

**Hardcoded Secrets**: No issues found. No credentials, API keys, passwords, or tokens are present in any scanned file.

**Insecure Comparison**: No issues found. The fix retains strict equality (`===`) at `userController.js:23`; no loose-equality (`==`) comparisons involving untrusted input were found.

**XSS / CSRF**: No issues found. All responses are JSON (`res.json()`). No HTML is rendered and no user input is reflected into any response body.

---

## Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 0 |
| MEDIUM   | 2 |
| LOW      | 2 |
| INFO     | 2 |
| **Total**| **6** |

---

## Recommendations

Prioritized action items for the development team:

1. **Add authentication/authorization middleware** (SEC-001, MEDIUM) — All endpoints are publicly accessible. Apply JWT or API-key verification in `server.js` before mounting user routes. This is the highest-priority item before any production deployment.

2. **Add rate limiting** (SEC-002, MEDIUM) — Add `express-rate-limit` to prevent brute-force enumeration and DoS. Configure it alongside, or as part of, the auth middleware layer.

3. **Validate the `:id` parameter and return HTTP 400 for invalid input** (SEC-003, LOW) — Use `Number.isInteger(userId) && userId > 0` to guard the lookup. Return `HTTP 400 {"error":"Invalid user ID"}` for non-integer or non-positive input so clients receive a semantically correct response.

4. **Minimise the `/health` response payload** (SEC-004, LOW) — Remove the `message` field from the health check response to reduce passive fingerprinting exposure.

5. **Commit `package-lock.json` and use `npm ci` in CI/CD** (SEC-005, INFO) — Prevents silent dependency drift and ensures reproducible builds.

6. **Remove or update stale BUG comment** (SEC-006, INFO) — Delete or reword lines 21-22 in `userController.js` so comments accurately describe the current, correct behavior.

---

## References

Files read during this scan:
- `demo-bug-fix/src/controllers/userController.js`
- `demo-bug-fix/src/routes/users.js`
- `demo-bug-fix/server.js`
- `demo-bug-fix/package.json`
- `context/bugs/API-404/fix-summary.md`
