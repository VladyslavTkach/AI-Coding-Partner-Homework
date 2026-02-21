# Codebase Research: Bug API-404

**Bug**: GET /api/users/:id returns 404 for valid user IDs
**Researcher**: Bug Researcher Agent
**Date**: 2026-02-21

---

## Execution Path

The request flows through three files:

```
server.js  →  src/routes/users.js  →  src/controllers/userController.js
```

---

## File: server.js

### Route registration

**Line 7** — user routes module is loaded:
```js
const userRoutes = require('./src/routes/users');
```

**Line 16** — routes are mounted on the app with no prefix:
```js
app.use(userRoutes);
```

### Finding

The router is mounted correctly with no path prefix. All paths defined inside the router are active as-is (e.g. `/api/users/:id`).

---

## File: src/routes/users.js

### Route definitions

**Line 11** — list-all-users route (working):
```js
router.get('/api/users', userController.getAllUsers);
```

**Line 14** — single-user route (broken):
```js
router.get('/api/users/:id', userController.getUserById);
```

### Finding

Both routes are defined correctly. The `:id` parameter will be available as `req.params.id` in the controller. No issue at this layer.

---

## File: src/controllers/userController.js

### Users data

**Lines 7–11** — in-memory user array with **numeric** IDs:
```js
const users = [
  { id: 123, name: 'Alice Smith', email: 'alice@example.com' },
  { id: 456, name: 'Bob Johnson', email: 'bob@example.com' },
  { id: 789, name: 'Charlie Brown', email: 'charlie@example.com' }
];
```

### getUserById function

**Line 19** — `req.params.id` is read as a **string**:
```js
const userId = req.params.id;
```

**Line 23** — strict equality comparison between string and number:
```js
const user = users.find(u => u.id === userId);
```

### Finding — Root Cause

`req.params.id` always returns a `string` (e.g. `"123"`).
The `users` array stores IDs as `number` (e.g. `123`).
The strict equality operator (`===`) does not coerce types, so `123 === "123"` is always `false`.
`users.find()` never matches and returns `undefined`.
The `if (!user)` branch at line 25 fires and returns 404 for every request.

### getAllUsers function (working)

**Lines 37–39** — returns the full array without any ID comparison:
```js
async function getAllUsers(req, res) {
  res.json(users);
}
```

`GET /api/users` works because it never performs a type-sensitive lookup.

---

## Summary

| File | Line | Issue |
|------|------|-------|
| `src/controllers/userController.js` | 19 | `req.params.id` captured as `string` |
| `src/controllers/userController.js` | 23 | `===` compares `string` to `number` — always `false` |
| `src/routes/users.js` | 14 | No issue |
| `server.js` | 16 | No issue |

**Fix required**: convert `userId` to a number before comparison in `userController.js:23`.
