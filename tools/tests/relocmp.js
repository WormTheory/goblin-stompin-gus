// compares /tmp/relo/<kind>.home.json with .move.json for each kind (see relo.js)
const fs=require('fs');const dir=process.argv[2]||'/tmp/relo';
const ld=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8').trim().split('\n').pop());}catch(e){return {err:'unreadable'};}};
const ms=(x,y)=>{const m=new Map();for(const k of x)m.set(k,(m.get(k)||0)+1);for(const k of y)m.set(k,(m.get(k)||0)-1);const d=[];for(const [k,v] of m)if(v)d.push(k+':'+v);return d;};
if(!fs.existsSync(dir+'/kinds')){console.log('nothing to compare: run relo.js for each kind first (relocmp.sh compares them itself)');process.exit(0);}
let bad=0;
for(const k of fs.readFileSync(dir+'/kinds','utf8').trim().split(/\s+/)){
  const a=ld(`${dir}/${k}.home.json`),b=ld(`${dir}/${k}.move.json`);
  if(a.err||b.err){console.log(k.padEnd(10),'ERR',a.err||'-',b.err||'-',(a.msg||b.msg||'').slice(0,90));continue;}
  const cd=[];for(const c of new Set([...Object.keys(a.cols),...Object.keys(b.cols)]))if(a.cols[c]!==b.cols[c])cd.push(c);
  const D={cols:cd.length,mesh:ms(a.meshes,b.meshes).length,fix:ms(a.fix,b.fix).length,props:ms(a.props,b.props).length,doors:a.doors-b.doors,signs:a.signs-b.signs,venues:a.venues-b.venues,lm:a.lm-b.lm,gob:a.gob.length-b.gob.length,errs:b.errs.length};
  const ok=Object.values(D).every(v=>!v);if(!ok)bad++;
  console.log(k.padEnd(10),ok?'SAME':'DIFF',`${a.box.w}x${a.box.h}`,'meshes',a.meshes.length,'fix',a.fix.length,'props',a.props.length,'doors',a.doors,'signs',a.signs,'venues',a.venues,'gob',a.gob.length,ok?'':JSON.stringify(D),b.errs[0]?b.errs[0].slice(0,160):'');
  if(!ok&&process.env.V){console.log('   cols',cd.slice(0,8).join(' '));console.log('   mesh',ms(a.meshes,b.meshes).slice(0,16).join(' '));console.log('   fix',ms(a.fix,b.fix).slice(0,10).join(' '),'props',ms(a.props,b.props).slice(0,10).join(' '));}
}
console.log('kinds differing',bad);
