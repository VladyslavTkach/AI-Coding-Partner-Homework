# Test Report: Bug API-404

**Test Date**: 2026-02-21
**Agent**: Unit Test Generator
**Fix reviewed**: fix-summary.md — Overall Status: PASS

---

## Test Scope

Functions tested:
- `getUserById` in `demo-bug-fix/src/controllers/userController.js:18` — reason: changed by fix API-404 (line 19: `req.params.id` now wrapped in `Number()`)

Functions excluded:
- `getAllUsers` — reason: not modified by this fix

---

## Test Cases

| Test ID | Description | Input | Expected | Actual | Result |
|---------|-------------|-------|----------|--------|--------|
| TC-01 | Happy path — existing user ID 123 | `GET /api/users/123` | 200 `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | 200 `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | PASS |
| TC-02 | Happy path — existing user ID 456 | `GET /api/users/456` | 200 `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | 200 `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | PASS |
| TC-03 | Happy path — existing user ID 789 | `GET /api/users/789` | 200 `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | 200 `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | PASS |
| TC-04 | Error path — valid number not in dataset | `GET /api/users/999` | 404 `{"error":"User not found"}` | 404 `{"error":"User not found"}` | PASS |
| TC-05 | Edge case — non-numeric segment (NaN) | `GET /api/users/abc` | 404 `{"error":"User not found"}` | 404 `{"error":"User not found"}` | PASS |
| TC-06 | Edge case — zero (not in dataset) | `GET /api/users/0` | 404 `{"error":"User not found"}` | 404 `{"error":"User not found"}` | PASS |
| TC-07 | Edge case — negative ID (not in dataset) | `GET /api/users/-1` | 404 `{"error":"User not found"}` | 404 `{"error":"User not found"}` | PASS |
| TC-08 | Edge case — leading zeros (`Number("0123") === 123`) | `GET /api/users/0123` | 200 `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | 200 `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | PASS |

---

## FIRST Compliance

```
FIRST Compliance: Fully Compliant
Criteria met: 5/5
  [F] Fast            : PASS
  [I] Independent     : PASS
  [R] Repeatable      : PASS
  [S] Self-validating : PASS
  [T] Timely          : PASS
```

**Reasoning**:
- [F] Fast: All 8 tests complete in milliseconds (total suite time 0.281 s). supertest drives the Express app in-process — no real network sockets opened to external hosts. User data lives entirely in-memory.
- [I] Independent: Each test issues a standalone HTTP request. There is no shared mutable state between tests; the in-memory `users` array is never written to, and no `beforeAll`/`afterAll` hooks mutate shared fixtures.
- [R] Repeatable: Tests rely only on static in-memory data, with no external services, random values, or wall-clock timestamps. The suite produces identical results on every run and in every environment where Node.js and the dependencies are installed.
- [S] Self-validating: Every test uses `expect(res.status).toBe(...)` and `expect(res.body).toEqual(...)` — unambiguous programmatic assertions that produce an automatic pass/fail signal with no manual inspection required.
- [T] Timely: The test file covers exclusively `getUserById`, the single function changed by fix API-404. No pre-existing untested code from `getAllUsers` or other handlers was pulled into scope.

---

## Test Run Output

```
> demo-bug-fix@1.0.0 test
> jest

PASS tests/userController.test.js
  GET /api/users/:id — getUserById
    ✓ TC-01: returns 200 and user object for existing ID 123 (12 ms)
    ✓ TC-02: returns 200 and user object for existing ID 456 (2 ms)
    ✓ TC-03: returns 200 and user object for existing ID 789 (2 ms)
    ✓ TC-04: returns 404 and error message for non-existent ID 999 (1 ms)
    ✓ TC-05: returns 404 for non-numeric segment (NaN after Number()) (1 ms)
    ✓ TC-06: returns 404 for ID 0 (not present in the dataset) (1 ms)
    ✓ TC-07: returns 404 for negative ID -1 (not present in the dataset) (2 ms)
    ✓ TC-08: returns 200 for ID passed with leading zeros (Number("0123") === 123) (1 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        0.281 s, estimated 1 s
Ran all test suites.
```

---

## Overall Status

**PASS**

All 8 tests pass; the `Number()` coercion fix in `getUserById` is fully verified across happy paths, error paths, and boundary/type-mismatch edge cases.

---

## References

Files read:
- `context/bugs/API-404/fix-summary.md`
- `demo-bug-fix/src/controllers/userController.js`
- `demo-bug-fix/src/routes/users.js`
- `demo-bug-fix/server.js`
- `demo-bug-fix/package.json`

Skills preloaded:
- `unit-tests-FIRST`

Files written:
- `demo-bug-fix/tests/userController.test.js`
- `context/bugs/API-404/test-report.md`
