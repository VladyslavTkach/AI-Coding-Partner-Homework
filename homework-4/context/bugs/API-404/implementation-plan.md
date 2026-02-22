# Implementation Plan: API-404

## Bug Summary

`GET /api/users/:id` returns HTTP 404 for every valid user ID.

**Root Cause**: `req.params.id` is always a string (e.g. `"123"`). The `id` fields in the `users` array are numbers (e.g. `123`). JavaScript's strict equality operator `===` never coerces types, so `"123" === 123` is always `false`. `Array.prototype.find` therefore always returns `undefined`, the `!user` guard is always truthy, and every request returns 404.

## Files Changed

| File | Function | Change |
|------|----------|--------|
| `demo-bug-fix/src/controllers/userController.js` | `getUserById` | Coerce `req.params.id` to a number before comparison |

## Code Change

**File**: `demo-bug-fix/src/controllers/userController.js`

**Function**: `getUserById`, line 19

**Before**:
```js
  const userId = req.params.id;
```

**After**:
```js
  const userId = Number(req.params.id);
```

## Verification Steps

### Primary fix — GET /api/users/:id

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users/123
```

Expected HTTP status: `200`

```bash
curl -s http://localhost:3000/api/users/123
```

Expected response body:
```json
{"id":123,"name":"Alice Smith","email":"alice@example.com"}
```

### Regression check — GET /api/users

```bash
curl -s http://localhost:3000/api/users
```

Expected HTTP status: `200`

Expected response body (all 3 users returned):
```json
[{"id":123,"name":"Alice Smith","email":"alice@example.com"},{"id":456,"name":"Bob Johnson","email":"bob@example.com"},{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}]
```
