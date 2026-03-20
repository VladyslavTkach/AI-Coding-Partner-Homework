Run the multi-agent banking pipeline end-to-end.

Steps:
1. Check that `sample-transactions.json` exists at the project root. If it does not, stop and report the missing file.
2. Clear shared/ directories by removing `shared/results/`, `shared/logs/`, and `shared/processing/` (re-create them empty so the pipeline starts fresh).
3. Build the TypeScript source: run `npx tsc` from the project root.
4. Run the pipeline: `node dist/integrator.js`
5. Show a summary of results from `shared/results/` — list each file and its `status` field.
6. Report any transactions that were rejected or declined, including the `reason` field.
