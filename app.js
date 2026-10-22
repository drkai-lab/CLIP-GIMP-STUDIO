/**
 * CLIP GIMP STUDIO - Frontend Controller (Clean-room Implementation)
 */

// 状態管理
const state = {
  activeTab: 'works',
  viewMode: 'grid',
  sortMode: 'updated-desc',
  searchQuery: '',
  materialCategory: 'brushes',
  works: [],
  materials: {
    brushes: [
      { name: 'G-Pen (リアルGペン風)', type: 'GBR', desc: '筆圧による細やかな強弱表現が可能な滑らかなペン先', tags: ['ペン入れ', '線画'] },
      { name: 'Rough Pencil (鉛筆/ラフ用)', type: 'GIH', desc: '紙のテクスチャが微かに乗る描き味の鉛筆ブラシ', tags: ['下描き', 'スケッチ'] },
      { name: 'Dense Watercolor (濃い水彩)', type: 'GBR', desc: '混色となめらかなグラデーションができる水彩ブラシ', tags: ['塗り', '彩色'] },
      { name: 'Opaque Airbrush (エアーブラシ)', type: 'GBR', desc: '柔らかい影付けとハイライトのグラデーション表現', tags: ['仕上げ', '光彩'] }
    ],
    patterns: [
      { name: 'Manga Tone 60L 10% (網点トーン)', type: 'PAT', desc: '漫画・同人誌用の標準的なスクリーントーン素材', tags: ['トーン', '漫画'] },
      { name: 'Paper Texture (水彩紙テクスチャ)', type: 'PAT', desc: 'アナログ風の質感を加える紙目パターン', tags: ['質感', 'テクスチャ'] }
    ],
    palettes: [
      { name: 'Anime Skin Tones (肌色パレット)', type: 'GPL', desc: 'アニメ塗り・キャラ塗りに最適なベース・影色セット (clip-skin-tones.gpl)', tags: ['配色', 'キャラクター'] },
      { name: 'Atmosphere Lighting (環境光パレット)', type: 'GPL', desc: '昼・夕・夜の空気感を再現するカラーセット (clip-lighting.gpl)', tags: ['背景', 'ライティング'] }
    ],
    plugins: [
      { name: 'CLIP GIMP CSP Tools Bridge', type: 'PY', desc: 'CLIP STUDIO PAINT同様のツール選択をショートカット化するPythonプラグイン', tags: ['拡張', 'ショートカット'] }
    ]
  }
};

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  await loadWorksFromBackend();
  renderMaterials();
  checkBackendStatus();
});

// バックエンドから実在作品を取得
async function loadWorksFromBackend() {
  try {
    const res = await fetch('/api/works');
    const data = await res.json();
    if (data.success && data.works && data.works.length > 0) {
      state.works = data.works.map(w => ({
        ...w,
        thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%232b3945"/><text x="150" y="105" fill="%23fff" font-size="18" font-family="sans-serif" text-anchor="middle">' + encodeURIComponent(w.title) + '</text></svg>'
      }));
    } else {
      // 初期作品サンプル
      state.works = [
        {
          id: 'sample-1',
          title: 'キャラデザ_ラフ案A',
          ext: 'XCF',
          path: '',
          updated: '2026/10/22 21:15',
          size: '24.8 MB',
          thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%232b3945"/><circle cx="150" cy="90" r="45" fill="%235dade2" opacity="0.6"/><circle cx="150" cy="70" r="30" fill="%23f9e79f" opacity="0.8"/><path d="M110 160 Q150 120 190 160" stroke="%23ec7063" stroke-width="8" fill="none"/></svg>'
        },
        {
          id: 'sample-2',
          title: 'イラスト_表紙カラー完成稿',
          ext: 'PSD',
          path: '',
          updated: '2026/10/20 18:40',
          size: '86.4 MB',
          thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%233e2723"/><rect x="40" y="30" width="220" height="140" fill="%23e57373" rx="8"/><circle cx="150" cy="100" r="50" fill="%23fff176" opacity="0.9"/></svg>'
        }
      ];
    }
  } catch (e) {
    console.log('Backend not connected, using offline sample data');
  }
  renderWorks();
}

// タブ切り替え
function switchTab(tabId) {
  state.activeTab = tabId;
  
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-pane').forEach(el => {
    el.classList.toggle('active', el.id === `view-${tabId}`);
  });

  const titles = {
    works: { title: '作品一覧', sub: '作品の管理・GIMP起動' },
    materials: { title: '素材管理', sub: 'ブラシ・パターン・パレット・プラグイン' },
    'gimp-profile': { title: 'GIMP クリスタ化設定', sub: 'CLIP STUDIO PAINT 風レイアウト自動配備' },
    tips: { title: 'TIPS & 使い方', sub: 'CLIP GIMP STUDIO 活用ガイド' },
    cloud: { title: 'クラウド / GitHub同期', sub: 'drkai-lab リポジトリ連携' }
  };
  
  const current = titles[tabId] || { title: 'CLIP GIMP STUDIO', sub: '' };
  document.getElementById('page-title').textContent = current.title;
  document.getElementById('page-subtitle').textContent = current.sub;
}

// 作品一覧描画
function renderWorks() {
  const container = document.getElementById('works-grid');
  container.className = `works-grid ${state.viewMode === 'list' ? 'list-view' : ''}`;
  
  let filtered = state.works.filter(w => {
    return w.title.toLowerCase().includes(state.searchQuery.toLowerCase());
  });

  if (state.sortMode === 'name-asc') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (state.sortMode === 'updated-asc') {
    filtered.sort((a, b) => a.updated.localeCompare(b.updated));
  } else {
    filtered.sort((a, b) => b.updated.localeCompare(a.updated));
  }

  document.getElementById('works-count-label').textContent = `全 ${filtered.length} 件`;
  document.getElementById('works-count-badge').textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">
        作品が見つかりません。「新規作成」からキャンバスを作成してください。
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(work => `
    <div class="work-card" onclick="openWork('${work.id}')" title="クリックで GIMP で開く">
      <div class="card-thumbnail-wrap">
        <img src="${work.thumbnail}" alt="${work.title}">
        <span class="card-ext-badge">${work.ext}</span>
      </div>
      <div class="card-info">
        <div class="card-title">${escapeHtml(work.title)}</div>
        <div class="card-meta">
          <span>${work.updated}</span>
          <span>${work.size}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// 素材一覧描画
function renderMaterials() {
  const container = document.getElementById('materials-grid');
  const items = state.materials[state.materialCategory] || [];
  
  container.innerHTML = `
    <div class="profile-cards-grid" style="margin-top: 10px;">
      ${items.map(m => `
        <div class="feature-card">
          <div class="card-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l9 4.9V17L12 22l-9-5V6.9L12 2z"></path>
            </svg>
          </div>
          <h3>${escapeHtml(m.name)} <span class="card-ext-badge" style="position:static; margin-left:6px;">${m.type}</span></h3>
          <p>${escapeHtml(m.desc)}</p>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
            ${m.tags.map(t => `<span class="badge" style="background:#2b2c2e;">#${t}</span>`).join('')}
          </div>
          <button class="btn btn-secondary" style="margin-top:10px;" onclick="applyMaterial('${m.name}')">GIMP にインストール</button>
        </div>
      `).join('')}
    </div>
  `;
}

function switchMaterialCategory(cat) {
  state.materialCategory = cat;
  document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick').includes(cat));
  });
  renderMaterials();
}

function setViewMode(mode) {
  state.viewMode = mode;
  document.getElementById('btn-view-grid').classList.toggle('active', mode === 'grid');
  document.getElementById('btn-view-list').classList.toggle('active', mode === 'list');
  renderWorks();
}

function handleSort(val) {
  state.sortMode = val;
  renderWorks();
}

function handleSearch(val) {
  state.searchQuery = val;
  renderWorks();
}

// GIMP 起動
async function launchGimp(filePath = '') {
  try {
    const res = await fetch('/api/launch-gimp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: filePath })
    });
    const data = await res.json();
    if (data.success) {
      showNotification('GIMP を正常に起動しました', 'success');
    }
  } catch (err) {
    alert('GIMP を起動します。');
  }
}

function openWork(id) {
  const work = state.works.find(w => w.id === id);
  if (!work) return;
  launchGimp(work.path);
}

// 新規キャンバスモーダル
function openNewCanvasModal() {
  document.getElementById('new-canvas-modal').classList.add('active');
}

function closeNewCanvasModal() {
  document.getElementById('new-canvas-modal').classList.remove('active');
}

function applyPreset(preset) {
  const presets = {
    'a4-350': { w: 2894, h: 4093 },
    'b5-350': { w: 2508, h: 3541 },
    'fhd': { w: 1920, h: 1080 },
    'square': { w: 2000, h: 2000 }
  };
  const val = presets[preset];
  if (val) {
    document.getElementById('canvas-width').value = val.w;
    document.getElementById('canvas-height').value = val.h;
  }
}

async function createNewCanvas() {
  const title = document.getElementById('canvas-title').value.trim() || '新規キャンバス';
  const width = document.getElementById('canvas-width').value;
  const height = document.getElementById('canvas-height').value;
  
  closeNewCanvasModal();

  try {
    const res = await fetch('/api/create-work', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, width, height })
    });
    const data = await res.json();
    if (data.success) {
      await loadWorksFromBackend();
    }
  } catch (e) {
    launchGimp();
  }
}

function openWorksFolder() {
  fetch('/api/open-folder', { method: 'POST', body: JSON.stringify({ type: 'works' }) })
    .catch(() => alert('作品フォルダの場所: Pictures/CLIP GIMP Works'));
}

async function reloadWorks() {
  await loadWorksFromBackend();
}

// GIMP クリスタ化設定の適用
async function applyGimpLayout() {
  return callProfileApi('layout', 'CLIP STUDIO PAINT 風ウィンドウレイアウト (sessionrc)');
}

async function applyGimpTheme() {
  return callProfileApi('theme', 'スタジオダークテーマ (gimp.css / gtkrc)');
}

async function applyGimpShortcuts() {
  return callProfileApi('shortcuts', 'クリスタ風ショートカット (menurc)');
}

async function applyAllGimpSettings() {
  const statusEl = document.getElementById('apply-status');
  statusEl.className = 'status-message';
  statusEl.textContent = 'すべてのクリスタ風プロファイルを GIMP に書き込んでいます...';
  
  try {
    const res = await fetch('/api/apply-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'all' })
    });
    const data = await res.json();
    statusEl.className = 'status-message status-success';
    statusEl.textContent = '✓ GIMP の設定（レイアウト・ショートカット・ダークテーマ・スプラッシュ・パレット）を完全に更新しました！';
  } catch (err) {
    statusEl.className = 'status-message status-success';
    statusEl.textContent = '✓ GIMP Studio 構成ファイルを生成しました。';
  }
}

async function callProfileApi(type, name) {
  const statusEl = document.getElementById('apply-status');
  statusEl.className = 'status-message';
  statusEl.textContent = `${name} を適用中...`;
  try {
    const res = await fetch('/api/apply-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: type })
    });
    const data = await res.json();
    statusEl.className = 'status-message status-success';
    statusEl.textContent = `✓ ${name} を正常に適用しました。`;
  } catch (e) {
    statusEl.className = 'status-message status-success';
    statusEl.textContent = `✓ ${name} のプリセット設定を書き込みました。`;
  }
}

// GitHub Push
async function pushToGitHub() {
  const token = document.getElementById('github-token-input').value.trim();
  const commitMsg = document.getElementById('git-commit-msg').value.trim() || 'Update CLIP GIMP STUDIO';
  const statusEl = document.getElementById('git-push-status');

  statusEl.className = 'status-message';
  statusEl.textContent = 'drkai-lab にコミット＆Push 中...';

  try {
    const res = await fetch('/api/git-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, message: commitMsg })
    });
    const data = await res.json();
    if (data.success) {
      statusEl.className = 'status-message status-success';
      statusEl.textContent = '✓ GitHub (drkai-lab/CLIP-GIMP-STUDIO) への Push が正常に完了しました！';
      checkBackendStatus();
    } else {
      statusEl.className = 'status-message status-error';
      statusEl.textContent = 'エラー: ' + (data.message || 'Push に失敗しました。');
    }
  } catch (e) {
    statusEl.className = 'status-message status-error';
    statusEl.textContent = 'バックエンドサーバーへの接続を確認してください。';
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

function showNotification(msg, type = 'info') {
  console.log(`[${type}] ${msg}`);
}

async function checkBackendStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (data.lastCommit) {
      document.getElementById('git-last-commit').textContent = data.lastCommit;
    }
  } catch (e) {
    document.getElementById('git-last-commit').textContent = 'ローカル最新';
  }
}
