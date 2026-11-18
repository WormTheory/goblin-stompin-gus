// One-time move (Nov 2026): each animation's whole-pose keys ({t, v:[every channel], e}) become a track of keys per
// channel ({tracks:{arm:[[u,value,ease?],...], ...}}), so each channel can be keyed on its own. Every key is kept on every
// channel except where a channel just holds still through it (the same value as the keys either side, so taking it out
// changes nothing), and a channel that never moves keeps one key. It then proves each clip poses exactly as it did, at
// every key and every 1/1000 of u, and that the blow's swing (strikeSwing: the last key before 1) is the same.
//   node tools/assets/split_tracks.js
const fs=require('fs'),path=require('path'),A=require('./asset-format.js');
const D=path.join(A.ROOT,'src/assets/clips');
// (the old sums, from strikes.js before the move: a whole pose from the keys either side)
function oldAt(keys,u){u=Math.max(0,Math.min(2,u));let i=1;while(i<keys.length-1&&keys[i].t<u)i++;
  const a=keys[i-1],b=keys[i],s=Math.max(0,Math.min(1,(u-a.t)/(b.t-a.t))),e=b.e,k=e==='i'?s*s:e==='o'?1-(1-s)*(1-s):s*s*(3-2*s);
  return a.v.map((x,j)=>Math.fround(x+(b.v[j]-x)*k));}
const oldSwing=keys=>{let u=0;for(const k of keys)if(k.t<1)u=k.t;return 1-u;};
const order=JSON.parse(fs.readFileSync(path.join(D,'_order.json'),'utf8')).order;let bad=0;
for(const n of order){
  const f=path.join(D,n+'.json'),c=JSON.parse(fs.readFileSync(f,'utf8'));
  if(!c.keys){console.log(n,'already moved');continue;}
  const K=c.keys,L=A.ASSET_LAYOUTS[c.layout],nch=K[0].v.length,tracks={};
  for(let j=0;j<nch;j++){
    let T=K.map(k=>{const q=[k.t,k.v[j]];if(k.e)q.push(k.e);return q;});
    T=T.filter((q,i)=>i===0||i===T.length-1||!(T[i-1][1]===q[1]&&T[i+1][1]===q[1]));   // (holding still through it)
    if(T.every(q=>q[1]===T[0][1]))T=[[T[0][0],T[0][1]]];                                 // (never moves)
    tracks[L.ch[j][0]]=T;}
  const o={};for(const k in c){if(k==='keys')o.tracks=tracks;else o[k]=c[k];}
  // (the proof: the new sums against the old, as the game stores them, Float32)
  const C=A.assetClip(o);let worst=0;
  const us=[...K.map(k=>k.t)];for(let i=0;i<=2000;i++)us.push(i/1000);
  for(const u of us){const a=oldAt(K,u),b=A.assetPoseAt(o,u).map(Math.fround);for(let j=0;j<nch;j++)worst=Math.max(worst,Math.abs(a[j]-b[j]));}
  let sw=0;for(const T of C)for(const q of T)if(q[0]<1&&q[0]>sw)sw=q[0];
  const E=A.assetCheck('clips',n,o),ok=worst===0&&1-sw===oldSwing(K)&&!E.length;if(!ok)bad++;
  fs.writeFileSync(f,A.fmt(o));
  console.log(n.padEnd(10),ok?'same':'DIFFERENT','| worst',worst,'| swing',+(1-sw).toFixed(4),'| keys',K.length,'x',nch,'->',Object.values(tracks).map(T=>T.length).join(','),E.length?'| '+E.join('; '):'');
}
console.log(bad?bad+' clips DIFFERENT':'every clip poses exactly as before');
