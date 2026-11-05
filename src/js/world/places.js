// ---------- Endless goblin city ----------
// test worlds: the kinds of structure switched off (saved with the world; empty in a normal city)
let TEST_OFF=new Set(),saveBlocked=false;
// the Testing Environment: an empty, flat world. Nothing the generator plans shows up in it except the structures
// spawned into it (TENV.boxes: {k, ax, az, w, h, sx, sz} in blocks of CELL): the plan's own structure found at (sx, sz),
// built at (ax, az) in front of Gus. Inside a box, and the ring of blocks round it, the plan's lookups answer as they
// would at the source, with what they give moved across (see trInstall), and its chunks are the source's own blocks;
// so its furniture, doors, signs and rides are all the world's own. Everywhere else is grass. (null in a normal city.
// A box saved before structures could be moved has no sx/sz, and stays where the plan put it.)
let TENV=null;const TENV_PL=new Map(),TENV_RM=new Map();
const tenvK=(px,pz)=>(px+32768)*65536+(pz+32768);
// TENV_PL: a box's own blocks; TENV_RM: the blocks (and rings round them) the plan's answers are moved to
function tenvIndex(){TENV_PL.clear();TENV_RM.clear();if(!TENV)return;
  for(const B of TENV.boxes){if(!Number.isFinite(B.sx)||!Number.isFinite(B.sz)){B.sx=B.ax;B.sz=B.az;}
    for(let i=0;i<B.w;i++)for(let j=0;j<B.h;j++){const k=tenvK(B.ax+i,B.az+j);TENV_PL.set(k,B);if(B.sx!==B.ax||B.sz!==B.az)TENV_RM.set(k,B);}}
  for(const B of TENV.boxes)if(B.sx!==B.ax||B.sz!==B.az)for(let i=-1;i<=B.w;i++)for(let j=-1;j<=B.h;j++){const k=tenvK(B.ax+i,B.az+j);if(!TENV_PL.has(k)&&!TENV_RM.has(k))TENV_RM.set(k,B);}}
const tenvShow=(px,pz)=>!TENV||TENV_PL.has(tenvK(px,pz));
// d: how deep in the wrapped plan lookups we are (only the outermost is moved); raw: making a source chunk
const TR={d:0,raw:0,on:false,c:new WeakMap()};
let seed=0, edits={}, collapses={}, wrecked={}, downFix=new Map(), destroyed={};   // destroyed: building key -> how many of its original blocks are gone
const chunkEdits=new Map(),chunks=new Map(),plotCache=new Map();
const ckey=(cx,cz)=>(cx+32768)*65536+(cz+32768);
const li=(lx,y,lz)=>lx+lz*CS+y*CS*CS;
let lastK=-1,lastA=null;
function hash2(x,z){let h=Math.imul(x,374761393)+Math.imul(z,668265263)+Math.imul(seed,1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296;}
// ---- chain-store brands: the name on the sign ("GOBLIN" over it), the sign's colours and picture, and the paint the
// building gets to match. Each kind of place has a few to pick from, so the city isn't all one chain ----
const BR=(n,bg,fg,ac,icon,o)=>Object.assign({n,bg,fg,ac,icon},o||{});
const BRANDS={
  grocery:[BR('WAL-MART','#0b5cad','#ffffff','#ffc220','spark',{wall:PAINT_BLUE,neon:NEON_Y,awn:'none'}),BR('TARGET','#ffffff','#cc0000','#cc0000','eyeball',{wall:STUCCO,neon:NEON_R,awn:'r'}),
    BR('KROGER','#1f4fa3','#ffffff','#9fc3ff','kr',{wall:STUCCO,neon:NEON_B,awn:'none'}),BR('COSTCO','#ffffff','#e31837','#005daa','crates',{wall:CONCRETE,neon:NEON_R,awn:'none'}),
    BR('WHOLE FOODS','#00674b','#ffffff','#b8e08a','leaf',{wall:PAINT_GREEN,neon:NEON_G,awn:'g'}),BR('ALDI','#00205b','#ffffff','#f6a01a','aldi',{wall:PAINT_NAVY,neon:NEON_O,awn:'none'}),
    BR("TRADER JOE'S",'#c8102e','#ffffff','#ffffff','tj',{wall:PLANKS,neon:NEON_R,awn:'r'}),BR('PIGGLY WIGGLY','#d7141a','#ffffff','#ffffff','pig',{wall:STUCCO,neon:NEON_R,awn:'r'})],
  // superstores and warehouse clubs (wh: warehouse racking instead of aisles of shelves)
  bigbox:[BR('WAL-MART','#0b5cad','#ffffff','#ffc220','spark',{wall:PAINT_BLUE,neon:NEON_Y,a:179000}),BR('TARGET','#ffffff','#cc0000','#cc0000','eyeball',{wall:STUCCO,neon:NEON_R,a:130000}),
    BR('MEIJER','#ffffff','#d6001c','#00539f','bigm',{wall:PAINT_WHITE,neon:NEON_B,a:200000}),BR('KMART','#e2231a','#ffffff','#ffffff','bigk',{wall:PAINT_RED,neon:NEON_R,a:94000,nofood:true}),
    BR('COSTCO','#ffffff','#e31837','#005daa','crates',{wall:CONCRETE,neon:NEON_R,a:146000,wh:true}),BR("SAM'S CLUB",'#0067a0','#ffffff','#ffffff','diamond',{wall:PAINT_NAVY,neon:NEON_B,a:120000,wh:true}),
    BR('HOME DEPOT','#f96302','#ffffff','#ffffff','depot',{wall:PAINT_ORANGE,neon:NEON_O,a:105000,wh:true}),BR("LOWE'S",'#004990','#ffffff','#ffffff','gable',{wall:PAINT_NAVY,neon:NEON_B,a:112000,wh:true})],
  // supermarkets (and one electronics store of the same size)
  market:[BR('KROGER','#1f4fa3','#ffffff','#9fc3ff','kr',{wall:STUCCO,neon:NEON_B,a:61000}),BR('SAFEWAY','#e21a2c','#ffffff','#ffffff','esS',{wall:STUCCO,neon:NEON_R,a:47500}),
    BR('PUBLIX','#3d8b37','#ffffff','#ffffff','pp',{wall:STUCCO,neon:NEON_G,a:48000}),BR('WHOLE FOODS','#00674b','#ffffff','#b8e08a','leaf',{wall:PAINT_GREEN,neon:NEON_G,a:38000}),
    BR('ALDI','#00205b','#ffffff','#f6a01a','aldi',{wall:PAINT_NAVY,neon:NEON_O,a:12000}),BR('BEST BUY','#0046be','#fff200','#fff200','bbtag',{wall:PAINT_BLUE,neon:NEON_Y,a:38000,tech:true})],
  // freestanding drugstores and dollar stores
  drug:[BR('CVS','#cc0000','#ffffff','#ffffff','heart',{wall:BRICK,neon:NEON_R,a:11000}),BR('WALGREENS','#e31837','#ffffff','#ffffff','bigw',{wall:BRICK,neon:NEON_R,a:14500}),
    BR('DOLLAR GENERAL','#ffd100','#000000','#000000','dg',{wall:PAINT_YELLOW,neon:NEON_Y,a:8500}),
    BR('RITE AID','#0a4b9c','#ffffff','#ffffff','rite',{wall:BRICK,neon:NEON_B,a:11000}),BR('FAMILY DOLLAR','#e4002b','#ffffff','#ffffff','dollar',{wall:PAINT_RED,neon:NEON_R,a:8000})],
  gas:[BR('SHELL','#fbce07','#dd1d21','#dd1d21','scallop',{wall:PAINT_YELLOW,neon:NEON_R}),BR('EXXON','#ffffff','#e1251b','#1b3f94','xx',{wall:PAINT_WHITE,neon:NEON_R}),
    BR('BP','#007f3e','#ffffff','#ffe600','helios',{wall:PAINT_GREEN,neon:NEON_Y}),BR('CHEVRON','#ffffff','#0054a4','#e2231a','chev',{wall:PAINT_WHITE,neon:NEON_B}),
    BR('7-ELEVEN','#ffffff','#008163','#ffffff','seven',{wall:PAINT_WHITE,neon:NEON_O}),
    BR('TEXACO','#e1251b','#ffffff','#ffffff','texstar',{wall:PAINT_RED,neon:NEON_R}),BR('MOBIL','#ffffff','#0a3a8a','#e1251b','mo',{wall:PAINT_WHITE,neon:NEON_B}),BR("BUC-EE'S",'#e2231a','#ffd200','#ffd200','beaver',{wall:PAINT_RED,neon:NEON_Y}),BR('WAWA','#a6192e','#ffd200','#ffd200','goose',{wall:BRICK,neon:NEON_R})],
  diner:[BR('WAFFLE HOUSE','#ffd200','#111111','#111111','waffle',{wall:PAINT_WHITE,neon:NEON_Y,a:1650})],
  fastfood:[BR("McDONALD'S",'#da291c','#ffc72c','#ffc72c','arches',{wall:PAINT_RED,neon:NEON_Y,a:4300}),BR('BURGER KING','#f5ebdc','#d62300','#502314','bk',{wall:PAINT_ORANGE,neon:NEON_B,a:3000}),
    BR("ARBY'S",'#d71920','#ffffff','#ffffff','hat',{wall:PAINT_RED,neon:NEON_R,a:3000}),BR('BY-THE-BUCKET','#ffd23f','#b3261e','#b3261e','bucket',{wall:PAINT_YELLOW,neon:NEON_R,a:2500}),
    BR("WENDY'S",'#e2203d','#ffffff','#ffffff','wendy',{wall:PAINT_RED,neon:NEON_R,a:3000}),BR('TACO BELL','#702082','#ffffff','#ffd200','bell',{wall:PAINT_NAVY,neon:NEON_M,a:2500}),BR('KFC','#a3080c','#ffffff','#ffffff','colonel',{wall:PAINT_RED,neon:NEON_R,a:2600}),BR('CHICK-FIL-A','#e51636','#ffffff','#ffffff','cfa',{wall:BRICK,neon:NEON_R,a:4500}),BR('WHITE CASTLE','#ffffff','#0b3a8c','#0b3a8c','whitecastle',{wall:PAINT_WHITE,neon:NEON_B,a:2500}),BR('DAIRY QUEEN','#e51636','#ffffff','#0a5cab','dq',{wall:PAINT_RED,neon:NEON_B,a:2800})],
  sitdown:[BR("APPLEBEE'S",'#b5121b','#ffffff','#ffffff','appl',{wall:BRICK,neon:NEON_R,a:5400}),BR("CHILI'S",'#ffffff','#c8102e','#2e7d32','chili',{wall:STUCCO,neon:NEON_R,a:5800}),
    BR('CRACKER BARREL','#5b3a1c','#f2c14e','#f2c14e','barrel',{wall:PLANKS,neon:NEON_Y,a:9500,store:true}),BR('GOLDEN CORRAL','#7b1f1f','#f6c445','#f6c445','fork',{wall:STUCCO,neon:NEON_Y,a:10000,buffet:true}),
    BR('OLIVE GARDEN','#4e5b31','#ffffff','#c9b26b','olive',{wall:STUCCO,neon:NEON_G,a:7800}),BR('TEXAS ROADHOUSE','#7a1712','#ffffff','#ffffff','horns',{wall:PLANKS,neon:NEON_R,a:7200}),
    BR('CHEESECAKE FACTORY','#3b2a20','#e8d3a8','#e8d3a8','cake',{wall:STUCCO,neon:NEON_O,a:10000}),
    BR("DENNY'S",'#fdd20a','#c8102e','#c8102e','dn',{wall:PAINT_YELLOW,neon:NEON_R,a:4800}),BR('IHOP','#0b4ea2','#ffffff','#e4002b','pancakes',{wall:PAINT_BLUE,neon:NEON_R,a:5000}),
    BR('RED LOBSTER','#b5121b','#ffffff','#ffffff','claw',{wall:PLANKS,neon:NEON_R,a:7000}),BR('OUTBACK','#6a2c12','#ffd27a','#ffd27a','boomer',{wall:PLANKS,neon:NEON_O,a:6500}),BR('HOOTERS','#f26522','#ffffff','#ffffff','owl',{wall:PLANKS,neon:NEON_O,a:5500}),BR('BUFFALO WILD WINGS','#111111','#ffc72c','#ffc72c','wing',{wall:BRICK,neon:NEON_Y,a:6000})],
  pizza:[BR('PIZZA HUT','#ee3124','#ffffff','#ffffff','hut',{wall:PAINT_RED,neon:NEON_R,a:3000}),BR("DOMINO'S",'#006491','#ffffff','#e31837','domino',{wall:PAINT_BLUE,neon:NEON_R,a:1300}),
    BR("PAPA JOHN'S",'#ffffff','#006a31','#d82a2a','pj',{wall:PAINT_GREEN,neon:NEON_R,a:1300}),BR('LITTLE CAESARS','#ff6900','#ffffff','#111111','laurel',{wall:PAINT_ORANGE,neon:NEON_O,a:1400}),BR('CHUCK E. CHEESE','#6a2c91','#ffd200','#ffd200','mouse',{wall:PAINT_NAVY,neon:NEON_M,a:3000})],
  cafe:[BR('STARBUCKS','#00704a','#ffffff','#ffffff','siren',{wall:PLANKS,neon:NEON_G,a:2000}),BR("DUNKIN'",'#ffffff','#ff671f','#da1884','dd',{wall:PAINT_ORANGE,neon:NEON_M,a:1800}),
    BR('TIM HORTONS','#c8102e','#ffffff','#ffffff','th',{wall:BRICK,neon:NEON_R,a:2500}),BR('PANERA','#4a5a24','#ffffff','#e0c98a','loaf',{wall:STUCCO,neon:NEON_G,a:3500})],
  hospital:[BR('HOSPITAL','#ffffff','#0d47a1','#e53935','cross'),BR('GENERAL HOSPITAL','#0d47a1','#ffffff','#ff5252','cross'),BR('MERCY HOSPITAL','#ffffff','#b71c1c','#b71c1c','cross'),
    BR('MEDICAL CENTER','#00796b','#ffffff','#ffffff','cross'),BR('MEMORIAL HOSPITAL','#ffffff','#1565c0','#e53935','cross'),BR('REGIONAL HOSPITAL','#ffffff','#00695c','#00695c','cross')],
  police:[BR('POLICE','#0d1b4a','#ffffff','#ffd54f','badge'),BR('POLICE DEPT.','#0d1b4a','#ffffff','#90caf9','badge'),BR('POLICE PRECINCT','#1a237e','#ffffff','#ffd54f','badge')],
  fire:[BR('FIRE STATION','#b71c1c','#ffffff','#ffca28','flame'),BR('FIRE DEPT.','#b71c1c','#ffffff','#ffffff','flame'),BR('FIRE CO. NO. 9','#7f0000','#ffd54f','#ffd54f','flame')],
  garage:[BR('PARKING','#1565c0','#ffffff','#ffffff','P'),BR('PARK-N-GO','#2e7d32','#ffffff','#ffffff','P'),BR('PARKING GARAGE','#1565c0','#ffffff','#ffffff','P')],
  mall:[BR('MALL','#37474f','#ffffff','#ffb300','bag'),BR('GALLERIA','#4a148c','#ffffff','#ffd54f','bag'),BR('TOWN CENTER','#00695c','#ffffff','#ffe082','bag'),BR('OUTLETS','#bf360c','#ffffff','#ffffff','tag')],
  office:[BR('BANK OF AMERICA','#012169','#ffffff','#e31837','boaflag'),BR('CHASE','#117aca','#ffffff','#ffffff','octa'),BR('WELLS FARGO','#d71e28','#ffcd41','#ffcd41','coach'),
    BR('AMAZON','#232f3e','#ffffff','#ff9900','smile'),BR('GOOGLE','#ffffff','#4285f4','#ffffff','googleg'),BR('MICROSOFT','#ffffff','#5e5e5e','#ffffff','ms4'),
    BR('AT&T','#ffffff','#00a8e0','#00a8e0','attglobe'),BR('VERIZON','#000000','#ffffff','#ffffff','vcheck'),BR('STATE FARM','#ffffff','#e31837','#e31837','rings3'),
    BR('FEDEX','#4d148c','#ffffff','#ffffff','fx'),
    BR('APPLE','#111111','#ffffff','#b8e08a','wormapple'),BR('TESLA','#111111','#ffffff','#e31837','teslat'),BR('NETFLIX','#111111','#e50914','#e50914','nflx'),BR('META','#ffffff','#0668e1','#0668e1','infin'),BR('GEICO','#00447c','#ffffff','#ffd200','gecko'),BR('UPS','#351c15','#ffb500','#ffb500','shield')],
  base:[BR('ARMY BASE','#2e3a1e','#f0e2b0','#c8a84a','badge')],airport:[BR('AIRPORT','#0d2a5a','#ffffff','#5ad0ff','globe'),BR('INTERNATIONAL','#1a1a2a','#ffffff','#ffd23a','globe')],
  nasa:[BR('NASA','#0b3d91','#ffffff','#fc3d21','globe')],theme:[BR('FUN PARK','#c8202a','#ffe23a','#ffffff','globe'),BR('ADVENTURE LAND','#1a5a2a','#ffe23a','#ff7a2a','globe'),BR('SIX FLAGS','#0a3a8a','#ffffff','#e31837','flag6'),BR('DISNEY WORLD','#0a3a8a','#ffffff','#ffd23a','spires')],
  nuclear:[BR('NUCLEAR','#2a2a10','#ffe23a','#ffe23a','bolt')],
  arena:[BR('ARENA','#1a1a2a','#ffffff','#ff7a2a','globe'),BR('SPORTS CENTER','#0d2a5a','#ffffff','#ffd23a','globe')],
  campus:[BR('UNIVERSITY','#5a0a1a','#f6ead0','#d4af37','book'),BR('STATE COLLEGE','#0d2a5a','#ffffff','#d4af37','book')],
  prison:[BR('STATE PRISON','#2a2a2a','#ffffff','#ff7a2a','badge')],jail:[BR('COUNTY JAIL','#2a2a2a','#ffffff','#ffd23a','badge')],
  water:[BR('WATER WORKS','#0a3a6a','#ffffff','#5ad0ff','drop')],power:[BR('POWER STATION','#2a2a1a','#ffe23a','#ffe23a','bolt')],
  zoo:[BR('ZOO','#2e5d1e','#ffffff','#ffd23a','leaf'),BR('WILD PARK','#5a3a10','#fff3d0','#e6a03a','leaf')],
  studio:[BR('STUDIOS','#1a1a1a','#ffd23a','#ffd23a','film'),BR('PICTURES','#0a1a3a','#ffffff','#e6c84a','film')],
  lab:[BR('LABORATORIES','#0a140a','#7aff4a','#7aff4a','bolt'),BR('RESEARCH','#101010','#c6ff00','#c6ff00','skull')],
  ikea:[BR('IKEA','#0058a3','#ffda1a','#ffda1a','ikeaword')],
  museum:[BR('MUSEUM','#2a2a2a','#f6ead0','#c8a24a','bone'),BR('NATURAL HISTORY','#1d3048','#ffffff','#d8b46a','bone'),BR('ART MUSEUM','#5a1a1a','#ffffff','#e8c87a','mask')],
  aquarium:[BR('AQUARIUM','#0a4a7a','#ffffff','#5ad0ff','fish'),BR('SEA WORLD','#003a5a','#ffe9a0','#4ac8e8','fish')],
  casino:[BR('JACKPOT','#3a0010','#ffd23a','#ff3a8c','dollar'),BR('GOLD RUSH','#101010','#ffcf40','#ffcf40','dollar'),BR('LUCKY STRIKE','#0a2a10','#ffe23a','#ff4a3a','dollar'),BR('CAESARS PALACE','#1a1030','#ffd23a','#ffd23a','laurel'),BR('BELLAGIO','#0a2a3a','#f6e2b0','#f6e2b0','fountain')],
  school:[BR('ELEMENTARY','#7a1a1a','#ffffff','#ffd23a','book'),BR('HIGH SCHOOL','#0d2a5a','#ffffff','#ffd23a','book'),BR('MIDDLE SCHOOL','#1a4a2a','#ffffff','#f0e2b0','book')],
  factory:[BR('STEEL WORKS','#3a2a20','#ffb070','#ff7a2a','bolt'),BR('CANNERY','#f4efe2','#7a3b16','#d0763a','bucket'),BR('CHEMICAL CO','#1a3a2a','#c6ff00','#c6ff00','drop'),BR('AUTO PLANT','#1a1a2a','#ffffff','#e53935','car')],
  datacenter:[BR('DATA CENTER','#101820','#7ad0ff','#7ad0ff','tv')],
  electric:[BR('POWER & LIGHT','#1a2a4a','#ffe23a','#ffe23a','bolt')],
  nursery:[BR('NURSERY','#2e5d1e','#ffffff','#a6e36a','leaf'),BR('GARDEN CENTRE','#4a6a20','#fff6d0','#e6c84a','leaf')],
  dealer:[BR('MOTORS','#0d2a5a','#ffffff','#e53935','car'),BR('AUTO MALL','#b71c1c','#ffffff','#ffd23a','car'),BR('USED CARS','#f9a825','#1a1a1a','#1a1a1a','car'),BR('FORD','#00366b','#ffffff','#ffffff','fordo'),BR('TOYOTA','#ffffff','#d71920','#d71920','toy'),BR('CARMAX','#003a70','#ffd200','#ffd200','max')],
  armory:[BR('ARMORY','#3a2a1a','#f0e2b0','#b8962a','badge')],
  theater:[BR('THEATRE','#5a0a1a','#ffe9b0','#d4af37','mask'),BR('OPERA HOUSE','#1a1030','#f6e2b0','#d4af37','mask')],
  stocks:[BR('STOCK EXCHANGE','#0b2a1a','#e8f6e8','#d4af37','chart')],
  courthouse:[BR('COURTHOUSE','#23263a','#f6ead0','#c8a24a','bank'),BR('HALL OF JUSTICE','#3a2a1a','#ffffff','#d8b46a','bank')],
  library:[BR('LIBRARY','#3e2a1a','#f6ead0','#d8b46a','book'),BR('PUBLIC LIBRARY','#1d3048','#ffffff','#9ec3e6','book')],
  cinema:[BR('CINEMA','#7a0e14','#ffe27a','#ffd23a','film'),BR('PICTURE HOUSE','#1a1a2a','#ffd23a','#ff4a4a','film'),BR('MOVIE PALACE','#3a0a4a','#ffffff','#ffcc33','film'),BR('AMC','#111111','#ff2a2a','#ff2a2a','amc'),BR('REGAL','#3a0a4a','#ffd23a','#ffd23a','crown')],
  radio:[BR('RADIO 99.9','#b71c1c','#ffffff','#ffcdd2','mic'),BR('ROCK FM','#111111','#ff9a2a','#ff9a2a','mic')],
  news:[BR('NEWS 7','#0d2a5a','#ffffff','#e53935','tv'),BR('EYEWITNESS NEWS','#b71c1c','#ffffff','#ffffff','tv')],
  bank:[BR('SAVINGS & LOAN','#0b3d2e','#ffe9a8','#d4b45a','bank'),BR('TRUST BANK','#14234a','#ffffff','#c8a24a','bank'),BR('GOLD VAULT','#2a2210','#ffd54f','#ffd54f','dollar'),BR('CITIBANK','#003b70','#ffffff','#e31837','citi'),BR('CAPITAL ONE','#004879','#ffffff','#d22e1e','cap1')],
  disco:[BR('DISCO','#2a0a3a','#ff6ad5','#6ae8ff','globe'),BR('NIGHT FEVER','#120a2a','#ffe23a','#ff3a8c','globe')],
  club:[BR('SLIME PIT','#0a1a0a','#7aff4a','#7aff4a','skull'),BR('ROTTEN TOOTH','#1a0a0a','#ff4a3a','#9aff6a','skull'),BR('KING','#101010','#c6ff00','#c6ff00','skull')],
  // the little shops: made-up names (the sign reads GOBLIN + the name)
  books:[BR('BOOKS','#4e342e','#fff3e0','#ffcc80','book'),BR('PAGE & QUILL','#1b3a5c','#ffffff','#f6c85f','book'),BR('DOG-EARED','#6a1b3a','#ffe9f0','#ffb3c8','book')],
  dentist:[BR('DENTAL','#e8f6fb','#0b6a8a','#2aa8d0','tooth'),BR('SMILE CLINIC','#ffffff','#1e88a8','#7fd1e6','tooth')],
  dispo:[BR('GREEN LEAF','#1b5e20','#ffffff','#7ed957','leaf'),BR('DISPENSARY','#0f3d2a','#d9ffb0','#43c46a','cross')],
  guns:[BR('GUNS & AMMO','#2b2b2b','#ffcf40','#d32f2f','target'),BR('ARMS & TACKLE','#3e3a2a','#f0e2b0','#c0392b','target')],
  bar:[BR('TAVERN','#3a1f12','#ffd27a','#c9822b','mug'),BR('PUB','#123826','#f6e7b0','#d4a84b','mug'),BR('ALEHOUSE','#4a1020','#ffe0b0','#e06a3a','mug')],
  soup:[BR('SOUP KITCHEN','#f4efe2','#7a3b16','#d0763a','bowl'),BR('COMMUNITY MEALS','#e9f1e4','#2f5d34','#8bb46a','bowl')],
  shop:[BR('CVS','#cc0000','#ffffff','#ffffff','heart'),BR('WALGREENS','#e31837','#ffffff','#ffffff','bigw'),BR('GAMESTOP','#000000','#ffffff','#e10600','pad'),
    BR('SUBWAY','#008938','#ffc20e','#ffffff','subs'),BR('RADIOSHACK','#e31b23','#ffffff','#ffffff','tshack'),
    BR('FOOT LOCKER','#000000','#ffffff','#e31837','ref'),BR('BLOCKBUSTER','#003b8e','#ffd200','#ffd200','ticket'),
    BR('HOT TOPIC','#111111','#ff2a6a','#ff2a6a','skull'),BR('SEPHORA','#111111','#ffffff','#ffffff','flame'),BR('MATTRESS FIRM','#e31837','#ffffff','#ffffff','bed'),BR('THE UPS STORE','#351c15','#ffb500','#ffb500','shield'),BR('BATH & BODY WORKS','#ffffff','#0a3a8a','#0a3a8a','bottle'),BR('H&R BLOCK','#00a651','#ffffff','#ffffff','hrb')]};
// give a building a brand (h: a seeded 0..1) and repaint it to match
const brandPick=(cat,h)=>{const L=BRANDS[cat];return L[Math.min(L.length-1,Math.floor(h*L.length))];};
const areaBl=(B,k)=>(B.a||3000)/22*(k||1);
function brandOn(b,cat,h){const L=BRANDS[cat],B=L[Math.min(L.length-1,Math.floor(h*L.length))];b.brand=B;b.signCat=cat;if(B.wall)b.wall=B.wall;if(B.neon&&b.neon)b.neon=B.neon;return B;}
const FACADES=[[METAL,WIN_BLUE],[MOSSCON,WIN_GREEN],[RUST,WIN_WARM],[BRICK,WIN_WARM],[MOSSSTONE,WIN_GREEN]];
// a building's height in whole storeys: the ground floor is gf blocks tall (some lobbies and shops are extra roomy),
// every floor above is FH, and the roof sits where the next floor slab would, so the top storey is full height
const storeysG=(gf,h)=>G+gf+FH*Math.max(1,Math.round((h-gf)/FH));
const storeys=h=>FH*Math.max(1,Math.round(h/FH));
// interiors are only detailed up to about 20 blocks up (above that a tower is solid floors); land that on a slab
function detailCap(b){let lim=G+b.gf;while(lim+FH<=G+20)lim+=FH;b.detailTop=Math.min(b.top-1,lim,b.tier>0?b.tier-1:1e9);}
// ---- superblocks: now and then two or four city blocks merge into one site and the streets between them go.
// Grouped on a 2x2 grid of blocks: a football stadium takes all four; a mega-building takes a pair. ----
const superCache=new Map();
// ---- biomes: the world is patches of city and open plains, a few blocks to a dozen across. Decided per block from a
// smooth noise over a coarse grid, so patches have rounded, natural edges. The blocks round the start are always city.
// ---- settlements: the land is open plains, with separate places dotted across it on a loose grid (about 22 blocks
// apart): cities, large towns, small towns and villages. You start in the middle of a city. Each place is a ragged,
// roughly square patch of streets; everything between is plains. ----
const SET_SP=36,SET_R={city:[13,4],large:[7,2],small:[3,1.2],village:[1.6,0.8]},setCache=new Map(),setAtCache=new Map(),zoneCache=new Map();
function settlementLat(rx,rz){
  const k=rx*100003+rz;let S=setCache.get(k);if(S)return S;
  let type;if(rx===0&&rz===0)type='city';else{const h=hash2(rx*577+31,rz*331+17);type=h<0.14?'city':h<0.38?'large':h<0.68?'small':'village';}
  const [r0,rv]=SET_R[type];// (each place is nudged off its grid point on its own, up to 11 blocks either way, so they don't line up)
  S={rx,rz,type,R:rx===0&&rz===0?15:r0+hash2(rx*41+3,rz*59+5)*rv,cx:rx===0&&rz===0?0:rx*SET_SP+Math.round((hash2(rx*733+rz*97+1,rz*311+5)-0.5)*22),cz:rx===0&&rz===0?0:rz*SET_SP+Math.round((hash2(rz*733+rx*89+2,rx*271+9)-0.5)*22)};
  setCache.set(k,S);return S;
}
// ---- every place has a name: made up from its spot on the map (so it's always the same) out of goblin-ish bits ----
const NM_A=['Grub','Snot','Mud','Wart','Grim','Bog','Gnar','Rot','Muck','Skulk','Fang','Gob','Toad','Moss','Slag','Rust','Grit','Crag','Sludge','Nettle','Thorn','Murk','Gloom','Bramble','Stink','Grot','Knob','Lump','Scab','Cinder','Gristle','Snaggle','Fester','Mold','Gorse','Dreg','Twig','Weevil','Blister','Clod','Gulch','Rubble','Mire','Soot','Bunion','Grime','Skunk','Hag','Troll','Kettle'];
const NM_B=['ton','ville','burg','ford','wick','hollow','mouth','stead','bury','by','thorpe','field','well','dale','moor','gate','bridge','pool','marsh','heath','borough','combe','den','hole','ditch','pit','crossing','bottom','worth'];
const setNameC=new Map();
function setName(S){
  const k=S.rx+','+S.rz;let n=setNameC.get(k);if(n)return n;
  const h=i=>hash2(S.rx*977+i*131+7,S.rz*613+i*71+3);
  n=NM_A[Math.floor(h(1)*NM_A.length)]+NM_B[Math.floor(h(2)*NM_B.length)];
  const m=h(3);
  if(S.type==='city'&&m<0.25)n=(m<0.12?'Greater ':'New ')+n;
  else if(S.type==='village'&&m<0.2)n='Little '+n;
  else if((S.type==='small'||S.type==='large')&&m<0.14)n=(m<0.07?'Upper ':'Lower ')+n;
  else if(m>0.94)n=n+'-on-the-'+['Bog','Mire','Muck','Marsh'][Math.floor(h(4)*4)];
  setNameC.set(k,n);return n;
}
const PLACE_KIND={city:'City',large:'Large town',small:'Small town',village:'Village',coastcity:'Coastal city',harbortown:'Harbor town',resort:'Resort town',fishing:'Fishing village'};
// coming into a place: its name across the screen for a few seconds (and again if you come back after a good while away)
const PB={el:null,t:0,last:null,outT:0};
function placeBannerTick(dt){
  const p=players.find(q=>q.active);if(!p)return;
  if(PB.t>0){PB.t-=dt;if(PB.t<=0&&PB.el)PB.el.classList.remove('on');}
  if(!playing||TENV)return;
  const S=settlementAt(Math.floor(p.pos.x/CELL),Math.floor(p.pos.z/CELL))||coastOwner(Math.floor(p.pos.x/CELL),Math.floor(p.pos.z/CELL));
  if(!S){PB.outT+=dt;return;}
  if(S!==PB.last||PB.outT>45){
    if(!PB.el){const host=document.body||document.documentElement;if(!host||!host.appendChild)return;PB.el=document.createElement('div');PB.el.className='placeBanner';PB.el.setAttribute('aria-live','polite');host.appendChild(PB.el);}
    const v=setListC.has(S.rx+','+S.rz)?setDestroyed(S):null;
    PB.el.innerHTML='<div class="pn">'+setName(S)+'</div><div class="pk">'+PLACE_KIND[setKind(S)]+'</div><div class="pr"></div>'+(v?'<div class="pd">Destroyed: '+Math.round(v*100)+'%</div>':'');
    PB.el.classList.add('on');PB.t=3.6;
    if(knownSets)noteKnown(Math.floor(p.pos.x/CELL),Math.floor(p.pos.z/CELL));}
  PB.last=S;PB.outT=0;
}
// a smooth noise over the block grid (-1..1): value noise on a lattice 'sp' blocks apart, eased between lattice points
function gridNoise(px,pz,sp,salt){
  const fx=px/sp,fz=pz/sp,ix=Math.floor(fx),iz=Math.floor(fz),u=fx-ix,v=fz-iz,su=u*u*(3-2*u),sv=v*v*(3-2*v);
  const h=(a,b)=>hash2(a*929+salt,b*613+salt*3)*2-1;
  return (h(ix,iz)*(1-su)+h(ix+1,iz)*su)*(1-sv)+(h(ix,iz+1)*(1-su)+h(ix+1,iz+1)*su)*sv;
}
// how far block (px,pz) is from place S's centre, measured against its shape: a rounded square, pushed in and out by
// two layers of smooth noise so every place has its own lumpy, amorphous outline (bays, lobes, a stretched side)
function setDist(S,px,pz){
  const dx=Math.abs(px-S.cx),dz=Math.abs(pz-S.cz),d=Math.cbrt(dx*dx*dx+dz*dz*dz);
  return d/(1+0.3*gridNoise(px,pz,5,11)+0.12*gridNoise(px,pz,2,23));
}
// the place block (px,pz) belongs to, or null out on the plains. Its edge isn't a clean line: across a band about a
// block and a half either side of it, blocks are scattered in or out at random, so stray bits of town sit out in the
// fields and patches of open ground show up just inside the edge
function settlementRaw(px,pz){
  const k=px*100003+pz;let v=setAtCache.get(k);if(v!==undefined)return v;v=null;
  const rx0=Math.round(px/SET_SP),rz0=Math.round(pz/SET_SP),j=hash2(px*13+5,pz*29+3)*2-1;
  for(let rx=rx0-1;rx<=rx0+1&&!v;rx++)for(let rz=rz0-1;rz<=rz0+1&&!v;rz++){const S=settlementLat(rx,rz),b=Math.min(1.6,0.35*S.R);
    if(px===S.cx&&pz===S.cz||setDist(S,px,pz)+j*b<=S.R)v=S;}
  setAtCache.set(k,v);return v;
}
// ...and the place it actually belongs to: the same, except where a river winds through the edge of a place (on its
// way in or out of its straight run through the middle, or just clipping a corner) -- those blocks are given over to
// the river and the open ground round it, so no building ever stands in the water
const setFinC=new Map();
function settlementAt(px,pz){
  const k=px*100003+pz;let v=setFinC.get(k);if(v!==undefined)return v;
  v=settlementRaw(px,pz);if(v&&(riverCuts(px,pz)||seaPlot(px,pz)))v=null;
  setFinC.set(k,v);return v;
}
function riverCuts(px,pz){
  if(riverDir(px,pz))return false;   // (a block of the river's straight run through town: drawn as such)
  const pad=RIV_W+3,X0=px*CELL-pad,Z0=pz*CELL-pad,X1=(px+1)*CELL+pad,Z1=(pz+1)*CELL+pad,L=riversNearBox(X0,Z0,X1,Z1);
  for(let q=0;q<L.length;q+=2){const P=L[q].pts,i=L[q+1];for(const t of [0,0.5,1]){const x=P[i][0]+(P[i+1][0]-P[i][0])*t,z=P[i][1]+(P[i+1][1]-P[i][1])*t;if(x>X0&&x<X1&&z>Z0&&z<Z1)return true;}}
  return false;
}
// what part of a place a block is in: a city has its downtown core, then a ring that's built like a large town, then
// suburbs (mostly houses, a few shops) at its edge; a large town has a thin suburban fringe. Small towns and villages
// are the same all through.
function zoneAt(px,pz){
  const k=px*100003+pz;let v=zoneCache.get(k);if(v!==undefined)return v;
  const S=settlementAt(px,pz);v=null;
  if(S){const f=(setDist(S,px,pz)+(hash2(px*7+11,pz*19+3)-0.5)*1.4)/S.R;
    v=S.type==='city'?(f<0.5?'city':f<0.74?'large':'suburb'):S.type==='large'?(f<0.68?'large':'suburb'):S.type;}
  zoneCache.set(k,v);return v;
}
const setType=zoneAt;
