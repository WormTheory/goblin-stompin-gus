// ---------- Audio ----------
let audio=null,audioWanted=false;
// ---- the sound list (debug): every sound by name as it starts, lit while it plays and fading for 2 seconds after, so even
// a click too short to see can be read. A sound made inside sfx(name,...) takes that name; any other is named after the code
// that made it (a stack trace, only taken while the list is showing). ----
const SL={tag:null,rows:new Map(),el:null,shown:false};
function sfx(n,f){const o=SL.tag;SL.tag=n;try{f();}finally{SL.tag=o;}}
const SND_PRIM=new Set(['tone','noise','woosh','sndNote','sndName','sfx','safe']),SND_HELP={thud:'Thud',clang:'Clang',horn:'Horn'};
// (what the code that made a sound is called, in words: anything not listed is just its name spelt out)
const SND_FN={hudPop:'Points',squeal:'Civilian screams',stompGrunt:'Stomp grunt',grunt:'Grunt',destroyFX:'Blocks break',knockFix:'Knocked over',
  dbgMenuNav:'Menu',dbgMenuToggle:'Menu',renderTime:'Menu',renderDbg:'Menu',renderAbil:'Menu',ddChoose:'Menu',resumePlayer:'Menu',
  airCrash:'Aircraft crashes',animalHit:'Animal hit',bellStrike:'Bell',bigCrashes:'Big crash',blastOff:'Blast off',boatHit:'Boat hit',carPhysics:'Vehicle lands',
  civAI:'Civilian',climbDismount:'Climb down',climbOverEdge:'Climb over an edge',climbToCeil:'Climb onto the ceiling',collapseBuilding:'Building collapses',
  crashTopple:'Building crashes down',cultCast:'Cult spell',cultRouse:'Cult wakes',damageGoblin:'Goblin hit',damagePlayer:'Hippo hurt',doBite:'Bite lands',
  dropFloating:'Loose blocks drop',drvBoat:'Boat',drvCar:'Driving',drvEnter:'Get in or out',drvHeli:'Helicopter',drvLock:'Lock-on',drvTank:'Tank',drvTrain:'Train',
  explodeCar0:'Vehicle explodes',fallImpact:'Hard fall',fbBurst:'Fireball bursts',fireball:'Fireball',foeBoom:'Explosion',foeRanged:'Enemy fires',foeShoot:'Enemy shoots',
  foeThrow:'Enemy throws',gasBoom0:'Gas explosion',gobClub:'Goblin club',gobLand:'Goblin lands',grabCeil:'Grab the ceiling',gusBite:'Bite',hbApply:'Hit',heliGun:'Helicopter gun',
  lockSwitch:'Lock-on switch',lockSwitchDepth:'Lock-on switch',makeBody:'Body falls',makeTopple:'Building topples',medicAI:'Medic',milAlert:'Military alert',milHit:'Military hit',
  milShove:'Military vehicle shoves',movePlayer:'Hippo',nudgeRange:'Lock-on range',placePile:'Rubble lands',planeHit:'Plane hit',planeStrike:'Plane strikes',planeWreck:'Plane wreck',
  refreshBrandSigns:'Sign falls',rideBang:'Ride hit',setLock:'Lock-on',siteRouse:'Site wakes',smashSoftUnder:'Smash underfoot',spikeHit:'Ground spike hits',startClimb:'Start climbing',
  stepCorpse:'Step on a body',stompImpact:'Stomp lands',svcDrive:'Emergency vehicle',trainBoxes:'Train hits',trainHit:'Train hit',trainStrike:'Train strikes',
  trampleFences:'Fences trampled',updateBodies:'Body lands',updateCars:'Traffic',updateCultVenue:'Cult',updateDoors:'Door',updateGoblins:'Goblin',updateHeli:'Helicopter',
  updateLandmarks:'Landmark',updateLaunch:'Launch',updateLock:'Lock-on',updateRailVenue:'Train',updateSiren:'Siren',updateSpikes:'Ground spike',updateTank:'Tank',
  updateTopples:'Building lands',updateTraffic:'Traffic',updateVenues:'Venue',updateWeather:'Thunder',vClimb:'Climbing',vHitFx:'Vehicle hit',vHold:'Holding on',
  wpnFire:'Weapon fires',wpnTick:'Weapon reload'};
const sndWords=f=>SND_FN[f]||(f.replace(/0$/,'').replace(/([a-z])([A-Z])/g,'$1 $2').toLowerCase().replace(/^./,c=>c.toUpperCase()));
function sndName(){
  if(SL.tag)return SL.tag;
  const L=Error.stackTraceLimit;Error.stackTraceLimit=14;const st=String(new Error().stack||'');Error.stackTraceLimit=L;
  let help=null;
  for(const line of st.split('\n')){const m=line.match(/at (?:[\w$]+\.)*([\w$]+) \(/)||line.match(/^([\w$]+)@/);if(!m)continue;const f=m[1];
    if(SND_PRIM.has(f)||f==='Error'||f==='forEach'||f==='map'||f==='some'||f==='filter'||f==='frame')continue;
    if(SND_FN[f]&&!SND_HELP[f])return help?SND_HELP[help]+' · '+SND_FN[f]:SND_FN[f];
    if(SND_HELP[f]){if(!help)help=f;continue;}
    return help?SND_HELP[help]+' · '+sndWords(f):sndWords(f);}
  return help?SND_HELP[help]:'Menu';
}
// a sound starting, lasting dur seconds (a looping one calls this every frame it's audible)
function sndNote(dur,name){if(!DT.sndList)return;const n=name||sndName(),t=performance.now(),r=SL.rows.get(n);
  if(r){if(t>r.end)r.n=t-r.end>2000?1:r.n+1;r.end=Math.max(r.end,t+dur*1000);}else SL.rows.set(n,{n:1,end:t+dur*1000,el:null});}
function sndTick(){
  SL.tag=null;   // (a name only lasts while sfx runs: one left set by mistake would name every sound after it, so it can't outlive the frame)
  if(!SL.el){SL.el=document.getElementById('sndList');if(!SL.el)return;}
  if(SL.shown!==DT.sndList){SL.shown=DT.sndList;SL.el.hidden=!DT.sndList;if(!DT.sndList){SL.rows.clear();SL.el.textContent='';}}
  if(!DT.sndList||!SL.el.appendChild)return;const t=performance.now();
  for(const [n,r] of SL.rows){
    if(t>r.end+2000){if(r.el)r.el.remove();SL.rows.delete(n);continue;}
    if(!r.el){r.el=document.createElement('div');r.el.className='sl-r';SL.el.insertBefore(r.el,SL.el.firstChild);}
    const on=t<=r.end,txt=n+(r.n>1?' ×'+r.n:'');if(r.el.textContent!==txt)r.el.textContent=txt;
    r.el.classList.toggle('on',on);r.el.style.opacity=on?'1':String(Math.max(0,1-(t-r.end)/2000));}
}
function tone(type,f0,f1,dur,vol,delay=0){if(SBX)return;if(!audio)return;if(DT.sndList)sndNote(delay+dur);try{const t=audio.currentTime+delay;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+dur+0.02);}catch(e){}}
function noise(dur,vol,freq,type){if(SBX)return;if(!audio)return;if(DT.sndList)sndNote(dur);try{const t=audio.currentTime;const len=audio.sampleRate*dur|0,buf=audio.createBuffer(1,len,audio.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<len;i++)ch[i]=(Math.random()*2-1)*Math.pow(1-i/len,2);const n=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();n.buffer=buf;f.type=type;f.frequency.value=freq;g.gain.value=vol;n.connect(f).connect(g).connect(audio.destination);n.start(t);}catch(e){}}
function thud(vol){if(vol<=0.02)return;tone('sine',95,32,0.45,vol*0.9);noise(0.25,vol*0.6,380,'lowpass');}
// a swish of air: band-passed noise that swells and sweeps up in pitch
function woosh(vol,dur,f0,f1,delay=0){if(SBX)return;if(!audio)return;if(DT.sndList)sndNote(delay+dur);try{const t=audio.currentTime+delay,len=audio.sampleRate*dur|0,buf=audio.createBuffer(1,len,audio.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<len;i++)ch[i]=Math.random()*2-1;
  const n=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();n.buffer=buf;f.type='bandpass';f.Q.value=1.1;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+dur*0.4);g.gain.linearRampToValueAtTime(0.0001,t+dur);n.connect(f).connect(g).connect(audio.destination);n.start(t);n.stop(t+dur+0.02);}catch(e){}}
// a ground pound's plunge: a rushing wind that swells and climbs in pitch with his speed, cut off the instant he lands.
// One looping noise source per hippo, filtered and faded in and out each frame.
function poundWoosh(p){
  // (it starts with the flip itself, so even a pound from an ordinary jump gets its whoosh)
  const on=p.state==='pound'&&!p.pHover&&playing&&!p.paused;
  if(!audio){return;}
  if(on&&!p.wsh){try{
    const len=audio.sampleRate*2|0,buf=audio.createBuffer(1,len,audio.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<len;i++)ch[i]=Math.random()*2-1;
    const src=audio.createBufferSource(),f=audio.createBiquadFilter(),f2=audio.createBiquadFilter(),g=audio.createGain();src.buffer=buf;src.loop=true;
    f.type='bandpass';f.Q.value=0.9;f.frequency.value=380;f2.type='lowpass';f2.frequency.value=2600;g.gain.value=0.0001;
    src.connect(f).connect(f2).connect(g).connect(audio.destination);src.start();p.wsh={src,f,g};}catch(e){}}
  const W=p.wsh;if(!W)return;const t=audio.currentTime;
  if(on){const sp=Math.max(0,Math.min(1,-p.vy/40));if(DT.sndList)sndNote(0.1,'Ground pound rush');
    W.g.gain.setTargetAtTime(0.16+0.18*sp,t,0.025);W.f.frequency.setTargetAtTime(520+1200*sp,t,0.05);}
  else{W.g.gain.setTargetAtTime(0.0001,t,p.state==='poundLand'?0.015:0.06);
    if(!W.end)W.end=t+0.25;
    if(t>=W.end){try{W.src.stop();}catch(e){}p.wsh=null;}}
  if(on&&W)W.end=0;
}
// running (trample, or the plain sprint): a light, steady rush of air while he's going, swelling a touch on each stride
function runWoosh(p){
  const on=(p.trK||0)>0.05&&p.state==='walk'&&p.grounded&&playing&&!p.paused&&!SBX;
  if(!audio)return;
  if(on&&!p.rwsh){try{
    const len=audio.sampleRate*2|0,buf=audio.createBuffer(1,len,audio.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<len;i++)ch[i]=Math.random()*2-1;
    const src=audio.createBufferSource(),f=audio.createBiquadFilter(),f2=audio.createBiquadFilter(),g=audio.createGain();src.buffer=buf;src.loop=true;
    f.type='bandpass';f.Q.value=0.7;f.frequency.value=650;f2.type='lowpass';f2.frequency.value=2200;g.gain.value=0.0001;
    src.connect(f).connect(f2).connect(g).connect(audio.destination);src.start();p.rwsh={src,f,g};}catch(e){}}
  const W=p.rwsh;if(!W)return;const t=audio.currentTime;
  if(on){if(DT.sndList)sndNote(0.1,p.sprinting?'Sprint rush':'Trample rush');const k=Math.min(1,p.trK),pulse=0.8+0.2*Math.abs(Math.sin(p.phase)),v=(p.sprinting?0.05:0.065)*k*pulse;
    W.g.gain.setTargetAtTime(Math.max(0.0001,v),t,0.05);W.f.frequency.setTargetAtTime((p.sprinting?620:720)+120*pulse,t,0.08);W.end=0;}
  else{W.g.gain.setTargetAtTime(0.0001,t,0.08);if(!W.end)W.end=t+0.4;if(t>=W.end){try{W.src.stop();}catch(e){}p.rwsh=null;}}
}
const clang=()=>{tone('square',320,180,0.07,0.09);noise(0.06,0.25,2400,'bandpass');};
const horn=(v=0.06)=>{tone('square',330,330,0.3,v);tone('square',415,415,0.3,v);};
// ---- hippo voices: a sustained roar each player can swell and fade, plus one-shot grunts ----
function voice(p){
  if(!audio)return null;if(p.voice)return p.voice;
  try{
    const out=audio.createGain();out.gain.value=0;out.connect(audio.destination);
    const o1=audio.createOscillator(),o2=audio.createOscillator();o1.type='sawtooth';o2.type='sawtooth';
    const len=audio.sampleRate*2,buf=audio.createBuffer(1,len,audio.sampleRate),ch=buf.getChannelData(0);for(let i=0;i<len;i++)ch[i]=Math.random()*2-1;
    const ns=audio.createBufferSource();ns.buffer=buf;ns.loop=true;const ng=audio.createGain();ng.gain.value=0.35;
    const bp=audio.createBiquadFilter();bp.type='bandpass';bp.Q.value=1.1;
    const lp=audio.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1200;
    const am=audio.createGain();am.gain.value=1;
    const lfo=audio.createOscillator();lfo.frequency.value=26;const lfoG=audio.createGain();lfoG.gain.value=0;lfo.connect(lfoG).connect(am.gain);
    o1.connect(bp);o2.connect(bp);ns.connect(ng).connect(bp);bp.connect(lp).connect(am).connect(out);
    o1.start();o2.start();ns.start();lfo.start();
    p.voice={out,o1,o2,bp,lp,lfo,lfoG};
  }catch(e){return null;}
  return p.voice;
}
function setVoice(p,k,mode){if(SBX)return;
  const v=voice(p);if(!v)return;
  try{
    const t=audio.currentTime,m=p.who?1.2:1,base=(mode==='charge'?92:68)*m;
    v.o1.frequency.setTargetAtTime(base*(1+0.65*k),t,0.06);
    v.o2.frequency.setTargetAtTime(base*0.505*(1+0.65*k),t,0.06);
    v.bp.frequency.setTargetAtTime((360+950*k)*m,t,0.07);
    v.lp.frequency.setTargetAtTime(900+2600*k,t,0.07);
    v.lfo.frequency.setTargetAtTime(20+22*k,t,0.1);
    v.lfoG.gain.setTargetAtTime(0.2+0.5*k,t,0.1);
    v.out.gain.setTargetAtTime(k<=0?0:(0.05+0.32*k),t,k<=0?0.12:0.05);
    if(k>0&&DT.sndList)sndNote(0.1,mode==='charge'?'Charging roar':'Roar');
  }catch(e){}
}
// cut the roar dead (on stomp release)
function cutVoice(p){
  p.lastRoarK=0;const v=p.voice;if(!v)return;
  try{const t=audio.currentTime;v.out.gain.cancelScheduledValues(t);v.out.gain.setTargetAtTime(0,t,0.008);}catch(e){}
}
// the hard, clipped grunt as the stomp comes down; heavier for higher charge levels
function stompGrunt(p,lvl){
  if(!audio)return;
  try{
    const m=p.who?1.22:1,t=audio.currentTime,o=audio.createOscillator(),o2=audio.createOscillator(),g=audio.createGain(),f=audio.createBiquadFilter();if(DT.sndList)sndNote(0.2);
    o.type='sawtooth';o2.type='square';f.type='bandpass';f.Q.value=1.6;f.frequency.value=(620+120*lvl)*m;
    o.frequency.setValueAtTime((128-10*lvl)*m,t);o.frequency.exponentialRampToValueAtTime((70-6*lvl)*m,t+0.13);
    o2.frequency.setValueAtTime((64-5*lvl)*m,t);o2.frequency.exponentialRampToValueAtTime((38-3*lvl)*m,t+0.13);
    const peak=Math.min(0.9,0.62+0.12*lvl),len=0.16+0.02*lvl;
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+0.006);g.gain.exponentialRampToValueAtTime(0.001,t+len);
    o.connect(f);o2.connect(f);f.connect(g).connect(audio.destination);
    o.start(t);o2.start(t);o.stop(t+len+0.02);o2.stop(t+len+0.02);
    noise(0.08,0.42+0.08*lvl,1300,'bandpass');
  }catch(e){}
}
function grunt(p,dbl){
  if(!audio||p&&p.gob)return;
  try{
    const m=p.who?1.25:1,t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain(),f=audio.createBiquadFilter();if(DT.sndList)sndNote(dbl?0.27:0.21);
    o.type='sawtooth';f.type='bandpass';f.Q.value=2.2;
    if(!dbl){o.frequency.setValueAtTime(150*m,t);o.frequency.exponentialRampToValueAtTime(82*m,t+0.18);f.frequency.value=640*m;}
    else{o.frequency.setValueAtTime(185*m,t);o.frequency.linearRampToValueAtTime(265*m,t+0.07);o.frequency.exponentialRampToValueAtTime(165*m,t+0.24);f.frequency.value=1150*m;}
    const len=dbl?0.27:0.21;
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.28,t+0.02);g.gain.exponentialRampToValueAtTime(0.001,t+len);
    o.connect(f).connect(g).connect(audio.destination);o.start(t);o.stop(t+len+0.03);
    noise(dbl?0.1:0.13,0.12,dbl?1900:850,'bandpass');
  }catch(e){}
}

