# Transaction Dispute Center - AI Agent Guidelines

> General AI assistant configuration. For domain rules, see `docs/DOMAIN_RULES.md`.

---

## Quick Context

| Attribute | Value |
|-----------|-------|
| Domain | FinTech / Banking |
| Backend | Node.js + Express + TypeScript |
| Frontend | React + TypeScript + Vite |
| Validation | Zod |
| Testing | Jest + React Testing Library |

**Purpose:** Users dispute transactions, track resolution, receive notifications.

---

## Before You Code

1. **Read** `docs/DOMAIN_RULES.md` — Core conventions
2. **Check** `specification.md` — Implementation tasks
3. **Review** existing code for patterns

---

## Agent Behavior Guidelines

### When Generating Code

- Check existing patterns before creating new files
- Include complete error handling
- Add audit logging for state changes
- Write tests for new functionality
- Keep TypeScript types in sync

### When Reviewing Code

- Verify money handling (integer cents, not floats)
- Check audit logging for state changes
- Confirm input validation exists
- Look for missing error handling
- Verify test coverage

---

## Prohibited Actions

| ❌ Never | Why |
|----------|-----|
| Commit without tests | Quality gate |
| Use `any` type | Type safety |
| Skip input validation | Security |
| Delete audit logs | Compliance |
| Use float for money | Precision |
| Log sensitive data | Privacy |

---

## Key Interfaces

```typescript
// Money - always integer cents
interface Money {
  amountCents: number;  // 1000 = $10.00
  currency: string;     // "USD"
}

// Audit log entry
interface AuditLogEntry {
  id: string;
  timestamp: string;      // ISO 8601 UTC
  action: string;         // 'dispute.created'
  actorId: string;
  entityType: string;
  entityId: string;
  correlationId: string;
  changes: { field: string; oldValue: unknown; newValue: unknown }[];
}

// Response formats
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: { page?: number; limit?: number; total?: number };
}

interface ErrorResponse {
  success: false;
  error: { code: string; message: string; correlationId: string; details?: unknown[] };
}
```

---

## Status Flow

```
Dispute: created → under_review → approved | denied
                              ↘ requires_info → under_review
```

---

## Preferred Libraries

| Need | Use |
|------|-----|
| Validation | Zod |
| Dates | date-fns |
| Decimal | Decimal.js |
| UUID | uuid |
| Logging | Winston |
| HTTP | Axios |
