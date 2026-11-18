// ---- Every weapon a goblin can carry, in one table: the enemies' and a player goblin's (Gnash's) alike ----
// One entry per weapon, in the order the weapon button goes through them (WEAPON_ORDER). Each has:
//   name, about (a line for the Character tab's loadout), kind ('melee', 'gun', 'spell' or 'throw': a gun's rounds are
//     hitscan, a spell's fireball a real thing that flies, updateFireballs in shots.js; both are what a goblin uses at range);
//   model: the boxes it's made of, [w,h,d,colour,x,y,z,role] (a colour of null is the goblins' club brown, GC.club):
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
// To add a weapon: an entry here, and its key in the weapons list of whichever kinds of goblin carry it (FOES in foes.js,
// GOB_FOES below). The Character tab's goblin loadout, the drops, the HUD and the weapon button all pick it up from here.
const WEAPONS={
  club:{name:'Club',about:'A heavy swing that knocks goblins flat and dents cars',kind:'melee',drop:false,
    dmg:1,every:1.2,r:1,reach:1.1,
    model:{held:[[0.11,0.11,0.55,null,0,0.02,0.22,'club'],[0.19,0.19,0.19,null,0,0.02,0.5,'club']],
      view:[[0.07,0.42,0.07,null,0,0.17,-0.42,61],[0.15,0.17,0.15,null,0,0.42,-0.42,62]]},
    npc:{strike:'club'},
    player:{dur:0.38,lunge:0.16,cause:'Clubbed by another goblin',pvp:'Clubbed'}},
  dagger:{name:'Dagger',about:'Quick stabs at whatever is right in front of you',kind:'melee',drop:true,
    dmg:2,every:0.5,r:0.95,reach:1.0,
    model:{held:[[0.08,0.08,0.12,0x2a1a10,0,-0.02,0.06,'hilt'],[0.05,0.03,0.34,0xd0d4dc,0,-0.02,0.29,'blade']],
      view:[[0.09,0.09,0.13,0x2a1a10,0,0.02,-0.44,61],[0.14,0.04,0.04,0x6a5a3a,0,0.02,-0.52,61],[0.025,0.05,0.34,0xd0d4dc,0,0.02,-0.71,62]],   // (pointing forward, for stabbing)
      drop:[[0.08,0.08,0.14,0x2a1a10,0,0,-0.14],[0.05,0.03,0.36,0xd0d4dc,0,0,0.1]]},
    npc:{strike:'dagger'},
    player:{dur:0.26,lunge:0.1,cause:'Stabbed by a goblin',pvp:'Stabbed'}},
  handgun:{name:'Handgun',about:'A police pistol: quick to fire again, but a shorter reach',kind:'gun',drop:true,
    dmg:1.5,range:30,every:0.5,breaks:true,
    // (as the police hold theirs: its barrel on down past the fist like the rifle's, so it points straight out when the
    // arm's raised to aim)
    model:{held:[[0.07,0.27,0.09,0x22262c,0,-0.1,0.06,'gun'],[0.06,0.08,0.15,0x22262c,0,0.01,-0.03,'gun']],
      view:[[0.07,0.13,0.1,0x22262c,0,-0.03,-0.4,61],[0.06,0.07,0.3,0x22262c,0,0.06,-0.5,62]],fore:[[-0.07,-0.06,-0.42],[-0.5,-0.42,0]],   // (the grip, and the slide pointing on along the view)
      drop:[[0.06,0.09,0.22,0x22262c,0,0.03,0],[0.06,0.14,0.07,0x22262c,0,-0.06,-0.07]],
      stow:[[0.09,0.2,0.15,0x14110e,0.29,0.4,0.03,'holster']]},   // (in its holster on the right hip)
    npc:{aim:'pistol',pose:'pistol'},   // (raised in both hands; up close an officer uses the club it also carries)
    player:{dur:0.16,lunge:0.01,cause:'Shot by a goblin',shake:0.02,rumble:0.14},
    crack:[[0.06,0.12,3400],[330,140,0.045,0.035]]},   // (sharper and shorter than a rifle's)
  rifle:{name:'Rifle',about:'Hits hard and far, down the middle of your view',kind:'gun',drop:true,
    dmg:2,range:48,every:1.0,breaks:true,butt:{dmg:1,every:1.3},
    // (pointing on down past the hand, so it's level when the arm is raised to aim)
    model:{held:[[0.1,0.3,0.14,0x4a3420,0,0.04,0.06,'stock'],[0.07,0.62,0.07,0x22262c,0,-0.38,0.06,'gun'],[0.05,0.12,0.05,0x22262c,0,-0.12,0.13,'gun']],
      view:[[0.1,0.12,0.34,0x4a3420,0,0.02,-0.36,61],[0.07,0.07,0.78,0x22262c,0,0.07,-0.86,62],[0.05,0.12,0.05,0x22262c,0,-0.04,-0.6,62]],fore:[[0,-0.01,-0.92],[-0.62,-0.42,-0.1]],
      drop:[[0.1,0.14,0.3,0x4a3420,0,0,-0.36],[0.07,0.07,0.7,0x22262c,0,0.02,0.12],[0.05,0.12,0.05,0x22262c,0,-0.07,-0.12]],
      stow:[[0.1,0.3,0.14,0x4a3420,0.12,0.3,-0.25,'stock'],[0.07,0.62,0.07,0x22262c,0.12,0.74,-0.25,'gun']]},   // (slung upright on the back, the barrel up past the shoulder)
    npc:{strike:'butt',aim:'rifle',pose:'aim'},   // (up close, its butt: a rifle's the blow of whoever carries no blade or club)
    player:{dur:0.2,lunge:0.01,cause:'Shot by a goblin',shake:0.03,rumble:0.2},
    crack:[[0.09,0.14,2600],[220,90,0.06,0.04]]},
  // the cultists' book of fireballs: held open in one hand while the other conjures a ball of fire and hurls it. The ball
  // flies (it isn't hitscan: you can dodge it) and bends a little after whoever's nearest, a cultist's after a player, a
  // player goblin's after an enemy goblin (or another player, with PvP on)
  spellbook:{name:'Fireball Spellbook',about:'Conjures a fireball that bends after the nearest enemy; slow to come again',kind:'spell',drop:true,
    dmg:2,range:30,near:4.5,cast:0.7,every:3.1,
    ball:{speed:15,bend:0.6,seek:40,life:3.5,r:1.4,rg:0.9,dy:14},
    // (a red leather cover, cream pages, open across the hand, its spine along the forearm)
    model:{held:[[0.36,0.04,0.26,0x6a1a14,0,-0.04,0.16,'book'],[0.32,0.05,0.22,0xe8dcb0,0,-0.01,0.16,'page'],[0.03,0.07,0.24,0x3a0e0a,0,-0.01,0.16,'book']],
      view:[[0.4,0.03,0.28,0x6a1a14,-0.04,0.06,-0.5,61],[0.36,0.04,0.24,0xe8dcb0,-0.04,0.08,-0.5,62],[0.02,0.06,0.26,0x3a0e0a,-0.04,0.09,-0.5,62]],
      fore:[[-0.34,-0.02,-0.66],[-0.66,-0.46,0]],   // (the other hand out in front to the left, where the fireball comes from)
      drop:[[0.3,0.08,0.22,0x6a1a14,0,0,0],[0.26,0.06,0.2,0xe8dcb0,0.03,0,0],[0.04,0.1,0.06,0xd0a030,-0.15,0,0]],
      stow:[[0.07,0.26,0.2,0x6a1a14,-0.29,0.36,0.02,'book']]},   // (shut, hung at the left hip)
    npc:{pose:'cast',jit:1.6,dy:14},
    player:{dur:1.05,cause:"Burned up by a goblin's fireball",pvp:'Burned'},
    cue:['triangle',180,420,0.04]},   // (the rising note while it's conjured: wpnCue)
  grenade:{name:'Grenades',about:'Thrown with Stomp: how many he starts with',kind:'throw',drop:true,stack:true,
    dmg:3,R:3.3,fuse:2.2,   // (how often one's thrown is the thrower's: Gnash's cd below, each enemy's in FOES)
    // (an enemy holds its own, in its own colours, while winding up to throw: FOES' held)
    model:{drop:[[0.22,0.24,0.22,0x3a4a22,0,0,0],[0.08,0.08,0.08,0x8a8a90,0,0.15,0]]},
    player:{cause:"Blown up by a goblin's grenade",max:9,cd:0.6,v:15}}};
const WEAPON_ORDER=Object.keys(WEAPONS);
for(const k of WEAPON_ORDER){const W=WEAPONS[k];W.k=k;if(!W.player)continue;W.player.name=W.name;
  // (Gnash's block takes the weapon's own numbers, so they're only ever set in the one place)
  for(const s of ['dmg','range','breaks','r','reach','R','fuse'])if(W[s]!==undefined)W.player[s]=W[s];if(W.every!==undefined)W.player.cd=W.every;
  if(W.cast!==undefined)W.player.lunge=W.cast;}   // (a spell's conjuring is the wind-up before it goes: doBite comes after it)
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
function wpnBoxes(list,make){for(const b of list||[])make(b[0],b[1],b[2],b[3]??GC.club,b[4],b[5],b[6],b[7]);}
