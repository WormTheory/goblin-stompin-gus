// ---- the Dev tab's Enemies section: each kind of enemy acting out each of its animations on a flat field like the moves
// preview's, recorded frame by frame and played back with its own controls, with its hits, what it fires and its timings.
// The poses are worked out with the same sums as the enemies' own code (the chase in enemies/routes.js, civAI in crowds.js,
// cultCalm and cultCast in cultists.js, guardCalm and foeRanged in foes.js), and the numbers come from the same tables, so
// a change to a table shows up here; a change to one of those sums wants making here too. Nothing here touches the world. ----
const DEV_MELEE={dmg:1,every:1.5,w:'Club'};   // (a street goblin's: routes.js, g.atk)
const DEV_FOE_KINDS=[
  {k:'goblin',n:'Goblin',hp:4,spd:2.8,melee:DEV_MELEE,look:{tunic:GC.tunic,pants:0x3a3328,hat:0x2a2a2a,show:['bandana','pouch']},
    anims:['idle','walk','attack','jump','climb','swim','death']},
  {k:'cop',n:'Police officer',hp:4,spd:2.8,melee:DEV_MELEE,look:{tunic:0x1c2a5a,pants:0x1c2a5a,hat:0x1c2a5a,show:['cap']},
    anims:['idle','walk','attack','jump','climb','swim','death']},
  {k:'civ',n:'Civilian',hp:3,spd:1.5,civ:true,look:{skin:0x7aa848,tunic:0x2a7a5a,pants:0x2b2f38,hat:0xc9a02a,show:['cap','glasses']},
    anims:['idle','walk','flee','stall','swim','death']},
  {k:'cultist',n:'Cultist',hp:4,spd:2.8,cult:true,melee:{dmg:1,every:0.85,w:'Ritual dagger'},look:{tunic:CULT_ROBE,pants:0x1a0a0c,hat:CULT_HOOD,acc:0x2a0408,acc2:0x2a0408,show:[]},
    anims:['chant','walk','attack','cast','jump','climb','swim','death']},
  ...['thief','prepper','militia'].map(k=>{const F=FOES[k];return{k,n:F.name,hp:F.hp,spd:F.spd,foe:F,melee:{dmg:F.melee[0],every:F.melee[1],w:F.gear==='dagger'?'Dagger':'Rifle butt'},
    look:{tunic:F.tunic,pants:F.pants,hat:F.hatc,acc:F.pants,show:[F.hat,k==='thief'?'eyepatch':'pouch']},
    anims:['guard','walk','attack',...(F.gun?['shoot']:[]),...(F.bomb?['throw']:[]),'jump','climb','swim','death']};})];
const DEV_FOE_ANIM_N={idle:'Stand',walk:'Walk (chasing)',attack:'Attack',jump:'Jump up a step',climb:'Climb a wall',swim:'Swim',death:'Die',
  flee:'Run away screaming',stall:'Serve at a stall',chant:'Chant at the altar',cast:'Conjure a fireball',guard:'On guard',shoot:'Aim and fire',throw:'Throw a grenade'};
const DEV_TARGET=10;   // (how far off Gus stands for a shot, a throw or a fireball)
const DEVF={kind:'goblin',anim:'walk',rec:null,f:0,play:true,speed:1,loop:true,yaw:0.75,pitch:0.3,zoom:1,r:null,scene:null,cam:null,figs:{},pool:{},lb:null,sk:null,set:null};
const DEV_FOE_KEY='goblin-stompin-gus-devfoe',DEVF_O={x:0,z:0};
try{const s=JSON.parse(localStorage.getItem(DEV_FOE_KEY)||'null');if(s&&DEV_FOE_KINDS.some(K=>K.k===s.k)){DEVF.kind=s.k;if(DEV_FOE_KINDS.find(K=>K.k===s.k).anims.includes(s.a))DEVF.anim=s.a;}}catch(e){}
const devFoKind=k=>DEV_FOE_KINDS.find(K=>K.k===k)||DEV_FOE_KINDS[0];
const devFoWk=K=>gobWk({cultist:!!K.cult,foeKind:K.foe?K.k:null});   // (which blow it strikes with: strikes.js)
const devFoAnimName=(K,a)=>a==='attack'&&K.melee?K.melee.w==='Club'?'Club swing':K.melee.w==='Rifle butt'?'Rifle butt':'Dagger stab':DEV_FOE_ANIM_N[a];
// its model: the game's own, dressed in a fixed look for its kind, with names on its joints for the skeleton
function devFoFig(K){
  if(DEVF.figs[K.k])return DEVF.figs[K.k];
  const root=new THREE.Group();root.name='root';root.rotation.order='YXZ';root.visible=false;
  const F=K.foe,m=goblinModel(root,K.cult?{club:false,cult:true,tunic:CULT_ROBE}:F?{club:false,gear:F.gear,held:F.held,tunic:F.tunic}:K.civ?{club:false,tunic:K.look.tunic}:{});
  m.root=root;m.head.name='head';m.arm.name='arm.R';m.armL.name='arm.L';m.legs[0].name='leg.L';m.legs[1].name='leg.R';
  applyLook(m,Object.assign({skin:GC.skin,hat:0x2a2a2a,acc:0x884422,acc2:0x111111,hair:0x1b1b1b,h:1,w:1,hs:1},K.look),ES);
  if(m.orb&&K.cult)m.roles.orb.emissive.setHex(0xff5a00);   // (a fireball glows: cultCast lights it)
  const fig=Object.assign(devFig(root),{m});DEVF.figs[K.k]=fig;if(DEVF.scene)DEVF.scene.add(root);return fig;
}
// ---- the sums, as the enemies' own code does them ----
const dfAng=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};
// the end of every chasing goblin's step (routes.js, after the AI): legs, paddling arms, the bob, its heading, a head sway
function dfEnd(g,moving){
  const sn=Math.sin(g.phase);g.legs[0].rotation.x=moving?sn*0.7:0;g.legs[1].rotation.x=moving?-sn*0.7:0;
  if(g.wet&&moving){g.arm.rotation.x=-1.6+sn*0.9;g.armL.rotation.x=-1.6-sn*0.9;}
  gobRootPose(g,g.pos.y+(moving?Math.abs(sn)*0.05:0),1/60);g.head.rotation.z=Math.sin(g.t*2+g.heading)*0.08;   // (with a blow's twist, lean and step: strikes.js)
}
// a blow, a shot, a throw or a fireball (gobMeleePose, foeRanged, cultCast): the follow-through once it's gone, true while
// there's one to show
const dfFollow=g=>{if((g.relS??9)<STRIKE_FT&&g.relK){gobStrike(g,g.relK,1+g.relS/STRIKE_FT);return true;}return false;};
// a hunting goblin's club arm, between blows: back to the rest, swinging a little as it goes
const dfArm=(g,moving,dt)=>{g.arm.rotation.x+=((-0.5+(moving?Math.sin(g.phase)*0.4:0))-g.arm.rotation.x)*Math.min(1,dt*8);};
const dfFwd=(g,sp,dt)=>{g.pos.x+=Math.sin(g.heading)*sp*dt;g.pos.z+=Math.cos(g.heading)*sp*dt;};
// a jump or a climb in progress (gobMoveStep): just the act, no bob and no head sway
function dfAct(g,dt){
  const A=g.act;g.phase+=dt*9;const sn=Math.sin(g.phase);
  if(A.k==='jump'){A.t+=dt;const s=Math.min(1,A.t/A.T),up=A.y1>A.y0+0.5,sx=up?s*s:s;g.pos.x=A.x0+(A.x1-A.x0)*sx;g.pos.z=A.z0+(A.z1-A.z0)*sx;g.pos.y=A.y0+(A.y1-A.y0)*Math.min(1,s*(up?1.6:1))+A.h*4*s*(1-s);
    g.arm.rotation.x=-2.2;g.armL.rotation.x=-2.2;g.legs[0].rotation.x=0.6;g.legs[1].rotation.x=-0.6;if(s>=1){g.pos.y=Math.max(g.pos.y,A.y1);g.act=null;}}
  else{g.pos.x+=(A.x-g.pos.x)*Math.min(1,dt*10);g.pos.z+=(A.z-g.pos.z)*Math.min(1,dt*10);
    g.arm.rotation.x=-2.6+sn*0.5;g.armL.rotation.x=-2.6-sn*0.5;g.legs[0].rotation.x=-0.5+sn*0.5;g.legs[1].rotation.x=-0.5-sn*0.5;
    g.pos.y+=dt*2.6;if(g.pos.y>=A.y1-.1){const L=Math.hypot(A.tx-g.pos.x,A.tz-g.pos.z);g.act={k:'jump',t:0,T:0.3,x0:g.pos.x,y0:g.pos.y,z0:g.pos.z,x1:A.tx,y1:A.y1,z1:A.tz,h:0.25+L*.05};}}
  g.root.position.set(g.pos.x,g.pos.y,g.pos.z);g.root.rotation.y=g.heading;
}
// standing still between things: the hostile kinds' arm at rest (a civilian's hangs), the free hand back down
function dfStand(g,K,dt){if(K.civ){g.arm.rotation.x=0;g.armL.rotation.x=0;}else dfArm(g,false,dt);g.armL.rotation.x+=(0-g.armL.rotation.x)*Math.min(1,dt*6);dfEnd(g,false);}
const dfFrames=s=>Math.round(s*60)+' f ('+(+s.toFixed(2))+' s)';
// each animation: how long the recording runs, how it starts (and the scenery it needs), each step, and its frame data
const DEV_FOE_ANIM={
  idle:{dur:()=>3,step(g,K,dt){dfStand(g,K,dt);},data:K=>[]},
  walk:{dur:()=>2.4,step(g,K,dt){const sp=K.spd;dfFwd(g,sp,dt);g.phase+=dt*sp*4.5;
      if(K.civ){const sw=Math.sin(g.phase)*0.4;g.arm.rotation.x=sw;g.armL.rotation.x=-sw;}else dfArm(g,true,dt);dfEnd(g,true);},
    data:K=>[['Speed',K.spd+' blocks/s'],['Stride','legs swing ±0.7 rad, '+(K.spd*4.5).toFixed(1)+' rad/s']]},
  flee:{dur:()=>2.4,step(g,K,dt){const sp=3.8;dfFwd(g,sp,dt);g.phase+=dt*sp*4.5;g.arm.rotation.x=-2.7+Math.sin(g.t*18)*0.35;g.armL.rotation.x=-2.7+Math.sin(g.t*18+2)*0.35;dfEnd(g,true);},
    data:K=>[['Speed','3.8 blocks/s'],['Runs from','a hippo within 14 blocks (9 for a stall keeper)'],['Screams','every 1.4–3.6 s']]},
  stall:{dur:()=>Math.PI*2/3*2,step(g,K,dt){g.arm.rotation.x=-0.5+Math.sin(g.t*3)*0.3;g.armL.rotation.x=-0.3;dfEnd(g,false);},data:K=>[['Serving','arm bobs every '+dfFrames(Math.PI*2/3)]]},
  chant:{dur:()=>Math.PI*2/1.6,step(g,K,dt){const ph=g.t*1.6;g.arm.rotation.x=-2.7-0.25*Math.sin(ph);g.armL.rotation.x=-2.7-0.25*Math.sin(ph+0.6);dfEnd(g,false);},
    data:K=>[['Chant','arms sway every '+dfFrames(Math.PI*2/1.6)],['Roused by','Gus within 15 of the altar, or hurting one']]},
  guard:{dur:()=>6,step(g,K,dt){g.heading=Math.sin(g.t*0.3)*1.2;g.arm.rotation.x=-0.5;g.armL.rotation.x*=0.9;dfEnd(g,false);},
    data:K=>[['Looks round','±1.2 rad, every '+(Math.PI*2/0.3).toFixed(1)+' s']]},
  // a blow every so often, Gus in reach: wound up over the last 0.45 s (the strike itself the last few frames of that),
  // then the hit (from the frame after one), and the follow-through (gobMeleePose)
  attack:{dur:K=>K.melee.every*2,init(g,K,C){g.atk=K.melee.every;g.atkS=0;C.target(2);C.hit(0,'dmg','cyl',{x:g.pos.x,y:g.pos.y-1.5,z:g.pos.z,r:2.3,h:2.8},K.melee.dmg);},
    step(g,K,dt,C){if(C.f){g.atk-=dt;g.atkS+=dt;}   // (frame 0 is the blow that's just landed)
      if(g.atk<=0){C.hit(C.f,'dmg','cyl',{x:g.pos.x,y:g.pos.y-1.5,z:g.pos.z,r:2.3,h:2.8},K.melee.dmg);g.atk=K.melee.every;g.atkS=0;}
      if(!gobMeleePose(g,true))dfArm(g,false,dt);dfEnd(g,false);},
    marks:(K,N,R)=>{const w=devFoWk(K),sw=Math.round(strikeSwing(w)*27),ft=Math.round(STRIKE_FT*60);
      return[...R.hits.filter(h=>h.f>0),{f:N}].flatMap(h=>[{row:'Wind-up',a:h.f-27,b:h.f-sw-1,c:'wind'},{row:'Strike',a:h.f-sw,b:h.f-1,c:'wind'}])   // (the last: for the blow at the start of the next loop)
        .concat(R.hits.map(h=>({row:'Follow-through',a:h.f,b:Math.min(N-1,h.f+ft-1),c:'wind'})));},
    data:K=>{const sw=Math.round(strikeSwing(devFoWk(K))*27);return[['Weapon',K.melee.w],['Damage',K.melee.dmg+(K.melee.dmg===1?' heart':' hearts')],['Again every',dfFrames(K.melee.every)],
      ['Wind-up',dfFrames(0.45)+' before the hit'],['Strike','the last '+sw+' f of it'],['Follow-through',dfFrames(STRIKE_FT)+' after'],
      ['Reach','2.3 blocks, from 1.3 below to 1.5 above'],['Hit volume','cylinder r 2.3, h 2.8']];}},
  jump:{dur:()=>1.6,init(g,K,C){C.box(-1,G+1,2,1,G+1,3);},step(g,K,dt,C){
      if(!g.act&&!g.done&&g.t>0.4){g.done=true;const tx=0.5,tz=2.5,L=Math.hypot(tx-g.pos.x,tz-g.pos.z);g.act={k:'jump',t:0,T:Math.max(0.45,L/6.5),x0:g.pos.x,y0:g.pos.y,z0:g.pos.z,x1:tx,y1:G+2,z1:tz,h:0.7+L*0.18};C.mark('Jump',C.f,C.f+Math.round(g.act.T*60)-1,'wind');}
      if(g.act)dfAct(g,dt);else dfStand(g,K,dt);},
    data:K=>[['Takes','at least '+dfFrames(0.45)+', or the gap ÷ 6.5 blocks/s'],['Height','0.7 + 0.18 × the gap, over the step'],['Up to','a step of 2.6 blocks']]},
  climb:{dur:()=>2.8,init(g,K,C){C.box(-1,G+1,1,1,G+4,1);g.pos.z=0.7;},step(g,K,dt,C){
      if(!g.act&&!g.done&&g.t>0.3){g.done=true;g.act={k:'up',x:g.pos.x,z:0.7,y1:G+5,tx:0.5,tz:1.5};C.mark('Climb',C.f,C.f+Math.round((4-0.1)/2.6*60),'wind');}
      if(g.act)dfAct(g,dt);else dfStand(g,K,dt);},
    data:K=>[['Climbs','2.6 blocks/s up, 3.2 down'],['Over the top','a hop of '+dfFrames(0.3)],['Swings','while both are on the same wall, every 1.5 s']]},
  swim:{dur:()=>2.4,init(g,K,C){g.wet=true;g.pos.y=G+1.6;C.water(K.civ?g.pos.y+0.9:g.pos.y+1.3);},step(g,K,dt){const sp=2;dfFwd(g,sp,dt);g.phase+=dt*sp*4.5;
      if(K.civ){const sw=Math.sin(g.phase)*0.4;g.arm.rotation.x=sw;g.armL.rotation.x=-sw;}else dfArm(g,true,dt);dfEnd(g,true);},
    data:K=>[['Speed','2 blocks/s'],['Floats','with its head '+(K.civ?'up':'just')+' out'+(K.civ?'':'; dives after a hippo that’s sunk close by')]]},
  death:{dur:()=>2,step(g,K,dt,C){if(!g.dead){g.dead=true;g.t0=g.t;C.mark('Falls',C.f,C.f+19,'wind');}const f=Math.min(1,(g.t-g.t0)*3);g.root.rotation.x=-f*Math.PI/2;
      g.root.position.set(g.pos.x,g.pos.y+f*0.15,g.pos.z);g.root.rotation.y=g.heading;g.arm.rotation.x=-1.4;g.armL.rotation.x=-1.4;},
    data:K=>[['Health',K.hp+' points'],['Falls over in',dfFrames(1/3)],['Sinks away','after 8 s, gone after 11 (unless an ambulance is coming)']]},
  // a fireball: the left hand up, the ball growing in it for CULT_CAST, thrown at Gus's chest
  cast:{dur:()=>0.3+CULT_CAST+1,init(g,K,C){C.target(DEV_TARGET);g.castT=0.3;},step(g,K,dt,C){
      if(g.castT>0&&(g.castT-=dt)<=0){g.cast=CULT_CAST;C.mark('Conjure',C.f,C.f+Math.round(CULT_CAST*60)-1,'wind');}
      if(g.cast>0){g.cast-=dt;const k=1-Math.max(0,g.cast)/CULT_CAST;gobStrike(g,'cast',k);g.orb.visible=true;g.orb.scale.setScalar(0.4+k*0.9);
        if(g.cast<=0){const fx=Math.sin(g.heading),fz=Math.cos(g.heading);C.ball(C.f,[g.pos.x+fx*0.5,g.pos.y+1.6,g.pos.z+fz*0.5],[0,G+1+1.5,DEV_TARGET],FB_SPEED,0,0xff7a1a,{r:1.4,dmg:2});
          g.orb.visible=false;g.relS=0;g.relK='cast';C.mark('Follow-through',C.f+1,C.f+Math.round(STRIKE_FT*60),'wind');}
        g.legs[0].rotation.x=g.legs[1].rotation.x=0;gobRootPose(g,g.pos.y,dt);return;}
      g.relS+=dt;if(!dfFollow(g)){g.armL.rotation.x+=(0-g.armL.rotation.x)*Math.min(1,dt*6);dfArm(g,false,dt);}dfEnd(g,false);},
    data:K=>[['Conjures for',dfFrames(CULT_CAST)+' (the warning you get)'],['Range','4.5 to 30 blocks, when it can see you'],['Fireball','flies at '+FB_SPEED+' blocks/s, bending a little after you'],['Damage','2 hearts'],['Again after','2.4–4 s']]},
  // a rifle shot: raised and aimed for a moment, then hitscan with a tracer
  shoot:{dur:K=>0.3+K.foe.gun[2]+0.8,init(g,K,C){C.target(DEV_TARGET);g.aimT=0.3;},step(g,K,dt,C){const F=K.foe;
      if(g.aimT>0&&(g.aimT-=dt)<=0){g.aim=F.gun[2];C.mark('Aim',C.f,C.f+Math.round(F.gun[2]*60)-1,'wind');}
      if(g.aim>0){g.aim-=dt;gobStrike(g,'aim',1-Math.max(0,g.aim)/F.gun[2]);
        if(g.aim<=0){const fx=Math.sin(g.heading),fz=Math.cos(g.heading);C.tracer(C.f,[g.pos.x+fx*0.8,g.pos.y+1.05,g.pos.z+fz*0.8],[0,G+1+1.2,DEV_TARGET],F.gun[4]);
          g.relS=0;g.relK='aim';C.mark('Follow-through',C.f+1,C.f+Math.round(STRIKE_FT*60),'wind');}
        g.legs[0].rotation.x=g.legs[1].rotation.x=0;gobRootPose(g,g.pos.y,dt);return;}
      g.relS+=dt;if(!dfFollow(g)){g.armL.rotation.x+=(0-g.armL.rotation.x)*Math.min(1,dt*6);dfArm(g,false,dt);}dfEnd(g,false);},
    data:K=>{const G6=K.foe.gun;return[['Aims for',dfFrames(G6[2])],['Range',G6[0]+' to '+G6[1]+' blocks, when it can see you'],['Damage',G6[4]+' heart'+(G6[4]===1?'':'s')],
      ['Hits','92% close up, less 1.7% a block, at least 30% (at '+DEV_TARGET+': '+Math.round(Math.max(0.3,0.92-DEV_TARGET/60)*100)+'%)'],['Again after',G6[3][0]+'–'+G6[3][1]+' s']];}},
  // a grenade: wound up in the left hand, lobbed in an arc at Gus, bursting when its fuse runs out
  throw:{dur:K=>0.3+0.6+K.foe.bomb[3]+0.5,init(g,K,C){C.target(DEV_TARGET);g.aimT=0.3;},step(g,K,dt,C){const B=K.foe.bomb;
      if(g.aimT>0&&(g.aimT-=dt)<=0){g.aim=0.6;C.mark('Wind-up',C.f,C.f+35,'wind');}
      if(g.aim>0){g.aim-=dt;g.orb.visible=true;gobStrike(g,'throw',1-Math.max(0,g.aim)/0.6);
        if(g.aim<=0){const fx=Math.sin(g.heading),fz=Math.cos(g.heading),x0=g.pos.x+fx*0.4,y0=g.pos.y+1.6,z0=g.pos.z+fz*0.4,ty=G+1+0.3,D=Math.hypot(0-x0,DEV_TARGET-z0),T=0.55+D/16;
          C.ball(C.f,[x0,y0,z0],[0,ty,DEV_TARGET],D/T,20,0xb8d070,{r:B[4],dmg:B[5],fuse:B[3]});g.orb.visible=false;g.relS=0;g.relK='throw';C.mark('Follow-through',C.f+1,C.f+Math.round(STRIKE_FT*60),'wind');}
        g.legs[0].rotation.x=g.legs[1].rotation.x=0;gobRootPose(g,g.pos.y,dt);return;}
      g.relS+=dt;if(!dfFollow(g)){g.armL.rotation.x+=(0-g.armL.rotation.x)*Math.min(1,dt*6);dfArm(g,false,dt);}dfEnd(g,false);},
    data:K=>{const B=K.foe.bomb;return[['Wind-up',dfFrames(0.6)],['Range',B[0]+' to '+B[1]+' blocks (over a wall, if near enough)'],['Flight','0.55 s + 1 s per 16 blocks'],
      ['Fuse',B[3]+' s from the hand'],['Blast','radius '+B[4]+', '+B[5]+' hearts'],['Again after',B[2][0]+'–'+B[2][1]+' s']];}},
};
// act it out and record it
function devFoSim(kind,anim){
  const K=devFoKind(kind),A=DEV_FOE_ANIM[anim],fig=devFoFig(K),m=fig.m,nodes=fig.nodes,M=nodes.length,FL=11,N=Math.max(2,Math.round(A.dur(K)*60)),dt=1/60;
  const rec={kind,anim,N,M,fig:K.k,tr:new Float32Array(N*M*FL),pos:new Float32Array(N*4),hits:[],shots:[],boxes:[],marks:[],target:null,water:null};
  const g={pos:new V3(0.5,G+1,0.5),heading:0,phase:0,t:0,atk:1,atkS:9,relS:9,relK:null,cultist:!!K.cult,foeKind:K.foe?K.k:null,legs:m.legs,arm:m.arm,armL:m.armL,head:m.head,root:m.root,orb:m.orb||null,act:null,wet:false};
  m.root.rotation.set(0,0,0);m.arm.rotation.set(K.civ?0:-0.5,0,0);m.arm.hand.rotation.x=0;m.armL.rotation.x=0;for(const l of m.legs)l.rotation.x=0;m.head.rotation.z=0;if(m.orb){m.orb.visible=false;m.orb.scale.setScalar(1);}
  const C={f:0,
    hit(f,kind,shape,o,dmg){rec.hits.push({f,until:f+12,kind,shape,o,dmg});},
    target(d){rec.target={x:0.5,z:0.5+d};},
    box(x0,y0,z0,x1,y1,z1){rec.boxes.push([x0,y0,z0,x1,y1,z1]);},
    water(y){rec.water=y;},
    mark(row,a,b,c){rec.marks.push({row,a,b,c});},
    tracer(f,a,b,dmg){rec.shots.push({k:'tracer',f,a,b});C.hit(f,'dmg','sph',{x:b[0],y:b[1],z:b[2],r:0.35},dmg);},
    // something thrown or flown: straight at sp blocks a second, or (with gravity) in an arc that lands there; it bursts on
    // arrival, or once its fuse is out
    ball(f,a,b,sp,grav,col,hit){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],D=Math.hypot(dx,dz),T=grav?D/sp:Math.hypot(dx,dy,dz)/sp,vy=grav?(dy+0.5*grav*T*T)/T:dy/T,path=[];
      const end=hit.fuse?Math.max(T,hit.fuse):T;for(let t=0;t<=end+1e-6;t+=dt){const k=Math.min(t,T)/T,tt=Math.min(t,T);path.push([a[0]+dx*k,a[1]+vy*tt-0.5*grav*tt*tt,a[2]+dz*k]);}
      const fe=f+path.length-1,q=path[path.length-1];rec.shots.push({k:'ball',f,path,col});C.hit(fe,'dmg','sph',{x:q[0],y:q[1],z:q[2],r:hit.r},hit.dmg);C.mark(hit.fuse?'Grenade':'Fireball',f,fe,'shot');}};
  if(A.init)A.init(g,K,C);
  for(let f=0;f<N;f++){C.f=f;
    if(f)g.t+=dt;A.step(g,K,dt,C);
    for(let i=0;i<M;i++){const o=nodes[i],b=(f*M+i)*FL,T=rec.tr;T[b]=o.position.x;T[b+1]=o.position.y;T[b+2]=o.position.z;T[b+3]=o.quaternion.x;T[b+4]=o.quaternion.y;T[b+5]=o.quaternion.z;T[b+6]=o.quaternion.w;T[b+7]=o.scale.x;T[b+8]=o.scale.y;T[b+9]=o.scale.z;T[b+10]=o.visible?1:0;}
    rec.pos[f*4]=g.pos.x;rec.pos[f*4+1]=g.pos.y;rec.pos[f*4+2]=g.pos.z;rec.pos[f*4+3]=g.heading;}
  if(A.marks)rec.marks.push(...A.marks(K,N,rec));
  for(const h of rec.hits)h.until=Math.min(N-1,h.until);
  rec.data=[['Health',K.hp+' points'],...A.data(K),['Recording',N+' frames ('+(N/60).toFixed(2)+' s)']];
  if(anim==='death')rec.data.shift();   // (said already)
  // the frame of the preview: round everywhere it went, and anything it fired at
  let x0=-1,x1=1,z0=-1,z1=1,y1=G+3;for(let f=0;f<N;f++){x0=Math.min(x0,rec.pos[f*4]);x1=Math.max(x1,rec.pos[f*4]);z0=Math.min(z0,rec.pos[f*4+2]);z1=Math.max(z1,rec.pos[f*4+2]);y1=Math.max(y1,rec.pos[f*4+1]+2);}
  if(rec.target)z1=Math.max(z1,rec.target.z+1);
  rec.c={x:(x0+x1)/2,y:G+1.2,z:(z0+z1)/2};rec.rad=Math.max(2.6,Math.hypot(x1-x0,z1-z0)/2+1,(y1-G)*0.5);
  return rec;
}
function devFoInitGL(){
  if(DEVF.r)return true;
  try{DEVF.r=new THREE.WebGLRenderer({canvas:document.getElementById('devFoCanvas'),antialias:true});}catch(e){return false;}
  DEVF.r.setPixelRatio(Math.min(devicePixelRatio||1,2));DEVF.r.setClearColor(0x141a20);
  const S=DEVF.scene=new THREE.Scene();
  S.add(new THREE.HemisphereLight(0xeef2e6,0x3a4030,0.95));const d=new THREE.DirectionalLight(0xffeedd,0.7);d.position.set(3,6,4);S.add(d);
  devFloor(S,DEVF.r);
  DEVF.lb=devLB(10);S.add(DEVF.lb.m);DEVF.sk=devLB(12);S.add(DEVF.sk.m);
  DEVF.cam=new THREE.PerspectiveCamera(40,16/9,0.1,400);
  for(const k in DEVF.figs)S.add(DEVF.figs[k].root);
  return true;
}
// the scenery a recording needs (a step, a wall, water), made fresh for each one
const DEVF_WALL=new THREE.MeshLambertMaterial({color:0x6a6f76,transparent:true,opacity:0.45,depthWrite:false}),   // (see-through: the camera's often on the far side of it)
  DEVF_WATER=new THREE.MeshBasicMaterial({color:0x2a7ad0,transparent:true,opacity:0.35,depthWrite:false,side:THREE.DoubleSide});
function devFoSet(R){
  if(DEVF.set){DEVF.scene.remove(DEVF.set);DEVF.set=null;}if(!DEVF.scene)return;
  const S=DEVF.set=new THREE.Group();
  for(const [x0,y0,z0,x1,y1,z1] of R.boxes){const b=new THREE.Mesh(DEV_SOLID.box,DEVF_WALL);b.scale.set(x1-x0+1,y1-y0+1,z1-z0+1);b.position.set((x0+x1+1)/2,(y0+y1+1)/2,(z0+z1+1)/2);S.add(b);}
  if(R.water!==null){const w=new THREE.Mesh(new THREE.PlaneGeometry(24,24),DEVF_WATER);w.rotation.x=-Math.PI/2;w.position.set(0.5,R.water,R.c.z);w.renderOrder=8;S.add(w);}
  DEVF.scene.add(S);
}
const DEVF_COL={tracer:new THREE.Color(0xffd75a)};
function devFoApply(fr){
  const R=DEVF.rec,F=R&&DEVF.figs[R.fig];if(!R||!F)return;const f=Math.max(0,Math.min(R.N-1,Math.floor(fr))),M=R.M,FL=11,T=R.tr;
  F.nodes.forEach((o,i)=>{const b=(f*M+i)*FL;o.position.set(T[b],T[b+1],T[b+2]);o.quaternion.set(T[b+3],T[b+4],T[b+5],T[b+6]);o.scale.set(T[b+7],T[b+8],T[b+9]);o.visible=T[b+10]>0.5;});
  for(const k in DEVF.figs)DEVF.figs[k].root.visible=DEVF.figs[k]===F;
  for(const k in DEVF.pool)for(const m of DEVF.pool[k])m.visible=false;
  const used={};DEVF.lb.reset();DEVF.sk.reset();
  if(devOpt('devFoShowDmg'))for(const h of R.hits)if(f>=h.f&&f<=h.until)devDraw(h.kind,h.shape,h.o,used,DEVF,DEVF_O);
  if(devOpt('devFoShowShot'))for(const s of R.shots){
    if(s.k==='tracer'){if(f>=s.f&&f<s.f+8)DEVF.lb.seg(s.a[0],s.a[1],s.a[2],s.b[0],s.b[1],s.b[2],DEVF_COL.tracer,2.5);continue;}
    const c=s.c||(s.c=new THREE.Color(s.col)),i=f-s.f;if(i<0||i>=s.path.length)continue;
    for(let j=0;j<i;j+=4){const q=s.path[j];DEVF.lb.seg(q[0],q[1],q[2],q[0],q[1],q[2],c,-3);}   // (the way it's come, dotted)
    const q=s.path[i];DEVF.lb.seg(q[0],q[1],q[2],q[0],q[1],q[2],c,-11);}
  // who it's after: Gus's hurtbox, facing it
  if(R.target&&devOpt('devFoShowHurt'))devDraw('hurt','box',{x:R.target.x,y:G+1,z:R.target.z,sx:1.5*ES,sy:2.1*ES,sz:2.9*ES,rot:Math.PI},used,DEVF,DEVF_O);
  devSkel(F,devOpt('devFoShowSkel')?DEVF.sk:null,devOpt('devFoShowBones'));
  document.getElementById('devFoTime').textContent=(f/60).toFixed(2)+' / '+((R.N-1)/60).toFixed(2)+' s  (frame '+f+')';
  {const ph=document.getElementById('devFoPh');if(ph)ph.style.left=(f/R.N*100)+'%';}
}
function devFoPlayBtn(){document.getElementById('devFoPlay').innerHTML=DEVF.play?'&#x23F8;':'&#x25B6;';}
// the timeline: frames across, a row of its hits, and a row for each stretch of the animation worth timing (wind-ups and
// what's in flight); click or drag along it to scrub
function devFoTrack(){
  const T=document.getElementById('devFoTrack'),R=DEVF.rec;if(!T||!R)return;const N=R.N,pc=f=>(f/N*100).toFixed(3)+'%';
  let h='<div class="ruler">';const step=N>300?60:N>150?30:N>80?15:10;for(let f=0;f<N;f+=step)h+='<span class="tick" style="left:'+pc(f)+'"><b>'+f+'</b></span>';h+='</div>';
  h+='<div class="row"><span class="nm">hits</span>';const seen=new Set();for(const x of R.hits){if(seen.has(x.f))continue;seen.add(x.f);h+='<span class="mk dmg" style="left:'+pc(x.f)+'" title="frame '+x.f+'"></span>';}
  if(!R.hits.length)h+='<span class="nm" style="left:44px">none</span>';h+='</div>';
  const rows=[...new Set(R.marks.map(m=>m.row))];
  for(const r of rows){h+='<div class="row"><span class="nm">'+r.toLowerCase()+'</span>';
    for(const m of R.marks)if(m.row===r)h+='<span class="bar '+m.c+'" style="left:'+pc(m.a)+';width:calc('+pc(m.b-m.a+1)+')" title="frames '+m.a+' to '+m.b+' ('+(m.b-m.a+1)+')"></span>';h+='</div>';}
  h+='<span class="ph" id="devFoPh"></span>';T.innerHTML=h;
}
function devFoData(){
  const box=document.getElementById('devFoData'),R=DEVF.rec;if(!box||!R)return;
  box.innerHTML=R.data.map(([a,b])=>'<div class="devfd"><span>'+a+'</span><b>'+b+'</b></div>').join('');
}
function devFoMark(){
  const K=devFoKind(DEVF.kind),dd=document.getElementById('devFoDD'),ad=document.getElementById('devFoAnDD');if(!dd||!ad)return;
  dd.querySelector('button').textContent=K.n;ad.querySelector('button').textContent=devFoAnimName(K,DEVF.anim);
  for(const li of dd.querySelectorAll('li')){const on=li.dataset.k===DEVF.kind;li.classList.toggle('on',on);li.setAttribute('aria-selected',String(on));}
  const al=document.getElementById('devFoAnList');al.innerHTML=K.anims.map(a=>'<li role="option" data-a="'+a+'"'+(a===DEVF.anim?' class="on" aria-selected="true"':'')+'>'+devFoAnimName(K,a)+'</li>').join('');
}
function devFoSelect(kind,anim){
  const K=devFoKind(kind);DEVF.kind=K.k;DEVF.anim=K.anims.includes(anim)?anim:K.anims.includes(DEVF.anim)?DEVF.anim:K.anims.includes('walk')?'walk':K.anims[0];
  try{localStorage.setItem(DEV_FOE_KEY,JSON.stringify({k:DEVF.kind,a:DEVF.anim}));}catch(e){}
  DEVF.rec=devFoSim(DEVF.kind,DEVF.anim);DEVF.f=0;DEVF.play=true;devFoPlayBtn();devFoSet(DEVF.rec);devFoMark();devFoTrack();devFoData();
}
function devFoTick(dt){
  if(!document.getElementById('devSecFoe').open)return;
  if(!devFoInitGL())return;
  if(!DEVF.rec)devFoSelect(DEVF.kind,DEVF.anim);
  const R=DEVF.rec;
  if(DEVF.play){DEVF.f+=dt*60*DEVF.speed;if(DEVF.f>=R.N){if(DEVF.loop)DEVF.f=DEVF.f%R.N;else{DEVF.f=R.N-1;DEVF.play=false;devFoPlayBtn();}}}
  devFoApply(DEVF.f);
  {const rs=document.querySelector('.devfors'),bt=document.querySelector('.devfobot');if(rs&&bt)rs.style.bottom=(bt.offsetHeight+16)+'px';}
  const cv=DEVF.r.domElement,w=cv.clientWidth|0,h=cv.clientHeight|0;if(w<10||h<10)return;
  if(cv.width!==Math.round(w*DEVF.r.getPixelRatio())||cv.height!==Math.round(h*DEVF.r.getPixelRatio()))DEVF.r.setSize(w,h,false);
  const C=DEVF.cam,c=R.c,d=R.rad*2.1*DEVF.zoom;C.aspect=w/h;C.updateProjectionMatrix();
  C.position.set(c.x+Math.sin(DEVF.yaw)*Math.cos(DEVF.pitch)*d,c.y+Math.sin(DEVF.pitch)*d+1,c.z+Math.cos(DEVF.yaw)*Math.cos(DEVF.pitch)*d);C.lookAt(c.x,c.y+0.6,c.z);
  const L0=WORLD_LIGHT.value.clone(),cu=CURVE_U.value;WORLD_LIGHT.value.setRGB(1,1,1);CURVE_U.value=0;
  C.updateMatrixWorld();DEVF.lb.flush(C,h);DEVF.sk.flush(C,h);devLabelsIn(document.getElementById('devFoBones'),DEVF.figs,R.fig,devOpt('devFoShowBones'),C,w,h);
  try{DEVF.r.render(DEVF.scene,C);}finally{WORLD_LIGHT.value.copy(L0);CURVE_U.value=cu;}
}
{
  const dd=document.getElementById('devFoDD'),list=document.getElementById('devFoList'),ad=document.getElementById('devFoAnDD'),al=document.getElementById('devFoAnList');
  list.innerHTML=DEV_FOE_KINDS.map(K=>'<li role="option" data-k="'+K.k+'">'+K.n+'</li>').join('');
  const menu=(box,ul,pick)=>{const b=box.querySelector('button'),open=v=>{ul.hidden=!v;b.setAttribute('aria-expanded',String(v));};
    b.addEventListener('click',()=>open(ul.hidden));ul.addEventListener('click',e=>{const li=e.target.closest('li');if(li){open(false);pick(li);}});
    document.addEventListener('pointerdown',e=>{if(!ul.hidden&&!box.contains(e.target))open(false);});};
  menu(dd,list,li=>devFoSelect(li.dataset.k));menu(ad,al,li=>devFoSelect(DEVF.kind,li.dataset.a));
  devFoMark();
  document.getElementById('devFoPlay').addEventListener('click',()=>{const R=DEVF.rec;if(R&&!DEVF.play&&DEVF.f>=R.N-1)DEVF.f=0;DEVF.play=!DEVF.play;devFoPlayBtn();});
  document.getElementById('devFoRestart').addEventListener('click',()=>{DEVF.f=0;});
  document.getElementById('devFoStep').addEventListener('click',()=>{const R=DEVF.rec;if(!R)return;DEVF.play=false;devFoPlayBtn();DEVF.f=(Math.floor(DEVF.f)+1)%R.N;});
  document.getElementById('devFoSpeed').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;DEVF.speed=+b.dataset.s;for(const o of document.querySelectorAll('#devFoSpeed button'))o.classList.toggle('on',o===b);});
  document.getElementById('devFoLoop').addEventListener('change',e=>{DEVF.loop=e.target.checked;});
  // the timeline scrubs
  const T=document.getElementById('devFoTrack');let seek=false;
  const at=x=>{const r=T.getBoundingClientRect(),R=DEVF.rec;if(!R)return;DEVF.f=Math.max(0,Math.min(R.N-1,Math.round((x-r.left)/r.width*R.N)));};
  T.addEventListener('pointerdown',e=>{if(!DEVF.rec)return;seek=true;DEVF.play=false;devFoPlayBtn();at(e.clientX);T.setPointerCapture(e.pointerId);e.preventDefault();});
  T.addEventListener('pointermove',e=>{if(seek)at(e.clientX);});
  const end=()=>{seek=false;};T.addEventListener('pointerup',end);T.addEventListener('pointercancel',end);
  // drag to turn, scroll to zoom
  const cv=document.getElementById('devFoCanvas');let drag=null;
  cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',e=>{if(!drag)return;DEVF.yaw-=(e.clientX-drag.x)*0.01;DEVF.pitch=Math.max(0.05,Math.min(1.35,DEVF.pitch+(e.clientY-drag.y)*0.01));drag={x:e.clientX,y:e.clientY};});
  cv.addEventListener('pointerup',()=>{drag=null;});cv.addEventListener('pointercancel',()=>{drag=null;});
  cv.addEventListener('wheel',e=>{e.preventDefault();DEVF.zoom=Math.max(0.15,Math.min(4,DEVF.zoom*Math.pow(1.0015,e.deltaY)));},{passive:false});
}
