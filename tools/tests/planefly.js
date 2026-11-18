// Flying each plane (the airliner, the two-seater and the fighter jet) with the flight model of vehicles/plane-flight.js,
// in the Testing Environment as Gnash: in Direct mode a whole roll (D held: how long, height lost, level again on letting
// go), a loop (S held at full throttle: over the top upside down and back to level, the slowest it got, stalls, the
// airliner's wings creaking), then in Mouse-aim (the camera looking where to go) a turn to a heading and a climb, a
// landing on the flat (the camera on a spot ahead and below, throttle shut, brakes) and, for the airliner and two-seater,
// a belly landing with the gear up; the jet's barrel roll and afterburner, the two-seater's smoke, the airliner's
// autopilot holding height and heading. node planefly.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,keys,mHeld,tenvSpawnOne,drvFind,planeMax,planeStalled,PLANE_KIND,get G(){return G},groundAt,parts,');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const step=()=>{quiet();now+=16.7;T.frame(now);};
const run=s=>{for(let i=0;i<s*60;i++)step();};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f1=v=>v.toFixed(1),f2=v=>v.toFixed(2);
const K=k=>k.startsWith('Mouse')?T.mHeld:T.keys;
const down=ks=>{for(const k of ks)K(k).add(k);},up=ks=>{for(const k of ks)K(k).delete(k);};
const hold=(ks,s)=>{down(ks);run(s);up(ks);};
const tap=k=>{hold([k],0.05);run(0.05);};
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
const beside=(x,y,z,h,hx)=>put(x-Math.cos(h)*(hx+0.7),y,z+Math.sin(h)*(hx+0.7));
const hudT=v=>v==null?'':String(v).replace(/⟦([^⟧]*)⟧/g,(m,t)=>'['+t+']');
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
T.DT.invuln=false;T.setGob(true);run(0.5);
const home={x:P.pos.x,y:P.pos.y,z:P.pos.z};let spot=0;
// (a plane spawned ahead, got into; the two-seater is the airliner's model flown with the two-seater's numbers, since the
// Testing Environment has none of its own)
function getIn(kind){if(P.drv){tap('KeyF');run(0.3);}put(home.x+(spot++)*300,home.y,home.z);P.cam.yaw=Math.PI;P.cam.pitch=0;run(0.3);
  T.tenvSpawnOne(kind==='jet'?'jet':'plane');run(0.3);const V=T.venues.get('tenvPlanes'),pl=V&&V.pl[V.pl.length-1];if(!pl){console.log(kind,'not spawned');return null;}
  if(kind==='light'){pl.light=true;pl.hp=T.planeMax(pl);}
  const g=pl.g;beside(g.position.x,g.position.y+0.3,g.position.z,g.rotation.y,1.25);run(0.05);tap('KeyF');
  if(!P.drv||P.drv.o!==pl){console.log(kind,'could not get in');return null;}return pl;}
// (put flying, heading +z, at a height and speed, climbing at gm; the sky stops 236 above sea level, so it's all done below)
function aloft(pl,y,v,thr,gm=0){const g=pl.g,F=pl.free;g.position.set(g.position.x,T.G+y,g.position.z);g.rotation.set(-gm,0,0);Object.assign(F,{v,gm,pt:gm,rl:0,vy:v*Math.sin(gm),thr,air:true});F.w={p:0,q:0,r:0};run(1/60);}
const H=pl=>pl.g.position.y-T.groundAt(pl.g.position.x,pl.g.position.z,pl.g.position.y+1);
const name={air:'airliner',light:'two-seater',jet:'fighter jet'};
const CR={air:{v:72,stall:20},light:{v:34,stall:11},jet:{v:120,stall:20}};
for(const kind of (process.env.KINDS||'air,light,jet').split(',')){
  const pl=getIn(kind==='air'?'plane':kind);if(!pl)continue;const F=pl.free,g=pl.g,C=CR[kind];P.planeCtl='direct';
  console.log('== '+name[kind]+' ('+(kind==='jet'?'jet':kind==='light'?'two-seater':'airliner')+' roll rate',T.PLANE_KIND[kind].roll,'rad/s)');
  // ---- a whole roll to the right
  // (the airliner from a climb, as a real one's rolled: it hasn't the wing to hold itself up on its side for long)
  aloft(pl,kind==='air'?160:150,C.v,0.8,kind==='air'?0.4:0);run(kind==='air'?0.05:0.5);{let a=0,last=F.rl,t=0;const y0=g.position.y;down(['KeyD']);while(t<8&&Math.abs(a)<Math.PI*2){step();t+=1/60;a+=wrap(F.rl-last);last=F.rl;}up(['KeyD']);
    const y1=g.position.y;run(3);console.log('  D held: a whole roll',Math.abs(a)>=Math.PI*2-0.05,'in',f1(t),'s  height lost',f1(y0-y1),' let go 3 s: bank',f2(F.rl),' climb rate',f1(F.vy),' wrecked',pl.dead);}
  // ---- a loop: S held (the airliner's and the jet's engines at full throttle would drive them up past the sky's limit, so
  // their throttles are eased off)
  aloft(pl,kind==='air'?25:kind==='light'?60:30,kind==='air'?62:kind==='light'?44:80,kind==='light'?1:kind==='air'?0.6:0.35);run(0.3);{let a=0,t=0,vmin=1e9,ymax=-1e9,ymin=1e9,st=0,inv=false,h0=g.rotation.y,crk=0;down(['KeyS']);
    while(t<30&&a<Math.PI*2-0.1&&!pl.dead){step();t+=1/60;a+=F.w.q/60;vmin=Math.min(vmin,F.v);ymax=Math.max(ymax,g.position.y);ymin=Math.min(ymin,g.position.y);if(T.planeStalled(F,pl))st++;if(F.u[1]<-0.9)inv=true;if((F.stress||0)>0)crk++;}
    up(['KeyS']);const hd=wrap(g.rotation.y-h0);run(3);
    console.log('  a loop (S held):',a>=Math.PI*2-0.15?'round in '+f1(t)+' s':'only '+f1(a*57.3)+' degrees in '+f1(t)+' s','  upside down at the top',inv,' slowest',f1(vmin),' (stalls at',C.stall+')  stalled frames',st,' height',f1(ymin-T.G),'to',f1(ymax-T.G),' heading after',f2(hd),(kind==='air'?' wings creaking frames '+crk+' hp '+f1(pl.hp)+'/'+T.planeMax(pl):''),' wrecked',pl.dead);
    console.log('    3 s after: bank',f2(F.rl),' nose',f2(F.pt),' speed',f1(F.v),' climb rate',f1(F.vy));}
  if(pl.dead)continue;
  // ---- Mouse-aim: a turn to the left of 90 degrees, then a climb
  P.planeCtl='aim';aloft(pl,150,C.v,0.7);run(0.5);{const h0=g.rotation.y;P.cam.yaw=h0+Math.PI+Math.PI/2;P.cam.pitch=0;let t=0,bmax=0;   // (the camera's yaw looks the opposite way to a heading)
    while(t<20&&Math.abs(wrap(g.rotation.y-(h0+Math.PI/2)))>0.05){step();t+=1/60;bmax=Math.max(bmax,Math.abs(F.rl));}
    run(3);console.log('  Mouse-aim, camera 90 degrees left: on the new heading after',f1(t),'s (steepest bank',f2(bmax)+')  3 s on: off by',f2(wrap(g.rotation.y-(h0+Math.PI/2))),' bank',f2(F.rl),' climb rate',f1(F.vy));
    const y0=g.position.y;P.cam.pitch=0.4;run(5);const ang=F.gm;P.cam.pitch=0;run(4);console.log('    camera up 0.4: climbs',f1(g.position.y-y0),' flight path',f2(ang),'(nose',f2(F.pt)+') camera level again 4 s: climb rate',f1(F.vy),' stalled',T.planeStalled(F,pl));
    // (free look: X held, the camera turned right round; the plane carries on; let go and it's back)
    const hA=g.rotation.y,cy=P.cam.yaw;down(['KeyX']);run(0.1);P.cam.yaw+=2.5;run(2);const hB=g.rotation.y;up(['KeyX']);run(0.1);
    console.log('    free look (X held, camera swung 2.5 away for 2 s): heading moved',f2(wrap(hB-hA)),' let go: camera back',Math.abs(wrap(P.cam.yaw-cy))<0.01);}
  // ---- a landing: lined up 600 out, 30 up, the camera on a spot on the ground a little past the threshold
  {const v0=kind==='air'?40:kind==='light'?20:45;aloft(pl,30,v0,0.3);const x0=g.position.x,z0=g.position.z,gz=z0+600;let t=0,ph='app',minv=0,flare=0,hmax=0;
    while(t<90&&!pl.dead){const P0=g.position,h=H(pl),dz=gz-P0.z;
      if(ph==='app'){const tgt={x:x0,y:T.G+1,z:Math.max(gz,P0.z+60)};   // (once past the spot, a spot always a little ahead)
        const dx=tgt.x-P0.x,dy=tgt.y-(P0.y+1),dd=Math.max(5,Math.hypot(dx,tgt.z-P0.z));
        // (aim at the spot, but never steeper than about four degrees; within a few blocks of the ground, flare: look level)
        let pit=Math.max(-0.07,Math.atan2(dy,dd));if(h<4){pit=-0.03;flare++;}P.cam.yaw=Math.atan2(-dx,-(tgt.z-P0.z));P.cam.pitch=pit;
        // (the throttle: hold the approach speed)
        up(['KeyW','KeyS']);if(F.v>v0+2)down(['KeyS']);else if(F.v<v0-2)down(['KeyW']);
        if(!F.air&&t>1){ph='roll';up(['KeyW','KeyS']);down(['KeyS','Space']);minv=F.vy;}}
      step();t+=1/60;hmax=Math.max(hmax,h);if(process.env.DBG&&Math.round(t*60)%20==0)console.log('   L',f1(t),ph,'h',f1(h),'v',f1(F.v),'vy',f1(F.vy),'pt',f2(F.pt),'rl',f2(F.rl),'aoa',f2(F.aoa),'thr',f2(F.thr),'dz',f1(gz-g.position.z),'air',F.air);if(ph==='roll'&&F.v<0.5)break;}
    up(['KeyW','KeyS','Space']);
    if(process.env.DBG)console.log('dbg');console.log('  Mouse-aim landing from 30 up at',v0,'(slowest it stays up at about',C.stall+')',': on the ground',!F.air,' wrecked',pl.dead,' stopped',F.v<0.5,'after',f1(t),'s  flared for',flare,'frames  hp',f1(pl.hp)+'/'+T.planeMax(pl));}
  if(pl.dead)continue;
  // ---- each kind's own
  P.planeCtl='direct';
  if(kind==='jet'){aloft(pl,150,120,1);run(0.3);let a=0,last=F.rl,t=0;tap('KeyA');tap('KeyA');const br=!!F.br;while(t<4&&F.br){step();t+=1/60;a+=wrap(F.rl-last);last=F.rl;}
    console.log('  A tapped twice: barrel roll',br,' a whole turn',Math.abs(a)>=Math.PI*2-0.3,'in',f1(t),'s  wrecked',pl.dead);
    aloft(pl,150,100,1);run(0.2);const v0=F.v;down(['ShiftLeft']);run(3);const ab=F.ab,heat=F.heat,v3=F.v,disp=/AFTERBURNER/.test(P.ui.instOv?P.ui.instOv.innerHTML:'');run(5);const lock=F.abLock;up(['ShiftLeft']);run(0.2);
    console.log('  Shift at full throttle: afterburner',ab,' speed',f1(v0),'->',f1(v3),' heat after 3 s',f2(heat),' after 8 s overheated',!!lock,' display says AFTERBURNER',disp);
    aloft(pl,80,140,1);run(0.2);down(['KeyS']);let gl=0,vig=0;for(let k=0;k<90;k++){step();gl=Math.max(gl,F.gl||0);vig=Math.max(vig,+(P.ui.gvig?P.ui.gvig.style.opacity:0));}up(['KeyS']);run(0.5);
    console.log('  a hard pull at 140: up to',f1(gl),'G  edges greyed',vig>0.1,'(',f2(vig),')');}
  if(kind==='light'){aloft(pl,120,34,0.7);tap('Mouse2');const on=!!F.smoke,p0=T.parts?T.parts.filter(q=>q.life>0).length:0;run(1);console.log('  right click: smoke trail',on,' puffs out',T.parts?T.parts.filter(q=>q.life>0).length-p0>5:'?');tap('Mouse2');console.log('    again: off',!F.smoke);}
  if(kind==='air'){aloft(pl,180,75,0.75);run(0.5);const y0=g.position.y,h0=g.rotation.y;tap('Mouse2');const on=!!pl.ap;
    // (a gust: knocked into a bank and a dive)
    F.w.p=0.6;F.w.q=-0.3;run(15);console.log('  right click: autopilot',on,' after a knock, 15 s on: height off by',f1(g.position.y-y0),' heading off by',f2(wrap(g.rotation.y-h0)),' bank',f2(F.rl),' display says',/ALT HOLD/.test(P.ui.inst?P.ui.inst.innerHTML:''));
    hold(['KeyA'],0.2);console.log('    A: autopilot off',!pl.ap);}
  if(kind!=='jet'){aloft(pl,40,kind==='air'?42:20,0.2);tap('KeyR');const gu=!!F.gearUp;let t=0;while(t<40&&F.air&&!pl.dead){if(H(pl)<3){down(['KeyS']);up(['KeyW']);}else{down(['KeyW']);up(['KeyS']);if(F.pt<-0.08)up(['KeyW']);}step();t+=1/60;}up(['KeyW','KeyS']);run(4);
    console.log('  R: gear up',gu,' belly landing: survived',!pl.dead,' plane hp',f1(pl.hp)+'/'+T.planeMax(pl),' slid to a stop',F.v<0.5,' can it take off again',(()=>{down(['ShiftLeft','KeyS']);run(6);up(['ShiftLeft','KeyS']);return F.air;})());}
}
console.log('errors',errs.length,errs.slice(0,3));
`);
process.exit(0);
