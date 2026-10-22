# CLIP GIMP STUDIO

GIMP本体（`gimp-2.10.exe`）を **CLIP STUDIO PAINT** と同等のUI・テーマ・ウィンドウ配置・ショートカット・スプラッシュ画面に完全カスタマイズして起動する統合制作スイートです。

ブラウザを起動するのではなく、**[`launch.bat`](file:///C:/Users/user/.gemini/antigravity/scratch/gimp-studio/launch.bat) をダブルクリックするだけで、クリスタ風に最適化された GIMP 本体がダイレクトに起動**します。

## GIMP 本体のクリスタ化構成 (GIMP Profile)

### 1. ドック配置 (`sessionrc`) - クリスタ同一レイアウト
- **シングルウィンドウモード**: 全ウィンドウが統合されたクリスタ同様のプロ向けレイアウト。
- **左ドック**:
  - メインツールボックス（グループ化ツール）
  - ツールオプション（ツールプロパティ、ブラシサイズ、筆圧、手ブレ補正）
  - ブラシプリセット
- **右ドック（上段）**:
  - ナビゲーター（ズーム・キャンバスプレビュー）
- **右ドック（中段）**:
  - カラーサークル（HSVカラーホイール）＆パレット
- **右ドック（下段）**:
  - レイヤーパレット（合成モード、不透明度、アルファ保護、表示/非表示）
  - チャンネル、アンドゥ履歴

### 2. テーマ & スタイリング (`gimp.css`, `gimprc`)
- **ダークスタジオテーマ**: CLIP STUDIO 特有のダークカラー（`#28292b`、パネル `#212224`、境界線 `#3a3b3d`、選択アクセント `#00a8ff`）。
- **ツールグループ化**: クリスタ同様に長押し・ホバーで関連ツールを展開。
- **Wilberマスコット非表示**: プロ仕様のクリーンな外観。

### 3. ショートカットキー (`menurc`)
- **P**: ペンツール
- **B**: ブラシ・水彩
- **E**: 消しゴム
- **G**: 塗りつぶし / グラデーション
- **M**: 選択範囲
- **H**: キャンバス左右反転
- **Ctrl+T**: 変形 / 自由変形
- **`[` / `]`**: ブラシサイズ縮小 / 拡大

### 4. 起動時スプラッシュ画面 (Claude Works 広告連携)
- `%USERPROFILE%\Pictures\Claude Works` に保存された最新の画像（PNG/JPG/WEBP）が、GIMP起動時の大画面スプラッシュとして自動同期表示されます。
- この広告同期機構はブラックボックス化され、ライセンス（`LICENSE-AD-ENGINE.txt`）により改変・削除が禁止されています。

---

## 起動方法
[`launch.bat`](file:///C:/Users/user/.gemini/antigravity/scratch/gimp-studio/launch.bat) をダブルクリックするだけで、ネイティブアプリとして起動します。

## ライセンス・知的財産権について (License & Protected Components)
本ソフトウェアは、制作環境の自由度と独自の広告配信システムを両立させるため、**モジュール別ハイブリッドライセンス**を採用しています。

1. **基本制作スイート (Core Studio & UI)**:
   - [MIT License](file:///C:/Users/user/.gemini/antigravity/scratch/gimp-studio/LICENSE) が適用され、自由な利用・拡張が可能です。
2. **Claude Works 広告配信モジュール (`ad-engine.bundle.js` / スプラッシュ広告表示機構)**:
   - **【改変・削除・迂回禁止（Protected Black-Box Module）】**
   - 本モジュールは [LICENSE-AD-ENGINE.txt](file:///C:/Users/user/.gemini/antigravity/scratch/gimp-studio/LICENSE-AD-ENGINE.txt) に基づく専売・プロプライエタリコンポーネントです。
   - MITライセンスの対象外（除外モジュール）であり、**広告表示部分のコード改変、削除、非表示化、バイパス、リバースエンジニアリングは一切禁止**されています。
   - 本モジュールの改変や除去を試みた場合、本ソフトウェアスイート全体の利用許諾は即時失効します。

## GitHub リポジトリ
- **https://github.com/drkai-lab/CLIP-GIMP-STUDIO**
