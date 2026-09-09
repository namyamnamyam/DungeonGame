const GRID_SIZE = 5;
const SPRITE = 64;

const TOOLS = {
  wall:{name:'벽',type:'terrain',description:'두꺼운 석벽을 배치합니다.'},
  path:{name:'통로',type:'terrain',description:'돌바닥 통로를 배치합니다.'},
  room:{name:'방',type:'terrain',description:'넓은 석실 바닥을 배치합니다.'},
  spike:{name:'가시 함정',type:'trap',description:'통로나 빈 방 위에 설치하는 쇠가시 함정입니다.'},
  pit:{name:'구덩이 함정',type:'trap',description:'통로나 빈 방 위에 설치하는 깊은 구덩이 함정입니다.'},
  sticky:{name:'끈끈이 함정',type:'trap',description:'통로나 빈 방 위에 설치하는 끈적한 점액 웅덩이입니다.'},
  slime:{name:'슬라임',type:'monster',description:'함정이 없는 방에만 배치할 수 있는 말랑한 하급 몬스터입니다.'},
  goblin:{name:'고블린',type:'monster',description:'함정이 없는 방에만 배치할 수 있는 장난꾸러기 던전 잡병입니다.'},
  skeleton:{name:'스켈레톤',type:'monster',description:'함정이 없는 방에만 배치할 수 있는 가벼운 언데드 병사입니다.'},
  eraser:{name:'지우개',type:'eraser',description:'몬스터 또는 함정을 먼저 지우고, 그다음 지형을 지웁니다.'}
};

const C = {
  void:'#100e0c',void2:'#191510',black:'#0b0907',mortar:'#17130f',
  stone0:'#2d2822',stone1:'#40382f',stone2:'#554a3d',stone3:'#6a5d4b',stone4:'#81715b',stone5:'#9d8b70',
  path0:'#342e27',path1:'#443c33',path2:'#564b3e',path3:'#6b5e4c',path4:'#81705a',
  room0:'#3a3025',room1:'#50402f',room2:'#614e39',room3:'#786147',room4:'#91765a',
  steel0:'#3f4647',steel1:'#656e6f',steel2:'#899192',steel3:'#b5bab4',steel4:'#e0e0d4',rust:'#885536',
  slime0:'#315325',slime1:'#4d7d34',slime2:'#70aa46',slime3:'#99ca61',slime4:'#c0e47d',slime5:'#eff8b7',
  gob0:'#49652e',gob1:'#668943',gob2:'#83a754',gob3:'#a8c66d',gob4:'#d0dc91',
  leather0:'#4a301f',leather1:'#694328',leather2:'#8d5d36',leather3:'#b67a45',cloth:'#40332a',
  bone0:'#8c846f',bone1:'#b2a98f',bone2:'#d7ceb0',bone3:'#eee5c8',bone4:'#fff4d8',
  sticky0:'#5d6326',sticky1:'#838b35',sticky2:'#aeb84b',sticky3:'#ced660',sticky4:'#e9eb83',sticky5:'#fff4aa',
  eye:'#33281d',cheek:'#d88972',shadow:'rgba(0,0,0,.24)'
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
  [[11,17],[49,27],[23,48],[37,14],[56,35]].forEach(([x,y])=>dot(ctx,x,y,'#251e17'));
}

function brick(ctx,x,y,w,hh,fill,seed){
  px(ctx,x,y,w,hh,fill);h(ctx,x+1,y+1,Math.max(1,w-2),C.stone5);h(ctx,x+1,y+hh-2,Math.max(1,w-2),C.stone0);v(ctx,x+w-2,y+2,Math.max(1,hh-4),C.stone1);
  if(seed%2===0)h(ctx,x+4,y+4,Math.min(6,w-7),'#8d7c65');
  if(seed%3===0){dot(ctx,x+Math.max(2,w-5),y+3,C.stone0);dot(ctx,x+Math.max(3,w-4),y+4,C.stone0)}
  if(seed%4===0&&w>13){h(ctx,x+6,y+hh-5,4,C.stone2);dot(ctx,x+10,y+hh-4,C.stone2)}
}
function drawWall(ctx){
  px(ctx,0,0,64,64,C.mortar);
  const rows=[[[ -4,0,17],[14,0,22],[37,0,15],[53,0,15]],[[-9,11,20],[12,11,17],[30,11,22],[53,11,16]],[[-3,22,25],[23,22,15],[39,22,20],[60,22,12]],[[-7,33,18],[12,33,23],[36,33,14],[51,33,20]],[[-2,44,22],[21,44,18],[40,44,24]],[[-8,55,19],[12,55,16],[29,55,21],[51,55,18]]];
  rows.forEach((row,ri)=>row.forEach((b,bi)=>brick(ctx,b[0],b[1],b[2],9,[C.stone2,C.stone3,C.stone4][(ri+bi)%3],ri*5+bi)));
  [[8,15,4],[31,4,5],[44,27,5],[18,48,4],[53,59,4]].forEach(([x,y,w])=>h(ctx,x,y,w,C.stone0));
  [[3,2],[27,13],[5,36],[42,46],[57,24]].forEach(([x,y])=>{dot(ctx,x,y,'#ad9a7d');dot(ctx,x+1,y,'#8e7f68')});
}
function slab(ctx,x,y,w,hh,fill,seed){
  px(ctx,x,y,w,hh,fill);h(ctx,x+1,y+1,w-2,C.path4);h(ctx,x+1,y+hh-2,w-2,C.path0);v(ctx,x+w-2,y+2,hh-4,C.path1);
  if(seed%2===0){h(ctx,x+4,y+5,Math.min(7,w-8),C.path3);dot(ctx,x+4,y+6,C.path4)}
  if(seed%3===0){dot(ctx,x+w-5,y+3,C.path0);dot(ctx,x+w-6,y+4,C.path0)}
}
function drawPath(ctx){
  px(ctx,0,0,64,64,C.path0);
  [[1,1,19,14],[21,1,15,14],[37,1,26,14],[1,16,13,15],[15,16,25,15],[41,16,22,15],[1,32,22,14],[24,32,17,14],[42,32,21,14],[1,47,16,16],[18,47,28,16],[47,47,16,16]].forEach((s,i)=>slab(ctx,...s,[C.path1,C.path2,C.path3][i%3],i));
  [[9,24],[33,12],[51,39],[28,53],[4,43],[58,9]].forEach(([x,y])=>dot(ctx,x,y,'#8b7962'));
}
function drawRoom(ctx){
  px(ctx,0,0,64,64,C.room0);
  for(let y=2;y<=54;y+=13){for(let x=2;x<=54;x+=13){const idx=((x+y)/13)|0,fill=[C.room1,C.room2,C.room3][idx%3];px(ctx,x,y,11,11,fill);h(ctx,x+1,y+1,9,C.room4);h(ctx,x+1,y+9,9,'#44372a');v(ctx,x+9,y+2,7,'#504030');if((x+y)%26===0)dot(ctx,x+3,y+4,'#a88a67')}}
  frame(ctx,0,0,64,64,'#66513d','#251e17');
}

function cuteSpike(ctx,cx,base,height){
  const top=base-height;dot(ctx,cx,top,C.steel4);px(ctx,cx-1,top+1,3,2,C.steel3);px(ctx,cx-2,top+3,5,Math.max(3,height-7),C.steel2);px(ctx,cx-1,top+4,2,Math.max(2,height-9),C.steel4);px(ctx,cx-3,base-4,7,4,C.steel1);
}
function drawSpike(ctx){
  px(ctx,6,46,52,9,C.steel0);frame(ctx,6,46,52,9,C.steel2,'#293031');
  [[11,46,14],[18,46,20],[25,46,16],[32,46,24],[39,46,18],[46,46,22],[53,46,15],[16,40,13],[24,40,18],[34,40,15],[43,40,20],[51,40,14]].forEach(([x,b,hh])=>cuteSpike(ctx,x,b,hh));
  for(let x=10;x<56;x+=9){dot(ctx,x,50,C.rust);dot(ctx,x+1,50,C.steel3)}
}
function drawPit(ctx){
  const rim=[[6,17,12,7],[19,14,12,7],[32,13,12,7],[45,16,13,7],[5,24,8,12],[52,24,8,12],[7,42,13,8],[21,46,11,7],[33,46,11,7],[45,42,13,8]];
  rim.forEach((r,i)=>{px(ctx,...r,[C.stone2,C.stone3,C.stone4][i%3]);h(ctx,r[0]+1,r[1]+1,r[2]-2,C.stone5);h(ctx,r[0]+1,r[1]+r[3]-2,r[2]-2,C.stone0)});
  px(ctx,12,20,40,28,'#2b241d');px(ctx,15,22,34,25,'#1a1612');px(ctx,18,24,28,22,'#100e0c');px(ctx,21,27,22,18,C.black);
  h(ctx,21,27,18,'#252019');dot(ctx,12,33,'#9a896f');dot(ctx,50,31,'#8b7b65');
}
function drawSticky(ctx){
  [[19,29,27],[15,31,35],[12,34,41],[9,37,47],[7,40,51],[9,43,47],[12,46,41],[17,49,31]].forEach(([x,y,w],i)=>h(ctx,x,y,w,[C.sticky3,C.sticky3,C.sticky2,C.sticky2,C.sticky1,C.sticky2,C.sticky2,C.sticky1][i],3));
  h(ctx,20,30,14,C.sticky4,2);h(ctx,15,36,10,C.sticky5);h(ctx,36,39,12,C.sticky4,2);h(ctx,25,46,9,C.sticky5);
  [[18,41,3],[31,36,2],[45,43,3],[36,47,2],[13,44,2]].forEach(([x,y,s])=>{px(ctx,x,y,s,s,C.sticky0);dot(ctx,x+1,y,C.sticky5)});
  [[24,34],[42,35],[30,49],[50,41]].forEach(([x,y])=>{dot(ctx,x,y,C.sticky5);dot(ctx,x+1,y,C.sticky4)});
}

function drawSlime(ctx){
  shadow(ctx,15,54,35,3);
  const bands=[[27,20,10],[23,21,18],[20,23,24],[18,26,28],[16,30,32],[14,35,36],[13,40,38],[14,45,36],[17,49,30],[21,52,22]];
  bands.forEach(([x,y,w])=>h(ctx,x,y,w,C.slime0,3));
  [[28,22,8],[23,23,18],[20,25,24],[18,28,28],[17,32,30],[16,36,32],[16,40,32],[17,44,30],[20,48,24],[24,51,16]].forEach(([x,y,w],i)=>h(ctx,x,y,w,[C.slime3,C.slime3,C.slime4,C.slime3,C.slime3,C.slime2,C.slime2,C.slime3,C.slime2,C.slime1][i],3));
  h(ctx,25,23,13,C.slime5,2);h(ctx,21,27,9,C.slime4);dot(ctx,38,26,C.slime5);dot(ctx,45,33,C.slime4);
  px(ctx,20,35,9,9,C.slime5);px(ctx,37,35,9,9,C.slime5);px(ctx,23,38,4,4,C.eye);px(ctx,40,38,4,4,C.eye);dot(ctx,23,37,'#fffde5');dot(ctx,40,37,'#fffde5');
  h(ctx,29,45,8,C.eye,2);dot(ctx,28,44,C.eye);dot(ctx,37,44,C.eye);px(ctx,18,45,3,2,C.cheek);px(ctx,46,45,3,2,C.cheek);
  [[19,32],[47,37],[22,47],[40,30],[34,50]].forEach(([x,y])=>dot(ctx,x,y,C.slime5));
}

function drawGoblin(ctx){
  shadow(ctx,17,58,34,3);
  [[12,23,7],[10,25,10],[11,28,10],[14,31,8]].forEach(([x,y,w])=>h(ctx,x,y,w,C.gob1,2));
  [[45,23,7],[44,25,10],[43,28,10],[44,31,8]].forEach(([x,y,w])=>h(ctx,x,y,w,C.gob1,2));
  h(ctx,11,26,6,C.gob3);h(ctx,47,26,6,C.gob3);dot(ctx,13,27,C.gob4);dot(ctx,50,27,C.gob4);
  [[26,13,13],[22,15,21],[19,18,27],[18,22,29],[18,27,29],[20,32,25],[24,35,17]].forEach(([x,y,w])=>h(ctx,x,y,w,C.gob0,3));
  [[27,15,11],[23,17,19],[21,20,23],[20,24,25],[20,28,25],[22,32,21]].forEach(([x,y,w],i)=>h(ctx,x,y,w,[C.gob3,C.gob3,C.gob2,C.gob3,C.gob2,C.gob1][i],3));
  h(ctx,27,14,10,C.gob4);h(ctx,23,18,7,C.gob3);dot(ctx,39,18,C.gob4);
  px(ctx,22,23,9,8,'#f2e9c7');px(ctx,36,23,9,8,'#f2e9c7');px(ctx,25,26,4,4,C.eye);px(ctx,38,26,4,4,C.eye);dot(ctx,25,25,'#ffffff');dot(ctx,38,25,'#ffffff');
  px(ctx,31,29,5,4,C.gob1);dot(ctx,31,32,C.gob0);dot(ctx,36,32,C.gob0);h(ctx,27,34,13,'#68412b',2);dot(ctx,30,34,'#fff1ca');dot(ctx,37,34,'#fff1ca');px(ctx,24,33,3,2,C.cheek);px(ctx,42,33,3,2,C.cheek);
  px(ctx,23,38,22,17,C.leather0);px(ctx,25,38,18,16,C.leather1);h(ctx,27,39,14,C.leather3,2);v(ctx,33,40,13,C.leather0,2);h(ctx,24,47,20,C.cloth,3);
  px(ctx,18,40,6,14,C.gob2);px(ctx,44,40,6,14,C.gob2);h(ctx,19,41,4,C.gob4);h(ctx,45,41,4,C.gob4);
  px(ctx,26,54,6,7,C.gob1);px(ctx,38,54,6,7,C.gob1);h(ctx,24,60,9,C.leather0,2);h(ctx,37,60,9,C.leather0,2);
  px(ctx,50,42,3,14,'#6f4a2c');px(ctx,49,40,5,4,'#8d6137');dot(ctx,52,41,'#b07c49');
  [[28,44],[40,44],[30,50]].forEach(([x,y])=>dot(ctx,x,y,'#d09157'));
}

function drawSkeleton(ctx){
  shadow(ctx,17,59,32,3);
  [[28,11,11],[24,12,19],[22,15,23],[21,19,25],[22,24,23],[25,28,17]].forEach(([x,y,w])=>h(ctx,x,y,w,C.bone0,3));
  [[29,12,9],[25,14,17],[24,17,19],[23,21,21],[25,25,17]].forEach(([x,y,w],i)=>h(ctx,x,y,w,[C.bone4,C.bone3,C.bone4,C.bone3,C.bone2][i],3));
  h(ctx,29,13,8,C.bone4);dot(ctx,25,17,'#fff8df');dot(ctx,42,18,C.bone1);
  px(ctx,26,20,6,5,C.eye);px(ctx,38,20,6,5,C.eye);dot(ctx,27,20,'#5a4937');dot(ctx,39,20,'#5a4937');
  px(ctx,33,25,4,3,C.bone0);h(ctx,28,29,14,C.bone1,2);h(ctx,30,29,10,C.bone3);[31,34,37].forEach(x=>v(ctx,x,29,2,C.bone0));
  px(ctx,33,33,5,19,C.bone2);h(ctx,26,35,20,C.bone3,3);
  [[28,39,16],[29,43,14],[30,47,12]].forEach(([x,y,w])=>{h(ctx,x,y,w,C.bone2,2);dot(ctx,x-1,y+1,C.bone1);dot(ctx,x+w,y+1,C.bone1)});
  px(ctx,22,38,3,15,C.bone2);px(ctx,47,38,3,15,C.bone2);dot(ctx,23,54,C.bone4);dot(ctx,48,54,C.bone4);
  h(ctx,29,52,14,C.bone1,3);px(ctx,29,55,5,6,C.bone2);px(ctx,39,55,5,6,C.bone2);h(ctx,27,60,8,C.bone1,2);h(ctx,38,60,8,C.bone1,2);
  px(ctx,49,39,7,12,'#6f6555');frame(ctx,49,39,7,12,'#a79a82','#4f493f');dot(ctx,52,44,'#d5c6a8');
}

function drawEraser(ctx){drawVoid(ctx);px(ctx,18,19,28,26,'#5d2721');px(ctx,20,21,24,22,'#a94d41');px(ctx,23,23,18,16,'#d66d5b');h(ctx,26,26,12,'#ef9d80',2);h(ctx,29,32,7,'#f0d3a7',3)}
function drawTool(ctx,tool,withBg=true){
  clear(ctx);if(tool==='wall')return drawWall(ctx);if(tool==='path')return drawPath(ctx);if(tool==='room')return drawRoom(ctx);if(tool==='eraser')return drawEraser(ctx);
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
  const tile=gridElement.children[index],cell=cells[index],layers=tile.querySelectorAll('canvas');layers.forEach(c=>clear(c.getContext('2d')));
  const [terrain,trap,monster]=layers,tctx=terrain.getContext('2d');
  if(cell.terrain==='wall')drawWall(tctx);else if(cell.terrain==='room')drawRoom(tctx);else if(cell.terrain==='path')drawPath(tctx);else drawVoid(tctx);
  if(cell.trap)drawTool(trap.getContext('2d'),cell.trap,false);if(cell.monster)drawTool(monster.getContext('2d'),cell.monster,false);
  const x=index%GRID_SIZE+1,y=Math.floor(index/GRID_SIZE)+1,p=[];if(cell.terrain)p.push(TOOLS[cell.terrain].name);if(cell.trap)p.push(TOOLS[cell.trap].name);if(cell.monster)p.push(TOOLS[cell.monster].name);tile.setAttribute('aria-label',`${x}, ${y}: ${p.length?p.join(', '):'빈칸'}`);
}
function updateCount(){placedCount.textContent=String(cells.filter(c=>c.terrain||c.trap||c.monster).length)}
function renderAll(){cells.forEach((_,i)=>renderCell(i));updateCount()}
function showToast(msg){clearTimeout(toastTimer);toast.textContent=msg;toast.classList.add('show');toastTimer=setTimeout(()=>toast.classList.remove('show'),1200)}
function placeAt(index){
  if(index<0||index>=cells.length||index===lastPaintedIndex)return;
  const cell=cells[index],tool=TOOLS[selectedTool];let changed=true;
  if(tool.type==='terrain'){
    cell.terrain=selectedTool;if(selectedTool==='wall'){cell.trap=null;cell.monster=null}else if(selectedTool==='path'){cell.monster=null}
  }else if(tool.type==='trap'){
    if(cell.terrain!=='path'&&cell.terrain!=='room'){changed=false;showToast('함정은 통로 또는 방 위에만 설치할 수 있습니다.')}
    else if(cell.terrain==='room'&&cell.monster){changed=false;showToast('몬스터가 있는 방에는 함정을 설치할 수 없습니다.')}
    else cell.trap=selectedTool;
  }else if(tool.type==='monster'){
    if(cell.terrain!=='room'){changed=false;showToast('몬스터는 방 위에만 배치할 수 있습니다.')}
    else if(cell.trap){changed=false;showToast('함정이 있는 방에는 몬스터를 배치할 수 없습니다.')}
    else cell.monster=selectedTool;
  }else{if(cell.monster)cell.monster=null;else if(cell.trap)cell.trap=null;else cell.terrain=null}
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
