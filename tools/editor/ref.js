// Reference figures for the editor: a goblin as the game builds it (copied from goblinModel in src/js/enemies/goblins.js,
// with its colours from GC), so a weapon can be seen in a goblin's hand and an animation played on one. It isn't used by
// the game: when the goblin's body becomes an asset of its own, the editor will build it from that instead.
// Each node: {name, p (its pivot's place in its parent), r (rest rotation), boxes:[{s,p,c,r}], kids:[...]}
const GC_REF={skin:'#6f9a3a',dark:'#4f7426',tunic:'#5a3d22',eye:'#ffd23a',club:'#7a5530',belt:'#2b1d10',mouth:'#2a1a10'};
const GOBLIN_REF={name:'root',p:[0,0,0],scale:0.85,boxes:[
    {s:[0.5,0.5,0.3],p:[0,0.7,0],c:GC_REF.tunic},{s:[0.52,0.07,0.32],p:[0,0.5,0],c:GC_REF.belt}],
  kids:[
    {name:'legL',p:[-0.13,0.45,0],boxes:[{s:[0.17,0.45,0.17],p:[0,-0.225,0],c:GC_REF.dark}]},
    {name:'legR',p:[0.13,0.45,0],boxes:[{s:[0.17,0.45,0.17],p:[0,-0.225,0],c:GC_REF.dark}]},
    {name:'head',p:[0,0.95,0],boxes:[
      {s:[0.48,0.42,0.42],p:[0,0.21,0.02],c:GC_REF.skin},
      {s:[0.3,0.1,0.06],p:[-0.36,0.28,0],c:GC_REF.skin,r:[0,0,-0.35]},{s:[0.3,0.1,0.06],p:[0.36,0.28,0],c:GC_REF.skin,r:[0,0,0.35]},
      {s:[0.1,0.07,0.03],p:[-0.11,0.27,0.24],c:GC_REF.eye},{s:[0.1,0.07,0.03],p:[0.11,0.27,0.24],c:GC_REF.eye},
      {s:[0.08,0.12,0.1],p:[0,0.17,0.28],c:GC_REF.dark},{s:[0.22,0.04,0.02],p:[0,0.07,0.235],c:GC_REF.mouth}]},
    {name:'armL',p:[-0.32,0.92,0],boxes:[{s:[0.13,0.42,0.13],p:[0,-0.2,0],c:GC_REF.skin}]},
    {name:'arm',p:[0.32,0.92,0],boxes:[{s:[0.13,0.42,0.13],p:[0,-0.2,0],c:GC_REF.skin}],kids:[{name:'hand',p:[0,-0.4,0],boxes:[]}]}]};
// a goblin's height, for the scale figure and the grid
const GOBLIN_H=1.4;
// the first-person view as the game sets it up (gobKit and gobCamera in src/js/player/pivots.js): the camera's field of
// view, the view model's scale, the arm's box and where a gun is held when its weapon gives no vm of its own
const FP_REF={fov:72,scale:0.5,arm:{s:[0.11,0.11,0.42],p:[0,0,-0.2],c:GC_REF.skin},gunVm:{x:0.34,y:-0.46,z:-0.5},rest:[0.08,0.52,-0.62,-0.72]};
