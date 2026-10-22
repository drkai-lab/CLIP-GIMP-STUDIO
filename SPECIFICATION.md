# クリーンルーム開発仕様書 (Clean-room Specification)
## プロジェクト: GIMP Studio (CLIP STUDIO Launcher & Workflow Emulator for GIMP)

### 1. 目的と開発方針 (Purpose & Methodology)
本プロジェクトは、CELSYS製『CLIP STUDIO (`CLIPStudio.exe`)』のユーザー体験（UIレイアウト、作品管理、素材管理、起動ランチャー、およびペイント環境）を、フリー・オープンソースソフトウェア（FOSS）であるGIMP向けに完全に再現することを目的とする。

#### クリーンルーム開発（Clean-room Design）原則
1. **バイナリ・逆アセンブルの不使用**:
   - `CLIPStudio.exe` や付属DLL/リソースを逆コンパイル、抽出、改変して直接利用しない。
2. **完全新規実装（Independent Implementation）**:
   - 外部から観測可能なUIレイアウト、配置、機能フロー、インタラクション仕様のみを抽出し、Web標準技術（HTML5, CSS3, JavaScript, SVG）およびシェル自動化スクリプトを用いて独立して新規作成する。
3. **ライセンスの完全クリーン性**:
   - アイコン、スタイルシート、スクリプトはすべてオープンソース互換の自作アセットを使用。

---

### 2. UI/UX 外部仕様 (External Specifications)

#### 2.1 全体構造 (Window Layout)
- **配色・テーマ**:
  - メイン背景: `#2E2F30` 〜 `#38393B`（スタジオダークグレー）
  - ヘッダー・アクセント: `#48494B` / `#0082D5`（クリエイティブブルー）
  - 文字色: `#E0E0E0`（高コントラストで見やすいフラットテキスト）
  - ボーダー: `#1E1F21`

#### 2.2 左サイドバー (Sidebar / Navigation Menu)
- **最上部 アプリケーション起動ボタン**:
  - ラベル: `GIMP を起動 (Launch GIMP)`
  - スタイル: 角丸、大型、アクセントカラー（ブルーグラデーション）、アイコン付き
- **メニューセクション 1: 制作管理 (Management)**:
  - `作品管理 (Works)`: GIMPプロジェクトファイル（.xcf）や画像作品のサムネイル一覧・メタデータ表示
  - `素材管理 (Materials)`: ブラシ（.gbr, .gih）、パターン（.pat）、パレット（.gpl）、プラグインの管理
- **メニューセクション 2: 環境・カスタマイズ (Studio Mode for GIMP)**:
  - `GIMP UI をクリスタ風にする (Apply CSP Layout)`: GIMPのウィンドウ配置、ドッキングパネル、テーマ、ショートカットをCLIP STUDIO PAINT風に一発変換
- **メニューセクション 3: サービス・コミュニティ (Services & Learn)**:
  - `素材を探す (Find Assets)`
  - `TIPS & 使い方 (Tips & Guides)`
  - `Q&A・コミュニティ (Ask Community)`
- **フッター**:
  - `クラウド同期 / GitHub Push`
  - `設定 (Settings)`

#### 2.3 メインエリア (Main Content Area)
- **作品管理ビュー (Works View)**:
  - ヘッダーバー: 新規作品作成ボタン、作品フォルダを開くボタン、検索フィルター、表示形式（グリッド/リスト）、ソート
  - 作品カード:
    - サムネイル自動生成・プレビュー
    - ファイル名、解像度、サイズ、最終更新日時
    - アクション: 「GIMPで開く」「エクスプローラーで表示」「複製」「削除」
- **素材管理ビュー (Materials View)**:
  - GIMPブラシ、パターン、カラーパレットの一覧・追加・プレビュー
- **GIMP UI 設定ビュー (GIMP Studio Profile)**:
  - CLIP STUDIO PAINTと同一のパネル配置（左ツール・サブツール・ブラシ設定、右レイヤー・カラーサークル・ナビゲーター）をGIMPに自動注入するワンクリック設定プロファイル

---

### 3. システムアーキテクチャ (System Architecture)
```
[ GIMP Studio Application ]
  ├── index.html       (Modern SPA UI - Clean-room designed)
  ├── app.css          (Studio Dark Theme, Responsive Flex/Grid)
  ├── app.js           (State management, tab switching, file scan, actions)
  ├── server.ps1       (Lightweight Local HTTP REST/WebSocket Server & OS Bridge)
  ├── launch.bat       (Zero-config Native Window Launcher via Edge App mode)
  └── gimp_profile/    (CLIP STUDIO PAINT Layout preset for GIMP)
        ├── sessionrc  (Dock & Window layout mirroring CSP)
        ├── dockrc     (Dock tabs configuration)
        └── menurc     (Keybinding mappings)
```
