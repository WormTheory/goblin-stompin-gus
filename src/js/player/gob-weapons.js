// ---- Gnash's weapons: the club he starts with, and what he takes off the enemies he kills ----
// Each player goblin carries a list (p.wpns, the one in hand p.wpn) and a stack of grenades (p.gren). The attack button
// uses the one in hand (gobAttack, from doBite), the stomp button throws a grenade (gobThrow), and the weapon button goes
// on to the next (gobNextWpn). Kill an enemy whose weapon you haven't got and it's dropped where they fell (gobDrop); a
// soldier of any kind drops grenades as well, every time, since they stack. Walk over a drop to pick it up (gobPickups).
// (Pipe bombs are gone: the preppers throw grenades too.) Hippos never see any of this.
const GOB_WPN={
  club:{name:'Club',dur:0.38,lunge:0.16,cd:0.45},
  dagger:{name:'Dagger',dur:0.26,lunge:0.1,cd:0.28,dmg:2,r:0.95,reach:1.0,cause:'Stabbed by a goblin'},
  rifle:{name:'Rifle',dur:0.2,lunge:0.01,cd:0.55,dmg:2,range:48,cause:'Shot by a goblin'}};
const GOB_WPN_ORDER=['club','dagger','rifle'],GREN_MAX=9,GREN_CAUSE="Blown up by a goblin's grenade";
// (the ways a player goblin kills: a kill by any of them drops the victim's gear)
const GOB_CAUSES=new Set(['Clubbed by another goblin',GOB_WPN.dagger.cause,GOB_WPN.rifle.cause,GREN_CAUSE]);
function gobArms(p){if(!p.wpns){p.wpns=['club'];p.wpn='club';p.gren=0;p.grenCD=0;}return p;}
const gobW=p=>GOB_WPN[gobArms(p).wpn]||GOB_WPN.club;
// what an enemy carries that can be taken off them
function gobGear(g){const k=g.foeKind;
  return{wpn:g.cultist||k==='thief'?'dagger':k==='prepper'||k==='militia'||k==='soldier'?'rifle':null,gren:k==='prepper'||k==='militia'?1+(Math.random()<0.5?1:0):k==='soldier'?1:0};}
// the attack button's hit, for whatever's in hand (the club's is gobClub)
function gobAttack(p){const k=gobArms(p).wpn;
  if(k==='dagger'){const W=GOB_WPN.dagger,hx=Math.sin(p.heading),hz=Math.cos(p.heading);hitGoblins(p.pos.x+hx*W.reach,p.pos.z+hz*W.reach,W.r,W.dmg,W.cause,p.pos.y);
    for(const c of carsNear(p.pos.x+hx*W.reach,p.pos.z+hz*W.reach,W.r,p.pos.y)){damageCar(c,1,new V3(hx,0,hz));clang();}return;}
  if(k==='rifle'){gobShoot(p);return;}
  gobClub(p);
}
// a rifle shot straight down the middle of the view: the first goblin, vehicle or block it meets
const _gr=new V3();
function gobShoot(p){
  const W=GOB_WPN.rifle,c=p.camera.position,cp=Math.cos(p.cam.pitch),dx=-Math.sin(p.cam.yaw)*cp,dy=Math.sin(p.cam.pitch),dz=-Math.cos(p.cam.yaw)*cp;
  let hitG=null,hitC=null,d=0.3;
  for(;d<W.range&&!hitG&&!hitC;d+=0.2){const x=c.x+dx*d,y=c.y+dy*d,z=c.z+dz*d;
    if(solidAt(Math.floor(x),Math.floor(y),Math.floor(z)))break;
    for(const g of goblins){if(g.state!=='chase')continue;if(Math.hypot(g.pos.x-x,g.pos.z-z)<0.45&&y>g.pos.y&&y<g.pos.y+1.5){hitG=g;break;}}
    if(!hitG&&(Math.round(d*5)%3===0))for(const q of carsNear(x,z,0.6,y-1)){hitC=q;break;}}
  const x1=c.x+dx*d,y1=c.y+dy*d,z1=c.z+dz*d,fx=-Math.sin(p.cam.yaw),fz=-Math.cos(p.cam.yaw);
  tracer(c.x+fx*0.5+Math.cos(p.cam.yaw)*0.18,c.y-0.18,c.z+fz*0.5-Math.sin(p.cam.yaw)*0.18,x1,y1,z1);
  if(audio){noise(0.09,0.14,2600,'highpass');tone('square',220,90,0.06,0.04);}
  p.shake=Math.max(p.shake||0,0.03);rumble(p,0.2,50);
  if(hitG)damageGoblin(hitG,W.dmg,_gr.set(x1,y1,z1).clone(),new V3(dx,0.3,dz),W.cause);
  else if(hitC)damageCar(hitC,1,new V3(dx,0,dz));
  else puff(x1,y1,z1,2,0xb0a898,0.12);
}
// the stomp button: lob a grenade the way you're looking
function gobThrow(p){
  gobArms(p);if(p.gren<=0||p.grenCD>0||p.state==='dead'||p.drv)return;
  p.gren--;p.grenCD=0.6;const c=p.camera.position,cp=Math.cos(p.cam.pitch),dx=-Math.sin(p.cam.yaw)*cp,dy=Math.sin(p.cam.pitch),dz=-Math.cos(p.cam.yaw)*cp,v=15;
  shot({kind:'grenade',x:c.x+dx*0.6,y:c.y-0.1+dy*0.6,z:c.z+dz*0.6,vx:dx*v,vy:dy*v+4,vz:dz*v,grav:20,fuse:2.2,R:3.3,dmg:3,cause:GREN_CAUSE,bounce:true});
  sfx('Goblin throws a grenade',()=>{woosh(0.15,0.2,400,1200,0.08);});
}
function gobNextWpn(p){gobArms(p);const L=GOB_WPN_ORDER.filter(k=>p.wpns.includes(k));if(L.length<2)return;
  p.wpn=L[(L.indexOf(p.wpn)+1)%L.length];p.wpnT=camClock;sfx('Goblin switches weapon',()=>{tone('square',700,900,0.04,0.03);});}
// once a frame per player goblin, before the move: the throw and the weapon buttons, and the cooldown
function gobArmsTick(p,dt){gobArms(p);p.grenCD=Math.max(0,p.grenCD-dt);
  const st=!!p.in.stomp,wp=!!p.in.weapon;
  if(st&&!p.gStompWas&&playing)gobThrow(p);if(wp&&!p.gWpnWas&&playing)gobNextWpn(p);p.gStompWas=st;p.gWpnWas=wp;}
// ---- what's dropped: a little model on the ground, turning, until someone picks it up (or a minute and a half) ----
const PICKUPS=[],PU_MAT={};
function puModel(k){const g=new THREE.Group(),m=c=>PU_MAT[c]||(PU_MAT[c]=new THREE.MeshLambertMaterial({color:c})),b=(w,h,d,c,x,y,z)=>{const o=new THREE.Mesh(FB_GEO,m(c));o.scale.set(w,h,d);o.position.set(x,y,z);g.add(o);};
  if(k==='dagger'){b(0.08,0.08,0.14,0x2a1a10,0,0,-0.14);b(0.05,0.03,0.36,0xd0d4dc,0,0,0.1);}
  else if(k==='rifle'){b(0.1,0.14,0.3,0x4a3420,0,0,-0.36);b(0.07,0.07,0.7,0x22262c,0,0.02,0.12);b(0.05,0.12,0.05,0x22262c,0,-0.07,-0.12);}
  else{b(0.22,0.24,0.22,0x3a4a22,0,0,0);b(0.08,0.08,0.08,0x8a8a90,0,0.15,0);}
  g.visible=false;scene.add(g);return g;}
function gobDrop(g){const G2=gobGear(g),at=(k,n,o)=>{let P=PICKUPS.find(q=>!q.live&&q.k===k);if(!P){if(PICKUPS.length>=32){P=PICKUPS.find(q=>q.k===k);if(!P)return;}else{P={k,m:puModel(k),pos:new V3()};PICKUPS.push(P);}}
    const y=supportAt(g.pos.x+o,g.pos.z,g.pos.y+1.5);P.pos.set(g.pos.x+o,(y??g.pos.y)+0.3,g.pos.z);P.n=n;P.t=0;P.live=true;P.m.visible=true;P.m.position.copy(P.pos);};
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
      if(P.k==='grenade'){if(p.gren>=GREN_MAX)continue;const n=Math.min(P.n,GREN_MAX-p.gren);p.gren+=n;P.n-=n;flashLabel('Grenade'+(n>1?'s':'')+' +'+n+'  ·  '+p.gren+' in all',p);if(P.n>0)continue;}
      else{if(p.wpns.includes(P.k))continue;p.wpns.push(P.k);p.wpn=P.k;p.wpnT=camClock;flashLabel('Picked up a '+GOB_WPN[P.k].name.toLowerCase(),p);}
      sfx('Pick up',()=>{tone('triangle',660,990,0.08,0.06);});P.live=false;P.m.visible=false;break;}}
}
function gobPickupsClear(){for(const P of PICKUPS){P.live=false;P.m.visible=false;}}
// ---- on the HUD, just above the hearts: what's in hand, what else you've got, and the grenades ----
function gobArmsHud(p){
  let H=p.ui.gw;const show=p.gob&&p.active&&!p.drv&&p.state!=='dead';
  if(!H){if(!show)return;const el=document.createElement('div');el.className='gwpn';const xh=document.createElement('div');xh.className='gxh';xh.hidden=true;p.ui.view.append(xh);
    const bar=p.ui.view.querySelector('.bar'),who=bar&&bar.querySelector('.who');if(who)bar.insertBefore(el,who);else p.ui.view.append(el);H=p.ui.gw={el,xh,s:''};}
  H.el.hidden=!show;H.xh.hidden=!show||gobArms(p).wpn!=='rifle';if(!show)return;
  const bl=id=>actMark(p,id),L=GOB_WPN_ORDER.filter(k=>p.wpns.includes(k));
  const s=L.map(k=>k===p.wpn?'<b>'+GOB_WPN[k].name+'</b>':GOB_WPN[k].name).join(' · ')+(L.length>1?'  '+bl('weapon')+' next':'')+'  |  Grenades '+p.gren+(p.gren?'  '+bl('stomp')+' throw':'');
  if(H.s!==s){H.s=s;H.el.innerHTML=s.split(/(<b>[^<]*<\/b>)/).map(t=>t.startsWith('<b>')?'<b>'+glEsc(t.slice(3,-4))+'</b>':hudHTML(t)).join('');}
}
