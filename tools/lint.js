// Checks src/js as the one shared scope it is: every file's top-level names are every other file's, so a typo or a name
// used twice only fails when the game happens to run that line. This reads all of it (with the parser Node carries
// inside itself, so nothing needs installing) and reports:
//   undefined names, assignments to names nobody declared (accidental globals), names declared twice across files,
//   object literals with a key twice, and calls passing more arguments than the function takes.
// Those fail the check (exit 1). It also lists, without failing: functions replaced after they're declared (the wrappers
// net-sync.js, the profiler and the Testing Environment put round them) and top-level names nothing in src/js reads
// (some are only for the tests or the editor).
// Usage: node tools/lint.js [-v]     (-v: the two lists as well; run_tests.sh runs it without)
if(!process.execArgv.includes('--expose-internals')){const r=require('child_process').spawnSync(process.execPath,['--expose-internals',__filename,...process.argv.slice(2)],{stdio:'inherit'});process.exit(r.status===null?1:r.status);}
const acorn=require('internal/deps/acorn/acorn/dist/acorn');
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..','src','js');
const order=fs.readFileSync(path.join(ROOT,'ORDER.txt'),'utf8').split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));
const BROWSER=new Set(('window document navigator localStorage sessionStorage indexedDB console Math JSON Object Array String Number Boolean Symbol Map Set WeakMap WeakSet Date RegExp Error TypeError RangeError Promise Infinity NaN undefined isNaN isFinite parseInt parseFloat '+
'requestAnimationFrame cancelAnimationFrame setTimeout clearTimeout setInterval clearInterval performance THREE Float32Array Float64Array Uint8Array Uint16Array Uint32Array Int8Array Int16Array Int32Array Uint8ClampedArray ArrayBuffer DataView BigInt '+
'AudioContext webkitAudioContext Image fetch URL URLSearchParams Blob File FileReader location history alert confirm prompt screen innerWidth innerHeight devicePixelRatio matchMedia getComputedStyle addEventListener removeEventListener '+
'HTMLElement HTMLCanvasElement Element Node Event KeyboardEvent MouseEvent CustomEvent TextEncoder TextDecoder crypto structuredClone queueMicrotask BroadcastChannel RTCPeerConnection MediaStream WebSocket Worker OffscreenCanvas ImageData '+
'encodeURIComponent decodeURIComponent encodeURI decodeURI escape unescape atob btoa globalThis arguments eval Function Reflect Proxy Intl WebGL2RenderingContext WebGLRenderingContext ResizeObserver IntersectionObserver MutationObserver '+
'DOMMatrix DOMPoint CompressionStream DecompressionStream Response Request Headers AbortController open close focus self top parent caches Notification IDBKeyRange DOMParser XMLSerializer CSS FontFace Path2D createImageBitmap requestIdleCallback Audio MediaRecorder '+
'ASSETS AggregateError WeakRef FinalizationRegistry Atomics SharedArrayBuffer SyntaxError EvalError ReferenceError URIError DOMException PointerEvent TouchEvent WheelEvent GamepadEvent showSaveFilePicker showOpenFilePicker getScreenDetails').split(/\s+/));
const G=new Map();   // top-level name -> {file,line,kind,node,params,usesArgs,refs,writes}
const out={dups:[],undef:[],arity:[],dupKeys:[],wraps:[],unused:[],implicit:[]};
const files=[];
class Scope{constructor(p,fn){this.p=p;this.fn=fn;this.v=new Map();this.fscope=fn?this:(p?p.fscope:this);}
  has(n){return this.v.has(n);}}
function patNames(n,acc){if(!n)return acc;switch(n.type){case'Identifier':acc.push(n);break;case'ObjectPattern':for(const p of n.properties)patNames(p.type==='RestElement'?p.argument:p.value,acc);break;
  case'ArrayPattern':for(const e of n.elements)patNames(e,acc);break;case'AssignmentPattern':patNames(n.left,acc);break;case'RestElement':patNames(n.argument,acc);break;}return acc;}
function fnInfo(n){if(!n||!/Function/.test(n.type))return null;let rest=false,np=0,opt=0;for(const p of n.params){if(p.type==='RestElement')rest=true;else{np++;}}return{np,rest};}
function usesArguments(fn){let u=false;(function w(n,top){if(!n||typeof n!=='object'||u)return;if(Array.isArray(n)){for(const x of n)w(x,false);return;}if(!n.type)return;
  if(!top&&(n.type==='FunctionDeclaration'||n.type==='FunctionExpression'))return;if(n.type==='Identifier'&&n.name==='arguments'){u=true;return;}
  for(const k in n){if(k==='loc'||k==='start'||k==='end')continue;w(n[k],false);}})(fn.body,true);return u;}
// pass 1: parse, collect top-level declarations
for(const f of order){const src=fs.readFileSync(path.join(ROOT,f),'utf8');let ast;
  try{ast=acorn.parse(src,{ecmaVersion:'latest',sourceType:'script',allowReturnOutsideFunction:true,locations:true});}catch(e){console.log('PARSE FAIL',f,e.message);continue;}
  files.push({f,ast,src});
  const decl=(name,kind,node,val)=>{const prev=G.get(name);const info={file:f,line:node.loc.start.line,kind,val,refs:0,writes:[],calls:0};
    if(prev){out.dups.push(`${name}: ${prev.kind} ${prev.file}:${prev.line} and ${kind} ${f}:${info.line}`);if(kind==='function'||!prev.val)G.set(name,Object.assign(info,{refs:prev.refs}));}else G.set(name,info);};
  for(const st of ast.body){
    if(st.type==='FunctionDeclaration')decl(st.id.name,'function',st,st);
    else if(st.type==='ClassDeclaration')decl(st.id.name,'class',st,null);
    else if(st.type==='VariableDeclaration')for(const d of st.declarations){if(d.id.type==='Identifier')decl(d.id.name,st.kind,d,d.init&&/Function/.test(d.init.type)?d.init:null);else for(const id of patNames(d.id,[]))decl(id.name,st.kind,id,null);}
  }
  // var declarations nested in top-level blocks/loops hoist to the shared scope too
  (function hv(n,depth){if(!n||typeof n!=='object')return;if(Array.isArray(n)){for(const x of n)hv(x,depth);return;}if(!n.type)return;if(/Function/.test(n.type)||n.type==='ClassBody')return;
    if(n.type==='VariableDeclaration'&&n.kind==='var'&&depth>0)for(const d of n.declarations)for(const id of patNames(d.id,[]))if(!G.has(id.name))G.set(id.name,{file:f,line:id.loc.start.line,kind:'var(nested)',val:null,refs:0,writes:[],calls:0});
    if(n.type==='FunctionDeclaration'&&depth>0&&!G.has(n.id.name))G.set(n.id.name,{file:f,line:n.loc.start.line,kind:'function(nested)',val:n,refs:0,writes:[],calls:0});
    for(const k in n){if(k==='loc')continue;hv(n[k],depth+(n.type==='Program'?0:1));}})(ast,0);
}
// pass 2: scopes and references
for(const {f,ast} of files){
  const top=new Scope(null,true);top.top=true;
  const scopes=new Map();
  function declareIn(n,sc){ // hoist declarations for a function/block body
    (function w(n,sc,blockTop){if(!n||typeof n!=='object')return;if(Array.isArray(n)){for(const x of n)w(x,sc,false);return;}if(!n.type)return;
      switch(n.type){
        case'FunctionDeclaration':sc.fscope.v.set(n.id.name,n);return;
        case'FunctionExpression':case'ArrowFunctionExpression':return;
        case'ClassDeclaration':sc.v.set(n.id.name,n);return;
        case'ClassExpression':return;
        case'VariableDeclaration':for(const d of n.declarations){for(const id of patNames(d.id,[]))(n.kind==='var'?sc.fscope:sc).v.set(id.name,d);w(d.init,sc,false);}return;
        case'BlockStatement':case'ForStatement':case'ForInStatement':case'ForOfStatement':case'SwitchStatement':case'CatchClause':{
          if(blockTop&&n.type==='BlockStatement'){for(const x of n.body)w(x,sc,false);return;}
          const s=new Scope(sc,false);scopes.set(n,s);if(n.type==='CatchClause'&&n.param)for(const id of patNames(n.param,[]))s.v.set(id.name,n);
          for(const k in n){if(k==='loc')continue;const c=n[k];if(n.type==='CatchClause'&&k==='body'){for(const x of c.body)w(x,s,false);scopes.set(c,s);continue;}w(c,s,false);}return;}
      }
      for(const k in n){if(k==='loc')continue;w(n[k],sc,false);}
    })(n,sc,true);
  }
  function ref(id,sc,write,callArgs){let s=sc;while(s){if(s.has(id.name)){if(!s.top)return;break;}s=s.p;}
    const g=G.get(id.name);if(!g&&s)return;   // (a function declared inside a bare block at the top of a file: that file's own)
    if(g){g.refs++;if(write)g.writes.push(`${f}:${id.loc.start.line}`);
      if(callArgs){g.calls++;const fn=g.val;if(fn&&!g.writes.length&&g.kind!=='var'&&g.kind!=='let'){const fi=fnInfo(fn);const na=callArgs.length;if(!fi.rest&&!callArgs.some(a=>a.type==='SpreadElement')&&na>fi.np){if(g.ua===undefined)g.ua=usesArguments(fn);if(!g.ua)out.arity.push(`${f}:${id.loc.start.line} ${id.name}() called with ${na} args, declared with ${fi.np} (${g.file}:${g.line})`);}}}
      return;}
    if(BROWSER.has(id.name))return;
    (write?out.implicit:out.undef).push(`${f}:${id.loc.start.line} ${id.name}`);
  }
  function fnScope(n,sc){const s=new Scope(sc,true);if(n.type==='FunctionExpression'&&n.id)s.v.set(n.id.name,n);s.v.set('arguments',n);
    for(const p of n.params)for(const id of patNames(p,[]))s.v.set(id.name,p);
    if(n.body.type==='BlockStatement')declareIn(n.body,s);
    for(const p of n.params)visitPat(p,s);
    if(n.body.type==='BlockStatement'){for(const x of n.body.body)visit(x,s);}else visit(n.body,s);}
  function visitPat(n,sc,write){if(!n)return;switch(n.type){case'Identifier':if(write)ref(n,sc,true);break;
    case'ObjectPattern':for(const p of n.properties){if(p.type==='RestElement')visitPat(p.argument,sc,write);else{if(p.computed)visit(p.key,sc);visitPat(p.value,sc,write);}}break;
    case'ArrayPattern':for(const e of n.elements)visitPat(e,sc,write);break;case'AssignmentPattern':visitPat(n.left,sc,write);visit(n.right,sc);break;case'RestElement':visitPat(n.argument,sc,write);break;
    case'MemberExpression':visit(n,sc);break;}}
  function visit(n,sc){if(!n||typeof n!=='object')return;if(Array.isArray(n)){for(const x of n)visit(x,sc);return;}
    switch(n.type){
      case'Identifier':ref(n,sc,false);return;
      case'FunctionDeclaration':case'FunctionExpression':case'ArrowFunctionExpression':fnScope(n,sc);return;
      case'ClassDeclaration':case'ClassExpression':{const s=new Scope(sc,false);if(n.id)s.v.set(n.id.name,n);visit(n.superClass,sc);for(const m of n.body.body){if(m.computed)visit(m.key,s);visit(m.value,s);}return;}
      case'VariableDeclaration':for(const d of n.declarations){visitPat(d.id,sc,false);visit(d.init,sc);}return;
      case'MemberExpression':visit(n.object,sc);if(n.computed)visit(n.property,sc);return;
      case'Property':if(n.computed)visit(n.key,sc);visit(n.value,sc);return;
      case'ObjectExpression':{const seen=new Set();for(const p of n.properties){if(p.type==='Property'&&!p.computed){const k=p.key.name!==undefined?p.key.name:String(p.key.value);if(seen.has(k)&&p.kind==='init')out.dupKeys.push(`${f}:${p.loc.start.line} duplicate key '${k}'`);seen.add(k);}visit(p,sc);}return;}
      case'LabeledStatement':visit(n.body,sc);return;
      case'BreakStatement':case'ContinueStatement':return;
      case'AssignmentExpression':if(n.left.type==='Identifier')ref(n.left,sc,true);else visitPat(n.left,sc,true);visit(n.right,sc);return;
      case'UpdateExpression':if(n.argument.type==='Identifier')ref(n.argument,sc,true);else visit(n.argument,sc);return;
      case'CallExpression':if(n.callee.type==='Identifier')ref(n.callee,sc,false,n.arguments);else visit(n.callee,sc);visit(n.arguments,sc);return;
      case'ForInStatement':case'ForOfStatement':{const s=scopes.get(n)||sc;if(n.left.type==='VariableDeclaration')visit(n.left,s);else visitPat(n.left,s,true);visit(n.right,s);visit(n.body,s);return;}
      case'BlockStatement':case'ForStatement':case'SwitchStatement':case'CatchClause':{const s=scopes.get(n)||sc;for(const k in n){if(k==='loc'||k==='param')continue;visit(n[k],s);}return;}
      case'MetaProperty':return;
    }
    if(!n.type)return;
    for(const k in n){if(k==='loc')continue;visit(n[k],sc);}
  }
  declareIn(ast,top);
  // mark top-level names as top (resolved via G)
  for(const x of ast.body)visit(x,top);
}
for(const [name,g] of G){if(g.refs===0)out.unused.push(`${g.file}:${g.line} ${g.kind} ${name}`);if(g.writes.length&&(g.kind==='function'))out.wraps.push(`${name} (${g.file}:${g.line}) reassigned at ${g.writes.join(', ')}`);}
const V=process.argv.includes('-v'),FAIL=['dups','undef','implicit','dupKeys','arity'],SAY={dups:'declared twice',undef:'undefined names',implicit:'assigned but never declared',dupKeys:'object keys given twice',arity:'calls with more arguments than the function takes',wraps:'functions replaced after they are declared',unused:'top-level names nothing in src/js reads'};
let bad=0;
for(const k of Object.keys(out)){const fail=FAIL.includes(k);if(fail)bad+=out[k].length;if(!out[k].length||!fail&&!V)continue;console.log('\n'+SAY[k]+' ('+out[k].length+')');for(const l of out[k])console.log('  '+l);}
console.log((bad?'\n':'')+'lint: '+files.length+' files, '+G.size+' top-level names, '+(bad?bad+' problem'+(bad>1?'s':''):'ok')+' ('+out.wraps.length+' wrapped, '+out.unused.length+' unread'+(V?'':': -v lists them')+')');
process.exit(bad?1:0);
