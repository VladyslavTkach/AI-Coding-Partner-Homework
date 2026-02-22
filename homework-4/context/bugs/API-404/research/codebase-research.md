# Codebase Research: API-404

## Bug Description

`GET /api/users/:id` returns HTTP 404 for every valid user ID (123, 456, 789). The endpoint exists and is correctly registered; the issue is an internal lookup failure — the user is never found even when the requested ID matches a record in the data store.

## Code Path

### 1. Entry Point — `demo-bug-fix/server.js`

- **Line 6**: `const express = require('express');` — Express framework loaded
- **Line 7**: `const userRoutes = require('./src/routes/users');` — user router imported
- **Line 9**: `const app = express();` — Express application created
- **Line 13**: `app.use(express.json());` — JSON body-parser middleware registered
- **Line 16**: `app.use(userRoutes);` — user routes mounted on the app (no prefix; routes define their own paths)

### 2. Route Definitions — `demo-bug-fix/src/routes/users.js`

- **Line 7**: `const router = express.Router();` — router instance created
- **Line 8**: `const userController = require('../controllers/userController');` — controller imported
- **Line 11**: `router.get('/api/users', userController.getAllUsers);` — list-all route (works correctly)
- **Line 14**: `router.get('/api/users/:id', userController.getUserById);` — get-by-ID route; `:id` captures the path segment as a string

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

**Faulty comparison (line 23)**:
```js
const user = users.find(u => u.id === userId);
```

**404 branch (lines 25–27)**:
```js
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
```

## Root Cause

`req.params.id` always yields a **string** (e.g. `"123"`). The `users` array stores IDs as **numbers** (e.g. `123`). The strict equality operator `===` never coerces types, so `123 === "123"` is always `false`. `users.find()` therefore always returns `undefined`, the `!user` guard on line 25 is always true, and every request to `GET /api/users/:id` returns 404 regardless of whether the ID exists.

The fix is to coerce the parameter to a number before the comparison, e.g. `const userId = Number(req.params.id);` on line 19.
