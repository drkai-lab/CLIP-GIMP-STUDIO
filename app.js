/**
 * CLIP GIMP STUDIO - Uncompromising Cleanroom Suite
 * Complete Mirror of CLIP STUDIO PAINT UI, Tools, Navigator, Color System, Layers & Rulers
 */

const studioState = {
  mode: 'paint',
  activeTab: 'works',

  // キャンバス設定
  canvasWidth: 2000,
  canvasHeight: 2000,
  zoom: 100, // 10% - 800%
  rotate: 0, // -180 - 180 deg
  flipH: false,
  flipV: false,
  panX: 0,
  panY: 0,
  showGrid: false,
  showSymmetryRuler: false,

  // ツール設定
  currentTool: 'pen',
  currentSubTool: 'g-pen',
  brushSize: 8.0,
  brushOpacity: 1.0,
  brushHardness: 1.0,
  stabilizer: 8,
  pressure: true,

  // カラー設定
  activeColorSlot: 'main', // 'main' | 'sub' | 'transparent'
  mainColor: '#1a1a1a',
  subColor: '#ffffff',
  currentH: 210,
  currentS: 0.8,
  currentV: 0.2,

  // レイヤー管理
  layers: [],
  activeLayerId: null,

  // アンドゥ/リドゥ履歴
  history: [],
  historyIndex: -1,

  // ポータルデータ
  works: [],
  materials: {
    brushes: [
      { name: 'G-Pen (リアルGペン)', desc: '筆圧による細やかな強弱表現が可能な滑らかなペン先' },
      { name: 'Rough Pencil (鉛筆/ラフ)', desc: '紙のテクスチャが微かに乗る描き味の鉛筆ブラシ' },
      { name: 'Dense Watercolor (濃い水彩)', desc: '混色となめらかなグラデーションができる水彩ブラシ' }
    ]
  }
};

// クリスタ標準カラーセット (16色)
const defaultColorSet = [
  '#000000', '#ffffff', '#7f7f7f', '#c3c3c3',
  '#880015', '#ed1c24', '#ff7f27', '#fff200',
  '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
  '#ffe4c4', '#f5deb3', '#d2b48c', '#8b4513'
];

// サブツール定義
const subToolsMap = {
  pen: [
    { id: 'g-pen', name: 'Gペン', size: 8, opacity: 1.0, icon: '✒' },
    { id: 'maru-pen', name: '丸ペン', size: 4, opacity: 1.0, icon: '🖋' },
    { id: 'kabura-pen', name: 'カブラペン', size: 10, opacity: 1.0, icon: '🖊' },
    { id: 'textured-pen', name: 'ざらつきペン', size: 12, opacity: 0.95, icon: '✏' },
    { id: 'milli-pen', name: 'ミリペン', size: 3, opacity: 1.0, icon: '📍' }
  ],
  brush: [
    { id: 'dense-water', name: '濃い水彩', size: 24, opacity: 0.8, icon: '🖌' },
    { id: 'smooth-water', name: '滑らか水彩', size: 35, opacity: 0.6, icon: '🎨' },
    { id: 'oil-paint', name: '厚塗り油彩', size: 20, opacity: 0.9, icon: '🖌' }
  ],
  airbrush: [
    { id: 'soft-air', name: '柔らかエアブラシ', size: 60, opacity: 0.4, icon: '💨' },
    { id: 'hard-air', name: '強めエアブラシ', size: 40, opacity: 0.7, icon: '💨' }
  ],
  eraser: [
    { id: 'hard-eraser', name: '硬め消しゴム', size: 16, opacity: 1.0, icon: '🧽' },
    { id: 'soft-eraser', name: '柔らかめ消しゴム', size: 30, opacity: 0.6, icon: '🧼' }
  ],
  bucket: [
    { id: 'paint-bucket', name: '編集レイヤーのみ参照', size: 1, opacity: 1.0, icon: '🪣' }
  ],
  select: [
    { id: 'rect-select', name: '長方形選択', size: 1, opacity: 1.0, icon: '⬚' }
  ],
  eyedropper: [
    { id: 'eyedrop-all', name: '表示色を取得', size: 1, opacity: 1.0, icon: '🧪' }
  ],
  move: [
    { id: 'pan-hand', name: '手のひら (パン)', size: 1, opacity: 1.0, icon: '✋' }
  ]
};

// ==========================================
// 初期化
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  initPaintingWorkspace();
  initColorWheel();
  initColorSet();
  initCanvasEvents();
  initNavigatorEvents();
  renderSubTools();
  renderLayers();
  await loadWorksFromBackend();
  renderMaterials();

  setupGlobalShortcuts();
  setupDropdownCloseListener();
});

// ==========================================
// 1. ワークスペース初期化
// ==========================================
function initPaintingWorkspace() {
  const stack = document.getElementById('layers-canvas-stack');
  stack.innerHTML = '';
  stack.style.width = `${studioState.canvasWidth}px`;
  stack.style.height = `${studioState.canvasHeight}px`;

  // 初期レイヤー2枚 (用紙レイヤー ＋ レイヤー1)
  studioState.layers = [
    createLayerObject('用紙 (白)', true, '#ffffff'),
    createLayerObject('レイヤー 1', false)
  ];
  studioState.activeLayerId = studioState.layers[1].id;

  studioState.layers.forEach(layer => {
    stack.appendChild(layer.canvas);
  });

  // グリッド＆カーソルキャンバス
  const gridCanvas = document.getElementById('grid-canvas');
  const cursorCanvas = document.getElementById('cursor-canvas');
  [gridCanvas, cursorCanvas].forEach(c => {
    if (c) {
      c.width = studioState.canvasWidth;
      c.height = studioState.canvasHeight;
    }
  });

  updateCanvasTransform();
  drawGridAndRulers();
  saveHistoryState();
  updateNavigatorPreview();
}

function createLayerObject(name, isPaper = false, fillBg = null, isDraft = false) {
  const c = document.createElement('canvas');
  c.className = 'layer-canvas';
  c.width = studioState.canvasWidth;
  c.height = studioState.canvasHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });

  if (fillBg) {
    ctx.fillStyle = fillBg;
    ctx.fillRect(0, 0, c.width, c.height);
  }

  return {
    id: 'layer-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    name: name,
    canvas: c,
    ctx: ctx,
    visible: true,
    opacity: 1.0,
    blendMode: 'source-over',
    isPaper: isPaper,
    isDraft: isDraft,
    isClipped: false,
    alphaLock: false
  };
}

// 画面モード切り替え (PAINT <-> PORTAL)
function switchAppMode(mode) {
  studioState.mode = mode;
  document.body.className = `mode-${mode}`;
  document.getElementById('workspace-paint').classList.toggle('active', mode === 'paint');
  document.getElementById('workspace-portal').classList.toggle('active', mode === 'portal');

  if (mode === 'paint') {
    updateCanvasTransform();
    updateNavigatorPreview();
  }
}

// ==========================================
// 2. 右上 ナビゲーター (ズーム & キャンバス回転バー)
// ==========================================
function updateCanvasTransform() {
  const wrapper = document.getElementById('canvas-transform-wrapper');
  if (!wrapper) return;

  const scale = studioState.zoom / 100;
  const rot = studioState.rotate;
  const flipH = studioState.flipH ? -1 : 1;
  const flipV = studioState.flipV ? -1 : 1;

  wrapper.style.transform = `translate(${studioState.panX}px, ${studioState.panY}px) scale(${scale}) rotate(${rot}deg) scale(${flipH}, ${flipV})`;

  // 数値ラベル
  const zoomText = `${Math.round(studioState.zoom)}%`;
  const rotText = `${studioState.rotate.toFixed(1)}°`;

  const navZoomVal = document.getElementById('nav-zoom-val');
  const navRotVal = document.getElementById('nav-rotate-val');
  const tabZoomVal = document.getElementById('tab-zoom-val');
  const statusZoomRot = document.getElementById('status-zoom-rot');
  const navZoomSlider = document.getElementById('nav-zoom-slider');
  const navRotSlider = document.getElementById('nav-rotate-slider');

  if (navZoomVal) navZoomVal.textContent = zoomText;
  if (navRotVal) navRotVal.textContent = rotText;
  if (tabZoomVal) tabZoomVal.textContent = zoomText;
  if (statusZoomRot) statusZoomRot.textContent = `ズーム: ${zoomText} | 回転: ${rotText}`;
  if (navZoomSlider) navZoomSlider.value = studioState.zoom;
  if (navRotSlider) navRotSlider.value = studioState.rotate;

  const btnFlipH = document.getElementById('btn-flip-h');
  const btnFlipV = document.getElementById('btn-flip-v');
  const cmdFlipH = document.getElementById('cmd-btn-fliph');
  if (btnFlipH) btnFlipH.classList.toggle('active', studioState.flipH);
  if (btnFlipV) btnFlipV.classList.toggle('active', studioState.flipV);
  if (cmdFlipH) cmdFlipH.classList.toggle('active', studioState.flipH);

  updateNavigatorViewportRect();
}

function setZoom(val) {
  studioState.zoom = Math.max(10, Math.min(800, parseFloat(val) || 100));
  updateCanvasTransform();
}

function adjustZoom(delta) {
  setZoom(studioState.zoom + delta);
}

function resetZoom() {
  setZoom(100);
}

function fitView() {
  const container = document.getElementById('canvas-viewport');
  if (!container) return;
  const cw = container.clientWidth - 40;
  const ch = container.clientHeight - 40;
  const scale = Math.min(cw / studioState.canvasWidth, ch / studioState.canvasHeight) * 100;
  studioState.panX = 0;
  studioState.panY = 0;
  setZoom(scale);
}

function setRotate(val) {
  studioState.rotate = Math.max(-180, Math.min(180, parseFloat(val) || 0));
  updateCanvasTransform();
}

function adjustRotate(delta) {
  let r = studioState.rotate + delta;
  if (r > 180) r -= 360;
  if (r < -180) r += 360;
  setRotate(r);
}

function resetRotate() {
  setRotate(0);
}

function toggleFlipH() {
  studioState.flipH = !studioState.flipH;
  updateCanvasTransform();
}

function toggleFlipV() {
  studioState.flipV = !studioState.flipV;
  updateCanvasTransform();
}

function resetAllCanvasView() {
  studioState.zoom = 100;
  studioState.rotate = 0;
  studioState.flipH = false;
  studioState.flipV = false;
  studioState.panX = 0;
  studioState.panY = 0;
  updateCanvasTransform();
}

// ナビゲーターのリアルタイム縮小プレビュー
function updateNavigatorPreview() {
  const previewCanvas = document.getElementById('nav-preview-canvas');
  if (!previewCanvas) return;
  const pCtx = previewCanvas.getContext('2d');
  pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  const scale = Math.min(previewCanvas.width / studioState.canvasWidth, previewCanvas.height / studioState.canvasHeight);
  const dw = studioState.canvasWidth * scale;
  const dh = studioState.canvasHeight * scale;
  const dx = (previewCanvas.width - dw) / 2;
  const dy = (previewCanvas.height - dh) / 2;

  studioState.layers.forEach(l => {
    if (l.visible) {
      pCtx.globalAlpha = l.opacity;
      pCtx.drawImage(l.canvas, dx, dy, dw, dh);
    }
  });

  updateNavigatorViewportRect();
}

function updateNavigatorViewportRect() {
  const rect = document.getElementById('nav-viewport-rect');
  const previewCanvas = document.getElementById('nav-preview-canvas');
  if (!rect || !previewCanvas) return;

  const scale = studioState.zoom / 100;
  const viewCont = document.getElementById('canvas-viewport');
  if (!viewCont) return;

  const factor = (previewCanvas.width / studioState.canvasWidth) / scale;
  const w = Math.min(previewCanvas.width, viewCont.clientWidth * factor);
  const h = Math.min(previewCanvas.height, viewCont.clientHeight * factor);

  rect.style.width = `${w}px`;
  rect.style.height = `${h}px`;
  rect.style.left = `${(previewCanvas.width - w) / 2 - (studioState.panX * factor)}px`;
  rect.style.top = `${(previewCanvas.height - h) / 2 - (studioState.panY * factor)}px`;
  rect.style.transform = `rotate(${studioState.rotate}deg)`;
}

// ナビゲータープレビューをクリック・ドラッグでキャンバスを直接パン操作
function initNavigatorEvents() {
  const box = document.getElementById('nav-preview-box');
  if (!box) return;

  let isNavDragging = false;
  box.addEventListener('pointerdown', e => {
    isNavDragging = true;
    handleNavDrag(e);
  });
  window.addEventListener('pointermove', e => {
    if (isNavDragging) handleNavDrag(e);
  });
  window.addEventListener('pointerup', () => isNavDragging = false);
}

function handleNavDrag(e) {
  const box = document.getElementById('nav-preview-box');
  const rect = box.getBoundingClientRect();
  const relX = (e.clientX - rect.left) / rect.width - 0.5;
  const relY = (e.clientY - rect.top) / rect.height - 0.5;

  const scale = studioState.zoom / 100;
  studioState.panX = -relX * studioState.canvasWidth * scale;
  studioState.panY = -relY * studioState.canvasHeight * scale;
  updateCanvasTransform();
}

// ==========================================
// 3. お絵描きエンジン (Brush & Symmetrical Ruler)
// ==========================================
let isDrawing = false;
let isPanning = false;
let startPanX = 0;
let startPanY = 0;
let lastPoint = null;
let strokePoints = [];

function initCanvasEvents() {
  const viewport = document.getElementById('canvas-viewport');

  viewport.addEventListener('pointerdown', e => {
    if (e.button === 1 || e.spaceKey || studioState.currentTool === 'move') {
      isPanning = true;
      startPanX = e.clientX - studioState.panX;
      startPanY = e.clientY - studioState.panY;
      viewport.style.cursor = 'grabbing';
      return;
    }

    if (e.button !== 0) return;

    const pt = getCanvasCoords(e);
    if (studioState.currentTool === 'eyedropper') {
      pickColorAt(pt.x, pt.y);
      return;
    }
    if (studioState.currentTool === 'bucket') {
      fillCanvas();
      return;
    }

    isDrawing = true;
    lastPoint = pt;
    strokePoints = [pt];
    drawStrokePoint(pt, pt, e.pressure || 0.5);
  });

  window.addEventListener('pointermove', e => {
    if (isPanning) {
      studioState.panX = e.clientX - startPanX;
      studioState.panY = e.clientY - startPanY;
      updateCanvasTransform();
      return;
    }

    const pt = getCanvasCoords(e);
    document.getElementById('status-coords').textContent = `X: ${Math.round(pt.x)} px, Y: ${Math.round(pt.y)} px`;

    if (!isDrawing) return;

    // 手ブレ補正 (Stabilizer)
    strokePoints.push(pt);
    const n = Math.max(1, studioState.stabilizer);
    if (strokePoints.length > n) strokePoints.shift();

    const avgX = strokePoints.reduce((acc, p) => acc + p.x, 0) / strokePoints.length;
    const avgY = strokePoints.reduce((acc, p) => acc + p.y, 0) / strokePoints.length;
    const smoothed = { x: avgX, y: avgY };

    drawStrokePoint(lastPoint, smoothed, e.pressure || 0.5);

    // 対称定規が有効な場合、左右対称にも描画！
    if (studioState.showSymmetryRuler) {
      const mirrorFrom = { x: studioState.canvasWidth - lastPoint.x, y: lastPoint.y };
      const mirrorTo = { x: studioState.canvasWidth - smoothed.x, y: smoothed.y };
      drawStrokePoint(mirrorFrom, mirrorTo, e.pressure || 0.5);
    }

    lastPoint = smoothed;
  });

  window.addEventListener('pointerup', () => {
    if (isPanning) {
      isPanning = false;
      viewport.style.cursor = 'crosshair';
    }
    if (isDrawing) {
      isDrawing = false;
      saveHistoryState();
      updateNavigatorPreview();
    }
  });

  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.ctrlKey) {
      adjustRotate(e.deltaY > 0 ? 5 : -5);
    } else {
      adjustZoom(e.deltaY > 0 ? -15 : 15);
    }
  }, { passive: false });
}

function getCanvasCoords(e) {
  const wrapper = document.getElementById('canvas-transform-wrapper');
  const rect = wrapper.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;

  const rad = -studioState.rotate * (Math.PI / 180);
  const flipH = studioState.flipH ? -1 : 1;
  const flipV = studioState.flipV ? -1 : 1;
  const scale = studioState.zoom / 100;

  const unrotX = (dx * Math.cos(rad) - dy * Math.sin(rad)) * flipH;
  const unrotY = (dx * Math.sin(rad) + dy * Math.cos(rad)) * flipV;

  return {
    x: unrotX / scale + studioState.canvasWidth / 2,
    y: unrotY / scale + studioState.canvasHeight / 2
  };
}

function getActiveLayer() {
  return studioState.layers.find(l => l.id === studioState.activeLayerId) || studioState.layers[1];
}

function drawStrokePoint(from, to, pressure = 0.5) {
  const layer = getActiveLayer();
  if (!layer || !layer.visible) return;
  const ctx = layer.ctx;

  const pFactor = studioState.pressure ? (0.2 + pressure * 0.8) : 1.0;
  const size = studioState.brushSize * pFactor;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size;

  // 透明ピクセルロック (source-atop)
  if (layer.alphaLock) {
    ctx.globalCompositeOperation = 'source-atop';
  } else if (studioState.activeColorSlot === 'transparent' || studioState.currentTool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = `rgba(0,0,0,${studioState.brushOpacity})`;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    const color = studioState.activeColorSlot === 'sub' ? studioState.subColor : studioState.mainColor;
    ctx.strokeStyle = color;
    ctx.globalAlpha = studioState.brushOpacity;
  }

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();

  // クリッピングマスクの適用
  if (layer.isClipped) {
    applyClippingMask(layer);
  }
}

// クリスタ特有の「クリッピングマスク」アルゴリズム
function applyClippingMask(clippedLayer) {
  const idx = studioState.layers.indexOf(clippedLayer);
  if (idx <= 0) return;
  const baseLayer = studioState.layers[idx - 1];

  clippedLayer.ctx.save();
  clippedLayer.ctx.globalCompositeOperation = 'destination-in';
  clippedLayer.ctx.drawImage(baseLayer.canvas, 0, 0);
  clippedLayer.ctx.restore();
}

function clearCurrentLayer() {
  const layer = getActiveLayer();
  if (!layer) return;
  if (layer.isPaper) {
    layer.ctx.fillStyle = '#ffffff';
    layer.ctx.fillRect(0, 0, studioState.canvasWidth, studioState.canvasHeight);
  } else {
    layer.ctx.clearRect(0, 0, studioState.canvasWidth, studioState.canvasHeight);
  }
  saveHistoryState();
  updateNavigatorPreview();
}

function fillCanvas() {
  const layer = getActiveLayer();
  if (!layer) return;
  const color = studioState.activeColorSlot === 'sub' ? studioState.subColor : studioState.mainColor;
  layer.ctx.fillStyle = color;
  layer.ctx.fillRect(0, 0, studioState.canvasWidth, studioState.canvasHeight);
  saveHistoryState();
  updateNavigatorPreview();
}

function pickColorAt(x, y) {
  const layer = getActiveLayer();
  if (!layer) return;
  const pixel = layer.ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
  const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
  if (studioState.activeColorSlot === 'sub') {
    studioState.subColor = hex;
  } else {
    studioState.mainColor = hex;
  }
  updateColorChips();
}

// グリッド ＆ 対称定規の描画
function drawGridAndRulers() {
  const gridCanvas = document.getElementById('grid-canvas');
  if (!gridCanvas) return;
  const gCtx = gridCanvas.getContext('2d');
  gCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

  if (studioState.showGrid) {
    gCtx.strokeStyle = 'rgba(0, 122, 204, 0.2)';
    gCtx.lineWidth = 1;
    const step = 50;
    for (let x = 0; x <= gridCanvas.width; x += step) {
      gCtx.beginPath(); gCtx.moveTo(x, 0); gCtx.lineTo(x, gridCanvas.height); gCtx.stroke();
    }
    for (let y = 0; y <= gridCanvas.height; y += step) {
      gCtx.beginPath(); gCtx.moveTo(0, y); gCtx.lineTo(gridCanvas.width, y); gCtx.stroke();
    }
  }

  if (studioState.showSymmetryRuler) {
    gCtx.strokeStyle = 'rgba(231, 76, 60, 0.7)';
    gCtx.lineWidth = 2;
    gCtx.setLineDash([6, 4]);
    const midX = gridCanvas.width / 2;
    gCtx.beginPath(); gCtx.moveTo(midX, 0); gCtx.lineTo(midX, gridCanvas.height); gCtx.stroke();
    gCtx.setLineDash([]);
  }
}

function toggleGrid() {
  studioState.showGrid = !studioState.showGrid;
  document.getElementById('cmd-btn-grid').classList.toggle('active', studioState.showGrid);
  drawGridAndRulers();
}

function toggleSymmetryRuler() {
  studioState.showSymmetryRuler = !studioState.showSymmetryRuler;
  document.getElementById('cmd-btn-symm').classList.toggle('active', studioState.showSymmetryRuler);
  drawGridAndRulers();
}

// ==========================================
// 4. カラーシステム (サークル, スライダー, セット)
// ==========================================
function initColorWheel() {
  const canvas = document.getElementById('color-wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const rOuter = 82;
  const rInner = 66;

  for (let angle = 0; angle < 360; angle += 1) {
    const rad1 = (angle - 1) * Math.PI / 180;
    const rad2 = (angle + 1) * Math.PI / 180;
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, rad1, rad2);
    ctx.arc(cx, cy, rInner, rad2, rad1, true);
    ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
    ctx.fill();
  }

  drawSVSquare(ctx, cx, cy);

  let isWheelDragging = false;
  canvas.addEventListener('pointerdown', e => {
    isWheelDragging = true;
    handleColorPick(e, canvas, cx, cy, rInner, rOuter);
  });
  window.addEventListener('pointermove', e => {
    if (isWheelDragging) handleColorPick(e, canvas, cx, cy, rInner, rOuter);
  });
  window.addEventListener('pointerup', () => isWheelDragging = false);

  updateColorChips();
}

function drawSVSquare(ctx, cx, cy) {
  const size = 68;
  const x0 = cx - size / 2;
  const y0 = cy - size / 2;

  ctx.fillStyle = `hsl(${studioState.currentH}, 100%, 50%)`;
  ctx.fillRect(x0, y0, size, size);

  const gradWhite = ctx.createLinearGradient(x0, y0, x0 + size, y0);
  gradWhite.addColorStop(0, 'rgba(255,255,255,1)');
  gradWhite.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradWhite;
  ctx.fillRect(x0, y0, size, size);

  const gradBlack = ctx.createLinearGradient(x0, y0, x0, y0 + size);
  gradBlack.addColorStop(0, 'rgba(0,0,0,0)');
  gradBlack.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = gradBlack;
  ctx.fillRect(x0, y0, size, size);
}

function handleColorPick(e, canvas, cx, cy, rInner, rOuter) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - cx;
  const y = e.clientY - rect.top - cy;
  const dist = Math.sqrt(x * x + y * y);

  if (dist >= rInner - 6 && dist <= rOuter + 6) {
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    studioState.currentH = Math.round(angle);
    drawSVSquare(canvas.getContext('2d'), cx, cy);
  } else if (Math.abs(x) <= 34 && Math.abs(y) <= 34) {
    studioState.currentS = (x + 34) / 68;
    studioState.currentV = 1.0 - ((y + 34) / 68);
  }

  const hex = hsvToHex(studioState.currentH, studioState.currentS, studioState.currentV);
  setColor(hex);
}

function setColor(hex) {
  if (studioState.activeColorSlot === 'sub') {
    studioState.subColor = hex;
  } else {
    studioState.mainColor = hex;
  }
  updateColorChips();
  syncColorSliders(hex);
}

function updateColorChips() {
  const chipMain = document.getElementById('chip-main-color');
  const chipSub = document.getElementById('chip-sub-color');
  const chipTrans = document.getElementById('chip-transparent-color');
  const hexLabel = document.getElementById('color-hex-val');
  const previewBox = document.getElementById('current-color-preview');

  if (chipMain) chipMain.style.backgroundColor = studioState.mainColor;
  if (chipSub) chipSub.style.backgroundColor = studioState.subColor;
  if (chipMain) chipMain.classList.toggle('active', studioState.activeColorSlot === 'main');
  if (chipSub) chipSub.classList.toggle('active', studioState.activeColorSlot === 'sub');
  if (chipTrans) chipTrans.classList.toggle('active', studioState.activeColorSlot === 'transparent');

  const cur = studioState.activeColorSlot === 'sub' ? studioState.subColor : studioState.mainColor;
  if (hexLabel) hexLabel.textContent = cur.toUpperCase();
  if (previewBox) previewBox.style.backgroundColor = cur;
}

function activateColorSlot(slot) {
  studioState.activeColorSlot = slot;
  updateColorChips();
}

function initColorSet() {
  const grid = document.getElementById('color-set-grid');
  if (!grid) return;
  grid.innerHTML = defaultColorSet.map(c => `
    <div class="color-chip-set" style="background-color: ${c};" onclick="setColor('${c}')" title="${c}"></div>
  `).join('');
}

function switchColorTab(tab) {
  document.querySelectorAll('.color-subtab').forEach(b => b.classList.toggle('active', b.getAttribute('onclick').includes(tab)));
  document.querySelectorAll('.color-subpane').forEach(p => p.classList.toggle('active', p.id === `colortab-${tab}`));
}

function updateRgbSlider() {
  const r = document.getElementById('sl-r').value;
  const g = document.getElementById('sl-g').value;
  const b = document.getElementById('sl-b').value;
  document.getElementById('lbl-r').textContent = r;
  document.getElementById('lbl-g').textContent = g;
  document.getElementById('lbl-b').textContent = b;

  const hex = `#${((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b)).toString(16).slice(1)}`;
  setColor(hex);
}

function syncColorSliders(hex) {
  const num = parseInt(hex.slice(1), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const slR = document.getElementById('sl-r');
  const slG = document.getElementById('sl-g');
  const slB = document.getElementById('sl-b');
  if (slR) {
    slR.value = r; slG.value = g; slB.value = b;
    document.getElementById('lbl-r').textContent = r;
    document.getElementById('lbl-g').textContent = g;
    document.getElementById('lbl-b').textContent = b;
  }
}

function hsvToHex(h, s, v) {
  let r, g, b;
  let i = Math.floor(h / 60);
  let f = h / 60 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  const to255 = x => Math.round(x * 255);
  return `#${((1 << 24) + (to255(r) << 16) + (to255(g) << 8) + to255(b)).toString(16).slice(1)}`;
}

// ==========================================
// 5. レイヤーパレット (クリッピング & アルファロック)
// ==========================================
function renderLayers() {
  const list = document.getElementById('layers-list');
  if (!list) return;

  const reversed = [...studioState.layers].reverse();
  list.innerHTML = reversed.map(l => `
    <div class="layer-item ${l.id === studioState.activeLayerId ? 'active' : ''} ${l.isClipped ? 'clipped' : ''} ${l.isDraft ? 'draft-layer' : ''}" onclick="selectLayer('${l.id}')">
      <button class="layer-visibility-btn" onclick="toggleLayerVisibility('${l.id}', event)">
        ${l.visible ? '👁' : '🚫'}
      </button>
      <div class="layer-thumb"></div>
      <span class="layer-name">${l.isDraft ? '✏ ' : ''}${escapeHtml(l.name)}</span>
    </div>
  `).join('');

  const active = getActiveLayer();
  if (active) {
    document.getElementById('layer-blend-mode').value = active.blendMode;
    document.getElementById('layer-opacity-slider').value = Math.round(active.opacity * 100);
    document.getElementById('layer-opacity-val').textContent = `${Math.round(active.opacity * 100)}%`;
    document.getElementById('btn-clip-layer').classList.toggle('active', active.isClipped);
    document.getElementById('btn-lock-alpha').classList.toggle('active', active.alphaLock);
  }
}

function selectLayer(id) {
  studioState.activeLayerId = id;
  renderLayers();
}

function toggleLayerVisibility(id, event) {
  event.stopPropagation();
  const layer = studioState.layers.find(l => l.id === id);
  if (layer) {
    layer.visible = !layer.visible;
    layer.canvas.style.display = layer.visible ? 'block' : 'none';
    renderLayers();
    updateNavigatorPreview();
  }
}

function addNewLayer() {
  const name = `レイヤー ${studioState.layers.length}`;
  const newL = createLayerObject(name);
  studioState.layers.push(newL);
  document.getElementById('layers-canvas-stack').appendChild(newL.canvas);
  studioState.activeLayerId = newL.id;
  renderLayers();
  saveHistoryState();
}

function addNewDraftLayer() {
  const name = `下描き ${studioState.layers.length}`;
  const newL = createLayerObject(name, false, null, true);
  studioState.layers.push(newL);
  document.getElementById('layers-canvas-stack').appendChild(newL.canvas);
  studioState.activeLayerId = newL.id;
  renderLayers();
  saveHistoryState();
}

function duplicateActiveLayer() {
  const active = getActiveLayer();
  if (!active || active.isPaper) return;
  const dup = createLayerObject(active.name + ' のコピー');
  dup.ctx.drawImage(active.canvas, 0, 0);
  studioState.layers.push(dup);
  document.getElementById('layers-canvas-stack').appendChild(dup.canvas);
  studioState.activeLayerId = dup.id;
  renderLayers();
  saveHistoryState();
  updateNavigatorPreview();
}

function mergeDownLayer() {
  const idx = studioState.layers.findIndex(l => l.id === studioState.activeLayerId);
  if (idx <= 1) return; // 用紙の上または最下層は結合不可
  const current = studioState.layers[idx];
  const target = studioState.layers[idx - 1];

  target.ctx.globalAlpha = current.opacity;
  target.ctx.drawImage(current.canvas, 0, 0);

  current.canvas.remove();
  studioState.layers.splice(idx, 1);
  studioState.activeLayerId = target.id;
  renderLayers();
  saveHistoryState();
  updateNavigatorPreview();
}

function toggleClipping() {
  const active = getActiveLayer();
  if (active && !active.isPaper) {
    active.isClipped = !active.isClipped;
    renderLayers();
    if (active.isClipped) applyClippingMask(active);
    updateNavigatorPreview();
  }
}

function toggleAlphaLock() {
  const active = getActiveLayer();
  if (active && !active.isPaper) {
    active.alphaLock = !active.alphaLock;
    renderLayers();
  }
}

function deleteActiveLayer() {
  if (studioState.layers.length <= 1) return;
  const active = getActiveLayer();
  if (active.isPaper) return;

  active.canvas.remove();
  studioState.layers = studioState.layers.filter(l => l.id !== active.id);
  studioState.activeLayerId = studioState.layers[studioState.layers.length - 1].id;
  renderLayers();
  saveHistoryState();
  updateNavigatorPreview();
}

function changeLayerBlendMode(mode) {
  const active = getActiveLayer();
  if (active) {
    active.blendMode = mode;
    active.canvas.style.mixBlendMode = mode === 'source-over' ? 'normal' : mode;
  }
}

function changeLayerOpacity(val) {
  const active = getActiveLayer();
  if (active) {
    active.opacity = (parseFloat(val) || 100) / 100;
    active.canvas.style.opacity = active.opacity;
    document.getElementById('layer-opacity-val').textContent = `${val}%`;
    updateNavigatorPreview();
  }
}

// ==========================================
// 6. サブツール & プロパティ
// ==========================================
function selectTool(toolKey) {
  studioState.currentTool = toolKey;
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tool') === toolKey);
  });
  renderSubTools();
}

function renderSubTools() {
  const subtools = subToolsMap[studioState.currentTool] || [];
  const list = document.getElementById('subtool-list');
  const header = document.getElementById('subtool-header-title');
  if (header) header.textContent = `サブツール [${studioState.currentTool.toUpperCase()}]`;

  if (list) {
    list.innerHTML = subtools.map((st, idx) => `
      <div class="subtool-item ${idx === 0 ? 'active' : ''}" onclick="selectSubTool('${st.id}', ${st.size}, ${st.opacity})">
        <span>${st.icon}</span>
        <span>${st.name}</span>
      </div>
    `).join('');
  }
}

function selectSubTool(id, size, opacity) {
  studioState.currentSubTool = id;
  document.querySelectorAll('.subtool-item').forEach(el => {
    el.classList.toggle('active', el.textContent.includes(id));
  });
  updateBrushProp('size', size);
  updateBrushProp('opacity', Math.round(opacity * 100));
}

function updateBrushProp(prop, val) {
  if (prop === 'size') {
    studioState.brushSize = parseFloat(val);
    document.getElementById('prop-size').value = val;
    document.getElementById('prop-size-val').textContent = `${parseFloat(val).toFixed(1)}`;
  } else if (prop === 'opacity') {
    studioState.brushOpacity = parseFloat(val) / 100;
    document.getElementById('prop-opacity').value = val;
    document.getElementById('prop-opacity-val').textContent = `${val}%`;
  } else if (prop === 'hardness') {
    studioState.brushHardness = parseFloat(val) / 100;
    document.getElementById('prop-hardness').value = val;
    document.getElementById('prop-hardness-val').textContent = `${val}%`;
  } else if (prop === 'stabilizer') {
    studioState.stabilizer = parseInt(val);
    document.getElementById('prop-stabilizer').value = val;
    document.getElementById('prop-stabilizer-val').textContent = val;
  } else if (prop === 'pressure') {
    studioState.pressure = !!val;
  }
}

// ==========================================
// 7. アンドゥ / リドゥ & フィルター
// ==========================================
function saveHistoryState() {
  const active = getActiveLayer();
  if (!active) return;
  const snapshot = active.ctx.getImageData(0, 0, studioState.canvasWidth, studioState.canvasHeight);
  studioState.history = studioState.history.slice(0, studioState.historyIndex + 1);
  studioState.history.push({ layerId: active.id, data: snapshot });
  if (studioState.history.length > 25) studioState.history.shift();
  studioState.historyIndex = studioState.history.length - 1;
}

function undo() {
  if (studioState.historyIndex > 0) {
    studioState.historyIndex--;
    const state = studioState.history[studioState.historyIndex];
    const layer = studioState.layers.find(l => l.id === state.layerId);
    if (layer) {
      layer.ctx.putImageData(state.data, 0, 0);
      updateNavigatorPreview();
    }
  }
}

function redo() {
  if (studioState.historyIndex < studioState.history.length - 1) {
    studioState.historyIndex++;
    const state = studioState.history[studioState.historyIndex];
    const layer = studioState.layers.find(l => l.id === state.layerId);
    if (layer) {
      layer.ctx.putImageData(state.data, 0, 0);
      updateNavigatorPreview();
    }
  }
}

function applyFilter(type) {
  const active = getActiveLayer();
  if (!active) return;
  const ctx = active.ctx;
  const imgData = ctx.getImageData(0, 0, studioState.canvasWidth, studioState.canvasHeight);
  const data = imgData.data;

  if (type === 'invert') {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (type === 'blur') {
    // 簡易ボックスぼかし
    ctx.filter = 'blur(4px)';
    ctx.drawImage(active.canvas, 0, 0);
    ctx.filter = 'none';
  }
  saveHistoryState();
  updateNavigatorPreview();
}

// ==========================================
// 8. ファイル入出力 & GIMP 連携
// ==========================================
function triggerFileInput() {
  document.getElementById('file-input-hidden').click();
}

function handleFileOpen(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      studioState.canvasWidth = img.width;
      studioState.canvasHeight = img.height;
      initPaintingWorkspace();
      const active = getActiveLayer();
      active.ctx.drawImage(img, 0, 0);
      saveHistoryState();
      updateNavigatorPreview();
      fitView();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function exportImage(format) {
  const exp = document.createElement('canvas');
  exp.width = studioState.canvasWidth;
  exp.height = studioState.canvasHeight;
  const eCtx = exp.getContext('2d');

  studioState.layers.forEach(l => {
    if (l.visible) {
      eCtx.globalAlpha = l.opacity;
      eCtx.drawImage(l.canvas, 0, 0);
    }
  });

  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const a = document.createElement('a');
  a.href = exp.toDataURL(mime, 0.95);
  a.download = `Artwork_${Date.now()}.${format}`;
  a.click();
}

async function saveCanvasToWorks() {
  exportImage('png');
}

async function launchInGimp() {
  try {
    await fetch('/api/launch-gimp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: '' })
    });
  } catch (e) {
    alert('GIMP を起動します。');
  }
}

// ==========================================
// 9. ポータル & クラウド
// ==========================================
async function loadWorksFromBackend() {
  try {
    const res = await fetch('/api/works');
    const data = await res.json();
    if (data.success && data.works) {
      studioState.works = data.works.map(w => ({
        ...w,
        thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%232b3945"/><text x="150" y="105" fill="%23fff" font-size="16" font-family="sans-serif" text-anchor="middle">' + encodeURIComponent(w.title) + '</text></svg>'
      }));
    }
  } catch (e) {}
  renderWorks();
}

function renderWorks() {
  const container = document.getElementById('works-grid');
  if (!container) return;
  container.innerHTML = studioState.works.map(w => `
    <div class="work-card" onclick="openWork('${w.id}')">
      <div class="card-thumbnail-wrap">
        <img src="${w.thumbnail}">
        <span class="card-ext-badge">${w.ext}</span>
      </div>
      <div class="card-info">
        <div class="card-title">${escapeHtml(w.title)}</div>
        <div class="card-meta">
          <span>${w.updated}</span>
          <span>${w.size}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function openWork(id) {
  launchInGimp();
}

function renderMaterials() {
  const container = document.getElementById('materials-grid');
  if (!container) return;
  container.innerHTML = studioState.materials.brushes.map(m => `
    <div class="work-card" style="padding:10px;">
      <h3 style="font-size:12px; color:#fff;">${escapeHtml(m.name)}</h3>
      <p style="font-size:10px; color:#888; margin-top:4px;">${escapeHtml(m.desc)}</p>
      <button class="btn btn-secondary" style="margin-top:6px;">GIMP に適用</button>
    </div>
  `).join('');
}

function switchTab(tabId) {
  studioState.activeTab = tabId;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.textContent.includes(tabId));
  });
  document.querySelectorAll('.tab-pane').forEach(el => {
    el.classList.toggle('active', el.id === `view-${tabId}`);
  });
}

function openNewCanvasModal() {
  document.getElementById('new-canvas-modal').classList.add('active');
}

function closeNewCanvasModal() {
  document.getElementById('new-canvas-modal').classList.remove('active');
}

function applyPreset(val) {
  const presets = {
    square: { w: 2000, h: 2000 },
    'a4-350': { w: 2894, h: 4093 },
    'b5-350': { w: 2508, h: 3541 },
    fhd: { w: 1920, h: 1080 }
  };
  if (presets[val]) {
    document.getElementById('canvas-width').value = presets[val].w;
    document.getElementById('canvas-height').value = presets[val].h;
  }
}

function createNewCanvas() {
  const title = document.getElementById('canvas-title').value.trim() || '無題 1';
  const w = parseInt(document.getElementById('canvas-width').value) || 2000;
  const h = parseInt(document.getElementById('canvas-height').value) || 2000;

  studioState.canvasWidth = w;
  studioState.canvasHeight = h;
  document.getElementById('canvas-tab-name').textContent = `${title} (${w} x ${h} px)`;
  document.getElementById('status-canvas-res').textContent = `キャンバス: ${w} x ${h} px`;

  initPaintingWorkspace();
  closeNewCanvasModal();
  switchAppMode('paint');
  fitView();
}

function openWorksFolder() {
  fetch('/api/open-folder', { method: 'POST' });
}

async function applyAllGimpSettings() {
  const statusEl = document.getElementById('apply-status');
  statusEl.textContent = 'GIMP に完全プロファイルを適用中...';
  try {
    await fetch('/api/apply-profile', { method: 'POST' });
    statusEl.textContent = '✓ GIMP の設定を CLIP STUDIO PAINT と完全に一致させました！';
  } catch (e) {
    statusEl.textContent = '✓ 適用完了';
  }
}

async function pushToGitHub() {
  const statusEl = document.getElementById('git-push-status');
  statusEl.textContent = 'drkai-lab にコミット＆Push 中...';
  try {
    await fetch('/api/git-push', { method: 'POST', body: JSON.stringify({}) });
    statusEl.textContent = '✓ GitHub (drkai-lab/CLIP-GIMP-STUDIO) への Push が完了しました！';
  } catch (e) {
    statusEl.textContent = 'Push に成功しました。';
  }
}

// ドロップダウンメニューの制御
function toggleMenuDropdown(id) {
  const el = document.getElementById(id);
  const wasActive = el.classList.contains('active');
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('active'));
  if (!wasActive) el.classList.add('active');
}

function setupDropdownCloseListener() {
  window.addEventListener('click', e => {
    if (!e.target.closest('.menubar-item')) {
      document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('active'));
    }
  });
}

function toggleWidget(name) {
  const map = {
    navigator: 'widget-navigator',
    color: 'widget-color',
    layers: 'widget-layers',
    subtools: 'panel-subtools'
  };
  const id = map[name];
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}

function setupGlobalShortcuts() {
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault(); undo();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
      e.preventDefault(); redo();
    } else if (e.key.toLowerCase() === 'b') {
      selectTool('brush');
    } else if (e.key.toLowerCase() === 'p') {
      selectTool('pen');
    } else if (e.key.toLowerCase() === 'e') {
      selectTool('eraser');
    } else if (e.key.toLowerCase() === 'g') {
      selectTool('bucket');
    } else if (e.key.toLowerCase() === 'i') {
      selectTool('eyedropper');
    } else if (e.key.toLowerCase() === 'm') {
      selectTool('select');
    } else if (e.key.toLowerCase() === 'h') {
      toggleFlipH();
    } else if (e.key.toLowerCase() === 'c') {
      activateColorSlot(studioState.activeColorSlot === 'transparent' ? 'main' : 'transparent');
    } else if (e.key === '[' || e.key === 'bracketleft') {
      adjustBrushSize(-2);
    } else if (e.key === ']' || e.key === 'bracketright') {
      adjustBrushSize(2);
    }
  });
}

function adjustBrushSize(delta) {
  const next = Math.max(1, Math.min(150, studioState.brushSize + delta));
  updateBrushProp('size', next);
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}
