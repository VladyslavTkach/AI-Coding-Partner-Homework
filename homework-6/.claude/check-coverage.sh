#!/usr/bin/env bash
# Coverage gate: blocks git push if line coverage is below 80%.
# Called as a Claude Code PreToolUse hook on the Bash tool.

# Only act on git push commands
CMD=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.command // empty' 2>/dev/null)
echo "$CMD" | grep -qE 'git push' || exit 0

PROJECT_DIR="$(dirname "$(dirname "$(realpath "$0")")")"
cd "$PROJECT_DIR" || exit 1

echo "Running coverage check before push..."
npm run test:coverage -- --coverageReporters=json-summary --passWithNoTests 2>&1

SUMMARY="$PROJECT_DIR/coverage/coverage-summary.json"
if [ ! -f "$SUMMARY" ]; then
  echo "ERROR: coverage-summary.json not found — tests may not have run successfully."
  exit 1
fi

PCT=$(jq -r '.total.lines.pct' "$SUMMARY" 2>/dev/null || echo "0")
echo "Line coverage: ${PCT}%"

if awk -v pct="$PCT" 'BEGIN { exit (pct+0 >= 80) ? 0 : 1 }'; then
  echo "Coverage ${PCT}% meets the 80% threshold. Push allowed."
  exit 0
else
  echo "ERROR: Coverage is ${PCT}% — below the 80% threshold. Push blocked."
  exit 1
fi
