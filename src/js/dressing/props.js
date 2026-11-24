// ---- props: furniture built from a handful of small boxes instead of whole blocks, in proportion to the goblins (a goblin
// stands about 1.4 blocks tall, so a bed's about 1.7 long and a seat 0.36 up). So far just inside hospitals. They aren't
// part of the voxel world: they're drawn as instanced boxes for whatever's near you, and get knocked flat by anything
// big. Each part: colour, x, y, z (its centre, from the prop's foot) and size. x and z turn with the prop's yaw, and
// its local -z is its back. PT stands for the prop's own tint; PG marks a part that glows. ----
const PROP_MAX=60000,PROP_GLOW_MAX=6000,PT=-1,PG=0x1000000;
const PROP_L=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0xffffff}),PROP_MAX);
const PROP_G=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff}),PROP_GLOW_MAX);
for(const m of [PROP_L,PROP_G]){m.setColorAt(0,new THREE.Color(0xffffff));m.frustumCulled=false;m.count=0;scene.add(m);}
const P_STEEL=0xa9b1b7,P_DARK=0x2a2e33,P_WHITE=0xe9edf0,P_WOOD=0x9c6c3e,P_SCREEN=PG+0x63e6d6;
// (the models are files, src/assets/props/*.json, edited in the editor's Props section: core/assets.js reads them)
const PROPS=assetPropsAll(ASSETS);
// two boxes of one model sharing a face, the same way out (a blanket's end flush with its bunk's, a screen flush with its
// frame), flicker as the graphics card picks one or the other a pixel at a time: the smaller one is brought out by a
// hair there, so it's always the one seen (as it was meant to be). Done once, to every model, as the page loads (and to one
// the editor sends, editor-live.js)
function propUnfight(M){const E=1e-3,H=0.006;
    for(let i=0;i<M.length;i++)for(let j=0;j<M.length;j++){if(i===j)continue;const a=M[i],b=M[j];
      if(a[4]*a[5]*a[6]>b[4]*b[5]*b[6]||a[4]*a[5]*a[6]===b[4]*b[5]*b[6]&&i>j)continue;   // (a is the smaller, or the first of two the same)
      for(let ax=0;ax<3;ax++){const o1=(ax+1)%3,o2=(ax+2)%3,ov=o=>Math.min(a[1+o]+a[4+o]/2,b[1+o]+b[4+o]/2)-Math.max(a[1+o]-a[4+o]/2,b[1+o]-b[4+o]/2)>E;
        if(!ov(o1)||!ov(o2))continue;
        for(const s of [-1,1])if(Math.abs(a[1+ax]+s*a[4+ax]/2-(b[1+ax]+s*b[4+ax]/2))<E){a[4+ax]+=H;a[1+ax]+=s*H/2;}}}
}
for(const k in PROPS)propUnfight(PROPS[k]);
const _PC=new THREE.Color();
// A prop coming into range grows up out of the floor over PROP_GROW seconds rather than just appearing. propBorn holds when
// each one in range first showed; propGrowing the ones still growing, redrawn in place every frame by growProps (each keeps
// where its boxes start in the two batches, _iL and _iG, as drawing it again writes the same number of boxes).
const PROP_GROW=0.3,propBorn=new Map(),propGrowing=[],propNow=()=>performance.now()/1000;
let propTrimT=-1e9;   // (when propBorn was last thinned out)
function propScale(f){
  let b=propBorn.get(f.key);if(b===undefined){b=propNow();
    // (propBorn kept every prop ever seen, for good. Past 60,000 the ones not new in the last half minute are forgotten;
    // those still in sight are asked about again at once, and for a second anything unknown counts as grown already,
    // so none of them grows out of the floor a second time.)
    if(b-propTrimT<1)b-=PROP_GROW;propBorn.set(f.key,b);
    if(propBorn.size>60000){propTrimT=propNow();for(const [k,v] of propBorn)if(v<propTrimT-30)propBorn.delete(k);}}
  const t=(propNow()-b)/PROP_GROW;if(t>=1)return 1;
  if(!f._grow){f._grow=true;propGrowing.push(f);}
  const k=1-(1-Math.max(0,t))**3;return Math.max(0.02,k);   // (eased out; never quite nothing, as a flat box has no sensible normals)
}
function drawProp(f){
  const dn=downFix.get(f.key),fl=falling.get(f.key);let theta=0,ang=0;
  if(dn!==undefined){theta=Math.PI/2*0.97;ang=dn;}else if(fl){const k=Math.min(1,fl.t/0.7);theta=Math.PI/2*0.97*k*k;ang=fl.ang;}
  if(PROP_LT[f.type])blkProp(f,dn===undefined&&!fl);   // (a lamp or screen lights the room round it: render/block-light.js)
  fallMatrix(f.x,f.z,theta,ang,f.y0);f._iL=nPropL;f._iG=nPropG;f._gen=propGen;propSeen.add(f.key);
  const s=propScale(f);
  _C.makeRotationY(f.yaw);if(s<1){_B.makeScale(s,s,s);_C.multiply(_B);}_B.makeTranslation(f.x,f.y0,f.z);_C.premultiply(_B);_C.premultiply(_F);
  for(const q of PROPS[f.type]){
    let c=q[0];if(c===PT)c=f.tint;
    const glow=c>=PG;if(glow&&(nPropG>=PROP_GLOW_MAX))continue;if(!glow&&nPropL>=PROP_MAX)continue;
    _A.makeTranslation(q[1],q[2],q[3]);_B.makeScale(q[4],q[5],q[6]);_A.multiply(_B);_A.premultiply(_C);
    // (a knocked-over machine's screen goes dark)
    if(glow&&(dn!==undefined||fl)){if(nPropL<PROP_MAX){PROP_L.setMatrixAt(nPropL,_A);PROP_L.setColorAt(nPropL++,_PC.setHex(0x20262b));}continue;}
    if(glow){PROP_G.setMatrixAt(nPropG,_A);PROP_G.setColorAt(nPropG++,_PC.setHex(c-PG));}else{PROP_L.setMatrixAt(nPropL,_A);PROP_L.setColorAt(nPropL++,_PC.setHex(c));}
  }
}
let nPropL=0,nPropG=0;const activeProps=[];
// (every frame: the props still growing drawn again over their own boxes, a bit bigger. _gen says a prop was drawn in the
// latest refresh, so its boxes are still where _iL and _iG say.)
let propGen=0;const propSeen=new Set();
function growProps(){
  if(!propGrowing.length)return;const nL=nPropL,nG=nPropG;
  for(let i=propGrowing.length-1;i>=0;i--){const f=propGrowing[i],live=f._gen===propGen;
    if(live){nPropL=f._iL;nPropG=f._iG;drawProp(f);}
    if(!live||propNow()-propBorn.get(f.key)>=PROP_GROW){f._grow=false;propGrowing.splice(i,1);}}
  nPropL=nL;nPropG=nG;fallMatrix(0,0,0,0);fxSent(PROP_L,nPropL);fxSent(PROP_G,nPropG);
}
// the props on one floor of a hospital, laid out in the same frame as its blocks (iu, iv from just inside its walls)
const P_BLANKET=[0x5b8fd0,0x4aa89a,0x8f7fc9,0xd98aa0],P_SEAT=[0x2f6f7a,0x3a7fa0];
function hospProps(b,px,pz,floorNo){
  const c=b._props||(b._props=new Map());let L=c.get(floorNo);if(L)return L;L=[];c.set(floorNo,L);
  const U0=px*CELL+b.x0+1,V0=pz*CELL+b.z0+1,I=b.x1-b.x0-2,J=b.z1-b.z0-2,y0=floorNo===0?G+1:G+b.gf+1+FH*(floorNo-1);
  const r=(u,v,n)=>hash2(Math.floor(u*4)+px*977+n*131+floorNo*7,Math.floor(v*4)+pz*613+n*53);
  const add=(type,u,v,yaw,tint)=>{if(u<.2||v<.2||u>I-.2||v>J-.2)return;if(b.stair){const a=b.stair.ax==='x'?U0+u-px*CELL:V0+v-pz*CELL,c=b.stair.ax==='x'?V0+v-pz*CELL:U0+u-px*CELL;if(a>=b.stair.r0-2.5&&a<b.stair.r0+b.stair.L+2&&c>=b.stair.c0-1.5&&c<b.stair.c1+1.5)return;}L.push({prop:true,type,x:U0+u,z:V0+v,y0,yaw,tint,rad:.5,key:'p'+Math.round((U0+u)*4)+','+Math.round((V0+v)*4)+','+y0+type});};
  const blanket=(u,v)=>P_BLANKET[Math.floor(r(u,v,3)*P_BLANKET.length)];
  const ft=hospFloor(b,floorNo);
  if(ft){
    // rooms either side of a corridor, eight wide: private rooms (a bed, a monitor, a visitor's chair, its own washbasin) or
    // operating theatres (the table under its lamp, the crash cart, the monitor, scrub sinks); trolleys left along the corridor
    const cv=J>>1;
    for(let k=0;8*k+8<=I+1;k++){const x=8*k+4;
      for(const [v,yaw,sx] of [[1.6,0,1],[J-1.6,Math.PI,-1]]){
        if(ft===1){add('bed',x,v-sx*.1,yaw,blanket(x,v));add('vitals',x-1.1,v-sx*.3,yaw);add('drip',x+1,v-sx*.2,yaw);add('chair',x+2.4,v+sx*.6,yaw+Math.PI/2,P_SEAT[0]);add('basin',x-2.8,v-sx*1.2,yaw);add('cabinet',x+2.8,v-sx*1.1,yaw);}
        else{add('optable',x,v+sx*.6,yaw);add('oplamp',x-1.5,v+sx*.6,yaw);add('vitals',x+1.4,v+sx*.2,yaw);add('cart',x+1.5,v+sx*1.4,yaw);add('cabinet',x-2.8,v-sx*1.1,yaw);add('basin',x+2.8,v-sx*1.2,yaw);add('swivel',x-.9,v+sx*1.3,yaw);}
      }
      if(k%2===0)add(ft===1?'wheelchair':'gurney',x+3,cv-.1,Math.PI/2);else if(k%4===1){add('counter',x,cv+.9,Math.PI);add('plant',x+3,cv+1.1,0);}
    }
    return L;
  }
  if(floorNo>0||b.ground==='ward'){
    // the wards: every 8 rows, two facing rows of beds with an aisle between; a nurses' station here and there down the aisle
    for(let k=0;8*k+1<J;k++){const v0=8*k;
      for(let j=0;3*j+2<I;j++){const u=3*j+1.5;
        for(const [v,yaw,sx] of [[v0+1.02,0,1],[v0+6.98,Math.PI,-1]]){
          if(v>J-1)continue;
          if(r(u,v,1)<0.08){if(r(u,v,6)<0.5)add('wheelchair',u,v+sx*.2,yaw+.5);continue;}   // (an empty bay now and then)
          add('bed',u,v,yaw,blanket(u,v));
          if(r(u,v,4)<0.7)add('vitals',u-.82,v-sx*.55,yaw);
          if(r(u,v,5)<0.45)add('drip',u+.82,v-sx*.5,yaw);
          if(r(u,v,7)<0.2)add('chair',u+.95,v+sx*.35,yaw+Math.PI/2*sx,P_SEAT[0]);
          if(j%2===1)add('curtain',u+1.5,v,0);
        }
      }
      for(let n=0;16*n+11<I;n++){const u=16*n+10.5,v=v0+3.6;if(v>J-1)continue;
        add('desk',u-.8,v,0);add('desk',u+.8,v,0);add('swivel',u-.9,v-.75,0);if(r(u,v,8)<0.5)add('swivel',u+.9,v-.75,.6);
        add('counter',u,v+.65,0);}
      for(let n=0;16*n+3<I;n++){const u=16*n+2.5,v=v0+3.5;if(v>J-1)continue;const q=r(u,v,9);
        if(q<0.34)add('cart',u,v,1.2);else if(q<0.67)add('cabinet',u,v,0);else add('gurney',u,v,Math.PI/2);}
    }
    return L;
  }
  // the rooms behind the lobby and the ER
  for(const R of hospRooms(b,I,J)){const x0=R.u0+1,x1=R.u1-1,y0=R.v0+1,y1=R.v1-1,mx=(x0+x1)/2,my=(y0+y1)/2;
    if(R.k==='pharmacy'){for(let u=x0+.5;u<x1;u++){add('shelf3',u,y1-.5,Math.PI,0xd8dce0);add('bar',u,y0+1,0,0x2f8a8a);}add('monitor',mx,y0+1,Math.PI);add('swivel',mx,y0+1.8,Math.PI);}
    else if(R.k==='xray'){add('optable',mx,my,0);add('oplamp',mx-1.4,my,0);add('xray',mx,y1-.1,Math.PI);add('desk',x1-.9,y0+.8,-Math.PI/2);add('swivel',x1-1.7,y0+.8,-Math.PI/2);}
    else if(R.k==='exam'){add('gurney',mx,y1-1.2,0);add('vitals',mx-1,y1-.6,Math.PI);add('cabinet',x1-.5,y1-.6,-Math.PI/2);add('basin',x0+.3,y0+.8,Math.PI/2);add('chair',x1-.6,y0+.7,-Math.PI/2,P_SEAT[0]);add('swivel',mx+.8,y0+1,0);}
    else if(R.k==='lab'){for(let u=x0+.5;u<x1;u++)add('prep',u,y1-.5,Math.PI);add('fridge2',x0+.5,y0+.5,Math.PI/2);add('fridge2',x0+.5,y0+1.5,Math.PI/2);add('desk',mx,my,Math.PI);add('swivel',mx,my+.8,Math.PI);}
    else if(R.k==='gift'){for(let u=x0+.5;u<x1;u++)add('shelf2',u,y1-.5,Math.PI,P_GOODS[Math.floor(u)%P_GOODS.length]);add('bar',x0+1.5,y0+.8,0,0xd96a8a);add('monitor',x0+1.5,y0+.8,Math.PI);add('plant',x1-.5,y0+.5,0);add('plant',x1-.5,my,1);add('toys',mx,my,0,0xd96a8a);}
    else if(R.k==='admissions'){for(let u=x0+1;u<x1-.5;u+=2.4){add('desk',u,y0+1.3,0);add('swivel',u,y0+.5,0);add('chair',u,y0+2.2,Math.PI,P_SEAT[0]);}add('cabinet',x1-.5,y1-.5,-Math.PI/2);}
    else if(R.k==='chapel'){for(let v=y0+.6;v<y1-1;v+=1.4)for(const u of [x0+1.4,x1-1.4])add('bench',u,v,0);add('rtable',mx,y1-.6,0,0x7a2a2a);add('flamp',x0+.5,y1-.5,0);add('flamp',x1-.5,y1-.5,0);}
    else if(R.k==='ct'){add('scanner',mx,my,0);add('desk',x0+1,y0+.7,Math.PI/2);add('swivel',x0+.4,y0+.7,Math.PI/2);add('gurney',x1-.8,y1-1.2,0);add('cabinet',x1-.5,y0+.6,-Math.PI/2);}
    else if(R.k==='supply'){for(let u=x0+.5;u<x1;u++)add('shelf3',u,y1-.5,Math.PI,0xd8dce0);for(let u=x0+.8;u<x1;u+=2)add('cabinet',u,my,0);add('gurney',x1-.8,y0+.8,Math.PI/2);}
    else{add('rtable',mx-1,my,0,P_WHITE);add('chair',mx-1.7,my,Math.PI/2,P_SEAT[0]);add('chair',mx-.3,my,-Math.PI/2,P_SEAT[0]);add('fridge2',x1-.5,y1-.6,-Math.PI/2);add('vending',x1-.5,y0+.7,-Math.PI/2);add('locker',x0+.5,y1-.4,Math.PI);}
  }
  // the ground floor: main reception, the waiting area, and the emergency department if it has one
  const cu=I>>1,E=b.er,front=E&&E.mode==='front';
  const desks=(a0,a1)=>{for(let u=a0;u+2<=a1+1;u+=2)add('counter',u+1,5.5,0);for(let u=a0+1;u+1.5<=a1;u+=3){add('desk',u+.7,6.6,Math.PI);add('swivel',u+.7,7.4,Math.PI);}};
  const d0=Math.max(2,cu-11),d1=cu-2;desks(d0,d1);
  if(!front)desks(cu+2,Math.min(I-3,cu+11));
  add('counter',d0,3.5,Math.PI/2);
  // rows of waiting seats, facing the doors
  const lobR=hospRooms(b,I,J).length>0;
  for(let v=9;v<=(E&&!front?E.v0-3:lobR?14:18);v+=lobR?1.7:3)for(let u=lobR?10:3;u+2<=(front?cu-3:I-3);u+=2.2){if(Math.abs(u-cu)<3)continue;if(r(u,v,10)<.12)continue;add('seats',u,v,Math.PI,P_SEAT[Math.floor(u/8)%2]);}
  add('plant',.8,.8,0);add('plant',I-.8,.8,0);add('vending',1,(E&&!front?E.v0-2:J-2),Math.PI/2);
  // a little cafe and a gift shop down the far side of the lobby, if there's room
  if(J>=24&&!(E&&!front)){for(let u=10.5;u+2<=cu-3;u+=3.2){add('rtable',u,16.2,0,P_WHITE);add('chair',u-.68,16.2,Math.PI/2,0x3f6b8c);add('chair',u+.68,16.2,-Math.PI/2,0x3f6b8c);}
    for(let u=9.5;u<Math.min(cu-3,17);u++)add('bar',u,18.4,Math.PI,0x2f8a8a);add('espresso',12.5,18.4,Math.PI,0,.9);add('monitor',10.5,18.4,Math.PI,0,.9);
    for(let v=9.5;v<19&&front;v+=1.2)add('vending',E.u0-.5,v,-Math.PI/2);add('wheelchair',cu-2.6,3,0);add('wheelchair',cu+2.6,3,0);add('plant',cu-3.4,4.6,1);
    // more seats along the front wall, a row of plants, an information desk in the middle of it all
    for(let u=10;u<cu-3;u+=2.2)add('seats',u,.6,0,P_SEAT[1]);for(let u=10;u<cu-3;u+=4.4){add('plant',u,3.4,u);add('plant',u+2.2,7.6,u+1);}
    for(const u of [cu-4.6,cu-3.4])add('counter',u,8,Math.PI/2);add('monitor',cu-4,8,0,0,.9);add('board',cu-6,.1,0,0x2f8a8a);}
  const vG=E&&!front?E.v0-2:J-2;for(let u=3;u<(front?E.u0:I)-1;u+=5)if(r(u,vG,11)<.6)add('gurney',u+.5,vG+.3,Math.PI/2);else if(r(u,vG,12)<.5)add('wheelchair',u+.5,vG,Math.PI);
  if(E){
    // resuscitation bays by the ambulance doors, a second row of treatment bays facing the first, gurneys ready, seats for those waiting
    if(front){const aL=E.u0+1,aR=I,ec=E.door-b.x0-1;
      for(const sg of [-1,1])for(let i=0;i<2;i++){const u=ec+sg*(6.5+i*3.4);if(u<aL+1||u>aR-1)continue;add('bed',u,2.6,0,P_WHITE);add('vitals',u-1,1.6,0);add('oplamp',u+1,3.2,0);add('cart',u+1.2,1.2,0);}
      for(let u=aL+1.5;u<aR-1;u+=3.4){if(Math.abs(u-ec)<3)continue;add('curtain',u-1.7,E.v1-7.5,0);add('bed',u,E.v1-8.2,0,blanket(u,5));add('vitals',u-.9,E.v1-9,0);if(r(u,5,15)<.6)add('drip',u+.9,E.v1-9,0);}
      for(const u of [ec-2.8,ec+2.8])add('gurney',u,5.4,0);add('wheelchair',ec-4.5,5,.6);add('wheelchair',ec+4.5,5,-.6);
      for(let v=7;v<E.v1-10;v+=2.2)add('seats',aL+.8,v,Math.PI/2,P_SEAT[1]);add('cabinet',aL+.5,E.v1-1.6,Math.PI/2);add('vending',aL+.5,5,Math.PI/2);
      // a line of bays along the outside wall too, with their curtains; kit parked between them; a desk for the paperwork
      for(let v=6.6;v<E.v1-3;v+=3){add('curtain',aR-1.2,v-1.5,Math.PI/2);add('bed',aR-1.1,v,-Math.PI/2,blanket(aR,v));add('vitals',aR-.4,v-.9,-Math.PI/2);add('cabinet',aR-.4,v+1,-Math.PI/2);}
      for(let u=aL+3.2;u<aR-3;u+=6.8){add('cart',u,E.v1-5,.3);add('drip',u+1.4,E.v1-5.2,0);add('gurney',u+3.2,7.4,Math.PI/2);}
      add('desk',aL+2.2,E.v1-4,Math.PI/2);add('swivel',aL+1.4,E.v1-4,Math.PI/2);add('board',aL+.1,E.v1-6,Math.PI/2,P_WHITE);
    }
    // the ER in its own frame: a runs along the wall with its doors, d goes in from it
    const ex0=b.x0,ez0=b.z0,ea=front?E.door-ex0-1:E.door-ez0-1,aLo=front?E.u0+1:E.v0+1,aHi=front?I:J,depth=front?E.v1:I;
    const W=(a,d)=>front?[a,d]:[I-d,a],Y=front?0:-Math.PI/2;   // (from the ER's frame to the hospital's: d's way is +z, or -x)
    const put=(type,a,d,yaw,tint)=>{const [u,v]=W(a,d);add(type,u,v,Y+yaw,tint);};
    // the triage desks either side of the way in
    for(const sg of [-1,1]){put('counter',ea+.5+sg*4.5,4.5,0);put('desk',ea+.5+sg*4.5,5.6,Math.PI);put('swivel',ea+.5+sg*4.5,6.4,Math.PI);}
    // treatment bays along the far wall: a bed, its monitor and drip, a curtain each side
    for(let a=aLo;a+2<aHi;a+=4){put('curtain',a,depth-2,0);const u=a+2.2,dd=depth-1.05;put('bed',u,dd,Math.PI,blanket(u,dd));put('vitals',u-.9,dd+.55,Math.PI);if(r(u,dd,13)<.6)put('drip',u+.9,dd+.5,Math.PI);if(r(u,dd,14)<.3)put('cart',u+1.2,dd-1.3,.4);}
    // the nurses' station, an island in the middle
    {const ma=Math.floor((aLo+aHi)/2)+.5,md=Math.floor((6+depth-4)/2)+.5;if(depth-10>=5){put('counter',ma-1,md-.9,0);put('counter',ma+1,md-.9,0);put('counter',ma-1,md+.9,Math.PI);put('counter',ma+1,md+.9,Math.PI);put('desk',ma-.8,md,0);put('swivel',ma-.8,md+.5,Math.PI);put('desk',ma+.8,md,Math.PI);put('swivel',ma+.8,md-.5,0);}}
    // supply cabinets at the far end, a couple of trolleys waiting
    for(let d=7;d<depth-5;d+=3)put('cabinet',aHi-.5,d,-Math.PI/2);
    put('wheelchair',ea-2,3,.8);put('gurney',ea+3,2,Math.PI/2);
  }
  return L;
}
// the props of any room set out by hand: u and v from just inside its walls (v back from the door), yaw 0 with its back to
// the front wall, PI to the back wall, PI/2 to the left, -PI/2 to the right
function roomKit(b,px,pz,L,y0=G+1){
  const U0=px*CELL+b.x0+1,V0=pz*CELL+b.z0+1;
  return{I:b.x1-b.x0-2,J:b.z1-b.z0-2,add:(type,u,v,yaw,tint,yo,low)=>{const X=U0+u,Z=V0+v;L.push({prop:true,type,x:X,z:Z,y0:y0+(yo||0),yaw:yaw||0,tint,rad:.5,low,key:'p'+Math.round(X*4)+','+Math.round(Z*4)+','+y0+type});}};
}
const P_FRUIT=[0xc9553f,0x5aa469,0xe08a3c,0xd8b13a,0x9c3f8c],P_JAR=[0x5aa469,0x3f8f4a,0x8fbf5a],P_CLOTH=[0x3f6b8c,0xc83a32,0xd8b13a,0x77608f,0x5d7a45,0xd96a8a];
// a shop or a store: checkouts by the doors, trolleys, aisles, and whatever it's known for
function shopRoom(b,px,pz,L){
  const {I,J,add}=floorKit(b,px,pz,0,L,false),kind=b.ground,cu=I/2,hg=(a,c,n)=>hash2(Math.floor(a)*7+px*31+n,Math.floor(c)*11+pz*17+n),tint=(A,a,c)=>A[Math.floor(hg(a,c,5)*A.length)%A.length];
  const PI=Math.PI,HP=PI/2,till=(u,v,yaw)=>add('monitor',u,v,yaw,0,.9),counter=(u0,u1,v,t)=>{for(let u=u0;u<u1;u++)add('bar',u+.5,v,PI,t);};
  const person=(u,v,yaw,t)=>{add('rtable',u,v,0,t);add('chair',u-.68,v,HP,t,0,true);add('chair',u+.68,v,-HP,t,0,true);};
  if(kind==='books'){
    // bookcases all round the walls and in two runs down the room, a table of new books, a till by the door, a reading corner
    for(let v=2;v<J;v++){add('bookcase',.5,v+.5,HP,tint(P_GOODS,0,v));add('bookcase',I-.5,v+.5,-HP,tint(P_GOODS,1,v));}
    for(let u=1.5;u<I-1;u++)add('bookcase',u,J-.5,PI,tint(P_GOODS,u,J));
    for(const u of [3.5,I-3.5])for(let v=4;v<J-3;v++)add('bookcase',u,v+.5,u<cu?HP:-HP,tint(P_GOODS,u,v));
    counter(1,4,1.3,0x5a3a22);till(2.5,1.3,PI);add('rtable',I-3,1.6,0,0xc9553f);add('sofa',cu-1,J-2.5,0,0x8a4b3a);add('sofa',cu+1,J-2.5,0,0x8a4b3a);add('plant',I-.5,.5,0);
  }else if(kind==='dentist'){
    // reception, the waiting chairs, a fish tank; three surgeries behind the wall, each with its chair, lamp, cabinet and X-ray
    const W=J-5;counter(cu+2,I-1,W-1.5,0xd8dce0);till(I-2.5,W-1.5,PI);add('swivel',I-2.5,W-.6,PI);
    for(let v=1;v<W-2;v+=2){add('seats',.6,v+.5,HP,0x3f9c9c);}add('rtable',2.4,1.5,0,0xd8dce0);add('fishtank',I-.5,1.5,-HP);add('plant',.5,W-.5,0);add('plant',I-.5,.5,0);
    for(const u of [2,7,12]){add('dchair',u,J-2,0);add('dlamp',u-1.2,J-2.1,0);add('cabinet',u+1.1,J-.5,PI);add('xray',u-1,J-.1,PI);add('swivel',u+1.2,J-2.8,.5);}
  }else if(kind==='dispo'){
    // glass counters across the room with the jars behind, plants everywhere, a bench to wait on
    const v=J-4;for(let u=1;u<I-1;u++){if(Math.abs(u+.5-cu)<1)continue;add('gcase',u+.5,v,PI,P_JAR[u%3]);add('jars',u+.5,J-.3,PI,P_JAR[(u+1)%3]);}
    till(2.5,v,PI);till(I-2.5,v,PI);
    for(let v2=1;v2<v-1;v2+=2){add('plant',.5,v2+.5,v2);add('plant',I-.5,v2+.5,v2+1);}
    add('seats',3,.6,0,0x5d7a45);add('seats',I-3,.6,0,0x5d7a45);add('rtable',3,3,0,0x5a3a22);add('rtable',I-3,3,0,0x5a3a22);
  }else if(kind==='guns'){
    // rifles round the walls, a long glass counter of pistols, ammunition in crates; the range through the back
    const W=J-5;for(let v=1;v<W;v++){add('gunrack',.3,v+.5,HP);add('gunrack',I-.3,v+.5,-HP);}
    for(let u=1;u<I-5;u++){add('gcase',u+.5,W-1.6,PI,0x2a2e33);}till(3.5,W-1.6,PI);
    for(const [u,v] of [[3,1.6],[4.2,1.6],[I-3,1.6],[I-4.2,1.6],[I-1.8,2.8]])add('pcrate',u,v,0);
    for(const u of [2,7,12]){add('target',u,J-.2,PI);counter(u-.5,u+.5,W+.8,0x46505a);}
  }else if(kind==='dealer'){
    // the sales desks along the back (the cars on show stand on the open floor), a plant at each corner
    for(let u=1.5;u<I-1;u+=4){add('desk',u,J-1.4,0);add('swivel',u,J-.6,PI);add('chair',u-.4,J-2.4,PI,0x35506b,0,true);add('chair',u+.4,J-2.4,PI,0x35506b,0,true);}
    add('plant',.5,.5,0);add('plant',I-.5,.5,0);add('vending',.5,J-.5,HP);add('showcar',cu-2.7,J/2-.8,.5,tint(P_CLOTH,1,1));add('showcar',cu+2.7,J/2-.8,-.5,tint(P_CLOTH,2,2));
  }else if(kind==='armory'){
    // the drill hall: rifle racks and lockers down the sides, crates, the duty desk, the flags at the far end
    for(let v=1;v<J-1;v++){if(v%3===1){add('locker',.4,v+.5,HP);add('locker',I-.4,v+.5,-HP);}else{add('gunrack',.3,v+.5,HP);add('gunrack',I-.3,v+.5,-HP);}}
    for(let u=1.5;u<I-1;u+=2.4)if(Math.abs(u-cu)>1.4)add('pcrate',u,J-.6,PI);
    add('flag',cu-2,J-1.4,PI);add('flag',cu+2,J-1.4,PI);add('desk',2.5,1.6,PI);add('swivel',2.5,2.4,PI);
  }else if(kind==='shop'&&b.station){
    // a station's hall: ticket windows along one wall at the near end, benches to wait on down the rest, a departures board
    const lg=J>=I,La=lg?J:I,Wc=lg?I:J,P2=(a,c)=>lg?[c,a]:[a,c],put=(t,a,c,y,tn,yo,low)=>{const [u,v]=P2(a,c);add(t,u,v,y,tn,yo,low);},yw=lg?-HP:PI,yb=lg?HP:0;
    const mid=La/2;
    for(let a=1;a<4;a++){put('teller',a+.5,Wc-.6,yw,0x5a3a22);if(a===2)put('monitor',a+.5,Wc-.5,yw,0,.95);}put('swivel',2.5,Wc-.2,yw,0,0,true);
    for(let a=5.5;a<La-6;a+=2.6)if(Math.abs(a-mid)>2.2){put('bench',a,.6,yb,0,0,true);put('bench',a,Wc-.6,yw,0,0,true);}
    put('bar',.6,.6,yb,0xc83a32);put('bar',1.6,.6,yb,0xc83a32);put('espresso',.6,.6,yb,0,.9);put('tv',mid-3,Wc-.1,yw,0,2.4);put('tv',mid+3,Wc-.1,yw,0,2.4);put('plant',mid-2.4,.5,0);put('plant',mid+2.4,.5,1);put('vending',La-6.5,.5,yb);
  }else if(kind==='shop'&&b.signCat!=='kiosk'&&!b.brand&&b.kind==='shop'){
    // a working building with nothing to sell: crates, a bench, some shelves
    for(let u=1;u<I-.5;u+=2.2)add('pcrate',u,J-.7,PI);add('shelf2',.6,J/2,HP,0xbf9a6a);add('rtable',I-1.2,1.4,0,P_WOOD);add('chair',I-1.9,1.4,HP,0x46505a,0,true);
  }else if(kind==='shop'&&b.signCat!=='kiosk'){
    // a shop under the flats: its till by the door, shelves in rows, a cold cabinet along the back
    for(let u=1;u<4&&u<I-2;u++)add('bar',u+.5,1.3,PI,0x46505a);add('monitor',2.5,1.3,PI,0,.9);add('swivel',2.5,2.1,PI,0,0,true);
    for(let v=3.2;v<J-1.6;v+=2.4)for(let u=1.5;u<I-1;u++){if(Math.abs(u-cu)<1.6)continue;add('shelf2',u,v,0,tint(P_GOODS,u,v));}
    for(let u=.5;u<I;u++)add('fridge2',u,J-.5,PI);add('plant',I-.5,.5,0);
  }else if(kind==='shop'){
    // a gas station's: cold drinks along the back, snacks in low rows, the till and the hot food by the door
    for(let u=.5;u<I;u++)add('fridge2',u,J-.5,PI);
    for(let v=1.8;v<J-1.4;v+=2.2)for(let u=1.5;u<I-7;u++)add('shelf2',u,v,0,tint(P_GOODS,u,v));
    counter(I-5,I,1.3,0xc83a32);till(I-2.5,1.3,PI);add('espresso',I-4.5,1.3,PI,0,.9);add('pot',I-1.5,1.3,PI,0,.9);
  }else if(kind==='ikea'){
    // room after furnished room; the cafeteria by the windows; the warehouse at the back, racks up to the roof
    const wv=Math.floor(J*.6),ve=wv-2;
    for(let u=4;u<I-1;u+=4)for(let v=wv+1;v<J-1;v+=4){if(u%12<4)continue;for(let d=0;d<3;d++)add('pallet',u+.5,v+d,HP,tint(P_GOODS,u,v));}
    for(let c=0;8*c+8<I*.72;c++)for(let r=0;2+9*r+9<wv;r++){const k=(c+r)%4,x=8*c,vb=3+9*r,yb=vb+1.5;
      if(k===0){add('homebed',x+2.5,yb+.3,0,tint(P_BLANKET,c,r));add('homebed',x+5.5,yb+.3,0,tint(P_BLANKET,r,c));add('flamp',x+4,yb-.6,0);add('shelf2',x+1.5,yb+5,PI,tint(P_GOODS,c,r));}
      else if(k===1){for(let i=0;i<4;i++)add('sofa',x+2.5+i,yb-.4,0,tint(P_SOFA,c,r));add('table',x+4,yb+1.6,0);add('table',x+4,yb+5,PI);add('tv',x+4,yb+5,PI,0,.62);add('flamp',x+1.4,yb-.4,0);add('plant',x+6.6,yb-.4,0);}
      else if(k===2){for(const a of [3,4,5]){add('rtable',x+a,yb+1.8,0,P_WHITE);add('chair',x+a,yb+1.12,0,0x9c6c3e,0,true);add('chair',x+a,yb+2.48,PI,0x9c6c3e,0,true);}add('shelf2',x+1.5,yb-.4,0,0xd8dce0);add('flamp',x+6.6,yb-.4,0);}
      else{for(const [i,t] of ['range','sink','prep','prep','fridge2'].entries())add(t,x+1.8+i,yb-.4,0,0xc9a24a);for(const a of [3,4,5])add('prep',x+a,yb+3,0);}}
    const uc=Math.ceil(I*.72);for(let u=uc+1;u<I-1;u+=3)for(let v=2.5;v<J*.33;v+=3)person(u,v,0,0x9c6c3e);
    counter(uc,I-1,.8,0x2b5fb8);
  }else{
    // the aisles: a supermarket, a drug store, a superstore or an electronics store
    const doors=b.bigbox?b.bigbox.map(e=>e-(b.x0+1)):[cu],near=u=>doors.some(d=>Math.abs(u-d)<3.5),big=J>=14,vC=big?2.6:1.5,v0=big?6:3.4,v1=J-(big?3:2.2),tech=b.brand&&b.brand.tech,wh=b.brand&&b.brand.wh,nofood=b.brand&&b.brand.nofood;
    for(let u=kind==='drug'?1.5:2.5;u<(kind==='drug'?I-6:I-2);u+=kind==='bigbox'?4:3.2)if(!near(u)){add('checkout',u,vC,0);add('swivel',u+.7,vC-.1,HP,0,0,true);}
    if(kind==='drug')counter(I-6,I-1,1.5,0xc83a32),till(I-3.5,1.5,PI);
    for(const d of doors)for(const sg of [-1,1])for(let i=0;i<3;i++)add('trolley',Math.max(.6,Math.min(I-.6,d+sg*(3+i*.7))),.6,0);
    const col=u=>kind==='bigbox'?(u<I*.38?0:u<I*.6?1:2):0,produce=u=>!tech&&(kind==='market'||kind==='grocery'||kind==='bigbox'&&!nofood&&u>I*.82)&&(kind==='bigbox'?true:u<I*.24);
    const signs=new Set();
    for(let u=kind==='drug'?1:2;u<(kind==='drug'?I-3:I-1);u+=3){
      const prod=produce(u),z=col(u);
      for(let v=v0;v<v1;v+=1){const vc=Math.floor(v)+.5;
        if(big&&Math.abs(vc-J/2)<2||near(u)&&vc<v0+2)continue;
        if(prod){if(Math.floor(v)%2===0)add('bin',u+.5,vc,0,tint(P_FRUIT,u,v));continue;}
        const t=tint(P_GOODS,u,Math.floor(v/5));
        if(wh)add('pallet',u+.5,vc,HP,t);
        else if(tech||kind==='bigbox'&&z===1){add('shelf2',u+.5,vc,HP,t);if(Math.floor(v)%2===0)add('tv',u+.5,vc,HP,0,1.95);}
        else if(kind==='bigbox'&&z===0&&Math.floor(u)%2===0)add('clothes',u+.5,vc,HP,tint(P_CLOTH,u,v));
        else if(kind==='bigbox'&&z===2&&!nofood&&Math.floor(u/3)%2)add('fridge3',u+.5,vc,HP);
        else add(kind==='drug'?'shelf2':kind==='bigbox'?'shelf4':'shelf3',u+.5,vc,HP,t);}
      if(!prod&&big&&!signs.has(u)){signs.add(u);add('aislesign',u+2,(v0+v1)/2,0,0x2b5fb8,(b.gf||7)-2.4,true);}
    }
    // along the back: fridges, or the wall of TVs, or the pharmacy
    if(kind==='drug'){for(let u=1.5;u<I-1;u++){add('shelf3',u,J-.5,PI,0xd8dce0);if(u<I-3)add('bar',u,J-2.2,PI,P_WHITE);}till(cu,J-2.2,PI);till(cu-3,J-2.2,PI);for(let v=4;v<J-3;v++)add('fridge3',I-.5,v+.5,-HP);}
    else for(let u=.5;u<I;u++){
      if(tech||kind==='bigbox'&&col(u)===1){add('shelf2',u,J-.5,PI,0x46505a);add('tv',u,J-.5,PI,0,1.95);}
      else if(kind==='bigbox'&&(col(u)===0||nofood))add('shelf4',u,J-.5,PI,tint(P_GOODS,u,J));
      else add('fridge3',u,J-.5,PI);}
    // the deli counter
    if((kind==='market'||kind==='grocery')&&!tech&&big){for(let u=I-8;u<I-1;u++)add(u%2?'pcase':'bar',u+.5,J-2.8,PI,0xc83a32);till(I-4.5,J-2.8,PI);}
  }
}
// the same kit, for a given floor of a building, keeping clear of its stairs and its way in, and (if it's told to) turned
// round to suit which side the door is on
function floorKit(b,px,pz,floorNo,L,turn){
  const gf=b.gf||FH,y0=floorNo===0?G+1:G+gf+1+FH*(floorNo-1),tr=b.tier>0&&(b.x1-b.x0)>=8&&y0>b.tier?2:0,X0=b.x0+tr+1,Z0=b.z0+tr+1,I=b.x1-b.x0-2-2*tr,J=b.z1-b.z0-2-2*tr,S=b.stair,d=turn?b.door:2;
  const cx=(b.x0+b.x1)>>1,cz=(b.z0+b.z1)>>1;
  const add=(type,u0,v0,yaw0,tint,yo,low)=>{
    const u=d===2?u0:d===3?u0:d===0?v0:I-v0,v=d===2?v0:d===3?J-v0:u0,yaw=(yaw0||0)*(d===0?-1:1)+(d===3?Math.PI:d===0?Math.PI/2:d===1?-Math.PI/2:0);
    if(u<.15||v<.15||u>I-.15||v>J-.15)return;const rx=X0+u,rz=Z0+v;
    if(S){const r=(S.ax==='x'?rx:rz)-S.r0,c=S.ax==='x'?rz:rx;if(c>=S.c0-.8&&c<S.c1+.8&&r>=-3.6&&r<S.L+3.6)return;if(c>=S.c0-3&&c<S.c1+3&&(S.L>FH?r>=-3&&r<S.L+3:r>=-3&&r<.6||r>=S.L-.6&&r<S.L+3))return;}   // (and room to walk round to either end of it)
    if(floorNo===0&&!tint?.door&&(b.door>=2?Math.abs(rx-cx-.5)<2&&(b.door===2?rz<Z0+3.2:rz>Z0+J-3.2):Math.abs(rz-cz-.5)<2&&(b.door===0?rx<X0+3.2:rx>X0+I-3.2)))return;
    const X=px*CELL+rx,Z=pz*CELL+rz;L.push({prop:true,type,x:X,z:Z,y0:y0+(yo||0),yaw,tint,rad:.5,low,key:'p'+Math.round(X*4)+','+Math.round(Z*4)+','+y0+type});};
  return{I,J,add,hg:(a,c,n)=>hash2(Math.floor(a)*7+px*31+floorNo*3+n,Math.floor(c)*11+pz*17+n)};
}
const PI_=Math.PI,HP_=Math.PI/2,P_RUG=[0x8a4b3a,0x3f6b8c,0x5d7a45,0x77608f],P_CAB=[0xd8dce0,0x8a6a44,0x5a7a6a];
// a house: living room to the left of the hall, kitchen and bedroom to the right; upstairs, bedrooms and a bathroom
function homeRoom(b,px,pz,floorNo,L){
  const {I,J,add,hg}=floorKit(b,px,pz,floorNo,L,true),cu=I>>1,pick=(A,n)=>A[Math.floor(hg(1,2,n)*A.length)%A.length],sofa=pick(P_SOFA,1),cab=pick(P_CAB,2);
  const lw=cu-2,rx=cu+3;   // (the rooms' inside edges, either side of the hall)
  const bed=(u,v,y,n)=>{add('homebed',u,v,y,pick(P_BLANKET,n));add('drawers',u+1.1,y?v+.3:v-.3,y);};
  const big=J>=9,sp=big?J>>1:2,by=sp+1;   // (big: the room behind the wall that divides each side)
  if(floorNo===0){
    // the living room: a sofa and its table, the television, a plant, a lamp
    for(let i=0;i<3;i++)add('sofa',.8+i,.6,0,sofa);add('table',1.8,2.1,0);add('table',1.8,big?sp-.6:3.6,PI_);add('tv',1.8,big?sp-.6:3.6,PI_,0,.62);add('flamp',.4,2.5,0);add('plant',lw-.4,.5,1);
    // behind it, a dining room with its table for six and a sideboard
    if(big){for(const u of [1.2,2.2,3.2]){add('rtable',u,by+1.6,0,P_WHITE);add('chair',u,by+.9,0,0x9c6c3e,0,true);add('chair',u,by+2.3,PI_,0x9c6c3e,0,true);}add('shelf2',.5,J-.5,PI_,cab);add('drawers',lw-.6,J-.5,PI_);add('plant',.5,by+.5,2);}
    // the kitchen, in the front half of the right side
    let u=rx+.2;for(const t of ['fridge2','range','sink','prep'])add(t,u++,.5,0,cab);
    if(big||!b.stair){add('rtable',rx+1.5,1.9,0,P_WHITE);add('chair',rx+.8,1.9,HP_,0x9c6c3e,0,true);add('chair',rx+2.2,1.9,-HP_,0x9c6c3e,0,true);}
    // a bedroom behind it, unless the stairs come up there
    if(!b.stair){bed(rx+1,J-1.1,PI_,3);add('wardrobe',I-.5,J-1.5,-HP_);if(big)add('flamp',rx+3,by+.6,0);}
    else add('shelf2',rx+.3,by+.2,0,cab);
    if(!big)add('shelf2',lw+.3,J-.5,PI_,cab);
    // coats by the door
    add('locker',cu-1.6,.3,0);
  }else{
    // upstairs: a bedroom each side at the front, a bathroom on the left behind, a study or the landing on the right
    bed(1.2,1.1,0,4);add('wardrobe',.5,sp-.6,HP_);add('plant',lw-.4,.5,2);
    bed(rx+1,1.1,0,5);add('wardrobe',I-.5,1.4,-HP_);if(big)add('homebed',rx+2.6,sp-1,PI_,pick(P_BLANKET,6));
    add('shelf2',lw-.4,by+.2,0,cab);
    if(big&&!b.stair){add('desk',rx+1.5,J-1.2,PI_);add('swivel',rx+1.5,J-2,PI_,0,0,true);}
  }
}
// a floor of flats
function aptFloor(b,px,pz,floorNo,L){
  const {I,J,add,hg}=floorKit(b,px,pz,floorNo,L,false),pick=(A,a,c,n)=>A[Math.floor(hg(a,c,n)*A.length)%A.length];
  const flat=(x,y,w,h,back0)=>{   // (back: +1 when the wall away from the corridor's at the larger v)
    const back=flatBack(b,y,y+h,b.z0+(b.tier>0&&(b.x1-b.x0)>=8&&(G+(b.gf||FH)+1+FH*(floorNo-1))>b.tier?2:0))<0?-1:back0;
    const yb=back>0?y+h-.5:y+.5,yw=back>0?PI_:0,yf=back>0?y+.6:y+h-.6,yfw=back>0?0:PI_;
    // the bedroom along the back (its bathroom's in the far corner there), the kitchen and a sofa along the front
    add('homebed',x+1,back>0?y+h-1:y+1,yw,pick(P_BLANKET,x,y,1));if(w>=7)add('wardrobe',x+2.3,yb,yw);
    let u=x+w-.5;for(const t of ['fridge2','range','sink'])if(u>x+w-3.6){add(t,u,yf,yfw,pick(P_CAB,x,y,2));u--;}
    for(let i=0;i<Math.min(3,w-4);i++)add('sofa',x+.8+i,yf,yfw,pick(P_SOFA,x,y,3));
    if(h>=5){add('table',x+1.8,y+h/2,0);add('rtable',x+w-1.6,y+h/2,0,P_WHITE);add('chair',x+w-2.3,y+h/2,HP_,pick(P_SOFA,x,y,4),0,true);add('chair',x+w-.9,y+h/2,-HP_,pick(P_SOFA,x,y,4),0,true);}
  };
  if(flats4(I,J)&&b.ground!=='firehall'){const cu=I>>1,cv=J>>1;flat(0,0,cu,cv-2,-1);flat(cu+1,0,I-cu-1,cv-2,-1);flat(0,cv+2,cu,J-cv-2,1);flat(cu+1,cv+2,I-cu-1,J-cv-2,1);}
  else if(I>=12&&b.ground!=='firehall'){flat(0,0,I>>1,J,1);flat((I>>1)+1,0,I-(I>>1)-1,J,1);}
  else flat(0,0,I,J,1);
}
