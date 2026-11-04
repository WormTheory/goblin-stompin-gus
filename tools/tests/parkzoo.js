// Theme park rides and zoo animals: real attacks hurt them, what's wrecked stays wrecked, and nothing breaks by itself. node parkzoo.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,venues,damageCar,carsNear,TRAIN_BOXES,crush,get:get,AIR,METAL,coasterTrackAt,startStomp,get scoreNow(){return score},get wreckedNow(){return wrecked},');
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=9999;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const step=k=>{for(let i=0;i<k;i++){if(A.state!=='dead')A.hp=9999;quiet();now+=16.7;T.frame(now);}};
const hover=(x,y,z,k)=>{for(let i=0;i<k;i++){A.pos.set(x,y,z);A.vy=0;A.state='walk';step(1);}};
const find=kind=>{const seen=new Set();for(let r=0;r<600;r++)for(let i=-r;i<=r;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const q=T.superOf(x,z);if(q&&q.kind===kind&&!seen.has(q.ax+','+q.az))return q;}return null;};
const hitsAt=(x,y,z,r)=>T.carsNear(x,z,r,y);
// ---- the zoo ----
{const S=find('zoo');if(!S)console.log('no zoo');else{const X0=S.ax*32,Z0=S.az*32;console.log('zoo at',S.ax,S.az,'w',S.w);
 hover(X0+40,G0+20,Z0+40,130);const V=T.venues.get('z'+S.ax+','+S.az);console.log('venue',!!V,'animals',V&&V.animals&&V.animals.length);
 const by={};for(const a of V.animals){by[a.sp]=(by[a.sp]||0)+1;}console.log('species',JSON.stringify(by));
 const s0=T.scoreNow;
 // each kind, by the car path that every attack uses: bites of 5, a charged stomp of 15
 const seen=new Set();for(const a of V.animals){if(seen.has(a.sp))continue;seen.add(a.sp);const hits=[...new Set(hitsAt(a.x,a.g.position.y+.5,a.z,1.6))];const has=hits.includes(a.pr);let k=0;while(!a.dead&&k<40){T.damageCar(a.pr,5,new V3(1,0,0));k++;}
   hover(X0+40,G0+20,Z0+40,3);console.log(a.sp.padEnd(9),'found by an attack',has,'bites to kill',k,'dead',a.dead,'box alive',a.pr.alive);}
 console.log('score from those',T.scoreNow-s0);
 hover(X0+40,G0+20,Z0+40,200);const c0=V.animals.filter(a=>a.dead);console.log('corpses lying',c0.length,'tipped',c0.every(a=>Math.abs(Math.abs(a.g.rotation.z)-Math.PI/2)<.01),'still hit by attacks',c0.some(a=>T.carsNear(a.x,a.z,4,a.g.position.y+.5).includes(a.pr)));
 // a real stomp from the player: land next to a live one
 const a=V.animals.find(q=>!q.dead);{const hp0=a.hp;A.pos.set(a.x+1,G0+1+(a.g.position.y-G0-1),a.z);A.vy=0;A.state='walk';A.grounded=true;step(2);T.startStomp(A);step(60);console.log('real stomp beside a',a.sp,'hp',hp0,'->',a.hp,'state',A.state);}
 // gone for good: walk away and come back
 const dead=T.wreckedNow,nd=Object.keys(dead).filter(k=>k[0]==='z').length;const tot=V.animals.length;hover(X0+3000,G0+40,Z0+3000,130);console.log('venue dropped away',!T.venues.has('z'+S.ax+','+S.az));hover(X0+40,G0+20,Z0+40,130);const V2=T.venues.get('z'+S.ax+','+S.az);console.log('back: animals',V2.animals.length,'of',tot+'; killed on record',nd,'alive now',V2.animals.filter(q=>!q.dead).length);
}}
// ---- the theme park ----
{// (some parks were never fully built: go through them till one has all its rides, and say what the others put up)
 const parks=[],seen=new Set();for(let r=0;r<500&&parks.length<8;r++)for(let i=-r;i<=r;i++)for(const [x,z] of [[i,-r],[i,r],[-r,i],[r,i]]){const q=T.superOf(x,z);if(q&&q.kind==='theme'&&!seen.has(q.ax+','+q.az)){seen.add(q.ax+','+q.az);parks.push(q);}}
 let S=null;for(const q of parks){const b=q.w>=6?128:30;hover(q.ax*32+b,G0+70,q.az*32+b,90);{let w=0;let v=T.venues.get('t'+q.ax+','+q.az);while(v&&v.ride&&v.survey&&w<120){hover(q.ax*32+b,G0+70,q.az*32+b,5);w++;}}const V0=T.venues.get('t'+q.ax+','+q.az);
   if(!V0||!V0.ride){console.log('park',q.ax,q.az,'no rides put up (its anchor plot is',T.plotInfo(q.ax,q.az).type+')');continue;}
   console.log('park',q.ax,q.az,'surveyed',!V0.survey,'coaster',!V0.K.off,'wheel',!V0.W.dead,'carousel',!V0.Cs.dead);if(!V0.K.off&&!V0.W.dead&&!V0.Cs.dead&&!S)S=q;}
 if(!S)console.log('no complete theme park');else{const X0=S.ax*32,Z0=S.az*32;console.log('theme park at',S.ax,S.az,'w',S.w);
 const P=T.plotInfo(S.ax,S.az),R=P.theme,big=S.w>=6,mx=X0+(big?128:30),mz=Z0+(big?128:30);
 hover(mx,G0+70,mz,70);const k='t'+S.ax+','+S.az,V=T.venues.get(k);console.log('venue',!!V,'rides',!!(V&&V.ride));if(!V||!V.ride){console.log('NO RIDES');process.exit(0);}
 const K=V.K,W=V.W,Cs=V.Cs,C=K.C;
 // nothing should come down by itself: the whole circuit, and the wheel and carousel, on an untouched park
 {let miss=0;for(let i=0;i<720;i++)if(!T.coasterTrackAt(C,i/720*Math.PI*2))miss++;console.log('untouched: circuit points with no track',miss,'of 720');}
 const hoverAt=(x,z,sec)=>hover(x,G0+70,z,Math.round(sec*60));
 hoverAt(C.cu,C.cv,20);console.log('after 20s by the coaster: derailed',K.off,'halted',K.halted,'car 0 moved',K.th.toFixed(2));
 hoverAt(W.hub.x,W.hub.z+40,5);console.log('by the wheel: falling',!!W.fall,'dead',W.dead,'rotation',W.g.rotation.z.toFixed(2));
 hoverAt(Cs.x,Cs.z+30,3);console.log('by the carousel: dead',Cs.dead,'turned',Cs.g.rotation.y.toFixed(2));
 // the gate: it used to take every ride with it
 {const g=P.b.find(b=>b.ride);T.crush(X0+g.x0,G0+4,Z0+g.z0,2,-2,2);hover(X0+g.x0,G0+40,Z0+g.z0,60);console.log('gate corner smashed: rides still there',!!T.venues.get(k)&&!!T.venues.get(k).ride&&!W.dead&&!Cs.dead);}
 // every part can be found by an attack where it stands
 hoverAt(C.cu,C.cv,1);{const c=K.cars[0],p=c.g.position;console.log('attack finds coaster car',T.carsNear(p.x,p.z,1.5,p.y+.5).includes(c.pr));}
 hoverAt(W.hub.x,W.hub.z+6,1);{const q=W.gonds[0],p=q.pr.pos;console.log('attack finds gondola',T.carsNear(p.x,p.z,1.2,p.y+.5).includes(q.pr),'rim at the bottom',T.carsNear(W.hub.x,W.hub.z,1.5,W.hub.y-W.R).includes(W.rim),'hub',T.carsNear(W.hub.x,W.hub.z,1.5,W.hub.y).includes(W.rim));}
 console.log('attack finds carousel',T.carsNear(Cs.x+3,Cs.z,1.5,G0+2).includes(Cs.pr));
 // ride them: drop on a gondola, on a coaster car
 const drop=(x,y,z)=>{A.state='walk';A.grounded=false;A.mvx=A.mvz=0;A.vy=0;A.pos.set(x,y,z);};
 {const q=W.gonds[2],p=q.pr.pos;drop(p.x,q.pr.top+1,p.z);step(40);const on=A.standCar===q.pr;const y0=A.pos.y;step(120);console.log('on a gondola',on,'still',A.standCar===q.pr,'moved up/down',(A.pos.y-y0).toFixed(2),'gondola top',q.pr.top.toFixed(1),'hippo',A.pos.y.toFixed(1));}
 {const c=K.cars[1],p=c.g.position;let onN=0;drop(p.x,p.y+2,p.z);for(let i=0;i<300;i++){step(1);if(A.standCar===c.pr)onN++;else if(i<30)drop(c.g.position.x,c.g.position.y+1.2,c.g.position.z);}console.log('on a coaster car: frames on it',onN,'of 300');}
 hoverAt(C.cu,C.cv,.5);
 // the carousel, hit till it goes
 {const s0=T.scoreNow;let h=0;while(!Cs.dead&&h<60){T.damageCar(Cs.pr,15);h++;}console.log('carousel gone after',h,'charged stomps, score',T.scoreNow-s0,'on record',!!T.wreckedNow[Cs.k]);}
 // a gondola, then the wheel by hitting it
 {let h=0;const q=W.gonds[3];while(!q.dead&&h<40){T.damageCar(q.pr,5);h++;}console.log('gondola gone after',h,'bites, drawn',q.g.visible);}
 // the coaster: blow a hole in the track ahead of it, near the player
 {hoverAt(C.cu,C.cv,.2);const t=K.th+1.2,x=C.cu+Math.cos(t)*C.a,z=C.cv+Math.sin(t)*C.b;hover(x,G0+30,z,5);T.crush(x,G0+8,z,3,-8,8);console.log('hole in the track: there still',T.coasterTrackAt(C,t));let s=0;const s0=T.scoreNow;while(!K.off&&s<60){hover(x,G0+30,z,6);s+=.1;}
  const flew=K.cars.filter(c=>c.fly).length;let t2=0;while(K.cars.some(c=>c.fly)&&t2<10){hover(x,G0+30,z,6);t2+=.1;}console.log('derailed',K.off,'after',s.toFixed(1)+'s','cars flying',flew,'down after',t2.toFixed(1)+'s','all dead',K.cars.every(c=>c.dead),'score',T.scoreNow-s0);}
 // the wheel: cut one side's legs (both frames)
 {const x=W.cu+Math.round((W.top-(G0+3))*0.42),s0=T.scoreNow;hover(W.hub.x,G0+70,W.hub.z+50,3);for(const dz of [-2,2])T.crush(x,G0+3,W.cv+dz,1,-1,1);hover(W.hub.x,G0+70,W.hub.z+50,60);const f=!!W.fall||W.dead;let t=0;while(!W.dead&&t<12){hover(W.hub.x,G0+70,W.hub.z+50,6);t+=.1;}
  console.log('legs cut on one side: came down',f,'after',t.toFixed(1)+'s','lying at',(W.g.position.y-G0).toFixed(1),'tipped',Math.abs(W.g.rotation.x).toFixed(2),'score',T.scoreNow-s0,'hits left',T.carsNear(W.hub.x,W.hub.z,3,G0+2).includes(W.rim));}
 // and it all stays that way
 {hover(X0+4000,G0+40,Z0+4000,130);console.log('venue dropped away',!T.venues.has(k));hover(mx,G0+70,mz,70);const V2=T.venues.get(k);console.log('back: wheel down',V2.W.dead,'carousel down',V2.Cs.dead,'coaster off',V2.K.off,'cars drawn',V2.K.cars.filter(c=>c.g.visible).length,'wheel height',(V2.W.g.position.y-G0).toFixed(1));}
}}
console.log('done');
`);
process.exit(0);
