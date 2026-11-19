// ---- the editor's Vehicles tab: the light vehicles' models (src/assets/vehicles/: a bicycle, a kick scooter, the
// Gobway, a motor scooter) and their riders' animations (clips rd*, layout 'rider'). A vehicle's file is its boxes (each
// may be tilted, and may belong to a part), its parts (groups that move: wheels spin, steerF steers, legL / legR / body /
// crank follow the rider's clip, rider is only shown while someone's on it) and the clip its rider plays. The game builds
// them with lightBuild (src/js/vehicles/light-vehicles.js) from the same file, and core/assets.js's assetVehParts. Here a
// vehicle is edited as it stands, every part at rest, so a box's place is the file's own (in the vehicle's frame); a
// rider clip is shown on the vehicle that plays it, posed as the game poses it ----
const VEH_ROLE_COL={'@paint':0x3b7fd0,'@tire':0x16181c,'@hub':0x9aa0a8,'@head':0xffe9a0,'@tail':0xd2302a,'@blinkL':0xffa020,'@blinkR':0xffa020,'@skin':0x6f9a3a,'@tunic':0x5a3d22,'@belt':0x2b1d10};
Object.assign(ROLE_COL,VEH_ROLE_COL);
const VEH_ROLE_NAME={paint:'Paint (picked per vehicle)',tire:'Tyre',hub:'Hub',head:'Headlamp',tail:'Tail lamp',blinkL:'Indicator, left',blinkR:'Indicator, right',skin:'Rider: skin',tunic:'Rider: tunic',belt:'Rider: belt'};
const VEH_PART_HELP={steerF:'turns with the steering',rider:'shown only while ridden',legL:'rider clip: left leg, at the hip',legR:'rider clip: right leg, at the hip',body:'rider clip: lean, at the waist',crank:'rider clip: cranks'};
const VS={rider:true,psel:null};
const vehDoc=n=>{const d=DOCS.get(key('vehicles',n));return d?d.data:null;};
// (is part n the rider, or inside it?)
const vehInRider=(V,n)=>{for(let q=n,k=0;q&&k<20;q=V.parts[q]&&V.parts[q].in,k++)if(q==='rider')return true;return false;};
const riderClips=()=>S.list.clips.filter(c=>clipLayout(c)==='rider');
// the vehicle a rider clip is shown on: the one picked, if it plays it, else the first that does, else the first
function vehFor(c){const vs=S.list.vehicles||[];if(S.previewV&&vs.includes(S.previewV))return S.previewV;return vs.find(n=>(vehDoc(n)||{}).clip===c)||vs[0];}

// a vehicle as the game builds it, every part a group turning about its own point (for posing a rider clip)
function vehModel(V){
  const root=new THREE.Group(),G={},{parts,boxes}=assetVehParts(V);
  for(const q of parts){const g=new THREE.Group();g.name=q.n;g.position.set(...q.lp);(q.par?G[q.par]:root).add(g);G[q.n]=g;}
  for(const q of boxes){const m=boxMesh(Object.assign({},q.b,{p:q.lp}));if(glowOf(q.b))m.material=new THREE.MeshBasicMaterial({color:colOf(q.b.c)});(q.part?G[q.part]:root).add(m);}
  return {root,G};
}
// ---- a rider clip (called from the editor's rebuild and poseAt) ----
function vehRiderRig(d){const n=vehFor(d.name),V=n&&vehDoc(n);if(!V){hud('No vehicle to show it on');return null;}
  const M=vehModel(V);content.add(M.root);hud(n+(V.clip===d.name?'':' (plays '+(V.clip||'nothing')+')'));return {k:'rider',root:M.root,G:M.G,V};}
function vehRiderPose(P,c,u){const v=clipAt(c,u),G=P.G;
  if(G.legL)G.legL.rotation.x=v[0]||0;if(G.legR)G.legR.rotation.x=v[1]||0;if(G.body)G.body.rotation.x=v[2]||0;if(G.crank)G.crank.rotation.x=v[3]||0;
  // (the wheels turn with the cranks, as on the road: two turns of the back wheel to one of the cranks)
  for(const k in G)if(/^wheel/.test(k))G[k].rotation.x=(v[3]||0)*2;}
// (dragging a part of the posed rider: a leg its own channel, the cranks theirs, anything else the lean)
function vehRiderGrab(o,under,J,hit,fixed){const G=posed.G;
  for(const [g,ch] of [[G.legL,'legL'],[G.legR,'legR'],[G.crank,'crank']])if(g&&under(g))return {ch:[J(ch)],pt:fixed(g,g.worldToLocal(hit.point.clone()))};
  const B=G.body||G.rider||posed.root;return {ch:[J('lean')],pt:fixed(B,B.worldToLocal(hit.point.clone()))};}
// (which vehicles play a rider clip)
const vehUsers=c=>(S.list.vehicles||[]).filter(n=>(vehDoc(n)||{}).clip===c);

// ---- a vehicle's own view: its boxes where the file has them, the parts' points as small markers ----
const PART_MAT=new THREE.MeshBasicMaterial({color:0x8fd0ff,wireframe:true,depthTest:false,transparent:true,opacity:0.8});
function vehRebuild(d){
  const V=d.data,L=V.boxes||[];let n=0;
  L.forEach((b,i)=>{if(!VS.rider&&b.part&&vehInRider(V,b.part)){pickable[i]=new THREE.Object3D();return;}const m=boxMesh(b);if(glowOf(b))m.material=new THREE.MeshBasicMaterial({color:colOf(b.c)});m.userData.i=i;content.add(m);pickable[i]=m;n++;});
  for(const k in V.parts||{}){const m=new THREE.Mesh(new THREE.SphereGeometry(VS.psel===k?0.06:0.035,10,6),PART_MAT);m.renderOrder=8;m.position.set(...V.parts[k].p);content.add(m);}
  if(S.sel>=0){for(const i of selList())if(pickable[i])outline(pickable[i]);attachSel();}
  hud(n+' box'+(n===1?'':'es')+' · '+Object.keys(V.parts||{}).length+' parts');
}
function vehToolbar(d){
  return [['translate','Move (G)'],['rotate','Tilt (R)'],['scale','Size (S)']].map(([k,t])=>'<button data-mode="'+k+'" class="'+(S.mode===k?'on':'')+'">'+t+'</button>').join('')+
    '<label>Snap <select id="snapSel">'+[['0','off'],['0.005','0.005'],['0.01','0.01'],['0.0625','1/16'],['0.1','0.1']].map(([v,t])=>'<option value="'+v+'"'+(+v===S.snap?' selected':'')+'>'+t+'</option>').join('')+'</select></label>'+
    '<label><input type="checkbox" id="vRider"'+(VS.rider?' checked':'')+'> Rider</label>'+
    '<label>Paint <input type="color" id="vPaint" value="#'+ROLE_COL['@paint'].toString(16).padStart(6,'0')+'"></label>';
}
function vehToolbarBind(){
  for(const b of $('toolbar').querySelectorAll('[data-mode]'))b.onclick=()=>setMode(b.dataset.mode);
  $('snapSel').onchange=e=>{S.snap=+e.target.value;applySnap();};
  $('vRider').onchange=e=>{VS.rider=e.target.checked;S.sel=-1;S.msel=[];rebuild();renderInsp();};
  $('vPaint').oninput=e=>{ROLE_COL['@paint']=parseInt(e.target.value.slice(1),16);rebuild();renderInsp();};
}
// ---- the inspector: Boxes (size, place, tilt, colour or role, part) and Parts (each one's point and what it's in, the
// rider's clip) ----
function vehInsp(B,d){
  if(S.insp==='parts')return vehPartsInsp(B,d);
  const V=d.data,L=V.boxes,b=L[S.sel],sl=selList(),P=Object.keys(V.parts||{});
  const sw=x=>'#'+colOf(x.c).toString(16).padStart(6,'0'),deg=r=>(r||[0,0,0]).map(v=>+(v*180/Math.PI).toFixed(2));
  let h='<div class="row"><button id="addBox">+ Box</button><button id="dupBox"'+(b?'':' disabled')+'>Duplicate</button><button id="mirBox"'+(b?'':' disabled')+'>Mirror</button><button id="delBox"'+(b?'':' disabled')+'>Delete</button></div>';
  h+='<div class="list" id="boxList">'+L.map((x,i)=>!VS.rider&&x.part&&vehInRider(V,x.part)?'':'<div class="item'+(sl.includes(i)?' on':'')+'" data-i="'+i+'"><span style="color:'+sw(x)+'">■</span> '+
    esc(x.c[0]==='@'?x.c.slice(1):'box')+(x.part?' <small>'+esc(x.part)+'</small>':'')+' <small>'+x.s.map(v=>+v.toFixed(3)).join(' × ')+'</small></div>').join('')+'</div>';
  if(b){h+=sl.length>1?'<p class="note">'+sl.length+' picked</p>':'';h+='<h3>Box '+(S.sel+1)+'</h3>';
    h+='<div class="row"><label>Size</label>'+v3(b.s,'bs')+'</div><div class="row"><label>Place</label>'+v3(b.p,'bp')+'</div><div class="row"><label>Tilt (degrees)</label>'+v3(deg(b.r),'br')+'</div>';
    const role=b.c[0]==='@';
    h+='<div class="row"><label>Colour</label><select id="brl"><option value="">Own</option>'+VEH_ROLES.map(r=>'<option value="@'+r+'"'+(b.c==='@'+r?' selected':'')+'>'+esc(VEH_ROLE_NAME[r]||r)+'</option>').join('')+'</select><input type="color" id="bc" value="'+(role?sw(b):b.c)+'"'+(role?' disabled':'')+'></div>';
    h+='<div class="row"><label>Part</label><select id="bpart"><option value="">(the frame)</option>'+P.map(p=>'<option'+(b.part===p?' selected':'')+'>'+esc(p)+'</option>').join('')+'</select></div>';}
  h+='<h3>Note</h3><textarea id="wnote" rows="3" style="width:100%">'+esc(V.note||'')+'</textarea>';
  B.innerHTML=h;
  for(const e of B.querySelectorAll('#boxList .item'))e.onclick=ev=>{pickSel(+e.dataset.i,ev.shiftKey);rebuild();renderInsp();};
  $('addBox').onclick=()=>edit(W=>{const o=b?b.p:[0,0.5,0],n={s:[0.1,0.1,0.1],p:[o[0],o[1],r4(o[2]+0.1)],c:b?b.c:'#888888'};if(b&&b.part)n.part=b.part;W.boxes.push(n);S.sel=W.boxes.length-1;S.msel=[];});
  $('dupBox').onclick=()=>vehDup(d);$('mirBox').onclick=()=>vehMirror(d);$('delBox').onclick=()=>vehDel(d);
  const set=f=>e=>edit(W=>f(W.boxes[S.sel],e.target),'f'+e.target.id);
  if(b){for(const j of[0,1,2]){$('bs'+j).onchange=set((x,t)=>{x.s[j]=Math.max(0.001,r4(+t.value));});$('bp'+j).onchange=set((x,t)=>{x.p[j]=r4(+t.value);});
      $('br'+j).onchange=set((x,t)=>{x.r=x.r||[0,0,0];x.r[j]=r4(+t.value*Math.PI/180);if(!x.r.some(v=>v))delete x.r;});}
    $('brl').onchange=set((x,t)=>{x.c=t.value||sw(x);});
    $('bc').oninput=set((x,t)=>{x.c=t.value;});
    $('bpart').onchange=set((x,t)=>{if(t.value)x.part=t.value;else delete x.part;});}
  $('wnote').onchange=e=>edit(W=>{if(e.target.value)W.note=e.target.value;else delete W.note;});
}
function vehPartsInsp(B,d){
  const V=d.data,P=V.parts=V.parts||{},names=Object.keys(P),cl=riderClips();
  let h='<div class="row"><label>Rider\'s animation</label><select id="vclip"><option value="">(none)</option>'+cl.map(c=>'<option'+(V.clip===c?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select>'+
    (V.clip?'<button id="vclipGo">Open</button>':'')+'</div>';
  h+='<div class="row"><button id="addPart">+ Part</button><button id="delPart"'+(VS.psel?'':' disabled')+'>Delete</button></div>';
  h+='<div class="list" id="partList">'+names.map(n=>'<div class="item'+(VS.psel===n?' on':'')+'" data-p="'+esc(n)+'">'+esc(n)+(P[n].in?' <small>in '+esc(P[n].in)+'</small>':'')+
    ' <small>'+esc(VEH_PART_HELP[n]||(/^wheel/.test(n)?'spins':''))+'</small></div>').join('')+'</div>';
  const q=VS.psel&&P[VS.psel];
  if(q){h+='<h3>'+esc(VS.psel)+'</h3><div class="row"><label>Turns about</label>'+v3(q.p,'pp')+'</div>';
    h+='<div class="row"><label>Inside</label><select id="pin"><option value="">(the frame)</option>'+names.filter(n=>n!==VS.psel).map(n=>'<option'+(q.in===n?' selected':'')+'>'+esc(n)+'</option>').join('')+'</select></div>';
    h+='<p class="note">'+V.boxes.filter(b=>b.part===VS.psel).length+' boxes</p>';}
  B.innerHTML=h;
  for(const e of B.querySelectorAll('#partList .item'))e.onclick=()=>{VS.psel=e.dataset.p;rebuild();renderInsp();};
  $('vclip').onchange=e=>edit(W=>{if(e.target.value)W.clip=e.target.value;else delete W.clip;});
  if($('vclipGo'))$('vclipGo').onclick=()=>{S.previewV=d.name;open('clips',V.clip);};
  $('addPart').onclick=()=>{const n=prompt('New part: a name (letters and digits; wheel… spins, legL, legR, body and crank follow the rider\'s clip)','');
    if(!n)return;if(!/^[A-Za-z0-9_]{1,32}$/.test(n))return status('Names are letters, digits and _ only',true);if(P[n])return status(n+' already exists',true);
    edit(W=>{const o=VS.psel&&W.parts[VS.psel]?W.parts[VS.psel].p.slice():[0,0.5,0];W.parts[n]={p:o};});VS.psel=n;renderInsp();};
  $('delPart').onclick=()=>{const n=VS.psel;if(!n)return;edit(W=>{const up=W.parts[n].in;delete W.parts[n];
    for(const k in W.parts)if(W.parts[k].in===n){if(up)W.parts[k].in=up;else delete W.parts[k].in;}
    for(const b of W.boxes)if(b.part===n){if(up)b.part=up;else delete b.part;}});VS.psel=null;renderInsp();};
  if(q){for(const j of[0,1,2])$('pp'+j).onchange=e=>edit(W=>{W.parts[VS.psel].p[j]=r4(+e.target.value);});
    $('pin').onchange=e=>{const v=e.target.value;
      // (not inside itself, however far down)
      for(let x=v,k=0;x&&k<20;x=P[x]&&P[x].in,k++)if(x===VS.psel)return status('A part can\'t be inside itself',true);
      edit(W=>{if(v)W.parts[VS.psel].in=v;else delete W.parts[VS.psel].in;});};}
}
function vehDup(d){const P=selList();if(!P.length)return;edit(W=>{addSel(W.boxes,P.map(i=>{const c=clone(W.boxes[i]);c.p[0]=r4(c.p[0]+0.05);return c;}));});}
// (a copy on the other side, x flipped; a box in legL goes in legR and the other way round, as do the indicators)
const VEH_SWAP={legL:'legR',legR:'legL','@blinkL':'@blinkR','@blinkR':'@blinkL'};
function vehMirror(d){const P=selList();if(!P.length)return;edit(W=>{addSel(W.boxes,P.map(i=>{const c=clone(W.boxes[i]);c.p[0]=r4(-c.p[0]);if(c.r){c.r[1]=-c.r[1];c.r[2]=-c.r[2];}
  if(VEH_SWAP[c.part]&&W.parts[VEH_SWAP[c.part]])c.part=VEH_SWAP[c.part];if(VEH_SWAP[c.c])c.c=VEH_SWAP[c.c];return c;}));});}
function vehDel(d){const P=selList().sort((a,b)=>b-a);if(!P.length)return;edit(W=>{for(const i of P)W.boxes.splice(i,1);S.sel=-1;S.msel=[];});}
// ---- the list: each vehicle, with its rider's animation under it, then any rider animation no vehicle plays ----
function vehList(hit){
  let h='<div class="grp"><span>Light vehicles</span></div>';const used=new Set();
  for(const n of S.list.vehicles||[]){const c=(vehDoc(n)||{}).clip;if(c)used.add(c);if(!hit(n)&&!(c&&hit(c)))continue;
    h+=listIt('vehicles',n,n);if(c)h+='<div class="item sub'+(S.kind==='clips'&&S.name===c?' on':'')+'" data-k="clips" data-n="'+esc(c)+'" data-v="'+esc(n)+'">Rider'+listDot('clips',c)+'<small>'+esc(c)+'</small></div>';}
  const rest=riderClips().filter(c=>!used.has(c)&&hit(c));
  if(rest.length){h+='<div class="grp"><span>Other rider animations</span></div>';for(const c of rest)h+=listIt('clips',c,c);}
  return h;
}
function vehListBind(){for(const e of $('assetList').querySelectorAll('.item[data-v]'))e.onclick=()=>{S.previewV=e.dataset.v;open('clips',e.dataset.n);};}
EXT.vehicles={
  list:vehList,listBind:vehListBind,
  open(d){S.insp=['box','parts'].includes(S.insp)?S.insp:'box';VS.psel=null;S.playing=false;},
  rebuild:vehRebuild,
  frame(d){const bb=new THREE.Box3();for(const b of d.data.boxes){bb.expandByPoint(new THREE.Vector3(...b.p.map((v,j)=>v-b.s[j]/2)));bb.expandByPoint(new THREE.Vector3(...b.p.map((v,j)=>v+b.s[j]/2)));}
    const c=bb.isEmpty()?new THREE.Vector3():bb.getCenter(new THREE.Vector3()),sz=Math.max(0.8,bb.getSize(new THREE.Vector3()).length());orbit.target.copy(c);cam.position.set(c.x+sz*1.2,c.y+sz*0.6,c.z+sz*0.9);},
  toolbar:vehToolbar,toolbarBind:vehToolbarBind,
  inspTabs:()=>[['box','Boxes'],['parts','Parts']],insp:vehInsp,
  play:()=>false,
  dup:vehDup,del:vehDel,
  async start(){await Promise.all((S.list.vehicles||[]).map(n=>loadDoc('vehicles',n)));}};
