// Which buildings have more than one floor and no stairs? node stairaudit.js [radius in plots]
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={stairFloors,');
eval(hdr+`
eval(src);const T=window.__t,R=+(process.argv[2]||160),seen=new Set(),miss={},have={};
for(let x=-R;x<=R;x++)for(let z=-R;z<=R;z++){const s=T.superOf(x,z),ax=s?s.ax:x,az=s?s.az:z,P=T.plotInfo(ax,az);
  P.b.forEach((b,i)=>{const k=ax+','+az+','+i;if(seen.has(k))return;seen.add(k);
    const gf0=b.gf||5,floors=b.detailTop===undefined?0:T.stairFloors(b).length;if(floors<2||b.noIndoor||b.top-44<gf0+5||b.detailTop<44+gf0+3)return;
    const name=(s?s.kind:P.type)+'/'+(b.style||'normal')+'/'+b.ground+'/'+b.kind;const O=b.stair?have:miss;const E=O[name]||(O[name]={n:0,w:[1e9,0],d:[1e9,0],f:[1e9,0],gf:[1e9,0]});E.n++;
    const put=(a,v)=>{a[0]=Math.min(a[0],v);a[1]=Math.max(a[1],v);};put(E.w,b.x1-b.x0);put(E.d,b.z1-b.z0);put(E.f,floors);put(E.gf,b.gf||5);});}
const show=O=>Object.entries(O).sort((a,c)=>c[1].n-a[1].n).forEach(([k,E])=>console.log(String(E.n).padStart(6),k,'w',E.w.join('-'),'d',E.d.join('-'),'floors',E.f.join('-'),'gf',E.gf.join('-')));
console.log('NO STAIRS');show(miss);console.log('HAS STAIRS');show(have);
`);
process.exit(0);
