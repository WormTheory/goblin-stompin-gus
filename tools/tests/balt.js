// The hot-air balloon as you fly it (vehicles/balloon.js), in the Testing Environment as Gnash: the burner's lag (the
// envelope warming a moment behind), the wind's four layers by height and the balloon carried by the one it's in, the
// sandbags (lift, six of them, one flattening a goblin below), the rope (hostile goblins grabbing it and climbing, weighing
// it down, one in the basket tearing at it, all dropped when it's pulled up), and the controls column. node balt.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr+="\nsrc=src.replace('function drvSafe(o){if(!DT.invuln','function drvSafe(o){if(!DT.invulnVeh');\n";
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,keys,mHeld,BAL,BAL_LAYERS,balWinds,windNow,tenvSpawnOne,');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
const errs=[];const ce=console.error;console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f1=v=>v.toFixed(1),f2=v=>v.toFixed(2);
const K=k=>k.startsWith('Mouse')?T.mHeld:T.keys;
const hold=(ks,s)=>{for(const k of ks)K(k).add(k);run(s);for(const k of ks)K(k).delete(k);};
const tap=k=>{hold([k],0.05);run(0.05);};
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
const hudT=v=>v==null?'':String(v).replace(/⟦([^⟧]*)⟧/g,(m,t)=>'['+t+']');
T.DT.invuln=true;T.setGob(true);run(0.5);P.cam.yaw=Math.PI;P.cam.pitch=0;
T.tenvSpawnOne('balloon');run(0.3);const V=T.venues.get('tenvBalloons'),B=V&&V.bl[0];
if(!B){console.log('no balloon');process.exit(0);}
put(B.x-Math.cos(B.h)*1.8,B.y+0.3,B.z+Math.sin(B.h)*1.8);run(0.05);tap('KeyF');
console.log('in:',P.drv&&P.drv.k);
{const H=P.ui.drvHud;console.log('controls:',hudT(H&&H.txt.w).split('  ·  ').join(' | '));}
// ---- the burner's lag: heat after 0.5 s and after 3 s of burning, against a burner that answered at once
const y0=B.y;{K('Space').add('Space');run(0.5);const h1=B.heat,l1=B.lag;run(2.5);const h2=B.heat;K('Space').delete('Space');run(1);
 console.log('burner: after 0.5 s heat',f2(h1),' (warming',f2(l1)+')  after 3 s',f2(h2),' 1 s after letting go still warming',f2(B.lag));}
// ---- the layers: climbing through them, which one it's in and how fast it's carried
{const seen=[];let t=0;K('Space').add('Space');
 while(t<80&&B.y-y0<75){run(1);t++;const L=T.balWinds(B),W=L.list[L.cur],lab=W.lab;if(!seen.length||seen[seen.length-1].lab!==lab)seen.push({lab,h:B.y-y0,dir:W.dir,sp:W.sp});}
 K('Space').delete('Space');
 console.log('layers on the way up:',seen.map(s=>s.lab+' from '+f1(s.h)+' blowing '+f1(s.sp)+' at '+f1(((s.dir%(2*Math.PI))+2*Math.PI)%(2*Math.PI)*180/Math.PI)+'°').join(' | '));
 // (left to drift for 6 s: carried along with the layer's wind)
 const L=T.balWinds(B),W=L.list[L.cur],x0=B.x,z0=B.z;run(6);const dx=B.x-x0,dz=B.z-z0,along=(dx*Math.sin(W.dir)+dz*Math.cos(W.dir))/6;
 console.log('  drifting 6 s in',W.lab,': went',f1(Math.hypot(dx,dz)),' along its wind at',f1(along),'a second (it blows',f1(W.sp)+')');}
// ---- sandbags
{const vy0=B.vy;tap('Mouse2');const vy1=B.vy;console.log('sandbag: rising',f1(vy0),'->',f1(vy1),' left',B.bags,' falling',V.bags&&V.bags.filter(b=>!b.down).length);
 for(let k=0;k<6;k++)tap('Mouse2');console.log('  six more taps: left',B.bags,' message',hudT(P.ui.flash&&P.ui.flash.textContent||''));}
// ---- a sandbag on a goblin: down low, a hostile goblin put right under it, a bag dropped
{let t=0;K('KeyC').add('KeyC');while(B.y-y0>14&&t<60){run(0.5);t+=0.5;}K('KeyC').delete('KeyC');run(0.5);
 B.bags=3;T.menuOpen=true;T.TS.n=1;T.tenvFoe('goblin');T.menuOpen=false;const g=T.goblins.filter(o=>o.state==='chase').pop();
 if(!g)console.log('  no goblin');else{const gy=T.groundAt(B.x+0.4,B.z,B.y);g.pos.set(B.x+0.4,gy,B.z);g.stun=5;const hp0=g.hp;tap('Mouse2');
  let t2=0;while(t2<4&&V.bags.some(b=>!b.down)){g.pos.set(B.x+0.4,gy,B.z);run(0.05);t2+=0.05;}
  console.log('  a bag dropped from',f1(B.y-gy),'up on a goblin under it: hp',hp0,'->',g.hp,' dead',g.state==='dead'||g.hp<=0);}}
// ---- the rope
{let t=0;K('KeyC').add('KeyC');while(B.y-B.y0g()>7&&t<60){run(0.5);t+=0.5;}K('KeyC').delete('KeyC');}
`.replace('B.y0g()','T.groundAt(B.x,B.z,B.y)')+`
{B.heat=0.62;B.lag=1;B.vy=0;tap('Mouse0');const gy=T.groundAt(B.x,B.z,B.y);console.log('rope: down',!!B.rope,' basket',f1(B.y-gy),'up  shown',!!(B.ropeM&&B.ropeM.visible),' length',f1(B.ropeM?B.ropeM.scale.y:0));
 T.menuOpen=true;T.TS.n=4;T.tenvFoe('goblin');T.menuOpen=false;const gs=T.goblins.filter(o=>o.state==='chase');
 const c=Math.cos(B.h),s=Math.sin(B.h),rx=()=>B.x+c*0.9+s*0.9,rz=()=>B.z-s*0.9+c*0.9;
 for(const g of gs){g.pos.set(rx()+0.3,T.groundAt(rx(),rz(),B.y),rz());}
 // (holding the balloon level-ish with the burner while they climb)
 K('Space').add('Space');run(0.3);console.log('  4 goblins at its foot (the burner held from here on): on the rope',(B.climb||[]).length,'(three at most)');
 let t=0,inB=0,hp0=B.hp,vyMin=9;while(t<12){run(0.5);t+=0.5;vyMin=Math.min(vyMin,B.vy);inB=(B.climb||[]).filter(q=>q.in).length;if(inB)break;}
 const onR=(B.climb||[]).filter(q=>!q.in).length;console.log('  after',f1(t),'s: in the basket',inB,' still climbing',onR,' climbing speed held down to',f1(vyMin),'(burning with nobody on the rope gives',f1(T.BAL.rise)+')');K('Space').delete('Space');
 run(3);console.log('  3 s with goblins aboard: balloon hp',hp0,'->',B.hp);
 tap('Mouse0');run(0.2);console.log('  rope pulled up: on the rope',(B.climb||[]).filter(q=>!q.in).length,' in the basket',(B.climb||[]).filter(q=>q.in).length,' rope shown',!!(B.ropeM&&B.ropeM.visible));
 {const H=P.ui.drvHud;console.log('  controls now:',hudT(H&&H.txt.w).split('  ·  ').slice(3,5).join(' | '));}}
// ---- a dead balloon lets everyone go
{T.trainHit(B,500);run(0.3);console.log('shot down: dead',B.dead,' climbers left',(B.climb||[]).length);}
console.log('errors',errs.length,errs.slice(0,3));process.exit(0);
`);
