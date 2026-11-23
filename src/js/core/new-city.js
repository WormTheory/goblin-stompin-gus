// ---------- New city & boot ----------
const confirmEl=document.getElementById('confirm');
// full screen: the whole page, toggled; the buttons (the title menu's, and the pause menu's column) say which way it will go
{const fbs=['fullBtn','fullBtnP'].map(id=>document.getElementById(id)).filter(Boolean),fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
 const showFs=()=>{for(const fb of fbs)fb.textContent=fsEl()?'Exit full screen':'Full screen';kbLock();};
 // in full screen, claim Esc where the browser allows it (Chrome and Edge: the Keyboard Lock API), so a tap of Esc
 // pauses the game instead of dropping out of full screen; holding Esc still leaves. Elsewhere Esc works as before.
 function kbLock(){try{const k=navigator.keyboard;if(!k||!k.lock)return;if(fsEl()){const r=k.lock(['Escape']);if(r&&r.catch)r.catch(()=>{});}else k.unlock();}catch(e){}}
 const can=document.fullscreenEnabled||document.webkitFullscreenEnabled;if(!can)for(const fb of fbs)fb.hidden=true;
 for(const fb of fbs)fb.addEventListener('click',()=>{try{if(fsEl()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);}else{const el=document.documentElement,rq=el.requestFullscreen||el.webkitRequestFullscreen;const pr=rq&&rq.call(el);if(pr&&pr.catch)pr.catch(()=>{});}}catch(e){}});
 document.addEventListener('fullscreenchange',()=>{showFs();setTimeout(()=>{try{resize();}catch(e){}},50);});document.addEventListener('webkitfullscreenchange',showFs);showFs();}
// ---- New world's settings: the World Generator's sliders (its Land & sea, Land shape, Rivers, Climate and Settlements boxes), in
// WORLD_CFG's terms, so the defaults make the world exactly as before. Each range is as far as the World Generator's (as far
// as the start can still always be found inland with a coast in reach). They go in the save (cfg, worldCfgSent), so the
// world is made the same way whenever it's loaded, and online a guest's is the host's ----
const NW_GROUPS=[['sea','Land & sea'],['shape','Land shape'],['riv','Rivers'],['clim','Climate'],['set','Settlements']];
const NW_SL=[['land','Land',-2.5,2.5,0.1,'sea'],['size','Continent size',0.4,1.8,0.05,'sea'],['rough','Coastline roughness',0,2.5,0.1,'sea'],['chan','Ocean channels',0,2.5,0.1,'sea'],['isles','Island chains',0,3,0.1,'sea'],['islz','Island size',0.6,3,0.1,'sea'],
  ['mtn','Mountains',-0.5,0.5,0.05,'shape'],['mth','Mountain height',0.3,1.2,0.05,'shape'],['hill','Hilliness',0,3,0.1,'shape'],['lakes','Lakes',0,3,0.1,'shape'],
  ['riv','How often',0,2.2,0.1,'riv'],['rmd','Meandering',0,3,0.1,'riv'],['rwd','Wandering',0,3,0.1,'riv'],['rwid','Width',0.5,2,0.05,'riv'],['rlen','Length',0.3,2.5,0.1,'riv'],['rbr','Branching',0,3,0.1,'riv'],
  ['temp','Temperature',-0.4,0.4,0.02,'clim'],['rain','Rainfall',-0.4,0.4,0.02,'clim'],['czone','Climate zone size',0.4,2.5,0.1,'clim'],['lat','Latitude bands',0,4,0.1,'clim'],
  ['towns','Towns',0.2,1,0.05,'set'],['csize','City size',0.6,1.8,0.05,'set'],['clu','Clustering',-1,1,0.1,'set'],['sites','Country sites',0,3,0.1,'set']];
const NW={v:Object.assign({},WORLD_DEF),inp:{},out:{},hd:{},box:{}};
const nwFmt=(k,v)=>k==='land'||k==='temp'||k==='rain'||k==='mtn'||k==='clu'?(v>0?'+':v<0?'−':'')+Math.abs(v).toFixed(k==='land'||k==='clu'?1:2):'×'+v.toFixed(k==='size'||k==='mth'||k==='rwid'||k==='towns'||k==='csize'?2:1);
// (only what isn't a default, as the save keeps it; undefined for the world as it's always been)
function nwChosen(){let o;for(const [k] of NW_SL)if(NW.v[k]!==WORLD_DEF[k])(o=o||{})[k]=NW.v[k];return o;}
function nwShow(){for(const [k] of NW_SL){NW.inp[k].value=NW.v[k];NW.out[k].textContent=nwFmt(k,NW.v[k]);}
  for(const [g] of NW_GROUPS)NW.hd[g].classList.toggle('ch',NW_SL.some(r=>r[5]===g&&NW.v[r[0]]!==WORLD_DEF[r[0]]));
  NW.def.hidden=!nwChosen();}
{const root=document.getElementById('nwSet');
 for(const [g,name] of NW_GROUPS){const h=document.createElement('button'),b=document.createElement('div');
   h.type='button';h.className='nw-g';h.textContent=name;h.setAttribute('aria-expanded','false');b.className='nw-s';b.hidden=true;b.id='nw_'+g;h.setAttribute('aria-controls',b.id);
   h.addEventListener('click',()=>{b.hidden=!b.hidden;h.setAttribute('aria-expanded',String(!b.hidden));try{titlePopPlace();}catch(e){}});
   NW.hd[g]=h;NW.box[g]=b;root.append(h,b);}
 for(const [k,name,lo,hi,st,g] of NW_SL){const id='nw_'+k,l=document.createElement('label'),i=document.createElement('input'),o=document.createElement('output');
   l.htmlFor=id;l.textContent=name;i.type='range';i.id=id;i.min=lo;i.max=hi;i.step=st;o.htmlFor=id;
   i.addEventListener('input',()=>{NW.v[k]=+(+i.value).toFixed(2);nwShow();});
   NW.box[g].append(l,i,o);NW.inp[k]=i;NW.out[k]=o;}
 NW.def=document.createElement('button');NW.def.type='button';NW.def.className='nw-def';NW.def.textContent='Defaults';
 NW.def.addEventListener('click',()=>{const f=document.activeElement===NW.def;NW.v=Object.assign({},WORLD_DEF);nwShow();if(f)padFocus(document.getElementById('confirmNo'));});
 root.append(NW.def);}
// ---- New world's seed: blank is a random one, a whole number is that seed, and any other text is turned into one, by
// arithmetic alone (FNV-1a over its characters) so every browser makes the same world from it. The World Generator's
// seed box (game/WorldGen/index.html, toSeed) does exactly the same, so a seed typed in either gives the same world ----
function seedFromText(t){t=String(t==null?'':t).trim();if(!t)return null;
  if(/^-?\d+$/.test(t)){const n=Number(t);if(Number.isSafeInteger(n))return n;}
  let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0)%1000000000;}
const nwSeedEl=document.getElementById('nwSeed');
// (typing in it mustn't reach the game's keys or the menu's; Enter makes the world, Esc goes back to the buttons)
nwSeedEl.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();document.getElementById('confirmYes').click();}
  else if(e.key==='Escape'){e.preventDefault();padFocus(document.getElementById('confirmNo'));}});
// (each time it's opened: the defaults again, the groups closed)
function nwOpen(){nwSeedEl.value='';NW.v=Object.assign({},WORLD_DEF);for(const [g] of NW_GROUPS){NW.box[g].hidden=true;NW.hd[g].setAttribute('aria-expanded','false');}nwShow();}
document.getElementById('newWorld').addEventListener('click',()=>{nwOpen();confirmEl.hidden=false;document.getElementById('confirmNo').focus();});
document.getElementById('confirmNo').addEventListener('click',()=>{confirmEl.hidden=true;});
document.getElementById('confirmYes').addEventListener('click',()=>{
  // (the settings chosen, if it was opened from New world; the Testing Environment's and anything else's get the defaults)
  const cfg=confirmEl.hidden?undefined:nwChosen(),sd=confirmEl.hidden?null:seedFromText(nwSeedEl.value);
  if(freshWorld([],undefined,cfg,sd))return;   // (a reload: everything worked out afresh for the new seed)
  confirmEl.hidden=true;TEST_OFF=new Set();seed=sd!=null?sd:(Math.random()*1e9)|0;worldCfgSet(cfg);noteQ.length=0;edits={};collapses={};craters=[];BB.jobs.length=0;BB.armed.length=0;wrecked={};destroyed={};destroyVer++;setDCache.clear();downFix.clear();falling.clear();chunkEdits.clear();clearBodies();clearWorld();
  for(const d of decals)d.visible=false;decalsDirty=true;for(const p of players)p.pool.visible=false;for(const s of scorches)s.visible=false;
  for(const c of cars){c.alive=false;c.g.visible=false;c.respawnT=1;}
  score=0;kills=0;rampReset();playTime=0;resetGoblins();
  // a fresh game: the first morning of day 1, an empty obituary, nothing burning
  tod=0.08;dayN=1;clockT=0;wxReset();STN.clear();for(const c of SVC)if(c.alive){c.alive=false;c.g.visible=false;c.svc=null;}fires.length=0;pendingBooms.length=0;boomedAt.clear();
  obits=[];obitTotal=0;obitSeed=seed;obitSel=0;try{localStorage.removeItem(OBIT_KEY);}catch(e){}renderObitCount();if(curTab==='obit')renderObits();
  for(const p of players)if(p.active)p.hp=20;
  try{localStorage.removeItem(POS_KEY);}catch(e){}playReset();
  boot();save();
});
// ---- every kind of structure the world builds, in groups (the Structures preview and the Testing Environment list them) ----
const TEST_GROUPS=[
  ['Town blocks',[['courthouse','Courthouses'],['tower','Office towers'],['mid','Mid-rise blocks'],['homes','Houses'],['shops','Little shops'],['park','Parks'],['plaza','Plazas'],['gas','Gas stations'],['food','Restaurants'],['fastfood','Fast food'],['fire','Fire stations'],['police','Police stations'],['build','Construction sites'],['wtower','Water towers'],['bell','Bell towers'],['church','Churches'],['cemetery','Cemeteries'],['library','Libraries'],['bank','Banks'],['news','TV news'],['radio','Radio stations'],['disco','Discos'],['club','Night clubs'],['court','Basketball courts'],['derelict','Derelict buildings'],['mansion','Mansions'],['trailers','Trailer parks'],['camp','Encampments'],['farmers',"Farmers' markets"],['nursery','Tree nurseries'],['dealer','Car dealers'],['armory','Armories'],['theater','Theatres'],['stocks','Stock exchange'],['datacenter','Data centers'],['electric','Electric company'],['lab','Goblin labs'],['jail','Jails']]],
  ['Big sites',[['hospital','Hospitals'],['garage','Car parks'],['mega','Mega-buildings'],['market','Supermarkets'],['drug','Drugstores'],['sitdown','Sit-down restaurants'],['mall','Malls'],['bigbox','Superstores'],['ikea','Furniture superstores'],['cathedral','Cathedrals'],['museum','Museums'],['aquarium','Aquariums'],['casino','Casinos'],['school','Schools'],['factory','Factories'],['cinema','Cinemas'],['stadium','Stadiums'],['arena','Arenas'],['campus','Universities'],['prison','Prisons'],['water','Water works'],['power','Power stations'],['nuclear','Nuclear plants'],['zoo','Zoos'],['studio','Film studios'],['theme','Theme parks'],['bigpark','Big parks'],['hood','Housing estates'],['capitol','The capitol']]],
  ['Countryside',[['farm','Farms'],['truckstop','Truck stops'],['dump','Garbage dumps'],['mine','Mines'],['quarry','Quarries'],['lumber','Lumber camps'],['campsite','Campsites'],['cult','Cult altars'],['wrecks','Abandoned cars'],['tower5g','5G towers'],['prepper','Prepper compounds'],['militia','Militia compounds'],['ruins','Ruins'],['thieves',"Thieves' hideouts"],['derricks','Oil fields'],['peat','Peat diggings'],['research','Research stations'],['safari','Safari lodges'],['stilts','Stilt villages'],['ski','Ski slopes'],['wind','Wind farms'],['airport','Airports'],['airfield','Airfields'],['nasa','Launch sites'],['base','Military bases'],['bunker','Bunkers'],['pylons','Power lines'],['billboards','Billboards'],['tolls','Toll plazas']]],
  ['Railways',[['rail','Railways'],['station','Train stations']]],
  ['Coast',[['sea','The ocean'],['beach','Beaches'],['harbor','Docks'],['yard','Shipping ports (coastal cities)'],['navy','Naval bases'],['lighthouse','Lighthouses'],['rig','Oil rigs'],['wreck','Shipwrecks']]],
  ['Underground',[['sewers','Sewers'],['subway','Subway'],['caves','Caves']]]];
