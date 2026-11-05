// ---------- Texture atlas ----------
const T=16,AC=8,AR=12;
const atlas=document.createElement('canvas');atlas.width=T*AC;atlas.height=T*AR;
const actx=atlas.getContext('2d');
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
function paint(idx,fn){
  const r=mulberry(idx*977+13);const img=actx.createImageData(T,T);
  for(let y=0;y<T;y++)for(let x=0;x<T;x++){const c=fn(x,y,r),o=(y*T+x)*4;img.data[o]=c[0];img.data[o+1]=c[1];img.data[o+2]=c[2];img.data[o+3]=c.length>3?c[3]:255;}
  actx.putImageData(img,(idx%AC)*T,Math.floor(idx/AC)*T);
}
const jit=(c,r,a)=>{const k=(r()-.5)*a;return[c[0]+k,c[1]+k,c[2]+k];};
const dirtPx=(x,y,r)=>{const v=r();return v<.08?[105,74,50]:v>.93?[160,118,84]:jit([134,96,67],r,18);};
const asph=(x,y,r)=>{const v=r();return v<.06?[40,42,44]:v>.95?[86,88,90]:jit([60,62,64],r,10);};
const pane=(x,y)=>((x>=2&&x<=6)||(x>=9&&x<=13))&&((y>=2&&y<=6)||(y>=9&&y<=13));
const paneIdx=(x,y)=>(x>=9?1:0)+(y>=9?2:0);
paint(0,(x,y,r)=>{const v=r();return v<.1?[72,128,38]:v>.92?[126,190,74]:jit([95,159,53],r,22);});
const grassEdge=[];{const r=mulberry(4242);for(let x=0;x<T;x++)grassEdge[x]=3+Math.floor(r()*3);}
paint(1,(x,y,r)=>y<grassEdge[x]?jit([95,159,53],r,22):dirtPx(x,y,r));
paint(2,dirtPx);
paint(3,(x,y,r)=>{const v=r();return v<.1?[98,98,102]:v>.94?[150,150,152]:jit([125,125,128],r,16);});
paint(4,(x,y,r)=>{const dark=(x%4===0)||(r()<.08);return jit(dark?[78,60,36]:[108,84,52],r,12);});
paint(5,(x,y,r)=>{const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5));if(d>6.5)return jit([102,80,48],r,10);return jit(Math.floor(d)%2?[170,136,86]:[146,114,68],r,10);});
paint(6,(x,y,r)=>{const v=r();if(v<.18)return[0,0,0,0];return jit(v>.85?[78,150,52]:[52,112,36],r,20);});
paint(7,(x,y,r)=>jit(r()<.1?[200,186,140]:[220,208,164],r,12));
paint(8,(x,y,r)=>{const row=Math.floor(y/4);const seam=(x+row*5)%8===0;if(y%4===3||seam)return[96,74,42];return jit([168,134,80],r,14);});
paint(9,(x,y,r)=>{if(x===0||y===0||x===T-1||y===T-1)return[210,232,240,255];return[200,225,240,30];});
paint(10,(x,y,r)=>{const c=jit([46,98,196],r,18);c.push(170);return c;});
paint(11,(x,y,r)=>{const edge=((x+(Math.floor(y/5)%2)*3)%5===0)||(y%5===0);return edge?[78,78,80]:jit([122,122,124],r,14);});
paint(12,(x,y,r)=>{const row=Math.floor(y/4),off=row%2?4:0;if(y%4===0||(x+off)%8===0)return jit([120,112,100],r,10);return jit([128,58,44],r,18);});
paint(13,asph);
paint(14,(x,y,r)=>x>=1&&x<=3?jit([214,182,48],r,12):asph(x,y,r));
paint(43,(x,y,r)=>x>=12&&x<=14?jit([214,182,48],r,12):asph(x,y,r));
paint(44,(x,y,r)=>y>=12&&y<=14?jit([214,182,48],r,12):asph(x,y,r));
// crosswalk bar: scuffed white paint with a ragged asphalt margin
// r is the tile's random generator: a few pixels of each bar are worn back to asphalt
paint(45,(x,y,r)=>(x>=5&&x<=10&&r()>=0.06)?jit([218,216,206],r,10):asph(x,y,r));
paint(46,(x,y,r)=>(y>=5&&y<=10&&r()>=0.06)?jit([218,216,206],r,10):asph(x,y,r));
paint(28,(x,y,r)=>y>=1&&y<=3?jit([214,182,48],r,12):asph(x,y,r));
paint(15,(x,y,r)=>(x===0||y===0)?[118,120,116]:jit([156,158,150],r,10));
paint(16,(x,y,r)=>{const v=r();return v<.07?[100,104,100]:jit([132,136,130],r,12);});
paint(17,(x,y,r)=>{const moss=r()<(0.15+y/30);return moss?jit([82,110,58],r,20):jit([124,130,122],r,12);});
paint(18,(x,y,r)=>{if(x===0||y===0)return[64,72,82];if((x===2||x===13)&&(y===2||y===13))return[150,160,170];return jit([96,106,118],r,8);});
paint(19,(x,y,r)=>{const streak=(x*7)%5===0&&r()<.7;return streak?jit([74,40,24],r,10):jit([142,76,40],r,26);});
paint(20,(x,y,r)=>{if(!pane(x,y))return[52,60,72];const hl=(x+y)%7===0;return hl?[150,200,230]:jit([40,92,140],r,14);});
paint(21,(x,y,r)=>{if(!pane(x,y))return[36,44,36];const lit=[1,0,1,1][paneIdx(x,y)];return lit?jit([150,232,96],r,20):[28,40,30];});
paint(22,(x,y,r)=>{if(!pane(x,y))return[52,40,32];const lit=[1,1,0,1][paneIdx(x,y)];return lit?jit([244,190,92],r,22):[40,32,26];});
paint(23,(x,y,r)=>{const v=r();return v<.15?[50,50,46]:jit([78,78,72],r,14);});
paint(24,(x,y,r)=>{const e=x<2||y<2||x>13||y>13;return e?[70,190,60]:jit([150,255,110],r,16);});
paint(25,(x,y,r)=>{const e=x<2||y<2||x>13||y>13;return e?[190,40,150]:jit([255,96,214],r,16);});
paint(26,(x,y,r)=>jit([236,255,170],r,16));
paint(27,(x,y,r)=>{const edge=((x+(Math.floor(y/5)%2)*3)%5===0)||(y%5===0);if(edge)return[60,66,58];return r()<.3?jit([80,110,62],r,16):jit([110,116,104],r,14);});
// furniture, stalls, parks, police
const BOOKS=[[150,40,36],[40,80,140],[60,120,60],[190,150,50],[110,60,130],[200,190,170]];const bookCol=[];{const r=mulberry(909);for(let x=0;x<T;x++)bookCol[x]=BOOKS[Math.floor(r()*BOOKS.length)];}
paint(29,(x,y,r)=>{if(x===0||x===15||y===0||y===7||y===8||y===15)return jit([92,64,38],r,8);return jit(bookCol[(x+(y>7?5:0))%16],r,14);});
paint(30,(x,y,r)=>{if(y<4)return jit([236,232,224],r,8);if(y===4)return[150,40,40];return jit(x%5===0?[160,40,40]:[186,52,48],r,10);});
paint(31,(x,y,r)=>{if(y===7||x===7||y===15)return[34,64,44];return jit([52,96,64],r,12);});
paint(32,(x,y,r)=>{if(x<2||x>13||y<2||y>11)return y>13&&x>5&&x<10?[40,42,46]:[28,30,34];return (y%3===0)?[70,200,180]:jit([110,240,210],r,18);});
paint(33,(x,y,r)=>{if(x===0||x===15||y===0||y===15||x===y||x===15-y)return jit([88,62,34],r,8);return jit([168,128,72],r,16);});
paint(34,(x,y,r)=>(x%8<4)?jit([206,52,44],r,10):jit([238,232,220],r,6));
paint(35,(x,y,r)=>(x%8<4)?jit([64,150,58],r,10):jit([238,232,220],r,6));
paint(36,(x,y,r)=>{const v=r();if(v<.12)return[214,52,52];if(v<.2)return[244,208,64];if(v<.25)return[170,90,200];return jit([72,130,48],r,22);});
paint(37,(x,y,r)=>(x===0||y===0)?[24,36,70]:jit([36,56,104],r,8));
paint(38,(x,y,r)=>{const e=x<2||y<2||x>13||y>13;return e?[40,90,200]:jit([110,180,255],r,14);});
paint(39,(x,y,r)=>{const e=x<2||y<2||x>13||y>13;return e?[190,30,30]:jit([255,90,80],r,14);});
paint(40,(x,y,r)=>{const v=r();return v<.2?[120,112,96]:v>.85?[180,172,150]:jit([152,142,122],r,16);});
paint(41,(x,y,r)=>((x>>2)+(y>>2))%2?jit([214,208,196],r,8):jit([58,104,110],r,8));
paint(42,(x,y,r)=>{if(y===6||x===0||x===15)return[170,172,170];if(x===12&&((y>=2&&y<=4)||(y>=9&&y<=13)))return[120,124,128];return jit([230,232,228],r,6);});
paint(47,(x,y,r)=>(x===0||y===0)?[196,200,204]:jit([232,234,236],r,6));
paint(48,(x,y,r)=>{const c=(x>=6&&x<=9&&y>=2&&y<=13)||(y>=6&&y<=9&&x>=2&&x<=13);return c?jit([228,40,44],r,10):jit([240,242,244],r,4);});
// gas pump: red cabinet, a lit price display near the top, a black hose hanging off one side
paint(49,(x,y,r)=>{if(x===0||x===15)return[60,20,20];if(y>=2&&y<=5&&x>=3&&x<=12)return y===2||y===5||x===3||x===12?[30,30,30]:jit([120,240,170],r,20);if(x>=12&&y>=7&&y<=13)return x===13?[20,20,20]:jit([200,40,36],r,10);if(y>=9&&y<=11&&x>=4&&x<=8)return[230,226,210];return jit([204,44,40],r,10);});
paint(50,(x,y,r)=>{const row=Math.floor(y/4),off=row%2?3:0;if(y%4===3)return jit([70,34,28],r,6);if((x+off)%6===0)return jit([92,44,36],r,6);return jit([142,62,48],r,14);});
paint(51,(x,y,r)=>y%4===3?jit([150,170,186],r,6):jit([196,214,226],r,8));
paint(52,(x,y,r)=>y%4===3?jit([190,170,110],r,6):jit([236,220,156],r,8));
paint(53,(x,y,r)=>y>=10?jit([40,70,150],r,8):y===9?[22,40,90]:jit([58,98,196],r,10));
paint(54,(x,y,r)=>y>=10?jit([150,34,34],r,8):y===9?[90,20,20]:jit([200,52,48],r,10));
paint(55,(x,y,r)=>{const v=r();return v<.1?[52,108,30]:jit([66,132,40],r,14);});
paint(56,(x,y,r)=>jit([236,240,232],r,6));
paint(57,(x,y,r)=>x<=1?jit([226,226,220],r,8):asph(x,y,r));
paint(58,(x,y,r)=>y<=1?jit([226,226,220],r,8):asph(x,y,r));
paint(59,(x,y,r)=>{const band=(y+(x>>2))%6===0;const v=r();return band?jit([142,80,52],r,8):v<.08?[188,124,86]:jit([170,98,64],r,12);});
paint(60,(x,y,r)=>{if(y%4===0&&r()<.8)return jit([40,40,48],r,6);const v=r();return v<.1?[48,48,58]:v>.94?[92,92,104]:jit([66,66,76],r,10);});
paint(61,(x,y,r)=>{const v=r();return v<.3?jit([22,22,24],r,8):v<.55?jit([70,70,72],r,10):jit([44,44,46],r,10);});
const coalPx=[[3,3],[4,3],[3,4],[10,5],[11,5],[11,6],[6,10],[7,10],[6,11],[12,12],[13,12]];
paint(62,(x,y,r)=>coalPx.some(([a,b])=>a===x&&b===y)?jit([26,26,28],r,8):(r()<.1?[98,98,102]:jit([125,125,128],r,16)));
const gemPx=[[4,4],[5,4],[4,5],[5,5],[11,3],[11,4],[9,10],[10,10],[10,11],[3,12]];
paint(63,(x,y,r)=>gemPx.some(([a,b])=>a===x&&b===y)?jit([110,230,255],r,20):jit([66,66,76],r,10));
paint(64,(x,y,r)=>jit(((x>>2)+(y>>2))%2?[30,30,34]:[228,226,218],r,6));
// painted cladding panels in chain-store colours (a faint seam every half block), and stucco
[[0,84,166],[200,34,40],[0,114,76],[238,122,28],[246,198,40],[234,234,228],[26,42,88],[214,192,152],[46,46,50]].forEach((c,i)=>paint(65+i,(x,y,r)=>i===7?jit(r()<.12?[196,174,134]:c,r,10):(y%8===7||x===0)?c.map(v=>v*0.82):jit(c,r,6)));
paint(74,(x,y,r)=>{const e=x<2||y<2||x>13||y>13;return e?[210,170,20]:jit([255,236,110],r,14);});
paint(76,(x,y,r)=>{const crack=(x+y*2)%13===0||(x*3-y)%17===0;return crack?jit([236,244,250],r,6):jit([150,196,222],r,12);});
// plain road paint, for the markings laid over the highways out on the plains (tiles 80, 81)
paint(80,(x,y,r)=>jit([214,182,48],r,8));paint(81,(x,y,r)=>jit([226,226,220],r,6));
// doors: a wooden panel door (and the same with its knob), a glass door in a metal frame (and with its push bar),
// barn doors with the cross-brace
{const wd=(x,y,r)=>{if(x<=1||x>=14)return jit([86,60,34],r,6);if((x===4||x===11)&&y>1&&y<14||(y===2||y===13)&&x>3&&x<12)return jit([118,84,48],r,6);return jit([146,104,60],r,10);};
 paint(77,wd);paint(78,(x,y,r)=>(x>=11&&x<=12&&y>=7&&y<=8)?[214,182,72]:wd(x,y,r));
 const gl=(x,y,r)=>{if(x<=1||x>=14)return jit([70,74,80],r,4);if(x===7||x===8)return jit([96,100,106],r,4);return[190,220,236,0];};
 paint(82,gl);paint(83,(x,y,r)=>(y>=7&&y<=8&&x>1&&x<14)?jit([170,174,178],r,4):gl(x,y,r));
 paint(84,(x,y,r)=>{if(x<=1||x>=14||y<=1||y>=14)return jit([226,222,212],r,6);if(Math.abs(x-y)<=1||Math.abs(x-(15-y))<=1)return jit([232,228,218],r,6);return jit(x%4===0?[120,30,26]:[160,42,36],r,10);});
 // a white picket fence: pickets with pointed tops on two rails (gaps between, see-through)
 paint(85,(x,y,r)=>{const pk=x%4===1||x%4===2;if(pk&&y>=(x%4===1?3:2)&&y<=15)return jit([236,236,230],r,6);if(y===6||y===12)return jit([214,214,206],r,6);return[0,0,0,0];});
 // marble (faint grey veins) and weathered bronze
 paint(87,(x,y,r)=>{const vein=Math.abs(Math.sin(x*0.7+y*0.35)+Math.sin(y*0.5-x*0.2))<0.12;return vein?jit([186,188,190],r,6):jit([234,232,226],r,8);});
 paint(88,(x,y,r)=>{const v=r();return v<.18?jit([92,150,128],r,12):v>.9?jit([150,120,70],r,10):jit([96,118,92],r,14);});
 // a hard court (green-blue) and its white lines; chain-link; a rounded headstone and a stone cross; stained glass
 // (lead lines round bright panes); gold bars
 paint(89,(x,y,r)=>jit([62,118,108],r,8));paint(90,(x,y,r)=>jit([236,238,232],r,4));
 paint(91,(x,y,r)=>{if(x===0||y===0)return jit([120,124,128],r,6);const d=(x+y)%4===0||(x-y+16)%4===0;return d?jit([168,172,176],r,8):[0,0,0,0];});
 paint(92,(x,y,r)=>{const top=y<5?Math.hypot(x-7.5,y-5)<=6.5:true;if(!(x>=1&&x<=14&&top))return[0,0,0,0];if(y>=6&&y<=7&&x>=4&&x<=11||y>=9&&y<=9&&x>=5&&x<=10)return jit([96,98,100],r,6);return jit([146,148,150],r,14);});
 paint(93,(x,y,r)=>(x>=6&&x<=9)||(y>=3&&y<=6&&x>=2&&x<=13)?jit([170,170,166],r,12):[0,0,0,0]);
 paint(94,(x,y,r)=>{if(x%5===0||y%5===0)return[30,24,20];const pal=[[200,40,40],[40,80,200],[230,190,40],[40,150,70],[150,50,170]];return jit(pal[(Math.floor(x/5)*3+Math.floor(y/5)*2)%5],r,20);});
 paint(95,(x,y,r)=>{const e=y%4===0||(x+Math.floor(y/4)*4)%8===0;return e?jit([176,130,20],r,8):jit([250,206,70],r,16);});
 // a board fence: upright planks, close together
 paint(86,(x,y,r)=>{if(x%5===0)return y<1?[0,0,0,0]:jit([104,76,46],r,6);return y===0&&x%5===2?[0,0,0,0]:jit([150,112,70],r,10);});}
paint(75,(x,y,r)=>{const e=x<2||y<2||x>13||y>13;return e?[214,96,10]:jit([255,170,70],r,14);});
const tex=new THREE.CanvasTexture(atlas);
tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;

