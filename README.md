# Goblin Stompin' Gus

Open `game/index.html` in a browser to play (needs internet for three.js from cdnjs).

The source is in `src/`. `python tools/build.py` joins it back into `game/index.html`, so edit `src/` and rebuild.

Tests need Node 18+ and Python 3: `bash tools/run_tests.sh`.
UI tests also need Playwright: `npm i -D playwright && npx playwright install chromium`.

See `CLAUDE.md` for how the code and tests are organised.
