// Swimming: floating at the surface, diving with climb held, coming back up, a stroke out on to a ledge; Gus, Gertie and Gnash alike. node swimt.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,plotType,oceanDepth,setGobP,WATER,get,keys,');
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=9999;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const step=k=>{for(let i=0;i<k;i++){if(A.state!=='dead')A.hp=9999;quiet();now+=16.7;T.frame(now);}};
let SP=null;for(let r=30;r<900&&!SP;r+=3)for(let a=0;a<40&&!SP;a++){const x=Math.round(Math.cos(a/40*6.28)*r),z=Math.round(Math.sin(a/40*6.28)*r);let ok=true;for(let i=-2;i<=2&&ok;i++)for(let j=-2;j<=2&&ok;j++)if(T.plotType(x+i,z+j)!=='sea'||T.oceanDepth((x+i)*32,(z+j)*32)<9)ok=false;if(ok)SP=[x,z];}
if(!SP){console.log('no open sea');process.exit(0);}
const X=SP[0]*32+16,Z=SP[1]*32+16;
for(let i=0;i<60;i++){A.pos.set(X,G0+30,Z);A.vy=0;step(1);}
let top=Math.floor(G0);while(T.get(Math.floor(X),top+1,Math.floor(Z))===T.WATER)top++;while(T.get(Math.floor(X),top,Math.floor(Z))!==T.WATER&&top>0)top--;
let bed=top;while(T.get(Math.floor(X),bed-1,Math.floor(Z))===T.WATER)bed--;
console.log('sea: top water block',top-Math.floor(G0),'from G, depth',top-bed+1);
for(const who of (process.env.WHO||'Gus,Gertie,Gnash').split(',')){
  T.setGobP(A,who==='Gnash');A.who=who==='Gertie'?1:0;
  A.state='walk';A.grounded=false;A.mvx=A.mvz=0;A.vy=0;A.pos.set(X,top+6,Z);A.peakY=A.pos.y;
  step(240);const fl=A.pos.y-top;let bob=0;for(let i=0;i<60;i++){step(1);bob=Math.max(bob,Math.abs(A.pos.y-top-fl));}
  T.keys.add('KeyC');step(150);const dv=top-A.pos.y;const dw=A.wet;T.keys.delete('KeyC');
  let t=0;while(t<600&&Math.abs(A.pos.y-top-fl)>0.05){step(1);t++;}
  // a stroke at the surface
  let hi=A.pos.y;T.keys.add('Space');step(1);T.keys.delete('Space');for(let i=0;i<60;i++){step(1);hi=Math.max(hi,A.pos.y);}
  console.log(who.padEnd(6),'floats at',fl.toFixed(2),'(wet',A.wet+') bob',bob.toFixed(3),'| 2.5s diving: down',dv.toFixed(1),'wet',dw,'| back up in',(t/60).toFixed(1)+'s | stroke rises',(hi-top-fl).toFixed(2));
}
T.setGobP(A,false);A.who=0;
console.log('done');
`);
process.exit(0);
