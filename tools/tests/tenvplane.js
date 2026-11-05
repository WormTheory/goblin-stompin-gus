// Testing Environment: the Plane button parks a plane on the grass ahead of Gus, nose the way he's looking; he gets in
// (goblin mode), speeds up and takes off from the grass, no runway. node tenvplane.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,keys,tenvVeh,tenvClear,get TS(){return TS},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f1=v=>v.toFixed(1),G0=44,st=()=>P.drv?P.drv.k:'on foot';
const hold=(ks,s)=>{for(const k of ks)T.keys.add(k);run(s);for(const k of ks)T.keys.delete(k);};
T.DT.invuln=true;T.setGob(true);run(0.5);
P.cam.yaw=Math.PI/2;T.TS.n=1;T.tenvVeh('plane');console.log('plane button:',els.tpInfo.textContent);
T.TS.n=5;T.tenvVeh('plane');console.log('5 more:',els.tpInfo.textContent);
const V=T.venues.get('tenvPlanes');console.log('planes',V.pl.length,'at',V.pl.map(pl=>f1(pl.g.position.x-P.pos.x)+','+f1(pl.g.position.z-P.pos.z)+' h'+f1(pl.g.rotation.y)).join(' | '));
run(2);console.log('2 s on, still parked:',V.pl.every(pl=>!pl.free&&!pl.dead));
const pl=V.pl[0],g=pl.g;P.pos.set(g.position.x-Math.cos(g.rotation.y)*2,g.position.y+0.2,g.position.z+Math.sin(g.rotation.y)*2);P.vy=0;P.state='walk';run(0.05);
hold(['KeyE'],0.1);console.log('E beside it:',st(),'the one spawned',P.drv&&P.drv.o===pl);
const x0=g.position.x,z0=g.position.z;hold(['KeyW'],3);hold(['KeyW','Space'],3);
console.log('W 3 s then W+Jump 3 s over the grass: speed',f1(pl.free.v),'height',f1(g.position.y-G0-1),'ground run',f1(Math.hypot(g.position.x-x0,g.position.z-z0)),'wrecked',pl.dead);
hold(['KeyE'],0.1);run(0.5);T.tenvClear();console.log('clear all while flying it: planes left',T.venues.get('tenvPlanes')?T.venues.get('tenvPlanes').pl.length:0);
console.log('errors',errs.length,errs.slice(0,3));
`);
process.exit(0);
