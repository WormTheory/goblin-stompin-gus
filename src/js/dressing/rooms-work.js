// offices, banks, broadcasters and the stock exchange
function workRoom(b,px,pz,floorNo,L,kind){
  const turn=kind==='lobby',{I,J,add,hg}=floorKit(b,px,pz,floorNo,L,turn),cu=I/2,pillar=(u,v)=>Math.floor(u)%4===1&&Math.floor(v)%4===1;
  const desks=(v0,v1,du,dv)=>{for(let v=v0;v<v1;v+=dv)for(let u=.5;u<I-.5;u+=du){if(pillar(u,v))continue;add('cube',u+.5,v,0);add('swivel',u+.55,v+.72,PI_,0,0,true);}};
  if(kind==='lobby'){
    // a reception desk facing the doors, seats to wait on, the lifts behind, plants
    for(const u of [cu-4,cu-2,cu+2,cu+4])add('counter',u,J*.45,0);add('monitor',cu-3,J*.45,PI_,0,.9);add('monitor',cu+3,J*.45,PI_,0,.9);add('swivel',cu-3,J*.45+.9,PI_,0,0,true);add('swivel',cu+3,J*.45+.9,PI_,0,0,true);
    for(const u of [cu-3,cu+3])add('elevator',u,J-.15,PI_);
    for(const u of [3,I-3]){add('rtable',u,J*.22,0,0x5a3a22);for(const [a,c,y] of [[-.9,0,HP_],[.9,0,-HP_]])add('sofa',u+a,J*.22+c,y,0x35506b,0,true);}
    add('seats',1.2,J*.45,HP_,0x35506b);add('seats',I-1.2,J*.45,-HP_,0x35506b);add('plant',.5,.5,0);add('plant',I-.5,.5,1);add('plant',.5,J-.5,2);add('plant',I-.5,J-.5,3);
  }else if(kind==='office'){
    // rows of desks, filing along one wall, the copier and the coffee corner, a meeting room if it's got one
    const meet=I>=12&&J>=12,x1=meet?I-6:I;
    for(let v=meet?6:1.4;v<J-2;v+=3.4)for(let u=.5;u<I-1;u+=3.2){if(pillar(u,v))continue;add('cube',u+.5,v,0);add('swivel',u+.55,v+.72,PI_,0,0,true);}
    for(let u=.6;u<x1-1;u+=2){if(pillar(u,.5))continue;add('locker',u,.4,0);}
    if(meet){for(const u of [I-4,I-3,I-2]){add('rtable',u,2,0,0x5a3a22);add('chair',u,1.3,0,0x35506b,0,true);add('chair',u,2.7,PI_,0x35506b,0,true);}add('tv',I-.4,2,-HP_,0,1);}
    add('copier',.6,J-.5,PI_);add('vending',I-.5,J-.6,-HP_);add('fridge2',I-1.6,J-.5,PI_,0);add('plant',2,J-.5,1);
  }else if(kind==='bank'){
    // tellers behind their glass, a seat for waiting, the managers' desks, a safe (the fortress banks have their vault)
    const C=Math.min(6,Math.floor(J/2));for(let u=.5;u<I-1.5;u++){add('teller',u,C,PI_,0x5a3a22);if(Math.floor(u)%3===1){add('monitor',u,C+.5,0,0,.95);add('swivel',u,C+1.2,PI_,0,0,true);}}
    add('seats',1.2,1.4,HP_,0x7a2a2a);add('seats',I-1.2,1.4,-HP_,0x7a2a2a);add('plant',.5,.4,0);add('plant',I-.5,.4,1);
    for(let u=1.5;u<I-1;u+=4){if(b.vault&&C+2>=J-7)break;add('desk',u,C+3,PI_);add('swivel',u,C+3.8,PI_,0,0,true);}
    if(!b.vault){add('safe',I-1,J-.8,PI_);add('safe',I-2.1,J-.8,PI_);}
  }else if(kind==='radio'){
    // a waiting sofa and a desk; the studio behind the glass, its records, the mixing desk, ON AIR over the door
    add('sofa',.8,.6,0,0x3f6b8c);add('sofa',1.8,.6,0,0x3f6b8c);add('desk',I-2,1.2,PI_);add('swivel',I-2,2,PI_,0,0,true);add('locker',.5,J-6,HP_);
    for(let u=3.5;u<I-.5;u++)add('mixer',u,J-2.5,PI_);add('swivel',4.5,J-3.3,PI_,0,0,true);add('swivel',6.5,J-3.3,PI_,0,0,true);
    for(let u=.5;u<I;u++)add('bookcase',u,J-.5,PI_,0x46505a);add('onair',2,J-4.9,0,0,2.6);
  }else if(kind==='news'){
    // the newsroom's desks at the front; the studio: its anchors' desk before the wall of screens, the cameras facing it
    desks(1.4,J-6.5,2.4,3);
    for(let u=2.5;u<I-2;u++)add('bar',u,J-3.2,0,0x2b5fb8);for(const u of [cu-2,cu+2]){add('monitor',u,J-3.2,0,0,.9);add('swivel',u,J-2.4,PI_,0,0,true);}
    for(const u of [cu-4,cu,cu+4])add('tvcam',u,J-5.6,0);
  }else if(kind==='stocks'){
    // the trading floor: rows of desks, a round of counters in the middle, the big board up the far wall
    desks(1.6,J-3,2.4,3);
  }
}
// public buildings
function civicRoom(b,px,pz,floorNo,L,kd){
  const {I,J,add,hg}=floorKit(b,px,pz,floorNo,L,false),cu=I/2,PI=Math.PI,HP=Math.PI/2,pick=(A,a,c,n)=>A[Math.floor(hg(a,c,n)*A.length)%A.length];
  const long=I>=J,Wl=long?I:J,Wc=long?J:I,S=b.stairHall;
  // (a runs along the building and c across it, whichever way it lies: backTo says which way a thing's back faces)
  const put=(type,a,c,back,tint,yo,low)=>{if(S&&a>S[0]-1&&a<=S[1]+1&&(floorNo||!S[2]))return;const yaw=back==='+a'?(long?-HP:PI):back==='-a'?(long?HP:0):back==='+c'?(long?PI:-HP):(long?0:HP);add(type,long?a:c,long?c:a,yaw,tint,yo,low);};
  if(kd==='school'){
    const mid=Wc/2;
    if(!floorNo){
      // the cafeteria: the serving counter and its pots, long tables and benches
      for(let c=1;c<Wc-1;c++){put('bar',1.5,c+.5,'-a',0x7d8a8f);if(c%3===1)put('pot',1.5,c+.5,'-a',0,.9);else if(c%3===2)put('fridge2',.5,c+.5,'-a');}
      for(const a of [4,7])for(let c=1.2;c<Wc-1.2;c+=2){if(Math.abs(c-mid)<1.6)continue;put('ltable',a,c,long?'+a':'-a');put('bench',a-.74,c,long?'+a':'-a',0,0,true);put('bench',a+.74,c,long?'+a':'-a',0,0,true);}
      // the gym's hoops
      put('hoop',Wl-11.6,mid,'-a');put('hoop',Wl-.4,mid,'+a');
    }
    // the classrooms: a teacher's desk at the board, pupils' desks and chairs in rows facing it
    const lim=floorNo?Wl:Wl-12;
    for(let w=floorNo?2:10;w+7<=lim;w+=8){
      put('desk',w+1.8,2.2,'+a');put('swivel',w+1.05,2.2,'-a',0,0,true);put('plant',w+6.6,.5,'-c');
      for(const a of [w+3.4,w+5.4])for(let c=1.4;c<Wc-.8;c+=1.4){if(Math.abs(c-mid)<1.6)continue;put('sdesk',a,c,'+a');put('chair',a+.56,c,'+a',pick(P_SEAT,w,1,1),0,true);}
    }
  }else if(kd==='library'){
    // the librarian's desk by the door, reading tables at the front, the computers, then the stacks with an aisle down the middle
    const vS=Math.floor(J/2);
    if(!floorNo){for(let u=1;u<4;u++)add('bar',u+.5,1.3,PI,0x5a3a22);add('monitor',2.5,1.3,PI,0,.9);add('swivel',2.5,2.1,PI,0,0,true);}
    for(let u=cu+2.5;u<I-1;u+=3.2)for(let v=1.6;v<vS-1;v+=2.8){add('rtable',u,v,0,0x5a3a22);add('chair',u-.68,v,HP,0x35506b,0,true);add('chair',u+.68,v,-HP,0x35506b,0,true);add('flamp',u,v,0,0,.64);}
    for(let v=floorNo?1.5:3.5;v<vS-.5;v+=2){add('desk',1.2,v,HP);add('swivel',2,v,HP,0,0,true);}
    for(let v=vS+.5;v<J-.5;v+=3)for(let u=.5;u<I;u++){if(Math.abs(u-cu)<1.1)continue;add('bookcase',u,v,0,pick(P_GOODS,u,v,1));}
    for(let u=.5;u<I;u++){if(Math.abs(u-cu)<1.1)continue;add('bookcase',u,J-.5,PI,pick(P_GOODS,u,J,2));}
  }else if(kd==='police'){
    const Rs=policeRooms(b,I,J,floorNo);
    if(!floorNo){
      // the lobby: the front desk behind its glass, seats to wait on, a notice board, the flag; the way on is past the desk
      const vD=Math.min(5.6,Math.max(1.6,(Rs[0]?Rs[0].v0:J)-1.6));
      for(let u=Math.max(.5,cu-8);u<cu-1.6;u++)add('teller',u,vD,PI,0x1c2a5a);for(let u=cu+2.1;u<Math.min(I,cu+7);u++)add('teller',u,vD,PI,0x1c2a5a);
      add('monitor',cu-3,vD+.5,0,0,.95);add('monitor',cu+3.1,vD+.5,0,0,.95);add('swivel',cu-3,vD+1.2,PI,0,0,true);
      add('seats',1.2,.8,0,0x35506b);add('seats',I-1.2,.8,0,0x35506b);add('board',cu-5,.1,0,0xd8dce0);add('flag',.7,vD-1,0);add('plant',I-.6,vD-1,0);
    }else if(J>=10)for(let u=2;u<I-2;u+=4){add('locker',u,.4,0);add('plant',u+2,.5,1);}
    for(const R of Rs){const x0=R.u0+1,x1=R.u1-1,y0=R.v0+1,y1=R.v1-1,w=x1-x0,h=y1-y0,mx=(x0+x1)/2;
      if(R.k==='cells'&&h>=5){
        // a bunk and a toilet behind the bars of each, a guard's desk, a bench along the corridor
        for(let u=R.u0+1.5;u+1<R.u1;u+=3){add('bunk',u-.1,y1-1.1,PI,0x7d8a8f);add('toilet',u+.7,y1-.4,PI);add('basin',u+.7,y1-2.6,HP);}
        add('desk',x0+1.2,y0+.8,HP);add('swivel',x0+.5,y0+.8,HP,0,0,true);add('bench',x1-1.2,y0+.5,0,0,0,true);add('locker',x1-.4,y0+1.2,-HP);
      }else if(R.k==='cells'){for(let u=x0+.8;u+.5<x1;u+=2.2){add('bunk',u,y1-1,PI,0x7d8a8f);add('toilet',u+1,y1-.4,PI);}}
      else if(R.k==='armory'){
        // rifles round the walls, racks of crates, the safe, a counter to sign things out over
        for(let v=y0+.5;v<y1;v++){add('gunrack',x0+.3,v,HP);add('gunrack',x1-.3,v,-HP);}
        for(let u=x0+1.5;u<x1-1;u++)add('gunrack',u,y1-.3,PI);
        for(let u=x0+1.5;u<x1-1;u+=2)add('pcrate',u,(y0+y1)/2,0);add('safe',x1-1.3,y1-1,PI);
        add('bar',x0+1.5,y0+.6,0,0x46505a);add('monitor',x0+1.5,y0+.6,PI,0,.9);
      }else if(R.k==='evidence'){
        // rows of shelves of boxes, the clerk behind a counter by the door
        for(let v=y0+2.5;v<y1;v+=2)for(let u=x0+.5;u<x1;u++)add('shelf3',u,v,0,0xbf9a6a);
        add('bar',x0+1.5,y0+.6,0,0x5a3a22);add('monitor',x0+1.5,y0+.6,PI,0,.9);add('swivel',x0+1.5,y0+1.4,PI,0,0,true);add('pcrate',x1-1,y0+.6,0);
      }else if(R.k==='break'){
        // a table, a sofa and the television, the kitchenette, the vending machine
        add('rtable',x0+1.5,y0+1.6,0,P_WHITE);add('chair',x0+.8,y0+1.6,HP,0x35506b,0,true);add('chair',x0+2.2,y0+1.6,-HP,0x35506b,0,true);
        let u=x0+.5;for(const t of ['fridge2','sink','range','prep'])if(u<x1){add(t,u,y1-.5,PI,0xd8dce0);u++;}
        add('vending',x1-.5,y1-.6,-HP);for(let i=0;i<3&&x1-1.5-i>x0+3;i++)add('sofa',x1-1.5-i,y0+.6,0,0x3f6b8c);add('tv',x1-2.5,y0+2.8,PI,0,.62);add('table',x1-2.5,y0+2.8,PI);
      }else if(R.k==='interview'){
        // a bare table, two chairs, the camera in the corner, a mirror along a wall
        add('rtable',mx,(y0+y1)/2,0,0x46505a);add('chair',mx-.7,(y0+y1)/2,HP,0x46505a,0,true);add('chair',mx+.7,(y0+y1)/2,-HP,0x46505a,0,true);add('tvcam',x0+.6,y1-.6,HP);add('board',x1-.1,(y0+y1)/2,-HP,0x9fb7c6);
      }else if(R.k==='locker'){
        for(let u=x0+.5;u<x1;u++){add('locker',u,y1-.4,PI);if(h>=4)add('locker',u,y0+.4,0);}add('bench',mx,(y0+y1)/2,0,0,0,true);add('basin',x1-.5,(y0+y1)/2+1,-HP);
      }else{
        // the squad room: desks facing each other, the whiteboard, a coffee machine, cases on the wall
        for(let v=y0+1.4;v<y1-.8;v+=3)for(let u=x0+1;u<x1-.6;u+=2.6){add('desk',u,v,0);add('swivel',u,v-.8,0,0,0,true);}
        add('board',mx,y1-.1,PI,P_WHITE);add('fridge2',x1-.5,y0+.6,-HP);add('plant',x0+.5,y0+.5,0);
      }
    }
  }else if(kd==='firehall'){
    // the engines' floor stays clear: only their kit along the back of it and down the far wall
    for(let u=.5;u<I;u++)add('gearrack',u,7,PI);
    for(let v=.5;v<7;v+=1)add('gearrack',I-.3,v,-HP);
  }else if(kd==='crew'){
    // upstairs: the crew's bunks, a table, a sofa in front of the television, a kitchen
    for(let u=1;u<I-1;u+=2)add('bunk',u,1,0,0xc83a32);
    for(const u of [1.5,3.5]){add('rtable',u,4,0,P_WHITE);add('chair',u-.68,4,HP,0xc83a32,0,true);add('chair',u+.68,4,-HP,0xc83a32,0,true);}
    for(let i=0;i<3;i++)add('sofa',6+i,3.4,0,0x3f6b8c);add('tv',7,5.4,PI,0,.62);add('table',7,5.4,PI);
    add('fridge2',I-.5,3.5,-HP);add('range',I-.5,4.5,-HP);add('sink',I-.5,5.5,-HP);
  }else if(kd==='cells'){
    // a bunk and a toilet in each cell, a guard's table at the door
    for(let a=1;a<Wl-1;a+=4){if(S&&a>=S[0])break;for(const [c,back] of [[.9,'-c'],[Wc-.9,'+c']]){put('bunk',a+.5,c,back,0x7d8a8f);put('toilet',a+2.5,c-(back==='-c'?.3:-.3),back);}}
    put('rtable',1,Wc/2,'-a',0x46505a);put('swivel',1,Wc/2+.8,'+c',0,0,true);
  }else if(kd==='courtroom'){
    // the lobby: the metal detector across the way in, a guard's desk, a bench. The courtroom: the public benches, the
    // lawyers' tables, the witness box, the jury down one side, the judge at the far end between the flags
    add('detector',cu,1.6,0,{door:1});add('desk',2.5,1.4,HP);add('swivel',1.7,1.4,HP,0,0,true);add('seats',I-1.2,1.4,-HP,0x7a2a2a);
    for(const v of [5,6.4])for(const u of [1.5,3.2,5,I-1.5,I-3.2,I-5])add('bench',u,v,0,0,0,true);
    for(const u of [cu-3,cu+3]){add('rtable',u,J-3.4,0,0x5a3a22);add('chair',u,J-4.1,0,0x35506b,0,true);}
    add('judge',cu,J-1.2,PI);add('chair',cu,J-.5,PI,0x7a2a2a,.6,true);add('wbox',cu+2.6,J-1.6,0);add('flag',cu-3,J-.5,PI);add('flag',cu+4,J-.5,PI);
    for(const v of [J-5,J-3.4])add('seats',I-.9,v,-HP,0x5a3a22);
  }
}
// places to go, and places of work
const VENUE_ROOMS=new Set(['barn','cinema','disco','club','theater','museum','aquarium','casino','factory','lab','barracks','terminal','stage']);
function venueRoom(b,px,pz,floorNo,L,kd){
  const {I,J,add,hg}=floorKit(b,px,pz,floorNo,L,false),cu=I/2,PI=Math.PI,HP=Math.PI/2,pick=(A,a,c,n)=>A[Math.floor(hg(a,c,n)*A.length)%A.length];
  const set=(u,v,t,c)=>{add('rtable',u,v,0,t);add('chair',u-.68,v,HP,c,0,true);add('chair',u+.68,v,-HP,c,0,true);};
  const barRun=(u0,u1,v,t,yaw)=>{for(let u=u0;u<u1;u++)add('bar',u+.5,v,yaw===undefined?PI:yaw,t);};
  const lg=kd==='factory'?!!b.alongX:I>=J,PT2=(a,c)=>lg?[a,c]:[c,a];
  const put=(type,a,c,back,tint,yo,low)=>{const [u,v]=PT2(a,c),yaw=back==='+a'?(lg?-HP:PI):back==='-a'?(lg?HP:0):back==='+c'?(lg?PI:-HP):(lg?0:HP);add(type,u,v,yaw,tint,yo,low);};
  if(kd==='cinema'){
    // ticket windows either side of the doors, the snack bar and its popcorn, an arcade, plants
    for(const u of [3.5,4.5,I-4.5,I-3.5]){add('teller',u,2.5,PI,0xc83a32);add('monitor',u,3,0,0,.95);}
    for(let u=6;u<I-6;u++){if(Math.abs(u+.5-cu)<3)continue;add('bar',u+.5,7.5,PI,0xc83a32);if(u%4===0)add('popcorn',u+.5,7.5,PI,0,.9);else if(u%4===2)add('soda',u+.5,7.5,PI,0,.9);add('fridge2',u+.5,9-.1,PI);}
    for(let v=3.5;v<7;v++)add('arcade',.5,v,HP,pick(P_GOODS,1,v,1));for(let v=3.5;v<7;v++)add('arcade',2,v,-HP,pick(P_GOODS,2,v,2));
    add('plant',1.5,.5,0);add('plant',I-1.5,.5,1);for(const u of [cu-6,cu+6])add('rtable',u,5,0,0xc83a32);
  }else if(kd==='disco'||kd==='club'){
    // booths and sofas down one wall, the bar and its bottles down the other, tables between; the DJ's booth and the
    // speakers (a club has a stage for its band instead, amps stacked up, a microphone at the front)
    const J1=kd==='club'?J-4:J-2;
    for(let v=2;v<J1-1;v+=2.8){add('rtable',1.3,v,0,0x2a2e33);add('booth',1.3,v-.82,0,kd==='club'?0x1f7a44:0xa86bc0,0,true);add('booth',1.3,v+.82,PI,kd==='club'?0x1f7a44:0xa86bc0,0,true);}
    for(let v=1.5;v<Math.min(J1-1,9);v++){add('bar',I-2,v,-HP,0x2a2e33);add('stool',I-2.9,v,0,0xc83a32,0,true);add('bottles',I-.3,v,-HP);}add('taps',I-2,3.5,-HP,0,.9);add('monitor',I-2,1.5,-HP,0,.9);
    if(kd==='club'){for(const u of [1,2.2,I-2.2,I-1])add('speaker',u,J-.8,PI,0,1);add('speaker',1.6,J-.8,PI,0,2.8);add('speaker',I-1.6,J-.8,PI,0,2.8);add('micstand',cu,J-3,0,0,1);add('micstand',cu-3,J-2.4,0,0,1);add('mixer',cu+2,J-1,PI,0,1);for(const u of [4,cu,I-5])set(u,2.4,0x2a2e33,0x3a3f45);}
    else{for(const u of [cu-1,cu,cu+1])add('mixer',u,J-1,PI);add('swivel',cu,J-1.9,PI,0,0,true);for(const u of [1,2,I-2,I-1])add('speaker',u,J-.9,PI);}
  }else if(kd==='theater'){
    // the lobby's sofas, the ticket desk; the band in the pit
    for(const u of [.5,1.5,I-1.5,I-.5])add('sofa',u,1.5,PI,0x7a2a2a);add('plant',cu-3,.5,0);add('plant',cu+3,.5,1);
    for(let u=1.5;u<I-1;u+=2){add('musicstand',u,7.3,PI);add('chair',u,7.9,PI,0x46505a,0,true);}
  }else if(kd==='museum'){
    // the ticket desk and gift shop inside the doors; in the galleries, glass cases and statues on plinths, benches to rest on
    for(let u=.5;u<4;u++)add('shelf2',u,1.5,PI,pick(P_GOODS,u,1,1));barRun(I-5,I-2,2.5,0x5a3a22);add('monitor',I-3.5,2.5,PI,0,.9);
    const lgM=I>=J,Wa=lgM?I:J-4,Wc=lgM?J:I,cvv=lgM?Math.floor((J+4)/2):I>>1;
    const P2=(a,c,type,yaw,t)=>{const [u,v]=lgM?[a,c]:[c,a+4];add(type,u,v,yaw,t);};
    const stepC=Wc>=24?4.4:3.6;
    for(let g=0;14*g<Wa;g++){const a0=14*g,kind2=(g+(floorNo||0))%3,theme=Math.floor(hg(g,floorNo,7)*5),far=c=>Math.abs(c-cvv)>2.2;
      const cols=[3.2,7.2,11.2];
      if(kind2===1){
        // the sculpture hall
        for(const u of cols)for(let c=2.5;c<Wc-1;c+=stepC)if(far(c))P2(a0+u,c,'statue',0,u===7.2?0x9c7a3e:0xd8dce0);
      }else if(kind2===2){
        // the big bones have their rope all round them, a label, fossils in cases down the walls
        for(let u=1.5;u<13;u+=1)for(const c of [cvv-3.6,cvv+4.4])P2(a0+u,c,'stanchion',0);
        P2(a0+1.5,cvv-1.6,'board',lgM?HP:0,0xd8c8a8);
        for(let u=2.5;u<13;u+=2.4)for(const c of [1.4,Wc-1.4])P2(a0+u,c,'gcase',0,0xbf9a6a);
      }else{
        // a gallery on one theme: jewels, ancient Egypt, knights, pots, or the sea
        const ex=['gcase','mummy','armour','vase','ship'][theme],tt=[0xd8b13a,0,0,0x7a4a2a,0][theme]||pick(P_GOODS,g,1,3);
        for(const u of cols)for(let c=2.5;c<Wc-1;c+=stepC)if(far(c))P2(a0+u,c,ex,0,theme===3?pick([0x7a4a2a,0x2b5fb8,0x3f8f4a],u,c,4):tt);
        P2(a0+1.5,cvv-2.6,'board',lgM?HP:0,[0x2b5fb8,0xc9a24a,0x7a2a2a,0x3f8f4a,0x2f6f7a][theme]);
      }
      if(kind2!==2){P2(a0+5.2,cvv+.5,'bench',lgM?HP:0);P2(a0+9.2,cvv+.5,'bench',lgM?HP:0);}
      P2(a0+1.2,1.2,'plant',0);P2(a0+13,Wc-1.2,'plant',1);
    }
    // the lobby: cloakroom, posters and a guide's desk, plants either side of the way in, a little cafe
    if(!floorNo){for(let u=5.5;u<8;u++)add('shelf2',u,.5,0,pick(P_GOODS,u,2,5));add('plant',cu-3,.6,0);add('plant',cu+3,.6,1);add('board',cu-5,.1,0,0x2b5fb8);add('board',cu+5,.1,0,0xc83a32);add('rtable',I-8,1.6,0,P_WHITE);add('chair',I-8.7,1.6,HP,0x46505a,0,true);add('chair',I-7.3,1.6,-HP,0x46505a,0,true);}
  }else if(kd==='aquarium'){
    // tickets and a gift shop inside the doors, benches along the walkway
    const Wc=lg?J:I,cw=Wc/2,Wl=lg?I:J,tl=Math.floor(Wl/2)-5,th=Math.floor(Wl/2)+5;
    for(let c=1.5;c<Wc-1;c+=3)if(Math.abs(c-cw)>2.4)put('teller',2.5,c,'-a',0x2b5fb8);
    put('shelf2',.6,1,'-a',0x63c8e6);put('shelf2',.6,Wc-1,'-a',0x63c8e6);put('plant',3.4,1,'-a');put('plant',3.4,Wc-1,'-a');
    for(const [a0,a1] of [[7,tl-2],[th+3,Wl-3]])for(let a=a0;a<a1;a+=5)for(const c of [4.8,Wc-4.8])if(Math.abs(c-cw)>1)put('bench',a,c,'-a',0,0,true);
  }else if(kd==='casino'){
    // rows of slot machines back to back, the gaming tables with their stools, the cashier and a safe, the food court
    const sl=Math.floor(J*.55);
    for(let v=2;v<sl;v+=4)for(let u=1;u<I-9;u++){if(u%12===0)continue;add('slot',u+.5,v+.5,v%8===2?PI:0);add('stool',u+.5,v+(v%8===2?-.4:1.4),0,0xc83a32,0,true);}
    for(let v=sl+2;v<J-4;v+=5)for(let u=4;u<I-11;u+=9){add('ptable',u,v,0);for(const a of [-1.2,0,1.2])for(const sg of [-1,1])add('stool',u+a,v+sg*1.3,0,0xc83a32,0,true);}
    for(let u=1.5;u<7;u+=2)add('monitor',u,J-3,0,0,.95);add('safe',1.5,J-.8,PI);add('safe',3,J-.8,PI);add('locker',5,J-.4,PI);
    for(let v=.5;v<J;v++){if(Math.floor(v)%4===0)add('fridge2',I-.5,v,-HP);else add('bar',I-.8,v,-HP,0x2f8a8a);}
    for(let u=I-7;u<I-3;u+=3)for(let v=1.5;v<J-1;v+=3)set(u,v,P_WHITE,0xc83a32);
  }else if(kd==='factory'){
    // the production lines: conveyors with goods riding them, machines beside them, stacks of crates, a foreman's desk
    const La=lg?I:J,Wc=lg?J:I,fk=b.fkind||'food',goods=fk==='cars'?'showcar':'pcrate',mt=fk==='chem'?0x46505a:fk==='steel'?0x7a4a2a:0xd8b13a;
    for(let c=2;c<Wc;c+=6){for(let a=2;a<La-2;a++)put('conveyor',a+.5,c+.5,'-c');for(let a=4;a<La-3;a+=fk==='cars'?8:4)put(goods,a+.5,c+.5,'-c',pick(P_CLOTH,a,c,1),.7);}
    for(let c=4;c+1<Wc;c+=6)for(let a=2;a<La-2;a+=8)put(fk==='chem'?'vat':'machine',a+1,c+.5,'-c',mt);
    for(let c=1;c<Wc;c+=3)put('locker',.4,c,'-a');put('desk',La-1.5,1.5,'+a');put('swivel',La-2.3,1.5,'+a',0,0,true);for(let c=Wc-2;c>Wc-8&&c>2;c-=1.2)put('pcrate',La-1,c,'+a');
  }else if(kd==='lab'){
    // bubbling vats, a long bench down the middle with its screens and glassware
    for(const u of [2.5,I-2.5])for(let v=2.5;v<J-2;v+=5)add('vat',u,v,0);
    for(let v=3.5;v<J-3;v++){add('prep',cu,v,HP);if(Math.floor(v)%2)add('monitor',cu,v,HP,0,.9);}add('swivel',cu-1,5,HP,0,0,true);add('swivel',cu+1,8,-HP,0,0,true);
  }else if(kd==='barracks'){
    // bunks down both walls, a locker at the foot of each, a table or two down the middle, the flag at the end
    for(let u=1.5;u<I-1;u+=3){add('bunk',u,.9,0,0x4a5a3a);add('locker',u,2.2,PI);add('bunk',u,J-.9,PI,0x4a5a3a);add('locker',u,J-2.2,0);}
    if(J>=8)for(let u=3;u<I-2;u+=6)set(u,J/2,0x5a3a22,0x46505a);add('flag',I-.7,J/2,-HP);
  }else if(kd==='terminal'){
    // check-in desks and the belt behind them, rows of seats at the gates, luggage, vending machines
    for(let u=1.5;u<I-1;u+=4){add('bar',u,J-2,0,0x2b5fb8);add('bar',u+1,J-2,0,0x2b5fb8);add('monitor',u,J-2,0,0,.9);add('swivel',u,J-1.2,PI,0,0,true);}
    for(let u=.5;u<I;u++)add('conveyor',u,J-.5,HP);for(let u=2;u<I-2;u+=7)add('pcrate',u,J-.5,0,0,.7);
    for(let v=3;v<J-5;v+=3)for(let u=1.2;u<I-1;u+=2.2){if(Math.floor(u)%6===0)continue;add('seats',u,v,v%6===3?0:PI,0x2b5fb8);}
    add('vending',.5,1.5,HP);add('vending',I-.5,1.5,-HP);add('plant',.5,.5,0);add('plant',I-.5,.5,1);
  }else if(kd==='barn'){
    // stalls down one side, bales stacked at the back, a tractor's worth of tools
    for(let v=1;v<J-3;v+=2.4){add('bench',.8,v,HP);add('hay',I-.7,v,0);add('hay',I-.7,v+1.2,0);}
    for(let u=.8;u<I;u+=1.1){add('hay',u,J-.7,0);add('hay',u,J-.7,0,0,.8);}
    add('pcrate',cu,J-2.4,0);add('prep',.6,J-1.6,HP);
  }else if(kd==='stage'){
    // the set in the middle of the floor is whatever's shooting this month: a living room, a saloon, a starship or a
    // kitchen. Cameras, a director's chair, lights and a boom face it; behind them a green screen, costume rails, catering
    const c2=I>>1,cv=J>>1,x=c2+.5,kindS=Math.floor(hash2(px*31+b.x0*7+3,pz*17+b.z0*11+5)*4);
    if(kindS===0){for(const u of [x-1,x,x+1])add('sofa',u,cv+2.6,PI,0x3f6b8c);add('table',x,cv+.8,0);add('flamp',x+2.4,cv+3,0);add('plant',x-2.6,cv+3,0);add('shelf2',x-2.6,cv,HP,0x7a4a2a);}
    else if(kindS===1){for(let u=x-2;u<=x+2;u++){add('bar',u,cv+1.6,0,0x5a3a22);add('bottles',u,cv+3.4,PI);}add('stool',x-1,cv+.8,0,0x7a2a2a,0,true);add('stool',x+1,cv+.8,0,0x7a2a2a,0,true);add('rtable',x-2.4,cv-1.2,0,0x5a3a22);add('chair',x-3.1,cv-1.2,HP,0x5a3a22,0,true);add('chair',x-1.7,cv-1.2,-HP,0x5a3a22,0,true);}
    else if(kindS===2){for(let u=x-2;u<=x+2;u++)add('mixer',u,cv+2.6,PI);add('swivel',x,cv+.9,PI,0,0,true);add('swivel',x-2,cv+1.6,PI,0,0,true);add('swivel',x+2,cv+1.6,PI,0,0,true);add('tv',x,cv+3.3,PI,0,1.4);}
    else{let u=x-2;for(const t of ['fridge2','range','range','sink','prep'])add(t,u++,cv+3.2,PI,0xd8dce0);add('prep',x-1,cv+.4,0);add('prep',x+1,cv+.4,0);}
    // the crew's side
    for(const [u,y] of [[x-4,.5],[x,0],[x+4,-.5]])add('tvcam',u,cv-6.6,y);
    add('dirchair',x-2,cv-8.6,0,0xc83a32);add('dirchair',x+2,cv-8.6,0,0x2b5fb8);add('desk',x,cv-10,0);add('swivel',x,cv-10.8,0,0,0,true);
    add('boom',x-3,cv-3.4,.3);add('studiolight',x-5,cv-3,.7);add('studiolight',x+5,cv-3,-.7);
    // the green screen across the back, the rails and the sandwiches at the front
    for(let u=1;u<I-.5;u++)add('backdrop',u,J-.4,PI,0x2fbf4a);
    for(let u=1;u<I-5;u+=1.2)add('clothes',u,1,0,pick(P_CLOTH,u,1,2));add('ltable',I-2.4,1,0);add('fridge2',I-.6,1,-HP);
    for(let v=4;v<cv-5;v+=2.4){add('pcrate',.8,v,HP);add('pcrate',I-.8,v,-HP);}
    // behind the set: stored scenery, racks of props, a bench for the extras
    for(let u=1;u<I-1;u+=2.2){add('shelf3',u,cv+6,PI,pick(P_GOODS,u,cv,6));if(cv+8.4<J-1.4)add('backdrop',u,cv+8.4,0,pick([0x7a4a2a,0x3f6b8c,0xd8b13a,0x5d7a45],u,1,7));}
    add('bench',x-3,cv+5,0,0,0,true);add('studiolight',x+4.6,cv+5,PI);
  }
}
// church pews (a church's frame: u across from its middle, v in from its doors. A cathedral's: a along, c across.)
function pewProps(b,px,pz,L){
  const y0=G+1,X0=px*CELL,Z0=pz*CELL,push=(type,rx,rz,yaw,t)=>{const X=X0+rx+.5,Z=Z0+rz+.5;L.push({prop:true,type,x:X,z:Z,y0,yaw,tint:t,rad:.5,key:'p'+Math.round(X*4)+','+Math.round(Z*4)+','+y0+type});};
  if(b.style==='church'){const W=b.x1-b.x0,D=b.z1-b.z0,cx=(b.x0+b.x1)>>1;
    for(let v=3;v<D-4;v+=2)for(let x=b.x0+1;x<b.x1-1;x++){if(Math.abs(x-cx)<2)continue;push('pew',x,b.z0+v,0);}
    return;}
  const alX=!!b.alongX,Lw=alX?b.x1-b.x0:b.z1-b.z0,Cw=alX?b.z1-b.z0:b.x1-b.x0,nc0=3,nc1=Cw-4,mid=(Cw-1)/2;
  for(let a=8;a<Lw-11;a+=2)for(let c=nc0+1;c<nc1;c++){if(Math.abs(c-mid)<=1.6)continue;alX?push('pew',b.x0+a,b.z0+c,HP_):push('pew',b.x0+c,b.z0+a,0);}
  for(let a=Lw-11;a<Lw-5;a++)for(const [c,sg] of [[nc0+1,1],[nc1-1,-1]])alX?push('pew',b.x0+a,b.z0+c,sg>0?0:PI_):push('pew',b.x0+c,b.z0+a,sg>0?-HP_:HP_);
}
// a mall's floor: its shops, the benches down its concourses, and on the ground floor the food court round the fountain
function mallProps(b,px,pz,n,L){
  const y0=n===0?G+1:G+b.gf+1+FH*(n-1),W=b.x1-b.x0,D=b.z1-b.z0,[hx,hz]=b._fp,PI=Math.PI,HP=PI/2;
  const add=(type,u,v,yaw,tint,yo,low)=>{const X=px*CELL+b.x0+u,Z=pz*CELL+b.z0+v;L.push({prop:true,type,x:X,z:Z,y0:y0+(yo||0),yaw:yaw||0,tint,rad:.5,low,key:'p'+Math.round(X*4)+','+Math.round(Z*4)+','+y0+type});};
  for(let v=1;v+6<D-1;v++){if((v+7)%14!==1)continue;const cIdx=Math.floor((v+7)/14);
    for(let u0=1;u0+8<W-1;u0+=8){let ok=true;for(let a=u0-1;a<=u0+8&&ok;a++)for(let c=v-1;c<=v+6&&ok;c++)if(mallCut(a,c,W,D))ok=false;if(!ok)continue;
      const unit=Math.floor((u0-1)/8),h=hash2(hx*131+unit*17+cIdx*7+n*3,hz*97+unit*5+cIdx*11+n),kind=n%2===0&&mallWC(b).some(m=>m[0]===u0&&m[1]===v)?9:Math.floor(h*5),x=u0+1,t=(a,c,A)=>A[Math.floor(hash2(u0*7+a+n,v*5+c)*A.length)%A.length];
      // the shop runs right through, a door at each end: its goods along the sides and down the middle, the till to one side
      if(kind===9){for(let a=.6;a<5;a+=1.1){add('stall',x+a,v+.9,0);add('stall',x+a,v+5.1,PI);}for(let a=1;a<5;a+=1.8)add('basin',x+a,v+3,a<3.5?0:PI);add('wcsign',x+4.3,v-1.06,PI,2.4);continue;}
      add('bar',x+.5,v+1,HP,0x46505a);add('monitor',x+.5,v+1,HP,0,.9);
      if(kind===0){for(let c=1;c<5;c++)for(const a of [1.5,5.5])add('clothes',x+a,v+c+.5,HP,t(a,c,P_CLOTH));add('mannequin',x+2.2,v+.5,0,t(0,0,P_CLOTH));add('mannequin',x+4.8,v+5.4,PI,t(1,0,P_CLOTH));add('flamp',x+6.4,v+3,0);}
      else if(kind===1){for(let a=0;a<7;a++){add('shelf2',x+a+.5,v+3,0,0x46505a);if(a%2===0)add('tv',x+a+.5,v+3,0,0,1.95);}add('bar',x+5.5,v+1,0,0x46505a);add('tv',x+5.5,v+1,0,0,.9);}
      else if(kind===2){for(let a=0;a<7;a++)add('fridge2',x+a+.5,v+5.3,PI);for(const a of [2,4.8])add('rtable',x+a,v+2.8,0,P_WHITE),add('chair',x+a-.68,v+2.8,HP,0xc83a32,0,true),add('chair',x+a+.68,v+2.8,-HP,0xc83a32,0,true);}
      else if(kind===3){for(let c=1;c<5;c++)for(const a of [1.5,3.5,5.5])add('toys',x+a,v+c+.5,0,t(a,c,P_GOODS));}
      else{for(let a=0;a<7;a++)add('bookcase',x+a+.5,v+5.3,PI,t(a,1,P_GOODS));for(const a of [2,4.8])add('bookcase',x+a,v+3,HP,t(a,2,P_GOODS));add('sofa',x+6,v+1.2,-HP,0x8a4b3a);}
    }
  }
  // benches along the middle of each concourse
  for(let v=1;v<D-1;v++){if((v+7)%14!==10)continue;for(let u=12;u<W-2;u+=16)if(!mallCut(u,v,W,D)&&n===0)add('bench',u+.5,v+1,HP,0,0,true);}
  if(n>0)return;
  // the food court
  const A=Math.min(18,Math.floor(Math.min(W,D)*.17));
  for(let u=0;u<W;u++)for(let v=0;v<D;v++){if(((u%5)+5)%5!==2||((v%5)+5)%5!==2||mallCut(u,v,W,D)!=='atrium')continue;const cu=u+.5-W/2,cv=v+.5-D/2,du=Math.abs(cu),dv=Math.abs(cv);if(du<4||dv<4||Math.hypot(cu,cv)<=8||du>A-3&&dv>A-3||[[-11,-11],[11,-11],[-11,11],[11,11]].some(k=>Math.abs(cu-k[0])<3&&Math.abs(cv-k[1])<3))continue;
    add('rtable',u+.5,v+.5,0,P_WHITE);for(const [a,c,y] of [[-.68,0,HP],[.68,0,-HP],[0,-.68,0],[0,.68,PI]])add('chair',u+.5+a,v+.5+c,y,0xc83a32,0,true);}
  // the kiosks' counters
  for(const [kx,kz] of [[-11,-11],[11,-11],[-11,11],[11,11]]){const u=kx+W/2,v=kz+D/2;for(const [a,c,y] of [[0,-1,0],[0,1,PI],[-1,0,HP],[1,0,-HP]])add('bar',u+a,v+c,y,0xc83a32);add('monitor',u,v-1,0,0,.9);}
}
// a little restaurant: the dining room at the front, the counter with its tills across it, the kitchen behind the wall
const P_EAT={diner:[0xc4342c,0xc4342c,0x2f6f7a],pizza:[0x3f8f4a,0xc8392f,0x7a4a2a],cafe:[0x6b4a32,0xe6dcc8,0x5d7a45],fastfood:[0xc4342c,0xe8c23a,0xc4342c],sitdown:[0x5a3a22,0xd8c8a8,0x7a2a2a],bar:[0x3a2416,0x5a3a22,0x7a2a2a],soup:[0x7d8a8f,0,0]};
function restProps(b,px,pz,L){
  const U0=px*CELL+b.x0+1,V0=pz*CELL+b.z0+1,I=b.x1-b.x0-2,J=b.z1-b.z0-2,y0=G+1,kind=b.ground,[TC,TT,TS]=P_EAT[kind],C=J-5,cu=I/2;
  const add=(type,u,v,yaw,tint,yo,low)=>{const X=U0+u,Z=V0+v;L.push({prop:true,type,x:X,z:Z,y0:y0+(yo||0),yaw,tint,rad:.5,low,key:'p'+Math.round(X*4)+','+Math.round(Z*4)+','+y0+type});};
  const set4=(u,v,tint,seat)=>{add('rtable',u,v,0,tint);add('chair',u-.68,v,Math.PI/2,seat,0,true);add('chair',u+.68,v,-Math.PI/2,seat,0,true);add('chair',u,v-.68,0,seat,0,true);add('chair',u,v+.68,Math.PI,seat,0,true);};
  const booths=(u,v,tint)=>{add('rtable',u,v,0,tint);add('booth',u,v-.82,0,TS,0,true);add('booth',u,v+.82,Math.PI,TS,0,true);};
  const kitchen=(line,v0)=>{let u=v0;for(const t of line){add(t,u,J-.5,Math.PI);u+=1;}add('fridge2',I-.5,J-.5,Math.PI);add('fridge2',I-1.5,J-.5,Math.PI);add('shelf2',I-2.5,J-.5,Math.PI,0xc9a24a);};
  if(kind==='sitdown'){
    // the host's stand and a bench for the wait inside the door, booths down the walls, tables in between, a bar along
    // the back, the kitchen behind the wall. (A buffet place has its long buffet down the middle; the country kitchen
    // chain has its old store just inside.)
    const K=J-4,B=b.brand||{},store=B.store,inStore=(u,v)=>store&&u<7.5&&v<8.5;
    for(let i=-4;i<=-2;i++)add('bar',cu+i,1.2,Math.PI,TC);add('monitor',cu-3,1.2,Math.PI,0,.9);
    add('seats',cu+3,.6,0,TS);add('plant',.5,.5,0);add('plant',I-.5,.5,1);
    const n=Math.min(8,I-6);for(let i=0;i<n;i++){add('bar',i+.5,K-1.5,Math.PI,TC);if(i%2===0)add('stool',i+.5,K-2.36,0,TS,0,true);add('bottles',i+.5,K-.42,Math.PI);}
    add('taps',2.5,K-1.5,Math.PI,0,.9);add('monitor',n-1.5,K-1.5,Math.PI,0,.9);
    for(let v=3.5;v<K-3;v+=3){if(!inStore(1,v))booths(1.3,v,TT);if(v<K-4)booths(I-1.3,v,TT);}
    if(B.buffet)for(let v=5;v<K-3.5;v+=1)add('buffet',cu,v,0);
    for(let du=3.2;du<cu-2.4;du+=4)for(const u of [cu-du,cu+du])for(let v=4.2;v<K-3.6;v+=3.4){if(B.buffet&&du<3||inStore(u,v))continue;set4(u,v,TT,TS);}
    if(store)for(const u of [1.5,3.5,5.5])for(let v=3;v<8;v++)add('shelf2',u,v,Math.PI/2,P_GOODS[(Math.floor(u)+v)%P_GOODS.length]);
    const ln=['range','range','fryer','prep','sink','range','prep'];for(let i=0;i<Math.min(ln.length,I-5);i++)add(ln[i],i+.5,J-.5,Math.PI);add('fridge2',I-.5,J-.5,Math.PI);add('fridge2',I-1.5,J-.5,Math.PI);
    for(let i=1;i<Math.min(7,I-6);i++)add('prep',i+.5,J-2.5,0);
    return;
  }
  if(kind==='fastfood'){
    // fixed booths by the windows, little tables by the way in, the long counter with its tills and drinks machine, the
    // fryers and grills behind the wall
    for(const v of [1.5,C-1.4]){booths(1.3,v,TT);booths(I-1.3,v,TT);set4(3.7,v,TT,TS);set4(I-3.7,v,TT,TS);}
    const v=C+.5;for(let i=0;i<I-4;i++)add('bar',i+.5,v,Math.PI,TC);
    for(const u of [1.5,3.5,5.5])add('monitor',u,v,Math.PI,0,.9);add('soda',I-4.5,v,Math.PI,0,.9);
    kitchen(['fryer','fryer','range','range','prep','sink'],.5);return;
  }
  if(kind==='bar'){
    // booths down one wall, stools round high tables, a pool table, a jukebox; the bar itself, its taps and stools, with
    // bottles along the wall behind, and a little kitchen through the back
    for(const v of [1.5,C-1.4])booths(1.3,v,TT);
    for(const v of [1.5,C-1.4]){add('rtable',4.3,v,0,TT);add('stool',3.6,v,0,TS,0,true);add('stool',5,v,0,TS,0,true);}
    add('pool',I-3,(C-1)/2+.5,0);add('jukebox',I-.4,.6,-Math.PI/2);add('plant',I-.5,C-.5,0);
    const v=C+.5;for(let i=0;i<I-4;i++){add('bar',i+.5,v,Math.PI,TC);if(i%2===0)add('stool',i+.5,v-.86,0,TS,0,true);add('bottles',i+.5,J-3.4,Math.PI);}
    add('taps',3.5,v,Math.PI,0,.9);add('monitor',7.5,v,Math.PI,0,.9);
    kitchen(['range','prep','sink'],.5);return;
  }
  if(kind==='soup'){
    // long tables with benches, the serving counter with its big pots and a box for donations, the kitchen behind
    for(const v of [1.9,C-1.7])for(const u of [1.1,2.9,I-1.1,I-2.9]){add('ltable',u,v,0);add('bench',u,v-.72,0,0,0,true);add('bench',u,v+.72,0,0,0,true);}
    add('plant',.5,.4,0);
    const v=C+.5;for(let i=0;i<I-4;i++)add('bar',i+.5,v,Math.PI,TC);
    for(const u of [1.5,3.5,5.5,7.5])add('pot',u,v,Math.PI,0,.9);add('dbox',cu-.5,v,Math.PI,0,.9);
    kitchen(['range','range','prep','sink','prep'],.5);return;
  }
  // the dining room, leaving a clear way from the door to the counter
  const us=[1.3,4.3,I-4.3,I-1.3],vs=[1.5,C-1.4];
  for(const u of us)for(const v of vs){
    if(kind==='diner'&&(u<2||u>I-2)){add('rtable',u,v,0,P_WHITE);add('booth',u,v-.82,0,TS,0,true);add('booth',u,v+.82,Math.PI,TS,0,true);}
    else if(kind==='cafe'){add('rtable',u,v,0,TT);add('sofa',u-.86,v,Math.PI/2,TS,0,true);add('sofa',u+.86,v,-Math.PI/2,TS,0,true);}
    else set4(u,v,kind==='diner'?P_WHITE:TT,TS);
  }
  if(kind==='cafe'){add('plant',.5,.5,0);add('plant',I-.5,.5,1);add('shelf2',.5,C-.5,Math.PI/2,0x7a4a2a);}else add('plant',.5,.5,0);
  // the counter: a run of it, the tills on top, the way behind it left open at the far end
  const v=C+.5;for(let i=0;i<I-4;i++)add(kind==='cafe'&&(i===1||i===2)?'pcase':'bar',i+.5,v,Math.PI,TC);
  add('monitor',cu-.5,v,Math.PI,0,.9);if(kind==='cafe')add('espresso',4.5,v,Math.PI,0,.9);else add('monitor',2.5,v,Math.PI,0,.9);
  if(kind==='diner')for(let i=.8;i<I-4;i+=1.5)if(Math.abs(i-cu)>.7)add('stool',i,v-.86,0,TC,0,true);
  // the kitchen, all along the back wall
  const vk=J-.5;let u=.5;const line=kind==='pizza'?['range','prep','sink','prep']:kind==='cafe'?['sink','prep','prep','range']:['range','range','prep','sink','prep'];
  if(kind==='pizza'){add('oven',1,vk-.05,Math.PI);u=2.5;}
  for(const t of line){add(t,u,vk,Math.PI);u+=1;}
  add('fridge2',I-.5,vk,Math.PI);add('fridge2',I-1.5,vk,Math.PI);add('shelf2',I-2.5,vk,Math.PI,0xc9a24a);
}
// the tables out front of a restaurant, either side of the way to its door
// a beach's furniture and a harbor front's benches, or a fishing village's nets and crates. (They stand on whatever's there, so
// the heights are read off the ground when they first come into range.)
function coastProps(P,px,pz){
  if(P._cp)return P._cp;const L=P._cp=[],X0=px*CELL,Z0=pz*CELL,TN=[0xc83a32,0x2f8a4a,0x3f6b8c,0xd8b13a,0xd96a8a,0xe08a3c];
  const add=(type,x,z,yaw,tint,low)=>L.push({prop:true,type,x,z,y0:G+1,yaw:yaw||0,tint,rad:.5,low,snap:true,key:'p'+Math.round(x*4)+','+Math.round(z*4)+','+type});
  const seaYaw=(x,z)=>Math.atan2(coastD(x+3,z)-coastD(x-3,z),coastD(x,z+3)-coastD(x,z-3));
  if(P.type==='beach'){
    for(let cx=Math.floor(X0/7)*7+3;cx<X0+CELL;cx+=7)for(let cz=Math.floor(Z0/7)*7+3;cz<Z0+CELL;cz+=7){if(cx<X0||cz<Z0)continue;
      const w=-coastD(cx,cz),h=hash2(cx*13+7,cz*5+1);if(w<=2||w>=11||h>=0.6)continue;
      const c=TN[Math.floor(hash2(cx,cz*3)*6)],y=seaYaw(cx,cz),sx=Math.sin(y),sz=Math.cos(y),px2=cz%2?1:-1;
      add('umbrella',cx+.5,cz+.5,0,c);
      add('lounger',cx+.5+sz*1.3*px2,cz+.5-sx*1.3*px2,y,TN[Math.floor(hash2(cx*5,cz)*6)]);
      if(h<0.3)add('lounger',cx+.5-sz*1.3*px2,cz+.5+sx*1.3*px2,y,TN[Math.floor(hash2(cx,cz*5)*6)]);
      else add('towel',cx+.5-sz*1.4*px2+sx*.4,cz+.5+sx*1.4*px2+sz*.4,y,TN[Math.floor(hash2(cx*3,cz*3)*6)],true);}
    if(P.lg){const lx=X0+P.lg.x+.5,lz=Z0+P.lg.z+.5,y=seaYaw(lx,lz);add('lifeguard',lx,lz,y);add('lifering',lx+2,lz+1,y);}
    // a game of volleyball, a sandcastle by the water, surfboards at the back of the sand, somebody selling ices
    {const pick=(i,lo,hi)=>{for(let k=0;k<30;k++){const x=X0+3+hash2(px*17+i*31+k,pz*3+k*7)*26,z=Z0+3+hash2(px*5+k*3,pz*19+i*13+k)*26,w=-coastD(x,z);if(w>=lo&&w<=hi)return[x,z];}return null;};
     const h=hash2(px*29+3,pz*23+9);let q;
     if(h<0.5&&(q=pick(1,5,10))){add('vnet',q[0],q[1],seaYaw(q[0],q[1])+Math.PI/2);add('ball',q[0]+1,q[1]+1.6,0,0xe8c83a,true);}
     if(h>0.3&&(q=pick(2,1,3)))add('sandcastle',q[0],q[1],h*6,0,true);
     if(h>0.55&&(q=pick(3,10,13)))add('surfrack',q[0],q[1],seaYaw(q[0],q[1]),0xd96a8a);
     if(h<0.8&&(q=pick(4,9,12)))add('icecart',q[0],q[1],seaYaw(q[0],q[1]),TN[Math.floor(h*60)%6]);}
    // benches along the boardwalk
    for(let x=X0+3;x<X0+CELL;x+=9)for(let z=Z0+3;z<Z0+CELL;z+=9){const w=-coastD(x,z);if(w>=17.5&&w<20)add('bench',x+.5,z+.5,seaYaw(x,z));}
  } else if(P.type==='harbor'){
    const [a,b]=P.land,at=(u,w)=>[a>0?CELL-1-u:a<0?u:w,b>0?CELL-1-u:b<0?u:w],wet=(x,z)=>seaBlk(x,z)>=SEA_T;
    if(P.fish){
      if(P.pw>=0)for(let u=4;u<CELL-2;u+=4){const [rx,rz]=at(u,P.pw),x=X0+rx,z=Z0+rz;if(wet(x,z)&&hash2(x*3,z*7)<0.75)add('fishcrate',x+.5,z+.5,hash2(x,z)*3);}
      // (the moored rowboats are real boats: see mooredBoats)
      for(const [u,w,t] of [[P.Q-3,5,'netrack'],[P.Q-3,9,'lpot'],[P.Q-2,10,'lpot'],[P.Q-3,11,'buoys'],[P.Q-3,14,'fishcrate'],[P.Q-2,18,'rope'],[P.Q-3,26,'netrack']]){if(u<2)continue;const [rx,rz]=at(u,w),x=X0+rx,z=Z0+rz;if(!wet(x,z)&&coastD(x,z)<-1)add(t,x+.5,z+.5,a?0:Math.PI/2,undefined,t==='rope'||t==='buoys');}
    }else{
     // bollards along the piers, and what's waiting to be loaded
     for(const w of [9,11,21,23])for(let u=P.Q+2;u<CELL-1;u+=6){const [rx,rz]=at(u,w),x=X0+rx,z=Z0+rz;if(wet(x,z))add('bollard',x+.5,z+.5,0,undefined,true);}
     for(const [u,w,t,c] of [[P.Q+4,10,'rope'],[P.Q+9,22,'fishcrate'],[P.Q-2,14,'drum',0x3f6b8c],[P.Q-2,15,'drum',0xc83a32],[P.Q-3,14,'fishcrate'],[P.Q-2,6,'lifering'],[P.Q-2,26,'anchor'],[P.Q-3,28,'buoys']]){if(u<1||u>=CELL)continue;const [rx,rz]=at(u,w),x=X0+rx,z=Z0+rz;if(t==='lifering'&&wet(x,z))continue;add(t,x+.5,z+.5,a?Math.PI/2:0,c,t==='rope'||t==='buoys');}
     for(let rx=0;rx<CELL;rx++)for(let rz=0;rz<CELL;rz++){const x=X0+rx,z=Z0+rz;if(mod(x*3+z,13)!==0||wet(x,z)||mod(x+z,9)===0)continue;
      const u=fromSide(a,b,rx,rz),w=alongSide(a,b,rx,rz);if(w<ROADW||u<ROADW||wet(x+1,z)||wet(x-1,z)||wet(x,z+1)||wet(x,z-1))continue;
      const dir=[[2,0],[-2,0],[0,2],[0,-2]].find(([e,f])=>wet(x+e,z+f));if(dir)add('bench',x+.5,z+.5,Math.atan2(dir[0],dir[1]));}
    }
  } else if(P.type==='yard'||P.type==='navy'){
    // the bollards along the quay; drums and rope by the crane rails. On a naval base: its flag, an anchor by the gate, stores on the quay
    for(const [sa,sb] of P.wet)for(let al=3;al<CELL;al+=7){const rx=sa?(sa>0?CELL-1:0):al,rz=sa?al:(sb>0?CELL-1:0);add('bollard',X0+rx+.5,Z0+rz+.5,0,undefined,true);}
    for(const [i,[qx,qz,t,c]] of [[11,11,'drum',0xc83a32],[12,11,'drum',0x3f6b8c],[11,12,'drum',0x5d7a45],[20,10,'rope'],[14,20,'pipes']].entries()){if(P.type==='yard'&&(qx>=ROADW&&qz>=ROADW)&&hash2(px*7+i,pz*3)<.7)add(t,X0+qx+.5,Z0+qz+.5,i,c,t==='rope');}
    if(P.type==='navy'&&!P.dock&&P.wet.length){const [sa,sb]=P.wet[0],o=(u,w)=>[sa>0?CELL-1-u:sa<0?u:w,sb>0?CELL-1-u:sb<0?u:w],sp=[[3,12,'fishcrate'],[3,14,'fishcrate'],[3,19,'drum',0x5a6a4a],[3,20,'drum',0x5a6a4a],[2,26,'anchor']];
      for(const [u,w,t,c] of sp){const [rx,rz]=o(u,w);add(t,X0+rx+.5,Z0+rz+.5,sa?Math.PI/2:0,c);}}
    if(P.type==='navy'&&hash2(px*3,pz*5)<.5)add('flagmast',X0+ROADW+1.5,Z0+ROADW+1.5,0,0x2b4f9a);
  } else if(P.type==='rig'){
    // on the deck: racks of pipe, drums
    const on=(u,v,t,c,yaw)=>{const x=X0+16+u+.5,z=Z0+16+v+.5;L.push({prop:true,type:t,x,z,y0:G+10,yaw:yaw||0,tint:c,rad:.5,key:'p'+Math.round(x*4)+','+Math.round(z*4)+','+t});};
    on(-1,-8,'pipes',0,0);on(-1,-5,'pipes',0,0);on(6,3,'pipes',0,Math.PI/2);on(9,6,'drum',0xc83a32);on(9,7,'drum',0xe8c83a);on(8,7,'drum',0xc83a32);on(-2,8,'drum',0x3f6b8c);on(-1,8,'rope');
  }
  return L;
}
function patioProps(P,px,pz){
  if(P._patio)return P._patio;const L=P._patio=[],y0=G+1,zc=pz*CELL+PL0+2;
  for(const [i,rx] of [PL0+2.5,PL0+6,PL0+12,PL0+15.5].entries()){const X=px*CELL+rx,tint=i%2?0x2f8a4a:0xc83a32;
    const add=(type,dx,dz,yaw,t,low)=>{const x=X+dx,z=zc+dz;L.push({prop:true,type,x,z,y0,yaw,tint:t,rad:.5,low,key:'p'+Math.round(x*4)+','+Math.round(z*4)+','+y0+type});};
    add('rtable',0,0,0,P_WHITE);add('umbrella',0,0,0,tint);
    add('chair',-.68,0,Math.PI/2,0x46505a,true);add('chair',.68,0,-Math.PI/2,0x46505a,true);add('chair',0,-.68,0,0x46505a,true);add('chair',0,.68,Math.PI,0x46505a,true);}
  return L;
}
// the furniture on one floor of any other building, read from what furnRaw says stands there
const P_SOFA=[0x8a4b3a,0x3f6b8c,0x5d7a45,0x77608f,0xb08a3e],P_GOODS=[0xc9553f,0x4f86c6,0xd8b13a,0x5aa469,0xa86bc0,0xe08a3c];
