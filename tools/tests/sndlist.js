// The debug Sound list names each sound by what it really is: a tank shell fired, a dry-fire click, a reload, a helicopter's
// gun and rocket, blocks breaking, and that one sound's name never sticks to the ones after it. node sndlist.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,keys,mHeld,SL,wpnClick,destroyFX,STONE,set audio(v){audio=v},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const hold=(ks,s)=>{for(const k of ks)T.keys.add(k);run(s);for(const k of ks)T.keys.delete(k);};
const tap=()=>{hold(['KeyF'],0.1);let n=0;while(P.drv&&P.drv.jack&&n<60){run(0.1);n++;}};
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.state='walk';P.grounded=false;};
const beside=(x,y,z,h,hx)=>put(x-Math.cos(h)*(hx+0.7),y,z+Math.sin(h)*(hx+0.7));
const fire=b=>{T.mHeld.add(b||'Mouse0');run(0.05);T.mHeld.delete(b||'Mouse0');run(0.05);};
T.audio={};T.DT.sndList=true;T.DT.invuln=true;T.DT.host=1;T.setGob(true);run(0.5);
// (what the list showed during f: each name, with how many times)
const heard=(what,f)=>{T.SL.rows.clear();f();console.log(what.padEnd(36),'->',[...T.SL.rows.keys()].join(' | ')||'(nothing)');};
const G0=44;
heard('stone blocks breaking',()=>T.destroyFX([[Math.floor(P.pos.x)+3,G0-1,Math.floor(P.pos.z),T.STONE]],{force:1}));
heard('dry-fire click, right after',()=>T.wpnClick());
T.tenvSpawn('base');{let n=0;while(T.TS.search&&n<5000){T.tenvTick();n++;}}run(3);
const V=[...T.venues.values()].find(v=>v.kind==='army');
if(!V)console.log('no base');else{
  const M=V.mil.find(m=>m.kind==='tank');beside(M.x,M.y+0.2,M.z,M.h,1.6);run(0.05);tap();
  console.log('in the tank',P.drv&&P.drv.k);P.cam.pitch=-0.35;run(0.5);
  const S=M.wpn.shell;
  heard('tank fires (bite)',()=>{S.n=4;S.rl=0;S.cd=0;fire();});
  run(2);
  heard('last shell: magazine empty',()=>{S.n=1;S.rl=0;S.cd=0;fire();});
  heard('bite with nothing loaded',()=>{fire();});
  heard('reload finishing',()=>{S.rl=0.05;run(0.2);});
  tap();run(1);
  const H=V.mil.find(m=>m.kind==='heli');beside(H.x,H.y+0.2,H.z,H.h,1.0);run(0.05);tap();
  console.log('in the helicopter',P.drv&&P.drv.k);run(2);hold(['Space'],2);
  heard('helicopter rotor',()=>run(0.3));
  heard('helicopter gun (bite held)',()=>{T.mHeld.add('Mouse0');run(0.3);T.mHeld.delete('Mouse0');});
  heard('helicopter rocket (stomp)',()=>{const R=H.wpn.rkt;R.n=4;R.rl=0;R.cd=0;H.rkHeld=false;fire('Mouse2');});
}
console.log('errors',errs.length,errs.slice(0,3));process.exit(0);
`);
