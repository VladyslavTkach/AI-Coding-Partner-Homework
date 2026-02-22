# Test Report: Bug API-404

**Test Date**: 2026-02-22
**Agent**: Unit Test Generator
**Fix reviewed**: fix-summary.md — Overall Status: PASS

---

## Test Scope

Functions tested:
- `getUserById` in `demo-bug-fix/src/controllers/userController.js:18` — reason: changed by fix API-404 (line 19: `req.params.id` wrapped in `Number()`)

Functions excluded:
- `getAllUsers` — reason: not modified by this fix

---

## Test Cases

| Test ID | Description | Input | Expected | Actual | Result |
|---------|-------------|-------|----------|--------|--------|
| TC-01 | Happy path — first valid user ID | GET /api/users/123 | 200 `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | 200 `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | PASS |
| TC-02 | Happy path — second valid user ID | GET /api/users/456 | 200 `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | 200 `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | PASS |
| TC-03 | Happy path — third valid user ID | GET /api/users/789 | 200 `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | 200 `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | PASS |
| TC-04 | Error path — ID not in dataset | GET /api/users/999 | 404 `{"error":"User not found"}` | 404 `{"error":"User not found"}` | PASS |
| TC-05 | Regression — string param coerced to number | GET /api/users/123 | 200, body.id === 123, typeof body.id === "number" | 200, id=123, type=number | PASS |
| TC-06 | Edge case — non-numeric string ID (NaN) | GET /api/users/abc | 404 `{"error":"User not found"}` | 404 `{"error":"User not found"}` | PASS |

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
- [F] Fast: All 6 tests use supertest against an in-memory Express app with hardcoded in-memory user data. No real network calls, disk I/O, or database queries. Execution times range from 3ms to 67ms.
- [I] Independent: Each test issues its own isolated HTTP request. There is no shared mutable state between tests, no `beforeAll`/`afterAll` lifecycle hooks, and no dependency on execution order.
- [R] Repeatable: The data source is an in-memory array hardcoded in the controller module. There are no external services, clocks, or random values; results are identical on every run in every environment.
- [S] Self-validating: Every test has one or more `expect()` assertions that produce an unambiguous pass/fail signal without any manual inspection of output.
- [T] Timely: Tests are scoped exclusively to `getUserById`, the single function changed by fix API-404. The unchanged `getAllUsers` function is explicitly excluded from the test suite.

---

## Test Run Output

```
> demo-bug-fix@1.0.0 test
> jest

PASS tests/userController.test.js
  getUserById
    ✓ TC-01: returns 200 and Alice Smith for ID 123 (67 ms)
    ✓ TC-02: returns 200 and Bob Johnson for ID 456 (10 ms)
    ✓ TC-03: returns 200 and Charlie Brown for ID 789 (13 ms)
    ✓ TC-04: returns 404 and error message for non-existent ID 999 (8 ms)
    ✓ TC-05: returns 200 when ID is passed as string "123" (regression for type mismatch bug) (3 ms)
    ✓ TC-06: returns 404 for a non-numeric string ID "abc" (3 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        0.691 s, estimated 1 s
Ran all test suites.
```

---

## Overall Status

**PASS**

All 6 tests passed, covering all meaningful branches of the `getUserById` function changed by fix API-404.

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
