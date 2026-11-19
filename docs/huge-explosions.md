# Huge explosions that run smoothly

*Research only, no code changed. Written 19 Nov 2026 against the current source on Thomas's PC (`src/js`, build of `game/index.html` from 18 Nov).*

## The short answer

Yes, a town-sized blast (the nuclear plant going up) can be made smooth. Today it would freeze the game for about **3 seconds** and send guests about **6 MB** in one message. The fix is to stop treating it as one very big `crushBall` and treat it as a **job**:

1. **Spread it over frames as a visible shockwave.** Carve outward ring by ring, a few milliseconds per frame, so the hole grows over about 1 to 2 seconds. That looks better, and the freeze is gone.
2. **Carve whole chunks at once.** Write straight into each chunk's block array and do the bookkeeping (snow, goblin paths, building counts, water) once per chunk, not once per block.
3. **Don't simulate what's already gone.** Buildings entirely inside the blast are just gone, counted as destroyed in one step. Collapse physics only runs on the ragged edge.
4. **Save and sync the crater as one shape, not as 300,000 blocks.** Store `{centre, radius, shape, seed}` the way `collapses` already stores a fallen building, and have chunk generation and guests carve it themselves.
5. **Cap the side effects.** Use one big fireball, mushroom cloud and shockwave ring. Set a fixed budget of debris, fires and sounds, and don't start chain reactions (cars, gas pumps) inside the blast.

Rough effort: **Phase 1 (smoothness) is medium**, about one focused thread. **Phase 2 (saves and online) is medium**. Phase 3 (extras) is optional. Details and costs are below.

---

## 1. How a blast works today

All the block-breaking shapes (`crushBall` in `render/fires.js`; `crush`, `crushDisc`, `crushShape` in `destruction/smashing.js`) follow the same pattern, all **in one frame**:

| Step | What it does | Cost at scale |
|---|---|---|
| Loop every cell in the bounding box | `get()` per cell (3× `Math.floor`, chunk lookup, leaf check), `hash2` for the ragged edge | ~2M cells at R=80, ~8M at R=160 |
| `setRaw` per block | `shipDent` check, `noteRemoved` (string key `x+','+y+','+z` looked up in `edits`, then `bldgAt` + `blockAt` to count building damage), **while snow is on the ground it scans every block above, up to H=200**, `navCols.delete`, leaf queue (string key), `wfNoteRemoved`, `tileTops` | the biggest per-block cost |
| `addEdit` per block | string key into `edits`, push into `chunkEdits`; **online, the host also pushes 4 numbers per block per guest** | memory and garbage-collector churn |
| `ch.add(ckey(...))` ×9 per block | marks the 3×3 chunks round each block for rebuild | 9 set inserts per block |
| `save()` | debounced; IndexedDB per chunk (`wbWrite` only writes changed chunks) | fine |
| `destroyFX` | already capped at 90 to 120 blocks | fine |
| `settle(broken)` | for every building touched, each touched floor scans the whole footprint with `blockAt` to check for collapse; then `dropFloating` from **6 neighbours of every broken block** | grows with the number of blocks broken and buildings touched |
| `collapseBuilding` / `makeTopple` / `makeBody` | builds falling-piece meshes, `ruinFires` (up to 18 fires plus smoke plumes per building) | per building at the edge |
| Knock-ons | `pumpsHit` (gas pumps, already staggered via `pendingBooms`), cars inside go through `explodeCar0` → `crush` + chain to nearby cars | can cascade |

Chunk **mesh rebuilds are already handled well**: `rebuildSet` queues them and `flushRebuilds` spends 3 to 9 ms a frame on them. That part needs little change.

**Online:** the `addEdit` wrapper in `net/net-sync.js` appends every block to the guest's `out` list, and the next snapshot sends **all of it as one JSON message**. On the guest, `netSetBlock` applies every block in one frame. The connection is reliable and in order, so player and goblin updates queue behind the big message too. There is one helpful precedent: a **building collapse is already sent as `['c', key, floor]`**, not as blocks, and the guest rebuilds it from the plan. The same idea scales to blasts.

## 2. Measured: where it breaks

I ran `crushBall` at the starting city with the game's own Node test harness (the same setup as `tools/tests/smoke.js`), at growing radii, in the cloud container. These are relative numbers. A real browser adds GPU uploads and effects on top, so treat them as a floor.

| Radius | Blocks broken | Frozen frame | Edits JSON | Online burst (est.) |
|---:|---:|---:|---:|---:|
| 10 | 243 | 12 ms | 4 KB | 5 KB |
| 20 | 2,600 | 54 ms | 35 KB | 58 KB |
| 40 | 10,100 | 134 ms | 134 KB | 220 KB |
| 60 | 23,600 | 298 ms | 323 KB | 525 KB |
| 80 | 50,000 | 761 ms | 677 KB | 1.1 MB |
| 120 | 159,000 | **1.65 s** | 2.3 MB | 3.5 MB |
| 160 | 293,000 | **3.2 s** | 4.2 MB | **6.4 MB** |

(A full `crushShape('sphere')` at R=40, which also digs below ground, broke 129,000 blocks in 312 ms. A real nuclear crater going into the ground would be heavier than the `crushBall` rows, because `crushBall` only digs 2 blocks below its centre.)

A CPU profile of the R=80 blast (690 ms) breaks down like this:

- `settle` **339 ms**: half the cost. It checks building floors and collapses (`collapseBuilding` 120 ms) and searches for floating pieces (`dropFloating` 74 ms).
- `setRaw` + `noteRemoved` + `addEdit`: **~215 ms** of per-block bookkeeping.
- The loop itself (`get`, `hash2`, chunk-key strings): **~160 ms**.
- Garbage collection: ~380 ms across the run, mostly from the per-block string keys.
- After the blast, goblin path rebuilding (`navExpand`) took ~400 ms spread over later frames.

So the problem isn't drawing. It's doing per-block bookkeeping and collapse physics on hundreds of thousands of blocks in a single frame, and then shipping every block online.

## 3. How other voxel games handle it

- **HBM's Nuclear Tech (Minecraft mod)** went through several nuke algorithms. The useful lessons from [its author's write-up](https://hbmmods.github.io/blog/20240705-algorithm.html): an early version ran the blast as a job "tied to the updates of an invisible controller entity", removing it layer by layer over ticks so the world never froze. The later version groups the work **by chunk**: rays are bucketed per chunk, chunks are processed **in order of distance from the centre**, duplicates are removed per chunk, and each chunk is touched once. That roughly halved the time for their biggest bomb. Both ideas carry straight over.
- **Teardown** [doesn't send voxel data at all online](https://80.lv/articles/teardown-developer-breaks-down-multiplayer-and-voxel-destruction-tech), because it's "simply too much data". The server sends **destruction commands** and every client applies them the same way, in the same order. Physics (falling pieces) still uses normal state sync. Players who join later get the queue of commands. This hybrid is exactly what Gus already has in miniature: collapse keys plus synced falling pieces.
- **FastAsyncWorldEdit (Minecraft)** gets its speed from [region operations instead of per-block `setBlock`](https://github.com/boy0001/FastAsyncWorldedit/wiki/Some-tips-when-using-the-FAWE-API), from working on whole chunks at once, from compact block sets instead of hash sets of objects, and from switching off side effects it doesn't need. Minecraft's own protocol does the same on the wire: one "many blocks in this chunk section changed" packet, or the whole chunk again for very large changes, rather than a packet per block.
- **Common practice** across voxel engines: a budget of milliseconds per frame for edits and remeshing, closest first; fixed pools for particles and debris; and a few big billboard or mesh effects (fireball, cloud, ring) rather than per-block effects for very large events.

## 4. Recommended design

### 4.0 Blast shape (Thomas's choice: flatten, with a crater at the centre)

- **Crater** (centre, about the inner 15 to 20% of the radius): a shallow bowl dug into the ground, with a scorched floor and a raised lip of rubble. This is the only part that breaks underground blocks.
- **Flattened zone** (out to about 70% of the radius): everything above ground is removed down to one or two blocks above street level. A few ragged wall stumps and foundations are left on purpose (chosen by `hash2`), so the town still reads as ruins.
- **Damage ring** (the outer 30%): buildings lose floors from the top and the side facing the blast. The edge is ragged, and only buildings here go through collapse physics (4.2).
- **Cost:** flattening only removes what is above ground, so it breaks far fewer blocks than a full ball or bowl. The crater adds a small, fixed amount of underground digging. In saves and online the whole thing is still one record, `shape:'nuke'` (4.3, 4.4).

### 4.1 A blast job (`bigBlast`)

- `bigBlast(x, y, z, R, opts)` creates a job rather than doing the work. `crushBall` keeps working as it does for anything small (say below R≈12), so grenades, cars and shells are unchanged.
- The job works out the list of chunk columns the blast touches, **sorted by distance from the centre**. Each frame it processes chunks until it uses up its budget (start at **4 ms a frame**). It never processes chunks further out than the shockwave has reached, with the ring moving at a set speed (for example 120 blocks a second). So the crater grows visibly, and the screen shows a shockwave rather than a freeze.
- **Per chunk:** a tight loop over the cells inside the shape, writing **straight into the chunk's `Uint8Array`** (no `get`/`setRaw` per block). The ragged edge stays deterministic through `hash2`. Then the bookkeeping runs once for the whole chunk:
  - recompute that chunk's `tileTops` and its snow tops (no per-block scan up the column);
  - invalidate goblin paths for the chunk's columns in one go;
  - note water edges only where the crater meets water;
  - add the chunk and its neighbours to `rebuildQ` once.
- **Chunks not loaded yet** are skipped. They get the crater when they're generated (4.3).
- **The pocket for ships:** keep the existing `shipSmash` hook, run as its own job in the ship's frame.

### 4.2 Don't simulate what's already gone

- **Inner zone** (the solid part of the ball): any building whose footprint lies entirely inside is set to `collapses[key] = G+1` and counted destroyed in one step, with `rampBldg` called once. No `settle`, no `collapseBuilding`, no falling meshes. It was vaporised.
- **Edge band** (the outer few blocks): only these blocks feed `settle`, **and each touched building is checked once per blast** (today a building can be checked again for every floor and every call). `dropFloating` starts from the edge band only, not from 6 neighbours of every broken block.
- Building damage counts (`noteRemoved`) for edge buildings are queued with the existing `noteQ`/`flushNotes`, which already spreads them over frames.

### 4.3 Craters as shapes (saves and chunk generation)

- Add a saved list `craters = [{x, y, z, R, shape, seed, n}]` beside `collapses`, where `n` is a running sequence number.
- `genChunk` carves every crater that overlaps the chunk **after** the plan and **before** applying `chunkEdits`. Blocks placed after the crater (rubble, a car hulk, anything rebuilt) are ordinary edits and land on top correctly.
- When a crater is recorded, delete existing per-chunk edits inside its volume. They're under the crater now, and this keeps saves small.
- The save grows by **one small record** instead of ~300,000 edits (about 4 MB packed today).

### 4.4 Online: send the command, not the blocks

- The host sends `['X', x, y, z, R, shape, seed, n]` once, the way `['c', key, floor]` is sent for a collapse. Each guest runs the same `bigBlast` job under `NET_APPLY`, so its crater grows in step with the host's.
- The carve must be deterministic: only `hash2` and the blast's seed, never `Math.random` (the current `crushBall` carve already meets this; only its effects use `Math.random`).
- Everything with physics stays host-owned and synced as now: falling pieces (`'t'`/`'b'`), edge-building collapses (`'c'`), knocked props (`'k'`), damage, vehicles.
- Late joiners already get the save, which now includes `craters`, so they build the crater as they generate the chunks.
- **Cost:** about 60 bytes instead of ~6 MB, and no stall of the snapshot stream.
- Separately worth doing even without the big blast: cap or split the host's `'e'` burst over several snapshots, so any large edit (a big building collapse, a long tank rampage) can't block player updates.

### 4.5 Effects, fires and chain reactions on a budget

- **Look:** a white flash plus screen shake; one expanding fireball (scaled `blasts` pool mesh); a mushroom cloud made of ~40 to 60 large smoke puffs from the existing instanced smoke pool (`smokeP`), rising and spreading over ~20 s; a ground-level dust ring and a shockwave ring mesh moving with the carve front. Each frame, `destroyFX` on a **sample** of the chunks just carved (for example 20 blocks per frame, closest to the camera) so debris flies off the edge as the ring passes.
- **Fires:** a fixed budget for the whole blast (for example 25 fires and 4 tall plumes, placed round the rim), instead of `ruinFires` per edge building. Fires are sent to guests once a second as JSON, so the count matters online too.
- **Chain reactions:** cars, gas pumps, mines, fuel trucks and so on **inside** the blast are destroyed quietly: wreck model, no `crush`, no `foeBoom`, no chain to neighbours. Things just outside the rim still go off as normal through `pendingBooms`, staggered.
- **Props and street fixtures:** inside, hide them in bulk. Just outside, `knockProps`/`knockFixtures` with the push pointing away from the centre.

### 4.6 People and vehicles

- When the ring reaches a player, goblin or vehicle, it takes falloff damage and gets thrown, once each. That's cheap: a distance check per entity per frame while the job runs. Shelter could count, for example less damage if `solidAt` says something solid stands between them and the centre. That's optional.
- Goblins inside the inner zone just die, with **corpses capped** (for example the closest 30 get ragdolls; the rest just disappear in the flash).
- Goblin paths: invalidate per chunk (4.1), and let path rebuilding (`navExpand`) keep its own per-frame budget. It was the largest cost after the blast in the profile.

## 5. Expected cost after the change

These are estimates from the profile, not measured on a finished version:

| | Today (R=160) | With the job |
|---|---|---|
| Longest frame | ~3,200 ms | ~4 to 6 ms of blast work, plus the existing ≤9 ms of rebuild |
| Total blast CPU time | ~3.2 s in one frame | ~0.3 to 0.6 s, spread over ~1.5 s (carving straight into arrays, no per-block strings, edge-only settle) |
| Picture catching up | n/a (frozen) | the chunk rebuild queue follows the ring. Roughly 300 to 400 chunks at ~3 ms each, at the existing budget of 9 ms a frame, so the outer edge's meshes trail the shockwave by about a second |
| Save size added | ~4 MB of edits | ~100 bytes |
| Online | one ~6 MB message, then every block applied in one frame on the guest | one ~60-byte command; the guest runs the same job |

## 6. Plan and effort

**Phase 1: smooth on one machine (medium).** Build `bigBlast` with the per-frame budget and the expanding ring; carve straight into chunks with per-chunk bookkeeping; skip the inner zone in `settle` and check each edge building once; cap effects, fires and chain reactions; add a Testing Environment button (for example "Big blast" with a radius slider) and a test suite that measures the worst frame. This is where nearly all of the improvement Thomas would notice comes from.

**Phase 2: saves and online (medium).** Add the `craters` list, apply it in `genChunk`, and prune edits inside it. Add the `['X', …]` command and run the job on guests. Spread the `'e'` burst over several snapshots. Test: the host and a guest end up with the same blocks after a blast (compare the chunk arrays), and a world saved and reloaded after a blast matches.

**Phase 3: the nuclear plant itself, and extras (small to medium, optional).** Hook the plant's destruction to `bigBlast` (a warning siren and a few seconds' countdown fit well); add a crater floor of scorched or glassy blocks; optionally a radiation zone that hurts over time. Meshing in a Web Worker is the next step only if very large blasts become common, because rebuilds already have a budget.

**Risks and open questions**

- **Guest determinism** depends on the guest's blocks matching the host's before the blast. They do now, because edits are synced in order, but any block that only one side changed (a local guess) would make the crater edge differ slightly. The host could send a checksum per chunk after the blast to catch that.
- **The far city view** (`far-city.js`) will need its own refresh so the town disappears from distant views too. Collapsed buildings should already be handled through `collapses`.
