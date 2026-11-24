// ---------- Drawing one player's view (it was in ui/minimap.js) ----------
function renderView(p,x,y,w,h,R=renderer){   // (R: player two's own window draws with a renderer of its own, ui/seats.js)
  const wk0=WXK;WXK=p.wxk||WXK;try{renderView0(p,x,y,w,h,R);}finally{WXK=wk0;}}   // (each view in its own player's weather)
function renderView0(p,x,y,w,h,R){
  const c=p.camera.position,under=get(c.x,c.y,c.z)===WATER;
  p.ui.tint.hidden=!under;
  const far=lodFar();
  if(under){scene.fog.color.copy(DEEP);scene.background.copy(DEEP);scene.fog.near=1;scene.fog.far=18;FOG_GLOW.value=0;skyU.uFog.value=0;}
  else{const fk=Math.max(0.2,WXK.fog),ff=Math.min(far,wxFogFar(fk));scene.fog.color.copy(SKY);
    if(WXK.dust>0.01)scene.fog.color.lerp(DUST_C,Math.min(1,WXK.dust)*0.75);if(WXK.haze>0.01)scene.fog.color.lerp(HAZE_C,Math.min(1,WXK.haze)*0.45);   // (a sandstorm's ochre, the rainforest's haze)
    scene.background.copy(scene.fog.color);scene.fog.near=ff*0.45*fk*fk;scene.fog.far=ff;
    FOG_GLOW.value=ff<far?Math.min(1,Math.max(0,(0.95-fk)/0.5))*(DT.fogLitOn===false?0:DT.fogLit??2):0;   // (lights through the weather's fog, FOG_LIT_FRAG)
    skyU.uFog.value=Math.min(1,Math.max(0,(0.92-fk)/0.45));}   // (and the sky and clouds lost in it)
  // (halos round lamps in the fog: the same fog thickness, times the debug menu's Halos slider, DT.halo, and how dark it is;
  // none with Halos on switched off, as the Fog light on switch does the fog light)
  {const L=WORLD_LIGHT.value,w=!under&&scene.fog.far<far?Math.min(1,Math.max(0,(0.95-Math.max(0.2,WXK.fog))/0.5)):0;
   HALO_U.uStr.value=w*(DT.haloOn===false?0:DT.halo??0.25)*Math.min(1,Math.max(0,(0.75-Math.max(L.r,L.g,L.b))*2.5));HALO_U.uNear.value=scene.fog.near;HALO_U.uFar.value=scene.fog.far;}
  carLightsView(p);   // (the cars' lamps: their halos, and their headlights on the road)
  placePrecip(c,p.idx);
  p.camera.aspect=w/h;p.camera.fov=p.tkFov||(p.gob&&!p.drv&&p.scFov)||72-6*(p.speedFx||0)-8*(p.windZoom||0)+(p.drv&&p.drv.k==='mech'?p.mgFov||0:0);   // (tkFov: a tank's gunsight, tank-handling.js)
  p.camera.far=far+40;p.camera.near=p.gob?0.12:0.25;p.camera.updateProjectionMatrix();
  R.setViewport(x,y,w,h);R.setScissor(x,y,w,h);
  sky.position.copy(p.camera.position);
  if(p.lockMark&&p.lockMark.visible)p.lockMark.quaternion.copy(p.camera.quaternion);
  // the sky's horizon goes where the world's edge appears: bent down, the top of the curve (or the end of the view, if
  // that comes first); bent up, the rim of the bowl. Measured from where it'd sit with the world flat
  {const k=CURVE_U.value,hh=Math.max(0.5,c.y-(G+1)),F=Math.max(60,far);let sl=-(hh/F+k*F);if(k>0&&Math.sqrt(hh/k)<F)sl=-2*Math.sqrt(hh*k);
   const at=sl=>sl/Math.sqrt(1+sl*sl);skyU.uHzn.value=k?at(sl)-at(-hh/F):0;}
  gobView(p);CURVE_CAM.copy(p.camera.position);HORIZ_U.value.set(CURVE_CAM.x,CURVE_CAM.y,CURVE_CAM.z,HORIZ_Y0);R.render(scene,p.camera);
}
