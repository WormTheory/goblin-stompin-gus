// How often each big site lands in a world: node sitecount.js [radius in plots]
const fs=require('fs');
let hdr=fs.readFileSync('stt.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={bigPlainsAt,superOf,');
eval(hdr+`
eval(src);
const T=window.__t,R=+(process.argv[2]||300),seen=new Map();
for(let x=-R;x<=R;x++)for(let z=-R;z<=R;z++){const B=T.bigPlainsAt(x,z)||T.superOf(x,z);if(B)seen.set(B.kind+B.ax+','+B.az,B);}
const c={};for(const B of seen.values())c[B.kind+' '+B.w+'x'+B.h]=(c[B.kind+' '+B.w+'x'+B.h]||0)+1;
console.log('world seed',process.env.SEED||1,'radius',R,JSON.stringify(Object.fromEntries(Object.entries(c).sort())));
`);
process.exit(0);
