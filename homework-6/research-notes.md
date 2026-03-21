# Research Notes — Context7 Queries

## Query 1: big.js — Precise Decimal Arithmetic for Monetary Values

- **Search**: `big.js decimal arithmetic monetary values Node.js TypeScript`
- **context7 library ID**: `/mikemcl/big.js`
- **Key insight applied**: Used `.gt()`, `.lte()` comparison methods to avoid JavaScript floating-point errors when scoring fraud risk thresholds (e.g., `amount.gt(50000)` instead of `amount > 50000`). Also learned that `amount` must be kept as a `string` in the `Transaction` interface and parsed with `new Big(tx.amount)` — never stored as `number` — to preserve full decimal precision.

```typescript
// Applied pattern: parse string amount and compare with Big.js methods
const amount = new Big(tx.amount);
if (amount.gt(50000)) {
  score += 4;
} else if (amount.gt(10000)) {
  score += 3;
}
```

---

## Query 2: Express — GET Endpoints with Path Parameters and Error Handling

- **Search**: `Express GET route path parameter 404 error TypeScript`
- **context7 library ID**: `/expressjs/express`
- **Key insight applied**: Learned the correct Express pattern for path parameters (`req.params.id`), returning typed JSON responses with `res.status(404).json(...)`, and using try/catch around file reads inside route handlers. Applied a pre-check function `isSafeId()` to sanitize `:transaction_id` before using it in a `path.join()` call, preventing directory traversal attacks.

```typescript
// Applied pattern: param sanitization + 404 handling
app.get('/status/:transaction_id', (req, res) => {
  const txId = req.params.transaction_id;
  if (!isSafeId(txId)) {
    return res.status(400).json({ error: 'INVALID_ID' });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }
  res.status(200).json(data);
});
```
