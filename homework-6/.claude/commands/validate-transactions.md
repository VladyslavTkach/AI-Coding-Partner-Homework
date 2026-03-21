Validate all transactions in `sample-transactions.json` without running the full pipeline.

Steps:
1. Read `sample-transactions.json` from the project root and parse it as a JSON array of transaction objects.
2. For each transaction, check the following validation rules (same rules as the TransactionValidator agent):
   - Required fields must be present and non-empty: `transaction_id`, `amount`, `currency`, `source_account`, `destination_account`, `timestamp`
   - `amount` must be parseable as a decimal and greater than 0
   - `currency` must be one of the ISO 4217 whitelist values: `USD`, `EUR`, `GBP`, `JPY`
3. Report the results:
   - Total count of transactions
   - Valid count
   - Invalid count
   - For each invalid transaction: the `transaction_id` and the reason for rejection
4. Show a formatted table of all transactions with columns: `transaction_id`, `amount`, `currency`, `valid`, `reason`.
