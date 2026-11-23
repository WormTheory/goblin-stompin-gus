// Real screenshots of living in each biome (plan phase 4): the biome sites (oil field, peat diggings, research station,
// safari lodge, stilt village, ski slope), towns built each biome's way, the townsfolk's clothes there, and the banner
// naming a biome as you come into it. Each is the nearest of its kind to the start.
// Usage, from tools/ui after build_3d.py: node biomeshot.js outDir [seed]   (ONLY=derricks,town-desert,... to pick)
const {chromium}=require('playwright');
const fs=require('fs');
const out=process.argv[2]||'biomeshots',seed=+(process.argv[3]||1);
let html=fs.readFileSync('t3.html','utf8');
html=html.replace('window.__G={','window.__G={G0:G,settlementLat,settlementAt,climAt,bioPick,BIOMES,biomeOfPlot,bigPlainsAt,BIGP,landTop,plotType,PB,SET_SP,seaPlot,WX,wxSet,wxSeed,wxLocal,dressGoblin,goblins,DT,set tod(v){tod=v},set dayN(v){dayN=v},');
fs.writeFileSync('t3b.html',html);
const SAVE_KEY=html.match(/SAVE_KEY='([^']+)'/)[1];
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1100,height:620}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(([k,s])=>{localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-view','300');localStorage.setItem('goblin-stompin-gus-detail','300');},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3b.html');await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(1500);
await p.addStyleTag({content:'body>*:not(canvas):not(.placeBanner){visibility:hidden!important}canvas{visibility:visible!important}'});
const ONLY=process.env.ONLY;
const cap=tx=>p.evaluate(tx=>{let d=document.getElementById('__cap');if(!d){d=document.createElement('div');d.id='__cap';d.style.cssText='position:fixed;left:0;right:0;bottom:0;padding:6px 10px;background:rgba(0,0,0,.72);color:#fff;font:15px/1.3 Arial,sans-serif;visibility:visible!important;z-index:99';document.body.appendChild(d);}d.textContent=tx;},tx);
// hold the camera at (x,y,z) looking at (tx,ty,tz), in clear weather at mid-morning
const hold=(x,y,z,tx,ty,tz)=>p.evaluate(([x,y,z,tx,ty,tz])=>{clearInterval(window.__hold);const G=window.__G,P=G.players[0];const clr=()=>{for(let i=0;i<60&&(G.WX.type!=='clear'||G.wxLocal(x,z,y)!=='clear');i++)G.wxSet('clear',true);G.WX.snowC=0;G.WX.snowCover=0;};clr();G.dayN=45;   // (midsummer, the cold band's snow gone as it would be by then)
 
  const dx=tx-x,dz=tz-z,L=Math.hypot(dx,dz)||1,yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(ty-y,L);
  window.__hold=setInterval(()=>{G.tod=0.25;clr();P.pos.set(x,y,z);P.vy=0;P.cam.yaw=yaw;P.cam.pitch=pitch;P.hp=999;P.root.visible=false;},20);},[x,y,z,tx,ty,tz]);
// the biome sites: [kind, camera offset from the site's middle (as a share of its size), height, caption]
const SITES=[['derricks',[-0.75,-0.75],26,'An oil field in the desert: the rig, pumpjacks, tanks and the site office'],['peat',[0.15,-0.7],12,'Peat diggings on the moor: trenches, turves drying, the bothy and the peat shed'],
  ['research',[0.45,0.95],14,'A research station in the ice fields: the lab and quarters, radar dome, mast and helipad'],['safari',[0.35,0.75],11,'A safari lodge on the savanna: the lodge, tents on decks, the watchtower by the waterhole'],
  ['stilts',[-0.8,0.85],12,'A stilt village in the swamp: huts on stilts joined by boardwalks'],['ski',[0.3,-0.45],22,'A ski slope in cold mountains: the piste, the chairlift on its pylons, the lodge and car park']];
for(const [k,[ox,oz],up,tx] of SITES){if(ONLY&&!ONLY.split(',').includes(k))continue;
  const at=await p.evaluate(k=>{const G=window.__G,K=G.BIGP.find(q=>q.kind===k);
    for(let r=0;r<=460;r++)for(let i=-r;i<=r;i++)for(const [a,c] of (r?[[i,-r],[i,r],[-r,i],[r,i]]:[[0,0]])){const ax=a*K.w,az=c*K.h,B=G.bigPlainsAt(ax,az);if(B&&B.kind===k&&B.ax===ax&&B.az===az)return [ax,az,K.w,K.h];}return null;},k);
  if(!at){console.log(k,'none');continue;}
  const [ax,az,w,h]=at,cx=ax*32+w*16,cz=az*32+h*16,x=cx+ox*w*32,z=cz+oz*h*32;
  const G0=await p.evaluate(([x,z])=>{const G=window.__G;return [G.G0,G.landTop(x,z)];},[x,z]);
  const y=Math.max(G0[0]+up,G0[1]+6);await hold(x,y,z,cx,G0[0]+(k==='ski'?16:2),cz+(k==='ski'?20:0));
  await p.waitForTimeout(18000);await cap(tx+' ('+ax*32+', '+az*32+')');await p.screenshot({path:out+'/'+k+'.png'});console.log(k,ax,az);}
// towns: a look across the middle of the nearest place in each biome
const TOWNS=[['desert','Houses in a desert town: stucco and sandstone, flat roofs'],['taiga','Houses in a taiga town: logs and planks, steep roofs'],['moor','Houses in a moor town: stone cottages'],['ice','Houses in the ice fields: red paint and planks, steep roofs'],['badlands','Houses in a badlands town: stucco and banded clay']];
for(const [bk,tx] of TOWNS){const nm='town-'+bk;if(ONLY&&!ONLY.split(',').includes(nm))continue;
  const at=await p.evaluate(bk=>{const G=window.__G;for(let r=1;r<=45;r++)for(let i=-r;i<=r;i++)for(const [a,c] of [[i,-r],[i,r],[-r,i],[r,i]]){const S=G.settlementLat(a,c);if(!G.settlementAt(S.cx,S.cz))continue;if(G.BIOMES[G.biomeOfPlot(S.cx,S.cz)].k!==bk)continue;
      for(let d=1;d<=7;d++)for(let u=-d;u<=d;u++)for(const [e,f] of [[u,-d],[u,d],[-d,u],[d,u]]){const px=S.cx+e,pz=S.cz+f;if(G.plotType(px,pz)==='homes'&&G.plotType(px+1,pz)==='homes')return [px*32+32,pz*32+16];}}return null;},bk);
  if(!at){console.log(nm,'none');continue;}
  const G0=await p.evaluate(()=>window.__G.G0);await hold(at[0]-30,G0+14,at[1]-30,at[0]+4,G0+3,at[1]+4);
  await p.waitForTimeout(18000);await cap(tx+' ('+at[0]+', '+at[1]+')');await p.screenshot({path:out+'/'+nm+'.png'});console.log(nm,at.join(' '));}
// clothes: up close to a townsperson in towns of the biomes that dress for it
for(const bk of ['desert','tundra','swamp','moor','savanna']){const nm='wear-'+bk;if(ONLY&&!ONLY.split(',').includes(nm))continue;
  const at=await p.evaluate(bk=>{const G=window.__G;for(let r=1;r<=45;r++)for(let i=-r;i<=r;i++)for(const [a,c] of [[i,-r],[i,r],[-r,i],[r,i]]){const S=G.settlementLat(a,c);if(!G.settlementAt(S.cx,S.cz))continue;if(G.BIOMES[G.biomeOfPlot(S.cx,S.cz)].k===bk)return [S.cx*32+16,S.cz*32+16];}return null;},bk);
  if(!at){console.log(nm,'none');continue;}
  // (an open bit of street near the middle: the camera there, then four townsfolk stood in a row in front of it, each
  // dressed where it stands as the game would, nudged along till it's one that dresses for the biome)
  const sp=await p.evaluate(([x0,z0])=>{const G=window.__G,y0=G.G0;for(let r=0;r<=60;r++)for(let i=-r;i<=r;i++)for(const [a,c] of (r?[[i,-r],[i,r],[-r,i],[r,i]]:[[0,0]])){const x=x0+a*2,z=z0+c*2;let ok=true;
      for(let u=-3;u<=12&&ok;u++)for(let v=-4;v<=4&&ok;v++){if(!G.get(x+u,y0,z+v))ok=false;for(let k=1;k<=7&&ok;k++)if(G.get(x+u,y0+k,z+v))ok=false;}if(ok)return [x,z,y0+1];}return null;},at);
  if(!sp){console.log(nm,'no open street');continue;}
  await hold(sp[0]+3,sp[2]+1.2,sp[1],sp[0]+9,sp[2]+0.6,sp[1]);await p.waitForTimeout(9000);
  await p.evaluate(([x,z,y])=>{const G=window.__G;G.DT.host=0;for(const c of G.cars||[])if(Math.abs(c.pos.x-x)<40&&Math.abs(c.pos.z-z)<40&&!c.parked)c.pos.y-=200;const on=(g,k)=>g.acc&&g.acc[k]&&g.acc[k][0]&&g.acc[k][0].visible,dressed=g=>['parka','wrap','reedhat','safari'].some(k=>on(g,k))||on(g,'cap')&&on(g,'scarf');
    const pick=G.goblins.filter(g=>g.civ&&!g.vendor&&g.root.visible&&g.state!=='wait').slice(0,4),spot=[];
    pick.forEach((g,i)=>{let px=x+3.4,pz=z-1.65+i*1.1;for(let k=0;k<12;k++){g.pos.set(px+(k%4)*0.25,y,pz);G.dressGoblin(g,true);if(dressed(g))break;}spot.push([g.pos.x,g.pos.z]);});
    window.__crowd=setInterval(()=>pick.forEach((g,i)=>{g.pos.set(spot[i][0],y,spot[i][1]);g.vy=0;g.kv.set(0,0,0);g.stun=1;g.heading=-Math.PI/2;g.root.rotation.y=-Math.PI/2;g.root.visible=true;g.root.position.set(spot[i][0],y,spot[i][1]);}),20);window.__n=pick.length;},sp);
  await p.waitForTimeout(6000);
  await cap('What the townsfolk wear in a '+bk+' town');await p.screenshot({path:out+'/'+nm+'.png'});await p.evaluate(()=>clearInterval(window.__crowd));console.log(nm,sp.map(Math.round).join(' '));}
// the banner: out in the open desert, a moment after coming into it
if(!ONLY||ONLY.split(',').includes('banner')){
  const at=await p.evaluate(()=>{const G=window.__G;for(let r=1;r<=300;r++)for(let i=-r;i<=r;i++)for(const [a,c] of [[i,-r],[i,r],[-r,i],[r,i]]){const px=a*3,pz=c*3;if(G.BIOMES[G.biomeOfPlot(px,pz)].k!=='desert'||G.settlementAt(px,pz)||G.seaPlot(px,pz))continue;return [px*32+16,pz*32+16];}return null;});
  const G0=await p.evaluate(([x,z])=>{const G=window.__G;return Math.max(G.G0,G.landTop(x,z));},at);await hold(at[0],G0+4,at[1],at[0]+40,G0,at[1]+40);await p.waitForTimeout(16000);
  await p.evaluate(()=>{const G=window.__G;G.PB.bio=0;G.PB.bioC=-1;G.PB.bioT=0;});await p.waitForTimeout(4200);
  await cap('The banner, coming into the desert out in the open');await p.screenshot({path:out+'/banner.png'});console.log('banner',at.join(' '));}
console.log(errs.join('\n')||'no errors');await b.close();fs.unlinkSync('t3b.html');})();
