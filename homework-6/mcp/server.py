"""
Pipeline Status MCP Server

Exposes tools and resources for querying the banking pipeline results.

Tools:
  - get_transaction_status: look up a single transaction result
  - list_pipeline_results: summarize all processed transactions

Resource:
  - pipeline://summary: latest pipeline run summary as plain text
"""

import json
import os
from pathlib import Path

from fastmcp import FastMCP

# Resolve shared/results/ relative to this file's location (mcp/server.py → homework-6/)
RESULTS_DIR = Path(__file__).parent.parent / "shared" / "results"

mcp = FastMCP("pipeline-status")


def _load_result(filepath: Path) -> dict:
    with open(filepath, encoding="utf-8") as f:
        return json.load(f)


def _all_results() -> list[dict]:
    if not RESULTS_DIR.exists():
        return []
    results = []
    for p in sorted(RESULTS_DIR.glob("*.json")):
        try:
            results.append(_load_result(p))
        except (json.JSONDecodeError, OSError):
            pass
    return results


@mcp.tool()
def get_transaction_status(transaction_id: str) -> dict:
    """
    Return the processing result for a single transaction.

    Args:
        transaction_id: The transaction ID (e.g. TXN001).

    Returns:
        The full result object from shared/results/<transaction_id>.json,
        or an error dict if not found.
    """
    # Sanitize: reject path traversal characters
    if any(c in transaction_id for c in ("..", "/", "\\")):
        return {"error": "INVALID_ID", "transaction_id": transaction_id}

    result_file = RESULTS_DIR / f"{transaction_id}.json"
    if not result_file.exists():
        return {"error": "NOT_FOUND", "transaction_id": transaction_id}

    return _load_result(result_file)


@mcp.tool()
def list_pipeline_results() -> dict:
    """
    Return a summary of all processed transactions.

    Returns:
        A dict with total, settled, declined counts and a results list
        containing transaction_id, status, fraud_risk, and reason for each.
    """
    results = _all_results()
    summary_items = []
    settled = 0
    declined = 0

    for r in results:
        status = r.get("status", "unknown")
        if status == "settled":
            settled += 1
        elif status == "declined":
            declined += 1

        item: dict = {
            "transaction_id": r.get("transaction", {}).get("transaction_id", "unknown"),
            "status": status,
        }
        if "fraud_risk" in r:
            item["fraud_risk"] = r["fraud_risk"]
        if "fraud_risk_score" in r:
            item["fraud_risk_score"] = r["fraud_risk_score"]
        if "reason" in r:
            item["reason"] = r["reason"]
        summary_items.append(item)

    return {
        "total": len(results),
        "settled": settled,
        "declined": declined,
        "results": summary_items,
    }


@mcp.resource("pipeline://summary")
def pipeline_summary() -> str:
    """
    Return the latest pipeline run summary as plain text.
    """
    results = _all_results()
    if not results:
        return "No pipeline results found. Run the pipeline first (npm run pipeline)."

    settled = sum(1 for r in results if r.get("status") == "settled")
    declined = sum(1 for r in results if r.get("status") == "declined")
    total = len(results)

    lines = [
        "=== Banking Pipeline Run Summary ===",
        f"Total processed : {total}",
        f"Settled         : {settled}",
        f"Declined        : {declined}",
        "",
        "Transaction Details:",
    ]

    for r in results:
        tx_id = r.get("transaction", {}).get("transaction_id", "unknown")
        status = r.get("status", "unknown")
        risk = r.get("fraud_risk", "N/A")
        score = r.get("fraud_risk_score", "N/A")
        reason = r.get("reason", "")
        line = f"  {tx_id}: {status} | risk={risk} (score={score})"
        if reason:
            line += f" | reason={reason}"
        lines.append(line)

    return "\n".join(lines)


if __name__ == "__main__":
    mcp.run()
