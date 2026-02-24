# Codebase Research: API-404

## Bug Description

`GET /api/users/:id` returns HTTP 404 for every valid user ID. The route is correctly registered and the data exists in memory — the failure is a silent type mismatch in the lookup: the requested ID is never found because it is compared with the wrong type.

## Code Path

### 1. Entry Point — `demo-bug-fix/server.js`

- **Line 6**: `const express = require('express');` — Express loaded
- **Line 7**: `const userRoutes = require('./src/routes/users');` — user router imported
- **Line 9**: `const app = express();` — app instance created
- **Line 13**: `app.use(express.json());` — JSON body-parsing middleware registered
- **Line 16**: `app.use(userRoutes);` — user routes mounted (no path prefix; routes define their own paths)

### 2. Route Layer — `demo-bug-fix/src/routes/users.js`

- **Line 7**: `const router = express.Router();` — router created
- **Line 8**: `const userController = require('../controllers/userController');` — controller imported
- **Line 11**: `router.get('/api/users', userController.getAllUsers);` — list endpoint (unaffected)
- **Line 14**: `router.get('/api/users/:id', userController.getUserById);` — single-user endpoint; Express captures `:id` from the URL as a **string**

### 3. Bug Location — `demo-bug-fix/src/controllers/userController.js`

**In-memory data store (lines 7–11)**:
```js
const users = [
  { id: 123, name: 'Alice Smith', email: 'alice@example.com' },
  { id: 456, name: 'Bob Johnson', email: 'bob@example.com' },
  { id: 789, name: 'Charlie Brown', email: 'charlie@example.com' }
];
```

**Faulty parameter capture (line 19)**:
```js
const userId = req.params.id;
```

**Strict-equality lookup (line 23)**:
```js
const user = users.find(u => u.id === userId);
```

**404 branch always reached (lines 25–27)**:
```js
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
```

## Root Cause

`req.params.id` is always a **string** (e.g. `"123"`). The `id` fields in the `users` array are **numbers** (e.g. `123`). JavaScript's strict equality operator `===` never coerces types, so `"123" === 123` is always `false`. `Array.prototype.find` therefore always returns `undefined`, the `!user` guard on line 25 is always truthy, and every request returns 404.

Fix: coerce before comparison — `const userId = Number(req.params.id);` on line 19.
