// Coasts by biome (world/coast.js, coastFlav): for each flavour of shore (sand, shingle in the cold, an ice shelf where
// it's frozen, mangroves where it's warm and wet, the badlands' red sand) and for a rugged shore, the nearest few stretches
// of natural coast to the start, and what's really built there out of the generated blocks: sea ice and how far out it
// reaches, mud and mangrove wood, shingle, red sand, and how high the land stands within 10 blocks of the water (cliffs).
// node coastbio.js [spots per kind]
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,coastFlav,coastD,get CF_RC(){return CF_RC},coastType,get,landTop,BL:{PACKICE,MUD,LOG,LEAVES,GRAVEL,COBBLE,SAND,RED_SAND,SNOW,STONE,MOSSSTONE,WATER,AIR,GRASS},');
const errs=[];{const ce=console.error;console.error=(...a)=>{errs.push(a.map(String).join(" ").slice(0,200));};}
const K=+(process.argv[2]||3);
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0,B=T.BL;
// natural coast spots: coastD near 0 on a plain shore plot, flavour by coastFlav; rugged ones apart
const found={0:[],1:[],2:[],3:[],4:[],rug:[]},N=['sand','shingle','ice shelf','mangroves','red sand'];
const full=()=>Object.values(found).every(a=>a.length>=K);
for(let r=1;r<=700&&!full();r++)for(let i=-r;i<=r&&!full();i++)for(const [a,b] of [[i,-r],[i,r],[-r,i],[r,i]]){
  const x=a*160,z=b*160,cd=T.coastD(x,z);if(cd<-3||cd>3)continue;
  const px=Math.floor(x/32),pz=Math.floor(z/32),t=T.coastType(px,pz);if(t!=='shore'&&t!=='sea')continue;
  const f=T.coastFlav(x,z),rg=T.CF_RC;
  if(rg>0.7){if(found.rug.length<K&&!found.rug.some(p=>Math.abs(p[0]-x)+Math.abs(p[1]-z)<3000))found.rug.push([x,z,f]);continue;}
  if(rg>0)continue;
  if(found[f].length<K&&!found[f].some(p=>Math.abs(p[0]-x)+Math.abs(p[1]-z)<3000))found[f].push([x,z,f]);}
// what's built round a spot: a 40 x 40 square of columns
function survey(x0,z0){const c={};let iceOut=0,cliff=0,land=0,sea=0;
  for(let dx=-20;dx<20;dx++)for(let dz=-20;dz<20;dz++){const x=x0+dx,z=z0+dz,cd=T.coastD(x,z);
    for(let y=G0-4;y<=G0+30;y++){const b=T.get(x,y,z);if(b)c[b]=(c[b]||0)+1;}
    if(T.get(x,G0,z)===B.PACKICE&&cd>iceOut)iceOut=cd;
    if(cd<-1&&cd>-10){let y=G0+40;while(y>G0-3&&!T.get(x,y,z))y--;land++;if(y-G0>cliff)cliff=y-G0;}
    if(cd>1)sea++;}
  const g=k=>c[B[k]]||0;
  return 'ice '+g('PACKICE')+' (out to '+iceOut.toFixed(0)+') snow '+g('SNOW')+' mud '+g('MUD')+' wood '+g('LOG')+' leaves '+g('LEAVES')+' gravel '+g('GRAVEL')+' cobble '+g('COBBLE')+' sand '+g('SAND')+' red sand '+g('RED_SAND')+' stone '+(g('STONE')+g('MOSSSTONE'))+' | land within 10 of the water up to +'+cliff;}
for(const k of [0,1,2,3,4,'rug']){const nm=k==='rug'?'rugged':N[k];
  if(!found[k].length){console.log(nm.padEnd(10),'none found');continue;}
  for(const [x,z,f] of found[k])console.log(nm.padEnd(10),(x+','+z).padEnd(14),(k==='rug'?'('+N[f]+') ':'')+survey(x,z));}
console.log('errors',errs.length,errs.slice(0,3).join(' | '));
`);
process.exit(0);
