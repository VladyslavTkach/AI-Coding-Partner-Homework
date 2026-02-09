# GitHub Copilot Instructions - Transaction Dispute Center

> Tool-specific configuration for GitHub Copilot. For domain rules, see `docs/DOMAIN_RULES.md`.

---

## Quick Reference

**Domain:** FinTech / Banking  
**Stack:** Node.js + TypeScript (backend), React + TypeScript (frontend)  
**Validation:** Zod  
**Testing:** Jest

---

## Copilot-Specific Behaviors

### Autocomplete Priorities

When suggesting code, prioritize:
1. Existing patterns in the codebase
2. Type-safe implementations (no `any`)
3. Error handling paths
4. Test coverage

### Inline Suggestions

- Complete function signatures with explicit return types
- Add Zod validation for new endpoints
- Include audit logging for state changes
- Generate test assertions

---

## Common Patterns

### Service Method
```typescript
async createDispute(input: CreateDisputeInput): Promise<Dispute> {
  // 1. Validate input
  // 2. Check business rules
  // 3. Persist data
  // 4. Create audit log
  // 5. Return result
}
```

### Controller Handler
```typescript
async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.method(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
```

### Test Structure
```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should [expected] when [condition]', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

---

## Keyboard Shortcuts

| Action | Keys |
|--------|------|
| Accept suggestion | Tab |
| Dismiss suggestion | Esc |
| Next suggestion | Alt + ] |
| Previous suggestion | Alt + [ |
| Open Copilot panel | Ctrl + Enter |

## Preferred Libraries

| Purpose | Use | Avoid |
|---------|-----|-------|
| Validation | zod | joi, yup |
| Dates | date-fns | moment.js |
| Decimal | decimal.js | Number |
| HTTP | axios | fetch |
| Logging | winston | console |
| UUID | uuid | custom |

