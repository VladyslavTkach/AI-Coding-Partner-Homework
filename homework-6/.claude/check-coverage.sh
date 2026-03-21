#!/usr/bin/env bash
# Coverage gate: blocks git push if line coverage is below 80%.
# Called as a Claude Code PreToolUse hook on the Bash tool.
#
# stdout → JSON control for Claude Code hook mechanism
# stderr → human-readable output shown in Claude Code UI

# Only act on git push commands
HOOK_INPUT=$(cat)
# Debug: log raw input so we can see what Claude Code actually sends
echo "[hook debug] raw input: $HOOK_INPUT" >> /tmp/coverage-hook-debug.log 2>&1
CMD=$(echo "$HOOK_INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
echo "[hook debug] CMD=$CMD" >> /tmp/coverage-hook-debug.log 2>&1
echo "$CMD" | grep -qE 'git push' || exit 0

PROJECT_DIR="$(dirname "$(dirname "$(realpath "$0")")")"
cd "$PROJECT_DIR" || {
  jq -n '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "Coverage hook: could not cd to project dir"}}'
  exit 0
}

LOG="$PROJECT_DIR/shared/logs/coverage-hook.log"
mkdir -p "$(dirname "$LOG")"

echo "=== Pre-push Coverage Check ===" >&2
echo "Running tests..." >&2

# Run coverage
COVERAGE_OUTPUT=$(npm run test:coverage -- --coverageReporters=text --coverageReporters=json-summary --passWithNoTests 2>&1)

# Write full output to log
{
  echo "=== Coverage check at $(date -u +"%Y-%m-%dT%H:%M:%SZ") ==="
  echo "$COVERAGE_OUTPUT"
  echo ""
} >> "$LOG"

SUMMARY="$PROJECT_DIR/coverage/coverage-summary.json"
if [ ! -f "$SUMMARY" ]; then
  echo "ERROR: Coverage summary not found — tests may not have run." >&2
  echo "See $LOG for details." >&2
  jq -n '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "Coverage check failed — no summary file"}}'
  exit 0
fi

PCT=$(jq -r '.total.lines.pct' "$SUMMARY" 2>/dev/null || echo "0")

# Print coverage table to stderr (visible to user)
echo "" >&2
echo "$COVERAGE_OUTPUT" | grep -A 50 "Coverage summary" | head -20 >&2
echo "" >&2

if awk -v pct="$PCT" 'BEGIN { exit (pct+0 >= 80) ? 0 : 1 }'; then
  echo "✓ PASSED — Line coverage: ${PCT}% (threshold: 80%)" >&2
  echo "Proceeding with push..." >&2
  exit 0
else
  echo "✗ FAILED — Line coverage: ${PCT}% (threshold: 80%)" >&2
  echo "Push BLOCKED. Increase test coverage to >=80% and try again." >&2
  jq -n --arg pct "$PCT" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: ("Coverage FAILED: " + $pct + "% line coverage (need >=80%). Push blocked.")}}'
  exit 0
fi
