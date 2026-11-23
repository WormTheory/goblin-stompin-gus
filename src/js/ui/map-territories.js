// ---- territories on the maps (world/territories.js): on the pause map, their borders across what you've explored and
// each one's name over the middle of the part of it you've seen; on the minimap, a border you're near; and a banner
// naming the territory you've come into. Only tiles already worked out are drawn: the map warms the rest a few
// milliseconds a frame, and the banner the one you're in, so nothing ever works out a whole tile in one frame ----
const TMAP={T:null,n:-1,cells:null};
// (the territory cells you've explored any of, remade when you've explored more or the territories are new)
function terExplored(){const T=terSt();if(TMAP.T===T&&TMAP.n===explored.size)return TMAP.cells;
  const m=new Map();for(const k of explored){const c=k.indexOf(','),[i,j]=terCellOf(+k.slice(0,c),+k.slice(c+1));m.set(i+','+j,[i,j]);}
  TMAP.T=T;TMAP.n=explored.size;TMAP.cells=m;return m;}
// (k pixels a block, X and Z a block's place on the canvas; true while tiles are still to be worked out)
function mapTerDraw(x,w,h,k,X,Z){
  if(TENV||!explored.size||!x.setLineDash)return false;const C=terExplored(),cb=terSt().cs*CELL,t0=performance.now();let more=false;
  const vis=[];for(const [key,c] of C){const a=X(c[0]*cb),b=Z(c[1]*cb);if(a>w+20||b>h+20||a+cb*k<-20||b+cb*k<-20)continue;vis.push(key,c);}
  // (the tiles under what's in view, a few milliseconds' worth a frame)
  for(let q=0;q<vis.length;q+=2){const c=vis[q+1],tx=Math.floor(c[0]/TER_N),tz=Math.floor(c[1]/TER_N);
    for(const [a,b] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){if(terSt().tiles.has((tx+a)+','+(tz+b)))continue;
      const ms=10-(performance.now()-t0);if(ms<=0||!terWarmTile(tx+a,tz+b,ms)){more=true;break;}}}
  // the borders: between two territories' land, along each side of an explored cell (once, if both sides are explored)
  const seg=[],names=new Map();
  for(let q=0;q<vis.length;q+=2){const [i,j]=vis[q+1],me=terLook(i,j);if(!me)continue;
    let N=names.get(me);if(!N)names.set(me,N={x:0,z:0,n:0});N.x+=(i+0.5)*cb;N.z+=(j+0.5)*cb;N.n++;
    for(const [di,dj] of [[1,0],[0,1],[-1,0],[0,-1]]){if((di<0||dj<0)&&C.has((i+di)+','+(j+dj)))continue;const o=terLook(i+di,j+dj);if(!o||o===me)continue;
      const x0=(di>0?i+1:i)*cb,z0=(dj>0?j+1:j)*cb;seg.push(X(x0),Z(z0),X(di?x0:x0+cb),Z(dj?z0:z0+cb));}}
  if(seg.length){x.lineCap='round';x.beginPath();for(let q=0;q<seg.length;q+=4){x.moveTo(seg[q],seg[q+1]);x.lineTo(seg[q+2],seg[q+3]);}
    x.strokeStyle='rgba(10,4,14,.75)';x.lineWidth=5;x.stroke();x.setLineDash([9,6]);x.strokeStyle='#e7b8ff';x.lineWidth=2.4;x.stroke();x.setLineDash([]);}
  // the names, over the middle of what you've seen of each (under the places' names, which are drawn after)
  x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
  for(const [id,N] of names){const I=terInfo(id);if(!I)continue;const sx=X(N.x/N.n),sz=Z(N.z/N.n);if(sx<-200||sx>w+200||sz<-30||sz>h+30)continue;
    x.font='800 17px "Atkinson Hyperlegible Next", system-ui, sans-serif';try{x.letterSpacing='2px';}catch(e){}
    const t=I.title.toUpperCase();x.lineWidth=4;x.strokeStyle='rgba(10,4,14,.85)';x.strokeText(t,sx,sz+34);x.fillStyle='#e7b8ff';x.fillText(t,sx,sz+34);try{x.letterSpacing='0px';}catch(e){}}
  x.textAlign='start';x.textBaseline='alphabetic';
  return more;}
// (the minimap, drawn in blocks through its turning transform: borders of the cells round you that are worked out)
function miniTerDraw(x,px,pz,R){
  if(TENV||!x.setLineDash)return;const cb=terSt().cs*CELL,i0=Math.floor((px-R)/cb),i1=Math.floor((px+R)/cb),j0=Math.floor((pz-R)/cb),j1=Math.floor((pz+R)/cb);let any=false;
  x.beginPath();
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const me=terLook(i,j);if(!me)continue;
    const o1=terLook(i+1,j),o2=terLook(i,j+1);
    if(o1&&o1!==me){x.moveTo((i+1)*cb,j*cb);x.lineTo((i+1)*cb,(j+1)*cb);any=true;}
    if(o2&&o2!==me){x.moveTo(i*cb,(j+1)*cb);x.lineTo((i+1)*cb,(j+1)*cb);any=true;}
    const o3=i===i0?terLook(i-1,j):null,o4=j===j0?terLook(i,j-1):null;
    if(o3&&o3!==me){x.moveTo(i*cb,j*cb);x.lineTo(i*cb,(j+1)*cb);any=true;}
    if(o4&&o4!==me){x.moveTo(i*cb,j*cb);x.lineTo((i+1)*cb,j*cb);any=true;}}
  if(any){x.strokeStyle='rgba(10,4,14,.7)';x.lineWidth=5;x.stroke();x.setLineDash([7,5]);x.strokeStyle='#e7b8ff';x.lineWidth=2.4;x.stroke();x.setLineDash([]);}}
// (the banner: a territory's name once you've been in it a couple of seconds, after any place's banner; warming the tile
// you're in a millisecond and a half a frame till it's known)
const PBT={id:undefined,c:null,t:0};
function terBannerTick(p,dt){
  if(TENV)return;const px=Math.floor(pwx(p)/CELL),pz=Math.floor(pwz(p)/CELL),id=terWarm(px,pz,1.5);
  if(!id)return;if(id===PBT.id){PBT.t=0;return;}
  if(id!==PBT.c){PBT.c=id;PBT.t=0;}PBT.t+=dt;
  if(PBT.t<2||PB.t>0||!pbEl())return;const I=terInfo(id);if(!I)return;
  PBT.id=id;PB.el.innerHTML='<div class="pn">'+I.title+'</div><div class="pk">Capital: '+setName(I.cap)+'</div>';PB.el.classList.add('on');PB.t=3.6;}
