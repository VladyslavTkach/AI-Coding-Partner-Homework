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
| TC-01 | Happy path — known user ID 123 | `GET /api/users/123` | HTTP 200, `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | HTTP 200, correct body | PASS |
| TC-02 | Happy path — known user ID 456 | `GET /api/users/456` | HTTP 200, `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | HTTP 200, correct body | PASS |
| TC-03 | Happy path — known user ID 789 | `GET /api/users/789` | HTTP 200, `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | HTTP 200, correct body | PASS |
| TC-04 | Error path — valid number not in dataset | `GET /api/users/999` | HTTP 404, `{"error":"User not found"}` | HTTP 404, correct body | PASS |
| TC-05 | Edge case — non-numeric segment (NaN after Number()) | `GET /api/users/abc` | HTTP 404, `{"error":"User not found"}` | HTTP 404, correct body | PASS |
| TC-06 | Edge case — ID 0 (not in dataset) | `GET /api/users/0` | HTTP 404, `{"error":"User not found"}` | HTTP 404, correct body | PASS |

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
- [F] Fast: All 6 tests use supertest against an in-memory Express app with static in-memory user data. No real network calls, no disk I/O, no database queries. Total suite runtime was 0.478 s.
- [I] Independent: Each test makes a self-contained HTTP request with no shared mutable state between tests. Tests can run in any order or individually and produce the same result.
- [R] Repeatable: The user data array is a static constant with no dependency on external services, system clocks, or random values. The suite produces identical results across environments and repeated runs.
- [S] Self-validating: Every test contains explicit `expect(res.status).toBe(...)` and `expect(res.body).toEqual(...)` assertions that yield an unambiguous pass/fail result with no manual output inspection required.
- [T] Timely: Tests are scoped exclusively to `getUserById`, the single function modified by fix API-404. The unchanged `getAllUsers` function is intentionally excluded from scope.

---

## Test Run Output

```
> demo-bug-fix@1.0.0 test
> jest

PASS tests/userController.test.js
  GET /api/users/:id — getUserById
    ✓ TC-01: returns 200 and user object for existing ID 123 (23 ms)
    ✓ TC-02: returns 200 and user object for existing ID 456 (7 ms)
    ✓ TC-03: returns 200 and user object for existing ID 789 (3 ms)
    ✓ TC-04: returns 404 and error body for non-existent ID 999 (2 ms)
    ✓ TC-05: returns 404 for non-numeric segment (NaN after Number()) (3 ms)
    ✓ TC-06: returns 404 for ID 0 (not present in the dataset) (2 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        0.478 s, estimated 1 s
Ran all test suites.
```

---

## Overall Status

**PASS**

All 6 tests covering the `getUserById` function changed by fix API-404 passed with no failures.

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
