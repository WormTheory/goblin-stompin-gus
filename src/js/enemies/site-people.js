// ---- the people of the compounds and hideouts: real goblins the whole time (their own kinds: FOES), standing about,
// watching from the towers, at their posts. Come close, or hurt one, and the lot of them come for you ----
const FIG_STYLE={militia:{foe:'militia',rouse:30},prepper:{foe:'prepper',rouse:22},thieves:{foe:'thief',rouse:14}};
// where each kind of site keeps its people (site coordinates, and the height they stand at)
function sitePeople(B){
  if(B.kind==='militia')return [[5,5,G+11],[B.w*CELL-6,5,G+11],[5,B.h*CELL-6,G+11],[B.w*CELL-6,B.h*CELL-6,G+11],[31,6,G+1],[34,6,G+1],[24,37,G+1],[40,44,G+1],[20,22,G+1]];
  if(B.kind==='prepper')return [[56,7,G+10],[31.5,10,G+1],[16,25,G+1]];
  if(B.kind==='thieves')return [[16,9,G+1],[22,15,G+1],[11,8,G+1],[18,21,G+1]];
  return [];
}
function refreshSiteVenues(p,want){
  // the wind turbines' rotors: on every turbine whose tower is drawn as real blocks -- and only those: anywhere else the
  // distant scenery's turbine is showing, with blades of its own, standing still
  {const R=Math.max(150,viewR*CS+40);
   for(let px=Math.floor((p.pos.x-R)/CELL);px<=Math.floor((p.pos.x+R)/CELL);px++)for(let pz=Math.floor((p.pos.z-R)/CELL);pz<=Math.floor((p.pos.z+R)/CELL);pz++){
    if(!tenvShow(px,pz)||!turbineAt(px,pz)||!meshes.has(ckey(Math.floor((px*CELL+16)/CS),Math.floor((pz*CELL+16)/CS)))&&!stHas(px*CELL+16,pz*CELL+16))continue;const key='w'+px+','+pz;want.add(key);if(!venues.has(key)){const g=makeRotor();g.position.set(px*CELL+16,G+41.9,pz*CELL+12.6);scene.add(g);
      venues.set(key,{kind:'wind',rotor:g,sp:0.55+hash2(Math.floor(px/7),Math.floor(pz/7))*0.4,ck:ckey(Math.floor((px*CELL+16)/CS),Math.floor((pz*CELL+16)/CS))});}}}
  for(let px=Math.floor((p.pos.x-150)/CELL);px<=Math.floor((p.pos.x+150)/CELL);px++)for(let pz=Math.floor((p.pos.z-150)/CELL);pz<=Math.floor((p.pos.z+150)/CELL);pz++){
    if(biomeOf(px,pz)!=='plains'||!tenvShow(px,pz))continue;
    const B=bigPlainsAt(px,pz);if(!B||B.ax!==px||B.az!==pz||!FIG_STYLE[B.kind])continue;
    const key='g'+px+','+pz;want.add(key);if(venues.has(key))continue;
    const posts=sitePeople(B).map(([u,v,y],i)=>({x:B.ax*CELL+u+0.5,z:B.az*CELL+v+0.5,y,h0:hash2(px+i,pz*3+i)*6.28}));
    venues.set(key,{kind:'guards',style:B.kind,foe:FIG_STYLE[B.kind].foe,posts,slots:posts.map(()=>null),slain:posts.map(()=>false),cx:B.ax*CELL+B.w*CELL/2,cz:B.az*CELL+B.h*CELL/2,roused:false,awayT:0});}
  // the military bases' armour (see armyVenue)
  for(let px=Math.floor((p.pos.x-300)/CELL);px<=Math.floor((p.pos.x+300)/CELL);px++)for(let pz=Math.floor((p.pos.z-300)/CELL);pz<=Math.floor((p.pos.z+300)/CELL);pz++){
    if(biomeOf(px,pz)!=='plains'||!tenvShow(px,pz))continue;
    const B=bigPlainsAt(px,pz);if(!B||B.ax!==px||B.az!==pz||B.kind!=='base')continue;
    const key='m'+px+','+pz;want.add(key);if(!venues.has(key))venues.set(key,armyVenue(B));}
}
function updateSiteVenue(V,dt,t){
  if(V.kind==='wind'){V.rotor.rotation.z+=dt*V.sp;V.rotor.visible=meshes.has(V.ck);return;}   // (hidden the moment its tower drops back to the distant scenery)
  const me=players.find(q=>q.active);let dmin=1e9;if(me)for(const F of V.posts)dmin=Math.min(dmin,Math.hypot(me.pos.x-F.x,me.pos.z-F.z));
  // who's still at their post (as at the cult altars: gone home leaves a place to fill, killed stays dead a while)
  for(let i=0;i<V.slots.length;i++){const g=V.slots[i];if(!g)continue;
    if(g.homeV!==V||g.state==='wait'){V.slots[i]=null;continue;}
    if(g.state==='dead'){V.slain[i]=true;V.slots[i]=null;g.homeV=null;}}
  if(V.roused){if(dmin>110){V.awayT+=dt;if(V.awayT>120){V.roused=false;V.slain.fill(false);}}else V.awayT=0;return;}
  // at their posts whenever you're near enough to see them
  if(me&&playing&&dmin<70)for(let i=0;i<V.posts.length;i++){if(V.slots[i]||V.slain[i])continue;
    const F=V.posts[i],g=freeFoe(V.foe);if(!g)break;foeSpawn(g,V.foe,V,i);g.pos.set(F.x,F.y,F.z);g.heading=F.h0;V.slots[i]=g;}
  // too close (and seen): they come for you
  if(me&&playing&&dmin<FIG_STYLE[V.style].rouse&&!calmNow())siteRouse(V);
}
