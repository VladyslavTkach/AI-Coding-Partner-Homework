# Skill: Research Quality Measurement

Use this skill to rate the quality of a codebase research document.
Apply it mechanically: score each dimension, sum the result, assign the level.

---

## Quality Dimensions

Score each dimension 0 (fail) or 1 (pass):

| # | Dimension | Pass condition |
|---|-----------|---------------|
| 1 | **File reference accuracy** | Every referenced file path exists in the repository |
| 2 | **Line number accuracy** | Every referenced line number is within ±2 lines of the actual code |
| 3 | **Snippet accuracy** | Every quoted code snippet appears verbatim (or near-verbatim, ≤1 token diff) in the source file |
| 4 | **Completeness** | All files and call sites relevant to the bug are covered; no critical path omitted |

---

## Quality Levels

| Level | Score | Description |
|-------|-------|-------------|
| **Poor** | 0–1 / 4 | Research is unreliable; major references wrong or missing; cannot be used as a basis for a fix plan |
| **Acceptable** | 2 / 4 | Research identifies the bug area but has inaccuracies; plan requires additional verification |
| **Good** | 3 / 4 | Research is mostly accurate with only minor issues; plan can proceed with low risk |
| **Excellent** | 4 / 4 | Research is fully accurate and complete; plan can proceed with full confidence |

---

## How to Apply

1. Read the research document in full.
2. For each file:line reference and code snippet, open the actual source file and check it.
3. Score each of the 4 dimensions (0 or 1).
4. Sum the scores → look up the level in the table above.
5. Copy the mandatory output block below into the result file, filling in the values.

---

## Mandatory Output Block

Agents must copy this block verbatim into the **Verification Summary** section of their result file:

```
Research Quality: <Level>
Criteria met: <X>/4
  [1] File reference accuracy : PASS / FAIL
  [2] Line number accuracy    : PASS / FAIL
  [3] Snippet accuracy        : PASS / FAIL
  [4] Completeness            : PASS / FAIL
```
