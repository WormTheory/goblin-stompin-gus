# Simple block light (Minecraft-torch style)

Research only, no code changed. Written 19 Nov 2026 against the source on Thomas's PC (`src/js/render/meshing.js`, `render/daynight.js`, `core/blocks.js`, `dressing/street.js`, `dressing/props.js`, `render/fires.js`, `net/net-sync.js`, `ui/saves.js`).

## Recommendation in one paragraph

Add a **block-light flood fill that runs inside `buildChunk`** and bakes a light value into each vertex. Nothing new gets stored: no light arrays kept per chunk, nothing in saves, nothing sent online. The night shader changes from "darken by `WORLD_LIGHT`" to "darken by whichever is brighter, `WORLD_LIGHT` or the block light here", so lamps only show once it gets dark and daytime looks exactly the same as now. Light sources are glow blocks plus street lamps and lamp props, added as "virtual" emitters. Moving things (car headlights, fires, explosions, muzzle flashes) are handled separately by a few dynamic lights in the shader, not by re-meshing. Skip sky light for now. **Rough effort: phase 1 is one medium thread (about a day of work, mostly tuning and testing). Phases 2 to 4 are small to medium each.**

## How it works today

- Chunks are 16 x 16 x 200 `Uint8Array`s of block ids (`genChunk`). `buildChunk` meshes one chunk and already reads its 8 neighbours (`NB`, `at()`).
- Each vertex gets a colour `s = face shade x AO`. Glowing blocks (`glow:true`: windows, neon, `LAMP`, `SCREEN`, `CRYSTAL`, `GOLD`, `STAINED`, `HOSPX`) get `s = 2` instead.
- `nightPatch` (one shader shared by `matOpaque`, `matDecal`, `matWater`): `diffuse *= mix(vColor*uLight, 1, glow)`. `uLight` is `WORLD_LIGHT`, which `updateSky` fades from white to `(0.20, 0.23, 0.34)` at night, darker in storms.
- Street lamps are **not blocks**. They're fixtures drawn by `fixDraw` with a `lit` flag (off once knocked down). Floor lamps, operating lamps and TVs are props with glow parts (`PG`).
- Car head and tail lights fade in through `emissive` in `updateSky`. Fires are instanced flame/smoke boxes (`addFire`).
- Edits go through `setRaw`, and smashing calls `rebuildSet(chunks)`. `flushRebuilds` re-meshes at most about 3 to 9 ms per frame.
- Saves and online play only carry block **edits** (`edits[x,y,z]`, `netSetBlock`), never mesh data.

## The options

| Approach | What it is | Fits here? |
|---|---|---|
| **A. Baked block light, computed at mesh time** (recommended) | Flood-fill light levels 15 → 0 out from emitters, through air and see-through blocks, stopped by solid ones. Write the level into a new vertex attribute. | Yes. It reuses the neighbour fetch the mesher already does and stores nothing extra. |
| B. Minecraft's way: stored light arrays, updated incrementally | Keep a light array per chunk (block light + sky light, 4 bits each). On an edit, run "remove light" and "add light" queues across chunk borders. | Not worth it. Chunks stay loaded out to view radius + 4, which can be thousands of chunks, so even 25 KB extra each adds up to hundreds of MB. Cross-chunk update bookkeeping is the hard part of Minecraft's engine, and A gets the same picture without it. |
| C. Real-time point lights only (shader or three.js lights) | Pass the nearest N light positions to the shader and light each pixel by distance. | Good for **moving** lights. Bad for the city's thousands of static lamps and neon blocks, and the light passes through walls (no flood fill means no occlusion). Use it only for dynamic sources (phase 3). |
| D. Light volume texture (3D texture sampled in the shader) | Flood fill into a 3D texture around the player, sampled per pixel. | Works, but costs more GPU memory and a texture re-upload on every edit, and needs a WebGL2 3D-texture path. It's more machinery than A for the same blocky look. |

### Sky light: not now

Minecraft's second light channel ("sky light") darkens caves and interiors **in the daytime** as well. Here that would change the whole game's daytime look (every building interior, subway and sewer goes dim), double the flood-fill work, and need sky light updates down every column you smash open. The existing `WORLD_LIGHT` already handles night. If Thomas wants dark caves later, a cheap version is possible: the mesher already finds each column's top (`tops[]`), so "under a roof" faces can be dimmed without a full flood fill.

## Phase 1 in detail (block light, baked)

**Emitters and levels.** Add `light:N` to the `BLOCK` table (Minecraft scale 0 to 15, where each block travelled loses 1). Suggested starting values: `LAMP` 14, neon 11, `HOSPX`/`SCREEN` 9, `CRYSTAL` 7 (it glows in caves), `GOLD`/`STAINED` 0. Windows (`WIN_WARM`, `WIN_GREEN`) are the one to watch. A tower facade has hundreds of them, so give them a low level (about 5) or none, and check the look and cost (see Costs). `glow:true` stays as it is: it decides whether the block itself is drawn at full brightness. `light` decides whether it lights its surroundings.

**Virtual emitters.** Street lamps: for each lamp fixture in or near the chunk, put an emitter of about 15 at the cell under its head (using `fixSpot`, while it's standing/`lit`). Knocking a lamp down rebuilds its chunk and the neighbours, which already happens through the fixture's chunk. Lamp props (`flamp`, `oplamp`, `dlamp`) get about 10, and TVs about 6.

**The fill.** `buildChunk(cx,cz)` gathers emitters from the 3 x 3 chunks around it (a level-15 light reaches 14 blocks, which is less than the 16-block chunk width, so nothing further away can reach this chunk). It then runs a breadth-first fill in a reused buffer the size of the chunk plus a 15-block margin, limited to the y range around the emitters (±15). Light passes through `AIR` and `B_SEE` blocks (glass, leaves, fences, water) and is stopped by `B_OPQ` blocks. Chunks with no emitters in range skip all of this (most of the countryside, and anything far from crystals underground).

**Smooth per-vertex light.** For each face corner, average the light of the 4 cells in front of it (the face cell plus `s1`, `s2`, `cc`: the same cells AO already reads, already listed in `FACE_T`). This gives Minecraft's soft gradient instead of hard steps, almost for free.

**Vertex data.** Add one attribute, `aBlk` (a normalized `Uint8`, 1 byte per vertex, or 3 bytes with colour in phase 2). `routeMarks`, `emitBox`, `emitRamp` and `emitFence` push a value too (use the light of the cell they sit in).

**Shader** (in `nightPatch`):
```glsl
vec3 lit = max(uLight, vBlk * uLampColor);           // brighter of moonlight and lamplight
diffuseColor.rgb *= mix(vColor * lit, vec3(1.0), glowV);
```
Use a curve such as `vBlk = pow(level/15, 1.6)` so light falls off like a torch rather than a linear ramp. `uLampColor` is a warm white (about `1.0, 0.85, 0.6`). By day `uLight` is about 1, so nothing changes. At dusk lamps fade in smoothly by themselves because `uLight` drops. Snow uses `uLight` too (`SNOW_FRAG`) and should take the same `lit`.

**Edits and explosions.** A changed block can change light up to 14 blocks away, so it can affect the neighbouring chunks too. In `rebuildSet`, for each edit that is **an emitter, or was lit** (light > 0 at that cell in the last build), add the neighbour chunks within 15 blocks. Keeping "was lit" cheap means keeping a small per-chunk bitmask of lit cells (51,200 bits = 6.4 KB) only for meshed chunks near players, or just a per-chunk "has light in range" flag (one byte). The flag is simpler, a bit more conservative, and good enough to start. In the dark, a big explosion in a neon street then re-meshes about 3 x 3 chunks instead of 1 to 2. That goes through the existing `rebuildQ` time budget, so the light can lag a frame or two behind the smash but won't stutter.

**Ships and the carrier** use the same `buildChunk` path, so they get lit with no extra work.

## Costs

**Measured.** A quick benchmark here (Node, plain JS, a 48 x 48 x 200 window, 35% solid blocks, one unoptimised fill):

| Emitters in 3 x 3 chunks | Level | Time |
|---|---|---|
| 20 | 14 | about 2 ms |
| 100 | 14 | about 6 ms |
| 400 | 14 | about 8 ms |
| 400 | 8 | about 4 ms |
| 1500 (window-heavy facade) | 6 | about 5 ms |

The work levels off once lit regions overlap, because a cell is only revisited when it gets brighter. With a flat typed queue, no array per step, clipping the window to the chunk plus 15 and to the emitter y range, expect roughly **0.5 to 3 ms extra per lit chunk** on a desktop. Chunks with no emitters cost nothing.

**Chunk loading.** City chunks will mesh noticeably slower at first load. If that shows up, the fix is to compute light only for chunks within about 10 chunks of a player. Beyond that, glow blocks still glow as today, but the spill isn't visible at that distance anyway, so far chunks get re-meshed as you approach. A Web Worker for meshing would remove the cost from the main thread entirely, but that's a bigger separate job.

**Memory.** Nothing per loaded chunk. Meshes grow by 1 byte per vertex (about 3% of the current 12 + 8 + 12 + 4 bytes), or 3 bytes with colour. There's one reused fill buffer of about 0.5 MB.

**Saves.** Nothing. Light is derived entirely from blocks, fixtures and props, which saves already rebuild. No `SAVE_KEY` bump is needed.

**Online.** Nothing new to send. Each machine fills light from the same blocks (already synced as edits) and the same time of day. Dynamic lights (phase 3) come from things that are already synced: cars, fires, blasts.

**Night tint.** It fits as shown above. The global `WORLD_LIGHT` acts as a floor (moonlight), and block light can only brighten from there.

## Later phases

- **Phase 2: coloured light (small to medium).** Fill R, G and B separately (each emitter has a colour: neon magenta, green, blue, red, warm lamps, cyan screens, red hospital cross). That's about 3 times the fill work and 3 bytes per vertex. It looks great on neon streets. You could fill one level and carry along a single "dominant colour" instead, which is cheaper but blends badly where two colours meet.
- **Phase 3: dynamic lights (small to medium).** A uniform array of the 8 to 16 nearest moving lights (position, colour, radius, optional cone direction) evaluated in `nightPatch`. To keep the blocky look, measure distance from the voxel centre (`floor(vWp)+0.5`) rather than the pixel. Sources: car headlights (a cone), tail lights, sirens, fires (`addFire`, flickering), explosion flashes (a bright flash that fades over about 0.3 s), muzzle flashes, Gus's or a vehicle's spotlights. There's no flood fill, so this light passes through walls. That's fine for short flashes and acceptable for headlights at short radius.
- **Phase 4: lighting characters and vehicles (small).** Goblins, Gus and cars use their own materials and wouldn't pick up block light. Sample the light at the model's position on the CPU (the nearest emitters within 14 blocks, or the dynamic-light list) and tint the material, so a goblin under a street lamp is lit and one in a dark alley isn't.

## Thomas's decisions (19 Nov)

- **Lit windows light the street** (and the rooms behind them). Most windows sit above street level, so a modest level (about 6 to 8) mostly lights the facade and the room, and only ground-floor windows reach the pavement.
- **Coloured light from the start**, so phase 2 is folded into phase 1.
- **It's a graphics option** ("Block lighting", on/off), next to the other graphics settings in options. When it's off, `buildChunk` skips the fill and writes no `aBlk`, and the shader is compiled without the light code (a `#define` set by `nightPatch`, so it needs a material `needsUpdate`). Performance and the picture are then exactly as they are today. Turning it on or off queues every loaded chunk for a rebuild through `rebuildQ`, which takes a few seconds. The setting should be saved in `localStorage` like the view distance. Dynamic lights (phase 3) can sit under the same switch or have their own.

## Risks and open questions for Thomas

1. **Windows.** Should lit windows light the street and the rooms behind them, or just glow? This is the biggest look and cost decision.
2. **Colour now or later.** White or warm light first (simpler), or coloured light straight away?
3. **How bright the night is.** With real lamps, nights could be darker (lower `lightNight`) so the lamps read better. That's a tuning question once phase 1 is in.
4. The fill treats leaves, fences and water as fully see-through. Minecraft dims light through leaves and water. That's an easy per-block "absorb" value if wanted.
