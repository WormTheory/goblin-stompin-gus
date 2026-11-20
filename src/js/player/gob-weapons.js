// ---- Gnash's weapons: what he starts with (his seat's loadout, gob-loadout.js), and what he takes off the enemies he kills ----
// (each weapon's numbers, shapes and sounds are its entry in WEAPONS, weapons.js)
// Each player goblin carries a list (p.wpns, the one in hand p.wpn) and a stack of grenades (p.gren). The attack button
// uses the one in hand (gobAttack, from doBite), the stomp button throws a grenade (gobThrow), and the weapon button goes
// on to the next (gobNextWpn). Kill an enemy whose weapon you haven't got and it's dropped where they fell (gobDrop: a
// police officer's handgun, a thief's dagger, a cultist's spellbook, a rifle off the compounds, the army and the carrier's crew,
// whatever FOES says they carry); a soldier of any kind drops grenades as well, every time, since they stack. Walk over a drop to pick it up (gobPickups).
// (Pipe bombs are gone: the preppers throw grenades too.) Hippos never see any of this.
// (Gnash's side of each weapon in WEAPONS (weapons.js): GOB_WPN[k] is its player block, GOB_WPN_ORDER the ones he can hold,
// in the order the weapon button goes through them; grenades are thrown with stomp instead)
const GOB_WPN={},GOB_WPN_ORDER=WEAPON_ORDER.filter(k=>WEAPONS[k].player&&WEAPONS[k].kind!=='throw');
for(const k of GOB_WPN_ORDER)GOB_WPN[k]=WEAPONS[k].player;
const GREN=WEAPONS.grenade.player,GREN_MAX=GREN.max,GREN_CAUSE=GREN.cause;
// (what comes in a pile, carried as a count on the player, its player block's field: grenades as p.gren, landmines as
// p.mines; and the weapons that are a switch each on the loadout, all the others)
const GOB_STACKS=WEAPON_ORDER.filter(k=>WEAPONS[k].stack&&WEAPONS[k].player&&WEAPONS[k].player.field),GOB_PICK=GOB_WPN_ORDER.filter(k=>!WEAPONS[k].stack);
const stkField=k=>WEAPONS[k].player.field,stkMax=k=>WEAPONS[k].player.max;
// (the ways a player goblin kills: a kill by any of them drops the victim's gear)
const GOB_CAUSES=new Set(WEAPON_ORDER.map(k=>WEAPONS[k].player&&WEAPONS[k].player.cause).filter(Boolean));
function gobArms(p){if(!p.wpns)gobLoadArm(p);else if(!p.wpns.includes(p.wpn))p.wpn=p.wpns[0];return p;}   // (what he starts with is his seat's choice on the Character screen: gob-loadout.js; online, another player's list can come before what's in their hand)
const gobW=p=>GOB_WPN[gobArms(p).wpn]||GOB_WPN.club;
const gobGun=k=>!!WEAPONS[k]&&WEAPONS[k].kind==='gun';   // (the ones that shoot down the view: gobShoot)
// what an enemy carries that can be taken off them
// (read off its kind's weapons list (weapons.js: foeOf): the first that's dropped and a goblin can wield, and grenades:
// one or two if it throws them, one if it only carries one in its pack. So a new kind drops its weapons with nothing added here)
// (the first weapon on its list that can be dropped and that some player goblin hasn't got yet: a cultist's spellbook,
// then once everyone has that its dagger; none if they've all got everything it carries)
function gobGear(g){const F=foeOf(g),L=F.weapons||[],pk=F.pack||[],own=players.filter(q=>q.active&&q.gob&&q.wpns);
  const wpn=L.find(k=>WEAPONS[k]&&WEAPONS[k].drop&&!WEAPONS[k].stack&&GOB_WPN[k]&&!(own.length&&own.every(q=>q.wpns.includes(k))))||null;
  return{wpn,gren:L.includes('grenade')?1+(Math.random()<0.5?1:0):pk.includes('grenade')?1:0,mines:L.includes('landmine')?1+(Math.random()<0.5?1:0):pk.includes('landmine')?1:0};}
// the attack button's hit, for whatever's in hand (the club's is gobClub)
function gobAttack(p){const k=gobArms(p).wpn,K=WEAPONS[k];
  if(K&&K.kind==='gun'){gobShoot(p);return;}
  if(K&&K.kind==='spell'){gobCast(p);return;}
  if(K&&K.kind==='mine'){gobPlant(p);return;}
  if(K&&K.kind==='melee'&&K.player.reach){const W=K.player,hx=Math.sin(p.heading),hz=Math.cos(p.heading),fx=p.pos.x+hx*W.reach,fz=p.pos.z+hz*W.reach;if(!wpnHitShapes(p,K,W.dmg,W.cause,W.pvp)){hitGoblins(fx,fz,W.r,W.dmg,W.cause,p.pos.y);pvpArea(p,fx,fz,W.r,W.dmg,W.pvp,p.pos.y);}
    for(const c of carsNear(fx,fz,W.r,p.pos.y)){damageCar(c,W.carDmg||1,new V3(hx,0,hz));clang();}
    // (the large club slammed into the ground: the shock of it, dust, the ground shaking)
    if(W.slam){shockwave(fx,p.pos.y+0.1,fz,W.r+0.6,undefined,0.3);puff(fx,p.pos.y+0.2,fz,6,0x8a7a62,0.35);addShake(0.25,fx,fz,10);thud(0.6);p.shake=Math.max(p.shake||0,0.08);rumble(p,0.5,140);}
    return;}
  gobClub(p);   // (the club: pivots.js)
}
// a rifle or handgun shot straight down the middle of the view: the first goblin, vehicle or block it meets (fireRound).
// Followed across a ship's side too, from the shore or the sea at its blocks and the goblins aboard, or from aboard out
// into the world. A vehicle takes VEH_SHOT_K times a goblin's damage, as from the enemies' rounds; half the time the
// block it hits breaks (bulletBreak), as an enemy's round does: the damage, range and breaking are the weapon's
function gobShoot(p){
  const wk=gobGun(gobArms(p).wpn)?p.wpn:'rifle',W=GOB_WPN[wk],c=shipEye(p),cp=Math.cos(p.cam.pitch),dx=-Math.sin(p.cam.yaw)*cp,dy=Math.sin(p.cam.pitch),dz=-Math.cos(p.cam.yaw)*cp,
    fx=-Math.sin(p.cam.yaw),fz=-Math.cos(p.cam.yaw),rx=Math.cos(p.cam.yaw),rz=-Math.sin(p.cam.yaw);
  // (a round out of the magazine: its count, kept per weapon (gobAmmo))
  if(W.mag){const n=gobAmmo(p,wk);if(n<=0)return;if(!DT.infAmmo)p.ammo[wk]=n-1;}   // (the debug menu's Infinite ammo: none used up)
  p.shotT=camClock;p.shotN=(p.shotN||0)+1;
  // a rocket: off the shoulder, along the view, bursting on whatever it meets (shots.js); it can't go off on you as it
  // leaves (skipP). The rocket launcher's, locked on a vehicle (gobSeek, or the lock button), homes in on it (shotSteer)
  if(W.proj){const LK=WEAPONS[wk].lock,T=LK&&p.lockT&&lockAlive(p.lockT)&&isVehT(p.lockT)?p.lockT:null;
    shot({kind:W.proj,tgt:T,sp:T?LK.sp:0,turn:T?LK.turn:0,x:c.x+dx*1.1+rx*0.22,y:c.y-0.08+dy*1.1,z:c.z+dz*1.1+rz*0.22,vx:dx*W.speed,vy:dy*W.speed+(W.lob||0)+(T?LK.loft||0:0),vz:dz*W.speed,grav:W.grav||0,fuse:W.range/W.speed+0.5,
      R:W.R,dmg:W.dmg,cause:W.cause,by:pvpBy(p),crush:W.crush,vd:W.vd,skipP:p,gobs:true,bb:W.nuke});   // (a nuke launcher's drops a little and lands in a big blast)
    wpnCrack(wk);smoke(c.x-dx*0.9+rx*0.22,c.y-0.1,c.z-dz*0.9+rz*0.22,3,0xbababa);}   // (and its backblast)
  else{
    // (a shotgun's pellets each a round of their own, scattered round the middle of the view: across along the view's right,
    // up and down along the view's own up (right x forward), so the pattern stays round aiming steeply up or down too)
    const n=W.pellets||1,ux=-rz*dy,uy=rz*dx-rx*dz,uz=rx*dy,hip=W.hip&&!(p.scope>0.9)?W.hip:0;for(let i=0;i<n;i++){let ex=dx,ey=dy,ez=dz;
      // (a scoped gun fired off the scope: a little way off the middle, the same way the pellets scatter)
      if(hip){const a=Math.random()*6.283,r=hip*Math.sqrt(Math.random()),ca=Math.cos(a)*r,sa=Math.sin(a)*r;ex+=rx*ca+ux*sa;ey+=uy*sa;ez+=rz*ca+uz*sa;const L=Math.hypot(ex,ey,ez);ex/=L;ey/=L;ez/=L;}
      if(n>1){const a=Math.random()*6.283,r=W.spread*Math.sqrt(Math.random()),ca=Math.cos(a)*r,sa=Math.sin(a)*r;ex+=rx*ca+ux*sa;ey+=uy*sa;ez+=rz*ca+uz*sa;const L=Math.hypot(ex,ey,ez);ex/=L;ey/=L;ez/=L;}
      fireRound({x:c.x,y:c.y,z:c.z,dir:{x:ex,y:ey,z:ez},range:W.range,step:0.2,by:p,tr:{x:c.x+fx*0.5+rx*0.18,y:c.y-0.18,z:c.z+fz*0.5+rz*0.18},
        gobs:true,gb:[0.45,0,1.5],dmg:W.dmg,cause:W.cause,pvp:{n:W.dmg,cause:'Shot',opt:{cd:0}},vehs:true,vd:W.dmg*VEH_SHOT_K,breaks:W.breaks,ship:true,
        snd:i?null:()=>wpnCrack(wk)});}}   // (the handgun cracks higher and shorter, as the police's does)
  p.shake=Math.max(p.shake||0,W.shake);rumble(p,W.rumble,50);
  // (the view kicked up a little, and a hair to one side then the other, so a held trigger climbs: the same every time)
  if(W.climb){p.cam.pitch=camPitch(p.cam.pitch+W.climb,p);p.cam.yaw+=W.climb*0.2*(p.shotN%2?1:-1);}
}
// a spellbook's fireball, once it's conjured (the attack's wind-up is the conjuring: its player block's lunge is the
// weapon's cast): out of the free hand, a little below and left of the eye, at whatever's under the crosshair. It flies
// and bends after the nearest enemy goblin ahead of it (fbTarget, shots.js), the weapon's numbers as a cultist's
function gobCast(p){const W=WEAPONS[gobArms(p).wpn];if(!W||W.kind!=='spell')return;
  const c=shipEye(p),cp=Math.cos(p.cam.pitch),dx=-Math.sin(p.cam.yaw)*cp,dy=Math.sin(p.cam.pitch),dz=-Math.cos(p.cam.yaw)*cp,rx=Math.cos(p.cam.yaw),rz=-Math.sin(p.cam.yaw);
  fireball(c.x+dx*0.5-rx*0.25,c.y-0.2+dy*0.5,c.z+dz*0.5-rz*0.25,c.x+dx*W.range,c.y+dy*W.range,c.z+dz*W.range,{W,pl:p,by:pvpBy(p),cause:W.player.cause});
  rumble(p,0.12,60);}
// the attack button's sound as it starts: the club's or dagger's swing, a spell's rising note while it's conjured (a gun's
// is its crack, when it fires)
function gobPressSnd(p){const W=WEAPONS[p.wpn];if(W&&W.kind==='spell')wpnCue(p.wpn,W.cast);else if(W&&W.kind==='mine')return;
  else if(p.wpn==='bigclub')sfx('Large club heaved',()=>{woosh(0.5,0.18,240,700,0.3);});else if(p.wpn==='katana')sfx('Katana swing',()=>{woosh(0.12,0.24,900,3200,0.14);});
  else if(!gobGun(p.wpn))sfx('Club swing',()=>{woosh(0.13,0.22,520,1700,0.1);});}
// ---- reloading: each gun's magazine (its mag) is counted per weapon (p.ammo), so switching away and back keeps what's
// left. The reload button (or firing with it empty, or the last round going) fills it in the weapon's reload seconds;
// switching weapons stops it. On an online guest, the host's count is the one shown (p.ammoN) ----
function gobAmmo(p,k){const A=p.ammo||(p.ammo={});if(A[k]===undefined)A[k]=WEAPONS[k].mag||0;return A[k];}
// (a gun with spare in its entry, the nuke launcher, has only that many reloads; picked up afresh, it has them all again.
// Infinite ammo uses none of them up)
function gobSpare(p,k){const W=WEAPONS[k];if(!W||W.spare===undefined)return -1;const A=p.spare||(p.spare={});if(A[k]===undefined)A[k]=W.spare;return A[k];}
const gobSpareShown=(p,k)=>netGuest()&&p.spareN!==undefined?p.spareN:gobSpare(p,k);
function gobReload(p,k=p.wpn){const W=WEAPONS[k];if(!W||!W.mag||p.relT>0||gobAmmoShown(p,k)>=W.mag||p.state==='dead'||p.drv)return false;
  if(gobSpareShown(p,k)===0&&!DT.infAmmo)return false;   // (none left to load)
  p.relT=p.relDur=W.reload;p.relW=k;p.relH=false;wpnClack(k,0);return true;}
function gobReloadTick(p,dt){const k=p.wpn,W=WEAPONS[k];
  if(p.relT>0){if(p.relW!==k||p.state==='dead'||p.drv){p.relT=0;return;}
    p.relT-=dt;if(!p.relH&&p.relT<=p.relDur*0.5){p.relH=true;wpnClack(k,1);}
    if(p.relT<=0){p.relT=0;p.ammo[k]=W.mag;if(gobSpare(p,k)>0&&!DT.infAmmo)p.spare[k]--;wpnClack(k,2);}}
  else if(W&&W.mag&&gobAmmoShown(p,k)<=0&&!(p.biteT>0))gobReload(p);   // (the last one's gone: straight on to the next magazine)
}
// (whether the attack button can start what's in hand: not mid-reload; a gun with nothing in it reloads instead, with
// a dry click; a landmine needs one to plant, and the ground to plant it in)
function gobReady(p){gobArms(p);const k=p.wpn,W=WEAPONS[k];if(p.relT>0)return false;
  if(W&&W.kind==='mine')return p.mines>0&&p.state!=='climb'&&!!p.grounded;   // (pressed into the ground at his feet: not mid-jump)
  if(W&&W.mag&&gobAmmoShown(p,k)<=0){sfx('Dry fire',()=>{tone('square',1800,1600,0.02,0.03);});gobReload(p);return false;}
  return true;}
// what's shown loaded: a guest's own count is the host's
const gobAmmoShown=(p,k)=>netGuest()&&p.ammoN!==undefined?p.ammoN:gobAmmo(p,k);
// a landmine set down just in front of him (the attack's crouch, gobBodyPose); once the last's gone, the next weapon
function gobPlant(p){const W=GOB_WPN.landmine;if(!(p.mines>0))return;if(!DT.infAmmo)p.mines--;   // (Infinite ammo: the pile never goes down)
  const hx=Math.sin(p.heading),hz=Math.cos(p.heading);mineLay(p.pos.x+hx*0.6,p.pos.y,p.pos.z+hz*0.6,{side:'p',by:pvpBy(p),owner:p,cause:W.cause,k:'landmine'});
  if(p.mines<=0){p.wpns=p.wpns.filter(k=>k!=='landmine');if(!p.wpns.length)p.wpns=['club'];p.wpn=p.wpns[0];p.wpnT=camClock;}}
// what aims down the view, with a crosshair: a gun, or a spell
const gobAims=k=>gobGun(k)||!!WEAPONS[k]&&WEAPONS[k].kind==='spell';
// the stomp button: lob a grenade the way you're looking
function gobThrow(p){
  gobArms(p);if(!(p.gren>0||DT.infAmmo)||p.grenCD>0||p.state==='dead'||p.drv)return;   // (Infinite ammo: thrown with none left too, and none used up)
  if(!DT.infAmmo)p.gren--;p.grenCD=GREN.cd;p.thrS=0;const c=shipEye(p),cp=Math.cos(p.cam.pitch),dx=-Math.sin(p.cam.yaw)*cp,dy=Math.sin(p.cam.pitch),dz=-Math.cos(p.cam.yaw)*cp,v=GREN.v;
  shot({kind:'grenade',x:c.x+dx*0.6,y:c.y-0.1+dy*0.6,z:c.z+dz*0.6,vx:dx*v,vy:dy*v+4,vz:dz*v,grav:20,fuse:GREN.fuse,R:GREN.R,dmg:GREN.dmg,cause:GREN_CAUSE,by:pvpBy(p),bounce:true,crush:GREN_CRUSH});
  sfx('Goblin throws a grenade',()=>{woosh(0.15,0.2,400,1200,0.08);});
}
function gobNextWpn(p){gobArms(p);const L=GOB_WPN_ORDER.filter(k=>p.wpns.includes(k));if(L.length<2)return;
  p.wpn=L[(L.indexOf(p.wpn)+1)%L.length];p.wpnT=camClock;p.relT=0;   // (a reload's dropped: it starts again next time)
  sfx('Goblin switches weapon',()=>{tone('square',700,900,0.04,0.03);});}
// once a frame per player goblin, before the move: the throw and the weapon buttons, and the cooldown
function gobArmsTick(p,dt){gobArms(p);wpnHitSweep(p);p.grenCD=Math.max(0,p.grenCD-dt);p.thrS=(p.thrS??9)+dt;   // (since his last throw: the arm coming through, gobBodyPose)
  const st=!!p.in.stomp,wp=!!p.in.weapon,rl=!!p.in.reload;
  // (with a scoped gun in hand stomp looks down the scope instead: gobScope)
  if(st&&!p.gStompWas&&playing&&!gobW(p).scope)gobThrow(p);if(wp&&!p.gWpnWas&&playing)gobNextWpn(p);if(rl&&!p.gRelWas&&playing)gobReload(p);p.gStompWas=st;p.gWpnWas=wp;p.gRelWas=rl;
  if(playing)gobReloadTick(p,dt);
  if(!netGuest()){const W=WEAPONS[p.wpn];p.ammoN=W&&W.mag?gobAmmo(p,p.wpn):-1;p.spareN=W?gobSpare(p,p.wpn):-1;}}   // (for the display, here and on a guest)
// ---- what's dropped: a little model on the ground, turning, until someone picks it up (or a minute and a half) ----
const PICKUPS=[],PU_MAT={};
function puModel(k){const g=new THREE.Group(),m=c=>PU_MAT[c]||(PU_MAT[c]=new THREE.MeshLambertMaterial({color:c}));
  wpnBoxes(WEAPONS[k].model.drop,(w,h,d,c,x,y,z)=>{const o=new THREE.Mesh(FB_GEO,m(c));o.scale.set(w,h,d);o.position.set(x,y,z);g.add(o);return o;});   // (its shape lying on the ground: WEAPONS)
  g.visible=false;scene.add(g);return g;}
function gobDrop(g){const G2=gobGear(g),at=(k,n,o)=>{let P=PICKUPS.find(q=>!q.live&&q.k===k);if(!P){if(PICKUPS.length>=32){P=PICKUPS.find(q=>q.k===k);if(!P)return;}else{P={k,m:puModel(k),pos:new V3()};PICKUPS.push(P);}}
    const y=supportAt(g.pos.x+o,g.pos.z,g.pos.y+1.5);P.pos.set(g.pos.x+o,(y??g.pos.y)+0.3,g.pos.z);P.n=n;P.t=0;P.live=true;P.m.visible=true;P.m.position.copy(P.pos);
    const par=shipPar(P.pos.x,P.pos.z);if(P.m.parent!==par)par.add(P.m);};   // (aboard a ship it's in the ship's pocket: hung off the ship's picture so it shows where the ship really is, see ships.js)
  // (the weapon only if a player goblin hasn't got one already, gobGear; grenades always, as they stack)
  if(G2.wpn)at(G2.wpn,1,-0.3);
  if(G2.gren)at('grenade',G2.gren,0.3);
  if(G2.mines)at('landmine',G2.mines,0);
}
function gobPickups(dt){
  for(const P of PICKUPS){if(!P.live)continue;P.t+=dt;
    if(P.t>90||!DT.gob){P.live=false;P.m.visible=false;continue;}
    P.m.rotation.y+=dt*1.6;P.m.position.y=P.pos.y+0.08*Math.sin(P.t*3);
    for(const p of players){if(!p.gob||!p.active||p.state==='dead'||p.drv)continue;if(Math.hypot(p.pos.x-P.pos.x,p.pos.z-P.pos.z)>1.1||Math.abs(p.pos.y+0.3-P.pos.y)>1.6)continue;
      gobArms(p);
      // (a pile, grenades or landmines, up to the most he can carry; landmines go in his hand as well, if they weren't)
      if(WEAPONS[P.k].stack){const f=stkField(P.k),mx=stkMax(P.k);if((p[f]||0)>=mx)continue;const n=Math.min(P.n,mx-(p[f]||0));p[f]=(p[f]||0)+n;P.n-=n;
        if(GOB_WPN[P.k]&&!p.wpns.includes(P.k))p.wpns.push(P.k);
        const nm=WEAPONS[P.k].name.replace(/s$/,'');flashLabel(nm+(n>1?'s':'')+' +'+n+'  ·  '+p[f]+' in all',p);if(P.n>0)continue;}
      else{if(p.wpns.includes(P.k))continue;p.wpns.push(P.k);p.wpn=P.k;p.wpnT=camClock;p.relT=0;if(p.ammo)p.ammo[P.k]=undefined;if(p.spare)p.spare[P.k]=undefined;flashLabel('Picked up a '+GOB_WPN[P.k].name.toLowerCase(),p);}   // (a gun comes with a full magazine)
      sfx('Pick up',()=>{tone('triangle',660,990,0.08,0.06);});P.live=false;P.m.visible=false;break;}}
}
function gobPickupsClear(){for(const P of PICKUPS){P.live=false;P.m.visible=false;}}
// ---- on the HUD, just above the hearts: what's in hand, what else you've got, and the grenades ----
// the sniper's scope: stomp held (right click, RT) with a gun that has one in hand (its player block's scope) looks down
// it: the view zoomed to its fov (minimap.js draws it at p.scFov), the sight drawn over the view and the gun out of sight
// (gobArmsHud, the view model in pivots.js), the look slowed to match (scopeK, input.js). Worked out where the view's
// drawn, from that player's own controls, so an online guest's comes at once. Not while reloading, climbing or driving
function gobScope(p){const t=camClock,dt=Math.min(0.1,Math.max(0,t-(p.scT??t)));p.scT=t;gobSeek(p,dt);
  const sc=gobW(p).scope,want=!!(sc&&p.in&&p.in.stomp&&!(p.relT>0)&&!p.drv&&p.state!=='dead'&&p.state!=='climb'&&!p.paused);
  p.scope=Math.max(0,Math.min(1,(p.scope||0)+(want?1:-1)*dt/((sc&&sc.in)||0.15)));
  const e=p.scope*p.scope*(3-2*p.scope);p.scFov=p.scope>0&&sc?72+(sc.fov-72)*e:0;}
// what a rocket launcher can lock on to: a vehicle (a car, a tank or helicopter, a carrier's deck weapon or jet, another
// player's vehicle with PvP on), not a goblin or a player on foot
const isVehT=t=>isCarT(t)||isMilT(t)||!!(t&&(t.isMountT||t.isJetT))||isPlT(t)&&!!t.drv;
// the rocket launcher's seeker: with its sight up (stomp held), the vehicle nearest the crosshair, in sight and within
// its lock's cone and range, is tracked (the lock marker on it, amber, closing in) for lock.t seconds with a growl, then
// locked: the ordinary lock-on (setLock), so a rocket fired now homes in on it. Looking away starts it again
function gobSeek(p,dt){const W=WEAPONS[gobArms(p).wpn],LK=W&&W.lock,S=p.rlS||(p.rlS={t:null,k:0,b:0});
  const off=()=>{if(S.t&&!p.lockT&&p.lockMark)p.lockMark.visible=false;S.t=null;S.k=0;};
  const mk=c=>{const m=lockMarker(p);for(const o of m.children)o.material.color.setHex(c);return m;};
  if(!LK||!p.gob||p.drv||p.state==='dead'||!(p.scope>0.9)||p.lockT&&isVehT(p.lockT)){if(S.t)off();if(p.lockMark&&p.lockMark.visible&&p.lockT)mk(0xff2a2a);return;}
  const c=shipEye(p),cp=Math.cos(p.cam.pitch),fx=-Math.sin(p.cam.yaw)*cp,fy=Math.sin(p.cam.pitch),fz=-Math.cos(p.cam.yaw)*cp;let best=null,bs=1e9;
  for(const o of lockTargets(p,LK.range)){if(!isVehT(o.t)||o.hid)continue;const ty=lockY(o.t),dx=o.t.pos.x-c.x,dy=ty-c.y,dz=o.t.pos.z-c.z,L=Math.hypot(dx,dy,dz)||1,
      a=Math.acos(Math.max(-1,Math.min(1,(dx*fx+dy*fy+dz*fz)/L)))-Math.atan((isMilT(o.t)?MIL[o.t.kind].hz:1)/L);if(a>LK.cone)continue;
    const sc=Math.max(0,a)*80+L*0.02;if(sc<bs){bs=sc;best=o.t;}}
  if(!best){off();return;}
  if(p.lockT)setLock(p,null);   // (a goblin locked on foot gives way to the vehicle in the sight)
  if(best!==S.t){S.t=best;S.k=0;S.b=0;}
  S.k+=dt/LK.t;S.b-=dt;if(S.b<=0){S.b=0.18;tone('square',520+S.k*500,520+S.k*500,0.06,0.025);}
  if(S.k>=1){const T=S.t;S.t=null;S.k=0;mk(0xff2a2a);setLock(p,T);tone('square',1100,1100,0.35,0.035);return;}
  const m=mk(0xffb030),ty=lockY(best),cam=p.camera.position;m.visible=true;m.position.set(best.pos.x,ty,best.pos.z);
  m.scale.setScalar(Math.max(0.55,Math.hypot(best.pos.x-cam.x,ty-cam.y,best.pos.z-cam.z)*0.05)*(isMilT(best)?2:1)*(1+(1-S.k)*1.5));}
// (how much the look's slowed: the zoomed field of view against the usual)
const scopeK=p=>p.gob&&!p.drv&&p.scFov?p.scFov/72:1;
function gobArmsHud(p){
  let H=p.ui.gw;const show=p.gob&&p.active&&!p.drv&&p.state!=='dead';
  if(!H){if(!show)return;const el=document.createElement('div');el.className='gwpn';const xh=document.createElement('div');xh.className='gxh';xh.hidden=true;p.ui.view.append(xh);
    const bar=p.ui.view.querySelector('.bar'),who=bar&&bar.querySelector('.who');if(who)bar.insertBefore(el,who);else p.ui.view.append(el);H=p.ui.gw={el,xh,s:''};}
  // (the scope's sight: a ring of black round a circle of view, cross hairs with marks down them for holding over)
  if(!H.sc){const s=document.createElement('div');s.className='gscope';s.hidden=true;
    s.style.cssText='position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at center,transparent 0,transparent 37%,rgba(0,0,0,.55) 38%,#050505 39.5%)';
    const ln='position:absolute;background:rgba(0,0,0,.85);';let h='<div style="'+ln+'left:12%;right:12%;top:50%;height:2px;margin-top:-1px"></div><div style="'+ln+'top:12%;bottom:12%;left:50%;width:2px;margin-left:-1px"></div>';
    for(let k=1;k<=4;k++)h+='<div style="'+ln+'left:50%;top:calc(50% + '+(k*3.2)+'%);width:'+(k%2?10:16)+'px;height:2px;margin-left:-'+(k%2?5:8)+'px"></div>';
    s.innerHTML=h;p.ui.view.insertBefore(s,p.ui.view.firstChild||null);H.sc=s;}
  const scoped=show&&(p.scope||0)>0.5&&gobW(p).scope.ring!==false;H.sc.hidden=!scoped;   // (the rocket launcher's sight has no ring: just the crosshair, zoomed)
  H.el.hidden=!show;H.xh.hidden=!show||scoped||!gobAims(gobArms(p).wpn);if(!show)return;
  const bl=id=>actMark(p,id),L=GOB_WPN_ORDER.filter(k=>p.wpns.includes(k)),W=WEAPONS[p.wpn];
  // (what's in hand in bold: a gun with what's left in its magazine, reloading, or a reload asked for when it's empty;
  // landmines with how many)
  const nm=k=>GOB_WPN[k].name+(k==='landmine'?' ×'+(p.mines||0):''),n=W&&W.mag?gobAmmoShown(p,p.wpn):0;
  const sp=W&&W.mag?gobSpareShown(p,p.wpn):-1,cur=nm(p.wpn)+(W&&W.mag?(p.relT>0?'  reloading…':'  '+n+' / '+W.mag)+(sp>=0?'  +'+sp:''):''),
    rq=W&&W.mag&&!(p.relT>0)&&n<W.mag&&(sp!==0||DT.infAmmo)?'  '+bl('reload')+(n?' reload':' RELOAD'):'';
  const s=L.map(k=>k===p.wpn?'<b>'+cur+'</b>':nm(k)).join(' · ')+rq+(L.length>1?'  '+bl('weapon')+' next':'')+'  |  Grenades '+p.gren+(gobW(p).scope?'  '+bl('stomp')+(WEAPONS[p.wpn]&&WEAPONS[p.wpn].lock?' lock on (hold)':' scope (hold)'):p.gren||DT.infAmmo?'  '+bl('stomp')+' throw':'');
  if(H.s!==s){H.s=s;H.el.innerHTML=s.split(/(<b>[^<]*<\/b>)/).map(t=>t.startsWith('<b>')?'<b>'+glEsc(t.slice(3,-4))+'</b>':hudHTML(t)).join('');}
}
