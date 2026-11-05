// ---- chain-store signs: a lit panel with the brand's picture, "GOBLIN" and the name, on the building's front ----
// Each sign knows which wall blocks hold it up; once most of them are smashed it falls away in a puff.
function signIcon(x,ic,cx,cy,s,c,a){a=a||'#ffffff';
  x.save();x.translate(cx,cy);x.fillStyle=c;x.strokeStyle=c;x.lineWidth=s*0.16;x.lineCap='round';x.lineJoin='round';
  const T=(t,sz,dx,dy,col)=>{x.fillStyle=col||c;x.font='900 '+Math.round(s*sz)+'px "Arial Black", Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(t,(dx||0)*s,(dy||0)*s);x.fillStyle=c;};
  const E=(px,py,rx,ry,rot,col)=>{x.fillStyle=col||c;x.beginPath();x.ellipse(px*s,py*s,rx*s,ry*s,rot||0,0,Math.PI*2);x.fill();x.fillStyle=c;};
  const W=(pts,w,col)=>{x.strokeStyle=col||c;x.lineWidth=s*w;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0]*s,p[1]*s):x.moveTo(p[0]*s,p[1]*s));x.stroke();x.strokeStyle=c;};
  const G=(pts,col)=>{x.fillStyle=col||c;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0]*s,p[1]*s):x.moveTo(p[0]*s,p[1]*s));x.closePath();x.fill();x.fillStyle=c;};
  const B=(px,py,w,h,col)=>{x.fillStyle=col||c;x.fillRect(px*s,py*s,w*s,h*s);x.fillStyle=c;};
  const O=(px,py,r,w,col,a0,a1)=>{x.strokeStyle=col||c;x.lineWidth=s*w;x.beginPath();x.arc(px*s,py*s,r*s,a0===undefined?0:a0,a1===undefined?Math.PI*2:a1);x.stroke();x.strokeStyle=c;};
  const R=(a,b,w,h)=>x.fillRect(a,b,w,h),C=(a,b,r)=>{x.beginPath();x.arc(a,b,r,0,Math.PI*2);x.fill();},L=pts=>{x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();},F=pts=>{x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();};
  switch(ic){
    case'cart':L([[-s,-s*.7],[-s*.65,-s*.7],[-s*.35,s*.35],[s*.75,s*.35],[s*.95,-s*.4],[-s*.5,-s*.4]]);C(-s*.25,s*.7,s*.17);C(s*.55,s*.7,s*.17);break;
    case'bag':R(-s*.75,-s*.35,s*1.5,s*1.2);x.beginPath();x.arc(0,-s*.35,s*.42,Math.PI,0);x.stroke();break;
    case'basket':F([[-s,-s*.15],[s,-s*.15],[s*.7,s*.85],[-s*.7,s*.85]]);x.beginPath();x.arc(0,-s*.15,s*.62,Math.PI,0);x.stroke();break;
    case'box':F([[-s*.85,-s*.3],[0,-s*.75],[s*.85,-s*.3],[s*.85,s*.6],[0,s*1.0],[-s*.85,s*.6]]);break;
    case'leaf':x.beginPath();x.moveTo(-s*.8,s*.8);x.quadraticCurveTo(-s*.9,-s*.9,s*.9,-s*.9);x.quadraticCurveTo(s*.8,s*.8,-s*.8,s*.8);x.fill();break;
    case'tag':F([[-s*.9,-s*.2],[-s*.2,-s*.9],[s*.9,-s*.9],[s*.9,s*.2],[s*.2,s*.9]]);break;
    case'drop':x.beginPath();x.moveTo(0,-s);x.quadraticCurveTo(s*.85,s*.05,s*.62,s*.5);x.arc(0,s*.35,s*.65,0.2,Math.PI-0.2);x.quadraticCurveTo(-s*.85,s*.05,0,-s);x.fill();break;
    case'pump':R(-s*.7,-s*.9,s*1.0,s*1.8);L([[s*.3,-s*.4],[s*.75,-s*.1],[s*.75,s*.6]]);break;
    case'egg':x.beginPath();x.ellipse(0,0,s*.95,s*.75,0.3,0,Math.PI*2);x.fill();break;
    case'pancakes':for(let i=0;i<3;i++){x.beginPath();x.ellipse(0,s*(.55-i*.42),s*.95,s*.24,0,0,Math.PI*2);x.fill();}R(-s*.2,-s*.95,s*.4,s*.3);break;
    case'waffle':x.lineWidth=s*.12;x.strokeRect(-s*.85,-s*.85,s*1.7,s*1.7);for(let i=-1;i<=1;i+=2){L([[i*s*.3,-s*.85],[i*s*.3,s*.85]]);L([[-s*.85,i*s*.3],[s*.85,i*s*.3]]);}break;
    case'burger':x.beginPath();x.arc(0,-s*.1,s*.9,Math.PI,0);x.fill();R(-s*.95,s*.05,s*1.9,s*.22);R(-s*.9,s*.4,s*1.8,s*.4);break;
    case'pizza':F([[-s*.9,-s*.75],[s*.9,-s*.75],[0,s*.95]]);break;
    case'cup':F([[-s*.7,-s*.6],[s*.7,-s*.6],[s*.5,s*.9],[-s*.5,s*.9]]);R(-s*.85,-s*.85,s*1.7,s*.22);break;
    case'donut':x.lineWidth=s*.55;x.beginPath();x.arc(0,0,s*.62,0,Math.PI*2);x.stroke();break;
    case'cross':R(-s*.3,-s*.9,s*.6,s*1.8);R(-s*.9,-s*.3,s*1.8,s*.6);break;
    case'badge':{x.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?s*.42:s*.95;x.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}x.closePath();x.fill();break;}
    case'flame':x.beginPath();x.moveTo(0,-s);x.quadraticCurveTo(s*.95,s*.1,s*.5,s*.75);x.quadraticCurveTo(0,s*1.05,-s*.5,s*.75);x.quadraticCurveTo(-s*.95,s*.1,0,-s);x.fill();break;
    case'P':x.font='900 '+Math.round(s*2)+'px Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('P',0,s*.08);break;
    case'bank':F([[-s,-s*.35],[0,-s],[s,-s*.35]]);for(let i=-1;i<=1;i++)R(i*s*.6-s*.13,-s*.25,s*.26,s*.9);R(-s,s*.7,s*2,s*.25);break;
    case'globe':x.lineWidth=s*.13;x.beginPath();x.arc(0,0,s*.9,0,Math.PI*2);x.stroke();x.beginPath();x.ellipse(0,0,s*.38,s*.9,0,0,Math.PI*2);x.stroke();L([[-s*.9,0],[s*.9,0]]);break;
    case'phone':R(-s*.5,-s*.95,s*1.0,s*1.9);break;
    case'house':F([[-s,-s*.05],[0,-s],[s,-s*.05]]);R(-s*.7,-s*.1,s*1.4,s*1.0);break;
    case'building':R(-s*.6,-s,s*1.2,s*2);break;
    case'pill':x.lineWidth=s*.7;L([[-s*.5,s*.5],[s*.5,-s*.5]]);break;
    case'gamepad':x.beginPath();x.ellipse(0,0,s,s*.6,0,0,Math.PI*2);x.fill();break;
    case'sandwich':F([[-s,s*.2],[0,-s*.7],[s,s*.2]]);R(-s,s*.3,s*2,s*.35);break;
    case'tv':R(-s,-s*.7,s*2,s*1.3);L([[-s*.4,s*.9],[s*.4,s*.9]]);break;
    case'bolt':F([[s*.2,-s],[-s*.6,s*.15],[0,s*.15],[-s*.2,s],[s*.6,-s*.15],[0,-s*.15]]);break;
    case'dollar':x.font='900 '+Math.round(s*2)+'px Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('$',0,s*.08);break;
    case'shoe':F([[-s,-s*.5],[-s*.3,-s*.5],[-s*.1,0],[s,s*.25],[s,s*.6],[-s,s*.6]]);break;
    case'fork':R(-s*.62,-s*.9,s*.16,s*1.8);for(let i=-1;i<=1;i++)R(-s*.54+i*s*.2-s*.05,-s*.9,s*.1,s*.55);x.beginPath();x.ellipse(s*.5,-s*.35,s*.24,s*.6,0,0,Math.PI*2);x.fill();R(s*.42,-s*.1,s*.16,s*1.0);break;
    case'cake':F([[-s*.9,s*.75],[s*.9,s*.75],[s*.9,-s*.05],[-s*.9,-s*.55]]);R(-s*.1,-s*1.0,s*.2,s*.45);break;
    case'bucket':F([[-s*.75,-s*.3],[s*.75,-s*.3],[s*.55,s*.95],[-s*.55,s*.95]]);for(let i=-2;i<=2;i++){x.lineWidth=s*.1;x.beginPath();x.moveTo(i*s*.25,-s*.3);x.quadraticCurveTo(i*s*.25+s*.25,-s*.75,i*s*.2,-s*1.0);x.stroke();}break;
    case'book':F([[-s,-s*.7],[-s*.06,-s*.5],[-s*.06,s*.85],[-s,s*.65]]);F([[s,-s*.7],[s*.06,-s*.5],[s*.06,s*.85],[s,s*.65]]);break;
    case'tooth':x.beginPath();x.moveTo(-s*.8,-s*.4);x.quadraticCurveTo(-s*.8,-s*.95,-s*.3,-s*.85);x.quadraticCurveTo(0,-s*.7,s*.3,-s*.85);x.quadraticCurveTo(s*.8,-s*.95,s*.8,-s*.4);x.quadraticCurveTo(s*.7,s*.2,s*.45,s*.95);x.quadraticCurveTo(s*.2,s*.95,s*.1,s*.2);x.lineTo(-s*.1,s*.2);x.quadraticCurveTo(-s*.2,s*.95,-s*.45,s*.95);x.quadraticCurveTo(-s*.7,s*.2,-s*.8,-s*.4);x.fill();break;
    case'target':x.lineWidth=s*.16;for(const q of [.9,.55])x.beginPath(),x.arc(0,0,s*q,0,Math.PI*2),x.stroke();C(0,0,s*.2);L([[-s,0],[-s*.35,0]]);L([[s,0],[s*.35,0]]);L([[0,-s],[0,-s*.35]]);L([[0,s],[0,s*.35]]);break;
    case'mug':R(-s*.7,-s*.55,s*1.05,s*1.45);x.lineWidth=s*.2;x.beginPath();x.arc(s*.38,s*.15,s*.38,-Math.PI/2,Math.PI/2);x.stroke();x.beginPath();x.ellipse(-s*.17,-s*.6,s*.65,s*.28,0,0,Math.PI*2);x.fill();break;
    case'bowl':x.beginPath();x.moveTo(-s,-s*.1);x.lineTo(s,-s*.1);x.quadraticCurveTo(s*.95,s*.85,0,s*.85);x.quadraticCurveTo(-s*.95,s*.85,-s,-s*.1);x.fill();x.lineWidth=s*.12;for(const q of [-.35,0,.35]){x.beginPath();x.moveTo(q*s,-s*.3);x.quadraticCurveTo(q*s+s*.2,-s*.6,q*s,-s*.95);x.stroke();}break;
    case'bone':x.lineWidth=s*.34;L([[-s*.55,s*.55],[s*.55,-s*.55]]);C(-s*.75,s*.45,s*.22);C(-s*.45,s*.75,s*.22);C(s*.75,-s*.45,s*.22);C(s*.45,-s*.75,s*.22);break;
    case'fish':x.beginPath();x.ellipse(-s*.15,0,s*.7,s*.42,0,0,Math.PI*2);x.fill();F([[s*.45,0],[s,-s*.45],[s,s*.45]]);x.save();x.globalCompositeOperation='destination-out';C(-s*.5,-s*.08,s*.1);x.restore();break;
    case'car':F([[-s,s*.35],[-s*.95,-s*.05],[-s*.55,-s*.15],[-s*.3,-s*.6],[s*.4,-s*.6],[s*.65,-s*.15],[s,-s*.05],[s,s*.35]]);x.save();x.globalCompositeOperation='destination-out';C(-s*.5,s*.4,s*.26);C(s*.5,s*.4,s*.26);x.restore();C(-s*.5,s*.4,s*.17);C(s*.5,s*.4,s*.17);break;
    case'mask':x.beginPath();x.moveTo(-s*.85,-s*.75);x.quadraticCurveTo(0,-s*.95,s*.85,-s*.75);x.quadraticCurveTo(s*.9,s*.5,0,s*.95);x.quadraticCurveTo(-s*.9,s*.5,-s*.85,-s*.75);x.fill();x.save();x.globalCompositeOperation='destination-out';x.beginPath();x.ellipse(-s*.35,-s*.25,s*.2,s*.12,-0.3,0,Math.PI*2);x.fill();x.beginPath();x.ellipse(s*.35,-s*.25,s*.2,s*.12,0.3,0,Math.PI*2);x.fill();x.lineWidth=s*.12;x.beginPath();x.arc(0,s*.15,s*.35,0.3,Math.PI-0.3);x.stroke();x.restore();break;
    case'chart':x.lineWidth=s*.18;L([[-s,s*.7],[-s*.4,0],[0,s*.3],[s*.8,-s*.7]]);F([[s*.95,-s*.95],[s*.95,-s*.3],[s*.35,-s*.85]]);L([[-s,-s],[-s,s],[s,s]]);break;
    case'film':R(-s,-s*.65,s*2,s*1.3);x.fillStyle=x.strokeStyle;x.save();x.globalCompositeOperation='destination-out';for(let i=0;i<5;i++){R(-s*.85+i*s*.4,-s*.55,s*.2,s*.18);R(-s*.85+i*s*.4,s*.37,s*.2,s*.18);}x.restore();break;
    case'mic':x.beginPath();x.ellipse(0,-s*.35,s*.38,s*.55,0,0,Math.PI*2);x.fill();x.lineWidth=s*.14;x.beginPath();x.arc(0,-s*.2,s*.62,0.1,Math.PI-0.1);x.stroke();R(-s*.07,s*.42,s*.14,s*.4);R(-s*.4,s*.8,s*.8,s*.14);break;
    case'skull':x.beginPath();x.arc(0,-s*.2,s*.75,Math.PI*0.9,Math.PI*2.1);x.lineTo(s*.45,s*.75);x.lineTo(-s*.45,s*.75);x.closePath();x.fill();x.save();x.globalCompositeOperation='destination-out';C(-s*.3,-s*.15,s*.2);C(s*.3,-s*.15,s*.2);R(-s*.06,s*.15,s*.12,s*.22);x.restore();break;
    // parody logos: the goblin versions (a spark made of claws, a bloodshot bullseye, drooping arches, a chipped shell...)
    case'spark':x.lineWidth=s*.24;x.lineCap='round';for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6,w=i%2?0.08:-0.08;L([[Math.cos(a)*s*.32,Math.sin(a)*s*.32],[Math.cos(a+w)*s,Math.sin(a+w)*s]]);}break;
    case'eyeball':x.lineWidth=s*.24;x.beginPath();x.arc(0,0,s*.82,0,Math.PI*2);x.stroke();C(0,0,s*.36);x.save();x.lineWidth=s*.07;for(const a of [0.5,2.2,3.9,5.3]){L([[Math.cos(a)*s*.48,Math.sin(a)*s*.48],[Math.cos(a+.25)*s*.68,Math.sin(a+.25)*s*.68]]);}x.restore();break;
    case'arches':x.lineWidth=s*.32;x.beginPath();x.moveTo(-s*.95,s*.95);x.quadraticCurveTo(-s*.75,-s*1.25,-s*.28,-s*.4);x.quadraticCurveTo(-s*.08,s*.1,0,s*.35);x.quadraticCurveTo(s*.08,s*.1,s*.28,-s*.4);x.quadraticCurveTo(s*.75,-s*1.25,s*.95,s*.95);x.stroke();C(-s*.95,s*1.0,s*.17);C(0,s*.5,s*.14);break;
    // ---- the parody logos, a goblin take on each. s is about 0.6 of the disc's radius, so they can reach to about 1.5 ----
    case'scallop':for(let i=-3;i<=3;i++){const t=i*0.3;W([[0,1],[Math.sin(t)*1.28,-Math.cos(t)*1.28+.25]],.3);}G([[-.55,.65],[.55,.65],[.35,1.05],[-.35,1.05]]);B(.1,-1.05,.28,.5,a);break;
    case'siren':O(0,0,1.25,.3);G([[-.5,-.45],[-.5,-.95],[-.25,-.7],[0,-1],[.25,-.7],[.5,-.95],[.5,-.45]]);E(0,-.05,.5,.5);G([[-.45,-.15],[-1,-.45],[-.5,.15]]);G([[.45,-.15],[1,-.45],[.5,.15]]);E(-.2,-.1,.1,.1,0,a);E(.2,-.1,.1,.1,0,a);W([[-.45,.45],[-.8,.75],[-.5,.95]],.2);W([[.45,.45],[.8,.75],[.5,.95]],.2);G([[-.15,.2],[-.05,.38],[.05,.2]],a);break;
    case'wormapple':E(-.38,.15,.68,.82);E(.38,.15,.68,.82);W([[0,-.6],[.2,-1.15]],.18);E(.72,-.25,.42,.42,0,a);W([[.45,-.55],[.65,-.75],[.9,-.6],[1.1,-.8]],.2,'#6fbf3a');E(1.14,-.86,.13,.13,0,'#6fbf3a');break;
    case'crown':G([[-1.05,.7],[-1.15,-.55],[-.55,.05],[0,-.95],[.55,.05],[1.15,-.55],[1.05,.7]]);E(-.45,.35,.13,.13,0,a);E(0,.3,.15,.15,0,a);E(.45,.35,.13,.13,0,a);break;
    case'bigk':T('K',2.5,-.3,-.1);T('mart',.56,.42,.72);break;
    case'kr':T('Kr',2,0,.05);break;
    case'crates':for(const [u,v] of [[-.95,.15],[0,.15],[.05,-.75]]){B(u,v,.85,.8);B(u+.1,v+.33,.65,.12,a);}B(-.95,1,1.9,.15);break;
    case'aldi':G([[-1,1],[-.15,-1.1],[.15,-1.1],[1,1]]);for(const t of [-.55,0,.55])W([[t-.42,.75],[t+.3,-.75]],.1,a);break;
    case'pig':E(0,.1,1.05,.95);G([[-.9,-.3],[-1.1,-1.05],[-.35,-.7]]);G([[.9,-.3],[1.1,-1.05],[.35,-.7]]);E(0,.35,.55,.38,0,a);E(-.2,.35,.11,.17);E(.2,.35,.11,.17);E(-.42,-.25,.12,.12,0,a);E(.42,-.25,.12,.12,0,a);break;
    case'diamond':G([[0,-1.2],[1.2,0],[0,1.2],[-1.2,0]]);W([[-.5,.05],[-.05,.5],[.55,-.4]],.26,a);break;
    case'depot':x.save();x.rotate(-.22);B(-1.05,-1.05,2.1,2.1);T('GOB',.82,0,-.35,a);T('DEPOT',.56,0,.42,a);x.restore();break;
    case'gable':G([[-1.3,-.1],[0,-1.05],[1.3,-.1],[1,-.1],[0,-.72],[-1,-.1]]);T('LOW',.95,0,.45);break;
    case'esS':T('S',2.8,0,.05);break;
    case'pp':T('P',2.7,0,.05);break;
    case'bbtag':x.save();x.rotate(-.18);G([[-1.25,-.65],[.75,-.65],[1.3,0],[.75,.65],[-1.25,.65]]);E(.82,0,.13,.13,0,a);T('BITE',.72,-.28,.04,a);x.restore();break;
    case'heart':x.beginPath();x.moveTo(0,1.1*s);x.bezierCurveTo(-1.6*s,-.1*s,-1*s,-1.2*s,0,-.45*s);x.bezierCurveTo(1*s,-1.2*s,1.6*s,-.1*s,0,1.1*s);x.fill();T('RX',.62,0,-.08,a);break;
    case'bigw':x.save();x.transform(1,0,-.22,1,0,0);T('W',2.3,.05,.05);x.restore();break;
    case'dg':T('DG',1.7,0,.05);break;
    case'rite':T('RA',1.65,0,.05);break;
    case'xx':T('XX',1.9,0,.05);break;
    case'chev':W([[-1.1,-.7],[0,-.05],[1.1,-.7]],.42);W([[-1.1,.05],[0,.7],[1.1,.05]],.42,'#0054a4');break;
    case'helios':for(let i=0;i<10;i++){const t=i*Math.PI/5;E(Math.cos(t)*.85,Math.sin(t)*.85,.42,.2,t);}E(0,0,.42,.42,0,'#ffffff');break;
    case'seven':T('7',3,0,.05,'#f47a20');B(-1.1,-.28,2.2,.22,c);break;
    case'texstar':O(0,0,1.2,.22);x.beginPath();for(let i=0;i<10;i++){const t=-Math.PI/2+i*Math.PI/5,r=(i%2?.42:1.05)*s;x.lineTo(Math.cos(t)*r,Math.sin(t)*r);}x.closePath();x.fill();T('T',.85,0,.03,a);break;
    case'mo':T('Mo',1.9,0,.05);G([[-1.25,-1.05],[-.35,-.7],[-.95,-.7]],'#0a3a8a');break;
    case'beaver':E(-.75,-.8,.32,.32);E(.75,-.8,.32,.32);E(0,0,1.05,1);E(-.38,-.25,.26,.3,0,a);E(.38,-.25,.26,.3,0,a);E(-.34,-.2,.12,.14);E(.34,-.2,.12,.14);E(0,.2,.3,.2,0,a);B(-.28,.42,.26,.5,a);B(.02,.42,.26,.5,a);break;
    case'goose':W([[-.55,.55],[.1,.5],[.4,-.2],[.2,-.8],[.55,-1.05]],.34);E(-.3,.55,.85,.48);G([[.55,-1.2],[1.15,-.98],[.6,-.85]]);G([[-1.1,.45],[-1.45,.15],[-.8,.2]]);break;
    case'bk':G([[-.65,-.65],[-.75,-1.3],[-.3,-.95],[0,-1.35],[.3,-.95],[.75,-1.3],[.65,-.65]]);x.beginPath();x.arc(0,-.05*s,.95*s,Math.PI,0);x.fill();B(-1,.08,2,.22);B(-.95,.42,1.9,.42);break;
    case'hat':E(0,.42,1.35,.34);G([[-.72,.35],[-.58,-.72],[-.15,-.5],[.15,-.5],[.58,-.72],[.72,.35]]);B(-.72,.08,1.44,.14,a);break;
    case'wendy':E(-1.05,-.2,.32,.32);E(1.05,-.2,.32,.32);x.beginPath();x.arc(0,-.05*s,.95*s,Math.PI,0);x.fill();E(0,.25,.82,.78,0,'#7bc043');E(-.3,.1,.1,.12,0,'#222');E(.3,.1,.1,.12,0,'#222');W([[-.32,.5],[0,.68],[.32,.5]],.1,'#222');G([[-.82,.05],[-1.3,-.65],[-.68,-.3]],'#7bc043');G([[.82,.05],[1.3,-.65],[.68,-.3]],'#7bc043');break;
    case'colonel':E(0,-.1,.85,.92,0,'#7bc043');x.beginPath();x.arc(0,-.3*s,.86*s,Math.PI,0);x.fill();O(-.34,-.1,.25,.1,'#111');O(.34,-.1,.25,.1,'#111');E(-.34,-.1,.08,.08,0,'#111');E(.34,-.1,.08,.08,0,'#111');G([[-.28,.32],[.28,.32],[0,1]],'#ffffff');G([[-.5,.92],[0,.72],[.5,.92],[.5,1.2],[0,1],[-.5,1.2]]);break;
    case'bell':x.beginPath();x.moveTo(-1.05*s,.65*s);x.quadraticCurveTo(-.6*s,.3*s,-.55*s,-.3*s);x.quadraticCurveTo(-.5*s,-1.05*s,0,-1.05*s);x.quadraticCurveTo(.5*s,-1.05*s,.55*s,-.3*s);x.quadraticCurveTo(.6*s,.3*s,1.05*s,.65*s);x.closePath();x.fill();E(0,.88,.24,.24);break;
    case'cfa':O(.05,.1,.82,.46,c,.75,5.55);E(.45,-.98,.17,.17);E(.75,-.9,.17,.17);E(.98,-.68,.17,.17);break;
    case'whitecastle':B(-.95,-.55,1.9,1.5);for(const t of [-.95,-.42,.11,.64])B(t,-.95,.31,.42);B(-.22,.35,.44,.6,a);B(-.62,-.2,.26,.3,a);B(.36,-.2,.26,.3,a);break;
    case'dq':E(0,0,1.3,.82);T('GQ',1.05,0,.03,'#ffffff');break;
    case'appl':E(-.38,.2,.62,.78);E(.38,.2,.62,.78);W([[0,-.5],[.1,-1]],.16,'#5a3a1c');E(.45,-.85,.4,.17,-.4,'#3f9a3a');break;
    case'chili':x.beginPath();x.moveTo(-1,1*s);x.quadraticCurveTo(.35*s,.75*s,.5*s,-.45*s);x.quadraticCurveTo(1.15*s,-.3*s,1*s,.25*s);x.quadraticCurveTo(.65*s,1.4*s,-1*s,1*s);x.fill();W([[.75,-.4],[.65,-.8],[.95,-1.05]],.2,'#3f9a3a');break;
    case'barrel':E(0,0,.92,1.15);B(-.95,-.5,1.9,.14,a);B(-.95,.36,1.9,.14,a);E(0,-.98,.62,.17,0,a);break;
    case'olive':W([[-1.1,.9],[-.2,.1],[.9,-.9]],.12);for(const [u,v,t] of [[-.7,.1,-.5],[-.1,-.5,-.5],[.5,-.95,-.5],[-.3,.75,.3],[.35,.2,.3],[.95,-.3,.3]])E(u,v,.38,.17,t);E(.1,.85,.28,.34,0,'#3a4a1e');E(.1,.72,.09,.09,0,'#c8102e');break;
    case'horns':E(0,.2,.5,.85);G([[-.45,-.3],[-1.45,-.45],[-1.3,-1.2],[-1,-.72],[-.35,-.72]]);G([[.45,-.3],[1.45,-.45],[1.3,-1.2],[1,-.72],[.35,-.72]]);E(-.2,.05,.12,.12,0,a);E(.2,.05,.12,.12,0,a);E(-.15,.75,.08,.08,0,a);E(.15,.75,.08,.08,0,a);break;
    case'claw':E(0,.75,.42,.5);G([[-.32,.5],[-1.05,-.55],[-.25,-1.2],[-.08,-.3],[-.5,-.5]]);G([[.32,.5],[1.05,-.55],[.25,-1.2],[.08,-.3],[.5,-.5]]);for(const v of [.55,.85])B(-.42,v,.84,.08,a);break;
    case'owl':G([[-1.1,-.75],[-.45,-1],[0,-.72],[.45,-1],[1.1,-.75],[1.05,.65],[0,1.15],[-1.05,.65]]);E(-.45,-.15,.42,.42,0,a);E(.45,-.15,.42,.42,0,a);E(-.45,-.15,.2,.2);E(.45,-.15,.2,.2);G([[-.16,.2],[.16,.2],[0,.55]],a);break;
    case'boomer':x.beginPath();x.moveTo(-1.2*s,.75*s);x.quadraticCurveTo(-.3*s,-.85*s,1.2*s,-.75*s);x.quadraticCurveTo(.25*s,-.2*s,.65*s,1*s);x.quadraticCurveTo(-.3*s,-.1*s,-1.2*s,.75*s);x.fill();break;
    case'wing':x.beginPath();x.moveTo(-1.1*s,.55*s);x.quadraticCurveTo(-.2*s,-1.25*s,1.2*s,-.85*s);x.lineTo(.8*s,-.35*s);x.lineTo(1.05*s,-.25*s);x.lineTo(.55*s,.15*s);x.lineTo(.75*s,.3*s);x.lineTo(.1*s,.65*s);x.quadraticCurveTo(-.5*s,.95*s,-1.1*s,.55*s);x.fill();break;
    case'hut':G([[-1.3,.5],[-.72,-.72],[.72,-.72],[1.3,.5]]);B(-.72,-.98,.32,.4);G([[-1.3,.5],[1.3,.5],[1.05,.85],[-1.05,.85]],a);break;
    case'domino':x.save();x.rotate(.6);B(-.68,-1.25,1.36,2.5);B(-.68,-.06,1.36,.12,a);for(const [u,v] of [[-.32,-.92],[0,-.62],[.32,-.32],[-.32,.38],[.32,.38],[-.32,.9],[.32,.9]])E(u,v,.15,.15,0,a);x.restore();break;
    case'pj':T('PJ',1.8,0,.05);break;
    case'laurel':for(const m of [-1,1])for(let i=0;i<6;i++){const t=1.2+i*.42;E(m*Math.sin(t)*1.05,-Math.cos(t)*1.05-.05,.34,.15,m*(t+Math.PI/2)*-1);}T('GOB',.62,0,-.05);break;
    case'mouse':E(-.82,-.68,.55,.55);E(.82,-.68,.55,.55);E(0,.1,.95,.95);E(-.34,-.15,.17,.2,0,a);E(.34,-.15,.17,.2,0,a);E(0,.5,.5,.28,0,a);B(-.2,.5,.18,.3);B(.04,.5,.18,.3);break;
    case'dd':T("DD",1.9,0,.05);G([[.55,.72],[1.15,.72],[1,1.1],[.7,1.1]],'#ff671f');break;
    case'loaf':x.beginPath();x.arc(0,-.05*s,1.05*s,Math.PI,0);x.fill();B(-1.05,-.05,2.1,.65);for(const t of [-.5,0,.5])W([[t-.12,-.65],[t+.12,-.1]],.13,a);break;
    case'boaflag':for(const v of [-.6,0,.6]){x.strokeStyle=v?c:'#e31837';x.lineWidth=s*.34;x.beginPath();x.moveTo(-1.2*s,(v+.3)*s);x.quadraticCurveTo(-.3*s,(v-.4)*s,.3*s,(v+.05)*s);x.quadraticCurveTo(.8*s,(v+.35)*s,1.2*s,(v-.2)*s);x.stroke();}break;
    case'octa':{const F2=[];for(let i=0;i<8;i++){const t=Math.PI/8+i*Math.PI/4;F2.push([Math.cos(t)*1.3,Math.sin(t)*1.3]);}G(F2);B(-.48,-.48,.96,.96,a);break;}
    case'coach':B(-1,-.6,1.45,.85);G([[.45,-.6],[1.05,-.6],[.45,.25]]);B(-1.2,.2,2.2,.15);B(-.7,-.42,.42,.36,a);E(-.65,.72,.38,.38);E(.55,.72,.38,.38);E(-.65,.72,.13,.13,0,a);E(.55,.72,.13,.13,0,a);break;
    case'smile':T('a',2.5,0,-.3);x.strokeStyle=c;x.lineWidth=s*.24;x.beginPath();x.moveTo(-1.05*s,.75*s);x.quadraticCurveTo(0,1.45*s,1.05*s,.7*s);x.stroke();G([[-.42,1],[-.15,1.08],[-.3,.72]]);G([[.5,.98],[.25,1.08],[.38,.72]]);G([[1.25,.5],[1.2,1],[.8,.82]]);break;
    case'googleg':O(0,0,.95,.5,'#ea4335',3.6,5.5);O(0,0,.95,.5,'#fbbc05',2.6,3.7);O(0,0,.95,.5,'#34a853',.85,2.7);O(0,0,.95,.5,'#4285f4',-.2,.9);B(0,-.2,1.2,.4,'#4285f4');W([[-.55,.9],[-.55,1.35]],.16,'#34a853');break;
    case'ms4':B(-1.05,-1.05,1,1,'#f25022');B(.08,-1.05,1,1,'#7fba00');B(-1.05,.08,1,1,'#00a4ef');x.save();x.translate(.58*s,.58*s);x.rotate(.35);B(-.5,-.5,1,1,'#ffb900');x.restore();break;
    case'attglobe':E(0,0,1.25,1.25);for(const v of [-.65,-.2,.25,.7]){x.strokeStyle=a;x.lineWidth=s*(.1+(v+1)*.1);x.beginPath();x.moveTo(-1.3*s,(v+.35)*s);x.quadraticCurveTo(0,(v-.45)*s,1.3*s,(v+.1)*s);x.stroke();}break;
    case'vcheck':W([[-1,-.05],[-.3,.85],[1.15,-1.05]],.5,'#ee0000');break;
    case'rings3':O(0,-.45,.6,.26);O(-.55,.42,.6,.26);O(.55,.42,.6,.26);break;
    case'toy':x.save();x.lineWidth=s*.2;x.strokeStyle=c;for(const [rx,ry] of [[1.3,.85],[.42,.85],[.85,.36]]){x.beginPath();x.ellipse(0,rx===.85?-.28*s:0,rx*s,ry*s,0,0,Math.PI*2);x.stroke();}x.restore();break;
    case'fx':T('Gx',1.7,-.05,.0);G([[-.75,.55],[.45,.55],[.45,.3],[1.2,.8],[.45,1.3],[.45,1.05],[-.75,1.05]],'#ff6600');break;
    case'shield':G([[-1.05,-.95],[1.05,-.95],[1.05,.25],[0,1.2],[-1.05,.25]]);T('GOB',.82,0,-.12,a);G([[-1.05,-.95],[0,-1.3],[1.05,-.95]]);break;
    case'teslat':x.beginPath();x.moveTo(-1.25*s,-.95*s);x.quadraticCurveTo(0,-1.3*s,1.25*s,-.95*s);x.lineTo(.95*s,-.62*s);x.quadraticCurveTo(0,-.85*s,-.95*s,-.62*s);x.closePath();x.fill();G([[-.5,-.55],[.5,-.55],[.17,-.25],[.17,1.15],[-.17,1.15],[-.17,-.25]]);break;
    case'nflx':B(-.85,-1.15,.5,2.3);B(.35,-1.15,.5,2.3);G([[-.85,-1.15],[-.35,-1.15],[.85,1.15],[.35,1.15]],'#8a0a10');break;
    case'infin':O(-.55,0,.5,.3);O(.55,0,.5,.3);break;
    case'gecko':W([[-1,1],[-.9,.3],[-.2,.1],[.35,-.3]],.34);E(.65,-.55,.55,.4,-.5);E(.82,-.72,.14,.14,0,a);E(.84,-.72,.06,.06);for(const [u,v,p,q] of [[-.4,.2,-.8,-.3],[.05,.05,.5,.55],[-.85,.5,-1.25,.2],[-.55,.2,-.25,.75]])W([[u,v],[p,q]],.14);break;
    case'tshack':O(0,0,1.15,.2);T('R',1.65,0,.05);break;
    case'ref':G([[-1.2,-.6],[-.55,-1],[.55,-1],[1.2,-.6],[.95,-.1],[.6,-.3],[.6,1.05],[-.6,1.05],[-.6,-.3],[-.95,-.1]]);for(const t of [-.34,.04,.42])B(t-.09,-.85,.18,1.9,a);break;
    case'ticket':x.save();x.rotate(-.3);G([[-1.3,-.65],[1.05,-.65],[1.05,-.32],[.82,-.15],[1.05,0],[.82,.18],[1.05,.33],[1.05,.65],[-1.3,.65]]);T('GOB',.72,-.15,.04,a);x.restore();break;
    case'hrb':B(-1.05,-1.05,2.1,2.1);T('H&R',.88,0,.02,a);break;
    case'amc':T('AMC',1.25,0,.05);break;
    case'fountain':for(const r of [.5,.85,1.2]){O(0,.7,r,.14,c,Math.PI,2*Math.PI);}B(-.08,-.5,.16,1.25);B(-1.3,.72,2.6,.24);break;
    case'citi':T('citi',1.35,0,.2);O(0,.25,1.2,.2,'#ffffff',-2.5,-.65);break;
    case'cap1':T('C1',1.5,0,.3);x.strokeStyle='#ffffff';x.lineWidth=s*.24;x.beginPath();x.moveTo(-1.2*s,-.25*s);x.quadraticCurveTo(0,-1.3*s,1.25*s,-.75*s);x.stroke();break;
    case'fordo':E(0,0,1.35,.85);x.font='italic 900 '+Math.round(s*.9)+'px Arial, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle=a;x.fillText('Gob',0,.03*s);break;
    case'max':T('MAX',1.05,0,-.1);G([[-1.05,.42],[.8,.42],[1.2,.75],[.8,1.08],[-1.05,1.08]],'#ffd200');break;
    case'flag6':W([[-.9,-1.25],[-.9,1.2]],.18);G([[-.8,-1.15],[1.2,-.7],[-.8,-.1]]);T('6',1,.3,.45);break;
    case'spires':for(const [u,w,h] of [[-.9,.42,1.05],[-.28,.56,1.75],[.48,.42,1.3]]){B(u,1-h,w,h);G([[u-.08,1-h],[u+w/2,1-h-.5],[u+w+.08,1-h]]);}B(-1.15,.55,2.3,.45);E(0,.8,.24,.28,0,a);break;
    case'ikeaword':E(0,0,1.32,.82);T('FLAT',.72,0,.03,a);break;
    case'tj':T('TJ',1.8,0,.05);break;
    case'bigm':T('M',2.4,0,.05);break;
    case'subs':T('S',2.5,0,.05);G([[-1.3,.15],[-.8,-.15],[-.8,.45]],'#ffc20e');G([[1.3,-.15],[.8,-.45],[.8,.15]],'#ffc20e');break;
    case'bed':B(-1.2,-.75,.24,1.8);B(.96,-.1,.24,1.15);B(-1.2,.25,2.4,.45);E(-.62,.05,.36,.22);break;
    case'pad':x.beginPath();x.moveTo(-1.2*s,.7*s);x.quadraticCurveTo(-1.3*s,-.6*s,-.6*s,-.6*s);x.lineTo(.6*s,-.6*s);x.quadraticCurveTo(1.3*s,-.6*s,1.2*s,.7*s);x.quadraticCurveTo(.8*s,.9*s,.45*s,.25*s);x.lineTo(-.45*s,.25*s);x.quadraticCurveTo(-.8*s,.9*s,-1.2*s,.7*s);x.fill();B(-.75,-.2,.4,.12,a);B(-.61,-.34,.12,.4,a);E(.45,-.25,.1,.1,0,a);E(.72,-.08,.1,.1,0,a);break;
    case'dn':T("D'",2.2,.05,.05);break;
    case'th':T('TH',1.65,0,.05);break;
    case'bottle':R(-s*.15,-s,s*.3,s*.5);F([[-s*.15,-s*.5],[s*.15,-s*.5],[s*.45,-s*.15],[s*.45,s],[-s*.45,s],[-s*.45,-s*.15]]);break;
  }
  x.restore();
}
// ---- billboard ads: made-up goblin businesses and causes (a picture in a disc, a headline, a line underneath) ----
const ADS=[
  {h:'SWAMP FIZZ',t:'The green one. Ice cold.',icon:'bottle',bg:'#1b5e20',fg:'#ffffff',ac:'#c6ff00'},
  {h:'STOMP-PROOF INSURANCE',t:'Hippo damage? We cover it. Mostly.',icon:'house',bg:'#0d47a1',fg:'#ffffff',ac:'#ffca28'},
  {h:'GRUBWORM JERKY',t:'Chewy since forever',icon:'bucket',bg:'#6d4c41',fg:'#fff3e0',ac:'#ffb74d'},
  {h:'RE-ELECT MAYOR SNIVVEL',t:'Fewer hippos. More potholes.',icon:'badge',bg:'#ffffff',fg:'#b71c1c',ac:'#1a237e'},
  {h:"WARTY'S MOTEL",t:'Next exit \u00b7 Clean-ish rooms',icon:'building',bg:'#4a148c',fg:'#ffffff',ac:'#ff80ab'},
  {h:'GRIBBLE & SNARK, LAWYERS',t:'Stomped on? Call 555-GOB',icon:'dollar',bg:'#212121',fg:'#ffd54f',ac:'#ffd54f'},
  {h:'BIG MUD SPA',t:'Hippos welcome!',icon:'drop',bg:'#5d4037',fg:'#ffffff',ac:'#80deea'},
  {h:'KNUCKLE FARM',t:'Pick your own turnips \u00b7 3 mi',icon:'leaf',bg:'#f9a825',fg:'#3e2723',ac:'#33691e'},
  {h:'HAVE YOU SEEN THIS HIPPO?',t:'Report all stomping: 555-0100',icon:'cross',bg:'#ffeb3b',fg:'#111111',ac:'#d50000'},
  {h:'GOB-O-PHONE 9',t:'Now with even more bars',icon:'phone',bg:'#111111',fg:'#ffffff',ac:'#00e5ff'},
  {h:'CAVE BURGER',t:'Open late \u00b7 Exit 12',icon:'burger',bg:'#e65100',fg:'#ffffff',ac:'#ffee58'},
  {h:'SNOTWELL BANK',t:'Your gold is safe with us*',icon:'bank',bg:'#004d40',fg:'#ffffff',ac:'#ffd740'},
  {h:'THE GREAT ROCK',t:"World's 2nd largest rock \u00b7 40 mi",icon:'globe',bg:'#0277bd',fg:'#ffffff',ac:'#ffcc80'},
  {h:'DRIVE SAFE',t:'Goblins brake for hippos',icon:'bolt',bg:'#2e7d32',fg:'#ffffff',ac:'#ffffff'},
  {h:"GOBLIN McDONALD'S",t:"I'm bitin' it",icon:'arches',bg:'#da291c',fg:'#ffc72c',ac:'#ffc72c'},
  {h:'GOBLIN WAL-MART',t:'Save money. Lose teeth.',icon:'spark',bg:'#0b5cad',fg:'#ffffff',ac:'#ffc220'},
  {h:'GOBLIN WAFFLE HOUSE',t:'Open through every hippo',icon:'waffle',bg:'#ffd200',fg:'#111111',ac:'#111111'},
  {h:'GOBLIN GEICO',t:'15 minutes could save you 15 teeth',icon:'skull',bg:'#00447c',fg:'#ffffff',ac:'#ffd200'},
  {h:'GOBLIN NIKE',t:'Just stomp it.',icon:'shoe',bg:'#111111',fg:'#ffffff',ac:'#ff6a00'},
  {h:'GOBLIN COCA-COLA',t:'Open slimyness',icon:'bottle',bg:'#d71920',fg:'#ffffff',ac:'#ffffff'},
  {h:'GOBLIN RED BULL',t:'Gives you warts',icon:'bolt',bg:'#0a2a5a',fg:'#ffd200',ac:'#e31837'},
  {h:'GOBLIN APPLE',t:'Think different. Think worm.',icon:'wormapple',bg:'#111111',fg:'#ffffff',ac:'#b8e08a'},
  {h:'GOBLIN STARBUCKS',t:'Your name, spelled wrong, in mud',icon:'crown',bg:'#00704a',fg:'#ffffff',ac:'#ffffff'}];
const AD_N=ADS.length,adCache=[];
function adMat(i){
  if(adCache[i])return adCache[i];const A=ADS[i%AD_N];
  const cv=document.createElement('canvas'),W=512,Hh=246;cv.width=W;cv.height=Hh;const x=cv.getContext('2d');
  if(x&&x.beginPath&&x.fillText){
    x.fillStyle=A.bg;x.fillRect(0,0,W,Hh);x.fillStyle=A.ac;x.fillRect(0,Hh-16,W,16);
    const r0=Hh*0.3,cx=Hh*0.42,cy=Hh*0.46;x.beginPath();x.arc(cx,cy,r0,0,Math.PI*2);x.fill();signIcon(x,A.icon,cx,cy,r0*0.6,A.bg,A.ac);
    const tx0=cx+r0+18,tw=W-tx0-18,tc=tx0+tw/2;x.textAlign='center';x.textBaseline='middle';
    // the headline: as big as fits, over two lines if it's long
    const words=A.h.split(' ');let lines=[A.h];if(A.h.length>13&&words.length>1){let best=null;for(let k=1;k<words.length;k++){const l1=words.slice(0,k).join(' '),l2=words.slice(k).join(' '),m=Math.max(l1.length,l2.length);if(!best||m<best.m)best={m,l:[l1,l2]};}lines=best.l;}
    let px=lines.length>1?54:72;x.font='900 '+px+'px "Arial Black", Arial, sans-serif';const mw=Math.max(...lines.map(l=>x.measureText(l).width||1));if(mw>tw){px=Math.floor(px*tw/mw);x.font='900 '+px+'px "Arial Black", Arial, sans-serif';}
    x.fillStyle=A.fg;lines.forEach((l,k)=>x.fillText(l,tc,Hh*0.4+(k-(lines.length-1)/2)*px*1.05));
    let tp=26;x.font='bold '+tp+'px Arial, sans-serif';const tm=x.measureText(A.t).width||1;if(tm>tw){tp=Math.floor(tp*tw/tm);x.font='bold '+tp+'px Arial, sans-serif';}
    x.globalAlpha=0.9;x.fillText(A.t,tc,Hh*0.78);x.globalAlpha=1;
  }
  const t=new THREE.CanvasTexture(cv);t.anisotropy=4;return adCache[i]=new THREE.MeshLambertMaterial({map:t});
}
const brandTexCache=new Map();
function brandTex(B,aspect){
  const key=B.n+'|'+B.bg+'|'+aspect;let t=brandTexCache.get(key);if(t)return t;
  const cv=document.createElement('canvas'),W=512,Hh=Math.round(512/aspect);cv.width=W;cv.height=Hh;const x=cv.getContext('2d');
  if(x&&x.beginPath&&x.fillText&&B.only){
    // just the words, painted straight on (a water tower's town name)
    let px=Math.round(Hh*0.78);x.font='900 '+px+'px "Arial Black", Arial, sans-serif';const m=x.measureText(B.n).width||1;if(m>W*0.94){px=Math.floor(px*W*0.94/m);x.font='900 '+px+'px "Arial Black", Arial, sans-serif';}
    x.textAlign='center';x.textBaseline='middle';x.fillStyle=B.fg;x.fillText(B.n,W/2,Hh/2);
  }
  else if(x&&x.beginPath&&x.fillText){
    const rr=aspect<2?0.01:Math.min(W,Hh)*0.14,box=(a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.lineTo(a+w-r,b);x.quadraticCurveTo(a+w,b,a+w,b+r);x.lineTo(a+w,b+h-r);x.quadraticCurveTo(a+w,b+h,a+w-r,b+h);x.lineTo(a+r,b+h);x.quadraticCurveTo(a,b+h,a,b+h-r);x.lineTo(a,b+r);x.quadraticCurveTo(a,b,a+r,b);x.closePath();};
    const lw=Math.min(W,Hh)*0.05;
    // pole boards are square, the rim colour running right to the edge to meet the board's sides
    if(aspect<2){x.fillStyle=B.ac;x.fillRect(0,0,W,Hh);x.fillStyle=B.bg;x.fillRect(lw*1.4,lw*1.4,W-lw*2.8,Hh-lw*2.8);}
    else{box(2,2,W-4,Hh-4,rr);x.fillStyle=B.bg;x.fill();box(lw*1.5,lw*1.5,W-lw*3,Hh-lw*3,rr*0.75);x.strokeStyle=B.ac;x.lineWidth=lw;x.stroke();}
    const fit=(txt,maxW,px,weight)=>{x.font=weight+' '+px+'px "Arial Black", Arial, sans-serif';const m=(x.measureText(txt)||{}).width||1;if(m>maxW){px=Math.floor(px*maxW/m);x.font=weight+' '+px+'px "Arial Black", Arial, sans-serif';}return px;};
    x.textAlign='center';x.textBaseline='middle';
    if(aspect>=2){
      // wide: the picture in a disc on the left, the words to the right of it
      const r0=Hh*0.33,cx=Hh*0.52;x.fillStyle=B.ac;x.beginPath();x.arc(cx,Hh/2,r0,0,Math.PI*2);x.fill();signIcon(x,B.icon,cx,Hh/2,r0*0.6,B.bg,B.ac);
      const tx0=cx+r0+Hh*0.1,tw=W-tx0-Hh*0.16,tc=tx0+tw/2;
      // "GOBLIN" and the name on two lines, both the same size (whichever fits the longer of the two)
      const px=Math.min(fit('GOBLIN',tw,Math.round(Hh*0.34),'900'),fit(B.n,tw,Math.round(Hh*0.34),'900'));x.font='900 '+px+'px "Arial Black", Arial, sans-serif';
      x.fillStyle=B.fg;x.fillText('GOBLIN',tc,Hh*0.5-px*0.56);x.fillText(B.n,tc,Hh*0.5+px*0.56);
    } else {
      // tall (a pole sign): the picture on top, the words underneath
      const r0=Hh*0.18;x.fillStyle=B.ac;x.beginPath();x.arc(W/2,Hh*0.27,r0,0,Math.PI*2);x.fill();signIcon(x,B.icon,W/2,Hh*0.27,r0*0.6,B.bg,B.ac);
      const px=Math.min(fit('GOBLIN',W*0.84,Math.round(Hh*0.19),'900'),fit(B.n,W*0.84,Math.round(Hh*0.19),'900'));x.font='900 '+px+'px "Arial Black", Arial, sans-serif';
      x.fillStyle=B.fg;x.fillText('GOBLIN',W/2,Hh*0.69-px*0.56);x.fillText(B.n,W/2,Hh*0.69+px*0.56);
    }
  }
  t=new THREE.CanvasTexture(cv);t.anisotropy=4;
  const m=new THREE.MeshBasicMaterial({map:t,transparent:true,alphaTest:0.4});t=m;brandTexCache.set(key,m);return m;
}
// where a branded building's signs go: on its front (the side with its doors), given a face, a height and a size.
// Anchors are the wall blocks behind the sign as the city first builds them.
function bFace(b,side,inset){
  const i=inset||0;
  if(side===0)return{ax:'z',f:b.x0+i,w:b.x0+i,a0:b.z0+i,a1:b.z1-i,n:-1};
  if(side===1)return{ax:'z',f:b.x1-i,w:b.x1-1-i,a0:b.z0+i,a1:b.z1-i,n:1};
  if(side===2)return{ax:'x',f:b.z0+i,w:b.z0+i,a0:b.x0+i,a1:b.x1-i,n:-1};
  return{ax:'x',f:b.z1-i,w:b.z1-1-i,a0:b.x0+i,a1:b.x1-i,n:1};
}
function bSpot(b,px,pz,side,inset,yc,h,aspect,out){
  const F=bFace(b,side,inset),span=F.a1-F.a0;let w=Math.min(h*aspect,span-1.2);if(w<2.2)return;h=w/aspect;
  const X0=px*CELL,Z0=pz*CELL,c=(F.a0+F.a1)/2,anc=[];
  for(let yy=Math.floor(yc-h/2+0.15);yy<=Math.floor(yc+h/2-0.15);yy++)for(const k of [-0.42,-0.21,0,0.21,0.42]){
    const a=Math.floor(c+k*w),rx=F.ax==='z'?F.w:a,rz=F.ax==='z'?a:F.w;
    if(blockAt(b,rx,rz,yy,px,pz)!==AIR)anc.push([X0+rx,yy,Z0+rz]);
  }
  if(anc.length<3)return false;
  const sp={y:yc,w,h,anc,B:b.brand,aspect};
  if(F.ax==='z'){sp.x=X0+F.f+F.n*0.06;sp.z=Z0+c;sp.yaw=F.n>0?Math.PI/2:-Math.PI/2;}
  else{sp.z=Z0+F.f+F.n*0.06;sp.x=X0+c;sp.yaw=F.n>0?0:Math.PI;}
  // nothing built right in front of it (a highway deck, a neighbour's wall)?
  let hit=0;for(const k of [-0.45,-0.15,0.15,0.45])for(const dy of [-0.4,0,0.4]){const a=c+k*w,yy=yc+dy*h;
    if(F.ax==='z'?get(X0+F.f+F.n*0.5,yy,Z0+a):get(X0+a,yy,Z0+F.f+F.n*0.5))hit++;}
  if(hit>2)return false;
  out.push(sp);return true;
}
// the front first; failing that (something built right up against it), whichever other side has room
function bSpotAny(b,px,pz,inset,yc,h,out){for(const sd of [b.door,(b.door+2)%4,b.door^1,(b.door+2)%4^1])if(bSpot(b,px,pz,sd,inset,yc,h,4,out))return;}
const SMALL_SHOPS=new Set(['books','dentist','dispo','guns','bar','soup']),B2_SIGNS=new Set(['courthouse','library','radio','news','bank','disco','club','dealer','armory','theater','stocks','nursery','museum','aquarium','school','datacenter','electric','casino','factory','campus','prison','jail','water','power','lab','arena','base','airport','nuclear']);
function brandSpots(b,px,pz){
  if(b._signs)return b._signs;
  const out=[],cat=b.signCat,tierOn=b.tier>0&&(b.x1-b.x0)>=8,ins=tierOn?2:0;
  if(cat==='bigbox')bSpot(b,px,pz,b.door,0,G+7.4,4,4,out);
  else if(cat==='grocery'||cat==='market')bSpot(b,px,pz,b.door,0,G+7,2,4,out);
  else if(cat==='drug')bSpot(b,px,pz,b.door,0,G+7.1,2.4,4,out);   // clear of the awning over the doors
  else if(cat==='kiosk'){
    bSpot(b,px,pz,b.door,0,G+4.3,1.7,4,out);
    // the price pylon by the road, and the canopy's edge over the pumps
    const X0=px*CELL,Z0=pz*CELL,qx=X0+PL0,qz=Z0+PL0+12;
    out.push({pole:true,x:qx+0.5,y:G+11,z:qz+0.5,yaw:0,w:4.2,h:4.2/1.3,anc:[[qx,G+1,qz]],B:b.brand,aspect:1.3});
    const cz=[];for(let z=PL0+2;z<=PL0+8;z+=2)cz.push([X0+PL0+1,G+6,Z0+z]);
    out.push({x:X0+PL0+1-0.06,y:G+6.5,z:Z0+PC+0.5,yaw:-Math.PI/2,w:4,h:1,anc:cz,B:b.brand,aspect:4});
  }
  else if(cat==='diner'||cat==='pizza'||cat==='cafe')bSpot(b,px,pz,b.door,0,G+5.6,2.3,4,out);
  else if(cat==='fastfood'){
    bSpot(b,px,pz,b.door,0,G+6.3,2.5,4,out);
    // the pole sign by the road, two-faced, facing up and down the street
    const X0=px*CELL,Z0=pz*CELL,P=plotInfo(px,pz),qx=X0+P.pole.x,qz=Z0+P.pole.z;
    out.push({pole:true,x:qx+0.5,y:G+11,z:qz+0.5,yaw:Math.PI/2,w:4.4,h:4.4/1.3,anc:[[qx,G+1,qz]],B:b.brand,aspect:1.3});
  }
  else if(cat==='sitdown')bSpot(b,px,pz,b.door,0,G+7.1,2.4,4,out);   // above the awning over the doors
  else if(cat==='shop'||SMALL_SHOPS.has(cat))bSpot(b,px,pz,b.door,0,G+(b.gf||FH)+0.9,2.1,4,out);
  else if(cat==='cinema')bSpot(b,px,pz,b.door,0,G+12.6,3.6,4,out);   // big, high on the facade over the marquee
  else if(cat==='ikea')bSpot(b,px,pz,b.door,0,G+8.6,3.2,4,out);
  else if(cat==='nasa'){bSpot(b,px,pz,1,0,G+44,8,3.2,out);bSpot(b,px,pz,3,0,G+44,8,3.2,out);}   // the agency's name huge on the assembly building
  else if(cat==='zoo')bSpot(b,px,pz,b.door,0,G+4.2,1.3,4,out);
  else if(cat==='studio'||cat==='theme')bSpot(b,px,pz,2,0,G+9.4,1.8,5,out);   // the name across the top of the gate
  else if(B2_SIGNS.has(cat)&&b.porch){const n0=out.length;bSpot(b.porch,px,pz,2,0,b.porch.pTop+.8,1.5,4,out);for(let i=n0;i<out.length;i++)out[i].B=b.brand;}   // (on the beam and pediment: on the wall behind, the pediment hides it)
  else if(B2_SIGNS.has(cat))bSpot(b,px,pz,b.door,0,Math.min(b.top-1.4,G+(b.gf||FH)+1.1),1.5,4,out);
  else if(cat==='wtower'){bSpot(b,px,pz,2,0,G+20.6,1.15,3.2,out);bSpot(b,px,pz,3,0,G+20.6,1.15,3.2,out);}   // the town's name on the tank
  else if(cat==='fire')bSpot(b,px,pz,b.door,0,b.top-2,2,4,out);
  else if(cat==='mall')bSpotAny(b,px,pz,0,b.top-2.5,3.6,out);
  else if(cat==='garage')bSpotAny(b,px,pz,0,b.top-3.5,2.6,out);   // on the solid band between the top two decks
  else bSpotAny(b,px,pz,ins,b.top-2.4,Math.min(3.4,b.top-G>40?3.4:2.6),out);   // offices, hospitals, police: up near the roof
  // (nothing solid enough where its sign should go, like a school's row of windows: up by the roof, on whichever side has room)
  if(!out.length&&b.brand&&b.style==='normal')bSpotAny(b,px,pz,ins,b.top-1.6,1.6,out);
  b._signs=out;return out;
}
const BSIGN_GEO=new THREE.PlaneGeometry(1,1),bsigns=[],bsignUp=new Map();let nBS=0,nBP=0;
const BPOLE={post:new THREE.BoxGeometry(0.22,1,0.22),board:new THREE.BoxGeometry(1,1,0.24),steel:new THREE.MeshLambertMaterial({color:0x5a6066}),edge:new THREE.MeshLambertMaterial({color:0x2c3034}),rims:new Map()},bpoles=[];
function bpoleAt(i){
  if(i>=40)return null;
  if(!bpoles[i]){const g=new THREE.Group(),post=new THREE.Mesh(BPOLE.post,BPOLE.steel),board=new THREE.Mesh(BPOLE.board,[BPOLE.edge,BPOLE.edge,BPOLE.edge,BPOLE.edge,BPOLE.edge,BPOLE.edge]);g.add(post,board);g.visible=false;scene.add(g);bpoles[i]={g,post,board};}
  return bpoles[i];
}
function bsignAt(i){
  if(i>=140)return null;
  if(!bsigns[i]){const m=new THREE.Mesh(BSIGN_GEO,null);m.visible=false;m.matrixAutoUpdate=true;scene.add(m);bsigns[i]=m;}
  return bsigns[i];
}
function refreshBrandSigns(){
  nBS=0;nBP=0;const R=Math.min(viewFar(),200),seen=new Set(),pad=CELL*5;
  for(const p of viewers()){
    
    for(let px=Math.floor((p.pos.x-R-pad)/CELL);px<=Math.floor((p.pos.x+R)/CELL);px++)for(let pz=Math.floor((p.pos.z-R-pad)/CELL);pz<=Math.floor((p.pos.z+R)/CELL);pz++){
      const ck=px*100003+pz;if(seen.has(ck))continue;seen.add(ck);
      if(!tenvShow(px,pz))continue;const P=plotInfo(px,pz);if(!P.b.length)continue;
      for(let bi=0;bi<P.b.length;bi++){const b=P.b[bi];if(!b.brand)continue;
        // (working out where a sign goes looks at its building, which makes its chunks: one a frame until they're there)
        if(!b._signs&&!ST.dressing&&!mayLook(px*CELL+b.x0,pz*CELL+b.z0))continue;
        const sp=brandSpots(b,px,pz);
        for(let si=0;si<sp.length;si++){const S=sp[si],dx=S.x-p.pos.x,dz=S.z-p.pos.z;if(dx*dx+dz*dz>R*R)continue;
          // still held up? (count what's left of the wall behind it, in chunks that are loaded)
          let left=0,known=0;for(const a of S.anc){if(!chunks.has(ckey(Math.floor(a[0]/CS),Math.floor(a[2]/CS))))continue;known++;if(get(a[0],a[1],a[2])!==AIR)left++;}
          const key=seed+':'+px+','+pz+','+bi+','+si,up=known===0||left>=Math.ceil(known*0.55),was=bsignUp.get(key);
          bsignUp.set(key,up);
          if(!up){if(was===true){const c=parseInt(S.B.bg.slice(1),16);puff(S.x,S.y,S.z,10,c,0.7);puff(S.x,S.y,S.z,6,parseInt(S.B.fg.slice(1),16),0.5);clang();}continue;}
          if(S.pole){const q=bpoleAt(nBP++);if(!q)continue;const mt=brandTex(S.B,S.aspect),bot=S.y-S.h/2;
            q.g.position.set(S.x,0,S.z);q.g.rotation.set(0,S.yaw,0);q.post.position.set(0,(G+2+bot+0.3)/2,0);q.post.scale.set(1,bot+0.3-(G+2),1);
            q.board.position.set(0,S.y,0);q.board.scale.set(S.w,S.h,1);q.board.material[4]=mt;q.board.material[5]=mt;
            {let em=BPOLE.rims.get(S.B.ac);if(!em){em=new THREE.MeshBasicMaterial({color:parseInt(S.B.ac.slice(1),16)});BPOLE.rims.set(S.B.ac,em);}for(let k=0;k<4;k++)q.board.material[k]=em;}   // the board's sides in the sign's rim colour
            q.g.visible=true;continue;}
          const m=bsignAt(nBS++);if(!m)continue;
          m.material=brandTex(S.B,S.aspect);m.position.set(S.x,S.y,S.z);m.rotation.set(0,S.yaw,0);m.scale.set(S.w,S.h,1);m.visible=true;
        }}
    }
  }
  for(let i=nBS;i<bsigns.length;i++)bsigns[i].visible=false;
  for(let i=nBP;i<bpoles.length;i++)bpoles[i].g.visible=false;
}
