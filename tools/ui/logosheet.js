// A contact sheet of every chain's logo, drawn by the game's own signIcon. (Needs t3.html: see tools/build_3d.py.)
// Usage, from tools/ui: node logosheet.js out.png [categories,comma,separated]
const {chromium}=require('playwright');
const fs=require('fs');const base=process.cwd()+'/';
let h=fs.readFileSync(base+'t3.html','utf8');
h=h.replace('window.__G={','window.__G={signIcon,BRANDS,');
fs.writeFileSync(base+'t3dbg.html',h);
const cats=(process.argv[3]||'grocery,bigbox,market,drug,gas,diner,fastfood,sitdown,pizza,cafe,office,shop,cinema,casino,bank,dealer,theme,ikea,aquarium').split(',');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1300,height:1500}});
await p.goto('file://'+base+'t3dbg.html');await p.waitForTimeout(1500);
const n=await p.evaluate((cats)=>{const G=window.__G,seen=new Set(),L=[];for(const c of cats)for(const B of G.BRANDS[c]||[]){if(seen.has(B.n))continue;seen.add(B.n);L.push(B);}
 document.body.innerHTML='';document.body.style.background='#555';const c=document.createElement('canvas');const cols=10,cw=130,ch=130,rows=Math.ceil(L.length/cols);c.width=cols*cw;c.height=rows*ch;c.style.cssText='position:fixed;left:0;top:0;z-index:99999';document.body.appendChild(c);const x=c.getContext('2d');
 L.forEach((B,i)=>{const X=(i%cols)*cw,Y=Math.floor(i/cols)*ch;x.fillStyle=B.bg;x.fillRect(X+3,Y+3,cw-6,ch-6);const r=38,cx=X+cw/2,cy=Y+50;x.fillStyle=B.ac;x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill();try{G.signIcon(x,B.icon,cx,cy,r*0.6,B.bg,B.ac);}catch(e){}x.fillStyle=B.fg;x.font='bold 11px Arial';x.textAlign='center';x.textBaseline='alphabetic';x.fillText(B.n.slice(0,20),cx,Y+112);});
 return L.length;},cats);
await p.screenshot({path:process.argv[2]});console.log('brands',n);await b.close();fs.unlinkSync(base+'t3dbg.html');})();
