// ---- the Structures tab: every kind of site the world builds (src/assets/sites/, the format in src/js/core/assets.js).
// One is captured from the game's own world (the hidden copy the Hippo tab uses: liveSiteCapture, src/js/ui/
// editor-live.js), as the plan builds it, with its furniture, people and parked vehicles, then edited here block by block.
// Switched on (Built in the game), the game builds it in place of every one of its kind and size, turned to face the
// way each one faces (world/sites.js). Blocks are drawn with the game's own textures; a site's blocks are kept decoded
// while it's open (d._A) and each edited row is written back to the file at once ----
'use strict';
const SIT={info:null,asked:false,capId:0,capBusy:false,tex:null,mats:null,BI:[],sw:{},tool:'add',blk:11,cut:null,secs:new Map(),secDoc:null,root:null,thingsG:null,
  hover:null,hovMesh:null,box:null,boxMesh:null,sel:null,q:'',openG:{},openK:{},things:true,proxy:null,inst:null,lastHit:null};
const SIT_TOOLS=[['select','Select','V','Pick a prop, person or vehicle to move it'],['add','Add','B','Put a block on the face clicked'],['remove','Remove','E','Take out the block clicked'],
  ['paint','Paint','P','Change the block clicked'],['pick','Pick','I','Take the block clicked as the one to build with'],['box','Box','X','Two clicks fill a box (Shift: empty it)']];
const SIT_FACES=[[-1,'Any way'],[0,'-x'],[1,'+x'],[2,'-z'],[3,'+z']];
const SIT_PEOPLE=[['staff','Staff (stands at its spot)'],['civilian','Townsperson'],['goblin','Street goblin (hostile)']];
const SIT_PCOL={staff:0xf0ece0,civilian:0x4a7ac0,goblin:0x5f8a34};
const sitG=()=>SIT.info?SIT.info.G:44;
const sitKindName=k=>{if(SIT.info)for(const [,items] of SIT.info.kinds)for(const [kk,n] of items)if(kk===k)return n;return k;};
const sitKindOf=n=>{const d=DOCS.get(key('sites',n));return d?d.data.kind:n.replace(/-\d+$/,'');};

// ---- the hidden game: its blocks, textures and kinds once it's up; captures on request ----
function sitAsk(){hipFrame();if(SIT.asked||!HIP.ready)return;SIT.asked=true;HIP.frame.contentWindow.postMessage({type:'gsg-site-info',id:0},location.origin);}
function sitCapture(kind){
  hipFrame();if(!HIP.ready)return status('The game is still starting: try again in a moment');if(SIT.capBusy)return;
  const n=(S.list.sites||[]).filter(x=>sitKindOf(x)===kind).length;SIT.capBusy=true;
  status('Finding '+sitKindName(kind)+(n?' (number '+(n+1)+')':'')+' in the world…');
  HIP.frame.contentWindow.postMessage({type:'gsg-site-cap',kind,n,id:++SIT.capId},location.origin);
}
function sitMessage(e){
  const fw=HIP.frame&&HIP.frame.contentWindow;if(!fw||e.source!==fw)return false;const m=e.data;
  if(m.type==='gsg-site-info-done'){if(m.res&&!m.res.error)sitInfo(m.res);else{SIT.asked=false;status('The game could not list its blocks: '+(m.res&&m.res.error),true);}return true;}
  if(m.type==='gsg-site-cap-done'){SIT.capBusy=false;const r=m.res;if(!r||r.error){status(r?r.error:'Capture failed',true);return true;}
    const f=r.file,base=f.kind;let name=base,i=2;while((S.list.sites||[]).includes(name))name=base+'-'+i++;
    DOCS.set(key('sites',name),{kind:'sites',name,data:f,saved:'',stamp:'',undo:[],redo:[],isNew:true});S.list.sites.push(name);SIT.openK[f.kind]=true;
    open('sites',name).then(()=>status('Captured '+sitKindName(f.kind)+' (plots '+r.at.join(', ')+'): not saved yet'));return true;}
  return false;
}
function sitInfo(I){
  SIT.info=I;SIT.BI=[];for(const b of I.blocks)SIT.BI[b.i]=b;
  const img=new Image();img.onload=()=>{SIT.img=img;const t=new THREE.Texture(img);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;SIT.tex=t;
    SIT.mats={o:new THREE.MeshBasicMaterial({map:t,vertexColors:true,alphaTest:0.3}),w:new THREE.MeshBasicMaterial({map:t,vertexColors:true,transparent:true,opacity:0.6,depthWrite:false})};
    SIT.secs.clear();SIT.secDoc=null;const d=doc();if(d&&d.kind==='sites'){rebuild();frameView();renderInsp();}};
  img.src=I.atlas;
  renderList();const d=doc();if(d&&d.kind==='sites'){renderInsp();renderToolbar();}
}
// a block's look in the palette: its side's tile from the atlas
function sitSwatch(i){
  if(SIT.sw[i])return SIT.sw[i];const B=SIT.BI[i];if(!SIT.img||!B||!B.t)return '';const I=SIT.info,c=document.createElement('canvas');c.width=c.height=I.T;
  const t=B.t[1]??B.t[0],g=c.getContext('2d');g.drawImage(SIT.img,(t%I.AC)*I.T,Math.floor(t/I.AC)*I.T,I.T,I.T,0,0,I.T,I.T);return SIT.sw[i]=c.toDataURL();
}

// ---- the open site's blocks: decoded once, each edited row written back ----
function sitA(d){if(d._A&&d._Arows===d.data.rows)return d._A;d._A=assetSiteDecode(d.data);d._Arows=d.data.rows;SIT.secs.clear();return d._A;}
const sitIdx=(d,u,y,v)=>{const [NX,NY]=d.data.size;return (v*NX+u)*NY+(y-d.data.y0);};
function sitAt(d,u,y,v){const [NX,NY,NZ]=d.data.size,y0=d.data.y0;if(u<0||v<0||u>=NX||v>=NZ||y<y0||y>=y0+NY)return 0;return sitA(d)[sitIdx(d,u,y,v)];}
// (the site's undo is its own: only the rows a change touched, and the rest of the file, are kept, as a whole big site
// copied on every click would soon fill the memory)
// (rows kept as a null, so the file's fields come back in the same order)
const sitMeta=d=>{const o={};for(const k in d.data)o[k]=k==='rows'?null:d.data[k];return JSON.stringify(o);};
function sitPush(d,e){d.sUndo=d.sUndo||[];d.sRedo=[];d.sUndo.push(e);if(d.sUndo.length>200)d.sUndo.shift();}
function sitUndo(d,redo){
  const from=redo?d.sRedo:d.sUndo,to=redo?d.sUndo:d.sRedo;if(!from||!from.length)return;const e=from.pop(),back={rows:{},meta:null};
  if(e.meta){back.meta=sitMeta(d);const o=JSON.parse(e.meta),rows=d.data.rows;for(const k of Object.keys(d.data))delete d.data[k];for(const k in o)d.data[k]=k==='rows'?rows:o[k];}
  if(e.all){back.all=d.data.rows;d.data.rows=e.all;d._A=null;}
  for(const v in e.rows){back.rows[v]=d.data.rows[v];d.data.rows[v]=e.rows[v];}
  if(Object.keys(e.rows).length&&d._A){const [NX,NY]=d.data.size;const A=d._A;for(const v in e.rows){const R=assetSiteDecode({size:[NX,NY,1],rows:[d.data.rows[v]]});if(R)A.set(R,+v*NX*NY);}d._Arows=d.data.rows;}
  to.push(back);mergeTag=null;SIT.secs.clear();SIT.sel=null;changed(true,true);sitDraw(d);
}
// blocks set: [[u,y,v,id]...], growing the site upward if one goes over its top
function sitSet(d,L){
  L=L.filter(([u,y,v])=>u>=0&&v>=0&&u<d.data.size[0]&&v<d.data.size[2]&&y>=d.data.y0&&y<200);if(!L.length)return;
  const top=Math.max(...L.map(q=>q[1])),D=d.data;let e={rows:{}};
  if(top>=D.y0+D.size[1]){const [NX,NY,NZ]=D.size,NY2=top-D.y0+1,A=sitA(d),B=new Uint8Array(NX*NY2*NZ);
    for(let c=0;c<NX*NZ;c++)B.set(A.subarray(c*NY,c*NY+NY),c*NY2);e={rows:{},all:D.rows,meta:sitMeta(d)};D.size=[NX,NY2,NZ];d._A=B;D.rows=assetSiteEncode(B,D.size);d._Arows=D.rows;SIT.secs.clear();}
  const A=sitA(d),vs=new Set();let n=0;
  for(const [u,y,v,id] of L){const i=sitIdx(d,u,y,v);if(A[i]===id)continue;if(!e.all&&!(v in e.rows))e.rows[v]=D.rows[v];A[i]=id;vs.add(v);n++;sitDirty(u,v);}
  if(!n&&!e.all)return;
  for(const v of vs)D.rows[v]=assetSiteRow(A,D.size,v);d._Arows=D.rows;
  sitPush(d,e);mergeTag=null;changed(false,true);sitDraw(d);
}
// the rest of the file (props, people, vehicles, its switches): undone as a whole
// (keep: mid-drag the gizmo's own stand-in has already moved, and drawing the things again would drop it from under the mouse)
function sitEdit(f,merge,keep){const d=doc();if(!d)return;if(!(merge&&mergeTag===merge))sitPush(d,{rows:{},meta:sitMeta(d)});mergeTag=merge||null;f(d.data);changed(false,true);if(!keep)sitThings(d);}

// ---- the view: the blocks in sections of 16 x 16 columns, each made again only when a block in it (or next to it) changes ----
const SEC=16;
function sitDirty(u,v){for(const [du,dv] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])SIT.secs.delete(Math.floor((u+du)/SEC)+','+Math.floor((v+dv)/SEC));}
const SIT_SHADE=[0.82,0.82,1,0.55,0.7,0.7];   // (+x, -x, +y, -y, +z, -z: a little light from above)
const SIT_DIRS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
// a face's corners, for direction j, of a box from (0,0,0) to (1,h,1)
const SIT_QUAD=[[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]];
function sitSection(d,sx,sz){
  const I=SIT.info,BI=SIT.BI,[NX,NY,NZ]=d.data.size,y0=d.data.y0,A=sitA(d),cut=sitCut(d),G1=I.G+1,out=[{p:[],u:[],c:[],i:[]},{p:[],u:[],c:[],i:[]}];
  const at=(u,y,v)=>u<0||v<0||u>=NX||v>=NZ||y<y0||y>=y0+NY||y>cut?0:A[(v*NX+u)*NY+(y-y0)];
  const opq=b=>b&&BI[b]&&!BI[b].tr&&!BI[b].lq;
  for(let v=sz*SEC;v<Math.min(NZ,sz*SEC+SEC);v++)for(let u=sx*SEC;u<Math.min(NX,sx*SEC+SEC);u++){const c0=(v*NX+u)*NY;
    for(let y=y0;y<=Math.min(cut,y0+NY-1);y++){const b=A[c0+y-y0];if(!b)continue;const B=BI[b];if(!B||B.hide||!B.t)continue;
      const O=out[B.lq?1:0],h=B.ramp?Math.max(0.5,(B.ramp[1]+B.ramp[2])/2):B.lq?0.88:1,th=B.thin?0.36:0,w0=th?0.5-th/2:0,w1=th?0.5+th/2:1;
      for(let j=0;j<6;j++){const [dx,dy,dz]=SIT_DIRS[j],n=at(u+dx,y+dy,v+dz);
        if(!th&&h===1&&(opq(n)||n===b&&(B.tr||B.lq)))continue;if(j===2&&h<1&&n===b&&B.lq)continue;
        const t=j===2?B.t[0]:j===3?(B.t[2]??B.t[1]):B.t[1],tu=(t%I.AC)/I.AC,tv=1-Math.floor(t/I.AC)/I.AR,du=1/I.AC,dv=1/I.AR,base=O.p.length/3,s=SIT_SHADE[j];
        for(const q of SIT_QUAD[j]){const x=w0+(w1-w0)*q[0],z=w0+(w1-w0)*q[2];O.p.push(u+x,y-G1+q[1]*h,v+z);O.c.push(s,s,s);}
        O.u.push(tu,tv-dv,tu+du,tv-dv,tu+du,tv-dv+dv*h,tu,tv-dv+dv*h);O.i.push(base,base+1,base+2,base,base+2,base+3);}}}
  return out.map((o,k)=>{if(!o.i.length)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(o.p,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(o.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(o.c,3));g.setIndex(o.i);g.computeBoundingSphere();
    const m=new THREE.Mesh(g,k?SIT.mats.w:SIT.mats.o);m.userData.site=true;return m;}).filter(Boolean);
}
const sitCut=d=>SIT.cut==null?d.data.y0+d.data.size[1]:SIT.cut;
function sitDraw(d){
  if(!SIT.root||!SIT.mats)return;if(SIT.secDoc!==d){SIT.secs.clear();SIT.secDoc=d;}
  const [NX,,NZ]=d.data.size,want=new Set();
  for(let sx=0;sx*SEC<NX;sx++)for(let sz=0;sz*SEC<NZ;sz++){const k=sx+','+sz;want.add(k);if(!SIT.secs.has(k))SIT.secs.set(k,sitSection(d,sx,sz));}
  for(const o of [...SIT.root.children])if(o.userData.site)SIT.root.remove(o);
  for(const [k,L] of SIT.secs)if(want.has(k))for(const m of L)SIT.root.add(m);
  sitHud(d);
}
// the props, people and vehicles: props as their boxes (one batch), people as small figures, vehicles as their boxes
function sitThings(d){
  if(!SIT.root)return;if(SIT.thingsG)SIT.root.remove(SIT.thingsG);const g=new THREE.Group();SIT.thingsG=g;SIT.root.add(g);g.visible=SIT.things;
  const I=SIT.info,G1=sitG()+1,D=d.data,sel=SIT.sel,cut=sitCut(d),up=q=>q.p[1]<=cut;SIT.inst=null;if(!I)return;
  const P=D.props||[],PM=I.props||{};let n=0;for(const q of P)if(up(q))n+=(PM[q.m]||[]).length;
  if(n){const im=new THREE.InstancedMesh(UNIT,new THREE.MeshLambertMaterial({color:0xffffff}),n),M=new THREE.Matrix4(),R=new THREE.Matrix4(),Sc=new THREE.Matrix4(),col=new THREE.Color(),own=[];let k=0;
    P.forEach((q,i)=>{if(!up(q))return;const L=PM[q.m]||[];R.makeRotationY(q.yaw||0).setPosition(q.p[0],q.p[1]-G1,q.p[2]);
      for(const b of L){M.makeTranslation(b[1],b[2],b[3]);Sc.makeScale(b[4],b[5],b[6]);M.multiply(Sc).premultiply(R);im.setMatrixAt(k,M);
        const c=b[0]===-1?(q.tint??0x8a6a4a):b[0]>=0x1000000?b[0]-0x1000000:b[0];col.setHex(c);if(sel&&sel.t==='props'&&sel.i===i)col.lerp(new THREE.Color(0xffd060),0.6);im.setColorAt(k,col);own[k++]=i;}});
    im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.userData.own=own;im.userData.t='props';g.add(im);SIT.inst=im;}
  (D.people||[]).forEach((q,i)=>{if(!up(q))return;const o=new THREE.Group();o.position.set(q.p[0],q.p[1]-G1,q.p[2]);o.rotation.y=q.yaw||0;
    const c=SIT_PCOL[q.k]??0xb03a2e,on=sel&&sel.t==='people'&&sel.i===i,body=new THREE.Mesh(UNIT,matOf(on?0xffd060:c));body.scale.set(0.6,1.0,0.4);body.position.y=0.5;
    const head=new THREE.Mesh(UNIT,matOf(0x6a9a3a));head.scale.set(0.42,0.38,0.42);head.position.y=1.2;const nose=new THREE.Mesh(UNIT,matOf(0x6a9a3a));nose.scale.set(0.12,0.12,0.25);nose.position.set(0,1.18,0.3);
    o.add(body,head,nose);o.userData.pick={t:'people',i};for(const m of [body,head,nose])m.userData.pick={t:'people',i};g.add(o);});
  const VD={};for(const [k,hx,hy,hz] of I.veh||[])VD[k]=[hx,hy,hz];
  (D.cars||[]).forEach((q,i)=>{if(!up(q))return;const [hx,hy,hz]=VD[q.k]||[1,1.6,2],o=new THREE.Group();o.position.set(q.p[0],q.p[1]-G1,q.p[2]);o.rotation.y=q.yaw||0;
    const on=sel&&sel.t==='cars'&&sel.i===i,b=new THREE.Mesh(UNIT,matOf(on?0xffd060:0x8a96a8));b.scale.set(hx*2,hy,hz*2);b.position.y=hy/2;
    const f=new THREE.Mesh(UNIT,matOf(0xe0e0a0));f.scale.set(hx*1.6,hy*0.3,0.1);f.position.set(0,hy*0.6,hz);o.add(b,f);for(const m of [b,f])m.userData.pick={t:'cars',i};g.add(o);});
  sitGizmo(d);
}
// the gizmo on the selected one: moving it moves it in the file (and the turning gizmo turns it, about up only)
function sitGizmo(d){
  gizmo.detach();if(SIT.proxy&&SIT.proxy.parent)SIT.proxy.parent.remove(SIT.proxy);SIT.proxy=null;const s=SIT.sel;if(!s||S.mode==='scale')return;
  const q=(d.data[s.t]||[])[s.i];if(!q){SIT.sel=null;return;}const o=new THREE.Object3D();o.position.set(q.p[0],q.p[1]-sitG()-1,q.p[2]);o.rotation.y=q.yaw||0;o.userData.sitObj=true;
  SIT.root.add(o);SIT.proxy=o;gizmo.showX=gizmo.showZ=S.mode!=='rotate';gizmo.showY=true;gizmo.setMode(S.mode==='rotate'?'rotate':'translate');gizmo.attach(o);
}
gizmo.addEventListener('objectChange',()=>{const o=gizmo.object;if(!o||!o.userData.sitObj)return;const s=SIT.sel,d=doc();if(!s||!d)return;
  const r2=v=>Math.round(v*100)/100;
  sitEdit(D=>{const q=D[s.t][s.i];q.p=[r2(o.position.x),r2(o.position.y+sitG()+1),r2(o.position.z)];q.yaw=r2(o.rotation.y);},'giz',true);});
function sitHud(d){
  if(!SIT.info)return hud(HIP.ready?'Asking the game for its blocks…':'Starting the game…');
  const D=d.data,G=sitG(),h=SIT.hover;let t=sitKindName(D.kind)+'  ·  '+D.w+' x '+D.h+' plots, '+D.size[0]+' x '+D.size[2]+' blocks'+(D.on?'  ·  built in the game':'');
  if(SIT.cut!=null)t+='\ncut at '+(SIT.cut-G)+' over the ground';
  if(h)t+='\n'+(h.b?SIT.BI[h.b].n+' at ':'')+h.u+', '+(h.y-G)+', '+h.v;
  if(SIT.box)t+='\nbox from '+SIT.box[0]+', '+(SIT.box[1]-G)+', '+SIT.box[2]+': click the other corner (Esc to drop it)';
  hud(t);
}
function sitRebuild(d){
  cam.near=0.1;cam.far=6000;cam.updateProjectionMatrix();
  SIT.root=new THREE.Group();content.add(SIT.root);SIT.thingsG=null;
  if(!SIT.info||!SIT.mats){sitAsk();sitHud(d);return;}
  if(!sitA(d)){hud('This file\'s blocks are damaged: they don\'t add up to its size');return;}
  const [NX,,NZ]=d.data.size,gr=new THREE.GridHelper(Math.max(NX,NZ)+16,Math.round((Math.max(NX,NZ)+16)/4),0x3a4250,0x2a2f38);gr.position.set(NX/2,0.01,NZ/2);SIT.root.add(gr);
  {const e=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(NX,0.02,NZ)),new THREE.LineBasicMaterial({color:0x7fb24a}));e.position.set(NX/2,0.02,NZ/2);SIT.root.add(e);}
  // (an arrow out of the side its front's on)
  if(d.data.face>=0){const f=d.data.face,dir=[[-1,0],[1,0],[0,-1],[0,1]][f],ax=new THREE.ArrowHelper(new THREE.Vector3(dir[0],0,dir[1]),new THREE.Vector3(NX/2+dir[0]*NX/2,0.5,NZ/2+dir[1]*NZ/2),8,0xe0b040,2.5,1.6);SIT.root.add(ax);}
  SIT.hovMesh=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02,1.02,1.02)),new THREE.LineBasicMaterial({color:0xffd060,depthTest:false}));SIT.hovMesh.renderOrder=9;SIT.hovMesh.visible=false;SIT.root.add(SIT.hovMesh);
  SIT.boxMesh=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),new THREE.LineBasicMaterial({color:0x8fd0ff,depthTest:false}));SIT.boxMesh.renderOrder=9;SIT.boxMesh.visible=false;SIT.root.add(SIT.boxMesh);
  sitDraw(d);sitThings(d);
}
// ---- pointing at blocks: the block under the mouse and the face's neighbour ----
const sitRay=new THREE.Raycaster();
function sitPoint(e){
  const d=doc();if(!d||d.kind!=='sites'||!SIT.root||!SIT.info)return null;const r=R.domElement.getBoundingClientRect();
  sitRay.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),cam);
  const G1=sitG()+1;let thing=null;
  if(SIT.things&&SIT.thingsG){const h=sitRay.intersectObjects(SIT.thingsG.children,true)[0];if(h){if(h.object.isInstancedMesh)thing={t:'props',i:h.object.userData.own[h.instanceId],dist:h.distance};else if(h.object.userData.pick)thing=Object.assign({dist:h.distance},h.object.userData.pick);}}
  const ms=[];SIT.root.traverse(o=>{if(o.userData.site)ms.push(o);});const h=sitRay.intersectObjects(ms,false)[0];
  let hit=null,put=null;
  if(h){const n=h.face.normal,p=h.point;hit=[Math.floor(p.x-n.x*0.5),Math.floor(p.y-n.y*0.5)+G1,Math.floor(p.z-n.z*0.5)];put=[Math.floor(p.x+n.x*0.5),Math.floor(p.y+n.y*0.5)+G1,Math.floor(p.z+n.z*0.5)];}
  else{const t=-sitRay.ray.origin.y/sitRay.ray.direction.y;if(t>0){const p=sitRay.ray.at(t,new THREE.Vector3());put=[Math.floor(p.x),G1,Math.floor(p.z)];}}
  return {hit,put,thing:thing&&(!h||thing.dist<=h.distance+0.01)?thing:null};
}
function sitHover(e){
  const P=sitPoint(e),d=doc();if(!P||!SIT.hovMesh)return;const tool=SIT.tool,G1=sitG()+1;
  const c=tool==='add'||tool==='box'&&!e.shiftKey?P.put:tool==='select'?null:P.hit;
  if(c){SIT.hovMesh.visible=true;SIT.hovMesh.position.set(c[0]+0.5,c[1]-G1+0.5,c[2]+0.5);SIT.hover={u:c[0],y:c[1],v:c[2],b:sitAt(d,c[0],c[1],c[2])};}else{SIT.hovMesh.visible=false;SIT.hover=null;}
  if(SIT.box&&c){const a=SIT.box,lo=[0,1,2].map(j=>Math.min(a[j],c[j])),hi=[0,1,2].map(j=>Math.max(a[j],c[j]));SIT.boxMesh.visible=true;
    SIT.boxMesh.scale.set(hi[0]-lo[0]+1.04,hi[1]-lo[1]+1.04,hi[2]-lo[2]+1.04);SIT.boxMesh.position.set((lo[0]+hi[0]+1)/2,(lo[1]+hi[1]+1)/2-G1,(lo[2]+hi[2]+1)/2);}
  sitHud(d);
}
function sitClick(e){
  const P=sitPoint(e),d=doc();if(!P)return;const tool=SIT.tool;
  if(tool==='select'||P.thing&&tool!=='box'&&tool!=='pick'){SIT.sel=P.thing?{t:P.thing.t,i:P.thing.i}:null;if(SIT.sel)S.insp='things';sitThings(d);renderInsp();return;}
  if(P.hit||P.put)SIT.lastHit=P.put||P.hit;
  if(tool==='add'&&P.put){if(!SIT.blk)return;sitSet(d,[[...P.put,SIT.blk]]);}
  else if(tool==='remove'&&P.hit)sitSet(d,[[...P.hit,0]]);
  else if(tool==='paint'&&P.hit)sitSet(d,[[...P.hit,SIT.blk]]);
  else if(tool==='pick'&&P.hit){const b=sitAt(d,...P.hit);if(b){SIT.blk=b;SIT.tool='add';renderToolbar();renderInsp();status('Building with '+SIT.BI[b].n);}}
  else if(tool==='box'){const c=e.shiftKey?P.hit:P.put;if(!c)return;if(!SIT.box){SIT.box=c;sitHover(e);return;}
    const a=SIT.box,lo=[0,1,2].map(j=>Math.min(a[j],c[j])),hi=[0,1,2].map(j=>Math.max(a[j],c[j])),n=(hi[0]-lo[0]+1)*(hi[1]-lo[1]+1)*(hi[2]-lo[2]+1);
    SIT.box=null;SIT.boxMesh.visible=false;if(n>400000)return status('That box is too big ('+n+' blocks)',true);
    const L=[],id=e.shiftKey?0:SIT.blk;for(let u=lo[0];u<=hi[0];u++)for(let y=lo[1];y<=hi[1];y++)for(let v=lo[2];v<=hi[2];v++)L.push([u,y,v,id]);sitSet(d,L);status((id?'Filled ':'Emptied ')+n+' blocks');}
}
{let down=null;
  R.domElement.addEventListener('pointerdown',e=>{down=e.button===0?[e.clientX,e.clientY]:null;});
  R.domElement.addEventListener('pointermove',e=>{const d=doc();if(d&&d.kind==='sites')sitHover(e);});
  R.domElement.addEventListener('pointerup',e=>{const d=doc();if(!d||d.kind!=='sites'||!down||gizmo.dragging||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4){down=null;return;}down=null;sitClick(e);});}
addEventListener('keydown',e=>{
  const d=doc();if(!d||d.kind!=='sites')return;const a=document.activeElement;if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)&&a.type!=='range'&&a.type!=='checkbox')return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();
  const T=SIT_TOOLS.find(t=>t[2].toLowerCase()===k);if(T){SIT.tool=T[0];SIT.box=null;if(SIT.boxMesh)SIT.boxMesh.visible=false;renderToolbar();sitHud(d);e.stopImmediatePropagation();return;}
  if(k==='['||k===']'){sitSetCut(d,(SIT.cut==null?d.data.y0+d.data.size[1]:SIT.cut)+(k===']'?1:-1));e.stopImmediatePropagation();return;}
  if((k===','||k==='.')&&SIT.sel){const s=SIT.sel;sitEdit(D=>{const q=D[s.t][s.i];let y=(q.yaw||0)+(k===','?1:-1)*Math.PI/12;y=((y+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;q.yaw=Math.round(y*100)/100;});renderInsp();e.stopImmediatePropagation();return;}
  if(k==='escape'&&SIT.box){SIT.box=null;SIT.boxMesh.visible=false;sitHud(d);}
},true);
function sitSetCut(d,y){const top=d.data.y0+d.data.size[1];y=Math.max(d.data.y0,Math.min(top,Math.round(y)));SIT.cut=y>=top?null:y;SIT.secs.clear();sitDraw(d);sitThings(d);renderToolbar();}

// ---- the toolbar: tools, where it's cut away, the things shown or not ----
function sitToolbar(d){
  const G=sitG(),top=d.data.y0+d.data.size[1],c=SIT.cut==null?top:SIT.cut;
  return SIT_TOOLS.map(([k,t,K,tip])=>'<button data-tool="'+k+'" class="'+(SIT.tool===k?'on':'')+'" title="'+esc(tip)+' ('+K+')">'+t+'</button>').join('')+
    '<span class="sep"></span><label title="Hide everything above this height ([ and ])">Cut <input type="range" id="sCut" min="'+(d.data.y0-G)+'" max="'+(top-G)+'" value="'+(c-G)+'"> <span id="sCutV">'+(SIT.cut==null?'none':c-G)+'</span></label>'+
    '<label><input type="checkbox" id="sThings"'+(SIT.things?' checked':'')+'> Props, people, vehicles</label>'+
    (SIT.blk&&SIT.BI[SIT.blk]?'<span class="sep"></span><span title="Building with">'+(sitSwatch(SIT.blk)?'<img src="'+sitSwatch(SIT.blk)+'" width="16" height="16" style="image-rendering:pixelated;vertical-align:middle"> ':'')+esc(SIT.BI[SIT.blk].n)+'</span>':'');
}
function sitToolbarBind(d){
  for(const b of $('toolbar').querySelectorAll('[data-tool]'))b.onclick=()=>{SIT.tool=b.dataset.tool;SIT.box=null;if(SIT.boxMesh)SIT.boxMesh.visible=false;renderToolbar();};
  const r=$('sCut');if(r){r.oninput=()=>{$('sCutV').textContent=r.value;};r.onchange=()=>sitSetCut(d,+r.value+sitG());}
  $('sThings').onchange=e=>{SIT.things=e.target.checked;if(SIT.thingsG)SIT.thingsG.visible=SIT.things;if(!SIT.things){SIT.sel=null;gizmo.detach();}};
}

// ---- the inspector: the site's switches, the blocks to build with, its props, people and vehicles ----
function sitInsp(B,d){
  if(S.insp==='blocks')return sitBlocksInsp(B,d);if(S.insp==='things')return sitThingsInsp(B,d);
  const D=d.data,G=sitG(),foes=(D.people||[]).some(p=>SIT.info&&SIT.info.foes.some(f=>f[0]===p.k));
  let h='<div class="row"><label>Name</label><input id="sName" value="'+esc(D.name||'')+'" style="flex:1"></div>'+
    '<div class="row"><label>Kind</label><span>'+esc(sitKindName(D.kind))+'</span></div>'+
    '<div class="row"><label></label><label style="width:auto"><input type="checkbox" id="sOn"'+(D.on?' checked':'')+'> Built in the game</label></div>'+
    '<div class="row"><label>Front faces</label><select id="sFace">'+SIT_FACES.map(([v,t])=>'<option value="'+v+'"'+(D.face===v?' selected':'')+'>'+t+'</option>').join('')+'</select></div>'+
    '<p class="note">Used for every '+esc(sitKindName(D.kind)).toLowerCase()+' '+D.w+' x '+D.h+' plots big (or '+D.h+' x '+D.w+', turned), turned so its front faces the way that one\'s does.</p>'+
    '<div class="row"><label>Size</label><span>'+D.size[0]+' x '+D.size[2]+' blocks, '+(D.y0-G)+' to '+(D.y0+D.size[1]-1-G)+' high</span></div>';
  if(foes)h+='<div class="row"><label>Rouse within</label><input type="number" id="sRouse" min="0" step="1" value="'+(D.rouse??16)+'"><span class="note">blocks</span></div>';
  h+='<div class="row"><button id="sRecap" title="Capture the next one of this kind from the world as a new file">Capture another</button></div>';
  h+='<h3>Note</h3><textarea id="sNote" rows="3" style="width:100%">'+esc(D.note||'')+'</textarea>';
  B.innerHTML=h;
  $('sName').onchange=e=>sitEdit(X=>{X.name=e.target.value;});
  $('sOn').onchange=e=>sitEdit(X=>{X.on=e.target.checked;});
  $('sFace').onchange=e=>{sitEdit(X=>{X.face=+e.target.value;});rebuild();};
  if($('sRouse'))$('sRouse').onchange=e=>{const v=+e.target.value;if(isFinite(v))sitEdit(X=>{X.rouse=Math.max(0,v);});};
  $('sRecap').onclick=()=>sitCapture(D.kind);
  $('sNote').onchange=e=>sitEdit(X=>{if(e.target.value)X.note=e.target.value;else delete X.note;});
}
function sitBlocksInsp(B,d){
  if(!SIT.info){B.innerHTML='<p class="note">Waiting for the game…</p>';return;}
  const q=SIT.q.toLowerCase();let h='<input id="sQ" placeholder="Search blocks" value="'+esc(SIT.q)+'" style="width:100%;margin-bottom:6px"><div id="sPal" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(36px,1fr));gap:3px">';
  for(const b of SIT.info.blocks){if(!b.i||b.hide||!b.t||q&&!b.n.toLowerCase().includes(q))continue;const sw=sitSwatch(b.i);
    h+='<button data-b="'+b.i+'" title="'+esc(b.n)+'" style="padding:2px;height:36px'+(SIT.blk===b.i?';outline:2px solid var(--acc2)':'')+'">'+(sw?'<img src="'+sw+'" style="width:100%;height:100%;image-rendering:pixelated;display:block">':esc(b.n.slice(0,3)))+'</button>';}
  h+='</div>';if(SIT.blk&&SIT.BI[SIT.blk])h+='<p class="note">'+esc(SIT.BI[SIT.blk].n)+'</p>';
  B.innerHTML=h;
  $('sQ').oninput=e=>{SIT.q=e.target.value;const p=e.target.selectionStart;sitBlocksInsp(B,d);const n=$('sQ');n.focus();n.setSelectionRange(p,p);};
  for(const b of B.querySelectorAll('[data-b]'))b.onclick=()=>{SIT.blk=+b.dataset.b;if(SIT.tool==='select'||SIT.tool==='remove'||SIT.tool==='pick')SIT.tool='add';renderToolbar();sitBlocksInsp(B,d);};
}
const SIT_LISTS=[['props','Props'],['people','People'],['cars','Vehicles']];
function sitThingName(t,q){if(t==='props')return q.m;if(t==='cars')return q.k;const f=SIT.info&&SIT.info.foes.find(x=>x[0]===q.k);return f?f[1]:(SIT_PEOPLE.find(x=>x[0]===q.k)||[0,q.k])[1];}
function sitThingsInsp(B,d){
  const D=d.data,s=SIT.sel,G=sitG();let h='';
  for(const [t,title] of SIT_LISTS){const L=D[t]||[];
    h+='<h3 style="display:flex;align-items:center">'+title+' <small style="margin-left:6px;color:var(--dim)">'+L.length+'</small><span class="grow"></span><button class="x" data-add="'+t+'" title="Add one where you last clicked">+ add</button></h3>';
    if(L.length)h+='<div class="list" style="max-height:140px">'+L.map((q,i)=>'<div class="item'+(s&&s.t===t&&s.i===i?' on':'')+'" data-t="'+t+'" data-i="'+i+'">'+esc(sitThingName(t,q))+'<small>'+Math.round(q.p[0])+', '+Math.round(q.p[1]-G)+', '+Math.round(q.p[2])+'</small></div>').join('')+'</div>';}
  const q=s&&(D[s.t]||[])[s.i];
  if(q){const I=SIT.info||{props:{},veh:[],foes:[]},n=(id,v,st=0.1)=>'<input type="number" id="'+id+'" step="'+st+'" value="'+v+'">';
    h+='<h3>'+esc(sitThingName(s.t,q))+'</h3>';
    if(s.t==='props')h+='<div class="row"><label>Model</label><select id="tM">'+Object.keys(I.props).sort().map(k=>'<option'+(k===q.m?' selected':'')+'>'+esc(k)+'</option>').join('')+'</select></div>';
    else if(s.t==='cars')h+='<div class="row"><label>Vehicle</label><select id="tM">'+I.veh.map(([k])=>'<option'+(k===q.k?' selected':'')+'>'+esc(k)+'</option>').join('')+'</select></div>';
    else h+='<div class="row"><label>Who</label><select id="tM"><optgroup label="Townsfolk">'+SIT_PEOPLE.map(([k,t])=>'<option value="'+k+'"'+(k===q.k?' selected':'')+'>'+esc(t)+'</option>').join('')+
      '</optgroup><optgroup label="Enemies (keep their posts till roused)">'+I.foes.map(([k,t])=>'<option value="'+k+'"'+(k===q.k?' selected':'')+'>'+esc(t)+'</option>').join('')+'</optgroup></select></div>';
    h+='<div class="row"><label>Across, up, along</label><span class="v3">'+n('tX',q.p[0])+n('tY',+(q.p[1]-G).toFixed(2))+n('tZ',q.p[2])+'</span></div>';
    h+='<div class="row"><label>Facing (degrees)</label>'+n('tYaw',Math.round((q.yaw||0)*180/Math.PI),15)+'<span class="note">, and . turn it</span></div>';
    if(s.t==='props'&&(I.props[q.m]||[]).some(b=>b[0]===-1))h+='<div class="row"><label>Tint</label><input type="color" id="tTint" value="#'+(q.tint??0x8a6a4a).toString(16).padStart(6,'0')+'"></div>';
    h+='<div class="row"><button id="tDup">Duplicate</button><button id="tDel">Delete</button></div>';}
  else h+='<p class="note">Click one in the view (the Select tool, or any tool on a prop, person or vehicle) to move it with the arrows.</p>';
  B.innerHTML=h;
  for(const e of B.querySelectorAll('.list .item'))e.onclick=()=>{SIT.sel={t:e.dataset.t,i:+e.dataset.i};sitThings(d);renderInsp();sitFocus(d);};
  for(const b of B.querySelectorAll('[data-add]'))b.onclick=()=>sitAdd(d,b.dataset.add);
  if(!q)return;
  const set=f=>sitEdit(X=>f(X[s.t][s.i]));
  $('tM').onchange=e=>{set(o=>{if(s.t==='props')o.m=e.target.value;else o.k=e.target.value;});renderInsp();};
  for(const [id,j] of [['tX',0],['tY',1],['tZ',2]])$(id).onchange=e=>{const v=+e.target.value;if(isFinite(v))set(o=>{o.p[j]=j===1?v+G:v;});};
  $('tYaw').onchange=e=>{const v=+e.target.value;if(isFinite(v))set(o=>{o.yaw=Math.round(v*Math.PI/180*100)/100;});};
  if($('tTint'))$('tTint').onchange=e=>set(o=>{o.tint=parseInt(e.target.value.slice(1),16);});
  $('tDup').onclick=()=>sitDup(d);$('tDel').onclick=()=>sitDel(d);
}
function sitAdd(d,t){
  const D=d.data,G1=sitG()+1,c=SIT.lastHit||[Math.floor(D.size[0]/2),G1,Math.floor(D.size[2]/2)],I=SIT.info||{props:{},veh:[['car']]};
  const p=[c[0]+0.5,c[1],c[2]+0.5],q=t==='props'?{m:Object.keys(I.props).includes('chair')?'chair':Object.keys(I.props)[0],p,yaw:0}:t==='cars'?{k:'car',p:[c[0],c[1],c[2]],yaw:0}:{k:'staff',p,yaw:0};
  sitEdit(X=>{(X[t]=X[t]||[]).push(q);SIT.sel={t,i:X[t].length-1};});SIT.things=true;renderToolbar();renderInsp();
}
function sitDup(d){const s=SIT.sel;if(!s)return;const q=d.data[s.t][s.i];sitEdit(X=>{const c=clone(q);c.p=[c.p[0]+1,c.p[1],c.p[2]];X[s.t].splice(s.i+1,0,c);SIT.sel={t:s.t,i:s.i+1};});renderInsp();}
function sitDel(d){const s=SIT.sel;if(!s)return;sitEdit(X=>{X[s.t].splice(s.i,1);});SIT.sel=null;gizmo.detach();renderInsp();}
function sitFocus(d){const s=SIT.sel,q=s&&d.data[s.t][s.i];if(!q)return;const t=new THREE.Vector3(q.p[0],q.p[1]-sitG()-1,q.p[2]),off=cam.position.clone().sub(orbit.target).setLength(18);orbit.target.copy(t);cam.position.copy(t).add(off);orbit.update();}

// ---- the list: every kind of site by group, each with the files captured of it ----
function sitList(hit){
  sitAsk();const I=SIT.info,files=S.list.sites||[];
  if(!I){let h='<div class="note">'+(HIP.ready?'Asking the game for its kinds of site…':'Starting the game…')+'</div>';for(const n of files)if(hit(n))h+=listIt('sites',n,n);return h;}
  const q=S.search,byK={};for(const n of files)(byK[sitKindOf(n)]=byK[sitKindOf(n)]||[]).push(n);
  const cur=doc()&&doc().kind==='sites'?doc().data.kind:null;let h='';
  for(const [g,items] of I.kinds){const hits=items.filter(([k,n])=>hit(k)||hit(n)||(byK[k]||[]).some(f=>hit(f)));if(!hits.length)continue;
    const nf=hits.reduce((a,[k])=>a+(byK[k]||[]).length,0),op=!!q||SIT.openG[g]===true||SIT.openG[g]===undefined&&items.some(([k])=>k===cur);
    h+='<div class="grp"><button class="tw" data-sg="'+esc(g)+'">'+(op?'▾':'▸')+'</button><span>'+esc(g)+'</span><small>'+(nf?nf+' of ':'')+items.length+'</small></div>';
    if(!op)continue;
    for(const [k,n] of hits){const F=byK[k]||[];
      h+='<div class="item kindrow" data-kind="'+esc(k)+'" title="'+esc(k)+'">'+esc(n)+'<small>'+(F.length?F.length:'')+'</small><button class="x" data-cap="'+esc(k)+'" title="Capture one from the world">+</button></div>';
      for(const f of F){const d=DOCS.get(key('sites',f));h+='<div class="item sub'+(S.kind==='sites'&&S.name===f?' on':'')+'" data-k="sites" data-n="'+esc(f)+'">'+esc(d&&d.data.name||f)+listDot('sites',f)+'<small>'+(d&&d.data.on?'on':'')+'</small></div>';}}}
  return h;
}
function sitListBind(){
  for(const b of $('assetList').querySelectorAll('[data-sg]'))b.onclick=()=>{const g=b.dataset.sg,cur=b.textContent==='▾';SIT.openG[g]=!cur;renderList();};
  for(const b of $('assetList').querySelectorAll('[data-cap]'))b.onclick=e=>{e.stopPropagation();sitCapture(b.dataset.cap);};
  for(const r of $('assetList').querySelectorAll('.kindrow'))r.onclick=()=>{const k=r.dataset.kind,F=(S.list.sites||[]).filter(n=>sitKindOf(n)===k);if(F.length)open('sites',F[0]);else sitCapture(k);};
}
// ---- the hooks ----
EXT.sites={noGrid:true,noPick:true,
  list:sitList,listBind:sitListBind,
  open(d){S.insp=['site','blocks','things'].includes(S.insp)?S.insp:'site';SIT.sel=null;SIT.box=null;SIT.cut=null;SIT.hover=null;SIT.lastHit=null;S.playing=false;sitAsk();},
  rebuild:sitRebuild,
  frame(d){const [NX,NY,NZ]=d.data.size,r=Math.max(NX,NZ,20)*1.25;orbit.target.set(NX/2,Math.min(8,NY/3),NZ/2);cam.position.set(NX/2+r*0.75,r*0.75,NZ/2+r*0.95);},
  toolbar:sitToolbar,toolbarBind:sitToolbarBind,
  inspTabs:()=>[['site','Site'],['blocks','Blocks'],['things','Things']],insp:sitInsp,
  play:()=>false,
  tick(){if(!SIT.asked&&HIP.ready&&S.tab==='sites')sitAsk();},
  undo:sitUndo,
  del:sitDel,dup:sitDup,
  message:sitMessage,
  async start(){}};
// (the hidden game says it's ready to the Hippo tab's handler, so this tab looks for itself)
setInterval(()=>{if(S.tab==='sites'&&!SIT.asked)sitAsk();},500);
