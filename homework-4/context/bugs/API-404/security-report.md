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
| **File:Line** | `demo-bug-fix/src/routes/users.js:11-14` |

**Description**: Both `GET /api/users` (line 11) and `GET /api/users/:id` (line 14) are registered with no authentication or authorization middleware. Any unauthenticated caller on the network can enumerate all users or retrieve any individual user record. In a production system this would constitute unrestricted access to personal data (name + email address) and would likely violate data-protection requirements.

**Remediation**: Add an authentication middleware (e.g., JWT verification, API-key check, or session validation) to the router or to each route handler before it reaches the controller. For example:

```js
router.get('/api/users/:id', authMiddleware, userController.getUserById);
```

---

### SEC-002 — No Rate Limiting on Any Endpoint

| Property | Value |
|----------|-------|
| **Category** | Rate Limiting |
| **Severity** | MEDIUM |
| **File:Line** | `demo-bug-fix/server.js:9-16` |

**Description**: The Express application (server.js lines 9–16) registers no rate-limiting middleware. Without rate limiting, the user-listing and user-lookup endpoints can be called an unlimited number of times in rapid succession. This enables brute-force ID enumeration (iterating numeric IDs until all users are discovered), denial-of-service through resource exhaustion, and credential-stuffing preparation. The `package.json` (line 14–16) also shows no rate-limiting package (e.g., `express-rate-limit`) among the dependencies.

**Remediation**: Add a rate-limiting middleware such as `express-rate-limit` early in the middleware chain in `server.js`:

```js
const rateLimit = require('express-rate-limit');
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

---

### SEC-003 — Missing Input Validation: Non-Numeric and Out-of-Range IDs Not Rejected

| Property | Value |
|----------|-------|
| **Category** | Missing Input Validation |
| **Severity** | MEDIUM |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:19` |

**Description**: The fix converts `req.params.id` to a number with `Number(req.params.id)` (line 19). However, `Number()` applied to a non-numeric string (e.g., `"abc"`, `"../etc"`, an empty string) silently produces `NaN`, and `Number()` applied to `"Infinity"` produces `Infinity`. In both cases the `Array.find` comparison on line 23 will not match any user and a 404 is returned, which is the correct observable outcome. However, there is no explicit guard that:

1. Rejects non-integer inputs with an HTTP 400 Bad Request, which would be the semantically correct response when the caller supplies an invalid parameter type.
2. Rejects negative integers or zero, which are never valid IDs in this data set.

Returning 404 for `NaN` and `Infinity` inputs is not wrong per se, but it leaks no information about the data set while also providing no feedback that the request itself was malformed. Explicit 400 handling is the standard REST practice and prevents any future refactor from accidentally turning silent `NaN` coercion into a different, potentially harmful behavior.

**Remediation**: Add an explicit type-and-range guard before the lookup:

```js
const userId = Number(req.params.id);
if (!Number.isInteger(userId) || userId <= 0) {
  return res.status(400).json({ error: 'Invalid user ID' });
}
```

---

### SEC-004 — Stale Comment Describing a Bug That No Longer Exists

| Property | Value |
|----------|-------|
| **Category** | Information Leakage |
| **Severity** | LOW |
| **File:Line** | `demo-bug-fix/src/controllers/userController.js:21-22` |

**Description**: Lines 21–22 contain a comment that reads:

```
// BUG: req.params.id returns a string, but users array uses numeric IDs
// Strict equality (===) comparison will always fail: "123" !== 123
```

This comment was accurate before the fix but is now incorrect and misleading — the bug has been resolved. More importantly, the comment explicitly describes an internal implementation detail (type mismatch in ID comparison) that would give a code-auditing attacker an instant understanding of the historical weakness and the exact data structure used. While comments are not accessible to API callers, they are visible in any source-code leak, repository exposure, or insider-threat scenario.

**Remediation**: Remove or replace the comment with a neutral explanation, for example:

```js
// Convert string param to integer for strict equality comparison with numeric IDs
```

---

### SEC-005 — express Dependency Version Range Permits Older 4.x Releases

| Property | Value |
|----------|-------|
| **Category** | Unsafe Dependencies |
| **Severity** | LOW |
| **File:Line** | `demo-bug-fix/package.json:15` |

**Description**: The express dependency is declared as `"^4.18.2"` (line 15). The caret range allows npm to resolve any `4.x.x >= 4.18.2`, which means a `npm install` on a fresh machine could resolve to a version other than the one that was tested. Express 4.x reached its maintenance end-of-life window and Express 5.x is the current stable release as of 2025. Remaining on the `4.x` semver range means the application will not receive Express 5 security patches and may be exposed to future vulnerabilities that are only fixed in 5.x.

**Remediation**: Pin to an exact version or upgrade to Express 5:

```json
"express": "5.1.0"
```

Run `npm audit` after upgrading to confirm no remaining advisories.

---

### SEC-006 — No Injection Risk from the Fix

**Category: Injection — No issues found.**

The fix on `userController.js:19` converts `req.params.id` with `Number()` and then performs an in-memory `Array.find` comparison on line 23. There is no SQL query, shell command, `eval`, regular-expression engine, template engine, or any other injectable sink in the code path. The value never leaves the Node.js process boundary before being compared against a hardcoded array.

---

### SEC-007 — No Hardcoded Secrets

**Category: Hardcoded Secrets — No issues found.**

No credentials, API keys, passwords, tokens, or connection strings were found in any of the four files reviewed. The only sensitive-adjacent value is `PORT` (server.js line 10), which is correctly read from the environment variable `process.env.PORT` with a safe fallback.

---

### SEC-008 — No Insecure Loose-Equality Comparisons After the Fix

**Category: Insecure Comparison — No issues found.**

`userController.js:23` uses strict equality (`===`) to compare `userId` (a `Number`) against `u.id` (also a `Number`). No loose-equality (`==`) comparisons involving untrusted input exist after the fix.

---

### SEC-009 — No XSS or CSRF Risk

**Category: XSS / CSRF — No issues found.**

All responses are produced via `res.json()` (controller lines 26, 29, 38) or `res.json()` in the health check (server.js line 20). No endpoint renders HTML or reflects unsanitized user input into an HTML body. The `Content-Type` header will be `application/json`, which prevents browsers from executing the response as a script. No state-mutating endpoints (POST, PUT, DELETE) exist, so CSRF does not apply.

---

## Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 1 |
| MEDIUM   | 2 |
| LOW      | 2 |
| INFO     | 0 |
| **Total**| **5** |

---

## Recommendations

Prioritized action items for the development team:

1. **[HIGH] Add authentication middleware** to all `/api/users` routes before promoting the service to any environment accessible beyond localhost. No user data should be readable without verifying the caller's identity.

2. **[MEDIUM] Add rate-limiting middleware** (`express-rate-limit` or equivalent) at the application level in `server.js` to prevent ID enumeration and denial-of-service.

3. **[MEDIUM] Add explicit input validation** in `getUserById` that returns HTTP 400 for non-integer or non-positive IDs, rather than silently producing `NaN` and falling through to a 404.

4. **[LOW] Remove the stale BUG comment** on lines 21–22 of `userController.js`. Replace it with a neutral implementation note so source-code exposure does not immediately reveal historical weaknesses.

5. **[LOW] Upgrade Express to v5 and pin dependency versions** in `package.json`. Run `npm audit` after any upgrade to clear outstanding advisories.

---

## References

Files read during this scan:
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/context/bugs/API-404/fix-summary.md`
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/demo-bug-fix/src/controllers/userController.js`
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/demo-bug-fix/src/routes/users.js`
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/demo-bug-fix/server.js`
- `/home/vtkach/Projects/Studying/ai-training/AI-Coding-Partner-Homework/homework-4/demo-bug-fix/package.json`
