// The forklift's forks and the tractor's hitch (vehicles/farm-lift.js), in the Testing Environment as Gnash: the forks
// up, down and tilted; a crate picked up and set down on a ledge; a goblin lifted; a light car lifted; lancing a goblin;
// tipping over in a hard turn with the forks up and being righted; the tractor's hand throttle steps, the plough turning
// grass to dirt and throwing goblins aside, the mower, an empty hitch on a road; what the instruments and the controls
// column say. node farmlift.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,keys,mHeld,tenvSpawnOne,tenvFoe,drvFind,cars,get,setRaw,solidAt,CRATE,DIRT,GRASS,ASPHALT,FLOWER,forkMid,FORK,set menuOpen(v){menuOpen=v},get TS(){return TS},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const hold=(ks,s)=>{for(const k of ks)(k.startsWith('Mouse')?T.mHeld:T.keys).add(k);run(s);for(const k of ks)(k.startsWith('Mouse')?T.mHeld:T.keys).delete(k);};
const tap=k=>{hold([k],0.05);run(0.05);};
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
const f2=v=>(Math.round(v*100)/100).toFixed(2);
const hudT=v=>v==null?'':String(v).replace(/⟦([^⟧]*)⟧/g,(m,t)=>'['+t+']');
T.DT.invuln=true;T.setGob(true);run(0.5);
const home={x:P.pos.x,y:P.pos.y,z:P.pos.z};
// (spawn one ahead, find it and get in, facing along it)
function getIn(kind,ox){put(home.x+ox,home.y,home.z);P.cam.yaw=0;P.cam.pitch=-0.2;run(0.3);T.tenvSpawnOne(kind);run(1);
  const c=T.cars.filter(o=>o.alive&&o.veh===kind).sort((a,b)=>Math.hypot(a.pos.x-P.pos.x,a.pos.z-P.pos.z)-Math.hypot(b.pos.x-P.pos.x,b.pos.z-P.pos.z))[0];
  if(!c){console.log(kind,'not spawned');return null;}
  put(c.pos.x+Math.cos(c.heading)*(c.hx+0.6),c.pos.y+0.2,c.pos.z-Math.sin(c.heading)*(c.hx+0.6));run(0.1);tap('KeyF');
  if(!P.drv||P.drv.o!==c){console.log(kind,'could not get in');return null;}return c;}
// (one goblin, from the Testing Environment's button, put at x,z)
function gob(x,y,z,st){T.menuOpen=true;T.TS.n=1;T.tenvFoe('goblin');T.menuOpen=false;const g=T.goblins.filter(q=>q.state==='chase'&&q.root.visible&&!q.forkOn).sort((a,b)=>Math.hypot(a.pos.x-x,a.pos.z-z)-Math.hypot(b.pos.x-x,b.pos.z-z))[0];
  if(g){g.pos.set(x,y,z);g.vy=0;g.kv.set(0,0,0);g.stun=st||0.3;}return g;}
const inst=()=>P.ui.inst?P.ui.inst.innerHTML:'';
// ---- the forklift
{const c=getIn('forklift',0);if(c){const F=()=>c.fork||{h:0,tilt:0};
  console.log('forklift: in',!!P.drv,' instrument',P.instK,' controls:',hudT(P.ui.drvHud&&P.ui.drvHud.txt.w).split(' | ').slice(0,3).join(' | '));
  hold(['Space'],1.5);const h1=F().h;hold(['Space'],3);const h2=F().h;
  const mp=T.forkMid(c);console.log('  Space 1.5 s: forks at',f2(h1),' 4.5 s:',f2(h2),'(top',T.FORK.top+')  their height in the world',f2(mp.y-c.pos.y),' carriage on the model',f2(c.vehG.forklift.carr.position.y));
  hold(['ShiftLeft','Space'],1.5);const tb=F().tilt;hold(['ShiftLeft','KeyC'],3);const tf=F().tilt;console.log('  Shift+Space: tilted back',f2(tb),' Shift+C: forward',f2(tf),' mast on the model',f2(c.vehG.forklift.mast.rotation.x));
  hold(['ShiftLeft','Space'],1);hold(['KeyC'],4);console.log('  C 4 s: forks down to',f2(F().h));
  // (a crate just in front at the forks' height: raising picks it up)
  const fx=Math.sin(c.heading),fz=Math.cos(c.heading),y0=Math.floor(c.pos.y+0.1);
  const cx=Math.floor(c.pos.x+fx*1.5),cz=Math.floor(c.pos.z+fz*1.5);T.setRaw(cx,y0,cz,T.CRATE);run(0.1);
  hold(['Space'],0.6);console.log('  crate in front, Space: load',F().load&&F().load.name,' crate block gone',T.get(cx,y0,cz)!==T.CRATE,' crate on the model',c.vehG.forklift.crate.visible,' instrument says CRATE',/CRATE/.test(inst()));
  // (a ledge two blocks high a little ahead: up over it, forward, down on to it)
  const lx=Math.floor(c.pos.x+fx*3.2),lz=Math.floor(c.pos.z+fz*3.2);for(let k=-1;k<=1;k++)for(let y=y0;y<y0+2;y++){T.setRaw(lx+Math.round(fz*k),y,lz-Math.round(fx*k),3);T.setRaw(lx+Math.round(fx)+Math.round(fz*k),y,lz+Math.round(fz)-Math.round(fx*k),3);}
  run(0.1);hold(['Space'],3.5);const x0=c.pos.x,z0=c.pos.z;hold(['KeyW'],0.9);run(0.5);const went=Math.hypot(c.pos.x-x0,c.pos.z-z0);hold(['KeyC'],4);
  let placed=null;for(let dx=-3;dx<=3&&!placed;dx++)for(let dz=-3;dz<=3&&!placed;dz++)for(let y=y0+1;y<=y0+3;y++)if(T.get(lx+dx,y,lz+dz)===T.CRATE){placed={dx,dz,y:y-y0};break;}
  console.log('  forks up, forward',f2(went),'then lowered: forks stop at',f2(F().h),' load',F().load?F().load.name:'none',' crate set down',placed?'on the ledge, '+placed.y+' up':'nowhere');
  hold(['KeyS'],1.2);run(0.6);hold(['KeyC'],3);
  // (a goblin stood on the forks)
  {const m=T.forkMid(c),g=gob(m.x,c.pos.y,m.z);if(g){hold(['Space'],1.5);const L=F().load;console.log('  goblin on the forks, Space 1.5 s: load',L&&L.name,' goblin raised',f2(g.pos.y-c.pos.y),' stays put',!!g.forkOn,' instrument says GOBLIN',/GOBLIN/.test(inst()));
    hold(['KeyC'],3);console.log('  lowered: load',F().load?F().load.name:'none',' goblin free',!g.forkOn);g.pos.x+=40;}}
  hold(['KeyS'],1);run(0.5);
  // (a parked car just ahead, nose on: forward till the forks are under it, then up)
  {T.tenvSpawnOne('car');run(0.5);const o=T.cars.filter(q=>q.alive&&q.veh==='car'&&q!==c).sort((a,b)=>Math.hypot(a.pos.x-c.pos.x,a.pos.z-c.pos.z)-Math.hypot(b.pos.x-c.pos.x,b.pos.z-c.pos.z))[0];
    if(o){const al=c.hz+0.05+o.hz;o.pos.set(c.pos.x+fx*al,c.pos.y,c.pos.z+fz*al);o.heading=c.heading;o.speed=0;run(0.3);hold(['Space'],1.5);const L=F().load;
      console.log('  a car ahead, Space: load',L&&L.name,' car raised',f2(o.pos.y-c.pos.y),' forklift moves with it: ');hold(['KeyW'],1);console.log('    car still on the forks after driving',!!o.forkOn&&F().load&&F().load.o===o,' lowered:');hold(['KeyC'],3);run(0.5);console.log('    car down',!o.forkOn,' height over the forklift',f2(o.pos.y-c.pos.y));}}
  hold(['KeyS'],1);run(0.5);
  // (lancing: forks at a goblin's chest, at speed)
  {hold(['Space'],1);const m=T.forkMid(c),g=gob(c.pos.x+fx*6,c.pos.y,c.pos.z+fz*6);if(g){const hp0=g.hp;hold(['KeyW'],2.5);console.log('  forks up at',f2(F().h),'driven at a goblin: hurt',g.hp<hp0||g.state!=='chase',' speed',f2(c.speed));}}
  hold(['KeyS'],1.5);run(0.5);
  // (forks right up, full speed, full lock: over it goes)
  hold(['Space'],3.5);const r0=F().risk;hold(['KeyW'],1.6);hold(['KeyW','KeyD'],2.5);run(1.5);
  console.log('  forks up, standing: tip risk',f2(r0),' hard turn at speed: tipped',Math.abs(c.tipR||0)>1.4,'(',f2(c.tipR||0),')  driver thrown out',!P.drv,' risk',f2(F().risk));
  put(c.pos.x+Math.cos(c.heading)*2.2,c.pos.y+0.3,c.pos.z-Math.sin(c.heading)*2.2);run(0.2);tap('KeyF');run(1.5);console.log('  got back in',!!P.drv,' righted',Math.abs(c.tipR||0)<0.01);
  // (reversing beeps: the sound list)
  if(P.drv)tap('KeyF');run(0.5);}}
// ---- the tractor
{const c=getIn('tractor',90);if(c){const F=()=>c.farm||{cr:0,imp:'plough',down:false};
  console.log('tractor: in',!!P.drv,' instrument',P.instK,' controls:',hudT(P.ui.drvHud&&P.ui.drvHud.txt.w).split(' | ').slice(0,3).join(' | '));
  tap('KeyR');tap('KeyR');run(3);const v2=c.speed;tap('KeyR');run(2.5);const v3=c.speed;tap('ShiftLeft');tap('ShiftLeft');tap('ShiftLeft');run(3);const v0=c.speed;
  console.log('  R R, nothing held 3 s: cruise step',2,' speed',f2(v2),' R: ',f2(v3),' Shift x3: step',F().cr,' speed',f2(v0));
  tap('KeyR');tap('KeyR');tap('KeyR');run(2);const vfree=c.speed;tap('Space');run(0.4);
  // (count the dirt in a box round where it's going)
  const y0=Math.floor(c.pos.y-0.5),bx=Math.floor(c.pos.x),bz=Math.floor(c.pos.z);const dirt=()=>{let n=0;for(let dx=-40;dx<=40;dx++)for(let dz=-40;dz<=40;dz++)if(T.get(bx+dx,y0,bz+dz)===T.DIRT)n++;return n;};
  const d0=dirt(),x0=c.pos.x,z0=c.pos.z;run(3);const went=Math.hypot(c.pos.x-x0,c.pos.z-z0),vw=c.speed;
  console.log('  plough lowered: hitch on the model',f2(c.vehG.tractor.imp.position.y),' speed',f2(vfree),'->',f2(vw),' dirt blocks',d0,'->',dirt(),'over',f2(went),'blocks');
  {const fx=Math.sin(c.heading),fz=Math.cos(c.heading),g=gob(c.pos.x-fx*2.3,c.pos.y,c.pos.z-fz*2.3,6);if(g){const hp0=g.hp,p0={x:g.pos.x,z:g.pos.z};run(3);
    console.log('  a goblin just behind, in the way of the plough: hurt',g.hp<hp0||g.state!=='chase',' thrown',f2(Math.hypot(g.pos.x-p0.x,g.pos.z-p0.z)));}}
  hold(['Mouse2'],0.05);run(0.3);console.log('  right click: implement',F().imp,' mower on the model',c.vehG.tractor.mower.visible,' controls say mower',/mower/.test(hudT(P.ui.drvHud&&P.ui.drvHud.txt.w)));
  {const fx=Math.sin(c.heading),fz=Math.cos(c.heading),y=Math.floor(c.pos.y-0.5),fl=[];for(let k=5;k<14;k++){const x=Math.floor(c.pos.x+fx*k+fz*1.3),z=Math.floor(c.pos.z+fz*k-fx*1.3);T.setRaw(x,y+1,z,T.FLOWER);fl.push([x,z]);}
    const g=gob(c.pos.x+fx*7+fz*1.45,c.pos.y,c.pos.z+fz*7-fx*1.45,6);const v0=c.speed;run(4);const left=fl.filter(([x,z])=>T.get(x,y+1,z)===T.FLOWER).length;
    console.log('  mower down at',f2(v0),'past a row of',fl.length,'flowers and a goblin beside its track: goblin dead',g?g.state!=='chase':'(none)',' flowers left',left);}
  hold(['Mouse2'],0.05);run(0.2);console.log('  right click: implement',F().imp);
  tap('Space');run(0.4);const hy=c.vehG.tractor.imp.position.y;tap('Space');run(0.4);console.log('  raise and lower the bare hitch: model',f2(hy),'->',f2(c.vehG.tractor.imp.position.y),' instrument says HITCH',/HITCH/.test(inst()));
  tap('KeyS');hold(['KeyS'],3);console.log('  brake: cruise off',F().cr===0);
  tap('KeyF');run(0.5);}}
console.log('errors',errs.length,errs.slice(0,3));
`);
process.exit(0);
