// ---- Assets: the models and animations the editor (tools/editor/) makes, as data ----
// They live as JSON files in src/assets/, one per weapon (src/assets/weapons/) and one per animation (src/assets/clips/),
// and tools/build.py writes them all into the game as ASSETS, ahead of every script. This file turns them back into the
// tables the game has always read (WEAPONS' box lists, STRIKES' timelines) once, as the page loads, so nothing per frame
// changes. The editor and the tools load this same file on its own (it uses nothing from the rest of the game until a
// model is built), so they read and write the files exactly as the game does.
//
// A box: {s:[w,h,d], p:[x,y,z], c:'#rrggbb' or '@club' (the goblins' club brown), and as needed role (its name on a goblin,
//   for the held and stowed boxes), o (render order, first-person boxes), tag (a part the game moves on its own: mag, load,
//   bolt, pump, slide), r:[x,y,z] (tilted, radians), sh (a shape other than a box: 'cyl', 'cone', 'wedge', 'sphere', each
//   filling the box's size)}.
// A clip: {layout, tracks:{channel:[[u, value, ease?],...],...}}: a track of keys per channel, its layout naming them in
//   order (ASSET_LAYOUTS), u 0 to 2; ease 'i' (gathering speed), 'o' (slowing), 'l' (steady) or none (smooth).
const ASSET_LAYOUTS={
  // a goblin's blow, shot, throw or reload as anyone sees it, u 0 to 2, the blow landing at 1 (strikes.js)
  body:{about:'A goblin, as everyone sees it',ch:[['arm',"Arm's swing"],['armOut','Arm out to the side'],['wrist','Wrist'],['free',"Free arm's swing"],
    ['twist','Twist at the waist'],['lean','Lean forward'],['step','Half-step forward']],min:7},
  // Gnash's and Grizzle's own arm in first person (the roll is left off a clip that never rolls)
  vm:{about:'First person: the weapon arm',ch:[['tilt','Tilt'],['across','Across'],['up','Up'],['fwd','Forward'],['roll','Roll']],min:4},
  // a reload in first person, added to where the gun's held
  vr:{about:'First person: a reload',ch:[['tilt','Tilt'],['roll','Roll'],['across','Across'],['up','Up'],['fwd','Forward'],['mag','Magazine out (0 home, 1 gone)']],min:6},
  // the hippos' timed moves (player/move.js: a bite, the uppercut, a crash landing, squash and stretch, the roll, reeling
  // from a hit), u 0 to 2 over each one's own length. Every channel's there (one key of 0 when a clip doesn't use it);
  // each is added to the pose the hippo's in at that moment, except the jaw (opened at least this far), the legs during
  // a bite (taken over by legW, from where they were as it began) and the roll's curl and spin (read by the roll's own sums)
  hippo:{about:'A hippo (Gus and Gertie)',ch:[['head','Head'],['jaw','Jaw open'],['pitch','Body pitch'],['roll','Body roll'],['lift','Body up'],
    ['sx','Wider'],['sy','Taller'],['sz','Longer'],['legFR','Front right leg'],['legFL','Front left leg'],['legBR','Back right leg'],['legBL','Back left leg'],
    ['outFR','Front right leg out'],['outFL','Front left leg out'],['outBR','Back right leg out'],['outBL','Back left leg out'],['legW','Legs taken over'],
    ['curl','Curl (the roll)'],['spin','Somersault (the roll)']],min:19},
  // a goblin riding a light vehicle (src/assets/vehicles/: a bicycle, a kick scooter, the Gobway, a motor scooter; its
  // clip names the one it rides with). u 0 to 2 is one turn of the pedals, one kick, leaning right back to right forward
  // (the Gobway), or nothing at all (a motor scooter: one pose). Each leg turns at the hip (0 hanging straight down,
  // minus forward), lean tips the body forward at the waist, crank turns a bicycle's cranks (vehicles/light-vehicles.js)
  rider:{about:'A goblin riding a light vehicle',ch:[['legL','Left leg'],['legR','Right leg'],['lean','Lean forward'],['crank','Cranks']],min:4}};
const ASSET_SHAPES=['box','cyl','cone','wedge','sphere'];
const ASSET_ROLES={club:null};   // ('@club' is null in a weapon's list: wpnBoxes paints it the goblins' club colour, GC.club)
const assetLayoutOf=name=>/^vm/.test(name)?'vm':/^vr/.test(name)?'vr':/^hip/.test(name)?'hippo':/^rd/.test(name)?'rider':'body';
// a box -> the list the game reads, [w,h,d,colour,x,y,z(,role or render order(,tag))], with r and sh hung on the list itself
function assetBox(b){
  const c=typeof b.c==='string'&&b.c[0]==='@'?(ASSET_ROLES[b.c.slice(1)]??null):typeof b.c==='string'?parseInt(b.c.slice(1),16):b.c;
  const a=[b.s[0],b.s[1],b.s[2],c,b.p[0],b.p[1],b.p[2]];
  const last=b.role!==undefined?b.role:b.o;
  if(last!==undefined||b.tag!==undefined)a.push(last);if(b.tag!==undefined)a.push(b.tag);
  if(b.r&&(b.r[0]||b.r[1]||b.r[2]))a.r=b.r;if(b.sh&&b.sh!=='box')a.sh=b.sh;
  return a;
}
// and back (the extractor, and the editor reading a table)
function assetBoxOf(a){
  const b={s:[a[0],a[1],a[2]],p:[a[4],a[5],a[6]],c:a[3]==null?'@club':'#'+(a[3]>>>0).toString(16).padStart(6,'0')};
  if(typeof a[7]==='string')b.role=a[7];else if(typeof a[7]==='number')b.o=a[7];
  if(a.length>8&&a[8]!==undefined)b.tag=a[8];if(a.r)b.r=a.r;if(a.sh)b.sh=a.sh;
  return b;
}
const ASSET_LISTS=['held','view','drop','stow'];
// A weapon's model: its shape once, model.boxes, and each way it's seen (held, view, drop, stow) either that shape placed
// ({at:{p,r,k}}: moved by p, turned by r (radians, XYZ), scaled by k) or a version of its own ({at, own:[boxes]}: at kept
// for going back to the shared shape). A plain list is a version of its own too (the old form). View boxes with no render
// order get ASSET_VIEW_O.
const ASSET_VIEW_O=62;
// (3 x 3 rotation matrices by rows, for an XYZ Euler as three.js has it, and back)
const aMat=(x,y,z)=>{const a=Math.cos(x),b=Math.sin(x),c=Math.cos(y),d=Math.sin(y),e=Math.cos(z),f=Math.sin(z);
  return [c*e,-c*f,d,a*f+b*e*d,a*e-b*f*d,-b*c,b*f-a*e*d,b*e+a*f*d,a*c];};
const aMul=(A,B)=>{const o=new Array(9);for(let r=0;r<3;r++)for(let c=0;c<3;c++)o[r*3+c]=A[r*3]*B[c]+A[r*3+1]*B[3+c]+A[r*3+2]*B[6+c];return o;};
const aTr=A=>[A[0],A[3],A[6],A[1],A[4],A[7],A[2],A[5],A[8]];
const aApply=(M,v)=>[M[0]*v[0]+M[1]*v[1]+M[2]*v[2],M[3]*v[0]+M[4]*v[1]+M[5]*v[2],M[6]*v[0]+M[7]*v[1]+M[8]*v[2]];
function aEul(M){const y=Math.asin(Math.max(-1,Math.min(1,M[2])));
  return Math.abs(M[2])<0.9999999?[Math.atan2(-M[5],M[8]),y,Math.atan2(-M[1],M[0])]:[Math.atan2(M[7],M[4]),y,0];}
const aR=v=>Math.round(v*1e6)/1e6||0;
const assetAtId=at=>!at||(!(at.p&&(at.p[0]||at.p[1]||at.p[2]))&&!(at.r&&(at.r[0]||at.r[1]||at.r[2]))&&(at.k===undefined||at.k===1));
// a box of the shared shape, placed (or, unplace, a placed box back into the shape's own frame)
function assetPlace(b,at,unplace){
  if(assetAtId(at))return JSON.parse(JSON.stringify(b));
  const P=at.p||[0,0,0],k=at.k||1,R=aMat(...(at.r||[0,0,0])),o=JSON.parse(JSON.stringify(b)),Rb=aMat(...(b.r||[0,0,0]));
  let p,M;
  if(!unplace){p=aApply(R,b.p).map((v,i)=>v*k+P[i]);M=aMul(R,Rb);o.s=b.s.map(v=>aR(v*k));}
  else{p=aApply(aTr(R),[b.p[0]-P[0],b.p[1]-P[1],b.p[2]-P[2]]).map(v=>v/k);M=aMul(aTr(R),Rb);o.s=b.s.map(v=>aR(v/k));}
  o.p=p.map(aR);const e=aEul(M).map(aR);if(e[0]||e[1]||e[2])o.r=e;else delete o.r;
  return o;
}
// the boxes of one way a weapon's seen (null if it hasn't one), as files have boxes
function assetList(M,j){
  const v=M[j];if(v===undefined||v===null)return null;if(Array.isArray(v))return v;
  if(v.own)return v.own;
  const L=(M.boxes||[]).map(b=>assetPlace(b,v.at));
  for(const b of L)if(j==='view'){delete b.role;if(b.o===undefined)b.o=ASSET_VIEW_O;}else delete b.o;
  return L;
}
// a weapon's file -> its entry in WEAPONS (every field in the same order, the boxes made lists, the note left off)
function assetWeapon(e){
  const o={};
  for(const k in e){if(k==='note')continue;
    if(k!=='model'){o[k]=JSON.parse(JSON.stringify(e[k]));continue;}
    const m={};for(const j in e.model){const v=e.model[j];if(j==='boxes')continue;
      m[j]=ASSET_LISTS.includes(j)?assetList(e.model,j).map(assetBox):j==='fore'?[v.p.slice(),v.r.slice()]:JSON.parse(JSON.stringify(v));}
    o.model=m;}
  return o;
}
function assetWeaponOf(W){
  const o={};
  for(const k in W){if(k!=='model'){o[k]=JSON.parse(JSON.stringify(W[k]));continue;}
    const m={};for(const j in W.model){const v=W.model[j];
      m[j]=ASSET_LISTS.includes(j)?v.map(assetBoxOf):j==='fore'?{p:v[0].slice(),r:v[1].slice()}:JSON.parse(JSON.stringify(v));}
    o.model=m;}
  return o;
}
// A clip runs u 0 to 2 and keeps a track of keys per channel: tracks {arm:[[u,value,ease?],...], ...}, its channels named
// by its layout, in the layout's order (a layout's optional channels at its end may be left out). Each channel goes from
// one of its own keys to the next (ease 'i' gathering speed into a key, 'o' slowing into it, smooth if left out) and
// holds its first and last values beyond them; a track of one key holds that value throughout.
// the clip's file -> what STRIKES holds: a list of tracks in channel order, each [[u, value, ease?], ...] (strikeAt reads it)
const assetChNames=c=>{const L=ASSET_LAYOUTS[c.layout],o=[];if(!L)return o;for(const [k] of L.ch){if(!c.tracks||!c.tracks[k])break;o.push(k);}return o;};
function assetClip(c){return assetChNames(c).map(k=>c.tracks[k].map(a=>a.slice()));}
function assetClipOf(name,T){
  const layout=assetLayoutOf(name),tracks={};T.forEach((K,j)=>{tracks[ASSET_LAYOUTS[layout].ch[j][0]]=K.map(a=>a.slice());});
  return {layout,tracks};
}
// a clip's pose at u, from its file (the editor's, and what strikeAt does with the table)
function assetPoseAt(c,u){
  u=Math.max(0,Math.min(2,u));
  return assetChNames(c).map(k=>{const K=c.tracks[k];if(K.length<2)return K[0][1];let i=1;while(i<K.length-1&&K[i][0]<u)i++;
    const a=K[i-1],b=K[i],s=Math.max(0,Math.min(1,(u-a[0])/(b[0]-a[0]))),e=b[2],q=e==='i'?s*s:e==='o'?1-(1-s)*(1-s):e==='l'?s:s*s*(3-2*s);return a[1]+(b[1]-a[1])*q;});
}
// the tables, from ASSETS (files in the order their _order.json gives)
function assetWeaponsAll(A){const o={};for(const k in A.weapons)o[k]=assetWeapon(A.weapons[k]);return o;}
function assetClipsAll(A){const o={};for(const k in A.clips)if(A.clips[k].layout!=='hippo'&&A.clips[k].layout!=='rider')o[k]=assetClip(A.clips[k]);return o;}
// (the riders' clips: RIDER_CLIPS in light-vehicles.js)
function assetRiderAll(A){const o={};for(const k in A.clips)if(A.clips[k].layout==='rider')o[k]=assetClip(A.clips[k]);return o;}
// (the hippos' clips: HCLIP in move.js, read by hipAt)
function assetHipAll(A){const o={};for(const k in A.clips)if(A.clips[k].layout==='hippo')o[k]=assetClip(A.clips[k]);return o;}

// ---- structures (src/assets/sites/, the editor's Structures tab): a site as it's built, block by block, and what's in
// it. Captured from the world the game makes and edited from there. A site: {name, kind (its kind in the Structures list:
// a TEST_GROUPS key), w, h (its size in the plan's blocks), face (the side its front's on: 0 -x, 1 +x, 2 -z, 3 +z, or -1
// for none), on (built in the game in place of every one of its kind that size, turned to face the same way), y0 (the
// lowest height it keeps), size [NX,NY,NZ], rows (its blocks: one string per row along z, each column bottom up as runs
// of [count, block] bytes, in base64), props [{m (a model in PROPS), p:[x,y,z], yaw, tint?}], people [{k, p, yaw}]
// (k: 'staff', 'civilian', 'goblin' or one of FOES), cars [{k, p, yaw}] (k: a vehicle in VEH, 'police', 'tank', 'heli'),
// note}. x and z are blocks from its lot's corner (where the pavement ends: PL0 into its first plan block), y the world's
// height. The blocks go in place of the generated ones from y0 up, inside the lot only, so the streets round it stay.
const SITE_FIELDS=['name','kind','w','h','face','on','y0','size','rows','props','people','cars','note'];
const siteB64=s=>{const b=atob(s),o=new Uint8Array(b.length);for(let i=0;i<b.length;i++)o[i]=b.charCodeAt(i);return o;};
const siteTo64=a=>{let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode.apply(null,a.subarray(i,i+8192));return btoa(s);};
// its blocks as one array: column (u,v) from the bottom, at ((v*NX+u)*NY+y), y from y0. null if the rows don't add up
function assetSiteDecode(f){
  const [NX,NY,NZ]=f.size,A=new Uint8Array(NX*NY*NZ);if(!Array.isArray(f.rows)||f.rows.length!==NZ)return null;
  for(let v=0;v<NZ;v++){let R;try{R=siteB64(f.rows[v]);}catch(e){return null;}let i=0;
    for(let u=0;u<NX;u++){let y=0;const b0=(v*NX+u)*NY;
      while(y<NY){if(i+1>=R.length)return null;const n=R[i],id=R[i+1];i+=2;if(!n||y+n>NY)return null;A.fill(id,b0+y,b0+y+n);y+=n;}}
    if(i!==R.length)return null;}
  return A;
}
function assetSiteRow(A,size,v){
  const [NX,NY]=size,o=[];
  for(let u=0;u<NX;u++){const b0=(v*NX+u)*NY;let y=0;while(y<NY){const id=A[b0+y];let n=1;while(y+n<NY&&n<255&&A[b0+y+n]===id)n++;o.push(n,id);y+=n;}}
  return siteTo64(Uint8Array.from(o));
}
function assetSiteEncode(A,size){const o=[];for(let v=0;v<size[2];v++)o.push(assetSiteRow(A,size,v));return o;}
// (the sites the game builds: their files, as they are; and what goes into the save's name, so a world made with
// different sites is a different world: SAVE_KEY. Nothing with none switched on)
function assetSitesOn(A){const o=[];for(const k in A.sites||{})if(A.sites[k].on)o.push(Object.assign({id:k},A.sites[k]));return o;}
function assetSiteSig(A){
  const L=assetSitesOn(A);if(!L.length)return '';let h=2166136261;
  for(const s of L){const t=s.id+s.kind+s.w+','+s.h+','+s.face+','+s.y0+','+s.size+s.rows.join('');for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}}
  return '-s'+(h>>>0).toString(36);
}

// ---- the hippos' moves (player/hitboxes.js): one file per move, its numbers and its own hitboxes ----
// A move: {name, params:{key:{name, v (the value), min, max, step}}, smash:{shape, size, name} (what it does to blocks: shape
// 'orig' the move's own hand-made shape scaled by size, or 'sphere', 'semi', 'cube', 'cone' of that radius), hitboxes:{on,
// boxes:[...]} (its own hit volumes in place of the built-in hits, when on)}. A hitbox: {kind 'dmg' or 'block', shape
// (sphere, semi, cube, cone, cylinder), bone (a rig point, 'root' his feet), fwd, up, side (from the bone), rx, ry, rz
// (degrees), r, len, a and b (the frames it's live, at 60 a second from the move's start), dmg, carDmg}.
// The game's tables: DEV_ABIL [{k, n, ps:[[key, name, value, min, max, step]], blk:[shape, size, name]}] and HB {k:{on, boxes}}.
const MOVE_SHAPES=['orig','sphere','semi','cube','cone'],HB_SHAPE_LIST=['sphere','semi','cube','cone','cylinder'];
function assetMove(k,M){const o={k,n:M.name,ps:Object.keys(M.params||{}).map(pk=>{const q=M.params[pk];return [pk,q.name,q.v,q.min,q.max,q.step];})};
  if(M.smash)o.blk=[M.smash.shape,M.smash.size,M.smash.name];return o;}
function assetMoveOf(D,H){const params={};for(const [pk,n,v,min,max,step] of D.ps)params[pk]={name:n,v,min,max,step};
  const o={name:D.n,params};if(D.blk)o.smash={shape:D.blk[0],size:D.blk[1],name:D.blk[2]};if(H&&H.boxes&&H.boxes.length)o.hitboxes={on:!!H.on,boxes:H.boxes.map(b=>Object.assign({},b))};return o;}
function assetMovesAll(A){const o=[];for(const k in A.moves||{})o.push(assetMove(k,A.moves[k]));return o;}
function assetHbAll(A){const o={};for(const k in A.moves||{}){const H=A.moves[k].hitboxes;if(H)o[k]={on:!!H.on,boxes:H.boxes.map(b=>Object.assign({},b))};}return o;}

// ---- props (dressing/props.js) and street fixtures (dressing/street.js) ----
// A prop: {boxes:[{s,p,c,glow}]}, from its foot, its back -z: c '#rrggbb' or '@tint' (the prop's own tint, picked where it's
// placed), glow true for a part that lights up (a screen, a hob). Plain boxes, never tilted: they're drawn as instanced
// unit boxes. The game's list (PROPS) is [colour, x, y, z, w, h, d] a box, the tint -1 (PT) and a glow 0x1000000 (PG) on top.
const ASSET_PT=-1,ASSET_PG=0x1000000;
const assetHex=c=>parseInt(c.slice(1),16),assetHexOf=n=>'#'+(n>>>0).toString(16).padStart(6,'0');
function assetProp(P){return (P.boxes||[]).map(b=>[b.c==='@tint'?ASSET_PT:assetHex(b.c)+(b.glow?ASSET_PG:0),b.p[0],b.p[1],b.p[2],b.s[0],b.s[1],b.s[2]]);}
// (and back: the extractor)
function assetPropOf(M){return {boxes:M.map(q=>{const g=q[0]!==ASSET_PT&&q[0]>=ASSET_PG,b={s:[q[4],q[5],q[6]],p:[q[1],q[2],q[3]],c:q[0]===ASSET_PT?'@tint':assetHexOf(g?q[0]-ASSET_PG:q[0])};if(g)b.glow=true;return b;})};}
function assetPropsAll(A){const o={};for(const k in A.props||{})o[k]=assetProp(A.props[k]);return o;}
// A street fixture: {boxes:[{s,p,c}], spots:{name:[x,y,z]}}, from its foot: a lamp's or a signal's arm reaches along +x,
// anything else faces +z. c '#rrggbb', '@pole' (the dark steel every fixture shares) or '@lamp' (lit while it stands, steel
// once it's down). spots: where the parts that aren't boxes go (FIX_SPOTS: a signal's lights, a sign's face, a billboard's
// ad). The game's (FIXM): {boxes:[[colour, or -2 pole, -3 lamp, x, y, z, w, h, d]], spots}.
const ASSET_POLE=-2,ASSET_LAMP=-3,FIX_SPOTS={signal:['head'],sign:['face'],board:['ad']};
function assetFix(F){return {boxes:(F.boxes||[]).map(b=>[b.c==='@pole'?ASSET_POLE:b.c==='@lamp'?ASSET_LAMP:assetHex(b.c),b.p[0],b.p[1],b.p[2],b.s[0],b.s[1],b.s[2]]),spots:F.spots||{}};}
function assetFixAll(A){const o={};for(const k in A.fixtures||{})o[k]=assetFix(A.fixtures[k]);return o;}

// ---- light vehicles (src/assets/vehicles/, built by lightBuild in vehicles/light-vehicles.js) ----
// A vehicle: {boxes:[{s,p,c,r,part}], parts:{name:{p,in}}, clip}, from the middle of its footprint on the ground, its
// front +z, in the model's own units (scaled into the world by ES, as the other vehicles' are). A box can be tilted (r,
// XYZ) and can belong to a part (part), a group that moves: each part turns about its own point p, inside the part
// named by in (if any). Parts that move by name: steerF (turns with the steering), wheel* (spins: wheelF and wheelB,
// or wheelL and wheelR side by side), crank, rider (the goblin on it, shown only while someone's riding it), legL and
// legR (at the hip), body (at the waist). c '#rrggbb' or a role: @paint (the vehicle's own colour, picked per vehicle),
// @tire, @hub, @head, @tail (lamps), @blinkL / @blinkR (indicators: lit while blinking), and the rider's @skin, @tunic,
// @belt. clip: the rider's animation (a clip of layout 'rider').
const VEH_ROLES=['paint','tire','hub','head','tail','blinkL','blinkR','skin','tunic','belt'];
// -> the parts in an order where each comes after the one it's in, each placed in its parent's frame (lp), and the
// boxes with their places in their own part's frame (lp)
function assetVehParts(V){const P=V.parts||{},out=[],seen={};
  const add=n=>{if(seen[n])return;seen[n]=1;const q=P[n],par=q.in&&P[q.in]?q.in:null;if(par)add(par);const pp=par?P[par].p:[0,0,0];out.push({n,par,p:q.p,lp:[q.p[0]-pp[0],q.p[1]-pp[1],q.p[2]-pp[2]]});};
  for(const n in P)add(n);
  const boxes=(V.boxes||[]).map((b,i)=>{const pp=b.part&&P[b.part]?P[b.part].p:[0,0,0];return {b,i,part:b.part&&P[b.part]?b.part:null,lp:[b.p[0]-pp[0],b.p[1]-pp[1],b.p[2]-pp[2]]};});
  return {parts:out,boxes};}
// ---- shapes other than boxes, and tilted boxes, for anything built from a weapon's list ----
// Every shape is made once at unit size and stretched to the box's (o.scale), so it batches like a box does (batDraw: one
// batch per shape and material kind, however many there are)
const ASSET_GEO={};
function assetGeo(sh){
  if(ASSET_GEO[sh])return ASSET_GEO[sh];let g;
  if(sh==='cyl')g=new THREE.CylinderGeometry(0.5,0.5,1,10);
  else if(sh==='cone')g=new THREE.ConeGeometry(0.5,1,10);
  else if(sh==='sphere')g=new THREE.SphereGeometry(0.5,10,6);
  else if(sh==='wedge'){
    // (a ramp: the full box at the back, sloping down to nothing at the front edge, +z)
    const P=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5],[-.5,.5,-.5],[.5,.5,-.5]],T=[[0,2,1],[0,3,2],[0,1,5],[0,5,4],[0,4,3],[1,2,5],[3,4,5],[3,5,2]];
    const v=new Float32Array(T.length*9);T.forEach((t,i)=>t.forEach((j,n)=>{v[i*9+n*3]=P[j][0];v[i*9+n*3+1]=P[j][1];v[i*9+n*3+2]=P[j][2];}));
    g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(v,3));if(g.computeVertexNormals)g.computeVertexNormals();}
  return ASSET_GEO[sh]=g;
}
// o a mesh made for box b (a list from assetBox), w,h,d its size: put its shape and tilt on it
function assetShape(o,b){
  if(!o||!o.isObject3D&&!o.position||!b)return;
  if(b.sh){o.geometry=assetGeo(b.sh);o.scale.set(b[0],b[1],b[2]);}
  if(b.r)o.rotation.set(b.r[0],b.r[1],b.r[2]);
}

// ---- writing a file: the same text for the same data every time, one box or one key a line, so a change shows in
// git diff as just the lines that changed ----
function assetFmt(v){
  const num=x=>{if(typeof x!=='number')return JSON.stringify(x);if(Object.is(x,-0))return '0';const r=Math.round(x*1e6)/1e6;return JSON.stringify(r);};
  const inl=x=>Array.isArray(x)?'['+x.map(inl).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).filter(k=>x[k]!==undefined).map(k=>JSON.stringify(k)+':'+inl(x[k])).join(',')+'}':num(x);
  const go=(x,ind)=>{
    const s=inl(x);if(s.length<=100||!x||typeof x!=='object')return s;
    // (a box or a key is always one line, however long)
    if(!Array.isArray(x)&&(x.s&&x.p||'t' in x&&'v' in x||x.shape&&x.kind&&'r' in x))return s;   // (a move's hitbox too)
    // (and so is an animation's track, a channel's keys: [[u,value,ease?],...])
    if(Array.isArray(x)&&x.length&&x.every(q=>Array.isArray(q)&&q.length>=2&&q.length<=3&&typeof q[0]==='number'&&typeof q[1]==='number'))return s;
    const i2=ind+'  ';
    if(Array.isArray(x))return '[\n'+x.map(e=>i2+go(e,i2)).join(',\n')+'\n'+ind+']';
    return '{\n'+Object.keys(x).filter(k=>x[k]!==undefined).map(k=>i2+JSON.stringify(k)+': '+go(x[k],i2)).join(',\n')+'\n'+ind+'}';
  };
  return go(v,'')+'\n';
}

// ---- checking a file before it's saved or built: a list of what's wrong, empty if nothing ----
function assetCheck(kind,name,a){
  const E=[],n=v=>typeof v==='number'&&isFinite(v),v3=v=>Array.isArray(v)&&v.length===3&&v.every(n);
  const box=(b,at)=>{if(!b||typeof b!=='object')return E.push(at+': not a box');
    if(!v3(b.s)||b.s.some(x=>x<=0))E.push(at+': size s must be three numbers above 0');
    if(!v3(b.p))E.push(at+': place p must be three numbers');
    if(typeof b.c!=='string'||!(/^#[0-9a-f]{6}$/i.test(b.c)||b.c[0]==='@'&&b.c.slice(1) in ASSET_ROLES))E.push(at+': colour c must be #rrggbb or a role such as @club');
    if(b.r!==undefined&&!v3(b.r))E.push(at+': tilt r must be three numbers');
    if(b.sh!==undefined&&!ASSET_SHAPES.includes(b.sh))E.push(at+': shape sh must be one of '+ASSET_SHAPES.join(', '));
    if(b.o!==undefined&&!n(b.o))E.push(at+': render order o must be a number');};
  if(kind==='weapons'){
    if(typeof a.name!=='string')E.push('name missing');
    if(!['melee','gun','spell','throw','mine'].includes(a.kind))E.push('kind must be melee, gun, spell, throw or mine');
    const M=a.model;if(!M||typeof M!=='object')E.push('model missing');
    else{if(M.boxes!==undefined){if(!Array.isArray(M.boxes))E.push('model.boxes must be a list');else M.boxes.forEach((b,i)=>box(b,'model.boxes['+i+']'));}
      for(const j of ASSET_LISTS){const v=M[j];if(v===undefined)continue;
        if(Array.isArray(v)){v.forEach((b,i)=>box(b,'model.'+j+'['+i+']'));continue;}
        if(!v||typeof v!=='object'){E.push('model.'+j+' must be a list or {at, own}');continue;}
        const at=v.at;if(!at||!v3(at.p)||at.r!==undefined&&!v3(at.r)||at.k!==undefined&&!(n(at.k)&&at.k>0))E.push('model.'+j+'.at needs p, and r and k (above 0) if given');
        if(v.own!==undefined){if(!Array.isArray(v.own))E.push('model.'+j+'.own must be a list');else v.own.forEach((b,i)=>box(b,'model.'+j+'.own['+i+']'));}
        else if(!Array.isArray(M.boxes))E.push('model.'+j+' uses the shared shape, but model.boxes is missing');}}   // (boxes sharing a tag move together: the bazooka's rocket)
    if(M&&M.fore&&!(v3(M.fore.p)&&v3(M.fore.r)))E.push('model.fore needs p and r');
    for(const s of ['dmg','every','range','r','reach','R','mag','reload'])if(a[s]!==undefined&&!(n(a[s])&&a[s]>=0))E.push(s+' must be a number, 0 or more');
    if(a.hit)assetCheckHit(a.hit,'hit',E);
  }else if(kind==='clips'){
    const L=ASSET_LAYOUTS[a.layout];if(!L)E.push('layout must be one of '+Object.keys(ASSET_LAYOUTS).join(', '));
    if(!a.tracks||typeof a.tracks!=='object'||Array.isArray(a.tracks))E.push('tracks missing: a key list for each channel');
    else if(L){const names=L.ch.map(c=>c[0]),have=assetChNames(a);
      for(const k in a.tracks)if(!names.includes(k))E.push('track '+k+': not a channel of layout '+a.layout+' ('+names.join(', ')+')');
      if(have.length<L.min)E.push('layout '+a.layout+' needs tracks for '+names.slice(0,L.min).join(', '));
      for(const k in a.tracks)if(names.includes(k)&&!have.includes(k))E.push('track '+k+': the channels before it need tracks too');
      for(const k of have){const K=a.tracks[k];
        if(!Array.isArray(K)||!K.length){E.push('track '+k+': needs at least one key');continue;}
        let t0=-1;K.forEach((q,i)=>{const at='track '+k+' key '+i;
          if(!Array.isArray(q)||q.length<2||q.length>3)return E.push(at+': a key is [time, value] or [time, value, ease]');
          if(!n(q[0])||q[0]<0||q[0]>2)E.push(at+': time must be a number from 0 to 2');else{if(q[0]<=t0)E.push(at+': keys must be in time order, no two at once');t0=q[0];}
          if(!n(q[1]))E.push(at+': value must be a number');
          if(q.length>2&&q[2]!=='i'&&q[2]!=='o'&&q[2]!=='l')E.push(at+": ease must be 'i', 'o', 'l' or left out");});}}
    if(a.events!==undefined)E.push('events are no longer used: the hitboxes of a blow and when they hurt are on its weapon (hit.hitboxes, t)');
  }else if(kind==='grips'){
    // (enemies/grip.js: sh the weapon hand's spot, out how far along the gun from it, fore [aimed, carried] how far along
    // for the free hand, tw [aimed, carried] the turn side-on, low a carried gun's droop, reach the shoulder's give)
    if(!v3(a.sh))E.push('sh must be three numbers');
    for(const s of ['out','reach'])if(!n(a[s]))E.push(s+' must be a number');
    for(const s of ['fore','tw'])if(!(Array.isArray(a[s])&&a[s].length===2&&a[s].every(n)))E.push(s+' must be two numbers [aimed, carried]');
    if(a.low!==undefined&&!n(a.low))E.push('low must be a number, or left out');
  }else if(kind==='bodies'){
    if(typeof a.name!=='string')E.push('name missing');
    if(a.hit)assetCheckHit(a.hit,'hit',E);
  }else if(kind==='moves'){
    if(typeof a.name!=='string')E.push('name missing');
    if(!a.params||typeof a.params!=='object'||Array.isArray(a.params))E.push('params must be {key:{name, v, min, max, step}}');
    else for(const pk in a.params){const q=a.params[pk];if(!q||typeof q.name!=='string'||!['v','min','max','step'].every(f=>n(q[f])))E.push('params.'+pk+': needs name, v, min, max and step');}
    if(a.smash!==undefined&&!(a.smash&&MOVE_SHAPES.includes(a.smash.shape)&&n(a.smash.size)&&typeof a.smash.name==='string'))E.push('smash needs shape ('+MOVE_SHAPES.join(', ')+'), size and name');
    if(a.hitboxes!==undefined){const H=a.hitboxes;
      if(!H||!Array.isArray(H.boxes))E.push('hitboxes must be {on, boxes:[...]}');
      else H.boxes.forEach((b,i)=>{const at='hitboxes.boxes['+i+']';
        if(b.kind!=='dmg'&&b.kind!=='block')E.push(at+": kind must be 'dmg' or 'block'");
        if(!HB_SHAPE_LIST.includes(b.shape))E.push(at+': shape must be one of '+HB_SHAPE_LIST.join(', '));
        for(const f of ['r','len','fwd','up','side','a','b'])if(!n(b[f]))E.push(at+': '+f+' must be a number');
        for(const f of ['rx','ry','rz','dmg','carDmg'])if(b[f]!==undefined&&!n(b[f]))E.push(at+': '+f+' must be a number');
        if(n(b.a)&&n(b.b)&&b.b<b.a)E.push(at+': b (last frame) must not be before a');});}
  }else if(kind==='sites'){
    for(const f of ['name','kind'])if(typeof a[f]!=='string'||!a[f])E.push(f+' missing');
    for(const f of ['w','h'])if(!(Number.isInteger(a[f])&&a[f]>=1))E.push(f+' must be a whole number, 1 or more');
    if(![-1,0,1,2,3].includes(a.face))E.push('face must be -1, 0, 1, 2 or 3');
    if(!Number.isInteger(a.y0)||a.y0<0)E.push('y0 must be a whole number, 0 or more');
    if(!(Array.isArray(a.size)&&a.size.length===3&&a.size.every(v=>Number.isInteger(v)&&v>=1)))E.push('size must be three whole numbers [NX,NY,NZ]');
    else if(!Array.isArray(a.rows)||a.rows.length!==a.size[2]||a.rows.some(r=>typeof r!=='string'))E.push('rows must be '+a.size[2]+' strings, one per row');
    else if(!assetSiteDecode(a))E.push('rows: the blocks in them do not add up to the size');
    for(const L of ['props','people','cars'])if(a[L]!==undefined){if(!Array.isArray(a[L]))E.push(L+' must be a list');
      else a[L].forEach((q,i)=>{const at=L+'['+i+']';if(!q||!v3(q.p))E.push(at+': p must be three numbers');if(typeof (L==='props'?q.m:q.k)!=='string')E.push(at+': '+(L==='props'?'m (the model)':'k (the kind)')+' missing');
        if(q&&q.yaw!==undefined&&!n(q.yaw))E.push(at+': yaw must be a number');});}
  }else if(kind==='vehicles'){
    if(!Array.isArray(a.boxes)||!a.boxes.length)E.push('boxes: a list of at least one box');
    const P=a.parts||{};if(a.parts!==undefined&&(!a.parts||typeof a.parts!=='object'||Array.isArray(a.parts)))E.push('parts must be {name:{p,in}}');
    for(const k in P){if(!P[k]||!v3(P[k].p))E.push('parts.'+k+': p must be three numbers');if(P[k]&&P[k].in!==undefined&&!P[P[k].in])E.push('parts.'+k+': in names no part');
      let q=P[k],n=0;while(q&&q.in&&n<20){q=P[q.in];n++;}if(n>=20)E.push('parts.'+k+': parts inside each other in a loop');}
    (a.boxes||[]).forEach((b,i)=>{const at='boxes['+i+']';if(!b||typeof b!=='object')return E.push(at+': not a box');
      if(!v3(b.s)||b.s.some(x=>x<=0))E.push(at+': size s must be three numbers above 0');if(!v3(b.p))E.push(at+': place p must be three numbers');
      if(b.r!==undefined&&!v3(b.r))E.push(at+': tilt r must be three numbers');
      if(typeof b.c!=='string'||!(/^#[0-9a-f]{6}$/i.test(b.c)||b.c[0]==='@'&&VEH_ROLES.includes(b.c.slice(1))))E.push(at+': colour c must be #rrggbb or one of '+VEH_ROLES.map(r=>'@'+r).join(' '));
      if(b.part!==undefined&&!P[b.part])E.push(at+': part '+b.part+' is not in parts');});
    if(a.clip!==undefined&&typeof a.clip!=='string')E.push('clip must be the name of a rider animation');
  }else if(kind==='props'||kind==='fixtures'){
    const roles=kind==='props'?['tint']:['pole','lamp'];
    if(!Array.isArray(a.boxes)||!a.boxes.length)E.push('boxes: a list of at least one box');
    else a.boxes.forEach((b,i)=>{const at='boxes['+i+']';if(!b||typeof b!=='object')return E.push(at+': not a box');
      if(!v3(b.s)||b.s.some(x=>x<=0))E.push(at+': size s must be three numbers above 0');
      if(!v3(b.p))E.push(at+': place p must be three numbers');
      if(typeof b.c!=='string'||!(/^#[0-9a-f]{6}$/i.test(b.c)||b.c[0]==='@'&&roles.includes(b.c.slice(1))))E.push(at+': colour c must be #rrggbb or '+roles.map(r=>'@'+r).join(' or '));
      if(b.glow!==undefined&&(b.glow!==true||kind!=='props'||b.c==='@tint'))E.push(at+': glow is true or left out, and only on a prop box with a colour of its own');
      for(const f of ['r','sh','role','o','tag'])if(b[f]!==undefined)E.push(at+': '+f+' isn\'t used here (plain boxes, never tilted)');});
    if(kind==='fixtures'){const sp=a.spots;
      if(sp!==undefined&&(!sp||typeof sp!=='object'||Array.isArray(sp)))E.push('spots must be {name:[x,y,z]}');
      else{for(const k in sp||{})if(!v3(sp[k]))E.push('spots.'+k+' must be three numbers');
        for(const k of FIX_SPOTS[name]||[])if(!sp||!sp[k])E.push('spots.'+k+' missing: where its '+k+' goes');}}
  }
  return E;
}
// hit shapes: {hitboxes:[...], hurtboxes:[...], collision:[...]}, each {k:'box'|'sphere'|'capsule', on (a weapon's hitbox
// only: 'hand' for one that follows the hand through the blow, else it's from the feet), p, s (box size), r (radius),
// h (capsule length), rot, t:[from,to] (a hitbox's live span on its weapon's third-person blow, u 0 to 2)}
const HIT_KINDS=['box','sphere','capsule'],HIT_SETS=['hitboxes','hurtboxes','collision'];
function assetCheckHit(H,at,E){
  const n=v=>typeof v==='number'&&isFinite(v),v3=v=>Array.isArray(v)&&v.length===3&&v.every(n);
  for(const set in H){if(!HIT_SETS.includes(set)){E.push(at+'.'+set+': not one of '+HIT_SETS.join(', '));continue;}
    (H[set]||[]).forEach((s,i)=>{const w=at+'.'+set+'['+i+']';
      if(!HIT_KINDS.includes(s.k))E.push(w+': k must be box, sphere or capsule');
      if(!v3(s.p))E.push(w+': place p must be three numbers');
      if(s.k==='box'&&!(v3(s.s)&&s.s.every(x=>x>0)))E.push(w+': a box needs a size s above 0');
      if(s.k!=='box'&&!(n(s.r)&&s.r>0))E.push(w+': needs a radius r above 0');
      if(s.k==='capsule'&&!(n(s.h)&&s.h>=0))E.push(w+': a capsule needs a length h');
      if(s.rot!==undefined&&!v3(s.rot))E.push(w+': tilt rot must be three numbers');
      if(s.on!==undefined&&!(set==='hitboxes'&&s.on==='hand'))E.push(w+': on can only be hand, on a hitbox');
      if(s.t!==undefined&&!(Array.isArray(s.t)&&s.t.length===2&&s.t.every(n)&&s.t[0]<=s.t[1]))E.push(w+': live span t must be [from, to]');});}
}
