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
  void:'#0e0c0a',void2:'#17130f',black:'#050403',mortar:'#17130f',stone0:'#28231d',stone1:'#473e33',stone2:'#5c5142',stone3:'#716553',stone4:'#857762',shadow:'#211c17',
  path0:'#332d26',path1:'#453d33',path2:'#584d3f',path3:'#6b5d4b',room0:'#403628',room1:'#594936',room2:'#705c43',room3:'#836c4f',
  steel0:'#363a3a',steel1:'#697071',steel2:'#a4aa9f',steel3:'#d7d8c9',rust:'#81522f',
  slime0:'#263b1c',slime1:'#4f7c2e',slime2:'#78aa43',slime3:'#a8d45d',slime4:'#d8ef93',
  gob0:'#384923',gob1:'#5f7735',gob2:'#809a49',gob3:'#aabb65',leather0:'#3e2719',leather1:'#6b4328',leather2:'#8e5f38',cloth:'#392c25',
  bone0:'#625e52',bone1:'#9c947d',bone2:'#d8cfb1',bone3:'#f0e7c8',sticky0:'#4b4e22',sticky1:'#7d8133',sticky2:'#a7ad46',sticky3:'#d8d968',sticky4:'#f3ed91',eye:'#d8d56e',red:'#7a2e24'
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
function clear(ctx){ctx.clearRect(0,0,SPRITE,SPRITE);ctx.imageSmoothingEnabled=false}
function lineH(ctx,x,y,w,color,t=2){px(ctx,x,y,w,t,color)}
function lineV(ctx,x,y,h,color,t=2){px(ctx,x,y,t,h,color)}

function drawVoid(ctx){px(ctx,0,0,64,64,C.void);[[5,8,10,3],[42,18,13,3],[16,43,9,3],[48,54,5,5],[29,29,4,3]].forEach(r=>px(ctx,...r,C.void2));px(ctx,8,51,3,3,'#231b14')}

function drawWall(ctx){
  px(ctx,0,0,64,64,C.mortar);
  const bricks=[[0,0,25,14],[27,0,37,14],[-8,16,27,14],[21,16,30,14],[53,16,20,14],[0,32,33,14],[35,32,29,14],[-6,48,24,16],[20,48,27,16],[49,48,20,16]];
  bricks.forEach((b,i)=>{px(ctx,b[0],b[1],b[2],b[3],i%3===0?C.stone3:(i%3===1?C.stone2:C.stone1));lineH(ctx,b[0],b[1]+b[3]-3,b[2],C.stone0,3);lineH(ctx,b[0]+3,b[1]+2,Math.max(3,b[2]-7),C.stone4,2)});
  [[10,7,8],[42,10,7],[8,38,10],[49,24,8],[27,55,9]].forEach(([x,y,w])=>lineH(ctx,x,y,w,'#8d8069',2));
  [[13,18,6,5],[38,35,7,5],[53,51,5,4]].forEach(([x,y,w,h])=>{lineV(ctx,x,y,h,'#29231d',2);lineH(ctx,x,y+h-2,w,'#29231d',2)});
}

function drawPath(ctx){
  px(ctx,0,0,64,64,C.path0);
  const slabs=[[2,2,24,17],[29,2,33,17],[2,22,17,18],[22,22,27,18],[52,22,10,18],[2,43,28,19],[33,43,29,19]];
  slabs.forEach((s,i)=>{px(ctx,s[0],s[1],s[2],s[3],i%2?C.path1:C.path2);lineH(ctx,s[0]+2,s[1]+2,s[2]-4,C.path3,2);lineH(ctx,s[0],s[1]+s[3]-2,s[2],C.shadow,2)});
  [[10,12,7],[39,8,10],[7,31,6],[31,29,9],[42,51,8]].forEach(([x,y,w])=>lineH(ctx,x,y,w,'#746450',2));
  [[16,5,3,5],[46,25,4,6],[25,49,3,4]].forEach(([x,y,w,h])=>px(ctx,x,y,w,h,'#393127'));
}

function drawRoom(ctx){
  px(ctx,0,0,64,64,C.room0);
  for(let y=2;y<64;y+=16){for(let x=2;x<64;x+=16){px(ctx,x,y,13,13,(x+y)%32?C.room1:C.room2);lineH(ctx,x+2,y+2,9,C.room3,2);lineV(ctx,x+2,y+5,6,'#67543e',1)}}
  lineH(ctx,0,0,64,'#2b241c',3);lineH(ctx,0,61,64,'#1e1914',3);lineV(ctx,0,0,64,'#2b241c',3);lineV(ctx,61,0,64,'#1e1914',3);
  [[15,15],[31,15],[47,15],[15,31],[31,31],[47,31],[15,47],[31,47],[47,47]].forEach(([x,y])=>px(ctx,x,y,2,2,'#30281f'));
}

function drawSpike(ctx){
  [[5,48,16,8],[24,48,16,8],[43,48,16,8],[12,38,16,7],[36,37,16,7]].forEach(([x,y,w,h])=>{px(ctx,x,y,w,h,C.steel0);lineH(ctx,x+2,y+1,w-4,C.steel1,2);px(ctx,x+3,y+4,3,2,C.rust);px(ctx,x+w-6,y+4,3,2,C.rust)});
  const spikes=[[9,48,10],[17,48,20],[28,48,15],[36,48,28],[47,48,22],[55,48,13],[17,38,18],[25,38,26],[41,37,24],[49,37,15]];
  spikes.forEach(([x,base,h],i)=>{px(ctx,x-2,base-h+5,5,h-5,C.steel1);px(ctx,x-1,base-h+2,3,6,C.steel2);px(ctx,x,base-h,1,4,C.steel3);if(i%2===0)px(ctx,x-1,base-8,2,5,C.steel3)});
}

function drawPit(ctx){
  [[5,13,18,8],[25,10,17,8],[44,13,15,8],[4,42,17,9],[23,46,18,8],[43,42,16,9]].forEach((r,i)=>{px(ctx,...r,i%2?C.stone2:C.stone3);lineH(ctx,r[0]+2,r[1]+2,r[2]-4,C.stone4,2);lineH(ctx,r[0],r[1]+r[3]-2,r[2],C.stone0,2)});
  px(ctx,9,18,46,30,'#1a1612');px(ctx,12,20,40,28,'#0b0908');px(ctx,16,23,34,24,C.black);
  lineH(ctx,16,23,30,'#24201a',2);lineV(ctx,12,24,20,'#2d271f',2);
  [[9,29,4,3],[50,27,5,3],[19,48,5,3],[42,47,4,3]].forEach(r=>px(ctx,...r,C.stone1));
}

function drawSticky(ctx){
  const puddles=[[7,43,50,10],[12,35,40,15],[20,28,26,18],[29,24,15,13],[4,47,20,7],[43,42,16,9]];
  puddles.forEach((r,i)=>px(ctx,...r,i<2?C.sticky1:C.sticky2));
  px(ctx,14,39,36,10,C.sticky2);px(ctx,19,33,28,13,C.sticky3);px(ctx,27,29,14,10,C.sticky2);
  [[18,38,7,3],[34,33,8,3],[45,43,6,3]].forEach(r=>px(ctx,...r,C.sticky4));
  [[12,46,4,4],[30,43,3,3],[51,48,3,3]].forEach(r=>{px(ctx,r[0],r[1],r[2],r[3],C.sticky0);px(ctx,r[0]+1,r[1],1,1,C.sticky4)});
}

function drawSlime(ctx){
  px(ctx,12,49,42,6,'rgba(0,0,0,.35)');
  px(ctx,15,28,36,24,C.slime0);px(ctx,11,36,44,14,C.slime0);px(ctx,19,23,28,8,C.slime0);
  px(ctx,17,29,32,20,C.slime2);px(ctx,13,37,40,11,C.slime2);px(ctx,21,25,24,8,C.slime2);
  px(ctx,20,27,24,8,C.slime3);px(ctx,18,32,14,5,C.slime3);px(ctx,23,27,12,3,C.slime4);
  px(ctx,21,37,7,8,C.black);px(ctx,39,37,7,8,C.black);px(ctx,23,38,2,2,'#f1f0ca');px(ctx,41,38,2,2,'#f1f0ca');
  px(ctx,29,45,10,3,C.slime0);px(ctx,31,46,6,2,'#6d8d39');px(ctx,47,33,4,4,C.slime3);px(ctx,48,32,2,2,C.slime4);px(ctx,15,42,3,3,C.slime3);
}

function drawGoblin(ctx){
  px(ctx,16,55,38,5,'rgba(0,0,0,.35)');
  px(ctx,12,18,10,11,C.gob0);px(ctx,46,18,10,11,C.gob0);px(ctx,20,12,28,26,C.gob0);
  px(ctx,14,19,10,7,C.gob2);px(ctx,44,19,10,7,C.gob2);px(ctx,22,14,24,22,C.gob2);px(ctx,25,12,18,5,C.gob3);
  px(ctx,25,21,7,4,C.gob0);px(ctx,38,21,7,4,C.gob0);px(ctx,27,23,4,4,C.black);px(ctx,39,23,4,4,C.black);px(ctx,28,23,1,1,'#f1e7b0');px(ctx,40,23,1,1,'#f1e7b0');
  px(ctx,33,26,5,5,C.gob1);px(ctx,31,31,10,3,'#5a2d1f');px(ctx,34,31,2,2,'#cbb37b');
  px(ctx,21,37,28,18,C.leather0);px(ctx,24,37,22,16,C.leather1);px(ctx,28,39,14,4,C.leather2);lineV(ctx,34,39,14,'#3d2719',2);px(ctx,23,46,24,3,'#3c2a20');
  px(ctx,17,39,7,15,C.gob1);px(ctx,47,38,7,16,C.gob1);px(ctx,24,53,8,8,C.gob0);px(ctx,40,53,8,8,C.gob0);
  px(ctx,51,36,4,20,C.steel1);px(ctx,52,32,3,8,C.steel2);px(ctx,53,30,1,5,C.steel3);px(ctx,48,47,11,4,C.leather2);px(ctx,33,47,6,5,C.steel0);px(ctx,34,48,4,3,C.steel2);
}

function drawSkeleton(ctx){
  px(ctx,15,56,40,4,'rgba(0,0,0,.35)');
  px(ctx,23,10,25,21,C.bone0);px(ctx,25,9,21,20,C.bone2);px(ctx,29,7,14,4,C.bone3);px(ctx,27,13,17,14,C.bone3);
  px(ctx,29,16,6,6,C.black);px(ctx,39,16,6,6,C.black);px(ctx,31,17,2,2,'#6fa6b8');px(ctx,41,17,2,2,'#6fa6b8');px(ctx,35,22,4,4,C.bone0);px(ctx,31,27,14,4,C.bone1);px(ctx,33,27,2,3,C.black);px(ctx,39,27,2,3,C.black);
  px(ctx,34,31,5,23,C.bone2);px(ctx,25,33,24,4,C.bone2);px(ctx,22,37,8,4,C.bone1);px(ctx,44,37,8,4,C.bone1);
  [[26,36,19],[27,41,17],[29,46,13]].forEach(([x,y,w])=>{lineH(ctx,x,y,w,C.bone2,3);lineV(ctx,x,y,5,C.bone1,2);lineV(ctx,x+w-2,y,5,C.bone1,2)});
  px(ctx,19,38,4,17,C.bone1);px(ctx,50,38,4,17,C.bone1);px(ctx,28,52,5,10,C.bone2);px(ctx,41,52,5,10,C.bone2);px(ctx,26,60,9,3,C.bone1);px(ctx,40,60,9,3,C.bone1);
  px(ctx,54,30,4,28,C.steel1);px(ctx,55,26,3,8,C.steel2);px(ctx,56,23,1,5,C.steel3);px(ctx,50,47,12,4,C.leather2);
}

function drawEraser(ctx){drawVoid(ctx);px(ctx,17,17,30,30,'#5a231f');px(ctx,20,20,24,24,'#a94e40');px(ctx,25,25,14,14,'#d9765f');px(ctx,29,29,6,6,'#f1d7a8')}

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
