// See-through effects that have to be sorted in with the others: a big blast's cloud on the far side of a water surface is
// drawn before the water (BBF.under), the rest after it (BBF.cloud); dust devils' boxes go in the one sorted batch with the
// smoke and puffs (SEE_M), far to near. Fails on a wrong result.
const {T,E,run,els,pads,errs}=require('./harness.js')();
const ok=[];const chk=(n,v)=>{ok.push(!!v);console.log(n,v?'ok':'BAD');};
for(const f of els.play.L.click)f();pads.length=0;run(2);
const P=T.players[0],cam=P.camera.position;
// water near the start: a column with at least two blocks of it under air
let W=null;
find:for(let r=0;r<120&&!W;r+=2)for(let a=0;a<6.28;a+=0.2){const x=Math.floor(P.pos.x+Math.cos(a)*r),z=Math.floor(P.pos.z+Math.sin(a)*r);
  for(let y=T.H-2;y>2;y--){const b=T.peek(x,y,z);if(!b)continue;if(T.WET[b]&&T.WET[T.peek(x,y-1,z)]&&b===T.WATER){W={x,y,z};break find;}break;}}
chk('water found near the start',W);
if(W){
  const cube=(i,x,y,z)=>{const S=T.BBF_ST,o=i*9;S[o]=x;S[o+1]=y;S[o+2]=z;S[o+3]=1;S[o+4]=S[o+5]=S[o+6]=0.5;S[o+7]=0.6;S[o+8]=0;};
  const inW=[W.x+0.5,W.y-0.5,W.z+0.5],above=[W.x+0.5,W.y+4.5,W.z+0.5];
  const send=()=>{cube(0,...inW);cube(1,...above);T.bbCloudSend(2);const y=M=>Array.from({length:M.count},(_,i)=>M.instanceMatrix.array[i*16+13]);return{under:y(T.BBF.under),over:y(T.BBF.cloud)};};
  cam.set(W.x+0.5,W.y+8,W.z+6);let r=send();
  chk('camera above the water: the cube in it drawn before the water, the one above after it',r.under.length===1&&r.under[0]===inW[1]&&r.over.length===1&&r.over[0]===above[1]);
  cam.set(W.x+0.5,W.y-0.5,W.z+0.5);r=send();
  chk('camera in the water: the other way about',r.under.length===1&&r.under[0]===above[1]&&r.over.length===1&&r.over[0]===inW[1]);
  T.bbCloudSend(0);
}
// dust devils: one box behind a puff of dust and one in front, as seen from the camera; all three in SEE_M, far to near
{const x=P.pos.x,y=P.pos.y+30,z=P.pos.z;cam.set(x,y,z+20);
  for(const q of T.parts){q.life=0;q.m.visible=false;}T.puff(x,y,z,1,0x9a948a,0.01);
  const D=T.devilM,m=D.instanceMatrix.array;m.fill(0);
  for(const [i,dz] of [[0,-15],[1,12]]){const o=i*16;m[o]=m[o+5]=m[o+10]=m[o+15]=1;m[o+12]=x;m[o+13]=y;m[o+14]=z+dz;}
  D.count=2;T.fxDraw();const S=T.SEE_M,zs=Array.from({length:S.count},(_,i)=>S.instanceMatrix.array[i*16+14]);
  chk('a dust devil drawn sorted in with the dust, far to near '+zs.map(v=>(v-z).toFixed(1)).join(' '),S.count===2+T.parts.filter(q=>q.life>0).length&&zs[0]===z-15&&zs[zs.length-1]===z+12&&zs.every((v,i)=>!i||v>=zs[i-1]));
  chk('the devils\' own mesh isn\'t drawn',D.visible===false);D.count=0;}
console.log('errors',errs.length,errs.slice(0,4));
const pass=ok.every(Boolean)&&!errs.length;console.log(pass?'all ok':'FAILED');process.exit(pass?0:1);
