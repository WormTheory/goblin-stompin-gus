// Real 3D screenshots of Gnash clinging to a building's wall: looking at it, along it and up it, to show the view
// stays outside (see eyeRoom in pivots.js). Picks Gnash on the title screen, finds the nearest wall and climbs it.
// Usage, from tools/ui (after python3 ../build_3d.py ../../game/index.html t3.html): node gobclimb.js [seed] [outDir] [tag]
const {chromium}=require('playwright');
const fs=require('fs');
const SAVE_KEY=fs.readFileSync('t3.html','utf8').match(/SAVE_KEY='([^']+)'/)[1];
const seed=+(process.argv[2]||12345),out=process.argv[3]||'shots',tag=process.argv[4]||'';
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
await p.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify({seed:s}));localStorage.setItem('goblin-stompin-gus-character','goblin');},[SAVE_KEY,seed]);
await p.goto('file://'+process.cwd()+'/t3.html');await p.waitForTimeout(3000);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(12000);
console.log('goblin mode',await p.evaluate(()=>window.__G.DT.gob));
// the nearest wall at least 8 high, with open ground in front of it
const wall=await p.evaluate(()=>{const G=window.__G,P=G.players[0],S=G.solidAt,y=Math.floor(P.pos.y+0.01);let best=null;
  for(let r=3;r<60&&!best;r++)for(let ox=-r;ox<=r&&!best;ox++)for(const oz of [-r,r])for(const [a,c] of [[ox,oz],[oz,ox]]){if(best)break;
    const x=Math.floor(P.pos.x)+a,z=Math.floor(P.pos.z)+c;
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const fx=x-dx,fz=z-dz;   // standing at fx,fz facing +d into x,z
      if(![1,2,3,4,5,6,7,8].every(h=>S(x,y+h,z))||!S(fx,y-1,fz)||[0,1,2].some(h=>S(fx,y+h,fz)||S(fx-dx,y+h,fz-dz)))continue;
      best={x:fx+0.5-dx*0.3,z:fz+0.5-dz*0.3,y,yaw:Math.atan2(-dx,-dz)};break;}}
  if(best){P.pos.set(best.x,best.y,best.z);P.vy=0;P.cam.yaw=best.yaw;P.cam.pitch=0;P.heading=best.yaw+Math.PI;}return best;});
console.log('wall',JSON.stringify(wall));
await p.waitForTimeout(500);
await p.keyboard.down('KeyC');await p.keyboard.down('KeyW');await p.waitForTimeout(900);await p.keyboard.up('KeyW');await p.waitForTimeout(600);
const room=()=>p.evaluate(()=>{const G=window.__G,P=G.players[0],q=P.camera.position;let m=9;const bx=Math.floor(q.x),by=Math.floor(q.y),bz=Math.floor(q.z);
  for(let x=bx-1;x<=bx+1;x++)for(let y=by-1;y<=by+1;y++)for(let z=bz-1;z<=bz+1;z++)if(G.solidAt(x,y,z))m=Math.min(m,Math.hypot(q.x-Math.max(x,Math.min(x+1,q.x)),q.y-Math.max(y,Math.min(y+1,q.y)),q.z-Math.max(z,Math.min(z+1,q.z))));
  return P.state+' up '+(P.pos.y-Math.floor(P.pos.y)).toFixed(2)+', eye '+m.toFixed(2)+' from the nearest block';});
const look=async(nm,dy,pitch)=>{await p.evaluate(([dy,pitch])=>{const P=window.__G.players[0];P.cam.yaw=P.heading-Math.PI+dy;P.cam.pitch=pitch;},[dy,pitch]);
  await p.waitForTimeout(700);console.log(nm.padEnd(12),await room());await p.screenshot({path:out+'/gobclimb'+tag+'-'+nm+'.png'});};
await look('at-wall',0,0);await look('along-left',1.1,0);await look('along-right',-1.1,0);await look('up',0,1.2);await look('down',0,-1.2);
await p.keyboard.up('KeyC');
console.log(errs.join('\n')||'no errors');await b.close();})();
