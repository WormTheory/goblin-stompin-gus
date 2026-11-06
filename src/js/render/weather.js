// ---------- seasons, weather and the moon ----------
// The year: four 30-day seasons. Each season has its own odds for the weather; a spell lasts a third of a day to a
// day, and everything (cloud, darkness, fog, rain, snow, wind, storms) eases from one spell into the next.
const SEASONS=['Spring','Summer','Autumn','Winter'],SEASON_ICONS=['🌸','🌻','🍂','⛄'],SEASON_LEN=30,MOON_LEN=30;
const WX_TYPES={
  sunny:{n:'Sunny',i:'☀️',cover:0.05,wind:0.4},
  partly:{n:'Partly cloudy',i:'⛅',cover:0.45,wind:0.6},
  cloudy:{n:'Cloudy',i:'☁️',cover:0.85,dark:0.22,fog:0.9,wind:0.7},
  windy:{n:'Windy',i:'💨',cover:0.4,wind:3.2},
  foggy:{n:'Foggy',i:'🌫️',cover:0.6,dark:0.14,fog:0.28,wind:0.15},
  lrain:{n:'Light rain',i:'🌦️',cover:0.85,dark:0.26,fog:0.85,rain:0.3,wind:0.8},
  rain:{n:'Rain',i:'🌧️',cover:0.95,dark:0.38,fog:0.7,rain:0.65,wind:1.1},
  hrain:{n:'Heavy rain',i:'🌧️',cover:1,dark:0.5,fog:0.52,rain:1,wind:1.6},
  storm:{n:'Thunderstorm',i:'⛈️',cover:1,dark:0.62,fog:0.58,rain:1,wind:2.2,storm:1},
  lsnow:{n:'Light snow',i:'🌨️',cover:0.85,dark:0.2,fog:0.8,snow:0.3,wind:0.6},
  snow:{n:'Snow',i:'❄️',cover:0.95,dark:0.3,fog:0.6,snow:0.65,wind:0.9},
  blizzard:{n:'Blizzard',i:'🌨️',cover:1,dark:0.42,fog:0.26,snow:1,wind:3.6}};
const WX_KEYS=['cover','dark','fog','rain','snow','wind','storm'],WX_DEF={cover:0,dark:0,fog:1,rain:0,snow:0,wind:0.5,storm:0};
// the odds of each kind of weather, season by season
const WX_ODDS=[
  {sunny:3,partly:4,cloudy:2,windy:2,foggy:1.5,lrain:3,rain:2.5,hrain:1,storm:1,lsnow:0.3},
  {sunny:6,partly:4,cloudy:1,windy:1,foggy:0.4,lrain:1.5,rain:1,hrain:0.8,storm:2},
  {sunny:2,partly:3,cloudy:3,windy:3,foggy:2.5,lrain:2.5,rain:2,hrain:1,storm:0.5,lsnow:0.5},
  {sunny:1.5,partly:2,cloudy:3,windy:1.5,foggy:2,lrain:0.5,rain:0.3,lsnow:3,snow:2.5,blizzard:1.2}];
const WX={snowClock:0,type:'sunny',until:1,k:Object.assign({},WX_DEF,{cover:0.05,wind:0.4}),wet:0,snowCover:0,flash:0,boltT:6,thunder:[]};
const seasonOf=()=>Math.floor((dayN-1)/SEASON_LEN)%4,seasonDay=()=>(dayN-1)%SEASON_LEN+1,gameDays=()=>dayN-1+tod;
const moonPhase=()=>((dayN-1+tod)/MOON_LEN)%1;   // 0 new, 0.5 full
const MOON_NAMES=[['New moon','🌑'],['Waxing crescent','🌒'],['First quarter','🌓'],['Waxing gibbous','🌔'],['Full moon','🌕'],['Waning gibbous','🌖'],['Last quarter','🌗'],['Waning crescent','🌘']];
const moonInfo=()=>MOON_NAMES[Math.round(moonPhase()*8)%8];
function wxPick(se){const O=WX_ODDS[se];let tot=0;for(const k in O)tot+=O[k];let u=Math.random()*tot;for(const k in O){if(u<O[k])return k;u-=O[k];}return'partly';}
function wxSet(type,now){WX.type=type;WX.until=gameDays()+0.3+Math.random()*0.7;if(now){const T=WX_TYPES[type];for(const k of WX_KEYS)WX.k[k]=T[k]??WX_DEF[k];}}
function wxReset(){WX.frozen=false;freezeQ.length=0;wxSet('sunny',true);WX.until=1;   // day 1 is always a sunny spring day
 WX.wet=WX.k.rain>0.2?0.6:0;WX.snowCover=seasonOf()===3&&WX.k.snow>0?0.5:0;WX.flash=0;WX.thunder.length=0;}
// precipitation: streaks of rain or flakes of snow in a box round the camera, fixed in the world as you move through it
const PRECIP_N=2400,PBX=24,PBY=28;
const rainM=new THREE.InstancedMesh(new THREE.BoxGeometry(0.035,0.9,0.035),new THREE.MeshBasicMaterial({color:0xa9b9cc,transparent:true,opacity:0.5,depthWrite:false}),PRECIP_N);
const snowM=new THREE.InstancedMesh(new THREE.BoxGeometry(0.14,0.14,0.14),new THREE.MeshBasicMaterial({color:0xf2f6ff,transparent:true,opacity:0.92}),PRECIP_N);
for(const m of [rainM,snowM]){m.frustumCulled=false;m.count=0;m.renderOrder=2;scene.add(m);}
const drops=[];{const r=mulberry(4711);for(let i=0;i<PRECIP_N;i++)drops.push({x:r()*PBX*2,y:r()*PBY,z:r()*PBX*2,s:r()});}
const _pm=new THREE.Matrix4(),_pq=new THREE.Quaternion(),_pv=new THREE.Vector3(),_ps=new THREE.Vector3(1,1,1),_pa=new THREE.Vector3();let wxClock=0;
const wrapC=(v,c,h)=>c+((((v-c+h)%(2*h))+2*h)%(2*h))-h;
// the cover map: for each column in a square round the camera, the height of the highest solid block (refreshed as you move)
const mkCover=()=>({N:44,x0:0,z0:0,top:new Int16Array(44*44),t:-1,cx:1e9,cz:1e9,under:false}),COVERS=[mkCover(),mkCover()];let COVER=COVERS[0];
function coverMap(cam,who){
  const C=COVER=COVERS[who||0],cx=Math.floor(cam.x),cz=Math.floor(cam.z);
  if(Math.abs(cx-C.cx)<4&&Math.abs(cz-C.cz)<4&&wxClock-C.t<1.5)return;
  C.cx=cx;C.cz=cz;C.t=wxClock;C.x0=cx-(C.N>>1);C.z0=cz-(C.N>>1);
  const yHi=Math.min(H-1,Math.floor(cam.y)+36),yLo=Math.max(1,Math.floor(cam.y)-12);
  for(let j=0;j<C.N;j++)for(let i=0;i<C.N;i++){let top=-1;for(let y=yHi;y>=yLo;y--){const b=get(C.x0+i,y,C.z0+j);if(b&&b!==WATER){top=y+1;break;}}C.top[j*C.N+i]=top;}
  C.under=C.top[(cz-C.z0)*C.N+(cx-C.x0)]>cam.y+1.2;
}
function placePrecip(cam,who){
  const rain=WX.k.rain,snow=WX.k.snow;let nr=Math.round(PRECIP_N*Math.min(1,rain)),ns=Math.round(PRECIP_N*Math.min(1,snow));
  // a drop under a roof, a deck or a bridge is hidden; the rain and snow out in the open still show from under cover
  if(nr+ns)coverMap(cam,who);
  rainM.count=nr;snowM.count=ns;
  const CM=COVER,under=(x,y,z)=>{const i=Math.floor(x)-CM.x0,j=Math.floor(z)-CM.z0;if(i<0||j<0||i>=CM.N||j>=CM.N)return false;return y<CM.top[j*CM.N+i];};
  const t=wxClock,w=WX.k.wind,wx=w*1.6,wz=w*0.7;
  if(nr){const wl=Math.hypot(wx,wz);if(wl>0.01){_pa.set(wz/wl,0,-wx/wl);_pq.setFromAxisAngle(_pa,-Math.atan(wl/26));}else _pq.set(0,0,0,1);   // leaning with the wind
    for(let i=0;i<nr;i++){const d=drops[i];_pv.set(wrapC(d.x+wx*t,cam.x,PBX),wrapC(d.y-(26+d.s*6)*t,cam.y+4,PBY/2),wrapC(d.z+wz*t,cam.z,PBX));if(under(_pv.x,_pv.y,_pv.z))_pv.y=-500;_pm.compose(_pv,_pq,_ps);rainM.setMatrixAt(i,_pm);}
    rainM.instanceMatrix.needsUpdate=true;}
  if(ns){_pq.set(0,0,0,1);
    for(let i=0;i<ns;i++){const d=drops[PRECIP_N-1-i],sw=Math.sin(t*1.3+d.s*9)*0.5;_pv.set(wrapC(d.x+wx*t*1.8+sw,cam.x,PBX),wrapC(d.y-(1.8+d.s*1.4+w*0.6)*t,cam.y+4,PBY/2),wrapC(d.z+wz*t*1.8+Math.cos(t+d.s*7)*0.4,cam.z,PBX));if(under(_pv.x,_pv.y,_pv.z))_pv.y=-500;_pm.compose(_pv,_pq,_ps);snowM.setMatrixAt(i,_pm);}
    snowM.instanceMatrix.needsUpdate=true;}
}
// a lightning bolt: a jagged chain of bright segments from the clouds to the ground, shown for a moment
const BOLT=new THREE.Group(),boltSegs=[];{const m=new THREE.MeshBasicMaterial({color:0xeef4ff,fog:false});for(let i=0;i<10;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(0.5,1,0.5),m);BOLT.add(b);boltSegs.push(b);}}
BOLT.visible=false;scene.add(BOLT);
function strikeBolt(){
  const act=players.filter(p=>p.active);if(!act.length)return;const p=act[Math.floor(Math.random()*act.length)];
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
function wxAudio(){
  if(!audio)return;
  if(!WXA){try{const mk=(type,f,q)=>{const len=audio.sampleRate*2|0,buf=audio.createBuffer(1,len,audio.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<len;i++)ch[i]=Math.random()*2-1;
      const src=audio.createBufferSource(),fl=audio.createBiquadFilter(),g=audio.createGain();src.buffer=buf;src.loop=true;fl.type=type;fl.frequency.value=f;fl.Q.value=q;g.gain.value=0;src.connect(fl).connect(g).connect(audio.destination);src.start();return{src,fl,g};};
    WXA={rain:mk('highpass',1400,0.5),wind:mk('bandpass',320,0.8)};}catch(e){WXA={};}}
  if(!WXA.rain)return;const t=audio.currentTime,on=playing?1:0,P=players.find(p=>p.active),inside=COVERS[0].under;
  WXA.rain.g.gain.setTargetAtTime(on*WX.k.rain*(inside?0.025:0.07),t,0.4);
  WXA.wind.g.gain.setTargetAtTime(on*Math.max(0,WX.k.wind-0.5)*0.03,t,0.6);
  if(DT.sndList&&on){if(WX.k.rain>0.02)sndNote(0.1,inside?'Rain (under cover)':'Rain');if(WX.k.wind>0.52)sndNote(0.1,'Wind');}
  WXA.wind.fl.frequency.setTargetAtTime(260+Math.sin(t*0.7)*90+WX.k.wind*60,t,0.5);
}
// winter: the top layer of every pond, river and fountain freezes to ice (loaded chunks are converted and re-meshed a
// few at a time; chunks built later freeze as they're made), and thaws back to water in spring
const ICE_Y0=G-8,ICE_Y1=G+12,freezeQ=[];
function freezeArr(a,on){let n=0;const L=CS*CS;for(let y=ICE_Y0;y<=ICE_Y1;y++)for(let i=0;i<L;i++){const j=y*L+i,b=a[j];
  if(on){if(b===WATER&&a[j+L]===AIR){a[j]=ICE;n++;}}else if(b===ICE){a[j]=WATER;n++;}}return n;}
function freezeWorld(on){for(const [k,a] of chunks){if(freezeArr(a,on)&&meshes.has(k))freezeQ.push(k);}lastK=-1;}
// is (x,y,z) out under the open sky?
function openSky(x,y,z){const cx=Math.floor(x),cz=Math.floor(z);for(let yy=Math.floor(y)+2;yy<Math.min(H,y+45);yy++)if(solidAt(cx,yy,cz))return false;return true;}
function snowGather(o,dt,moving){
  o.skyT=(o.skyT||0)-dt;if(o.skyT<=0){o.skyT=0.6+Math.random()*0.5;o.skyOpen=openSky(o.pos.x,o.pos.y,o.pos.z);}
  const u=o.snowU;if(WX.k.snow>0.08&&o.skyOpen)u.value=Math.min(1,u.value+dt*WX.k.snow/50*(moving?0.35:1));
  else u.value=Math.max(0,u.value-dt/(WX.k.snow>0.08?240:45));
}
function shakeSnow(o,y){if(o.snowU&&o.snowU.value>0.08){puff(o.pos.x,o.pos.y+y,o.pos.z,10,0xf0f4fa,0.45);o.snowU.value=0;}}
function updateWeather(dt){
  if(playing){wxClock+=dt;
    if(gameDays()>=WX.until)wxSet(wxPick(seasonOf()),false);
    const tg=WX_TYPES[WX.type],r=1-Math.exp(-dt/10);
    for(const k of WX_KEYS)WX.k[k]+=((tg[k]??WX_DEF[k])-WX.k[k])*r;
    // the ground gets wet in the rain and dries off after; snow settles, and melts away again once it stops
    if(WX.k.rain>0.08)WX.wet=Math.min(1,WX.wet+dt*WX.k.rain/25);else WX.wet=Math.max(0,WX.wet-dt/(WX.k.cover<0.5?60:150));
    if(WX.k.snow>0.08){WX.snowCover=Math.min(1,WX.snowCover+dt*WX.k.snow/70);WX.snowClock+=dt*WX.k.snow/70;}
    else{WX.snowCover=Math.max(0,WX.snowCover-dt/(seasonOf()===3?600:120)*(WX.k.rain>0.1?3:1));if(WX.snowCover===0&&snowBorn.size)snowBorn.clear();}
    // rain puts fires out (slowly)
    if(WX.k.rain>0.25)for(const F of fires){F.douse=true;F.t-=dt*WX.k.rain*0.5;}
    // lightning
    if(WX.k.storm>0.5){WX.boltT-=dt;if(WX.boltT<=0){WX.boltT=3+Math.random()*9;strikeBolt();}}
    for(let i=WX.thunder.length-1;i>=0;i--){const q=WX.thunder[i];q.t-=dt;if(q.t<=0){WX.thunder.splice(i,1);noise(2.6,0.5*q.v,140,'lowpass');tone('sine',55,28,2.2,0.25*q.v);for(const p of players)if(p.active)p.shake=Math.max(p.shake,0.12*q.v);}}
  }
  WX.flash=Math.max(0,WX.flash-dt*3.2);if(WX.boltShow!==undefined){WX.boltShow-=dt;if(WX.boltShow<=0)BOLT.visible=false;}
  wxAudio();
  updateSeasonW();SNOW_U.value=WX.snowCover;SNOWCLK_U.value=WX.snowClock;WET_U.value=WX.wet*(1-WX.snowCover);
  {const fz=seasonOf()===3;if(fz!==!!WX.frozen){WX.frozen=fz;freezeWorld(fz);}}
  for(let n=0;n<3&&freezeQ.length;n++){const e=meshes.get(freezeQ.shift());if(e)buildChunk(e.cx,e.cz);}
}


