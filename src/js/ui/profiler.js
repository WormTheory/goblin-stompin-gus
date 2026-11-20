// ---- the performance profiler (debug menu, Overlays: DT.prof, kept in this browser, off to begin with) ----
// Where each frame's time goes. Every system the frame runs is already wrapped in safe(name,...) (daynight.js), so that's
// where it's timed, by name, each name's own time only (a safe inside another is taken off the outer one's). Chunk
// generation, meshing, block lighting and drawing aren't each in a safe of their own, so they're wrapped here too, as
// are the big events worth seeing a spike against (a building coming down, a blast, a car going up). Off, all it costs is
// safe() and those wrappers looking at PROF.on.
const PROF={on:false,el:null,cv:null,tx:null,
  N:240,i:0,fill:0,iv:new Float32Array(240),cpu:new Float32Array(240),cat:new Float32Array(240*8),ev:new Array(240).fill(null),
  t0:0,last:0,lab:new Map(),fev:null,avg:new Map(),mx:new Map(),spikes:[],txT:0,ivAvg:16,
  gq:null,gpu:0,gpuQ:[],calls:0,tris:0,ch:0};
// the systems, each a colour on the graph: what each safe() name (and the wrappers below) counts as
const PROF_CATS=[['Player','#7fd04a'],['AI','#ff9a2a'],['Vehicles','#5ab4ff'],['World','#c58cff'],['Destruction','#ff5a4a'],['Render','#e8d040'],['Net','#46d4ff'],['Other','#8a8f96']];
const PROF_OF=(()=>{const m={},put=(c,L)=>{for(const k of L.split(' '))m[k]=c;};
  put(0,'player health drive vpin predict arms hud view');
  put(1,'goblins stations services venues devfo');
  put(2,'cars traffic farmlift ships fireballs spikes');
  put(3,'chunks gen meshing lighting regions far explore weather sky tenv devst');
  put(4,'topples water booms fires blast flecks bodies shocks parts rubble');
  put(5,'render batDraw fxDraw dbgOverlay title gpu');
  put(6,'net dress tracers');
  return k=>m[k]??7;})();
// (the names shown for the wrappers' and frame's own labels)
const PROF_NAME={gen:'chunk gen',meshing:'meshing',lighting:'block light',render:'draw calls (CPU)'};
// (PROF_ON is PROF.on where safe() reads it, a var so it's there from the start, before this file runs; PROF_CH the time
// taken by timed things inside the one being timed now)
var PROF_ON=false,PROF_CH=0;
function profAdd(k,ms){PROF.lab.set(k,(PROF.lab.get(k)||0)+ms);}
// time f, as label k, counting only its own time
function profRun(k,f,self,args){const t0=performance.now(),c0=PROF_CH;PROF_CH=0;
  try{return f.apply(self,args);}finally{const el=performance.now()-t0;profAdd(k,el-PROF_CH);PROF_CH=c0+el;}}
const profWrap=(k,f)=>function(...a){return PROF.on?profRun(k,f,this,a):f.apply(this,a);};
// an event this frame (shown on the graph and against a spike), counted
function profEv(k){if(!PROF.on)return;if(!PROF.fev)PROF.fev=new Map();PROF.fev.set(k,(PROF.fev.get(k)||0)+1);}
const profEvWrap=(k,f,ok)=>function(...a){if(PROF.on&&(!ok||ok(...a)))profEv(k);return f.apply(this,a);};
// the hot spots that aren't a safe() of their own (function declarations can be swapped like this: every caller looks
// them up by name)
genChunk=profWrap('gen',profEvWrap('chunk made',genChunk));
buildChunk=profWrap('meshing',buildChunk);
blkFill=profWrap('lighting',blkFill);
regionTick=profWrap('regions',regionTick);
renderView=profWrap('render',renderView);
collapseBuilding=profEvWrap('collapse',collapseBuilding);
bigBlast=profEvWrap('big blast',bigBlast,(x,y,z,R)=>R>=BB_SMALL);
foeBoom=profEvWrap('explosion',foeBoom);
explodeCar0=profEvWrap('car wrecked',explodeCar0);
airCrash=profEvWrap('air crash',airCrash);
shipBreak=profEvWrap('ship broke',shipBreak);
crush=profEvWrap('crater',crush,(x,y,z,r)=>r>=4);
// the graphics card's own time, where the browser lets us have it (a timer query round each view drawn; the answer comes
// back a frame or two later)
function profGpuBegin(){const G=PROF.gq;if(!G)return;try{const q=G.gl.createQuery();G.gl.beginQuery(G.ext.TIME_ELAPSED_EXT,q);G.cur=q;}catch(e){PROF.gq=null;}}
function profGpuEnd(){const G=PROF.gq;if(!G||!G.cur)return;try{G.gl.endQuery(G.ext.TIME_ELAPSED_EXT);G.f.push(G.cur);}catch(e){PROF.gq=null;}G.cur=null;}
function profGpuPoll(){const G=PROF.gq;if(!G)return;const gl=G.gl;
  if(G.f.length){PROF.gpuQ.push(G.f);G.f=[];}
  while(PROF.gpuQ.length){const L=PROF.gpuQ[0];
    if(!L.every(q=>gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)))break;
    PROF.gpuQ.shift();let ns=0;const bad=gl.getParameter(G.ext.GPU_DISJOINT_EXT);
    for(const q of L){ns+=gl.getQueryParameter(q,gl.QUERY_RESULT);gl.deleteQuery(q);}
    if(!bad)PROF.gpu+=(ns/1e6-PROF.gpu)*0.1;}
  if(PROF.gpuQ.length>8){for(const L of PROF.gpuQ.splice(0,PROF.gpuQ.length-8))for(const q of L)gl.deleteQuery(q);}}
{const rv=renderView;renderView=function(...a){if(!PROF.on||!PROF.gq)return rv.apply(this,a);profGpuBegin();try{return rv.apply(this,a);}finally{profGpuEnd();}};}
function profSet(on){
  PROF.on=PROF_ON=on;PROF.fill=0;PROF.i=0;PROF.lab.clear();PROF.avg.clear();PROF.mx.clear();PROF.spikes.length=0;PROF.fev=null;PROF.t0=0;PROF.gpu=0;
  try{renderer.info.autoReset=!on;renderer.info.reset();}catch(e){}   // (on, the counts cover every view of the frame, not just the last)
  if(on&&!PROF.gq){try{const gl=renderer.getContext(),ext=gl&&gl.getExtension&&gl.getExtension('EXT_disjoint_timer_query_webgl2');if(ext)PROF.gq={gl,ext,f:[],cur:null};}catch(e){}}
  if(!PROF.el)PROF.el=document.getElementById('profPane');
  if(PROF.el){PROF.el.hidden=!on;if(on&&!PROF.cv){PROF.el.innerHTML='<canvas width="340" height="72"></canvas><div class="pf-t"></div>';PROF.cv=PROF.el.firstChild;PROF.tx=PROF.el.lastChild;}}
}
// the start of each frame closes off the one before (now: the frame's timestamp)
function profBegin(now){
  if(PROF.on!==!!DT.prof)profSet(!!DT.prof);
  if(!PROF.on)return;
  const t=performance.now();
  if(PROF.t0){
    const iv=Math.min(250,Math.max(0,now-PROF.last)),cpu=Math.max(0,(PROF.end||t)-PROF.t0),i=PROF.i;
    PROF.iv[i]=iv;PROF.cpu[i]=cpu;PROF.ev[i]=PROF.fev;
    for(let c=0;c<8;c++)PROF.cat[i*8+c]=0;
    let acc=0;for(const [k,ms] of PROF.lab){PROF.cat[i*8+PROF_OF(k)]+=ms;acc+=ms;
      PROF.avg.set(k,(PROF.avg.get(k)||0)*0.95+ms*0.05);PROF.mx.set(k,Math.max(PROF.mx.get(k)||0,ms));}
    PROF.cat[i*8+7]+=Math.max(0,cpu-acc);   // (the frame's own work round them all)
    // a spike: well over the usual, or slower than 30 a second
    if(PROF.fill>30&&iv>Math.max(34,PROF.ivAvg*2)){
      const top=[...PROF.lab].sort((a,b)=>b[1]-a[1]).slice(0,3).filter(e=>e[1]>=1);
      PROF.spikes.unshift({iv,cpu,top,ev:PROF.fev?[...PROF.fev]:[]});if(PROF.spikes.length>3)PROF.spikes.pop();}
    PROF.ivAvg+=(iv-PROF.ivAvg)*0.05;
    PROF.i=(i+1)%PROF.N;PROF.fill=Math.min(PROF.N,PROF.fill+1);
    try{const r=renderer.info.render;PROF.calls=r.calls;PROF.tris=r.triangles;renderer.info.reset();}catch(e){}
  }
  PROF.lab.clear();PROF.fev=null;PROF.end=0;PROF.t0=t;PROF.last=now;PROF_CH=0;
  profGpuPoll();
  if((PROF.txT-=1)<=0){PROF.txT=12;profDraw();}else profGraph();
}
// the end of a frame's work (before it waits for the next)
function profEnd(){if(PROF.on)PROF.end=performance.now();}
const pfMs=v=>v<10?v.toFixed(1):Math.round(v)+'';
const pfEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
// the graph: a bar a frame, coloured by system, up to the time between frames (the grey above is waiting for the screen);
// lines at 60 and 30 a second; an event's mark along the top
function profGraph(){
  const cv=PROF.cv;if(!cv||!cv.getContext)return;const x=cv.getContext('2d');if(!x)return;
  const W=cv.width,H=cv.height,top=50,k=(H-6)/top,N=PROF.N,bw=W/N;
  x.clearRect(0,0,W,H);x.fillStyle='rgba(18,22,28,.82)';x.fillRect(0,0,W,H);
  for(let j=0;j<PROF.fill;j++){const i=(PROF.i-PROF.fill+j+N)%N,px=W-(PROF.fill-j)*bw;
    let y=H;const iv=Math.min(top,PROF.iv[i]);
    x.fillStyle='rgba(255,255,255,.13)';x.fillRect(px,H-iv*k,bw,iv*k);
    for(let c=0;c<8;c++){const h=Math.min(y,PROF.cat[i*8+c]*k);if(h<=0)continue;x.fillStyle=PROF_CATS[c][1];x.fillRect(px,y-h,Math.max(1,bw),h);y-=h;}
    if(PROF.iv[i]>top){x.fillStyle='#ff4a3a';x.fillRect(px,0,Math.max(1,bw),3);}
    if(PROF.ev[i]&&[...PROF.ev[i].keys()].some(k=>k!=='chunk made')){x.fillStyle='#fff';x.fillRect(px,4,Math.max(1,bw),5);}}   // (chunks are made nearly every frame on the move: only listed against a spike)
  x.fillStyle='rgba(255,255,255,.35)';for(const ms of [1000/60,1000/30]){const yy=Math.round(H-ms*k)+0.5;x.fillRect(0,yy,W,1);}
  x.font='600 9px ui-monospace,Consolas,monospace';x.fillStyle='rgba(255,255,255,.6)';x.fillText('16',2,H-16.7*k-2);x.fillText('33',2,H-33.3*k-2);
}
// the text: frame times, each system and its busiest parts, the counts, the last few spikes and what came with them
function profDraw(){
  profGraph();if(!PROF.tx)return;
  const n=Math.min(PROF.fill,60);let iv=0,cpu=0,worst=0;const cs=new Float32Array(8);
  for(let j=1;j<=n;j++){const i=(PROF.i-j+PROF.N)%PROF.N;iv+=PROF.iv[i];cpu+=PROF.cpu[i];worst=Math.max(worst,PROF.iv[i]);for(let c=0;c<8;c++)cs[c]+=PROF.cat[i*8+c];}
  const d=Math.max(1,n);iv/=d;cpu/=d;
  let h='<div class="pf-h"><b>'+(iv>0?Math.round(1000/iv):0)+' FPS</b> '+pfMs(iv)+' ms · CPU '+pfMs(cpu)+(PROF.gq&&PROF.gpu>0.01?' · GPU '+pfMs(PROF.gpu):'')+' · worst '+pfMs(worst)+'</div>';
  // (each system, then its three busiest names, by their running average)
  const by=[...PROF.avg].sort((a,b)=>b[1]-a[1]);
  h+='<div class="pf-c">'+PROF_CATS.map(([nm,col],c)=>{const ms=cs[c]/d;if(ms<0.05)return'';
    const sub=by.filter(e=>PROF_OF(e[0])===c&&e[1]>=0.05).slice(0,3).map(e=>pfEsc(PROF_NAME[e[0]]||e[0])+' '+pfMs(e[1])+(PROF.mx.get(e[0])>Math.max(4,e[1]*3)?'<i>↑'+pfMs(PROF.mx.get(e[0]))+'</i>':'')).join(', ');
    return'<div><span class="pf-s" style="background:'+col+'"></span><b>'+nm+'</b> '+pfMs(ms)+(sub?' <small>'+sub+'</small>':'')+'</div>';}).join('')+'</div>';
  PROF.mx.clear();
  // (what's being drawn, and memory where the browser says)
  let mem='';try{const m=performance.memory;if(m)mem=' · heap '+Math.round(m.usedJSHeapSize/1048576)+' MB';}catch(e){}
  let gm='';try{const r=renderer.info.memory;gm=' · '+r.geometries+' geo, '+r.textures+' tex';}catch(e){}
  h+='<div>'+PROF.calls+' draws · '+(PROF.tris>=1e6?(PROF.tris/1e6).toFixed(1)+'M':Math.round(PROF.tris/1e3)+'k')+' tris'+gm+mem+'</div>';
  h+='<div>'+pfEsc(profCounts())+'</div>';
  if(PROF.spikes.length)h+='<div class="pf-sp">'+PROF.spikes.map(s=>'<div><b>'+Math.round(s.iv)+' ms</b> <small>CPU '+Math.round(s.cpu)+'</small> '+
    s.top.map(e=>pfEsc(PROF_NAME[e[0]]||e[0])+' '+Math.round(e[1])).join(', ')+(s.ev.length?' <i>'+s.ev.map(e=>pfEsc(e[0])+(e[1]>1?' ×'+e[1]:'')).join(', ')+'</i>':'')+'</div>').join('')+'</div>';
  if(PROF.tx.dataset.h!==h){PROF.tx.dataset.h=h;PROF.tx.innerHTML=h;}
}
// how many of each thing there is (only worked out while the text is redrawn, a few times a second)
function profCounts(){
  let gh=0,gc=0,ca=0,fx=0,rb=0;
  for(const g of goblins)if(g.state==='chase'||g.state==='wait'){if(g.civ||g.staff)gc++;else gh++;}
  for(const c of cars)if(c.alive)ca++;
  for(const p of parts)if(p.life>0)fx++;for(const r of rubble)if(r.life>0)rb++;
  const S=[[gh,'goblins'],[gc,'folk'],[ca,'cars'],[TRAIN_BOXES.length,'big vehicle boxes'],[chunks.size,'chunks'],[meshes.size,'meshes'],[rebuildQ.size,'remeshing'],
    [fx,'parts'],[rb,'rubble'],[fires.length,'fires'],[SHOTS.length+FIREB.length,'shots'],[topples.length,'toppling'],[bodies.length,'bodies'],[BB.jobs.length,'big blasts'],[venues.size,'venues']];
  return S.filter(e=>e[0]>0).map(e=>e[0]+' '+e[1]).join(' · ');   // (nothing there, nothing said)
}
