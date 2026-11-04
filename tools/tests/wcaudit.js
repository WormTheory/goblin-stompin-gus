// Which buildings with people in them have no bathroom? node wcaudit.js [radius in plots]
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={wcRooms,doorRects,DOORIDS,stadiumDoors,');
eval(hdr+`
eval(src);const T=window.__t,R=+(process.argv[2]||150),seen=new Set(),O={};
for(let x=-R;x<=R;x++)for(let z=-R;z<=R;z++){const s=T.superOf(x,z),ax=s?s.ax:x,az=s?s.az:z,P=T.plotInfo(ax,az);
  P.b.forEach((b,i)=>{const k=ax+','+az+','+i;if(seen.has(k)||b.noIndoor)return;seen.add(k);
    const I=b.x1-b.x0-2,J=b.z1-b.z0-2,fl=1,L=T.wcRooms(b,I,J,0,b.x0,b.z0,fl,b.x1,b.z1,ax,az);
    const name=(s?s.kind:P.type)+'/'+(b.style||'')+'/'+b.ground+'/'+b.kind,E=O[name]||(O[name]={n:0,no:0,w:0,d:0,maxS:0,c:0});E.n++;E.c+=L.length;const sh=L.reduce((a,R)=>a+(R.u1-R.u0)*(R.v1-R.v0),0)/(I*J);if(sh>E.maxS)E.maxS=sh;if(!L.length){E.no++;E.w=b.x1-b.x0;E.d=b.z1-b.z0;}});}
// is every bathroom door really there, with room to walk on both sides?
{const Rd=+(process.argv[3]||40),bad={},cnt={};let n=0;const seenD=new Set();const chk=(k,D)=>{cnt[k]=(cnt[k]||0)+1;const y=D.y,al=D.ax==='x',x=al?D.a0:D.c,z=al?D.c:D.a0;const id=T.get(x,y,z);const fr=[-1,1].map(s=>{const X=al?x:x+s,Z=al?z+s:z;return !T.get(X,y,Z)&&!T.get(X,y+1,Z);});const why=!T.DOORIDS.has(id)?'no door block ('+id+')':!fr[0]||!fr[1]?'blocked side':null;if(why){(bad[k]=bad[k]||[]).push(why+' '+x+','+y+','+z);}};
for(let x=-Rd;x<=Rd;x++)for(let z=-Rd;z<=Rd;z++){const s=T.superOf(x,z),ax=s?s.ax:x,az=s?s.az:z;const k0=ax+','+az;if(seenD.has(k0))continue;seenD.add(k0);const P=T.plotInfo(ax,az);if(s&&s.kind==='stadium')T.stadiumDoors(s).forEach(D=>chk('stadium',D));P.b.forEach(b=>{for(const D of T.doorRects(b,ax,az))if(D.wc)chk((s?s.kind:P.type)+'/'+(b.style||'')+'/'+b.ground,D);});}
const tot=Object.values(cnt).reduce((a,c)=>a+c,0),nb=Object.values(bad).reduce((a,c)=>a+c.length,0);console.log('BATHROOM DOORS',tot,'with a problem',nb);Object.entries(bad).sort((a,c)=>c[1].length-a[1].length).slice(0,25).forEach(([k,L])=>console.log(String(L.length).padStart(5),'of',cnt[k],k,L[0]));}
console.log('LARGEST SHARE OF THE GROUND FLOOR');Object.entries(O).filter(e=>e[1].maxS>0).sort((a,c)=>c[1].maxS-a[1].maxS).slice(0,16).forEach(([k,E])=>console.log(String(Math.round(E.maxS*100)).padStart(4)+'%',k,'rooms per building',(E.c/E.n).toFixed(1)));
console.log('NONE ON THE GROUND FLOOR');Object.entries(O).filter(e=>e[1].no).sort((a,c)=>c[1].no-a[1].no).forEach(([k,E])=>console.log(String(E.no).padStart(5),'of',String(E.n).padStart(5),k,'e.g.',E.w+'x'+E.d));
`);
process.exit(0);
