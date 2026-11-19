// ---------- Lights out: a building that counts as destroyed, or has come down, goes dark ----------
// Its glowing blocks (windows, neon, lamps, screens) stop glowing at night and stop lighting what's round them (buildChunk and
// blkEmitters ask bldgDarkAt), its shop signs go dark (refreshBrandSigns), and pieces of it falling never glow (buildBodyMesh).
// It's worked out from `destroyed` and `collapses`, which are saved and sent online, so it's the same on every machine and after
// loading. BL_DARK (world/places.js) holds the buildings found dark so far; it's only ever added to, a few a frame.
let bdSeed=null,bdT=0,bdNC=-1;const bdSeen=new Map();
function bldgOfKey(key){
  const a=String(key).split(',');if(a.length!==3)return null;const px=+a[0],pz=+a[1],i=+a[2];
  if(!Number.isInteger(px)||!Number.isInteger(pz)||!Number.isInteger(i))return null;
  const b=plotInfo(px,pz).b[i];return b?{b,px,pz,key}:null;
}
function bldgDarkTick(dt){
  if(bdSeed!==seed){bdSeed=seed;BL_DARK.clear();bdSeen.clear();bdNC=-1;}
  if((bdT-=dt)>0)return;bdT=0.4;
  // (brought down to its first floor or so: dark at once)
  const nc=Object.keys(collapses).length;
  if(nc!==bdNC){bdNC=nc;for(const k in collapses)if(!BL_DARK.has(k)&&collapses[k]<=G+FH+1){const B=bldgOfKey(k);if(B)bldgGoDark(B);}}
  // (knocked about until it counts as destroyed: asked again only when its count has moved, and a few a time)
  let n=0;
  for(const k in destroyed){if(BL_DARK.has(k))continue;const v=destroyed[k];if(bdSeen.get(k)===v)continue;bdSeen.set(k,v);
    const B=bldgOfKey(k);if(!B)continue;if(!bldgStanding(B.b,B.px,B.pz,k))bldgGoDark(B);if(++n>=4)break;}
}
function bldgGoDark(B){
  BL_DARK.add(B.key);
  // (its chunks meshed again, and those its lights reached)
  const X0=B.px*CELL,Z0=B.pz*CELL,ch=new Set(),r=BL_ON?15:0;
  for(let cx=Math.floor((X0+B.b.x0-r)/CS);cx<=Math.floor((X0+B.b.x1+r)/CS);cx++)for(let cz=Math.floor((Z0+B.b.z0-r)/CS);cz<=Math.floor((Z0+B.b.z1+r)/CS);cz++){
    const k=ckey(cx,cz),A=chunks.get(k);if(!A)continue;A.blkE=null;if(meshes.has(k))ch.add(k);}
  if(ch.size)rebuildSet(ch);
}
// is the block at this column (above the street) part of a building gone dark? (c: a per-chunk cache of answers, or null)
function bldgDarkAt(x,z){
  if(!BL_DARK.size||x>=SHIP_X0)return false;const B=bldgAt(x,z);return !!B&&BL_DARK.has(B.key);
}
