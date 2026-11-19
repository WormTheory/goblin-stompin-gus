// ---- Every weapon a goblin can carry, in one table: the enemies' and a player goblin's (Gnash's) alike ----
// One entry per weapon, in the order the weapon button goes through them (WEAPON_ORDER). Each has:
//   name, about (a line for the Character tab's loadout), kind ('melee', 'gun', 'spell' or 'throw': a gun's rounds are
//     hitscan, a spell's fireball a real thing that flies, updateFireballs in shots.js; both are what a goblin uses at range);
//   model: the boxes it's made of, [w,h,d,colour,x,y,z,role] (a colour of null is the goblins' club brown, GC.club; in
//     its file each is {s,p,c,...}, and may be tilted, r, or another shape, sh: assetBox, core/assets.js):
//     held in the hand, in the hand's own frame (an enemy's, and a player goblin as the others see him: goblinModel, gobKit),
//     view in your own first-person view ([...,renderOrder], with fore: where the other forearm reaches in to hold it),
//     drop lying on the ground to be picked up (puModel); stow, for a gun, where an enemy carrying it beside a blade or
//     club keeps it while it isn't drawn, in the body's own frame (a holster on the belt, a rifle slung on the back);
//   its numbers, the same whoever uses it (a player goblin or any enemy): dmg, the damage of a blow, a round or a
//     blast; every, seconds between one use and the next; range, how far a gun reaches; breaks, whether its rounds can
//     break the block they hit (half the time: bulletBreak); r and reach, a blade's or a club's hit, how wide and how
//     far ahead; R and fuse, a grenade's blast radius and fuse. The rifle's butt is what an enemy strikes with up close
//     (butt). A spell's are near (the closest it's cast at), cast (seconds conjuring it, the warning you get) and ball (the
//     fireball's speed, how fast it bends after a target and from how far off (bend, seek), how long it lasts (life), how
//     close it must pass to hit a hippo (r) or a goblin (rg), and how far above or below the caster a target can be (dy)).
//     One edit here changes it for everyone who carries it;
//   npc: how an enemy uses it: the blow it strikes up close (strike, in STRIKES), the pose it aims in (pose, in STRIKES),
//     how its hands grip it (aim, a GUN_GRIP key), and for a spell how much the time to the next one varies (jit). How well each kind of enemy uses it (time to aim, shortest range,
//     how far it throws) is theirs, in FOES or GOB_FOES;
//   player: Gnash's own (gob-weapons.js: GOB_WPN is these blocks): the swing's timing, what it's called when it kills
//     (cause), and for a gun its kick (shake, rumble). The numbers above are copied into it (cd is every);
//   crack: a gun's sound, the same from either side ([noise], [tone]: wpnCrack);
//   drop: whether a killed enemy leaves it for Gnash to pick up, and stack: whether you carry a pile of them.
//   A gun's magazine: mag, the rounds it holds, and reload, the seconds it takes to fill it again (anyone's: Gnash's,
//   gob-weapons.js, and an enemy's, which stops to reload once it's fired them all). npc.rl and player.rl, how it looks, are
//   timelines in strikes.js. A gun can also be auto (Gnash fires for as long as the button's held; an enemy fires npc.burst
//   at a time), fire pellets (a shotgun: that many rounds, each dmg, scattered by spread), or a rocket (proj: it flies at
//   speed and bursts, radius R, crush the crater, vd its harm to vehicles; grav, how fast it drops, and lob, how fast it's sent up as it leaves; nuke, a big blast of
//   that reach where it lands, bigBlast; spare, how many more it can be reloaded with before it's empty for good). Each shot after the first can kick the view up
//   (player.climb), and a bolt or pump is worked between shots (player.cycle, the part tagged so in model.view).
//   A landmine (kind 'mine', stack) is planted where you stand and goes off on the first enemy over it once it's armed
//   (arm seconds): mines.js. A view box can carry a tag after its render order: 'mag' (dropped out in a reload), 'load'
//   (a rocket: shown only while loaded), 'bolt', 'pump' or 'slide' (worked after each shot).
// To add a weapon: a file in src/assets/weapons/ (the editor's New weapon, or a copy of another) named in its
// _order.json, and its key in the weapons list of whichever kinds of goblin carry it (FOES in foes.js,
// GOB_FOES below). The Character tab's goblin loadout, the drops, the HUD and the weapon button all pick it up from here.
// (the table itself is in src/assets/weapons/, one file per weapon in the order of its _order.json, edited with the
// editor in tools/editor/: core/assets.js builds it from them as the page loads)
const WEAPONS=assetWeaponsAll(ASSETS);
const WEAPON_ORDER=Object.keys(WEAPONS);
// (what's worked out from an entry as it's loaded: also run on a weapon the editor sends a running game, editor-live.js)
function wpnDerive(k,W){W.k=k;if(!W.player)return;W.player.name=W.name;
  // (Gnash's block takes the weapon's own numbers, so they're only ever set in the one place)
  for(const s of ['dmg','range','breaks','r','reach','R','fuse','mag','reload','pellets','spread','proj','speed','crush','vd','carDmg','arm','grav','lob','nuke','spare'])if(W[s]!==undefined)W.player[s]=W[s];if(W.every!==undefined)W.player.cd=W.every;
  if(W.cast!==undefined)W.player.lunge=W.cast;}   // (a spell's conjuring is the wind-up before it goes: doBite comes after it)
for(const k of WEAPON_ORDER)wpnDerive(k,WEAPONS[k]);
// ---- what each kind of goblin carries: weapons, a list of keys in WEAPONS, on its own entry. The compounds', the
// carrier's and the bases' people are in FOES (foes.js); the street's are here: an ordinary hostile goblin, a police
// officer (any street goblin in police blue, armed as one by foeArm: foes.js), the townsfolk, who carry nothing and run,
// and the cultists, with their fireball spellbook and ritual dagger (cultists.js). Everything reads the list: the model (which weapons are
// in its hands, a holster for a gun it carries beside a blade or club: goblinModel), the AI (a gun at range, the blade,
// club or rifle butt up close, grenades when it throws: foeRanged and the chase in routes.js), what it drops (gobGear),
// what's in its hand, gun or blade (wkitState, foes.js; online too) and the Dev tab. How each kind uses its gun and grenades (gun, bomb), what its blow
// is called (hitBy) and the fists of one with nothing to strike with (melee) are on the entry too; pack is anything it
// carries but never uses, dropped when it's killed. So giving a goblin a new weapon is one edit to its list ----
const GOB_FOES={
  goblin:{name:'Goblin',weapons:['club'],hitBy:'Clubbed to death'},
  police:{name:'Police officer',weapons:['club','handgun'],hitBy:'Clubbed to death',gun:{near:4,aim:0.45,cause:'Shot by the police'}},
  civilian:{name:'Civilian',weapons:[]},
  cultist:{name:'Cultist',weapons:['spellbook','dagger'],hitBy:'Stabbed with a ritual dagger',gun:{cause:"Burned up by a cultist's fireball"}}};   // (how near it casts and how long it conjures are the spellbook's own)
const wpnOfKind=(L,kind)=>(L||[]).find(k=>WEAPONS[k]&&WEAPONS[k].kind===kind)||null;
// (F: a kind's entry. Its gun, its grenades, and what it strikes with up close: a blade or club, else a gun's butt, else
// nothing, its fists)
// (what it uses at range: a gun or a spell)
const wpnRanged=L=>(L||[]).find(k=>WEAPONS[k]&&(WEAPONS[k].kind==='gun'||WEAPONS[k].kind==='spell'))||null;
const foeGunK=F=>wpnRanged(F&&F.weapons),foeThrowK=F=>wpnOfKind(F&&F.weapons,'throw');
const foeMineK=F=>wpnOfKind(F&&F.weapons,'mine');   // (landmines, planted in its path: mines.js)
const foeMeleeK=F=>wpnOfKind(F&&F.weapons,'melee')||(F&&F.weapons||[]).find(k=>WEAPONS[k]&&WEAPONS[k].butt)||null;
// (which kind a goblin is: one out of FOES, a cultist, one of the townsfolk, an officer (g.arms, set by foeArm) or else
// an ordinary hostile goblin)
const foeOf=g=>g.arms||(g.foeKind?FOES[g.foeKind]:g.cultist?GOB_FOES.cultist:g.civ?GOB_FOES.civilian:GOB_FOES.goblin);
// (goblinModel's options for a kind: its weapons in its hands, the grenade's colour)
const foeModelOpt=F=>({weapons:F.weapons,held:F.held});
// what one strikes with up close, {dmg,every,cause,w}: the blade or club it carries, or a rifle by its butt, or with
// none of those its own fists (its melee). F: its kind's entry
function strikeOf(F){const k=foeMeleeK(F);if(!k)return F&&F.melee||{dmg:1,every:1.2,cause:'Beaten to death',w:'Fists'};
  const W=WEAPONS[k],s=W.kind==='melee'?W:W.butt;return{dmg:s.dmg,every:s.every,cause:F.hitBy,w:W.kind==='melee'?W.name:W.name+' butt'};}
// a gun going off, heard the same whoever fires it
function wpnCrack(k){const C=WEAPONS[k]&&WEAPONS[k].crack;if(!C||!audio)return;noise(C[0][0],C[0][1],C[0][2],'highpass');tone('square',C[1][0],C[1][1],C[1][2],C[1][3]);}
// a weapon's boxes, each handed to make(w,h,d,colour,x,y,z,last) (the role or render order)
// the sound as one starts to aim or conjure (k a weapon; t how long it takes): a spell's rising note (its cue), a gun's click
function wpnCue(k,t){const c=WEAPONS[k]&&WEAPONS[k].cue;if(c)sfx('Fireball conjured',()=>{tone(c[0],c[1],c[2],t,c[3]);});else tone('square',1400,1200,0.04,0.03);}
// (and its tag, for a part of the view that moves on its own: a magazine, a bolt...)
// the sounds of a reload, the same from either side: 0 the magazine out (or the gun opened), 1 the new one in, 2 ready
// (the slide, bolt or pump racked; a rocket seated)
function wpnClack(k,n){if(!audio)return;const W=WEAPONS[k];if(!W||!W.mag)return;
  sfx(n===0?'Magazine out':n===1?'Magazine in':'Reloaded',()=>{
    if(n===0){noise(0.05,0.06,1800,'bandpass');tone('square',520,320,0.05,0.025);}
    else if(n===1){noise(0.04,0.08,2600,'highpass');tone('square',260,200,0.04,0.035);}
    else{noise(0.06,0.06,3200,'highpass');tone('square',900,600,0.035,0.03,0.06);}});}
// (make returns the mesh it made, so a box drawn tilted or as another shape in the editor gets that: assetShape)
function wpnBoxes(list,make){for(const b of list||[])assetShape(make(b[0],b[1],b[2],b[3]??GC.club,b[4],b[5],b[6],b[7],b[8]),b);}
