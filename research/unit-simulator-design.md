# 次世代統合シミュレーター 初期実装

`unit-simulator.html` は安定版A面からリンクする別ページ。既存A面・Library・所持カードの保存とは独立し、5枠の選択・特訓・開花・発動頻度UP・曲時間はページ内だけで保持する。再読み込みで初期化する。現段階では編成保存機能やA面保存からの自動移行は行わない。

## データの流れ

Runtime Catalog → 共通adapter → 選択カード・育成状態

- `unit-parameter-engine.js`: `calculateCardParameters()`を再利用し、基礎・開花増分・カード小計をP/T/S/TOTALごとに返す。5人の各内訳を合計する。最終値と未接続補正はnull。既存`parameter-rules.js`は明示的なbaseStatsや補正率、Card v2の効果を前提にしており、RuntimeのPassive等を自動で読み替えない。Memoryや強化ボーナスの既定値をこの新ページへ持ち込まない。
- `unit-score-engine.js`: Parameter状態を受け取り、未確定の記号X・value:nullを返す境界。パラメーター合計からスコアへの換算はしない。
- `active-timeline-engine.js`: A面のadjustedInterval / events / calcMax / maxSegmentsをアルゴリズム変更なしで移設。A面には同名の呼び出しラッパーを残し、新ページは同じエンジンを使用する。既存の1メンバー当たり1000イベントの上限もそのまま維持。
- `activation-probability-rules.js`・`active-random-simulation.js`: 既存の暫定確率と乱数・区間積分・統計をそのまま共用。Timelineへの入力はActive基本効果のみ。Support補正込みのA面表示値と比較する場合は、入力範囲の違いに注意する。
- `unit-simulator-engine.js`: 上記を接続する。DOMやlocalStorageへ依存せず、編成・Parameter・Unit Score・候補・最大補正区間を返す。simulateはX係数の試行値と統計を返す。
- `unit-simulator.js`: 検索・選択・表示のみ。P/A/SPのLvは開花から共通adapterが導出し、選択データや条件付きActive・未解決情報はexpansion内に保持する。

Canonical本体・schema・カードRuntimeの構造変更はない。ブラウザーは既存Runtimeだけを読み込み、研究用Canonicalをfetchしない。

## 初期版の対象外

Passive・Memory・強化ボーナス・Leader・Board・衣装などの編成補正、Special、条件付きActive、Support、ノーツ密度、Xの数値算出、絶対スコアは未接続。効果原文やLvの表示を計算適用と混同しない。未接続項目をゼロと確定しない。

## 検証

`python3 -B tests/verify.py` で既存A面からの移設関数の一致、旧/新Timelineの候補・区間・評価値、全185枚×開花6段階、内訳合算・未接続状態・X境界・seed再現を検証する。

Chromeで `tests/unit-simulator-browser.html` を実行し、5枠・185枚・検索・特訓/開花/頻度・A面との計算一致・乱数・保存非干渉・再読込・1100px/360pxを検証する。既存 `tests/browser.html` と `tests/navigation-browser.html` も実行する。
