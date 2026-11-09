# Online co-op

Up to four players in one city over the internet (or two tabs of one browser). The code is in `src/js/net/`:
`net-core.js` (transports, hosting, joining, controls), `net-sync.js` (snapshots, events, what a guest shows and
guesses), `net-lobby.js` (the Open games list), `net-ui.js` (the Play online panel on the main menu). Nothing in it runs until someone hosts or joins, so
single player and split-screen co-op play exactly as before.

## How it works

**Host-authoritative, peer to peer.** One player's browser, the *host*, runs the whole game as it always has. The
second seat (`P2`, the split-screen player two) is driven by a *guest's* controls arriving over the network instead of a
controller. The guest's browser builds the same city, sends its controls, and draws what the host sends back. It runs
none of the goblins, traffic, damage or smashing itself, so nothing can disagree with the host.

- **The world.** It's deterministic from its seed, so the host sends `saveText()` (seed, packed edits, collapses,
  wrecks, knocked-down fixtures, destruction counts, plus the Testing Environment's boxes). The guest keeps it in the
  tab's **sessionStorage** (`gsg-net-world`, with `gsg-net-join` saying which room) and reloads, so `load()` builds the
  host's world afresh (every cache the city keeps is worked out for that seed). The guest's own city in localStorage
  is never touched, and a guest tab never saves (`saveBlocked`). After the reload it joins again by itself; the host
  sends the save again and the guest catches up on whatever changed meanwhile (`netCatchUp`). Leaving clears the
  session keys and reloads into the guest's own city.
- **Seats** (`NET_SEATS`, 4). The host is seat 0. A guest takes player two's seat (`P2`, with `P2.net` set) if nobody's
  in it on the host, otherwise a third or fourth, made when first wanted (`makePlayer`, pushed on `players`; nothing
  extra exists offline). So a host can play split-screen with someone on the sofa and still have two more join online.
  On a guest, its own hippo is `P1`, the host's `P2`, and any other guest a player made for its seat (`netSeatP`,
  `NET_SEATP`), all flagged `.net`. `layout()` never splits the screen for a `.net` player two.
- **Controls** (`netSendInput`, 30 a second): stick, held buttons, presses and the camera's yaw and pitch. Presses,
  and buttons held at any moment since the last message, are gathered up so a one-frame tap is never lost; on the host
  a press counts once (`netHostInputs`, called from `netTick` right after `readInputs`). The camera is the guest's own,
  so turning never waits on the network. Each player keeps the abilities switched on in their own browser: the host
  swaps them into `ABIL` for that player's step (`p.abil` in `updatePlayer`). Binds are each browser's own anyway.
- **Snapshots** (`netSendSnap`, 15 a second, one per guest): every plain value on each player that's changed since the
  last (`netPlayerState`, a delta), its place, and the pose of each joint (`netJoints`); the goblins (place, turn,
  limbs, with how each looks sent once per identity) and vehicles (place, wheels, kind and paint sent once) near that
  guest; the venues' moving models (`netVenues`: trains, planes, boats, rides, animals, base vehicles; each joint sent
  only when it's moved); falling pieces of buildings; score and kills; the events since the last; and once a second the
  world's saved state, the fires, the clock, the weather, the hostility setting, and in the Testing Environment the
  structures spawned there (a guest builds or removes each as the host does).
- **Events**: everything the host's game does once. Block changes are caught where they're all made, `addEdit`, and
  sent as flat lists. Effects are caught by wrapping the functions that make them (`netFx`: `puff`, `smoke`, `blood`,
  `splat`, `destroyFX`, `shockwave`, `shockCone`, `blastFx`, `tone`, `noise`, `woosh`, and `flashLabel` to the player it
  was for); only the outermost call goes (`NET_FXD`), and the guest makes the same call. Toppling pieces and sinking
  collapses (`makeTopple`, `makeBody`) go as their blocks once, then where they are each snapshot.
- **Showing it** (`netGuestFrame`): the guest draws the host's game `NET_DELAY` (100 ms) behind the host's clock,
  blending between the snapshots either side, and does each snapshot's events as it becomes the one shown
  (`netCommit`). The host's goblins and vehicles are mirror objects (`NETM`) pushed into `goblins` and `cars`, so
  `batDraw`, the minimap and lock-on see them as usual; the guest's own are hidden. Its venues are run quietly
  (`NET_MUTE`) so their models exist, and every joint the host has sent is pinned where the host has it.
- **Its own hippo** (`NETP`, `netPredStep`): a guest moves its own hippo straight away with the same player code (with
  `setRaw`, `addEdit`, damage and `crush` doing nothing on a guest, and its effects muted), and keeps a short history of
  where it put him. Each snapshot says which of its controls the host had taken in and how long before (`ack`, `adt`);
  the host's place for him then, against the history, is how far the guess drifted, and he's eased back over a few
  frames (`netPredEase`). Driving, riding or clinging to a vehicle, or dead, and it shows the host's own; more than 6
  blocks out and it starts again from the host's.
- **Lag compensation** (`netRewind`): while a guest's hippo is attacking, the host puts every goblin back where that
  guest was seeing them for that player's step (the guest sends the host time it's showing, `vt`), then returns them.
- **Driving** (as Gnash): the guest's `use` reaches the host's own driving code; the snapshot carries the vehicle's kind
  and pose (`dv`), which a guest uses for its chase camera (`drvPose` returns `D.netS`).
- **Dropping out.** A guest whose connection drops tries again for 30 s without reloading (`netDropped`, `netRetry`),
  showing the world as it was; the host keeps its seat and its hippo for 30 s (`netHostDropped`), recognising the tab
  by an id in its sessionStorage (`gsg-net-cid`, which also covers the reload into the host's city). A guest that leaves
  frees the seat at once. The host leaving (or stopping hosting) sends the guest home; the host stopping just plays on
  alone.
- **A tab in the background** (`NET_BG`, `netBgClock`): browsers give a hidden tab no animation frames and slow its
  timers, which froze the host's game for everyone (and with two tabs of one browser one is always hidden). While
  online and hidden, a timer in a small worker (made from a blob; a plain `setInterval` if workers aren't allowed) calls
  `frame(now,true)`: the whole game runs, nothing is drawn, no next frame is asked for, and the sound is suspended.
- **Buildings coming down:** `collapseBuilding` takes a building's blocks out with `setRaw` alone (a chunk made later
  leaves them out by reading `collapses`), so they never pass through `addEdit`. It's wrapped to send `['c', key, floor]`
  before the falling pieces' own events; the guest's `netCollapse` takes the same blocks out of its loaded chunks
  (`NET_COLL` remembers which it has done, seeded from the save it built the city from). The once-a-second world state
  catches any it missed.
- **Knocked-over props and fixtures:** `knockFix` is wrapped to send `['k', key, angle, prop, x, z, y]` as the fall starts,
  and the guest plays it in `falling` (`netFallingTick`, moved on in `netGuestDress`), so it topples over 0.7 s as on the host.
- **Health:** goblins and vehicles carry their health and its maximum in every snapshot; the venues' vehicles (base
  armour, planes, boats, train cars) theirs when it changes (`netVenueHP`), kept on the guest as `netHp`/`netDead`
  beside its own models (whose own `hp`/`dead` its quiet venues might act on); the health bars read them through
  `netHp`/`netDead`. A player's `NET_AUTH` values (hearts, stamina and the like) go in every snapshot rather than only
  when changed, since the guest's own guess can wander from a value the host never changes.
- **Rules for two:** the world never pauses while someone's online (the pause menu just covers your screen); the host's
  hostility setting is the game's; only the host saves the world; New city and the Testing Environment are off while
  online. If both players pick the same hippo, the guest plays the other one so they can tell each other apart.

## Transports

All three have the same shape: `{kind, self, on:{msg(peer,data), join(peer), leave(peer)}, send(data, to?), close()}`.

- `netTrystero`: anywhere on the internet. Trystero 0.26.0 from jsDelivr (`NET_TRYSTERO`, an exact version), loaded with
  `import()` only when someone picks online play. It finds the other player through public Nostr relays and then talks
  directly over WebRTC. Players behind strict NATs need a TURN server: `NET_TURN` is the hook (e.g. Cloudflare's TURN),
  left `null` with no credentials in the repository.
- `netLoopback`: two tabs of one browser through a `BroadcastChannel` (the "Two tabs of this browser" box). Heartbeats
  each second; a tab not heard from for five is gone.
- The tests' own in-memory one (`tools/tests/net.js`), handed in through `NET.makeTr`, which passes every message
  through JSON and can add a delay.

## Open games (the lobby)

GitHub Pages serves only files, so there's no server to keep a list of games. Instead everyone with the Play online
panel open (and not already a guest), and every host whose game isn't private, joins one more room through the same
transport: `NET_LOBBY` (`gsg-lobby-` plus `NET_PROTO`, so it can't clash with a letters-only room code, and a new
protocol gets its own lobby, so nobody's shown a game they can't join). A host sends an `ad` to each peer that arrives
(and to an `ask`), again whenever it changes, and every 3 seconds (`LOBBY_AD_MS`); `gone` when it stops hosting or goes
private. A browser lists the ads heard in the last 10 seconds (`LOBBY_TTL`), dropping a peer the transport says has
left at once. Picking one calls `netStartJoin` with its code, exactly as typing it would. The "Private game" box
(`LOBBY.priv`, localStorage `gsg-net-private`) keeps a host out of the lobby; its code still works. `lobbySync`, called
from `netUiRefresh` and when the panel opens or closes, joins or leaves the lobby and says what's changed.
With no server, there's no cap on how many games can be listed, but every browser in the lobby connects to every other
one, which is fine for dozens of players and not for thousands.

| From | `t` | Fields |
|---|---|---|
| browser | `ask` | |
| host | `ad` | `code`, `who` (the host's character), `n` (players in, the host among them), `max`, `tenv` (Testing Environment) |
| host | `gone` | `code` |

## Messages

Every message is a JSON object with a type `t`, so a headless Node server could send the same ones.

| From | `t` | Fields |
|---|---|---|
| guest | `hello` | `v` (protocol, `NET_PROTO`), `cid` (this tab), `who` (0 Gus, 1 Gertie), `gob`, `abil` (its ability switches) |
| host | `welcome` | `v`, `seat` (1 to 3), `code`, `save` (`saveText()` JSON), `host: {who, gob}`, `clock` |
| host | `deny` | `why` (wrong version, game full) |
| guest | `in` | `n` (sequence), `x`, `z`, `lx`, `ly`, `h` (held buttons), `pr` (presses), `yaw`, `pitch`, `fl` (lock-on flicks), `vt` (host time it's showing) |
| host | `s` | `n`, `tt` (host time), `p` (players), `g`/`gl` (goblins and their looks), `c`/`cl` (vehicles and their kinds), `v` (venue joints), `fa` (falling pieces), `e` (events), `sc` (score, kills), `w` (world state, once a second), `k` (clock, weather, hostility, once a second) |
| either | `ping` / `pong` | `a` (sender's time), `b` |
| either | `bye` | |

A player in `p`: `s` (seat), `who`, `gob`, `act`, `f` (changed plain values; numbers to 3 places, non-finite ones as
strings), `pos`, `h`, `pose` (10 numbers a joint: place, turn, scale, shown), `lk` (lock-on target as `['g'|'c', n]`),
`rd` (riding or driving), `dv` (vehicle pose), and for the guest's own seat `ack` and `adt`.
Events in `e`: `['e', [x,y,z,b, ...]]` blocks, `['f', name, args]` an effect, `['t', id, blocks, pivot]` a topple,
`['b', id, blocks, clipY]` a collapse sinking, `['c', key, floor]` a building coming down from that floor,
`['k', key, angle, prop, x, z, y]` a fixture or prop knocked over.
A goblin in `g` ends with its `state`, `hp` and `hpMax`; a vehicle in `c` with its `hp` and `hpMax`. `vh` holds the venues'
vehicles' health as `[venue, list]`.

## Trying it

- **Two tabs, one computer:** open `game/index.html` (or the site) in two tabs. In both, Play online, tick "Two tabs
  of this browser" (the status line says how it goes, and hosting says "between this browser's tabs"). Host in one;
  pick its game from Open games in the other (or type its code and Join). Chromium shares a BroadcastChannel between tabs opened from the same file; a
  browser that doesn't (Firefox may keep file pages apart) gets "No tab of this browser is hosting room ..." after six
  seconds, with the advice to use the website or serve the folder (`python -m http.server`).
- **Two computers:** both open the published game. One clicks Host a game; the other opens Play online and picks it
  from Open games (or, for a private game, types in the five-letter code and clicks Join).
- **Tests:** `bash tools/run_tests.sh net` (host and guest in one process: joining, the world, controls, snapshots,
  smashing, a topple, driving, a slow network with the guest's guessing and lag compensation, a dropped connection,
  leaving). In a real browser, after `python tools/build_3d.py game/index.html tools/ui/t3.html`:
  `cd tools/ui && node netshot.js [seed] [outDir]` (two tabs), or `P2P=1 node netshot.js` (through the internet).
  `node lobbyshot.js [seed] [outDir]` checks Open games in four tabs: a listed host shown, a private one not, joining
  with one click, the player count going up, and the game leaving the list when its host stops (`P2P=1` works too).

## Known gaps

- Seats three and four are dressed as Gus or Gertie (or Gnash) like the first two: there are only two hippo colour
  schemes and two goblin names, so two players can look alike.
- A guest's driving display shows the vehicle's name, health and ammo but not the marker for where a shot would land.
  Riding and climbing vehicles work, shown from the host (no guessing).
- What the guest's goblins and cars show is their place, limbs and flashing lights: a technical's turning gun and the
  like on traffic aren't sent. The venue joints cover the venues' models (tanks' turrets, helicopters' rotors).
- Sounds a player's moves make are quieter on a guest the further that player is from the guest's own hippo (each
  carries the place of the player whose step made it, `NET_SPOS`); every other sound (goblins, traffic, crashes) is
  heard as the host's game made it, wherever the guest is.
- Prediction runs the player code on the guest's own copy of the world, whose goblins and vehicles are where the guest
  sees them; a guest standing on a moving vehicle, climbing one, or driving isn't guessed.
- The obituary and the explored map are each browser's own.
- The Testing Environment's Reset world reloads the host's page, which ends the session (guests go home after trying
  to reconnect).
- Each guest gets one snapshot built for it; with only one guest that's fine.

## Next steps

- A headless host in Node (the stubs the tests use already run the whole game) that serves rooms as a dedicated server.
- More looks for seats three and four.
- A guest's driving HUD; police lights, turrets and guns on mirrored vehicles.
- Give the rest of the sounds a place too (goblins', traffic's, the venues'), so each player hears them from where they are.
- Binary snapshots (or compression) if bandwidth matters: about 1 to 1.5 KB a message now.
