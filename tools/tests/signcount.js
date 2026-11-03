// Which buildings carry more than one sign, and where? node signcount.js [radius in plots]
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={brandSpots,');
eval(hdr+`
eval(src);const T=window.__t,R=+(process.argv[2]||150),seen=new Set(),O={};
for(let x=-R;x<=R;x++)for(let z=-R;z<=R;z++){const s=T.superOf(x,z),ax=s?s.ax:x,az=s?s.az:z,P=T.plotInfo(ax,az);
  P.b.forEach((b,i)=>{const k=ax+','+az+','+i;if(seen.has(k))return;seen.add(k);if(!b.brand&&!b.signCat)return;
    let L=[];try{L=T.brandSpots(b,ax,az)||[];}catch(e){}
    const name=(s?s.kind:P.type)+'/'+(b.signCat||'-')+'/'+(b.style||'')+(b.porch?'/porch':'');const E=O[name]||(O[name]={n:0,hist:{}});E.n++;E.hist[L.length]=(E.hist[L.length]||0)+1;});}
Object.entries(O).sort().forEach(([k,E])=>console.log(k.padEnd(40),E.n,JSON.stringify(E.hist)));
`);
process.exit(0);
