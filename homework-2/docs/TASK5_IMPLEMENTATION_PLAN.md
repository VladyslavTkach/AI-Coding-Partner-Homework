# Task 5: Integration & Performance Tests - Implementation Plan

## Overview

Implementation guide for end-to-end integration tests and performance benchmarks using Jest and Supertest in TypeScript.

---

## Prerequisites

- Tasks 1-3 completed (API, auto-classification, basic tests)
- Jest and Supertest configured
- Test helpers available (`testUtils.ts`)

---

## File Structure

```
tests/
├── test_integration.test.ts    # Integration tests
├── test_performance.test.ts    # Performance benchmarks
├── helpers/
│   └── testUtils.ts           # Shared utilities
└── fixtures/
    └── integration_data.csv    # Test data
```

---

## Implementation Steps

### Step 1: Extend Test Utilities

Add helper functions to `tests/helpers/testUtils.ts`:

1. **`seedStoreWithDistribution(count, options)`**
   - Populate store with specified ticket distribution
   - Support category/priority distribution options

2. **`createConcurrentRequests(count, requestFn)`**
   - Generate array of parallel request promises
   - Return Promise.all result

3. **`measureResponseTime(requestFn)`**
   - Wrapper to measure and return execution time
   - Return `{ response, duration }` object

---

### Step 2: Integration Tests

Implement in `tests/test_integration.test.ts`:

#### Test Suite Structure

```
describe('Integration Tests')
├── describe('Ticket Lifecycle')
│   └── INT-01: Create → Update → Resolve → Delete
├── describe('Bulk Import Workflows')
│   ├── INT-02: CSV import + auto-classify
│   └── INT-06: Multi-format import
├── describe('Classification')
│   ├── INT-03: Classification history
│   └── INT-08: Auto-classify on create flag
├── describe('Concurrent Operations')
│   └── INT-04: 20+ simultaneous requests
├── describe('Filtering')
│   └── INT-05: Combined category + priority filter
└── describe('Error Handling')
    └── INT-07: Partial failure recovery
```

#### Key Implementation Details

**INT-01: Ticket Lifecycle**
- Chain: POST → PUT (status change) → PUT (resolve) → DELETE
- Assert `resolved_at` timestamp on resolution
- Verify 404 after deletion

**INT-04: Concurrent Requests**
```typescript
const requests = Array(20).fill(null).map(() => 
  request(app).post('/tickets').send(ticketData)
);
const results = await Promise.all(requests);
// Verify all unique IDs
const ids = results.map(r => r.body.id);
expect(new Set(ids).size).toBe(20);
```

**INT-05: Combined Filtering**
- Test query: `GET /tickets?category=X&priority=Y`
- Verify results match ALL criteria

---

### Step 3: Performance Tests

Implement in `tests/test_performance.test.ts`:

#### Test Suite Structure

```
describe('Performance Tests')
├── describe('Response Time Benchmarks')
│   ├── PERF-01: Ticket creation < 100ms
│   ├── PERF-02: Ticket retrieval < 50ms
│   └── PERF-05: Auto-classify < 100ms
├── describe('Throughput Tests')
│   ├── PERF-03: List 100 tickets < 100ms
│   ├── PERF-04: Import 50 via CSV < 500ms
│   └── PERF-06: 50 sequential requests < 2s
└── describe('Scale Tests')
    └── PERF-07: Filter 500 tickets < 200ms
```

#### Key Implementation Details

**Time Measurement Pattern**
```typescript
const start = Date.now();
const response = await request(app).get('/tickets');
const duration = Date.now() - start;
expect(duration).toBeLessThan(threshold);
```

**Large Dataset Seeding**
- Use `seedStore(count)` helper for bulk population
- Ensure distribution for meaningful filter tests

---

### Step 4: Test Configuration

Update `jest.config.js` if needed:

```javascript
{
  testTimeout: 10000,  // Extended for performance tests
  verbose: true,
  collectCoverageFrom: ['src/**/*.ts']
}
```

---

## Performance Thresholds

| Operation | Threshold | Rationale |
|-----------|-----------|-----------|
| Create ticket | < 100ms | User-facing latency |
| Get ticket | < 50ms | Simple lookup |
| List 100 tickets | < 100ms | Reasonable page size |
| Import 50 CSV | < 500ms | Bulk operation tolerance |
| Auto-classify | < 100ms | Keyword matching is fast |
| Filter 500 | < 200ms | In-memory filtering |

---

## Test Isolation Requirements

1. **Clear store before each test**
   ```typescript
   beforeEach(() => clearStore());
   ```

2. **Independent test data**
   - Each test creates its own fixtures
   - No cross-test dependencies

3. **Deterministic seeding**
   - Use consistent customer IDs for verification
   - Predictable category distribution

---

## Error Handling Tests

### INT-07: Partial Failure Scenarios

Test cases:
1. CSV with 5 valid + 5 invalid rows
2. Verify 5 successful imports
3. Verify 5 detailed error messages
4. Verify system continues working after partial failure

---

## Deliverables Checklist

- [ ] 8 integration test cases implemented
- [ ] 7 performance test cases implemented
- [ ] All tests passing
- [ ] Performance thresholds met
- [ ] Test utilities extended
- [ ] No flaky tests (run 3x to verify)

---

## Notes

- Performance thresholds are for in-memory store; adjust for database
- Concurrent tests may require mutex in some implementations
- Use `jest --runInBand` if parallel execution causes issues
