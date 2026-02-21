Create a task implementation plan specification for the given task from homework-4.

**Task to specify**: $ARGUMENTS
_(Pass the task number or name, e.g. "2", "Task 2", or "Bug Implementer")_

---

## Steps

### 1. Read the assignment

Read `homework-4/TASKS.md` in full. Find the task matching `$ARGUMENTS` — match by task number (1–4) or keyword (e.g. "implementer", "security", "unit test").

### 2. Read the specification template

Read `homework-3/specification-TEMPLATE-example.md` to understand the required structure:
- High-Level Objective
- Mid-Level Objectives
- Implementation Notes
- Context (Beginning / Ending)
- Low-Level Tasks (each with: prompt, file, function, details)

### 3. Read relevant source files

Read all source files relevant to the task so that file paths, line numbers, and function names in the spec are accurate. Files to consider:
- `homework-4/demo-bug-fix/server.js`
- `homework-4/demo-bug-fix/src/routes/users.js`
- `homework-4/demo-bug-fix/src/controllers/userController.js`
- `homework-4/demo-bug-fix/package.json`
- Any existing artifacts in `homework-4/context/bugs/API-404/` that the task depends on
- Any existing agent or skill files in `homework-4/agents/` and `homework-4/skills/`

### 4. Read the Task 1 spec as a style reference

Read `homework-4/specs/task-1-research-verifier.md` to match the level of detail, formatting conventions, and structure used in this project.

### 5. Write the specification

Create the file at:
```
homework-4/specs/task-<N>-<kebab-case-name>.md
```
Where `<N>` is the task number and `<kebab-case-name>` is a short slug for the task (e.g. `bug-implementer`, `security-verifier`, `unit-test-generator`).

---

## Specification Rules

Follow the template exactly. Each section must be present.

**High-Level Objective** — one sentence describing the end result of this task.

**Mid-Level Objectives** — 4–6 bullet points; each must be concrete and testable.

**Implementation Notes** — technical constraints specific to this homework:
- Agent files use `.agent.md` format (Claude Code sub-agent markdown system prompts)
- Skill files use `.md` format in `homework-4/skills/`
- All context artifacts live under `homework-4/context/bugs/API-404/`
- The demo app is a Node.js/Express project in `homework-4/demo-bug-fix/`
- Test framework is Jest + supertest (for tasks involving tests)
- Security findings must be rated CRITICAL/HIGH/MEDIUM/LOW/INFO (for Task 3)
- Reference any skill this task's agent must use (e.g. `unit-tests-FIRST.md`)

**Context — Beginning**: list every file that already exists when this task starts.

**Context — Ending**: list every file that will exist when this task is complete (new + modified).

**Low-Level Tasks** — one section per atomic deliverable. Each must answer:
1. *What prompt would you run?* — the instruction you'd give an AI agent
2. *What file to CREATE or UPDATE?* — exact relative path from repo root
3. *What function to CREATE or UPDATE?* — function/class name, or "N/A" for docs/agents
4. *What details drive the code changes?* — specific requirements, constraints, acceptance criteria

Number the low-level tasks and keep them small enough that each produces exactly one verifiable output.

---

## Output

Print the full path of the created file when done.
