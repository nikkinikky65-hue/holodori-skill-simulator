> 所属対象Passive更新：開発者承認の暫定解釈で14種/28行を限定接続。完全75/150・限定29/58・未対応41/82。詳細は[promise-passive-resolution.md](promise-passive-resolution.md)。以下の旧未観測55種の集計は承認前の履歴。

> 2026-10-10追補：[Promise条件の原因・解決](promise-leader-resolution.md)。所属は既存データに存在し、欠けていたのはtrigger参照行。原文・正規グループ名・参照IDの一致で条件を解決し、現在Leader全131件対応。以下の旧Promise保留の記述は当初集計の履歴で、この追補と最新集計表を優先する。固定実測編成不足は引き続き未解決。

# ホロドリ統合シミュレーター 開発進捗同期

更新：2026-10-10（日本時間）。専用の既存進捗同期ファイルは見つからなかったため新規作成。[統合版設計記録](unit-simulator-design.md)・機能別研究文書の粒度を踏襲する。本書は現在の実装を記録し、古い監査・実測を上書きしない。

## サマリー

**185カードの5人編成から現在計算可能なParameter合計を求め、それを暫定Unit Scoreとして、Active・対応済みSP/Support・確率補正を含む乱数分布へ流す経路が成立している。** ただしゲーム内の絶対スコア再現は完成していない。

- Source→完全Canonical→Runtime→共通adapterを維持。全185カードを検索・選択可能。
- カード単体P/T/S、開花、対応済みPassive、Memory、外部TOTAL、Enhancementに加え、独立したLeader Parameterを接続。
- Leader Supportも接続済み。**カード固有Leader全体：完全対応131／限定0／未対応0**。Promise条件2件も正規所属データと原文の照合で解決済み。共通衣装54件は別枠で明示選択。
- Parameter Leader **121/121効果行**、Support Leader **26/26効果行**。複合16件は両方を使用できる。
- Passive Parameterは完全75カード/150行、限定15/30、未対応55/110。
- SP確率UPは条件なし24カード/48行を接続、条件付き18/36を保留。周期は変えずActive開始判定時の確率だけを変更。
- Leader/Passive/SPのSupport表示floorモデルは報告された**21/21件に算術一致**。内部時間積分は小数保持。
- 安定版Aを維持し、次世代版は `unit-simulator.html`。**開発版の編成・Leader・入力・SP配置はページ内状態であり保存復元未接続**。

「完全対応」は収録された効果・条件を現計算モデルで処理できる意味。全カードをゲーム内実測済み、未入力情報まで解決済み、絶対スコア再現済みという意味ではない。

## 1. データ・画面・保存

|領域|現在の実装・接続|検証・境界|関連ファイル/資料|
|---|---|---|---|
|原本・Canonical|185枚、全成長曲線、source/evidence/joins/未解決情報保持。完全Canonical 32,055,758 bytes|配信データとは分離。原本は固定commit由来の調査スナップショットで、上流全JSONの完全アーカイブとは異なる|[Runtime設計](runtime-catalog.md)、`canonical-cards.json`、`holodoridb-all-card-survey.json`|
|カードRuntime|1,579,142 bytes。全185枚、P/A/SP各370レベル行、特訓上限スナップショット925行|Lv1/中間Lvの全曲線をブラウザーへ配信しない。完全Canonicalの13,180成長行は保持。再生成・意味整合性テストあり|[runtime-cards.json](../data/runtime-cards.json)、`build_runtime_catalog.py`、[adapter](../canonical-card-adapter.js)|
|カードライブラリ|所持、特訓0〜4、開花0〜5のステッパー。検索・レア度/タイプ、既存メンバー順、SP→A→P、P/T/S＋次行TOTAL|所持OFFでも育成状態を保持。ゲーム画面のボード込み値とは別|[user-card-state.md](user-card-state.md)、[card-catalog.html](../card-catalog.html)、[user-card-state.js](../user-card-state.js)|
|A/B・メンバーLibrary|手入力・185カード呼出・成長状態・保存復元・枠リセット。所持データとは分離|reset後にCanonical参照が復活しない回帰あり。開発版をAへ全面移植したわけではない|[app.js](../app.js)、[library.html](../library.html)、`tests/browser.html`|
|開発版編成|5カード＋独立Leader衣装select、特訓・開花。Memory/Enhancementの編成共通入力|Leader自身を編成5人や人数条件へ加えない。未選択Leaderには共通15%も付与しない。ページreloadで状態は復元しない|[unit-simulator.html](../unit-simulator.html)、[unit-simulator.js](../unit-simulator.js)|
|Leaderライブラリ|131カード固有＋54共通。効果→率グループ、複合保持、折りたたみ|原文保持。表示分類だけを数値式の実測根拠とはしない|[leader-catalog.md](leader-catalog.md)、[leader.html](../leader.html)|
|Leader実行用投影|既存Leaderデータ/監査から185選択肢を自動生成。143,088 bytes|共通衣装は別optgroup。カードRuntimeや完全Canonicalは変更しない|[build_leader_parameter_rules.py](build_leader_parameter_rules.py)、[leader-parameter-rules.json](../data/leader-parameter-rules.json)|
|ナビ・他画面|A／ライブラリ／カード／リーダー／イベント編成探索／開発中の共通ナビ|イベント探索は独立機能。今回のLeader・Parameter連携を探索側へ自動適用したわけではない|[site-navigation.js](../site-navigation.js)、[event.html](../event.html)|

所持状態は `holodori-user-card-state-v1` にcardId→owned/training/openingを保存。A/B・Library・開発版への自動同期はない。アカウント同期やクラウド保存も未実装。

## 2. Parameter Engine

|補正|接続範囲・算出法|実測/回帰の根拠|残る境界|
|---|---|---|---|
|Base P/T/S|CardLevel基礎値×各permil/1000を個別ceil、合計がTOTAL|複数★4/5の一致報告、★3ノエル具体値。185カード×育成状態の自動検査|表示は特訓上限Lv。ゲームの任意現在Lvとは一致しない場合がある|
|特訓・開花|特訓→実データのLv上限。開花は整数化したBaseへ追加率、各項再ceil|★3ノエル開花4/5一致。全段階スキルLv遷移の回帰|特訓倍率を別途掛けない。開花と特訓は独立|
|Passive Parameter|145種/290行中、完全75/150・限定15/30・未対応55/110|CASE C、属性順位、所属人数・対象の既存テスト|所属候補3人以上の2人選択、条件未観測55種を保留|
|Memory|編成共通の率入力。開花後・Passive前の各P/T/S×率を個別ceil|CASE C合計2451|未設定と0を区別。MemoryアイテムDBや自動装備ではない|
|Board/外部衣装|メンバー別の外部TOTALをEngine APIで受け取れる。P/T/Sへ配分しない|CASE C完全基数、未設定/0/不正のテスト|現在通常UIの入力は非表示。盤面・コネクト・衣装自動算出なし|
|Leader Parameter|開花後P/T/S×ライブラリ率を各人各項ceil、独立加算。条件は既存Resolver|今回ユーザー確定仕様＋全ライブラリ自動テスト|提示4組の実測値の固定入力は復元不能。Promise条件2件未接続|
|Enhancement Bonus|開花後TOTAL＋Passive＋Board＋外部衣装＋Leaderを基数に既存関数でメンバーごとceil。Memory除外|CASE C 248/300/301/297/251＝1397|Board/衣装等未設定なら部分基数。Leader分の追加は式変更ではなく入力基数の拡張|
|現在計算値|各P/T/S補正＋TOTAL系補正を集計、trace・未解決状態付き|メンバー/編成合計の整合テスト|完全最終値ではない。未対応を確定0と扱わない|

主要コード：[unit-parameter-engine.js](../unit-parameter-engine.js)、[parameter-rules.js](../parameter-rules.js)、[leader-parameter-engine.js](../leader-parameter-engine.js)。実測根拠：[parameter-score-validation.md](parameter-score-validation.md)。

**表示順と計算基数を分ける。** Passiveは対象parameterごとに率合算後ceil。MemoryはPassive前、Leaderも開花後値を独立参照するため、表示されたsubtotalへ順に倍率を掛けるモデルではない。LeaderをPassiveやMemoryの基数へ混入させない。

開花→スキルLv：0=A1/SP1/P1、1〜2=A2/SP1/P1、3=A2/SP2/P1、4〜5=A2/SP2/P2。共通adapterから解決し、開発版の「使用Lv」表示を除去しても内部利用は維持する。

## 3. Passiveの現状

- 全185種/370行。Parameter対象145/290、Support対象40/80。
- 完全Parameter75種：自己＋属性人数29、自己＋所属人数11、属性対象＋属性人数35。
- 限定Parameter15種：所属2人以上→所属2人へ。2人未満inactive、ちょうど2人resolved、3人以上target selection unresolved。
- 未対応Parameter55種：属性対象＋条件未観測41、所属対象＋条件未観測14。データ欠落を無条件へ変換しない。
- 属性順位は開花後P/T/S合計降順、同値は入力編成順。Passive/Memory/Board/衣装/Enhancementは順位値に含めない。
- Passive Supportは条件observed19カード/38行、未観測21/42。observed19でも候補超過や複数source重複は保留するため「19件完全対応」とは数えない。候補が上限以下で一意・条件成立・単一sourceの範囲のみ適用。

[Passive監査](unit-passive-audit.md)は追記履歴を含むため、先頭の最新75/15/55とJSONを参照。[所属順位根拠](passive-selection-evidence.md)の旧40/15/90を現在件数に使わない。共通基盤は [Condition](../party-condition-resolver.js)、[Target](../passive-target-resolver.js)、[Selection](../passive-selection-resolver.js)。

## 4. Leader最終集計（Parameter＋Support）

現ライブラリのeffect/target/conditionを両Engineの分岐に照合して再集計。全員target、既知P/T/S/all/Support、条件記載なし・参照解決済み属性/所属人数を対応とする。条件未成立は正常な判定であり未対応に数えない。

|カード固有131件の区分|完全対応|限定対応|未対応|
|---|---:|---:|---:|
|Parameterのみ接続時|103|16|12|
|Support接続後（前工程）|129|0|2|
|Promise条件解決後の現在|**131**|**0**|**0**|

|効果行の内訳|収録|接続|保留|
|---|---:|---:|---:|
|Parameter|121|121|0|
|Support|26|26|0|
|合計|147|147|0|
|共通衣装（別枠）|54|54|0|

- Parameter単独105カード中103接続・2保留。複合16カードはParameter16行＋Support16行を併用。Support単独10カードも接続。
- Support内訳：条件なし10、属性人数条件付き16。全員対象であり、条件属性だけのメンバーへ限定しない。
- 未対応2件：IRyS「nephilim sonority」`card-04007-5-uniq-0047-00`（Promise2人以上で全パラ50%）、オーロ・クロニー「刻を忘れるパフォーマンス」`card-04010-4-cmmn-0000-00`（同40%）。Promise条件参照と所属解決の不足が原因。
- 共通衣装54件は自動付与せず、選択した1衣装だけ計算。131件のカード数へ混ぜない。

根拠：[Leader Parameter接続](leader-parameter-integration.md)、[Leader Support接続](leader-support-integration.md)、[旧Leader監査](unit-leader-audit.md)。

### 実測との距離

Support表示は観測JSONの21件すべてと一致。これは表示補正の支持であり、全26カードのゲーム実測ではない。26件全件はデータ・条件・適用の自動テスト。
Leader Parameterの報告値は15%→7492/2486/86165、P100%→17554/2797/96538、45%→22468/2949/101604、条件S130%→19992/2872/99051（Leader/Enhancement/Unit）。全て差引残余76187で整合するが、固定編成の入力が未回収なので**Engineでの実測再現は未検証**。CASE Cをこの編成に読み替えない。

## 5. Timeline・SP・確率・Simulation

|機能|現在接続していること|未接続・実測上の限界|主要ファイル|
|---|---|---|---|
|Active Timeline|共有イベント生成、基本周期÷(1＋頻度UP率)、持続時間、基本boost、最大倍率区間|条件付き上位効果の動的置換は未接続。142 override行は保持のみ（142カードではない）|[active-timeline-engine.js](../active-timeline-engine.js)、adapter|
|共通Timeline View|A/開発版で共用。横書き目盛、Activeクリック詳細。SP帯は全6行背景|開発版だけSupport詳細を渡す。衣装名の旧詳細表示は削除済み|[active-timeline-view.js](../active-timeline-view.js)、`style.css`|
|SP Schedule|slotごとの開始・duration・effects、暫定等間隔、数値編集、後続押出し、曲末制限|曲ごとの実時刻DB・ドラッグなし。暫定配置はゲーム仕様ではない|[special-schedule-engine.js](../special-schedule-engine.js)|
|SP Score Support|全185カード/370レベル行の主Supportを既存方針で使用。Activeとの区間重複へ適用|原データのunobserved情報は保持。追加効果への無条件許可ではない|[scheduled-support-engine.js](../scheduled-support-engine.js)|
|Leader Support|26件の有効率を小数計算へ加算、開始時点の表示補正を生成|赤ボード、未解決Passiveを追加しない|[leader-support-engine.js](../leader-support-engine.js)|
|SP確率UP|42枚/84行中24/48接続、18/36は条件付き保留。Active開始時刻がSP内の場合のみ|COMBO/LIFE/所属条件付き追加効果は保留。SP1枠目のCOMBO成立を仮定しない|[activation-probability-engine.js](../activation-probability-engine.js)、[調査](activation-probability.md)|
|その他SP|回復46行、判定強化44行を保持・表示|計算未接続。効果発生時点/条件変化の扱い等を保留|Runtime、Special Schedule trace|
|基礎確率・補正|低35/中45/高55%を暫定維持。補正は基礎確率×(1＋率合計)。時刻/抽選順不変|概数の厳密性未確定。ボード＋SP合算はopt-in仮説、ボードUI/自動算出なし。100%超過は判定用clampのみ|[activation-probability-rules.js](../activation-probability-rules.js)|
|Simulation|既存イベント候補ごと抽選、試行ごと最大区間積分、固定seed注入、平均/中央値/min/max/P10/P90|ゲーム実得点モデル・ノーツ密度未接続。確率や未接続補正の仮定に依存|[active-random-simulation.js](../active-random-simulation.js)、[unit-simulator-engine.js](../unit-simulator-engine.js)|
|Unit Score|Parameter subtotal.totalを唯一の入力として暫定数値化。各試行はUnit Score×Σ秒×倍率|完全なゲーム内Unit Score/実ノーツ得点ではない。X未確定の旧文書は過去状態|[unit-score-engine.js](../unit-score-engine.js)|

### 三つの時間処理・丸めを混同しない

1. **発動確率**：`SP.start <= event.start < SP.end`。Activeの持続区間intersectionでは判定しない。内部計算値と乱数判定用clamp値はtraceで別保持。
2. **Support表示**：Active開始時点の有効Leader＋解決済みPassive＋SPを集め、`floor(基礎boost×率合計)` を追加表示。例100＋148、70基礎では内部47.6でも表示47。
3. **Support時間積分**：従来どおりActive/SPの重複区間で小数の実効boostを計算する。表示floorを内部値へ流用しない。開始時の表示倍率を曲中ずっと固定する変更もしていない。

SP OFFはSP背景・SP確率・SP Support・関連Passive Supportを除外し配置は保持する。**独立したLeader SupportはOFFでも残る**。Leaderなし＋SP OFFでは旧Active計算へ戻る。

[表示実測](score-support-display-validation.md)は表示を支持し、上記積分をゲーム内最終得点式として確定しない。

## 6. 資料とコードの差異・注意点

- `unit-simulator-design.md`にはX未数値化、Memory等未接続だった当時の説明が残る。現在は後続実装と本書を優先。
- `unit-leader-audit.md`のA0/B0/C131は旧監査・原本参照の確定度。ユーザーの後続計算仕様を使った現在の実装対応129/0/2とは評価軸・時点が違う。
- `leader-parameter-integration.md`の限定16/未対応12はSupport接続前の表。後続Support接続で更新された総合対応数は本書の表。
- Parameter専用traceはSupportを `unsupported`、理由を「Supportは今回未接続」と記録するコードが残る。一方Support層では接続済みで、通常UIは両層を合成する。**この理由文字列は層の限定を表すには不正確で、技術的な表示整理候補**。今回は変更しない。
- `supportTrace.enabled/status`はSPスイッチ由来。SP OFFでもLeaderは計算され得るので、全Supportの無効フラグとして解釈しない。
- Runtimeの`calculationStatus`等には生成時のdeferred/display-onlyが残る。最新Engine対応はそれだけから集計しない。
- ブラウザー保存互換性維持と、開発版への保存機能の接続は別。後者は未実装。

## 7. 検証の現在地

|区分|確認状況|
|---|---|
|ゲーム実測報告と照合|カードP/T/Sの具体例、CASE C Passive4532・Memory2451・Enhancement1397、Support表示21件。詳細は各研究記録|
|ライブラリ全件テスト|185カード成長/スキル、Leader131件147効果と共通54、Leader Support26件、SP確率84行等|
|回帰|`tests/verify.py`：Parameter/Resolver/Support/確率/Timeline/固定seed/保存・DOM整合を包括|
|データ再生成|Runtime、Leader Catalog、Leader実行用投影、Passive/Leader監査のcheckコマンドあり|
|Chrome|前工程で1100px/360pxのLeader選択・解除/表示、統合版SP/Simulation、安定版A/B/Library回帰PASS。今回の文書同期ではChrome再実行なし|

今回の同期でも `python3 -B tests/verify.py` を再実行しPASS。新しいゲーム実測は行っていない。コード/データ/UIの変更なし。件数は現在の派生データとEngine分岐・既存全件テストを照合した再集計。

## 8. 残課題（解決済み仕様を再調査しない）

|優先度|課題|必要な情報/次の判断|
|---|---|---|
|High・資料回収|Promise条件2件|元trigger/所属の明示参照。表示名からIDを生成しない|
|High・資料回収|Leader Parameter4組の実測再現|5カードID・実Lv/開花・各補正・強化率・Leader状態の固定入力。式の再推測は不要|
|High・実機|所属Passive候補超過の2人選択|3人以上でbaseTotal/単項/編成順を識別する編成、同値境界、対象別補正|
|High・実機/原本|Passive条件未観測55、Support未観測21|原本と原文を先に照合し、隠れた条件と取得欠落を区別|
|High・実機|Passive Support候補超過・同種重複|順位が食い違う編成、異なる率の複数source対照。Leader＋単一Passiveの一致から一般化しない|
|High・実機|赤ボードSupport10%の作用先|ボードのみON/OFFの編成内訳・表示・同条件得点。無効とも単純加算とも断定しない|
|High・実機|条件付きSP18枚の確率UP等|条件成立時点・追加効果の持続・動的変化。COMBO/LIFEを仮定しない|
|Medium・設計/確認|Active条件付き置換142行|conditionごとの評価時点・必要なLIFE/COMBO状態入力。基礎へ加算せず置換データを活用|
|Medium・実機|ボード＋SP確率合算・100%超過|合算の直接根拠、適切な統計条件。数学的clampはゲーム仕様の証明ではない|
|Medium・実装|開発版保存/所持データ利用、Board自動計算|既存保存への影響を分けた仕様、既知入力の定義。単なる未実装であり実機課題ではない|
|Later|曲別SP時刻、譜面/実得点|曲・難易度・時刻・ノーツ・判定の対応データ。暫定積分を実スコアと呼ばない|

具体手順は [verification-backlog.md](verification-backlog.md)。既に確定したSP確率の開始時判定、Leader基数・個別ceil、属性Passive順位、Memory/Enhancementを再び未解明へ戻さない。

## 9. 開発全体の二軸と次の候補

### 軸1：編成・Parameterによる基礎値

カード単体→解決済みPassive→独立Memory/Leader→外部TOTAL→Enhancement→現在計算値が接続済み。各基数・丸め・sourceのtraceあり。欠けるのは未解決条件/対象のデータ、Board等の自動入力、開発版保存、固定実測編成の回帰証拠。数値が出ることと完全総合力再現は分ける。

### 軸2：ライブ中の分散・期待値評価

共通Timeline・候補抽選・SP配置・対応済みSupport/確率補正・試行統計まで接続済み。暫定Parameter合計を尺度として比較できる。条件付きActive/SP・未解決Support・曲別実配置・譜面係数/ノーツ/最終得点の関係が不足。画面上の「全発動時」と乱数平均も別指標。

### 推奨順序

1. **固定実測編成の記録回収とPromise参照解決**。既存式を再調査せず、既存実装の再現検証と2件の接続を進める。
2. **少数比較で限定解除できるPassive対象選択・重複の測定**。原本未観測条件はまず取得欠落を調べる。
3. **赤ボードSupportの作用先測定と条件付きSP/Activeの状態仕様の整理**。既存Support式や頻度/確率の区別を再発明しない。
4. **開発版の状態保存・所持育成の利用とtrace用語の整備**。計算の検証と独立して実装可能。A面保存へ無断統合しない。
5. **曲別配置・譜面/実得点の別レイヤー**。現在の時間積分を保ち、測定根拠が揃った範囲で接続。十分に検証した後に安定版Aへの還元を判断する。

## 10. 前回記録からの更新点

専用の前回同期Markdownはないため、[統合版設計](unit-simulator-design.md)と[Leader Parameter接続](leader-parameter-integration.md)を比較基準とした。

- X記号のみの段階からParameter現在合計による暫定数値へ接続済み。
- Leader Parameter119行とSupport26行が併用可能になり、複合16件の限定対応が解消。最終129/0/2へ再集計。
- Support表示floorと内部小数保持を別経路に整理し21実測の回帰を追加。
- SP確率UPの条件なし48行を開始時判定へ接続。メンバー対象不明による旧84行保留を撤回。
- 新規ゲーム測定や固定Leader編成の復元が完了したわけではない。未解決は上記に限定して保持。
