// The cross-browser determinism check's worker (crossdet.html): the World Generator's stand-ins for three.js and the page
// (gen-worker.js, loaded as it is), then the game evaluated with genChunk reachable, and a hash of each chunk in a fixed
// list, so two browsers' answers can be compared (they must be the same to the block: plan section 13).
importScripts('../../game/WorldGen/gen-worker.js');
const DN=['genChunk','CS','H','seed','reliefNat','plainsH','climateAt'];
function loadDet(html,seedV){
  WSEED=seedV;
  const a=html.indexOf('three.min.js'),i=html.indexOf('<script>',a)+8;let src=html.slice(i,html.indexOf('</script>',i));
  src=src.replace(/requestAnimationFrame\(frame\);\s*\}\)\(\);\s*$/,'window.__d={};'+DN.map(n=>`try{if(typeof ${n}!=='undefined')window.__d.${n}=${n};}catch(e){}`).join('')+'\n})();');
  const rf=self.fetch;self.fetch=()=>new Promise(()=>{});(0,eval)(src);self.fetch=rf;return self.__d;}
// (FNV-1a over the chunk's blocks)
function hash(a){let h=2166136261>>>0;for(let i=0;i<a.length;i++){h^=a[i]&255;h=Math.imul(h,16777619)>>>0;h^=(a[i]>>8)&255;h=Math.imul(h,16777619)>>>0;}return ('0000000'+h.toString(16)).slice(-8);}
self.onmessage=e=>{const {html,seed:sd,chunks}=e.data;const D=loadDet(html,sd),out=[];const t0=performance.now();
  for(const [cx,cz] of chunks)out.push([cx,cz,hash(D.genChunk(cx,cz))]);
  // (and a few of the landscape's numbers straight, to the last bit)
  const nums=[];for(let k=0;k<200;k++){const x=k*7919-500000,z=k*104729%900000-450000;nums.push(D.reliefNat(x,z),D.plainsH(x,z),D.climateAt(x,z).t);}
  let nh=2166136261>>>0;const f=new Float64Array(nums),b=new Uint8Array(f.buffer);for(const v of b){nh^=v;nh=Math.imul(nh,16777619)>>>0;}
  self.postMessage({out,nums:('0000000'+nh.toString(16)).slice(-8),ms:Math.round(performance.now()-t0)});};
