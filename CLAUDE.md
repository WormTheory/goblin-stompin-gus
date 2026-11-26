# Goblin Stompin' Gus — notes for Claude

A voxel action game that plays from one self-contained HTML file: **`game/index.html`** (about 3.5 MB; the source is about 33,500 lines in some 146 files).
It loads three.js r128 from cdnjs; everything else (world generation, meshing, physics, AI, audio, UI) is inline.
Open the file in a browser to play. The source it's built from is in **`src/`**.

## Source layout
- **Edit `src/`, never `game/index.html`.** `python tools/build.py` joins the source back into `game/index.html`, which stays committed because it's what gets played and published, so commit it along with your change. The test tools rebuild it for themselves. `python tools/build.py --check` says whether it's up to date.
- `src/page.html` is the page and its menus' markup, `src/style.css` the styles, `src/js/` the game script, by topic: `core/` (setup, blocks, audio, the loop, new city, Testing Environment), `world/` (the plan and terrain, `generate.js` has `genChunk`), `buildings/`, `dressing/` (street furniture, props, doors, signs), `render/`, `destruction/`, `player/`, `enemies/`, `vehicles/`, `venues/`, `ui/`.
- **The files in `src/js` aren't separate modules.** They're joined in the order in `src/js/ORDER.txt`, inside one function, so they share one scope: any file can use anything from any other with no imports, and every top-level name must be unique across all of them. No file runs on its own. Order only matters to code that runs while the page loads, such as a `const` read at the top level before the file declaring it. A new file must be added to `ORDER.txt`, or the build stops and says so.
- A topic can be in more than one file, because the code keeps the order it always ran in (`makeCar` is in `vehicles/cars.js`, but `updateCars` is in `vehicles/traffic-update.js`). Search all of `src/js` for a name, rather than guessing the file.
- **Patch notes** live in `src/patch-notes.md`, newest update first (`## ` per update, `### ` per section, `- ` bullets; `build.py` says which bits of Markdown it understands). The build puts them in the menu's Patch notes tab (`#tabNotes`, with the newest update's heading in the title screen's "What's new" line) and builds `game/patch-notes/index.html` from the template `src/patch-notes.html`, which GitHub Pages serves at `/patch-notes/`. Commit that file with `game/index.html`. When a change is worth telling players about, add it to the top update there, or start a new `## ` update, written for players rather than as a commit message.
- **Old versions** are playable from the Patch notes: an older update headed `## Version X` gets a "Play X" link to `<site>/v/X/`, which the Pages workflow builds from the git tag `vX` (`tools/archive_versions.py`, run on every deploy; it warns about a version with no tag). So when a version is released, tag the commit that was pushed (`git tag v0.2 <commit>`) and push the tag with it. Each old copy gets a script that prefixes its localStorage keys with `gsg-vX:`, so old and current saves and settings never mix, and a badge linking back to the latest.
- If `game/index.html` was changed by hand, the build refuses to overwrite it and says how to carry on. `git diff` skips that file, since its changes are already shown in `src/`; `git diff --text` shows it.
- **The frame loop** is `frame` in `core/loop.js` (with `safe`, which runs each part of a frame so that one going wrong doesn't stop the rest, and `worldEdgeTick`); the world's `save` and `load` are `core/world-save.js`; `renderView` is `render/view.js`; petrol pumps and exploding cars are `vehicles/explosions.js`; `savePos` and `boot` are at the end of `core/new-city.js`.
- **Numbers for a block or a column**, for `Map` keys: `ckey(cx,cz)` a chunk, `colKey(x,z)` a column, `bkey(x,y,z)` a block (`world/places.js`, `destruction/structure.js`). Don't write `x*65536+z`: it gives two columns the same number once z is negative. Nobody goes past `WORLD_EDGE` (450,000 blocks): chunk numbers run out at 524,288 and the ships' pockets start at `SHIP_X0`.
- **Looking at blocks:** `get(x,y,z)` makes the chunk if it isn't there (a couple of milliseconds); `peek(x,y,z)` never does, and answers AIR for a chunk not made. Per-frame code that looks about (AI, effects, sounds) should use `peek` or check `chunks.has` first.

## Where the notes are
Each part of the game has its notes in `docs/code/`. **Read the file for the part you're about to change** (and keep it up to date, with targeted edits); they aren't loaded by themselves.

- **`docs/code/assets-editor.md`** (assets and the editor): Assets, The editor, The editor's Vehicles tab, The editor's Hippo tab, Structures.
- **`docs/code/world.md`** (the world): The World Generator, Settlements in `WORLD_CFG`, Territories, New world's seed, Landscape noise, Biomes, Rivers, Relief, Weather by region, Living in each biome, Wonders, Coasts by biome, Landforms, World and terrain, Roads, Props, Stairs, Placement, Roofs.
- **`docs/code/player-enemies.md`** (players and enemies): Player, Buttons on screen, Controls, Abilities menu, Goblin routes, Cultists, A gun at range, a blade or club up close, Compound guards, Military base armour, Crews, Characters, Play as a goblin, Guns in both hands, The weapon table, Goblin loadout, Magazines and reloading, Landmines, Gnash's weapons, Enemy hostility, PvP, Hit shapes, Goblin crowds and vehicles.
- **`docs/code/vehicles.md`** (vehicles): Trains, Airplanes, Theme park rides, Zoo animals, Boats, Climbing vehicles, Crashes between vehicles, Vehicle collisions by mass, Driving, Mobile Gear, The forklift's forks and the tractor's hitch, Road vehicles as you drive them, Newer vehicles, Light vehicles, Ships with insides, How each vehicle is driven, The vehicle registry, Invulnerability and vehicles, Every gun's round, Wrecks keep going, Two players in one vehicle, Vehicles in a fight, Drivers.
- **`docs/code/destruction-render.md`** (destruction and drawing): Destruction, Big blasts, Lights out, Toppling, Chunk rebuilds, Block lighting, Dust, smoke, rubble, blood, Batched models, Not stalling the frame, Far chunks in groups, Stalls when arriving somewhere new.
- **`docs/code/ui-saves-online.md`** (menus, saves and online): Saves, The game as it was left, Browser save / Local save, Version and updates, Sound & picture options, Split-screen pause menus, Players' inputs and player two's window, Debug menu, Profiler, Map markers, This rampage, Dev tab, Testing Environment, Online co-op, Online chat and voice.
- **`docs/code/tests.md`** (the tests and tools): the audits, performance tools, how a test works, UI tests, map tools, real rendering, what each suite covers.

## Branches
- **Work on `test`, never on `main`.** `test` is where new work is committed, and pushing it (`git push origin test`) updates the test link, `/test/` on the website. `main` is the live release: it only moves when Thomas releases, by bringing `test` into `main` and pushing it himself. Don't make other branches or worktrees.
- A fix that has to go live before the rest of `test` is a release decision for Thomas. Such a fix is made on the `hotfix` branch, cut from `main` (never from `test`), and pushing it updates `/hotfix/` on the website for trying it out; Thomas brings it into `main`, then `main` is merged back into `test` (`git checkout test && git merge main`) so nothing's lost. The `hotfix` branch is the one exception to making no other branches.
- **Parallel threads share this folder and its git index, so commit through `tools/safe_commit.py`.** Copy what you'll change out of a known commit (`git archive <base> <paths>`) into a scratch folder, edit and test there, then `python tools/safe_commit.py --base <base> --from <scratch> -m "..." [files]`. It merges your change into the branch as it is now (lines others committed meanwhile stay), rebuilds `game/` when `src/` changed, moves the branch only if nobody else just did, and stops on a conflict or a dropped patch-notes line. `--remove path` takes a file out of the repo. Never put a whole-file copy, `git checkout --`, `git restore`, `git stash`, `cp` or `cat >` over `src/patch-notes.md` or `CLAUDE.md` here (others' work is in them), and never `git update-ref` without the old value. A cloud session's patch goes in with `git apply --3way`.
- **Never write `src/patch-notes.md` or `CLAUDE.md` whole in this folder** (an old copy takes out everything committed since): change them with targeted edits, and run `python tools/check_stale.py` before committing (`--fix` merges a stale copy back up to HEAD, keeping its own changes). The pre-commit hook (`git config core.hooksPath tools/hooks`) and `safe_commit.py` refuse while a copy is stale; `ALLOW_NOTES_REMOVAL=1` lets a deliberate removal through.

## Ground rules
- `game/index.html` is the only deliverable: it must stay one file that works when simply opened. The build only joins files, so keep it that way, with no bundler or dependencies.
- Parody of real brands is welcome and part of the humour (names like "Goblin Walmart"). Draw parody logos rather than copying real artwork.
- Comments are plain English, explaining *why*, often in parentheses. Match the existing style.
- **Bump `SAVE_KEY`** (currently `'goblin-city-v112'`) whenever world generation changes, so old saves don't load into a different world.
- **A new see-through effect** (anything transparent: smoke, dust, water, glows) goes into `tools/ui/fxorder.js` and that's run, so it's compared with every other one and with water, from above and below (`docs/code/tests.md`).
- Make edits with exact, unique string replacements. Many identifiers repeat, so check for a single match within the file before replacing.
- After every change: run the tests (below) before calling it done.

## Buildings
Before adding, moving, resizing or changing any building, read `docs/building-standards.md`: what Thomas expects of their scale, placement, look and interiors, the pitfalls, and how to check.

## Running the tests
The game script is pulled out of the HTML and evaluated in Node with a stub THREE and a fake DOM.
That checks logic: world generation, physics, abilities, AI and menus. It doesn't check the real 3D picture.

```bash
bash tools/run_tests.sh                 # smoke, devtest, walk (rebuilds game/index.html and tools/tests/g.js first)
bash tools/run_tests.sh rollt spk lean  # any named suites from tools/tests/
SEED=7 bash tools/run_tests.sh maptest  # Math.random is seeded from SEED
```

The suites only print measurements and never fail on a wrong result, so compare output against the saved baseline:
```bash
bash tools/baseline.sh                  # rewrites tools/baseline/*.txt with timings masked
git diff tools/baseline                 # shows what a change altered; commit it if the change was intended
```

`tools/run_tests.sh` first runs `node tools/lint.js`, which reads all of `src/js` as the one scope it is and fails on an undefined name, a name declared twice, an assignment to a name nobody declared, an object key given twice or a call with more arguments than the function takes (`-v` also lists the functions replaced after they're declared and the names nothing reads). The run fails (exit 1) if that does, if a suite crashes, or if a suite's `errors N` line isn't 0. `.github/workflows/check.yml` runs it with `smoke`, and `python tools/build.py --check`, on every push.

**A new suite** starts `const {T,E,run,step,els,pads,errs}=require('./harness.js')();` (see the top of `tools/tests/harness.js`, and `harnesst.js` for one written that way): `T.anyName` reads, calls or sets any name inside the game, through `window.__gsg`, which the game gives a page that set `window.GSG_TEST` first (end of `core/testing-env.js`). End it with a line saying whether it passed and `process.exit(1)` if not. The older suites splice a `window.__t={...}` list over the script's last line; most read the stand-in three.js from `tools/tests/stub-three.js`.

The audits, the performance and picture tools, how the older suites are put together and what every suite covers are in `docs/code/tests.md`.
