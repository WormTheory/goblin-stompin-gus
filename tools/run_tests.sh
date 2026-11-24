#!/usr/bin/env bash
# Rebuilds the game from src/ and its test copy of the script (mkg.py does both), checks the source (lint.js) and runs
# the core node suites (or the ones you name).
# Usage: tools/run_tests.sh            -> smoke devtest walk
#        tools/run_tests.sh rollt spk  -> just those
# It fails (exit 1) if the source check does, or if any suite crashes or reports errors on its "errors N" line. The
# suites still mostly print measurements to compare by eye (see baseline.sh), but one that falls over no longer passes
# quietly: each used to be cut to its last six lines with its exit code thrown away.
set -e
cd "$(dirname "$0")"
# (On Windows "python3" is often just a Microsoft Store placeholder that fails, so fall back to "python".)
PY=python3; $PY --version >/dev/null 2>&1 || PY=python
$PY mkg.py ../game/index.html tests/g.js
cp tests/g.js map/g.js
node lint.js
cd tests
T=${@:-smoke devtest walk}
bad=""
for t in $T; do
  echo "== $t"
  rc=0; out=$(SEED=${SEED:-1} node "$t.js" 2>&1) || rc=$?
  if [ $rc -ne 0 ]; then
    # (a crash: show where, not just the tail of the stack)
    echo "$out" | grep -v '^    at ' | tail -12; echo "FAILED: $t (exit $rc)"; bad="$bad $t"
  else
    echo "$out" | tail -6
    if echo "$out" | grep -Eq '^errors [1-9]'; then echo "FAILED: $t (reported errors)"; bad="$bad $t"; fi
  fi
done
if [ -n "$bad" ]; then echo; echo "FAILED:$bad"; exit 1; fi
