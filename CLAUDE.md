# Goblin Stompin' Gus — notes for Claude

A voxel action game in one self-contained HTML file: **`game/index.html`** (~1.2 MB, ~14,700 lines).
It loads three.js r128 from cdnjs; everything else (world generation, meshing, physics, AI, audio, UI) is inline.
Open the file in a browser to play.

## Ground rules
- `game/index.html` is the only deliverable. Keep it one file — no build step, no bundler.
- Parody of real brands is welcome and part of the humour (names like "Goblin Walmart"). Draw parody logos rather than copying real artwork.
- Comments are plain English, explaining *why*, often in parentheses. Match the existing style.
- **Bump `SAVE_KEY`** (currently `'goblin-city-v58'`) whenever world generation changes, so old saves don't load into a different world.
- Make edits with exact, unique string replacements. Many identifiers repeat, so check for a single match before replacing.
- After every change: run the tests (below) before calling it done.

## Running the tests
The game script is pulled out of the HTML and evaluated in Node with a stub THREE and a fake DOM.
That checks logic: world generation, physics, abilities, AI and menus. It doesn't check the real 3D picture.

```bash
bash tools/run_tests.sh                 # smoke, devtest, walk (rebuilds tools/tests/g.js first)
bash tools/run_tests.sh rollt spk lean  # any named suites from tools/tests/
SEED=7 bash tools/run_tests.sh maptest  # Math.random is seeded from SEED
```

The suites only print measurements and never fail on a wrong result, so compare output against the saved baseline:
```bash
bash tools/baseline.sh                  # rewrites tools/baseline/*.txt with timings masked
git diff tools/baseline                 # shows what a change altered; commit it if the change was intended
```

Three audits measure roads, traffic and the coast across a whole world, from generated blocks (slower: run them by hand, from `tools/tests`, with `SEED=1`, `2`, `3` to compare worlds):
```bash
node roadaudit.js 9        # motorway dead ends, breaks, and what decks and routes cut through
node trafficaudit.js 90    # stopped cars, longest queue and stuck cars at ramps and interchanges (SPOTS=rampEnd,capital to narrow it)
node shoreaudit.js         # straight cut-offs along block edges, sea bed depth jumps
node streetaudit.js        # trees in streets, block lines through corner bends, unmarked town ramps, barrier jogs at ramp feet
```
To review the chains' logos: `node logosheet.js out.png` from `tools/ui`. To look at a spot in the real game: `python tools/build_3d.py game/index.html tools/ui/t3.html`, then `node tour.js scenes.js outDir [seed]` from `tools/ui`.

How a test works (see the first ~40 lines of `tools/tests/dead6.js`, which is the standard header):
- **Loading the game.** `mkg.py` copies the main `<script>` (the one after the three.js tag) into `g.js`. Each test reads `g.js` and seeds `Math.random`.
- **Reaching internals.** A regex swaps the closing `requestAnimationFrame(frame);\n})();` for `window.__t={...}`, which exposes the functions that test needs. If you add an internal a test must reach, add it to that test's `window.__t={` list.
- **Stubs.** Next come the stub THREE classes (`class Q{` … up to `const listeners=`), a fake `document`, `localStorage` and gamepads.
- **Driving the game.** `eval(src); const T=window.__t;` then `T.frame(now)` advances the game. `run(seconds)` is already defined in the header, so don't redeclare `run`.
- **New test.** Copy the header from `dead6.js`, adjust the `window.__t` export list, then write the checks.

UI tests (Playwright + Chromium) drive the real page with the stub THREE swapped in:
```bash
python3 tools/build_ui.py game/index.html tools/ui/ui.html
cd tools/ui && node uist.js      # also: padnav.js (controller menu nav), uishot*.js (screenshots), uiex.js
```

Map tools (`tools/map/`):
- `topview.js` / `gview.js` render top-down maps of generated terrain to `.ppm`.
- `tv.sh` converts those to PNG.
- `sec.js` / `secz.js` render cross-sections.
- `elev.py` plots elevation.

### Real rendering (local only)
The stub can't show the real picture. To check visuals (`npm install` and `npx playwright install chromium` first):
```bash
python tools/build_3d.py game/index.html tools/ui/t3.html   # local three.js, internals on window.__G
cd tools/ui && node real3d.js [seed] [outDir]               # menu, spawn, above spawn, motorway, country road
```
It renders in software, so the picture is right but the frame rate says nothing about a real graphics card.

## Map of the code (search these names)
- **World and terrain:**
  - chunk generation `genChunk`; meshing (`meshes`, `MESHED`)
  - far LOD rings `farJobNear`/`farJobMid`/`farJobFar` via `farBox`
  - world curve `CURVE_U`, lighting `WORLD_LIGHT`. Any second renderer (e.g. the obituary preview) must zero/whiten these while it renders.
- **Roads:**
  - towns `placeAt`; road spans `axisSpan` (kinds include `'moto'`, `'country'`; `flat` ends)
  - motorway ramps `hwRampAt` / `hwRampCol` / `rampBlocked` / `hwFootNear`; route ends `rtFlat`, `rtRamp`
- **Player:**
  - frame loop `frame`. It substeps when dt > 0.05; presses only count on the first substep, and held state like `inp.chargeHeld` carries across.
  - abilities live in `AB` (toggles), saved under localStorage `goblin-stompin-gus-abilities`
  - bite / stomp / pound with charge levels (`stompCap`, `poundCap`)
  - dash / sprint / air dash; `longJump` (with `LJ_GRACE`); roll; blast dash / blast air dash; blast long jump (`blastOff`, `crushBall`)
  - rocket boost (`ROCKET_*`); ground spike (`groundSpikes`, `spikeGround`, `SPIKES`); climb; crash landing; fall-damage immunity
- **Destruction:**
  - `crush(...)` (accepts `{round:R}` for round craters)
  - building collapse lean is worked out from surviving structural blocks and snapped to a cardinal direction within 20° (`snapCard`)
- **Controls:**
  - `ACTS` / `BINDS` (localStorage `goblin-binds-v1`), `KB_RESERVED`, `PAD_RESERVED`
  - `rebindHTML`, `keyLabel`, `padLabel`
  - controller menu navigation `menuNav` (spatial up/down)
- **Abilities menu:** rows `.abil2 > .ab-row`, upgrades in `.ab-up`, toggles use `data-base`, `data-prev`, `data-excl` (roll ⟷ blastDash).
- **Props:** furniture made of small boxes rather than whole blocks, in proportion to the goblins (about 1.4 tall): models in `PROPS`, placed by `hospProps`, drawn by `refreshProps` as instanced boxes near the player, knocked down by `knockProps`. Hospitals only so far.
- **Stairs:** a building with `b.stair` gets a railed flight per storey (`stairAt`) of stair blocks (`stairId`: a ramp underfoot, drawn as steps), and goblins chase a hippo between floors with `stairPoint`/`onStair`. Fire stations and schools so far; suite `stairs` tests going up and down.
- **Placement:** `SITE_F` says how far out from a place's middle each kind of site goes (`siteFits`); a dump is a 4x4 `dumpSite` at the end of a street.
- **Roofs:** `roofOf` picks a shape per kind of shop (hip, mansard, gable, barrel, false front, dome, mirror ball), drawn by `roofColumn` above the flat roof.
- **Dev tab:** `DEV_ABIL`, `DEV_SCRIPT`, sandbox `SBX`, Structures previewer (`ST`, `stBuildList` — built lazily because `TEST_GROUPS` is defined later).

## What each test suite covers (tools/tests)
- **Core suites:**
  - smoke (boot, chunk gen timing, no errors)
  - maptest / maptest_sea (world gen sanity)
  - spawnt (spawn point)
  - devtest (dev tab and sandbox)
  - trt / ttr / jam (traffic and trains)
  - walk (walk around many spots)
  - ts, ruin
- **Features:**
  - dead6 / dead7: motorway dead ends and ramps
  - kinds, xing, above, stray: road kinds, crossings, overpasses, stray road pieces
  - bindt / padcap / capt: rebinding
  - blj: blast long jump
  - rkt*: rocket boost
  - lean / tilt: collapse lean
  - bob: rocket pose
  - rollt / rollw / lockroll: roll
  - ljd: long jump vs dash
  - adt: air dash
  - edge: momentum off edges
  - crt: crash landing
  - spk*: ground spike
  - lowfps: charge input at low frame rates
  - negdt: a stale first frame timestamp mustn't trigger a stomp
  - loadt2: load-in doesn't break blocks
  - wv / lodt: wind farm LOD
  - stt: structures list
  - obt: obituary preview
