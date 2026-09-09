const GRID_SIZE = 5;
const SPRITE_SIZE = 32;

const TOOLS = {
  wall: { name: '벽', type: 'terrain', description: '두꺼운 석벽을 배치합니다.' },
  path: { name: '통로', type: 'terrain', description: '돌바닥 통로를 배치합니다.' },
  room: { name: '방', type: 'terrain', description: '넓은 석실 바닥을 배치합니다.' },
  spike: { name: '가시 함정', type: 'trap', description: '통로나 빈 방 위에 설치하는 쇠가시 함정입니다.' },
  pit: { name: '구덩이 함정', type: 'trap', description: '통로나 빈 방 위에 설치하는 깊은 구덩이 함정입니다.' },
  sticky: { name: '끈끈이 함정', type: 'trap', description: '통로나 빈 방 위에 설치하는 끈적한 점액 웅덩이입니다.' },
  slime: { name: '슬라임', type: 'monster', description: '함정이 없는 방에만 배치할 수 있는 하급 몬스터입니다.' },
  goblin: { name: '고블린', type: 'monster', description: '함정이 없는 방에만 배치할 수 있는 던전 잡병입니다.' },
  skeleton: { name: '스켈레톤', type: 'monster', description: '함정이 없는 방에만 배치할 수 있는 기본 언데드 병사입니다.' },
  eraser: { name: '지우개', type: 'eraser', description: '몬스터 또는 함정을 먼저 지우고, 그다음 지형을 지웁니다.' }
};

const COLORS = {
  void: '#0e0c0a', void2: '#15120f', void3: '#211a14',
  mortar: '#17130f', stone1: '#4c453a', stone2: '#615748', stone3: '#332e28', stone4: '#786c58',
  path1: '#484035', path2: '#5a5041', path3: '#362f28', path4: '#6a5f4d',
  room1: '#5c4d3a', room2: '#725e45', room3: '#413529', room4: '#8a7353',
  shadow: '#211c17', black: '#080706',
  bone: '#ddd3b5', boneLight: '#f2e8ca', boneDark: '#958b72',
  green: '#78a743', greenLight: '#a7d45d', greenDark: '#3f6329', greenDeep: '#28451d',
  goblin: '#72883c', goblinLight: '#a0b85b', goblinDark: '#425523',
  leather: '#70482c', leatherLight: '#99613a',
  metal: '#a9a89b', metalLight: '#deddd0', metalDark: '#626258',
  sticky: '#a5a743', stickyLight: '#d0ca5b', stickyDark: '#696d2d',
  red: '#8e3d32', gold: '#d7a93d'
};

const gridElement = document.getElementById('grid');
const resetButton = document.getElementById('resetButton');
const eraserButton = document.getElementById('eraserButton');
const toolButtons = [...document.querySelectorAll('.tool-button')];
const selectedName = document.getElementById('selectedName');
const selectedDescription = document.getElementById('selectedDescription');
const selectedIcon = document.getElementById('selectedIcon');
const hoverInfo = document.getElementById('hoverInfo');
const placedCount = document.getElementById('placedCount');
const toast = document.getElementById('toast');

let selectedTool = 'path';
let pointerDown = false;
let lastPaintedIndex = -1;
let toastTimer = null;

const cells = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => ({
  terrain: null,
  trap: null,
  monster: null
}));

function pixel(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.imageSmoothingEnabled = false;
}

function ensureCanvas32(canvas) {
  if (canvas.width !== SPRITE_SIZE || canvas.height !== SPRITE_SIZE) {
    canvas.width = SPRITE_SIZE;
    canvas.height = SPRITE_SIZE;
  }
}

function drawVoid(ctx) {
  pixel(ctx, 0, 0, 32, 32, COLORS.void);
  pixel(ctx, 2, 4, 5, 2, COLORS.void2);
  pixel(ctx, 23, 7, 6, 2, COLORS.void2);
  pixel(ctx, 11, 23, 4, 2, COLORS.void2);
  pixel(ctx, 27, 27, 2, 2, COLORS.void3);
  pixel(ctx, 5, 16, 3, 1, '#1b1612');
  pixel(ctx, 19, 19, 5, 1, '#1b1612');
}

function drawWall(ctx) {
  pixel(ctx, 0, 0, 32, 32, COLORS.mortar);
  const blocks = [
    [0,0,12,7],[13,0,10,7],[24,0,8,7],
    [-4,8,12,7],[9,8,13,7],[23,8,13,7],
    [0,16,15,7],[16,16,9,7],[26,16,8,7],
    [-3,24,11,8],[9,24,14,8],[24,24,11,8]
  ];
  blocks.forEach((b, i) => {
    const base = i % 4 === 0 ? COLORS.stone2 : COLORS.stone1;
    pixel(ctx, b[0], b[1], b[2], b[3], base);
    pixel(ctx, b[0], b[1] + b[3] - 2, b[2], 2, COLORS.stone3);
    if (i % 3 === 0) pixel(ctx, b[0] + 3, b[1] + 2, Math.max(2, b[2] - 6), 1, COLORS.stone4);
  });
  pixel(ctx, 6, 11, 4, 1, '#82745f');
  pixel(ctx, 19, 19, 3, 1, '#82745f');
  pixel(ctx, 3, 28, 3, 1, '#2a251f');
}

function drawPath(ctx) {
  pixel(ctx, 0, 0, 32, 32, COLORS.path1);
  for (let y = 0; y < 32; y += 8) pixel(ctx, 0, y, 32, 2, COLORS.path3);
  const joints = [5,20,11,26];
  joints.forEach((x, i) => pixel(ctx, x, i * 8, 2, 8, COLORS.path3));
  pixel(ctx, 3, 3, 7, 2, COLORS.path2);
  pixel(ctx, 15, 11, 8, 2, COLORS.path4);
  pixel(ctx, 4, 19, 6, 2, COLORS.path2);
  pixel(ctx, 19, 27, 7, 2, COLORS.path4);
  pixel(ctx, 28, 4, 2, 2, '#2b261f');
  pixel(ctx, 11, 26, 2, 2, '#342d24');
}

function drawRoom(ctx) {
  pixel(ctx, 0, 0, 32, 32, COLORS.room1);
  for (let y = 0; y < 32; y += 8) pixel(ctx, 0, y, 32, 2, COLORS.room3);
  for (let x = 0; x < 32; x += 8) pixel(ctx, x, 0, 2, 32, COLORS.room3);
  pixel(ctx, 2, 2, 5, 4, COLORS.room2);
  pixel(ctx, 18, 3, 5, 3, COLORS.room4);
  pixel(ctx, 10, 11, 5, 4, '#66533e');
  pixel(ctx, 25, 11, 5, 4, COLORS.room2);
  pixel(ctx, 3, 19, 5, 4, '#65513c');
  pixel(ctx, 18, 19, 5, 4, COLORS.room4);
  pixel(ctx, 10, 27, 5, 3, COLORS.room2);
  pixel(ctx, 26, 26, 3, 3, '#4a3b2e');
}

function drawSpike(ctx) {
  pixel(ctx, 3, 25, 26, 3, '#44463f');
  pixel(ctx, 5, 28, 22, 2, '#2e302c');
  const spikes = [4,8,12,16,20,24,27];
  spikes.forEach((x, i) => {
    const h = i % 3 === 0 ? 12 : (i % 2 ? 9 : 11);
    pixel(ctx, x, 25 - h, 3, h, COLORS.metalDark);
    pixel(ctx, x + 1, 25 - h, 1, h - 1, COLORS.metal);
    pixel(ctx, x + 1, 25 - h, 1, 2, COLORS.metalLight);
  });
  pixel(ctx, 7, 27, 4, 1, '#77786f');
  pixel(ctx, 21, 27, 4, 1, '#77786f');
}

function drawPit(ctx) {
  pixel(ctx, 5, 9, 22, 16, '#2a241d');
  pixel(ctx, 7, 10, 18, 15, '#11100e');
  pixel(ctx, 9, 12, 14, 12, '#050505');
  pixel(ctx, 11, 14, 10, 9, '#000000');
  pixel(ctx, 4, 8, 8, 3, '#716451');
  pixel(ctx, 21, 8, 7, 3, '#554b3e');
  pixel(ctx, 4, 24, 9, 3, '#554b3e');
  pixel(ctx, 20, 24, 8, 3, '#716451');
  pixel(ctx, 5, 11, 2, 7, '#81725c');
  pixel(ctx, 25, 17, 2, 5, '#3d352c');
}

function drawSticky(ctx) {
  pixel(ctx, 4, 20, 24, 7, COLORS.stickyDark);
  pixel(ctx, 7, 17, 18, 10, COLORS.sticky);
  pixel(ctx, 11, 15, 11, 11, COLORS.sticky);
  pixel(ctx, 3, 22, 5, 3, COLORS.sticky);
  pixel(ctx, 24, 19, 5, 5, COLORS.sticky);
  pixel(ctx, 8, 18, 5, 2, COLORS.stickyLight);
  pixel(ctx, 18, 17, 4, 2, COLORS.stickyLight);
  pixel(ctx, 22, 22, 3, 2, '#eee482');
  pixel(ctx, 12, 24, 2, 2, '#6a6d30');
  pixel(ctx, 6, 25, 4, 1, '#5c6028');
}

function drawSlime(ctx) {
  pixel(ctx, 8, 26, 17, 2, 'rgba(0,0,0,.35)');
  pixel(ctx, 8, 12, 17, 12, COLORS.greenDark);
  pixel(ctx, 6, 16, 21, 9, COLORS.green);
  pixel(ctx, 10, 9, 13, 5, COLORS.green);
  pixel(ctx, 12, 8, 9, 3, COLORS.greenLight);
  pixel(ctx, 9, 13, 5, 2, '#8fc754');
  pixel(ctx, 10, 16, 4, 4, COLORS.black);
  pixel(ctx, 21, 16, 4, 4, COLORS.black);
  pixel(ctx, 11, 16, 1, 1, '#e0f3a7');
  pixel(ctx, 22, 16, 1, 1, '#e0f3a7');
  pixel(ctx, 15, 22, 6, 2, COLORS.greenDeep);
  pixel(ctx, 5, 23, 5, 2, COLORS.green);
  pixel(ctx, 24, 23, 5, 2, COLORS.green);
}

function drawGoblin(ctx) {
  pixel(ctx, 8, 28, 17, 2, 'rgba(0,0,0,.4)');
  pixel(ctx, 4, 9, 6, 4, COLORS.goblinDark);
  pixel(ctx, 22, 9, 6, 4, COLORS.goblinDark);
  pixel(ctx, 5, 8, 5, 3, COLORS.goblinLight);
  pixel(ctx, 22, 8, 5, 3, COLORS.goblinLight);
  pixel(ctx, 9, 6, 14, 12, COLORS.goblin);
  pixel(ctx, 11, 5, 10, 3, COLORS.goblinLight);
  pixel(ctx, 11, 10, 3, 3, COLORS.black);
  pixel(ctx, 19, 10, 3, 3, COLORS.black);
  pixel(ctx, 12, 10, 1, 1, '#d8e29c');
  pixel(ctx, 20, 10, 1, 1, '#d8e29c');
  pixel(ctx, 15, 14, 4, 2, '#4c2c1c');
  pixel(ctx, 9, 18, 14, 8, COLORS.leather);
  pixel(ctx, 11, 18, 10, 2, COLORS.leatherLight);
  pixel(ctx, 6, 19, 4, 8, COLORS.goblin);
  pixel(ctx, 23, 19, 4, 8, COLORS.goblin);
  pixel(ctx, 11, 26, 4, 4, COLORS.goblinDark);
  pixel(ctx, 19, 26, 4, 4, COLORS.goblinDark);
  pixel(ctx, 3, 21, 4, 2, COLORS.leather);
  pixel(ctx, 1, 18, 3, 7, COLORS.metalDark);
  pixel(ctx, 2, 16, 2, 4, COLORS.metal);
  pixel(ctx, 2, 15, 1, 2, COLORS.metalLight);
}

function drawSkeleton(ctx) {
  pixel(ctx, 8, 29, 18, 2, 'rgba(0,0,0,.4)');
  pixel(ctx, 10, 5, 13, 11, COLORS.bone);
  pixel(ctx, 12, 4, 9, 3, COLORS.boneLight);
  pixel(ctx, 12, 8, 3, 3, COLORS.black);
  pixel(ctx, 19, 8, 3, 3, COLORS.black);
  pixel(ctx, 16, 11, 2, 2, COLORS.boneDark);
  pixel(ctx, 14, 14, 6, 2, COLORS.boneDark);
  pixel(ctx, 15, 14, 1, 1, COLORS.black);
  pixel(ctx, 18, 14, 1, 1, COLORS.black);
  pixel(ctx, 16, 16, 2, 10, COLORS.bone);
  pixel(ctx, 10, 18, 14, 2, COLORS.bone);
  pixel(ctx, 11, 21, 12, 2, COLORS.boneDark);
  pixel(ctx, 12, 24, 10, 2, COLORS.bone);
  pixel(ctx, 8, 18, 2, 9, COLORS.boneDark);
  pixel(ctx, 24, 17, 2, 10, COLORS.boneDark);
  pixel(ctx, 12, 26, 2, 5, COLORS.bone);
  pixel(ctx, 20, 26, 2, 5, COLORS.bone);
  pixel(ctx, 27, 10, 2, 16, COLORS.metalDark);
  pixel(ctx, 28, 8, 2, 17, COLORS.metal);
  pixel(ctx, 29, 7, 1, 3, COLORS.metalLight);
  pixel(ctx, 25, 24, 6, 2, COLORS.leather);
}

function drawEraser(ctx) {
  drawVoid(ctx);
  pixel(ctx, 8, 8, 16, 16, '#87382f');
  pixel(ctx, 10, 10, 12, 12, '#b85648');
  pixel(ctx, 13, 13, 6, 6, '#ead7a5');
  pixel(ctx, 11, 11, 3, 3, '#ead7a5');
  pixel(ctx, 19, 19, 3, 3, '#ead7a5');
}

function drawBase(ctx, terrain) {
  clearCanvas(ctx);
  if (terrain === 'wall') drawWall(ctx);
  else if (terrain === 'room') drawRoom(ctx);
  else if (terrain === 'path') drawPath(ctx);
  else drawVoid(ctx);
}

function drawOverlay(ctx, tool) {
  clearCanvas(ctx);
  if (tool === 'spike') drawSpike(ctx);
  else if (tool === 'pit') drawPit(ctx);
  else if (tool === 'sticky') drawSticky(ctx);
  else if (tool === 'slime') drawSlime(ctx);
  else if (tool === 'goblin') drawGoblin(ctx);
  else if (tool === 'skeleton') drawSkeleton(ctx);
}

function drawToolSprite(ctx, tool, includeBackground = true) {
  clearCanvas(ctx);
  if (tool === 'wall') return drawWall(ctx);
  if (tool === 'path') return drawPath(ctx);
  if (tool === 'room') return drawRoom(ctx);
  if (tool === 'eraser') return drawEraser(ctx);

  if (includeBackground) {
    if (TOOLS[tool]?.type === 'monster') drawRoom(ctx);
    else drawPath(ctx);
  }
  if (tool === 'spike') drawSpike(ctx);
  else if (tool === 'pit') drawPit(ctx);
  else if (tool === 'sticky') drawSticky(ctx);
  else if (tool === 'slime') drawSlime(ctx);
  else if (tool === 'goblin') drawGoblin(ctx);
  else if (tool === 'skeleton') drawSkeleton(ctx);
}

function renderCell(index) {
  const tile = gridElement.children[index];
  const cell = cells[index];
  const terrainCanvas = tile.querySelector('.terrain-layer');
  const trapCanvas = tile.querySelector('.trap-layer');
  const monsterCanvas = tile.querySelector('.monster-layer');

  drawBase(terrainCanvas.getContext('2d'), cell.terrain);
  drawOverlay(trapCanvas.getContext('2d'), cell.trap);
  drawOverlay(monsterCanvas.getContext('2d'), cell.monster);

  const x = (index % GRID_SIZE) + 1;
  const y = Math.floor(index / GRID_SIZE) + 1;
  const pieces = [];
  if (cell.terrain) pieces.push(TOOLS[cell.terrain].name);
  if (cell.trap) pieces.push(TOOLS[cell.trap].name);
  if (cell.monster) pieces.push(TOOLS[cell.monster].name);
  tile.setAttribute('aria-label', `${x}, ${y}: ${pieces.length ? pieces.join(', ') : '빈칸'}`);
}

function updatePlacedCount() {
  placedCount.textContent = String(cells.filter(cell => cell.terrain || cell.trap || cell.monster).length);
}

function renderAll() {
  cells.forEach((_, index) => renderCell(index));
  updatePlacedCount();
}

function createLayer(className) {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  canvas.className = `tile-layer ${className}`;
  canvas.setAttribute('aria-hidden', 'true');
  return canvas;
}

function createGrid() {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < cells.length; i += 1) {
    const button = document.createElement('button');
    button.className = 'tile';
    button.type = 'button';
    button.dataset.index = String(i);
    button.setAttribute('role', 'gridcell');

    button.appendChild(createLayer('terrain-layer'));
    button.appendChild(createLayer('trap-layer'));
    button.appendChild(createLayer('monster-layer'));
    fragment.appendChild(button);
  }
  gridElement.appendChild(fragment);
  renderAll();
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1200);
}

function placeAt(index) {
  if (index < 0 || index >= cells.length || index === lastPaintedIndex) return;

  const cell = cells[index];
  const tool = TOOLS[selectedTool];
  let changed = true;

  if (tool.type === 'terrain') {
    cell.terrain = selectedTool;
    if (selectedTool === 'wall') {
      cell.trap = null;
      cell.monster = null;
    } else if (selectedTool === 'path') {
      cell.monster = null;
    }
  } else if (tool.type === 'trap') {
    if (cell.terrain !== 'path' && cell.terrain !== 'room') {
      changed = false;
      showToast('함정은 통로 또는 방 위에만 설치할 수 있습니다.');
    } else if (cell.terrain === 'room' && cell.monster) {
      changed = false;
      showToast('몬스터가 있는 방에는 함정을 설치할 수 없습니다.');
    } else {
      cell.trap = selectedTool;
    }
  } else if (tool.type === 'monster') {
    if (cell.terrain !== 'room') {
      changed = false;
      showToast('몬스터는 방 위에만 배치할 수 있습니다.');
    } else if (cell.trap) {
      changed = false;
      showToast('함정이 있는 방에는 몬스터를 배치할 수 없습니다.');
    } else {
      cell.monster = selectedTool;
    }
  } else {
    if (cell.monster) cell.monster = null;
    else if (cell.trap) cell.trap = null;
    else cell.terrain = null;
  }

  lastPaintedIndex = index;
  if (!changed) return;
  renderCell(index);
  updatePlacedCount();
}

function selectTool(toolName) {
  selectedTool = toolName;
  toolButtons.forEach(button => {
    button.classList.toggle('selected', button.dataset.tool === toolName);
  });
  eraserButton.classList.toggle('selected', toolName === 'eraser');

  const tool = TOOLS[toolName];
  selectedName.textContent = tool.name;
  selectedDescription.textContent = tool.description;
  ensureCanvas32(selectedIcon);
  drawToolSprite(selectedIcon.getContext('2d'), toolName, true);
}

function resetMap() {
  cells.forEach(cell => {
    cell.terrain = null;
    cell.trap = null;
    cell.monster = null;
  });
  renderAll();
  showToast('MAP CLEARED');
}

function updateHover(target) {
  const tile = target.closest?.('.tile');
  document.querySelectorAll('.tile.hovered').forEach(el => el.classList.remove('hovered'));
  if (!tile) {
    hoverInfo.textContent = 'X -- / Y --';
    return;
  }
  tile.classList.add('hovered');
  const index = Number(tile.dataset.index);
  const x = (index % GRID_SIZE) + 1;
  const y = Math.floor(index / GRID_SIZE) + 1;
  hoverInfo.textContent = `X ${String(x).padStart(2, '0')} / Y ${String(y).padStart(2, '0')}`;
}

function initPaletteIcons() {
  toolButtons.forEach(button => {
    const toolName = button.dataset.tool;
    const canvas = button.querySelector('canvas');
    ensureCanvas32(canvas);
    drawToolSprite(canvas.getContext('2d'), toolName, true);
    button.addEventListener('click', () => selectTool(toolName));
  });
}

gridElement.addEventListener('pointerdown', event => {
  const tile = event.target.closest('.tile');
  if (!tile) return;
  event.preventDefault();
  pointerDown = true;
  lastPaintedIndex = -1;
  gridElement.setPointerCapture?.(event.pointerId);
  placeAt(Number(tile.dataset.index));
});

gridElement.addEventListener('pointermove', event => {
  updateHover(document.elementFromPoint(event.clientX, event.clientY) || event.target);
  if (!pointerDown) return;
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const tile = element?.closest('.tile');
  if (tile && gridElement.contains(tile)) placeAt(Number(tile.dataset.index));
});

window.addEventListener('pointerup', () => {
  pointerDown = false;
  lastPaintedIndex = -1;
});

gridElement.addEventListener('pointerleave', () => {
  if (!pointerDown) updateHover(document.body);
});

gridElement.addEventListener('focusin', event => updateHover(event.target));
eraserButton.addEventListener('click', () => selectTool('eraser'));
resetButton.addEventListener('click', resetMap);

window.addEventListener('keydown', event => {
  const shortcuts = {
    '1': 'wall', '2': 'path', '3': 'room',
    '4': 'spike', '5': 'pit', '6': 'sticky',
    '7': 'slime', '8': 'goblin', '9': 'skeleton',
    '0': 'eraser', 'x': 'eraser', 'X': 'eraser'
  };
  if (shortcuts[event.key]) selectTool(shortcuts[event.key]);
});

createGrid();
initPaletteIcons();
selectTool('path');
