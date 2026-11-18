// Draws every vehicle instrument (ui/instruments.js) from made-up vehicles at a few speeds into an HTML page with the
// game's own styles, for tools/ui/instshot.js to photograph. node instsheet.js out.html
const fs=require('fs');
let hdr=fs.readFileSync('site.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n');
hdr=hdr.replace(/window\.__t=\{/,'window.__t={INSTRUMENTS,BOATS,MG,get G(){return G},');
const OUT=process.argv[2]||'inst.html';
eval(hdr+`
eval(src);const T=window.__t;
const G=T.G;const P=T.players[0];P.spV=96;P.cam.yaw=Math.PI;P.idx=0;P.in.z=-1;
const g=(rz,ry)=>({rotation:{x:0,y:ry||0,z:rz||0},position:{x:0,y:G+60,z:0}});
const car=(veh,sp,x)=>Object.assign({veh,speed:sp,heading:0.3,g:g(0.4),pos:{x:0,y:G+1,z:0},hvel:{x:4,z:9},drift:{ch:0.55},fork:{h:1.8,tilt:3,load:{name:'CRATE',kg:120},risk:0.6},farm:{cr:2,imp:'plough',down:true}},x||{});
const S=[
 ['car',{k:'car',o:car('car',22)}],['bike',{k:'car',o:car('bike',25)}],['truck',{k:'car',o:car('semi',12)}],['hover',{k:'car',o:car('hover',18)}],
 ['fork',{k:'car',o:car('forklift',3)}],['tractor',{k:'car',o:car('tractor',6)}],
 ['tank',{k:'tank',o:{h:0.4,tu:0.9,sv:5,shell:'he'}}],['heli',{k:'heli',o:{x:0,y:G+30,z:0,hv:{x:20,z:5},spin:0.97,pitch:0.1,roll:0.2}}],
 ['steam',{k:'plane',o:{light:true,g:g(0,1),free:{v:30,thr:0.7,pt:0.1,rl:0.3,air:true,gm:0.05}}}],
 ['pfd',{k:'plane',o:{g:g(0,1),free:{v:80,thr:0.8,pt:0.05,rl:0.2,air:true,gm:0.02}}}],
 ['boat',{k:'boat',o:{k:'speed',K:T.BOATS.speed,g:g(0,0.8),sp:12,notch:3}}],['row',{k:'boat',o:{k:'row',K:T.BOATS.row,g:g(0,0.8),sp:1.5,row:{l:0.6,r:0.1,ok:0.8}}}],
 ['ship',{k:'ship',o:{ord:3,sp:3,K:{top:6},rud:-0.4}}],['train',{k:'train',o:{v:22,dir:1,rail:{n:2,rev:1,bp:0.3,lim:95}}}],
 ['balloon',{k:'balloon',o:{x:0,y:G+40,z:0,vy:1.5,heat:0.7}}],
];
let html='<!doctype html><meta charset=utf-8><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jersey+10&family=Atkinson+Hyperlegible+Next:wght@400;600;700;800&family=Atkinson+Hyperlegible+Mono:wght@400;600;700&family=Chakra+Petch:wght@400;600;700&display=swap"><style>'+fs.readFileSync('../../src/style.css','utf8')+'body{background:linear-gradient(#9fd2f2,#5e8d3a);display:flex;flex-wrap:wrap;gap:24px;padding:20px}.cell{position:relative;width:330px;height:270px;border:2px solid #2b1b2e}.cell b{position:absolute;left:4px;top:2px;font:12px monospace}</style>';
for(const [k,D] of S){const I=T.INSTRUMENTS[k];let h;try{h=I.draw(P,D,0.05);}catch(e){h='<text>'+e.message+'</text>';}
  html+='<div class="cell"><b>'+k+'</b><div class="speedo'+(I.flat?' flat':'')+'" style="width:min('+I.w+'px,94%)"><div class="inst-body"><svg viewBox="'+I.vb+'">'+h+'</svg></div></div></div>';}
{const D={k:'plane',o:{jet:true,hook:false,g:g(0,1),free:{v:150,thr:0.9,pt:0.15,rl:0.6,air:true,gm:0.05,gl:3.2}}},h=T.INSTRUMENTS.jet.draw(P,D,0.05);
 html+='<div class="cell" style="width:640px;height:360px;background:#5aa3e0"><b>jet</b><div class="inst-over"><svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet">'+h+'</svg></div></div>';}
fs.writeFileSync(OUT,html);console.log('wrote',OUT);
`);
process.exit(0);
