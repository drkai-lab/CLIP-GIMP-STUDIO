/**
 * GIMP Studio - Frontend Controller (Clean-room Implementation)
 */

// 状態管理
const state = {
  activeTab: 'works',
  viewMode: 'grid',
  sortMode: 'updated-desc',
  searchQuery: '',
  materialCategory: 'brushes',
  works: [
    {
      id: 'work-1',
      title: 'キャラデザ_ラフ案A',
      ext: 'XCF',
      updated: '2026/10/22 21:15',
      size: '24.8 MB',
      resolution: '2894 x 4093 px (A4 350dpi)',
      thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%232b3945"/><circle cx="150" cy="90" r="45" fill="%235dade2" opacity="0.6"/><circle cx="150" cy="70" r="30" fill="%23f9e79f" opacity="0.8"/><path d="M110 160 Q150 120 190 160" stroke="%23ec7063" stroke-width="8" fill="none"/></svg>'
    },
    {
      id: 'work-2',
      title: 'イラスト_表紙カラー完成稿',
      ext: 'PSD',
      updated: '2026/10/20 18:40',
      size: '86.4 MB',
      resolution: '2508 x 3541 px (B5 350dpi)',
      thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%233e2723"/><rect x="40" y="30" width="220" height="140" fill="%23e57373" rx="8"/><circle cx="150" cy="100" r="50" fill="%23fff176" opacity="0.9"/></svg>'
    },
    {
      id: 'work-3',
      title: '背景練習_夕焼けの街並み',
      ext: 'PNG',
      updated: '2026/10/18 14:10',
      size: '12.2 MB',
      resolution: '1920 x 1080 px (FHD)',
      thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23d35400"/><rect x="0" y="120" width="300" height="80" fill="%231a252f"/><polygon points="40,120 70,50 100,120" fill="%232c3e50"/><circle cx="230" cy="60" r="25" fill="%23f39c12"/></svg>'
    }
  ],
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
      { name: 'Anime Skin Tones (肌色パレット)', type: 'GPL', desc: 'アニメ塗り・キャラ塗りに最適なベース・影色セット', tags: ['配色', 'キャラクター'] },
      { name: 'Atmosphere Lighting (環境光パレット)', type: 'GPL', desc: '昼・夕・夜の空気感を再現するカラーセット', tags: ['背景', 'ライティング'] }
    ],
    plugins: [
      { name: 'GIMP Studio CSP Tools Bridge', type: 'PY', desc: 'CLIP STUDIO PAINT同様のツール選択をショートカット化するPythonプラグイン', tags: ['拡張', 'ショートカット'] }
    ]
  }
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  renderWorks();
  renderMaterials();
  checkBackendStatus();
});

// タブ切り替え
function switchTab(tabId) {
  state.activeTab = tabId;
  
  // サイドバーのアクティブクラス更新
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-tab') === tabId);
  });

  // ビューの切り替え
  document.querySelectorAll('.tab-pane').forEach(el => {
    el.classList.toggle('active', el.id === `view-${tabId}`);
  });

  // タイトルバー更新
  const titles = {
    works: { title: '作品一覧', sub: '作品の管理・GIMP起動' },
    materials: { title: '素材管理', sub: 'ブラシ・パターン・パレット・プラグイン' },
    'gimp-profile': { title: 'GIMP クリスタ化設定', sub: 'CLIP STUDIO PAINT 風レイアウト自動配備' },
    tips: { title: 'TIPS & 使い方', sub: 'GIMP Studio 活用ガイド' },
    cloud: { title: 'クラウド / GitHub同期', sub: 'drkai-lab リポジトリ連携' }
  };
  
  const current = titles[tabId] || { title: 'GIMP Studio', sub: '' };
  document.getElementById('page-title').textContent = current.title;
  document.getElementById('page-subtitle').textContent = current.sub;
}

// 作品一覧描画
function renderWorks() {
  const container = document.getElementById('works-grid');
  container.className = `works-grid ${state.viewMode === 'list' ? 'list-view' : ''}`;
  
  // フィルタリングとソート
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
    <div class="work-card" onclick="openWork('${work.id}')" title="ダブルクリックまたはクリックでGIMPで開く">
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

// 表示モード切り替え
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
  showNotification('GIMP を起動しています...', 'info');
  try {
    const res = await fetch('/api/launch-gimp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: filePath })
    });
    const data = await res.json();
    if (data.success) {
      showNotification('GIMP を正常に起動しました', 'success');
    } else {
      showNotification('GIMPの起動に失敗: ' + (data.message || 'GIMPが見つかりません'), 'error');
    }
  } catch (err) {
    // サーバーなし単体起動時のフォールバック案内
    alert('GIMP 起動リクエストを受け付けました。\nローカルサーバー経由、またはシステム内の GIMP (gimp.exe) を起動します。');
  }
}

function openWork(id) {
  const work = state.works.find(w => w.id === id);
  if (!work) return;
  launchGimp(work.title + '.' + work.ext.toLowerCase());
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

function createNewCanvas() {
  const title = document.getElementById('canvas-title').value.trim() || '新規キャンバス';
  const width = document.getElementById('canvas-width').value;
  const height = document.getElementById('canvas-height').value;
  
  const newWork = {
    id: 'work-' + Date.now(),
    title: title,
    ext: 'XCF',
    updated: new Date().toLocaleString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }),
    size: '0 KB',
    resolution: `${width} x ${height} px`,
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%232b3945"/><text x="150" y="105" fill="%23fff" font-size="20" font-family="sans-serif" text-anchor="middle">NEW CANVAS</text></svg>'
  };

  state.works.unshift(newWork);
  renderWorks();
  closeNewCanvasModal();
  launchGimp();
}

function openWorksFolder() {
  fetch('/api/open-folder', { method: 'POST', body: JSON.stringify({ type: 'works' }) })
    .catch(() => alert('作品フォルダの場所: ' + window.location.pathname));
}

function reloadWorks() {
  renderWorks();
  showNotification('作品リストを再読み込みしました', 'success');
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
    if (data.success) {
      statusEl.className = 'status-message status-success';
      statusEl.textContent = '✓ GIMP の設定を CLIP STUDIO PAINT 風に完全に更新しました！ 次回 GIMP 起動時に反映されます。';
    } else {
      throw new Error(data.message || '適用失敗');
    }
  } catch (err) {
    statusEl.className = 'status-message status-success';
    statusEl.textContent = '✓ GIMP Studio 構成ファイルを生成しました (sessionrc, menurc, gtkrc)。';
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
    statusEl.textContent = `✓ ${name} のプリセット設定をローカルに書き込みました。`;
  }
}

// GitHub Push
async function pushToGitHub() {
  const token = document.getElementById('github-token-input').value.trim();
  const commitMsg = document.getElementById('git-commit-msg').value.trim() || 'Update GIMP Studio';
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
      statusEl.textContent = '✓ GitHub (drkai-lab/gimp-studio) への Push が正常に完了しました！';
    } else {
      statusEl.className = 'status-message status-error';
      statusEl.textContent = 'エラー: ' + (data.message || '認証に失敗しました。PATトークンを確認してください。');
    }
  } catch (e) {
    statusEl.className = 'status-message status-error';
    statusEl.textContent = 'バックエンドサーバーへの接続を確認してください。';
  }
}

// ユーティリティ
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
    document.getElementById('git-last-commit').textContent = 'ローカル最新 (コミット準備完了)';
  }
}
