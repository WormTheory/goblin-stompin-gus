// ---- the instrument in the bottom-right corner, in a vehicle: one slot (.speedo), drawn by its kind's renderer ----
// Which one a vehicle has is its kind's inst (VEHICLE_KINDS, a key here, or null for none). The speed it shows is the
// speed measured from the player's own movement (updateSpeedo: p.spV in km/h, p.spVY), so it reads right for anything,
// aboard a ship too. Each renderer: units, what it shows speed in; update(p,dt), called 20 times a second while shown.
// The Options' Vehicle instruments switch (uiSpeedo) hides the whole slot.
const KMH_KN=1/1.852;   // (km/h to knots: knots on water and in the air, km/h on land)
const INSTRUMENTS={
  // the ink dial: a needle round to SPEEDO_MAX, a fill coloured by how far round, and the speed in the middle
  dial:{units:'km/h',
    update(p){const v=Math.max(0,p.spV),k=Math.min(1,v/SPEEDO_MAX),shown=Math.round(v);
      if(shown!==p.spShown){p.spShown=shown;p.ui.spNum.textContent=String(shown);}
      p.ui.spNeedle.setAttribute('transform','rotate('+(-120+240*k).toFixed(1)+')');
      p.ui.spFill.setAttribute('stroke-dasharray',(k*100).toFixed(1)+' 200');p.ui.spFill.setAttribute('visibility',k<0.01?'hidden':'visible');
      p.ui.spFill.setAttribute('stroke',k<0.55?'#7fc24a':k<0.8?'#f0a04a':'#e0564a');}},
};
// what's in the slot for this player now: their vehicle's instrument, or nothing on foot
function drvInst(p){const D=p.drv;if(!D||D.jack)return null;const K=VEHICLE_KINDS[D.k];return K?K.inst(D):'dial';}
function instTick(p,dt){
  const key=drvInst(p),I=key&&INSTRUMENTS[key],el=p.ui.speedo;
  if(el.hidden===!!I)el.hidden=!I;if(!I){p.instK=null;return;}
  if(p.instK!==key){p.instK=key;p.spT=0;p.spShown=null;}
  p.spT=(p.spT||0)-dt;if(p.spT>0)return;p.spT=1/20;   // redraw at 20 Hz
  I.update(p,dt);
  // a crash landing is coming when you're falling from 5+ blocks above the ground (or ground-pounding)
  let crash=false;const C=p.state==='dead'&&p.corpse?p.corpse:null;
  if(!C&&!p.grounded&&p.vy<0){const gnd=groundAt(p.pos.x,p.pos.z,p.pos.y);crash=p.state==='pound'||abilOf(p).crash&&((p.peakY??p.pos.y)-gnd)>=5;}
  const vy=Math.round(p.spVY),vtxt=crash&&vy<-2?'↓ '+Math.abs(vy):'';
  // colour by how hard the landing will be: yellow, then orange, then red
  const heat=-vy<70?'y':-vy<95?'o':'r';
  if(vtxt!==p.spVShown){p.spVShown=vtxt;p.ui.spVert.textContent=vtxt;p.ui.spVert.setAttribute('visibility',vtxt?'visible':'hidden');}
  if(heat!==p.spHeat){p.spHeat=heat;p.ui.spVert.setAttribute('class','sp-vert '+heat);}
}
