# Goblin Stompin' Gus — notes for Claude

A voxel action game in one self-contained HTML file: **`game/index.html`** (~1.2 MB, ~14,700 lines).
It loads three.js r128 from cdnjs; everything else (world generation, meshing, physics, AI, audio, UI) is inline.
Open the file in a browser to play.

## Ground rules
- `game/index.html` is the only deliverable. Keep it one file — no build step, no bundler.
- Parody of real brands is welcome and part of the humour (names like "Goblin Walmart"). Draw parody logos rather than copying real artwork.
- Comments are plain English, explaining *why*, often in parentheses. Match the existing style.
- **Bump `SAVE_KEY`** (currently `'goblin-city-v92'`) whenever world generation changes, so old saves don't load into a different world.
- Make edits with exact, unique string replacements. Many identifiers repeat, so check for a single match before replacing.
- After every change: run the tests (below) before calling it done.

## Buildings
Before adding, moving, resizing or changing any building, read `docs/building-standards.md`: what Thomas expects of their scale, placement, look and interiors, the pitfalls, and how to check.

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
node joinaudit.js 9 30     # drives every lane from the blocks: road missing or blocked, highway ends not joined to streets
node rampaudit.js 45       # Gus walked and sprinted up and down each ramp kind, then every car on a slope: airborne frames, steps, jerk
node themeaudit.js 300     # whether each theme park is whole: all 64 blocks park, the coaster's track, the wheel's legs, the carousel
node sitecount.js 200      # how many of each big site land within that many plots of the middle
node stairaudit.js 160     # which buildings with more than one floor still have no stairs
node signcount.js 150      # how many signs each kind of building carries
node wcaudit.js 150        # which buildings have no bathroom, floor by floor (`wcRooms` places them)
node capaudit.js           # the capitol: every room can be walked to, its doors are really there and drawn, no prop in a wall or doorway
node carride.js            # drop on to moving vehicles: land, ride, no damage
node rampride.js           # riding real vehicles up and down real ramps
node planeride.js          # airplanes: stand on one, ride a whole flight, wreck them
node parkzoo.js            # theme park rides and zoo animals: attacks reach them, they break and die, and it stays that way
node coasterride.js 2      # riding the roller coaster: whole laps on a car, landings all round the circuit and from real heights
node coastaudit.js 500     # coastal places by kind, what each one has, which ports belong to whom
node boatride.js           # every kind of boat: stand on it, ride it, sink it, swim aboard; routes stay on open water; what's moored where
node vclimbt.js            # spider-climbing vehicles: grab a train, cars, a ship's hull and container stack, a plane; hang on while it moves, up on top, back over the edge
node vcrash.js             # crashes: ordinary traffic running goblins down, two boats on a collision course
```
To review the chains' logos: `node logosheet.js out.png` from `tools/ui`. To look at a spot in the real game: `python tools/build_3d.py game/index.html tools/ui/t3.html`, then `node tour.js scenes.js outDir [seed]` from `tools/ui` (set `TOUR_VIEW=800` to see that many blocks through the fog, and pass a wait of about 25000 as a fourth argument so distant chunks finish building).

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
- **Props:** furniture made of small boxes rather than whole blocks, in proportion to the goblins (about 1.4 tall): models in `PROPS`, placed by `hospProps`, drawn by `refreshProps` as instanced boxes near the player, knocked down by `knockProps`. Hospitals are laid out by hand; everywhere else `furnProps` reads what `furnRaw` says stands there, and `furnTurns` decides which of those blocks become props (shelves, fridges, sofas, beds, plants, small tables, lone screens). Restaurants (`restProps`), shops and stores (`shopRoom`), malls (`mallProps`), houses (`homeRoom`), flats (`aptFloor`), workplaces (`workRoom`) , public buildings (`civicRoom`) and venues and workplaces such as cinemas and factories (`venueRoom`) are laid out by hand from a shared set of models. Pavement and park benches and litter bins are props too (`streetFurn`, drawn by `refreshProps` out to 96 blocks rather than 34, and listed in `activeFix` so traffic hits them); taller street objects are fixtures (`drawFix`). Goblins treat props as walls through `gobGround`, and shove one over if held up for long. Suite `dispatch` sends out fire engines, police cars, ambulances and news vans from real stations. News crews (`reportNews`, `newsAI`) cover fires, car crashes and killings; suite `newscrew` checks each. Suite `proptest` chases a goblin across rooms; `tools/ui/proptime.js` times the props.
- **Stairs:** `autoStair` gives any building with a real upper storey a flight, if it fits. A building with `b.stair` gets a railed flight per storey (`stairAt`) of stair blocks (`stairId`: a ramp underfoot, drawn as steps), and goblins chase a hippo between floors with `stairPoint`/`onStair`. Fire stations and schools so far; suite `stairs` tests going up and down. A very long building can have a second flight in `b.stair2` (read through `stair2Of`; so far just the university library).
- **Goblin routes:** `navUpdate` keeps one map per hippo, built backwards from where it stands a little each frame (`navExpand`; `navCol` lists where a goblin can be in a column of blocks), and `navSteer` reads it: walk, hop, running jump, climb up or down a wall (`gobStartMove`, `gobMoveStep`), with swimming handled where gravity is. `stairPoint`/`roomStep` are only the fallback now. Suite `chase` times goblins running a hippo down in every big building, up cliffs and across water, and counts their blows on a hippo stood on vehicles; `tools/ui/chasecost.js` times the maps in a real browser with a full crowd.
- **Placement:** `SITE_F` says how far out from a place's middle each kind of site goes (`siteFits`); a dump is a 4x4 `dumpSite` at the end of a street.
- **Roofs:** `roofOf` picks a shape per kind of shop (hip, mansard, gable, barrel, false front, dome, mirror ball), drawn by `roofColumn` above the flat roof.
- **Trains:** one per track (`updateTrains`), an engine at each end; `T.s` is the front, but the cars are numbered from the far end of the line, so they keep their places when it reverses. `trainHit` damages one car; losing one halts the train. Riders are carried round bends in the car's own frame. Suite `trainride` tests all that.
- **Airplanes:** `updateAirport` flies one and parks two; `planeBoxes` gives each a fuselage and wing box in `TRAIN_BOXES`, so they're stood on and hit through the same code as trains (`trainHit` passes them to `planeHit`). `planeWreck` handles the fall and the replacement.
- **Theme park rides:** a venue (`makeRides`, `updateRides`), whose parts are stand-ins in `TRAIN_BOXES`, so they're hit through `trainHit` (passed on to `rideHit`) and stood on like trains. The coaster stops if a car's destroyed and derails if its track is broken, the wheel falls if its A-frame loses a side (`wheelFall`), the carousel goes if its floor does. `themeOf` alone decides whether a park goes in, and only where all 8 x 8 blocks are free (moved up to two blocks along to find room); `themeBusy` stops answers worked out meanwhile being cached. `rideSurvey` still leaves out a ride with nothing under it, and only blocks in `edits` count as broken (`rideBroke`).
- **Zoo animals:** `animalBox` gives each a soft box in `TRAIN_BOXES` (hit, but not stood on or bumped into), `animalHit` hurts them through `trainHit`, `ANIMALS` has their health and score. Dead animals and wrecked rides are kept in `wrecked`, saved with the world.
- **Boats:** everything afloat is a box model made by `makeBoat` (kinds in `BOATS`), baked into one mesh, and moved by `updateBoat`: on rounds at sea along a racetrack route that stays on open water (`boatAt`, `boatLane`, `lanePt`), or tied up where `mooredBoats` says (harbours, port and naval quays, a dry dock, off a beach, on the sand, at a rig). `boatBoxes` puts them in `TRAIN_BOXES`, so they're stood on and hit through the same code as trains; `trainHit` passes them to `boatHit`, and `boatWreck` handles the sinking and the replacement. Jump while swimming beside one to climb aboard (`boatBeside`). Suite `boatride` tests all that. Wrecks on the sea bed are still blocks (`wreckBlock`).
- **Climbing vehicles:** vehicles aren't blocks, so spider-climbing one is its own hold, `p.vcl` (only while `p.state` is `'climb'`): a face of the vehicle's box (`vBox`: a car's, or one `TRAIN_BOXES` piece of a train, boat or plane) and a spot on it in the vehicle's own frame, so he goes wherever it goes. `vGrab` takes hold (walking or jumping into one with climb held, or one that would have run him down), `vClimb` moves him on it (round corners, up on to the top, down off the bottom), `vOverEdge` tips him off a roof on to the side, and `vRepin` puts him back on his hold after the vehicles have moved each step. Suite `vclimbt`.
- **Crashes between vehicles:** cars bump each other (`updateCars`), trains and planes smash cars and goblins in their way (`trainBoxes`, `planeStrike`), boats run goblins down (`boatStrike`), any car over 5 a second runs a goblin down, and `bigCrashes` knocks two big vehicles (train, boat, plane) that meet, once each time they meet. Suite `vcrash`.
- **Cultists:** an enemy type, robed and hooded goblins from their own pool (`addCultist`, made as needed by `freeCultist`, flagged `g.cultist`, never spawned into town or counted against the street's goblins). A cult altar's venue (`updateCultVenue`) keeps its circle of them alive while Gus is within 70 (`cultSpawn`, bound by `g.homeV`), shuffling round the altar (`cultCalm`). Coming within 15 of the altar, or hurting one, rouses the cult (`cultRouse`); then they hunt like goblins, but stop to conjure a fireball when they can see him from 4.5 to 30 off (`cultCast`, `cultSees`; the fireballs are `FIREB`, `updateFireballs`, 2 damage) and stab with a ritual dagger up close (1 damage, every 0.85 s). Killed ones stay dead until the cult's had two quiet minutes. The Testing Environment's Cultist button spawns them with no altar, hostile at once. Suite `cult`; `tools/ui/cultshot.js` takes real screenshots.
- **Compound guards:** thieves' hideouts, prepper bunkers and militia camps keep their people as live goblins (`FIG_STYLE`, `FOES`; pool flagged `g.special` like cultists, made by `freeFoe`, placed by `foeSpawn` at the site's posts, towers hold their post via `g.hold`). They mill about (`guardCalm`) until Gus comes close (rouse distance in `FIG_STYLE`) or hurts one (`siteRouse`). Thieves stab with daggers; preppers and militia shoot rifles (`foeRanged`/`foeShoot`, hitscan with a tracer, hit chance falls with distance) and lob pipe bombs or grenades (`foeThrow` into `SHOTS`, `updateShots`, bursting via `foeBoom`). Testing Environment buttons Thief, Prepper, Militia.
- **Military base armour:** each base gets an `army` venue (`armyVenue`) whose parked tanks and helicopters are real vehicles with `TRAIN_BOXES` stand-ins (`isMil`, hit through `milHit`). Entering the base rectangle or hitting one alerts it (`milAlert`): up to `MIL_ROLL` tanks hunt at once (`updateTank`: turret tracks, drives, fires shells) and the helicopters lift off, circle and strafe with bursts and rockets (`updateHeli`). Destroyed ones are saved as wrecked; the base stands down 30 s after Gus leaves. They're solid: `milBlocked` stops a tank or helicopter moving into another base vehicle or a train, plane, boat or ride car (a blocked tank swings aside for a moment, `M.detour`), and `milShove` pushes goblins and cars out of their boxes, a moving tank running goblins down and ramming cars. Suite `site`; `tools/ui/siteshot.js` takes real screenshots.
- **Play as a goblin (debug):** `setGob` swaps the player's body sizes, and `updatePlayer` runs the normal player code (`movePlayer`) with `GOB_ABIL` and goblin speeds in place of `ABIL` for that step. `gobCamera` is the first-person view, `gobKit` the goblin others see and your own arm and club, `calmNow` what stops goblins and cars going after you. Suite `gobmode` checks it against a hippo; `tools/ui/gobshot.js` takes real screenshots.
- **Debug menu:** the quick menu's rows and sections are in `DBG_SECS` (column, title, rows). Its Rendering switches only change the picture: props by hiding `PROP_L`/`PROP_G`, fixtures by hiding `FIX_BAR`/`FIX_GLOW`/`FIX_COL` and the sign, signal and billboard groups, and caves, sewers and subways by drawing each chunk from `gfxArr`, a copy with what `gfxRec` says those features wrote filled back in with earth. Its Interface switches (`UI_PARTS`: a CSS selector per part of the display, hidden through one style sheet) add a row and an Options box each from that table. None of these are saved. Suite `gfxhide` checks them and the menu's navigation.
- **Dev tab:** `DEV_ABIL`, `DEV_SCRIPT`, sandbox `SBX`, Structures previewer (`ST`, `stBuildList` — built lazily because `TEST_GROUPS` is defined later).
  The previewer meshes the structure's blocks itself (`stMeshes`), but its dressing (lamps, signals, signs, benches and bins, props inside, doors, shop signs, landmarks, rides, animals, boats) is the game's own: `viewers()` adds stand-ins spread over the box (`ST.view`, `stViewers`) to the players every refresh loop goes round, `stDress` runs those refreshes, and `stDrawDeco` draws just that dressing from the game's scene (`stDecoSet`), cut to the box with clipping planes. So a new kind of dressing shows up there by itself if its refresh loops over `viewers()` and its models are in `stDecoSet`. Fly mode (`stFlySet`, `ST.fly`) is a noclip camera whose position is one more viewer, so furniture loads round it floor by floor.
- **Testing Environment (title screen):** an empty, flat world (`TENV`, saved with the world; null in a normal city). Only the plan's blocks inside spawned boxes (`TENV.boxes`, in plots; `tenvShow(px,pz)`) are generated (`genChunk` returns `flatChunk` elsewhere) or dressed: every refresh that loops over plots near `viewers()` skips the rest, and traffic, crowds, services, trains and pull-overs don't spawn at all. Spawning a structure searches the plan ring by ring with the Structures previewer's `stMatch` (`tenvTick`), lets that box through (`tenvRebuild`) and puts Gus beside it (`tenvGo`); enemies come from `tenvFoe`. Entering parks your city under `goblin-stompin-gus-city-parked` and leaving restores it (`tenvEnter`/`tenvLeave`). A new kind of dressing or spawner that loops over plots needs a `tenvShow` check too. Suite `tenv` checks it; `tools/ui/tenvshot.js` takes real screenshots.
- **Goblin crowds and vehicles (batched drawing):** street goblins (hostiles, civilians, staff) are never in the scene, and cars keep their boxes on layer `BAT_HIDE`, which no camera draws. Their part objects are still moved, hidden and recoloured as normal; each frame `batDraw` copies every shown box's matrix, colour, emissive and snow (`mat.snowU`, set by `snowCar`) into one `InstancedMesh` per box size and material kind (`BAT`, `batKind`). Plain Lambert or Basic boxes batch; one with a texture, transparency or its own shader is left to draw normally on a car, and isn't drawn at all on a goblin. Make new goblin or vehicle boxes with `boxGeo(w,h,d)` so they share shapes and batch together, and never dispose one. Crowding checks use a grid (`GOB_GRID`, `gobCell`), not every goblin against every other.

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
  - spiderclimb: climbing on to pillars, one-block-deep ledges and walls, at each height and in all four directions (every line should say 4/4)
  - climbedge: the odd ways of climbing: at an angle, mid-jump, sprinting, low frame rates, crawling round corners, climbing down, setting off from the top, and narrow things really in the world (a few 'BAD' lines there are places too cramped to stand)
  - vclimbt: spider-climbing vehicles (see Climbing vehicles); vcrash: vehicle crashes
  - lowfps: charge input at low frame rates
  - negdt: a stale first frame timestamp mustn't trigger a stomp
  - loadt2: load-in doesn't break blocks
  - wv / lodt: wind farm LOD
  - stt: structures list
  - stdress: the structures previewer dresses what it shows (counts of lamps, props, doors, signs, venues per kind)
  - obt: obituary preview
  - cult: cultists: alive and calm at the altar, roused by coming close or hurting one, fireballs from range (counts thrown and hits), daggers up close, the dead stay dead, the Testing Environment's Cultist button
  - site: compound guards (thieves, preppers, militia) calm then roused, rifles, bombs and daggers; base armour: alert on entry, tanks and helicopters hunting and firing, never overlapping, a goblin run down and a car shoved, destroying them, wrecks saved, standing down; the Testing Environment buttons
  - tenv: Testing Environment: boots empty and flat, nothing spawns on its own, structures spawn with their dressing, enemies spawn ahead of Gus, removing one leaves grass
  - crowdperf: `node crowdperf.js 50,400,800` times `updateGoblins` and a whole frame with that many goblins bunched up, and checks they still push apart (draw calls need the real renderer: see Real rendering)
