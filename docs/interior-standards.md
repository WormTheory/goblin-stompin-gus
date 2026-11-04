# Interior standards

What Thomas has asked for in building interiors, and how to meet and check it. Read this before adding or changing any building. These came from his feedback in November 2026: the small restaurants (diner, pizzeria, cafe) are his stated benchmark for level of detail.

## What every building needs

- **It reads as what it is.** Lay out the rooms the building would really have, not generic furniture. A restaurant has a dining area, a checkout counter and a kitchen, and each kind differs (booths and stools in a diner, a brick oven in a pizzeria, armchairs and a cake case in a cafe). They needn't be especially detailed, but they should read that way.
- **Props, not cube furniture.** Furniture is box-model props in proportion to the goblins (about 1.4 tall). Blocks are for walls, tanks, stages, tiered seating and other things that are really structure.
- **Not monotonous, not empty.** Long grids of one desk or big bare floors are faults. Break large floors into distinct rooms. A police station has a lobby and front desk, bigger holding cells, an armory, an evidence room, a break room, interview rooms and locker rooms. A hospital ground floor has a pharmacy, X-ray, exam rooms, a lab and so on around its lobby, and its ER is full of bays behind the ambulance doors.
- **Size follows function.** If it doesn't fit, make the building bigger. Two restaurants sharing a block became one each. Don't shrink the function to fit the building.
- **Stairs on anything with real upper floors**, reachable, without blocking the way through the building or crowding out its purpose. If stairs take up most of a building, enlarge it or make it one storey. (A farmhouse where the stairs left room for little else was the example he gave.)
- **Bathrooms in every building that would logically have one**: walled, with stalls, basins, a sign and a door. Customers shouldn't walk through a kitchen or surgery to reach them. Flats and houses have their own. Enlarge the building if needed.
- **A way through that makes sense.** Think about how people use it: a train station needs a door on to the platform as well as one from the street.
- **Emergency vehicles keep working.** Anything that dispatches vehicles must still let them out and home after changes.

## Outside

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
node stairaudit.js 160  # floors with no stairs
node stairroom.js 150   # how much floor stairs take; the worst should be well under half
node wcaudit.js 150     # buildings with no bathroom
node signcount.js 150   # signs per kind of building
node proptest.js        # goblins round furniture, Gus knocking it over
node dispatch.js        # fire engines, police cars and ambulances leave and get home
```

These print measurements and don't fail by themselves, so read the results. Then look at the real thing: `tools/ui/tour.js` scenes take `[name,x,y,z,yaw,pitch,cut,caption]`. `cut` slices the roof off at a height so you can see the rooms. Inspect floor by floor, including upstairs.

Every picture for Thomas carries a short description of its purpose and a timestamp burned into the image, which `tour.js` does from `caption`.

## Left as they are, on purpose

Arena and stadium seating, the capitol's rooms, data centers, lecture halls, mission control and turbine halls keep their block-built interiors because they read well. Churches, cathedrals, car parks, malls and lighthouses have no stairs for good reason (one tall room, ramps, escalators, their own spiral). Churches, car parks, barns, sheds and huts, trailers and building sites have no bathroom.
