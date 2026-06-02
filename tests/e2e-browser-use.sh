#!/usr/bin/env bash
# FlowTime E2E Test Suite — browser-use CLI
# Usage: bash tests/e2e-browser-use.sh [BASE_URL]
#   BASE_URL defaults to http://localhost:5173
#
# Prerequisites:
#   1. Dev server running: npm run dev
#   2. browser-use available: uv tool install browser-use
#      or use uvx browser-use (slower per-call)
#
# Flags:
#   --headed   Show browser window (default)
#   --headless Run without visible browser

set -euo pipefail

BASE_URL="${1:-http://localhost:5173}"
HEADED="--headed"

BU="uvx browser-use"

PASS=0
FAIL=0
SKIP=0

# ── Helpers ──────────────────────────────────────────────────────────────

log_pass() { PASS=$((PASS + 1)); printf "\033[32m  ✓ PASS\033[0m  %s\n" "$1"; }
log_fail() { FAIL=$((FAIL + 1)); printf "\033[31m  ✗ FAIL\033[0m  %s\n" "$1"; }
log_skip() { SKIP=$((SKIP + 1)); printf "\033[33m  ⊘ SKIP\033[0m  %s\n" "$1"; }

section() { printf "\n\033[1m── %s ──\033[0m\n" "$1"; }

bu_open()    { $BU $HEADED open "$1" >/dev/null 2>&1; }
bu_state()   { $BU state 2>&1; }
bu_title()   { $BU get title 2>&1; }
bu_click()   { $BU click "$1" >/dev/null 2>&1; }
bu_input()   { $BU input "$1" "$2" >/dev/null 2>&1; }
bu_close()   { $BU close 2>/dev/null || true; }

require_state_contains() {
  local label="$1" expected="$2"
  local actual
  actual=$(bu_state)
  if echo "$actual" | grep -qi "$expected"; then
    log_pass "$label"
  else
    log_fail "$label — expected '$expected' not found"
    echo "$actual" | head -20
  fi
}

require_title_contains() {
  local label="$1" expected="$2"
  local actual
  actual=$(bu_title)
  if echo "$actual" | grep -qi "$expected"; then
    log_pass "$label"
  else
    log_fail "$label — title '$actual' does not contain '$expected'"
  fi
}

find_index() {
  echo "$1" | grep -i "$2" | grep -oP '\[\d+\]' | head -1 | tr -d '[]'
}

# ── Setup ────────────────────────────────────────────────────────────────

cleanup() { bu_close; }
trap cleanup EXIT

printf "\033[1mFlowTime E2E Tests\033[0m  target=%s  mode=%s\n\n" "$BASE_URL" "${HEADED:---headless}"

# ── 1. Idle State ────────────────────────────────────────────────────────

section "1. Idle State — Landing Page"

bu_open "$BASE_URL" || {
  log_fail "Cannot open $BASE_URL — is dev server running?"
  printf "\n\033[1mResults: %d passed, %d failed, %d skipped\033[0m\n" "$PASS" "$FAIL" "$SKIP"
  exit 1
}

sleep 2

require_title_contains "Page title contains FlowTime" "FlowTime"
require_state_contains "Shows idle heading" "FlowTime"
require_state_contains "Shows input placeholder" "今天要专注什么"
require_state_contains "Shows start button" "开始"

# ── 2. Start Focus Session ──────────────────────────────────────────────

section "2. Start Focus Session"

STATE=$(bu_state)
INPUT_IDX=$(find_index "$STATE" "今天要专注什么")

if [ -n "$INPUT_IDX" ]; then
  bu_input "$INPUT_IDX" "写测试文件"
  log_pass "Typed task name into input"
else
  log_fail "Could not find task input field"
fi

sleep 0.5

STATE=$(bu_state)
START_IDX=$(find_index "$STATE" "开始")

if [ -n "$START_IDX" ]; then
  bu_click "$START_IDX"
  log_pass "Clicked start button"
else
  log_fail "Could not find start button"
fi

sleep 1

require_state_contains "Timer is now running" "00:0"
require_state_contains "Task name displayed" "写测试文件"

# ── 3. Pause & Resume ───────────────────────────────────────────────────

section "3. Pause & Resume"

STATE=$(bu_state)
PAUSE_IDX=$(find_index "$STATE" "暂停")

if [ -n "$PAUSE_IDX" ]; then
  bu_click "$PAUSE_IDX"
  log_pass "Clicked pause button"
else
  log_fail "Could not find pause button"
fi

sleep 1

require_state_contains "Shows paused state" "暂停"

STATE=$(bu_state)
RESUME_IDX=$(find_index "$STATE" "继续")

if [ -n "$RESUME_IDX" ]; then
  bu_click "$RESUME_IDX"
  log_pass "Clicked resume button"
else
  log_fail "Could not find resume button"
fi

sleep 1

STATE=$(bu_state)
if echo "$STATE" | grep -qP '\d{2}:\d{2}'; then
  log_pass "Timer running again after resume"
else
  log_fail "Timer not showing after resume"
fi

# ── 4. Finish & Summary Dialog ──────────────────────────────────────────

section "4. Finish & Summary Dialog"

STATE=$(bu_state)
FINISH_IDX=$(find_index "$STATE" "结束")

if [ -n "$FINISH_IDX" ]; then
  bu_click "$FINISH_IDX"
  log_pass "Clicked finish button"
else
  log_fail "Could not find finish button"
fi

sleep 1

require_state_contains "Break state is active" "休息"
require_state_contains "Summary dialog is open" "任务总结"

# ── 5. Submit Summary ───────────────────────────────────────────────────

section "5. Submit Summary"

STATE=$(bu_state)
TEXTAREA_IDX=$(find_index "$STATE" "记录一下刚才的收获")

if [ -n "$TEXTAREA_IDX" ]; then
  bu_input "$TEXTAREA_IDX" "完成了E2E测试脚本的编写"
  log_pass "Typed summary text"
else
  log_fail "Could not find summary textarea"
fi

sleep 0.5

STATE=$(bu_state)
SAVE_IDX=$(find_index "$STATE" "保存总结")

if [ -n "$SAVE_IDX" ]; then
  bu_click "$SAVE_IDX"
  log_pass "Clicked save summary button"
else
  log_fail "Could not find save summary button"
fi

sleep 2

STATE=$(bu_state) || {
  log_fail "Lost browser connection after summary submit — restarting"
  bu_open "$BASE_URL"
  sleep 2
  STATE=$(bu_state)
}
if echo "$STATE" | grep -qiE "FlowTime|休息|跳过休息"; then
  log_pass "Summary saved — in break or back to idle"
else
  log_fail "Unexpected state after summary submit"
fi

# ── 6. Skip Break → Idle ────────────────────────────────────────────────

section "6. Skip Break → Back to Idle"

STATE=$(bu_state)
SKIP_IDX=$(find_index "$STATE" "跳过休息")

if [ -n "$SKIP_IDX" ]; then
  bu_click "$SKIP_IDX"
  log_pass "Clicked skip break"
  sleep 1
  require_state_contains "Back to idle state" "FlowTime"
else
  log_skip "Skip break button not found (may already be idle)"
fi

# ── 7. History Page ─────────────────────────────────────────────────────

section "7. History Page"

bu_open "$BASE_URL/#/history"
sleep 1

require_state_contains "History page loaded" "专注"
require_state_contains "Shows statistics area" "今日"

bu_open "$BASE_URL"
sleep 1
log_pass "Navigated back to home page"

# ── 8. Empty Task Validation ────────────────────────────────────────────

section "8. Validation — Empty Task"

STATE=$(bu_state)
START_IDX=$(find_index "$STATE" "开始")

if [ -n "$START_IDX" ]; then
  bu_click "$START_IDX"
  sleep 0.5

  STATE_AFTER=$(bu_state)
  if echo "$STATE_AFTER" | grep -qi "FlowTime"; then
    log_pass "Empty task is rejected — stays on idle"
  else
    log_fail "Empty task should be rejected but state changed"
  fi
else
  log_skip "Could not find start button for empty task test"
fi

# ── 9. PWA Manifest ────────────────────────────────────────────────────

section "9. PWA Manifest"

MANIFEST_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/manifest.webmanifest" 2>/dev/null)
if [ "$MANIFEST_HTTP" = "200" ]; then
  log_pass "PWA manifest is accessible (HTTP 200)"
else
  log_fail "PWA manifest check failed (HTTP $MANIFEST_HTTP)"
fi

# ── Results ─────────────────────────────────────────────────────────────

printf "\n\033[1m━━━ Results ━━━\033[0m\n"
printf "  Passed:  \033[32m%d\033[0m\n" "$PASS"
printf "  Failed:  \033[31m%d\033[0m\n" "$FAIL"
printf "  Skipped: \033[33m%d\033[0m\n" "$SKIP"
printf "\n"

if [ "$FAIL" -gt 0 ]; then
  printf "\033[31mSome tests failed!\033[0m\n"
  exit 1
else
  printf "\033[32mAll tests passed!\033[0m\n"
  exit 0
fi
