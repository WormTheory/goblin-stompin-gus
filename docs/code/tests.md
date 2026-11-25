# The tests and tools

Every audit, performance tool and suite, and how a test is put together. These notes were CLAUDE.md's; search `src/js` for the names in them. Keep them up to date with the code, with targeted edits.

## Audits, performance tools and how a test works

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
node solidaudit.js 12      # every building's blocks as really built against its total: any that could never count as destroyed (cut off by its block's edge, missing walls)
node debrisfloat.js 2      # rubble on a roof, then the building under it brought down: is any of it put back hanging in the air when its chunks are made again
node capaudit.js           # the capitol: every room can be walked to, its doors are really there and drawn, no prop in a wall or doorway
node carride.js            # drop on to moving vehicles: land, ride, no damage
node rampride.js           # riding real vehicles up and down real ramps
node planeride.js          # airports and airfields: placement by a city and its road, stand on a parked plane, ride a whole flight, clipping, pilots, security, wreck them
node parkzoo.js            # theme park rides and zoo animals: their health bars (`rideBarsEach`, read by `drawDbgOverlay`; sent online through `rideHpList`), attacks reach them, they break and die, and it stays that way
node coasterride.js 2      # riding the roller coaster: whole laps on a car, landings all round the circuit and from real heights
node coastaudit.js 500     # coastal places by kind, what each one has, which ports belong to whom
node boatride.js           # every kind of boat: stand on it, ride it, sink it, swim aboard; routes stay on open water; what's moored where
node vclimbt.js            # spider-climbing vehicles: grab a train, cars, a ship's hull and container stack, a plane; hang on while it moves, up on top, back over the edge
node vcrash.js             # crashes: ordinary traffic running goblins down, two boats on a collision course
node vcollide.js           # vehicles driven into each other (tank into a helicopter's tail, car into a plane, plane into a tank...): never overlapping
node drive.js              # goblin mode: E by a car, train, boat, tank, helicopter and plane gets in; driving each; E gets out (runs its Testing Environment half as a second process)
```
Performance tools: from `tools/tests`, `node toppleperf.js into 0` times every frame of a tall building toppling toward another (`SLOW=14` lists what made slow frames slow), `SPEED=20 node runperf.js 30` the same moving across the world, `node meshhash.js` hashes chunk meshes (compare before and after a mesher change). From `tools/ui` after `build_3d.py`: `node gpuperf.js` gives real frame rates on this machine's graphics card (`VIEW=2000 DETAIL=512` for far settings), `node frameprof.js 12345 idle|run|fall` a browser profile of the real game, `node drawcensus.js` what's being drawn, by kind, `node toppleperf3d.js` frame by frame during a topple with draw calls. From `tools/tests`, `SPEED=35 node spikes.js 45` names the functions behind each slow frame while moving. `X0=-46600 Z0=-42300 SPEED=20 node mtnperf.js 30` is runperf from a given spot, the player kept on the land's top (`landTop`), for the mountains. The cross-browser determinism check (plan section 13): `node crossdet.js` from `tools/ui` (Chromium through Playwright, then Firefox headless if it's installed) has each browser work out the same chunks and landscape numbers (`crossdet.html`, served by `crossdet.py`) and compares their hashes; it should say `different 0, numbers same`. `relo.js` needs `KIND=` and `MODE=home|move` to be useful (alone it just moves a hospital); `relocmp.sh` does the whole comparison.

To review the chains' logos: `node logosheet.js out.png` from `tools/ui`. To look at a spot in the real game: `python tools/build_3d.py game/index.html tools/ui/t3.html`, then `node tour.js scenes.js outDir [seed]` from `tools/ui` (set `TOUR_VIEW=800` to see that many blocks through the fog, and pass a wait of about 25000 as a fourth argument so distant chunks finish building).

How a test works (see the first ~40 lines of `tools/tests/dead6.js`, which is the standard header):
- **Loading the game.** `mkg.py` rebuilds `game/index.html`, then copies its main `<script>` (the one after the three.js tag) into `g.js`, so `g.js` is all of `src/js` joined up. Each test reads `g.js` and seeds `Math.random`.
- **Reaching internals.** A regex swaps the closing `requestAnimationFrame(frame);\n})();` for `window.__t={...}`, which exposes the functions that test needs. If you add an internal a test must reach, add it to that test's `window.__t={` list.
- **Stubs.** Next comes the stand-in three.js (read from `stub-three.js` by most suites; a few that need something different still carry their own `class Q{` … up to `const listeners=`), a fake `document`, `localStorage` and gamepads.
- **Driving the game.** `eval(src); const T=window.__t;` then `T.frame(now)` advances the game. `run(seconds)` is already defined in the header, so don't redeclare `run`.
- **New test.** Use `harness.js` (see CLAUDE.md, Running the tests) rather than copying a header.

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
`node fxorder.js [outDir] [effects]` (from `tools/ui`, after `build_3d.py`) checks the see-through effects draw in the right order: dust, smoke, blood, fire, smoulder, rings, cones, flashes and fireballs, each in front of each other, over the water and in rain and snow, frozen and photographed, each pair also drawn strictly far one first; where the two pictures differ the pair is flagged (`outDir/index.html` shows the shots with the difference, `report.txt` lists them with every see-through material's renderOrder, depthWrite and depthTest; exits 1 if any are flagged).


## What each suite covers

- **Core suites:**
  - smoke (boot, chunk gen timing, no errors)
  - assets (every file in src/assets passes its check and keeps its layout, the game's tables match the files, weapon hitboxes against hurtboxes, the editor's live preview, the light vehicles' files and rider clips)
  - maptest / maptest_sea (world gen sanity)
  - spawnt (spawn point)
  - devtest (dev tab and sandbox: every move, Gertie the same as Gus, Gnash's moves, every enemy animation)
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
  - siteorder: the plan asked in four orders (rows forward and backward, columns backward, shuffled), everything remembered thrown away between: each plot's big site, farm, dump, bunker, type, turbine, airport, whether it's open and its height must come out the same, and chunks made in two orders the same blocks (last line `all ok`)
  - snowroad: roads in the snow (`roadLanes`): a street's corners count 0 at the kerbs to 4 in the middle, the pavement is ordinary, a crossroads is churned, a column with a `snowBorn` time is left alone, nothing with `snowRoads` off, a country highway goes by its distance from the route's line, and what it adds to a chunk's rebuild (last line `all ok`). `node snowshot.js outDir [levels] [seed]` from `tools/ui` (after `build_3d.py`) photographs streets, a crossroads, a deck, a motorway and a country highway at each snow level (`OLD=1` as it was before, `ONLY=name,name`)
  - nukesnow: big blasts with snow lying: every column of the crater melted (loaded or made later, and after the save's loaded again), Gus's snow off, nothing outside it touched; no lawn or pitch left green at the capitol or a stadium, rubble on the stands, a town railway's rails torn up; no snow noted with none lying (last line `all ok`)
  - bigblast: a town-sized blast (R 160, `R=` to change it) at the starting city: the old single crushBall's frame for comparison (`OLD=0` skips it), the job's worst frame of blast work and of the whole frame, what it took and the save's size; online, the guest's blocks against the host's after it's all settled, and the host's save loaded again against the host (both should say `different 0`)
  - nukeship: the Nuke Launcher at sea and on the carrier: a warhead into the open sea going off at the surface (its worst frame; `LAND=1` the same on land to compare, `COAST=1` sea near land), a carrier nuked from the sea beside a deck weapon (holed, the weapon wrecked and fallen into the sea) and on its flight deck (sunk); `ONLY=sea|side|deck`
  - waterflow: water pouring into holes knocked under and beside it: a shaft and a room under the sea bed fill, a 500-block cavern fills to the last block, a small tank spills no more than it holds, a walled pool broken at its surface fills the pit beside it no higher than that, a dry hole stays dry, the host sends the water to a guest, and a tunnel reaching a chunk not yet made waits at its edge and goes on once it's made
  - floatdebris: rubble lying on a building that then collapses under it is gone from the edits too, so a chunk made afresh has none of it floating (every line should say `made afresh 0`)
  - desolate: a town wiped out (every building destroyed) is left empty: from its middle, no traffic, parked cars, police, services, goblins, townsfolk or staff; out on a road into it, no route car heading in (`KIND=` picks the kind of place)
  - falldir: which way a collapsing building falls, from its outer walls (`SC=stairs` should all drop straight, `SC=east` and `SC=eastwall` all tip 1.00,0.00)
  - bob: rocket pose
  - rollt / rollw / lockroll: roll
  - ljd: long jump vs dash
  - substair: subway station stairs: stair blocks the whole way down, and a goblin chasing Gus up them and back down
  - adt: air dash
  - edge: momentum off edges
  - crt: crash landing
  - spk*: ground spike
  - spiderclimb: climbing on to pillars, one-block-deep ledges and walls, at each height and in all four directions (every line should say 4/4)
  - climbedge: the odd ways of climbing: at an angle, mid-jump, sprinting, low frame rates, crawling round corners, climbing down, setting off from the top, and narrow things really in the world (a few 'BAD' lines there are places too cramped to stand)
  - sitet: Structures: every kind captured and its file round-tripped, one switched on and checked block for block in every lot of its kind, each of the four turns, its props, people and parked cars in place of the plan's, switched off again
  - pathmode: Options' Goblin pathfinding: Advanced climbs after Gus on a wall and a roof, Simple never jumps, climbs or builds a route map but still runs him down on the level; switching to Simple mid-climb drops the goblin unhurt
  - wallfight: fighting from a wall: R1 snaps the way the head points, stomp kicks through into the room behind (or a hollow in rock); Gertie and Gnash too
  - mech: the Mobile Gear: walk and skate speeds, quick boost distance and cost, redline, jump and flight, boosted falls, ledges, ramming through walls, feet on the ground in every pose and the leg joints never jumping, turning on the spot (steps, the planted foot not sliding), the legs swept back in flight, setting off slowly into a jog, thrusters by direction, each weapon (rounds, reload, the blade's lunge, its right-to-left sweep (who it reaches round it) and cut through a wide wall, rifle rounds breaking blocks about half the time, Infinite ammo, the debug menu's vehicle spawning, missile locks and hits, the cannon's brace, crater and recoil), the lock box, hard lock turning the camera, leading a moving target, trampling, holding to get out, damage and wrecking,, the assault boost (charge, dash, climbing, through a wall), the kick, impact and stagger on a tank and on itself, repair kits, and Gnash and Grizzle piloting it the same
  - boatdrv: driven boats: the throttle's notches (tapped, swept, kept), planing and hops off waves, the anchor stopping and swinging it, the rowboat's oars (each alone turning, a rhythm faster), the pedalo, each kind's special, the wind (a ship's anchor isn't covered yet)
  - traindrv: driven trains: the lever's notches (tapped and swept), power and braking distance (B5 against the emergency brake), the reverser only when stopped, neutral, a bend's safe speed on the instrument, squealing over it and derailing far over it; a subway train on the same lever
  - balt: the hot-air balloon: the burner's lag, the four wind layers on the way up and drifting with the one it's in, sandbags (lift, running out, flattening a goblin), the rope (goblins grabbing it, three at most, climbing, weighing it down, tearing at it from the basket, pulled up), shot down letting them go
  - helit: a driven helicopter: the spool-up, Simple mode's tilt before speed and flare to a hover, Agile mode (collective, pedals, the camera tilting it into flight and a strafe), the rotor mincing a goblin and chipping a wall, the engine failing and autorotating to a flared landing
  - tankt: a driven tank: the tracks' weight, pivoting and wider turns at speed, the cruise steps, the bloom and the crosshair growing, HE against AP on a wall, the gunsight, hull lock, tilting on a ramp
  - planefly: each plane (airliner, two-seater, jet) in Direct mode: a whole roll, a loop (upside down at the top, back to level); in Mouse-aim a turn to a heading, a climb, free look and a landing; the jet's barrel roll, afterburner and G-vignette, the two-seater's smoke, the airliner's autopilot, belly landings with the gear up
  - roadt: the keyboard's throttle easing on, the handbrake, a drift's charge and boost, a lorry that can't drift, each road vehicle's special (headlights dazzling a goblin, nitro, launch control, wheelie and stoppie, hop, hazards, air brakes, siren), looking behind, tipping the nose in the air
  - farmlift: the forklift's forks up, down and tilted, a crate picked up and set down on a ledge, a goblin and a car lifted, lancing, tipping over and being righted; the tractor's cruise steps, the plough's dirt and the goblin it throws, the mower, the bare hitch
  - collide: vehicles by mass: rear-ends, T-bones, a bus against a car and the other way round, side-swipes, a rear corner spinning a car, a van tipped over, walls (glancing, head-on, a bus through one), your own car spun but still steering, a forklift and the car on its forks as one body, each light vehicle hit and its rider thrown, the hippo trampling and being run into, a car's wreck sliding into a parked car, a spinning car's wreck spinning on, a car driven into a parked plane
  - lightveh: the light vehicles, each spawned, got on and ridden its own way (the bicycle's cadence and tapped sprint and tiring legs, the kick scooter's kicks, coasting and ollie, the Gobway's lean, pushback, turning on the spot and low battery, the motor scooter's twist and go, indicators and running out of fuel), its instrument and controls, off into a wall, got off
  - newveh: the supercar (its share of the traffic, top speed), forklift spots at factories (and parked there), tractor spots on farms (clear of the buildings and field, parked there, stood on), the tractor's top speed, the hovercraft over a pool (a car sinks) and sliding round a turn, the fighter jet against the airliner (take-off, speed, roll, cannon, a missile at a locked tank), the hot-air balloon (burn, drift, vent, land, stood on, shot down)
  - spawnlist: the debug menu's and the Testing Environment's vehicle list: the two-seater and every boat (`TENV_BOATS`, `tenvBoat`) spawned, got into and driven, the dropdown's entries, Clear taking the boats away (`WORLD=1`: in an ordinary city, from a shore). `tools/ui/dbgmenu.js` steps the dropdown with a controller and swaps between controller and keyboard
  - mechload: the Mobile Gear's loadout: the panel's choices, a new one carrying it and an old one keeping its own, a bad save mended, the online code, and the other weapons firing (left-hand rifle, shotgun, rocket volley, lobber)
  - cvworld: carriers out in the world: the naval bases' anchorages, one made as Gnash comes near (in open sea, crewed, its jets), general quarters on boarding, dropped once he's far off and back whole, knocked about and left (moved, holed, a weapon wrecked, a prop down, a jet moved) and back as it was, broken and left and back broken, kept while he's aboard, sunk and gone for good (and in the save), the next base's own; with CVSAVE=file then CVLOAD=file, the remembered one in a game loaded from the save
  - mechcoop: two goblin players, split screen, each in their own Mobile Gear: their own controls and display, walking and quick-boosting into each other without overlapping
  - gunseat: two goblin players in one technical, four-wheeler, tank and helicopter: one drives, the other aims and fires the guns; swapping seats alone; the gunner firing with nobody driving
  - carrier: the aircraft carrier: spawning it and drawing its chunks, what each deck is made of, its props (none in a wall or over nothing) and doorways, swimming aboard at the stern, every flight of stairs climbed by Gnash and by Gus, walking each deck end to end, the doors and props near Gnash (drawn, hung off the ship, opening as he walks through), driving from the helm (the engine orders and the speed building toward them, the rudder and the turn that keeps going, stopping, the bridge view, running aground and backing off, ramming the barge), goblins chasing aboard (one finding its way up from the lower deck to the flight deck), its health from smashing, a hole below the waterline and a shell from outside, a prop going when its floor is smashed, Gus knocking a prop over, a blast from outside the hull smashing its blocks, vehicles aboard (a car, tank, helicopter and Mobile Gear spawned on the flight deck, the car driven along it and riding while it sails, the helicopter flown off the side and landed back, a tank shell fired over the side, the Mobile Gear boarded from the deck, its rifle and Heat Cleaver on the deck and a goblin aboard), breaking up (blasts across the hull near the stern till the stern end breaks off, Gnash riding it down, it tipping and going, a row of craters in the flight deck breaking nothing), its crew and deck weapons (posts standable, quiet in Peaceful, general quarters on boarding and every weapon crewed, firing on a player out at sea, rockets shot down, standing down, a Sea Sparrow at a locked tank, a player at the CIWS shooting down a rocket), its jets (parked on the deck, climbed into, a catapult launch, a hook-down landing caught by a wire and a hook-up one that rolls off into the sea, pilots at general quarters launching, flying at Gnash and landing back on the wires and being towed home), and sinking
  - ship: the Testing Environment's barge: the sea laid out, its pocket chunks hung off the ship, swimming aboard up the stern steps, walking and the stairs to the wheelhouse roof, driving from the helm (speed, turning, the chase camera behind it), standing still aboard while it coasts, goblins chasing on deck, a goblin swimming out and climbing aboard, smashing the deck, swimming off, clearing it away
  - turbfall: wind turbines toppled at the base and smashed at the top: the rotor rides the falling piece, lies flat where it lands, and is still there after coming back
  - bulletglass: how often a round breaks each kind of block (glass, planks every time; brick, concrete, metal about half)
  - wreckslide: wrecks keep going: a plane into an office block (partway in, nothing left inside it), cars, a bus, a tank and a Mobile Gear into walls (bedrock stops them), a driven car's own velocity, a crawl, light against heavy, a helicopter shot down, a forklift with a car on its forks, a shell whose platform is knocked away (every `floating` should be 0.00)
  - vclimbt: spider-climbing vehicles (see Climbing vehicles); vcrash: vehicle crashes; vcollide: vehicles driven into each other
  - lowfps: charge input at low frame rates
  - negdt: a stale first frame timestamp mustn't trigger a stomp
  - loadt2: load-in doesn't break blocks
  - wv / lodt: wind farm LOD
  - stt: structures list
  - stdress: the structures previewer dresses what it shows (counts of lamps, props, doors, signs, venues per kind)
  - propaudit: props per kind of structure (count and per thousand square blocks), to find bare ones
  - campfire: campfires only burn someone standing on the wood (Gus, goblins, cultists by the altar), and campsite motorhomes park and can be wrecked
  - obt: obituary preview
  - proft: the profiler: nothing timed while it's off, every system's names timed on, a slow frame caught with what was happening (a blast, a crater, the name that was slow), a frame's systems adding up to its CPU time, off again
  - chat: online chat and voice: a line typed by a guest reaches the host and back, typed keys never move the hippo, length, plain text, rate limits, the Options switches; with voice off no microphone, AudioContext or audio track; voice on at both ends, push to talk, My voice's volume, Others' voice off and on, a refused microphone, My voice off, voice off letting it all go
  - sndlist: the debug Sound list names each sound itself (tank fire, dry-fire click, reload, helicopter gun, rocket and rotor, blocks breaking), and no name sticks to the sounds after it
  - minehit: landmines set off by stepping on them (Gus, Gertie, Gnash, his own only after he's stepped off), by every kind of player attack, rounds, blasts in a chain, a grenade, a fireball and vehicles over them; Infinite ammo on grenades, landmines and magazines (every line should match its bracket)
  - knockall: street fixtures and props knocked over by each kind of attack (`knockAt` beside every player attack's area through `pvpArea`, blasts through `foeBoom`, the bite, roll, dashes and wall bite's own loops; `knockRay` for bullets in `fireRound`, which stop at the post, and for shells, rockets and a player's fireballs in flight); every line but the roof and the misses should say `down`
  - launchert: the rocket launcher: fired straight, locked on a car through its sight (and not on a goblin or a car out of the cone), a locked rocket homing in when fired off to one side, the lock button's lock, an enemy's rocket chasing a player in a vehicle, an old loadout's bazooka switch carried over
  - swimt: floating at the surface, diving with climb held and coming back up, a stroke at the surface; Gus, Gertie and Gnash alike (a passing boat can lift a stroke)
  - mechwater: the Mobile Gear boost skating across a pool (staying up even stopped on it), dropping in when the boost goes off or it walks in, and the picture easing over one-block bumps
  - weapons2: the weapons added later (katana, large club, shotgun, assault rifle, sniper, rocket launcher, landmines) and reloading: each gun emptied and reloaded, the reload button, switching away, each weapon on thieves, mines planted and set off, drops, the loadout, the first-person reload; then a made-up enemy kind for each (bursts, reloads, rockets, mines planted and going off) and every Dev tab animation they'd get
  - gobarms: Gnash's dash, club, dagger and rifle (a wall stops a shot), what the enemies he kills drop and picking it up, grenades stacking and thrown, the controls hint, and a hippo having none of it
  - mixcoop: co-op with one hippo and one goblin: names, bodies and models per player, both moving as their own kind on the same inputs, cameras and hints, only the goblin's kills dropping things and only he picking them up, player two's pick
  - twins: Gus and Gertie (and Gnash and Grizzle) do exactly the same things on the same inputs (see Characters)
  - pvp: PvP off and on: each attack by Gus, Gertie and Gnash on another player (nothing with it off but blasts, every one landing with it on), a kill named in the obituary, your own blast not blamed on you, lock-on to another player
  - cult: cultists: alive and calm at the altar, roused by coming close or hurting one, fireballs from range (counts thrown and hits), daggers up close, the dead stay dead, the Testing Environment's Cultist button
  - crews: the militia's vehicles parked empty, its people running out and boarding, one killed on the way replaced, the crewed ones circling and firing, a wreck throwing out its crew; the base's soldiers running to the tanks, empty ones staying put, a killed runner's tank waiting its turn, crews thrown out of a wreck and climbing out after standing down; the Testing Environment's Technical and Quad buttons
  - rampt: This rampage's buildings demolished (once each, none by accident) and settlements razed (not one already in ruins), the card's figures, and the debug menu's Info pane and the status card beside the clock
  - netcv: online co-op with a carrier out in the world: the guest's copy (and none of its own), broken on the host, both leaving and coming back to the remembered one (same length, blocks, wrecked weapons and jets), a player joining late
  - copgun: police with their handguns: drawn and fired from range (bullets, hits, frames with the gun out, the recoil), the club up close, holstered when hostility's turned down
  - site: compound guards (thieves, preppers, militia) calm then roused, rifles, bombs and daggers; base armour: alert on entry, tanks and helicopters hunting and firing, never overlapping, a goblin run down and a car shoved, destroying them, wrecks saved, standing down; the Testing Environment buttons
  - tenv: Testing Environment: boots empty and flat, nothing spawns on its own, structures spawn in front of Gus (wherever the camera looks) with their dressing, enemies spawn ahead of Gus, removing one leaves grass, tanks and helicopters hunt, Reset world empties it
  - netship: online co-op with the Testing Environment's barge: the guest's copy in the same place, both players aboard and drawn there, the guest sailing it from the helm (and its bridge view), a goblin aboard, a hole in the deck, a player joining late, sinking, the guest walking off the side, a new one in the same slot; then the carrier: the guest manning a deck weapon, one wrecked, a jet moved and hurt, furniture knocked over, breaking in two (the same blocks, a late joiner, the wreck tipping under on both); clearing it
  - net: online co-op, a host and a guest each a whole game in its own sandbox, joined by an in-memory network: the guest builds the host's world, its controls move its hippo, snapshots show goblins, cars, venues and falling buildings, smashing matches block for block, driving, a slow network (the guest's own guessing, lag compensation), a bumpy network (the host's hippo and traffic still move smoothly on the guest), a dropped connection coming back, PvP following the host's switch, leaving
  - netgun: online, a guest's goblin: its own rifle shot's tracer at once (and once, and gone), its nuke warhead flying on the host and drawn flying on the guest (`netShots`), stealing a car and a motorcycle (its own goblin posed as the host has it, `netGk`), drivers dressed their own way (`dhSync`) and the one hauled out dressed the same
  - guards: what every vehicle, gun and enemy kind should all do alike, checked for each: vehicles (each kind the debug menu spawns, and a carrier's deck weapon) gather snow, show health, take a round fired at their driver, are covered by Invulnerability, give points when destroyed and have their health sent online; every enemy gun hurts someone on foot, hurts a driver's vehicle instead of the driver, and is stopped by walls (and a vehicle's gun at a goblin); blasts and shells against each kind of vehicle box; every `FOES` kind has the fields the AI reads and a place in the Dev tab's enemy list. Known gaps are listed in its `EXPECTED`, so the last line should say `no new gaps`; a fix prints FIXED, and its line should then be deleted
  - wxregion: weather by region: each spell in each biome (spring and winter), rain as snow high on a mountain, a player in the desert in a storm getting a sandstorm, the cold map under them, the snow lying in each biome through a clear summer, a winter's snow and summer rain (the tundra and ice fields always white, the desert never), where winter freezes, the bands in the online clock
  - biomelife: places by biome (size), a town per biome (walls, roofs, shops), what goblins wear per biome, the banner out in the open and in a place, the nearest of each biome site (blocks, props, parked cars), no farms in the ice fields
  - wonders: the nearest of each landmark (built, how high, what where-you-are calls it), stone arches (open under the span), waterfalls (the drop, water down the face and in the pool), sea stacks and a sea arch (rock from the bed to the planned height, water under the arch), a glacier, a fjord wall (the land's height and the water's depth beside it), a tarn in the far view
  - coastbio: the nearest natural shores of each flavour (sand, shingle, ice shelf, mangroves, red sand) and rugged ones, and what's built there: sea ice and how far out, mud, mangrove wood, shingle, red sand, and how high the land stands by the water
  - crowdperf: `node crowdperf.js 50,400,800` times `updateGoblins` and a whole frame with that many goblins bunched up, and checks they still push apart (draw calls need the real renderer: see Real rendering)
