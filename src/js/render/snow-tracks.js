// ---------- Tracks in the snow ----------
// Wheels, a tank's treads, the Mobile Gear's feet and the hippos' (and goblins') own feet press the snow down where
// they go, near each player who's here: a map round each (TRK_N texels a side, TRK_Q to a block, so 128 blocks across)
// that the ground's snow shader reads (TRK_FRAG, meshing.js). Further out the roads' ruts (roadLanes) are all there is.
// The map is wrapped: a point's texel is where it falls on the world cut into squares the map's size, so the map never
// shifts as its player moves, only the squares of 8 blocks (TRK_T texels) leaving its far side are emptied to be the
// ones coming in on the near side. Falling snow fills the tracks in again; once the snow's gone, they go with it.
// Online each player keeps their own, from the vehicles they can see, so friends' tracks can differ a little.
let SNOW_TRACKS=true;try{SNOW_TRACKS=localStorage.getItem('goblin-stompin-gus-notracks')!=='1';}catch(e){}
const TRK_T=32,TRK_S=TRK_N/TRK_T,TRK_B=TRK_T/TRK_Q;   // (texels a square, squares a side, blocks a square)
const trkMaps=[];   // (one for each player whose view is drawn here, by p.idx: made the first time it's drawn in the snow)
function trkMap(i){let M=trkMaps[i];if(M)return M;
  const d=new Uint8Array(TRK_N*TRK_N*2),tex=new THREE.DataTexture(d,TRK_N,TRK_N,THREE.LuminanceAlphaFormat);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.magFilter=tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;tex.needsUpdate=true;
  // own: which square of the world each square of the map holds now (x, z); cx, cz the square in the middle
  M={d,tex,own:new Int32Array(TRK_S*TRK_S*2).fill(-2147483648),cx:null,cz:0,dirty:false,upT:0,any:false,fillR:0,fill:0,x:0,z:0};
  trkMaps[i]=M;return M;}
const trkMod=(v,n)=>((v%n)+n)%n;
// centre the map on (x,z): any square of the map not holding the one of the world it should now is emptied for it
function trkCentre(M,x,z){const cx=Math.floor(x/TRK_B),cz=Math.floor(z/TRK_B);if(cx===M.cx&&cz===M.cz)return;M.cx=cx;M.cz=cz;
  const h=TRK_S/2;
  for(let tz=cz-h;tz<cz+h;tz++)for(let tx=cx-h;tx<cx+h;tx++){const s=trkMod(tz,TRK_S)*TRK_S+trkMod(tx,TRK_S);
    if(M.own[s*2]===tx&&M.own[s*2+1]===tz)continue;M.own[s*2]=tx;M.own[s*2+1]=tz;if(!M.any)continue;
    const u0=trkMod(tx,TRK_S)*TRK_T,v0=trkMod(tz,TRK_S)*TRK_T;
    for(let v=v0;v<v0+TRK_T;v++)M.d.fill(0,(v*TRK_N+u0)*2,(v*TRK_N+u0+TRK_T)*2);M.dirty=true;}}
const trkIn=(M,x,z)=>{const h=TRK_S/2,tx=Math.floor(x/TRK_B)-M.cx,tz=Math.floor(z/TRK_B)-M.cz;return tx>=-h&&tx<h&&tz>=-h&&tz<h;};
// press a stroke from (x0,z0) to (x1,z1), r wide either side, k hard (0 to 1), at height y, into every map it's on
function trkLine(x0,z0,x1,z1,y,r,k){
  const A=Math.max(0,Math.min(255,Math.round(y))),K=Math.round(k*255);
  for(const M of trkMaps){if(!M||M.cx===null||!trkIn(M,x1,z1)||!trkIn(M,x0,z0))continue;
    const dx=x1-x0,dz=z1-z0,L2=dx*dx+dz*dz||1e-9,R=r+0.35;   // (R: the height goes a little past the edge, so the blur between texels doesn't lose it)
    const u0=Math.floor((Math.min(x0,x1)-R)*TRK_Q),u1=Math.floor((Math.max(x0,x1)+R)*TRK_Q),v0=Math.floor((Math.min(z0,z1)-R)*TRK_Q),v1=Math.floor((Math.max(z0,z1)+R)*TRK_Q);
    for(let v=v0;v<=v1;v++){const wz=(v+0.5)/TRK_Q,row=trkMod(v,TRK_N)*TRK_N;
      for(let u=u0;u<=u1;u++){const wx=(u+0.5)/TRK_Q;let t=((wx-x0)*dx+(wz-z0)*dz)/L2;t=t<0?0:t>1?1:t;
        const ex=wx-x0-dx*t,ez=wz-z0-dz*t,e=Math.sqrt(ex*ex+ez*ez);if(e>R)continue;
        const i=(row+trkMod(u,TRK_N))*2,d=M.d;
        if(e<=r){const n=Math.round(K*Math.min(1,(r-e)*TRK_Q*0.8+0.35));if(n>d[i]||Math.abs(d[i+1]-A)>1){d[i]=Math.max(n,Math.abs(d[i+1]-A)>1?0:d[i]);d[i+1]=A;}}
        else if(d[i]===0)d[i+1]=A;}}
    M.dirty=true;M.any=true;}}
// a wheel (or tread) from where it was last frame (o.trk, by its number w) to (x,z): nothing after a jump of more than
// a few blocks (put back somewhere else, or a ship's pocket)
function trkWheel(o,w,x,y,z,r,k){const T=o.trk||(o.trk=[]),q=T[w];
  if(q&&Math.abs(x-q.x)+Math.abs(z-q.z)<4&&Math.abs(y-q.y)<1.5){if(Math.abs(x-q.x)+Math.abs(z-q.z)>0.05){trkLine(q.x,q.z,x,z,y,r,k);q.x=x;q.z=z;q.y=y;}}
  else T[w]={x,y,z};}
// feet: a print every so far along the way it's going, left and right in turn (gap apart, s the stride, r each print's size)
function trkFeet(o,x,y,z,gap,s,r,k){const q=o.trkF;if(!q||Math.abs(x-q.x)+Math.abs(z-q.z)>4){o.trkF={x,z,go:0,n:0};return;}
  const dx=x-q.x,dz=z-q.z,L=Math.hypot(dx,dz);if(L<0.02)return;q.go+=L;q.x=x;q.z=z;
  if(q.go<s)return;q.go=0;q.n^=1;const fx=dx/L,fz=dz/L,sd=(q.n?1:-1)*gap;
  const px=x+fz*sd,pz=z-fx*sd;trkLine(px-fx*r*0.6,pz-fz*r*0.6,px+fx*r*0.6,pz+fz*r*0.6,y,r,k);}
function trkCar(c){const V=VEH[c.veh||'car']||VEH.car,s=Math.sin(c.heading),k=Math.cos(c.heading),y=c.pos.y;
  // (two-wheelers leave one line; anything else a pair, from its front and back axles, a lorry's tyres wider)
  const two=V.hx<0.5,hz=Math.max(0.3,V.hz-0.55),hx=two?0:V.hx-0.28,r=two?0.13:V.hx>1.1?0.3:0.24;
  for(let w=0;w<(two?2:4);w++){const a=two?0:(w&1?hx:-hx),b=w<2?hz:-hz;trkWheel(c,w,c.pos.x+a*k+b*s,y,c.pos.z-a*s+b*k,r,1);}}
let trkGone=true;
// (the destroyed blocks round each player, rdDead in meshing.js: once a second, a few cells out past what's in view)
let rdDeadT=0;const RD_DEAD0=0.35;   // (it starts with about the snow its ruts had, not bare)
function rdDeadTick(dt){rdDeadT-=dt;if(rdDeadT>0)return;rdDeadT=1;const R=7;
  for(const p of players){if(!p.active)continue;const qx=Math.floor(p.pos.x/CELL),qz=Math.floor(p.pos.z/CELL);
    for(let px=qx-R;px<=qx+R;px++)for(let pz=qz-R;pz<=qz+R;pz++){const k=colKey(px,pz);if(rdDead.has(k)||!mapDead(px,pz))continue;
      rdDead.set(k,WX.snowClock-RD_DEAD0);
      // (its roads, and the next block's along its far sides, which may now have gone both sides)
      for(let qx2=Math.floor((px*CELL-ROADW)/CS);qx2<=Math.floor(((px+1)*CELL+ROADW)/CS);qx2++)for(let qz2=Math.floor((pz*CELL-ROADW)/CS);qz2<=Math.floor(((pz+1)*CELL+ROADW)/CS);qz2++){const c=ckey(qx2,qz2);if(meshes.has(c))rebuildQ.add(c);}}}}
function trkTick(dt){
  const on=SNOW_TRACKS&&snowMax()>0.01;
  // (the snow's gone: so are the tracks, ready for the next fall)
  if(!on){TRKC_U.value.z=0;if(!trkGone&&!(snowMax()>0.01)){trkGone=true;for(const M of trkMaps)if(M&&M.any){M.d.fill(0);M.any=false;M.dirty=true;M.tex.needsUpdate=true;}}return;}
  trkGone=false;
  if(dt>0){
    for(const c of cars)if(c.alive&&c.grounded!==false&&c.g.visible&&c.veh!=='hover')trkCar(c);
    for(const V of venues.values()){
      if(V.mil)for(const M of V.mil)if(M.kind==='tank'&&!M.dead){const s=Math.sin(M.h),k=Math.cos(M.h);for(let w=0;w<2;w++){const a=w?1.2:-1.2;trkWheel(M,w,M.x+a*k,M.y,M.z-a*s,0.45,1);}}
      if(V.mechs)for(const M of V.mechs)if(!M.dead)trkFeet(M,M.x,M.y,M.z,1.6,3.4,0.75,1);}
    for(const p of players)if(p.active&&p.grounded&&!p.drv&&p.state!=='dead'&&p.state!=='climb')trkFeet(p,p.pos.x,p.pos.y,p.pos.z,p.gob?0.14:0.42,p.gob?0.55:0.95,p.gob?0.1:0.24,0.8);
    // (falling snow fills them back in, as fast as it's falling where that player is: the deepest in 40 seconds of a
    // blizzard. A sixteenth of the map a frame, by what's fallen since that part was last done)
    for(const M of trkMaps)if(M&&M.any)M.fill+=dt*wxSnowFall(M.x,M.z,G+1)*16*255/40;}
  const rows=TRK_N/16;
  for(const M of trkMaps){if(!M||!M.any)continue;
    if(M.fill>=1){const sub=Math.floor(M.fill),r0=M.fillR*rows;let ch=false;M.fill-=sub;
      for(let i=r0*TRK_N*2;i<(r0+rows)*TRK_N*2;i+=2){const n=M.d[i];if(n){M.d[i]=n>sub?n-sub:0;ch=true;}}
      M.fillR=(M.fillR+1)%16;if(ch)M.dirty=true;}
    M.upT-=dt||1/60;if(M.dirty&&M.upT<=0){M.dirty=false;M.upT=0.08;M.tex.needsUpdate=true;}}   // (sent up to the graphics card a dozen times a second at most)
}
// each view draws with its own player's map
function trkView(p){if(!SNOW_TRACKS||!(snowMax()>0.01)){TRKC_U.value.z=0;return;}
  const M=trkMap(p.idx);M.x=p.pos.x;M.z=p.pos.z;trkCentre(M,p.pos.x,p.pos.z);TRK_U.value=M.tex;TRKC_U.value.set(M.cx*TRK_B,M.cz*TRK_B,1);}
