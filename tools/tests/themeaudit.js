// Are the theme parks whole? For every park within a radius: which of its blocks really are park, and is each ride's ground there. node themeaudit.js [radius in plots]
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,get:get,METAL,PLANKS,plotType,biomeOf,setType,coasterH,');
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0,R=+(process.argv[2]||300);
const seen=new Map(),sg=process.env.REV?-1:1;for(let x=-R;x<=R;x++)for(let z=-R;z<=R;z++){const q=T.superOf(sg*x,sg*z);if(q&&q.kind==='theme')seen.set(q.ax+','+q.az,q);}
let whole=0,noPlan=0;const rows=[];
for(const S of seen.values()){const X0=S.ax*32,Z0=S.az*32;let park=0,plains=0;const other={};
 for(let a=0;a<S.w;a++)for(let b=0;b<S.h;b++){const q=T.superOf(S.ax+a,S.az+b),t=T.plotType(S.ax+a,S.az+b);if(T.biomeOf(S.ax+a,S.az+b)==='plains')plains++;if(q===S&&t==='super')park++;else other[t]=(other[t]||0)+1;}
 const P=T.plotInfo(S.ax,S.az),Rd=P.theme;if(!Rd){noPlan++;rows.push([S.ax,S.az,'no plan: first block is',T.plotType(S.ax,S.az),'park blocks',park+'/64',JSON.stringify(other)].join(' '));continue;}
 const C=Rd.coaster,W=Rd.wheel,C2=Rd.carousel,N=240;let track=0,legs=0;
 for(let i=0;i<N;i++){const t=i/N*Math.PI*2,x=Math.floor(X0+C.cu+Math.cos(t)*C.a),z=Math.floor(Z0+C.cv+Math.sin(t)*C.b),h=G0+T.coasterH(t);let f=0;for(let dx=-1;dx<=1&&!f;dx++)for(let dz=-1;dz<=1&&!f;dz++)for(let y=h-1;y<=h+1;y++)if(T.get(x+dx,y,z+dz)===T.METAL){f=1;break;}track+=f;}
 for(const dz of [-2,2])for(let y=G0+1;y<W.hub;y++)for(const sd of [-1,1])if(T.get(X0+W.cu+sd*Math.round((W.hub-y)*.42),y,Z0+W.cv+dz)===T.METAL)legs++;
 const legN=4*(W.hub-G0-1),car=T.get(X0+C2.cu,G0,Z0+C2.cv)===T.PLANKS,ok=park===64&&track===N&&legs===legN&&car;if(ok)whole++;
 rows.push([S.ax,S.az,ok?'WHOLE':'part',T.setType(S.ax+4,S.az+4),'park blocks',park+'/64','plains',plains,'track',track+'/'+N,'wheel legs',legs+'/'+legN,'carousel',car,Object.keys(other).length?JSON.stringify(other):''].join(' '));}
console.log('world seed',process.env.SEED||1,'radius',R,'parks',seen.size,'whole',whole,'no plan',noPlan);
for(const r of rows)if(process.env.ALL||!r.includes('WHOLE'))console.log(' ',r);
`);
process.exit(0);
