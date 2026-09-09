const GRID_SIZE = 5;
const SPRITE = 64;

const TOOLS = {
  wall:{name:'벽',type:'terrain',description:'두꺼운 석벽을 배치합니다.'},
  path:{name:'통로',type:'terrain',description:'돌바닥 통로를 배치합니다.'},
  room:{name:'방',type:'terrain',description:'넓은 석실 바닥을 배치합니다.'},
  spike:{name:'가시 함정',type:'trap',description:'통로나 빈 방 위에 설치하는 쇠가시 함정입니다.'},
  pit:{name:'구덩이 함정',type:'trap',description:'통로나 빈 방 위에 설치하는 깊은 구덩이 함정입니다.'},
  sticky:{name:'끈끈이 함정',type:'trap',description:'통로나 빈 방 위에 설치하는 끈적한 점액 웅덩이입니다.'},
  slime:{name:'슬라임',type:'monster',description:'함정이 없는 방에만 배치할 수 있는 하급 몬스터입니다.'},
  goblin:{name:'고블린',type:'monster',description:'함정이 없는 방에만 배치할 수 있는 던전 잡병입니다.'},
  skeleton:{name:'스켈레톤',type:'monster',description:'함정이 없는 방에만 배치할 수 있는 기본 언데드 병사입니다.'},
  eraser:{name:'지우개',type:'eraser',description:'몬스터 또는 함정을 먼저 지우고, 그다음 지형을 지웁니다.'}
};

const C = {
  void:'#0e0c0a',void2:'#17130f',black:'#050403',mortar:'#15120f',
  stone0:'#26211c',stone1:'#3a332a',stone2:'#4d4438',stone3:'#615546',stone4:'#786a57',stone5:'#93836b',
  path0:'#302a23',path1:'#3e372e',path2:'#50463a',path3:'#645746',path4:'#796a55',
  room0:'#342b21',room1:'#493a2b',room2:'#5a4935',room3:'#705b42',room4:'#887055',
  steel0:'#303536',steel1:'#545b5c',steel2:'#798182',steel3:'#aab0aa',steel4:'#d6d8ce',rust:'#7d4b2c',
  slime0:'#213019',slime1:'#365522',slime2:'#56832f',slime3:'#78ad43',slime4:'#a6d45d',slime5:'#d9ef95',
  gob0:'#2e3b20',gob1:'#4f642e',gob2:'#708b40',gob3:'#98ad58',gob4:'#bfca7b',
  leather0:'#332116',leather1:'#56351f',leather2:'#774a2b',leather3:'#99643a',cloth:'#312821',
  bone0:'#555145',bone1:'#837c69',bone2:'#b7ae92',bone3:'#ddd4b6',bone4:'#f2e9cb',
  sticky0:'#41451d',sticky1:'#666b29',sticky2:'#8e9636',sticky3:'#b3bc4d',sticky4:'#dbdd70',sticky5:'#f1ed9a',
  eye:'#ddd76e',red:'#7d3025',blue:'#72a6b3',shadow:'rgba(0,0,0,.36)'
};

const gridElement=document.getElementById('grid');
const resetButton=document.getElementById('resetButton');
const eraserButton=document.getElementById('eraserButton');
const toolButtons=[...document.querySelectorAll('.tool-button')];
const selectedName=document.getElementById('selectedName');
const selectedDescription=document.getElementById('selectedDescription');
const selectedIcon=document.getElementById('selectedIcon');
const hoverInfo=document.getElementById('hoverInfo');
const placedCount=document.getElementById('placedCount');
const toast=document.getElementById('toast');

let selectedTool='path',pointerDown=false,lastPaintedIndex=-1,toastTimer=null;
const cells=Array.from({length:GRID_SIZE*GRID_SIZE},()=>({terrain:null,trap:null,monster:null}));

const px=(ctx,x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
const dot=(ctx,x,y,color)=>px(ctx,x,y,1,1,color);
function clear(ctx){ctx.clearRect(0,0,SPRITE,SPRITE);ctx.imageSmoothingEnabled=false}
function h(ctx,x,y,w,color,t=1){px(ctx,x,y,w,t,color)}
function v(ctx,x,y,hh,color,t=1){px(ctx,x,y,t,hh,color)}
function frame(ctx,x,y,w,hh,light,dark){h(ctx,x,y,w,light);v(ctx,x,y,hh,light);h(ctx,x,y+hh-1,w,dark);v(ctx,x+w-1,y,hh,dark)}
function shadow(ctx,x,y,w,hh){px(ctx,x,y,w,hh,C.shadow)}

function drawVoid(ctx){
  px(ctx,0,0,64,64,C.void);
  [[6,8,7,2],[45,11,10,2],[18,29,5,2],[41,39,13,2],[8,52,3,3],[28,56,8,2],[54,50,3,3]].forEach(r=>px(ctx,...r,C.void2));
  [[11,17],[49,27],[23,48],[37,14],[56,35]].forEach(([x,y])=>dot(ctx,x,y,'#211a14'));
}

function brick(ctx,x,y,w,hh,fill,seed){
  px(ctx,x,y,w,hh,fill);
  h(ctx,x+1,y+1,Math.max(1,w-2),C.stone5);
  h(ctx,x+1,y+hh-2,Math.max(1,w-2),C.stone0);
  v(ctx,x+w-2,y+2,Math.max(1,hh-4),C.stone1);
  if(seed%2===0)h(ctx,x+4,y+4,Math.min(6,w-7),'#83745f');
  if(seed%3===0){dot(ctx,x+Math.max(2,w-5),y+3,C.stone0);dot(ctx,x+Math.max(3,w-4),y+4,C.stone0)}
  if(seed%4===0&&w>13){h(ctx,x+6,y+hh-5,4,C.stone2);dot(ctx,x+10,y+hh-4,C.stone2)}
}

function drawWall(ctx){
  px(ctx,0,0,64,64,C.mortar);
  const rows=[
    [[-4,0,17],[14,0,22],[37,0,15],[53,0,15]],
    [[-9,11,20],[12,11,17],[30,11,22],[53,11,16]],
    [[-3,22,25],[23,22,15],[39,22,20],[60,22,12]],
    [[-7,33,18],[12,33,23],[36,33,14],[51,33,20]],
    [[-2,44,22],[21,44,18],[40,44,24]],
    [[-8,55,19],[12,55,16],[29,55,21],[51,55,18]]
  ];
  rows.forEach((row,ri)=>row.forEach((b,bi)=>brick(ctx,b[0],b[1],b[2],9,[C.stone2,C.stone3,C.stone4][(ri+bi)%3],ri*5+bi)));
  [[8,15,4],[8,19,3],[31,4,5],[35,4,4],[44,27,5],[48,30,3],[18,48,4],[22,51,5],[53,59,4]].forEach(([x,y,w])=>h(ctx,x,y,w,C.stone0));
  [[9,16],[10,17],[33,5],[34,6],[46,28],[47,29],[20,49],[21,50],[55,58]].forEach(([x,y])=>dot(ctx,x,y,'#181511'));
  [[3,2],[27,13],[5,36],[42,46],[57,24]].forEach(([x,y])=>{dot(ctx,x,y,'#a09278');dot(ctx,x+1,y,'#8e7f68')});
}

function slab(ctx,x,y,w,hh,fill,seed){
  px(ctx,x,y,w,hh,fill);
  h(ctx,x+1,y+1,w-2,C.path4);
  h(ctx,x+1,y+hh-2,w-2,C.path0);
  v(ctx,x+w-2,y+2,hh-4,C.path1);
  if(seed%2===0){h(ctx,x+4,y+5,Math.min(7,w-8),C.path3);dot(ctx,x+4,y+6,C.path4)}
  if(seed%3===0){dot(ctx,x+w-5,y+3,C.path0);dot(ctx,x+w-6,y+4,C.path0)}
  if(seed%4===0&&hh>11){v(ctx,x+7,y+hh-6,3,C.path0);h(ctx,x+7,y+hh-4,4,C.path0)}
}

function drawPath(ctx){
  px(ctx,0,0,64,64,C.path0);
  const slabs=[
    [1,1,19,14],[21,1,15,14],[37,1,26,14],
    [1,16,13,15],[15,16,25,15],[41,16,22,15],
    [1,32,22,14],[24,32,17,14],[42,32,21,14],
    [1,47,16,16],[18,47,28,16],[47,47,16,16]
  ];
  slabs.forEach((s,i)=>slab(ctx,...s,[C.path1,C.path2,C.path3][i%3],i));
  [[9,24],[33,12],[51,39],[28,53],[4,43],[58,9]].forEach(([x,y])=>dot(ctx,x,y,'#85735c'));
  [[12,7],[25,27],[45,21],[36,42],[53,55]].forEach(([x,y])=>{dot(ctx,x,y,C.path0);dot(ctx,x+1,y+1,C.path0)});
}

function drawRoom(ctx){
  px(ctx,0,0,64,64,C.room0);
  for(let y=2;y<=54;y+=13){
    for(let x=2;x<=54;x+=13){
      const idx=((x+y)/13)|0;
      const fill=[C.room1,C.room2,C.room3][idx%3];
      px(ctx,x,y,11,11,fill);
      h(ctx,x+1,y+1,9,C.room4);
      h(ctx,x+1,y+9,9,'#3c3025');
      v(ctx,x+9,y+2,7,'#4a3b2d');
      if((x+y)%26===0){dot(ctx,x+3,y+4,'#9a815f');dot(ctx,x+4,y+4,'#8b7254')}
      if((x*y)%5===0){dot(ctx,x+7,y+7,'#3f3226')}
    }
  }
  frame(ctx,0,0,64,64,'#5d4b38','#211b15');
  [[4,4],[58,4],[4,58],[58,58]].forEach(([x,y])=>{dot(ctx,x,y,'#9a805d');dot(ctx,x+(x<32?1:-1),y,'#7f684d')});
}

function spikeShape(ctx,cx,base,height){
  const top=base-height;
  dot(ctx,cx,top,C.steel4);
  px(ctx,cx-1,top+1,3,3,C.steel3);
  px(ctx,cx-2,top+4,5,Math.max(3,height-8),C.steel2);
  px(ctx,cx-1,top+5,2,Math.max(2,height-10),C.steel4);
  px(ctx,cx-3,base-4,7,4,C.steel1);
  dot(ctx,cx+2,base-3,C.rust);
}

function drawSpike(ctx){
  px(ctx,5,45,54,10,C.steel0);frame(ctx,5,45,54,10,C.steel2,'#202526');
  for(let x=8;x<58;x+=7){v(ctx,x,47,6,'#252b2c');dot(ctx,x,48,C.rust)}
  [[10,45,19],[17,45,28],[24,45,15],[31,45,34],[38,45,22],[45,45,30],[52,45,18],[14,39,18],[22,39,25],[30,39,17],[40,39,27],[49,39,20]].forEach(([x,b,hh])=>spikeShape(ctx,x,b,hh));
  [[7,56],[18,57],[35,56],[53,57]].forEach(([x,y])=>{h(ctx,x,y,4,C.steel1);dot(ctx,x+1,y,C.steel3)});
}

function drawPit(ctx){
  const rim=[[5,16,12,7],[18,12,13,8],[32,11,11,8],[44,14,15,7],[4,22,8,13],[52,22,8,14],[6,42,13,8],[20,46,12,7],[33,47,12,7],[46,42,13,8]];
  rim.forEach((r,i)=>{px(ctx,...r,[C.stone2,C.stone3,C.stone4][i%3]);h(ctx,r[0]+1,r[1]+1,r[2]-2,C.stone5);h(ctx,r[0]+1,r[1]+r[3]-2,r[2]-2,C.stone0);if(i%2===0)dot(ctx,r[0]+3,r[1]+3,'#8e8068')});
  px(ctx,11,18,42,31,'#201b16');
  px(ctx,14,20,36,28,'#15120f');
  px(ctx,17,22,31,25,'#0d0b09');
  px(ctx,20,25,26,21,C.black);
  h(ctx,18,22,25,'#2c251e');v(ctx,14,23,20,'#2a241d');
  [[13,31],[49,27],[22,49],[41,49],[8,37]].forEach(([x,y])=>{dot(ctx,x,y,C.stone1);dot(ctx,x+1,y,C.stone0)});
  [[26,28],[37,35],[30,41]].forEach(([x,y])=>dot(ctx,x,y,'#090807'));
}

function drawSticky(ctx){
  const bands=[[18,27,28],[14,29,36],[11,32,42],[8,35,48],[6,38,52],[5,41,54],[7,44,50],[11,47,42],[16,50,32]];
  bands.forEach(([x,y,w],i)=>h(ctx,x,y,w,[C.sticky2,C.sticky3,C.sticky3,C.sticky2,C.sticky2,C.sticky1,C.sticky2,C.sticky2,C.sticky1][i],3));
  h(ctx,19,28,15,C.sticky4,2);h(ctx,14,34,11,C.sticky4,2);h(ctx,35,37,13,C.sticky4,2);h(ctx,24,44,9,C.sticky5,1);
  [[17,39,3],[29,35,2],[45,42,3],[36,47,2],[12,44,2]].forEach(([x,y,s])=>{px(ctx,x,y,s,s,C.sticky0);dot(ctx,x+1,y,C.sticky5)});
  [[23,31],[41,34],[31,47],[50,40]].forEach(([x,y])=>{dot(ctx,x,y,C.sticky5);dot(ctx,x+1,y,C.sticky4)});
  v(ctx,10,45,5,C.sticky1);dot(ctx,9,49,C.sticky2);v(ctx,52,42,4,C.sticky1);
}

function slimeBand(ctx,y,x,w,color){h(ctx,x,y,w,color,1)}
function drawSlime(ctx){
  shadow(ctx,13,53,40,4);
  const outline=[[28,20,9],[23,21,19],[20,22,25],[18,24,29],[16,27,33],[14,31,37],[12,36,41],[11,41,43],[12,46,41],[15,50,35],[20,53,25]];
  outline.forEach(([x,y,w])=>slimeBand(ctx,y,x,w,C.slime0));
  for(let y=23;y<=50;y++){
    const t=(y-23)/27;
    const half=Math.round(12+9*Math.sin(t*Math.PI));
    const cx=32;
    h(ctx,cx-half,y,half*2,C.slime2);
  }
  for(let y=28;y<48;y++){
    const inset=Math.max(0,Math.floor((y-28)/7));
    h(ctx,18+inset,y,4,C.slime1);
  }
  h(ctx,24,24,15,C.slime4,2);h(ctx,21,27,10,C.slime4);h(ctx,25,25,8,C.slime5);dot(ctx,34,26,C.slime5);
  h(ctx,17,48,28,C.slime3);h(ctx,20,50,22,C.slime2);
  px(ctx,21,36,7,8,C.slime0);px(ctx,39,36,7,8,C.slime0);
  px(ctx,22,37,5,6,'#10120d');px(ctx,40,37,5,6,'#10120d');dot(ctx,23,38,'#eff7d7');dot(ctx,41,38,'#eff7d7');dot(ctx,26,42,C.slime3);dot(ctx,44,42,C.slime3);
  h(ctx,29,45,9,C.slime0);h(ctx,31,46,5,'#6c913b');dot(ctx,30,45,C.slime4);
  [[17,35],[46,30],[20,43],[42,47],[34,31]].forEach(([x,y])=>dot(ctx,x,y,C.slime4));
}

function drawGoblin(ctx){
  shadow(ctx,16,57,37,3);
  const earL=[[11,20,5],[9,21,8],[8,23,10],[10,25,9],[13,27,7]];
  const earR=[[48,20,5],[47,21,8],[46,23,10],[45,25,9],[45,27,7]];
  earL.forEach(([x,y,w])=>h(ctx,x,y,w,C.gob1));earR.forEach(([x,y,w])=>h(ctx,x,y,w,C.gob1));
  h(ctx,9,23,5,C.gob3);h(ctx,51,23,4,C.gob3);dot(ctx,10,24,'#b6be72');dot(ctx,53,24,'#b6be72');
  [[25,12,16],[21,14,24],[19,17,28],[18,21,30],[18,26,30],[20,31,26]].forEach(([x,y,w])=>h(ctx,x,y,w,C.gob0,3));
  [[25,14,16],[22,16,22],[21,19,24],[20,23,26],[20,27,26],[23,31,20]].forEach(([x,y,w],i)=>h(ctx,x,y,w,[C.gob2,C.gob2,C.gob3,C.gob2,C.gob2,C.gob1][i],3));
  h(ctx,26,13,13,C.gob4);h(ctx,23,16,8,C.gob3);dot(ctx,39,16,C.gob4);
  h(ctx,23,21,8,C.gob0,2);h(ctx,37,21,8,C.gob0,2);
  px(ctx,25,23,5,5,'#11120c');px(ctx,38,23,5,5,'#11120c');dot(ctx,26,24,'#ede9bd');dot(ctx,39,24,'#ede9bd');
  px(ctx,32,25,4,5,C.gob1);dot(ctx,31,28,C.gob0);dot(ctx,36,28,C.gob0);
  h(ctx,27,31,13,'#4d261a',2);dot(ctx,30,31,'#d6c38c');dot(ctx,37,31,'#d6c38c');h(ctx,31,34,5,C.gob0);
  px(ctx,28,35,12,5,C.gob1);px(ctx,20,39,29,17,C.leather0);px(ctx,22,39,25,16,C.leather1);
  h(ctx,24,40,21,C.leather3,2);v(ctx,33,40,15,C.leather0,2);h(ctx,21,47,27,C.cloth,3);
  h(ctx,21,50,27,'#2a201a',3);px(ctx,32,49,6,5,C.steel0);frame(ctx,32,49,6,5,C.steel3,C.steel0);dot(ctx,34,51,C.steel4);
  px(ctx,16,40,6,15,C.gob1);px(ctx,48,39,6,16,C.gob1);h(ctx,17,41,4,C.gob3);h(ctx,49,40,4,C.gob3);
  px(ctx,24,55,7,7,C.gob0);px(ctx,40,55,7,7,C.gob0);h(ctx,22,61,10,C.leather0,2);h(ctx,39,61,10,C.leather0,2);
  px(ctx,53,37,2,18,C.steel1);px(ctx,54,34,1,5,C.steel4);dot(ctx,55,35,C.steel3);h(ctx,50,49,9,C.leather2,3);dot(ctx,52,50,C.leather3);
  [[26,43],[42,43],[28,47],[44,52]].forEach(([x,y])=>dot(ctx,x,y,'#bd8752'));
}

function drawSkeleton(ctx){
  shadow(ctx,15,59,39,3);
  [[28,8,14],[24,9,22],[22,12,26],[21,16,28],[21,21,28],[23,26,24],[27,30,16]].forEach(([x,y,w])=>h(ctx,x,y,w,C.bone0,3));
  [[28,9,14],[25,11,20],[24,14,22],[23,18,24],[24,22,22],[26,26,18]].forEach(([x,y,w],i)=>h(ctx,x,y,w,[C.bone3,C.bone3,C.bone4,C.bone3,C.bone3,C.bone2][i],3));
  h(ctx,29,10,10,C.bone4);dot(ctx,26,14,'#f7efd3');dot(ctx,44,16,C.bone1);
  px(ctx,26,17,7,7,C.black);px(ctx,39,17,7,7,C.black);px(ctx,28,19,3,3,'#20343a');px(ctx,41,19,3,3,'#20343a');dot(ctx,29,19,C.blue);dot(ctx,42,19,C.blue);
  px(ctx,34,23,4,4,C.bone0);dot(ctx,33,26,C.black);dot(ctx,38,26,C.black);h(ctx,28,28,16,C.bone1,2);h(ctx,30,29,12,C.bone3);
  [31,34,37,40].forEach(x=>v(ctx,x,29,3,C.bone0));
  px(ctx,34,32,5,22,C.bone2);h(ctx,24,34,25,C.bone3,3);h(ctx,25,35,23,C.bone1);
  const ribs=[[27,38,18],[28,42,16],[29,46,14],[30,50,12]];
  ribs.forEach(([x,y,w])=>{h(ctx,x,y,w,C.bone2,2);dot(ctx,x-1,y+1,C.bone1);dot(ctx,x+w,y+1,C.bone1);v(ctx,x-1,y+1,3,C.bone1);v(ctx,x+w,y+1,3,C.bone1)});
  px(ctx,20,37,3,17,C.bone1);px(ctx,22,38,2,16,C.bone3);px(ctx,50,37,3,18,C.bone1);px(ctx,49,38,2,16,C.bone3);
  dot(ctx,21,55,C.bone4);dot(ctx,51,55,C.bone4);
  h(ctx,29,53,15,C.bone1,3);px(ctx,28,55,6,4,C.bone2);px(ctx,40,55,6,4,C.bone2);
  px(ctx,29,58,3,5,C.bone3);px(ctx,42,58,3,5,C.bone3);h(ctx,27,62,7,C.bone1,2);h(ctx,41,62,7,C.bone1,2);
  px(ctx,55,31,2,28,C.steel1);px(ctx,56,27,1,6,C.steel4);dot(ctx,57,28,C.steel3);h(ctx,51,48,10,C.leather2,2);dot(ctx,53,49,C.leather3);
}

function drawEraser(ctx){
  drawVoid(ctx);px(ctx,17,18,30,28,'#56211d');px(ctx,19,20,26,24,'#9b4439');px(ctx,22,22,20,18,'#c45f50');
  h(ctx,25,25,14,'#e79679',2);h(ctx,28,31,8,'#f0d3a7',3);dot(ctx,31,30,'#fff0c3');
}

function drawTool(ctx,tool,withBg=true){
  clear(ctx);
  if(tool==='wall')return drawWall(ctx);if(tool==='path')return drawPath(ctx);if(tool==='room')return drawRoom(ctx);if(tool==='eraser')return drawEraser(ctx);
  if(withBg){TOOLS[tool]?.type==='monster'?drawRoom(ctx):drawPath(ctx)}
  if(tool==='spike')drawSpike(ctx);else if(tool==='pit')drawPit(ctx);else if(tool==='sticky')drawSticky(ctx);else if(tool==='slime')drawSlime(ctx);else if(tool==='goblin')drawGoblin(ctx);else if(tool==='skeleton')drawSkeleton(ctx);
}

function makeLayer(cls){const c=document.createElement('canvas');c.width=SPRITE;c.height=SPRITE;c.className=`tile-layer ${cls}`;return c}
function createGrid(){
  const frag=document.createDocumentFragment();
  for(let i=0;i<cells.length;i++){
    const b=document.createElement('button');b.className='tile';b.type='button';b.dataset.index=String(i);b.setAttribute('role','gridcell');
    const art=document.createElement('span');art.className='tile-art';art.append(makeLayer('terrain'),makeLayer('trap'),makeLayer('monster'));b.appendChild(art);frag.appendChild(b);
  }
  gridElement.appendChild(frag);renderAll();
}
function renderCell(index){
  const tile=gridElement.children[index],cell=cells[index],layers=tile.querySelectorAll('canvas');
  layers.forEach(c=>clear(c.getContext('2d')));
  const [terrain,trap,monster]=layers;
  const tctx=terrain.getContext('2d');
  if(cell.terrain==='wall')drawWall(tctx);else if(cell.terrain==='room')drawRoom(tctx);else if(cell.terrain==='path')drawPath(tctx);else drawVoid(tctx);
  if(cell.trap)drawTool(trap.getContext('2d'),cell.trap,false);
  if(cell.monster)drawTool(monster.getContext('2d'),cell.monster,false);
  const x=index%GRID_SIZE+1,y=Math.floor(index/GRID_SIZE)+1,p=[];if(cell.terrain)p.push(TOOLS[cell.terrain].name);if(cell.trap)p.push(TOOLS[cell.trap].name);if(cell.monster)p.push(TOOLS[cell.monster].name);tile.setAttribute('aria-label',`${x}, ${y}: ${p.length?p.join(', '):'빈칸'}`);
}
function updateCount(){placedCount.textContent=String(cells.filter(c=>c.terrain||c.trap||c.monster).length)}
function renderAll(){cells.forEach((_,i)=>renderCell(i));updateCount()}
function showToast(msg){clearTimeout(toastTimer);toast.textContent=msg;toast.classList.add('show');toastTimer=setTimeout(()=>toast.classList.remove('show'),1200)}

function placeAt(index){
  if(index<0||index>=cells.length||index===lastPaintedIndex)return;
  const cell=cells[index],tool=TOOLS[selectedTool];let changed=true;
  if(tool.type==='terrain'){
    cell.terrain=selectedTool;
    if(selectedTool==='wall'){cell.trap=null;cell.monster=null}
    else if(selectedTool==='path'){cell.monster=null}
  }else if(tool.type==='trap'){
    if(cell.terrain!=='path'&&cell.terrain!=='room'){changed=false;showToast('함정은 통로 또는 방 위에만 설치할 수 있습니다.')}
    else if(cell.terrain==='room'&&cell.monster){changed=false;showToast('몬스터가 있는 방에는 함정을 설치할 수 없습니다.')}
    else cell.trap=selectedTool;
  }else if(tool.type==='monster'){
    if(cell.terrain!=='room'){changed=false;showToast('몬스터는 방 위에만 배치할 수 있습니다.')}
    else if(cell.trap){changed=false;showToast('함정이 있는 방에는 몬스터를 배치할 수 없습니다.')}
    else cell.monster=selectedTool;
  }else{
    if(cell.monster)cell.monster=null;else if(cell.trap)cell.trap=null;else cell.terrain=null;
  }
  lastPaintedIndex=index;if(!changed)return;renderCell(index);updateCount();
}
function selectTool(name){selectedTool=name;toolButtons.forEach(b=>b.classList.toggle('selected',b.dataset.tool===name));eraserButton.classList.toggle('selected',name==='eraser');selectedName.textContent=TOOLS[name].name;selectedDescription.textContent=TOOLS[name].description;selectedIcon.width=SPRITE;selectedIcon.height=SPRITE;drawTool(selectedIcon.getContext('2d'),name,true)}
function resetMap(){cells.forEach(c=>{c.terrain=null;c.trap=null;c.monster=null});renderAll();showToast('MAP CLEARED')}
function updateHover(target){const tile=target.closest?.('.tile');document.querySelectorAll('.tile.hovered').forEach(el=>el.classList.remove('hovered'));if(!tile){hoverInfo.textContent='X -- / Y --';return}tile.classList.add('hovered');const i=Number(tile.dataset.index);hoverInfo.textContent=`X ${String(i%GRID_SIZE+1).padStart(2,'0')} / Y ${String(Math.floor(i/GRID_SIZE)+1).padStart(2,'0')}`}
function initPalette(){toolButtons.forEach(b=>{const c=b.querySelector('canvas');c.width=SPRITE;c.height=SPRITE;drawTool(c.getContext('2d'),b.dataset.tool,true);b.addEventListener('click',()=>selectTool(b.dataset.tool))});selectedIcon.width=SPRITE;selectedIcon.height=SPRITE}

gridElement.addEventListener('pointerdown',e=>{const tile=e.target.closest('.tile');if(!tile)return;e.preventDefault();pointerDown=true;lastPaintedIndex=-1;gridElement.setPointerCapture?.(e.pointerId);placeAt(Number(tile.dataset.index))});
gridElement.addEventListener('pointermove',e=>{const el=document.elementFromPoint(e.clientX,e.clientY)||e.target;updateHover(el);if(!pointerDown)return;const tile=el?.closest('.tile');if(tile&&gridElement.contains(tile))placeAt(Number(tile.dataset.index))});
window.addEventListener('pointerup',()=>{pointerDown=false;lastPaintedIndex=-1});gridElement.addEventListener('pointerleave',()=>{if(!pointerDown)updateHover(document.body)});gridElement.addEventListener('focusin',e=>updateHover(e.target));
eraserButton.addEventListener('click',()=>selectTool('eraser'));resetButton.addEventListener('click',resetMap);
window.addEventListener('keydown',e=>{const s={'1':'wall','2':'path','3':'room','4':'spike','5':'pit','6':'sticky','7':'slime','8':'goblin','9':'skeleton','0':'eraser','x':'eraser','X':'eraser'};if(s[e.key])selectTool(s[e.key])});

createGrid();initPalette();selectTool('path');
