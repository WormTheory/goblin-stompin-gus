// Tracers kept on the muzzle that fired them (tracerFollow, enemies/shots.js): a player's shot on foot follows their
// view as they move, a vehicle's gun follows the vehicle, and a shot fired on the move starts from where the eye is now
// (gobEyeNow), not where the view was placed last frame. Fails on a wrong result.
const {T,E,step,els,pads,errs}=require('./harness.js')();
const ok=[];const chk=(n,v,x='')=>{ok.push(!!v);console.log(n,v?'ok':'BAD',x);};
for(const f of els.play.L.click)f();pads.length=0;
for(const c of T.cars){c.alive=false;c.respawnT=1e9;}for(const g of T.goblins){g.state='wait';g.t=-1e9;g.hp=0;}
step(30);
const A=T.players[0];T.setGob(true);step(5);
A.wpns=E('GOB_WPN_ORDER').slice();A.ammo={};A.relT=0;A.cam.yaw=0;A.cam.pitch=0;A.heading=Math.PI;step(5);
const TR=E('TRACERS'),live=()=>TR.filter(t=>t.t>0),lp=t=>t.m.userData.lp,d3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const clearTr=()=>{for(const t of TR){t.t=0;t.m.visible=false;t.fol=null;}};
for(const wk of ['rifle','handgun','shotgun']){
  clearTr();A.wpn=wk;A.ammo={};A.relT=0;A.biteT=0;
  E('placeCamera')(A);E('tracerFollow')();   // (the view placed and p.camAt taken, as at the end of a frame)
  const cam0=A.camera.position.clone();
  A.pos.x+=0.4;   // (he's moved on in this frame's step before he fires, as he does running: the camera's still behind)
  E('gobShoot')(A);const L=live();
  const st=L.length?lp(L[0]):null;
  chk(wk+': fired, tracer kept on him',L.length>0&&L.every(t=>t.fol&&t.fol.p===A),'n '+L.length);
  chk(wk+': starts from where the eye is now, not last frame\'s',st&&Math.abs((st.x-cam0.x)-0.4-(L[0].fol.mz.x))<0.05,st&&(st.x-cam0.x).toFixed(3));
  // (three more frames of running: the view placed each time, then the tracers moved)
  let worst=0;for(let i=0;i<3;i++){A.pos.x+=0.4;E('placeCamera')(A);E('tracerFollow')();
    for(const t of live()){const m=t.fol.mz,c=A.camera.position,e=Math.hypot(lp(t).x-(c.x+m.x),lp(t).y-(c.y+m.y),lp(t).z-(c.z+m.z));worst=Math.max(worst,e);}}
  chk(wk+': start stays on the muzzle while he runs',worst<0.05,'off '+worst.toFixed(3));
  const end=live()[0].fol;chk(wk+': far end stays where the round went',isFinite(end.x1)&&Math.abs(end.x1-(st.x))<200);
}
// a vehicle's gun: the start moves on with the vehicle
{clearTr();const car={pos:new (E('V3'))(A.pos.x+30,A.pos.y,A.pos.z+30)};
  E('fireRound')({x:car.pos.x,y:car.pos.y+1,z:car.pos.z,at:{x:car.pos.x,y:car.pos.y+1,z:car.pos.z-20},own:car,dmg:0,cause:'test'});
  const t=live()[0],s0=t&&lp(t).clone();car.pos.x+=5;car.pos.z-=2;E('tracerFollow')();
  chk('vehicle gun: start moves with the vehicle',t&&Math.abs(lp(t).x-s0.x-5)<1e-6&&Math.abs(lp(t).z-s0.z+2)<1e-6);}
// an enemy's round (no shooter's view, no vehicle): stays put
{clearTr();E('fireRound')({x:A.pos.x+30,y:A.pos.y+1,z:A.pos.z,at:{x:A.pos.x+30,y:A.pos.y+1,z:A.pos.z-20},dmg:0,cause:'test'});
  const t=live()[0],s0=t&&lp(t).clone();A.pos.x+=1;E('placeCamera')(A);E('tracerFollow')();
  chk('enemy round: not moved',t&&!t.fol&&d3(lp(t),s0)<1e-9);}
// with frames running and the trigger held while walking, nothing goes wrong
clearTr();A.wpn='rifle';A.ammo={};T.mHeld.add('Mouse0');T.keys.add&&T.keys.add('KeyW');step(40);T.mHeld.delete('Mouse0');T.keys.delete&&T.keys.delete('KeyW');step(5);
console.log('errors',errs.length,errs.slice(0,4));
const pass=ok.every(Boolean)&&errs.length===0;console.log(pass?'all ok':'FAILED');process.exit(pass?0:1);
