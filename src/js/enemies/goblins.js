// ---------- Goblins ----------
const goblins=[];
const GC={skin:0x6f9a3a,dark:0x4f7426,tunic:0x5a3d22,eye:0xffd23a,club:0x7a5530,belt:0x2b1d10,mouth:0x2a1a10};
// every goblin gets its own role-based materials (recoloured per spawn) and a full wardrobe of hidden accessories
// ---- drawing lots of little boxes in batches ----
// (goblins and vehicles are built from dozens of boxes each, and drawn one by one every box is a draw call: a crowd or a
// busy road runs to thousands, which is what caps how many there can be. So their boxes stay ordinary objects, for the
// rest of the game to move, hide and recolour just as before, but they aren't drawn themselves. Every frame batDraw copies
// where each shown box is, its colour, its glow and its snow into one instanced mesh per box size and kind of material:
// a few dozen draw calls, however many goblins and cars there are.)
const BAT=new Map(),BAT_KMAT=[],BAT_HIDE=31;let batGeoN=0;   // (BAT_HIDE: a layer no camera draws, for batched boxes left in the scene)
// the shared material for a kind: bit 1 drawn a hair in front (hats, glasses), bit 2 catches snow, bit 4 unlit (lamps)
function batKindMat(k){
  if(BAT_KMAT[k])return BAT_KMAT[k];
  const o=k&1?{polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-3}:{};
  const m=k&4?new THREE.MeshBasicMaterial(o):new THREE.MeshLambertMaterial(o);
  m.onBeforeCompile=sh=>{sh.uniforms.uLightC=WORLD_LIGHT;
    sh.vertexShader='attribute vec3 iEmis;attribute float iSnow;varying vec3 vEmis;varying float vSnow;varying float vUp;varying vec3 vWp;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vEmis=iEmis;vSnow=iSnow;vUp=normalize((modelMatrix*instanceMatrix*vec4(normal,0.0)).xyz).y;vWp=position;');
    let f='uniform vec3 uLightC;varying vec3 vEmis;varying float vSnow;varying float vUp;varying vec3 vWp;\n'+sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;','vec3 totalEmissiveRadiance = emissive + vEmis;');
    // (the same snow as snowCar, with each box's amount coming in per instance)
    if(k&2)f=f.replace('#include <dithering_fragment>','float sn=fract(sin(dot(mod(floor(vWp.xz*5.0+0.001),509.0),vec2(12.9898,78.233)))*43758.5453);float sc=smoothstep(0.55,0.85,vUp)*step(sn,vSnow*1.15)*step(0.002,vSnow);\n float sg=fract(sin(dot(mod(floor(vWp.xz*16.0+vWp.y*7.0+0.001),997.0),vec2(39.346,11.135)))*43758.5453);float sv=0.84+0.11*sg+0.03*step(0.93,sg);\n gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(sv,sv+0.012,sv+0.03)*max(uLightC,vec3(0.22)),sc);\n#include <dithering_fragment>');
    sh.fragmentShader=f;};
  m.customProgramCacheKey=()=>'batinst'+k;
  return BAT_KMAT[k]=m;
}
// which kind a box's material draws as, or -1 when it can't go in a batch (a picture on it, see-through, a shader of its own)
function batKind(m){
  const t=m.type;if(t!=='MeshLambertMaterial'&&t!=='MeshBasicMaterial')return -1;
  if(m.map||m.alphaMap||m.envMap||m.lightMap||m.aoMap||m.transparent||m.opacity<1||m.side!==THREE.FrontSide||m.vertexColors||m.wireframe||m.depthTest===false)return -1;
  if(m._obc&&!m.snowU)return -1;
  if(m.polygonOffset&&(m.polygonOffsetFactor!==-1||m.polygonOffsetUnits!==-3))return -1;
  return (m.polygonOffset?1:0)|(m.snowU?2:0)|(t==='MeshBasicMaterial'?4:0);
}
// room for cap boxes in this batch (keeping what's been written this frame)
function batGrow(B,cap){
  const g=new THREE.BufferGeometry(),n=B.n,m=new THREE.InstancedMesh(g,batKindMat(B.k),cap);
  const col=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3),em=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3),sn=new THREE.InstancedBufferAttribute(new Float32Array(cap),1);
  if(B.m){m.instanceMatrix.array.set(B.m.instanceMatrix.array.subarray(0,n*16));col.array.set(B.col.array.subarray(0,n*3));em.array.set(B.em.array.subarray(0,n*3));sn.array.set(B.sn.array.subarray(0,n));
    scene.remove(B.m);B.m.geometry.dispose();}
  g.setIndex(B.geo.index||null);for(const a in B.geo.attributes)g.setAttribute(a,B.geo.attributes[a]);   // (the box's own buffers, plus this batch's per-box ones)
  m.instanceColor=col;g.setAttribute('iEmis',em);g.setAttribute('iSnow',sn);
  m.frustumCulled=false;m.count=0;scene.add(m);   // (one batch spans the whole street, so it's never culled as a whole)
  Object.assign(B,{m,col,em,sn,cap});
}
function batOf(geo,k){const key=(geo.batId||(geo.batId=++batGeoN))*8+k;let B=BAT.get(key);if(!B){B={geo,k,n:0,cap:0,m:null};batGrow(B,64);BAT.set(key,B);}return B;}
// copy every shown box under o into its batch. inScene: o is in the scene, so a batched box is moved to BAT_HIDE (and
// one that can't be batched is left, or put back, on the layer the cameras draw); out of the scene, one that can't be
// batched simply isn't drawn
function batPut(o,inScene){
  for(const c of o.children){if(!c.visible)continue;
    if(c.isMesh&&!c.isInstancedMesh){const mat=c.material,k=Array.isArray(mat)?-1:batKind(mat);
      if(k<0){if(inScene&&c.layers.mask===1<<BAT_HIDE)c.layers.set(0);}
      else{if(inScene&&c.layers.mask!==1<<BAT_HIDE)c.layers.set(BAT_HIDE);
        const B=batOf(c.geometry,k);if(B.n>=B.cap)batGrow(B,B.cap*2);const i=B.n++;
        B.m.instanceMatrix.array.set(c.matrixWorld.elements,i*16);
        const C=B.col.array,E=B.em.array,q=mat.color,e=mat.emissive;C[i*3]=q.r;C[i*3+1]=q.g;C[i*3+2]=q.b;
        if(e){E[i*3]=e.r;E[i*3+1]=e.g;E[i*3+2]=e.b;}else E[i*3]=E[i*3+1]=E[i*3+2]=0;B.sn.array[i]=mat.snowU?mat.snowU.value:0;}}
    if(c.children.length)batPut(c,inScene);}
}
function batDraw(){
  for(const B of BAT.values())B.n=0;
  for(const g of goblins){const r=g.root;if(!r.visible)continue;r.updateMatrixWorld(true);batPut(r,false);}   // (street goblins are kept out of the scene, so nothing else updates their matrices)
  for(const c of cars){if(!c.g.visible)continue;c.g.updateMatrixWorld(true);batPut(c.g,true);}
  for(const B of BAT.values()){if(!B.n&&!B.m.count)continue;B.m.count=B.n;   // (and only the part of each buffer in use goes up to the graphics card)
    for(const [a,w] of [[B.m.instanceMatrix,16],[B.col,3],[B.em,3],[B.sn,1]]){a.needsUpdate=true;if(a.updateRange){a.updateRange.offset=0;a.updateRange.count=B.n*w;}}}
}
const GOB_GEO=new Map();   // (box shapes shared by street goblins and vehicles, by size, so their boxes batch together: never dispose one)
const boxGeo=(w,h,d)=>{const k=w+','+h+','+d;return GOB_GEO.get(k)||GOB_GEO.set(k,new THREE.BoxGeometry(w,h,d)).get(k);};
function goblinModel(parent,o={}){
  const out={legs:[],acc:{},snowU:{value:0}},roles={},matList=[];
  // things worn over the head/face are drawn a hair in front of whatever they sit flush against, so they never flicker
  const OVER={hat:1,hatdark:1,hair:1,patch:1,acc2:1,gold:1};
  const role=(r,c)=>{if(!roles[r]){roles[r]=new THREE.MeshLambertMaterial(OVER[r]?{color:c,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-3}:{color:c});const sn=r==='skin'||r==='hat'||r==='hair'||r==='hatdark';if(sn)snowCar(roles[r],out);matList.push(roles[r]);}return roles[r];};   // (heads and hats catch the snow)
  const geo=(w,h,d)=>o.shareGeo?boxGeo(w,h,d):new THREE.BoxGeometry(w,h,d);
  const box=(w,h,d,r,c,x,y,z,p)=>{const m=new THREE.Mesh(geo(w,h,d),role(r,c));m.position.set(x,y,z);p.add(m);return m;};
  const acc=(name,list)=>{for(const m of list)m.visible=false;out.acc[name]=list;};
  for(const s of[-1,1]){const hip=new THREE.Group();hip.position.set(s*0.13,0.45,0);parent.add(hip);box(0.17,0.45,0.17,'pants',GC.dark,0,-0.225,0,hip);out.legs.push(hip);}
  box(0.5,0.5,0.3,'tunic',o.tunic||GC.tunic,0,0.7,0,parent);box(0.52,0.07,0.32,'belt',GC.belt,0,0.5,0,parent);
  const head=new THREE.Group();head.position.set(0,0.95,0);parent.add(head);out.head=head;
  box(0.48,0.42,0.42,'skin',GC.skin,0,0.21,0.02,head);
  for(const s of[-1,1]){const e=box(0.3,0.1,0.06,'skin',GC.skin,s*0.36,0.28,0,head);e.rotation.z=s*0.35;box(0.1,0.07,0.03,'eye',GC.eye,s*0.11,0.27,0.24,head);}
  box(0.08,0.12,0.1,'dark',GC.dark,0,0.17,0.28,head);box(0.22,0.04,0.02,'mouth',GC.mouth,0,0.07,0.235,head);
  const armL=new THREE.Group();armL.position.set(-0.32,0.92,0);parent.add(armL);out.armL=armL;
  box(0.13,0.42,0.13,'skin',GC.skin,0,-0.2,0,armL);
  const arm=new THREE.Group();arm.position.set(0.32,0.92,0);parent.add(arm);out.arm=arm;
  box(0.13,0.42,0.13,'skin',GC.skin,0,-0.2,0,arm);
  if(o.club!==false){box(0.11,0.11,0.55,'club',GC.club,0,-0.38,0.22,arm);box(0.19,0.19,0.19,'club',GC.club,0,-0.38,0.5,arm);}
  if(o.cult){
    // a cultist: a robe down to the ankles, a pointed hood (the ears poke out of it), a ritual dagger in the right hand,
    // and in the left a fireball, shown only while one's being conjured
    box(0.54,0.4,0.36,'tunic',o.tunic||GC.tunic,0,0.25,0,parent);
    box(0.58,0.1,0.52,'hood',0x2a0408,0,0.47,0,head);box(0.58,0.5,0.08,'hood',0x2a0408,0,0.22,-0.24,head);for(const s of[-1,1])box(0.07,0.44,0.5,'hood',0x2a0408,s*0.28,0.24,0,head);box(0.22,0.14,0.22,'hood',0x2a0408,0,0.58,-0.08,head);
    box(0.08,0.08,0.12,'hilt',0x2a1a10,0,-0.42,0.06,arm);box(0.05,0.03,0.34,'blade',0xd0d4dc,0,-0.42,0.29,arm);
    out.orb=box(0.24,0.24,0.24,'orb',0xff7a1a,0,-0.46,0.04,armL);out.orb.visible=false;
  }
  // the compounds' people: a dagger (thieves), or a rifle (pointing on down past the hand, so it's level when the arm is
  // raised to aim); and whatever they throw, in the left hand, shown only while they're winding up to throw it
  if(o.gear==='dagger'){box(0.08,0.08,0.12,'hilt',0x2a1a10,0,-0.42,0.06,arm);box(0.05,0.03,0.3,'blade',0xd0d4dc,0,-0.42,0.27,arm);}
  if(o.gear==='rifle'){box(0.1,0.3,0.14,'stock',0x4a3420,0,-0.36,0.06,arm);box(0.07,0.62,0.07,'gun',0x22262c,0,-0.78,0.06,arm);box(0.05,0.12,0.05,'gun',0x22262c,0,-0.52,0.13,arm);}
  if(o.held){const [w,h,d,c]=o.held;out.orb=box(w,h,d,'orb',c,0,-0.46,0.04,armL);out.orb.visible=false;}
  // hats
  acc('cap',[box(0.52,0.12,0.48,'hat',0x2a2a2a,0,0.47,0.02,head),box(0.34,0.04,0.2,'hat',0x2a2a2a,0,0.425,0.31,head)]);
  acc('top',[box(0.34,0.36,0.34,'hatdark',0x1a1a1e,0,0.625,0.02,head),box(0.54,0.04,0.52,'hatdark',0x1a1a1e,0,0.445,0.02,head),box(0.38,0.06,0.38,'hat',0x8a2a2a,0,0.5,0.02,head)]);
  acc('beanie',[box(0.52,0.18,0.47,'hat',0x2a2a2a,0,0.485,0.02,head),box(0.1,0.1,0.1,'acc2',0xeeeeee,0,0.62,0.02,head)]);
  acc('hardhat',[box(0.52,0.15,0.5,'hat',0x2a2a2a,0,0.495,0.02,head),box(0.6,0.03,0.58,'hat',0x2a2a2a,0,0.435,0.04,head)]);
  acc('bandana',[box(0.52,0.1,0.47,'hat',0x2a2a2a,0,0.395,0.02,head),box(0.1,0.12,0.06,'hat',0x2a2a2a,0,0.35,-0.24,head)]);
  acc('mohawk',[box(0.08,0.16,0.4,'hair',0x1b1b1b,0,0.51,0,head)]);
  // face
  acc('glasses',[box(0.13,0.09,0.03,'acc2',0x111111,-0.11,0.27,0.255,head),box(0.13,0.09,0.03,'acc2',0x111111,0.11,0.27,0.255,head),box(0.08,0.02,0.02,'acc2',0x111111,0,0.28,0.255,head)]);
  acc('monocle',[box(0.12,0.12,0.02,'gold',0xd8b040,0.11,0.27,0.26,head)]);
  acc('eyepatch',[box(0.13,0.11,0.02,'patch',0x141414,-0.11,0.27,0.255,head),box(0.52,0.025,0.46,'patch',0x141414,0,0.31,0.02,head)]);
  acc('tuft',[box(0.12,0.1,0.06,'hair',0x1b1b1b,0,0.02,0.22,head)]);
  acc('earring',[box(0.04,0.06,0.04,'gold',0xd8b040,0.47,0.24,0,head)]);
  // body
  acc('scarf',[box(0.42,0.1,0.34,'acc',0x884422,0,0.93,0,parent),box(0.1,0.25,0.04,'acc',0x884422,0.12,0.8,0.17,parent)]);
  acc('tie',[box(0.07,0.3,0.03,'acc2',0x111111,0,0.74,0.165,parent)]);
  acc('apron',[box(0.4,0.4,0.03,'acc',0x884422,0,0.62,0.165,parent)]);
  acc('backpack',[box(0.36,0.4,0.16,'acc',0x884422,0,0.72,-0.23,parent)]);
  acc('pouch',[box(0.12,0.12,0.08,'belt',GC.belt,0.2,0.5,0.17,parent)]);
  out.mats=matList;out.roles=roles;return out;
}
// ---- who each goblin is ----
const GOB={
  first:['Grizzle','Snagg','Mog','Pip','Wort','Nubb','Skrag','Bletch','Gibbet','Murk','Fester','Drool','Krag','Bogs','Nettle','Grub','Ogg','Twitch','Squib','Rattle','Gnash','Blort','Zib','Hobb','Muck','Scab','Tansy','Rusk','Fennick','Grot','Snik','Wobble','Mildew','Gristle','Crumb','Dreg','Nim','Spud','Ploop','Quill','Tibb','Brine','Lurk','Mabble','Snerk','Gorp','Hilda','Agnes','Doris','Ethel'],
  last:['Mudwhistle','Ratchetjaw','Bunglefoot','Grimetooth','Sootbottom','Wartwhistle','Snaggletooth','Puddlewick','Gristlebeard','Moldbottom','Knucklecrack','Bogbelly','Dregsworth','Slagheap','Crumblewick','Thistlegrime','Muckraker','Gutterson','Nibbleton','Rustbucket','Toadspittle','Ashgrub','Drainsworth','Lintpocket','Blisterwick','Gravelgut','Fungusson','Scuttlebutt','Mossbottom','Clatterhorn','Sludgewater','Pinchpenny','Grubnose','Bolthorn','Cinderwax'],
  hostile:['Debt collector','Loan shark','Pickpocket','Club bouncer','Graffiti artist','Mugger','Bookie','Racketeer','Bounty hunter','Back-alley dentist','Unlicensed exterminator','Professional heckler','Getaway driver (no car)','Bridge toll extortionist','Hired muscle','Knee-capper','Smuggler','Scrap thief','Street-fight promoter','Repo goblin'],
  civ:['Accountant','Street vendor','Barista','Cab dispatcher','Tax clerk','Florist','Plumber','Librarian','Fortune teller','Mushroom farmer','Night-shift janitor','Insurance adjuster','Bus driver','Tailor','Candle maker','Pigeon trainer','Sewer engineer','Rat groomer','Locksmith','Retired pirate','Crossing guard','Middle manager','Parking inspector','Pastry chef','Wedding singer','Dental hygienist','Real estate agent','Substitute teacher','Night-market cook','Lamp-post inspector'],
  hobby:['Competitive spitting','Collecting teeth','Knitting tiny hats','Sewer spelunking','Bottle-cap trading','Pigeon racing','Tuba practice','Aging cheese','Writing angry poetry','Moss gardening','Bowling','Amateur taxidermy','Karaoke','Rat agility trials','Arm wrestling','Ham radio','Cloud judging','Stamp forgery','Puddle jumping','Speed-eating','Model ship building','Interpretive dance','Collecting door hinges','Juggling knives','Composting','Gargoyle sketching','Crossword cheating','Ghost hunting','Yodeling','Fermenting things'],
  quirk:['Hums when nervous','Never blinks','Counts every step out loud','Afraid of puddles','Talks to their club','Eats soap','Laughs at funerals','Always slightly damp','Wears socks on their ears','Can’t whistle, tries constantly','Sleeps standing up','Licks doorknobs','Allergic to Tuesdays','Insists they are tall','Speaks only in questions','Collects their own toenails','Narrates their own life','Sneezes in threes','Owes everyone money','Smells faintly of onions','Hates the colour green (is green)','Keeps a pet beetle in their hat','Whispers to pigeons','Refuses to walk on cracks','Claims to have seen a hippo once','Bites when startled','Has a lucky rock','Walks backwards on Sundays','Laughs like a kettle','Never finishes their sente']
};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const GPAL={
  skin:[0x6f9a3a,0x7aa848,0x5f8a34,0x86a24a,0x5a7f3a,0x8fb05a,0x6b8f4a,0x7c9a30,0x93a85a,0x5d7a44],
  tunic:[0x5a3d22,0x6a2a22,0x3a4a6a,0x4a5a2a,0x6a5a3a,0x2a2a32,0x7a3a5a,0x3a6a5a,0x8a6a2a,0x5c5c66,0xa83232,0x2a7a5a,0xd6d2c4,0x3a5f8a],
  pants:[0x3a3328,0x2b2f38,0x4a3a2a,0x3d3a33,0x22262c,0x4f4636,0x2e3a2e],
  hat:[0xc9a02a,0x2a2a2a,0xa83232,0x3a5f8a,0xd8c48a,0x5a7a2a,0xe0b020,0x7a4a8a,0xc0c0c0],
  acc:[0x884422,0xa83232,0x3a5f8a,0xc9a02a,0x2a7a5a,0x8a7a6a,0xd6d2c4,0x5a3a6a],
  acc2:[0x111111,0xeeeeee,0xa83232,0x3a5f8a,0xc9a02a],
  hair:[0x1b1b1b,0x4a2e1a,0x7a6a5a,0xb8b0a0,0x2e3b22,0x8a2a1a]
};
const hexCss=h=>'#'+h.toString(16).padStart(6,'0');
// put a look on a goblin model (live goblins use base scale ES; the obituary preview uses 1)
function applyLook(t,L,base){
  const R=t.roles;
  R.skin.color.setHex(L.skin);R.dark.color.setHex(L.skin).multiplyScalar(0.72);R.tunic.color.setHex(L.tunic);R.pants.color.setHex(L.pants);
  for(const k of ['hat','acc','acc2','hair'])if(R[k])R[k].color.setHex(L[k]);
  for(const k in t.acc)for(const m of t.acc[k])m.visible=false;
  for(const k of L.show||[])if(t.acc[k])for(const m of t.acc[k])m.visible=true;
  t.root.scale.set(base*L.w,base*L.h,base*L.w);t.head.scale.setScalar(L.hs);
}
function dressGoblin(g){
  const L={skin:pick(GPAL.skin),tunic:pick(GPAL.tunic),pants:pick(GPAL.pants),hat:pick(GPAL.hat),acc:pick(GPAL.acc),acc2:pick(GPAL.acc2),hair:pick(GPAL.hair),show:[]};
  const add=k=>L.show.push(k);
  const hats=g.civ?['none','none','cap','cap','top','beanie','hardhat','bandana']:['none','none','bandana','bandana','mohawk','cap','beanie','hardhat'];
  L.hatType=pick(hats);if(L.hatType!=='none')add(L.hatType);
  L.hatShown=L.hatType==='none'?L.skin:L.hatType==='top'?0x1a1a1e:L.hatType==='mohawk'?L.hair:L.hat;
  const face=pick(g.civ?['none','none','none','glasses','glasses','monocle']:['none','none','none','eyepatch','glasses','monocle']);if(face!=='none')add(face);
  if(Math.random()<0.2)add('tuft');if(Math.random()<0.25)add('earring');if(Math.random()<0.3)add('pouch');
  if(Math.random()<0.2)add('scarf');else if(g.civ&&Math.random()<0.25)add('tie');
  if(g.civ&&(g.vendor||Math.random()<0.12))add('apron');
  if(Math.random()<0.15)add('backpack');
  // slight differences in height and build
  L.h=0.86+Math.random()*0.3;L.w=0.9+Math.random()*0.2;L.hs=0.92+Math.random()*0.18;
  applyLook(g,L,ES);
  return L;
}
function makeIdentity(g,look){
  return{name:pick(GOB.first)+' '+pick(GOB.last),age:12+Math.floor(Math.random()*79),occ:pick(g.civ?GOB.civ:GOB.hostile),hobby:pick(GOB.hobby),quirk:pick(GOB.quirk),
    sk:hexCss(look.skin),tu:hexCss(look.tunic),ht:hexCss(look.hatShown),look};
}
