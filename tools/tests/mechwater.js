// The Mobile Gear on water: boost skating across a pool, walking into it (sinks), slowing on it (drops in), Gnash and Grizzle alike. node mechwater.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={WATER,setGob,mechHint,boatVenue,angDiff,milHit,mechHit,IMP,tenvSpawnOne,setTenv(v){const w=TENV;TENV=v;return w;},tenvVehKinds,dbgItems,dbgMenuToggle,ddOpts,ddChoose,get DT(){return DT},get hintTxt(){return P1.ui.hint.hidden?"(hidden)":P1.ui.hint._s},mgLead,mgTarget,MGW,get DRV_WPN(){return DRV_WPN},get:(x,y,z)=>get(x,y,z),keys,mHeld,setRaw,solidAt,tenvVeh,MG,BINDS,ACTS,setBind,drvFind,mgFits,get nEdits(){return Object.keys(edits).length},');
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
T.setGob(true);run(0.5);
// (a pool 8 deep, 14 wide and 60 long, starting 8 ahead of the mech)
const pool=M=>{const x0=Math.floor(M.x)-7,z0=Math.floor(M.z)+8,y1=Math.floor(M.y)-1;for(let x=x0;x<x0+14;x++)for(let z=z0;z<z0+60;z++)for(let y=y1-7;y<=y1;y++)T.setRaw(x,y,z,T.WATER);run(0.2);return {z0,z1:z0+60,top:y1+1};};
const S0=[P.pos.x,P.pos.y,P.pos.z];
for(const who of [0,1]){P.who=who;hold(['KeyF'],0.8);T.tenvClear();put(S0[0]+who*60,S0[1],S0[2]);run(1);
  let M=fresh();board(M);run(1);const W=pool(M),y0=M.y;
  // boost on, then straight across
  tap('KeyC');let lo=1e9,on=0,n=0;T.keys.add('KeyW');for(let k=0;k<60*6&&M.z<W.z1+6;k++){run(1/60);if(M.z>W.z0+2&&M.z<W.z1-2){n++;lo=Math.min(lo,M.y);if(M.skim&&M.grounded)on++;}}T.keys.delete('KeyW');
  console.log(['Gnash','Grizzle'][who]+': boosted across',M.z>W.z1,' lowest over the water',f2(lo-W.top),' skimming',on+'/'+n,' spd',f1(Math.hypot(M.vx,M.vz)));
  // turned round, slowing to a stop on the water: it drops in
  hold([],1.5);M.h=Math.PI;P.cam.yaw=0;run(0.3);T.keys.add('KeyW');for(let k=0;k<200&&M.z>W.z0+30;k++)run(1/60);T.keys.delete('KeyW');hold([],3);
  console.log('  stopped on it: under the surface by',f1(W.top-M.y),' skimming',M.skim);
  // walking into it (boost off): sinks
  hold(['KeyF'],0.8);put(S0[0]+who*60+30,S0[1],S0[2]);run(1);M=fresh();board(M);run(1);const W2=pool(M);hold(['KeyW'],3.5);console.log('  walked in, boost off: under the surface by',f1(W2.top-M.y),' skimming',M.skim);
}
// skating over one-block bumps (bushes): how far the picture jumps in a frame, against the body underneath
{hold(['KeyF'],0.8);put(S0[0]-60,S0[1],S0[2]);run(1);const M=fresh();board(M);run(1);const y1=Math.floor(M.y);
 for(let z=Math.floor(M.z)+10;z<Math.floor(M.z)+130;z+=7)for(let x=Math.floor(M.x)-1;x<=Math.floor(M.x)+1;x++)T.setRaw(x,y1,z,3);run(0.2);
 tap('KeyC');let jb=0,jp=0,lb=M.y,lp=M.g.position.y;T.keys.add('KeyW');for(let k=0;k<60*4;k++){run(1/60);jb=Math.max(jb,Math.abs(M.y-lb));jp=Math.max(jp,Math.abs(M.g.position.y-lp));lb=M.y;lp=M.g.position.y;}T.keys.delete('KeyW');
 console.log('skating over bumps: biggest jump in a frame, body',f2(jb),' picture',f2(jp),' speed',f1(Math.hypot(M.vx,M.vz)));}
console.log('errors',errs.length,errs[0]||'');
`);
process.exit(0);
