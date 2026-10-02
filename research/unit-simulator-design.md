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

未対応Passive・Memory・強化ボーナス・Leader・Board・衣装などの編成補正、Special、条件付きActive、Support、ノーツ密度、Xの数値算出、絶対スコアは未接続。効果原文やLvの表示を計算適用と混同しない。未接続項目をゼロと確定しない。

## 検証

`python3 -B tests/verify.py` で既存A面からの移設関数の一致、旧/新Timelineの候補・区間・評価値、全185枚×開花6段階、内訳合算・未接続状態・X境界・seed再現を検証する。

Chromeで `tests/unit-simulator-browser.html` を実行し、5枠・185枚・検索・特訓/開花/頻度・A面との計算一致・乱数・保存非干渉・再読込・1100px/360pxを検証する。既存 `tests/browser.html` と `tests/navigation-browser.html` も実行する。

## 静的Passive接続（追加）

`unit-parameter-engine.js`から既存`parameter-rules.js`の`calculatePassiveEffects()`を呼ぶ。対象は明示SELF、単一の観測済みDECK_CARD_ATTRIBUTE人数条件、既知のP/T/S/全パラUP permil効果に限る。率はpermil/10で既存のpercent入力へ変換する。条件評価はRuntimeとカード双方のraw属性enumを直接比較し、候補表示名から推定しない。

現Runtimeで該当するのは自己全パラ補正58レベル行（29カード）。自己P/T/S単項の経路は合成fixtureで検証し、実測済みカードが存在するとは主張しない。条件未観測をnoneへ変換せず、期生条件・順位選択・他者対象・Support等はunsupportedとする。条件が明確に不成立のinactiveとは区別する。

参照値は開花適用後のカード値（Board等を除く）。既存処理の「率をparameterごとに合算→各項ceil」を再利用する。効果ごとのceilを足す方式は導入しない。今回は自己単一効果のみを橋渡しするため、他者からの重複加算は新たに接続しない。既存テストの重複率集約規則も維持する。

結果のpassiveは適用できた分のみ。未対応分はunresolved/traceおよびvalue:nullの補正項目に残す。subtotalは開花後値＋適用済みPassiveで、finalは引き続きnull。traceにはsourceカード/枠/レベル/原文/pointer、targetカード/枠、正規化した効果・条件、参照値、率、丸め前値、ceil後加算値、状態・未対応理由を保持する。UIのdetailsを取り除いても計算層のtraceは利用可能。

`tests/unit-passive.test.js`は既存CASE Cのノエル自己16%分を分離し、参照値2883/2210/2299から462/354/368を検証する。元CASE C全編成の順位対象Passiveは今回未接続のため、全体4532と一致するとは扱わない。Timeline区間と固定seedのSimulation結果はPassive接続の有無で一致する。

## Memory接続（追加）

新ページの編成共通入力から `{kind:'manual-rate', percent:'6.4'}` のような明示的な最終率を取得する。既存の`calculateUnitParameterBreakdown`と同じ共通率の入力モデルを採用する。Memory名・レベルから率を算出するカタログや新しい換算式は追加しない。入力はページ内で保持し、カード・育成・曲時間の変更でも残る。再読み込みで未設定へ戻り、既存localStorageへは書かない。

`UnitSimulatorEngine.build`の第4引数で入力を渡し、`UnitParameterEngine.resolveMemory`がpercentを小数rateへ変換する。入力形式と原入力をsourceとして保持する。

- 空欄：unset、値null。計算済み小計への加算なし。
- 明示0%：applied、各値0。
- 対応する有限・非負の率：applied。各カードのMemoryを既存`calculateMemory`で計算。
- 未対応形式・不正値：unsupported、理由と原入力を保持。既存関数の不正入力→0という既定処理に流さない。

Memoryの計算基数は開花適用後・Passive適用前のP/T/S。Passive/Memory/Board等を含む小計へ順次乗算しない。`ceil(reference * rate)`を各カード・各parameterで適用し、丸め後の値を編成合計する。表示はBase→Bloom→Passive→Memory→現在計算値とし、Enhancement Bonusはまだ接続しない。

Memory traceは入力source、状態・理由、target枠/カード、各parameterの参照値・小数率・丸め前値・ceil後加算値を返す。未設定/未対応の加算値はnull。UIの折りたたみParameter traceで確認できる。現在計算値は適用済みPassive・Memoryのみ加算し、final:nullとUnit Score=Xを維持する。

`tests/unit-memory.test.js`で既存CASE CのMemory 466/518/475/517/475、合計2451、各項ceil、0/未設定/未対応の区別、Passiveとの基数分離、入力非破壊、合算、Enhancement未接続、Timeline/seed Simulation非干渉を確認する。ブラウザーテストはMemory入力・形式切替・値保持・再読込・保存非干渉・1100px/360pxも検証する。

## Enhancement Bonus接続（追加）

既存`calculateEnhancementBonus(base, rate)`を再利用。既存`calculateUnitParameterBreakdown`の基数は各メンバーの`開花後カードTOTAL + Board + Passive + 衣装`で、Memoryは含まない。メンバーごとの合計基数に率を掛けて1回ceilし、編成ではその整数結果を足す。P/T/Sへ分配する式ではないので、enhancementBonusのP/T/Sはnull、totalだけを計算する。現在計算値のP/T/Sは従来どおり、TOTALだけに強化ボーナスを追加する。

UIは編成共通の最終率を%で入力する。既存の既定率0.0243（2.43%）は入力例に留め、空欄へ自動適用しない。Memoryと同じ検証方式でunset/明示0/unsupportedを区別する。未設定・未対応の値はnullで、計算済み小計へ加算しない。入力はページ内のみで保持し、再読み込みで初期化する。

新ページではBoard・衣装・未対応Passiveを接続しないため、強化ボーナスも「計算済み基数のみ」の部分計算。`components`の未接続項目はnull、`excluded`に明示し、0が確定したかのようには扱わない。現在計算値を最終値と呼ばない。traceにはsource、対象カード/枠、parameter:total、率、基数、構成要素、除外項目、Memory除外、丸め前値、ceil後加算値、状態を保持する。

CASE Cは既存`tests/parameter-rules.test.js`が生成するfixtureと期待値を`tests/case-c-enhancement.test.js`で直接参照。完全な基数を渡した共通レイヤーは各メンバー248/300/301/297/251、合計1397と一致する。これはBoard等を省いた新ページの部分計算が1397になるという意味ではない。Boardや他の未対応効果のUI接続は追加しない。

`tests/unit-enhancement.test.js`で未設定/0/未対応、合算、Memory/PassiveとMemory traceの不変、基数trace、P/T/Sへ配分しないこと、Timeline/固定seed Simulation不変を検証する。ブラウザーは率入力・内訳・trace・再読込・保存非干渉・1100px/360pxを検証する。

## Board・衣装の外部TOTAL接続（追加）

各枠の`totalAdjustments.board/costume`に`{kind:'external-total',value:'2937'}`形式で入力を保持する。空欄はunset、0はapplied/0、0以上の安全な整数はapplied、それ以外はinvalid。入力形式自体が未知ならunsupported。数値の取得元はユーザーの明示入力であり、自動計算やP/T/Sへの配分は行わない。

Engineは各補正のsource/status/total/reasonを保持し、P/T/Sはnullとする。結果の`totalAdjustments`はBoard・衣装・Enhancement Bonusをまとめて参照できる。表示のTOTALには入力済みBoard・衣装と強化ボーナスを各1回だけ加算し、P/T/S・Passive・Memoryは変更しない。編成のBoard/衣装合計は設定済み分のみで、不足時はpartialとして個別状態も保持する。

Enhancementのcomponents.board/outfitへ正規化したTOTALを渡す。設定済み0も完全基数の構成要素。未設定/不正入力はnullのまま除外し、未対応Passiveが残る場合も部分基数とする。完全基数は「強化ボーナス式の基数が揃った」の意味で、ユニットの未接続Leader等まで完成した意味ではない。Memoryは引き続き除外する。

traceには対象枠/カード、外部入力source、原入力、正規化値、入力状態、強化基数への採用有無、強化計算実行有無を記録する。Enhancement traceのcomponentsとbasisから全構成を確認可能。ページ再読み込みで外部入力も初期化し、既存保存へ書き込まない。

`tests/unit-total-adjustments.test.js`で状態区別、TOTAL分離、Board/衣装の基数・現在計算値への接続、完全/部分判定、Memory/Passive/Timeline/seed Simulation非干渉を検証。CASE C検証は既存fixtureのBoard/衣装を外部入力の正規化経路に通して同じメンバー値と1397へ一致することを確認する。新ページの未対応順位PassiveをCASE C再現のために追加接続することはしない。
