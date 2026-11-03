// How much of each building do its stairs take up, and do they get in the way of its door? node stairroom.js [radius in plots]
const fs=require('fs');
let hdr=fs.readFileSync('stairs.js','utf8').split('\n');
const n=hdr.findIndex(l=>l.startsWith('eval(src);'));
hdr=hdr.slice(0,n).join('\n').replace(/window\.__t=\{/,'window.__t={');
eval(hdr+`
eval(src);const T=window.__t,R=+(process.argv[2]||160),seen=new Set(),O={};
for(let x=-R;x<=R;x++)for(let z=-R;z<=R;z++){const s=T.superOf(x,z),ax=s?s.ax:x,az=s?s.az:z,P=T.plotInfo(ax,az);
  P.b.forEach((b,i)=>{const k=ax+','+az+','+i;if(seen.has(k)||!b.stair)return;seen.add(k);
    const S=b.stair,al=S.ax==='x',iw=b.x1-b.x0-2,id=b.z1-b.z0-2,area=iw*id,used=(S.L+2)*(S.c1-S.c0+2),share=used/area;
    // the stairs' box, with a block round it, against a 3-wide way in from the door to the middle of the room
    const x0=al?S.r0-1:S.c0-1,x1=al?S.r0+S.L:S.c1+1,z0=al?S.c0-1:S.r0-1,z1=al?S.c1+1:S.r0+S.L,cx=(b.x0+b.x1)>>1,cz=(b.z0+b.z1)>>1;
    let door=false;
    if(b.door===2)door=cx+2>x0&&cx-1<x1&&b.z0<z1&&cz>z0;
    else if(b.door===3)door=cx+2>x0&&cx-1<x1&&cz<z1&&b.z1>z0;
    else if(b.door===0)door=cz+2>z0&&cz-1<z1&&b.x0<x1&&cx>x0;
    else door=cz+2>z0&&cz-1<z1&&cx<x1&&b.x1>x0;
    // what's left beside the flight, across the building
    const left=(al?id:iw)-(S.c1-S.c0+1);
    const name=(s?s.kind:P.type)+'/'+b.ground+'/'+b.kind,E=O[name]||(O[name]={n:0,max:0,sum:0,door:0,left:1e9,iw:0,id:0});
    E.n++;E.sum+=share;if(share>E.max){E.max=share;E.iw=iw;E.id=id;}if(door)E.door++;E.left=Math.min(E.left,left);});}
Object.entries(O).sort((a,c)=>c[1].max-a[1].max).forEach(([k,E])=>console.log(String(E.n).padStart(5),k.padEnd(34),'share avg',(E.sum/E.n*100).toFixed(0)+'%','max',(E.max*100).toFixed(0)+'%','('+E.iw+'x'+E.id+')','door blocked',E.door,'room beside',E.left));
`);
process.exit(0);
