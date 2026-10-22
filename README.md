# CLIP GIMP STUDIO

クリーンルーム開発（Clean-room Engineering）による、CLIP STUDIO (`CLIPStudio.exe`) のUI・体験を完全に再現した GIMP 専用のマネージャー＆統合制作ランチャーです。

## 特徴 (Features)
- **CLIP STUDIO 完全模倣 UI**:
  - 本家 CLIP STUDIO 3.0 と同一構造の Bento サイドバー（GIMP起動、作品管理、素材管理、環境設定、クラウド同期）
  - 作品サムネイル一覧とダブルクリック即時起動
  - ブラシ・パターン・カラーパレット・拡張スクリプト管理
- **GIMP クリスタ化機能 (Studio Mode for GIMP)**:
  - GIMP 本体の自動検出＆ワンクリック起動（CLIP PAINT MODE）
  - GIMP のドッキングウィンドウ配置を CLIP STUDIO PAINT と完全に同じ配置（左ツール・サブツール、右ナビゲーター・カラーサークル・レイヤー）に自動変換（`sessionrc`）
  - CLIP STUDIO 準拠のショートカットキー（B: ブラシ, E: 消しゴム, G: 塗りつぶし, M: 選択, Space: パン 等）（`menurc`）
  - ダークスタジオテーマ（`gimp.css`）
- **クリーンルーム設計 (Clean-room Design)**:
  - セルシス製品の内部バイナリ・独自リソースの流用は一切行っていません。
  - 外部観測によるUIレイアウト・振る舞い仕様のみを基に、Web標準技術（HTML5, Modern CSS, Vanilla JS）およびシェル自動化スクリプトを用いて独立してゼロから開発。

## 起動方法 (Quick Start)
1. `launch.bat` をダブルクリック（または `run-server.bat`）
2. ネイティブウィンドウとして **CLIP GIMP STUDIO** が起動します。
3. 最上部の「GIMP を起動」ボタン、または作品カードをクリックするだけで、クリスタ風UIに整えられた GIMP が立ち上がります。

## GitHub リポジトリ
- Remote: `https://github.com/drkai-lab/CLIP-GIMP-STUDIO`
