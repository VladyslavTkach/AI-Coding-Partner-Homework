Write a clear, conventional commit message for the current staged changes. Use this skill whenever the user asks to commit, create a commit, save changes to git, write a commit message, or says things like "commit this", "commit these changes", "make a commit", "git commit", or "save this as a commit".

Steps:
1. Run `git diff --cached` to see all staged changes
2. Run `git log --oneline -5` to understand the repo's commit message style
3. Analyze what changed and why
4. Write a commit message following the Conventional Commits format:

```
<type>(<scope>): <short summary>

<optional body: explain the "why", not the "what">
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`

**Rules**:
- Subject line: ≤72 characters, imperative mood ("add" not "added"), no trailing period
- Body (optional): wrap at 72 chars, explain motivation and contrast with previous behavior
- Do not include "Co-Authored-By" or other trailers unless asked

Output only the final commit message, ready to copy-paste into `git commit -m "..."`.
