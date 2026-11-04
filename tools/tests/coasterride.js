// Riding the roller coaster: drop on to a car and stay on for whole laps, standing still. Says when and why he comes off. node coasterride.js [laps]
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,venues,get:get,METAL,coasterH,TRAIN_BOXES,');
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0,LAPS=+(process.argv[2]||2);let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=9999;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const step=k=>{for(let i=0;i<k;i++){if(A.state!=='dead')A.hp=9999;quiet();now+=16.7;T.frame(now);}};
const seen=new Set();let S=null;for(let r=0;r<500&&!S;r++)for(let i=-r;i<=r&&!S;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const q=T.superOf(x,z);if(q&&q.kind==='theme'){S=q;break;}}
if(!S){console.log('no park');process.exit(0);}
const X0=S.ax*32,Z0=S.az*32,hold=k=>{for(let i=0;i<k;i++){A.pos.set(X0+128,G0+70,Z0+128);A.vy=0;A.state='walk';step(1);}};
hold(200);const V=T.venues.get('t'+S.ax+','+S.az);if(!V||!V.ride||V.survey||V.K.off){console.log('no coaster',!!V);process.exit(0);}
const K=V.K,C=K.C;console.log('park',S.ax,S.az,'coaster radii',C.a,C.b);
for(const ci of [1,0,3]){
 const c=K.cars[ci];A.state='walk';A.grounded=false;A.mvx=A.mvz=0;A.vy=0;A.pos.set(c.g.position.x,c.pr.top+0.05,c.g.position.z);A.peakY=A.pos.y;
 let landed=false,w=0;while(!landed&&w<120){step(1);w++;if(A.standCar===c.pr)landed=true;else if(w<60){A.pos.set(c.g.position.x,c.pr.top+0.05,c.g.position.z);A.vy=0;A.peakY=A.pos.y;}}
 if(K.off){console.log('coaster already off');break;}const th0=K.th,goal=Math.PI*2*LAPS;let f=0,on=0,offs=[],was=true,maxV=0,lx=A.pos.x,lz=A.pos.z;const log=[];
 while(K.th-th0<goal&&f<12000){const st=A.standCar;step(1);f++;const v=Math.hypot(A.pos.x-lx,A.pos.z-lz)*60;lx=A.pos.x;lz=A.pos.z;if(v<200)maxV=Math.max(maxV,v);const isOn=A.standCar===c.pr;if(isOn)on++;
  if(was&&!isOn&&offs.length<8)offs.push({frame:f,th:+(K.th-th0).toFixed(2),on:A.standCar?(A.standCar.veh||'other'):null,gr:A.grounded,y:+(A.pos.y-c.pr.top).toFixed(2),d:+Math.hypot(A.pos.x-c.pr.pos.x,A.pos.z-c.pr.pos.z).toFixed(2),state:A.state,step:coasterStep(K,ci),off:K.off,halted:K.halted,sp:+K.sp.toFixed(2),same:T.venues.get('t'+S.ax+','+S.az)===V,alive:c.pr.alive,carD:c.dead,fly:!!c.fly,boxes:T.TRAIN_BOXES.filter(b=>b.proxy===c.pr).length});
  was=isOn;
  // (fallen off: back on, to see every part of the circuit)
  if(!isOn&&Math.hypot(A.pos.x-c.pr.pos.x,A.pos.z-c.pr.pos.z)>6||!isOn&&A.pos.y<c.pr.top-3){A.state='walk';A.grounded=false;A.mvx=A.mvz=0;A.vy=0;A.pos.set(c.g.position.x,c.pr.top+0.05,c.g.position.z);A.peakY=A.pos.y;}}
 console.log('car',ci,'landed',landed,'after',w,'frames; on it',on,'of',f,'('+(on/f*100).toFixed(1)+'%) over',LAPS,'laps; top speed',maxV.toFixed(0),'hp',A.hp);
 console.log('  comes off:',JSON.stringify(offs));
}
// landings all round the circuit, at whatever speed it's doing there: come down on it from a little above, off to one side of its middle
{const c=K.cars[2];let kept=0,tries=0,fast=0,top=0;for(let i=0;i<24&&!K.off;i++){for(let j=0;j<45;j++){step(1);}const v=K.sp*0.55*Math.hypot(Math.sin(K.th)*C.a,Math.cos(K.th)*C.b);top=Math.max(top,v);if(v>25)fast++;
  const P=c.g.position,h=c.pr.heading;A.state='walk';A.grounded=false;A.standCar=null;A.rideC=null;A.mvx=A.mvz=0;A.vy=-3;A.pos.set(P.x+Math.sin(h)*.5,c.pr.top+.2,P.z+Math.cos(h)*.5);A.peakY=A.pos.y;step(60);tries++;if(A.standCar===c.pr)kept++;}
 console.log('landings round the circuit: still on after a second',kept,'of',tries,'('+fast+' at over 25 blocks a second; fastest',top.toFixed(0)+')');}
// landing from real heights, on to the moving car: he should stay on it, and the track under it should still be there a lap later
for(const h of [3,6,12,25]){const c=K.cars[1];if(K.off||c.dead){console.log('drop from',h,'skipped: coaster off',K.off,'car dead',c.dead);continue;}
 const hp0=c.hp,sp=Math.sqrt(2*25*h);A.state='walk';A.grounded=false;A.mvx=A.mvz=0;A.pos.set(c.g.position.x,c.pr.top+0.6,c.g.position.z);A.peakY=c.pr.top+h;A.vy=-sp;
 let w=0;while(A.standCar!==c.pr&&w<20){step(1);w++;}const land=A.standCar===c.pr,th0=K.th;let on=0,f=0;while(K.th-th0<Math.PI*2.05&&!K.off&&f<3000){step(1);f++;if(A.standCar===c.pr)on++;else if(!A.standCar&&A.pos.y<c.pr.top-3){A.state='walk';A.grounded=false;A.vy=0;A.mvx=A.mvz=0;A.pos.set(c.g.position.x,c.pr.top+.05,c.g.position.z);A.peakY=A.pos.y;}}
 console.log('drop from',h,'landed on the car',land,'frames on it over the next lap',on,'of',f,'derailed',K.off,'car hp',hp0,'->',c.hp);}
function coasterStep(K,ci){const t=K.th-ci*0.11;return T.coasterH(t+0.03)-T.coasterH(t);}
console.log('done');
`);
process.exit(0);
