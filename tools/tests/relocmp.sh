#!/usr/bin/env bash
# compare each kind built where the plan has it (home) with the same built in front of Gus (move)
cd "$(dirname "$0")"; mkdir -p /tmp/relo
for k in ${KINDS:-hospital homes fire zoo police school}; do
  KIND=$k MODE=home node relo.js > /tmp/relo_$k.home.json 2>/dev/null &
  KIND=$k MODE=move node relo.js > /tmp/relo_$k.move.json 2>/dev/null &
  wait
  node -e '
const [a,b]=process.argv.slice(1).map(f=>JSON.parse(require("fs").readFileSync(f,"utf8").trim().split("\n").pop()));
if(a.err||b.err){console.log(process.argv[3].split("_")[1],"ERR",a.err||"",b.err||"",a.msg||b.msg);process.exit();}
const ms=(x,y)=>{const m=new Map();for(const k of x)m.set(k,(m.get(k)||0)+1);for(const k of y)m.set(k,(m.get(k)||0)-1);const d=[];for(const [k,v] of m)if(v)d.push(k+":"+v);return d;};
const cd=[];for(const k of new Set([...Object.keys(a.cols),...Object.keys(b.cols)]))if(a.cols[k]!==b.cols[k])cd.push(k);
const k=process.argv[1].split("relo_")[1].split(".")[0];
console.log(k.padEnd(9),"box",JSON.stringify(b.box),"| blocks",a.nb,b.nb,"cols differ",cd.length,cd.slice(0,6).join(" "),
 "| meshes",a.meshes.length,b.meshes.length,"diff",ms(a.meshes,b.meshes).length,"| fix",a.fix.length,b.fix.length,"diff",ms(a.fix,b.fix).length,
 "| props",a.props.length,b.props.length,"diff",ms(a.props,b.props).length,"| doors",a.doors,b.doors,"signs",a.signs,b.signs,"venues",a.venues,b.venues,"lm",a.lm,b.lm,
 "| gob",a.gob.length,b.gob.length,"| gus",a.gus.join(","),"/",b.gus.join(","),"| errs",a.errs.length,b.errs.length,(a.errs[0]||b.errs[0]||"").slice(0,200));
if(process.env.V){console.log(" mesh diff",ms(a.meshes,b.meshes).slice(0,30).join(" "));console.log(" fix diff",ms(a.fix,b.fix).slice(0,20).join(" "));console.log(" props diff",ms(a.props,b.props).slice(0,20).join(" "));console.log(" gob",a.gob.join(" "),"/",b.gob.join(" "));}
' /tmp/relo_$k.home.json /tmp/relo_$k.move.json
done
