# GIMP Studio (CLIP STUDIO Clean-room Re-implementation for GIMP)

クリーンルーム開発（Clean-room Engineering）による、CLIP STUDIO (`CLIPStudio.exe`) のUI・体験を再現した GIMP 専用のマネージャー＆ランチャーポータルです。

## 特徴 (Features)
- **CLIP STUDIO 完全模倣 UI**:
  - サイドバー構成（GIMP起動、作品管理、素材管理、チュートリアル、クラウド）
  - 作品サムネイル一覧とダブルクリック起動
  - 素材・ブラシ・パレット・プラグイン管理
- **GIMP 連携機能**:
  - GIMP 本体の自動検出＆ワンクリック起動
  - GIMP UI を CLIP STUDIO PAINT 風に再配置するプロファイル設定
  - 新規キャンバス作成ダイアログ
- **クリーンルーム設計**:
  - セルシス製品の内部バイナリ・リソースの流用を一切排除
  - 仕様書ベースで HTML5 / Modern CSS / Vanilla JS / Node / PowerShell / Web 標準によりゼロから実装
