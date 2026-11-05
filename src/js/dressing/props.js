// ---- props: furniture built from a handful of small boxes instead of whole blocks, in proportion to the goblins (a goblin
// stands about 1.4 blocks tall, so a bed's about 1.7 long and a seat 0.36 up). So far just inside hospitals. They aren't
// part of the voxel world: they're drawn as instanced boxes for whatever's near you, and get knocked flat by anything
// big. Each part: colour, x, y, z (its centre, from the prop's foot) and size. x and z turn with the prop's yaw, and
// its local -z is its back. PT stands for the prop's own tint; PG marks a part that glows. ----
const PROP_MAX=30000,PROP_GLOW_MAX=3000,PT=-1,PG=0x1000000;
const PROP_L=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0xffffff}),PROP_MAX);
const PROP_G=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff}),PROP_GLOW_MAX);
for(const m of [PROP_L,PROP_G]){m.setColorAt(0,new THREE.Color(0xffffff));m.frustumCulled=false;m.count=0;scene.add(m);}
const P_STEEL=0xa9b1b7,P_DARK=0x2a2e33,P_WHITE=0xe9edf0,P_WOOD=0x9c6c3e,P_SCREEN=PG+0x63e6d6;
function shelfModel(n){
  const H=n*.97,M=[[P_DARK,-.48,H/2,0,.04,H,.86],[P_DARK,.48,H/2,0,.04,H,.86],[P_STEEL,0,H/2,0,.92,H,.05]];
  for(let i=0;i<n;i++){const y=.14+i*.97;M.push([P_STEEL,0,y,0,.92,.04,.84],[PT,0,y+.22,0,.84,.38,.72]);}
  return M;
}
function fridgeModel(n){
  const H=n*.97;
  return [[P_WHITE,0,H/2,0,.94,H,.82],[0xbfe6f5,0,H/2+.03,.415,.82,H-.12,.02],[P_STEEL,.32,H/2,.435,.04,Math.min(.8,H*.6),.03],[P_DARK,0,.05,.4,.94,.1,.04]];
}
const PROPS={
  // out on the pavements and in the parks: a bench of wooden slats on two iron ends, a back rest behind; a squat green litter bin with a dark lid
  parkbench:[[0x3a3f45,-1,.27,0,.1,.54,.62],[0x3a3f45,1,.27,0,.1,.54,.62],[0x3a3f45,-1,.7,-.27,.1,.42,.08],[0x3a3f45,1,.7,-.27,.1,.42,.08],[0x8a5a32,0,.58,.04,2.3,.08,.56],[0x8a5a32,0,.86,-.29,2.3,.12,.06],[0x7a4e2a,0,1.04,-.29,2.3,.12,.06]],
  litterbin:[[0x2e5a3a,0,.42,0,.62,.84,.62],[0x23272b,0,.88,0,.7,.08,.7],[0x23272b,0,.94,0,.3,.06,.3]],
  // a hospital bed: wheels, a steel frame, mattress, pillow and blanket, a head and foot board, and side rails
  bed:[[P_DARK,-.34,.06,-.7,.12,.12,.12],[P_DARK,.34,.06,-.7,.12,.12,.12],[P_DARK,-.34,.06,.7,.12,.12,.12],[P_DARK,.34,.06,.7,.12,.12,.12],
    [P_STEEL,-.34,.2,-.7,.05,.2,.05],[P_STEEL,.34,.2,-.7,.05,.2,.05],[P_STEEL,-.34,.2,.7,.05,.2,.05],[P_STEEL,.34,.2,.7,.05,.2,.05],
    [P_STEEL,0,.31,0,.8,.06,1.62],[P_WHITE,0,.41,0,.76,.14,1.56],[0xfbfbf6,0,.52,-.56,.5,.09,.32],[PT,0,.5,.27,.8,.05,.98],[PT,-.4,.4,.27,.03,.22,.98],[PT,.4,.4,.27,.03,.22,.98],
    [P_STEEL,0,.5,-.82,.8,.5,.05],[P_STEEL,0,.42,.82,.8,.32,.05],[P_DARK,-.43,.62,-.25,.03,.03,.7],[P_DARK,.43,.62,-.25,.03,.03,.7],[P_DARK,-.43,.52,-.25,.03,.2,.03],[P_DARK,.43,.52,-.25,.03,.2,.03]],
  // the same on a plainer frame, with no blanket: a trolley for wheeling patients about
  gurney:[[P_DARK,-.28,.06,-.62,.1,.12,.1],[P_DARK,.28,.06,-.62,.1,.12,.1],[P_DARK,-.28,.06,.62,.1,.12,.1],[P_DARK,.28,.06,.62,.1,.12,.1],[P_STEEL,0,.28,0,.04,.32,1.3],[P_STEEL,0,.46,0,.62,.05,1.5],[P_WHITE,0,.53,0,.58,.08,1.46],[0xfbfbf6,0,.6,-.52,.42,.06,.28],[P_STEEL,-.33,.62,0,.03,.03,1.1],[P_STEEL,.33,.62,0,.03,.03,1.1]],
  // a monitor on a wheeled pole, with its screen glowing
  vitals:[[P_DARK,0,.03,0,.42,.05,.08],[P_DARK,0,.03,0,.08,.05,.42],[P_STEEL,0,.55,0,.05,1,.05],[P_DARK,0,1.16,0,.4,.3,.12],[P_SCREEN,0,1.16,.065,.33,.23,.02]],
  // a drip stand: a pole with a hook across the top and a bag hanging from it
  drip:[[P_DARK,0,.03,0,.36,.05,.06],[P_DARK,0,.03,0,.06,.05,.36],[P_STEEL,0,.65,0,.035,1.3,.035],[P_STEEL,0,1.3,0,.34,.03,.03],[0xbfe3ef,.13,1.17,0,.12,.2,.05]],
  // a plain chair, in the prop's tint
  chair:[[P_STEEL,-.16,.17,-.16,.04,.34,.04],[P_STEEL,.16,.17,-.16,.04,.34,.04],[P_STEEL,-.16,.17,.16,.04,.34,.04],[P_STEEL,.16,.17,.16,.04,.34,.04],[PT,0,.37,0,.4,.06,.4],[PT,0,.62,-.18,.4,.44,.05]],
  // three waiting room seats on one steel beam
  seats:[[P_STEEL,0,.28,0,1.5,.06,.08],[P_STEEL,-.6,.14,0,.05,.28,.3],[P_STEEL,.6,.14,0,.05,.28,.3],[PT,-.5,.37,0,.44,.06,.4],[PT,0,.37,0,.44,.06,.4],[PT,.5,.37,0,.44,.06,.4],[PT,-.5,.62,-.18,.44,.44,.05],[PT,0,.62,-.18,.44,.44,.05],[PT,.5,.62,-.18,.44,.44,.05]],
  // an office chair: star base on wheels, a pole, the seat and back
  swivel:[[P_DARK,0,.07,0,.46,.04,.06],[P_DARK,0,.07,0,.06,.04,.46],[P_STEEL,0,.22,0,.05,.28,.05],[0x35506b,0,.38,0,.4,.07,.4],[0x35506b,0,.66,-.18,.36,.46,.06]],
  // a desk with a computer: flat screen on a stand, keyboard and a tower underneath
  desk:[[P_WOOD,0,.6,0,1.5,.05,.66],[P_WOOD,-.72,.29,0,.05,.58,.62],[P_WOOD,.72,.29,0,.05,.58,.62],[P_WOOD,0,.38,-.3,1.4,.42,.03],[P_DARK,.52,.22,.02,.2,.42,.46],[P_DARK,-.1,.64,-.14,.2,.03,.14],[P_STEEL,-.1,.7,-.15,.05,.1,.04],[P_DARK,-.1,.9,-.15,.56,.36,.04],[P_SCREEN,-.1,.9,-.125,.5,.3,.015],[0xd8dce0,-.1,.635,.12,.42,.02,.14],[0xd8dce0,.22,.635,.12,.07,.02,.1]],
  // a stretch of reception counter: a tall front, a white top
  counter:[[0x2f8a8a,0,.42,.22,2,.84,.06],[P_WHITE,0,.87,.14,2.02,.05,.3],[P_WOOD,0,.56,-.1,2,.05,.5],[P_WOOD,-.98,.28,-.1,.05,.56,.5]],
  // a curtain between beds, in folds, hanging from a rail
  curtain:[[P_STEEL,0,1.72,0,.04,.04,2],[0x7fb7a6,0,.97,-.75,.05,1.45,.5],[0x6da593,0,.97,-.25,.05,1.45,.5],[0x7fb7a6,0,.97,.25,.05,1.45,.5],[0x6da593,0,.97,.75,.05,1.45,.5]],
  // a supply cabinet, with a red cross on its doors
  cabinet:[[P_WHITE,0,.72,0,.95,1.44,.42],[P_STEEL,0,.72,.215,.02,1.4,.01],[P_DARK,-.08,.72,.22,.03,.14,.02],[P_DARK,.08,.72,.22,.03,.14,.02],[0xd32f2f,0,1.2,.22,.24,.07,.01],[0xd32f2f,0,1.2,.22,.07,.24,.01]],
  // a crash cart: red drawers on wheels, a defibrillator on top
  cart:[[P_DARK,-.2,.05,-.14,.08,.1,.08],[P_DARK,.2,.05,-.14,.08,.1,.08],[P_DARK,-.2,.05,.14,.08,.1,.08],[P_DARK,.2,.05,.14,.08,.1,.08],[0xc62828,0,.42,0,.54,.64,.4],[P_WHITE,0,.28,.205,.46,.02,.01],[P_WHITE,0,.46,.205,.46,.02,.01],[P_WHITE,0,.62,.205,.46,.02,.01],[P_DARK,0,.84,0,.3,.2,.24],[PG+0xffd23a,0,.84,.125,.2,.1,.01]],
  // a wheelchair: two big wheels, a seat and back, a footrest and two small front wheels
  wheelchair:[[P_DARK,-.28,.24,-.04,.05,.48,.48],[P_DARK,.28,.24,-.04,.05,.48,.48],[P_STEEL,-.28,.24,-.04,.07,.12,.12],[P_STEEL,.28,.24,-.04,.07,.12,.12],[0x34495e,0,.38,0,.46,.06,.42],[0x34495e,0,.62,-.2,.46,.42,.05],[P_STEEL,-.26,.44,.1,.03,.03,.3],[P_STEEL,.26,.44,.1,.03,.03,.3],[P_DARK,0,.14,.34,.4,.03,.16],[P_DARK,-.2,.06,.24,.05,.12,.12],[P_DARK,.2,.06,.24,.05,.12,.12]],
  // a shop shelf, one to four blocks tall: two uprights, a back, a board and a row of goods at each level
  shelf1:shelfModel(1),shelf2:shelfModel(2),shelf3:shelfModel(3),shelf4:shelfModel(4),
  // a fridge, one to three blocks tall: a white case, a pale glass door, a handle
  fridge1:fridgeModel(1),fridge2:fridgeModel(2),fridge3:fridgeModel(3),
  // a one-seat length of sofa, in the prop's tint: run some together and it's a long one
  sofa:[[PT,0,.2,.04,.92,.3,.8],[PT,0,.56,-.32,.92,.5,.14],[PT,-.42,.42,.04,.1,.2,.8],[PT,.42,.42,.04,.1,.2,.8]],
  // a bed at home: a wooden frame and headboard, mattress, pillow and blanket
  homebed:[[P_WOOD,0,.14,0,.86,.2,1.6],[P_WOOD,0,.42,-.78,.86,.76,.06],[P_WHITE,0,.32,0,.8,.14,1.5],[0xfbfbf6,0,.42,-.52,.56,.08,.32],[PT,0,.41,.24,.82,.06,1.04]],
  // bunks: two beds in a steel frame
  bunk:[[P_STEEL,-.42,.8,-.78,.05,1.6,.05],[P_STEEL,.42,.8,-.78,.05,1.6,.05],[P_STEEL,-.42,.8,.78,.05,1.6,.05],[P_STEEL,.42,.8,.78,.05,1.6,.05],[P_WHITE,0,.34,0,.8,.14,1.5],[PT,0,.42,.2,.82,.05,1.1],[P_WHITE,0,1.22,0,.8,.14,1.5],[PT,0,1.3,.2,.82,.05,1.1]],
  // a table, or one block's length of counter: a top on four legs
  table:[[P_WOOD,0,.62,0,1,.07,1],[P_DARK,-.42,.29,-.42,.07,.58,.07],[P_DARK,.42,.29,-.42,.07,.58,.07],[P_DARK,-.42,.29,.42,.07,.58,.07],[P_DARK,.42,.29,.42,.07,.58,.07]],
  // the same with a computer on it
  deskm:[[P_WOOD,0,.62,0,1,.07,1],[P_DARK,-.42,.29,-.42,.07,.58,.07],[P_DARK,.42,.29,-.42,.07,.58,.07],[P_DARK,-.42,.29,.42,.07,.58,.07],[P_DARK,.42,.29,.42,.07,.58,.07],[P_STEEL,0,.72,-.12,.06,.14,.04],[P_DARK,0,.94,-.12,.56,.36,.04],[P_SCREEN,0,.94,-.095,.5,.3,.015]],
  // a screen on a block: a till, a shop's display
  monitor:[[P_STEEL,0,.07,0,.06,.14,.04],[P_DARK,0,.3,0,.56,.36,.04],[P_SCREEN,0,.3,.025,.5,.3,.015]],
  // a restaurant table on one leg, its top in the prop's tint
  rtable:[[P_DARK,0,.03,0,.5,.06,.5],[P_DARK,0,.32,0,.08,.56,.08],[PT,0,.62,0,.96,.05,.96]],
  // one side of a booth: a padded bench with a high back
  booth:[[P_DARK,0,.1,.04,1.3,.2,.46],[PT,0,.3,.06,1.3,.16,.5],[PT,0,.6,-.2,1.3,.76,.12]],
  // a stool at the counter
  stool:[[P_DARK,0,.03,0,.34,.06,.34],[P_STEEL,0,.28,0,.06,.46,.06],[PT,0,.54,0,.36,.08,.36]],
  // a block's length of shop counter: a panelled front and a top
  bar:[[PT,0,.42,0,1,.84,.66],[P_WOOD,0,.87,0,1.02,.06,.76]],
  // a cooker: an oven, burners, and an extractor hood above
  range:[[P_STEEL,0,.42,0,.96,.84,.7],[P_DARK,-.24,.85,.04,.34,.02,.5],[P_DARK,.24,.85,.04,.34,.02,.5],[P_DARK,0,.4,.355,.7,.4,.01],[PG+0xff8a2a,0,.72,.355,.5,.05,.01],[P_STEEL,0,1.78,-.06,1,.26,.62],[P_STEEL,0,2.3,-.14,.3,.8,.3]],
  // a steel sink with its tap
  sink:[[P_STEEL,0,.42,0,.96,.84,.66],[P_DARK,0,.85,.03,.6,.02,.42],[P_DARK,0,.98,-.22,.05,.26,.05],[P_DARK,0,1.08,-.14,.05,.05,.2]],
  // a steel worktop, with a pot and a chopping board
  prep:[[P_STEEL,0,.84,0,.98,.06,.68],[P_DARK,-.42,.41,-.26,.06,.82,.06],[P_DARK,.42,.41,-.26,.06,.82,.06],[P_DARK,-.42,.41,.26,.06,.82,.06],[P_DARK,.42,.41,.26,.06,.82,.06],[P_STEEL,0,.28,0,.9,.04,.6],[P_DARK,-.2,1,0,.3,.26,.3],[P_WOOD,.22,.89,.04,.34,.04,.26]],
  // a pizza oven: a brick dome, its mouth glowing, and a flue
  oven:[[0xa84a34,0,.55,0,1.9,1.1,.9],[0xb5533c,0,1.25,0,1.4,.3,.74],[PG+0xff7a1e,0,.62,.455,.8,.4,.01],[P_DARK,0,.36,.46,1,.06,.03],[P_DARK,0,1.9,-.1,.3,1,.3]],
  // a glass case of cakes, in the counter's tint
  pcase:[[PT,0,.33,0,1,.66,.66],[0xcfeaf5,0,.82,0,1,.32,.66],[0xe0a95a,-.24,.76,0,.3,.14,.3],[0xd96a8a,.22,.76,0,.3,.14,.3]],
  // a coffee machine
  espresso:[[P_STEEL,0,.18,0,.5,.36,.34],[P_DARK,0,.08,.14,.34,.03,.12],[P_DARK,-.12,.3,.2,.06,.06,.08],[P_DARK,.12,.3,.2,.06,.06,.08]],
  // a supermarket checkout: a belt, the till, the bagging end
  checkout:[[P_DARK,0,.4,0,.62,.8,1.9],[0x3a3f45,0,.81,.3,.5,.02,1.2],[P_STEEL,0,.81,-.68,.56,.02,.5],[P_DARK,.2,1.02,-.3,.1,.34,.1],[P_DARK,.2,1.22,-.3,.34,.24,.04],[P_SCREEN,.2,1.22,-.275,.3,.2,.01],[PG+0xffe066,0,1.6,-.74,.06,.5,.06]],
  // a shopping trolley
  trolley:[[P_DARK,-.22,.05,-.28,.07,.1,.07],[P_DARK,.22,.05,-.28,.07,.1,.07],[P_DARK,-.22,.05,.28,.07,.1,.07],[P_DARK,.22,.05,.28,.07,.1,.07],[P_STEEL,0,.16,0,.52,.03,.7],[P_STEEL,0,.5,0,.56,.04,.76],[P_STEEL,-.27,.34,0,.03,.3,.74],[P_STEEL,.27,.34,0,.03,.3,.74],[P_STEEL,0,.34,.36,.54,.3,.03],[P_STEEL,0,.34,-.36,.54,.3,.03],[0xc83a32,0,.62,-.42,.56,.05,.05]],
  // a bin of fruit and veg, tilted forward in its crate
  bin:[[P_WOOD,0,.3,0,.94,.6,.94],[PT,0,.62,0,.84,.08,.84],[PT,-.2,.7,.2,.24,.1,.24],[PT,.22,.7,-.18,.24,.1,.24]],
  // a sign hung over an aisle
  aislesign:[[P_STEEL,0,.5,0,.03,1,.03],[PT,0,0,0,.08,.5,1.3],[P_WHITE,0,0,0,.09,.1,.9]],
  // a flat television
  tv:[[P_DARK,0,.34,0,.86,.56,.05],[P_SCREEN,0,.34,.03,.78,.48,.01],[P_DARK,0,.03,0,.34,.05,.2]],
  // a tall bookcase: spines in rows, each row a colour or two
  bookcase:[[P_WOOD,0,1.3,-.14,.98,2.6,.06],[P_WOOD,-.47,1.3,0,.05,2.6,.34],[P_WOOD,.47,1.3,0,.05,2.6,.34],[P_WOOD,0,.05,0,.92,.1,.34],[P_WOOD,0,.85,0,.92,.04,.34],[P_WOOD,0,1.65,0,.92,.04,.34],[PT,-.2,.42,.02,.46,.6,.24],[0x4f86c6,.26,.42,.02,.36,.6,.24],[0xd8b13a,-.22,1.22,.02,.42,.6,.24],[PT,.24,1.22,.02,.4,.6,.24],[0x5aa469,-.1,2.02,.02,.6,.6,.24],[0xc9553f,.36,2.02,.02,.14,.6,.24]],
  // a dentist's chair: a reclining seat on a pillar, a headrest, a little tray on an arm
  dchair:[[P_STEEL,0,.16,0,.5,.1,.6],[P_STEEL,0,.32,0,.14,.24,.14],[0x3f9c9c,0,.46,.1,.5,.1,.96],[0x3f9c9c,0,.68,-.52,.5,.46,.1],[0x3f9c9c,0,.94,-.6,.26,.16,.08],[P_STEEL,.42,.74,-.1,.03,.5,.03],[P_WHITE,.42,1,.1,.3,.03,.26]],
  // its lamp, on a long arm
  dlamp:[[P_STEEL,0,1.1,-.5,.05,2.2,.05],[P_STEEL,0,2.1,-.1,.05,.05,.8],[PG+0xfff4c8,0,1.98,.3,.4,.06,.26]],
  // an X-ray lit up on the wall
  xray:[[P_DARK,0,1.4,0,.7,.56,.04],[PG+0xcfe6ef,0,1.4,.025,.62,.48,.01],[0x6a7c86,0,1.4,.035,.12,.34,.01]],
  // a fish tank on a stand
  fishtank:[[P_WOOD,0,.3,0,.96,.6,.46],[0x3a7fa0,0,.84,0,.96,.48,.46],[PG+0x63c8e6,0,.86,.235,.9,.42,.01],[0xe08a3c,-.2,.9,.245,.14,.06,.01],[0xd8b13a,.22,.78,.245,.14,.06,.01],[0x3f8f3f,.36,.72,.245,.06,.2,.01]],
  // a glass display counter, its goods in the prop's tint
  gcase:[[P_DARK,0,.28,0,1,.56,.66],[0xcfeaf5,0,.76,0,1,.4,.66],[PT,-.26,.64,0,.3,.1,.34],[PT,.2,.64,.04,.34,.1,.3],[P_STEEL,0,.97,0,1.02,.03,.68]],
  // shelves of jars
  jars:[[P_WOOD,0,1.05,-.1,.98,2.1,.08],[P_WOOD,0,.7,.02,.98,.04,.26],[P_WOOD,0,1.3,.02,.98,.04,.26],[PT,-.3,.82,.02,.18,.2,.16],[PT,0,.82,.02,.18,.2,.16],[PT,.3,.82,.02,.18,.2,.16],[PT,-.3,1.42,.02,.18,.2,.16],[PT,0,1.42,.02,.18,.2,.16],[PT,.3,1.42,.02,.18,.2,.16]],
  // a rack of rifles on a wall
  gunrack:[[P_WOOD,0,1.3,-.2,.96,1.2,.06],[P_DARK,-.3,1.3,-.14,.08,1,.06],[P_DARK,0,1.3,-.14,.08,1,.06],[P_DARK,.3,1.3,-.14,.08,1,.06],[P_WOOD,-.3,.86,-.14,.1,.2,.08],[P_WOOD,0,.86,-.14,.1,.2,.08],[P_WOOD,.3,.86,-.14,.1,.2,.08]],
  // a paper target at the end of a lane
  target:[[P_WHITE,0,1.2,0,.6,.9,.02],[P_DARK,0,1.2,.015,.4,.6,.01],[0xd32f2f,0,1.2,.025,.14,.2,.01]],
  // a wooden crate of something
  pcrate:[[P_WOOD,0,.3,0,.86,.6,.66],[P_DARK,0,.62,0,.9,.04,.7],[P_DARK,-.3,.3,.34,.05,.6,.02],[P_DARK,.3,.3,.34,.05,.6,.02]],
  // pallet racking, up towards the warehouse roof
  pallet:[[0x2b5fb8,-.47,2.4,0,.06,4.8,.8],[0x2b5fb8,.47,2.4,0,.06,4.8,.8],[0xd8742a,0,.2,0,.94,.05,.8],[0xd8742a,0,1.8,0,.94,.05,.8],[0xd8742a,0,3.4,0,.94,.05,.8],[PT,0,.8,0,.82,1.1,.7],[0xbf9a6a,0,2.4,0,.82,1.1,.7],[PT,0,4,0,.82,1.1,.7]],
  // a rail of clothes
  clothes:[[P_STEEL,-.42,.65,0,.04,1.3,.04],[P_STEEL,.42,.65,0,.04,1.3,.04],[P_STEEL,0,1.28,0,.88,.03,.03],[P_DARK,0,.03,0,.96,.05,.4],[PT,-.26,.85,0,.26,.82,.36],[0x46505a,0,.85,0,.2,.82,.36],[PT,.26,.85,0,.26,.82,.36]],
  // a shop-window dummy, dressed in the prop's tint
  mannequin:[[P_DARK,0,.03,0,.36,.05,.36],[P_WHITE,0,.42,0,.08,.76,.08],[PT,0,.92,0,.36,.5,.2],[P_WHITE,0,1.3,0,.2,.22,.2]],
  // a flag on a stand
  flag:[[P_DARK,0,.04,0,.4,.08,.4],[P_STEEL,0,1.3,0,.05,2.6,.05],[0xc83a32,.34,2.2,0,.62,.4,.02],[P_WHITE,.34,2,0,.62,.08,.02],[0x2b5fb8,.16,2.3,.01,.26,.2,.02]],
  // a row of grey lockers
  locker:[[0x6b7780,0,.8,0,.96,1.6,.5],[P_DARK,0,.8,.255,.01,1.56,.01],[P_DARK,-.24,1.1,.255,.04,.12,.01],[P_DARK,.24,1.1,.255,.04,.12,.01]],
  // a tall lamp in a showroom
  flamp:[[P_DARK,0,.03,0,.34,.05,.34],[P_STEEL,0,.75,0,.04,1.45,.04],[PG+0xfff0c0,0,1.55,0,.4,.3,.4]],
  // a toy shop's stack of boxes, in bright colours
  toys:[[PT,0,.3,0,.84,.6,.66],[0xd8b13a,-.18,.78,0,.4,.36,.5],[0x5aa469,.22,.72,.05,.3,.24,.4],[0xa86bc0,0,1.14,0,.3,.36,.3]],
  // a car on show, polished up
  showcar:[[PT,0,.42,0,1.5,.42,3],[PT,0,.84,-.1,1.36,.42,1.5],[0x9fd0e6,0,.86,.66,1.3,.3,.04],[0x9fd0e6,0,.86,-.86,1.3,.3,.04],[P_DARK,-.72,.24,.92,.2,.48,.5],[P_DARK,.72,.24,.92,.2,.48,.5],[P_DARK,-.72,.24,-.92,.2,.48,.5],[P_DARK,.72,.24,-.92,.2,.48,.5]],
  // a desk in a cubicle: a low screen round two sides, a computer, a chair's worth of room in front
  cube:[[0x6b7780,0,.55,-.47,1,1.1,.05],[0x6b7780,-.47,.55,0,.05,1.1,.96],[P_WOOD,.04,.62,-.1,.9,.05,.66],[P_DARK,.42,.3,-.1,.05,.6,.6],[P_DARK,.1,.8,-.3,.44,.3,.04],[P_SCREEN,.1,.8,-.275,.38,.24,.01],[0xd8dce0,.1,.655,.02,.34,.02,.12]],
  // a photocopier
  copier:[[0xd8dce0,0,.42,0,.8,.84,.6],[P_DARK,0,.87,0,.7,.04,.5],[P_STEEL,.3,.5,.31,.2,.3,.02],[PG+0x63e6d6,-.2,.84,.2,.2,.03,.1]],
  // a pair of lift doors, with the light over them
  elevator:[[P_STEEL,0,1.3,0,1.8,2.6,.1],[P_DARK,0,1.2,.06,.04,2.3,.02],[P_DARK,0,2.45,.06,1.6,.04,.02],[PG+0xffd23a,0,2.75,.06,.5,.14,.02],[P_DARK,1.04,1.2,.06,.1,.2,.02]],
  // a wardrobe
  wardrobe:[[P_WOOD,0,.95,0,.96,1.9,.56],[P_DARK,0,.95,.285,.02,1.84,.01],[P_DARK,-.08,1,.285,.03,.2,.02],[P_DARK,.08,1,.285,.03,.2,.02]],
  // a chest of drawers with a lamp on it
  drawers:[[P_WOOD,0,.4,0,.9,.8,.5],[P_DARK,0,.3,.255,.86,.02,.01],[P_DARK,0,.56,.255,.86,.02,.01],[P_DARK,0,.85,0,.2,.1,.2],[PG+0xfff0c0,0,1.03,0,.3,.26,.3]],
  // a toilet
  toilet:[[P_WHITE,0,.2,.1,.4,.4,.6],[P_WHITE,0,.62,-.28,.5,.56,.22],[P_DARK,0,.41,.1,.3,.02,.4]],
  // a bath
  bathtub:[[P_WHITE,0,.28,0,.86,.56,1.7],[0xbfe3ef,0,.57,0,.66,.02,1.5],[P_STEEL,0,.72,-.72,.06,.3,.06]],
  // a washbasin with its mirror
  basin:[[P_WHITE,0,.38,0,.5,.76,.42],[0xbfe3ef,0,.77,.02,.36,.02,.26],[0xcfeaf5,0,1.4,-.2,.5,.6,.02]],
  // a bank's counter: a panelled front, the glass above, a little opening
  teller:[[PT,0,.45,.1,1,.9,.5],[P_WOOD,0,.92,.1,1.04,.05,.6],[0xcfeaf5,0,1.55,.2,1,1.2,.03],[P_DARK,0,2.14,.2,1.02,.05,.06]],
  // a safe
  safe:[[0x3a3f45,0,.55,0,.9,1.1,.8],[P_DARK,0,.55,.41,.72,.92,.02],[P_STEEL,.1,.55,.43,.2,.2,.02],[P_STEEL,-.26,.55,.43,.04,.3,.02]],
  // a radio desk: a mixing desk, a screen, a microphone on its arm
  mixer:[[P_DARK,0,.42,0,.96,.84,.7],[0x3a3f45,0,.86,.02,.92,.04,.6],[PG+0xffd23a,-.3,.89,.1,.14,.01,.2],[PG+0x63e6d6,.1,.89,.1,.34,.01,.2],[P_DARK,0,1.04,-.26,.5,.3,.04],[P_SCREEN,0,1.04,-.235,.44,.24,.01],[P_STEEL,.42,1.1,0,.03,.5,.03],[P_DARK,.34,1.32,.14,.1,.14,.1]],
  // an ON AIR light
  onair:[[P_DARK,0,0,0,.8,.3,.04],[PG+0xff3030,0,0,.03,.72,.22,.01]],
  // a television camera on its tripod
  tvcam:[[P_DARK,0,.3,0,.04,.6,.04],[P_DARK,0,.04,0,.5,.04,.05],[P_DARK,0,.04,0,.05,.04,.5],[P_STEEL,0,.72,0,.06,.3,.06],[P_DARK,0,1.02,.06,.3,.32,.64],[0x2a2e33,0,1.02,.42,.2,.2,.1]],
  // a pupil's desk
  sdesk:[[P_WOOD,0,.5,0,.8,.05,.5],[P_STEEL,-.34,.24,0,.04,.48,.4],[P_STEEL,.34,.24,0,.04,.48,.4],[0xd8dce0,-.14,.53,.04,.24,.02,.16]],
  // a basketball hoop on the wall
  hoop:[[P_STEEL,0,1.8,-.3,.1,3.6,.1],[P_WHITE,0,3,-.1,1.1,.7,.05],[0xd8742a,0,2.74,.12,.42,.03,.42]],
  // firefighters' kit on its pegs
  gearrack:[[P_STEEL,0,.9,-.18,.96,1.8,.05],[0xd8b13a,-.26,1.1,-.02,.32,.8,.24],[0xd8b13a,.26,1.1,-.02,.32,.8,.24],[0xc83a32,-.26,1.66,-.02,.26,.2,.26],[0xc83a32,.26,1.66,-.02,.26,.2,.26],[P_DARK,-.26,.3,.02,.26,.3,.34],[P_DARK,.26,.3,.02,.26,.3,.34]],
  // an operating table
  optable:[[P_STEEL,0,.42,0,.3,.8,.5],[0x3f9c9c,0,.86,0,.66,.08,1.8],[P_DARK,0,.04,0,.7,.08,.8]],
  // the big lamp over it
  oplamp:[[P_STEEL,0,1.3,0,.06,2.6,.06],[P_STEEL,.35,2.5,0,.7,.05,.05],[PG+0xfff4c8,.7,2.4,0,.6,.1,.6],[P_DARK,0,.04,0,.5,.08,.5]],
  // a metal detector to walk through
  detector:[[0xd8dce0,-.6,1.1,0,.12,2.2,.3],[0xd8dce0,.6,1.1,0,.12,2.2,.3],[0xd8dce0,0,2.2,0,1.32,.14,.3],[PG+0x4ad66a,0,2.2,.16,.2,.06,.01]],
  // the judge's bench: a high wooden front, the gavel on top
  judge:[[P_WOOD,0,.7,0,3,1.4,.8],[0x7a4a2a,0,1.43,0,3.1,.06,.9],[P_DARK,.5,1.5,.1,.3,.08,.1]],
  // the witness box
  wbox:[[P_WOOD,0,.5,.3,1,1,.06],[P_WOOD,-.47,.5,0,.06,1,.66],[P_WOOD,.47,.5,0,.06,1,.66],[P_DARK,.2,1.1,.3,.05,.2,.05]],
  // a body scanner: a white ring and its sliding bed
  scanner:[[P_WHITE,0,.85,-.5,1.8,1.7,.5],[0x2a2e33,0,.85,-.24,.8,.8,.02],[P_STEEL,0,.5,.4,.5,.4,1.3],[0x3f9c9c,0,.72,.3,.56,.06,1.6]],
  // a notice board, or a whiteboard in the tint
  board:[[P_WOOD,0,1.4,0,1.5,.9,.04],[PT,0,1.4,.025,1.4,.8,.01],[P_WHITE,-.3,1.5,.035,.3,.34,.01],[0xd8b13a,.25,1.3,.035,.3,.26,.01]],
  // a church pew: a seat and a high back, a block's length of one
  pew:[[P_WOOD,0,.4,.02,1,.06,.4],[P_WOOD,0,.6,-.18,1,.5,.05],[P_WOOD,0,.2,.1,1,.4,.05]],
  // a cinema's popcorn machine, lit up
  popcorn:[[0xc83a32,0,.3,0,.56,.6,.46],[PG+0xffe9a0,0,.84,0,.56,.5,.46],[0xc83a32,0,1.14,0,.6,.1,.5]],
  // an arcade cabinet
  arcade:[[P_DARK,0,.8,0,.66,1.6,.6],[P_SCREEN,0,1.08,.305,.5,.36,.01],[PT,0,.74,.3,.56,.1,.1],[PT,0,1.5,.305,.6,.14,.01]],
  // a tall speaker
  speaker:[[P_DARK,0,.9,0,.8,1.8,.56],[0x3a3f45,0,1.32,.285,.4,.4,.01],[0x3a3f45,0,.56,.285,.56,.56,.01]],
  // a microphone on its stand
  micstand:[[P_DARK,0,.03,0,.3,.05,.3],[P_STEEL,0,.6,0,.03,1.2,.03],[P_DARK,0,1.22,.03,.08,.12,.08]],
  // a music stand
  musicstand:[[P_DARK,0,.03,0,.24,.05,.24],[P_STEEL,0,.42,0,.03,.8,.03],[P_DARK,0,.85,.03,.34,.24,.02],[P_WHITE,0,.85,.045,.3,.2,.01]],
  // a statue on its plinth, in the tint
  statue:[[P_WHITE,0,.4,0,.8,.8,.8],[PT,0,1.2,0,.3,.8,.3],[PT,0,1.72,0,.24,.26,.24],[PT,-.26,1.34,0,.14,.5,.14],[PT,.26,1.34,0,.14,.5,.14]],
  // a slot machine, with its stool's worth of lights
  slot:[[0xc83a32,0,.62,0,.8,1.24,.56],[P_SCREEN,0,.92,.285,.56,.36,.01],[PG+0xffd23a,0,1.32,.1,.76,.14,.4],[P_DARK,0,.56,.3,.6,.1,.1],[P_STEEL,.45,.9,.1,.04,.4,.04]],
  // a gaming table: green baize on a wooden edge
  ptable:[[P_WOOD,0,.6,0,3.4,.12,1.8],[0x1f7a44,0,.67,0,3.1,.02,1.5],[P_DARK,0,.28,0,1.2,.56,.5],[0xc83a32,-.6,.7,.2,.2,.04,.2],[P_WHITE,.5,.7,-.2,.3,.03,.2]],
  // a stretch of conveyor, a box riding it, in the tint
  conveyor:[[P_DARK,-.4,.28,0,.08,.56,.8],[P_DARK,.4,.28,0,.08,.56,.8],[0x3a3f45,0,.6,0,1,.06,.86],[P_STEEL,0,.68,0,1,.02,.7]],
  // a machine beside the line
  machine:[[PT,0,.75,0,1.5,1.5,1.3],[P_DARK,0,.9,.655,.9,.5,.02],[PG+0x4ad66a,.5,1.3,.655,.14,.14,.02],[PG+0xff4a3a,.26,1.3,.655,.14,.14,.02],[P_STEEL,0,1.65,0,.3,.3,.3]],
  // a lab's vat, bubbling
  vat:[[P_STEEL,0,.5,0,.9,1,.9],[PG+0x7aff5a,0,1.04,0,.74,.08,.74],[P_STEEL,0,1.2,.4,.08,.4,.08],[P_DARK,.5,.3,0,.1,.5,.1]],
  // a bale of hay
  hay:[[0xd8b13a,0,.4,0,.96,.8,1],[0xb98f24,0,.4,.3,.98,.82,.04],[0xb98f24,0,.4,-.3,.98,.82,.04]],
  // a vase on a pedestal, in the tint
  vase:[[P_WHITE,0,.45,0,.5,.9,.5],[PT,0,1.02,0,.3,.24,.3],[PT,0,1.24,0,.2,.2,.2],[PT,0,1.42,0,.28,.06,.28]],
  // a suit of armour on a stand
  armour:[[P_DARK,0,.05,0,.6,.1,.6],[P_STEEL,-.12,.45,0,.14,.7,.16],[P_STEEL,.12,.45,0,.14,.7,.16],[P_STEEL,0,1.02,0,.46,.5,.26],[P_STEEL,-.3,1,0,.12,.5,.14],[P_STEEL,.3,1,0,.12,.5,.14],[0x9a9fa5,0,1.42,0,.24,.28,.26],[P_DARK,0,1.42,.135,.16,.04,.01],[P_DARK,.42,.8,.1,.04,1.5,.04]],
  // a mummy's coffin, standing in a glass case
  mummy:[[P_DARK,0,.08,0,.9,.16,.8],[0xc9a24a,0,.86,0,.52,1.4,.34],[0x2b5fb8,0,1.3,.18,.4,.14,.01],[0xc9a24a,0,1.68,0,.36,.3,.3],[0xcfeaf5,0,1,.42,.88,1.7,.02],[0xcfeaf5,-.44,1,0,.02,1.7,.84],[0xcfeaf5,.44,1,0,.02,1.7,.84]],
  // a model ship in a case
  ship:[[P_WOOD,0,.4,0,.9,.8,.5],[0xcfeaf5,0,1.1,0,.9,.6,.5],[0x7a4a2a,0,.92,0,.6,.1,.16],[P_WHITE,0,1.14,0,.04,.36,.3],[P_WOOD,0,1.06,0,.03,.3,.03]],
  // a post with a rope to the next
  stanchion:[[P_DARK,0,.02,0,.24,.04,.24],[0xc9a24a,0,.4,0,.05,.8,.05],[0x8a1f24,0,.74,.5,.03,.03,1]],
  // a director's chair, canvas in the tint
  dirchair:[[P_WOOD,-.2,.25,0,.04,.5,.4],[P_WOOD,.2,.25,0,.04,.5,.4],[PT,0,.46,0,.42,.03,.38],[PT,0,.84,-.18,.42,.2,.03],[P_WOOD,-.22,.66,-.18,.03,.44,.03],[P_WOOD,.22,.66,-.18,.03,.44,.03]],
  // a sound man's boom on its stand
  boom:[[P_DARK,0,.03,0,.5,.05,.5],[P_STEEL,0,1,0,.05,2,.05],[P_STEEL,0,2,.8,.03,.03,1.7],[P_DARK,0,1.9,1.62,.14,.14,.3]],
  // a studio light on a tall stand
  studiolight:[[P_DARK,0,.03,0,.6,.05,.6],[P_STEEL,0,1.3,0,.05,2.6,.05],[P_DARK,0,2.6,.1,.5,.4,.3],[PG+0xfff4c8,0,2.6,.26,.4,.3,.01]],
  // a flat painted backdrop, in the tint
  backdrop:[[PT,0,1.5,0,1,3,.06],[P_WOOD,0,.1,-.3,.1,.2,.6]],
  // a toilet stall: side panels, a door standing ajar, the pan inside
  stall:[[0x8fa3ad,-.5,.75,0,.05,1.5,1.3],[0x8fa3ad,.5,.75,0,.05,1.5,1.3],[0x8fa3ad,.3,.75,.65,.4,1.3,.04],[P_WHITE,0,.2,-.2,.4,.4,.56],[P_WHITE,0,.6,-.56,.5,.5,.18],[P_DARK,0,.41,-.18,.3,.02,.38]],
  // the little sign outside a bathroom
  wcsign:[[0x2b5fb8,0,0,0,.5,.5,.03],[P_WHITE,-.12,.02,.02,.1,.26,.01],[P_WHITE,.12,.02,.02,.1,.26,.01],[P_WHITE,-.12,.18,.02,.08,.08,.01],[P_WHITE,.12,.18,.02,.08,.08,.01]],
  // a deep fryer: a steel case, two baskets in hot oil
  fryer:[[P_STEEL,0,.42,0,.96,.84,.7],[0xd8a030,0,.85,.03,.8,.02,.5],[P_DARK,-.2,.92,.03,.3,.14,.36],[P_DARK,.2,.92,.03,.3,.14,.36],[P_DARK,0,.4,.355,.7,.3,.01]],
  // a drinks machine, on a counter
  soda:[[P_DARK,0,.3,0,.6,.6,.4],[PG+0xff4a3a,0,.44,.205,.5,.2,.01],[P_STEEL,0,.12,.2,.46,.04,.12]],
  // a pool table
  pool:[[P_WOOD,0,.6,0,1.12,.14,2],[0x1f7a44,0,.68,0,.96,.02,1.84],[P_DARK,-.46,.27,-.86,.1,.54,.1],[P_DARK,.46,.27,-.86,.1,.54,.1],[P_DARK,-.46,.27,.86,.1,.54,.1],[P_DARK,.46,.27,.86,.1,.54,.1],[P_WHITE,.1,.72,.4,.07,.07,.07],[0xc83a32,-.2,.72,-.3,.07,.07,.07],[0x2b5fb8,.25,.72,-.5,.07,.07,.07]],
  // a jukebox
  jukebox:[[0x7a1f24,0,.7,0,.9,1.4,.5],[PG+0xffb43a,0,1.05,.255,.7,.5,.01],[PG+0x4ad6ff,0,.48,.255,.7,.1,.01],[P_DARK,0,.24,.255,.7,.22,.01]],
  // beer taps, on a counter
  taps:[[P_STEEL,0,.18,0,.7,.06,.08],[P_STEEL,-.26,.09,0,.06,.18,.06],[P_STEEL,.26,.09,0,.06,.18,.06],[P_DARK,-.2,.28,.02,.05,.16,.05],[P_DARK,0,.28,.02,.05,.16,.05],[P_DARK,.2,.28,.02,.05,.16,.05]],
  // shelves of bottles against a wall
  bottles:[[P_WOOD,0,1,-.1,.98,2,.08],[P_WOOD,0,.7,.02,.98,.04,.26],[P_WOOD,0,1.3,.02,.98,.04,.26],[0x3f8f4a,-.3,.84,.02,.2,.24,.14],[0xa8682a,.05,.84,.02,.2,.24,.14],[0xcfe6ef,.33,.84,.02,.16,.24,.14],[0xa8682a,-.28,1.44,.02,.2,.24,.14],[0x7a2a2a,.04,1.44,.02,.2,.24,.14],[0x3f8f4a,.32,1.44,.02,.2,.24,.14]],
  // a big pot with a lid, on a counter
  pot:[[P_STEEL,0,.17,0,.56,.34,.56],[P_DARK,0,.35,0,.6,.03,.6],[P_DARK,0,.4,0,.1,.06,.1]],
  // a box for donations, on a counter
  dbox:[[0xd8c8a8,0,.14,0,.3,.28,.3],[P_DARK,0,.285,0,.16,.01,.03]],
  // a long canteen table, and the bench to go with it
  ltable:[[P_WOOD,0,.62,0,1.6,.06,.8],[P_DARK,-.68,.29,0,.08,.58,.62],[P_DARK,.68,.29,0,.08,.58,.62]],
  lounger:[[P_WOOD,-.24,.1,.5,.05,.2,.05],[P_WOOD,.24,.1,.5,.05,.2,.05],[P_WOOD,-.24,.1,-.1,.05,.2,.05],[P_WOOD,.24,.1,-.1,.05,.2,.05],[PT,0,.23,.16,.58,.05,1.1],[PT,0,.33,-.46,.58,.05,.2],[PT,0,.45,-.62,.58,.05,.2]],
  towel:[[PT,0,.02,0,.72,.03,1.5],[P_WHITE,0,.025,-.56,.72,.03,.18],[P_WHITE,0,.025,.56,.72,.03,.18]],
  lifeguard:[[P_WOOD,-.7,.9,-.7,.12,1.8,.12],[P_WOOD,.7,.9,-.7,.12,1.8,.12],[P_WOOD,-.7,.9,.7,.12,1.8,.12],[P_WOOD,.7,.9,.7,.12,1.8,.12],[P_WOOD,0,1.84,0,1.7,.08,1.7],[P_WHITE,0,2.15,-.8,1.7,.55,.06],[P_WHITE,-.8,2.15,0,.06,.55,1.7],[P_WHITE,.8,2.15,0,.06,.55,1.7],[P_WOOD,-.7,2.7,-.7,.08,1.1,.08],[P_WOOD,.7,2.7,-.7,.08,1.1,.08],[P_WOOD,-.7,2.7,.7,.08,1.1,.08],[P_WOOD,.7,2.7,.7,.08,1.1,.08],[0xc83a32,0,3.28,0,2,.1,2],[P_WOOD,0,.95,1.15,.5,.06,.9]],
  // the quayside's and the deck's bits and pieces
  bollard:[[0x2b2f36,0,.22,0,.26,.44,.26],[0x2b2f36,0,.47,0,.38,.08,.38]],
  drum:[[PT,0,.42,0,.52,.84,.52],[0x2b2f36,0,.84,0,.54,.03,.54],[0x2b2f36,0,.42,0,.54,.03,.54]],
  rope:[[0xc9b27a,0,.06,0,.66,.12,.66],[0xb39a62,0,.16,0,.5,.1,.5],[0x7a5a36,0,.2,0,.2,.03,.2]],
  lifering:[[P_WOOD,0,.7,0,.1,1.4,.1],[0xe8642a,0,1.05,.07,.6,.12,.06],[0xe8642a,0,.63,.07,.6,.12,.06],[P_WHITE,-.26,.84,.07,.12,.34,.06],[P_WHITE,.26,.84,.07,.12,.34,.06]],
  anchor:[[0x2b2f36,0,.1,0,.16,.16,1.5],[0x2b2f36,0,.1,-.7,1.1,.16,.16],[0x2b2f36,-.5,.1,-.52,.16,.16,.3],[0x2b2f36,.5,.1,-.52,.16,.16,.3],[0x2b2f36,0,.1,.72,.7,.12,.12]],
  lpot:[[0x9a7a4a,0,.03,0,.7,.06,.5],[0x9a7a4a,-.33,.2,0,.05,.34,.48],[0x9a7a4a,.33,.2,0,.05,.34,.48],[0x7a8a7a,0,.2,0,.6,.3,.42],[0x9a7a4a,0,.38,0,.7,.04,.1]],
  buoys:[[0xe8642a,-.15,.16,0,.3,.32,.3],[0xe8c83a,.2,.14,.1,.26,.28,.26],[0xe8642a,.05,.12,-.25,.24,.24,.24]],
  flagmast:[[P_STEEL,0,3,0,.12,6,.12],[PT,.62,5.4,0,1.1,.7,.03],[P_DARK,0,.1,0,.6,.2,.6]],
  pipes:[[0x6a6e72,0,.18,-.2,2.4,.18,.18],[0x6a6e72,0,.18,0,2.4,.18,.18],[0x6a6e72,0,.18,.2,2.4,.18,.18],[0x7a7e82,0,.36,-.1,2.4,.18,.18],[0x7a7e82,0,.36,.1,2.4,.18,.18]],
  // the beach's games and treats
  vnet:[[P_WOOD,-2,1,0,.1,2,.1],[P_WOOD,2,1,0,.1,2,.1],[P_WHITE,0,1.75,0,4,.06,.02],[0xd8d8c8,0,1.45,0,3.9,.5,.015],[P_WHITE,0,1.16,0,4,.04,.02]],
  sandcastle:[[0xd8c48a,0,.14,0,.9,.28,.9],[0xd8c48a,-.3,.36,-.3,.22,.2,.22],[0xd8c48a,.3,.36,-.3,.22,.2,.22],[0xd8c48a,-.3,.36,.3,.22,.2,.22],[0xd8c48a,.3,.36,.3,.22,.2,.22],[0xd8c48a,0,.4,0,.3,.28,.3],[P_WOOD,0,.68,0,.03,.3,.03],[0xc83a32,.08,.78,0,.14,.09,.02]],
  surfrack:[[PT,-.42,.85,0,.3,1.7,.06],[0xe8c83a,0,.85,0,.3,1.7,.06],[0x3f6b8c,.42,.85,0,.3,1.7,.06],[P_WOOD,0,.5,-.08,1.4,.08,.08],[P_WOOD,-.68,.3,-.08,.08,.6,.08],[P_WOOD,.68,.3,-.08,.08,.6,.08]],
  icecart:[[P_WHITE,0,.6,0,1.2,.6,.62],[0x3f9ad8,0,.92,0,1.24,.04,.66],[P_DARK,-.5,.16,.32,.08,.32,.3],[P_DARK,.5,.16,.32,.08,.32,.3],[P_STEEL,0,1.5,0,.05,1.2,.05],[PT,0,2.1,0,1.7,.1,1.7]],
  ball:[[PT,0,.17,0,.34,.34,.34],[P_WHITE,0,.17,0,.36,.12,.36]],
  fishcrate:[[0x7a5a36,0,.2,0,.74,.4,.5],[0x9fb8c8,0,.41,0,.62,.05,.38],[0x7a5a36,.14,.68,.03,.6,.34,.44]],
  netrack:[[P_WOOD,-1,.75,0,.08,1.5,.08],[P_WOOD,1,.75,0,.08,1.5,.08],[P_WOOD,0,1.46,0,2.1,.06,.06],[0x5a7a6a,0,.9,0,1.9,1.08,.03],[0xd8c070,.5,.72,.03,.14,.14,.05],[0xd8c070,-.4,1.08,.03,.14,.14,.05]],
  bench:[[P_WOOD,0,.36,0,1.6,.07,.34],[P_DARK,-.62,.16,0,.08,.32,.28],[P_DARK,.62,.16,0,.08,.32,.28]],
  // a stretch of buffet: dishes of food under a glass guard
  buffet:[[P_STEEL,0,.4,0,1,.8,.86],[P_DARK,0,.81,0,1,.02,.8],[0xc9553f,-.24,.84,-.2,.4,.05,.32],[0xd8b13a,.24,.84,-.2,.4,.05,.32],[0x5aa469,-.24,.84,.2,.4,.05,.32],[0xe6dcc8,.24,.84,.2,.4,.05,.32],[0xcfeaf5,0,1.2,0,1,.03,.5],[P_STEEL,0,1.02,0,.04,.36,.04]],
  // a parasol: a weighted foot, a tall pole, a striped canopy in steps
  umbrella:[[P_DARK,0,.04,0,.5,.08,.5],[P_STEEL,0,1.15,0,.06,2.3,.06],[PT,0,2.28,0,2.1,.07,2.1],[P_WHITE,0,2.285,0,2.14,.08,.42],[P_WHITE,0,2.285,0,.42,.08,2.14],[PT,0,2.38,0,1.4,.07,1.4],[PT,0,2.47,0,.7,.07,.7]],
  // a senator's desk: a little wooden desk and its chair, facing the rostrum
  ldesk:[[P_WOOD,0,.5,.2,.8,.06,.5],[P_WOOD,-.34,.24,.2,.05,.48,.42],[P_WOOD,.34,.24,.2,.05,.48,.42],[P_DARK,0,.54,.28,.6,.02,.26],[PT,0,.33,-.3,.44,.05,.4],[PT,0,.55,-.48,.44,.4,.05],[P_DARK,0,.15,-.3,.3,.3,.3]],
  // a stretch of the benches in a House chamber, padded, with a rail in front to rest papers on
  lbench:[[P_WOOD,0,.15,-.02,1,.3,.46],[PT,0,.34,-.02,1,.08,.46],[PT,0,.58,-.24,1,.5,.1],[P_WOOD,0,.72,.3,1,.05,.2],[P_WOOD,0,.36,.34,.1,.72,.08]],
  // the lectern on a rostrum: a tall wooden front, a microphone either side, the gavel
  lectern:[[P_WOOD,0,.55,0,1.3,1.1,.5],[0x7a4a2a,0,1.12,0,1.36,.05,.56],[P_STEEL,-.4,1.28,.05,.03,.3,.03],[P_STEEL,.4,1.28,.05,.03,.3,.03],[P_DARK,.15,1.18,-.1,.26,.06,.08]],
  // a great painting in a gold frame, hung on the wall
  painting:[[0xc9a24a,0,1.9,0,2.8,1.9,.08],[PT,0,1.9,.045,2.56,1.66,.01],[0x5a7a4a,0,1.42,.05,2.56,.7,.01],[0xe8dcc0,-.6,1.98,.055,.5,.8,.01],[0x7a2a2a,.5,1.86,.055,.42,.66,.01]],
  // a portrait of somebody important, its name on a little plate
  portrait:[[0x7a5a2a,0,1.85,0,.8,1.04,.06],[PT,0,1.85,.035,.68,.92,.01],[0xd8c0a0,0,2.02,.04,.24,.3,.01],[P_DARK,0,1.66,.04,.4,.44,.01],[0xc9a24a,0,1.22,.03,.36,.08,.02]],
  // the seal on the wall behind a rostrum or a dais: gold round a blue middle
  seal:[[0xc9a24a,0,2.3,0,1.3,1.3,.06],[0xc9a24a,0,2.3,0,.9,1.6,.06],[0xc9a24a,0,2.3,0,1.6,.9,.06],[0x1c2a5a,0,2.3,.04,1,1,.01],[0xc9a24a,0,2.3,.05,.34,.34,.01]],
  // a big rug
  rug:[[PT,0,.015,0,4.2,.03,3],[0xc9a24a,0,.02,0,3.8,.03,2.6],[PT,0,.025,0,3.5,.03,2.3]],
  // a potted plant
  plant:[[0xb86a3c,0,.17,0,.36,.34,.36],[0x5a3d22,0,.35,0,.3,.02,.3],[0x3f8f3f,0,.6,0,.1,.5,.1],[0x3f8f3f,-.16,.72,.02,.36,.1,.14],[0x35803a,.16,.84,-.03,.36,.1,.14],[0x3f8f3f,.02,.96,.16,.14,.1,.36],[0x35803a,0,1.08,-.1,.14,.1,.3]],
  // ---- out of doors: the markets, camps and yards (see siteProps) ----
  // a farmer's market table: a cloth down the front, two crates heaped with produce on top, the prices chalked on tags
  mtable:[[P_WOOD,0,.76,0,1,.06,.84],[P_DARK,-.44,.37,-.36,.06,.74,.06],[P_DARK,.44,.37,-.36,.06,.74,.06],[P_DARK,-.44,.37,.36,.06,.74,.06],[P_DARK,.44,.37,.36,.06,.74,.06],
    [0xe8e0cc,0,.55,.43,1,.36,.02],[PT,0,.5,.44,1,.06,.02],[0x9c6c3e,-.24,.86,-.05,.44,.14,.5],[0x9c6c3e,.24,.86,-.05,.44,.14,.5],[PT,-.24,.96,-.05,.38,.08,.44],[PT,.24,.96,-.05,.38,.08,.44],
    [PT,-.3,1.03,0,.14,.08,.14],[PT,-.16,1.03,-.14,.14,.08,.14],[PT,.2,1.03,.06,.14,.08,.14],[PT,.3,1.03,-.16,.14,.08,.14],[P_WHITE,-.24,.9,.21,.16,.08,.01],[P_WHITE,.24,.9,.21,.16,.08,.01]],
  // a market stall's pole, up to the awning
  mpost:[[P_STEEL,0,1.5,0,.12,3,.12],[P_DARK,0,.03,0,.24,.06,.24]],
  // a bushel basket of produce, on the ground
  bushel:[[0x9c6c3e,0,.18,0,.44,.36,.44],[0x7a5432,0,.37,0,.46,.03,.46],[PT,0,.4,0,.38,.06,.38],[PT,-.08,.46,.06,.14,.08,.14],[PT,.1,.46,-.06,.14,.08,.14],[PT,0,.5,0,.12,.06,.12]],
  // crates of produce, stacked: two, and one on top
  pcrates:[[0x9c6c3e,-.23,.16,0,.42,.32,.56],[0x9c6c3e,.23,.16,0,.42,.32,.56],[PT,-.23,.33,0,.36,.04,.5],[PT,.23,.33,0,.36,.04,.5],[0x9c6c3e,0,.5,0,.42,.32,.56],[PT,0,.67,0,.36,.04,.5],[PT,-.05,.71,.1,.12,.06,.12],[PT,.08,.71,-.12,.12,.06,.12]],
  // a sandwich board, chalked with the day's prices
  aboard:[[P_WOOD,0,.48,0,.64,.96,.2],[0x26302a,0,.54,.105,.52,.7,.01],[0x26302a,0,.54,-.105,.52,.7,.01],[P_WHITE,0,.78,.11,.4,.05,.01],[PT,0,.62,.11,.32,.05,.01],[P_WHITE,0,.48,.11,.36,.04,.01],[P_WHITE,0,.38,.11,.26,.04,.01],[P_WHITE,0,.78,-.11,.4,.05,.01],[PT,0,.6,-.11,.3,.05,.01]],
  // a picnic table, its benches either side (long along x)
  picnic:[[P_WOOD,0,.74,0,1.9,.06,.78],[P_WOOD,0,.43,.62,1.9,.05,.3],[P_WOOD,0,.43,-.62,1.9,.05,.3],[0x7a5432,-.72,.36,0,.08,.7,.12],[0x7a5432,.72,.36,0,.08,.7,.12],[0x7a5432,-.72,.4,0,.08,.05,1.5],[0x7a5432,.72,.4,0,.08,.05,1.5],
    [0x7a5432,-.72,.2,.62,.08,.4,.08],[0x7a5432,.72,.2,.62,.08,.4,.08],[0x7a5432,-.72,.2,-.62,.08,.4,.08],[0x7a5432,.72,.2,-.62,.08,.4,.08]],
  // a folding camp chair, a cup holder in its arm
  campchair:[[P_DARK,-.24,.2,-.2,.04,.4,.04],[P_DARK,.24,.2,-.2,.04,.4,.04],[P_DARK,-.24,.2,.2,.04,.4,.04],[P_DARK,.24,.2,.2,.04,.4,.04],[PT,0,.4,0,.5,.05,.44],[PT,0,.68,-.22,.5,.52,.04],[P_DARK,-.26,.56,0,.04,.04,.46],[P_DARK,.26,.56,0,.04,.04,.46],[P_DARK,.3,.56,.16,.08,.06,.08]],
  // a cool box
  cooler:[[PT,0,.21,0,.62,.4,.38],[P_WHITE,0,.44,0,.64,.07,.4],[P_WHITE,0,.24,.195,.4,.06,.01],[P_DARK,-.3,.36,0,.03,.14,.06],[P_DARK,.3,.36,0,.03,.14,.06]],
  // a sleeping bag laid out, its pillow
  bedroll:[[PT,0,.07,0,.72,.14,1.7],[0xd8d0b8,0,.15,-.4,.7,.04,.3],[0xe8e4d8,0,.16,-.68,.5,.1,.28]],
  // a kettle barbecue on its three legs
  grill:[[P_STEEL,-.2,.3,-.2,.04,.6,.04],[P_STEEL,.2,.3,-.2,.04,.6,.04],[P_STEEL,0,.3,.24,.04,.6,.04],[P_DARK,0,.78,0,.56,.36,.56],[P_DARK,0,1.0,0,.44,.1,.44],[P_STEEL,0,1.08,0,.06,.06,.2],[P_STEEL,.3,.82,0,.06,.06,.14]],
  // a traffic cone
  cone:[[0xe8742a,0,.03,0,.42,.06,.42],[0xe8742a,0,.22,0,.26,.3,.26],[P_WHITE,0,.3,0,.2,.08,.2],[0xe8742a,0,.44,0,.13,.16,.13]],
  // a wheelbarrow, its handles toward -z, half full
  barrow:[[PT,0,.52,.1,.6,.26,.8],[0x8a7a64,0,.66,.1,.5,.06,.68],[P_DARK,0,.2,.56,.08,.4,.4],[P_DARK,-.22,.2,-.2,.04,.4,.04],[P_DARK,.22,.2,-.2,.04,.4,.04],[P_DARK,-.24,.52,-.55,.04,.04,.7],[P_DARK,.24,.52,-.55,.04,.04,.7]],
  // a pallet of bricks, strapped
  bricks:[[P_WOOD,0,.07,0,1,.14,.9],[0xa8442e,0,.45,0,.94,.62,.84],[0x8a3a26,0,.77,0,.94,.02,.84],[P_WHITE,0,.45,0,.95,.63,.04],[P_WHITE,0,.45,0,.04,.63,.85]],
  // a cement mixer: the drum up on its stand, the motor, two wheels
  cmixer:[[P_DARK,0,.08,0,.9,.06,.5],[P_DARK,0,.4,0,.2,.8,.2],[P_DARK,-.45,.2,0,.08,.4,.4],[P_DARK,.45,.2,0,.08,.4,.4],[0x4a6a3a,0,.5,-.4,.4,.3,.3],[0xe8742a,0,.95,0,.7,.7,.7],[0xe8742a,0,1.38,.1,.44,.2,.44],[P_DARK,0,1.5,.12,.3,.04,.3]],
  // a portable toilet
  portaloo:[[0x2f7ad8,0,1.1,0,1,2.2,1],[0x1f5aa8,0,2.25,0,1.04,.1,1.04],[0xd8dce0,0,1.25,.505,.66,1.6,.01],[0x2ab84a,.2,1.55,.51,.14,.06,.01],[P_DARK,-.22,1.2,.51,.06,.2,.02]],
  // a shrub in a pot, for sale
  sapling:[[0xb86a3c,0,.18,0,.44,.36,.44],[0x5a3d22,0,.37,0,.38,.03,.38],[PT,0,.62,0,.5,.44,.5],[PT,0,.92,0,.32,.22,.32]],
  // a vase of flowers left on a grave
  flowers:[[0x7a7a72,0,.12,0,.18,.24,.18],[0x3f8f3f,0,.3,0,.1,.14,.1],[PT,-.06,.4,0,.1,.08,.1],[PT,.06,.42,.04,.1,.08,.1],[PT,0,.44,-.05,.1,.08,.1]],
  // the cult's things: a skull, bones, a cluster of guttering candles, the book of the rite on its stand
  skull:[[0xe8e4d8,0,.12,0,.22,.22,.26],[0xe8e4d8,0,.05,.08,.16,.1,.12],[P_DARK,-.05,.14,.13,.06,.05,.01],[P_DARK,.05,.14,.13,.06,.05,.01]],
  bones:[[0xe8e4d8,0,.03,0,.7,.06,.06],[0xe8e4d8,-.35,.03,0,.08,.08,.12],[0xe8e4d8,.35,.03,0,.08,.08,.12],[0xe8e4d8,.1,.03,.2,.06,.06,.5],[0xe8e4d8,-.15,.08,-.15,.16,.16,.18]],
  candles:[[0x8a1a1a,0,.01,0,.36,.02,.32],[0xd8d0b8,-.1,.12,0,.08,.24,.08],[0xd8d0b8,.08,.08,.06,.08,.16,.08],[0xd8d0b8,.02,.16,-.1,.08,.32,.08],[PG+0xffb43a,-.1,.27,0,.04,.06,.04],[PG+0xffb43a,.08,.19,.06,.04,.06,.04],[PG+0xffb43a,.02,.35,-.1,.04,.06,.04]],
  bookstand:[[0x3a2418,0,.02,0,.4,.04,.4],[0x3a2418,0,.5,0,.1,1,.1],[0x3a2418,0,1.02,0,.5,.04,.36],[0x5a1a1a,0,1.06,0,.46,.04,.32],[0xe8dcc0,0,1.09,0,.42,.02,.28],[0x8a1a1a,.1,1.1,0,.12,.01,.2]],
  // ---- out in the country and round the town's open spaces ----
  // a mine cart: a rusty steel tub on four small wheels, heaped with ore (the tint)
  minecart:[[0x6a3a22,0,.5,0,.9,.5,1.2],[0x4a2a18,0,.76,0,.94,.04,1.24],[PT,0,.8,0,.74,.12,1.04],[PT,0,.9,.1,.44,.1,.5],[P_DARK,-.4,.14,-.36,.08,.28,.28],[P_DARK,.4,.14,-.36,.08,.28,.28],[P_DARK,-.4,.14,.36,.08,.28,.28],[P_DARK,.4,.14,.36,.08,.28,.28]],
  // a rack of picks and shovels against a post
  toolrack:[[P_WOOD,0,.6,-.1,1.2,.08,.06],[P_WOOD,-.56,.5,-.1,.08,1,.08],[P_WOOD,.56,.5,-.1,.08,1,.08],[0x7a5432,-.3,.6,0,.05,1.1,.05],[P_STEEL,-.3,1.12,0,.4,.06,.06],[0x7a5432,0,.6,0,.05,1.1,.05],[P_STEEL,0,.1,0,.2,.2,.04],[0x7a5432,.3,.6,0,.05,1.1,.05],[P_STEEL,.3,1.12,0,.4,.06,.06]],
  // a saw horse with a log across it, and a chopping block with the axe in it
  sawhorse:[[P_WOOD,0,.62,0,1.3,.1,.12],[P_WOOD,-.5,.3,-.14,.08,.6,.08],[P_WOOD,-.5,.3,.14,.08,.6,.08],[P_WOOD,.5,.3,-.14,.08,.6,.08],[P_WOOD,.5,.3,.14,.08,.6,.08],[0x6a4a2a,0,.84,0,1.5,.32,.32],[0xc9a26a,.76,.84,0,.02,.3,.3]],
  chopblock:[[0x6a4a2a,0,.25,0,.6,.5,.6],[0xc9a26a,0,.51,0,.56,.02,.56],[0x7a5432,.08,.75,0,.05,.5,.05],[P_STEEL,.08,.54,0,.04,.14,.24],[0xc9a26a,-.5,.12,.2,.24,.24,.3],[0xc9a26a,-.4,.1,-.25,.2,.2,.28]],
  // a jerrycan or three, and a blue water barrel
  jerrycans:[[PT,-.22,.25,0,.18,.5,.36],[PT,.02,.25,0,.18,.5,.36],[PT,.26,.25,.05,.18,.5,.36],[P_DARK,-.22,.53,-.1,.06,.06,.12],[P_DARK,.02,.53,-.1,.06,.06,.12],[P_DARK,.26,.53,-.05,.06,.06,.12]],
  // ammunition boxes, olive drab, stacked
  ammobox:[[0x4f5a32,0,.15,0,.7,.3,.34],[0x4f5a32,.05,.45,0,.6,.3,.32],[0x3a4226,0,.31,0,.72,.02,.36],[P_DARK,.05,.62,0,.2,.04,.06],[0xd8b13a,-.2,.15,.18,.14,.08,.01]],
  // a stack of gold bars
  goldbars:[[0xe0b33a,-.15,.06,0,.24,.12,.5],[0xe0b33a,.15,.06,0,.24,.12,.5],[0xf0c84a,0,.18,0,.24,.12,.5]],
  // stones fallen off a wall, a rusty bucket
  rubble:[[0x8a8d90,0,.12,0,.44,.24,.38],[0x6f7a62,.32,.08,.2,.3,.16,.26],[0x9a9a98,-.3,.07,-.18,.28,.14,.3],[0x7a7d80,.1,.05,-.36,.2,.1,.18]],
  bucket:[[0x7a6a5a,0,.18,0,.32,.36,.32],[0x5a4a3a,0,.37,0,.34,.02,.34],[P_DARK,0,.5,0,.36,.02,.02]],
  // an old tyre lying flat, and a heap of them
  tyre:[[0x1d1f22,0,.12,0,.66,.22,.66],[0x2e3135,0,.24,0,.3,.01,.3]],
  tyres:[[0x1d1f22,0,.12,0,.66,.22,.66],[0x1d1f22,.05,.35,.04,.66,.22,.66],[0x1d1f22,.02,.58,-.02,.66,.22,.66],[0x1d1f22,.6,.12,.3,.66,.22,.66],[0x2e3135,.02,.7,-.02,.3,.01,.3]],
  // an old mattress, and a dumped fridge-freezer lying on its back
  mattress:[[PT,0,.1,0,1,.2,1.9],[0xd8d0c0,0,.21,0,.9,.02,1.8],[0x8a7a5a,.2,.22,.3,.3,.01,.4]],
  oldfridge:[[0xe0ddd0,0,.33,0,.66,.66,1.6],[0xb0ad9f,0,.67,.2,.6,.02,.02],[0x9a978a,.28,.67,-.3,.04,.04,.4]],
  // a cable drum on its side
  reel:[[0x9c6c3e,0,.55,-.32,1.1,1.1,.08],[0x9c6c3e,0,.55,.32,1.1,1.1,.08],[0x2a2e33,0,.55,0,.7,.7,.56],[0x9c6c3e,0,.55,0,.2,.2,.7]],
  // the car park's ticket machine
  paymachine:[[0x3a6a9a,0,.75,0,.6,1.5,.4],[P_DARK,0,1.2,.21,.4,.3,.01],[0xd8b13a,0,.85,.21,.3,.1,.01],[P_STEEL,0,1.52,0,.66,.04,.46]],
  // a corner flag on its pole
  cflag:[[P_WHITE,0,.75,0,.05,1.5,.05],[PT,.18,1.36,0,.34,.26,.02]],
  // a coin telescope on a post, looking out to sea
  telescope:[[P_DARK,0,.55,0,.1,1.1,.1],[P_DARK,0,.03,0,.4,.06,.4],[0x3f6b8c,0,1.18,.05,.24,.24,.5],[0x3f6b8c,0,1.22,.36,.16,.16,.22],[P_DARK,0,1.1,-.24,.16,.16,.08]],
  // a feeding trough, and a bale of straw is the hay
  trough:[[P_WOOD,0,.32,0,1.6,.44,.6],[0x5a8a2a,0,.52,0,1.44,.06,.44],[P_DARK,-.7,.1,0,.08,.2,.5],[P_DARK,.7,.1,0,.08,.2,.5]],
  // a little sign by an enclosure, about the animals in it
  infosign:[[P_WOOD,-.4,.5,0,.08,1,.08],[P_WOOD,.4,.5,0,.08,1,.08],[PT,0,.95,0,1,.6,.05],[P_WHITE,0,.95,.03,.8,.4,.01]],
  // a basketball, a ball rack
  ballrack:[[P_STEEL,0,.4,0,1,.04,.4],[P_STEEL,-.48,.25,0,.04,.5,.4],[P_STEEL,.48,.25,0,.04,.5,.4],[0xe0702a,-.3,.55,0,.24,.24,.24],[0xe0702a,0,.55,0,.24,.24,.24],[0xe0702a,.3,.55,0,.24,.24,.24]],
  // a wheelie bin
  wheelie:[[PT,0,.5,0,.56,.96,.66],[PT,0,1,-.02,.6,.06,.72],[P_DARK,0,.08,-.3,.5,.16,.08]],
  // a snack machine: a lit window of rows of snacks
  vending:[[0x7a1f24,0,.8,0,.9,1.6,.6],[PG+0xd8f0ff,-.12,.95,.305,.52,1,.01],[0xe0a030,-.12,1.2,.315,.46,.08,.01],[0x4aa3df,-.12,.95,.315,.46,.08,.01],[0xe05050,-.12,.7,.315,.46,.08,.01],[P_DARK,-.12,.27,.31,.56,.2,.01],[P_DARK,.32,.9,.31,.14,.3,.01]]
};
const _PC=new THREE.Color();
function drawProp(f){
  const dn=downFix.get(f.key),fl=falling.get(f.key);let theta=0,ang=0;
  if(dn!==undefined){theta=Math.PI/2*0.97;ang=dn;}else if(fl){const k=Math.min(1,fl.t/0.7);theta=Math.PI/2*0.97*k*k;ang=fl.ang;}
  fallMatrix(f.x,f.z,theta,ang,f.y0);
  _C.makeRotationY(f.yaw);_B.makeTranslation(f.x,f.y0,f.z);_C.premultiply(_B);_C.premultiply(_F);
  for(const q of PROPS[f.type]){
    let c=q[0];if(c===PT)c=f.tint;
    const glow=c>=PG;if(glow&&(nPropG>=PROP_GLOW_MAX))continue;if(!glow&&nPropL>=PROP_MAX)continue;
    _A.makeTranslation(q[1],q[2],q[3]);_B.makeScale(q[4],q[5],q[6]);_A.multiply(_B);_A.premultiply(_C);
    // (a knocked-over machine's screen goes dark)
    if(glow&&(dn!==undefined||fl)){if(nPropL<PROP_MAX){PROP_L.setMatrixAt(nPropL,_A);PROP_L.setColorAt(nPropL++,_PC.setHex(0x20262b));}continue;}
    if(glow){PROP_G.setMatrixAt(nPropG,_A);PROP_G.setColorAt(nPropG++,_PC.setHex(c-PG));}else{PROP_L.setMatrixAt(nPropL,_A);PROP_L.setColorAt(nPropL++,_PC.setHex(c));}
  }
}
let nPropL=0,nPropG=0;const activeProps=[];
// the props on one floor of a hospital, laid out in the same frame as its blocks (iu, iv from just inside its walls)
const P_BLANKET=[0x5b8fd0,0x4aa89a,0x8f7fc9,0xd98aa0],P_SEAT=[0x2f6f7a,0x3a7fa0];
function hospProps(b,px,pz,floorNo){
  const c=b._props||(b._props=new Map());let L=c.get(floorNo);if(L)return L;L=[];c.set(floorNo,L);
  const U0=px*CELL+b.x0+1,V0=pz*CELL+b.z0+1,I=b.x1-b.x0-2,J=b.z1-b.z0-2,y0=floorNo===0?G+1:G+b.gf+1+FH*(floorNo-1);
  const r=(u,v,n)=>hash2(Math.floor(u*4)+px*977+n*131+floorNo*7,Math.floor(v*4)+pz*613+n*53);
  const add=(type,u,v,yaw,tint)=>{if(u<.2||v<.2||u>I-.2||v>J-.2)return;if(b.stair){const a=b.stair.ax==='x'?U0+u-px*CELL:V0+v-pz*CELL,c=b.stair.ax==='x'?V0+v-pz*CELL:U0+u-px*CELL;if(a>=b.stair.r0-2.5&&a<b.stair.r0+b.stair.L+2&&c>=b.stair.c0-1.5&&c<b.stair.c1+1.5)return;}L.push({prop:true,type,x:U0+u,z:V0+v,y0,yaw,tint,rad:.5,key:'p'+Math.round((U0+u)*4)+','+Math.round((V0+v)*4)+','+y0+type});};
  const blanket=(u,v)=>P_BLANKET[Math.floor(r(u,v,3)*P_BLANKET.length)];
  const ft=hospFloor(b,floorNo);
  if(ft){
    // rooms either side of a corridor, eight wide: private rooms (a bed, a monitor, a visitor's chair, its own washbasin) or
    // operating theatres (the table under its lamp, the crash cart, the monitor, scrub sinks); trolleys left along the corridor
    const cv=J>>1;
    for(let k=0;8*k+8<=I+1;k++){const x=8*k+4;
      for(const [v,yaw,sx] of [[1.6,0,1],[J-1.6,Math.PI,-1]]){
        if(ft===1){add('bed',x,v-sx*.1,yaw,blanket(x,v));add('vitals',x-1.1,v-sx*.3,yaw);add('drip',x+1,v-sx*.2,yaw);add('chair',x+2.4,v+sx*.6,yaw+Math.PI/2,P_SEAT[0]);add('basin',x-2.8,v-sx*1.2,yaw);add('cabinet',x+2.8,v-sx*1.1,yaw);}
        else{add('optable',x,v+sx*.6,yaw);add('oplamp',x-1.5,v+sx*.6,yaw);add('vitals',x+1.4,v+sx*.2,yaw);add('cart',x+1.5,v+sx*1.4,yaw);add('cabinet',x-2.8,v-sx*1.1,yaw);add('basin',x+2.8,v-sx*1.2,yaw);add('swivel',x-.9,v+sx*1.3,yaw);}
      }
      if(k%2===0)add(ft===1?'wheelchair':'gurney',x+3,cv-.1,Math.PI/2);else if(k%4===1){add('counter',x,cv+.9,Math.PI);add('plant',x+3,cv+1.1,0);}
    }
    return L;
  }
  if(floorNo>0||b.ground==='ward'){
    // the wards: every 8 rows, two facing rows of beds with an aisle between; a nurses' station here and there down the aisle
    for(let k=0;8*k+1<J;k++){const v0=8*k;
      for(let j=0;3*j+2<I;j++){const u=3*j+1.5;
        for(const [v,yaw,sx] of [[v0+1.02,0,1],[v0+6.98,Math.PI,-1]]){
          if(v>J-1)continue;
          if(r(u,v,1)<0.08){if(r(u,v,6)<0.5)add('wheelchair',u,v+sx*.2,yaw+.5);continue;}   // (an empty bay now and then)
          add('bed',u,v,yaw,blanket(u,v));
          if(r(u,v,4)<0.7)add('vitals',u-.82,v-sx*.55,yaw);
          if(r(u,v,5)<0.45)add('drip',u+.82,v-sx*.5,yaw);
          if(r(u,v,7)<0.2)add('chair',u+.95,v+sx*.35,yaw+Math.PI/2*sx,P_SEAT[0]);
          if(j%2===1)add('curtain',u+1.5,v,0);
        }
      }
      for(let n=0;16*n+11<I;n++){const u=16*n+10.5,v=v0+3.6;if(v>J-1)continue;
        add('desk',u-.8,v,0);add('desk',u+.8,v,0);add('swivel',u-.9,v-.75,0);if(r(u,v,8)<0.5)add('swivel',u+.9,v-.75,.6);
        add('counter',u,v+.65,0);}
      for(let n=0;16*n+3<I;n++){const u=16*n+2.5,v=v0+3.5;if(v>J-1)continue;const q=r(u,v,9);
        if(q<0.34)add('cart',u,v,1.2);else if(q<0.67)add('cabinet',u,v,0);else add('gurney',u,v,Math.PI/2);}
    }
    return L;
  }
  // the rooms behind the lobby and the ER
  for(const R of hospRooms(b,I,J)){const x0=R.u0+1,x1=R.u1-1,y0=R.v0+1,y1=R.v1-1,mx=(x0+x1)/2,my=(y0+y1)/2;
    if(R.k==='pharmacy'){for(let u=x0+.5;u<x1;u++){add('shelf3',u,y1-.5,Math.PI,0xd8dce0);add('bar',u,y0+1,0,0x2f8a8a);}add('monitor',mx,y0+1,Math.PI);add('swivel',mx,y0+1.8,Math.PI);}
    else if(R.k==='xray'){add('optable',mx,my,0);add('oplamp',mx-1.4,my,0);add('xray',mx,y1-.1,Math.PI);add('desk',x1-.9,y0+.8,-Math.PI/2);add('swivel',x1-1.7,y0+.8,-Math.PI/2);}
    else if(R.k==='exam'){add('gurney',mx,y1-1.2,0);add('vitals',mx-1,y1-.6,Math.PI);add('cabinet',x1-.5,y1-.6,-Math.PI/2);add('basin',x0+.3,y0+.8,Math.PI/2);add('chair',x1-.6,y0+.7,-Math.PI/2,P_SEAT[0]);add('swivel',mx+.8,y0+1,0);}
    else if(R.k==='lab'){for(let u=x0+.5;u<x1;u++)add('prep',u,y1-.5,Math.PI);add('fridge2',x0+.5,y0+.5,Math.PI/2);add('fridge2',x0+.5,y0+1.5,Math.PI/2);add('desk',mx,my,Math.PI);add('swivel',mx,my+.8,Math.PI);}
    else if(R.k==='gift'){for(let u=x0+.5;u<x1;u++)add('shelf2',u,y1-.5,Math.PI,P_GOODS[Math.floor(u)%P_GOODS.length]);add('bar',x0+1.5,y0+.8,0,0xd96a8a);add('monitor',x0+1.5,y0+.8,Math.PI);add('plant',x1-.5,y0+.5,0);add('plant',x1-.5,my,1);add('toys',mx,my,0,0xd96a8a);}
    else if(R.k==='admissions'){for(let u=x0+1;u<x1-.5;u+=2.4){add('desk',u,y0+1.3,0);add('swivel',u,y0+.5,0);add('chair',u,y0+2.2,Math.PI,P_SEAT[0]);}add('cabinet',x1-.5,y1-.5,-Math.PI/2);}
    else if(R.k==='chapel'){for(let v=y0+.6;v<y1-1;v+=1.4)for(const u of [x0+1.4,x1-1.4])add('bench',u,v,0);add('rtable',mx,y1-.6,0,0x7a2a2a);add('flamp',x0+.5,y1-.5,0);add('flamp',x1-.5,y1-.5,0);}
    else if(R.k==='ct'){add('scanner',mx,my,0);add('desk',x0+1,y0+.7,Math.PI/2);add('swivel',x0+.4,y0+.7,Math.PI/2);add('gurney',x1-.8,y1-1.2,0);add('cabinet',x1-.5,y0+.6,-Math.PI/2);}
    else if(R.k==='supply'){for(let u=x0+.5;u<x1;u++)add('shelf3',u,y1-.5,Math.PI,0xd8dce0);for(let u=x0+.8;u<x1;u+=2)add('cabinet',u,my,0);add('gurney',x1-.8,y0+.8,Math.PI/2);}
    else{add('rtable',mx-1,my,0,P_WHITE);add('chair',mx-1.7,my,Math.PI/2,P_SEAT[0]);add('chair',mx-.3,my,-Math.PI/2,P_SEAT[0]);add('fridge2',x1-.5,y1-.6,-Math.PI/2);add('vending',x1-.5,y0+.7,-Math.PI/2);add('locker',x0+.5,y1-.4,Math.PI);}
  }
  // the ground floor: main reception, the waiting area, and the emergency department if it has one
  const cu=I>>1,E=b.er,front=E&&E.mode==='front';
  const desks=(a0,a1)=>{for(let u=a0;u+2<=a1+1;u+=2)add('counter',u+1,5.5,0);for(let u=a0+1;u+1.5<=a1;u+=3){add('desk',u+.7,6.6,Math.PI);add('swivel',u+.7,7.4,Math.PI);}};
  const d0=Math.max(2,cu-11),d1=cu-2;desks(d0,d1);
  if(!front)desks(cu+2,Math.min(I-3,cu+11));
  add('counter',d0,3.5,Math.PI/2);
  // rows of waiting seats, facing the doors
  const lobR=hospRooms(b,I,J).length>0;
  for(let v=9;v<=(E&&!front?E.v0-3:lobR?14:18);v+=lobR?1.7:3)for(let u=lobR?10:3;u+2<=(front?cu-3:I-3);u+=2.2){if(Math.abs(u-cu)<3)continue;if(r(u,v,10)<.12)continue;add('seats',u,v,Math.PI,P_SEAT[Math.floor(u/8)%2]);}
  add('plant',.8,.8,0);add('plant',I-.8,.8,0);add('vending',1,(E&&!front?E.v0-2:J-2),Math.PI/2);
  // a little cafe and a gift shop down the far side of the lobby, if there's room
  if(J>=24&&!(E&&!front)){for(let u=10.5;u+2<=cu-3;u+=3.2){add('rtable',u,16.2,0,P_WHITE);add('chair',u-.68,16.2,Math.PI/2,0x3f6b8c);add('chair',u+.68,16.2,-Math.PI/2,0x3f6b8c);}
    for(let u=9.5;u<Math.min(cu-3,17);u++)add('bar',u,18.4,Math.PI,0x2f8a8a);add('espresso',12.5,18.4,Math.PI,0,.9);add('monitor',10.5,18.4,Math.PI,0,.9);
    for(let v=9.5;v<19&&front;v+=1.2)add('vending',E.u0-.5,v,-Math.PI/2);add('wheelchair',cu-2.6,3,0);add('wheelchair',cu+2.6,3,0);add('plant',cu-3.4,4.6,1);
    // more seats along the front wall, a row of plants, an information desk in the middle of it all
    for(let u=10;u<cu-3;u+=2.2)add('seats',u,.6,0,P_SEAT[1]);for(let u=10;u<cu-3;u+=4.4){add('plant',u,3.4,u);add('plant',u+2.2,7.6,u+1);}
    for(const u of [cu-4.6,cu-3.4])add('counter',u,8,Math.PI/2);add('monitor',cu-4,8,0,0,.9);add('board',cu-6,.1,0,0x2f8a8a);}
  const vG=E&&!front?E.v0-2:J-2;for(let u=3;u<(front?E.u0:I)-1;u+=5)if(r(u,vG,11)<.6)add('gurney',u+.5,vG+.3,Math.PI/2);else if(r(u,vG,12)<.5)add('wheelchair',u+.5,vG,Math.PI);
  if(E){
    // resuscitation bays by the ambulance doors, a second row of treatment bays facing the first, gurneys ready, seats for those waiting
    if(front){const aL=E.u0+1,aR=I,ec=E.door-b.x0-1;
      for(const sg of [-1,1])for(let i=0;i<2;i++){const u=ec+sg*(6.5+i*3.4);if(u<aL+1||u>aR-1)continue;add('bed',u,2.6,0,P_WHITE);add('vitals',u-1,1.6,0);add('oplamp',u+1,3.2,0);add('cart',u+1.2,1.2,0);}
      for(let u=aL+1.5;u<aR-1;u+=3.4){if(Math.abs(u-ec)<3)continue;add('curtain',u-1.7,E.v1-7.5,0);add('bed',u,E.v1-8.2,0,blanket(u,5));add('vitals',u-.9,E.v1-9,0);if(r(u,5,15)<.6)add('drip',u+.9,E.v1-9,0);}
      for(const u of [ec-2.8,ec+2.8])add('gurney',u,5.4,0);add('wheelchair',ec-4.5,5,.6);add('wheelchair',ec+4.5,5,-.6);
      for(let v=7;v<E.v1-10;v+=2.2)add('seats',aL+.8,v,Math.PI/2,P_SEAT[1]);add('cabinet',aL+.5,E.v1-1.6,Math.PI/2);add('vending',aL+.5,5,Math.PI/2);
      // a line of bays along the outside wall too, with their curtains; kit parked between them; a desk for the paperwork
      for(let v=6.6;v<E.v1-3;v+=3){add('curtain',aR-1.2,v-1.5,Math.PI/2);add('bed',aR-1.1,v,-Math.PI/2,blanket(aR,v));add('vitals',aR-.4,v-.9,-Math.PI/2);add('cabinet',aR-.4,v+1,-Math.PI/2);}
      for(let u=aL+3.2;u<aR-3;u+=6.8){add('cart',u,E.v1-5,.3);add('drip',u+1.4,E.v1-5.2,0);add('gurney',u+3.2,7.4,Math.PI/2);}
      add('desk',aL+2.2,E.v1-4,Math.PI/2);add('swivel',aL+1.4,E.v1-4,Math.PI/2);add('board',aL+.1,E.v1-6,Math.PI/2,P_WHITE);
    }
    // the ER in its own frame: a runs along the wall with its doors, d goes in from it
    const ex0=b.x0,ez0=b.z0,ea=front?E.door-ex0-1:E.door-ez0-1,aLo=front?E.u0+1:E.v0+1,aHi=front?I:J,depth=front?E.v1:I;
    const W=(a,d)=>front?[a,d]:[I-d,a],Y=front?0:-Math.PI/2;   // (from the ER's frame to the hospital's: d's way is +z, or -x)
    const put=(type,a,d,yaw,tint)=>{const [u,v]=W(a,d);add(type,u,v,Y+yaw,tint);};
    // the triage desks either side of the way in
    for(const sg of [-1,1]){put('counter',ea+.5+sg*4.5,4.5,0);put('desk',ea+.5+sg*4.5,5.6,Math.PI);put('swivel',ea+.5+sg*4.5,6.4,Math.PI);}
    // treatment bays along the far wall: a bed, its monitor and drip, a curtain each side
    for(let a=aLo;a+2<aHi;a+=4){put('curtain',a,depth-2,0);const u=a+2.2,dd=depth-1.05;put('bed',u,dd,Math.PI,blanket(u,dd));put('vitals',u-.9,dd+.55,Math.PI);if(r(u,dd,13)<.6)put('drip',u+.9,dd+.5,Math.PI);if(r(u,dd,14)<.3)put('cart',u+1.2,dd-1.3,.4);}
    // the nurses' station, an island in the middle
    {const ma=Math.floor((aLo+aHi)/2)+.5,md=Math.floor((6+depth-4)/2)+.5;if(depth-10>=5){put('counter',ma-1,md-.9,0);put('counter',ma+1,md-.9,0);put('counter',ma-1,md+.9,Math.PI);put('counter',ma+1,md+.9,Math.PI);put('desk',ma-.8,md,0);put('swivel',ma-.8,md+.5,Math.PI);put('desk',ma+.8,md,Math.PI);put('swivel',ma+.8,md-.5,0);}}
    // supply cabinets at the far end, a couple of trolleys waiting
    for(let d=7;d<depth-5;d+=3)put('cabinet',aHi-.5,d,-Math.PI/2);
    put('wheelchair',ea-2,3,.8);put('gurney',ea+3,2,Math.PI/2);
  }
  return L;
}
// the props of any room set out by hand: u and v from just inside its walls (v back from the door), yaw 0 with its back to
// the front wall, PI to the back wall, PI/2 to the left, -PI/2 to the right
function roomKit(b,px,pz,L,y0=G+1){
  const U0=px*CELL+b.x0+1,V0=pz*CELL+b.z0+1;
  return{I:b.x1-b.x0-2,J:b.z1-b.z0-2,add:(type,u,v,yaw,tint,yo,low)=>{const X=U0+u,Z=V0+v;L.push({prop:true,type,x:X,z:Z,y0:y0+(yo||0),yaw:yaw||0,tint,rad:.5,low,key:'p'+Math.round(X*4)+','+Math.round(Z*4)+','+y0+type});}};
}
const P_FRUIT=[0xc9553f,0x5aa469,0xe08a3c,0xd8b13a,0x9c3f8c],P_JAR=[0x5aa469,0x3f8f4a,0x8fbf5a],P_CLOTH=[0x3f6b8c,0xc83a32,0xd8b13a,0x77608f,0x5d7a45,0xd96a8a];
// a shop or a store: checkouts by the doors, trolleys, aisles, and whatever it's known for
function shopRoom(b,px,pz,L){
  const {I,J,add}=floorKit(b,px,pz,0,L,false),kind=b.ground,cu=I/2,hg=(a,c,n)=>hash2(Math.floor(a)*7+px*31+n,Math.floor(c)*11+pz*17+n),tint=(A,a,c)=>A[Math.floor(hg(a,c,5)*A.length)%A.length];
  const PI=Math.PI,HP=PI/2,till=(u,v,yaw)=>add('monitor',u,v,yaw,0,.9),counter=(u0,u1,v,t)=>{for(let u=u0;u<u1;u++)add('bar',u+.5,v,PI,t);};
  const person=(u,v,yaw,t)=>{add('rtable',u,v,0,t);add('chair',u-.68,v,HP,t,0,true);add('chair',u+.68,v,-HP,t,0,true);};
  if(kind==='books'){
    // bookcases all round the walls and in two runs down the room, a table of new books, a till by the door, a reading corner
    for(let v=2;v<J;v++){add('bookcase',.5,v+.5,HP,tint(P_GOODS,0,v));add('bookcase',I-.5,v+.5,-HP,tint(P_GOODS,1,v));}
    for(let u=1.5;u<I-1;u++)add('bookcase',u,J-.5,PI,tint(P_GOODS,u,J));
    for(const u of [3.5,I-3.5])for(let v=4;v<J-3;v++)add('bookcase',u,v+.5,u<cu?HP:-HP,tint(P_GOODS,u,v));
    counter(1,4,1.3,0x5a3a22);till(2.5,1.3,PI);add('rtable',I-3,1.6,0,0xc9553f);add('sofa',cu-1,J-2.5,0,0x8a4b3a);add('sofa',cu+1,J-2.5,0,0x8a4b3a);add('plant',I-.5,.5,0);
  }else if(kind==='dentist'){
    // reception, the waiting chairs, a fish tank; three surgeries behind the wall, each with its chair, lamp, cabinet and X-ray
    const W=J-5;counter(cu+2,I-1,W-1.5,0xd8dce0);till(I-2.5,W-1.5,PI);add('swivel',I-2.5,W-.6,PI);
    for(let v=1;v<W-2;v+=2){add('seats',.6,v+.5,HP,0x3f9c9c);}add('rtable',2.4,1.5,0,0xd8dce0);add('fishtank',I-.5,1.5,-HP);add('plant',.5,W-.5,0);add('plant',I-.5,.5,0);
    for(const u of [2,7,12]){add('dchair',u,J-2,0);add('dlamp',u-1.2,J-2.1,0);add('cabinet',u+1.1,J-.5,PI);add('xray',u-1,J-.1,PI);add('swivel',u+1.2,J-2.8,.5);}
  }else if(kind==='dispo'){
    // glass counters across the room with the jars behind, plants everywhere, a bench to wait on
    const v=J-4;for(let u=1;u<I-1;u++){if(Math.abs(u+.5-cu)<1)continue;add('gcase',u+.5,v,PI,P_JAR[u%3]);add('jars',u+.5,J-.3,PI,P_JAR[(u+1)%3]);}
    till(2.5,v,PI);till(I-2.5,v,PI);
    for(let v2=1;v2<v-1;v2+=2){add('plant',.5,v2+.5,v2);add('plant',I-.5,v2+.5,v2+1);}
    add('seats',3,.6,0,0x5d7a45);add('seats',I-3,.6,0,0x5d7a45);add('rtable',3,3,0,0x5a3a22);add('rtable',I-3,3,0,0x5a3a22);
  }else if(kind==='guns'){
    // rifles round the walls, a long glass counter of pistols, ammunition in crates; the range through the back
    const W=J-5;for(let v=1;v<W;v++){add('gunrack',.3,v+.5,HP);add('gunrack',I-.3,v+.5,-HP);}
    for(let u=1;u<I-5;u++){add('gcase',u+.5,W-1.6,PI,0x2a2e33);}till(3.5,W-1.6,PI);
    for(const [u,v] of [[3,1.6],[4.2,1.6],[I-3,1.6],[I-4.2,1.6],[I-1.8,2.8]])add('pcrate',u,v,0);
    for(const u of [2,7,12]){add('target',u,J-.2,PI);counter(u-.5,u+.5,W+.8,0x46505a);}
  }else if(kind==='dealer'){
    // the sales desks along the back (the cars on show stand on the open floor), a plant at each corner
    for(let u=1.5;u<I-1;u+=4){add('desk',u,J-1.4,0);add('swivel',u,J-.6,PI);add('chair',u-.4,J-2.4,PI,0x35506b,0,true);add('chair',u+.4,J-2.4,PI,0x35506b,0,true);}
    add('plant',.5,.5,0);add('plant',I-.5,.5,0);add('vending',.5,J-.5,HP);add('showcar',cu-2.7,J/2-.8,.5,tint(P_CLOTH,1,1));add('showcar',cu+2.7,J/2-.8,-.5,tint(P_CLOTH,2,2));
  }else if(kind==='armory'){
    // the drill hall: rifle racks and lockers down the sides, crates, the duty desk, the flags at the far end
    for(let v=1;v<J-1;v++){if(v%3===1){add('locker',.4,v+.5,HP);add('locker',I-.4,v+.5,-HP);}else{add('gunrack',.3,v+.5,HP);add('gunrack',I-.3,v+.5,-HP);}}
    for(let u=1.5;u<I-1;u+=2.4)if(Math.abs(u-cu)>1.4)add('pcrate',u,J-.6,PI);
    add('flag',cu-2,J-1.4,PI);add('flag',cu+2,J-1.4,PI);add('desk',2.5,1.6,PI);add('swivel',2.5,2.4,PI);
  }else if(kind==='shop'&&b.station){
    // a station's hall: ticket windows along one wall at the near end, benches to wait on down the rest, a departures board
    const lg=J>=I,La=lg?J:I,Wc=lg?I:J,P2=(a,c)=>lg?[c,a]:[a,c],put=(t,a,c,y,tn,yo,low)=>{const [u,v]=P2(a,c);add(t,u,v,y,tn,yo,low);},yw=lg?-HP:PI,yb=lg?HP:0;
    const mid=La/2;
    for(let a=1;a<4;a++){put('teller',a+.5,Wc-.6,yw,0x5a3a22);if(a===2)put('monitor',a+.5,Wc-.5,yw,0,.95);}put('swivel',2.5,Wc-.2,yw,0,0,true);
    for(let a=5.5;a<La-6;a+=2.6)if(Math.abs(a-mid)>2.2){put('bench',a,.6,yb,0,0,true);put('bench',a,Wc-.6,yw,0,0,true);}
    put('bar',.6,.6,yb,0xc83a32);put('bar',1.6,.6,yb,0xc83a32);put('espresso',.6,.6,yb,0,.9);put('tv',mid-3,Wc-.1,yw,0,2.4);put('tv',mid+3,Wc-.1,yw,0,2.4);put('plant',mid-2.4,.5,0);put('plant',mid+2.4,.5,1);put('vending',La-6.5,.5,yb);
  }else if(kind==='shop'&&b.signCat!=='kiosk'&&!b.brand&&b.kind==='shop'){
    // a working building with nothing to sell: crates, a bench, some shelves
    for(let u=1;u<I-.5;u+=2.2)add('pcrate',u,J-.7,PI);add('shelf2',.6,J/2,HP,0xbf9a6a);add('rtable',I-1.2,1.4,0,P_WOOD);add('chair',I-1.9,1.4,HP,0x46505a,0,true);
  }else if(kind==='shop'&&b.signCat!=='kiosk'){
    // a shop under the flats: its till by the door, shelves in rows, a cold cabinet along the back
    for(let u=1;u<4&&u<I-2;u++)add('bar',u+.5,1.3,PI,0x46505a);add('monitor',2.5,1.3,PI,0,.9);add('swivel',2.5,2.1,PI,0,0,true);
    for(let v=3.2;v<J-1.6;v+=2.4)for(let u=1.5;u<I-1;u++){if(Math.abs(u-cu)<1.6)continue;add('shelf2',u,v,0,tint(P_GOODS,u,v));}
    for(let u=.5;u<I;u++)add('fridge2',u,J-.5,PI);add('plant',I-.5,.5,0);
  }else if(kind==='shop'){
    // a gas station's: cold drinks along the back, snacks in low rows, the till and the hot food by the door
    for(let u=.5;u<I;u++)add('fridge2',u,J-.5,PI);
    for(let v=1.8;v<J-1.4;v+=2.2)for(let u=1.5;u<I-7;u++)add('shelf2',u,v,0,tint(P_GOODS,u,v));
    counter(I-5,I,1.3,0xc83a32);till(I-2.5,1.3,PI);add('espresso',I-4.5,1.3,PI,0,.9);add('pot',I-1.5,1.3,PI,0,.9);
  }else if(kind==='ikea'){
    // room after furnished room; the cafeteria by the windows; the warehouse at the back, racks up to the roof
    const wv=Math.floor(J*.6),ve=wv-2;
    for(let u=4;u<I-1;u+=4)for(let v=wv+1;v<J-1;v+=4){if(u%12<4)continue;for(let d=0;d<3;d++)add('pallet',u+.5,v+d,HP,tint(P_GOODS,u,v));}
    for(let c=0;8*c+8<I*.72;c++)for(let r=0;2+9*r+9<wv;r++){const k=(c+r)%4,x=8*c,vb=3+9*r,yb=vb+1.5;
      if(k===0){add('homebed',x+2.5,yb+.3,0,tint(P_BLANKET,c,r));add('homebed',x+5.5,yb+.3,0,tint(P_BLANKET,r,c));add('flamp',x+4,yb-.6,0);add('shelf2',x+1.5,yb+5,PI,tint(P_GOODS,c,r));}
      else if(k===1){for(let i=0;i<4;i++)add('sofa',x+2.5+i,yb-.4,0,tint(P_SOFA,c,r));add('table',x+4,yb+1.6,0);add('table',x+4,yb+5,PI);add('tv',x+4,yb+5,PI,0,.62);add('flamp',x+1.4,yb-.4,0);add('plant',x+6.6,yb-.4,0);}
      else if(k===2){for(const a of [3,4,5]){add('rtable',x+a,yb+1.8,0,P_WHITE);add('chair',x+a,yb+1.12,0,0x9c6c3e,0,true);add('chair',x+a,yb+2.48,PI,0x9c6c3e,0,true);}add('shelf2',x+1.5,yb-.4,0,0xd8dce0);add('flamp',x+6.6,yb-.4,0);}
      else{for(const [i,t] of ['range','sink','prep','prep','fridge2'].entries())add(t,x+1.8+i,yb-.4,0,0xc9a24a);for(const a of [3,4,5])add('prep',x+a,yb+3,0);}}
    const uc=Math.ceil(I*.72);for(let u=uc+1;u<I-1;u+=3)for(let v=2.5;v<J*.33;v+=3)person(u,v,0,0x9c6c3e);
    counter(uc,I-1,.8,0x2b5fb8);
  }else{
    // the aisles: a supermarket, a drug store, a superstore or an electronics store
    const doors=b.bigbox?b.bigbox.map(e=>e-(b.x0+1)):[cu],near=u=>doors.some(d=>Math.abs(u-d)<3.5),big=J>=14,vC=big?2.6:1.5,v0=big?6:3.4,v1=J-(big?3:2.2),tech=b.brand&&b.brand.tech,wh=b.brand&&b.brand.wh,nofood=b.brand&&b.brand.nofood;
    for(let u=kind==='drug'?1.5:2.5;u<(kind==='drug'?I-6:I-2);u+=kind==='bigbox'?4:3.2)if(!near(u)){add('checkout',u,vC,0);add('swivel',u+.7,vC-.1,HP,0,0,true);}
    if(kind==='drug')counter(I-6,I-1,1.5,0xc83a32),till(I-3.5,1.5,PI);
    for(const d of doors)for(const sg of [-1,1])for(let i=0;i<3;i++)add('trolley',Math.max(.6,Math.min(I-.6,d+sg*(3+i*.7))),.6,0);
    const col=u=>kind==='bigbox'?(u<I*.38?0:u<I*.6?1:2):0,produce=u=>!tech&&(kind==='market'||kind==='grocery'||kind==='bigbox'&&!nofood&&u>I*.82)&&(kind==='bigbox'?true:u<I*.24);
    const signs=new Set();
    for(let u=kind==='drug'?1:2;u<(kind==='drug'?I-3:I-1);u+=3){
      const prod=produce(u),z=col(u);
      for(let v=v0;v<v1;v+=1){const vc=Math.floor(v)+.5;
        if(big&&Math.abs(vc-J/2)<2||near(u)&&vc<v0+2)continue;
        if(prod){if(Math.floor(v)%2===0)add('bin',u+.5,vc,0,tint(P_FRUIT,u,v));continue;}
        const t=tint(P_GOODS,u,Math.floor(v/5));
        if(wh)add('pallet',u+.5,vc,HP,t);
        else if(tech||kind==='bigbox'&&z===1){add('shelf2',u+.5,vc,HP,t);if(Math.floor(v)%2===0)add('tv',u+.5,vc,HP,0,1.95);}
        else if(kind==='bigbox'&&z===0&&Math.floor(u)%2===0)add('clothes',u+.5,vc,HP,tint(P_CLOTH,u,v));
        else if(kind==='bigbox'&&z===2&&!nofood&&Math.floor(u/3)%2)add('fridge3',u+.5,vc,HP);
        else add(kind==='drug'?'shelf2':kind==='bigbox'?'shelf4':'shelf3',u+.5,vc,HP,t);}
      if(!prod&&big&&!signs.has(u)){signs.add(u);add('aislesign',u+2,(v0+v1)/2,0,0x2b5fb8,(b.gf||7)-2.4,true);}
    }
    // along the back: fridges, or the wall of TVs, or the pharmacy
    if(kind==='drug'){for(let u=1.5;u<I-1;u++){add('shelf3',u,J-.5,PI,0xd8dce0);if(u<I-3)add('bar',u,J-2.2,PI,P_WHITE);}till(cu,J-2.2,PI);till(cu-3,J-2.2,PI);for(let v=4;v<J-3;v++)add('fridge3',I-.5,v+.5,-HP);}
    else for(let u=.5;u<I;u++){
      if(tech||kind==='bigbox'&&col(u)===1){add('shelf2',u,J-.5,PI,0x46505a);add('tv',u,J-.5,PI,0,1.95);}
      else if(kind==='bigbox'&&(col(u)===0||nofood))add('shelf4',u,J-.5,PI,tint(P_GOODS,u,J));
      else add('fridge3',u,J-.5,PI);}
    // the deli counter
    if((kind==='market'||kind==='grocery')&&!tech&&big){for(let u=I-8;u<I-1;u++)add(u%2?'pcase':'bar',u+.5,J-2.8,PI,0xc83a32);till(I-4.5,J-2.8,PI);}
  }
}
// the same kit, for a given floor of a building, keeping clear of its stairs and its way in, and (if it's told to) turned
// round to suit which side the door is on
function floorKit(b,px,pz,floorNo,L,turn){
  const gf=b.gf||FH,y0=floorNo===0?G+1:G+gf+1+FH*(floorNo-1),tr=b.tier>0&&(b.x1-b.x0)>=8&&y0>b.tier?2:0,X0=b.x0+tr+1,Z0=b.z0+tr+1,I=b.x1-b.x0-2-2*tr,J=b.z1-b.z0-2-2*tr,S=b.stair,d=turn?b.door:2;
  const cx=(b.x0+b.x1)>>1,cz=(b.z0+b.z1)>>1;
  const add=(type,u0,v0,yaw0,tint,yo,low)=>{
    const u=d===2?u0:d===3?u0:d===0?v0:I-v0,v=d===2?v0:d===3?J-v0:u0,yaw=(yaw0||0)*(d===0?-1:1)+(d===3?Math.PI:d===0?Math.PI/2:d===1?-Math.PI/2:0);
    if(u<.15||v<.15||u>I-.15||v>J-.15)return;const rx=X0+u,rz=Z0+v;
    if(S){const r=(S.ax==='x'?rx:rz)-S.r0,c=S.ax==='x'?rz:rx;if(c>=S.c0-.8&&c<S.c1+.8&&r>=-3.6&&r<S.L+3.6)return;if(c>=S.c0-3&&c<S.c1+3&&(S.L>FH?r>=-3&&r<S.L+3:r>=-3&&r<.6||r>=S.L-.6&&r<S.L+3))return;}   // (and room to walk round to either end of it)
    if(floorNo===0&&!tint?.door&&(b.door>=2?Math.abs(rx-cx-.5)<2&&(b.door===2?rz<Z0+3.2:rz>Z0+J-3.2):Math.abs(rz-cz-.5)<2&&(b.door===0?rx<X0+3.2:rx>X0+I-3.2)))return;
    const X=px*CELL+rx,Z=pz*CELL+rz;L.push({prop:true,type,x:X,z:Z,y0:y0+(yo||0),yaw,tint,rad:.5,low,key:'p'+Math.round(X*4)+','+Math.round(Z*4)+','+y0+type});};
  return{I,J,add,hg:(a,c,n)=>hash2(Math.floor(a)*7+px*31+floorNo*3+n,Math.floor(c)*11+pz*17+n)};
}
const PI_=Math.PI,HP_=Math.PI/2,P_RUG=[0x8a4b3a,0x3f6b8c,0x5d7a45,0x77608f],P_CAB=[0xd8dce0,0x8a6a44,0x5a7a6a];
// a house: living room to the left of the hall, kitchen and bedroom to the right; upstairs, bedrooms and a bathroom
function homeRoom(b,px,pz,floorNo,L){
  const {I,J,add,hg}=floorKit(b,px,pz,floorNo,L,true),cu=I>>1,pick=(A,n)=>A[Math.floor(hg(1,2,n)*A.length)%A.length],sofa=pick(P_SOFA,1),cab=pick(P_CAB,2);
  const lw=cu-2,rx=cu+3;   // (the rooms' inside edges, either side of the hall)
  const bed=(u,v,y,n)=>{add('homebed',u,v,y,pick(P_BLANKET,n));add('drawers',u+1.1,y?v+.3:v-.3,y);};
  const big=J>=9,sp=big?J>>1:2,by=sp+1;   // (big: the room behind the wall that divides each side)
  if(floorNo===0){
    // the living room: a sofa and its table, the television, a plant, a lamp
    for(let i=0;i<3;i++)add('sofa',.8+i,.6,0,sofa);add('table',1.8,2.1,0);add('table',1.8,big?sp-.6:3.6,PI_);add('tv',1.8,big?sp-.6:3.6,PI_,0,.62);add('flamp',.4,2.5,0);add('plant',lw-.4,.5,1);
    // behind it, a dining room with its table for six and a sideboard
    if(big){for(const u of [1.2,2.2,3.2]){add('rtable',u,by+1.6,0,P_WHITE);add('chair',u,by+.9,0,0x9c6c3e,0,true);add('chair',u,by+2.3,PI_,0x9c6c3e,0,true);}add('shelf2',.5,J-.5,PI_,cab);add('drawers',lw-.6,J-.5,PI_);add('plant',.5,by+.5,2);}
    // the kitchen, in the front half of the right side
    let u=rx+.2;for(const t of ['fridge2','range','sink','prep'])add(t,u++,.5,0,cab);
    if(big||!b.stair){add('rtable',rx+1.5,1.9,0,P_WHITE);add('chair',rx+.8,1.9,HP_,0x9c6c3e,0,true);add('chair',rx+2.2,1.9,-HP_,0x9c6c3e,0,true);}
    // a bedroom behind it, unless the stairs come up there
    if(!b.stair){bed(rx+1,J-1.1,PI_,3);add('wardrobe',I-.5,J-1.5,-HP_);if(big)add('flamp',rx+3,by+.6,0);}
    else add('shelf2',rx+.3,by+.2,0,cab);
    if(!big)add('shelf2',lw+.3,J-.5,PI_,cab);
    // coats by the door
    add('locker',cu-1.6,.3,0);
  }else{
    // upstairs: a bedroom each side at the front, a bathroom on the left behind, a study or the landing on the right
    bed(1.2,1.1,0,4);add('wardrobe',.5,sp-.6,HP_);add('plant',lw-.4,.5,2);
    bed(rx+1,1.1,0,5);add('wardrobe',I-.5,1.4,-HP_);if(big)add('homebed',rx+2.6,sp-1,PI_,pick(P_BLANKET,6));
    add('shelf2',lw-.4,by+.2,0,cab);
    if(big&&!b.stair){add('desk',rx+1.5,J-1.2,PI_);add('swivel',rx+1.5,J-2,PI_,0,0,true);}
  }
}
// a floor of flats
function aptFloor(b,px,pz,floorNo,L){
  const {I,J,add,hg}=floorKit(b,px,pz,floorNo,L,false),pick=(A,a,c,n)=>A[Math.floor(hg(a,c,n)*A.length)%A.length];
  const flat=(x,y,w,h,back0)=>{   // (back: +1 when the wall away from the corridor's at the larger v)
    const back=flatBack(b,y,y+h,b.z0+(b.tier>0&&(b.x1-b.x0)>=8&&(G+(b.gf||FH)+1+FH*(floorNo-1))>b.tier?2:0))<0?-1:back0;
    const yb=back>0?y+h-.5:y+.5,yw=back>0?PI_:0,yf=back>0?y+.6:y+h-.6,yfw=back>0?0:PI_;
    // the bedroom along the back (its bathroom's in the far corner there), the kitchen and a sofa along the front
    add('homebed',x+1,back>0?y+h-1:y+1,yw,pick(P_BLANKET,x,y,1));if(w>=7)add('wardrobe',x+2.3,yb,yw);
    let u=x+w-.5;for(const t of ['fridge2','range','sink'])if(u>x+w-3.6){add(t,u,yf,yfw,pick(P_CAB,x,y,2));u--;}
    for(let i=0;i<Math.min(3,w-4);i++)add('sofa',x+.8+i,yf,yfw,pick(P_SOFA,x,y,3));
    if(h>=5){add('table',x+1.8,y+h/2,0);add('rtable',x+w-1.6,y+h/2,0,P_WHITE);add('chair',x+w-2.3,y+h/2,HP_,pick(P_SOFA,x,y,4),0,true);add('chair',x+w-.9,y+h/2,-HP_,pick(P_SOFA,x,y,4),0,true);}
  };
  if(flats4(I,J)&&b.ground!=='firehall'){const cu=I>>1,cv=J>>1;flat(0,0,cu,cv-2,-1);flat(cu+1,0,I-cu-1,cv-2,-1);flat(0,cv+2,cu,J-cv-2,1);flat(cu+1,cv+2,I-cu-1,J-cv-2,1);}
  else if(I>=12&&b.ground!=='firehall'){flat(0,0,I>>1,J,1);flat((I>>1)+1,0,I-(I>>1)-1,J,1);}
  else flat(0,0,I,J,1);
}
