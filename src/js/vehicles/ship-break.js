// ---- a ship that breaks up (one whose kind has K.hullY: the carrier). Only its hull counts toward sinking it, the blocks
// at or below K.hullY (so craters in the flight deck, the island and the hangar's roof cost it nothing), counted in slices
// SHIP_SL long from stern to bow. Knock enough out of one slice (till it has under SHIP_BREAK of what it started with)
// and the ship snaps there: the shorter end, broken slice and all, becomes a wreck of its own (a ship of kind 'wreck',
// its blocks copied into a pocket of its own) that goes down while the rest stays afloat. Anyone aboard the wreck rides
// it down till the water reaches them, as on any ship going down; once nobody is, it tips its broken end under. With
// too little hull left (under SHIP_HULL_MIN of it all), the rest goes down too ----
const SHIP_SL=8,SHIP_BREAK=0.35,SHIP_HULL_MIN=0.3,SHIP_SL_MIN=150;   // (a slice with fewer hull blocks than SHIP_SL_MIN, out past the ends of the hull, never breaks)
// its hull counted, slice by slice (from makeShip)
function shipHullInit(S){
  const K=S.K;if(K.hullY===undefined)return;const n=Math.ceil((K.w1+1-K.w0)/SHIP_SL),c=new Int32Array(n),y0=K.y0??0;let tot=0;
  for(let w=K.w0;w<=K.w1;w++){const i=Math.floor((w-K.w0)/SHIP_SL);
    for(let y=y0;y<=K.hullY;y++)for(let u=K.u0;u<=K.u1;u++){const b=K.block(u,y,w);if(b&&b!==WATER){c[i]++;tot++;}}}
  S.hull={w0:K.w0,n0:c.slice(),n:c,tot0:tot,tot,a:K.w0,b:K.w1,brk:false};
}
// a block of its hull knocked out (shipDent): one less in its slice, and the ship's health is what's left of its hull
function shipHullDent(S,y,z){
  const Hl=S.hull,K=S.K;if(y>K.hullY)return;const w=Math.floor(z)-S.oz;if(w<Hl.a||w>Hl.b)return;
  const i=Math.floor((w-Hl.w0)/SHIP_SL);if(Hl.n[i]<=0)return;Hl.n[i]--;Hl.tot--;S.hp=K.hp*Hl.tot/Hl.tot0;
  if(Hl.n0[i]>=SHIP_SL_MIN&&Hl.n[i]<Hl.n0[i]*SHIP_BREAK)Hl.brk=true;
}
// each step (updateShips), once a slice has gone under: the worst one breaks. True if the ship's gone down with it
function shipBreakCheck(S){
  const Hl=S.hull;Hl.brk=false;let wi=-1,wk=SHIP_BREAK;
  for(let i=0;i<Hl.n.length;i++){if(Hl.n0[i]<SHIP_SL_MIN)continue;const k=Hl.n[i]/Hl.n0[i];if(k<wk){wk=k;wi=i;}}
  if(wi<0)return false;shipBreak(S,wi);return S.dead;
}
function shipBreak(S,i){
  const Hl=S.hull,K0=S.K,base=K0.base||K0,ws=Hl.w0+i*SHIP_SL,we=Math.min(ws+SHIP_SL-1,Hl.b);
  // (the shorter end goes, with the broken slice: fore, the bow end; else the stern end)
  const fore=Hl.b-we<ws-Hl.a,pa=fore?ws:Hl.a,pb=fore?Hl.b:we,na=fore?Hl.a:we+1,nb=fore?ws-1:Hl.b,side=w=>fore?w>=pa:w<=pb;
  for(const p of players)if(p.drv&&p.drv.o===S&&side(base.helm[2]))drvExit(p);   // (the helm's on the end that's going)
  // (its blocks as they are now, holes and all, copied out for the wreck)
  const u0=base.u0,u1=base.u1,y0=base.y0??0,y1=base.y1??H-1,nu=u1-u0+1,ny=y1-y0+1,grid=new Uint8Array(nu*ny*(pb-pa+1));
  for(let w=pa;w<=pb;w++)for(let y=y0;y<=y1;y++)for(let u=u0;u<=u1;u++){const b=rawGet(S.ox+u,y,S.oz+w);if(b&&b!==WATER)grid[((w-pa)*ny+(y-y0))*nu+(u-u0)]=b;}
  const clip=(a,b)=>base.boxes?base.boxes.filter(q=>q[3]>=a&&q[2]<=b).map(q=>[q[0],q[1],Math.max(q[2],a),Math.min(q[3],b),q[4],q[5]]):null;
  const PK=Object.assign(Object.create(base),{name:base.name,base,w0:pa,w1:pb,hullY:undefined,boxes:clip(pa,pb),
    block:(u,y,w)=>u<u0||u>u1||w<pa||w>pb||y<y0||y>y1?0:grid[((w-pa)*ny+(y-y0))*nu+(u-u0)],
    props:base.props?()=>base.props().filter(q=>q[3]>=pa&&q[3]<=pb+1):undefined,
    doors:base.doors?()=>base.doors().filter(d=>d.ax==='w'?d.a0>=pa&&d.a1<=pb:d.c>=pa&&d.c<=pb):undefined});
  const W=makeShip('wreck',S.x,S.z,S.yaw,PK),dz=W.oz-S.oz;
  W.dead=true;W.deadT=0;W.sk=S.sk;W.V=S.V;if(S.V)S.V.ships.push(W);W.brk={dir:fore?-1:1,wc:(pa+pb+1)/2,tilt:0};
  // (its deck weapons on that end: gone with it, nobody to man them; their models carried on the wreck)
  for(const Mt of S.mounts||[]){if(!side(Mt.z-0.5-S.oz))continue;if(Mt.drv)drvExit(Mt.drv);
    Mt.dead=true;Mt.crew=null;Mt.call=null;if(Mt.pr)Mt.pr.alive=false;Mt.g.position.z+=dz;W.pg.add(Mt.g);}
  // (its jets parked on that end, likewise: one being flown, or with someone in it, goes over with the vehicles below)
  if(S.jetV){const JV=S.jetV;JV.pl=JV.pl.filter(pl=>{const P=pl.g.position;
      if(pl.drv||pl.ai||pl.free&&pl.free.air||P.x<SHIP_X0||shipOfPos(P.x,P.z)!==S||!side(P.z-S.oz))return true;
      pl.dead=true;P.z+=dz;W.pg.add(pl.g);return false;});JV.planes=JV.pl.map(pl=>pl.g);}
  // (everyone and everything on that end, over into the wreck's pocket: out into the world and straight back in)
  const onEnd=P=>P.x>=SHIP_X0&&shipOfPos(P.x,P.z)===S&&side(Math.floor(P.z)-S.oz);
  shipVehEach((o,P)=>{if(onEnd(P)){shipVehMove(o,S,false);shipVehMove(o,W,true);}});
  for(const p of players)if(p.active&&!p.drv&&onEnd(p.pos)){shipMove(p,S,false,true);if(!shipMove(p,W,true,true))shipParent(p,null);}
  for(const g of goblins)if(g.state!=='wait'&&onEnd(g.pos)){g.post=null;g.hold=false;g.homeV=null;shipMove(g,S,false,false);if(!shipMove(g,W,true,false)){g.state='wait';g.t=0;g.root.visible=false;}}
  if(S.crewV)for(const P of S.crewV.posts)if(side(Math.floor(P.z)-S.oz))P.cut=true;   // (nobody posted there again)
  // (what's left: just its own end, its blocks there made again without the rest)
  S.K=Object.assign(Object.create(base),{base,w0:na,w1:nb,block:(u,y,w)=>w<na||w>nb?0:base.block(u,y,w),boxes:clip(na,nb),
    doors:base.doors?()=>base.doors().filter(d=>!side(d.ax==='w'?d.a0:d.c)):undefined});S.bx=null;
  if(S.props){for(const f of S.props)if(side(Math.floor(f.z)-S.oz))f.gone=true;S.propsT=0.05;}
  if(S._doors)S._doors=S._doors.filter(d=>!side(Math.floor(d.ax==='z'?d.a0:d.c)-S.oz));
  const set=new Set(),[cx0,cx1]=shipChunkBox(S),b=SHIP_BAND+1;
  for(let cx=cx0;cx<=cx1;cx++)for(let cz=Math.floor((S.oz+pa-b)/CS);cz<=Math.floor((S.oz+pb+b)/CS);cz++){const k=ckey(cx,cz);chunks.delete(k);set.add(k);}
  lastK=-1;for(const k of set){const e=meshes.get(k);if(e)buildChunk(e.cx,e.cz);}   // (now, not over the next frames: the wreck's drawn at once too, so for a frame or two both would be)
  shipChunks(true);
  // (its count: the end that's gone no longer part of it)
  for(let j=0;j<Hl.n.length;j++){const a=Hl.w0+j*SHIP_SL;if(side(a)){Hl.tot-=Hl.n[j];Hl.n[j]=0;Hl.n0[j]=0;}}
  if(fore)Hl.b=nb;else Hl.a=na;S.hp=Math.max(0,base.hp*Hl.tot/Hl.tot0);
  // (the break: blasts all along it, steam and smoke, a long groan of steel)
  const wb=fore?pa:pb+1;for(let u=u0;u<=u1;u+=5){shipToWorld(S,S.ox+u+0.5,S.oz+wb,_sv);blastFx(_sv.x,G+2+Math.random()*8,_sv.z,0.8,2);puff(_sv.x,G+1,_sv.z,6,0xcfe8ff,1.6);smoke(_sv.x,G+6,_sv.z,6,0x262626);}
  shipToWorld(S,S.ox+(u0+u1+1)/2,S.oz+wb,_sv);addShake(1,_sv.x,_sv.z,140);
  if(audio)sfx('Ship breaking up',()=>{noise(2,1,300,'lowpass');tone('sawtooth',70,22,2.4,0.3);tone('triangle',140,60,1.8,0.12);});
  award(Math.round((base.sc||1000)/4),'The '+base.name+' broke apart',_sv.x,G+8,_sv.z);
  if(Hl.tot<Hl.tot0*SHIP_HULL_MIN)shipSink(S);
  return W;
}
// a wreck going down (shipSinking): level while anyone's aboard it (so they can stand on it), then tipping its broken
// end under. It's turned about its middle at the waterline, so that stays put while the ends go down and up
function shipWreckTilt(S,dt){
  const B=S.brk;let on=players.some(p=>p.active&&(shipOf(p)===S||p.drv&&p.drv.o&&p.drv.o.onPr&&p.drv.o.onPr.T===S));
  if(!on)shipVehEach((o,P)=>{if(P.x>=SHIP_X0&&shipOfPos(P.x,P.z)===S)on=true;});
  if(!on){if(!B.tilt)for(const g of goblins)if(g.state!=='wait'&&shipOf(g)===S){g.state='wait';g.t=0;g.root.visible=false;}   // (nobody to see them go)
    B.tilt=Math.min(0.45,B.tilt+dt*0.03);}
  if(!B.tilt)return;
  const a=B.dir*B.tilt,c=Math.cos(a),s=Math.sin(a),oy=G-(G*c-B.wc*s),oz=B.wc-(G*s+B.wc*c);
  S.grp.rotation.set(a,S.yaw,0,'YXZ');S.grp.position.set(S.x+oz*Math.sin(S.yaw),oy-S.sk,S.z+oz*Math.cos(S.yaw));S.grp.updateMatrixWorld(true);
}
