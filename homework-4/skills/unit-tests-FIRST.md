# Skill: Unit Tests FIRST

Use this skill to evaluate whether a set of unit tests meets the FIRST principles.
Apply it mechanically: score each dimension, sum the result, assign the compliance level.

---

## FIRST Dimensions

Score each dimension 0 (fail) or 1 (pass):

| # | Dimension | Pass condition |
|---|-----------|---------------|
| F | **Fast** | Every test completes in milliseconds; no real network calls, disk I/O, or database queries; in-memory or mocked data only |
| I | **Independent** | Each test can run in any order or in isolation and produces the same result; no shared mutable state between tests |
| R | **Repeatable** | Tests produce identical results on every run, in every environment, with no reliance on external services, clocks, or random values |
| S | **Self-validating** | Each test has a programmatic assertion (e.g. `expect(...).toBe(...)`) that produces an unambiguous pass/fail signal; no manual inspection of output is needed |
| T | **Timely** | Tests are written to cover the code that was changed in the current fix; no pre-existing untested code is added to scope |

---

## FIRST Compliance Levels

| Level | Score | Meaning |
|-------|-------|---------|
| **Non-compliant** | 0–2 / 5 | Tests are unreliable or missing critical properties; must be rewritten before merging |
| **Partial** | 3 / 5 | Tests are usable but have notable gaps; improvement required before production use |
| **Compliant** | 4 / 5 | Tests are solid and reliable; one minor gap is acceptable |
| **Fully Compliant** | 5 / 5 | Tests satisfy all five FIRST criteria |

---

## How to Apply

1. Read the test file in full.
2. For each of the 5 dimensions, evaluate the entire test suite against the pass condition.
3. Score each dimension 0 (fail) or 1 (pass).
4. Sum the scores → look up the compliance level in the table above.
5. Copy the mandatory output block below into the `## FIRST Compliance` section of `test-report.md`, filling in the values.

---

## Mandatory Output Block

Agents must copy this block verbatim into the **FIRST Compliance** section of `test-report.md`:

```
FIRST Compliance: <Level>
Criteria met: <X>/5
  [F] Fast            : PASS / FAIL
  [I] Independent     : PASS / FAIL
  [R] Repeatable      : PASS / FAIL
  [S] Self-validating : PASS / FAIL
  [T] Timely          : PASS / FAIL
```
