# Implementation Plan: Bug API-404

**Bug**: GET /api/users/:id returns 404 for valid user IDs
**Plan Author**: Bug Planner
**Date**: 2026-02-21
**Input**: `context/bugs/API-404/research/verified-research.md` (Research Quality: Excellent, 4/4 criteria met)

---

## Bug Summary

`req.params.id` always returns a `string` (e.g. `"123"`).
User IDs in the `users` array are stored as `number` (e.g. `123`).
The strict equality operator `===` does not coerce types: `"123" === 123` is always `false`.
Therefore `users.find()` never finds a match and the `if (!user)` branch fires, returning 404 for every valid ID.

**Root cause references** (from verified research):
- `src/controllers/userController.js:19` — `const userId = req.params.id;` captures the param as a string
- `src/controllers/userController.js:23` — `const user = users.find(u => u.id === userId);` performs the failing comparison

---

## Fix Location

| Property | Value |
|---|---|
| **File** | `demo-bug-fix/src/controllers/userController.js` |
| **Function** | `getUserById` |
| **Line** | 19 |

---

## Code Change

**Before**:
```js
const userId = req.params.id;
```

**After**:
```js
const userId = Number(req.params.id);
```

**Rationale**: `Number("123")` returns the number `123`. The existing comparison `u.id === userId` at line 23 then evaluates as `123 === 123`, which is `true`, and `users.find()` returns the correct user.

No other code changes are needed. The `if (!user)` branch, the `getAllUsers` function, and all routes remain untouched.

---

## Files Changed

| File | Change |
|---|---|
| `demo-bug-fix/src/controllers/userController.js` | Line 19: add `Number()` coercion |

No changes required to:
- `demo-bug-fix/src/routes/users.js` (routes are correct)
- `demo-bug-fix/server.js` (app setup is correct)

---

## Verification Steps

After applying the fix, run these commands with the server started (`npm start` in `demo-bug-fix/`):

### 1. Primary fix verification
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users/123
# Expected HTTP status: 200

curl -s http://localhost:3000/api/users/123
# Expected body: {"id":123,"name":"Alice Smith","email":"alice@example.com"}
```

### 2. Additional ID checks
```bash
curl -s http://localhost:3000/api/users/456
# Expected: {"id":456,"name":"Bob Johnson","email":"bob@example.com"}

curl -s http://localhost:3000/api/users/789
# Expected: {"id":789,"name":"Charlie Brown","email":"charlie@example.com"}
```

### 3. Not-found case (unchanged behavior)
```bash
curl -s http://localhost:3000/api/users/999
# Expected: {"error":"User not found"} with HTTP 404
```

### 4. Regression check — list all users
```bash
curl -s http://localhost:3000/api/users
# Expected: array of 3 users, all IDs still numeric
```

**Pass criteria**: steps 1–3 return the expected JSON; step 4 returns all 3 users with no change.
