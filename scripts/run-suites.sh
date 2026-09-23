#!/bin/sh
# Runs the GPU regression suites in sequence and prints one line per suite.
# Usage: sh scripts/run-suites.sh [label]
BASE=${BASE:-http://localhost:4173}
mkdir -p scripts/shots/suites
for s in verify-v3 verify-room-interactions verify-held-objects verify-reduced-hands verify-hand-support verify-phone-grip verify-after-hours verify-deeplinks verify-tour verify-os-apps; do
  GPU=1 BASE=$BASE timeout 600 node scripts/$s.mjs > scripts/shots/suites/$s.log 2>&1
  code=$?
  echo "$s exit=$code $(grep -c '^PASS' scripts/shots/suites/$s.log) pass, $(grep -c 'FAIL\|Error' scripts/shots/suites/$s.log) fail/err"
done
