# Test Report: Bug API-404

**Test Date**: 2026-02-21
**Agent**: Unit Test Generator
**Fix reviewed**: `fix-summary.md` — Overall Status: PASS

---

## Test Scope

Functions tested:
- `getUserById` in `demo-bug-fix/src/controllers/userController.js:18–30` — changed by fix API-404 (line 19: `Number(req.params.id)`)

Functions excluded:
- `getAllUsers` — not modified by this fix; included as TC-06 regression test only to confirm no breakage

---

## Test Cases

| Test ID | Description | Input | Expected | Actual | Result |
|---------|-------------|-------|----------|--------|--------|
| TC-01 | Valid ID 123 returns user | `GET /api/users/123` | 200 `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | 200 `{"id":123,"name":"Alice Smith","email":"alice@example.com"}` | PASS |
| TC-02 | Valid ID 456 returns user | `GET /api/users/456` | 200 `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | 200 `{"id":456,"name":"Bob Johnson","email":"bob@example.com"}` | PASS |
| TC-03 | Valid ID 789 returns user | `GET /api/users/789` | 200 `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | 200 `{"id":789,"name":"Charlie Brown","email":"charlie@example.com"}` | PASS |
| TC-04 | Unknown ID 999 returns 404 | `GET /api/users/999` | 404 `{"error":"User not found"}` | 404 `{"error":"User not found"}` | PASS |
| TC-05 | Non-numeric ID "abc" returns 404 | `GET /api/users/abc` | 404 `{"error":"User not found"}` | 404 `{"error":"User not found"}` | PASS |
| TC-06 | GET /api/users returns all users (regression) | `GET /api/users` | 200, array length 3, `id` is number | 200, array length 3, `id` is number | PASS |

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
- **[F] Fast**: All 6 tests completed in 0.333 s total. Every test hits an in-memory `users` array; no network calls, no disk I/O, no database queries.
- **[I] Independent**: The `users` array is never mutated by any test. Each test issues a fresh `request(app).get(...)` call with no shared state. Tests pass in any execution order.
- **[R] Repeatable**: Test data is hardcoded in `userController.js`. There are no external dependencies, no clocks, no random values. Results are identical across environments.
- **[S] Self-validating**: Every test uses `expect(res.status).toBe(...)` and `expect(res.body).toEqual(...)`. Jest reports a clear PASS or FAIL with no manual inspection required.
- **[T] Timely**: TC-01 through TC-05 cover only `getUserById`, the single function changed by fix API-404. TC-06 is a minimal regression test for the untouched `getAllUsers`. No pre-existing untested code was brought into scope.

---

## Test Run Output

```
> demo-bug-fix@1.0.0 test
> jest

PASS tests/userController.test.js
  GET /api/users/:id — getUserById
    ✓ TC-01: valid ID 123 returns 200 and Alice Smith (14 ms)
    ✓ TC-02: valid ID 456 returns 200 and Bob Johnson (4 ms)
    ✓ TC-03: valid ID 789 returns 200 and Charlie Brown (1 ms)
    ✓ TC-04: unknown ID 999 returns 404 with error body (1 ms)
    ✓ TC-05: non-numeric ID "abc" returns 404 (Number coercion → NaN, no match) (2 ms)
  GET /api/users — getAllUsers regression
    ✓ TC-06: returns 200 and an array of 3 users with numeric id fields (1 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        0.333 s
Ran all test suites.
```

---

## Overall Status

**PASS**

All 6 tests green. The `Number(req.params.id)` fix correctly handles all valid IDs (TC-01–TC-03), unknown IDs (TC-04), non-numeric input (TC-05), and leaves `getAllUsers` unaffected (TC-06).

---

## References

Files read:
- `context/bugs/API-404/fix-summary.md`
- `demo-bug-fix/src/controllers/userController.js`
- `demo-bug-fix/src/routes/users.js`
- `skills/unit-tests-FIRST.md`

Files written:
- `demo-bug-fix/tests/userController.test.js`
- `context/bugs/API-404/test-report.md`
