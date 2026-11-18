// A helicopter as you fly it (vehicles/heli-handling.js), in the Testing Environment as Gnash: the rotor spooling up
// before it lifts, Simple mode's weight (tilting into a move before the speed builds, flaring nose-up to a hover when let
// go), Agile mode (R; W/S collective, A/D pedals turning it on the spot with the camera, the camera's pitch and offset
// tilting it into forward flight and a strafe), the engine failing at a quarter of its health and autorotating (sinking,
// turning slowly, flared with Space near the ground into a rough landing it survives), and the main rotor mincing a goblin
// on a roof and chipping a wall. node helit.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,keys,mHeld,tenvSpawnOne,tenvFoe,drvFind,get,setRaw,venues,groundAt,HELI,MIL,angDiff,set menuOpen(v){menuOpen=v},get TS(){return TS},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const K=k=>k.startsWith('Mouse')?T.mHeld:T.keys;
const hold=(ks,s)=>{for(const k of ks)K(k).add(k);run(s);for(const k of ks)K(k).delete(k);};
const down=ks=>{for(const k of ks)K(k).add(k);},up=ks=>{for(const k of ks)K(k).delete(k);};
const tap=k=>{hold([k],0.05);run(0.05);};
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
const f2=v=>(Math.round(v*100)/100).toFixed(2);
const hudT=v=>v==null?'':String(v).replace(/⟦([^⟧]*)⟧/g,(m,t)=>'['+t+']');
T.DT.invuln=true;T.setGob(true);run(0.5);
const army=()=>(T.venues.get('tenvArmy')||{mil:[]}).mil;
P.cam.yaw=0;P.cam.pitch=-0.2;run(0.3);T.tenvSpawnOne('heli');run(1);
const M=army().filter(m=>m.kind==='heli'&&!m.dead).sort((a,b)=>Math.hypot(a.x-P.pos.x,a.z-P.pos.z)-Math.hypot(b.x-P.pos.x,b.z-P.pos.z))[0];
if(!M){console.log('no helicopter spawned');process.exit(0);}
{let d=null;for(let r=2.5;r<7&&!d;r+=0.5){put(M.x+Math.cos(M.h)*r,M.y+0.2,M.z-Math.sin(M.h)*r);run(0.2);d=T.drvFind(P);}
 if(!d||d.o!==M){console.log('could not find the helicopter to get in');process.exit(0);}tap('KeyF');{let w=0;while(P.drv&&P.drv.jack&&w<60){run(0.1);w++;}}}
T.DT.invuln=false;   // (so the helicopter itself can be hurt)
const behind=()=>{P.cam.yaw=M.h+Math.PI;P.cam.pitch=T.HELI.rest;},agl=()=>M.y-T.groundAt(M.x,M.z,M.y+1),sp=()=>Math.hypot(M.hv.x,M.hv.z);
console.log('in the helicopter:',P.drv&&P.drv.k,P.drv&&P.drv.o===M,' controls:',hudT(P.ui.drvHud&&P.ui.drvHud.txt.w).split(' | ').slice(0,4).join(' | '));
// ---- spooling up
{M.spin=0;behind();down(['Space']);const s=[];for(let t=0;t<3;t+=0.5){run(0.5);s.push(f2(M.spin)+'/'+f2(agl()));}run(2);up(['Space']);
 console.log('spool-up, Space held (rotor/height each half second):',s.join(' '),' after 5 s height',f2(agl()));}
hold(['Space'],2.5);run(1);
// ---- Simple: tilting first, then the speed; let go, a flare and a hover
{behind();hold(['KeyW'],0.3);const p1=M.pitch,v1=sp();hold(['KeyW'],3.5);const p2=M.pitch,v2=sp();let p3=9,t=0;while(sp()>0.3&&t<8){run(0.1);t+=0.1;p3=Math.min(p3,M.pitch);}
 console.log('Simple: W 0.3 s: nose down',f2(p1),' speed',f2(v1),'| W 3.8 s: nose',f2(p2),' speed',f2(v2),'| let go: nose up to',f2(p3),'(negative: a flare)  hovering after',f2(t),'s  height held',f2(agl()));}
// ---- Agile
{const h0=M.h;behind();tap('KeyR');console.log('R: mode',M.agile?'Agile':'Simple',' display says',hudT(P.ui.drvHud.txt.w).includes('collective'));
 const y0=M.y;hold(['KeyW'],1.5);const climb=M.y-y0;const y1=M.y;hold(['KeyS'],1);const sink=M.y-y1;
 const c0=P.cam.yaw,h1=M.h,x0=M.x,z0=M.z;hold(['KeyD'],1);
 console.log('  W 1.5 s (collective): climbed',f2(climb),'| S 1 s:',f2(sink),'| D 1 s (pedals): turned',f2(T.angDiff(h1,M.h)),' moved',f2(Math.hypot(M.x-x0,M.z-z0)),' camera turned with it',f2(T.angDiff(c0,P.cam.yaw)));
 behind();P.cam.pitch=T.HELI.rest-0.3;run(2);const fx=Math.sin(M.h),fz=Math.cos(M.h),fw=M.hv.x*fx+M.hv.z*fz;
 console.log('  camera tipped down 0.3: nose',f2(M.pitch),' forward speed',f2(fw));
 behind();run(3);P.cam.yaw-=0.35;run(1.5);const sd=M.hv.x*fz-M.hv.z*fx;console.log('  camera swung 0.35 right: roll',f2(M.roll),'(right wing down positive)  sideways speed',f2(sd),'(left positive)  heading kept',f2(T.angDiff(h0,M.h)));
 behind();run(4);tap('KeyR');console.log('  R again:',M.agile?'Agile':'Simple');}
// ---- the rotor: a goblin stood level with the rotor on a block tower beside it, and a wall
{behind();hold(['Space'],1);run(1);const fx=Math.sin(M.h),fz=Math.cos(M.h),sx=fz,sz=-fx,ry=M.y+T.HELI.rotorY;
 const tx=Math.floor(M.x+sx*4),tz=Math.floor(M.z+sz*4),gy=T.groundAt(tx+0.5,tz+0.5,ry);for(let y=Math.floor(gy);y<Math.floor(ry-1);y++)T.setRaw(tx,y,tz,3);
 T.menuOpen=true;T.TS.n=1;T.tenvFoe('goblin');T.menuOpen=false;const g=T.goblins.filter(q=>q.state==='chase'&&q.root.visible).sort((a,b)=>Math.hypot(a.pos.x-M.x,a.pos.z-M.z)-Math.hypot(b.pos.x-M.x,b.pos.z-M.z))[0];
 const before=g?g.hp:0;if(g){g.pos.set(tx+0.5,Math.floor(ry-1),tz+0.5);g.vy=0;g.kv.set(0,0,0);}run(0.3);
 console.log('rotor: a goblin on a tower, its head at rotor height: hp',before,'->',g?g.hp:'?','| minced',g?g.state!=='chase':'?');
 const hp0=M.hp;const wx=Math.floor(M.x-sx*4.6),wz=Math.floor(M.z-sz*4.6);let gone=0;const cells=[];for(let d=-1;d<=1;d++)for(let y=-1;y<=1;y++){const x=wx+Math.round(fx*d),z=wz+Math.round(fz*d),yy=Math.floor(ry)+y;T.setRaw(x,yy,z,3);cells.push([x,yy,z]);}
 run(1);for(const [x,y,z] of cells)if(T.get(x,y,z)!==3)gone++;console.log('  a wall in the rotor\\'s sweep: blocks chipped',gone,'of',cells.length,' helicopter hp',hp0,'->',M.hp);}
// ---- autorotation: brought down to a fifth of its health, high up
{behind();hold(['Space'],4);const h0=agl();M.hp=Math.round(T.MIL.heli.hp*0.2);run(0.2);const a0=M.auto;const hd=M.h;run(2.5);
 console.log('autorotation: at',f2(h0),'up, hp',M.hp,': engine out',a0,' 2.5 s on: rotor',f2(M.spin),' sinking',f2(M.vy),' turned',f2(T.angDiff(hd,M.h)),' display',hudT(P.ui.drvHud.txt.w).includes('ENGINE')||'(on the instrument)');
 down(['KeyW']);let t=0;while(agl()>T.HELI.flareH&&t<60){run(0.1);t+=0.1;}up(['KeyW']);const vA=M.vy;down(['Space']);t=0;let vB=0;while(agl()>0.05&&t<15&&!M.dead){vB=M.vy;run(0.05);t+=0.05;}up(['Space']);run(0.5);
 console.log('  near the ground at',f2(vA),': Space flares: sinking',f2(vB),'at touchdown',' down after',f2(t),'s  survived',!M.dead,' hp',M.hp);}
console.log('errors',errs.length,errs.slice(0,3));process.exit(0);
`);
