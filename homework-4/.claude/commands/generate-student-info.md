Generate the student info file for homework-4 submission.

**Arguments**: `$ARGUMENTS`
_(Pass submission date and tools, e.g. `"February 21, 2026" "Claude Code, GitHub Copilot"`)_

---

## Steps

### 1. Parse arguments

Extract from `$ARGUMENTS`:
- **Date** — first quoted value; the submission date, already in "Month DD, YYYY" format (e.g. `February 21, 2026`).
- **Tools** — second quoted value; comma-separated list of AI tools used (e.g. `Claude Code, GitHub Copilot`).

If either argument is missing, stop and ask the user to provide both.

### 2. Write STUDENT.md

Create or overwrite `homework-4/STUDENT.md` with exactly this content, substituting the parsed values:

```
Student Name: Vladyslav Tkach
Date Submitted: <Date>
AI Tools Used: <Tools>
```

No extra sections, headings, or blank lines beyond the three fields.

### 3. Confirm

Print the full contents of the written file so the user can verify it looks correct.
