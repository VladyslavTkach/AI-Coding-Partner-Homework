# Transaction Dispute Center - Domain Rules

> Single source of truth for project conventions. Referenced by AI tools.

---

## Project Identity

| Attribute | Value |
|-----------|-------|
| Name | Transaction Dispute Center |
| Domain | FinTech / Banking |
| Backend | Node.js + Express + TypeScript (strict) |
| Frontend | React + TypeScript + Vite |
| Validation | Zod (client + server) |
| Testing | Jest + React Testing Library |

---

## Domain Rules

### Money Handling

```typescript
// ✅ CORRECT - Always use integer cents
interface Money {
  amountCents: number;  // 1000 = $10.00
  currency: string;     // "USD"
}

// ❌ NEVER use float for money
amount: number;  // FORBIDDEN
```

- Use Decimal.js for calculations before converting to integer
- Always specify currency explicitly

### Audit Trail

Every state-changing action MUST log:
- Timestamp (UTC ISO 8601)
- Action name (`dispute.created`, `dispute.status_changed`)
- Actor ID
- Entity type and ID
- Correlation ID
- Before/after values

Audit logs are **immutable** — never delete or modify.

### Status Transitions

```
Dispute: created → under_review → approved | denied
                              ↘ requires_info → under_review
```

Validate all transitions against this state machine.

---

## Code Conventions

### Naming

| Element | Style | Example |
|---------|-------|---------|
| Files | camelCase | `disputeService.ts` |
| Classes | PascalCase | `DisputeService` |
| Functions | camelCase | `createDispute` |
| Constants | UPPER_SNAKE | `MAX_FILE_SIZE` |
| React Components | PascalCase | `DisputeCard.tsx` |

### File Structure

```
src/
├── controllers/     # HTTP handlers (no business logic)
├── services/        # Business logic
├── validators/      # Zod schemas
├── models/          # Types and interfaces
├── middleware/      # Express middleware
├── routes/          # Route definitions
├── store/           # Data access
├── utils/           # Pure utilities
└── types/           # Shared TypeScript types
```

### Error Handling

Use custom error classes:
```typescript
throw new NotFoundError('Transaction');
throw new ValidationError('Invalid reason', details);
throw new ConflictError('Transaction already disputed');
```

### Response Format

```typescript
// Success
{ success: true, data: {...}, meta?: { page, limit, total } }

// Error
{ success: false, error: { code, message, correlationId, details? } }
```

---

## Security Constraints

**Always:**
- Validate all inputs server-side with Zod
- Sanitize text to prevent XSS
- Validate file uploads (type, size, magic bytes)
- Include correlation IDs in logs
- Mask PII in logs

**Never:**
- Trust client-side validation alone
- Expose internal errors to clients
- Log sensitive data (card numbers, SSN)
- Use `any` type

### Rate Limits
- Disputes: 5/hour per session
- API: 100 requests/minute

---

## Testing Requirements

- 80% minimum coverage for services
- 100% coverage for validators
- Test success and error paths
- Mock external dependencies

```typescript
describe('createDispute', () => {
  it('should create dispute for valid transaction', async () => {...});
  it('should reject already-disputed transaction', async () => {...});
  it('should create audit log entry', async () => {...});
});
```

---

## Prohibited Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| `any` type | `unknown` with type guards |
| `console.log` | Winston logger |
| Float for money | Integer cents |
| Magic numbers | Named constants |
| Unhandled promises | Always `await` |
| String SQL | Parameterized queries |

---

## Preferred Libraries

| Need | Use | Avoid |
|------|-----|-------|
| Validation | Zod | Joi, Yup |
| Dates | date-fns | Moment.js |
| Decimal math | Decimal.js | Native Number |
| UUID | uuid | Custom generation |
| Logging | Winston | console.log |
| HTTP client | Axios | fetch |

