// ---- gradient noise: smooth seeded noise for the landscape (climate, biomes and relief; docs/biomes-plan.md). Arithmetic
// only (+ - * / and floor, which IEEE makes exactly the same in every browser), never Math.sin, cos, tanh, exp or
// Math.random, so a host and a guest on different browsers always work out the same ground. Seeded through hash2, each
// use with a salt of its own. Positions are in lattice units for nzNoise, in blocks for the rest ----
const NZ_R=0.7071067811865476,NZ_GX=[1,-1,0,0,NZ_R,-NZ_R,NZ_R,-NZ_R],NZ_GZ=[0,0,1,-1,NZ_R,NZ_R,-NZ_R,-NZ_R];
// (the gradient at lattice point (ix,iz), one of eight directions, dotted with the offset (dx,dz) from it)
function nzGrad(ix,iz,salt,dx,dz){const g=Math.floor(hash2(ix*1619+salt*31337,iz*6971+salt*1013)*8);return NZ_GX[g]*dx+NZ_GZ[g]*dz;}
// 2-D gradient noise (Perlin's, with his quintic easing): about -1..1, 0 on every lattice point
function nzNoise(x,z,salt){
  const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
  const u=fx*fx*fx*(fx*(fx*6-15)+10),v=fz*fz*fz*(fz*(fz*6-15)+10);
  const a=nzGrad(ix,iz,salt,fx,fz),b=nzGrad(ix+1,iz,salt,fx-1,fz),c=nzGrad(ix,iz+1,salt,fx,fz-1),d=nzGrad(ix+1,iz+1,salt,fx-1,fz-1);
  const ab=a+(b-a)*u,cd=c+(d-c)*u;
  return (ab+(cd-ab)*v)*1.4142;   // (eight unit gradients reach at most 0.707: scaled up to about 1)
}
// fractal noise (fBm): oct octaves from a lattice sp blocks apart, each twice as fine and half as strong (each shifted, so
// their lattice points don't line up); about -1..1
function nzFbm(x,z,sp,oct,salt){let f=1/sp,a=1,s=0,n=0;
  for(let i=0;i<oct;i++){s+=a*nzNoise(x*f+i*19.31,z*f-i*7.73,salt+i*101);n+=a;f*=2;a*=0.5;}return s/n;}
// ridged noise: sharp crests where the noise crosses zero (ranges, ridgelines), each octave weighted by the one before so
// the fine detail gathers along the crests; 0 (valley) .. 1 (crest)
function nzRidged(x,z,sp,oct,salt){let f=1/sp,a=1,w=1,s=0,n=0;
  for(let i=0;i<oct;i++){let r=1-Math.abs(nzNoise(x*f+i*19.31,z*f-i*7.73,salt+i*101));r*=r*w;w=r*2;if(w>1)w=1;s+=a*r;n+=a;f*=2;a*=0.5;}return s/n;}
// domain warp: (x,z) pushed about by up to amp blocks of two-octave fBm sp blocks across, so edges and ridges wander
// instead of following the lattice. The answer goes in NZ_W (no new array a call)
const NZ_W=[0,0];
function nzWarp(x,z,sp,amp,salt){const dx=nzFbm(x,z,sp,2,salt),dz=nzFbm(x,z,sp,2,salt+57);NZ_W[0]=x+amp*dx;NZ_W[1]=z+amp*dz;return NZ_W;}
// (curves in place of tanh and the like: a clamp to 0..1, and smoothstep from e0 to e1)
const nzClamp01=t=>t<0?0:t>1?1:t;
function nzSmooth(e0,e1,t){t=nzClamp01((t-e0)/(e1-e0));return t*t*(3-2*t);}
