// What's on the coast, and does it belong to the right kind of place? node coastaudit.js [radius in plots]
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={setKind,setFront,cityPort,coastOwner,settlementLat,coastType,seaPlot,coastProps,SET_SP,');
eval(hdr+`
eval(src);const T=window.__t,R=+(process.argv[2]||600),K={},O={},types={};
const G2=Math.ceil(R/T.SET_SP);
for(let a=-G2;a<=G2;a++)for(let b=-G2;b<=G2;b++){const S=T.settlementLat(a,b),k=T.setKind(S);K[k]=(K[k]||0)+1;}
for(let x=-R;x<=R;x++)for(let z=-R;z<=R;z++){if(!T.seaPlot(x,z))continue;const t=T.coastType(x,z);types[t]=(types[t]||0)+1;
  if(t==='yard'||t==='harbor'||t==='beach'){const S=T.coastOwner(x,z),k=t+' of '+(S?T.setKind(S):'nothing');O[k]=(O[k]||0)+1;
    if(S&&T.setKind(S)!=='village'){const e=S._has||(S._has={});e[t]=(e[t]||0)+1;}}}
console.log('places by kind',JSON.stringify(K));console.log('coast blocks',JSON.stringify(types));
Object.entries(O).sort().forEach(([k,v])=>console.log(String(v).padStart(6),k));
const has={};for(let a=-G2;a<=G2;a++)for(let b=-G2;b<=G2;b++){const S=T.settlementLat(a,b),k=T.setKind(S);if(!['coastcity','harbortown','resort','fishing'].includes(k))continue;if(Math.abs(S.cx)>R-30||Math.abs(S.cz)>R-30)continue;const h=S._has||{},q=(h.yard?'port ':'')+(h.harbor?'docks ':'')+(h.beach?'beach':'');const e=k+': '+(q||'nothing');has[e]=(has[e]||0)+1;}
console.log('what each place has');Object.entries(has).sort().forEach(([k,v])=>console.log(String(v).padStart(6),k));
`);
process.exit(0);
