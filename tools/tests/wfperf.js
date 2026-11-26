// How much a big leak costs: an aquarium-sized tank (3 x 6 x 30) holed in a closed hall, timed frame by frame, in
// spring and in winter (when still water freezes over). Prints the frames' total and worst times, and how many chunk
// rebuilds the water asked for.
const {T,E,run,step,els,pads,errs}=require('./harness.js')();
for(const f of els.play.L.click)f();pads.length=0;run(1);
const W=T.WATER,AIR=T.AIR,STONE=T.STONE,GLASS=T.GLASS;
const put=(x,y,z,b)=>{T.setRaw(x,y,z,b);T.addEdit(x,y,z,b);};
let rb=0,sr=0;const srf=T.setRaw;T.setRaw=(x,y,z,b)=>{if(T.wfQuiet)sr++;return srf(x,y,z,b);};const uw=T.updateWater;let uwt=0;T.updateWater=dt=>{const t=performance.now();uw(dt);uwt+=performance.now()-t;};const rs=T.rebuildSet;T.rebuildSet=s=>{rb+=s.size;return rs(s);};
const bc=T.buildChunk;let bcn=0,bct=0;T.buildChunk=(...a)=>{const t=performance.now();bcn++;const r=bc(...a);bct+=performance.now()-t;return r;};
function trial(name,winter,ox){
  T.dayN=winter?1+3*T.SEASON_LEN:1;run(0.2);
  const P=T.players[0],ax=Math.floor(P.pos.x)+ox,az=Math.floor(P.pos.z)+6,ay=T.G+2,AW=40,AD=30;
  for(let x=ax-1;x<=ax+AW;x++)for(let z=az-1;z<=az+AD;z++)for(let y=ay-1;y<=ay+8;y++)put(x,y,z,y===ay-1||y===ay+8||x===ax-1||x===ax+AW||z===az-1||z===az+AD?STONE:AIR);
  for(let x=ax+5;x<ax+35;x++){for(let z=az;z<az+3;z++)for(let y=ay;y<ay+6;y++)put(x,y,z,W);for(let y=ay;y<ay+6;y++)put(x,y,az+3,GLASS);}
  for(let z=az;z<=az+3;z++)for(let y=ay;y<ay+6;y++){put(ax+4,y,z,GLASS);put(ax+35,y,z,GLASS);}
  run(2);rb=0;bcn=0;bct=0;sr=0;uwt=0;
  for(let y=ay;y<ay+4;y++)put(ax+20,y,az+3,AIR);
  let tot=0,worst=0,n=0;const t1=[];for(let i=0;i<60*25;i++){const t0=performance.now();step(1);const d=performance.now()-t0;tot+=d;worst=Math.max(worst,d);n++;if(i%300===299){t1.push((tot/n).toFixed(1)+'/'+sr+'/'+T.wfAct.size);sr=0;}}
  console.log(name,'| frozen',!!T.WX.frozen,'| mean frame',(tot/n).toFixed(2),'ms (by 5s:',t1.join(' ')+') worst',worst.toFixed(1),'| water sim',uwt.toFixed(0),'ms | chunk rebuilds asked',rb,'built',bcn,'in',bct.toFixed(0),'ms | water moving',T.wfAct.size);
}
trial('spring',false,40);trial('winter',true,-80);
console.log('errors',errs.length,errs.slice(0,3));process.exit(errs.length?1:0);
