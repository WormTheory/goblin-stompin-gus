#!/usr/bin/env bash
# Saves every suite's printed output to tools/baseline/, so "git diff tools/baseline" shows what a change altered.
# (The suites print measurements and never fail by themselves, so comparing output is the real check.)
# Usage: tools/baseline.sh            -> all suites (not the slow audits: run those by hand, see CLAUDE.md)
#        tools/baseline.sh rollt spk  -> just those
cd "$(dirname "$0")"
# (mkg.py rebuilds the game from src/ first)
PY=python3; $PY --version >/dev/null 2>&1 || PY=python
$PY mkg.py ../game/index.html tests/g.js
cp tests/g.js map/g.js
mkdir -p baseline
cd tests
T=${@:-$(ls *.js | grep -vE '^(g|roadaudit|trafficaudit|shoreaudit|streetaudit)\.js$' | sed 's/\.js$//')}
for t in $T; do
  # (Timings differ on every run, so they're masked to keep the diff down to real changes.)
  SEED=${SEED:-1} node "$t.js" 2>&1 | sed -E 's/\b[0-9.]+ ?ms\b/N ms/g; s/\bms [0-9.]+/ms N/g; s/(ms per chunk near route) [0-9.]+/\1 N/; s/ slow .*$/ slow N/' > "../baseline/$t.txt"
  echo "$t: ${PIPESTATUS[0]}"
done
