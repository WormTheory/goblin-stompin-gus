// The picture settings (RENDER SCALE, ANTI-ALIASING, TEXTURE SMOOTHING) and the far view's trimmings, as far as they
// can be checked with nothing to draw on: the controls set and store what they should, the pixel ratio is held to what
// a card can take, anti-aliasing and smoothing stay off (and harmless) where the graphics can't do them, a chunk's far
// boxes dissolve over a third of a second, and the near ring gives a building its neon rim and its mast.
const {T,E,run,step,els,pads,errs}=require('./harness.js')();
let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('FAIL: '+m);}};
// ---- render scale
const kept={};localStorage.setItem=(k,v)=>{kept[k]=String(v);};   // (the harness keeps nothing: note what's stored)
ok(E('renderScale')===100&&E('aaI')===0&&E('texSmI')===1,'defaults are 100%, Off, Low');
els.rScale.value='150';for(const f of els.rScale.L.input)f();
ok(E('renderScale')===150,'the slider sets the scale: '+E('renderScale'));
ok(kept[E('RSCALE_KEY')]==='150','and stores it: '+kept[E('RSCALE_KEY')]);
ok(els.rScaleVal.textContent==='150%','and shows it: '+els.rScaleVal.textContent);
els.rScale.value='999';for(const f of els.rScale.L.input)f();ok(E('renderScale')===200,'held to 200%: '+E('renderScale'));
els.rScale.value='7';for(const f of els.rScale.L.input)f();ok(E('renderScale')===50,'and to 50%: '+E('renderScale'));
els.rScale.value='100';for(const f of els.rScale.L.input)f();
ok(Math.abs(E('pxRatio(1.5,1920,1080)')-1.5)<1e-9,'100% of a 1.5 screen is 1.5');
E('renderScale=200');ok(Math.abs(E('pxRatio(1.5,1920,1080)')-3)<1e-9,'200% is 3');
ok(E('pxRatio(1.5,3840,2160)')*3840<=8192+1e-6,'never more than 8192 pixels on the long side: '+E('pxRatio(1.5,3840,2160)')*3840);
E('renderScale=100');
// ---- anti-aliasing and smoothing, with a renderer that can do neither
E('aaI=2;texSmI=2');
ok(E('(()=>{aaBegin(AA_MAIN,renderer);const on=AA_MAIN.on;drawPrep(renderer,0,0,800,600);aaEnd(AA_MAIN,renderer,800,600);return on===false&&AA_MAIN.rt===null;})()'),'anti-aliasing stays off without WebGL 2');
ok(E('(()=>{texSmooth(renderer);return TEXSM.ml===0&&ATLAS_MIPS===null;})()'),'and smoothing makes nothing');
step(5);
E('aaI=0;texSmI=1');
// ---- a chunk's far boxes dissolve
{const at=E('(()=>{const cx=1234,cz=-77;markMeshed(cx,cz,false);markMeshed(cx,cz,true);return ((((cz%256)+256)%256)*256+(((cx%256)+256)%256))*4;})()');
 ok(E('MESHED['+at+']')===255&&E('MESHED['+(at+1)+']')===0,'a new chunk starts with its far boxes whole');
 for(let i=0;i<10;i++)E('meshFadeTick(1/60)');
 const half=E('MESHED['+(at+1)+']');ok(half>100&&half<160,'half gone after a sixth of a second: '+half);
 for(let i=0;i<11;i++)E('meshFadeTick(1/60)');
 ok(E('MESHED['+(at+1)+']')===255,'all gone after a third: '+E('MESHED['+(at+1)+']'));
 ok(!E('MESH_FADE.includes('+at+')'),'and no longer counted');
 E('markMeshed(1234,-77,false)');ok(E('MESHED['+at+']')===0,'let go, the boxes are back at once');
 E('meshFadeTick(1/60)');ok(E('MESHED['+(at+1)+']')===0,'and stay');}
// ---- the near ring's rims and masts
{const r=E(`(()=>{
  const out={rim:0,mast:0,why:''};
  const drain=g=>{for(const _ of g);};
  for(let px=-14;px<=14&&!(out.rim&&out.mast);px++)for(let pz=-14;pz<=14&&!(out.rim&&out.mast);pz++){
    if(seaPlot(px,pz)||realmOf(px,pz)==='plains')continue;const P=plotInfo(px,pz);
    for(const b of P.b){
      roofOf(b);   // (which takes the neon off a building with a pitched roof of its own)
      const wantRim=!!b.neon&&!(b.roof>0)&&b.style!=='house'&&!b.crenel&&!b.farSkip,wantMast=!!b.ant&&!b.farSkip;
      if(!wantRim&&!wantMast||wantRim&&out.rim&&(!wantMast||out.mast))continue;
      const SB=farStage(),SG=farStage();drain(farPlotNear(SB,SG,px,pz));
      const X0=px*CELL,Z0=pz*CELL;let rim=false,mast=false,tip=false,body=false;
      for(let n=0;n<SB.n;n++){const m=SB.mat,o=n*16,sx=m[o],sy=m[o+5],sz=m[o+10],cx=m[o+12],cy=m[o+13],cz=m[o+14],f=SB.wn[n*4+3];
        const tierUp=b.tier>0&&(b.x1-b.x0)>=8&&b.top>b.tier,ins=tierUp?2:0;
        if(f===1&&Math.abs(sy-1)<1e-6&&Math.abs(cy-(b.top+0.5))<1e-6&&Math.abs(cx-(X0+(b.x0+b.x1)/2))<1e-6&&Math.abs(sx-(b.x1-b.x0-2*ins))<1e-6)rim=true;
        if(sx===1&&sz===1&&Math.abs(cx-(X0+((b.x0+b.x1)>>1)+0.5))<1e-6&&Math.abs(cz-(Z0+((b.z0+b.z1)>>1)+0.5))<1e-6){if(f===1)tip=true;else if(Math.abs(cy-sy/2-(b.top+1))<1e-6)mast=true;}
        if(f!==1&&sx>1&&Math.abs(cy+sy/2-(b.top+(wantRim?0:1)))<1e-6)body=true;}
      if(wantRim){if(rim&&body)out.rim++;else out.why+=' rim missing at '+px+','+pz+(rim?' (body not cut short)':'');}
      if(wantMast){if(mast&&tip)out.mast++;else out.why+=' mast missing at '+px+','+pz;}
    }}
  return out;})()`);
 ok(r.rim>0,'a building with neon round its roof gets a rim box'+r.why);ok(r.mast>0,'a tower with a mast gets it, and its light'+r.why);ok(!r.why,'every one looked at:'+r.why);
 console.log('rims found '+r.rim+', masts found '+r.mast);}
console.log('errors',errs.length,errs.slice(0,3));
if(bad||errs.length){console.log('picture FAILED ('+bad+')');process.exit(1);}
console.log('picture ok');process.exit(0);
