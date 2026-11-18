# Vehicle controls, handling and HUD overhaul (plan)

Source: report doc https://claude.ai/artifact/JrUDm1eMMTCfNxYv5U5zr2 (tables flattened to one cell per line).

## Thomas's decisions (18 Nov 2026) — all recommended options
1. Planes on mouse+keyboard default to Mouse-aim (War Thunder style); Direct is an option (default on pad).
2. Helicopter defaults to Simple (today's + inertia); Agile is an option.
3. Drift boost on every road vehicle except bus and lorry.
4. Trains derail when far over a bend's safe speed.
5. Forklift tips over with a high load in a hard turn.
6. Units: km/h on land; knots on water and in the air.
7. Mobile Gear ring font: Chakra Petch (Google font).
8. Rowboat: left/right click pull each oar.
9. Each vehicle control context gets its own rebinding section in Controls now.
10. Build on the shared vehicle base already on `test`, adding fields ctx, handling, inst, how.
11. Mobile Gear: speed ring only, no energy-bar or redline extras; leave its controls alone.

---

Vehicle controls, handling and HUD overhaul
 · 
Summary
Every vehicle should get its own control context (the way the Mobile Gear already has one), one signature mechanic, and one instrument that replaces the shared car speedometer. Today almost everything shares W/S throttle, A/D steer, Bite for the horn and a km/h dial; the fixes below give each vehicle a reason to exist and a reason to feel different.
The ten changes that matter most:
Planes get real 3D attitude. Replace the bank-and-climb-angle model in drvPlane with a body-axis (quaternion) model so planes can roll all the way round, loop, and fly inverted. Add rudder, a Mouse-aim mode (War Thunder style) as the default on mouse, and a proper flight HUD.
Cars get a handbrake drift with a boost reward. Today cars move strictly along their heading with no slide. Add grip, a handbrake (Space), and a Mario Kart style drift-charge boost so city driving has a skill to it.
The forklift's forks work. Jump/Climb raise and lower the carriage, a held modifier tilts the mast, and the forks pick up crates, pallets, cars and goblins. Its HUD is a mast-height gauge, with no speedometer.
The tractor gets a three-point hitch and cruise gears. Hand-throttle cruise steps plus a plough or mower that churns blocks and goblins behind it.
The tank gets hull/turret independence done right. Steering becomes left/right track speeds (pivot turns, neutral steer), with a hull-lock key and a turret-direction compass in the HUD.
Helicopters get a choice of Simple (today's) and Agile (collective + attitude) modes, plus auto-hover and a rotor-RPM spool on start.
Boats get throttle detents, planing and wave hops, and sailboats get a sail control. Small boats show knots on a marine dial; ships keep and expand the engine telegraph.
Trains get a reverser and a combined power/brake lever instead of "forward is wherever you look", and a cab-style HUD.
The balloon gets wind layers. Steering by altitude is how real balloons fly; it makes the balloon a puzzle instead of a slow helicopter.
Each vehicle gets a fitting instrument (tachometer, airspeed tape, knots dial, notch lever, variometer, mast gauge, or none), plus a futuristic speed ring for the Mobile Gear. See the mock-up page.
The control explanations stay in the left column (.dkeys) exactly as now; only their contents change per vehicle. Thomas's calls are listed under Decisions for Thomas at the end.
How the vehicles work today
Most vehicles are one shared arcade model with different numbers, and the HUD is the same km/h dial for all of them. Read from src/js on the test branch as of today.
Vehicle
Code
Controls now
Handling now
Display now
All road vehicles (car, van, pickup, truck, lorry, bus, fire engine, ambulance, police, news, motorhome, motorcycle, supercar, four-wheeler, technical)
drvCar, carPhysics
W/S throttle and brake, A/D steer, Bite horn (fire engine: Bite hose, Stomp horn)
Moves exactly along its heading, no sideways slip. Steering is a flat 1.7 rad/s scaled by speed (supercar eases off at speed). Types differ only in top speed (8 to 62) and acceleration. No handbrake, no air control.
km/h dial, 0 to 120
Forklift
drvCar, VEH.forklift
Same as a car
Top speed 8, rear-wheel steering is only visual. The mast and forks are static boxes.
km/h dial
Tractor
drvCar, VEH.tractor
Same as a car
Top speed 11, acceleration 7
km/h dial
Hovercraft
drvCar, hovDrift
Same as a car
Velocity eases toward heading, so it slides. Weak brake.
km/h dial
Tank
drvTank, tankGun
W/S throttle, A/D turn hull at 0.9 rad/s, turret follows the camera, Bite shell
Smooth speed to 7, rams through walls
km/h dial, ammo pips, gun marker
Helicopter
drvHeli, heliGuns
Moves where you push relative to the camera, Jump climbs, Climb drops, Bite gun, Stomp rockets
Fully assisted: no attitude control, tilt is cosmetic (max 0.25 rad)
km/h dial, ammo
Two-seater, airliner, fighter jet
drvPlane, planeHud
Keyboard: W/S nose, A/D bank, Jump/Climb throttle. Pad: stick up/down throttle, stick left/right bank, A/LB pitch
Bank capped at about 60 deg (two-seater 63, jet 80) and springs back level. Nose pitch capped at -34 to +40 deg, flight path at +/-75 deg. No rudder, no loops, no inverted flight.
Text in the left column (throttle %, speed, climb, STALL), km/h dial
Small boats (rowboat, pedalo, speedboat, launch, sailboat, fishing boat, tug, ferry, navy)
drvBoat
W/S throttle, A/D rudder, Bite horn
Speed eases toward a target; bigger boats answer slower. No waves, no planing, sails do nothing.
km/h dial
Ships (barge, carrier)
shipDrive, shipHow
W/S engine-order telegraph (7 steps), A/D rudder, Climb centres the rudder, bridge view
Already the most characterful: momentum, rudder bite by speed
Text: order, knots, rudder angle; plus km/h dial
Train, subway
drvTrain, drvSub
W/S throttle, and forward is whichever way you are looking along the track
Simple acceleration to 30 (subway 25)
km/h dial
Hot-air balloon
updateBalloons
Jump burner, Climb vent, move to drift relative to camera
Heat model for climb rate, free drift at 5
km/h dial
Mobile Gear
drvMech, mech-hud.js
Its own action set (mg:true in ACTS)
Out of scope
Energy, gauges, readouts, plus the shared km/h dial
Three things stand out. First, the Mobile Gear already proves the pattern this report builds on: its own actions in ACTS, its own rebinding section, and keys that only clash within the same context. Second, pad triggers are read as on/off (value&gt;0.5 in input.js), so nothing can use analog throttle today. Third, the speedometer (updateSpeedo in ui/minimap.js) is measured from the player's position change, not from the vehicle, so it already works for anything; it is only the look and the units that are car-shaped.
What popular games do
The games that feel best give each vehicle one mechanic to master and an assist layer that hides the hard physics. Linked rows were checked on the source page; the rest are from general knowledge of the games and are marked approximate.
Vehicle type
Reference game
What it does
What to take
Car
Mario Kart
Drifting charges a hidden boost counter, faster when steering into the turn; blue, orange, then purple sparks mark the stages, and releasing fires a boost of about 0.6, 1.7 or 2.6 s
A visible drift charge with a payoff on release
Car
GTA V
Space (RB on pad) is a handbrake for sliding turns; triggers are analog throttle and brake
Handbrake on Space, analog triggers on pad
Car
Burnout, Forza Horizon (approximate)
Near-miss and drift scoring, slow-motion crash cam, heavy camera FOV kick at speed
Speed feel from FOV and shake, not just numbers
Motorcycle
GTA V, Trials (approximate)
Lean forward/back on the stick for wheelies and stoppies; air pitch control
Lean on W/S while airborne or held, for tricks
Tank
World of Tanks
WASD drives the hull, the mouse aims the turret, cruise control has three steps, Space is a handbrake, X locks the hull
Hull lock and cruise steps; the turret follows the camera, as now
Tank
Battlefield, Halo Scorpion (approximate)
Turret-direction indicator in the HUD; hull and turret outline shows damage
A turret compass
Helicopter
Battlefield 6
W/S collective, A/D yaw, mouse pitch and roll. Pad: left stick collective and yaw, right stick pitch and roll
An optional real attitude mode for players who want it
Helicopter
GTA V, Just Cause (approximate)
Strong auto-stabilise; stick sets tilt, which sets speed
The current Simple mode is the right default
Plane
War Thunder
Mouse aim: the mouse sets the direction, an "Instructor" flies the plane toward it, keeps it out of stalls and spins, eases near the ground and trims
Mouse-aim mode as the default on mouse and keyboard
Plane
GTA V
Keyboard W/S throttle, A/D yaw, numpad pitch and roll; pad triggers throttle, bumpers yaw, left stick pitch and roll, L3 gear
The standard pad layout for direct control
Plane
Ace Combat (approximate)
Full 360 degree roll, auto-level option, high-G turn on both triggers, a pitch ladder and speed and altitude tapes
Unlimited roll and a tape HUD
Boat
GTA V, Wave Race (approximate)
Hull bounces on waves, catches air, leans in turns; throttle has a planing threshold
Waves and planing
Sailboat, ship
Sea of Thieves
Sail height and angle set speed against the wind; the wheel has about four turns with a clunk at centre; dropping anchor while turning swings the ship hard
Sail trim, a rudder detent, and an anchor turn
Train
Train Sim World
RT/RB raise and lower throttle, LT/LB raise and lower the train brake, d-pad reverser, L3 horn
A reverser and separate power and brake notches
Forklift, tractor
Farming Simulator (approximate)
Mouse or stick moves the selected tool's arms; cruise control steps; implements raised and lowered with one key
Tool on its own keys, cruise steps
Balloon
Real ballooning (approximate)
Pilots steer by changing height to find wind blowing the way they want
Wind layers at different heights
Shared foundations
Four pieces of plumbing make every per-vehicle change below cheap; they belong in the shared vehicle base the other thread is building.
1. A control context per vehicle class
Generalise the Mobile Gear's mg:true into a ctx field on each action in ACTS: road, lift (forklift), farm (tractor), tank, heli, air (planes), sea (boats and ships), rail, balloon, mg. Each context gets its own rebinding section in Controls, and setBind only reports clashes inside one context, exactly as it already does for the Mobile Gear. On-foot actions stay the fallback, so Get in/out (F, pad Y) and Lock on (Q) keep working everywhere.
Keyboard defaults reuse the keys players already know: Space is the main "extra" (handbrake, burner, airbrake), Shift is "more" (boost, afterburner, tilt modifier), C is "less" or a modifier, R cycles a mode, and the mouse buttons stay Bite and Stomp.
2. Analog triggers and sticks
input.js turns triggers into on/off at 0.5. Add analog values to what drvIn returns: i.rt and i.lt (0 to 1) and the raw stick i.x, i.z already analog. On a pad, RT becomes throttle and LT brake or reverse in every ground vehicle and boat, the GTA and Forza standard. Keyboard keeps W/S, with a short ramp so a tap is not full throttle.
3. A handling profile per kind
Today drvCar picks numbers with a chain of ternaries (V==='super'?62:V==='forklift'?8:...). Move them into a HANDLING table keyed by vehicle (top speed, acceleration, brake, grip, steer rate, steer falloff with speed, mass for crashes, drift charge rate, signature mechanic). The shared base reads its profile; tuning becomes a data edit, and the Dev tab can expose sliders later.
4. One instrument slot with a renderer per class
Keep the bottom-right corner where .speedo sits, but make it an instrument slot: INSTRUMENTS[class] gives a builder (SVG markup), an update function, and its units. updateSpeedo's measured speed stays the input (it already works for any vehicle, aboard ships too). Kinds with inst:null (forklift, rides, deck weapons) hide the slot. The Options toggle uiSpeedo becomes "Vehicle instruments". Details and pictures are in the HUD section and the mock-up page.
Feel, everywhere
Camera: field of view widens with speed (cars +8 deg at top speed, jets +12 deg), and the chase camera lags on turns, as Forza Horizon does. Today's camera never changes FOV.
Sound: engine pitch follows RPM or throttle, which most vehicles lack (only the helicopter rotor and Mobile Gear thrusters loop now).
Rumble: pad vibration on gear shifts, landings, ramming and firing (gamepad.vibrationActuator, where supported).
Hints: the left column shows only the controls for the current context, plus at most one contextual line ("Hold Space to drift", "Stall: push the nose down").
Per-vehicle recommendations
Each vehicle below gets its controls, its handling changes, one signature mechanic for flavour, and its instrument. Keys are keyboard and mouse first, pad second; Get in/out stays F / Y everywhere.
Road vehicles (shared road context)
Action
Keyboard
Pad
Throttle / brake and reverse
W / S
RT / LT (analog)
Steer
A / D
Left stick
Handbrake, drift
Space
RB
Horn
Left click
X
Vehicle special (siren, nitro, doors, wheelie)
Right click
LB
Look behind
C (hold)
Right stick click
Handling. Give road vehicles a velocity that is separate from their heading, as the hovercraft already has (hovDrift). Each tyre set has a grip value; lateral speed above grip slides, and grip drops on grass, sand, snow and ice (the game already has snow on roads). Steering rate falls off with speed for every vehicle, not only the supercar, so motorway lane changes stop being twitchy. In the air, A/D yaws and W/S pitches slowly, so jumps can be straightened before landing.
Signature mechanic: drift boost. Holding Space while turning above about 25 km/h breaks the rear loose. Holding the slide builds a charge in three stages, shown as sparks off the rear tyres in the HUD palette (yolk, then orange, then tomato) and a fill around the tachometer. Letting go of Space fires a boost of about 0.5, 1.2 or 2 s. Heavy vehicles charge slowly or not at all (bus, lorry: no drift, they slide and lose speed).
Per-type flavour.
Type
Feel
Special (right click / LB)
Car
The baseline: balanced grip, drifts well
Headlights flash (and blind goblins briefly, flavour only)
Supercar
Highest grip and top speed; launch control: hold brake and throttle at a standstill, let go for a perfect start
Nitro, a bar that refills while drifting
Motorcycle
Leans up to 40 deg in turns, turns tightest, light
Hold for a wheelie (W) or stoppie (S); a big crash throws the rider off
Four-wheeler, technical
Soft, bouncy suspension, best off-road grip, takes kerbs without slowing
Hop: a small jump on release, for climbing a one-block lip
Van, pickup, news van, motorhome
Body roll, slower steering, a motorhome sways and tips if thrown into a turn
News van: raise the dish (camera crew flavour); motorhome: the door swings open
Truck, lorry, bus
Slow steering, wide turns, heavy: shoves cars aside rather than bouncing off them
Air-brake hiss and a stop; bus: doors open and close
Police car, ambulance
As a car, a little quicker
Siren on and off: traffic pulls over, using the pull-over code that already reacts to service vehicles in traffic-update.js
Fire engine
Heavy, slow
Siren (the hose stays on left click, as now)
Instrument. A car tachometer and speedometer pair: the existing dial in km/h, plus an RPM arc with gear number (cosmetic automatic shifts, with a shift blip sound). The drift charge fills the outer ring. Motorcycles get a slim digital bike dash. Trucks and buses get a plain analog dial with an air-pressure needle.
Forklift (lift context)
Action
Keyboard
Pad
Drive / reverse
W / S
RT / LT
Steer (rear wheels)
A / D
Left stick
Raise / lower forks
Space / C (hold)
RB / LB (hold)
Tilt mast back / forward
Shift + Space / Shift + C
D-pad up / down
Horn
Left click
X
Handling. Make the rear-wheel steering real: the forklift pivots about its front axle, so the tail swings wide and it turns almost on the spot. Top speed stays a crawl (8), and it beeps while reversing.
Signature mechanic: the forks. The carriage runs from the ground to about 3.5 blocks up, slower when loaded. Driving the forks under something lifts it: crates and pallets (props), a goblin (who sits on the forks and flails), or the front of a light car. Lowering a load onto a ledge or a roof sets it down there. A load held high makes the forklift tippy: a sharp turn above about 5 km/h with the forks raised tips it on its side, which is the comedy beat. Raised forks also work as a lance at that height, poking props and goblins off balconies. If nothing else, the forks move and show on the model, which is the minimum Thomas asked for.
Instrument. No speedometer. A mast gauge instead: a vertical rail with the carriage's height, the tilt angle as a small arc, the load's name and weight, and a tip-risk bar that reddens as height, load and turning add up.
Tractor (farm context)
Action
Keyboard
Pad
Drive / reverse
W / S
RT / LT
Steer
A / D
Left stick
Hand throttle (cruise): step up / down
R / Shift+R
D-pad up / down
Raise / lower implement
Space
RB
Swap implement (plough, mower, none)
Right click
LB
Horn
Left click
X
Handling. Slow but unstoppable: big rear wheels climb a one-block step that stops a car, and it shoves cars and pushes rubble aside at full torque. Hand throttle is three cruise steps (low, mid, high), like World of Tanks cruise control, so you can steer and work the implement without holding W.
Signature mechanic: the hitch. Lowered, the plough turns grass to dirt in a strip behind it and flings goblins aside; the mower shreds goblins and leaves a mown track. Both slow the tractor while working. A tractor towing nothing can still lower its empty hitch for a scraping noise and sparks on roads.
Instrument. A small round tachometer with the cruise step (L / M / H) and a hitch light; speed shown as a small number only, since tractors do have one but it barely matters.
Hovercraft (stays in road, its own profile)
Keep today's slide, and lean into it: no brakes (S is reverse thrust, so stopping is a skill), A/D works the rudders behind the fan, and Space dumps the skirt: it drops onto the ground or water, grips hard and stops sliding, then pops back up on release. Instrument: the car dial restyled as a fan-RPM gauge with a drift-angle indicator showing heading against travel.
Tank (tank context)
Action
Keyboard
Pad
Tracks forward / back
W / S
Left stick up / down
Turn hull (neutral steer at rest)
A / D
Left stick left / right
Turret and gun
Mouse (as now)
Right stick (as now)
Fire shell
Left click
RT
Zoom gunsight (hold)
Right click
LT
Hull lock (hull stops turning to follow input)
C
LB
Cruise step
Shift (taps)
Left stick click
Shell type: HE / AP
R
D-pad right
Handling. Steer by track speeds: at a standstill A/D pivots in place; while moving they slow one track, so turns widen with speed; reversing keeps steering the way you push, as most tank games do. Add weight to starts and stops (today the speed is a plain ease to 7). Crossing a slope tilts the hull, and the turret traverses slower than the camera, so leading a turn matters.
Signature mechanic: aim bloom and shell types. The gun's spread grows while moving or traversing and settles over about a second when still, shown by the crosshair ring shrinking, as in World of Tanks. HE shells break blocks in a wide crater (today's behaviour); AP shells punch one long tunnel and do double damage to vehicles. Zooming gives a gunsight view with range marks.
Instrument. Speed as a small digital number with the gear (F1 to F3, N, R), and a turret compass beside it: a top-down hull outline with the turret's direction drawn over it, so you can always tell where the gun points against where you are driving. The reload becomes a ring around the crosshair.
Helicopter (heli context)
Action
Simple (default)
Agile (opt-in)
Climb / descend
Space / C
W / S (collective)
Move
W / A / S / D, camera-relative (as now)
Mouse: pitch and roll
Turn
Follows the camera
A / D: yaw
Gun / rockets
Left click / right click
Left click / right click
Pad
Left stick move, RB climb, LB descend, RT gun, LT rockets
Left stick collective and yaw, right stick pitch and roll (Battlefield layout)
Handling. Simple mode keeps today's assisted flight but adds inertia: the helicopter tilts into a move, then speed builds, and letting go it flares nose-up and settles into a hover. Agile mode is real attitude control for players who want to strafe and pull pedal turns. Rotor spool-up on entry (the M.spin ramp) gets a visible RPM needle and a whine.
Signature mechanic: the rotor is a weapon, and autorotation. Brushing the main rotor against goblins on rooftops minces them; against a wall it chips blocks and damages the helicopter. Shot down to low health, it autorotates: power fails, it spins slowly, and you can still glide it to a rough landing instead of always exploding.
Instrument. A compact rotorcraft panel: a small artificial horizon, height above ground (the number that matters when hovering), airspeed in knots, and rotor RPM. No km/h dial.
Planes: two-seater, airliner, fighter jet (air context)
Why roll is capped today. drvPlane stores a plane's attitude as a bank angle (F.rl, clamped to about 60 deg, 63 for the two-seater, 80 for the jet), a nose angle (F.pt, clamped to -34 to +40 deg) and a flight-path angle (F.gm, clamped to +/-75 deg), then rebuilds the model's rotation from them each frame. Raising the clamps alone would break it: past 90 deg of bank the turn maths flips, and the flight-path angle cannot pass vertical, so loops are impossible. The fix is a model change, not a tuning change.
The new flight model. Keep the plane's orientation as a quaternion and its velocity as a vector. Each frame: roll, pitch and yaw rates come from input (with per-axis damping), and rotate the quaternion in the plane's own axes; lift acts along the plane's up axis, from airspeed squared times angle of attack, falling away past the stall angle (today's PLANE_KL, PLANE_AOA and stall logic carry over); a side force from sideslip swings the nose into the airflow; thrust, drag and gravity as now. That gives unlimited roll, loops, inverted flight, knife-edge and stalls that drop a wing, from about the same amount of code as today.
Two control modes, picked in Options (per player):
Action
Mouse-aim (default on mouse)
Direct (default on pad)
Steer
Mouse: point where you want to fly; the plane rolls and pulls toward it
W / S pitch, A / D roll
Roll by hand
A / D (overrides the assist while held)
(as above)
Throttle
W / S
Shift / C
Rudder
Not needed
Q / E (lock moves to middle click)
Free look
C (hold)
Mouse
Wheel brake, airbrake
Space
Space
Gear (two-seater, airliner), hook (jet)
R
R
Pad
Left stick pitch and roll, RT / LT throttle, LB / RB rudder, X gun, B missile, A airbrake, L3 gear
Mouse-aim is War Thunder's "Instructor": a marker shows where the mouse points and a controller flies the plane toward it, staying out of stalls, easing off near the ground, and levelling the wings when the marker is straight ahead. It makes the jet's cannon and the two-seater's loops easy on a mouse. Direct mode is the GTA V and Ace Combat layout, with an optional auto-level when the stick is let go.
Per-kind flavour.
Kind
Roll rate
Feel
Signature
Two-seater
about 120 deg/s
Light, forgiving stall, lands on roads and fields, loops easily
Smoke trail on right click: skywriting and stunt flying
Airliner
about 45 deg/s
Heavy, wide turns, slow to change speed; over-stressing it (hard pull at speed) creaks and then damages the wings
Autopilot (hold altitude and heading) on right click; cabin chime; belly-landing with the gear up is survivable but wrecks it
Fighter jet
about 270 deg/s
Fast and twitchy, keeps energy in turns
Afterburner on Shift (heat bar); double-tap A or D for a barrel roll; a hard pull greys the screen edges (G-vignette)
Instrument. A head-up display centred on the view, kept clear of the control column on the left: a horizon line and pitch ladder through the crosshair, an airspeed tape on its left and an altitude tape on its right (both inside the middle third), a heading strip along the top, and a throttle bar with gear and stall lights. The jet's is green and sharp; the two-seater gets three round gauges (airspeed, attitude, altimeter) in the corner instead, since it has no HUD; the airliner gets a small glass panel. The text readout now in the left column (planeHud) moves into these, leaving that column for controls only.
Boats (sea context)
Action
Keyboard
Pad
Throttle up / down a notch (stays set)
W / S (tap), hold to sweep
RT / LT
Rudder
A / D
Left stick
Drop / raise anchor
Space
RB
Boat special
Right click
LB
Horn
Left click
X
Handling. A throttle that stays where you leave it (Stop, Slow, Half, Full, and Astern), like the ship's telegraph but quicker. The hull pitches and rolls on waves scaled by the weather, leans into turns and leaves a wake. Fast boats plane: past a threshold the bow lifts, drag drops and speed jumps, and cresting a wave or wake throws them into the air. Dropping the anchor while moving stops the boat hard and swings it round, the Sea of Thieves anchor turn.
Per-kind flavour.
Kind
Feel
Special
Rowboat
No engine: alternate left click and right click to pull each oar; both together go straight, one turns; rhythm sets speed
(the oars are the controls)
Pedalo
Hold W to pedal, tapping in rhythm goes faster; turns on a tiller
Bell
Speedboat
Planes early, jumps waves, tight turns
Boost
Sailboat
Speed depends on the sail's angle to the wind: W/S hoist and lower the sail, Q/E trim it; a motor for when the wind is wrong
Swing the boom across (knocks goblins overboard)
Fishing boat
Slow, steady
Cast the net: catches swimming goblins and reels them in
Launch, ferry
Steady, heavy
Ferry: horn blast that scatters goblins on the quay
Tug
Slow, very strong
Push mode: shoves boats and ships it touches
Navy boat
Fast, armed
Deck gun, if it has one; otherwise a searchlight
If the weather code has no wind yet, add one wind direction and strength per world (changing slowly), which the sailboat and the balloon both use.
Instrument. Speed in knots, on a brass-ringed marine dial, with the throttle notch beside it as a small lever and a compass card under it. The rowboat and pedalo show a stroke-rhythm meter instead of speed.
Ships: barge, carrier (stay in their own controls)
The ships already have the best controls in the game (a seven-step engine telegraph, rudder, bridge view), so this is mostly display. Move the text now in the left column (order, knots, rudder angle) into a ship's panel: a round engine-order telegraph dial with the ordered and actual speed, a rudder-angle arc with a detent click at amidships, and the compass. Add the anchor on Space for the anchor turn. The left column keeps only the controls.
Trains and subway (rail context)
Action
Keyboard
Pad
Lever toward power / toward brake, one notch
W / S
RT / LT
Reverser: forward, neutral, reverse
R
D-pad up / down
Emergency brake
Space
A
Horn (hold for a long blast)
Left click
X
Bell, or subway doors
Right click
LB
Handling. Replace "forward is wherever you look along the track" with a reverser, so the camera is free to look around. One combined lever runs from five brake notches through neutral to five power notches; the train carries its momentum, and braking takes real distance. Doors only open when stopped.
Signature mechanic: overspeed. Each bend has a safe speed; the HUD marks it on the speedometer before you reach it. Taking a tight bend far too fast derails the train, reusing the coaster's derail and the train's crash code: the most spectacular thing a train can do in a game about chaos.
Instrument. A cab panel: a train speedometer in km/h with a red overspeed mark for the next bend, the lever drawn with its notch (B5 to P5), the reverser state, and a brake-pressure needle.
Hot-air balloon (balloon context)
Action
Keyboard
Pad
Burner (hold)
Space
A / RT
Vent
C
B / LT
Nudge (small, slow)
W / A / S / D
Left stick
Drop a sandbag
Right click
RB
Drop / pull up the rope
Left click
X
Handling. Real balloons steer by height: give the air three or four layers, each with its own wind direction and strength, and let the balloon drift with the layer it's in. The burner warms the envelope with a lag of a second or two, so climbs have to be planned. Keep the camera-relative drift, but cut it to about a third of today's so it trims rather than steers.
Signature mechanic: sandbags and the rope. Each sandbag dropped gives an instant small lift and lands on whatever is below (a soft thud and a squashed goblin). The rope dangles from the basket: goblins on the ground grab it and climb up to board you, and players can climb it too.
Instrument. No speedometer. A variometer (climb-rate needle), altitude, and envelope temperature, with the wind layers drawn as a small stack of arrows beside the altitude, the current one highlighted. That stack is the map for steering.
Mobile Gear (suggestions only)
Thomas is happy with it, so only the speedometer changes. The futuristic speed ring on the mock-up page replaces the shared dial: a segmented arc in the Mobile Gear's cyan, a mode tag (WALK, SKATE, AIR, ASSAULT) that recolours the ring, vertical speed and altitude, and quick-boost readiness pips round the rim. It stays in the same corner, under the weapon readouts (.mgro), so nothing else moves. Two optional ideas: let the energy bar curve along the inside of the ring, and flash the ring red while redlined (M.red) to tie it to the energy system.
Not driven, or no speed
Deck weapons, a gunner's seat and theme park rides show no instrument at all; a gunner sees their weapon's ammo panel only. Passengers see the same instrument as the driver.
HUD and speed display
Speed shows only where a real vehicle of that kind would show it, in the units its world uses; everything else gets the instrument that matters for it, or none. The mock-ups are on one page: Vehicle instruments
, a game screen per vehicle with the needles moving.
Vehicle
Speed shown?
Instrument in the bottom-right corner
Around the crosshair
Car, supercar, van, police and the rest
Yes, km/h
Ink dial plus tachometer and gear; drift-charge ring
Nothing new
Motorcycle
Yes, km/h
Slim digital dash: rev bar, speed, gear, lean
Truck, lorry, bus
Yes, km/h
Ink dial with an air-brake needle
Hovercraft
Yes, as fan power
Fan dial plus slip angle
Forklift
No
Mast gauge: fork height, tilt, load, tip risk
Tractor
Small number
Tachometer with cruise step and implement light
Tank
Small number
Turret compass, speed and gear, shell type
Bloom ring, reload arc, gun marker
Helicopter
Knots, secondary
Height above ground, airspeed, rotor RPM, small horizon
Fighter jet
Knots, on the HUD
None
Green HUD: pitch ladder, speed and altitude tapes, heading, throttle, G
Two-seater
Knots
Three round gauges: airspeed, attitude, altimeter
Airliner
Knots
Small glass panel with autopilot state
Boats
Knots
Marine dial, throttle lever, compass
Rowboat, pedalo
No
Stroke-rhythm meter
Ships
Knots
Engine telegraph dial, rudder arc
Train, subway
Yes, km/h
Train dial with next-bend limit, lever notches, reverser, brake pressure
Hot-air balloon
No
Variometer, envelope heat, wind at each height
Mobile Gear
Yes, km/h
Futuristic speed ring: segmented, mode-coloured, vertical speed, altitude, quick-boost pips
Unchanged
Deck weapon, gunner seat, rides
No
None
Weapon only
The frames keep the layout rules from the brief: the controls column on the left is unchanged in form and only lists the current context's actions; the vehicle's health still sits above the hearts. Two things move out of that left column: the plane's throttle, speed and climb text (planeHud) and the ship's order, knots and rudder text (shipHow), because the new instruments show them. Knots on water and in the air, km/h on land, keeps each world's own units, following the game's one block to one metre.
Build order and the shared-base refactor
Wait for the shared vehicle base to land, then build in this order, so each step is playable on its own and the riskiest model change comes after the plumbing. Each step is one commit on test with its patch notes and the drive and newveh suites passing.
Plumbing (with or straight after the refactor): action contexts in ACTS and the Controls screen, analog triggers in drvIn, the HANDLING table, and the instrument slot with today's dial as the first renderer. No behaviour changes yet.
Instruments for every vehicle, as in the mock-ups. Cheap, visible, and it hides the speedometer where it does not belong straight away.
Forklift forks and tractor hitch. Small, self-contained, and the forklift is the example Thomas named.
Road handling: grip and slip, handbrake, drift boost, per-type specials, siren pull-overs.
The new flight model for all three planes, with Mouse-aim and Direct modes. The biggest single change; it needs its own test that rolls a full 360 deg, loops, and lands each plane, alongside the current take-off and landing checks.
Tank track steering, bloom, HE and AP.
Helicopter inertia, Agile mode, autorotation.
Boats (waves, planing, anchor, per-kind specials) and the ship panel.
Trains reverser, lever and overspeed derail.
Balloon wind layers, sandbags and rope.
Mobile Gear speed ring (can go any time after step 1).
What to agree with the refactor thread: the base should carry, per kind, ctx (the control context), handling (the profile), inst (the instrument renderer, or null) and how (the control lines for the left column, replacing the branches in drvHow). If those four fields go in now, every step above slots in without touching the base again. All of this lives on the vehicle, not the character, so Gnash and Grizzle drive identically, and if Gus and Gertie ever get vehicles they inherit it alike.
Decisions for Thomas
None of these block the report; each has a recommendation, and building would start on the recommended option unless you say otherwise.
Question
Recommendation
Alternative
Default plane controls on mouse and keyboard
Mouse-aim (War Thunder style), Direct as an option
Direct by default, closer to today
Helicopter default
Simple (today's, with inertia), Agile as an option
Agile by default
Drift boost on every car
Yes, except bus and lorry
Supercar and motorcycle only
Train derails when far over a bend's speed
Yes, it suits a chaos game
Overspeed only warns
Forklift tips over with a high load in a hard turn
Yes, as comedy
Never tips
Speed units
km/h on land, knots on water and in the air
km/h everywhere
Mobile Gear ring font
Chakra Petch (new Google font, futuristic)
The game's pixel face, no new font
Rowboat oars on left and right click
Yes, rowing as rhythm
Plain W/S like other boats
Also worth a decision before the build starts: whether the per-vehicle control contexts get their own rebinding sections in Controls now (recommended, as the Mobile Gear has), or later.
Sources
Game code read from C:\Claude\Goblin-Stompin-Gus\src (test branch, 18 Nov 2026): vehicles/driving.js, car-physics.js, cars.js, boats.js, ships.js, balloon.js, fight.js, registry.js, ui/minimap.js, ui/controls.js, ui/input.js, player/players.js, style.css.
War Thunder wiki: How the Instructor works
Battlefield 6 helicopter controls (All Things How)
GTA V controls guide (BisectHosting)
World of Tanks: Controls and Firing
Super Mario Wiki: Mini-Turbo
Train Sim World control guide (Dovetail)
Sea of Thieves ship guide (Windows Central)
Mock-ups: Vehicle instruments
