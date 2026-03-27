# Task 1: Bug Research Verifier Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code that will satisfy the High and Mid-Level Objectives.

## High-Level Objective

- Build a Bug Research Verifier agent that fact-checks codebase research by validating every file:line reference and code snippet, then rates research quality using a dedicated skill and outputs a structured `verified-research.md` report.

---

## Mid-Level Objectives

- Create a `research-quality-measurement.md` skill that defines named quality levels with measurable criteria for rating codebase research
- Create a `research-verifier.agent.md` agent that reads `codebase-research.md`, verifies all file references and snippets against source files, and invokes the quality skill
- Produce a `verified-research.md` artifact with all required sections: Verification Summary, Verified Claims, Discrepancies Found, Research Quality Assessment, References
- Ensure the output is structured well enough for the Bug Planner agent to consume it as its input
- Document every discrepancy found (wrong file path, wrong line number, mismatched snippet) with exact details

---

## Implementation Notes

- Agent file format: markdown system prompt (`.agent.md`), used as a Claude Code sub-agent definition
- Skill file format: markdown (`.md`), referenced by relative path from the agent
- The skill must define at least 3 distinct quality levels; 4 is recommended (Poor / Acceptable / Good / Excellent)
- Quality level must appear verbatim in `verified-research.md` as `Research Quality: <Level>` so downstream agents can parse it
- The agent must read every source file referenced in `codebase-research.md` using the Read tool — it must not assume references are correct
- If a critical discrepancy is found (file doesn't exist, line number is off by more than 2, snippet doesn't appear in file), the agent must flag it as CRITICAL and stop before writing the quality rating
- The agent outputs a report only — it must not modify source files or the research file

---

## Context

### Beginning context

- `homework-4/TASKS.md` — assignment requirements for Task 1
- `homework-4/skills/` — directory where the new skill file will be placed
- `homework-4/agents/` — directory where the new agent file will be placed
- `homework-4/context/bugs/API-404/research/codebase-research.md` — input research document to be verified
- `homework-4/demo-bug-fix/src/controllers/userController.js` — source file referenced in the research
- `homework-4/demo-bug-fix/src/routes/users.js` — source file referenced in the research
- `homework-4/demo-bug-fix/server.js` — source file referenced in the research

### Ending context

- `homework-4/skills/research-quality-measurement.md` — new skill defining quality levels
- `homework-4/agents/research-verifier.agent.md` — new agent definition
- `homework-4/context/bugs/API-404/research/verified-research.md` — agent output artifact

---

## Low-Level Tasks

### 1. Create research-quality-measurement skill

What prompt would you run to complete this task?
Create a reusable skill file that defines four research quality levels with scoring criteria, so that any agent can apply it mechanically to rate codebase research.

What file do you want to CREATE or UPDATE?
`homework-4/skills/research-quality-measurement.md`

What function do you want to CREATE or UPDATE?
N/A (markdown skill definition)

What are details you want to add to drive the code changes?
- Define 4 levels in a table: **Poor**, **Acceptable**, **Good**, **Excellent**
- Each level has: label, one-line description, and criteria across 4 dimensions:
  1. **File reference accuracy** — are file paths correct and files exist?
  2. **Line number accuracy** — are line numbers within ±2 of the actual code?
  3. **Snippet accuracy** — do quoted snippets appear verbatim in the source?
  4. **Completeness** — are all relevant files and call sites covered?
- Include a scoring rubric: how many criteria must pass for each level
- End with a mandatory output block agents must copy into their result files:
  ```
  Research Quality: <Level>
  Criteria met: X/4
  ```

---

### 2. Create Bug Research Verifier agent

What prompt would you run to complete this task?
Create a Claude Code sub-agent definition that verifies the accuracy of `codebase-research.md` by reading each referenced source file, checking file paths, line numbers, and code snippets, then rating quality using the research-quality-measurement skill.

What file do you want to CREATE or UPDATE?
`homework-4/agents/research-verifier.agent.md`

What function do you want to CREATE or UPDATE?
N/A (agent system prompt)

What are details you want to add to drive the code changes?
- **Input**: `context/bugs/API-404/research/codebase-research.md`
- **Skill to load**: `skills/research-quality-measurement.md`
- **Step-by-step process the agent must follow**:
  1. Read `codebase-research.md` in full
  2. Extract every `file:line` reference and code snippet mentioned
  3. For each reference: read the actual source file, check the line exists, check the snippet matches
  4. Classify each claim as VERIFIED or DISCREPANCY with a reason
  5. Load `research-quality-measurement.md` and score the research against all 4 dimensions
  6. Write `verified-research.md` with the sections below
- **Output file**: `context/bugs/API-404/research/verified-research.md`
- **Required sections in output**:
  - `## Verification Summary` — overall pass/fail, `Research Quality: <Level>`, criteria met count
  - `## Verified Claims` — table: Claim | File | Line | Status
  - `## Discrepancies Found` — table: Claim | Expected | Actual | Severity (CRITICAL/MINOR)
  - `## Research Quality Assessment` — level name, reasoning against each dimension
  - `## References` — list of all source files read during verification
- **Constraints**: read-only — must not edit any source file or `codebase-research.md`; if 0 claims verified, set overall status to FAIL

---

### 3. Create codebase research input document

What prompt would you run to complete this task?
Write the codebase research document for bug API-404 that the Research Verifier agent will fact-check. Trace the execution path from HTTP request to the failing comparison with exact file:line references and quoted snippets.

What file do you want to CREATE or UPDATE?
`homework-4/context/bugs/API-404/research/codebase-research.md`

What function do you want to CREATE or UPDATE?
N/A (research document)

What are details you want to add to drive the code changes?
- Cover all 3 source files: `server.js`, `src/routes/users.js`, `src/controllers/userController.js`
- For each file include: exact line numbers, copy-pasted code snippets from the actual source
- Identify the root cause with a reference to the exact line: `userController.js:23` — `u.id === userId` fails because `req.params.id` is always a `string` and user IDs are `number`
- Show the `users` array data shape (lines 7–11) to confirm IDs are numeric
- Note which endpoint works (`GET /api/users`) and why (no type comparison)
- Format: sections per file, each with a "Finding" subsection

---

### 4. Run the Research Verifier and produce verified-research.md

What prompt would you run to complete this task?
Invoke the Research Verifier agent against `codebase-research.md` and commit its output `verified-research.md` as a pipeline artifact.

What file do you want to CREATE or UPDATE?
`homework-4/context/bugs/API-404/research/verified-research.md`

What function do you want to CREATE or UPDATE?
N/A (agent output artifact)

What are details you want to add to drive the code changes?
- Must contain all 5 required sections from the agent definition
- `Research Quality: <Level>` line must appear in Verification Summary
- Verified Claims table must cover every file:line from `codebase-research.md`
- Discrepancies section must be present even if empty (write "None found")
- Output must be complete enough for a Bug Planner agent to identify which file and line to change
