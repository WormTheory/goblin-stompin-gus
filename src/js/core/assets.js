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
// A clip: {layout, keys:[{t, v:[...the layout's channels], e:'i' (gathering speed) or 'o' (slowing), or none (smooth)}],
//   events:[{t,k}]}: its layout names what each number in v is (ASSET_LAYOUTS).
const ASSET_LAYOUTS={
  // a goblin's blow, shot, throw or reload as anyone sees it, u 0 to 2, the blow landing at 1 (strikes.js)
  body:{about:'A goblin, as everyone sees it',ch:[['arm',"Arm's swing"],['armOut','Arm out to the side'],['wrist','Wrist'],['free',"Free arm's swing"],
    ['twist','Twist at the waist'],['lean','Lean forward'],['step','Half-step forward']],min:7},
  // Gnash's and Grizzle's own arm in first person (the roll is left off a clip that never rolls)
  vm:{about:'First person: the weapon arm',ch:[['tilt','Tilt'],['across','Across'],['up','Up'],['fwd','Forward'],['roll','Roll']],min:4},
  // a reload in first person, added to where the gun's held
  vr:{about:'First person: a reload',ch:[['tilt','Tilt'],['roll','Roll'],['across','Across'],['up','Up'],['fwd','Forward'],['mag','Magazine out (0 home, 1 gone)']],min:6}};
const ASSET_SHAPES=['box','cyl','cone','wedge','sphere'];
const ASSET_ROLES={club:null};   // ('@club' is null in a weapon's list: wpnBoxes paints it the goblins' club colour, GC.club)
const assetLayoutOf=name=>/^vm/.test(name)?'vm':/^vr/.test(name)?'vr':'body';
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
// a clip's file -> the timeline STRIKES holds: [[u, ...values, ease?], ...]
function assetClip(c){return c.keys.map(k=>{const a=[k.t,...k.v];if(k.e)a.push(k.e);return a;});}
function assetClipOf(name,K){
  return {layout:assetLayoutOf(name),keys:K.map(a=>{const e=typeof a[a.length-1]==='string'?a[a.length-1]:null,v=a.slice(1,e?-1:undefined),k={t:a[0],v};if(e)k.e=e;return k;}),
    events:assetLayoutOf(name)==='body'&&!/^rl/.test(name)?[{t:1,k:'hit'}]:[]};
}
// the tables, from ASSETS (files in the order their _order.json gives)
function assetWeaponsAll(A){const o={};for(const k in A.weapons)o[k]=assetWeapon(A.weapons[k]);return o;}
function assetClipsAll(A){const o={};for(const k in A.clips)o[k]=assetClip(A.clips[k]);return o;}

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
    if(!Array.isArray(x)&&(x.s&&x.p||'t' in x&&'v' in x))return s;
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
    if(!Array.isArray(a.keys)||a.keys.length<2)E.push('a clip needs at least two keys');
    else{let t0=-1,len=null;a.keys.forEach((k,i)=>{
      if(!n(k.t))E.push('key '+i+': time t must be a number');else{if(k.t<t0)E.push('key '+i+': keys must be in time order');t0=k.t;}
      if(!Array.isArray(k.v)||!k.v.every(n))E.push('key '+i+': values v must be numbers');
      else if(L){if(k.v.length<L.min||k.v.length>L.ch.length)E.push('key '+i+': '+L.min+' to '+L.ch.length+' values for layout '+a.layout);
        if(len!==null&&k.v.length!==len)E.push('key '+i+': every key needs the same number of values');len=k.v.length;}
      if(k.e!==undefined&&k.e!=='i'&&k.e!=='o')E.push("key "+i+": ease e must be 'i', 'o' or left out");});
      const t1=a.keys[a.keys.length-1].t;
      for(const ev of a.events||[])if(!n(ev.t)||ev.t<a.keys[0].t||ev.t>t1)E.push('event '+ev.k+' is outside the clip');}
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
  }
  return E;
}
// hit shapes: {hitboxes:[...], hurtboxes:[...], collision:[...]}, each {k:'box'|'sphere'|'capsule', on:pivot name, p, s (box
// size), r (radius), h (capsule length), rot, t:[from,to] (a hitbox's live span on its clip, u)}
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
      if(s.t!==undefined&&!(Array.isArray(s.t)&&s.t.length===2&&s.t.every(n)&&s.t[0]<=s.t[1]))E.push(w+': live span t must be [from, to]');});}
}
