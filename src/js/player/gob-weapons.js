// ---- Gnash's weapons: what he starts with (his seat's loadout, gob-loadout.js), and what he takes off the enemies he kills ----
// (each weapon's numbers, shapes and sounds are its entry in WEAPONS, weapons.js)
// Each player goblin carries a list (p.wpns, the one in hand p.wpn) and a stack of grenades (p.gren). The attack button
// uses the one in hand (gobAttack, from doBite), the stomp button throws a grenade (gobThrow), and the weapon button goes
// on to the next (gobNextWpn). Kill an enemy whose weapon you haven't got and it's dropped where they fell (gobDrop: a
// police officer's handgun, a thief's or cultist's dagger, a rifle off the compounds, the army and the carrier's crew,
// whatever FOES says they carry); a soldier of any kind drops grenades as well, every time, since they stack. Walk over a drop to pick it up (gobPickups).
// (Pipe bombs are gone: the preppers throw grenades too.) Hippos never see any of this.
// (Gnash's side of each weapon in WEAPONS (weapons.js): GOB_WPN[k] is its player block, GOB_WPN_ORDER the ones he can hold,
// in the order the weapon button goes through them; grenades are thrown with stomp instead)
const GOB_WPN={},GOB_WPN_ORDER=WEAPON_ORDER.filter(k=>WEAPONS[k].player&&WEAPONS[k].kind!=='throw');
for(const k of GOB_WPN_ORDER)GOB_WPN[k]=WEAPONS[k].player;
const GREN=WEAPONS.grenade.player,GREN_MAX=GREN.max,GREN_CAUSE=GREN.cause;
// (the ways a player goblin kills: a kill by any of them drops the victim's gear)
const GOB_CAUSES=new Set(WEAPON_ORDER.map(k=>WEAPONS[k].player&&WEAPONS[k].player.cause).filter(Boolean));
function gobArms(p){if(!p.wpns)gobLoadArm(p);return p;}   // (what he starts with is his seat's choice on the Character screen: gob-loadout.js)
const gobW=p=>GOB_WPN[gobArms(p).wpn]||GOB_WPN.club;
const gobGun=k=>!!WEAPONS[k]&&WEAPONS[k].kind==='gun';   // (the ones that shoot down the view: gobShoot)
// what an enemy carries that can be taken off them
// (read off the foe's own entry in FOES: whatever it holds (gear) that a goblin can wield, and grenades if it throws them,
// so a new kind of foe drops its gear with nothing added here. Police carry theirs on g.gun; cultists aren't in FOES)
function gobGear(g){const k=g.foeKind,F=k&&FOES[k];
  return{wpn:g.gun===COP_FOE?'handgun':g.cultist?'dagger':F&&GOB_WPN[F.gear]&&WEAPONS[F.gear].drop?F.gear:null,gren:F&&F.bomb?1+(Math.random()<0.5?1:0):k==='soldier'?1:0};}
// the attack button's hit, for whatever's in hand (the club's is gobClub)
function gobAttack(p){const k=gobArms(p).wpn,K=WEAPONS[k];
  if(K&&K.kind==='gun'){gobShoot(p);return;}
  if(K&&K.kind==='melee'&&K.player.reach){const W=K.player,hx=Math.sin(p.heading),hz=Math.cos(p.heading);hitGoblins(p.pos.x+hx*W.reach,p.pos.z+hz*W.reach,W.r,W.dmg,W.cause,p.pos.y);pvpArea(p,p.pos.x+hx*W.reach,p.pos.z+hz*W.reach,W.r,W.dmg,W.pvp,p.pos.y);
    for(const c of carsNear(p.pos.x+hx*W.reach,p.pos.z+hz*W.reach,W.r,p.pos.y)){damageCar(c,1,new V3(hx,0,hz));clang();}return;}
  gobClub(p);   // (the club: pivots.js)
}
// a rifle or handgun shot straight down the middle of the view: the first goblin, vehicle or block it meets
const _gr=new V3();
const _gsp={pos:new V3(),own:null,noShip:false};
function gobShoot(p){
  const wk=gobGun(gobArms(p).wpn)?p.wpn:'rifle',W=GOB_WPN[wk],c=shipEye(p),cp=Math.cos(p.cam.pitch),dx=-Math.sin(p.cam.yaw)*cp,dy=Math.sin(p.cam.pitch),dz=-Math.cos(p.cam.yaw)*cp;
  let hitG=null,hitC=null,hitW=null,hitP=null,hitV=null,d=0.3,oh=null;
  // (followed across a ship's side too: from the shore or the sea at its blocks and the goblins aboard, or from aboard
  // out into the world. See shipLines)
  const SL=shipLines(c.x,c.y,c.z,dx,dy,dz,W.range),S0=SL&&c.x>=SHIP_X0?shipOfPos(c.x,c.z):null;
  for(;d<W.range&&!hitG&&!hitC&&!hitP;d+=0.2){const x=c.x+dx*d,y=c.y+dy*d,z=c.z+dz*d;
    if(solidAt(Math.floor(x),Math.floor(y),Math.floor(z))){hitW=[Math.floor(x),Math.floor(y),Math.floor(z)];break;}
    if(SL&&(oh=shipLineAt(SL,d,p,true))){if(oh.veh)hitV=oh.veh;else hitW=oh.b;break;}
    // (a vehicle's box stops it too: a tank's or a train's armour shrugs it off, but a carrier's deck weapon takes the
    // round. Before, it went straight through them all. Every other step: the narrowest box is far wider than two)
    if(Math.round(d*5)%2===0){_gsp.pos.set(x,y,z);_gsp.noShip=!!SL;const h=shotHitsVeh(_gsp);if(h&&h.proxy){hitV=h;break;}}   // (cars: carsNear, below)
    for(const g of goblins){if(g.state!=='chase')continue;const q=SL?shipPosIn(g.pos,S0):g.pos;if(Math.hypot(q.x-x,q.z-z)<0.45&&y>q.y&&y<q.y+1.5){hitG=g;break;}}
    if(!hitG)for(const q of pvpFoes(p)){if(Math.hypot(q.pos.x-x,q.pos.z-z)<(q.gob?0.45:0.9)&&y>q.pos.y&&y<q.pos.y+(q.gob?1.5:2.3)){hitP=q;break;}}   // (with PvP on, another player)
    if(!hitG&&(Math.round(d*5)%3===0))for(const q of carsNear(x,z,0.6,y-1)){hitC=q;break;}}
  const x1=c.x+dx*d,y1=c.y+dy*d,z1=c.z+dz*d,fx=-Math.sin(p.cam.yaw),fz=-Math.cos(p.cam.yaw);
  tracer(c.x+fx*0.5+Math.cos(p.cam.yaw)*0.18,c.y-0.18,c.z+fz*0.5-Math.sin(p.cam.yaw)*0.18,x1,y1,z1);
  wpnCrack(wk);   // (the handgun cracks higher and shorter, as the police's does)
  p.shake=Math.max(p.shake||0,W.shake);rumble(p,W.rumble,50);
  if(hitG)damageGoblin(hitG,W.dmg,SL?new V3(hitG.pos.x,hitG.pos.y+0.8,hitG.pos.z):_gr.set(x1,y1,z1).clone(),new V3(dx,0.3,dz),W.cause);
  else if(hitP)pvpHurt(p,hitP,W.dmg,_gr.set(x1,y1,z1).clone(),new V3(dx,0.3,dz),'Shot',{cd:0});
  else if(hitC)damageCar(hitC,1,new V3(dx,0,dz));
  else if(hitV){const P=oh||{x:x1,y:y1,z:z1},T=hitV.proxy&&hitV.proxy.T;puff(P.x,P.y,P.z,2,0xffb040,0.15);if(T&&T.isMount)trainHit(T,W.dmg);}
  else{if(oh)puff(oh.x,oh.y,oh.z,2,0xb0a898,0.12);else puff(x1,y1,z1,2,0xb0a898,0.12);if(hitW)bulletBreak(hitW[0],hitW[1],hitW[2],dx,dz);}   // (half the time the block it hit breaks: see bulletBreak)
}
// the stomp button: lob a grenade the way you're looking
function gobThrow(p){
  gobArms(p);if(p.gren<=0||p.grenCD>0||p.state==='dead'||p.drv)return;
  p.gren--;p.grenCD=GREN.cd;p.thrS=0;const c=shipEye(p),cp=Math.cos(p.cam.pitch),dx=-Math.sin(p.cam.yaw)*cp,dy=Math.sin(p.cam.pitch),dz=-Math.cos(p.cam.yaw)*cp,v=GREN.v;
  shot({kind:'grenade',x:c.x+dx*0.6,y:c.y-0.1+dy*0.6,z:c.z+dz*0.6,vx:dx*v,vy:dy*v+4,vz:dz*v,grav:20,fuse:GREN.fuse,R:GREN.R,dmg:GREN.dmg,cause:GREN_CAUSE,by:pvpBy(p),bounce:true,crush:GREN_CRUSH});
  sfx('Goblin throws a grenade',()=>{woosh(0.15,0.2,400,1200,0.08);});
}
function gobNextWpn(p){gobArms(p);const L=GOB_WPN_ORDER.filter(k=>p.wpns.includes(k));if(L.length<2)return;
  p.wpn=L[(L.indexOf(p.wpn)+1)%L.length];p.wpnT=camClock;sfx('Goblin switches weapon',()=>{tone('square',700,900,0.04,0.03);});}
// once a frame per player goblin, before the move: the throw and the weapon buttons, and the cooldown
function gobArmsTick(p,dt){gobArms(p);p.grenCD=Math.max(0,p.grenCD-dt);p.thrS=(p.thrS??9)+dt;   // (since his last throw: the arm coming through, gobBodyPose)
  const st=!!p.in.stomp,wp=!!p.in.weapon;
  if(st&&!p.gStompWas&&playing)gobThrow(p);if(wp&&!p.gWpnWas&&playing)gobNextWpn(p);p.gStompWas=st;p.gWpnWas=wp;}
// ---- what's dropped: a little model on the ground, turning, until someone picks it up (or a minute and a half) ----
const PICKUPS=[],PU_MAT={};
function puModel(k){const g=new THREE.Group(),m=c=>PU_MAT[c]||(PU_MAT[c]=new THREE.MeshLambertMaterial({color:c}));
  wpnBoxes(WEAPONS[k].model.drop,(w,h,d,c,x,y,z)=>{const o=new THREE.Mesh(FB_GEO,m(c));o.scale.set(w,h,d);o.position.set(x,y,z);g.add(o);});   // (its shape lying on the ground: WEAPONS)
  g.visible=false;scene.add(g);return g;}
function gobDrop(g){const G2=gobGear(g),at=(k,n,o)=>{let P=PICKUPS.find(q=>!q.live&&q.k===k);if(!P){if(PICKUPS.length>=32){P=PICKUPS.find(q=>q.k===k);if(!P)return;}else{P={k,m:puModel(k),pos:new V3()};PICKUPS.push(P);}}
    const y=supportAt(g.pos.x+o,g.pos.z,g.pos.y+1.5);P.pos.set(g.pos.x+o,(y??g.pos.y)+0.3,g.pos.z);P.n=n;P.t=0;P.live=true;P.m.visible=true;P.m.position.copy(P.pos);
    const par=shipPar(P.pos.x,P.pos.z);if(P.m.parent!==par)par.add(P.m);};   // (aboard a ship it's in the ship's pocket: hung off the ship's picture so it shows where the ship really is, see ships.js)
  const own=players.filter(q=>q.active&&q.gob&&q.wpns);
  // (dropped only if a player goblin hasn't got one already; grenades always, as they stack)
  if(G2.wpn&&!(own.length&&own.every(q=>q.wpns.includes(G2.wpn))))at(G2.wpn,1,-0.3);
  if(G2.gren)at('grenade',G2.gren,0.3);
}
function gobPickups(dt){
  for(const P of PICKUPS){if(!P.live)continue;P.t+=dt;
    if(P.t>90||!DT.gob){P.live=false;P.m.visible=false;continue;}
    P.m.rotation.y+=dt*1.6;P.m.position.y=P.pos.y+0.08*Math.sin(P.t*3);
    for(const p of players){if(!p.gob||!p.active||p.state==='dead'||p.drv)continue;if(Math.hypot(p.pos.x-P.pos.x,p.pos.z-P.pos.z)>1.1||Math.abs(p.pos.y+0.3-P.pos.y)>1.6)continue;
      gobArms(p);
      if(WEAPONS[P.k].stack){if(p.gren>=GREN_MAX)continue;const n=Math.min(P.n,GREN_MAX-p.gren);p.gren+=n;P.n-=n;flashLabel('Grenade'+(n>1?'s':'')+' +'+n+'  ·  '+p.gren+' in all',p);if(P.n>0)continue;}
      else{if(p.wpns.includes(P.k))continue;p.wpns.push(P.k);p.wpn=P.k;p.wpnT=camClock;flashLabel('Picked up a '+GOB_WPN[P.k].name.toLowerCase(),p);}
      sfx('Pick up',()=>{tone('triangle',660,990,0.08,0.06);});P.live=false;P.m.visible=false;break;}}
}
function gobPickupsClear(){for(const P of PICKUPS){P.live=false;P.m.visible=false;}}
// ---- on the HUD, just above the hearts: what's in hand, what else you've got, and the grenades ----
function gobArmsHud(p){
  let H=p.ui.gw;const show=p.gob&&p.active&&!p.drv&&p.state!=='dead';
  if(!H){if(!show)return;const el=document.createElement('div');el.className='gwpn';const xh=document.createElement('div');xh.className='gxh';xh.hidden=true;p.ui.view.append(xh);
    const bar=p.ui.view.querySelector('.bar'),who=bar&&bar.querySelector('.who');if(who)bar.insertBefore(el,who);else p.ui.view.append(el);H=p.ui.gw={el,xh,s:''};}
  H.el.hidden=!show;H.xh.hidden=!show||!gobGun(gobArms(p).wpn);if(!show)return;
  const bl=id=>actMark(p,id),L=GOB_WPN_ORDER.filter(k=>p.wpns.includes(k));
  const s=L.map(k=>k===p.wpn?'<b>'+GOB_WPN[k].name+'</b>':GOB_WPN[k].name).join(' · ')+(L.length>1?'  '+bl('weapon')+' next':'')+'  |  Grenades '+p.gren+(p.gren?'  '+bl('stomp')+' throw':'');
  if(H.s!==s){H.s=s;H.el.innerHTML=s.split(/(<b>[^<]*<\/b>)/).map(t=>t.startsWith('<b>')?'<b>'+glEsc(t.slice(3,-4))+'</b>':hudHTML(t)).join('');}
}
