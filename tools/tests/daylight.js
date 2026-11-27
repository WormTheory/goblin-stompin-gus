// Block light skipped by day (blkDay, render/block-light.js): in clear daylight chunks are meshed without it, and before
// dusk (or weather dark enough) every one of them and their neighbours is meshed again with it. Checks: by day chunks
// come out unlit and marked, and quicker; coming up to dusk they're all relit before the world's light drops to where
// block light shows, each exactly as meshing it then draws it; a storm rolling in by day relights too; and by night
// nothing's skipped.
const {T,E,run,step,els,pads,errs}=require('./harness.js')();
const ok=[];const chk=(n,v)=>{ok.push(!!v);console.log(n,v?'ok':'BAD');};
global.THREE.BufferGeometry.prototype.setIndex=function(i){this.index=i;};
for(const f of els.play.L.click)f();pads.length=0;T.DT.invuln=true;
const lightNow=()=>{const L=T.WORLD_LIGHT.value;return Math.max(L.r,L.g,L.b);};
const sum=e=>{let s=0;for(const m of e.m){const a=m.geometry.attributes.aBlk;if(a)for(const v of a.array)s+=v;}return s;};
const H=e=>{const L=[];for(const m of e.m){const g=m.geometry;for(const k of ['position','color','aSky','aBlk'])if(g.attributes[k])L.push(Array.from(g.attributes[k].array).join());}return L.join('|');};
// 1. midday, clear
T.WX.type='clear';T.WX.snap=true;T.tod=0.3;run(3);
console.log('midday: light',lightNow().toFixed(3),'skipping',T.blkDay);
chk('by day in clear weather the light is skipped',T.blkDay===true);
const P=T.players[0],cx0=Math.floor(P.pos.x/T.CS),cz0=Math.floor(P.pos.z/T.CS);
const L=[];for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++)L.push([cx0+dx,cz0+dz]);
const time=()=>{const t=performance.now();for(const [a,b] of L)T.buildChunk(a,b);return (performance.now()-t)/L.length;};
// (each is the best of three goes: the first go of either also pays for whatever of the land's light and neighbours
// wasn't worked out yet, and one go alone can be thrown by anything else the computer's doing)
const best=()=>Math.min(time(),time(),time());
const tDay=best();const dayE=L.map(([a,b])=>T.meshes.get(T.ckey(a,b)));
chk('those chunks are marked and unlit',dayE.every(e=>e.dayL&&!e.lc&&sum(e)===0));
T.blkDaySkip=false;step(1);const tLit=best();const litN=L.filter(([a,b])=>sum(T.meshes.get(T.ckey(a,b)))>0).length;T.blkDaySkip=true;step(1);
console.log('per chunk: by day',tDay.toFixed(2),'ms, with the light',tLit.toFixed(2),'ms | chunks with lamplight when lit',litN,'of',L.length);
chk('quicker by day',tDay<tLit&&litN>0);
time();   // (back to day ones)
// 2. on toward dusk, four times as fast: all relit before the light shows
T.daySpd=5;let relitAt=-1,lightAtRelit=0,minLight=9,n=0;
while(n<6000){step(1);n++;const l=lightNow();
  if(relitAt<0&&!T.blkDay&&T.rebuildQ.size===0&&[...T.meshes.values()].every(e=>!e.dayL)){relitAt=n;lightAtRelit=l;}
  if(relitAt>=0&&l<0.9)break;minLight=Math.min(minLight,l);}
console.log('relit after',relitAt,'frames, the light then',lightAtRelit.toFixed(3),'| frames run',n);
chk('every chunk relit before the light drops to where it shows',relitAt>0&&lightAtRelit>=0.97);
let diff=0,all=0;for(const [k,e] of T.meshes){if(e.cx>=T.SHIP_CX0)continue;const a=H(e);T.buildChunk(e.cx,e.cz);all++;if(H(T.meshes.get(k))!==a)diff++;}
chk('each drawn as it would be meshed now ('+all+')',all>40&&diff===0);
// 3. by night nothing's skipped
T.tod=0.75;run(2);chk('by night nothing is skipped',!T.blkDay&&[...T.meshes.values()].every(e=>!e.dayL));
// 4. a storm rolling in by day
T.daySpd=3;T.tod=0.3;run(2);T.rebuildQ.clear();for(const [a,b] of L)T.buildChunk(a,b);
const before=T.blkDay;T.WX.type='storm';run(3);
console.log('storm coming: skipping before',before,'after',T.blkDay,'| still to relight',[...T.meshes.values()].filter(e=>e.dayL).length);
chk('a storm by day relights',before&&!T.blkDay);
run(10);chk('and every chunk is relit',[...T.meshes.values()].every(e=>!e.dayL));
console.log('errors',errs.length,errs.slice(0,3).join(' | '));
const pass=ok.every(Boolean)&&!errs.length;console.log(pass?'all ok':'FAILED');process.exit(pass?0:1);
