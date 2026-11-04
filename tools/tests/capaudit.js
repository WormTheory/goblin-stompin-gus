// The capitol: can you walk to every room on every floor, are its doors really there and really drawn, and is any prop stuck in
// a wall or blocking a door? node capaudit.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={capitolPlan,capGeo,capPlan,capitolAt,doorRects,DOORIDS,roomProps,refreshDoors,doorsOn,get,players,genChunk,chunks,PROPS,');
eval(hdr+`
eval(src);const T=window.__t,S=T.capitolPlan();
console.log('capitol plots',S.ax,S.az);
const P=T.plotInfo(S.ax,S.az),b=P.b[0],g=T.capGeo(),X0=S.ax*CELLS+PL,Z0=S.az*CELLS+PL;
const at=(s,a,w)=>[X0+(s?g.c+a:g.c-1-a),Z0+g.bf+w];
// (read straight from the plan's own function, so nothing has to be generated)
const id=(x,y,z)=>{const yy=y;return T.capitolAt(b,x-S.ax*CELLS,z-S.az*CELLS,yy);};
const GY=44,solid=v=>v&&!T.DOORIDS.has(v);
// walk the storeys from the great doors: floors joined by the stairs count as reached if each flight's foot is reached
let tot=0;
const stairs=[[0,29],[1,29]];
for(let f=0;f<4;f++){
  const y=GY+4+5*f,seen=new Set(),q=[];
  const free=(x,z)=>x>=X0+g.c-39&&x<X0+g.c+39&&z>=Z0+g.bf&&z<Z0+g.back-1&&!solid(id(x,y,z))&&!solid(id(x,y+1,z));
  // (start: in the rotunda on the ground floor, by the stair hall on the ones above)
  const [sx,sz]=f?at(0,26,4):[X0+g.c,Z0+g.bf+5];q.push([sx,sz]);seen.add(sx+','+sz);
  while(q.length){const [x,z]=q.pop();for(const [d,e] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+d)+','+(z+e);if(!seen.has(k)&&free(x+d,z+e)){seen.add(k);q.push([x+d,z+e]);}}}
  let shut=0,ex=[];for(let x=X0+g.c-39;x<X0+g.c+39;x++)for(let z=Z0+g.bf;z<Z0+g.back-1;z++)if(free(x,z)&&!seen.has(x+','+z)){shut++;if(ex.length<4)ex.push((x-X0-g.c)+','+(z-Z0-g.bf));}
  console.log('floor',f,'reached',seen.size,'cut off',shut,ex.join(' '));
}
// doors
{const R=T.doorRects(b,S.ax,S.az);let bad=[];for(const D of R){const al=D.ax==='x',mid=Math.floor((D.a0+D.a1)/2),x=al?mid:D.c,z=al?D.c:mid,v=id(x,D.y,z);const A=[-1,1].map(s=>!solid(id(al?x:x+s,D.y,al?z+s:z))&&!solid(id(al?x:x+s,D.y+1,al?z+s:z)));
  if(!T.DOORIDS.has(v)||!A[0]||!A[1])bad.push(D.key+' block '+v+' sides '+A);}
 console.log('DOORS',R.length,'with a problem',bad.length);bad.slice(0,12).forEach(s=>console.log(' ',s));}
// props: what's on each floor, any inside a wall, any within reach of a door's way through
{const Dr=T.doorRects(b,S.ax,S.az);for(let f=0;f<4;f++){const L=T.roomProps(b,S.ax,S.az,f),y=GY+4+5*f,types={};let inwall=[],blocking=[];
  for(const p of L){types[p.type]=(types[p.type]||0)+1;if(!T.PROPS[p.type])inwall.push('no model '+p.type);const fy=p.base||y;if(solid(id(Math.floor(p.x),fy,Math.floor(p.z))))inwall.push(p.type+' '+(p.x-X0-g.c).toFixed(1)+','+(p.z-Z0-g.bf).toFixed(1));
    if(!p.low)for(const D of Dr){if(D.y!==y)continue;const al=D.ax==='x',mx=(D.a0+D.a1)/2,dx=al?p.x-mx:p.x-(D.c+.5),dz=al?p.z-(D.c+.5):p.z-mx;if(Math.hypot(dx,dz)<1.3+(D.a1-D.a0)/2-.5)blocking.push(p.type+' by door '+D.key);}}
  console.log('floor',f,'props',L.length,'boxes',L.reduce((a,p)=>a+T.PROPS[p.type].length,0),'in a wall',inwall.length,'blocking a door',blocking.length);
  inwall.slice(0,10).forEach(s=>console.log('  wall',s));blocking.slice(0,10).forEach(s=>console.log('  door',s));
  console.log('  ',Object.entries(types).map(e=>e.join(' ')).join(', '));}}
// the bug that started this: stood at the back of the building, is the bathroom's door drawn?
{const p=T.players[0];const [x,z]=at(1,23,52);p.active=true;p.pos.x=x;p.pos.y=GY+4;p.pos.z=z;
 const cz=Math.floor(x/16),cx=0;T.refreshDoors();const on=[...T.doorsOn.keys()].filter(k=>k.startsWith(S.ax+','+S.az));console.log('from the back of the wing, doors drawn',on.length,on.filter(k=>k.includes('r0.1.23.54')).length?'bathroom door found':'BATHROOM DOOR MISSING');}
`.replace(/CELLS/g,'32').replace(/\bPL\b/g,'11'));
process.exit(0);
