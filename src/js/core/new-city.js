// ---------- New city & boot ----------
const confirmEl=document.getElementById('confirm');
// full screen: the whole page, toggled; the button says which way it will go
{const fb=document.getElementById('fullBtn'),fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
 const showFs=()=>{fb.textContent=fsEl()?'Exit full screen':'Full screen';};
 const can=document.fullscreenEnabled||document.webkitFullscreenEnabled;if(!can)fb.hidden=true;
 fb.addEventListener('click',()=>{try{if(fsEl()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);}else{const el=document.documentElement,rq=el.requestFullscreen||el.webkitRequestFullscreen;const pr=rq&&rq.call(el);if(pr&&pr.catch)pr.catch(()=>{});}}catch(e){}});
 document.addEventListener('fullscreenchange',()=>{showFs();setTimeout(()=>{try{resize();}catch(e){}},50);});document.addEventListener('webkitfullscreenchange',showFs);showFs();}
document.getElementById('newWorld').addEventListener('click',()=>{confirmEl.hidden=false;document.getElementById('confirmNo').focus();});
document.getElementById('confirmNo').addEventListener('click',()=>{confirmEl.hidden=true;});
document.getElementById('confirmYes').addEventListener('click',()=>{
  if(freshWorld([]))return;   // (a reload: everything worked out afresh for the new seed)
  confirmEl.hidden=true;TEST_OFF=new Set();seed=(Math.random()*1e9)|0;noteQ.length=0;edits={};collapses={};wrecked={};destroyed={};destroyVer++;setDCache.clear();downFix.clear();falling.clear();chunkEdits.clear();clearBodies();clearWorld();
  for(const d of decals)d.visible=false;decalsDirty=true;for(const p of players)p.pool.visible=false;for(const s of scorches)s.visible=false;
  for(const c of cars){c.alive=false;c.g.visible=false;c.respawnT=1;}
  score=0;kills=0;playTime=0;resetGoblins();
  // a fresh game: the first morning of day 1, an empty obituary, nothing burning
  tod=0.08;dayN=1;clockT=0;wxReset();STN.clear();for(const c of SVC)if(c.alive){c.alive=false;c.g.visible=false;c.svc=null;}fires.length=0;pendingBooms.length=0;boomedAt.clear();
  obits=[];obitTotal=0;obitSeed=seed;obitSel=0;try{localStorage.removeItem(OBIT_KEY);}catch(e){}renderObitCount();if(curTab==='obit')renderObits();
  for(const p of players)if(p.active)p.hp=20;
  try{localStorage.removeItem(POS_KEY);}catch(e){}
  boot();save();
});
// ---- every kind of structure the world builds, in groups (the Structures preview and the Testing Environment list them) ----
const TEST_GROUPS=[
  ['Town blocks',[['courthouse','Courthouses'],['tower','Office towers'],['mid','Mid-rise blocks'],['homes','Houses'],['shops','Little shops'],['park','Parks'],['plaza','Plazas'],['gas','Gas stations'],['food','Restaurants'],['fastfood','Fast food'],['fire','Fire stations'],['police','Police stations'],['build','Construction sites'],['wtower','Water towers'],['bell','Bell towers'],['church','Churches'],['cemetery','Cemeteries'],['library','Libraries'],['bank','Banks'],['news','TV news'],['radio','Radio stations'],['disco','Discos'],['club','Night clubs'],['court','Basketball courts'],['derelict','Derelict buildings'],['mansion','Mansions'],['trailers','Trailer parks'],['camp','Encampments'],['farmers',"Farmers' markets"],['nursery','Tree nurseries'],['dealer','Car dealers'],['armory','Armories'],['theater','Theatres'],['stocks','Stock exchange'],['datacenter','Data centers'],['electric','Electric company'],['lab','Goblin labs'],['jail','Jails']]],
  ['Big sites',[['hospital','Hospitals'],['garage','Car parks'],['mega','Mega-buildings'],['market','Supermarkets'],['drug','Drugstores'],['sitdown','Sit-down restaurants'],['mall','Malls'],['bigbox','Superstores'],['ikea','Furniture superstores'],['cathedral','Cathedrals'],['museum','Museums'],['aquarium','Aquariums'],['casino','Casinos'],['school','Schools'],['factory','Factories'],['cinema','Cinemas'],['stadium','Stadiums'],['arena','Arenas'],['campus','Universities'],['prison','Prisons'],['water','Water works'],['power','Power stations'],['nuclear','Nuclear plants'],['zoo','Zoos'],['studio','Film studios'],['theme','Theme parks'],['bigpark','Big parks'],['hood','Housing estates'],['capitol','The capitol']]],
  ['Countryside',[['farm','Farms'],['truckstop','Truck stops'],['dump','Garbage dumps'],['mine','Mines'],['quarry','Quarries'],['lumber','Lumber camps'],['campsite','Campsites'],['cult','Cult altars'],['wrecks','Abandoned cars'],['tower5g','5G towers'],['prepper','Prepper compounds'],['militia','Militia compounds'],['ruins','Ruins'],['thieves',"Thieves' hideouts"],['wind','Wind farms'],['airport','Airports'],['nasa','Launch sites'],['base','Military bases'],['bunker','Bunkers'],['pylons','Power lines'],['billboards','Billboards'],['tolls','Toll plazas']]],
  ['Railways',[['rail','Railways'],['station','Train stations']]],
  ['Coast',[['sea','The ocean'],['beach','Beaches'],['harbor','Docks'],['yard','Shipping ports (coastal cities)'],['navy','Naval bases'],['lighthouse','Lighthouses'],['rig','Oil rigs'],['wreck','Shipwrecks']]],
  ['Underground',[['sewers','Sewers'],['subway','Subway'],['caves','Caves']]]];
