# Codebase Research: API-404

## Bug Description

`GET /api/users/:id` returns HTTP 404 with `{"error": "User not found"}` for every valid user ID (e.g., `123`, `456`, `789`), even though those IDs exist in the in-memory `users` array. `GET /api/users` (list all) continues to work correctly.

## Code Path

### 1. Entry Point — `demo-bug-fix/server.js`

- **Line 6**: `const express = require('express');` — loads Express framework
- **Line 7**: `const userRoutes = require('./src/routes/users');` — loads user routes module
- **Line 9**: `const app = express();` — creates the Express application
- **Line 13**: `app.use(express.json());` — registers JSON body-parsing middleware
- **Line 16**: `app.use(userRoutes);` — mounts all user routes on the root path

### 2. Route Definitions — `demo-bug-fix/src/routes/users.js`

- **Line 7**: `const router = express.Router();` — creates a dedicated router instance
- **Line 8**: `const userController = require('../controllers/userController');` — imports the controller
- **Line 11**: `router.get('/api/users', userController.getAllUsers);` — binds GET /api/users to getAllUsers handler
- **Line 14**: `router.get('/api/users/:id', userController.getUserById);` — binds GET /api/users/:id to getUserById handler; `:id` is captured as a route parameter

### 3. Bug Location — `demo-bug-fix/src/controllers/userController.js`

**In-memory data store (lines 7–11)**:
```js
const users = [
  { id: 123, name: 'Alice Smith', email: 'alice@example.com' },
  { id: 456, name: 'Bob Johnson', email: 'bob@example.com' },
  { id: 789, name: 'Charlie Brown', email: 'charlie@example.com' }
];
```

**getUserById handler (lines 18–30)**:
```js
async function getUserById(req, res) {
  const userId = req.params.id;

  // BUG: req.params.id returns a string, but users array uses numeric IDs
  // Strict equality (===) comparison will always fail: "123" !== 123
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
}
```

**Faulty comparison (line 23)**:
```js
const user = users.find(u => u.id === userId);
```

## Root Cause

Express route parameters are always delivered as strings. When a request arrives for `GET /api/users/123`, `req.params.id` is the string `"123"`. The `users` array stores IDs as JavaScript numbers (e.g., `123`). The strict equality operator `===` does not perform type coercion, so `123 === "123"` evaluates to `false`. `Array.prototype.find` therefore never finds a match and returns `undefined`, causing the handler to fall through to the 404 branch on every request — regardless of whether the ID exists in the array.

The fix is to convert `req.params.id` to a number before the comparison, for example:

```js
const userId = Number(req.params.id);
```

This makes `userId` a `number` so that `123 === 123` evaluates to `true` and the correct user is returned.
