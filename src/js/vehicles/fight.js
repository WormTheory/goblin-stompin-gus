// ---- vehicles in a fight: what a shell or a rocket does to them, how they show they've been hit, and aircraft that
// come down hard ----
// a vehicle struck: sparks and a puff of smoke where it's hit (and a clang, for a real blow)
function vHitFx(x,y,z,n){puff(x,y,z,Math.min(8,2+Math.round(n/8)),0xffb040,0.5);puff(x,y,z,2,0x5a5a5a,0.6);if(audio&&n>=2)clang();}
// badly hurt (f: what's left of its health): under s (its kind's smoke, VEHICLE_KINDS) smoke pouring off it, and under
// half that, flames too
function vDamaged(x,y,z,f,dt,s=0.5){
  if(f<s&&Math.random()<dt*(f<s/2?12:4))smoke(x+(Math.random()-.5),y,z+(Math.random()-.5),1,f<s/2?0x1a1a1a:0x6a6a6a);
  if(f<s/2&&Math.random()<dt*6)puff(x,y,z,1,Math.random()<.5?0xff8a2a:0xffc040,0.3);
}
// does a shell or rocket at S.pos meet a vehicle (other than the one that fired it)? (Of the soft boxes, only a zoo
// animal's stops it: a Ferris wheel's rim or a carousel's box is mostly air, so a shot goes on through to its frame)
// (true-ish: the car, or the vehicle box, it meets, for anything that wants to know which. S.noShip: a bullet, which goes on into a ship's pocket instead of stopping at the boxes standing for it: shipLines)
function shotHitsVeh(S){const x=S.pos.x,y=S.pos.y,z=S.pos.z;
  for(const c of cars){if(!c.alive||c===S.own)continue;const dx=x-c.pos.x,dz=z-c.pos.z;if(dx*dx+dz*dz>(c.hz+1)*(c.hz+1)||y<c.pos.y-0.2||y>c.pos.y+(c.hy||1.4)+0.2)continue;
    const s=Math.sin(c.heading),k=Math.cos(c.heading);if(Math.abs(dx*s+dz*k)<=c.hz+0.2&&Math.abs(dx*k-dz*s)<=c.hx+0.2)return c;}
  for(const B of TRAIN_BOXES){const pr=B.proxy;if(!pr.alive||B.soft&&!(pr.T&&pr.T.isAnimal)||pr.T===S.own||S.noShip&&(pr.isShipBox||B.mw)||pr.isMountBox&&pr.T.S===S.own||y<B.y0-0.2||y>B.top+0.2)continue;const dx=x-B.x,dz=z-B.z,hx=B.hx||TRAIN_HX,hz=B.hz||TRAIN_HZ;
    if(Math.abs(dx)>hx+hz+1||Math.abs(dz)>hx+hz+1)continue;if(Math.abs(dx*B.tx+dz*B.tz)<=hz+0.2&&Math.abs(-dx*B.tz+dz*B.tx)<=hx+0.2)return B;}
  return false;}
// a blast's harm to the vehicles round it (vd at the middle, less at the edge): cars, and every train car, boat, plane,
// tank, helicopter, ride and zoo animal within reach of it (each just once; soft boxes too: a zoo animal, a wheel's rim,
// a carousel). own: the vehicle that fired, spared
function vehBlast(x,y,z,R,vd,own){
  if(!(vd>0)||!(R>0))return;
  for(const c of cars){if(!c.alive||c===own)continue;const dx=c.pos.x-x,dz=c.pos.z-z,d=Math.hypot(dx,dz,(c.pos.y+0.8-y)*0.7),r=R+c.hz*0.5;if(d>r)continue;
    const n=vd*(1-0.6*d/r),dir=new V3(dx,0,dz);damageCar(c,n,dir);if(c.alive&&n>12)launchCar(c,3+n*0.08,dir,4);}
  const done=new Set();
  for(const B of TRAIN_BOXES){const pr=B.proxy,T=pr.T;if(!pr.alive||!T||T===own)continue;const key=T.cars&&T.C?T.cars[pr.i]||pr:T;if(done.has(key))continue;
    const hx=B.hx||TRAIN_HX,hz=B.hz||TRAIN_HZ,dx=x-B.x,dz=z-B.z,al=dx*B.tx+dz*B.tz,ac=-dx*B.tz+dz*B.tx,ea=Math.max(0,Math.abs(al)-hz),ec=Math.max(0,Math.abs(ac)-hx),
      dy=y<B.y0?B.y0-y:y>B.top?y-B.top:0,d=Math.hypot(ea,ec,dy);if(d>R)continue;
    done.add(key);trainHit(T,vd*(1-0.6*d/R),new V3(-dx,0,-dz),pr.i);}
}
// an aircraft coming down hard: a fireball that blows a crater out of whatever it hits, wrecks the vehicles round it
// and sets the place alight
function airCrash(x,y,z,R,cause){
  crushBall(x,y,z,R,{force:1.6,up:1.4});foeBoom(x,y,z,R*1.7,10,cause,null,0,120);
  blastFx(x,y+1,z,0.9,R*0.6);
  smoke(x,y+1,z,30,0x1e1e1e);for(let k=0;k<14;k++)puff(x,y+1,z,1,Math.random()<.5?0xff8a2a:0xffc040,R*0.4);
  {const g=supportAt(x,z,y+2);addFire(x,g===null?y:g,z,R*0.6,40);}
  if(audio){noise(1.4,1,350,'lowpass');tone('sawtooth',60,14,1.6,0.32);}addShake(1.4,x,z,R*14);
}
// a plane wrecked by flying into something or landing too hard: it goes up where it hits
function planeCrash(pl,x,y,z,ground){planeHit(pl,PLANE_HP);if(ground)pl.fall=false;airCrash(x,y,z,7,'Killed when a plane crashed');}
// how hurt the vehicle you're driving is
function drvHP(D){if(D.netHP)return D.netHP;return vehHealth(D);}   // (D.netHP: a guest online, told by the host; the rest from each kind's entry, VEHICLE_KINDS)
// the driving display: what you're in and its health along the top; for a tank or a helicopter a crosshair in the middle
// (where drvAim finds, so where a shot goes), dim while it reloads, and for a tank a marker where its gun points now
const _dhv=new THREE.Vector3();
function drvHud(p){
  let H=p.ui.drvHud;
  if(!p.drv||!p.gob||p.drv.jack){if(H&&!H.el.hidden){H.el.hidden=true;H.dv.hidden=true;if(H.mg)H.mg.el.hidden=true;}return;}
  // (after the camera's been placed for this step, and its matrices brought up to date, so markers put on things in the
  // view (the Mobile Gear's lock box, the gun marker) sit on them now, not where they were a frame ago)
  p.camera.updateMatrixWorld();   // (a camera's brings its inverse up to date too)
  // (the crosshair and gun marker go over the view; the vehicle's health and its ammo sit just above your hearts)
  if(!H){const el=document.createElement('div');el.className='drvhud';el.innerHTML='<div class="xh"></div><div class="xt"></div>';p.ui.view.append(el);
    const dv=document.createElement('div');dv.className='dveh';dv.innerHTML='<div class="dbox"><div class="dname"></div><div class="dbar"><i></i></div></div><div class="dammo"></div>';
    // (the controls: a column down the left of the view, one to a line, rather than a row under the health bar)
    const dk=document.createElement('div');dk.className='dkeys';el.append(dk);
    const bar=p.ui.view.querySelector('.bar'),who=bar&&bar.querySelector('.who');if(who)bar.insertBefore(dv,who);else el.append(dv);
    H=p.ui.drvHud={el,dv,xh:el.querySelector('.xh'),xt:el.querySelector('.xt'),box:dv.querySelector('.dbox'),name:dv.querySelector('.dname'),fill:dv.querySelector('.dbar i'),wpn:dk,ammo:dv.querySelector('.dammo'),txt:{}};}
  const D=p.drv,o=D.o,armed=drvArmed(p),{hp,max}=drvHP(D),f=Math.max(0,Math.min(1,hp/max));
  const set=(k,el,v)=>{if(H.txt[k]!==v){H.txt[k]=v;el.innerHTML=k==='w'?String(v).split(/\s+·\s+/).map(l=>'<div>'+hudHTML(l)+'</div>').join(''):hudHTML(v);}};
  H.el.hidden=false;H.dv.hidden=false;
  set('n',H.name,(D.seat==='gun'?'Gunner  ·  ':'')+drvName(D).replace(/^./,c=>c.toUpperCase())+'  ·  '+Math.max(0,Math.ceil(hp))+' / '+Math.round(max));
  const w=(f*100).toFixed(1)+'%';if(H.txt.hpw!==w){H.txt.hpw=w;H.fill.style.width=w;H.fill.style.background=f>0.5?'#7fc24a':f>0.25?'#f0a04a':'#e0564a';}
  if(H.lastHp!==undefined&&hp<H.lastHp)H.hitT=camClock;H.lastHp=hp;H.box.classList.toggle('hit',camClock-(H.hitT??-9)<0.25);
  const bl=id=>(id=ctxId(p,id),btnMark(p.pad?bindGlyph('pad',BINDS[id].pad[p.pad&&id==='bite'?1:0]??BINDS[id].pad[0]):bindGlyph('kb',BINDS[id].kb[0]))),out=drvKey(p);
  const lk=bl('lock'),LT=p.lockT,W=armed&&o.wpn?Object.values(o.wpn):[],w0=W[0],ready=!w0||w0.rl<=0&&w0.n>0;
  // (the other seat, if it's free: the weapon button moves you to it. See gunner.js)
  const sw=drvSwapTo(p)?'  ·  '+bl('weapon')+(D.seat==='gun'?' drive':' man the gun'):!armed&&o.gnr&&(D.k==='tank'||D.k==='heli')?'  ·  Your gunner has the guns':'';
  const how=drvHow(p,D,armed);
  const ph=D.k==='plane'?planeHud(o.free,o):'';
  set('w',H.wpn,how+(D.k==='plane'&&armed&&ph?ph+'  ·  ':'')+(armed?(LT?'Locked on '+(isMilT(LT)?MIL[LT.kind].name.toLowerCase():isCarT(LT)?'a '+(LT.veh||'car'):'a goblin')+' ('+lk+' let go)':lk+' lock on')+'  ·  '+out+' get out'
    :D.k==='car'&&o.veh==='fire'?bl('bite')+' spray water  ·  '+bl('stomp')+' horn  ·  '+out+' get out'
    :D.k==='plane'?(ph?ph+'  ·  ':'')+out+' get out':D.k==='mech'?mechHint(p):out+' get out')+sw);
  const hose=D.k==='car'&&o.veh==='fire';H.xh.hidden=!armed&&!hose&&D.k!=='mech';mechHud(p,H);if(hose){H.xh.classList.remove('cool','lock');H.xh.classList.toggle('water',!!o.hose);}if(armed){H.xh.classList.toggle('cool',!ready);H.xh.classList.toggle('lock',!!LT);}
  // (the ammo by the crosshair: each weapon, its button, a pip for each round left -- or a bar, for a machine gun's
  // belt -- and while it reloads, a bar filling and the seconds to go)
  H.ammo.hidden=!W.length;
  if(W.length){const key=D.k+(p.pad?'p':'k');
    if(H.ammoK!==key){H.ammoK=key;H.ammo.innerHTML='';H.aw=W.map(s=>{const r=document.createElement('div');r.className='aw';
        const many=s.W.max>8,keyL=bl(s.W.k==='rkt'?'stomp':'bite');
        r.innerHTML='<span class="an">'+s.W.name+' '+hudHTML(keyL)+'</span><span class="ap">'+(many?'<span class="belt"><i></i></span>':'<span class="pip"></span>'.repeat(s.W.max))+'</span><span class="ac"></span><span class="rlb"><i></i></span>';
        H.ammo.append(r);return{r,s,many,pips:[...r.querySelectorAll('.pip')],belt:r.querySelector('.belt i'),ac:r.querySelector('.ac'),rl:r.querySelector('.rlb i'),last:''};});}
    for(const a of H.aw){const s=o.wpn[a.s.W.k]||a.s,rl=s.rl>0,st=(rl?'r'+s.rl.toFixed(1):'n'+s.n);if(st===a.last)continue;a.last=st;
      a.r.classList.toggle('rl',rl);
      if(a.many)a.belt.style.width=(s.n/s.W.max*100).toFixed(1)+'%';else a.pips.forEach((e,k)=>e.classList.toggle('e',k>=s.n));
      if(rl){a.rl.style.width=((1-s.rl/s.W.reload)*100).toFixed(1)+'%';a.ac.textContent=(s.W.heat?'Overheated ':'Reloading ')+s.rl.toFixed(1)+'s';}
      else a.ac.textContent=a.many?String(s.n):'';}}
  // (where the shot would really go off, fired now, put on the screen: the gun's reach, the turret still swinging round
  // and anything in the way all show; faint when it would burst in mid-air, out of range)
  // (where the shot would really go off, fired now, put on the screen: the gun's reach, the turret still swinging round
  // and anything in the way all show; faint when it would burst in mid-air, out of range)
  // (a Mobile Gear's the same for each gun arm, where its barrel points: gunMk, from mgWpnPose. One for the right arm,
  // and one for the left when it carries a rifle too)
  const pts=D.k==='mech'?o.gunMk||[]:[armed&&o.pred?o.pred:null];
  if(!H.xt2){H.xt2=document.createElement('div');H.xt2.className='xt';H.el.append(H.xt2);}
  [H.xt,H.xt2].forEach((e,k)=>{const P=pts[k];let show=false;
    if(P){const cam=p.camera;_dhv.set(P.x,P.y,P.z);if(P.x>=SHIP_X0)shipPt(_dhv);   // (aboard a ship, in its pocket: put where the ship really is)
      _dhv.y-=CURVE_U.value*((_dhv.x-cam.position.x)**2+(_dhv.z-cam.position.z)**2);_dhv.project(cam);
      // (off the screen -- the turret still swung well away, or the gun far below where you're looking -- it sits at the
      // edge, toward where the shot will go)
      if(_dhv.z<1&&_dhv.z>-1){show=true;const off=Math.abs(_dhv.x)>0.97||Math.abs(_dhv.y)>0.95;
        e.style.left=((Math.max(-0.97,Math.min(0.97,_dhv.x))+1)/2*100).toFixed(2)+'%';e.style.top=((1-Math.max(-0.95,Math.min(0.95,_dhv.y)))/2*100).toFixed(2)+'%';
        e.classList.toggle('off',off);}
      e.classList.toggle('air',!!P.air);}
    e.hidden=!show;});
}
// a flown plane's one line of advice under its controls (its gauges are its instrument: the speed it lifts off at on
// the runway, a stall warning in the air)
function planeHud(F,pl){if(!F)return'';const LIFT=pl&&pl.light?LIGHT_FLY.lift:PLANE_LIFT;
  if(!F.air)return F.v<LIFT?'Take-off at '+Math.round(LIFT*BPS_KN)+' knots':'Pull up to take off';
  return planeStalled(F,pl)?'STALL: push the nose down':'';}
// the vehicle's own controls, at the top of the column down the left (the only place they're shown: there's no card
// about them on getting in), each ending in '  ·  ' so the rest follows
function drvHow(p,D,armed){const A=id=>actMark(p,id),G=armed?D.k==='heli'?A('bite')+' gun  ·  '+A('stomp')+' rockets  ·  ':D.k==='plane'?A('bite')+' cannon  ·  '+A('stomp')+' missiles  ·  ':D.k==='tank'||D.seat==='gun'?A('bite')+' fire  ·  ':'':'';
  if(D.seat==='gun')return G;
  const K=VEHICLE_KINDS[D.k];return K?K.how(p,D,armed,G):G;}
// a plane's (a jet's arresting hook too, for landing on a carrier: carrier-jets.js)
function planeHow(p,D,armed,G){const A=id=>actMark(p,id),hk=D.o.jet?A('weapon')+(D.o.hook?' hook up':' hook down')+'  ·  ':'';
  return p.pad?'Stick up/down throttle  ·  Stick left/right bank  ·  '+A('jump')+' pull up  ·  '+A('climb')+' push down  ·  '+G+hk
    :A('fwd')+'/'+A('back')+' nose down/up  ·  '+A('left')+'/'+A('right')+' bank  ·  '+A('jump')+'/'+A('climb')+' throttle up/down  ·  '+G+hk;}
// on his way down a ramp he stays on it, instead of falling a little and landing every few steps
function stickToRamp(p,g){
  if(!p.grounded||p.state!=='walk'||p.standCar||p.dodge||p.pos.y-g>=0.4)return false;
  const s=Math.sin(p.heading),c=Math.cos(p.heading);
  for(const [a,b] of ptsOf(p))if(rampUnder(p.pos.x+a*c+b*s,p.pos.z-a*s+b*c,p.pos.y))return true;
  return false;
}
