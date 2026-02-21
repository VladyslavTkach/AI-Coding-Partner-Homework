# Task 4: Unit Test Generator Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

## High-Level Objective

- Build a Unit Test Generator agent that reads `fix-summary.md`, generates Jest + supertest tests exclusively for the changed code (`getUserById`), validates each test against the FIRST principles skill, runs the test suite, and outputs a structured `test-report.md` with pass/fail results.

---

## Mid-Level Objectives

- Create a `skills/unit-tests-FIRST.md` skill that defines the five FIRST principles with measurable acceptance criteria an agent can apply to each test case
- Create `agents/unit-test-generator.agent.md` as a Claude Code sub-agent that reads `fix-summary.md`, scopes test generation to changed functions only, applies the FIRST skill, runs `npm test`, and writes `test-report.md`
- Prepare the demo app for Jest by adding `jest` and `supertest` to `devDependencies`, adding a `test` script, and guarding `app.listen()` with `require.main === module` so the app can be imported without starting the server
- Write `demo-bug-fix/tests/userController.test.js` covering all branches of `getUserById`: valid IDs (200), unknown IDs (404), and non-numeric input (404), plus one regression test for `getAllUsers`
- Produce `context/bugs/API-404/test-report.md` with actual `npm test` output, FIRST compliance assessment, and a pass/fail result per test case

---

## Implementation Notes

- Agent file format: markdown system prompt (`.agent.md`), Claude Code sub-agent definition
- Skill file format: markdown (`.md`) in `homework-4/skills/`, structured like `research-quality-measurement.md`
- Test framework: **Jest** (test runner) + **supertest** (HTTP assertion library for Express)
- Test file location: `homework-4/demo-bug-fix/tests/` (directory exists, currently empty)
- Test file naming: `userController.test.js` — Jest discovers `*.test.js` files automatically
- **server.js must be patched** before tests will work: `app.listen()` at line 24 runs unconditionally on import; add a `require.main === module` guard so Jest can import `app` without binding port 3000
- FIRST principles:
  - **F**ast — each test completes in milliseconds; no real network or disk I/O; in-memory data only
  - **I**ndependent — tests share no mutable state; `users` array is never written; each test is a fresh HTTP request
  - **R**epeatable — hardcoded mock data produces identical results every run and in every environment
  - **S**elf-validating — Jest assertions (`toBe`, `toEqual`) produce unambiguous pass/fail; no manual inspection
  - **T**imely — tests are written immediately after the fix, covering only the changed function
- Tests cover **changed code only** (`getUserById`); `getAllUsers` gets one regression test to confirm no breakage
- The agent must reference `skills/unit-tests-FIRST.md` and check each generated test against all 5 FIRST criteria before writing `test-report.md`
- `test-report.md` must contain actual `npm test` output — no fabricated results

---

## Context

### Beginning context

- `homework-4/TASKS.md` — assignment requirements for Task 4
- `homework-4/context/bugs/API-404/fix-summary.md` — identifies the changed file and function (`getUserById`, line 19)
- `homework-4/demo-bug-fix/src/controllers/userController.js` — the fixed file; contains `getUserById` (lines 18–30) and `getAllUsers` (lines 37–39)
- `homework-4/demo-bug-fix/src/routes/users.js` — route wiring for both endpoints
- `homework-4/demo-bug-fix/server.js` — Express app; exports `app`; `app.listen()` on line 24 needs guarding
- `homework-4/demo-bug-fix/package.json` — no `test` script and no Jest/supertest yet
- `homework-4/skills/research-quality-measurement.md` — style reference for the new FIRST skill
- `homework-4/agents/` — directory for the new agent file

### Ending context

- `homework-4/skills/unit-tests-FIRST.md` — **new** — FIRST principles skill definition
- `homework-4/agents/unit-test-generator.agent.md` — **new** — agent system prompt
- `homework-4/demo-bug-fix/server.js` — **modified** — `app.listen()` wrapped in `require.main === module` guard
- `homework-4/demo-bug-fix/package.json` — **modified** — `jest` and `supertest` in devDependencies; `"test": "jest"` script added
- `homework-4/demo-bug-fix/tests/userController.test.js` — **new** — Jest test suite
- `homework-4/context/bugs/API-404/test-report.md` — **new** — agent output artifact with test results

---

## Low-Level Tasks

### 1. Create the unit-tests-FIRST skill

What prompt would you run to complete this task?
Create a reusable skill file that defines the five FIRST principles for unit tests with a per-principle pass condition, so that any agent can evaluate a test case against each criterion mechanically and record a FIRST compliance score.

What file do you want to CREATE or UPDATE?
`homework-4/skills/unit-tests-FIRST.md`

What function do you want to CREATE or UPDATE?
N/A (markdown skill definition)

What are details you want to add to drive the code changes?
- Model the structure after `skills/research-quality-measurement.md`: dimensions table, levels table, mandatory output block
- Define **5 FIRST dimensions** in a scored table (0 = fail, 1 = pass):
  1. **Fast** — test completes in milliseconds; no real network, disk, or database I/O
  2. **Independent** — test does not depend on execution order or shared mutable state; can run alone
  3. **Repeatable** — test produces the same result on every run, in every environment, with no external dependencies
  4. **Self-validating** — test has a programmatic assertion that produces unambiguous pass/fail with no manual inspection
  5. **Timely** — test covers only the code that was changed in the current fix; no pre-existing untested code is added
- Include a **FIRST compliance levels** table:
  | Level | Score | Meaning |
  |-------|-------|---------|
  | Non-compliant | 0–2 / 5 | Tests unreliable; must be rewritten |
  | Partial | 3 / 5 | Tests usable but gaps remain |
  | Compliant | 4 / 5 | Tests are solid; minor gap acceptable |
  | Fully Compliant | 5 / 5 | Tests meet all FIRST criteria |
- End with a **mandatory output block** agents must copy into `test-report.md`:
  ```
  FIRST Compliance: <Level>
  Criteria met: <X>/5
    [F] Fast         : PASS / FAIL
    [I] Independent  : PASS / FAIL
    [R] Repeatable   : PASS / FAIL
    [S] Self-validating : PASS / FAIL
    [T] Timely       : PASS / FAIL
  ```

---

### 2. Create the Unit Test Generator agent

What prompt would you run to complete this task?
Create a Claude Code sub-agent definition that reads `fix-summary.md` to identify changed functions, generates Jest + supertest tests for those functions only, evaluates each test against the FIRST skill, runs `npm test`, and writes a structured `test-report.md` with actual test output.

What file do you want to CREATE or UPDATE?
`homework-4/agents/unit-test-generator.agent.md`

What function do you want to CREATE or UPDATE?
N/A (agent system prompt)

What are details you want to add to drive the code changes?
- **Inputs**:
  - `context/bugs/API-404/fix-summary.md` — scope source (changed files and functions)
  - Changed source files listed in the fix summary
  - `skills/unit-tests-FIRST.md` — FIRST compliance skill
- **Step-by-step process**:
  1. Read `fix-summary.md`; extract every function under "Files modified"
  2. Read each modified source file to understand the function's logic and branches
  3. Read `skills/unit-tests-FIRST.md`
  4. For each changed function, enumerate test cases covering: happy path, error path, and edge cases
  5. Verify `package.json` has Jest and supertest; if not, add them and update the `test` script
  6. Check that `server.js` has the `require.main === module` guard; if not, add it
  7. Write the test file in `demo-bug-fix/tests/`
  8. Run `npm test` using the Bash tool; capture the full output verbatim
  9. Apply the FIRST skill to the test suite; compute the compliance score
  10. Write `context/bugs/API-404/test-report.md`
- **Scope constraint**: generate tests for changed functions only; do not add tests for pre-existing untested code
- **Output file**: `context/bugs/API-404/test-report.md`
- **Required sections in output**:
  - `## Test Scope` — which functions were tested and why (linked to fix-summary)
  - `## Test Cases` — table: Test ID | Description | Input | Expected | Actual | Result
  - `## FIRST Compliance` — mandatory output block from the skill; reasoning per dimension
  - `## Test Run Output` — verbatim `npm test` console output
  - `## Overall Status` — PASS (all tests green) / FAIL (any test red)
  - `## References` — files read and written
- **Constraints**:
  - Must not fabricate test output — run `npm test` and paste the actual result
  - Must not edit source files other than `server.js` (guard) and `package.json` (deps)
  - If `npm test` exits non-zero, set Overall Status to FAIL and include the error output

---

### 3. Guard app.listen() in server.js

What prompt would you run to complete this task?
In `demo-bug-fix/server.js`, wrap the `app.listen()` call with a `require.main === module` check so that the Express app can be imported by Jest without starting the HTTP server and binding port 3000.

What file do you want to CREATE or UPDATE?
`homework-4/demo-bug-fix/server.js`

What function do you want to CREATE or UPDATE?
top-level module code (lines 24–29)

What are details you want to add to drive the code changes?
- **Before** (lines 24–29):
  ```js
  // Start server
  app.listen(PORT, () => {
    console.log(`Demo API server running on http://localhost:${PORT}`);
    console.log('Try:');
    console.log(`  GET http://localhost:${PORT}/api/users`);
    console.log(`  GET http://localhost:${PORT}/api/users/123`);
  });
  ```
- **After**:
  ```js
  // Start server (only when run directly, not when imported by tests)
  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`Demo API server running on http://localhost:${PORT}`);
      console.log('Try:');
      console.log(`  GET http://localhost:${PORT}/api/users`);
      console.log(`  GET http://localhost:${PORT}/api/users/123`);
    });
  }
  ```
- `module.exports = app` at line 31 must remain unchanged
- `npm start` must continue to work: `node server.js` sets `require.main === module` to `true`, so the server still starts normally
- **Acceptance criteria**: `require('../server')` in a test file returns the Express `app` without binding any port

---

### 4. Add Jest and supertest to package.json

What prompt would you run to complete this task?
Update `demo-bug-fix/package.json` to add `jest` and `supertest` as devDependencies and add a `"test": "jest"` script so that `npm test` runs the test suite.

What file do you want to CREATE or UPDATE?
`homework-4/demo-bug-fix/package.json`

What function do you want to CREATE or UPDATE?
N/A (JSON config)

What are details you want to add to drive the code changes?
- Add to `"scripts"`: `"test": "jest"`
- Add to `"devDependencies"`:
  - `"jest": "^29.0.0"` — current stable major
  - `"supertest": "^6.3.0"` — compatible with Express 4
- Add a top-level `"jest"` config block:
  ```json
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.js"]
  }
  ```
- After editing, run `npm install` to generate the updated `package-lock.json`
- **Acceptance criteria**: `npm test` exits 0 when all tests pass; `npm start` is unchanged

---

### 5. Create the test file

What prompt would you run to complete this task?
Write a Jest + supertest test file for `getUserById` covering valid IDs, unknown IDs, and non-numeric input, plus one regression test for `getAllUsers`. Each test must satisfy all 5 FIRST criteria.

What file do you want to CREATE or UPDATE?
`homework-4/demo-bug-fix/tests/userController.test.js`

What function do you want to CREATE or UPDATE?
`describe('GET /api/users/:id')` and `describe('GET /api/users')` (Jest test suites)

What are details you want to add to drive the code changes?
- Import `supertest` and `app` from `../server`
- **Test suite 1**: `describe('GET /api/users/:id — getUserById')`
  - `TC-01` — valid ID 123 → status 200, body `{id:123, name:'Alice Smith', email:'alice@example.com'}`
  - `TC-02` — valid ID 456 → status 200, body `{id:456, name:'Bob Johnson', email:'bob@example.com'}`
  - `TC-03` — valid ID 789 → status 200, body `{id:789, name:'Charlie Brown', email:'charlie@example.com'}`
  - `TC-04` — unknown ID 999 → status 404, body `{error:'User not found'}`
  - `TC-05` — non-numeric ID `"abc"` → status 404, body `{error:'User not found'}` (NaN coercion, no match)
- **Test suite 2**: `describe('GET /api/users — getAllUsers regression')`
  - `TC-06` — GET /api/users → status 200, body is an array of length 3, first element has numeric `id` field
- Use `request(app).get(path)` for all HTTP calls (supertest manages the connection)
- Use `expect(res.status).toBe(...)` and `expect(res.body).toEqual(...)` or `expect(res.body).toMatchObject(...)`
- No `beforeAll`/`afterAll` server lifecycle hooks needed — supertest handles connection management when `app.listen()` is guarded
- **FIRST acceptance**:
  - Fast: all tests hit in-memory data only
  - Independent: no shared mutable state between tests
  - Repeatable: hardcoded data, no randomness
  - Self-validating: all assertions are `.toBe` / `.toEqual` — no console.log inspection
  - Timely: tests cover only `getUserById` (the changed function) plus one regression for `getAllUsers`

---

### 6. Run tests and produce the test report

What prompt would you run to complete this task?
Run `npm test` in `demo-bug-fix/`, capture the full console output verbatim, apply the FIRST skill to the test suite, and write `test-report.md` with all required sections.

What file do you want to CREATE or UPDATE?
`homework-4/context/bugs/API-404/test-report.md`

What function do you want to CREATE or UPDATE?
N/A (agent output artifact)

What are details you want to add to drive the code changes?
- **Test Scope section** must reference `fix-summary.md` and name the changed function: `getUserById` in `userController.js:19`
- **Test Cases table** must list all 6 test cases (TC-01 through TC-06) with Input, Expected, Actual, and Result columns
- **FIRST Compliance section** must include the mandatory output block from the skill, filled with actual values, plus one-line reasoning per dimension
- **Test Run Output section** must contain the verbatim Jest console output including the summary line (e.g. `Tests: 6 passed, 6 total`)
- **Overall Status** must be PASS if all 6 tests pass, FAIL otherwise
- **References section** must list: `fix-summary.md`, `userController.js`, `tests/userController.test.js`, `skills/unit-tests-FIRST.md`
- No fabricated output — all values come from actually running `npm test`
