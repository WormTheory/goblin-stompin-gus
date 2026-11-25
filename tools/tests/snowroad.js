// Roads in the snow (roadLanes, render/meshing.js): a road's top faces carry where across the road each corner is, as a
// number below zero in aSky, so the snow's shader can leave the traffic's ruts. Checked on a town street, where streets
// meet, a column smashed open since the snow came, a highway across the plains, and with it switched off.
const {T,E,els,pads,run,errs}=require('./harness.js')();
const ok=[];const chk=(n,v,x)=>{ok.push(!!v);console.log(n,v?'ok':'BAD',x===undefined?'':x);};
for(const f of els.play.L.click)f();pads.length=0;run(0.5);
const {CELL,CS,G}=T,P=T.players[0];
// every top face at the road's level in a chunk: its column and its four corners' aSky, by corner
function tops(cx,cz,y){T.buildChunk(cx,cz);const e=T.meshes.get(T.ckey(cx,cz)),out=new Map();
  for(const m of e.m){const g=m.geometry,p=g.attributes.position.array,k=g.attributes.aSky.array;
    for(let q=0;q+3<k.length;q+=4){let flat=true,x0=1e9,z0=1e9;for(let v=q;v<q+4;v++){if(p[v*3+1]!==y+1)flat=false;x0=Math.min(x0,p[v*3]);z0=Math.min(z0,p[v*3+2]);}
      if(!flat)continue;const c={};for(let v=q;v<q+4;v++)c[(p[v*3]-x0)+','+(p[v*3+2]-z0)]=k[v];out.set(x0+','+z0,c);}}
  return out;}
// a crossroads near the start, with a street running on from it along z
let J=null;for(let r=0;r<12&&!J;r++)for(let i=-r;i<=r&&!J;i++)for(let j=-r;j<=r;j++){const px=Math.floor(P.pos.x/CELL)+i,pz=Math.floor(P.pos.z/CELL)+j;
  if(T.jDeg(px,pz)>=4&&T.segOpen(px,pz,0)){let str=true;for(let x=0;x<8;x++)if(T.get(px*CELL+x,G,pz*CELL+18)===T.SIDEWALK||T.get(px*CELL+x,G+1,pz*CELL+18)!==T.AIR)str=false;
    if(str&&T.get(px*CELL-1,G,pz*CELL+18)===T.SIDEWALK&&T.get(px*CELL+8,G,pz*CELL+18)===T.SIDEWALK){J=[px,pz];break;}}}
chk('found a street off a crossroads',!!J,J);
if(J){const X=J[0]*CELL,Z=J[1]*CELL+18,cz=Math.floor(Z/CS);
  const A=tops(Math.floor(X/CS),cz,G);let good=true,row=[];
  for(let i=0;i<8;i++){const c=A.get((X+i)+','+Z);if(!c){good=false;break;}const a=-c['0,0']-1,b=-c['1,0']-1;row.push(a);if(Math.abs(a-Math.min(i,8-i))>0.01||Math.abs(b-Math.min(i+1,7-i))>0.01)good=false;}
  chk('across a street: 0 at each kerb up to 4 in the middle',good,row.join(' '));
  const sw=A.get((X-1)+','+Z)||tops(Math.floor((X-1)/CS),cz,G).get((X-1)+','+Z);
  chk('the pavement beside it is ordinary ground',sw&&sw['0,0']===1,sw&&sw['0,0']);
  // where the streets meet: churned right across (never more than 2.4, so no ridge of snow down the middle)
  const B=tops(Math.floor((X+4)/CS),Math.floor((J[1]*CELL+4)/CS),G),m=B.get((X+4)+','+(J[1]*CELL+4));
  chk('the middle of the crossroads is churned',m&&m['0,0']<=-3.39&&m['0,0']>=-3.41,m&&m['0,0']);
  // a column whose top changed since the snow came keeps its own time, as before
  T.snowBorn.set(T.colKey(X+2,Z),5);const C=tops(Math.floor(X/CS),cz,G).get((X+2)+','+Z);T.snowBorn.delete(T.colKey(X+2,Z));
  chk('a column smashed open since the snow came is left as it was',C&&C['0,0']===6,C&&C['0,0']);
  // switched off: nothing below zero
  T.snowRoads=false;const D=tops(Math.floor(X/CS),cz,G);let neg=0;for(const c of D.values())for(const k in c)if(c[k]<0)neg++;T.snowRoads=true;
  chk('switched off, no road says anything',neg===0,neg);
  // what it costs a chunk's rebuild
  const cx=Math.floor(X/CS),time=()=>{const t=process.hrtime.bigint();for(let n=0;n<60;n++)T.buildChunk(cx,cz);return Number(process.hrtime.bigint()-t)/60e6;};
  time();const on=time();T.snowRoads=false;time();const off=time();T.snowRoads=true;T.buildChunk(cx,cz);
  console.log('a street chunk rebuilt: '+on.toFixed(2)+' ms with, '+off.toFixed(2)+' ms without');
  chk('under half a millisecond a chunk',on-off<0.5);}
// a highway across the plains: by the plan's own distance from its middle, lanes of 3
{const o=P.pos,L=T.routesNearBox(o.x-3000,o.z-3000,o.x+3000,o.z+3000);let R=null;for(let q=0;q<L.length;q+=2)if(L[q].kind==='country'&&L[q].L>400){R=L[q];break;}
  chk('found a country highway',!!R);
  if(R){const A=T.rtPoint(R,R.L/2),x=Math.floor(A.x),z=Math.floor(A.z),M=tops(Math.floor(x/CS),Math.floor(z/CS),G),c=M.get(x+','+z);
    const n=T.nearestOn(T.routesNearBox(x,z,x,z),x,z,9),want=n?Math.min(8,n.d*4/3):-1;
    chk('its middle goes by the distance from the line',c&&n&&Math.abs(-c['0,0']-1-want)<0.01,c&&[c['0,0'],want.toFixed(2)]);
    let far=0,all=0;for(const c of M.values())for(const k in c)if(c[k]<0){all++;if(c[k]<-9.01)far++;}
    chk('all of it in lanes, none of it open tarmac',all>50&&far===0,[all,far]);}}
console.log('errors',errs.length,errs.slice(0,4));
const pass=ok.every(Boolean)&&!errs.length;console.log(pass?'all ok':'FAILED');process.exit(pass?0:1);
