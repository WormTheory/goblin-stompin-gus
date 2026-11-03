const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1000,height:620}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/t3.html#'+process.argv[3]);await p.waitForTimeout(2500);
await p.evaluate(()=>document.getElementById('play').click());await p.waitForTimeout(2000);
const shots=JSON.parse(process.argv[2]);
for(const [name,x,y,z,yaw,pitch] of shots){
  for(let k=0;k<2;k++){await p.evaluate(([x,y,z,yaw,pitch])=>{const P=window.__G.players[0];P.pos.set(x,y,z);P.vy=0;P.cam.yaw=yaw;if(pitch!==undefined)P.cam.pitch=pitch;P.hp=999;},[x,y,z,yaw,pitch]);
  await p.waitForTimeout(k?1500:9000);}
  await p.screenshot({path:name+'.png'});}
console.log(errs.join('\n')||'no errors');await b.close();})();
