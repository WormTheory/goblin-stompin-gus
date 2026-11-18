// Proves the asset files give exactly the tables the game used to have written into its code: builds WEAPONS and STRIKES
// from src/assets/ (as the game does as it loads) and compares every field, box and key with the literal tables in an
// old copy of weapons.js and strikes.js (by default commit 9cbf98b's, the last before the move). Any difference is listed.
// (Animations are compared pose by pose, as they've had a track of keys per channel since.)
//   node tools/assets/golden.js [old weapons.js] [old strikes.js]
const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const A=require('./asset-format.js');
const tmp=f=>{const p=path.join(os.tmpdir(),'gsg-golden-'+path.basename(f));fs.writeFileSync(p,cp.execSync('git show 9cbf98b:'+f,{cwd:A.ROOT}));return p;};
const wf=process.argv[2]||tmp('src/js/enemies/weapons.js'),sf=process.argv[3]||tmp('src/js/enemies/strikes.js');
function lit(file,name){const s=fs.readFileSync(file,'utf8'),i=s.indexOf('const '+name+'={');let d=0,j=s.indexOf('{',i);const st=j;
  for(;j<s.length;j++){const c=s[j];if(c==='{'||c==='[')d++;else if(c==='}'||c===']'){d--;if(!d)break;}
    else if(c==="'"||c==='"'){const q=c;j++;while(s[j]!==q){if(s[j]===String.fromCharCode(92))j++;j++;}}else if(c==='/'&&s[j+1]==='/'){while(s[j]!=='\n')j++;}}
  return Function('return '+s.slice(st,j+1))();}
const diffs=[];
function cmp(a,b,at){
  if(Array.isArray(a)||Array.isArray(b)){if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length)return diffs.push(at+': length '+(a&&a.length)+' vs '+(b&&b.length));
    for(let i=0;i<a.length;i++)cmp(a[i],b[i],at+'['+i+']');return;}
  if(a&&typeof a==='object'&&b&&typeof b==='object'){const ka=Object.keys(a),kb=Object.keys(b);
    if(ka.join()!==kb.join())diffs.push(at+': keys '+ka.join()+' vs '+kb.join());for(const k of ka)cmp(a[k],b[k],at+'.'+k);return;}
  if(a!==b)diffs.push(at+': '+a+' vs '+b);
}
const F=A.readAll(),W=A.assetWeaponsAll(F),S=A.assetClipsAll(F);
// (models made since the move, where the old table had none, are new rather than different: the club's dropped model)
const OLD=lit(wf,'WEAPONS'),added=[];
for(const k in W){const m=W[k].model,o=OLD[k]&&OLD[k].model;if(!m||!o)continue;
  for(const j of A.ASSET_LISTS)if(m[j]&&!o[j]){added.push(k+'.'+j);const c=Object.assign({},m);delete c[j];W[k]=Object.assign({},W[k],{model:c});}}
cmp(W,OLD,'WEAPONS');
// (animations are kept a track per channel since, so they're compared by their poses: at every 1/1000 of u, as the old
// table's whole-pose keys gave them, against the files' tracks, both as the game stores them, Float32)
{const OS=lit(sf,'STRIKES');cmp(Object.keys(S),Object.keys(OS),'STRIKES names');
  const oldAt=(K,u)=>{let i=1;while(i<K.length-1&&K[i][0]<u)i++;const a=K[i-1],b=K[i],s=Math.max(0,Math.min(1,(u-a[0])/(b[0]-a[0]))),e=b[b.length-1],
    k=e==='i'?s*s:e==='o'?1-(1-s)*(1-s):s*s*(3-2*s),n=typeof e==='string'?b.length-2:b.length-1,o=[];for(let j=0;j<n;j++)o.push(Math.fround(a[j+1]+(b[j+1]-a[j+1])*k));return o;};
  for(const k in OS){if(!F.clips[k])continue;for(let i=0;i<=2000;i++){const u=i/1000,a=oldAt(OS[k],u),b=A.assetPoseAt(F.clips[k],u).map(Math.fround);
    if(a.length!==b.length||a.some((x,j)=>x!==b[j])){diffs.push('STRIKES.'+k+': pose at u '+u+' '+a+' vs '+b);break;}}}}
// (and every file passes its own check, and writes back to the same text)
for(const dir of ['weapons','clips'])for(const k in F[dir]){for(const e of A.assetCheck(dir,k,F[dir][k]))diffs.push(dir+'/'+k+': '+e);
  const txt=fs.readFileSync(path.join(A.ROOT,'src/assets',dir,k+'.json'),'utf8').replace(/\r\n/g,'\n');if(A.fmt(F[dir][k])!==txt)diffs.push(dir+'/'+k+': not in the standard format');}
console.log(diffs.length?diffs.join('\n'):'golden: weapons and clips identical ('+Object.keys(W).length+' weapons, '+Object.keys(S).length+' clips)'+(added.length?'; new since: '+added.join(', '):''));
process.exit(diffs.length?1:0);
