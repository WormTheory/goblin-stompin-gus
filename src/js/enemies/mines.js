// ---- landmines (WEAPONS.landmine, whose numbers they all are): pressed into the ground by a player goblin (gobPlant,
// gob-weapons.js) or by an enemy that carries them (foeMine, foes.js). Each sits a moment while it arms (the weapon's arm),
// then the first thing over it sets it off: a vehicle, any player (whoever planted it too, once they've stepped off it),
// and a player's under an enemy goblin. Hitting one sets it off at once, armed or not: any player's blow or attack that reaches
// it (mineArea, from pvpArea, which every player attack calls beside its goblin damage), a blast (foeBoom), a round down
// its line (mineRay, from fireRound), a fireball, a Mobile Gear's blade. The blast is foeBoom's, like a grenade's: the
// weapon's damage, radius, crater and harm to vehicles. Host only: a guest has none of its own, it's shown them ----
const MINES=[],MINE_MAX=24;   // (the most in the ground at once: past that, the oldest goes)
// (o: side 'p' a player's or 'g' an enemy's, by who's to blame (pvpBy for a player, an enemy's id), owner the player who
// set it, cause, k the weapon)
function mineLay(x,y,z,o){if(netGuest())return null;   // (online, only the host's game has mines: a guest's own guess at planting one makes none, so nothing goes off twice)
  const W=WEAPONS[o.k||'landmine'],sy=supportAt(x,z,y+1.2);
  let M=MINES.find(m=>!m.live);
  if(!M){if(MINES.length<MINE_MAX){M={i:MINES.length};MINES.push(M);}else{M=MINES.reduce((a,b)=>b.n<a.n?b:a);mineShow(M.i,0,0,0,0);}}
  Object.assign(M,{live:true,x,y:sy??y,z,t:0,armed:false,side:o.side,by:o.by||null,owner:o.owner||null,ownOff:false,cause:o.cause,W,n:(mineLay.n=(mineLay.n||0)+1)});
  mineShow(M.i,M.x,M.y,M.z,1);
  sfx('Landmine set',()=>{noise(0.08,0.06,700,'lowpass');tone('square',300,240,0.05,0.025);});
  return M;
}
// (by: who to blame, if not whoever planted it: the player who hit it, pvpBy's)
function mineBoom(M,by){if(!M.live)return;M.live=false;mineShow(M.i,0,0,0,0);const W=M.W;   // (gone before its blast, so a blast it sets off can't set it off again)
  sfx('Landmine',()=>{tone('square',1200,1200,0.06,0.04);});
  foeBoom(M.x,M.y+0.2,M.z,W.R,W.dmg,M.cause,by===undefined?M.by:by,W.crush,W.vd);}
// every mine an attack reaches: within r of (x,z), and at height y (if given) within reach, as hitGoblins
function mineArea(x,z,r,y,by){for(const M of MINES){if(!M.live)continue;const dx=M.x-x,dz=M.z-z,dy=y===undefined?0:M.y-y;
  if(Math.hypot(dx,dz,dy)<r+0.3&&(y===undefined||vReach(dy,r)))mineBoom(M,by);}}
// the nearest mine a round from (x,y,z) heading (ux,uy,uz) passes within reach of, out to R ({M,t} or null)
function mineRay(x,y,z,ux,uy,uz,R){let best=null,bt=R;
  for(const M of MINES){if(!M.live)continue;const ox=M.x-x,oy=M.y+0.1-y,oz=M.z-z,t=ox*ux+oy*uy+oz*uz;if(t<0||t>=bt)continue;
    const cx=ox-ux*t,cy=oy-uy*t,cz=oz-uz*t;if(cx*cx+cy*cy+cz*cz<0.4*0.4){bt=t;best={M,t};}}
  return best;}
function updateMines(dt){
  if(!playing)return;
  for(const M of MINES){if(!M.live)continue;M.t+=dt;
    const on=(x,y,z,r,h)=>Math.abs(x-M.x)<r&&Math.abs(z-M.z)<r&&y>M.y-0.6&&y<M.y+h,O=M.owner;
    // (whoever planted it is safe on it till they've stepped clear of it once, so standing where it was set down is no trap)
    if(O&&!M.ownOff&&!(O.active&&O.state!=='dead'&&!O.drv&&on(O.pos.x,O.pos.y,O.pos.z,O.gob?0.75:1.1,1.2)))M.ownOff=true;
    if(!M.armed){if(M.t<M.W.arm)continue;M.armed=true;mineShow(M.i,M.x,M.y,M.z,2);sfx('Landmine armed',()=>{tone('square',1500,1500,0.03,0.02);});}
    let hit=false;
    // (cars of any kind, traffic too: whoever's side it is)
    for(const c of cars){if(c.alive&&on(c.pos.x,c.pos.y,c.pos.z,1.4,1.6)){hit=true;break;}}
    // (and the big ones: a tank, a helicopter on the ground, the Mobile Gear, a train or plane, whose underside is down at
    // the mine and over it; last frame's boxes too, as this frame's only hold what's moved so far. Soft boxes, a zoo animal
    // or a wheel's rim, don't count, nor anything whose bottom is well above or below, a ship's hull round a mine on its deck)
    if(!hit)for(const L of [TRAIN_BOXES,PREV_BOXES]){for(const B of L){if(B.soft||B.proxy&&B.proxy.alive===false||B.y0<M.y-0.8||B.y0>M.y+1.2)continue;
      const dx=M.x-B.x,dz=M.z-B.z;if(Math.abs(dx*B.tz-dz*B.tx)<B.hx+0.3&&Math.abs(dx*B.tx+dz*B.tz)<B.hz+0.3){hit=true;break;}}if(hit)break;}
    if(!hit&&M.side==='p')for(const g of goblins){if(g.state==='chase'&&g.hp>0&&g.root.visible&&on(g.pos.x,g.pos.y,g.pos.z,0.75,1.2)){hit=true;break;}}
    // (any player on foot, on either side: a mine doesn't know whose it is)
    if(!hit)for(const q of players){if(!q.active||q.state==='dead'||q.drv||q===O&&!M.ownOff)continue;
      if(on(q.pos.x,q.pos.y,q.pos.z,q.gob?0.75:1.1,1.2)){hit=true;break;}}
    if(hit)mineBoom(M);}
}
function minesClear(){for(const M of MINES)if(M.live){M.live=false;mineShow(M.i,0,0,0,0);}}
// ---- how they look (on an online guest too: the host's calls come across, net-sync.js): the weapon's shape lying in the
// ground, its light dark while it arms and blinking red once it's live. on: 0 gone, 1 arming, 2 armed ----
const MINEV=[],MINE_MAT={},MINE_LED=[new THREE.MeshBasicMaterial({color:0x3a1008}),new THREE.MeshBasicMaterial({color:0xff2a10})];
function mineShow(i,x,y,z,on){
  let V=MINEV[i];
  if(!V){if(!on)return;const g=new THREE.Group(),m=c=>MINE_MAT[c]||(MINE_MAT[c]=new THREE.MeshLambertMaterial({color:c}));let led=null;
    wpnBoxes(WEAPONS.landmine.model.drop,(w,h,d,c,bx,by,bz)=>{const o=new THREE.Mesh(FB_GEO,c===0xd03020?MINE_LED[0]:m(c));o.scale.set(w,h,d);o.position.set(bx,by-0.02,bz);g.add(o);if(c===0xd03020)led=o;return o;});
    // (the light blinks once a second, every armed mine together)
    if(led)led.onBeforeRender=()=>{led.material=V.on===2&&(performance.now()%1000)<180?MINE_LED[1]:MINE_LED[0];};
    g.visible=false;scene.add(g);V=MINEV[i]={g,on:0};}
  V.on=on;V.g.visible=!!on;if(!on)return;
  V.g.position.set(x,y+0.04,z);const par=shipPar(x,z);if(V.g.parent!==par)par.add(V.g);   // (aboard a ship: hung off it, as a dropped weapon is)
}
