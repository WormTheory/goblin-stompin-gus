// Which buildings with people in them have no bathroom? node wcaudit.js [radius in plots]
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={wcRooms,');
eval(hdr+`
eval(src);const T=window.__t,R=+(process.argv[2]||150),seen=new Set(),O={};
for(let x=-R;x<=R;x++)for(let z=-R;z<=R;z++){const s=T.superOf(x,z),ax=s?s.ax:x,az=s?s.az:z,P=T.plotInfo(ax,az);
  P.b.forEach((b,i)=>{const k=ax+','+az+','+i;if(seen.has(k)||b.noIndoor)return;seen.add(k);
    const I=b.x1-b.x0-2,J=b.z1-b.z0-2,fl=1,L=T.wcRooms(b,I,J,0,b.x0,b.z0,fl,b.x1,b.z1,ax,az);
    const name=(s?s.kind:P.type)+'/'+(b.style||'')+'/'+b.ground+'/'+b.kind,E=O[name]||(O[name]={n:0,no:0,w:0,d:0});E.n++;if(!L.length){E.no++;E.w=b.x1-b.x0;E.d=b.z1-b.z0;}});}
console.log('NONE ON THE GROUND FLOOR');Object.entries(O).filter(e=>e[1].no).sort((a,c)=>c[1].no-a[1].no).forEach(([k,E])=>console.log(String(E.no).padStart(5),'of',String(E.n).padStart(5),k,'e.g.',E.w+'x'+E.d));
`);
process.exit(0);
