// The Mobile Gear's loadout, picked in the Testing Environment panel: each slot's choices, what a spawned Mobile Gear
// carries (and one already standing keeping its own), each of the other weapons firing (the left-hand rifle, the
// shotgun's pellets, the rocket volley, the lobber's arcing shells), the display naming them, and the loadout sent
// online as four digits. node mechload.js
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={setGob,tenvVeh,tenvSpawnOne,MG,MGW,mHeld,keys,setRaw,get:(x,y,z)=>get(x,y,z),groundAt,tpRender,MG_SLOTS,MG_WPNS,mgLoadSet,mgLoadFix,mgLoadCode,mgLoadDecode,mgWpnList,get MG_LOAD(){return MG_LOAD},get DT(){return DT},');
eval(hdr+`
eval(src);const T=window.__t;let now=1000;
const quiet=()=>{for(const g of T.goblins)if(g.state==='chase'&&!g.keep){g.state='wait';g.t=-1e9;g.root.visible=false;}};
const run=s=>{for(let i=0;i<s*60;i++){quiet();now+=16.7;T.frame(now);}};
const errs=[];console.error=(...a)=>{errs.push(a.join(" ").slice(0,300));};
const P=T.players[0];for(const f of els.play.L.click)f();pads.length=0;run(2);
const f1=v=>v.toFixed(1),f2=v=>v.toFixed(2),G0=44;
const hold=(ks,s)=>{for(const k of ks)T.keys.add(k);run(s);for(const k of ks)T.keys.delete(k);};
const put=(x,y,z)=>{P.pos.set(x,y,z);P.vy=0;P.mvx=P.mvz=0;P.standCar=null;P.vcl=null;P.state='walk';P.grounded=false;};
T.DT.invuln=true;T.DT.host=1;T.TS.n=1;   // (Passive: Pacifist, now 0, would stop goblins being hurt)
const V=()=>T.venues.get('tenvMechs');
const spawn=()=>{P.cam.yaw=Math.PI;P.cam.pitch=-0.1;run(0.1);T.tenvVeh('mech');run(0.3);return V().mechs[V().mechs.length-1];};
const board=M=>{put(M.x-(T.MG.r+0.8),M.y+0.2,M.z);run(0.05);hold(['KeyF'],0.1);run(0.2);M.h=0;P.cam.yaw=Math.PI;P.cam.pitch=-0.1;run(0.3);};
const names=M=>T.mgWpnList(M).map(w=>w.name).join(', ');
const gob=(M,dx,dz,hp)=>{const g=T.goblins.find(g=>g.state==='wait'&&!g.civ&&!g.special);g.state='chase';g.keep=true;g.hp=g.hpMax=hp||6;const x=M.x+dx,z=M.z+dz;g.pos.set(x,T.groundAt(x,z,G0+20),z);g.root.visible=true;return g;};
const clear=()=>{for(const g of T.goblins)g.keep=false;run(0.1);};
// (a stone wall 12 wide and 10 tall, d ahead of it, and how many of its blocks are left)
const wall=(M,d)=>{const X=Math.floor(M.x),Z=Math.floor(M.z)+d,Y=Math.floor(M.y);for(let x=X-6;x<=X+6;x++)for(let y=Y;y<Y+10;y++)for(let z=Z;z<Z+3;z++)T.setRaw(x,y,z,3);run(0.1);
  return ()=>{let c=0;for(let x=X-6;x<=X+6;x++)for(let y=Y;y<Y+10;y++)for(let z=Z;z<Z+3;z++)if(T.get(x,y,z)===3)c++;return c;};};
const unwall=(M,d)=>{const X=Math.floor(M.x),Z=Math.floor(M.z)+d,Y=Math.floor(M.y);for(let x=X-8;x<=X+8;x++)for(let y=Y;y<Y+12;y++)for(let z=Z-2;z<Z+6;z++)if(T.get(x,y,z))T.setRaw(x,y,z,0);run(0.1);};

// ---- the choices and the panel
console.log('slots:',T.MG_SLOTS.map(S=>S.n+': '+S.ks.map(k=>T.MG_WPNS[k].name).join(' or ')).join(' | '));
console.log('loadout at first:',JSON.stringify(T.MG_LOAD));
T.tpRender();const rows=els.tpLoad.kids.slice(0,4);   // (the stub's elements have no childElementCount, so the game's own render adds rows too: the first four are this one's)
console.log('panel: rows',rows.length,' buttons in each',rows.map(r=>r.kids[1].kids.length).join(' '),' labels',rows.map(r=>r.kids[0].textContent).join(', '));
console.log('a bad saved loadout is mended:',JSON.stringify(T.mgLoadFix({mgArmL:'cannon',mgShR:'lobber'})));
// ---- one spawned on the defaults, then the loadout changed and another spawned
T.setGob(true);run(0.5);T.tenvClear();run(0.2);
const A=spawn();console.log('spawned on the defaults carries:',names(A),' blade on its arm',!!A.J.arms.find(a=>a.s>0).bl);
for(const b of rows.flatMap(r=>r.kids[1].kids))if(b.dataset.mgw==='rifleL'||b.dataset.mgw==='shotgun'||b.dataset.mgw==='volley'||b.dataset.mgw==='lobber')for(const f of b.L.click)f();
console.log('picked by the panel buttons:',JSON.stringify(T.MG_LOAD),' says',els.tpInfo&&els.tpInfo.textContent);
const B=spawn();console.log('spawned after:',names(B),' blade on its arm',!!B.J.arms.find(a=>a.s>0).bl,' gun on each arm',B.J.arms.map(a=>!!a.mz).join(' '),'  the first still carries',names(A));
T.mgLoadSet('mgArmR','rifle');console.log('right arm put back to the rifle:',JSON.stringify(T.MG_LOAD),'  the second still carries',names(B));
T.mgLoadSet('mgArmR','shotgun');
console.log('sent online as',T.mgLoadCode(B.load),'and',T.mgLoadCode(A.load),' read back the same',JSON.stringify(T.mgLoadDecode(T.mgLoadCode(B.load)))===JSON.stringify(B.load));
// ---- firing the others (A out of the way first)
A.x+=60;run(0.2);
const M=B;board(M);console.log('in the second:',P.drv&&P.drv.o===M);
{const H=P.ui.drvHud;run(0.1);console.log('  display names',H.mgw.wb.map(b=>b.D.name+' on '+b.D.act).join(', '));}
const W=()=>M.wpn,mh=T.mHeld;
// (the left-hand rifle, held: rounds, a goblin ahead, the arm raised)
{const g=gob(M,0,30);run(0.3);const n0=W().rifleL.n;mh.add('Mouse0');run(0.6);mh.delete('Mouse0');run(0.3);
 console.log('left-hand Rivet Rifle held 0.6 s: rounds',n0-W().rifleL.n,' the goblin ahead',g.state,' left arm raised',f2(M.laA),' no blade swing',!M.sl);clear();}
{mh.add('Mouse0');let t=0;while(W().rifleL.n>0&&t<8){run(0.1);t+=0.1;}mh.delete('Mouse0');let r=0;while(W().rifleL.rl>0&&r<6){run(0.1);r+=0.1;}
 console.log('  40 rounds gone in',f1(t),'s; reloaded in',f1(r),'s');}
// (the shotgun: two goblins side by side ahead, one shot)
{P.cam.pitch=-0.3;const g1=gob(M,-1,14),g2=gob(M,1,14);run(0.3);const n0=W().shotgun.n;mh.add('Mouse2');run(0.05);mh.delete('Mouse2');run(0.4);
 console.log('Scrap Shotgun, one shot at two goblins 14 ahead: shells used',n0-W().shotgun.n,' goblins',g1.state,g2.state,' soft lock',M.soft===g1||M.soft===g2);clear();P.cam.pitch=-0.1;run(0.5);}
{const cnt=wall(M,25),c0=cnt();mh.add('Mouse2');run(3);mh.delete('Mouse2');run(0.3);console.log('  held 3 s at a wall 25 ahead: shells',6-W().shotgun.n,'(then reloading',(W().shotgun.rl>0)+')',' blocks broken',c0-cnt());unwall(M,25);run(3.5);}
// (the rocket volley: held at a wall 40 ahead)
{const cnt=wall(M,40),c0=cnt();T.keys.add('KeyQ');run(1);const lid=M.pdA;T.keys.delete('KeyQ');run(1.5);console.log('Rocket Volley held 1 s at a wall 40 ahead: rockets',12-W().volley.n,' blocks blown out',c0-cnt(),' pod lid opened',f2(lid));
 T.keys.add('KeyQ');run(1.5);T.keys.delete('KeyQ');console.log('  all twelve gone, reloading',W().volley.rl>0);unwall(M,40);}
// (the lobber: aimed at a wall 50 ahead, pitched up, held; its shells come down)
{const cnt=wall(M,50),c0=cnt();T.keys.add('KeyE');run(1.2);const cn=M.cnA,br=M.brace>0;T.keys.delete('KeyE');run(3);console.log('Clod Lobber held 1.2 s at a wall 50 ahead: shells',6-W().lobber.n,' blocks blown out',c0-cnt(),' no brace',!br,' cannon swung over',f2(cn));unwall(M,50);}
// (a goblin lobbed at, 35 ahead)
{run(6);const g=gob(M,0,35);run(0.3);const sl=M.soft===g;T.keys.add('KeyE');run(0.05);T.keys.delete('KeyE');run(2.5);console.log('  one shell at a goblin 35 ahead:',g.state,f1(g.hp),' locked',sl,' shells',W().lobber.n);clear();}
console.log('errors:',errs.length?errs.slice(0,3):'none');process.exit(0);
`);
