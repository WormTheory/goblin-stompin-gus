// A tank as you drive it (vehicles/tank-handling.js), in the Testing Environment as Gnash: the tracks' weight (speed
// built slowly, a moment to stop), pivoting on the spot and turns widening with speed, the cruise steps (and S knocking
// them off), the gun's bloom growing on the move and settling when still (and the crosshair growing with it), HE against
// AP on a wall (a wide crater, a narrow tunnel bored deep) and on a vehicle, the gunsight (zoomed in from the turret), hull
// lock holding the turret straight ahead, and the hull tilting on a slope. node tankt.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,keys,mHeld,tenvSpawnOne,drvFind,get,setRaw,handOf,venues,groundAt,TANK,angDiff,');
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
const home={x:P.pos.x,y:P.pos.y,z:P.pos.z};
const army=()=>(T.venues.get('tenvArmy')||{mil:[]}).mil;
// (a tank spawned ahead, Gnash put beside it and in)
put(home.x,home.y,home.z);P.cam.yaw=0;P.cam.pitch=-0.2;run(0.3);T.tenvSpawnOne('tank');run(1);
const M=army().filter(m=>m.kind==='tank'&&!m.dead).sort((a,b)=>Math.hypot(a.x-P.pos.x,a.z-P.pos.z)-Math.hypot(b.x-P.pos.x,b.z-P.pos.z))[0];
if(!M){console.log('no tank spawned');process.exit(0);}
{let d=null;for(let r=3;r<7&&!d;r+=0.5){put(M.x+Math.cos(M.h)*r,M.y+0.2,M.z-Math.sin(M.h)*r);run(0.2);d=T.drvFind(P);}
 if(!d||d.o!==M){console.log('could not find the tank to get in');process.exit(0);}tap('KeyF');{let w=0;while(P.drv&&P.drv.jack&&w<60){run(0.1);w++;}}}
console.log('in the tank:',P.drv&&P.drv.k,P.drv&&P.drv.o===M,' controls:',hudT(P.ui.drvHud&&P.ui.drvHud.txt.w).split(' | ').slice(0,6).join(' | '));
const top=T.handOf('tank').top,look=()=>{P.cam.yaw=M.h+Math.PI;P.cam.pitch=-0.05;};
// ---- the tracks: building speed, and the time to stop
{look();hold(['KeyW'],0.5);const v1=M.sv;hold(['KeyW'],3);const v2=M.sv;let t=0;while(M.sv>0.05&&t<5){run(0.05);t+=0.05;}
 console.log('tracks: W 0.5 s',f2(v1),' 3.5 s',f2(v2),' (top',top+')  let go: stopped after',f2(t),'s');}
// ---- pivoting on the spot, and a turn at speed
{const h0=M.h,x0=M.x,z0=M.z;hold(['KeyD'],1);console.log('pivot: D 1 s at a standstill: turned',f2(T.angDiff(h0,M.h)),' moved',f2(Math.hypot(M.x-x0,M.z-z0)));
 look();hold(['KeyW'],3);const h1=M.h;hold(['KeyW','KeyD'],1);console.log('  D 1 s at',f2(M.sv),': turned',f2(T.angDiff(h1,M.h)),' (wider with speed)');hold(['KeyS'],2);run(1);}
// ---- the cruise steps
{look();const st=[];for(let k=0;k<3;k++){tap('ShiftLeft');st.push(M.cruise);}run(4);const v=M.sv;tap('KeyS');run(0.5);
 console.log('cruise: Shift three times: steps',st.join(','),' 4 s with nothing pressed: speed',f2(v),' S: cruise',M.cruise||0,' speed',f2(M.sv));
 tap('ShiftLeft');run(2);console.log('  Shift once: cruise',M.cruise,' speed',f2(M.sv));tap('KeyS');hold(['KeyS'],1);run(2);}
// ---- the bloom
{look();hold(['KeyW'],2);const b1=M.bloom,x1=P.ui.drvHud.xh.style.transform;run(0.3);hold(['KeyS'],1.5);let t=0;while(Math.abs(M.sv)>0.05&&t<4){run(0.05);t+=0.05;}
 const b2=M.bloom;run(1.2);console.log('bloom: moving',f2(b1),' crosshair',x1||'-','| stopped:',f2(b2),' 1.2 s still:',f2(M.bloom),' crosshair',P.ui.drvHud.xh.style.transform||'-');}
// ---- HE and AP on a wall: a stone wall 8 deep, 14 wide, 8 high, 22 ahead of the tank
const wall=(d0)=>{const fx=Math.sin(M.h),fz=Math.cos(M.h),lx=fz,lz=-fx,cells=[];
  for(let d=0;d<8;d++)for(let s=-7;s<=7;s++)for(let y=0;y<8;y++){const x=Math.floor(M.x+fx*(d0+d)+lx*s),z=Math.floor(M.z+fz*(d0+d)+lz*s),yy=Math.floor(M.y)+y;T.setRaw(x,yy,z,3);cells.push([x,yy,z,d]);}return cells;};
const shoot=(cells)=>{run(0.6);look();run(1.5);tap('Mouse0');const L=T.SHOTS[T.SHOTS.length-1],S=L&&{vd:L.vd,R:L.R,ap:L.ap},b0=M.bloom;run(0.5);const b1=M.bloom;run(0.7);const b2=M.bloom;run(1.8);
  let gone=0,deep=-1;for(const [x,y,z,d] of cells)if(T.get(x,y,z)!==3){gone++;deep=Math.max(deep,d);}return {gone,deep:deep+1,S,bl:f2(b0)+' -> '+f2(b1)+' -> '+f2(b2)};};
{const reload=()=>run(4);
 const c1=wall(22);const he=shoot(c1);reload();
 tap('KeyR');const sh=M.shell;for(const [x,y,z] of c1)T.setRaw(x,y,z,0);run(0.5);
 const c2=wall(22);const ap=shoot(c2);
 console.log('HE on the wall: blocks gone',he.gone,' deepest',he.deep,'of 8 | vd',he.S&&he.S.vd,' radius',he.S&&he.S.R,'| bloom on firing, 0.5 s, 1.2 s on:',he.bl);
 console.log('R: shell now',sh,'| AP on the wall: blocks gone',ap.gone,' deepest',ap.deep,'of 8 | vd',ap.S&&ap.S.vd,' radius',ap.S&&ap.S.R,' ap flag',ap.S&&ap.S.ap);
 for(const [x,y,z] of c2)T.setRaw(x,y,z,0);run(0.5);tap('KeyR');console.log('  R again:',M.shell);reload();}
// ---- the gunsight
{look();const f0=P.tkFov||72;down(['Mouse2']);run(0.3);const f1=P.tkFov,cd=Math.hypot(P.camera.position.x-M.x,P.camera.position.z-M.z),cy=P.camera.position.y-M.y,ov=P.ui.drvHud.tk&&!P.ui.drvHud.tk.hidden;up(['Mouse2']);run(0.3);
 console.log('gunsight: right click held: fov',f0,'->',f1,' camera',f2(cd),'from the middle,',f2(cy),'up  overlay',ov,'| let go: fov',P.tkFov||72,' overlay',!!(P.ui.drvHud.tk&&!P.ui.drvHud.tk.hidden));}
// ---- hull lock
{look();run(2);const tu0=M.tu;tap('KeyC');const on=M.hullLock;P.cam.yaw+=1.2;run(2);const tu1=M.tu;tap('KeyC');run(2);
 console.log('hull lock: C on',on,' camera swung 1.2: turret',f2(tu0),'->',f2(tu1),'| C off: turret follows to',f2(M.tu),' controls say',hudT(P.ui.drvHud.txt.w).includes('hull lock'));}
// ---- on a slope: a ramp of stone under its front half
{const fx=Math.sin(M.h),fz=Math.cos(M.h),lx=fz,lz=-fx;
 for(let d=1;d<16;d++)for(let s=-3;s<=3;s++){const h=Math.min(2,Math.floor(d/6));for(let y=0;y<h;y++)T.setRaw(Math.floor(M.x+fx*d+lx*s),Math.floor(M.y)+y,Math.floor(M.z+fz*d+lz*s),3);}
 run(0.5);const p0=M.pitch||0,y1=M.y;look();hold(['KeyW'],1.5);const p1=M.pitch;hold(['KeyW'],1);
 console.log('slope: level pitch',f2(p0),' driving up a ramp: pitch',f2(p1),' then',f2(M.pitch),' roll',f2(M.roll||0),' climbed',f2(M.y-y1));}
console.log('errors',errs.length,errs.slice(0,3));process.exit(0);
`);
