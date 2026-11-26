// ---------- seasons, weather and the moon ----------
// The year: four 30-day seasons. Each season has its own odds for the weather; a spell lasts a third of a day to a
// day, and everything (cloud, darkness, fog, rain, snow, wind, storms) eases from one spell into the next.
// (fog: how far you can see, as a share of the plain view; renderView turns it into blocks, see wxFogFar)
const SEASONS=['Spring','Summer','Autumn','Winter'],SEASON_LEN=30,MOON_LEN=30;
const WX_TYPES={
  clear:{n:'Clear',i:'☀️',cover:0.05,wind:0.4},
  partly:{n:'Partly cloudy',i:'⛅',cover:0.45,wind:0.6},
  cloudy:{n:'Cloudy',i:'☁️',cover:0.85,dark:0.22,fog:0.9,wind:0.7},
  foggy:{n:'Foggy',i:'🌫️',cover:0.6,dark:0.14,fog:0.28,wind:0.15},
  lrain:{n:'Light rain',i:'🌦️',cover:0.85,dark:0.26,fog:0.85,rain:0.3,wind:0.8},
  rain:{n:'Rain',i:'🌧️',cover:0.95,dark:0.38,fog:0.7,rain:0.65,wind:1.1},
  hrain:{n:'Heavy rain',i:'🌧️',cover:1,dark:0.5,fog:0.52,rain:1,wind:1.6},
  storm:{n:'Thunderstorm',i:'⛈️',cover:1,dark:0.62,fog:0.58,rain:1,wind:2.2,storm:1},
  lsnow:{n:'Light snow',i:'🌨️',cover:0.85,dark:0.2,fog:0.8,snow:0.3,wind:0.6},
  snow:{n:'Snow',i:'❄️',cover:0.95,dark:0.3,fog:0.6,snow:0.65,wind:0.9},
  blizzard:{n:'Blizzard',i:'🌨️',cover:1,dark:0.42,fog:0.26,snow:1,wind:3.6},
  // (the regional kinds: wxLocal picks them for a place, never for the whole world, though the debug menu can)
  sand:{n:'Sandstorm',i:'🌪️',cover:0.5,dark:0.3,fog:0.24,wind:3.2,dust:1,reg:1},
  dust:{n:'Dusty',i:'🌬️',cover:0.1,fog:0.72,wind:1.3,dust:0.35,devil:1,reg:1},
  haze:{n:'Humid haze',i:'🌫️',cover:0.5,dark:0.08,fog:0.5,wind:0.2,haze:1,reg:1}};
const WX_KEYS=['cover','dark','fog','rain','snow','wind','storm','dust','haze'],WX_DEF={cover:0,dark:0,fog:1,rain:0,snow:0,wind:0.5,storm:0,dust:0,haze:0};
// the odds of each kind of weather, season by season
const WX_ODDS=[
  {clear:3,partly:4,cloudy:2,foggy:1.5,lrain:3,rain:2.5,hrain:1,storm:1,lsnow:0.3},
  {clear:6,partly:4,cloudy:1,foggy:0.4,lrain:1.5,rain:1,hrain:0.8,storm:2},
  {clear:2,partly:3,cloudy:3,foggy:2.5,lrain:2.5,rain:2,hrain:1,storm:0.5,lsnow:0.5},
  {clear:1.5,partly:2,cloudy:3,foggy:2,lrain:0.5,rain:0.3,lsnow:3,snow:2.5,blizzard:1.2}];
const WX={snowClock:1,type:'clear',until:1,k:Object.assign({},WX_DEF,{cover:0.05,wind:0.4}),wet:0,snowCover:0,snowP:1,snowC:0.8,snowW:0,flash:0,boltT:6,thunder:[]};
const seasonOf=()=>Math.floor((dayN-1)/SEASON_LEN)%4,seasonDay=()=>(dayN-1)%SEASON_LEN+1,gameDays=()=>dayN-1+tod;
const moonPhase=()=>((dayN-1+tod)/MOON_LEN)%1;   // 0 new, 0.5 full
const MOON_NAMES=[['New moon','🌑'],['Waxing crescent','🌒'],['First quarter','🌓'],['Waxing gibbous','🌔'],['Full moon','🌕'],['Waning gibbous','🌖'],['Last quarter','🌗'],['Waning crescent','🌘']];
const moonInfo=()=>MOON_NAMES[Math.round(moonPhase()*8)%8];
function wxPick(se){const O=WX_ODDS[se];let tot=0;for(const k in O)tot+=O[k];let u=Math.random()*tot;for(const k in O){if(u<O[k])return k;u-=O[k];}return'partly';}
function wxSet(type,now){WX.type=type;WX.until=gameDays()+0.3+Math.random()*0.7;if(now){const T=WX_TYPES[type];for(const k of WX_KEYS)WX.k[k]=T[k]??WX_DEF[k];WX.snap=true;}}
function wxReset(){WX.frozen=false;freezeQ.length=0;FZ.keys.length=0;wxSet('clear',true);WX.until=1;   // day 1 is always a clear spring day
 WX.wet=WX.k.rain>0.2?0.6:0;WX.snowCover=seasonOf()===3&&WX.k.snow>0?0.5:0;WX.flash=0;WX.thunder.length=0;
 WX.snowP=1;WX.snowC=0.8;WX.snowW=0;WX.snowClock=Math.max(1,WX.snowClock);}
// ---------- weather by region ----------
// The world has one spell of weather at a time (WX.type, eased into WX.k, the same for everyone online); what it is
// where you are comes from the climate there (wxLocal): rain falls as snow in the cold and high on the mountains, and
// not at all in the desert, where a storm is a sandstorm and a clear day sometimes one too; the savanna's clear days
// are dusty, with dust devils; moors and swamps fog over; the rainforest pours, and steams in a humid haze between.
// A pure function of the spell, the season and the place, so host and guest agree without sending anything more. Each
// player's own weather eases toward it (p.wxk), and each view is drawn in its player's (WXK, renderView); the sky's
// light and the sounds follow the first player's.
const WX_RAIN={lrain:'lsnow',rain:'snow',hrain:'snow',storm:'blizzard'},WX_SNOW={lsnow:'lrain',snow:'rain',blizzard:'storm'};
const WX_SEAS=[0,0.06,0,-0.08];   // (how much warmer or colder each season makes a place, for whether it rains or snows)
const WX_COLD=0.3,WX_WARM=0.56;   // (below, rain comes down as snow; above, snow as rain)
const wxSeed=()=>hash2(Math.floor(WX.until*4096),9203);
function wxLocalOf(type,t,bk,cold){
  if(!WX_TYPES[type]||WX_TYPES[type].reg)return type;   // (one the debug menu put everywhere)
  const s=wxSeed();
  if(cold||t<WX_COLD||bk==='ice'||bk==='tundra'&&seasonOf()!==1){   // (the tundra's summer rains)
   let k=WX_RAIN[type]||type;
    if(bk==='ice'){if(k==='snow'&&s<0.45)k='blizzard';else if(k==='foggy'&&s<0.5)k='lsnow';}
    return k;}
  if(bk==='desert'||bk==='badlands'){
    if(type==='storm'||type==='hrain'||type==='blizzard')return s<0.2?'rain':'sand';   // (now and then a cloudburst)
    if(type==='rain'||type==='snow')return'cloudy';if(type==='lrain'||type==='lsnow')return'partly';if(type==='foggy')return'clear';
    if((type==='clear'||type==='partly')&&s<0.12)return'sand';
    return type;}
  if(t>WX_WARM)type=WX_SNOW[type]||type;
  if(bk==='savanna'||bk==='scrub'){if(type==='foggy')return'partly';if((type==='clear'||type==='partly')&&s<(bk==='savanna'?0.35:0.2))return'dust';return type;}
  if(bk==='rainforest'){if(type==='lrain')return'rain';if(type==='rain')return'hrain';
    if(type==='clear'||type==='partly'||type==='cloudy'||type==='foggy')return s<0.55?'haze':type==='clear'?'partly':type;return type;}
  if(bk==='swamp'||bk==='moor'){if(type==='clear'&&s<0.3||type==='partly'&&s<0.4||type==='cloudy'&&s<0.6)return'foggy';return type;}
  return type;
}
// the weather at (x,z) and height y: by the climate there (the biome's own, not dithered), cold high on a mountain
// (within 25 of where the snow lies), remembered per 64 blocks and 16 of height while the spell and season last
const WX_LC=new Map();let wxLcKey='';
function wxLocal(x,z,y){
  if(TENV)return WX.type;   // (the Testing Environment's flat ground has no climate of its own)
  const key=WX.type+WX.until+'/'+seasonOf();if(key!==wxLcKey){wxLcKey=key;WX_LC.clear();}
  const cx=Math.floor(x/64),cz=Math.floor(z/64),cy=Math.max(0,Math.floor(((y||G)-G)/16)),ck=colKey(cx,cz)*64+Math.min(63,cy);
  let k=WX_LC.get(ck);if(k)return k;
  const c=climAt(cx*64+32,cz*64+32),t=c.t,bk=BIOMES[bioPick(t,c.m,cx*64+32,cz*64+32)].k,cold=cy*16+8>rlfSnow(t)-25;
  k=wxLocalOf(WX.type,t+WX_SEAS[seasonOf()],bk,cold);if(WX_LC.size>4096)WX_LC.clear();WX_LC.set(ck,k);return k;
}
// the snow lying at (x,z,y): the bands' (polar, cold, temperate, warm; WX.snowCover is the temperate one, as it always
// was) blended by the temperature there, lower up a mountain, as the ground's shader does (snowHere)
const coldLapse=h=>Math.max(0,h-50)*0.0085;
function snowBand(t){const P=WX.snowP,C=WX.snowC,T=WX.snowCover,Wm=WX.snowW,cl=v=>Math.max(0,Math.min(1,v));
  return t<0.28?P+(C-P)*cl((t-0.1)/0.18):t<0.5?C+(T-C)*cl((t-0.28)/0.1):T+(Wm-T)*cl((t-0.5)/0.12);}
const PERMA_SNOW={tundra:0.8,ice:0.95};   // (snow lying all year round, whatever the weather: tundra roofs stay white)
// (lower up a mountain, by the height asked about, but only out in the wilds: a tower in town is no colder at the top)
function snowAt(x,z,y){if(TENV)return WX.snowCover;const up=y>G+50&&realmOf(Math.floor(x/CELL),Math.floor(z/CELL))==='plains'?y-G:0,c=climAt(x,z),t=c.t-coldLapse(up);return Math.max(PERMA_SNOW[BIOMES[bioPick(c.t,c.m,Math.floor(x),Math.floor(z))].k]||0,snowBand(t));}
const snowMax=()=>Math.max(WX.snowP,WX.snowC,WX.snowCover,WX.snowW);
// the bands' snow over time: what the spell drops at each band's temperature (snow where it's cold enough, rain where
// it's warm), settling at the usual rate; melting never in the polar band, slowly down to a white covering in the cold
// one (to a white covering through winter, half that in spring and autumn, all of it over summer: the tundra's and ice
// fields' own snow, which never goes, is the cold map's, PERMA_SNOW), as before in the temperate one and fast in the warm one
const WX_BAND_T=[0.1,0.28,0.5,0.72];
function wxBands(dt){
  const sd=WX_SEAS[seasonOf()],S=WX.k.snow,R=WX.k.rain;let most=0;
  const fall=tb=>{const te=tb+sd;return te<WX_COLD?S+R:te>WX_WARM?0:S;},rain=tb=>{const te=tb+sd;return te<WX_COLD?0:te>WX_WARM?S+R:R;};
  const step=(v,i,melt,floor)=>{const f=fall(WX_BAND_T[i]);if(f>0.08){most=Math.max(most,f);return Math.min(1,v+dt*f/70);}
    return Math.max(floor,v-(melt?dt/melt*(rain(WX_BAND_T[i])>0.1?3:1):0));};
  WX.snowP=step(WX.snowP,0,0,0.92);WX.snowC=step(WX.snowC,1,900,[0.4,0,0.4,0.8][seasonOf()]);WX.snowW=step(WX.snowW,3,40,0);
  if(S>0.08)most=Math.max(most,S);
  return most;
}
// the cold map (COLD, meshing.js): each 16-block cell's temperature (lower on the mountains, by landTop near the
// players) and how wet its ground gets, filled nearest first round every viewer, a little each frame, and sent up to
// the graphics card a few times a second while it's changing
const COLD_KX=new Int32Array(COLD_N*COLD_N).fill(-2147483648),COLD_KZ=new Int32Array(COLD_N*COLD_N),COLD_Q=new Uint8Array(COLD_N*COLD_N);
const COLD_R0=24,COLD_R1=110,COLD_ORD=(()=>{const L=[];for(let dz=-COLD_R1;dz<=COLD_R1;dz++)for(let dx=-COLD_R1;dx<=COLD_R1;dx++){const d=dx*dx+dz*dz;if(d<=COLD_R1*COLD_R1)L.push([d,dx,dz]);}
  L.sort((a,b)=>a[0]-b[0]);const o=new Int16Array(L.length*2);L.forEach((e,i)=>{o[i*2]=e[1];o[i*2+1]=e[2];});return o;})();
const COLD_WET={desert:0,badlands:0,savanna:0.6,scrub:0.6,rainforest:1.3,swamp:1.3,ice:0};
const COLD_V=[];let coldDirty=false,coldSent=0,coldSeed=null;
function coldCell(cx,cz,near){
  if(TENV)return;const x=cx*COLD_S+8,z=cz*COLD_S+8,c=climAt(x,z),t0=c.t,m=c.m,bk=BIOMES[bioPick(t0,m,x,z)].k;
  const h=near&&!TENV?landTop(x,z)-G-1:0,t=t0-coldLapse(h),i=(((cz%COLD_N)+COLD_N)%COLD_N*COLD_N+((cx%COLD_N)+COLD_N)%COLD_N)*4;
  COLD[i]=Math.round(Math.max(0,Math.min(1,t))*255);COLD[i+1]=Math.round(Math.min(2,COLD_WET[bk]??1)/2*255);COLD[i+2]=Math.round((PERMA_SNOW[bk]||0)*255);coldDirty=true;
}
function coldTick(){
  {const sk=seed+'/'+!!TENV+JSON.stringify(WORLD_CFG);if(coldSeed!==sk){coldSeed=sk;COLD_KX.fill(-2147483648);for(let i=0;i<COLD.length;i+=4){COLD[i]=128;COLD[i+1]=128;COLD[i+2]=0;}coldDirty=true;COLD_V.length=0;}}
  const t0=performance.now();let vi=0;
  for(const p of players){if(!p.active)continue;
    const V=COLD_V[vi]||(COLD_V[vi]={cx:1e9,cz:1e9,i:0});vi++;
    const px=Math.floor(pwx(p)/COLD_S),pz=Math.floor(pwz(p)/COLD_S);if(Math.abs(px-V.cx)>3||Math.abs(pz-V.cz)>3){V.cx=px;V.cz=pz;V.i=0;}const cx=V.cx,cz=V.cz;   // (moved 64 blocks: round again from the middle)
    for(let n=0;n<3000&&V.i<COLD_ORD.length;n++,V.i++){
      const dx=COLD_ORD[V.i*2],dz=COLD_ORD[V.i*2+1],x=cx+dx,z=cz+dz,near=dx*dx+dz*dz<=COLD_R0*COLD_R0?2:1;
      const s=((z%COLD_N)+COLD_N)%COLD_N*COLD_N+((x%COLD_N)+COLD_N)%COLD_N;
      if(COLD_KX[s]===x&&COLD_KZ[s]===z&&COLD_Q[s]>=near)continue;
      coldCell(x,z,near===2);COLD_KX[s]=x;COLD_KZ[s]=z;COLD_Q[s]=near;
      if(performance.now()-t0>0.5)break;}
    if(performance.now()-t0>0.5)break;}
  if(coldDirty&&wxClock-coldSent>0.3){coldDirty=false;coldSent=wxClock;COLD_TEX.needsUpdate=true;}
}
// the weather being drawn: the first player's outside renderView, each view's own inside it
let WXK=WX.k;
function wxPlayers(dt,r){
  let main=null;
  for(const p of players){if(!p.active)continue;
    p.wxAt=(p.wxAt||0)-dt;if(p.wxAt<=0||!p.wxL||WX.snap){p.wxAt=0.5;p.wxL=wxLocal(pwx(p),pwz(p),p.pos.y);}
    const tg=WX_TYPES[p.wxL]||WX_TYPES.partly;
    if(!p.wxk||WX.snap){p.wxk={};for(const k of WX_KEYS)p.wxk[k]=tg[k]??WX_DEF[k];}
    else for(const k of WX_KEYS)p.wxk[k]+=((tg[k]??WX_DEF[k])-p.wxk[k])*r;
    if(!main)main=p;}
  WX.snap=false;WXK=main?main.wxk:WX.k;
}
const wxHere=()=>{for(const p of players)if(p.active&&p.wxL)return p.wxL;return WX.type;};   // (the first player's, for the Info pane)
// dust devils: a whirl of dust wandering across the savanna (or the scrub) on a dusty day, now and then, near a player.
// Each is a funnel of its own: DEVIL_N boxes of dust in a mesh of their own (so they never run short, as the shared
// pool of puffs did), spiralling up a column 14 to 22 high that widens and leans with the wind, faded in and out, with a
// skirt of puffs kicked up round its foot
const DEVILS=[],DEVIL_N=150,DEVIL_MAX=4;
const devilM=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xc4a074,transparent:true,opacity:0.5,depthWrite:false}),DEVIL_N*DEVIL_MAX);
devilM.count=0;devilM.frustumCulled=false;devilM.renderOrder=2;scene.add(devilM);   // (filled here, but drawn sorted in with the smoke by seeDraw)
let devilT=0;const _dm=new THREE.Matrix4(),_dq=new THREE.Quaternion(),_dv=new THREE.Vector3(),_ds=new THREE.Vector3(),_dax=new THREE.Vector3(0,1,0);
function devilTick(dt){
  for(const p of players){if(!p.active||!p.wxL||!WX_TYPES[p.wxL].devil||p.pos.y>G+40)continue;
    if(DEVILS.length<2&&Math.random()<dt*0.08){const a=Math.random()*Math.PI*2,r=25+Math.random()*35,x=pwx(p)+Math.cos(a)*r,z=pwz(p)+Math.sin(a)*r;
      DEVILS.push({x,z,y:landTop(x,z),t:10+Math.random()*8,a:Math.random()*Math.PI*2,s:0,H:14+Math.random()*8,t0:0});}}
  const w=windNow();devilT+=dt;let n=0;
  for(let i=DEVILS.length-1;i>=0;i--){const D=DEVILS[i];D.t-=dt;D.t0=(D.t0||0)+dt;if(D.t<=0){DEVILS.splice(i,1);continue;}
    if(!D.still){D.x+=(w.x*1.5+Math.sin(D.a)*1.2)*dt;D.z+=(w.z*1.5+Math.cos(D.a)*1.2)*dt;}D.a+=dt*0.4;}
  // (the funnels: each box on its own turn of the spiral, rising and coming round again, smaller and fainter up top)
  const L=WORLD_LIGHT.value;devilM.material.color.setRGB(0.77*Math.max(0.12,L.r),0.63*Math.max(0.12,L.g),0.45*Math.max(0.12,L.b));
  for(let d=0;d<DEVILS.length&&d<DEVIL_MAX;d++){const D=DEVILS[d],k=Math.min(1,D.t/2.5,D.t0/1.5),H=(D.H||16)*(0.4+0.6*k);
    for(let j=0;j<DEVIL_N;j++){const s=(j*0.618034)%1,u=(s+devilT*0.12)%1,h=u*H,rr=(0.5+h*0.16+h*h*0.004)*(0.85+0.3*((j*0.37)%1)),an=j*2.39996+devilT*(4.2-u*1.8);
      _dv.set(D.x+Math.cos(an)*rr+w.x*h*0.12,D.y+0.4+h,D.z+Math.sin(an)*rr+w.z*h*0.12);
      const sz=(0.9+h*0.06)*k*(u<0.08?u/0.08:u>0.85?(1-u)/0.15:1);_ds.set(sz,sz,sz);_dq.setFromAxisAngle(_dax,an);_dm.compose(_dv,_dq,_ds);devilM.setMatrixAt(n++,_dm);}
    D.s-=dt;if(D.s>0)continue;D.s=0.12;
    {const an=Math.random()*Math.PI*2,rr=1+Math.random()*1.5,P=takePart();
    P.kind=2;P.life=1+Math.random()*0.5;P.m.material.color.setHex(Math.random()<0.5?0x9c7c56:0x8a6c4a);
    P.m.position.set(D.x+Math.cos(an)*rr,D.y+0.3,D.z+Math.sin(an)*rr);P.v.set(-Math.sin(an)*4*k,0.6+Math.random(),Math.cos(an)*4*k);}}
  devilM.count=n;if(n)devilM.instanceMatrix.needsUpdate=true;
}
// precipitation: streaks of rain or flakes of snow in a box round the camera, fixed in the world as you move through it
const PRECIP_N=2400,PBX=24,PBY=28;
const rainM=new THREE.InstancedMesh(new THREE.BoxGeometry(0.035,0.9,0.035),new THREE.MeshBasicMaterial({color:0xa9b9cc,transparent:true,opacity:0.5,depthWrite:false}),PRECIP_N);
const snowM=new THREE.InstancedMesh(new THREE.BoxGeometry(0.14,0.14,0.14),new THREE.MeshBasicMaterial({color:0xf2f6ff,transparent:true,opacity:0.92}),PRECIP_N);
for(const m of [rainM,snowM]){m.frustumCulled=false;m.count=0;m.renderOrder=2;scene.add(m);}
// (unlit, so they're darkened by hand with the world's light, as the blocks are: grey at dusk, dim at night, never black)
const RAIN_C=new THREE.Color(0xa9b9cc),SNOW_C=new THREE.Color(0xf2f6ff),DUST_C=new THREE.Color(0xb8976a),HAZE_C=new THREE.Color(0xc9cbb4);
// (a sandstorm's grains of dust, blown along)
const dustM=new THREE.InstancedMesh(new THREE.BoxGeometry(0.06,0.06,0.06),new THREE.MeshBasicMaterial({color:0xc8a070,transparent:true,opacity:0.75}),PRECIP_N);dustM.count=0;dustM.frustumCulled=false;scene.add(dustM);
const drops=[];{const r=mulberry(4711);for(let i=0;i<PRECIP_N;i++)drops.push({x:r()*PBX*2,y:r()*PBY,z:r()*PBX*2,s:r()});}
const _pm=new THREE.Matrix4(),_pq=new THREE.Quaternion(),_pv=new THREE.Vector3(),_ps=new THREE.Vector3(1,1,1),_pa=new THREE.Vector3();let wxClock=0;
const wrapC=(v,c,h)=>c+((((v-c+h)%(2*h))+2*h)%(2*h))-h;
// each view's camera velocity, smoothed: a rain streak lies along the drop's motion as that camera sees it, so moving
// fast (running, driving, flying) tips the streaks towards you as the rain sweeps past. A jump (a teleport, a ship's
// pocket), a long stall or a pause counts as standing still
const PRECIP_CV=[],_pUp=new THREE.Vector3(0,1,0);
function precipCamVel(cam,who){
  const now=performance.now()/1000,C=PRECIP_CV[who||0]||(PRECIP_CV[who||0]={x:cam.x,y:cam.y,z:cam.z,t:now,vx:0,vy:0,vz:0}),dt=now-C.t;
  if(dt>1e-4){const vx=(cam.x-C.x)/dt,vy=(cam.y-C.y)/dt,vz=(cam.z-C.z)/dt;
    if(!playing||dt>0.3||vx*vx+vy*vy+vz*vz>400*400)C.vx=C.vy=C.vz=0;
    else{const k=1-Math.exp(-dt/0.12);C.vx+=(vx-C.vx)*k;C.vy+=(vy-C.vy)*k;C.vz+=(vz-C.vz)*k;}
    C.x=cam.x;C.y=cam.y;C.z=cam.z;C.t=now;}
  return C;
}
// the cover map: for each column in a square round the camera, the height of the highest solid block, and which blocks
// are solid from 12 below the camera to 36 above (sol, a byte each: rain coming in at a slant through a gap in a roof
// carries on under it), refreshed as you move
// (64 across: the drops reach PBX either side of the camera, the map's only made again once the camera's moved 4, and a
// drop near the edge is followed back up its slant a few blocks further out still; at 44 the outermost drops weren't
// looked at, so rain fell through roofs some 20 blocks off)
const COVER_N=64,COVER_NY=49,mkCover=()=>({N:COVER_N,x0:0,z0:0,y0:0,y1:-1,top:new Int16Array(COVER_N*COVER_N),sol:new Uint8Array(COVER_N*COVER_N*COVER_NY),t:-1,cx:1e9,cz:1e9,cy:0,under:false}),COVERS=[mkCover(),mkCover()];let COVER=COVERS[0];
function coverMap(cam,who){
  const C=COVER=COVERS[who||0],cx=Math.floor(cam.x),cz=Math.floor(cam.z);
  if(Math.abs(cx-C.cx)<4&&Math.abs(cz-C.cz)<4&&Math.abs(cam.y-C.cy)<4&&wxClock-C.t<1.5)return;   // (up or down too: a lift, a climb, a helicopter)
  C.cx=cx;C.cz=cz;C.cy=cam.y;C.t=wxClock;C.x0=cx-(C.N>>1);C.z0=cz-(C.N>>1);
  const yHi=Math.min(H-1,Math.floor(cam.y)+36),yLo=Math.max(1,Math.floor(cam.y)-12);
  C.y0=yLo;C.y1=yHi;const N=C.N,NN=N*N,sol=C.sol;sol.fill(0);
  // (straight from each column's chunk, not a get() a block: some 90,000 of them)
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=C.x0+i,z=C.z0+j,qx=Math.floor(x/CS),qz=Math.floor(z/CS),a=chunkArr(qx,qz),lx=x-qx*CS,lz=z-qz*CS;let top=-1;
    for(let y=yHi;y>=yLo;y--){const b=a[li(lx,y,lz)];if(b&&b!==WATER&&!(b===LEAVES&&leafDown(x,y,z))){if(top<0)top=y+1;sol[(y-yLo)*NN+j*N+i]=1;}}C.top[j*N+i]=top;}
  C.under=C.top[(cz-C.z0)*C.N+(cx-C.x0)]>cam.y+1.2;C.v=(C.v||0)+1;
}
// the wind's shadow: rain and snow blown at a slant come in at a slant, so a drop is under cover if anything solid lies
// back along its path, not just straight overhead (the lee of a wall, the far side of an overhang, a room with only a
// door open to the wind). For each column of the cover map, the height below which nothing falling at that slant can
// reach: the highest of each column back up the slope less how far it climbed to get there. Worked out once for the
// whole map (only when the map's refreshed or the slant has turned), so a drop out in the open costs one look-up; one
// below that height is followed back up its slant through the solid blocks (precipHid), so rain through a gap in a roof
// or a window falls on in under it.
// (sx,sz: how far a drop moves sideways per block it falls; capped at 2, a blizzard's flakes near flat)
const PRECIP_SHADE=[];
function shadeMap(who,kind,sx,sz){
  const C=COVER,K=(PRECIP_SHADE[who||0]||(PRECIP_SHADE[who||0]={}))[kind]||(PRECIP_SHADE[who||0][kind]={v:-1,sx:0,sz:0,S:new Float32Array(C.N*C.N)});
  const m=Math.hypot(sx,sz);if(m>2){sx*=2/m;sz*=2/m;}
  if(K.v===C.v&&Math.abs(K.sx-sx)<0.04&&Math.abs(K.sz-sz)<0.04)return K;
  K.v=C.v;K.sx=sx;K.sz=sz;const N=C.N,T=C.top,S=K.S;let hi=-1;for(let i=0;i<T.length;i++)if(T[i]>hi)hi=T[i];
  // (stepped a block of height at a time, or less where the slant's steeper than one across for one down, so no column's skipped)
  const dh=1/Math.max(1,Math.hypot(sx,sz));
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){let s=T[j*N+i];
    for(let h=dh;hi-h>s;h+=dh){const a=Math.floor(i+0.5-sx*h),b=Math.floor(j+0.5-sz*h);if(a<0||b<0||a>=N||b>=N)break;
      const v=T[b*N+a]-h;if(v>s)s=v;}
    S[j*N+i]=s;}
  return K;
}
// is a drop at (x,y,z) hidden? Out in the open (at or above the wind's shadow) no; inside a block yes; otherwise back up
// its slant a step at a time until it meets a block (hidden) or comes out above the shadow, or off the map (not hidden)
function precipHid(K,x,y,z){
  const C=COVER,N=C.N,NN=N*N,S=K.S,sol=C.sol,fx=x-C.x0,fz=z-C.z0;let i=Math.floor(fx),j=Math.floor(fz);
  if(i<0||j<0||i>=N||j>=N||y>=S[j*N+i])return false;if(y<C.y0)return true;
  const sx=K.sx,sz=K.sz,dh=1/Math.max(1,Math.hypot(sx,sz));
  for(let h=0;;h+=dh){const py=y+h;if(py>C.y1)return false;i=Math.floor(fx-sx*h);j=Math.floor(fz-sz*h);if(i<0||j<0||i>=N||j>=N)return false;
    if(sol[(Math.floor(py)-C.y0)*NN+j*N+i])return true;if(py>=S[j*N+i])return false;}
}
// blowing sand, near enough sideways: out under the sky it shows (it eddies into the lee of a wall); under a roof it's
// followed back upwind, level, half a block at a time, and shows only if it gets out from under cover without meeting a
// block first: through a broken wall or an open door on the windward side, but not into a closed room. (ux,uz: upwind)
function dustHid(x,y,z,ux,uz){
  const C=COVER,N=C.N,NN=N*N,T=C.top,sol=C.sol,fx=x-C.x0,fz=z-C.z0,yy=Math.floor(y)-C.y0;
  if(yy<0)return true;if(yy>=COVER_NY)return false;
  for(let s=0;s<N;s+=0.5){const i=Math.floor(fx+ux*s),j=Math.floor(fz+uz*s);if(i<0||j<0||i>=N||j>=N)return false;
    if(sol[yy*NN+j*N+i])return true;if(y>=T[j*N+i])return false;}
  return false;
}
// how far the wind has carried each view's rain, snow and dust so far (added up as wxClock runs)
const PRECIP_DRIFT=[];
function precipDrift(who,wx,wz){const D=PRECIP_DRIFT[who||0]||(PRECIP_DRIFT[who||0]={t:wxClock,x:0,z:0}),dt=wxClock-D.t;
  if(dt>0&&dt<1){D.x+=wx*dt;D.z+=wz*dt;}D.t=wxClock;return D;}
function placePrecip(cam,who){
  const rain=WXK.rain,snow=WXK.snow,nd=Math.round(PRECIP_N*0.7*Math.min(1,WXK.dust||0));let nr=Math.round(PRECIP_N*Math.min(1,rain)),ns=Math.round(PRECIP_N*Math.min(1,snow));
  // a drop under a roof, a deck or a bridge is hidden; the rain and snow out in the open still show from under cover
  if(nr+ns+nd)coverMap(cam,who);
  rainM.count=nr;snowM.count=ns;dustM.count=nd;
  {const L=WORLD_LIGHT.value,f=c=>Math.max(0.1,c);rainM.material.color.setRGB(RAIN_C.r*f(L.r),RAIN_C.g*f(L.g),RAIN_C.b*f(L.b));snowM.material.color.setRGB(SNOW_C.r*f(L.r),SNOW_C.g*f(L.g),SNOW_C.b*f(L.b));}
  const CM=COVER,cover=(M,x,y,z)=>{const i=Math.floor(x)-CM.x0,j=Math.floor(z)-CM.z0;if(i<0||j<0||i>=CM.N||j>=CM.N)return false;return y<M[j*CM.N+i];};
  // (the world's wind, windNow, sets which way it all blows, the same way as smoke and the sailboat's; this view's own
  // weather sets how hard, its old 1.75 a unit of wind. The drift is added up frame by frame, so a turn of the wind or a
  // change of weather bends the fall rather than jumping every drop to a new place)
  const t=wxClock,w=WXK.wind,wa=windNow().a,wx=Math.sin(wa)*w*1.75,wz=Math.cos(wa)*w*1.75,DR=precipDrift(who,wx,wz);
  // (each kind's shelter by its own slant, at its middling speed of fall: rain's 29 a second, snow's below. Blowing sand
  // goes near enough sideways that its shadow would cover a town, so it has its own way, dustHid)
  const snowFall=2.5+w*0.6,rainS=nr?shadeMap(who,'rain',wx/29,wz/29):null,snowS=ns?shadeMap(who,'snow',wx*1.8/snowFall,wz*1.8/snowFall):null;
  if(nr){const V=precipCamVel(cam,who),under=(x,y,z)=>precipHid(rainS,x,y,z);
    // each streak lies along its drop's motion less the camera's (the wind, its own speed of fall), so it always points
    // the way it's moving on screen; stretched a little when that's fast (motion blur)
    for(let i=0;i<nr;i++){const d=drops[i],fall=26+d.s*6;_pv.set(wrapC(d.x+DR.x,cam.x,PBX),wrapC(d.y-fall*t,cam.y+4,PBY/2),wrapC(d.z+DR.z,cam.z,PBX));
      _pa.set(V.vx-wx,fall+V.vy,V.vz-wz);const sp=_pa.length();if(sp>1e-3){_pa.multiplyScalar(1/sp);_pq.setFromUnitVectors(_pUp,_pa);}else _pq.set(0,0,0,1);
      _ps.y=Math.min(3,Math.max(1,sp/29));
      // (its lower end too, half a streak down its length: a streak landing on a roof, stretched by moving fast, would
      // otherwise poke through the ceiling beneath)
      const e=0.45*_ps.y;if(under(_pv.x,_pv.y,_pv.z)||under(_pv.x-_pa.x*e,_pv.y-_pa.y*e,_pv.z-_pa.z*e))_pv.y=-500;
      _pm.compose(_pv,_pq,_ps);rainM.setMatrixAt(i,_pm);}
    _ps.y=1;rainM.instanceMatrix.needsUpdate=true;}
  if(ns){_pq.set(0,0,0,1);const under=(x,y,z)=>precipHid(snowS,x,y,z);
    for(let i=0;i<ns;i++){const d=drops[PRECIP_N-1-i],sw=Math.sin(t*1.3+d.s*9)*0.5;_pv.set(wrapC(d.x+DR.x*1.8+sw,cam.x,PBX),wrapC(d.y-(1.8+d.s*1.4+w*0.6)*t,cam.y+4,PBY/2),wrapC(d.z+DR.z*1.8+Math.cos(t+d.s*7)*0.4,cam.z,PBX));if(under(_pv.x,_pv.y,_pv.z))_pv.y=-500;_pm.compose(_pv,_pq,_ps);snowM.setMatrixAt(i,_pm);}
    snowM.instanceMatrix.needsUpdate=true;}
  if(nd){_pq.set(0,0,0,1);const L=WORLD_LIGHT.value,wl=Math.hypot(wx,wz),ux=wl>0.05?-wx/wl:0,uz=wl>0.05?-wz/wl:0,under=(x,y,z)=>wl>0.05?dustHid(x,y,z,ux,uz):cover(CM.top,x,y,z);dustM.material.color.setRGB(0.78*Math.max(0.1,L.r),0.62*Math.max(0.1,L.g),0.42*Math.max(0.1,L.b));
    for(let i=0;i<nd;i++){const d=drops[(i*7)%PRECIP_N],sw=Math.sin(t*3+d.s*11)*0.6;_pv.set(wrapC(d.x+DR.x*6,cam.x,PBX),wrapC(d.y*0.5+sw-t*0.4,cam.y+2,PBY/4),wrapC(d.z+DR.z*6+Math.cos(t*2+d.s*5),cam.z,PBX));if(under(_pv.x,_pv.y,_pv.z))_pv.y=-500;_pm.compose(_pv,_pq,_ps);dustM.setMatrixAt(i,_pm);}
    dustM.instanceMatrix.needsUpdate=true;}
}
// a lightning bolt: a jagged chain of bright segments from the clouds to the ground, shown for a moment
const BOLT=new THREE.Group(),boltSegs=[];{const m=new THREE.MeshBasicMaterial({color:0xeef4ff,fog:false});for(let i=0;i<10;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(0.5,1,0.5),m);BOLT.add(b);boltSegs.push(b);}}
BOLT.visible=false;scene.add(BOLT);
function strikeBolt(){
  const act=players.filter(p=>p.active&&(p.wxk?p.wxk.storm:WX.k.storm)>0.5);if(!act.length)return;const p=act[Math.floor(Math.random()*act.length)];
  const a=Math.random()*Math.PI*2,r=50+Math.random()*60,x0=p.pos.x+Math.cos(a)*r,z0=p.pos.z+Math.sin(a)*r;
  let px=x0,py=H+30,pz=z0;const y1=G;
  for(let i=0;i<boltSegs.length;i++){const ny=py-(py-y1)/(boltSegs.length-i),nx=px+(Math.random()-.5)*7,nz=pz+(Math.random()-.5)*7,b=boltSegs[i];
    const len=Math.hypot(nx-px,ny-py,nz-pz);b.position.set((px+nx)/2,(py+ny)/2,(pz+nz)/2);b.scale.set(1,len,1);b.lookAt(nx,ny,nz);b.rotateX(Math.PI/2);px=nx;py=ny;pz=nz;}
  BOLT.visible=true;WX.flash=1;WX.boltShow=0.18;
  // thunder follows, later the further off it was
  WX.thunder.push({t:r/120+0.2+Math.random()*0.6,v:Math.max(0.25,1-r/140)});
}
// the weather's sounds: a rain hiss and a wind roar (looping noise, faded with the weather), and thunderclaps
let WXA=null;
// (their volumes are plain values eased here frame by frame, not the audio system's own fades: Firefox could start
// those from full volume, a loud burst of hiss as every city loaded. And the loops are only made once the weather's
// actually audible)
function wxAudio(){
  if(!audio)return;
  const t=audio.currentTime,on=playing?1:0,inside=COVERS[0].under;
  const want={rain:on*WXK.rain*(inside?0.025:0.07),wind:on*Math.max(0,WXK.wind-0.5)*0.03};
  if(!WXA){if(want.rain<0.0005&&want.wind<0.0005)return;
    try{const mk=(type,f,q)=>{const len=audio.sampleRate*2|0,buf=audio.createBuffer(1,len,audio.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<len;i++)ch[i]=Math.random()*2-1;
      const src=audio.createBufferSource(),fl=audio.createBiquadFilter(),g=audio.createGain();src.buffer=buf;src.loop=true;fl.type=type;fl.frequency.value=f;fl.Q.value=q;g.gain.value=0;src.connect(fl).connect(g).connect(sndDest());src.start();return{src,fl,g,v:0};};
    WXA={rain:mk('highpass',1400,0.5),wind:mk('bandpass',320,0.8),t};}catch(e){WXA={};}}
  if(!WXA.rain)return;
  const dt=Math.max(0,Math.min(0.25,t-WXA.t));WXA.t=t;
  for(const [k,tc] of [['rain',0.4],['wind',0.6]]){const L=WXA[k];L.v+=(want[k]-L.v)*(1-Math.exp(-dt/tc));if(L.v<1e-5)L.v=0;L.g.gain.value=L.v;}
  if(DT.sndList&&on){if(WXK.rain>0.02)sndNote(0.1,inside?'Rain (under cover)':'Rain');if(WXK.wind>0.52)sndNote(0.1,'Wind');}
  WXA.wind.fl.frequency.value=260+Math.sin(t*0.7)*90+WXK.wind*60;
}
// winter: the top layer of every pond, river and fountain freezes to ice (loaded chunks are converted and re-meshed a
// few at a time; chunks built later freeze as they're made), and thaws back to water in spring
const ICE_Y0=G-8,ICE_Y1=G+12,freezeQ=[];
// (shallow water with air or more shallow water under it is still falling, so it doesn't freeze where it hangs)
const wetFalling=u=>u===AIR||u!==WATER&&!!WET[u];
// (water still on the move, or with water moving under it, waits: the flow freezes it once it's still, water-flow.js)
const wfMoving=(cx,cz,i,y)=>wfAct.size>0&&(wfAct.has(bkey(cx*CS+i%CS,y,cz*CS+((i/CS)|0)))||wfAct.has(bkey(cx*CS+i%CS,y-1,cz*CS+((i/CS)|0))));
// (frac under 1: only the blocks whose hash is under it, so winter can come on in steps, freezeTick; cx,cz place them)
function freezeArr(a,on,cx=0,cz=0,frac=1){let n=0;const L=CS*CS;for(let y=ICE_Y0;y<=ICE_Y1;y++)for(let i=0;i<L;i++){const j=y*L+i,b=a[j];
  if(frac<1&&(b===AIR||b===WATER&&a[j+L]===WATER||hash2(cx*CS+i%CS+y*131,cz*CS+((i/CS)|0)+y*17)>=frac))continue;
  if(on){if(a[j+L]===AIR){if(b===WATER){if(!wfMoving(cx,cz,i,y)){a[j]=ICE;n++;}}else if(WET[b]&&!wetFalling(a[j-L])&&!wfMoving(cx,cz,i,y)){a[j]=ICE_L[BLOCK[b].lvl];n++;}}}   // (shallow water too, as thin ice)
  else if(b===ICE){a[j]=WATER;n++;}else if(ICE_LV[b]){a[j]=WATER_L[ICE_LV[b]];n++;}}return n;}
// (now: every chunk at once, as when a game's loaded in winter; otherwise the ice creeps over the water in FZ_STEPS steps
// over about FZ_TIME seconds, or melts the same way, freezeTick, and the chunks it changes join the frame's budgeted rebuilds)
const FZ_STEPS=5,FZ_TIME=40,FZ_WAIT=6,FZ_NEAR=56,FZ={on:false,step:0,keys:[],i:0,t:0};   // (FZ_WAIT: a few seconds of cold before the first ice)
function freezeWorld(on,now){
  if(now){FZ.keys.length=0;for(const [k,a] of chunks){const cx=Math.floor(k/65536)-32768,cz=k%65536-32768;if(freezeArr(a,on&&chunkFreeze(cx,cz),cx,cz)&&meshes.has(k))freezeQ.push(k);}lastK=-1;return;}
  FZ.on=on;FZ.step=1;FZ.keys=[...chunks.keys()];FZ.i=0;FZ.t=on?-FZ_WAIT:0;}
function freezeTick(dt){
  if(!FZ.keys.length)return;FZ.t+=dt;
  // (this step's share of the chunks by now, a step every FZ_TIME/FZ_STEPS seconds)
  const per=FZ_TIME/FZ_STEPS,want=Math.min(FZ.keys.length,Math.ceil(FZ.keys.length*Math.min(1,Math.max(0,FZ.t)/per))),frac=FZ.step/FZ_STEPS,set=new Set();
  // (only near a player is it seen creeping: further off a chunk's done whole on the first step, so it's rebuilt once)
  for(;FZ.i<want;FZ.i++){const k=FZ.keys[FZ.i],a=chunks.get(k);if(!a)continue;const cx=Math.floor(k/65536)-32768,cz=k%65536-32768;
    const near=players.some(p=>p.active&&Math.abs(p.pos.x-cx*CS-8)<FZ_NEAR&&Math.abs(p.pos.z-cz*CS-8)<FZ_NEAR);if(!near&&FZ.step>1)continue;
    if(freezeArr(a,FZ.on&&chunkFreeze(cx,cz),cx,cz,near?frac:1)&&meshes.has(k))set.add(k);}
  if(set.size){lastK=-1;rebuildSet(set);}
  if(FZ.i>=FZ.keys.length){if(FZ.step>=FZ_STEPS)FZ.keys.length=0;else{FZ.step++;FZ.i=0;FZ.t=0;}}}
// (winter freezes the water only where it's not warm: never in the desert, the savanna or the rainforest)
function chunkFreeze(cx,cz){if(!WX.frozen)return false;if(TENV||cx*CS>=SHIP_X0)return true;return climAt(cx*CS+8,cz*CS+8).t<0.64;}
// is (x,y,z) out under the open sky? (undefined where its chunk isn't made: a vehicle left far behind, a plane or train
// passed on a long flight, would otherwise have that chunk made again every second, only for it to be unloaded again
// as too far off, a hitch every second for as long as it stays out there. The callers keep what they last knew.)
function openSky(x,y,z){const cx=Math.floor(x),cz=Math.floor(z);if(!chunks.has(ckey(Math.floor(cx/CS),Math.floor(cz/CS))))return undefined;
  for(let yy=Math.floor(y)+2;yy<Math.min(H,y+45);yy++)if(solidAt(cx,yy,cz))return false;return true;}
function snowGather(o,dt,moving){
  o.skyT=(o.skyT||0)-dt;if(o.skyT<=0){o.skyT=0.6+Math.random()*0.5;o.skyOpen=openSky(o.pos.x,o.pos.y,o.pos.z)??o.skyOpen;o.wxS=wxSnowFall(o.pos.x,o.pos.z,o.pos.y);}
  const u=o.snowU,sf=o.wxS??WX.k.snow;if(sf>0.08&&o.skyOpen)u.value=Math.min(1,u.value+dt*sf/50*(moving?0.35:1));
  else u.value=Math.max(0,u.value-dt/(sf>0.08?240:45));
}
// (the snow falling at a place: the global spell's, as it comes down there)
function wxSnowFall(x,z,y){const L=wxLocal(x,z,y);if(L===WX.type)return WX.k.snow;return WX_TYPES[L].snow||0;}
function shakeSnow(o,y){if(o.snowU&&o.snowU.value>0.08){puff(o.pos.x,o.pos.y+y,o.pos.z,10,0xf0f4fa,0.45);o.snowU.value=0;}}
// snow on every vehicle whose kind says so (VEHICLE_KINDS: tanks, helicopters, planes, boats, trains, balloons and
// Mobile Gears), as on cars. Their paints are shared by every one of a kind, so each gets copies of its own with the cars' snow (snowCar) the first time any snow is lying, and the
// batched drawing reads each box's snow from those (batPut). It settles as deep as the snow on the ground while the
// vehicle stands out under the sky, and blows off one that's going fast (a plane in the air, a helicopter at speed)
function vehSnowKit(o,gs){
  o.snowU={value:0};const own=new Map();
  for(const g of gs||[o.g])g.traverse(m=>{const t=m.isMesh&&m.material;if(!t||t.type!=='MeshLambertMaterial'||t.transparent||t.snowU||t._obc)return;
    let c=own.get(t);if(!c){c=snowCar(t.clone(),o);own.set(t,c);}m.material=c;
    if(m.userData.mat===t)m.userData.mat=c;});   // (a plane put back after it was wrecked gets its snowy paint back: see planeWreck)
}
function vehSnow(o,x,y,z,gone,dt,gs){
  if(gone)return;
  if(!o.snowU){if(snowMax()<0.01||snowAt(x,z,y)<0.01)return;vehSnowKit(o,gs);}
  const P=o.snowP||(o.snowP={x,z}),sp=Math.hypot(x-P.x,z-P.z)/Math.max(dt,1e-3);P.x=x;P.z=z;
  o.skyT=(o.skyT||0)-dt;if(o.skyT<=0){o.skyT=0.6+Math.random()*0.4;o.skyOpen=openSky(x,y,z)??o.skyOpen;o.snowHere=snowAt(x,z,y);}
  const fast=sp>20,u=o.snowU;u.value+=((o.skyOpen&&!fast?o.snowHere??WX.snowCover:0)-u.value)*Math.min(1,dt*(fast?1.5:0.4));
}
function updateVehSnow(dt){
  vehEach((K,o)=>{if(K.snow!==true)return;const P=K.pos(o);vehSnow(o,P.x,P.y,P.z,K.dead(o)||!K.shown(o),dt,K.groups(o));});
}
// how far the weather lets you see, in blocks: the same at any view distance (it once scaled with the FAR VIEW setting,
// so turned up far the fog all but vanished). Clear skies don't limit it; thick fog or a blizzard closes in to about 30
const wxFogFar=fk=>fk>=0.995?Infinity:24/(1-fk);
function updateWeather(dt){
  if(playing){wxClock+=dt;
    if(!DT.wxStop&&gameDays()>=WX.until)wxSet(wxPick(seasonOf()),false);   // (not while the debug menu's Pause weather is on)
    const tg=WX_TYPES[WX.type],r=1-Math.exp(-dt/10);
    for(const k of WX_KEYS)WX.k[k]+=((tg[k]??WX_DEF[k])-WX.k[k])*r;
    // the ground gets wet in the rain and dries off after; snow settles, and melts away again once it stops
    if(WX.k.rain>0.08)WX.wet=Math.min(1,WX.wet+dt*WX.k.rain/25);else WX.wet=Math.max(0,WX.wet-dt/(WX.k.cover<0.5?60:150));
    if(WX.k.snow>0.08)WX.snowCover=Math.min(1,WX.snowCover+dt*WX.k.snow/70);
    else{WX.snowCover=Math.max(0,WX.snowCover-dt/(seasonOf()===3?600:120)*(WX.k.rain>0.1?3:1));if(snowMax()===0&&snowBorn.size)snowBorn.clear();}
    {const f=wxBands(dt);if(f>0.08)WX.snowClock+=dt*f/70;}   // (the snow clock runs while snow's settling anywhere)
    wxPlayers(dt,r);devilTick(dt);
    updateVehSnow(dt);
    // rain puts fires out (slowly)
    if(WX.k.rain+WX.k.snow>0.25)for(const F of fires){const L=WX_TYPES[wxLocal(F.x,F.z,F.y)],rn=L===WX_TYPES[WX.type]?WX.k.rain:L.rain||0;if(rn>0.25){F.douse=true;F.t-=dt*rn*0.5;}}
    // lightning
    if(players.some(p=>p.active&&(p.wxk?p.wxk.storm:WX.k.storm)>0.5)){WX.boltT-=dt;if(WX.boltT<=0){WX.boltT=3+Math.random()*9;strikeBolt();}}
    for(let i=WX.thunder.length-1;i>=0;i--){const q=WX.thunder[i];q.t-=dt;if(q.t<=0){WX.thunder.splice(i,1);noise(2.6,0.5*q.v,140,'lowpass');tone('sine',55,28,2.2,0.25*q.v);for(const p of players)if(p.active)p.shake=Math.max(p.shake,0.12*q.v);}}
  }
  WX.flash=Math.max(0,WX.flash-dt*3.2);if(WX.boltShow!==undefined){WX.boltShow-=dt;if(WX.boltShow<=0)BOLT.visible=false;}
  wxAudio();
  if(!playing)wxPlayers(0,0);coldTick();
  updateSeasonW();SNOW_U.value=WX.snowCover;SNOWB_U.value.set(WX.snowP,WX.snowC,WX.snowCover,WX.snowW);SNOWCLK_U.value=WX.snowClock;WET_U.value=WX.wet;
  {const fz=seasonOf()===3;if(fz!==!!WX.frozen){WX.frozen=fz;freezeWorld(fz);}}
  freezeTick(dt);if(freezeQ.length){rebuildSet(new Set(freezeQ));freezeQ.length=0;}   // (into the frame's budgeted rebuilds: three whole chunks a frame was a long stall in winter)
}


