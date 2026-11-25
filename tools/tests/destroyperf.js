// How long frames take during mass destruction (stub THREE, so the game's own work only, no real drawing): each scenario
// is run for a few seconds and its frames timed, with what the slow ones spent their time on (the frame's parts, by the
// names core/loop.js runs them under, and the call that set it off).
//   topple   the eight tallest buildings near the start brought down at once
//   trees    a wood's trunks cut through over 29 x 29 blocks, three times, so every tree there falls together
//   dash     a hippo-sized hole smashed along a straight line through a town at 30 blocks a second
//   woods    the same through a wood
//   land     a ball of ground (radius 8) dug out every sixth of a second along a line across open country
//   nuke     a big blast of radius 160 in town
// Usage: node destroyperf.js [scenario ...]     (SLOW=25 lists each frame over that many ms; SECS a scenario's length)
// Compare before and after a change by the p50/p90/p99/worst and the totals; the numbers differ a little run to run.
const want=process.argv.slice(2),SLOW=+(process.env.SLOW||1e9);
const ms=()=>Number(process.hrtime.bigint())/1e6;
function boot(){
  global.__sec={};
  const H=require('./harness.js')({before:src=>{const a="safeT(name,f);return;}try{f();}";if(!src.includes(a))throw new Error('destroyperf: safe() not found');
    return src.replace(a,"safeT(name,f);return;}const __t0=process.hrtime.bigint();try{f();global.__sec[name]=(global.__sec[name]||0)+Number(process.hrtime.bigint()-__t0)/1e6;}");}});
  for(const f of H.els.play.L.click)f();H.pads.length=0;H.step(60);H.T.DT.invuln=true;return H;
}
const H=boot(),{T,E,step}=H,P=T.players[0],G=T.G,CELL=T.CELL;
let now=5000;const frame=()=>{now+=16.7;E('frame')(now);};
function run(name,secs,each){
  const fr=[],tot={};let acts=0;
  for(let i=0;i<secs*60;i++){global.__sec={};const t=ms();let a=0;if(each){const t1=ms();each(i);a=ms()-t1;acts+=a;}frame();const d=ms()-t;fr.push(d);
    for(const k in global.__sec)tot[k]=(tot[k]||0)+global.__sec[k];
    if(d>SLOW)console.log('   frame',i,d.toFixed(0),'ms: the call',a.toFixed(0)+',',Object.entries(global.__sec).filter(e=>e[1]>2).sort((a,c)=>c[1]-a[1]).map(e=>e[0]+' '+e[1].toFixed(0)).join(', '));}
  const s=[...fr].sort((a,c)=>a-c),pc=q=>s[Math.floor(q*(s.length-1))].toFixed(1),sum=fr.reduce((a,c)=>a+c,0);
  console.log(name.padEnd(7),'frames',fr.length,'avg',(sum/fr.length).toFixed(2),'ms  p50',pc(.5),'p90',pc(.9),'p99',pc(.99),'worst',pc(1),'| over 16.7 ms:',fr.filter(x=>x>16.7).length,'over 33:',fr.filter(x=>x>33).length);
  console.log('        the calls',acts.toFixed(0),'ms |',Object.entries(tot).sort((a,c)=>c[1]-a[1]).slice(0,7).map(e=>e[0]+' '+e[1].toFixed(0)).join(', '));
}
const put=(x,z,y)=>{P.pos.set(x,y===undefined?G+1.2:y,z);P.vy=0;};
const settle=n=>{for(let i=0;i<n;i++)frame();};
// (a plot of thick woods, and a town, nearest the start)
const findPlot=(ok)=>{for(let r=1;r<200;r++)for(let i=-r;i<=r;i++)for(const [a,c] of [[i,-r],[i,r],[-r,i],[r,i]])if(ok(a,c))return [a,c];return null;};
const S={
  topple(){
    const list=[];for(let px=-30;px<=30;px++)for(let pz=-30;pz<=30;pz++){const I=T.plotInfo(px,pz);(I.b||[]).forEach(b=>{if(b.top>G+6)list.push({b,px,pz});});}
    list.sort((a,b)=>b.b.top-a.b.top);const c=e=>[e.px*CELL+(e.b.x0+e.b.x1)/2,e.pz*CELL+(e.b.z0+e.b.z1)/2];
    // (eight tall ones close together: those nearest the tallest)
    const [ax,az]=c(list[0]),near=list.slice(0,80).sort((p,q)=>Math.hypot(c(p)[0]-ax,c(p)[1]-az)-Math.hypot(c(q)[0]-ax,c(q)[1]-az)).slice(0,8);
    put(ax+45,az+45);settle(240);
    run('topple',+(process.env.SECS||20),i=>{if(i!==5)return;T.collInFrame=true;   // (as if a frame's smashing had brought them down)
      for(const e of near){const [x,z]=c(e),B=T.bldgAt(x,z);if(B)T.collapseBuilding(B,G+1+T.FH*2,{x:1,z:0});}T.collInFrame=false;});
  },
  trees(){
    const at=findPlot((a,c)=>T.farTreesOf(a,c).length>=30&&T.farTreesOf(a+1,c).length>=30);if(!at)return console.log('trees: no wood found');
    const x=at[0]*CELL+CELL,z=at[1]*CELL+16;put(x,z+30,T.landTop(x,z+30)+1.2);settle(240);
    const gy=T.landTop(x,z);
    run('trees',+(process.env.SECS||10),i=>{if(i===5||i===65||i===125)T.crush(x+(i-65)/2,gy+2,z,14,0,1,{});});
  },
  dash(){
    const at=findPlot((a,c)=>T.setType(a,c)==='city'&&T.setType(a+3,c)==='city');const x0=at[0]*CELL,z=at[1]*CELL+20;put(x0,z);settle(240);
    run('dash',+(process.env.SECS||8),i=>{const x=x0+i*0.5;put(x-1.5,z);T.crushDisc(x,G+1,z,2.2,4,{dx:1,dz:0});});
  },
  woods(){
    const at=findPlot((a,c)=>T.farTreesOf(a,c).length>=30&&T.farTreesOf(a+1,c).length>=30&&T.farTreesOf(a+2,c).length>=20);if(!at)return console.log('woods: no wood found');
    const x0=at[0]*CELL,z=at[1]*CELL+16;put(x0,z,T.landTop(x0,z)+1.2);settle(240);
    run('woods',+(process.env.SECS||6),i=>{const x=x0+i*0.5,y=T.landTop(x,z);put(x-1.5,z,y+1.2);T.crushDisc(x,y+1,z,2.2,4,{dx:1,dz:0});});
  },
  land(){
    const at=findPlot((a,c)=>T.PLAINS_OPEN(a,c)&&T.PLAINS_OPEN(a+1,c)&&T.PLAINS_OPEN(a+2,c)&&!T.farTreesOf(a,c).length);const x0=at[0]*CELL,z=at[1]*CELL+16;put(x0,z,T.landTop(x0,z)+1.2);settle(240);
    run('land',+(process.env.SECS||8),i=>{if(i%10)return;const x=x0+10+i*0.15,y=T.landTop(x,z);put(x-14,z,T.landTop(x-14,z)+1.2);T.crushShape('sphere',x,y-2,z,8,1,0,{});});
  },
  nuke(){
    put(40,40);settle(240);
    run('nuke',+(process.env.SECS||25),i=>{if(i===5)T.bigBlast(260,G+1,40,160);});
  },
};
for(const k of (want.length?want:Object.keys(S))){if(!S[k]){console.log('no scenario',k);continue;}S[k]();}
console.log('errors',H.errs.length,H.errs.slice(0,3).join(' | '));
process.exit(H.errs.length?1:0);
