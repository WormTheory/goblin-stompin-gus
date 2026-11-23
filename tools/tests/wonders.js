// The wilds' wonders (plan phase 4, world/wonders.js): the nearest of each kind to the start, built, and measured from its
// generated blocks: sea stacks and arches (how high, and open water under an arch's span), stone arches (open under the
// span), waterfalls (the drop and the water down it), the landmarks (giant's ribs, great tree, great baobab, wandering
// stone, standing stones), glaciers (sea ice up in cold mountains), fjord walls (how high the land stands at the water and
// how deep the water is right under it), tarns in the far view, and what where-you-are calls each. node wonders.js
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={G0:G,wdIn,wdArchAt,wdFallAt,wdLmAt,stackOf,ARCH_SP,FALL_SP,LM_SP,STK_SP,wonderNear,WD_NAME,coastD,coastFlav,get CF_RC(){return CF_RC},plainsH,climAt,clBlend,rlfSnow,nzNoise,farPonds,rlfInCell,rlfTarnAt,TARN_SP,PLAINS_OPEN,realmOf,BLK:{PACKICE,WATER,PAINT_WHITE,LOG,LEAVES,STONE,MOSSSTONE,SANDSTONE,TERRA,TERRA2,COAL,SNOW,GRASS},');
const errs=[];{const ce=console.error;console.error=(...a)=>{errs.push(a.map(String).join(" ").slice(0,200));};}
eval(hdr+`
eval(src);const T=window.__t,G0=T.G0,B=T.BLK;let now=1000;
const [A]=T.players;for(const f of els.play.L.click)f();pads.length=0;A.hp=1e6;A.hpMax=1e6;
const step=k=>{for(let i=0;i<k;i++){now+=16.7;T.frame(now);}};step(10);
const BN={};for(const k in B)BN[B[k]]=k;
const ring=(R,f)=>{for(let r=0;r<=R;r++)for(let i=-r;i<=r;i++)for(const [a,c] of (r?[[i,-r],[i,r],[-r,i],[r,i]]:[[0,0]])){const v=f(a,c);if(v)return v;}return null;};
// (blocks of the named kinds in a box)
const count=(x0,z0,x1,z1,y0,y1)=>{const c={};for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++){const b=T.get(x,y,z),k=BN[b];if(k)c[k]=(c[k]||0)+1;}return c;};
const js=o=>JSON.stringify(o).replace(/"/g,'');
// the landmarks: the nearest of each kind
const want=['ribs','tree','baobab','erratic','henge'],got={};
ring(60,(a,c)=>{const M=T.wdIn(a*T.LM_SP+1,c*T.LM_SP+1,T.LM_SP,T.wdLmAt);if(M&&!got[M.k])got[M.k]=M;return want.every(k=>got[k]);});
for(const k of want){const M=got[k];if(!M){console.log('landmark',k,'none found');continue;}
  const c=count(M.x-24,M.z-24,M.x+24,M.z+24,G0+M.h0+1,G0+M.h0+46);let top=0;for(let y=G0+M.h0+46;y>G0;y--){if(T.get(M.x,y,M.z)||T.get(M.x+1,y,M.z)){top=y-G0-M.h0;break;}}
  A.pos.set(M.x,G0+M.h0+30,M.z);console.log('landmark',k.padEnd(8),'at',M.x,M.z,'in',M.b,'ground',M.h0,'| top above it',top,'| blocks',js(c),'| label',T.wonderNear(M.x+3,M.z,40)&&T.WD_NAME[T.wonderNear(M.x+3,M.z,40).k]);}
// stone arches: the nearest three, and open air under the middle of the span
{let n=0;ring(40,(a,c)=>{const W=T.wdIn(a*T.ARCH_SP+1,c*T.ARCH_SP+1,T.ARCH_SP,T.wdArchAt);if(!W)return false;n++;
  let open=0,solid=0;for(let y=G0+W.h0+1;y<=G0+W.h0+W.H+1;y++){const b=T.get(W.x,y,W.z);if(b)solid++;else if(!solid)open++;}
  const leg=T.get(W.ax?W.x:W.x+W.L+1,G0+W.h0+2,W.ax?W.z+W.L+1:W.z);
  console.log('arch at',W.x,W.z,'in',W.b,'half-span',W.L,'height',W.H,'| under the middle: open',open,'then rock',solid,'| a leg',BN[leg]||leg);return n>=3;});}
// waterfalls: the nearest three: the drop, and the water in the fall, the stream and the pool
{let n=0;ring(40,(a,c)=>{const F=T.wdIn(a*T.FALL_SP+1,c*T.FALL_SP+1,T.FALL_SP,T.wdFallAt);if(!F)return false;n++;
  const ex=F.x+F.di*F.i0,ez=F.z+F.dj*F.i0;let fall=0,pool=0;
  for(let a2=F.i0+1;a2<=F.i1;a2++)for(let y=G0;y<=G0+F.top;y++)if(T.get(F.x+F.di*a2,y,F.z+F.dj*a2)===B.WATER)fall++;
  const px=F.x+F.di*(F.i1+2),pz=F.z+F.dj*(F.i1+2);for(let y=G0-4;y<=G0+F.top;y++)if(T.get(px,y,pz)===B.WATER)pool++;
  console.log('waterfall at',ex,ez,'drop',F.top-F.bot,'(from',F.top,'to',F.bot+')','| water down the face',fall,'| in the pool at its foot',pool,'| label',T.wonderNear(ex,ez,40)&&T.WD_NAME[T.wonderNear(ex,ez,40).k]);return n>=3;});}
// sea stacks: the nearest few along the coasts, and one arch
{let n=0,arch=0;ring(700,(a,c)=>{const S=T.stackOf(a,c);if(!S||(n>=4&&!S.arch)||(S.arch&&arch))return false;if(S.arch)arch++;else n++;
  const x=Math.floor(S.x),z=Math.floor(S.z);let top=-99,bot=99;for(let y=G0-30;y<=G0+30;y++){const b=T.get(x,y,z);if(b===B.STONE||b===B.MOSSSTONE||b===B.GRASS||b===B.SNOW){top=Math.max(top,y-G0);bot=Math.min(bot,y-G0);}}
  let under='';if(S.arch){let w=0,air=0;for(let y=G0;y<=G0+S.H-4;y++){const b=T.get(x,y,z);if(b===B.WATER)w++;else if(!b)air++;}under=' | under the span: water '+w+', air '+air;}
  console.log((S.arch?'sea arch':'sea stack').padEnd(9),'at',x,z,'out',T.coastD(S.x,S.z).toFixed(1),'radius',S.R.toFixed(1),'| rock from',bot,'to',top,'(planned',S.H+')'+under);return n>=4&&arch;});}
// glaciers: the nearest cold mountain ground they cover, and how much
{const at=ring(500,(a,c)=>{const x=a*48,z=c*48,cl=T.climAt(x,z);if(cl.t>=0.3||T.clBlend('r')<=0.5||T.nzNoise(x/80,z/80,4451)<=0.15)return null;if(T.realmOf(Math.floor(x/32),Math.floor(z/32))!=='plains')return null;const h=T.plainsH(x,z);return h>T.rlfSnow(cl.t)-14?[x,z,h]:null;});
  if(at){const [x,z,h]=at,c=count(x-16,z-16,x+16,z+16,G0+h-25,G0+h+25);console.log('glacier at',x,z,'height',h,'| in 33 x 33:',js(c));}else console.log('glacier: none found');}
// fjord walls: the nearest cold, very rugged shore: the land's height a step in from the water, the water's depth a step out
{const at=ring(900,(a,c)=>{const x=a*64,z=c*64,cd=T.coastD(x,z);if(cd<-6||cd>6)return null;const F=T.coastFlav(x,z);if((F!==1&&F!==2)||T.CF_RC<=0.6)return null;return [x,z];});
  if(!at)console.log('fjord: none found');else{let [x,z]=at;let gx=T.coastD(x+3,z)-T.coastD(x-3,z),gz=T.coastD(x,z+3)-T.coastD(x,z-3);const L=Math.hypot(gx,gz)||1;gx/=L;gz/=L;
    for(let i=0;i<40;i++){const cd=T.coastD(x,z);if(Math.abs(cd)<0.6)break;x-=gx*cd;z-=gz*cd;}
    const hi=[],dp=[];for(const k of [3,6,10]){const lx=Math.floor(x-gx*k),lz=Math.floor(z-gz*k);let y=G0+60;while(y>G0-40&&!T.get(lx,y,lz))y--;hi.push(y-G0);}
    for(const k of [3,6,10]){const sx=Math.floor(x+gx*k),sz=Math.floor(z+gz*k);let y=G0;while(y>G0-60&&T.get(sx,y,sz)===B.WATER)y--;dp.push(G0-y);}
    console.log('fjord wall at',Math.round(x),Math.round(z),'| land 3, 6, 10 in:',hi.join(', '),'| water 3, 6, 10 out, deep:',dp.join(', '));}}
// tarns in the far view: the nearest tarn, and the water the near rings draw for it
{const t=ring(60,(a,c)=>T.rlfInCell(a*T.TARN_SP+1,c*T.TARN_SP+1,T.TARN_SP,T.rlfTarnAt));
  if(!t)console.log('far tarn: no tarn found');else{const SG={n:0,mat:new Float32Array(1600),col:new Float32Array(300),top:new Float32Array(300),wn:new Float32Array(400)};
    for(const st of [4,8])for(let pass=0;pass<1;pass++){SG.n=0;T.farPonds(SG,Math.floor(t.x/32),Math.floor(t.z/32),st,st===4);let n=0,y=0;for(let i=0;i<SG.n;i++){const cy=SG.mat[i*16+13];if(cy>G0+t.L-1){n++;y=cy;}}
      console.log('far tarn at',t.x,t.z,'radius',t.R,'level',t.L,'| ring step',st,': water boxes at its level',n,'(top',(y-G0+0.25).toFixed(2)+')');}}}
console.log('errors',errs.length,errs.slice(0,3).join(' | '));
`);
process.exit(0);
