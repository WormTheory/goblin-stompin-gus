# Building standards

What Thomas has asked for in the game's buildings (their scale, where they go, how they read from outside, and what's inside), and how to meet and check it. Read this before adding, moving, resizing or changing any building. It comes from his feedback in November 2026.

## Scale

Scale reference: 1 block is about 1.4m, so a goblin (1.4 blocks) is about 2m. A storey is 5 blocks, tall on purpose so Gus fits indoors.

- **Keep the 32-block city block.** Larger structures span more plots rather than making plots bigger. `CELL` and the plot constants are everywhere, and changing them wouldn't make existing buildings grow.
- **Size follows real life, scaled to fit.** Most things are close to real size; the very largest sites aim for roughly 60 to 70%, which Thomas has confirmed is working well. A fully real airport or nuclear plant would dwarf a town.
- **Big sites get room around them.** Cities and large towns were widened by about 30% to make space. Bigger sites mean longer walks and fewer buildings per city, so play-test the feel.
- **Don't cram.** One restaurant, shop or mid-rise to a block, and two-storey houses have a block to themselves.

Sizes as built, in plots (W x H; one plot is 32 blocks):

| Structure | Plots |
| --- | --- |
| Restaurant, little shop, fast food, bar, mid-rise, office tower, courthouse, library, bank | 1 |
| Sit-down restaurant, drug store | 2 |
| Police station (big), arena | 2 x 2 |
| Cathedral | 2 x 3 |
| Museum, aquarium | 3 x 2 |
| School (big), hospital (big), power station, mine | 3 x 3 |
| Furniture store, factory, lumber camp | 4 x 3 |
| Prison, film studio, dump, military base, superstore | 4 x 4 |
| Mall, stadium | 4 x 6 |
| Zoo | 5 x 5 |
| University, quarry | 6 x 6 |
| Theme park, nuclear plant | 8 x 8 |
| Airport | 14 x 6 |
| Farm, with its land | up to 4 to 6 each way, less where something's in the way |

Smaller versions exist in small towns. A theme park is too big for one 6 x 6 cell of the big plan, so `themeOf` lets it reach into its neighbours, and a third of it may run on to open ground at the edge of town.

## Placement

Each kind of site belongs somewhere in a place (`SITE_F`, how far out from the middle, and `siteFits`); country sites are in `BIGP`.

| Zone | What belongs there |
| --- | --- |
| Downtown | Office towers, mega-buildings, stock exchange, theaters, museums, capitol, TV news |
| City ring | Mid-rises, hospitals, universities, arenas, stadiums, cathedrals, malls |
| Suburbs | Houses, schools, supermarkets, superstores, parks, churches, cinemas |
| Edge of town, with a road in | Dumps, factories, power stations, water works, prisons, data centers, car dealers, film studios, zoos, theme parks |
| Out in the country | Nuclear plants, airports, military bases, launch sites, mines, quarries, farms, wind farms |

Nothing heavy, smelly or sprawling in a town center, and no dump against high-rises.

## Identity from outside

A building should read as what it is from a distance, before you can read its sign. Each major structure gets a distinct shape, its own roof, its own ground treatment, and one signature object: a hospital's helipad, ambulance bay and cross; a school's buses, flagpole and field; a fire station's red bays and drying tower; a factory's sawtooth roof and chimneys; a prison's walls and guard towers; columns and steps on a bank or library. Small shops and restaurants can stay simple boxes with varied roofs (`roofOf`) and a large chain sign.

## What every interior needs

- **It reads as what it is.** Lay out the rooms the building would really have, not generic furniture. A restaurant has a dining area, a checkout counter and a kitchen, and each kind differs (booths and stools in a diner, a brick oven in a pizzeria, armchairs and a cake case in a cafe). They needn't be especially detailed, but they should read that way.
- **Props, not cube furniture.** Furniture is box-model props in proportion to the goblins (about 1.4 tall). Blocks are for walls, tanks, stages, tiered seating and other things that are really structure.
- **The benchmark is the small restaurants** (diner, pizzeria, cafe): he called them exactly the level of detail he wants.
- **Not monotonous, not empty.** Long grids of one desk or big bare floors are faults. Break large floors into distinct rooms. A police station has a lobby and front desk, bigger holding cells, an armory, an evidence room, a break room, interview rooms and locker rooms. A hospital ground floor has a pharmacy, X-ray, exam rooms, a lab and so on around its lobby, and its ER is full of bays behind the ambulance doors.
- **Size follows function.** If it doesn't fit, make the building bigger. Two restaurants sharing a block became one each. Don't shrink the function to fit the building.
- **Stairs on anything with real upper floors**, reachable, without blocking the way through the building or crowding out its purpose. If stairs take up most of a building, enlarge it or make it one storey. (A farmhouse where the stairs left room for little else was the example he gave.)
- **Enlarge a building rather than squeeze it.** Thomas's standing permission: if stairs, bathrooms and the way in don't all fit comfortably, make the structure bigger (take a car park or setback, or span more plots). Aim for stairs under about 20-25% of a floor and never in the path from the door to the middle of the room (`stairroom.js` reports both; `autoStair` moves stairs out of the way).
- **Bathrooms in every building that would logically have one, but no more than needed.** They're secondary to what the building is for: one to an establishment on its ground floor (two only on a vast floor), one to a flat or house, every third floor in offices and wards, a small part of the floor (aim under about 15%, a tiny site hut can't quite manage it). Their walls match the building's and reach the ceiling, and they have a real door. Customers shouldn't walk through a kitchen or surgery to reach them.
- **A way through that makes sense.** Think about how people use it: a train station needs a door on to the platform as well as one from the street.
- **Emergency vehicles keep working.** Anything that dispatches vehicles must still let them out and home after changes.

## The coast
A place that reaches the water is a coastal kind (`setKind`): a city is a **coastal city** (shipping port, docks one side of it, a beach the other), a town a **harbor town** (docks and a beach) or **resort town** (all beach), a village a **fishing village** (a plank wharf, one pier, moored boats, nets and crates). Shipping ports only belong to coastal cities (`cityPort`). Naval bases stand well away from any place; lighthouses, oil rigs and wrecks stand alone; the rest is plain shore. Beach and dock furniture (umbrellas, loungers, towels, the lifeguard's chair, benches, nets, crates, rowboats) is props, in `coastProps`. `tools/tests/coastaudit.js` lists what each place has.

## Signs and outdoors

- **One sign per building**, unless more are deliberate (gas stations and truck stops have 3, fast food, water towers and the space agency have 2).
- **Signs must be readable from normal angles.** On buildings with pediments the sign goes on the front of the pediment, not the wall behind it.
- Patios and outdoor dining use props too (umbrella, table, chairs).

## Pitfalls we've hit

- A building is only built inside `plotBounds`. Moving a wall past that leaves it unbuilt, so a station once lost a wall. Widen the bounds too, and look at it from outside.
- New inside walls trap goblins. Keep gaps, keep props clear of the ends of stairs, and check `roomStep` routes through doors.
- Pillars beside stairs stop goblins getting round to the far end.
- Sliced-roof pictures show walls as grey cross-sections. Before concluding a wall's missing, look without the slice.
- After changing how something looks, retake every picture of it. Old pictures have misled us.
- Very tall ground floors need checking, since prop floors are worked out from storey height.

## Where the code is

Rooms: `restProps` (restaurants, bars, soup kitchens), `shopRoom` (shops, stores, furniture store, stations), `mallProps`, `homeRoom`, `aptFloor`, `workRoom` (offices, banks, broadcasters), `civicRoom` (schools, libraries, police, fire, jails, courthouses), `venueRoom` (cinemas, clubs, casinos, museums, factories, labs, barracks, terminals, sound stages), `hospProps`, `pewProps`. Models are in `PROPS`. Inside walls are in `furnRaw`. Other pieces: `autoStair`, `wcRooms`, `policeRooms`, `hospRooms`, `roomStep`.

## How to check

From `tools/tests`:

```bash
node stairs.js          # goblins and Gus climb stairs (STAIR_KINDS=bank,news to choose block types)
node chase.js           # goblins run a hippo down between floors, on the roof, cliffs and water (KINDS=market,school to choose)
node stairaudit.js 160  # floors with no stairs
node stairroom.js 150   # how much floor stairs take; the worst should be well under half
node wcaudit.js 150 150 # buildings with no bathroom, share of the floor, and whether every bathroom door really opens on to clear floor
node signcount.js 150   # signs per kind of building
node proptest.js        # goblins round furniture, Gus knocking it over
node dispatch.js        # fire engines, police cars and ambulances leave and get home
```

These print measurements and don't fail by themselves, so read the results. Then look at the real thing: `tools/ui/tour.js` scenes take `[name,x,y,z,yaw,pitch,cut,caption]`. `cut` slices the roof off at a height so you can see the rooms. Inspect floor by floor, including upstairs.

Every picture for Thomas carries a short description of its purpose and a timestamp burned into the image, which `tour.js` does from `caption`.

## Left as they are, on purpose

Arena and stadium seating, the capitol's rooms, data centers, lecture halls, mission control and turbine halls keep their block-built interiors because they read well. Churches, cathedrals, car parks, malls and lighthouses have no stairs for good reason (one tall room, ramps, escalators, their own spiral). Churches, car parks, barns, sheds and huts, trailers and building sites have no bathroom.
