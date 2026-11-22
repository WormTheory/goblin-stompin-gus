// The Mobile Gear's assault boost through a real city: RUNS boosts (24) from round the start, each a different way and a little up or down, 3 s each. BAD: stalled against something for more than a quarter of a second, ended inside blocks, or couldn't walk on afterwards (the last can just be a wall in the way). ONLY=k,k runs just those. node mgabaudit.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,mechHint,boatVenue,angDiff,milHit,mechHit,IMP,tenvSpawnOne,setTenv(v){const w=TENV;TENV=v;return w;},tenvVehKinds,dbgItems,dbgMenuToggle,ddOpts,ddChoose,get DT(){return DT},get hintTxt(){const k=P1.ui.fkeys;return !k||k.hidden?"(hidden)":k._s},mgLead,mgTarget,MGW,get DRV_WPN(){return DRV_WPN},get:(x,y,z)=>get(x,y,z),keys,mHeld,setRaw,solidAt,tenvVeh,MG,BINDS,ACTS,setBind,drvFind,mgFits,get nEdits(){return Object.keys(edits).length},');
hdr=hdr.replace(',tenv:{boxes:[]}','');eval(hdr+`
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
T.setGob(true);run(0.3);T.DT.infStam=true;console.log('TENV',!!T.TENV);
const spawn=()=>{T.TS.dbg=true;T.TS.vm='park';try{T.tenvVeh('mech');}finally{T.TS.dbg=false;}run(0.3);const v=V();return v&&v.mechs[v.mechs.length-1];};
const home={x:P.pos.x,y:P.pos.y,z:P.pos.z};let bad=0;
const R=+(process.env.RUNS||24);
const ONLY=process.env.ONLY?process.env.ONLY.split(',').map(Number):null;
for(let k=0;k<R;k++){if(ONLY&&!ONLY.includes(k))continue;const yaw=k*2*Math.PI/R*1.0+0.13,pitch=[0,0.06,-0.05][k%3];
  put(home.x+Math.sin(k)*30,home.y+40,home.z+Math.cos(k)*30);run(1.5);P.cam.yaw=yaw;P.cam.pitch=-0.1;run(0.1);
  const M=spawn();if(!M){console.log('no mech');continue;}board(M);M.h=yaw+Math.PI;P.cam.yaw=yaw;P.cam.pitch=pitch;run(0.2);
  const x0=M.x,z0=M.z;tap('KeyX');let t=0,slow=0,maxSlow=0,cur=0,inside=0;
  while(t<3.2){run(1/60);t+=1/60;if(M.ab&&M.ab.ph==='go'){const s=Math.hypot(M.vx,M.vz);if(s<25){slow+=1/60;cur+=1/60;maxSlow=Math.max(maxSlow,cur);}else cur=0;}if(!T.mgFits(M.x,M.y,M.z))inside+=1/60;}
  const going=!!M.ab;if(M.ab)tap('KeyX');run(0.6);const x1=M.x,z1=M.z;hold(['KeyW'],1);const walk=Math.hypot(M.x-x1,M.z-z1);
  const flag=maxSlow>0.25||walk<3||inside>0;if(flag)bad++;
  console.log((flag?'BAD ':'    ')+'yaw',yaw.toFixed(2),'pitch',pitch,' went',f1(Math.hypot(x1-x0,z1-z0)),' slow',f1(slow),'s (longest',f1(maxSlow)+')',' inside',f1(inside),' still going',going,' walked',f1(walk),' blocks edited',T.nEdits);
  hold(['KeyF'],0.8);V().mechs.length=0;}
console.log('bad',bad,'of',R);
`);
