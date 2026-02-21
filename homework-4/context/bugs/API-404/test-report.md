# Test Report: Bug API-404

**Test Date**: 2026-02-21
**Agent**: Unit Test Generator
**Fix reviewed**: fix-summary.md — Overall Status: PASS

---

## Test Scope

Functions tested:
- `getUserById` in `demo-bug-fix/src/controllers/userController.js:18` — reason: changed by fix API-404 (line 19 converted `req.params.id` from string to `Number`)

Functions excluded:
- `getAllUsers` in `demo-bug-fix/src/controllers/userController.js:37` — reason: not modified by this fix; logic is unchanged

---

## Test Cases

| Test ID | Description | Input | Expected | Actual | Result |
|---------|-------------|-------|----------|--------|--------|
| TC-01 | Happy path — existing user ID 123 | `GET /api/users/123` | 200 `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | 200 `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | PASS |
| TC-02 | Happy path — existing user ID 456 | `GET /api/users/456` | 200 `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | 200 `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | PASS |
| TC-03 | Happy path — existing user ID 789 | `GET /api/users/789` | 200 `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | 200 `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | PASS |
| TC-04 | Error path — valid number, no matching user | `GET /api/users/999` | 404 `{"error":"User not found"}` | 404 `{"error":"User not found"}` | PASS |
| TC-05 | Edge case — non-numeric segment (NaN after coercion) | `GET /api/users/abc` | 404 `{"error":"User not found"}` | 404 `{"error":"User not found"}` | PASS |
| TC-06 | Edge case — ID 0 (not in dataset) | `GET /api/users/0` | 404 `{"error":"User not found"}` | 404 `{"error":"User not found"}` | PASS |
| TC-07 | Edge case — negative ID -1 (not in dataset) | `GET /api/users/-1` | 404 `{"error":"User not found"}` | 404 `{"error":"User not found"}` | PASS |
| TC-08 | Edge case — leading-zero string "0123" → Number 123 | `GET /api/users/0123` | 200 `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | 200 `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | PASS |

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
- [F] Fast: All 8 tests run in under 30 ms total (suite completed in 0.35 s). Each test makes in-process HTTP requests via supertest; no real network calls, no disk I/O, no database queries. The data store is an in-memory array inside the module.
- [I] Independent: Each test issues one isolated request and asserts on its own response. Tests share no mutable state — the in-memory `users` array is never mutated by any test. No `beforeAll`/`afterAll`/`beforeEach` hooks that introduce ordering dependencies.
- [R] Repeatable: The test uses only the static in-memory data defined in `userController.js`. No clocks, no random values, no external services. Results are identical across environments and repeated runs.
- [S] Self-validating: Every test uses `expect(res.status).toBe(...)` and `expect(res.body).toEqual(...)`. Jest reports a deterministic PASS or FAIL with no manual inspection required.
- [T] Timely: Tests target exclusively `getUserById`, the single function modified by fix API-404. `getAllUsers` is explicitly excluded. No pre-existing untested logic was added to scope.

---

## Test Run Output

```
> demo-bug-fix@1.0.0 test
> jest

PASS tests/userController.test.js
  GET /api/users/:id — getUserById
    ✓ TC-01: returns 200 and user object for existing ID 123 (16 ms)
    ✓ TC-02: returns 200 and user object for existing ID 456 (5 ms)
    ✓ TC-03: returns 200 and user object for existing ID 789 (1 ms)
    ✓ TC-04: returns 404 and error message for non-existent ID 999 (1 ms)
    ✓ TC-05: returns 404 for non-numeric segment (NaN after Number()) (1 ms)
    ✓ TC-06: returns 404 for ID 0 (not present in the dataset) (1 ms)
    ✓ TC-07: returns 404 for negative ID -1 (not present in the dataset) (1 ms)
    ✓ TC-08: returns 200 for ID passed with leading zeros (Number("0123") === 123) (2 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        0.35 s, estimated 1 s
Ran all test suites.
```

---

## Overall Status

**PASS**

All 8 tests pass; the `Number()` coercion fix is fully verified across happy-path, error-path, and edge-case branches, and the test suite is Fully Compliant with all five FIRST dimensions.

---

## References

Files read:
- `context/bugs/API-404/fix-summary.md`
- `demo-bug-fix/src/controllers/userController.js`
- `demo-bug-fix/src/routes/users.js`
- `demo-bug-fix/server.js`
- `demo-bug-fix/package.json`
- `skills/unit-tests-FIRST.md`

Files written:
- `demo-bug-fix/tests/userController.test.js`
- `context/bugs/API-404/test-report.md`
