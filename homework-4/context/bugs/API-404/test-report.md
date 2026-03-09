# Test Report: Bug API-404

**Test Date**: 2026-02-22
**Agent**: Unit Test Generator
**Fix reviewed**: fix-summary.md — Overall Status: PASS

---

## Test Scope

Functions tested:
- `getUserById` in `demo-bug-fix/src/controllers/userController.js:18` — reason: changed by fix API-404 (line 19: `req.params.id` → `Number(req.params.id)`)

Functions excluded:
- `getAllUsers` in `demo-bug-fix/src/controllers/userController.js:37` — reason: not modified by this fix

---

## Test Cases

| Test ID | Description | Input | Expected | Actual | Result |
|---------|-------------|-------|----------|--------|--------|
| TC-01 | Happy path — first valid user ID returns full user object | GET /api/users/123 | 200, `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | 200, `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | PASS |
| TC-02 | Happy path — second valid user ID returns correct user | GET /api/users/456 | 200, `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | 200, `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | PASS |
| TC-03 | Happy path — third valid user ID returns correct user | GET /api/users/789 | 200, `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | 200, `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | PASS |
| TC-04 | Error path — ID absent from the users array returns 404 | GET /api/users/999 | 404, `{"error":"User not found"}` | 404, `{"error":"User not found"}` | PASS |
| TC-05 | Regression — Express delivers route params as strings; `Number()` conversion must resolve the type mismatch | GET /api/users/123 | 200, `res.body.id` is numeric type `number` | 200, `res.body.id === 123`, `typeof res.body.id === "number"` | PASS |
| TC-06 | Edge case — non-numeric string produces `NaN`; `NaN === anything` is false, so user is not found | GET /api/users/abc | 404, `{"error":"User not found"}` | 404, `{"error":"User not found"}` | PASS |

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
- [F] Fast: The entire suite completed in 0.406 s. All 6 tests use supertest's in-process HTTP layer against the Express app; there are no real network calls, disk I/O, or database queries. The in-memory `users` array serves as the data store.
- [I] Independent: Each test issues its own HTTP request and asserts its own response. No shared mutable state is created or modified between tests; the in-memory array is never written to during test execution. Tests can run in any order or individually with identical results.
- [R] Repeatable: The `users` array is a fixed in-memory constant. No external services, environment clocks, or random values are involved. The suite produces identical pass/fail results on every run and in every environment where Node.js and the declared dependencies are available.
- [S] Self-validating: Every test uses explicit `expect(...).toBe(...)` / `expect(...).toEqual(...)` assertions. Jest reports an unambiguous PASS or FAIL signal for each test; no manual inspection of output is needed.
- [T] Timely: All 6 tests target `getUserById`, the one function changed by fix API-404. `getAllUsers`, which was not modified, is explicitly excluded from scope.

---

## Test Run Output

```
> demo-bug-fix@1.0.0 test
> jest

PASS tests/userController.test.js
  getUserById
    ✓ TC-01: returns 200 and Alice Smith for ID 123 (21 ms)
    ✓ TC-02: returns 200 and Bob Johnson for ID 456 (3 ms)
    ✓ TC-03: returns 200 and Charlie Brown for ID 789 (3 ms)
    ✓ TC-04: returns 404 and error message for non-existent ID 999 (2 ms)
    ✓ TC-05: returns 200 when ID is passed as string "123" (regression for type mismatch bug) (2 ms)
    ✓ TC-06: returns 404 for a non-numeric string ID "abc" (2 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        0.406 s, estimated 1 s
Ran all test suites.
```

---

## Overall Status

**PASS**

All 6 tests passed; the `Number()` conversion fix in `getUserById` correctly resolves the type-mismatch bug for valid IDs, non-existent IDs, and non-numeric input.

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
