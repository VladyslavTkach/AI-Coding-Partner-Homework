# Transaction Dispute Center - Claude Code Rules

> Tool-specific configuration for Claude AI. For domain rules, see `docs/DOMAIN_RULES.md`.

---

## Context Loading

When working on this project, always load:
1. `docs/DOMAIN_RULES.md` — Core conventions and patterns
2. `specification.md` — Implementation tasks (if implementing features)

---

## Claude-Specific Behaviors

### Code Generation

- Generate complete, working code (no placeholders like `// TODO: implement`)
- Include all necessary imports
- Add JSDoc comments for public functions
- Create tests alongside new functionality

### Refactoring

- Preserve existing behavior unless explicitly asked to change
- Run tests after changes to verify no regressions
- Update related files (types, tests) when modifying code

### Error Resolution

- Read the full error message before suggesting fixes
- Check for similar patterns in existing code
- Suggest minimal changes that fix the issue

---

## Command Patterns

```bash
# Run tests
npm test

# Run specific test
npm test -- --testPathPattern=disputeService

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## File Creation Checklist

When creating new files:
- [ ] Follow naming convention from DOMAIN_RULES.md
- [ ] Add to appropriate directory per file structure
- [ ] Include TypeScript strict types
- [ ] Add corresponding test file
- [ ] Export from barrel file (index.ts)

