// The Mobile Gear (Testing Environment): its button stands one ahead of Gus; a hippo can't get in, a goblin can; walking,
// boost skating, quick boosts, jumping and flying on its energy bar, the redline; steps, walls; trampling goblins; the
// display; smashing through walls and buildings at speed; the legs (soles on the ground and flat, stepping the way it
// goes, splayed skating, nothing snapping on takeoff or landing) and which thrusters fire; getting out (a hold); hurt and wrecked; Gnash and Grizzle flying it exactly the same. node mech.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,get:(x,y,z)=>get(x,y,z),keys,mHeld,setRaw,solidAt,tenvVeh,MG,BINDS,ACTS,setBind,drvFind,mgFits,get nEdits(){return Object.keys(edits).length},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'&&!g.keep){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const run=s=>{for(let i=0;i<s*60;i++){quiet();now+=16.7;T.frame(now);}};
const errs=[];console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f1=v=>v.toFixed(1),f2=v=>v.toFixed(2),G0=44;
const hold=(ks,s)=>{for(const k of ks)T.keys.add(k);run(s);for(const k of ks)T.keys.delete(k);};
const tap=k=>hold([k],0.05);
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
const st=()=>P.drv?P.drv.k:'on foot';
const hudT=v=>v==null?'':String(v).replace(/⟦([^⟧]*)⟧/g,(m,t)=>'['+t+']');
T.DT.invuln=true;T.DT.host=1;T.TS.n=1;
// (a mech, and Gus beside it facing the same way, the camera behind it)
const V=()=>T.venues.get('tenvMechs');
const fresh=()=>{T.tenvClear();P.cam.yaw=Math.PI;P.cam.pitch=-0.1;run(0.1);T.tenvVeh('mech');run(0.3);const M=V()&&V().mechs[0];return M;};
const board=M=>{put(M.x-(T.MG.r+0.8),M.y+0.2,M.z);run(0.05);hold(['KeyF'],0.1);run(0.2);M.h=0;P.cam.yaw=Math.PI;P.cam.pitch=-0.1;run(0.3);};

// ---- the button, and who can get in
T.setGob(false);run(0.5);
let M=fresh();
console.log('button: venue',!!V(),' mechs',V()?V().mechs.length:0,' feet on the ground',M&&f2(M.y-T.groundAt(M.x,M.z,G0+20)),' hp',M&&M.hp,' energy',M&&M.en,' says',els.tpInfo&&els.tpInfo.textContent);
{const ab=T.ACTS.filter(a=>a.mg).map(a=>a.id+' '+(T.BINDS[a.id].kb[0]||'-')+'/'+(T.BINDS[a.id].pad[0]??'-')).join(', ');console.log('its own controls:',ab);}
put(M.x-(T.MG.r+0.8),M.y+0.2,M.z);run(0.1);hold(['KeyF'],0.1);run(0.2);console.log('as Gus (a hippo), F beside it:',st());
T.setGob(true);run(0.5);board(M);
console.log('as Gnash, F beside it:',st(),' this one',P.drv&&P.drv.o===M,' pilot hidden in its chest',f1(P.pos.y-M.y));
{const H=P.ui.drvHud;console.log('  display: shown',!!H&&!H.el.hidden,' gauge',!!H&&!!H.mg&&!H.mg.el.hidden,' crosshair',!!H&&!H.xh.hidden,' says',H&&hudT(H.txt.n),'|',H&&hudT(H.txt.w));}
{const c=P.camera.position;console.log('  camera: behind',f1(c.z-M.z>0?-(c.z-M.z):(M.z-c.z)),' up',f1(c.y-M.y),' over its right shoulder',f1(c.x-M.x));}

// ---- walking and skating (the ground is flat here)
{const z0=M.z,e0=M.en;hold(['KeyW'],3);console.log('walk: W 3 s went',f1(M.z-z0),' speed',f1(Math.hypot(M.vx,M.vz)),' energy',f1(e0),'->',f1(M.en),' grounded',M.grounded);}
hold([],1);
{tap('KeyC');const z0=M.z,e0=M.en;hold(['KeyW'],0.4);const a=Math.hypot(M.vx,M.vz);hold(['KeyW'],2.6);
 console.log('boost on (C): W 0.4 s speed',f1(a),', at 3 s',f1(Math.hypot(M.vx,M.vz)),' went',f1(M.z-z0),' energy',f1(e0),'->',f1(M.en),' (free on the ground)  hud',hudT(P.ui.drvHud.txt.w).includes('ON'),' fov +',f1(P.mgFov||0));
 hold([],0.25);console.log('  let go, 0.25 s on: still sliding at',f1(Math.hypot(M.vx,M.vz)));hold([],2);console.log('  2 s more:',f1(Math.hypot(M.vx,M.vz)));
 tap('KeyC');console.log('  C again: boost',M.boostOn);}
// ---- quick boosts
{run(1.5);const x0=M.x,z0=M.z,e0=M.en;T.keys.add('KeyD');run(0.05);tap('ShiftLeft');run(0.08);const mid=Math.hypot(M.vx,M.vz);run(0.29);T.keys.delete('KeyD');
 console.log('quick boost with D: burst speed',f1(mid),' sideways',f1(M.x-x0),' forward',f1(M.z-z0),' energy',f1(e0),'->',f1(M.en),' (the legs face',f1(M.h),')');
 const x1=M.x,z1=M.z;run(0.5);tap('ShiftLeft');run(0.4);console.log('  with nothing held: back',f1(z1-M.z),' sideways',f1(M.x-x1));
 // (as fast as it'll go: cooldown between, then out of energy)
 run(3);let n=0,t=0;const e1=M.en;while(M.red<=0&&t<8){tap('ShiftLeft');run(0.55);t+=0.6;n++;}
 console.log('  quick boosts back to back from',f1(e1),'energy:',n,'before it redlines;',f1(t),'s');
 const e2=M.en;tap('ShiftLeft');console.log('  redlined: another does nothing',M.qbT<=0,' boost',M.boostOn,' gauge says',P.ui.drvHud.mg.spd.textContent);
 let r=0;while(M.red>0&&r<5){run(0.1);r+=0.1;}console.log('  redline lasted',f1(r+0.4),'s, energy then',f1(M.en));run(2.5);console.log('  2.5 s later',f1(M.en));}
// ---- jumping and flying
{run(2);const y0=M.y,e0=M.en;let top=0;tap('Space');for(let k=0;k<120;k++){run(1/60);top=Math.max(top,M.y-y0);}
 console.log('jump (a tap): up',f1(top),' energy',f1(e0),'->',f1(M.en),' back down',M.grounded);
 run(2);const e1=M.en;T.keys.add('Space');run(2);const up2=M.y-y0,e2=M.en;let t=2;while(M.en>0&&t<8){run(0.1);t+=0.1;}T.keys.delete('Space');
 console.log('  held 2 s: up',f1(up2),' energy',f1(e1),'->',f1(e2),'; kept on, it ran dry after',f1(t),'s, at',f1(M.y-y0),' redlined',M.red>0);
 let fall=0;for(let k=0;k<600&&!M.grounded;k++){run(1/60);fall+=1/60;}console.log('  fell back down in',f1(fall),'s, crouched on landing',M.landT>0||fall>0);
 run(3);tap('KeyC');T.keys.add('Space');run(1.2);T.keys.delete('Space');const ya=M.y;run(1);const sinkB=ya-M.y;
 tap('KeyC');run(4);T.keys.add('Space');run(1.2);T.keys.delete('Space');const yb=M.y;run(1);const sinkN=yb-M.y;
 console.log('  flown up, then a second of falling: with boost on it sank',f1(sinkB),', off',f1(sinkN));run(3);}
// ---- steps and walls: a ledge one block high, one two high, one three high
{const X=Math.floor(M.x),Z=Math.floor(M.z),Y=Math.floor(M.y),wall=(z0,h)=>{for(let x=X-6;x<=X+6;x++)for(let z=z0;z<z0+40;z++)for(let y=Y;y<Y+h;y++)T.setRaw(x,y,z,3);};
 const tryUp=(h,boost,label)=>{T.tenvClear();M=null;T.tenvVeh('mech');run(0.3);M=V().mechs[0];const X=Math.floor(M.x),Z=Math.floor(M.z),Y=Math.floor(M.y);
   for(let x=X-6;x<=X+6;x++)for(let z=Z+6;z<Z+30;z++)for(let y=Y;y<Y+h;y++)T.setRaw(x,y,z,3);run(0.2);board(M);if(boost)tap('KeyC');const y0=M.y;let top=0;for(let k=0;k<180;k++){T.keys.add('KeyW');run(1/60);top=Math.max(top,M.y-y0);}T.keys.delete('KeyW');
   console.log('  '+label+': up',f1(top),' went',f1(M.z-Z));hold([],1);if(boost)tap('KeyC');hold(['KeyF'],0.8);};
 tryUp(1,false,'walking at a 1-block ledge');tryUp(2,false,'walking at a 2-block ledge');tryUp(2,true,'skating at a 2-block ledge');tryUp(3,true,'skating at a 3-block wall');}
// ---- smashing through: a wall one block thick and six high, and a hollow building, met walking, skating flat out and
// on a quick boost; the blocks broken and how much speed it kept
{const fk=(M)=>{   // (where each sole is, worked out from the joints just as the renderer would)
   const rx=(a,v)=>[v[0],v[1]*Math.cos(a)-v[2]*Math.sin(a),v[1]*Math.sin(a)+v[2]*Math.cos(a)],ry=(a,v)=>[v[0]*Math.cos(a)+v[2]*Math.sin(a),v[1],-v[0]*Math.sin(a)+v[2]*Math.cos(a)],rz=(a,v)=>[v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a),v[2]];
   const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],J=M.J,B=J.B.rotation;
   return J.legs.map(L=>{const H=L.hip.rotation,K=L.knee.rotation,A=L.ank.rotation;
     let v=rx(A.x,rz(A.z,[0,-0.1,0]));v=add(v,[0,-1.75,-0.1]);v=rx(K.x,v);v=add(v,[0,-1.9,0.1]);v=rz(H.z,rx(H.x,v));v=add(v,[L.s*0.8,0,0]);
     v=rz(B.z,rx(B.x,v));v=add(v,[0,J.B.position.y,0]);v=ry(M.h,v);return {x:M.x+v[0],y:M.y+v[1],z:M.z+v[2],flat:Math.abs(B.x+H.x+K.x+A.x)+Math.abs(B.z+H.z+A.z)};});};
 const sole=M=>fk(M).map(f=>f2(f.y-T.groundAt(f.x,f.z,M.y+1.5))).join(' '),flat=M=>f2(Math.max(...fk(M).map(f=>f.flat)));
 const wallAt=(M,d,hollow)=>{const X=Math.floor(M.x),Z=Math.floor(M.z)+d,Y=Math.floor(M.y);let n=0;
   for(let x=X-5;x<=X+5;x++)for(let y=Y;y<Y+6;y++){if(hollow){for(let z=Z;z<Z+7;z++)if(x===X-5||x===X+5||z===Z||z===Z+6||y===Y+5){T.setRaw(x,y,z,3);n++;}}else{T.setRaw(x,y,Z,3);n++;}}return {n,count:()=>{let c=0;for(let x=X-5;x<=X+5;x++)for(let y=Y;y<Y+6;y++)for(let z=Z;z<Z+(hollow?7:1);z++)if(T.get(x,y,z)===3)c++;return c;}};};
 const ram=(label,hollow,how)=>{T.tenvClear();M=null;T.tenvVeh('mech');run(0.3);M=V().mechs[0];board(M);const z0=M.z;if(how!=='walk'){tap('KeyC');T.keys.add('KeyW');run(2.5);}
   const w=wallAt(M,how==='qb'?12:28,hollow);run(0.05);let top=0,lo=1e9,t=0,z1=M.z;if(how==='walk')T.keys.add('KeyW');
   if(how==='qb'){T.keys.delete('KeyW');run(0.2);tap('ShiftLeft');T.keys.add('KeyW');}
   const zs=M.z;for(;t<2.5;t+=1/60){run(1/60);top=Math.max(top,Math.hypot(M.vx,M.vz));}T.keys.delete('KeyW');
   console.log('  '+label+': blocks broken',w.n-w.count(),'of',w.n,' went',f1(M.z-zs),'in 2.5 s',' speed after',f1(Math.hypot(M.vx,M.vz)));
   hold([],1);if(how!=='walk')tap('KeyC');hold(['KeyF'],0.8);};
 console.log('smashing through:');ram('walking into a wall',false,'walk');ram('skating flat out into a wall',false,'skate');ram('skating flat out into a building',true,'skate');ram('a quick boost into a wall from standing',false,'qb');
 // ---- the legs: soles on the ground (height above it, per foot) and flat (radians off level), in each pose
 console.log('the legs: soles above the ground (left right), worst tilt off flat');
 M=fresh();board(M);run(0.5);console.log('  standing:',sole(M),' tilt',flat(M));
 const step=(keys,label,boost)=>{if(boost)tap('KeyC');for(const k of keys)T.keys.add(k);run(1.2);let lo=[9,9],hi=[-9,-9],ft=0,along=0,n=0;let prev=fk(M);
   for(let i=0;i<90;i++){run(1/60);const f=fk(M),sp=Math.hypot(M.vx,M.vz)||1;
     f.forEach((q,j)=>{const gy=q.y-T.groundAt(q.x,q.z,M.y+1.5);lo[j]=Math.min(lo[j],gy);hi[j]=Math.max(hi[j],gy);ft=Math.max(ft,q.flat);
       const dx=q.x-prev[j].x,dz=q.z-prev[j].z,dy=q.y-prev[j].y;if(gy>0.15){along+=(dx*M.vx+dz*M.vz)/sp;n++;}});prev=f;}
   for(const k of keys)T.keys.delete(k);const sp=Math.hypot(M.vx,M.vz),lf=M.vx*Math.sin(M.h)+M.vz*Math.cos(M.h),ls=M.vx*Math.cos(M.h)-M.vz*Math.sin(M.h);
   const K=M.J.legs.map(L=>f2(L.knee.rotation.x)).join(' ');
   console.log('  '+label+': speed',f1(sp),' (ahead',f1(lf),'aside',f1(ls)+')  soles low',lo.map(f2).join(' '),'high',hi.map(f2).join(' '),' tilt',f2(ft),
     ' lifted feet moving the way it goes',n?f2(along/n*60):'-',' knees',K,' lean fwd',f2(M.pt),'side',f2(M.rl));
   hold([],1.2);if(boost)tap('KeyC');run(0.5);};
 step(['KeyW'],'walking forward');step(['KeyS'],'walking back');step(['KeyA'],'walking left');step(['KeyD'],'walking right');
 step(['KeyW'],'skating forward',true);step(['KeyA'],'skating left',true);step(['KeyD'],'skating right',true);
 // (skating across a pit three deep and four wide: the most a joint moves in a frame, and how far the feet reach down)
 {const X=Math.floor(M.x),Z=Math.floor(M.z),Y=Math.floor(M.y)-1;for(let x=X-6;x<=X+6;x++)for(let z=Z+30;z<Z+34;z++)for(let y=Y-2;y<=Y;y++)T.setRaw(x,y,z,0);run(0.2);
  tap('KeyC');let last=null,big=0,low=0,on=false;T.keys.add('KeyW');for(let i=0;i<150;i++){run(1/60);const a=M.J.legs.flatMap(L=>[L.hip.rotation.x,L.knee.rotation.x,L.ank.rotation.x]);
    const over=M.z>Z+28&&M.z<Z+36;if(over&&last)for(let q=0;q<a.length;q++)big=Math.max(big,Math.abs(a[q]-last[q]));if(over){on=true;low=Math.min(low,...M.fy);}last=a;}
  T.keys.delete('KeyW');console.log('  skating over a pit 3 deep: crossed',on,' most a leg joint moves in a frame',f2(big),' feet reached down',f2(-low),' still grounded',M.grounded);hold([],1.5);tap('KeyC');run(0.5);}
 // (a quick boost on the ground: in the skating stance, not walking)
 {run(1);let sw=0,ww=0;T.keys.add('KeyD');run(0.05);tap('ShiftLeft');for(let i=0;i<14;i++){run(1/60);sw=Math.max(sw,M.sW);ww=Math.max(ww,M.wW);}T.keys.delete('KeyD');
  console.log('  quick boost on the ground: skating stance',f2(sw),' walking',f2(ww));run(1.5);}
 // (taking off and landing: the biggest change in any leg joint from one frame to the next, against walking's)
 const jmax=()=>{let last=null,big=0;return ()=>{const a=M.J.legs.flatMap(L=>[L.hip.rotation.x,L.hip.rotation.z,L.knee.rotation.x,L.ank.rotation.x]);if(last)for(let i=0;i<a.length;i++)big=Math.max(big,Math.abs(a[i]-last[i]));last=a;return big;};};
 {let j=jmax();T.keys.add('KeyW');for(let i=0;i<90;i++){run(1/60);j();}T.keys.delete('KeyW');const w=j();hold([],1);
  j=jmax();tap('Space');for(let i=0;i<20;i++){run(1/60);j();}const up=j();T.keys.add('Space');for(let i=0;i<40;i++){run(1/60);j();}T.keys.delete('Space');const fly=j();
  j=jmax();for(let i=0;i<300&&!M.grounded;i++){run(1/60);j();}for(let i=0;i<30;i++){run(1/60);j();}const land=j();
  console.log('  most a leg joint moves in a frame: walking',f2(w),' taking off',f2(up),' flying up',f2(fly),' landing',f2(land),' soles after landing',sole(M));}
 // (the thrusters: which are lit, by direction, on a quick boost each way)
 {const lit=()=>{const L=M.J.flames.filter(F=>F.kind!=='lift'&&F.m.visible).map(F=>F.d[0]>0.5?'left side':F.d[0]<-0.5?'right side':F.d[2]>0.5?'front':'back');return [...new Set(L)].join('+')||'none';};
  for(const [k,label] of [['KeyW','ahead'],['KeyS','back'],['KeyA','left'],['KeyD','right']]){run(1);T.keys.add(k);run(0.05);tap('ShiftLeft');run(0.03);const l=lit(),pt=M.pt,rl=M.rl;T.keys.delete(k);console.log('  quick boost',label+': thrusters lit',l,' lean fwd',f2(pt),'side',f2(rl));}
  hold(['KeyF'],0.8);}}
// ---- into a goblin
{M=fresh();T.setGob(true);board(M);const g=T.goblins.find(g=>g.state==='wait');
 if(g){g.state='chase';g.keep=true;g.hp=6;g.pos.set(M.x,M.y,M.z+6);g.root.visible=true;const k0=T.goblins.filter(q=>q.state==='dying'||q.dead).length;tap('KeyC');hold(['KeyW'],1.5);
   console.log('skated into a goblin: its state',g.state,' hp',f1(g.hp));g.keep=false;tap('KeyC');hold([],1);}}
// ---- getting out, and hurt
{hold(['KeyF'],0.25);console.log('F held 0.25 s:',st());hold(['KeyF'],0.7);console.log('F held 0.7 s:',st(),' beside it',f1(Math.hypot(P.pos.x-M.x,P.pos.z-M.z)),' on the ground',f1(P.pos.y-M.y));
 const x0=M.x;run(2);console.log('  left alone 2 s: stays',f1(Math.abs(M.x-x0)),' standing',M.grounded);
 board(M);T.trainHit(M,50);run(0.05);console.log('hit for 50: hp',M.hp,' display',hudT(P.ui.drvHud.txt.n));
 T.trainHit(M,1000);run(0.3);console.log('hit for 1000: wrecked',M.dead,' pilot',st(),' thrown clear',f1(Math.hypot(P.pos.x-M.x,P.pos.z-M.z)));
 put(M.x-(T.MG.r+0.8),M.y+0.2,M.z);run(0.1);hold(['KeyF'],0.1);run(0.1);console.log('  F by the wreck:',st());}
// ---- Gnash and Grizzle: the same inputs, the same flight
{const script=()=>{const out=[];const rec=()=>out.push([M.x,M.y,M.z,M.en,M.h]);hold(['KeyW'],1);rec();tap('KeyC');hold(['KeyW','KeyD'],1.5);rec();T.keys.add('KeyA');tap('ShiftLeft');run(0.4);T.keys.delete('KeyA');rec();
   hold(['Space'],1.5);rec();hold(['KeyW'],1);rec();run(2);rec();return out;};
 const go=who=>{P.who=who;T.tenvClear();M=null;P.pos.set(0,G0+1,0);P.cam.yaw=Math.PI;run(0.5);T.tenvVeh('mech');run(0.3);M=V().mechs[0];M.x=0.5;M.z=10.5;M.y=T.groundAt(0.5,10.5,G0+20);board(M);M.h=0;const r=script();hold(['KeyF'],0.8);return r;};
 const a=go(0),b=go(1);let far=0;for(let k=0;k<a.length;k++)for(let j=0;j<5;j++)far=Math.max(far,Math.abs(a[k][j]-b[k][j]));
 console.log('Gnash and Grizzle, the same inputs: furthest apart',far.toFixed(3));P.who=0;}
// ---- Clear takes them away (but not one being driven)
{M=fresh();board(M);T.tenvVeh('mech');run(0.2);const n0=V().mechs.length;T.tenvClear();run(0.2);console.log('Clear with',n0,'out, one driven: left',V()?V().mechs.length:0);hold(['KeyF'],0.8);T.tenvClear();run(0.2);console.log('  Clear on foot: venue',!!V());}
// ---- rebinding: a mech control can share a key with one on foot
{const b0=T.BINDS.jump.kb.slice();T.setBind('mgQB','kb',0,'Space');console.log('rebind quick boost to Space: jump keeps',T.BINDS.jump.kb.join(','),' quick boost',T.BINDS.mgQB.kb.join(','));T.setBind('mgQB','kb',0,'ShiftLeft');}
console.log('errors',errs.length,errs.slice(0,3));process.exit(0);
`);
