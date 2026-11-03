#!/usr/bin/env bash
# Rebuilds the test copy of the game script and runs the core node suites (or the ones you name).
# Usage: tools/run_tests.sh            -> smoke devtest walk
#        tools/run_tests.sh rollt spk  -> just those
set -e
cd "$(dirname "$0")"
# (On Windows "python3" is often just a Microsoft Store placeholder that fails, so fall back to "python".)
PY=python3; $PY --version >/dev/null 2>&1 || PY=python
$PY mkg.py ../game/index.html tests/g.js
cp tests/g.js map/g.js
cd tests
T=${@:-smoke devtest walk}
for t in $T; do echo "== $t"; SEED=${SEED:-1} node "$t.js" 2>&1 | tail -6; done
