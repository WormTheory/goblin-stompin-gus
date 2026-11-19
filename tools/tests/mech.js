// The Mobile Gear (Testing Environment): its button stands one ahead of Gus; a hippo can't get in, a goblin can; walking,
// boost skating, quick boosts, jumping and flying on its energy bar, the redline; steps, walls; trampling goblins; the
// display; smashing through walls and buildings at speed; the legs (soles on the ground and flat, stepping the way it
// goes, splayed skating, nothing snapping on takeoff or landing) and which thrusters fire; getting out (a hold); hurt and wrecked; Gnash and Grizzle flying it exactly the same. node mech.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,mechHint,boatVenue,angDiff,milHit,mechHit,IMP,tenvSpawnOne,setTenv(v){const w=TENV;TENV=v;return w;},tenvVehKinds,dbgItems,dbgMenuToggle,ddOpts,ddChoose,get DT(){return DT},get hintTxt(){return P1.ui.hint.hidden?"(hidden)":P1.ui.hint._s},mgLead,mgTarget,MGW,get DRV_WPN(){return DRV_WPN},get:(x,y,z)=>get(x,y,z),keys,mHeld,setRaw,solidAt,tenvVeh,MG,BINDS,ACTS,setBind,drvFind,mgFits,get nEdits(){return Object.keys(edits).length},');
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
 const e2=M.en;tap('ShiftLeft');console.log('  redlined: another does nothing',M.qbT<=0,' boost',M.boostOn,' energy bar red',P.ui.drvHud.mg.last.split('i')[0].endsWith('r'));
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
 M=fresh();board(M);run(2);console.log('  standing:',sole(M),' tilt',flat(M));
 // (turning on the spot: the camera swung half round; how far the legs got, how many steps, and how far a planted foot
 // slid along the ground meanwhile)
 {const h0=M.h;let steps=0,ps=M.tS,slide=0,prev=fk(M),t=0;P.cam.yaw+=Math.PI*0.6;
  for(;t<3;t+=1/60){run(1/60);const f=fk(M);if(M.tS!==ps&&M.tS>=0)steps++;ps=M.tS;
    f.forEach((q,j)=>{if(j!==M.tS&&q.y-T.groundAt(q.x,q.z,M.y+1.5)<0.06)slide=Math.max(slide,Math.hypot(q.x-prev[j].x,q.z-prev[j].z));});prev=f;}
  console.log('  turned on the spot 0.6 of a half turn: legs turned',f2(Math.abs(T.angDiff(h0,M.h))),' steps',steps,' most a planted foot slid in a frame',f2(slide),' soles after',sole(M));
  {const h1=M.h;P.cam.yaw-=0.5;run(1.5);console.log('  a small turn (0.5): legs moved',f2(Math.abs(T.angDiff(h1,M.h))),' (they stay planted till the body is 0.85 round)');}}
 // (setting off on foot: slow at first, then a jog)
 {const sp=()=>f1(Math.hypot(M.vx,M.vz));T.keys.add('KeyW');run(0.25);const a=sp();run(0.35);const b=sp();run(0.6);const c=sp();run(1);const d=sp();T.keys.delete('KeyW');
  const arm=f2(Math.abs(M.J.arms[0].sh.rotation.x-M.J.arms[1].sh.rotation.x));run(0.3);const stop=sp();
  console.log('  setting off: speed at 0.25 s',a,' 0.6 s',b,' 1.2 s',c,' 2.2 s',d,' (top',f1(T.MG.walk)+')  arms apart',arm,'  0.3 s after letting go',stop);run(1);}
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
 // (flying forward flat out: how far back the legs sweep from straight down, in degrees, against the way it's going)
 {const sweep=()=>{const v=Math.hypot(M.vx,M.vz)||1,ux=M.vx/v,uz=M.vz/v,hy=M.y+M.J.B.position.y;
    return fk(M).map(f=>{const back=-((f.x-M.x)*ux+(f.z-M.z)*uz);return (Math.atan2(back,hy-f.y)*180/Math.PI).toFixed(0);}).join(' ');};
  for(const bo of [false,true]){hold([],1);if(bo)tap('KeyC');T.keys.add('Space');run(0.6);T.keys.add('KeyW');run(3);const sp=Math.hypot(M.vx,M.vz),a=sweep();T.keys.delete('KeyW');run(0.8);const b=sweep();T.keys.delete('Space');
   for(let i=0;i<300&&!M.grounded;i++)run(1/60);run(1);if(bo)tap('KeyC');
   console.log('  flying forward'+(bo?' boosted':'')+' at',f1(sp),': legs swept back',a,'degrees; drifting slower',b);}}
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
// ---- weapons and lock-on (nobody runs from it here: Passive)
{T.DT.host=1;M=fresh();T.setGob(true);board(M);const mh=T.mHeld;
 const gob=(dx,dz,hp)=>{const g=T.goblins.find(g=>g.state==='wait'&&!g.civ&&!g.special);g.state='chase';g.keep=true;g.hp=g.hpMax=hp||6;const x=M.x+dx,z=M.z+dz;g.pos.set(x,T.groundAt(x,z,G0+20),z);g.root.visible=true;return g;};
 const clear=()=>{for(const g of T.goblins)if(g.keep){g.keep=false;}run(0.1);};
 const W=()=>M.wpn,off=g=>{const c=P.camera.position,cp=Math.cos(P.cam.pitch),f=[-Math.sin(P.cam.yaw)*cp,Math.sin(P.cam.pitch),-Math.cos(P.cam.yaw)*cp],d=[g.pos.x-c.x,g.pos.y+1.1-c.y,g.pos.z-c.z],L=Math.hypot(...d);return Math.acos((d[0]*f[0]+d[1]*f[1]+d[2]*f[2])/L);};
 console.log('weapons:',T.DRV_WPN.mech.map(w=>w.name+' '+w.max+'/'+w.reload+'s').join(', '));
 // (the lock box: one ahead, one well off to the side)
 {const a=gob(0,32),b=gob(26,22);run(0.3);console.log('lock box: ahead',f2(off(a)),'rad off the crosshair, locked',M.soft===a,' the one to the side',f2(off(b)),'in the box',M.inBox.includes(b),' marker shown',P.ui.drvHud.mgw.tk.some(e=>!e.hidden));
  // (the rifle, held: rounds fired, the goblin down)
  const n0=W().rifle.n;mh.add('Mouse2');run(0.6);mh.delete('Mouse2');run(0.3);console.log('  Rivet Rifle held 0.6 s: rounds',n0-W().rifle.n,' the goblin ahead',a.state,' arm raised',f2(M.raA));
  // (the rounds leave the muzzle at the end of the forearm, wherever it's pointing; the arm's turn never jumps
  {const R=M.J.arms.find(q=>q.s<0);let mx=0,pv=R.sh.rotation.y;mh.add('Mouse2');for(let k=0;k<60;k++){run(1/60);mx=Math.max(mx,Math.abs(R.sh.rotation.y-pv));pv=R.sh.rotation.y;}
   mh.delete('Mouse2');for(let k=0;k<90;k++){run(1/60);mx=Math.max(mx,Math.abs(R.sh.rotation.y-pv));pv=R.sh.rotation.y;}
   console.log('  muzzle on the forearm',!!M.mzR,' the arm turned at most',f2(mx),'a step');}
  // (hard lock on the one off to the side: the camera swings round on to it)
  const o0=off(b);mh.add('Mouse1');run(0.05);mh.delete('Mouse1');const hl=M.hard===b;run(1);console.log('hard lock (middle click) on the one',f2(o0),'off: locked',hl,' 1 s later',f2(off(b)),'off  hint',hudT(P.ui.drvHud.txt.w).includes('let go'));
  mh.add('Mouse1');run(0.05);mh.delete('Mouse1');console.log('  middle click again: let go',!M.hard);
  // (a target crossing at 8 a second: the lead puts the shot ahead of it by its speed times the time to get there)
  M.hard=b;let x0=b.pos.x;for(let k=0;k<60;k++){b.pos.x=x0-8*k/60;b.pos.z=M.z+22;run(1/60);}
  const m={x:M.x,y:M.y+4.6,z:M.z},A=T.mgLead(M,P,m.x,m.y,m.z,100),tt=Math.hypot(b.pos.x-m.x,b.pos.z-m.z)/100;
  console.log('  leading a goblin crossing at 8/s, 100/s shot: aims',f2(b.pos.x-A.x),'ahead of it (expected about',f2(8*tt)+')');M.hard=null;clear();}
 // (emptying the rifle, and its reload)
 {mh.add('Mouse2');let t=0;while(W().rifle.n>0&&t<8){run(0.1);t+=0.1;}mh.delete('Mouse2');let r=0;while(W().rifle.rl>0&&r<6){run(0.1);r+=0.1;}
  console.log('  40 rounds gone in',f1(t),'s; reloaded in',f1(r),'s, back to',W().rifle.n);}
 // (the blade: a goblin 18 ahead, locked: a lunge up to it and the sweep; then a wide wall ahead with nothing locked)
 {run(1);const g=gob(0,18,12);run(0.2);const z0=M.z;M.hard=g;mh.add('Mouse0');run(0.05);mh.delete('Mouse0');const ys=[],tw=[],bl=[];
  let cool=false,again=false;for(let k=0;k<60;k++){if(k===30)mh.add('Mouse0');if(k===31){mh.delete('Mouse0');cool=W().blade.rl>0;}const s0=M.sl;run(1/60);if(k===30&&M.sl!==s0)again=true;const A=M.J.arms.find(a=>a.s>0);ys.push(A.sh.rotation.y);bl.push(A.bl.visible?A.bl.scale.y:0);tw.push(M.J.T.rotation.y);}const blade=bl.some(v=>v>0.99);run(0.2);
  const lit=bl.findIndex(v=>v>0.99),out=bl.findIndex(v=>v>0),gone=bl.lastIndexOf(bl.find(v=>v>0)===undefined?0:bl.filter(v=>v>0).pop());
  const swingLine=['  the swing, frame by frame (60 a second): blade appears at',out,'full at',lit,' body turned',f2(Math.min(...tw)),'to',f2(Math.max(...tw)),' blade back in the hand by frame',bl.length-1-[...bl].reverse().findIndex(v=>v>0)+1];
  console.log('Heat Cleaver at a locked goblin 18 ahead: lunged',f1(M.z-z0),' goblin',g.state,' blade shown',blade,' cooling',cool,' arm swept from',f2(Math.min(...ys)),'to',f2(Math.max(...ys)),'(right to left:',ys.indexOf(Math.min(...ys))<ys.indexOf(Math.max(...ys)),')');console.log(...swingLine);
  console.log('  pressed again mid-swing: a new swing',again);M.hard=null;clear();run(1.5);
  // (goblins round it, either side and just behind: the sweep takes the ones in front and to the sides, not behind)
  {const ring=[[-10,2],[10,2],[0,10],[-7,-7],[7,-7]].map(([x,z])=>gob(x,z,6));run(0.1);mh.add('Mouse0');run(0.05);mh.delete('Mouse0');run(0.8);
   console.log('  goblins 10 to its right, left, ahead, and behind either side: cut down',ring.map(g=>g.state!=='chase'?'yes':'no').join(' '));clear();run(1.5);}
  const X=Math.floor(M.x),Z=Math.floor(M.z)+12,Y=Math.floor(M.y);for(let x=X-16;x<=X+16;x++)for(let y=Y;y<Y+8;y++)T.setRaw(x,y,Z,3);
  const cnt=(a,b)=>{let c=0;for(let x=X+a;x<=X+b;x++)for(let y=Y;y<Y+8;y++)if(T.get(x,y,Z)===3)c++;return c;};run(0.1);const c0=cnt(-16,16),l0=cnt(-16,-5),r0=cnt(5,16);const zz=M.z;
  mh.add('Mouse0');run(0.05);mh.delete('Mouse0');run(0.8);console.log('  slashing at a wall 12 ahead, nothing locked: lunged',f1(M.z-zz),' cut',c0-cnt(-16,16),'blocks,',l0-cnt(-16,-5),'of them more than 5 off to one side and',r0-cnt(5,16),'to the other');
  for(let x=X-16;x<=X+16;x++)for(let y=Y;y<Y+8;y++)T.setRaw(x,y,Z,0);run(0.5);
  // (aimed low: a goblin locked at the bottom of a pit 12 ahead, 6 down, out of a level swing's reach; then nothing
  // locked, looking down at the ground in front, the swing tilts down and cuts into it)
  {const X=Math.floor(M.x),Z=Math.floor(M.z),Y=Math.floor(M.y);for(let x=X-3;x<=X+3;x++)for(let z=Z+9;z<=Z+15;z++)for(let y=Y-6;y<Y;y++)T.setRaw(x,y,z,0);run(0.1);
   const g=gob(0,12,6);run(0.2);const gy=g.pos.y-M.y;M.hard=g;mh.add('Mouse0');run(0.05);mh.delete('Mouse0');const pt=M.sl&&M.sl.pt;let lean=0;for(let k=0;k<30;k++){run(1/60);lean=Math.max(lean,M.J.T.rotation.x);}run(0.4);
   console.log('  a goblin locked in a pit',f1(-gy),'down: swing tilted',f2(pt),' bent at the hips',f2(lean),' goblin',g.state);M.hard=null;clear();
   for(let x=X-3;x<=X+3;x++)for(let z=Z+9;z<=Z+15;z++)for(let y=Y-6;y<Y;y++)T.setRaw(x,y,z,3);run(1.5);
   const y0=P.cam.pitch;P.cam.pitch=-0.75;run(0.3);const X2=Math.floor(M.x),Z2=Math.floor(M.z),Y2=Math.floor(M.y);const was=[];for(let x=X2-16;x<=X2+16;x++)for(let z=Z2-4;z<=Z2+20;z++)for(let y=Y2-4;y<Y2;y++)was.push([x,y,z,T.get(x,y,z)]);const dug=()=>was.filter(([x,y,z,b])=>b&&!T.get(x,y,z)).length;const d0=dug();
   mh.add('Mouse0');run(0.05);mh.delete('Mouse0');const pt2=M.sl&&M.sl.pt;run(0.8);console.log('  nothing locked, looking down: swing tilted',f2(pt2),' ground cut',dug()-d0,'blocks');
   for(const [x,y,z,b] of was)T.setRaw(x,y,z,b);M.y=Math.max(M.y,T.groundAt(M.x,M.z,M.y+10));P.cam.pitch=y0;run(1);}}
 // (the lunge rides on top of the movement: walking, then boosting, swing with nothing locked and it keeps going)
 {run(1);P.cam.yaw=Math.PI;P.cam.pitch=-0.12;const sp=()=>Math.hypot(M.vx,M.vz),out=[];
  for(const boost of [false,true]){if(boost!==M.boostOn)tap('KeyC');T.keys.add('KeyW');run(2.5);const v0=sp(),x0=M.x,z0=M.z;mh.add('Mouse0');run(0.05);mh.delete('Mouse0');let lo=99,hi=0;for(let k=0;k<45;k++){run(1/60);lo=Math.min(lo,sp());hi=Math.max(hi,sp());}
   out.push((boost?'boosting':'walking')+' at '+f1(v0)+': its own speed during the swing '+f1(lo)+' to '+f1(hi)+', after '+f1(sp())+'; covered '+f1(Math.hypot(M.x-x0,M.z-z0))+' in 0.8 s ('+f1(v0*0.8)+' of it its own)');T.keys.delete('KeyW');run(1.5);}
  if(M.boostOn)tap('KeyC');run(1);console.log('Heat Cleaver on the move,',out.join(';  '));}
 // (bullets into a wall: about half the rounds that strike it break the block they hit)
 {run(3);P.cam.yaw=Math.PI;P.cam.pitch=-0.05;run(0.3);const X=Math.floor(M.x),Z=Math.floor(M.z)+20,Y=Math.floor(M.y);for(let x=X-5;x<=X+5;x++)for(let y=Y;y<Y+12;y++)for(let z=Z;z<Z+6;z++)T.setRaw(x,y,z,3);run(0.2);
  const cnt=()=>{let c=0;for(let x=X-5;x<=X+5;x++)for(let y=Y;y<Y+12;y++)for(let z=Z;z<Z+6;z++)if(T.get(x,y,z)===3)c++;return c;},c0=cnt(),n0=W().rifle.n;
  mh.add('Mouse2');run(2);mh.delete('Mouse2');run(0.2);const fired=n0-W().rifle.n;console.log('Rivet Rifle into a wall: rounds',fired,' blocks broken',c0-cnt(),'(about half)');
  for(let x=X-5;x<=X+5;x++)for(let y=Y;y<Y+12;y++)for(let z=Z;z<Z+6;z++)T.setRaw(x,y,z,0);run(3);}
 // (the debug menu's Infinite ammo: nothing used up, nothing reloads; the blade still cools)
 {T.DT.infAmmo=true;const n0=W().rifle.n;mh.add('Mouse2');run(5);mh.delete('Mouse2');tap('KeyE');run(1.5);const cn=W().cannon.n;
  mh.add('Mouse0');run(0.05);mh.delete('Mouse0');run(0.1);console.log('Infinite ammo: rifle held 5 s, rounds',n0,'->',W().rifle.n,' reloading',W().rifle.rl>0,' cannon after a shot',cn,' blade cooling still',W().blade.rl>0);T.DT.infAmmo=false;run(1.5);}
 // (the pod: four goblins in the box, Q held a second locks them, let go fires four missiles)
 {P.cam.yaw=Math.PI;run(0.5);const gs=[gob(-6,40,3),gob(-2,44,3),gob(2,44,3),gob(6,40,3)];run(0.3);const n0=W().pod.n;T.keys.add('KeyQ');run(0.35);const l1=M.pod.locks.length;run(0.7);const L=M.pod.locks.length,pips=P.ui.drvHud.mgw.tk.filter(e=>!e.hidden&&e.className==='pip').length;T.keys.delete('KeyQ');
  run(0.05);const up=T.SHOTS.filter(S=>S.live&&S.kind==='missile').length;run(0.4);const fl=T.SHOTS.filter(S=>S.live&&S.kind==='missile').length;let t=0;while(T.SHOTS.some(S=>S.live&&S.kind==='missile')&&t<6){run(0.1);t+=0.1;}
  console.log('Swarm Pod: Q held 0.35 s',l1,'locks, 1 s',L,'(pips',pips+')  let go: missiles out',fl,' all landed in',f1(t+0.45),'s  goblins down',gs.filter(g=>g.state!=='chase').length,'of 4  left in the pod',W().pod.n,'of',n0);
  clear();T.keys.add('KeyQ');run(0.1);T.keys.delete('KeyQ');run(0.3);console.log('  tapped with nothing in the box: one missile at the crosshair, pod',W().pod.n);run(7);}
 // (the cannon: on the ground it braces, then fires; a wall 40 ahead takes a crater)
 {P.cam.yaw=Math.PI;run(0.5);const X=Math.floor(M.x),Z=Math.floor(M.z)+40,Y=Math.floor(M.y);for(let x=X-6;x<=X+6;x++)for(let y=Y;y<Y+12;y++)for(let z=Z;z<Z+3;z++)T.setRaw(x,y,z,3);run(0.2);P.cam.pitch=0.02;
  const cnt=()=>{let c=0;for(let x=X-6;x<=X+6;x++)for(let y=Y;y<Y+12;y++)for(let z=Z;z<Z+3;z++)if(T.get(x,y,z)===3)c++;return c;},c0=cnt();
  T.keys.add('KeyW');run(1);const v0=Math.hypot(M.vx,M.vz);tap('KeyE');let t=0.05,sh=null;while(!sh&&t<1.5){run(1/60);t+=1/60;sh=T.SHOTS.find(S=>S.live&&S.kind==='shell');}const vb=Math.hypot(M.vx,M.vz);T.keys.delete('KeyW');
  run(1.5);console.log('Breaker Cannon on the ground, walking at',f1(v0)+': fired after',f2(t),'s braced, speed then',f1(vb),' blocks blown out of a wall 40 ahead',c0-cnt(),' shells left',W().cannon.n);
  hold(['Space'],0.6);const vx0=M.vx,vz0=M.vz;tap('KeyE');run(0.02);console.log('  fired in the air: at once',T.SHOTS.some(S=>S.live&&S.kind==='shell'),' knocked back',f1(Math.hypot(M.vx-vx0,M.vz-vz0)),'(it pushes away from the shot:',M.vz<vz0,')');
  for(let x=X-6;x<=X+6;x++)for(let y=Y;y<Y+12;y++)for(let z=Z;z<Z+3;z++)T.setRaw(x,y,z,0);for(let i=0;i<300&&!M.grounded;i++)run(1/60);run(1);
  tap('KeyE');run(0.6);tap('KeyE');run(1);console.log('  two more, then empty: shells',W().cannon.n,' reloading',W().cannon.rl>0);P.cam.pitch=-0.1;}
 hold(['KeyF'],0.8);console.log('  out of it: no locks',!M.soft&&!M.hard,' reloads go on: cannon',f1(W().cannon.rl));T.DT.host=1;}
// ---- heavy hitting: the assault boost, the kick, impact and stagger, repair kits
{T.DT.host=1;M=fresh();T.setGob(true);board(M);const sp=()=>Math.hypot(M.vx,M.vz),e0=M.en;
 // (charge, then the dash where it's aimed; pressed again with nothing near, it stops and keeps a little speed)
 tap('KeyX');run(0.3);const c1=sp(),ch=!!(M.ab&&M.ab.ph==='charge');run(0.5);const v1=sp(),go=!!(M.ab&&M.ab.ph==='go'),z0=M.z;run(1);const d1=M.z-z0,e1=M.en;
 tap('KeyX');run(0.05);const v2=sp();run(0.5);
 console.log('assault boost: charging',ch,'at',f1(c1),' then going',go,'at',f1(v1),' covered',f1(d1),'in 1 s, energy',f1(e0),'to',f1(e1),' pressed again: over',!M.ab,' speed',f1(v2),'then',f1(sp()),' boost left on',M.boostOn);
 // (aimed up, it climbs; pulled back, it stops)
 run(2);M.en=T.MG.enMax;P.cam.pitch=0.45;tap('KeyX');run(0.7);const y0=M.y;run(0.6);const up=M.y-y0;hold(['KeyS'],0.1);const stop=!M.ab;P.cam.pitch=-0.1;run(3);
 console.log('  aimed up: climbed',f1(up),'in 0.6 s;  pulled back: over',stop);
 // (through a wall: one block thick, eight high, thirty ahead)
 run(1);M.en=T.MG.enMax;const X=Math.floor(M.x),Z=Math.floor(M.z)+30,Y=Math.floor(M.y);for(let x=X-6;x<=X+6;x++)for(let y=Y;y<Y+8;y++)T.setRaw(x,y,Z,3);
 const cnt=()=>{let c=0;for(let x=X-6;x<=X+6;x++)for(let y=Y;y<Y+8;y++)if(T.get(x,y,Z)===3)c++;return c;};const c0=cnt();
 tap('KeyX');run(1.6);console.log('  into a wall 30 ahead: through it',M.z>Z+1,' blocks broken',c0-cnt(),' still going',!!M.ab,'at',f1(sp()));if(M.ab)tap('KeyX');run(1.5);
 for(let x=X-6;x<=X+6;x++)for(let y=Y;y<Y+8;y++)T.setRaw(x,y,Z,0);run(0.3);hold(['KeyF'],0.8);
 // (the kick: a parked tank 40 ahead, hard-locked; boost at it, then press again once it's close)
 M=fresh();board(M);M.en=T.MG.enMax;T.TS.vm='park';T.tenvVeh('tank');T.TS.vm='hunt';run(0.2);const A=T.venues.get('tenvArmy'),tk=A.mil[A.mil.length-1];
 tk.x=M.x;tk.z=M.z+40;tk.y=T.groundAt(tk.x,tk.z,G0+20);run(0.2);M.hard=tk;const hp0=tk.hp;
 tap('KeyX');let t=0;while(t<3&&Math.hypot(tk.x-M.x,tk.z-M.z)>14){run(0.05);t+=0.05;}tap('KeyX');const kicking=!!M.kick;run(0.6);
 console.log('  kick at a tank: kicking',kicking,' landed',hp0-tk.hp>0,' damage',f1(hp0-tk.hp),' its impact meter',f1(tk.imp||0),'of',T.IMP.tank,' staggered',tk.stag>0,' bounced back to',f1(Math.hypot(tk.x-M.x,tk.z-M.z)));
 // (filling a tank's meter staggers it for 2 s; staggered, it takes half again as much; then it recovers)
 tk.imp=0;tk.stag=0;tk.hp=5000;run(2);T.milHit(tk,60);const s1=tk.stag>0;T.milHit(tk,70);const s2=tk.stag>0,h1=tk.hp;T.milHit(tk,10);const extra=h1-tk.hp;run(2.2);
 console.log('impact: a tank hit for 60',s1?'staggered':'not staggered',' then 70 more',s2?'staggered':'not staggered',' hit for 10 while staggered: takes',f1(extra),' 2.2 s later still staggered',tk.stag>0);
 tk.imp=0;T.milHit(tk,50);const im=tk.imp;run(1);const im1=tk.imp;run(2);console.log('  meter after a hit',f1(im),' 1 s later',f1(im1),' 3 s later',f1(tk.imp),'(drains once it stops being hit)');
 // (the Mobile Gear itself: full, it's staggered and can't move or fire)
 M.hard=null;run(1);M.imp=0;T.trainHit(M,T.MG.impMax+5);const ms=M.stag>0;run(0.05);const sgShown=P.ui.drvHud.mg.sg.hidden===false;hold(['KeyW'],0.5);const mv=sp(),n0=M.wpn.rifle.n;T.mHeld.add('Mouse2');run(0.3);T.mHeld.delete('Mouse2');const fired=n0-M.wpn.rifle.n;run(2);
 hold(['KeyW'],0.5);console.log('  the Mobile Gear hit for',T.MG.impMax+5,': staggered',ms,' (STAGGERED shown',sgShown+')',' pushing forward:',f1(mv),' rounds fired',fired,' 2.5 s later moving again',f1(sp()));run(1);
 // (repair: three kits, each puts back 35% over a second; not at full health)
 M.hp=T.MG.hp;const k0=M.kits;tap('KeyR');run(0.2);const atFull=M.kits===k0,hintKits=T.mechHint(P).includes('repair (3 left)');M.hp=200;tap('KeyR');run(1.2);const hp1=M.hp;for(let k=0;k<3;k++){M.hp=100;tap('KeyR');run(1.2);}
 console.log('repair kits:',k0,' (the controls say',hintKits?'3 left)':'?)',' at full health a press does nothing',atFull,' from 200:',f1(hp1),' after using them all',M.kits,'left, hp',f1(M.hp),'(the last press did nothing)');
 hold(['KeyF'],0.8);T.tenvClear();run(0.3);}
// ---- other vehicles are solid to it and can be stood on: a boat (made after it each frame), walked into, then landed on
// and carried along as it moves
{M=fresh();T.setGob(true);board(M);const del=T.venues.delete.bind(T.venues);T.venues.delete=k=>String(k).startsWith('mgtest')?false:del(k);
 const BX=M.x+0.5,BZ=M.z+22;T.boatVenue('mgtest','launch',{x:BX,z:BZ,yaw:Math.PI/2,lane:null},new Set());const BV=T.venues.get('mgtest'),bg=BV.boat;run(0.5);
 const top=Math.max(...T.TRAIN_BOXES.filter(B=>B.proxy.isBoat&&Math.hypot(B.x-BX,B.z-BZ)<12).map(B=>B.top));
 let least=1e9;T.keys.add('KeyW');for(let i=0;i<240;i++){run(1/60);least=Math.min(least,Math.abs(M.z-BZ));}T.keys.delete('KeyW');run(0.3);
 console.log('walked at a boat 22 ahead: stopped',f1(least),'from its middle (it is',f1(BV.bo.K.W/2+T.MG.r),'to touching)  inside it',least<BV.bo.K.W/2+T.MG.r-0.3);
 M.x=BX;M.z=BZ;M.y=top+6;M.vy=0;M.grounded=false;run(1.5);const on=M.y;
 const x0=M.x;for(let i=0;i<60;i++){BV.x+=5/60;bg.position.x+=5/60;run(1/60);}run(0.2);
 console.log('  dropped on its deck (top',f1(top)+'): stands at',f1(on),' the boat moved 5: carried',f1(M.x-x0));
 hold(['KeyF'],0.8);T.venues.delete=del;del('mgtest');T.tenvClear();run(0.3);}
// ---- the on-foot controls line is hidden while piloting; the debug menu spawns vehicles
{M=fresh();T.setGob(true);run(0.1);run(0.1);
 const kinds=T.tenvVehKinds();console.log('debug menu vehicles:',T.ddOpts('vehSel').length,'kinds, rows',T.dbgItems().filter(it=>it.sec==='Vehicles').map(it=>it.label).join(', '),' Infinite ammo row',T.dbgItems().some(it=>it.k==='infAmmo'));
 for(const t of ['car','tank','mech']){T.ddChoose('vehSel',kinds.indexOf(t));const msg=T.tenvSpawnOne(t);run(0.1);console.log('  spawn',t+':',msg);}
 T.tenvClear();run(0.2);
 // (and out of the Testing Environment, in the ordinary game: on a raised patch of ground, each where it was put, on top)
 {const was=T.setTenv(null),X=Math.floor(P.pos.x),Z=Math.floor(P.pos.z),Y=Math.floor(P.pos.y);const ups=[];for(let x=X-64;x<=X+64;x++)for(let z=Z-64;z<=Z+64;z++)for(let y=Y;y<Y+3;y++)if(Math.abs(x-X)>3||Math.abs(z-Z)>3){ups.push([x,y,z]);T.setRaw(x,y,z,3);}
  const ok=[];for(const t of ['car','tank','mech','plane']){const msg=T.tenvSpawnOne(t);run(0.3);ok.push(t+': '+msg.split(' ').slice(0,3).join(' '));}
  const mm=T.venues.get('tenvMechs'),mh=mm&&mm.mechs[0],ar=T.venues.get('tenvArmy'),tk=ar&&ar.mil[0],pl=T.venues.get('tenvPlanes'),pg=pl&&pl.pl[0];
  console.log('debug menu in the ordinary game:',ok.join(';  '));
  console.log('  on the raised ground (top',Y+3,'): mech at',mh?f1(mh.y):'none',' tank at',tk?f1(tk.y):'none',' plane at',pg?f1(pg.g.position.y):'none');
  run(2);console.log('  2 s later, still there: mech',!!(T.venues.get('tenvMechs')||{mechs:[]}).mechs.length,' tank',!!(T.venues.get('tenvArmy')||{mil:[]}).mil.length,' plane',!!(T.venues.get('tenvPlanes')||{pl:[]}).pl.length);
  T.tenvClear();for(const [x,y,z] of ups)T.setRaw(x,y,z,0);T.setTenv(was);run(0.2);}}
// ---- Gnash and Grizzle: the same inputs, the same flight
{const script=()=>{const out=[];const rec=()=>out.push([M.x,M.y,M.z,M.en,M.h]);hold(['KeyW'],1);rec();tap('KeyC');hold(['KeyW','KeyD'],1.5);rec();T.keys.add('KeyA');tap('ShiftLeft');run(0.4);T.keys.delete('KeyA');rec();
   hold(['Space'],1.5);rec();hold(['KeyW'],1);rec();run(2);rec();
   T.mHeld.add('Mouse2');run(0.5);T.mHeld.delete('Mouse2');T.keys.add('KeyQ');run(0.4);T.keys.delete('KeyQ');tap('KeyE');run(0.6);T.mHeld.add('Mouse0');run(0.05);T.mHeld.delete('Mouse0');run(1);
   out.push([M.x,M.y,M.z,M.wpn.rifle.n,M.wpn.pod.n,M.wpn.cannon.n,M.wpn.blade.rl]);
   M.en=T.MG.enMax;tap('KeyX');run(1.2);rec();tap('KeyX');run(0.6);rec();M.hp-=150;tap('KeyR');run(1.2);out.push([M.x,M.y,M.z,M.hp,M.kits]);T.trainHit(M,T.MG.impMax+5);hold(['KeyW'],2.5);rec();return out;};
 const go=who=>{P.who=who;T.tenvClear();M=null;P.pos.set(0,G0+1,0);P.cam.yaw=Math.PI;run(0.5);T.tenvVeh('mech');run(0.3);M=V().mechs[0];M.x=0.5;M.z=10.5;M.y=T.groundAt(0.5,10.5,G0+20);board(M);M.h=0;const r=script();hold(['KeyF'],0.8);return r;};
 const a=go(0),b=go(1);let far=0;for(let k=0;k<a.length;k++)for(let j=0;j<a[k].length;j++)far=Math.max(far,Math.abs(a[k][j]-b[k][j]));
 console.log('Gnash and Grizzle, the same inputs: furthest apart',far.toFixed(3));P.who=0;}
// ---- Clear takes them away (but not one being driven)
{M=fresh();board(M);T.tenvVeh('mech');run(0.2);const n0=V().mechs.length;T.tenvClear();run(0.2);console.log('Clear with',n0,'out, one driven: left',V()?V().mechs.length:0);hold(['KeyF'],0.8);T.tenvClear();run(0.2);console.log('  Clear on foot: venue',!!V());}
// ---- rebinding: a mech control can share a key with one on foot
{const b0=T.BINDS.jump.kb.slice();T.setBind('mgQB','kb',0,'Space');console.log('rebind quick boost to Space: jump keeps',T.BINDS.jump.kb.join(','),' quick boost',T.BINDS.mgQB.kb.join(','));T.setBind('mgQB','kb',0,'ShiftLeft');}
console.log('errors',errs.length,errs.slice(0,3));process.exit(0);
`);
