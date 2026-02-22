# Test Report: Bug API-404

**Test Date**: 2026-02-22
**Agent**: Unit Test Generator
**Fix reviewed**: fix-summary.md — Overall Status: PASS

---

## Test Scope

Functions tested:
- `getUserById` in `demo-bug-fix/src/controllers/userController.js:18` — reason: changed by fix API-404 (line 19: `req.params.id` now wrapped in `Number()`)

Functions excluded:
- `getAllUsers` in `demo-bug-fix/src/controllers/userController.js:37` — reason: not modified by this fix

---

## Test Cases

| Test ID | Description | Input | Expected | Actual | Result |
|---------|-------------|-------|----------|--------|--------|
| TC-01 | Returns 200 and user object for existing ID 123 | GET /api/users/123 | 200, `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | 200, `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | PASS |
| TC-02 | Returns 200 and user object for existing ID 456 | GET /api/users/456 | 200, `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | 200, `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | PASS |
| TC-03 | Returns 200 and user object for existing ID 789 | GET /api/users/789 | 200, `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | 200, `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | PASS |
| TC-04 | Returns 404 and error message for non-existent ID 999 | GET /api/users/999 | 404, `{"error":"User not found"}` | 404, `{"error":"User not found"}` | PASS |
| TC-05 | Returns 404 for non-numeric segment (NaN after Number()) | GET /api/users/abc | 404, `{"error":"User not found"}` | 404, `{"error":"User not found"}` | PASS |
| TC-06 | Returns 404 for ID 0 (not present in the dataset) | GET /api/users/0 | 404, `{"error":"User not found"}` | 404, `{"error":"User not found"}` | PASS |
| TC-07 | Returns 404 for negative ID -1 (not present in the dataset) | GET /api/users/-1 | 404, `{"error":"User not found"}` | 404, `{"error":"User not found"}` | PASS |
| TC-08 | Returns 200 for ID with leading zeros (Number("0123") === 123) | GET /api/users/0123 | 200, `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | 200, `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | PASS |

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
- [F] Fast: All 8 tests completed in 0.6 seconds total. supertest makes in-process HTTP calls to the Express app without binding a real port. The user data is in-memory with no database queries, real network calls, or disk I/O.
- [I] Independent: Each test issues a self-contained HTTP GET request. The in-memory `users` array is never mutated by any test. Tests produce identical results regardless of execution order or whether they run individually or together.
- [R] Repeatable: The in-memory dataset is static and deterministic. No external services, system clocks, or random values are involved. The suite produces identical results on every run and in every environment where Node.js and the dependencies are available.
- [S] Self-validating: Every test uses `expect(res.status).toBe(...)` and `expect(res.body).toEqual(...)`. Each assertion produces an unambiguous pass/fail signal with no manual inspection of output required.
- [T] Timely: Tests cover only `getUserById`, the one function changed by fix API-404. The unchanged `getAllUsers` function is intentionally excluded from scope, keeping the tests tightly aligned with the change that was made.

---

## Test Run Output

```
> demo-bug-fix@1.0.0 test
> jest

PASS tests/userController.test.js
  GET /api/users/:id — getUserById
    ✓ TC-01: returns 200 and user object for existing ID 123 (24 ms)
    ✓ TC-02: returns 200 and user object for existing ID 456 (7 ms)
    ✓ TC-03: returns 200 and user object for existing ID 789 (2 ms)
    ✓ TC-04: returns 404 and error message for non-existent ID 999 (2 ms)
    ✓ TC-05: returns 404 for non-numeric segment (NaN after Number()) (2 ms)
    ✓ TC-06: returns 404 for ID 0 (not present in the dataset) (4 ms)
    ✓ TC-07: returns 404 for negative ID -1 (not present in the dataset) (2 ms)
    ✓ TC-08: returns 200 for ID passed with leading zeros (Number("0123") === 123) (2 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        0.6 s
Ran all test suites.
```

---

## Overall Status

**PASS**

All 8 tests covering the changed `getUserById` function passed, confirming that the type-coercion fix correctly resolves the strict-equality mismatch between string route params and numeric user IDs.

---

## References

Files read:
- `context/bugs/API-404/fix-summary.md`
- `demo-bug-fix/src/controllers/userController.js`
- `demo-bug-fix/src/routes/users.js`
- `demo-bug-fix/server.js`
- `demo-bug-fix/package.json`
- `demo-bug-fix/tests/userController.test.js`

Skills preloaded:
- `unit-tests-FIRST`

Files written:
- `context/bugs/API-404/test-report.md`
