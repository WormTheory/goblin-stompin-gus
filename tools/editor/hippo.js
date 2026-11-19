// ---- the Hippo tab: Gus's and Gertie's moves (src/assets/moves/), their numbers, what they smash and their own
// hitboxes. The game itself acts each move out: a copy of it runs in a hidden frame (game/index.html?editor), takes the
// move as it's being edited (liveMove) and records it (liveRecord, src/js/ui/editor-live.js), every part of the hippo
// on every frame and every hit volume, and the view plays that back. So what's shown is what the game does, but a
// change to the game's code only shows after Build. Gus and Gertie are the same in all but looks: one move file
// serves both ----
'use strict';
const HIP={frame:null,ready:false,busy:false,again:false,id:0,rec:null,f:0,speed:1,loop:true,nodes:null,sig:'',world:null,hitObjs:[],
  show:{dmg:true,block:true,cells:true},recT:0,err:''};
const HIP_SHAPES=[['orig','Its own shape'],['sphere','Sphere'],['semi','Dome'],['cube','Cube'],['cone','Cone']];
const HB_SH=[['sphere','Sphere'],['semi','Dome'],['cube','Cube'],['cone','Cone'],['cylinder','Cylinder']];
const HIP_COL={dmg:0xff3a3a,block:0xff9a2a,sel:0xffd060};

// (the hidden game: made the first time a move is opened)
function hipFrame(){
  if(HIP.frame)return;
  const f=document.createElement('iframe');f.src='/game/index.html?editor';f.title='Game (records the moves)';f.setAttribute('aria-hidden','true');
  f.style.cssText='position:fixed;left:-3000px;top:0;width:480px;height:320px;border:0;opacity:0;pointer-events:none';   // (off screen, not display:none: it still runs)
  document.body.appendChild(f);HIP.frame=f;hud('Starting the game to record the move…');
}
// ask for the open move acted out (one at a time: an edit meanwhile asks again when it's done)
function hipRecord(){
  const d=doc();if(!d||d.kind!=='moves')return;hipFrame();
  if(!HIP.ready||HIP.busy){HIP.again=true;return;}
  if(assetCheck('moves',d.name,d.data).length){HIP.err='The file has problems: fix them to see it';hipHud();return;}
  const w=HIP.frame.contentWindow;HIP.busy=true;HIP.again=false;
  w.postMessage({type:'gsg-asset',kind:'moves',name:d.name,file:clone(d.data)},location.origin);
  w.postMessage({type:'gsg-rec',key:d.name,id:++HIP.id},location.origin);
}
function hipMessage(e){
  const fw=HIP.frame&&HIP.frame.contentWindow;if(!fw||e.source!==fw)return false;const m=e.data;
  if(m.type==='gsg-ready'){HIP.ready=true;hipRecord();return true;}
  if(m.type==='gsg-asset-done'){if(m.result!=='ok')HIP.err='The game couldn\'t take it: '+m.result;return true;}
  if(m.type==='gsg-rec-done'){HIP.busy=false;
    if(m.rec&&m.rec.error)HIP.err='Recording failed: '+m.rec.error;
    else{const d=doc();if(d&&d.kind==='moves'&&m.rec.key===d.name){const first=!HIP.rec||HIP.rec.key!==m.rec.key;HIP.err='';HIP.rec=m.rec;HIP.f=Math.min(HIP.f,m.rec.N-1);
      if(S.kind==='moves'){rebuild();if(first)frameView();drawTL();if(S.insp==='hb')refreshInsp();}}}
    if(HIP.again)hipRecord();return true;}
  return false;
}
// ---- the view: the hippo built from the recording's parts, the floor, and each hit volume as lines ----
function hipModel(R){
  const sig=R.model.map(q=>q.n+(q.g||'')+q.p).join('|');if(HIP.nodes&&HIP.sig===sig)return HIP.nodes;
  const N=R.model.map(q=>{if(!q.g){const g=new THREE.Group();g.name=q.n;return g;}
    const m=new THREE.Mesh(UNIT,matOf(q.c));m.userData.g=q.g;m.name=q.n;return m;});
  // (a box's own size is its scale times its shape's: the recording keeps each part's scale, so the size goes in a child)
  const out=R.model.map((q,i)=>{if(!q.g)return N[i];const g=new THREE.Group();g.name=q.n;const m=N[i];m.scale.set(...q.g);g.add(m);return g;});
  R.model.forEach((q,i)=>{if(q.p>=0)out[q.p].add(out[i]);});
  HIP.nodes=out;HIP.sig=sig;return out;
}
function hipApply(f){
  const R=HIP.rec;if(!R||!HIP.nodes)return;f=Math.max(0,Math.min(R.N-1,Math.floor(f)));const M=R.M,T=R.tr;
  HIP.nodes.forEach((o,i)=>{const b=(f*M+i)*11;o.position.set(T[b],T[b+1],T[b+2]);o.quaternion.set(T[b+3],T[b+4],T[b+5],T[b+6]);o.scale.set(T[b+7],T[b+8],T[b+9]);o.visible=T[b+10]>0.5;});
  const sel=S.hsel;
  for(const H of HIP.hitObjs){const h=H.h,on=f>=h.f&&f<=h.until&&HIP.show[h.kind];H.o.visible=on;if(H.c)H.c.visible=on&&HIP.show.cells;
    if(on){const now=f===h.f,isSel=sel>=0&&h.src===sel;H.o.material.color.setHex(isSel?HIP_COL.sel:HIP_COL[h.kind]);H.o.material.opacity=now?1:0.35;}}
  hipHud();
}
function hipHud(){const R=HIP.rec;if(S.kind!=='moves')return;
  if(HIP.err)return hud(HIP.err);if(!R)return hud(HIP.ready?'Recording…':'Starting the game to record the move…');
  const f=Math.floor(HIP.f),here=R.hits.filter(h=>h.f===f).length;
  hud('frame '+f+' of '+(R.N-1)+'  ('+(f/60).toFixed(2)+' s)'+(here?'  ·  '+here+' hit'+(here>1?'s':'')+' on this frame':''));}
const LINE_MATS=[];
function hipRebuild(d){
  for(const H of HIP.hitObjs){H.o.geometry.dispose();H.o.material.dispose();if(H.c){H.c.geometry.dispose();H.c.material.dispose();}}
  HIP.hitObjs=[];const R=HIP.rec&&HIP.rec.key===d.name?HIP.rec:null;
  const W=new THREE.Group();content.add(W);HIP.world=W;
  // (the floor: a block grid where he stands; the recording's heights are the world's, his ground one above G)
  const gy=R?R.G+1:0;W.position.y=-gy;
  const fl=new THREE.GridHelper(64,64,0x6a5030,0x3a3428);fl.position.set(0.5,gy+0.002,0.5);W.add(fl);   // (a block's edges are half a block off his start)
  if(!R){hipHud();return;}
  for(const o of hipModel(R))if(!o.parent)W.add(o);
  for(const h of R.hits){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(h.L,3));
    const mat=new THREE.LineBasicMaterial({color:HIP_COL[h.kind],transparent:true,depthTest:false});const o=new THREE.LineSegments(g,mat);o.renderOrder=9;W.add(o);
    let c=null;if(h.cells&&h.cells.length){const P=[],E=[[0,0,0,1,0,0],[0,1,0,1,1,0],[0,0,1,1,0,1],[0,1,1,1,1,1],[0,0,0,0,1,0],[1,0,0,1,1,0],[0,0,1,0,1,1],[1,0,1,1,1,1],[0,0,0,0,0,1],[1,0,0,1,0,1],[0,1,0,0,1,1],[1,1,0,1,1,1]];
      for(let i=0;i<h.cells.length&&i<2700;i+=3){const x=h.cells[i],y=h.cells[i+1],z=h.cells[i+2];for(const e of E)P.push(x+e[0],y+e[1],z+e[2],x+e[3],y+e[4],z+e[5]);}
      const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
      c=new THREE.LineSegments(cg,new THREE.LineBasicMaterial({color:0xffb050,transparent:true,opacity:0.45,depthTest:false}));c.renderOrder=8;W.add(c);}
    HIP.hitObjs.push({h,o,c});}
  hipApply(HIP.f);
}
// ---- the hitboxes: the move's own, in the file (a and b are frames counted from the move's start, its anchor) ----
const hbList=d=>(d.data.hitboxes&&d.data.hitboxes.boxes)||[];
const hipAnchor=()=>{const R=HIP.rec;return R&&R.anchors&&R.anchors.length?R.anchors[R.anchors.length-1]:null;};
function hipNew(d,kind){const P=d.data.params||{},v=k=>P[k]?P[k].v:0;
  return{kind,shape:'sphere',bone:'root',r:kind==='block'?1.5:2,len:3,fwd:2,up:1,side:0,a:0,b:10,dmg:Math.round(v('dmg')||10),carDmg:Math.round(v('carDmg')||v('dmg')||8)};}
// the move's built-in hits as hitboxes: runs of the same kind and shape (gaps of a few frames bridged), placed from
// where he was and which way he faced at the time (the Dev tab's old Copy built-in hits)
function hipFromBuiltIn(d){
  const R=HIP.rec,anc=hipAnchor();if(!R||anc===null)return[];const groups=[];
  for(const h of R.hits){if(h.src!==undefined)continue;let G=groups.find(g=>g.kind===h.kind&&g.shape===h.shape&&h.f-g.last<=8);
    if(!G){G={kind:h.kind,shape:h.shape,first:h.f,last:h.f,o:h.o,f:h.f};groups.push(G);}G.last=h.f;}
  const P=d.data.params||{},v=k=>P[k]?P[k].v:0;
  return groups.map(G=>{const o=G.o,f=G.f,px=R.pos[f*4],py=R.pos[f*4+1],pz=R.pos[f*4+2],hd=R.pos[f*4+3],hx=Math.sin(hd),hz=Math.cos(hd);
    let shape='sphere',r=o.r||1,len=3,cx=o.x,cy=o.y,cz=o.z;
    if(G.shape==='box'){shape='cube';r=Math.max(o.sx,o.sz,o.sy)/2;cy=o.y+o.sy/2;}
    else if(G.shape==='cyl'){shape='cylinder';r=o.r;len=o.h;}
    else if(G.shape==='cone'){shape='cone';r=o.r;len=o.len;}
    else if(G.shape==='cap'&&o.dn===0)shape='semi';
    else if(G.shape==='slot'){shape='sphere';r=o.r+o.len/2;cx=o.x+Math.sin(o.rot)*o.len/2;cz=o.z+Math.cos(o.rot)*o.len/2;cy=o.y+o.h/2;}
    const dx=cx-px,dz=cz-pz,r1=x=>Math.round(x*10)/10;
    return{kind:G.kind,shape,bone:'root',r:r1(r),len:r1(len),fwd:r1(dx*hx+dz*hz),up:r1(cy-py),side:r1(-dx*hz+dz*hx),a:G.first-anc,b:G.last-anc,dmg:Math.round(v('dmg')||10),carDmg:Math.round(v('carDmg')||8)};});
}
// ---- the inspector: the move's numbers and smash, or its hitboxes ----
const hipNum=(v,st)=>st>=1?String(Math.round(v)):(+v).toFixed(st>=0.1?1:2);
function hipInsp(B,d){
  if(S.insp==='hb')return hipHbInsp(B,d);
  const M=d.data,P=M.params||{},saved=(()=>{try{return JSON.parse(d.saved).params||{};}catch(e){return {};}})();
  let h='<div class="row"><label>Name</label><input id="mvName" value="'+esc(M.name||'')+'" style="flex:1"></div><h3>Numbers</h3>';
  for(const pk in P){const q=P[pk],ch=saved[pk]&&Math.abs(saved[pk].v-q.v)>1e-9;
    h+='<div class="row chrow" title="'+esc(pk)+'"><label style="width:140px'+(ch?';color:var(--acc2)':'')+'">'+esc(q.name)+'</label><input type="range" id="pr_'+pk+'" min="'+q.min+'" max="'+q.max+'" step="'+q.step+'" value="'+q.v+'">'+
      '<input type="number" id="pn_'+pk+'" step="'+q.step+'" value="'+hipNum(q.v,q.step)+'"></div>';}
  if(M.smash)h+='<h3>Smashing</h3><div class="row"><label>Shape</label><select id="smSh">'+HIP_SHAPES.map(([k,t])=>'<option value="'+k+'"'+(M.smash.shape===k?' selected':'')+'>'+t+'</option>').join('')+'</select></div>'+
    '<div class="row"><label>'+esc(M.smash.name||'Size')+'</label><input type="number" id="smSz" step="0.1" value="'+M.smash.size+'"></div>';
  h+='<h3>Note</h3><textarea id="mvNote" rows="3" style="width:100%">'+esc(M.note||'')+'</textarea>';
  B.innerHTML=h;
  $('mvName').onchange=e=>edit(M2=>{M2.name=e.target.value;});
  for(const pk in P){const r=$('pr_'+pk),n=$('pn_'+pk),st=P[pk].step;
    r.oninput=()=>{n.value=hipNum(+r.value,st);edit(M2=>{M2.params[pk].v=+r.value;},'pr'+pk,true);};r.onchange=()=>{mergeTag=null;renderInsp();};
    n.onchange=()=>{const v=+n.value;if(isFinite(v))edit(M2=>{M2.params[pk].v=v;});};}
  if($('smSh')){$('smSh').onchange=e=>edit(M2=>{M2.smash.shape=e.target.value;});$('smSz').onchange=e=>{const v=+e.target.value;if(isFinite(v))edit(M2=>{M2.smash.size=v;});};}
  $('mvNote').onchange=e=>edit(M2=>{if(e.target.value)M2.note=e.target.value;else delete M2.note;});
}
function hipHbInsp(B,d){
  const M=d.data,H=M.hitboxes,L=hbList(d),b=L[S.hsel],bones=(HIP.rec&&HIP.rec.bones)||['root'];
  let h='<div class="row"><label style="width:auto"><input type="checkbox" id="hbOn"'+(H&&H.on?' checked':'')+(L.length?'':' disabled')+'> Use these in place of its built-in hits</label></div>';
  h+='<div class="row"><button id="hbAddD">+ Damage</button><button id="hbAddB">+ Smash</button><button id="hbCopy"'+(HIP.rec&&hipAnchor()!==null?'':' disabled')+' title="The hits the move makes now, as hitboxes to edit">Copy built-in hits</button></div>';
  h+='<div class="row"><button id="hbDup"'+(b?'':' disabled')+'>Duplicate</button><button id="hbDel"'+(b?'':' disabled')+'>Delete</button></div>';
  h+='<div class="list">'+L.map((x,i)=>'<div class="item'+(i===S.hsel?' on':'')+'" data-i="'+i+'"><span style="color:'+(x.kind==='block'?'#ff9a2a':'#ff3a3a')+'">■</span> '+
    (x.kind==='block'?'smash':'damage')+' '+esc(x.shape)+'<small>frames '+x.a+'–'+x.b+'</small></div>').join('')+'</div>';
  if(!L.length)h+='<p class="note">None: the move uses its built-in hits.</p>';
  if(b){const n=(id,v,st=0.1)=>'<input type="number" id="'+id+'" step="'+st+'" value="'+v+'">';
    h+='<h3>Hitbox '+(S.hsel+1)+'</h3>';
    h+='<div class="row"><label>Does</label><select id="hk"><option value="dmg"'+(b.kind==='dmg'?' selected':'')+'>Damage</option><option value="block"'+(b.kind==='block'?' selected':'')+'>Smash blocks</option></select></div>';
    h+='<div class="row"><label>Shape</label><select id="hsh">'+HB_SH.map(([k,t])=>'<option value="'+k+'"'+(b.shape===k?' selected':'')+'>'+t+'</option>').join('')+'</select></div>';
    h+='<div class="row"><label>From</label><select id="hbone">'+bones.map(k=>'<option'+((b.bone||'root')===k?' selected':'')+'>'+esc(k)+'</option>').join('')+'</select></div>';
    h+='<div class="row"><label>Ahead, up, right</label><span class="v3">'+n('hf',b.fwd||0)+n('hu',b.up||0)+n('hs',b.side||0)+'</span></div>';
    h+='<div class="row"><label>Tilt (degrees)</label><span class="v3">'+n('hrx',b.rx||0,5)+n('hry',b.ry||0,5)+n('hrz',b.rz||0,5)+'</span></div>';
    h+='<div class="row"><label>Radius</label>'+n('hr',b.r)+(b.shape==='cone'||b.shape==='cylinder'?'<label style="width:auto">'+(b.shape==='cone'?'Length':'Height')+'</label>'+n('hl',b.len):'')+'</div>';
    h+='<div class="row"><label>Frames</label>'+n('ha',b.a,1)+n('hb',b.b,1)+'</div>';
    if(b.kind==='dmg')h+='<div class="row"><label>Damage</label>'+n('hd',b.dmg??0,1)+'<label style="width:auto">to cars</label>'+n('hc',b.carDmg??0,1)+'</div>';}
  B.innerHTML=h;
  const put=f=>edit(M2=>{if(!M2.hitboxes)M2.hitboxes={on:true,boxes:[]};f(M2.hitboxes);});
  for(const e of B.querySelectorAll('.list .item'))e.onclick=()=>{S.hsel=+e.dataset.i;renderInsp();hipApply(HIP.f);drawTL();};
  $('hbOn').onchange=e=>put(H2=>{H2.on=e.target.checked;});
  const add=L2=>{put(H2=>{if(!H2.boxes.length)H2.on=true;H2.boxes.push(...L2);S.hsel=H2.boxes.length-1;});};
  $('hbAddD').onclick=()=>add([hipNew(d,'dmg')]);$('hbAddB').onclick=()=>add([hipNew(d,'block')]);
  $('hbCopy').onclick=()=>{const L2=hipFromBuiltIn(d);if(!L2.length)return status('This move makes no hits to copy',true);add(L2);};
  if(!b)return;
  $('hbDup').onclick=()=>hipDup(d);$('hbDel').onclick=()=>hipDel(d);
  const setB=(f,tag)=>e=>edit(M2=>{f(M2.hitboxes.boxes[S.hsel],e.target);},tag);
  $('hk').onchange=setB((x,t)=>{x.kind=t.value;});$('hsh').onchange=setB((x,t)=>{x.shape=t.value;});$('hbone').onchange=setB((x,t)=>{x.bone=t.value;});
  for(const [id,f] of [['hf','fwd'],['hu','up'],['hs','side'],['hrx','rx'],['hry','ry'],['hrz','rz'],['hr','r'],['hl','len'],['hd','dmg'],['hc','carDmg']])
    if($(id))$(id).onchange=setB((x,t)=>{const v=+t.value;if(!isFinite(v))return;if((f==='rx'||f==='ry'||f==='rz')&&!v)delete x[f];else x[f]=f==='r'||f==='len'?Math.max(0.05,v):v;});
  $('ha').onchange=setB((x,t)=>{x.a=Math.round(+t.value)||0;if(x.b<x.a)x.b=x.a;});$('hb').onchange=setB((x,t)=>{x.b=Math.round(+t.value)||0;if(x.a>x.b)x.a=x.b;});
}
function hipDup(d){const b=hbList(d)[S.hsel];if(!b)return;edit(M2=>{M2.hitboxes.boxes.splice(S.hsel+1,0,clone(b));S.hsel++;});}
function hipDel(d){const L=hbList(d);if(!L[S.hsel])return;edit(M2=>{const H=M2.hitboxes;H.boxes.splice(S.hsel,1);if(!H.boxes.length)delete M2.hitboxes;S.hsel=Math.max(-1,Math.min(S.hsel,(H.boxes.length||0)-1));});}
// ---- the timeline: the recording's frames across; a row of the hits it made (the built-in ones, or the move's own
// switched on), then a row per hitbox, its bar the frames it's live (drag it, or its ends); the dashed line is where
// the move starts, which the hitboxes count from ----
const HT={L:96,R:16,top:18,row:16};
const hipX=f=>{const R=HIP.rec,W=TL.clientWidth;return HT.L+f/Math.max(1,R?R.N:1)*(W-HT.L-HT.R);};
const hipFAt=x=>{const R=HIP.rec,W=TL.clientWidth;return Math.max(0,Math.min((R?R.N:1)-1,Math.round((x-HT.L)/(W-HT.L-HT.R)*(R?R.N:1))));};
function hipTLDraw(){
  const W=TL.clientWidth,Ht=TL.clientHeight;if(TL.width!==W*devicePixelRatio||TL.height!==Ht*devicePixelRatio){TL.width=W*devicePixelRatio;TL.height=Ht*devicePixelRatio;}
  tg.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);tg.clearRect(0,0,W,Ht);tg.font='11px system-ui';
  const R=HIP.rec,d=doc();if(!R||!d){tg.fillStyle='#8890a0';tg.fillText(HIP.err||'Recording…',8,14);return;}
  const L=hbList(d),anc=hipAnchor(),bot=Ht-14;
  for(let f=0;f<R.N;f+=10){const x=hipX(f);tg.fillStyle=f%60===0?'#3a404c':'#262a32';tg.fillRect(x,HT.top,1,bot-HT.top);tg.fillStyle='#8890a0';if(f%30===0)tg.fillText(f,x-6,Ht-2);}
  const y0=HT.top;tg.fillStyle='#20232a';tg.fillRect(HT.L,y0,W-HT.L-HT.R,HT.row-2);tg.fillStyle='#8890a0';tg.fillText('hits',6,y0+11);
  for(const h of R.hits){tg.fillStyle=h.src!==undefined&&h.src===S.hsel?'#ffd060':h.kind==='block'?'#ff9a2a':'#ff3a3a';tg.fillRect(hipX(h.f),y0+(h.kind==='block'?7:2),Math.max(2,hipX(h.f+1)-hipX(h.f)-1),5);}
  L.forEach((b,i)=>{const y=HT.top+(i+1)*HT.row,on=i===S.hsel;tg.fillStyle=i%2?'#1c1f24':'#20232a';tg.fillRect(HT.L,y,W-HT.L-HT.R,HT.row-2);
    tg.fillStyle=on?'#ffd060':'#d0d4dc';tg.fillText((i+1)+' '+(b.kind==='block'?'smash':'damage'),6,y+11);
    if(anc===null)return;const a=hipX(anc+b.a),e=hipX(anc+b.b+1);tg.globalAlpha=on?0.9:0.6;tg.fillStyle=on?'#ffd060':b.kind==='block'?'#ff9a2a':'#ff3a3a';tg.fillRect(a,y+2,Math.max(3,e-a),HT.row-6);tg.globalAlpha=1;
    tg.fillStyle='#fff';tg.fillRect(a,y+2,2,HT.row-6);tg.fillRect(Math.max(a,e-2),y+2,2,HT.row-6);});
  if(!L.length){tg.fillStyle='#8890a0';tg.fillText('No hitboxes of its own (Hitboxes tab, on the right)',HT.L+6,HT.top+HT.row+12);}
  if(anc!==null){const x=hipX(anc);tg.strokeStyle='#7fb24a';tg.setLineDash([3,3]);tg.beginPath();tg.moveTo(x,HT.top-4);tg.lineTo(x,bot);tg.stroke();tg.setLineDash([]);tg.fillStyle='#7fb24a';tg.fillText('starts',x+3,HT.top-6);}
  const x=hipX(Math.floor(HIP.f));tg.fillStyle='#ffd060';tg.fillRect(x-1,0,2,Ht);
}
const HIP_TL={drag:null,
  bar:()=>'<button id="tlPlay">'+(S.playing?'Pause':'Play')+' (Space)</button><label><input type="checkbox" id="tlLoop"'+(HIP.loop?' checked':'')+'> Loop</label>'+
    '<label>Speed <select id="tlSpd">'+[0.1,0.25,0.5,1].map(v=>'<option'+(v===HIP.speed?' selected':'')+'>'+v+'</option>').join('')+'</select></label>'+
    '<span class="sep"></span>'+[['dmg','Damage','#ff3a3a'],['block','Smash','#ff9a2a'],['cells','Blocks it takes','#ffb050']].map(([k,t,c])=>'<label><input type="checkbox" data-show="'+k+'"'+(HIP.show[k]?' checked':'')+'> <span style="color:'+c+'">■</span> '+t+'</label>').join('')+'<span class="grow"></span>',
  barBind(){$('tlPlay').onclick=()=>setPlaying(!S.playing);$('tlLoop').onchange=e=>HIP.loop=e.target.checked;$('tlSpd').onchange=e=>HIP.speed=+e.target.value;
    for(const c of $('tlbar').querySelectorAll('[data-show]'))c.onchange=()=>{HIP.show[c.dataset.show]=c.checked;hipApply(HIP.f);};},
  draw:hipTLDraw,
  pointerdown(e){const R=HIP.rec,d=doc();if(!R||!d)return;const r=TL.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,anc=hipAnchor(),L=hbList(d);
    const i=Math.floor((y-HT.top)/HT.row)-1;this.drag=null;
    if(i>=0&&i<L.length&&anc!==null){const b=L[i],a=hipX(anc+b.a),z=hipX(anc+b.b+1);S.hsel=i;
      if(x>=a-5&&x<=z+5)this.drag={i,part:Math.abs(x-a)<5?'a':Math.abs(x-z)<5?'b':'m',f0:hipFAt(x),a:b.a,b:b.b};renderInsp();}
    if(!this.drag){this.drag={seek:true};HIP.f=hipFAt(x);}
    TL.setPointerCapture(e.pointerId);hipApply(HIP.f);drawTL();},
  pointermove(e){const D=this.drag;if(!D)return;const r=TL.getBoundingClientRect(),f=hipFAt(e.clientX-r.left);
    if(D.seek){HIP.f=f;hipApply(f);drawTL();return;}
    const df=f-D.f0;edit(M2=>{const b=M2.hitboxes.boxes[D.i];if(D.part==='m'){b.a=D.a+df;b.b=D.b+df;}else if(D.part==='a')b.a=Math.min(D.b,D.a+df);else b.b=Math.max(D.a,D.b+df);},'tlhb',true);drawTL();},
  pointerup(){const D=this.drag;this.drag=null;mergeTag=null;if(D&&!D.seek)renderInsp();}};
// ---- the hooks ----
EXT.moves={noGrid:true,tl:HIP_TL,
  list(hit){let h='<div class="grp"><span>Moves</span></div>';for(const n of S.list.moves||[]){const d=DOCS.get(key('moves',n)),t=d?d.data.name:n;if(hit(n)||hit(t))h+=listIt('moves',n,t,n);}return h;},
  open(d){S.insp=S.insp==='hb'?'hb':'move';S.hsel=-1;S.playing=false;if(!HIP.rec||HIP.rec.key!==d.name){HIP.rec=null;HIP.f=0;}hipRecord();},
  rebuild:hipRebuild,
  frame(){const R=HIP.rec;if(!R){orbit.target.set(0,1,0);cam.position.set(6,4,8);return;}const c=R.c,g=R.G+1,d=Math.max(5,R.rad*2.1);
    orbit.target.set(c.x,c.y-g+0.6,c.z);cam.position.set(c.x+d*0.62,c.y-g+d*0.42,c.z+d*0.66);},
  toolbar:()=>'',
  inspTabs:()=>[['move','Move'],['hb','Hitboxes']],insp:hipInsp,
  play:()=>!!HIP.rec,
  tick(dt){if(!HIP.rec)return;if(S.playing){const R=HIP.rec;HIP.f+=dt*60*HIP.speed;if(HIP.f>=R.N){if(HIP.loop)HIP.f%=R.N;else{HIP.f=R.N-1;setPlaying(false);}}hipApply(HIP.f);drawTL();}},
  step(s){if(!HIP.rec)return;HIP.f=Math.max(0,Math.min(HIP.rec.N-1,Math.floor(HIP.f)+s));hipApply(HIP.f);drawTL();},
  // (each edit is acted out again, a moment after the last)
  changed(){clearTimeout(HIP.recT);HIP.recT=setTimeout(hipRecord,140);},
  del:hipDel,dup:hipDup,
  message:hipMessage,
  async start(){await Promise.all((S.list.moves||[]).map(n=>loadDoc('moves',n)));}};
