// AI helicopters looking ahead: one hunting Gnash circles him past a ring of tall towers; how long it spends inside a
// block (it doesn't crash into them, it would clip through) and how high it goes. node helav.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace("readFileSync('g.js'","readFileSync(process.env.GJS||'g.js'");
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,MIL_CREW,keys,mHeld,tenvSpawnOne,tenvFoe,drvFind,get,setRaw,venues,groundAt,solidAt,HELI,MIL,angDiff,set menuOpen(v){menuOpen=v},get TS(){return TS},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
T.DT.invuln=true;T.setGob(true);run(0.5);console.log('playing',T.playing);
const army=()=>(T.venues.get('tenvArmy')||{mil:[]}).mil;
// (a ring of towers round Gnash, 40 high, 4 across, at the radius it circles at)
const gx=Math.floor(P.pos.x),gz=Math.floor(P.pos.z),g0=Math.floor(T.groundAt(gx+0.5,gz+0.5,P.pos.y+2));
for(let a=0;a<12;a++){const cx=gx+Math.round(Math.cos(a/12*6.283)*22),cz=gz+Math.round(Math.sin(a/12*6.283)*22);
  for(let x=-2;x<2;x++)for(let z=-2;z<2;z++)for(let y=g0;y<g0+40;y++)T.setRaw(cx+x,y,cz+z,3);}
run(1);P.cam.yaw=0;P.cam.pitch=-0.2;run(0.3);T.TS.n=2;T.menuOpen=true;T.tenvSpawnOne('heli');T.menuOpen=false;run(1);
const H=army().filter(m=>m.kind==='heli'&&!m.dead);for(const M of H){M.state='hunt';M.crew=T.MIL_CREW.heli;M.V.alert=true;}run(3);console.log('helicopters',H.length,H.map(m=>m.state+' '+m.spin.toFixed(2)+' '+m.crew+' alert '+m.V.alert));
let inside=0,frames=0,top=0,avT=0;const SECS=+(process.env.SECS||90);
for(let t=0;t<SECS*60;t++){now+=16.7;T.frame(now);P.pos.set(gx+0.5,g0+0.5,gz+0.5);P.vy=0;
  for(const M of H){if(M.dead||M.spin<0.8)continue;frames++;if(M.av&&M.av.t>0)avT++;top=Math.max(top,M.y-g0);
    const fx=Math.sin(M.h),fz=Math.cos(M.h);if(T.solidAt(M.x,Math.floor(M.y+1),M.z)||T.solidAt(M.x,Math.floor(M.y+2.6),M.z)||T.solidAt(M.x+fx*3,Math.floor(M.y+1.2),M.z+fz*3))inside++;}}
console.log('flying frames',frames,'| inside a block',inside,'('+(100*inside/Math.max(1,frames)).toFixed(1)+'%) | avoiding',avT,'| highest above ground',top.toFixed(1),'| errors',errs.length,errs.slice(0,2).join(' | '));
process.exit(0);
`);
