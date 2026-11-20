// Saves keep the game as it was left (ui/play-save.js): the score, goblins slain, This rampage's figures, each player's
// health and stamina, Gnash's weapons, the clock and the weather, and the vehicle he was in. Each case plays a game, saves
// it, then loads that storage in a fresh game (a second process) and reads it all back; plus a save from before any of
// this was kept, which should load as a new game would. node playsave.js [case,...]   (cases: old tank car heli mech
// balloon plane gunner coop dead hippo newcity; coop: Grizzle, player two, the gunner in Gnash's tank, put back in it when she joins). Every line should end "ok".
const fs=require('fs'),cp=require('child_process');
const ARG=process.argv[2]||'',PHASE=process.env.PS_PHASE||'';
if(!PHASE){
  const cases=(ARG||'old,tank,car,heli,mech,balloon,plane,gunner,coop,dead,hippo,newcity').split(',');let bad=0;
  for(const c of cases){
    const tmp=require('path').join(require('os').tmpdir(),'playsave-'+process.pid+'-'+c+'.json');
    const go=ph=>cp.execFileSync(process.execPath,[__filename,c],{env:Object.assign({},process.env,{PS_PHASE:ph,PS_FILE:tmp}),maxBuffer:1e8}).toString();
    let out;try{go('save');out=go('load');}catch(e){out=c+' CRASH '+(e.stdout||'')+(e.stderr||'')+'\n';}
    process.stdout.write(out);if(!/ ok\s*$/.test(out.trim().split('\n').pop()))bad++;
    try{fs.unlinkSync(tmp);}catch(e){}}
  console.log(bad?bad+' case(s) wrong':'all cases ok');return;
}
let __s=+(process.env.SEED||1);Math.random=()=>{__s=(__s*16807)%2147483647;return (__s-1)/2147483646;};
let src=fs.readFileSync('g.js','utf8');
// (an evaluator inside the game's own scope: reads and sets any of its names)
src=src.replace(/requestAnimationFrame\(frame\);\n\}\)\(\);\s*$/,'window.__t={ev:s=>eval(s),frame};})();');
const hdr=fs.readFileSync('dead6.js','utf8').split('\n'),a=hdr.findIndex(l=>l.startsWith('const deep=')),b=hdr.findIndex(l=>l.startsWith('eval(src);'));
const STORE=PHASE==='load'?JSON.parse(fs.readFileSync(process.env.PS_FILE,'utf8')):{};
const C=ARG;
// (a goblin for the cases that drive or carry weapons)
if(PHASE==='save'&&!['hippo','dead','old','newcity'].includes(C))STORE['goblin-stompin-gus-character']='gnash';
if(PHASE==='save'&&C==='coop')STORE['goblin-stompin-gus-character2']='grizzle';
eval(hdr.slice(a,b).join('\n').replace("global.localStorage={getItem:()=>null,setItem(){}};",
  "global.localStorage={getItem:k=>k in STORE?STORE[k]:null,setItem(k,v){STORE[k]=String(v)},removeItem(k){delete STORE[k]}};"));
eval(src);const T=window.__t,E=T.ev;let now=1000;const run=s=>{for(let i=0;i<s*60;i++){now+=16.7;T.frame(now);}};
E("for(const f of document.getElementById('play').L.click)f()");navigator.getGamepads().length=0;run(1);
const A=E('P1');
const near=(a,b,e=0.01)=>Math.abs(a-b)<=e;
if(PHASE==='save'){
  if(C!=='old'){
    E("score=4321;kills=57;RAMP.cars=6;RAMP.best=9;RAMP.bldgs.add('b1');RAMP.bldgs.add('b2');RAMP.bldgs.add('b3');RAMP.razed.add('1,2');RAMP.pre.add('3,4');RAMP.seen.add('1,2');RAMP.seen.add('3,4');RAMP.nB=3;RAMP.nR=1;playTime=777");
    // (day 95: winter, snowing, in the evening)
    E("tod=0.71;dayN=95;wxSet('snow',true);WX.until=gameDays()+0.5;WX.snowCover=0.6;WX.snowClock=3.5;WX.wet=0.2");
    A.hp=C==='dead'?0:13;A.stam=40;if(C==='dead'){E("P1.deadT=4;P1.state='dead'");}
  }
  if(A.gob){E("gobArms(P1);P1.wpns=['club','handgun','rifle','grenade'].filter(k=>GOB_WPN[k]);P1.wpn='rifle';P1.ammo={handgun:3,rifle:2};P1.gren=2");}
  const spawn=(t,k)=>{E(`tenvSpawnOne('${t}')`);let D=null;
    if(k==='car')D=E(`(()=>{const c=cars.filter(c=>c.alive&&c.parked&&!c.drv&&(c.veh===${JSON.stringify(t)}||c.police&&${JSON.stringify(t)}==='police')).sort((a,b)=>Math.hypot(a.pos.x-P1.pos.x,a.pos.z-P1.pos.z)-Math.hypot(b.pos.x-P1.pos.x,b.pos.z-P1.pos.z))[0];return c?{k:'car',o:c}:null;})()`);
    else if(k==='tank'||k==='heli'){const V=E("venues.get('tenvArmy')"),M=V&&V.mil[V.mil.length-1];if(M){M.state='idle';M.crew=null;D={k,o:M,V};}}
    else if(k==='mech'){const V=E("venues.get('tenvMechs')");if(V)D={k,o:V.mechs[V.mechs.length-1],V};}
    else if(k==='balloon'){const V=E("venues.get('tenvBalloons')");if(V)D={k,o:V.bl[V.bl.length-1],V};}
    else if(k==='plane'){const V=E("venues.get('tenvPlanes')");if(V)D={k,o:V.pl[V.pl.length-1],V};}
    return D;};
  const V0={tank:['tank','tank'],car:['bus','car'],heli:['heli','heli'],mech:['mech','mech'],balloon:['balloon','balloon'],plane:['jet','plane'],gunner:['tank','tank'],coop:['tank','tank']}[C];
  let vehInfo=null;
  if(V0){const D=spawn(V0[0],V0[1]);if(!D){console.log(C+' no vehicle spawned BAD');process.exit(0);}
    if(C==='gunner')D.seat='gun';
    E('drvEnter')(A,D);run(0.5);
    // (damaged a little first, so its health coming back is seen)
    const max=E('VEHICLE_KINDS')[D.k].max(D.o);D.o.hp=Math.round(max*0.6*10)/10;
    if(C==='heli'){D.o.y+=12;}   // (up in the air: it should come back on the ground under where it was)
    if(C==='coop'){const B=E('activateP2(),P2');run(0.3);B.hp=7;E('drvEnter')(B,Object.assign({},D,{seat:'gun'}));run(0.3);}
    run(0.2);const S=E('drvPose')(D);vehInfo={k:D.k,x:S.x,z:S.z,h:S.h,hp:D.o.hp,seat:D.seat||'drv',t:D.o.veh||null};}
  E('savePos()');E('playSave()');E("localStorage.setItem(SAVE_KEY,saveText({}))");
  if(C==='old')delete STORE['goblin-stompin-gus-play'];
  if(C==='newcity'){E("score=99;kills=3;playSave()");E("document.getElementById('confirmYes').L.click.forEach(f=>f())");E("savePos();playSave();localStorage.setItem(SAVE_KEY,saveText({}))");}
  STORE.__want=JSON.stringify({veh:vehInfo,gob:!!A.gob});
  fs.writeFileSync(process.env.PS_FILE,JSON.stringify(STORE));process.exit(0);
}
// ---- load ----
const W=JSON.parse(STORE.__want||'{}');let ok=true;const out=[];
const chk=(name,got,want,good)=>{const g=good===undefined?got===want:good;if(!g)ok=false;out.push(name+' '+(typeof got==='number'?+got.toFixed(3):JSON.stringify(got))+(g?'':' (want '+JSON.stringify(want)+')'));};
run(0.5);
const fresh=C==='old'||C==='newcity';
chk('score',E('score'),fresh?0:4321);chk('kills',E('kills'),fresh?0:57);
chk('hud',/57 goblins slain/.test(E('readoutH'))||fresh,true);
chk('cars',E('RAMP.cars'),fresh?0:6);chk('best',E('RAMP.best'),fresh?0:9);chk('bldgs',E('RAMP.nB'),fresh?0:3);chk('razed',E('RAMP.nR'),fresh?0:1);
chk('pre',E('RAMP.pre.size'),fresh?0:1);chk('seen',E('RAMP.seen.size'),fresh?0:2);
chk('day',E('dayN'),fresh?1:95);chk('tod',E('tod'),0,fresh?E('tod')<0.2:near(E('tod'),0.71,0.02));
chk('season',E('seasonOf()'),fresh?0:3);chk('weather',E('WX.type'),fresh?'clear':'snow');chk('frozen',E('!!WX.frozen'),!fresh);
chk('snow',E('WX.snowCover'),0,fresh?E('WX.snowCover')===0:E('WX.snowCover')>0.55);
chk('playTime',E('playTime'),0,fresh?E('playTime')<5:E('playTime')>=777);
chk('hp',A.hp,fresh||C==='dead'?20:13);chk('stam',A.stam,0,fresh||C==='dead'?A.stam>90:A.stam>=38&&A.stam<95);   // (stamina comes back on its own, quickly for a hippo)
if(W.gob){chk('wpns',A.wpns,0,JSON.stringify(A.wpns)===JSON.stringify(['club','handgun','rifle','grenade'].filter(k=>E('GOB_WPN')[k])));
  chk('wpn',A.wpn,'rifle');chk('ammo',[A.ammo.handgun,A.ammo.rifle],0,A.ammo.handgun===3&&A.ammo.rifle===2);chk('gren',A.gren,2);}
if(W.veh){const D=A.drv;chk('in',D?D.k+'/'+(D.seat||'drv'):null,W.veh.k+'/'+W.veh.seat,!!D&&D.k===W.veh.k&&(D.seat||'drv')===W.veh.seat);
  if(D){const S=E('drvPose')(D),gy=E('groundAt')(S.x,S.z,S.y+0.5);
    chk('at',Math.hypot(S.x-W.veh.x,S.z-W.veh.z),0,Math.hypot(S.x-W.veh.x,S.z-W.veh.z)<3);
    chk('onground',S.y-gy,0,Math.abs(S.y-gy)<1.5);
    chk('vhp',D.o.hp,W.veh.hp,near(D.o.hp,W.veh.hp,0.6));
    if(W.veh.t)chk('kind',D.o.veh,W.veh.t);}}
else chk('in',A.drv?A.drv.k:null,null);
if(C==='coop'){const B=E('activateP2(),P2');run(0.3);const D=B.drv;
  chk('p2hp',B.hp,7);chk('p2in',D?D.k+'/'+D.seat:null,'tank/gun',!!D&&D.seat==='gun'&&!!A.drv&&D.o===A.drv.o&&D.o.gnr===B);}
console.log(C+': '+out.join(', ')+(ok?' ok':' BAD'));
process.exit(0);
