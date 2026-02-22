# Test Report: Bug API-404

**Test Date**: 2026-02-22
**Agent**: Unit Test Generator
**Fix reviewed**: fix-summary.md — Overall Status: PASS

---

## Test Scope

Functions tested:
- `getUserById` in `demo-bug-fix/src/controllers/userController.js:18` — reason: changed by fix API-404 (line 19 changed from `const userId = req.params.id` to `const userId = Number(req.params.id)`)

Functions excluded:
- `getAllUsers` — reason: not modified by this fix; logic on lines 36-38 was untouched

---

## Test Cases

| Test ID | Description | Input | Expected | Actual | Result |
|---------|-------------|-------|----------|--------|--------|
| TC-01 | Happy path — existing ID 123 returns correct user | GET /api/users/123 | HTTP 200, `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | HTTP 200, `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | PASS |
| TC-02 | Happy path — existing ID 456 returns correct user | GET /api/users/456 | HTTP 200, `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | HTTP 200, `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | PASS |
| TC-03 | Happy path — existing ID 789 returns correct user | GET /api/users/789 | HTTP 200, `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | HTTP 200, `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | PASS |
| TC-04 | Error path — non-existent numeric ID returns 404 | GET /api/users/999 | HTTP 404, `{"error":"User not found"}` | HTTP 404, `{"error":"User not found"}` | PASS |
| TC-05 | Edge case — non-numeric segment (NaN after Number()) returns 404 | GET /api/users/abc | HTTP 404, `{"error":"User not found"}` | HTTP 404, `{"error":"User not found"}` | PASS |
| TC-06 | Edge case — ID 0 (not in dataset) returns 404 | GET /api/users/0 | HTTP 404, `{"error":"User not found"}` | HTTP 404, `{"error":"User not found"}` | PASS |

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
- [F] Fast: All 6 tests completed in 0.489 s total (individual tests ranged from 2 ms to 28 ms). The app uses an in-memory array for user data — no real database queries, no real network calls, and no disk I/O occur during the test run.
- [I] Independent: Each test issues its own independent HTTP request through supertest and reads from a module-level constant that is never mutated. Tests can be run in any order or in isolation with identical results.
- [R] Repeatable: The in-memory `users` array is a constant defined at module load time and is never written to. Every run in every environment produces the same HTTP responses. No external services, clocks, or random values are involved.
- [S] Self-validating: Every test contains programmatic `expect(res.status).toBe(...)` and `expect(res.body).toEqual(...)` assertions. Jest reports an unambiguous PASS or FAIL for each test with no manual inspection required.
- [T] Timely: Tests are scoped exclusively to `getUserById`, the one function modified by fix API-404. `getAllUsers` was not changed and is not tested here.

---

## Test Run Output

```
> demo-bug-fix@1.0.0 test
> jest

PASS tests/userController.test.js
  GET /api/users/:id — getUserById
    ✓ TC-01: returns 200 and user object for existing ID 123 (28 ms)
    ✓ TC-02: returns 200 and user object for existing ID 456 (7 ms)
    ✓ TC-03: returns 200 and user object for existing ID 789 (3 ms)
    ✓ TC-04: returns 404 and error body for non-existent ID 999 (3 ms)
    ✓ TC-05: returns 404 for non-numeric segment (NaN after Number()) (2 ms)
    ✓ TC-06: returns 404 for ID 0 (not present in the dataset) (2 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        0.489 s, estimated 1 s
Ran all test suites.
```

---

## Overall Status

**PASS**

All 6 tests covering `getUserById` passed; the `Number()` coercion fix correctly resolves the strict-equality type mismatch for valid IDs and gracefully handles non-existent and non-numeric inputs.

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
