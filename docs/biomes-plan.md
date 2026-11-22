# Biomes and landscape features: research and plan

*Planning only: no game code was changed. Written 22 November 2026 against `test` as it stood after the continents and oceans rework (SAVE_KEY `goblin-city-v98`).*

---

## 1. The short version

- **Split the work into "climate" and "relief" and do climate first.** Climate means temperature and moisture maps that pick each column's biome: its ground, plants, colours, snow and weather. Relief means the height of the land: hills, mountains, plateaus, valleys and lakes. Most modern generators keep these two apart, Minecraft since 1.18 included. Climate alone is low risk, because the world stays at today's height and nothing built has to move. It also gives the biggest visible change for the effort.
- **Keep `G` as a fixed "civil datum" (sea level and street level), and let the land rise and fall around it.** Towns, roads, railways, airports and sites all stay at `G`, which about 760 places in the code assume. Terrain gets flattened toward the datum near anything built, the same way `plainsH` already does near roads (today the most it does is a few blocks of rolling grass). Where a road or railway meets high ground it runs through a cutting or a tunnel, and where it meets low ground it crosses on an embankment or a viaduct. Rivers sit at the bottom of valleys, and where a river crosses a plateau you get a gorge. Lakes form wherever the land drops below the datum.
- **Pick biomes from a Whittaker-style table** (temperature × moisture), with a few overrides from height: alpine above the snowline and moorland on wet uplands. I suggest about **12 biomes** in place of the 4 on your list, with "tropical" split in two, and a few goblin-flavoured extras as an optional later phase.
- **Fake erosion with noise and don't simulate it.** Real erosion needs the whole map at once, but this world is infinite and built lazily, one chunk at a time. Noise that's damped by its own slope (Quilez), plus valleys carved along the existing river lines, gets most of the look. The new "erosion filter" technique from March 2026 is a good fit for a later polish pass.
- **The worry is the knock-on work, not the noise.** The far view (mountains have to show from a distance, and they're half the point), snow and weather becoming regional instead of world-wide, block IDs (about 100 left), saving and sending world settings online, and the test baselines.
- **Suggested order:** foundations, then climate and biomes on flat land, then relief, then landforms, then biome-aware towns, sites and weather. Each phase can be released and played on its own.

---

## 2. How the world is built today (what the plan has to fit)

From `src/js/world/*`, `core/setup.js`, `core/blocks.js`, `render/*` and the World Generator:

| Fact | Where | Why it matters |
|---|---|---|
| `H=200`, `G=44`, `CS=16` (chunk), `CELL=32` (plot) | `core/setup.js` | 155 blocks of room above ground, 44 below. Plenty for mountains. |
| Plains height `plainsRaw` is **four fixed sine waves**, not seeded: ±4 blocks, so every world rolls the same way | `country-sites.js` | Has to become seeded noise. It changes every world, so `SAVE_KEY` gets bumped. |
| `plainsH` scales relief to 0 within 14 blocks of roads, rivers, truck stops, farm lanes and any plot that isn't open plains | `country-sites.js` | **This is the flattening mask the whole relief plan builds on.** It works, it's cheap, and it's already shared with the far view. |
| Tree density `plainsCopse` and the earth layers in `earthCol` are fixed sines too | `generate.js`, `earthCol` | Same fix: seeded noise. |
| `biomeOf(px,pz)` returns `'sea' \| 'city' \| 'plains'` | `coast.js` | The name is taken. I suggest renaming it `realmOf` and keeping `biomeAt` for the real thing. |
| Continents come from `seaCont` (a warped, tanh-sharpened value, cached on a lattice in `SEA_CC`). `seaDeepK` measures how far out to sea | `coast.js` | **This is already a "continentalness" value.** Reuse it for "inland is drier" and for coastal mountain ranges. |
| `gridNoise` is value noise with smoothstep easing | `places.js` | Fine for climate. Mountains look blocky and axis-aligned with it, so add a gradient noise. |
| Settlements sit on a jittered grid of `SET_SP=36` plots (about 1,150 blocks). Rivers follow coarse lines `RIV_SP=1600` apart, water at `G-2`, `RIV_W=9`. They don't flow downhill, because there is no downhill | `places.js`, `routes.js` | Rivers stay where they are, and the relief is shaped around them as valleys. |
| Chunks are `Uint8Array` columns. **152 of 256 block IDs are used** | `core/blocks.js` | New biome blocks need a budget. Use tinting instead of new IDs where you can (see 7.3). |
| Snow: `WX.snowCover` is one number for the whole world. The season tint `SEASON_W` goes into the foliage shader for everything | `render/weather.js`, `meshing.js` | Needs to change so the desert has no snow and the tundra keeps it all year. |
| The far view builds its woods and ponds from the same rules (`farWoods` uses `plainsCopse`, `farPonds` uses `plainsRaw`) and draws boxes | `render/far-city.js` | It needs a height-field terrain mesh, or mountains won't show from afar. |
| The World Generator's sliders reach the game only through `window.GSG_SEA`. **The game itself never saves them**, and online guests rebuild the world from the seed alone (`saveText`) | `coast.js`, `gen-worker.js`, `docs/multiplayer.md` | World settings need to become part of the save and the online handshake before any slider is offered in the game. |
| A lot of code assumes the ground is at `G`: plane crashes clamp to `G+1`, `setRaw` notes air above `G`, caves stop at `CAVE_TOP=G-14`, and there are 763 `G±n` references across 19+ files | everywhere | The reason for the datum rule. |

---

## 3. What other games and procedural generation approaches do (research)

### 3.1 Minecraft 1.18+ ("Caves & Cliffs")
Since 1.18, Minecraft picks a biome from **six noise values**: **continentalness** (ocean to inland), **erosion** (flat to mountainous), **peaks and valleys / weirdness** (ridges, and variants), **temperature**, **humidity** and depth. Height doesn't come from the biome. It comes from **splines**, curves that map continentalness, erosion and peaks-and-valleys to height. Biomes are then matched to the nearest point in that parameter space. The upshot is that **landforms and climate are separate**: a desert can be flat or mountainous, and a mountain can be snowy or covered in jungle. Rivers are where a noise crosses zero. [Minecraft Wiki: Terrain](https://minecraft.wiki/w/Terrain), [Custom world generation](https://minecraft.wiki/w/Tutorial%3ACustom_world_generation), [overview article](https://dawnosaur.substack.com/p/how-minecraft-generates-worlds-you)

**What to take from it:** you already have continentalness. Add erosion and ridges for shape, and temperature and moisture for climate. Use splines (piecewise-linear tables) to turn noise into height, because they're easy to tune and easy to put on sliders.

### 3.2 Red Blob Games (Amit Patel): "Terrain from noise" and polygon map generation
Elevation and moisture come from two independent noises, and the biome is a lookup in a **Whittaker diagram** (the ecologists' chart of biomes by temperature and rainfall), with temperature falling as elevation rises. The polygon map generator adds rivers that run downhill and moisture that spreads out from water. [Terrain from noise](https://www.redblobgames.com/maps/terrain-from-noise/), [Polygon map generation](https://www.redblobgames.com/maps/polygon-map-generation/), [mapgen4](https://redblobgames.com/maps/mapgen4)

**What to take from it:** the Whittaker table, the elevation lapse rate, and "near water is wetter" (cheap here, since `coastD`, `seaV` and the river distance already exist).

### 3.3 Valheim
Biomes come mostly from **distance to the world's centre** plus noise, which gives rings of increasing danger, with elevation picking mountains and the ocean. [Valheim world generation](https://cybrancee.com/blog/how-does-valheim-world-generation-work/), [Zones (wiki)](https://valheim.fandom.com/wiki/Zones)

**What to take from it:** a bias you can control gives the world a direction you can learn. Here that could be an optional **latitude** band, where travelling north gets colder. A world you can learn ("the snow is up north") is more fun to explore than pure noise.

### 3.4 Erosion without simulation
- **Quilez, "More noise" / derivative fBm:** each octave of noise is damped by the slope built up so far. Steep areas get less fine detail, which makes ridges sharper and valleys smoother. It looks a lot like erosion and costs almost nothing. [iquilezles.org/articles/morenoise](https://iquilezles.org/articles/morenoise), [fbm](https://iquilezles.org/articles/fbm)
- **Rune Skovbo Johansen, "Fast and Gorgeous Erosion Filter" (March 2026):** a filter that works point by point and adds branching gullies and ridges to any height function, with no simulation, so it fits infinite chunked worlds. There are ports to Godot and Bevy, and it has been well received. [blog](https://blog.runevision.com/2026/03/), [80.lv write-up](https://80.lv/articles/fast-terrain-erosion-filter-that-emulates-erosion-without-simulation), [gist](https://gist.github.com/runevision/c867c458f06284ad4c0f8aa3b974bc59)
- **Simulated hydraulic erosion** (droplet or grid based, e.g. [Stava 2008](https://www.cs.purdue.edu/cgvlab/www/resources/papers/Stava-2008-Interactive_Terrain_Modeling_Using_Hydraulic_Erosion.pdf), [tile-based erosion](https://ar5iv.labs.arxiv.org/html/2210.14496)): the best-looking option, but it needs neighbouring tiles and leaves seams, and it doesn't fit "anything from seed and position". **Not recommended** here.
- **Dendritic patterns without simulation** ([Dendry, Gaillard 2019](https://www.cs.purdue.edu/cgvlab/www/resources/papers/Gaillard-2019-Dendry_A_Procedural_Model_for_Dendritic_Patterns.pdf)): branching valley networks built lazily. Interesting, but the river grid already supplies the main valleys.

### 3.5 Other patterns worth borrowing
- **Domain warping** (feeding noise into noise) gives natural, non-grid shapes. `seaCont` already does this.
- **Ridged multifractal noise** (`1-|n|`, squared, octaves weighted by the previous one) is the standard way to make mountain ranges with crests.
- **Stamps and templates** for landmarks (volcano, crater, arch) placed on a jittered grid. That's exactly how the country sites already work.
- **Biome blending:** sample the climate on a coarse lattice and interpolate, or blend surfaces across a band a few blocks wide. Hard edges between biomes look cheap, and Minecraft and Vintage Story both blend.
- **Factorio-style placement rules:** every resource or feature has a little rule ("trees where moisture > x and temperature in [a,b]"). A tidy way to describe vegetation per biome.

---

## 4. The model I recommend

### 4.1 Five fields, all lazy and all from seed and position

| Field | What it is | How | Scale |
|---|---|---|---|
| **C** continentalness | inland ↔ ocean | the existing `seaCont` | done |
| **T** temperature | cold ↔ hot | slow seeded noise + optional latitude term + slider. Lowered by height (lapse rate) | regions about 6–15k blocks across |
| **M** moisture | arid ↔ soaked | slow noise + wetter near the coast (from `C`/`coastD`) + wetter near rivers and lakes + optional rain shadow | similar, offset from `T` |
| **R** ruggedness ("erosion" in Minecraft's terms) | plains ↔ mountains | slow noise, biased toward ranges along continental edges and away from settlement centres | ranges about 2–6k blocks long |
| **P** ridges / peaks-and-valleys | crest lines inside rugged areas | ridged noise, domain-warped | 300–1,500 blocks |

**Caching:** like `SEA_CC`, work out T, M and R once per corner of a coarse lattice (every 64 blocks would do) and interpolate bilinearly. That's 4 lattice lookups and some arithmetic per column. The detailed height is the only per-column noise (3–5 octaves).

### 4.2 Height
```
relief  = spline_R(R) * (ridge(P) shaped by derivative-damped fBm) + hills(R)      // in the wilds
datumMask = the plainsH mask, widened: 0 at roads, rails, rivers, plots; 1 well away from them
h(x,z)  = G + relief * datumMask + valleyCarve(riverDist) + lakeBasins(...)
```
- **Spline tables** like `[[0,0],[0.3,2],[0.55,12],[0.75,45],[1,110]]` set how tall each ruggedness level gets. A slider just scales them.
- **Masks taper by height:** a 3-block hill blends out over 14 blocks, but a 100-block mountain can't, so steep ground near infrastructure turns into a **cutting** (straight walls, maybe stone retaining walls) and, once the land above the road is high enough, a **tunnel** (see 5.2).
- **Valleys:** close to a river line, pull `relief` down toward `G-2` with a smooth falloff. That way rivers always run in valleys, through plateaus they cut gorges, and their banks match what `plainsRiverColumn` already draws.

### 4.3 Biome
- Each column gets `T` (after the lapse rate), `M` and its height, then **looks up the biome table** (section 6). Blend across the edges by dithering with `hash2`, so the change is ragged instead of a straight line, and by blending colours (7.3).
- **Overrides:** above the snowline you get alpine or snowy peaks. Wet upland near the snowline gives moor. Hot and dry with high ruggedness gives badlands.
- Each biome is a **data record** (Section 7.1): surface layers, vegetation rules, tint colours, weather odds, far-view colours, map colour, and what may be placed there.

### 4.4 The order of generation (new)
1. `seaCont` → land and sea (unchanged)
2. **Climate lattice T, M, R** (needs only C)
3. Settlements: **density and size from climate and ruggedness** (fewer and smaller in mountains, tundra and deep desert); placement rules unchanged
4. Rivers (unchanged lines, plus an optional rule that **dry biomes thin out rivers**)
5. Coast detail (the coast type now looks at the biome: cliffs, mangroves, ice)
6. Roads and rail (unchanged: they stay at the datum)
7. Town zones and plots (biome style later, in phase 4)
8. Country sites (**weighted by biome**)
9. Per column: biome, height, surface, vegetation, features

Nothing later feeds back into anything earlier, which keeps it deterministic and lazy. The one rule is that **settlement placement may read T, M and R but never the detailed height**, so there's no circularity.

---

## 5. Elevation in a world built on `G`: the main design choice

### 5.1 Options compared

| Option | What | Cost | Result |
|---|---|---|---|
| **A. Datum rule** (recommended) | everything built stays at `G`. Terrain varies only in the wilds, masked toward `G` near infrastructure | small: generalises `plainsH`. A handful of `G` assumptions to fix (planes, spawn, snow, water flow) | towns in basins and valleys, mountains between them, roads in cuttings, tunnels and on viaducts. Very readable, and "goblin engineering" fits the humour |
| B. Per-settlement datum | each town has its own `gAt(px,pz)`: plateau towns, hill towns | huge: touches 763 references, all the building code, highways, rail grades, traffic | the most varied, but months of risk |
| C. Terrain-following roads | roads drape over the land | heavy: traffic, ramps, rail grades, bridges all assume level | realistic, wrong for this codebase |

**Recommendation: A now. Keep B as a possible phase 6, for villages only** (small, no highways), if you want hill villages later.

### 5.2 How infrastructure meets relief under the datum rule
For each road or rail column, compare the natural height `hN` with the datum:
- `hN - G ≤ 3`: blend the land (today's behaviour).
- `3 < hN - G ≤ 16`: **cutting**. Vertical cut faces, stone or concrete retaining blocks on the cut face, maybe a guard rail.
- `hN - G > 16`: **tunnel**. Leave the ground above the road (an arched bore 3–4 blocks above deck height, lit with `LAMP`), with a portal on each side. It's cheap in voxels, since you just don't carve. Goblins and traffic already handle "under something".
- `hN < G - 3` (lake, canyon, low basin): **embankment or viaduct**. A deck at `G` on pillars (the raised highway code already has pillars and decks), or fill for short dips.

Railways follow the same rules (tunnels are classic for railways). Airports and big sites: their whole footprint is in the mask, so they get a flat pad with graded edges. Out on the plains, farms and farmland are in the mask too, so farms sit on flat ground with hills around them.

### 5.3 Lakes
- **Datum lakes:** anywhere the masked land falls below `G-1`, fill with water up to `G-1`. Lake basins come from a lake noise that's only allowed where ruggedness is low and moisture is high. They match the sea's water level and hook into the existing water flow code naturally.
- **Upland tarns** (mountain lakes): a stamped feature with its own flat water level, hollowed into a mountain bowl. Placed on a jittered grid in rugged areas, like a site.
- The existing ponds (`plainsRaw < -0.9`) become the small end of the same lake noise.

---

## 6. Biomes: your list, revised

### 6.1 The table (temperature rows × moisture columns)

| | **Arid** | **Dry** | **Moderate** | **Wet** | **Soaked** |
|---|---|---|---|---|---|
| **Frozen** | Ice fields | Tundra | Tundra | Snowy taiga | Snowy taiga |
| **Cold** | Cold steppe → Tundra | Tundra | Taiga | Taiga | Bog |
| **Temperate** | Steppe → Grassland | **Grassland** (today's plains) | Grassland / meadow | Temperate forest | Swamp |
| **Warm** | Desert | Scrubland | Savanna | Temperate forest | Swamp |
| **Hot** | Desert | Desert (badlands if rugged) | Savanna | Rainforest | Rainforest |

Height overrides: **Alpine** (bare rock, scree, snow) above the snowline. **Moor** on wet uplands below it.

### 6.2 The recommended list (12)

| Biome | Ground | Plants | Notes |
|---|---|---|---|
| **Grassland** (the default) | grass, dirt | today's copses, flowers, hedgerows | where most farms are. Keep it the most common biome near the start |
| **Temperate forest** | grass, leaf litter (tint) | dense broadleaf trees, some big oaks, undergrowth | lumber camps live here |
| **Taiga** (boreal) | grass (cool tint), podzol-like dirt | tall conifers (a new tree shape: narrow tiers) | snow lingers longer |
| **Tundra** | frosty grass tint, gravel patches, permafrost below | sparse shrubs, lichen boulders | snow most of the year |
| **Ice fields** (polar) | snow block, `ICE` lakes | none | the far edges of the cold band. Rare unless you use the latitude slider |
| **Desert** | sand, sandstone below | cactus, dead shrubs, palms at an oasis | dunes (8.3), no rain, sandstorms |
| **Badlands / mesa** | red sand, banded terracotta-style layers | dry scrub | plateaus, buttes and canyons. Very striking as voxels |
| **Scrubland** (chaparral) | dry grass tint, dirt, gravel | low bushes, scattered small trees | bridges grassland and desert |
| **Savanna** | yellow grass tint | flat-topped acacia-like trees, tall grass | a hippo's home ground (8.6) |
| **Rainforest** (jungle) | dark grass, mud | very dense tall trees, vines, big leaves | slow to get through, lots of cover |
| **Swamp / bog** | mud, shallow water, peat | drooping trees, reeds, lily pads | **the most goblin biome there is**: half the place names already end in *-bog*, *-mire*, *-marsh* |
| **Moor / heath** | heather tint (purple-brown), peat, boulders | almost no trees | upland, misty, standing stones. Very goblin too |
| **Alpine / snowy peaks** | stone, scree, snow above the line | none above the tree line | made by height, not by climate |

### 6.3 Changes to your list and why
- **"Tropical" splits into Rainforest and Savanna.** They're opposites in moisture, and both are iconic.
- **"Grasslands" is what the world is now.** Keep it as the default, so the area around the start still feels like today.
- **Added:** Taiga, Scrubland, Badlands, Swamp, Moor, Alpine, Ice fields. Taiga and Scrubland fill gaps in the table, so you don't get jumps like tundra straight into grassland. Badlands, Swamp and Moor are the most distinctive, and two of them fit the goblin theme. Alpine is what mountains look like.
- **Not separate biomes, but variants inside one** (a noise patch picks the variant): flower meadow, birch grove, bamboo patch, oasis, salt flat, autumn-coloured forest. Minecraft's long list of micro-biomes mostly adds clutter, and variants give the same variety more cheaply.
- **Coastal "biomes" belong in the coast code, not the table.** Mangroves (warm and wet), rocky cliffs (rugged), ice shelf (frozen), pebble beaches (cold). `coastType` picks the shore type and the biome flavours it.
- **Optional goblin-flavoured phase:** **Fungal forest** (giant mushroom "trees", glowing at night through the existing block-light, matching the cave fungus), **Blight / wasteland** (ash ground, dead trees, near goblin industry or ruins), **Volcanic ashlands** (a ring around a volcano landmark). I'd hold these until the real-world set feels good, because they change the tone of the world.
- **Left out:** floating islands (they confuse collapse physics and look odd beside real-world towns), and flowing lava (there's no lava fluid, and adding one means a second fluid system; glowing "magma" blocks plus the existing fire is enough).

---

## 7. How a biome is defined (data, not code)

### 7.1 A record per biome
```js
const BIOMES={
  desert:{n:'Desert', map:'#d9c27a', far:{top:SAND,side:SANDSTONE},
    surf:[[1,SAND],[4,SAND],[99,SANDSTONE]],            // depth -> block
    tint:{grass:null, leaf:0x9a9a4a},                    // null = no grass here
    veg:[{k:'cactus',p:0.004},{k:'deadbush',p:0.006},{k:'palm',p:0.02,near:'water'}],
    feat:['dunes','oasis','saltflat'],
    wx:{clear:8,partly:2,sandstorm:0.6},                 // replaces WX_ODDS while you're here
    snow:0, sites:{oil:3,farm:0.1,lumber:0,mine:1.5}, towns:{scale:0.6,style:'adobe'}},
  ...
};
```
Everything else (generation, far view, map colours, weather, site weights, the World Generator key) reads from this record, so adding a biome later means adding data, not touching code in 10 places.

### 7.2 Vegetation
- Generalise `plainsTree` into `treeAt(x,z)`, which returns a **species** as well as a height: oak, birch, conifer, palm, acacia, jungle giant, swamp tree, dead tree, cactus, giant mushroom. Keep its order of "cheapest tests first" and keep it shared with `farTreesOf`, so trees seen from afar are still the very trees you find up close.
- Forest density becomes a seeded noise times the biome's density, replacing `plainsCopse`.
- Trees that straddle chunk edges already work (each column works out its own part), so new shapes just follow that rule.

### 7.3 The block budget (about 100 IDs left)
- **Tint instead of new IDs** for grass and leaves: pass a per-vertex biome colour (or a 2-D climate value the shader turns into a colour) next to `SEASON_W` in `FOLIAGE_FRAG`. Minecraft does the same with its grass and foliage colour maps. One `GRASS` and one `LEAVES` can then cover every biome, blended smoothly at edges, and seasons still work on top.
- **New IDs actually needed (about 14):** `SNOW`, `SANDSTONE`, `RED_SAND`, `TERRA_1..4` (badland bands, or 1 ID with the band colour taken from y in the shader), `MUD`, `PEAT`, `CACTUS`, `CONIFER_LEAVES` (a different texture, not just a different colour), `PALM_LEAVES`, `REEDS`, `MUSHROOM_CAP` (+`STEM`), `SCREE`. Leave headroom for later buildings.
- Worth thinking about later: chunks as `Uint16Array` would remove the limit, but it doubles chunk memory (51 KB to 102 KB per chunk). I wouldn't do it until it's actually needed.

---

## 8. Landscape features: your list, revised

| Feature | How | Phase | Notes |
|---|---|---|---|
| **Hills** | the low end of the ruggedness spline | 2 | Not a separate feature, just low relief |
| **Mountains / ranges** | ridged noise in rugged areas, derivative-damped fBm, snowline | 2 | The big one. Needs the far-view terrain |
| **Plateaus and mesas** | spline steps ("terraces") in badlands and high steppe | 3 | Flat tops, steep sides: great for voxels |
| **Valleys** | carved along river lines | 2 | Free with the river carve |
| **Canyons and gorges** | a river through a plateau = gorge. Dry canyons = a ridged noise *carved down* in badlands and desert | 3 | Highways cross on viaducts (5.2) |
| **Cliffs / escarpments** | sharp spline step where ruggedness changes quickly | 3 | Climbing gets interesting here |
| **Dunes** | in deserts: directional ridged noise along a wind direction, height 3–12, slip face steeper on one side | 3 | Cars and the hovercraft will love these |
| **Forests** | density noise × biome, by species | 1 | Replaces `plainsCopse` |
| **Lakes** | datum lakes + upland tarns | 2 / 3 | 5.3 |
| *Added:* **Oases** | a small datum lake + palms + green ring, placed in deserts on a grid | 3 | A small village could sit beside one |
| *Added:* **Swamp pools and reed beds** | where the height is 0–1 below the datum in swamps | 1 | Shallow water everywhere: wading goblins |
| *Added:* **Waterfalls** | only where a tarn spills out, or at a gorge mouth. Water blocks as a vertical column (no flowing) | 4 | Optional and fiddly; save for later |
| *Added:* **Sinkholes / cenotes** | a round shaft down to the existing caves, with water at the bottom in warm biomes | 3 | Cheap, ties the caves to the surface, very explorable |
| *Added:* **Natural arches and sea stacks** | stamped shapes (they need overhangs, which height fields can't make) | 4 | Coast stacks via the coast type |
| *Added:* **Boulder fields / scree** | below mountains and on moors | 2 | Today's boulders, scaled up |
| *Added:* **Glaciers** | ice tongues down from high valleys in frozen ranges | 4 | Ice is already a block |
| *Added:* **Salt flats** | a dead-flat white crust in hot, dry, low basins | 3 | A good spot for a land-speed track |
| *Added:* **Fjords and cliff coasts** | mountains meeting the sea in cold biomes, so the coast becomes cliffs and deep inlets | 4 | Through the coast code |
| *Added:* **Landmarks** (volcano, impact crater, giant tree, standing stones) | rare stamped sites, one in thousands of blocks | 4 | Points to aim for, and they could be on the map |
| *Dropped:* floating islands, flowing lava, overhang terrain via 3-D noise everywhere | | | Expensive, hurts collapse physics and far LOD. Get overhangs from stamped shapes only |

### 8.6 Ideas that suit this game in particular
- **Hippos are river animals.** Savanna rivers with mud banks, a wallow pool that heals Gus and Gertie a little (or slows goblins), deep lakes for diving. Any change like this applies to Gus and Gertie equally.
- **Ice:** hippos and vehicles sliding on frozen lakes. `roadSlip` already has a grip level for snow.
- **Goblins by biome:** parkas in the tundra, nomad wraps in the desert, swamp goblins with reed hats. Same AI, different looks, through the existing `lookNew`.
- **Biome-dependent sites:** ski lodge and cable car (alpine), oil derricks (desert), logging camps (forest, already exist as lumber camps), peat diggings (moor), research station (ice fields), safari lodge (savanna), stilt village (swamp).
- **"Where am I?" banner:** show the biome under the place name when you enter one, using the same banner (`placeBannerTick`).

---

## 9. Biomes meeting the systems that exist

| System | What changes |
|---|---|
| **Settlements** | Density and size from climate and ruggedness (e.g. `cityOdds *= biome.towns.scale`). The start city's region is always temperate grassland, so the opening stays the same. Building style by biome is phase 4: desert towns in stucco with flat roofs, snowy towns with steep roofs. Check `docs/building-standards.md` first |
| **Rivers** | Same lines. In very dry biomes some stretches dry up (a riverbed of gravel, or a "wadi"). Rivers raise moisture near them (green strips through deserts) |
| **Roads and rail** | The datum rule. Cuttings, tunnels, viaducts. `roadNear` and the masks get a "how high is the land here" input |
| **Country sites** | Weights per biome (`sites` in the record). No farms in ice fields. Mines and quarries prefer rugged ground. Airports and bases need low ruggedness |
| **Coast** | The coast type takes the biome into account: beach sand colour, cliffs where rugged, mangroves, ice shelf |
| **Caves** | Unchanged underneath, but mountains are tall, so cave mouths open on mountainsides, and sinkholes join caves to the surface |
| **Weather** | **Weather by region:** each player's weather follows the biome where they are (`WX_ODDS` per biome). Snow cover becomes local: the snow value is multiplied by a per-vertex coldness, so tundra roofs are white in summer and the desert never is. Sandstorms (fog plus orange tint plus wind) as a new weather type. Split screen with two players in different biomes needs one decision: either the weather follows player one, or each view gets its own (the shader uniforms are per render, so per-view weather is doable) |
| **Seasons** | Seasons stay world-wide, with biome colouring on top. Tropical biomes barely change, temperate ones get autumn colours, cold ones get long winters |
| **Far view** | **A height-field terrain mesh per far ring** (a grid of quads coloured by biome) using the same `h(x,z)` at a lower sample rate, plus the biome-coloured woods. Without it, mountains appear out of nowhere at the chunk edge. It's the biggest single piece of work in phase 2 |
| **Map and minimap** | Colour by biome, with hill shading from `h` (one dot product per pixel), which makes mountain ranges readable. Markers stay the same |
| **World Generator** | A Climate key and layer (biomes), a height layer (hill shading), new sliders (section 10). The worker gets new `NAMES` (`biomeAt`, `heightAt`, `climAt`) and a `clim(tx,tz,L)` function like `land()`, returning a biome index per sample. It's the main tool for tuning, so build its view **before** the in-game part of each phase |
| **Vehicles** | Offroad grip by surface (sand, snow, mud already partly exist). Planes need to crash into mountains, not just clamp to `G+1`. Helicopters need terrain clearance. Boats on lakes work |
| **Goblin AI and routes** | `navCol` and climbing already handle walls. Steep mountains need testing: goblins should climb them, but pathfinding range may need a cap |
| **Destruction and water** | Lakes join the water-flow system automatically (datum water). Big craters carve from the column's real top, not from `G` |
| **Spawn** | The start is kept inland in temperate grassland with low ruggedness (the same idea as the start search in `seaV`) |

---

## 10. Sliders (World Generator first, then a "Custom world" option in the game)

**Climate**
- **Temperature**: colder ↔ hotter (shifts T)
- **Rainfall**: drier ↔ wetter (shifts M)
- **Climate zone size**: small and varied ↔ huge regions (the scale of T and M)
- **Latitude bands**: off ↔ strong (how much "north is cold" counts)

**Land shape**
- **Mountains**: how much land is rugged
- **Mountain height**: scales the spline's top end (capped about 140 above `G`)
- **Hilliness**: the low end of relief in open country
- **Lakes**: lake noise threshold
- **Rivers**: `rivOn` odds (how many river lines are on)

**Cover**
- **Forest cover**: tree density across all biomes
- **Biome variety**: blend-heavy ↔ distinct patches

Every slider should default to exactly today's sums, as the Land & sea sliders already do, so a default world only changes on purpose.

**Before any slider reaches the game:** generalise `SEA_CFG` into one `WORLD_CFG`, saved in the save and sent in `saveText`. Show it on the seed line ("Seed 1234 · custom"). Share it as a short code with the seed, so others can play the same world. Until then, sliders stay in the World Generator as a preview.

---

## 11. Saves and versions
- **Every phase changes generation, so bump `SAVE_KEY` each time** (the CLAUDE.md rule). Old worlds stay playable through the old-version links (`/v/X/`), so no world is lost. It just plays on the version it was made in.
- **Store a `gen` number in the save** as well as the key, so a save from a different generator gets a clear message ("made with an older world generator: open it in version X") instead of silently loading into a different world.
- **`WORLD_CFG` goes in the save and in `saveText`** (see 10). A guest has to build exactly the host's world.
- Patch notes: each phase is one bullet group under the current unreleased version.

---

## 12. Performance budget
- **Per column, per chunk** (256 columns): today, about 5 `gridNoise` calls plus mask tests. Add about 4 lattice lookups (T, M, R) plus 3–5 octaves of gradient noise for height plus the biome lookup. With lattice caching that's about **2–3× today's per-column cost for the wild columns only**. Town columns barely change (their mask is 0, so they can skip the height noise). Profile with the existing profiler (`ui/profiler.js`, `tools/ui/proptime.js`-style timing).
- **Meshing:** mountains add vertical faces. Expect 1.5–2× the faces in mountain chunks. The existing face culling and merging handles it, but test on low-end settings (`lowfps` suite).
- **Far view:** the terrain mesh per ring is a few thousand quads per tile, built once and cached. Sample height on a coarse grid (8, 16 or 32 blocks by ring).
- **Caches:** follow the existing pattern (Map with a size cap, reset when the seed changes, as `seaCcSeed` does).
- **The rule for gameplay code:** never ask for the height of a column far away inside a loop. Use the lattice or a cached `heightAt` with the same caps.

---

## 13. Determinism
- Everything comes from `hash2(…, seed)` and new salts. **Never `Math.random`.**
- **Cross-browser floats:** `Math.sin`, `cos`, `tanh` and `exp` are allowed to differ in the last bit between browsers. A host on Chrome and a guest on Firefox could then generate a different block where a value sits right on a threshold. The current code already uses `Math.sin` widely, so the risk exists today, but height is far more sensitive than a colour. **Write the new noise with arithmetic only** (gradient or simplex noise needs only `+ - * floor`, which is exact under IEEE). Replace `tanh` and `sin` in the new code with polynomial or smoothstep curves. Add a `netshot`-style check that compares column hashes between two browsers.
- Settlements must never read the detailed height (4.4), so placement stays stable when the height function is tuned.

---

## 14. Phases

### Phase 0: foundations (no visible change on default settings)
- A seeded gradient noise (OpenSimplex2-style 2-D), fBm, ridged and warp helpers, arithmetic only.
- `WORLD_CFG` replaces `SEA_CFG`: saved, sent online, defaults equal to today.
- Rename `biomeOf` to `realmOf`. Add a stub `biomeAt` that returns grassland.
- World Generator: the plumbing for a climate layer.
- Tests: a determinism suite (column hashes for fixed seeds), and the baselines unchanged.

### Phase 1: climate and biomes on flat land
- T, M and the lattice. The biome table and `BIOMES` records. Surface layers. Tinted grass and leaves. Tree species and `treeAt`. Biome map colours (map, minimap, far view, World Generator).
- `plainsRaw`, `plainsCopse` and the `earthCol` sines move to seeded noise (**`SAVE_KEY` bump**).
- Swamp pools and reed beds (they need no relief).
- **What you see:** deserts, forests, taiga, savanna, swamps across the continents. The ground is still mostly level.

### Phase 2: relief
- R, P, the height splines, derivative-damped fBm. The widened datum mask. Cuttings, tunnels and viaducts. River valley carving. Datum lakes. Snowline and alpine. Boulder fields.
- **The far-view terrain mesh.** Plane and helicopter crashes against terrain. The spawn rule. Fixes to the `G` assumptions found by the tests.
- World Generator: height layer with hill shading, and the Land shape sliders.
- **What you see:** mountain ranges between towns, roads tunnelling through, lakes in the hollows.

### Phase 3: landforms
- Dunes, plateaus and mesas (terraces), canyons and gorges, cliffs, tarns, oases, sinkholes, salt flats.

### Phase 4: biome-aware content
- Regional weather and local snow. Sandstorms. Coast variants (cliffs, mangroves, ice). Site weights and new biome sites. Town density and style by biome. Goblin looks by biome. The biome banner. Waterfalls, arches, sea stacks, glaciers, fjords, landmarks.

### Phase 5 (optional): goblin biomes
- Fungal forest, Blight, Volcanic ashlands with a volcano landmark.

### Phase 6 (optional, large): hill villages
- A per-village datum, for villages only.

---

## 15. Risks and how to keep them small

| Risk | Mitigation |
|---|---|
| Hidden `G` assumptions break things on high ground (falling through, wrong snow, water flow, craters) | Phase 2 starts with a sweep: grep `G+`/`G-` in the gameplay files (not generation), plus a "mountain" scene in the tests (walk, drive, fly, blast, flood on a slope) |
| Far view doesn't show mountains, so they pop in | Build the far terrain mesh in the same phase as the relief, never after |
| Generation gets slow on low-end machines | Lattice caching, mask 0 skips the noise, profile per phase, `lowfps` suite |
| Biome edges look cheap (straight lines, sudden colour jumps) | Dithered edges plus colour blending plus the transitional biomes (scrubland, taiga) in the table |
| Too much variety and the world loses its identity | Keep the start temperate. Tune with the World Generator. Hold the fantasy biomes until later |
| Online guest builds a different world | `WORLD_CFG` in `saveText`, arithmetic-only noise, a cross-browser column-hash test |
| Block IDs run out | Tinting instead of IDs, a budget of about 14 new IDs, `Uint16Array` only if really needed |
| Test baselines all shift at once | Re-baseline once per phase in a dedicated commit, so real changes are easy to find |
| Phases drift into each other | Each phase ships on its own, with patch notes and a `SAVE_KEY` bump |

---

## 16. Decisions for you
1. **The datum rule** (towns and roads stay at street level, mountains only in the wilds, tunnels and viaducts where they meet) or something more ambitious? I recommend the datum rule.
2. **Latitude bands**, so north is colder? I'd have them on but weak by default, with a slider.
3. **The biome list:** the 12 in 6.2, and whether the goblin-flavoured biomes are in at all.
4. **Sliders in the game,** or only in the World Generator to begin with?
5. **Where to start:** phase 0 + 1 together is a good first chunk of work.

---

### Sources
- [Minecraft Wiki: Terrain](https://minecraft.wiki/w/Terrain) · [Custom world generation](https://minecraft.wiki/w/Tutorial%3ACustom_world_generation) · [How Minecraft generates worlds](https://dawnosaur.substack.com/p/how-minecraft-generates-worlds-you)
- [Red Blob Games: Terrain from noise](https://www.redblobgames.com/maps/terrain-from-noise/) · [Polygon map generation](https://www.redblobgames.com/maps/polygon-map-generation/) · [mapgen4](https://redblobgames.com/maps/mapgen4)
- [Inigo Quilez: More noise](https://iquilezles.org/articles/morenoise) · [fBm](https://iquilezles.org/articles/fbm)
- [Rune Skovbo Johansen: Fast and Gorgeous Erosion Filter (blog, March 2026)](https://blog.runevision.com/2026/03/) · [80.lv article](https://80.lv/articles/fast-terrain-erosion-filter-that-emulates-erosion-without-simulation) · [code gist](https://gist.github.com/runevision/c867c458f06284ad4c0f8aa3b974bc59)
- [Stava et al. 2008, hydraulic erosion](https://www.cs.purdue.edu/cgvlab/www/resources/papers/Stava-2008-Interactive_Terrain_Modeling_Using_Hydraulic_Erosion.pdf) · [Tile-based erosion](https://ar5iv.labs.arxiv.org/html/2210.14496) · [Dendry (Gaillard 2019)](https://www.cs.purdue.edu/cgvlab/www/resources/papers/Gaillard-2019-Dendry_A_Procedural_Model_for_Dendritic_Patterns.pdf)
- [Valheim world generation](https://cybrancee.com/blog/how-does-valheim-world-generation-work/) · [Valheim zones](https://valheim.fandom.com/wiki/Zones)
