// Proves the asset files give exactly the tables the game used to have written into its code: builds WEAPONS and STRIKES
// from src/assets/ (as the game does as it loads) and compares every field, box and key with the literal tables in an
// old copy of weapons.js and strikes.js (by default commit 9cbf98b's, the last before the move). Any difference is listed.
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
cmp(W,lit(wf,'WEAPONS'),'WEAPONS');cmp(S,lit(sf,'STRIKES'),'STRIKES');
// (and every file passes its own check, and writes back to the same text)
for(const dir of ['weapons','clips'])for(const k in F[dir]){for(const e of A.assetCheck(dir,k,F[dir][k]))diffs.push(dir+'/'+k+': '+e);
  const txt=fs.readFileSync(path.join(A.ROOT,'src/assets',dir,k+'.json'),'utf8').replace(/\r\n/g,'\n');if(A.fmt(F[dir][k])!==txt)diffs.push(dir+'/'+k+': not in the standard format');}
console.log(diffs.length?diffs.join('\n'):'golden: weapons and clips identical ('+Object.keys(W).length+' weapons, '+Object.keys(S).length+' clips)');
process.exit(diffs.length?1:0);
