# Active条件付き倍率置換 監査（192枚）

調査日：2026-10-13。静的調査のみ。変更はこの文書だけ。コード・Canonical・Runtime・保存形式は変更しない。

## 接続後の追記

本監査本文は接続前の履歴。後続の開発者指示により全74枚148行を共通 `active-conditional-rules.js` で接続した。属性・所属は既存Resolver、COMBO40/LIFE600は現行モードで成立とする承認済み近似であり実測ではない。AUTO UIは追加せず、将来用policyだけCOMBO不成立・LIFE成立に分離。情報不足はunresolvedで基本倍率。A/B/統合版で共有し、Bは候補編成ごとに再判定。発動時刻・持続・抽選・Support式は変更なし。

全148行と人数境界・不明情報・将来policy・Support後段・Timeline/乱数整合のテストを追加。既存Passive分離テスト2本ではActive置換をテストfixture内だけ除去し、所属参照欠落による新Activeへの正当な影響とPassive回帰を区別した。

## 集計

Canonical / Runtime各192カード・Active384レベル行を照合。条件付き置換は **74カード／148レベル行／148置換効果**。各該当Lvには条件1句・置換1個があり、全件SCORE_UP_PERMIL_UP。残り118カード／236行に置換なし。

|条件|カード|Lv行|条件閾値|計算対応（A/B/統合版共通）|
|---|---:|---:|---|---|
|属性人数|28|56|キュート2人：9枚18行、ピュア2人：10枚20行、ハッピー2人：9枚18行|未対応|
|所属人数|2|4|ゲーマーズ2人、Promise2人：各1枚2行|未対応|
|COMBO|22|44|40以上|未対応|
|LIFE|22|44|600以上|未対応|

**倍率置換の完全対応0／部分対応0／未対応74カード148行。** 基本Active計算や原文表示を「部分的に置換対応」とは数えない。
旧[進捗資料](development-progress.md)・[変換資料](canonical-conversion.md)の142行は185枚時点。追加ラミィ・こよりのLIFE4行、ハコスのPromise2行で148行となる。旧[Promise調査](promise-leader-resolution.md)の「Active/SPにPromise該当なし」も旧データ時点であり、現在はハコスActiveが該当する。

## 元データと置換の根拠

[Canonical](canonical-cards.json)のLiveActiveSkillLevelは `liveActiveSkillEffectGroupId` に基本効果、`additionalLiveSkillTriggerGroupId` に条件、`additionalLiveActiveSkillEffectGroupId` に条件時効果を別参照として保持する。LiveSkillTriggerのtype・threshold・属性／所属IDとLiveActiveSkillEffectのtype・valueを全148行でRuntimeと照合し一致した。

原文は「スコアが35%UP／40コンボ以上でスコアが70%UP」等、条件時の効果値を示す。Canonicalの `evaluationScope=one-active-effect-select-base-or-matching-override`、`replacementEffect` と[既存schemaの明示仕様](canonical-card-schema-proposal.md)は置換として扱う。したがって35+70=105%ではなく70%を使う。rawフィールドの `additional` という名称だけで加算と判断しない。

ただしDBの参照構造だけがゲームの演算子を証明するわけではない。「置換」は原文と既存設計仕様を根拠に保持されている解釈であり、今回独立した実機試験を追加したものではない。値は既存Adapter同様raw permil÷10で%表示する。

## 画面別の実際の計算経路

|画面|データ展開・表示|Timeline／計算|乱数Simulation|
|---|---|---|---|
|A index|共通カード呼び出しで原文・置換条件を保持。adapterのwarningsは基本効果のみと明示|app.js → adaptCanonicalCardToActiveInput → 入力boost → events/maxSegments。条件評価・置換なし|active-random-ui.js → prepare(getMembers()) → 同じ基本boost。置換なし|
|B event|adaptCanonicalCardToEventCardで展開保持。必須枠に原文表示|event.jsがskills.active.boostをmember.boostへ渡しevents/calcMaxで探索。置換なし|Bに独立した乱数Simulationなし。決定論的探索と区別|
|統合版|expandCanonicalBloomが選択Lvの条件付き効果を保持|UnitSimulatorEngine.buildが同じadapterの基本boostをactiveMembersへコピー。ActiveTimelineEngine.eventsは全時刻でm.boost固定|simulateでも同じactiveMembersから候補生成。確率補正・SupportはあるがActive条件置換なし|

[adapter](../canonical-card-adapter.js)の `adaptCanonicalCardToActiveInput()` は **baseEffect.raw.valueだけ** を参照。`expandCanonicalCard()` のactive.calculationStatusもbase-only。[Runtime生成](build_runtime_catalog.py)もbase-onlyを付ける。
[共通Timeline](../active-timeline-engine.js)は条件情報を受け取らず、[乱数](../active-random-simulation.js)も抽選で成功イベントを絞る処理であって置換Evaluatorではない。

[統合オーケストレーター](../unit-simulator-engine.js)のLeader／Passive／SP Supportによる倍率増幅や表示floor、SP発動率補正は別機能。原文や高い表示倍率が見えても条件付きActiveが実行された証拠にはならない。手入力でboostを上書きできるA/Bも自動条件対応には数えない。

## 条件判定と実装可能性

|分類|対象|必要な入力・再利用箇所|最小変更と難易度|
|---|---|---|---|
|1 既存判定再利用|属性28枚56行＋所属2枚4行＝30枚60行|5人の実カード属性・所属ID。[PartyConditionResolver](../party-condition-resolver.js)のresolveAttributeCondition / resolvePartyCondition。grp-gamers・grp-promiseはruntime-affiliationsに存在|共通Active置換評価層、raw clause→既存Resolver入力変換、adapter/UnitSimulatorEngine/A/Bの呼出接続。統合版は中程度、A/Bは手入力・探索ごとの編成コンテキスト対応も必要|
|2 小規模条件追加だけで十分|0枚0行|既存入力だけで済む独立した残存条件はない|COMBO/LIFEの数値比較だけなら容易だが、現在の入力では状態が分からず、この分類に見せかけて接続しない|
|3 状態入力・ゲーム仕様追加確認|COMBO22枚44行＋LIFE22枚44行＝44枚88行|時刻別COMBO／LIFE。現在の3画面にこれらの時系列・入力・ノーツ判定供給なし|状態providerと評価時点の仕様が必要。期間中に40へ到達／600を跨いだ時、発動時固定か再評価かを確認。中～高難度|

この分類は自動計算を目的としたもの。将来「条件成立をユーザーが指定する」近似モードは作れるが、実ゲーム状態の再現や今回の既存入力対応とは別。常時成立を仮定しない。

編成条件はライブ開始前に確定できる（現在の固定5人モデル）。既存Resolverは5枠不足・属性/所属参照不足をunresolvedにするため、その扱いを維持する。A/Bの手入力カードにはマスターID・属性情報が不足しうる。Bは探索の各候補5人ごとに評価し、カード呼び出し時の固定判定を使い回さない。条件成立なら各LvのreplacementEffect、条件不成立ならbaseEffect。不明状態を成立にしない。

## 優先接続案・保留事項

1. 属性人数28枚56行を統合版から接続し、条件未満／ちょうど／超過、各Lvの基本→置換、編成変更時再評価をテストする。
2. 同じ入口で所属2枚4行を既存所属Resolverへ接続。Promiseは今回参照欠落なし。A/Bへはマスター未選択時のunresolvedとB探索単位の再評価を追加する。
3. COMBO/LIFEは必要な時系列入力と評価タイミングを定めてから接続。Active持続中の条件変化、同時刻境界を実機確認する。未達時に最大倍率を使わない。

今回の全148行は置換候補が一つなので複数override競合は発生しない。将来の複数条件同時成立優先順位は未定義のまま。Supportの基礎boostに置換後値を使う際も、Support式自体を変えず表示・Timeline・Simulationで同じ解決結果を共有する設計が必要。

## 参照テスト・今回の検証

- [runtime-catalog.test.py](../tests/runtime-catalog.test.py)：Canonical→Runtimeの置換数・replacementEffect・condition保持、base-onlyを検査。
- [active-random.test.js](../tests/active-random.test.js)：基本イベント・頻度・確率・固定seed。条件置換を実装した証拠ではない。
- [card-library-update.test.js](../tests/card-library-update.test.js)：追加7枚の既存計算接続・seed回帰。追加条件の成立検証ではない。
- [browser.html](../tests/browser.html)：共通カード展開・原文・基本Active呼び出し等。高倍率原文の保持と計算を分けて読む。
- 今回は一時Python処理で192枚384行を走査、条件付き148行の基本／置換値・type・全condition clauseをCanonicalと突合し一致。所属参照2種も確認。全ブラウザー回帰・計算回帰は実行していない（実装変更なし）。

## 全件一覧（Lv別148行）

倍率は「スコアUP効果量%」であり、曲全体の最終倍率ではない。全行ともA/B/統合版の置換は未対応。原文とCanonical参照位置を付け、Lvを別行にする。

|カードID／タレント／カード名|Lv|条件原文|基本%→置換%|Active原文|Canonicalレベル位置|
|---|---:|---|---|---|---|
|`card-00001-4-cmmn-0000-00`<br>ときのそら／空まで届け！まっすぐな歌声|1|40コンボ以上で|35 → 70| 26秒毎に中確率で9秒間スコアが35%UP<br>40コンボ以上でスコアが70%UP|`/cards/1/skills/active/levels/0`|
|`card-00001-4-cmmn-0000-00`<br>ときのそら／空まで届け！まっすぐな歌声|2|40コンボ以上で|40 → 80| 26秒毎に中確率で[highlight]10[/highlight]秒間スコアが[highlight]40[/highlight]%UP<br>40コンボ以上でスコアが[highlight]80[/highlight]%UP|`/cards/1/skills/active/levels/1`|
|`card-00002-4-cmmn-0000-00`<br>ロボ子さん／ゆるふわウインクLIVE|1|キュートタイプ2人以上で|25 → 55| 24秒毎に高確率で10秒間スコアが25%UP<br>キュートタイプ2人以上でスコアが55%UP|`/cards/4/skills/active/levels/0`|
|`card-00002-4-cmmn-0000-00`<br>ロボ子さん／ゆるふわウインクLIVE|2|キュートタイプ2人以上で|35 → 70| 24秒毎に高確率で10秒間スコアが[highlight]35[/highlight]%UP<br>キュートタイプ2人以上でスコアが[highlight]70[/highlight]%UP|`/cards/4/skills/active/levels/1`|
|`card-00004-4-cmmn-0000-00`<br>アキ・ローゼンタール／歌うcuriousハーフエルフ|1|ハッピータイプ2人以上で|30 → 55| 23秒毎に中確率で10秒間スコアが30%UP<br>ハッピータイプ2人以上でスコアが55%UP|`/cards/7/skills/active/levels/0`|
|`card-00004-4-cmmn-0000-00`<br>アキ・ローゼンタール／歌うcuriousハーフエルフ|2|ハッピータイプ2人以上で|35 → 70| 23秒毎に中確率で10秒間スコアが[highlight]35[/highlight]%UP<br>ハッピータイプ2人以上でスコアが[highlight]70[/highlight]%UP|`/cards/7/skills/active/levels/1`|
|`card-00004-5-uniq-0005-00`<br>アキ・ローゼンタール／艶帯びたハーフエルフ|1|ライフ600以上で|50 → 95| 21秒毎に中確率で8秒間スコアが50%UP<br>ライフ600以上でスコアが95%UP|`/cards/8/skills/active/levels/0`|
|`card-00004-5-uniq-0005-00`<br>アキ・ローゼンタール／艶帯びたハーフエルフ|2|ライフ600以上で|55 → 115| 21秒毎に中確率で8秒間スコアが[highlight]55[/highlight]%UP<br>ライフ600以上でスコアが[highlight]115[/highlight]%UP|`/cards/8/skills/active/levels/1`|
|`card-00005-5-uniq-0006-00`<br>赤井はあと／let's freestyle おやつタイム|1|40コンボ以上で|50 → 100| 19秒毎に中確率で7秒間スコアが50%UP<br>40コンボ以上でスコアが100%UP|`/cards/12/skills/active/levels/0`|
|`card-00005-5-uniq-0006-00`<br>赤井はあと／let's freestyle おやつタイム|2|40コンボ以上で|60 → 120| 19秒毎に中確率で7秒間スコアが[highlight]60[/highlight]%UP<br>40コンボ以上でスコアが[highlight]120[/highlight]%UP|`/cards/12/skills/active/levels/1`|
|`card-00006-4-cmmn-0000-00`<br>白上フブキ／ギアあげるFOXパフォーマンス|1|40コンボ以上で|30 → 55| 23秒毎に中確率で10秒間スコアが30%UP<br>40コンボ以上でスコアが55%UP|`/cards/14/skills/active/levels/0`|
|`card-00006-4-cmmn-0000-00`<br>白上フブキ／ギアあげるFOXパフォーマンス|2|40コンボ以上で|35 → 70| 23秒毎に中確率で10秒間スコアが[highlight]35[/highlight]%UP<br>40コンボ以上でスコアが[highlight]70[/highlight]%UP|`/cards/14/skills/active/levels/1`|
|`card-00007-4-cmmn-0000-00`<br>夏色まつり／あざとさ全開キュンキュンライブ|1|ピュアタイプ2人以上で|25 → 55| 24秒毎に高確率で10秒間スコアが25%UP<br>ピュアタイプ2人以上でスコアが55%UP|`/cards/18/skills/active/levels/0`|
|`card-00007-4-cmmn-0000-00`<br>夏色まつり／あざとさ全開キュンキュンライブ|2|ピュアタイプ2人以上で|35 → 70| 24秒毎に高確率で10秒間スコアが[highlight]35[/highlight]%UP<br>ピュアタイプ2人以上でスコアが[highlight]70[/highlight]%UP|`/cards/18/skills/active/levels/1`|
|`card-00007-5-uniq-0008-00`<br>夏色まつり／ハジける快活チアリーダー|1|ライフ600以上で|50 → 100| 23秒毎に高確率で8秒間スコアが50%UP<br>ライフ600以上でスコアが100%UP|`/cards/19/skills/active/levels/0`|
|`card-00007-5-uniq-0008-00`<br>夏色まつり／ハジける快活チアリーダー|2|ライフ600以上で|60 → 120| 23秒毎に高確率で8秒間スコアが[highlight]60[/highlight]%UP<br>ライフ600以上でスコアが[highlight]120[/highlight]%UP|`/cards/19/skills/active/levels/1`|
|`card-00010-5-uniq-0010-00`<br>百鬼あやめ／隠世でのほほん、気ままな提灯|1|ピュアタイプ2人以上で|50 → 100| 29秒毎に高確率で10秒間スコアが50%UP<br>ピュアタイプ2人以上でスコアが100%UP|`/cards/22/skills/active/levels/0`|
|`card-00010-5-uniq-0010-00`<br>百鬼あやめ／隠世でのほほん、気ままな提灯|2|ピュアタイプ2人以上で|60 → 120| 29秒毎に高確率で10秒間スコアが[highlight]60[/highlight]%UP<br>ピュアタイプ2人以上でスコアが[highlight]120[/highlight]%UP|`/cards/22/skills/active/levels/1`|
|`card-00011-4-cmmn-0000-00`<br>癒月ちょこ／保健医さん魅惑のライブ|1|40コンボ以上で|35 → 70| 28秒毎に高確率で9秒間スコアが35%UP<br>40コンボ以上でスコアが70%UP|`/cards/25/skills/active/levels/0`|
|`card-00011-4-cmmn-0000-00`<br>癒月ちょこ／保健医さん魅惑のライブ|2|40コンボ以上で|40 → 80| 28秒毎に高確率で[highlight]10[/highlight]秒間スコアが[highlight]40[/highlight]%UP<br>40コンボ以上でスコアが[highlight]80[/highlight]%UP|`/cards/25/skills/active/levels/1`|
|`card-00012-4-cmmn-0000-00`<br>大空スバル／心照らすActive Live|1|ハッピータイプ2人以上で|35 → 70| 34秒毎に高確率で11秒間スコアが35%UP<br>ハッピータイプ2人以上でスコアが70%UP|`/cards/28/skills/active/levels/0`|
|`card-00012-4-cmmn-0000-00`<br>大空スバル／心照らすActive Live|2|ハッピータイプ2人以上で|45 → 90| 34秒毎に高確率で11秒間スコアが[highlight]45[/highlight]%UP<br>ハッピータイプ2人以上でスコアが[highlight]90[/highlight]%UP|`/cards/28/skills/active/levels/1`|
|`card-00012-5-uniq-0062-00`<br>大空スバル／Energeticスプラッシュ！|1|40コンボ以上で|45 → 90| 17秒毎に中確率で7秒間スコアが45%UP<br>40コンボ以上でスコアが90%UP|`/cards/30/skills/active/levels/0`|
|`card-00012-5-uniq-0062-00`<br>大空スバル／Energeticスプラッシュ！|2|40コンボ以上で|55 → 105| 17秒毎に中確率で7秒間スコアが[highlight]55[/highlight]%UP<br>40コンボ以上でスコアが[highlight]105[/highlight]%UP|`/cards/30/skills/active/levels/1`|
|`card-00013-5-uniq-0002-00`<br>AZKi／咲き誇る一途な花|1|ライフ600以上で|50 → 100| 20秒毎に高確率で7秒間スコアが50%UP<br>ライフ600以上でスコアが100%UP|`/cards/33/skills/active/levels/0`|
|`card-00013-5-uniq-0002-00`<br>AZKi／咲き誇る一途な花|2|ライフ600以上で|60 → 120| 20秒毎に高確率で7秒間スコアが[highlight]60[/highlight]%UP<br>ライフ600以上でスコアが[highlight]120[/highlight]%UP|`/cards/33/skills/active/levels/1`|
|`card-00014-4-cmmn-0000-00`<br>大神ミオ／光射す狼の歌声|1|40コンボ以上で|35 → 65| 32秒毎に高確率で11秒間スコアが35%UP<br>40コンボ以上でスコアが65%UP|`/cards/35/skills/active/levels/0`|
|`card-00014-4-cmmn-0000-00`<br>大神ミオ／光射す狼の歌声|2|40コンボ以上で|40 → 85| 32秒毎に高確率で11秒間スコアが[highlight]40[/highlight]%UP<br>40コンボ以上でスコアが[highlight]85[/highlight]%UP|`/cards/35/skills/active/levels/1`|
|`card-00015-4-cmmn-0000-00`<br>さくらみこ／両手広げるCheerful show|1|ライフ600以上で|30 → 55| 23秒毎に中確率で10秒間スコアが30%UP<br>ライフ600以上でスコアが55%UP|`/cards/39/skills/active/levels/0`|
|`card-00015-4-cmmn-0000-00`<br>さくらみこ／両手広げるCheerful show|2|ライフ600以上で|35 → 70| 23秒毎に中確率で10秒間スコアが[highlight]35[/highlight]%UP<br>ライフ600以上でスコアが[highlight]70[/highlight]%UP|`/cards/39/skills/active/levels/1`|
|`card-00015-5-uniq-0003-00`<br>さくらみこ／サクラBloom|1|40コンボ以上で|45 → 90| 15秒毎に中確率で6秒間スコアが45%UP<br>40コンボ以上でスコアが90%UP|`/cards/40/skills/active/levels/0`|
|`card-00015-5-uniq-0003-00`<br>さくらみこ／サクラBloom|2|40コンボ以上で|55 → 110| 15秒毎に中確率で6秒間スコアが[highlight]55[/highlight]%UP<br>40コンボ以上でスコアが[highlight]110[/highlight]%UP|`/cards/40/skills/active/levels/1`|
|`card-00016-4-cmmn-0000-00`<br>猫又おかゆ／夢中にさせるいたずらCATライブ|1|ゲーマーズが2人以上で|35 → 70| 25秒毎に中確率で9秒間スコアが35%UP<br>ゲーマーズが2人以上でスコアが70%UP|`/cards/43/skills/active/levels/0`|
|`card-00016-4-cmmn-0000-00`<br>猫又おかゆ／夢中にさせるいたずらCATライブ|2|ゲーマーズが2人以上で|40 → 80| 25秒毎に中確率で[highlight]10[/highlight]秒間スコアが[highlight]40[/highlight]%UP<br>ゲーマーズが2人以上でスコアが[highlight]80[/highlight]%UP|`/cards/43/skills/active/levels/1`|
|`card-00016-5-uniq-0014-00`<br>猫又おかゆ／宴の果てに、ナイショの戯れ|1|ライフ600以上で|45 → 90| 25秒毎に中確率で10秒間スコアが45%UP<br>ライフ600以上でスコアが90%UP|`/cards/44/skills/active/levels/0`|
|`card-00016-5-uniq-0014-00`<br>猫又おかゆ／宴の果てに、ナイショの戯れ|2|ライフ600以上で|55 → 110| 25秒毎に中確率で10秒間スコアが[highlight]55[/highlight]%UP<br>ライフ600以上でスコアが[highlight]110[/highlight]%UP|`/cards/44/skills/active/levels/1`|
|`card-00017-5-uniq-0077-00`<br>戌神ころね／密林を舞うワイルドサマー！|1|ピュアタイプ2人以上で|50 → 100| 32秒毎に高確率で11秒間スコアが50%UP<br>ピュアタイプ2人以上でスコアが100%UP|`/cards/49/skills/active/levels/0`|
|`card-00017-5-uniq-0077-00`<br>戌神ころね／密林を舞うワイルドサマー！|2|ピュアタイプ2人以上で|60 → 120| 32秒毎に高確率で11秒間スコアが[highlight]60[/highlight]%UP<br>ピュアタイプ2人以上でスコアが[highlight]120[/highlight]%UP|`/cards/49/skills/active/levels/1`|
|`card-00018-4-cmmn-0000-00`<br>星街すいせい／フロア沸かす目映い存在|1|ハッピータイプ2人以上で|35 → 70| 31秒毎に高確率で10秒間スコアが35%UP<br>ハッピータイプ2人以上でスコアが70%UP|`/cards/51/skills/active/levels/0`|
|`card-00018-4-cmmn-0000-00`<br>星街すいせい／フロア沸かす目映い存在|2|ハッピータイプ2人以上で|45 → 90| 31秒毎に高確率で10秒間スコアが[highlight]45[/highlight]%UP<br>ハッピータイプ2人以上でスコアが[highlight]90[/highlight]%UP|`/cards/51/skills/active/levels/1`|
|`card-00018-5-uniq-0004-00`<br>星街すいせい／心奪うComet Tune|1|ライフ600以上で|50 → 100| 29秒毎に高確率で10秒間スコアが50%UP<br>ライフ600以上でスコアが100%UP|`/cards/52/skills/active/levels/0`|
|`card-00018-5-uniq-0004-00`<br>星街すいせい／心奪うComet Tune|2|ライフ600以上で|60 → 120| 29秒毎に高確率で10秒間スコアが[highlight]60[/highlight]%UP<br>ライフ600以上でスコアが[highlight]120[/highlight]%UP|`/cards/52/skills/active/levels/1`|
|`card-00019-4-cmmn-0000-00`<br>兎田ぺこら／cheekyホッピンバニー|1|ライフ600以上で|30 → 60| 25秒毎に中確率で10秒間スコアが30%UP<br>ライフ600以上でスコアが60%UP|`/cards/55/skills/active/levels/0`|
|`card-00019-4-cmmn-0000-00`<br>兎田ぺこら／cheekyホッピンバニー|2|ライフ600以上で|40 → 75| 25秒毎に中確率で10秒間スコアが[highlight]40[/highlight]%UP<br>ライフ600以上でスコアが[highlight]75[/highlight]%UP|`/cards/55/skills/active/levels/1`|
|`card-00021-5-uniq-0017-00`<br>不知火フレア／ハーフエルフの風渡るゴンドラ|1|40コンボ以上で|50 → 100| 26秒毎に高確率で9秒間スコアが50%UP<br>40コンボ以上でスコアが100%UP|`/cards/59/skills/active/levels/0`|
|`card-00021-5-uniq-0017-00`<br>不知火フレア／ハーフエルフの風渡るゴンドラ|2|40コンボ以上で|60 → 120| 26秒毎に高確率で9秒間スコアが[highlight]60[/highlight]%UP<br>40コンボ以上でスコアが[highlight]120[/highlight]%UP|`/cards/59/skills/active/levels/1`|
|`card-00021-5-uniq-0064-00`<br>不知火フレア／sparks sunset|1|ハッピータイプ2人以上で|50 → 105| 33秒毎に高確率で11秒間スコアが50%UP<br>ハッピータイプ2人以上でスコアが105%UP|`/cards/60/skills/active/levels/0`|
|`card-00021-5-uniq-0064-00`<br>不知火フレア／sparks sunset|2|ハッピータイプ2人以上で|60 → 125| 33秒毎に高確率で11秒間スコアが[highlight]60[/highlight]%UP<br>ハッピータイプ2人以上でスコアが[highlight]125[/highlight]%UP|`/cards/60/skills/active/levels/1`|
|`card-00022-5-uniq-0018-00`<br>白銀ノエル／風薫るおっとり騎士|1|ハッピータイプ2人以上で|50 → 100| 19秒毎に中確率で7秒間スコアが50%UP<br>ハッピータイプ2人以上でスコアが100%UP|`/cards/63/skills/active/levels/0`|
|`card-00022-5-uniq-0018-00`<br>白銀ノエル／風薫るおっとり騎士|2|ハッピータイプ2人以上で|60 → 120| 19秒毎に中確率で7秒間スコアが[highlight]60[/highlight]%UP<br>ハッピータイプ2人以上でスコアが[highlight]120[/highlight]%UP|`/cards/63/skills/active/levels/1`|
|`card-00023-4-cmmn-0000-00`<br>宝鐘マリン／♡とらえる海賊のテリトリー|1|キュートタイプ2人以上で|35 → 70| 25秒毎に高確率で8秒間スコアが35%UP<br>キュートタイプ2人以上でスコアが70%UP|`/cards/66/skills/active/levels/0`|
|`card-00023-4-cmmn-0000-00`<br>宝鐘マリン／♡とらえる海賊のテリトリー|2|キュートタイプ2人以上で|45 → 90| 25秒毎に高確率で8秒間スコアが[highlight]45[/highlight]%UP<br>キュートタイプ2人以上でスコアが[highlight]90[/highlight]%UP|`/cards/66/skills/active/levels/1`|
|`card-00026-4-cmmn-0000-00`<br>角巻わため／広がるhealing sound|1|40コンボ以上で|40 → 80| 35秒毎に高確率で10秒間スコアが40%UP<br>40コンボ以上でスコアが80%UP|`/cards/70/skills/active/levels/0`|
|`card-00026-4-cmmn-0000-00`<br>角巻わため／広がるhealing sound|2|40コンボ以上で|40 → 85| 35秒毎に高確率で[highlight]12[/highlight]秒間スコアが40%UP<br>40コンボ以上でスコアが[highlight]85[/highlight]%UP|`/cards/70/skills/active/levels/1`|
|`card-00026-5-uniq-0021-00`<br>角巻わため／Woolly Smile Festival|1|キュートタイプ2人以上で|45 → 90| 15秒毎に中確率で6秒間スコアが45%UP<br>キュートタイプ2人以上でスコアが90%UP|`/cards/71/skills/active/levels/0`|
|`card-00026-5-uniq-0021-00`<br>角巻わため／Woolly Smile Festival|2|キュートタイプ2人以上で|55 → 110| 15秒毎に中確率で6秒間スコアが[highlight]55[/highlight]%UP<br>キュートタイプ2人以上でスコアが[highlight]110[/highlight]%UP|`/cards/71/skills/active/levels/1`|
|`card-00026-5-uniq-0065-00`<br>角巻わため／真夏のもふもふフロートタイム|1|ハッピータイプ2人以上で|50 → 100| 35秒毎に高確率で12秒間スコアが50%UP<br>ハッピータイプ2人以上でスコアが100%UP|`/cards/72/skills/active/levels/0`|
|`card-00026-5-uniq-0065-00`<br>角巻わため／真夏のもふもふフロートタイム|2|ハッピータイプ2人以上で|60 → 120| 35秒毎に高確率で12秒間スコアが[highlight]60[/highlight]%UP<br>ハッピータイプ2人以上でスコアが[highlight]120[/highlight]%UP|`/cards/72/skills/active/levels/1`|
|`card-00027-4-cmmn-0000-00`<br>常闇トワ／余裕ぶっこくナイトライブ|1|40コンボ以上で|30 → 65| 28秒毎に高確率で10秒間スコアが30%UP<br>40コンボ以上でスコアが65%UP|`/cards/74/skills/active/levels/0`|
|`card-00027-4-cmmn-0000-00`<br>常闇トワ／余裕ぶっこくナイトライブ|2|40コンボ以上で|40 → 80| 28秒毎に高確率で10秒間スコアが[highlight]40[/highlight]%UP<br>40コンボ以上でスコアが[highlight]80[/highlight]%UP|`/cards/74/skills/active/levels/1`|
|`card-00028-5-uniq-0023-00`<br>姫森ルーナ／姫に忠誠アフタヌーン|1|40コンボ以上で|50 → 100| 29秒毎に高確率で10秒間スコアが50%UP<br>40コンボ以上でスコアが100%UP|`/cards/78/skills/active/levels/0`|
|`card-00028-5-uniq-0023-00`<br>姫森ルーナ／姫に忠誠アフタヌーン|2|40コンボ以上で|60 → 120| 29秒毎に高確率で10秒間スコアが[highlight]60[/highlight]%UP<br>40コンボ以上でスコアが[highlight]120[/highlight]%UP|`/cards/78/skills/active/levels/1`|
|`card-00030-4-cmmn-0000-00`<br>雪花ラミィ／照らすsnow mood！|1|ライフ600以上で|35 → 65| 23秒毎に高確率で8秒間スコアが35%UP<br>ライフ600以上でスコアが65%UP|`/cards/81/skills/active/levels/0`|
|`card-00030-4-cmmn-0000-00`<br>雪花ラミィ／照らすsnow mood！|2|ライフ600以上で|35 → 75| 23秒毎に高確率で[highlight]9[/highlight]秒間スコアが35%UP<br>ライフ600以上でスコアが[highlight]75[/highlight]%UP|`/cards/81/skills/active/levels/1`|
|`card-00030-5-uniq-0089-00`<br>雪花ラミィ／火照りを鎮める癒しの一口|1|ライフ600以上で|55 → 110| 24秒毎に中確率で8秒間スコアが55%UP<br>ライフ600以上でスコアが110%UP|`/cards/83/skills/active/levels/0`|
|`card-00030-5-uniq-0089-00`<br>雪花ラミィ／火照りを鎮める癒しの一口|2|ライフ600以上で|65 → 130| 24秒毎に中確率で8秒間スコアが[highlight]65[/highlight]%UP<br>ライフ600以上でスコアが[highlight]130[/highlight]%UP|`/cards/83/skills/active/levels/1`|
|`card-00031-5-uniq-0025-00`<br>桃鈴ねね／一緒に歌お！イノセントリズム|1|ライフ600以上で|50 → 100| 26秒毎に高確率で9秒間スコアが50%UP<br>ライフ600以上でスコアが100%UP|`/cards/86/skills/active/levels/0`|
|`card-00031-5-uniq-0025-00`<br>桃鈴ねね／一緒に歌お！イノセントリズム|2|ライフ600以上で|60 → 120| 26秒毎に高確率で9秒間スコアが[highlight]60[/highlight]%UP<br>ライフ600以上でスコアが[highlight]120[/highlight]%UP|`/cards/86/skills/active/levels/1`|
|`card-00032-4-cmmn-0000-00`<br>獅白ぼたん／魅せるLaughing Lion|1|ライフ600以上で|35 → 65| 30秒毎に中確率で11秒間スコアが35%UP<br>ライフ600以上でスコアが65%UP|`/cards/88/skills/active/levels/0`|
|`card-00032-4-cmmn-0000-00`<br>獅白ぼたん／魅せるLaughing Lion|2|ライフ600以上で|40 → 85| 30秒毎に中確率で11秒間スコアが[highlight]40[/highlight]%UP<br>ライフ600以上でスコアが[highlight]85[/highlight]%UP|`/cards/88/skills/active/levels/1`|
|`card-00032-5-uniq-0026-00`<br>獅白ぼたん／目を奪う神エイム！lion’s hunt|1|ハッピータイプ2人以上で|50 → 105| 27秒毎に高確率で9秒間スコアが50%UP<br>ハッピータイプ2人以上でスコアが105%UP|`/cards/89/skills/active/levels/0`|
|`card-00032-5-uniq-0026-00`<br>獅白ぼたん／目を奪う神エイム！lion’s hunt|2|ハッピータイプ2人以上で|60 → 125| 27秒毎に高確率で9秒間スコアが[highlight]60[/highlight]%UP<br>ハッピータイプ2人以上でスコアが[highlight]125[/highlight]%UP|`/cards/89/skills/active/levels/1`|
|`card-00034-4-cmmn-0000-00`<br>尾丸ポルカ／パーティーハード全開LIVE|1|40コンボ以上で|30 → 60| 26秒毎に高確率で10秒間スコアが30%UP<br>40コンボ以上でスコアが60%UP|`/cards/91/skills/active/levels/0`|
|`card-00034-4-cmmn-0000-00`<br>尾丸ポルカ／パーティーハード全開LIVE|2|40コンボ以上で|40 → 75| 26秒毎に高確率で10秒間スコアが[highlight]40[/highlight]%UP<br>40コンボ以上でスコアが[highlight]75[/highlight]%UP|`/cards/91/skills/active/levels/1`|
|`card-00034-5-uniq-0027-00`<br>尾丸ポルカ／変幻自在！ポルカサーカス開演！|1|ハッピータイプ2人以上で|50 → 95| 21秒毎に中確率で8秒間スコアが50%UP<br>ハッピータイプ2人以上でスコアが95%UP|`/cards/92/skills/active/levels/0`|
|`card-00034-5-uniq-0027-00`<br>尾丸ポルカ／変幻自在！ポルカサーカス開演！|2|ハッピータイプ2人以上で|55 → 115| 21秒毎に中確率で8秒間スコアが[highlight]55[/highlight]%UP<br>ハッピータイプ2人以上でスコアが[highlight]115[/highlight]%UP|`/cards/92/skills/active/levels/1`|
|`card-00035-4-cmmn-0000-00`<br>ラプラス・ダークネス／今宵のライブ、吾輩が主役|1|40コンボ以上で|35 → 65| 32秒毎に高確率で11秒間スコアが35%UP<br>40コンボ以上でスコアが65%UP|`/cards/95/skills/active/levels/0`|
|`card-00035-4-cmmn-0000-00`<br>ラプラス・ダークネス／今宵のライブ、吾輩が主役|2|40コンボ以上で|40 → 85| 32秒毎に高確率で11秒間スコアが[highlight]40[/highlight]%UP<br>40コンボ以上でスコアが[highlight]85[/highlight]%UP|`/cards/95/skills/active/levels/1`|
|`card-00035-5-uniq-0082-00`<br>ラプラス・ダークネス／総帥専用！シークレットプール|1|キュートタイプ2人以上で|50 → 100| 32秒毎に高確率で11秒間スコアが50%UP<br>キュートタイプ2人以上でスコアが100%UP|`/cards/97/skills/active/levels/0`|
|`card-00035-5-uniq-0082-00`<br>ラプラス・ダークネス／総帥専用！シークレットプール|2|キュートタイプ2人以上で|60 → 120| 32秒毎に高確率で11秒間スコアが[highlight]60[/highlight]%UP<br>キュートタイプ2人以上でスコアが[highlight]120[/highlight]%UP|`/cards/97/skills/active/levels/1`|
|`card-00036-4-cmmn-0000-00`<br>鷹嶺ルイ／どこでも信頼！切れ者LIVE|1|40コンボ以上で|40 → 75| 25秒毎に中確率で8秒間スコアが40%UP<br>40コンボ以上でスコアが75%UP|`/cards/99/skills/active/levels/0`|
|`card-00036-4-cmmn-0000-00`<br>鷹嶺ルイ／どこでも信頼！切れ者LIVE|2|40コンボ以上で|50 → 95| 25秒毎に中確率で8秒間スコアが[highlight]50[/highlight]%UP<br>40コンボ以上でスコアが[highlight]95[/highlight]%UP|`/cards/99/skills/active/levels/1`|
|`card-00036-5-uniq-0029-00`<br>鷹嶺ルイ／組織支える超敏腕幹部|1|キュートタイプ2人以上で|50 → 95| 21秒毎に中確率で8秒間スコアが50%UP<br>キュートタイプ2人以上でスコアが95%UP|`/cards/100/skills/active/levels/0`|
|`card-00036-5-uniq-0029-00`<br>鷹嶺ルイ／組織支える超敏腕幹部|2|キュートタイプ2人以上で|55 → 115| 21秒毎に中確率で8秒間スコアが[highlight]55[/highlight]%UP<br>キュートタイプ2人以上でスコアが[highlight]115[/highlight]%UP|`/cards/100/skills/active/levels/1`|
|`card-00037-4-cmmn-0000-00`<br>博衣こより／舞台に響くcute howl|1|40コンボ以上で|30 → 60| 22秒毎に中確率で9秒間スコアが30%UP<br>40コンボ以上でスコアが60%UP|`/cards/103/skills/active/levels/0`|
|`card-00037-4-cmmn-0000-00`<br>博衣こより／舞台に響くcute howl|2|40コンボ以上で|35 → 75| 22秒毎に中確率で9秒間スコアが[highlight]35[/highlight]%UP<br>40コンボ以上でスコアが[highlight]75[/highlight]%UP|`/cards/103/skills/active/levels/1`|
|`card-00037-5-uniq-0086-00`<br>博衣こより／振り向きざまのaventure|1|ライフ600以上で|50 → 100| 25秒毎に中確率で9秒間スコアが50%UP<br>ライフ600以上でスコアが100%UP|`/cards/105/skills/active/levels/0`|
|`card-00037-5-uniq-0086-00`<br>博衣こより／振り向きざまのaventure|2|ライフ600以上で|60 → 120| 25秒毎に中確率で9秒間スコアが[highlight]60[/highlight]%UP<br>ライフ600以上でスコアが[highlight]120[/highlight]%UP|`/cards/105/skills/active/levels/1`|
|`card-03001-4-cmmn-0000-00`<br>アユンダ・リス／まんまるしっぽのキュートライブ|1|ライフ600以上で|30 → 55| 23秒毎に中確率で10秒間スコアが30%UP<br>ライフ600以上でスコアが55%UP|`/cards/110/skills/active/levels/0`|
|`card-03001-4-cmmn-0000-00`<br>アユンダ・リス／まんまるしっぽのキュートライブ|2|ライフ600以上で|35 → 70| 23秒毎に中確率で10秒間スコアが[highlight]35[/highlight]%UP<br>ライフ600以上でスコアが[highlight]70[/highlight]%UP|`/cards/110/skills/active/levels/1`|
|`card-03002-4-cmmn-0000-00`<br>ムーナ・ホシノヴァ／月のヒカリに溶けこむ歌声|1|ライフ600以上で|35 → 70| 25秒毎に高確率で8秒間スコアが35%UP<br>ライフ600以上でスコアが70%UP|`/cards/113/skills/active/levels/0`|
|`card-03002-4-cmmn-0000-00`<br>ムーナ・ホシノヴァ／月のヒカリに溶けこむ歌声|2|ライフ600以上で|45 → 90| 25秒毎に高確率で8秒間スコアが[highlight]45[/highlight]%UP<br>ライフ600以上でスコアが[highlight]90[/highlight]%UP|`/cards/113/skills/active/levels/1`|
|`card-03004-4-cmmn-0000-00`<br>クレイジー・オリー／Deadly Encore|1|ライフ600以上で|30 → 60| 25秒毎に中確率で10秒間スコアが30%UP<br>ライフ600以上でスコアが60%UP|`/cards/119/skills/active/levels/0`|
|`card-03004-4-cmmn-0000-00`<br>クレイジー・オリー／Deadly Encore|2|ライフ600以上で|40 → 75| 25秒毎に中確率で10秒間スコアが[highlight]40[/highlight]%UP<br>ライフ600以上でスコアが[highlight]75[/highlight]%UP|`/cards/119/skills/active/levels/1`|
|`card-03004-5-uniq-0036-00`<br>クレイジー・オリー／Z nonstop talker|1|ピュアタイプ2人以上で|45 → 90| 25秒毎に中確率で10秒間スコアが45%UP<br>ピュアタイプ2人以上でスコアが90%UP|`/cards/120/skills/active/levels/0`|
|`card-03004-5-uniq-0036-00`<br>クレイジー・オリー／Z nonstop talker|2|ピュアタイプ2人以上で|55 → 110| 25秒毎に中確率で10秒間スコアが[highlight]55[/highlight]%UP<br>ピュアタイプ2人以上でスコアが[highlight]110[/highlight]%UP|`/cards/120/skills/active/levels/1`|
|`card-03005-4-cmmn-0000-00`<br>アーニャ・メルフィッサ／Little Back気ままなステージ|1|ライフ600以上で|35 → 70| 30秒毎に高確率で10秒間スコアが35%UP<br>ライフ600以上でスコアが70%UP|`/cards/123/skills/active/levels/0`|
|`card-03005-4-cmmn-0000-00`<br>アーニャ・メルフィッサ／Little Back気ままなステージ|2|ライフ600以上で|40 → 80| 30秒毎に高確率で[highlight]11[/highlight]秒間スコアが[highlight]40[/highlight]%UP<br>ライフ600以上でスコアが[highlight]80[/highlight]%UP|`/cards/123/skills/active/levels/1`|
|`card-03006-5-uniq-0038-00`<br>パヴォリア・レイネ／おすまし孔雀と嗜む一杯|1|ハッピータイプ2人以上で|50 → 100| 29秒毎に高確率で10秒間スコアが50%UP<br>ハッピータイプ2人以上でスコアが100%UP|`/cards/128/skills/active/levels/0`|
|`card-03006-5-uniq-0038-00`<br>パヴォリア・レイネ／おすまし孔雀と嗜む一杯|2|ハッピータイプ2人以上で|60 → 120| 29秒毎に高確率で10秒間スコアが[highlight]60[/highlight]%UP<br>ハッピータイプ2人以上でスコアが[highlight]120[/highlight]%UP|`/cards/128/skills/active/levels/1`|
|`card-03007-4-cmmn-0000-00`<br>ベスティア・ゼータ／childlikeるんるんライブ|1|40コンボ以上で|30 → 55| 34秒毎に高確率で14秒間スコアが30%UP<br>40コンボ以上でスコアが55%UP|`/cards/130/skills/active/levels/0`|
|`card-03007-4-cmmn-0000-00`<br>ベスティア・ゼータ／childlikeるんるんライブ|2|40コンボ以上で|35 → 70| 34秒毎に高確率で14秒間スコアが[highlight]35[/highlight]%UP<br>40コンボ以上でスコアが[highlight]70[/highlight]%UP|`/cards/130/skills/active/levels/1`|
|`card-03008-5-uniq-0040-00`<br>カエラ・コヴァルスキア／こころ強さは鍛冶場で研ぐ|1|キュートタイプ2人以上で|50 → 100| 19秒毎に中確率で7秒間スコアが50%UP<br>キュートタイプ2人以上でスコアが100%UP|`/cards/134/skills/active/levels/0`|
|`card-03008-5-uniq-0040-00`<br>カエラ・コヴァルスキア／こころ強さは鍛冶場で研ぐ|2|キュートタイプ2人以上で|60 → 120| 19秒毎に中確率で7秒間スコアが[highlight]60[/highlight]%UP<br>キュートタイプ2人以上でスコアが[highlight]120[/highlight]%UP|`/cards/134/skills/active/levels/1`|
|`card-03009-4-cmmn-0000-00`<br>こぼ・かなえる／ドタバタフルスロットルステージ|1|40コンボ以上で|30 → 55| 23秒毎に中確率で10秒間スコアが30%UP<br>40コンボ以上でスコアが55%UP|`/cards/136/skills/active/levels/0`|
|`card-03009-4-cmmn-0000-00`<br>こぼ・かなえる／ドタバタフルスロットルステージ|2|40コンボ以上で|35 → 70| 23秒毎に中確率で10秒間スコアが[highlight]35[/highlight]%UP<br>40コンボ以上でスコアが[highlight]70[/highlight]%UP|`/cards/136/skills/active/levels/1`|
|`card-03009-5-uniq-0041-00`<br>こぼ・かなえる／あめ上がりの雨喜雨喜シャーマン|1|ピュアタイプ2人以上で|45 → 90| 15秒毎に中確率で6秒間スコアが45%UP<br>ピュアタイプ2人以上でスコアが90%UP|`/cards/137/skills/active/levels/0`|
|`card-03009-5-uniq-0041-00`<br>こぼ・かなえる／あめ上がりの雨喜雨喜シャーマン|2|ピュアタイプ2人以上で|55 → 110| 15秒毎に中確率で6秒間スコアが[highlight]55[/highlight]%UP<br>ピュアタイプ2人以上でスコアが[highlight]110[/highlight]%UP|`/cards/137/skills/active/levels/1`|
|`card-04001-4-cmmn-0000-00`<br>森カリオペ／レペゼン冥土！ here we go|1|40コンボ以上で|35 → 65| 26秒毎に高確率で9秒間スコアが35%UP<br>40コンボ以上でスコアが65%UP|`/cards/140/skills/active/levels/0`|
|`card-04001-4-cmmn-0000-00`<br>森カリオペ／レペゼン冥土！ here we go|2|40コンボ以上で|40 → 75| 26秒毎に高確率で[highlight]10[/highlight]秒間スコアが[highlight]40[/highlight]%UP<br>40コンボ以上でスコアが[highlight]75[/highlight]%UP|`/cards/140/skills/active/levels/1`|
|`card-04003-4-cmmn-0000-00`<br>一伊那尓栖／舞台を飾る和やか笑顔|1|ライフ600以上で|30 → 55| 23秒毎に中確率で10秒間スコアが30%UP<br>ライフ600以上でスコアが55%UP|`/cards/147/skills/active/levels/0`|
|`card-04003-4-cmmn-0000-00`<br>一伊那尓栖／舞台を飾る和やか笑顔|2|ライフ600以上で|35 → 70| 23秒毎に中確率で10秒間スコアが[highlight]35[/highlight]%UP<br>ライフ600以上でスコアが[highlight]70[/highlight]%UP|`/cards/147/skills/active/levels/1`|
|`card-04003-5-uniq-0044-00`<br>一伊那尓栖／ぽかぽかチャージなひととき|1|ピュアタイプ2人以上で|45 → 85| 32秒毎に高確率で13秒間スコアが45%UP<br>ピュアタイプ2人以上でスコアが85%UP|`/cards/148/skills/active/levels/0`|
|`card-04003-5-uniq-0044-00`<br>一伊那尓栖／ぽかぽかチャージなひととき|2|ピュアタイプ2人以上で|45 → 95| 32秒毎に高確率で[highlight]14[/highlight]秒間スコアが45%UP<br>ピュアタイプ2人以上でスコアが[highlight]95[/highlight]%UP|`/cards/148/skills/active/levels/1`|
|`card-04007-4-cmmn-0000-00`<br>IRyS／響き渡るホープフルボイス|1|ライフ600以上で|35 → 70| 31秒毎に高確率で10秒間スコアが35%UP<br>ライフ600以上でスコアが70%UP|`/cards/151/skills/active/levels/0`|
|`card-04007-4-cmmn-0000-00`<br>IRyS／響き渡るホープフルボイス|2|ライフ600以上で|45 → 90| 31秒毎に高確率で10秒間スコアが[highlight]45[/highlight]%UP<br>ライフ600以上でスコアが[highlight]90[/highlight]%UP|`/cards/151/skills/active/levels/1`|
|`card-04010-5-uniq-0049-00`<br>オーロ・クロニー／典獄ささやくClock Tower|1|キュートタイプ2人以上で|50 → 95| 33秒毎に高確率で12秒間スコアが50%UP<br>キュートタイプ2人以上でスコアが95%UP|`/cards/155/skills/active/levels/0`|
|`card-04010-5-uniq-0049-00`<br>オーロ・クロニー／典獄ささやくClock Tower|2|キュートタイプ2人以上で|55 → 115| 33秒毎に高確率で12秒間スコアが[highlight]55[/highlight]%UP<br>キュートタイプ2人以上でスコアが[highlight]115[/highlight]%UP|`/cards/155/skills/active/levels/1`|
|`card-04012-4-cmmn-0000-00`<br>ハコス・ベールズ／Let's dance more！|1|ライフ600以上で|40 → 75| 22秒毎に中確率で7秒間スコアが40%UP<br>ライフ600以上でスコアが75%UP|`/cards/157/skills/active/levels/0`|
|`card-04012-4-cmmn-0000-00`<br>ハコス・ベールズ／Let's dance more！|2|ライフ600以上で|50 → 95| 22秒毎に中確率で7秒間スコアが[highlight]50[/highlight]%UP<br>ライフ600以上でスコアが[highlight]95[/highlight]%UP|`/cards/157/skills/active/levels/1`|
|`card-04012-5-uniq-0087-00`<br>ハコス・ベールズ／これがボクのイチオシ！|1|Promiseが2人以上で|50 → 105| 22秒毎に中確率で8秒間スコアが50%UP<br>Promiseが2人以上でスコアが105%UP|`/cards/159/skills/active/levels/0`|
|`card-04012-5-uniq-0087-00`<br>ハコス・ベールズ／これがボクのイチオシ！|2|Promiseが2人以上で|65 → 125| 22秒毎に中確率で8秒間スコアが[highlight]65[/highlight]%UP<br>Promiseが2人以上でスコアが[highlight]125[/highlight]%UP|`/cards/159/skills/active/levels/1`|
|`card-04013-5-uniq-0052-00`<br>シオリ・ノヴェラ／書庫ではぐくむ探求心|1|40コンボ以上で|50 → 100| 32秒毎に高確率で11秒間スコアが50%UP<br>40コンボ以上でスコアが100%UP|`/cards/162/skills/active/levels/0`|
|`card-04013-5-uniq-0052-00`<br>シオリ・ノヴェラ／書庫ではぐくむ探求心|2|40コンボ以上で|60 → 120| 32秒毎に高確率で11秒間スコアが[highlight]60[/highlight]%UP<br>40コンボ以上でスコアが[highlight]120[/highlight]%UP|`/cards/162/skills/active/levels/1`|
|`card-04013-5-uniq-0083-00`<br>シオリ・ノヴェラ／知を潤すナイトプール|1|キュートタイプ2人以上で|50 → 95| 29秒毎に中確率で11秒間スコアが50%UP<br>キュートタイプ2人以上でスコアが95%UP|`/cards/163/skills/active/levels/0`|
|`card-04013-5-uniq-0083-00`<br>シオリ・ノヴェラ／知を潤すナイトプール|2|キュートタイプ2人以上で|60 → 115| 29秒毎に中確率で11秒間スコアが[highlight]60[/highlight]%UP<br>キュートタイプ2人以上でスコアが[highlight]115[/highlight]%UP|`/cards/163/skills/active/levels/1`|
|`card-04014-5-uniq-0053-00`<br>古石ビジュー／キラッキラCrystal place|1|40コンボ以上で|55 → 110| 27秒毎に中確率で9秒間スコアが55%UP<br>40コンボ以上でスコアが110%UP|`/cards/166/skills/active/levels/0`|
|`card-04014-5-uniq-0053-00`<br>古石ビジュー／キラッキラCrystal place|2|40コンボ以上で|65 → 130| 27秒毎に中確率で9秒間スコアが[highlight]65[/highlight]%UP<br>40コンボ以上でスコアが[highlight]130[/highlight]%UP|`/cards/166/skills/active/levels/1`|
|`card-04015-4-cmmn-0000-00`<br>ネリッサ・レイヴンクロフト／美声届ける夕闇ステージ|1|ライフ600以上で|35 → 70| 28秒毎に高確率で9秒間スコアが35%UP<br>ライフ600以上でスコアが70%UP|`/cards/168/skills/active/levels/0`|
|`card-04015-4-cmmn-0000-00`<br>ネリッサ・レイヴンクロフト／美声届ける夕闇ステージ|2|ライフ600以上で|45 → 90| 28秒毎に高確率で9秒間スコアが[highlight]45[/highlight]%UP<br>ライフ600以上でスコアが[highlight]90[/highlight]%UP|`/cards/168/skills/active/levels/1`|
|`card-04016-4-cmmn-0000-00`<br>フワワ・アビスガード／ホッと安らぐフワフワライブ|1|ピュアタイプ2人以上で|35 → 70| 30秒毎に高確率で10秒間スコアが35%UP<br>ピュアタイプ2人以上でスコアが70%UP|`/cards/171/skills/active/levels/0`|
|`card-04016-4-cmmn-0000-00`<br>フワワ・アビスガード／ホッと安らぐフワフワライブ|2|ピュアタイプ2人以上で|40 → 80| 30秒毎に高確率で[highlight]11[/highlight]秒間スコアが[highlight]40[/highlight]%UP<br>ピュアタイプ2人以上でスコアが[highlight]80[/highlight]%UP|`/cards/171/skills/active/levels/1`|
|`card-04016-5-uniq-0055-00`<br>フワワ・アビスガード／ぽわぽわドーナツパーティー♪|1|40コンボ以上で|45 → 90| 20秒毎に中確率で8秒間スコアが45%UP<br>40コンボ以上でスコアが90%UP|`/cards/172/skills/active/levels/0`|
|`card-04016-5-uniq-0055-00`<br>フワワ・アビスガード／ぽわぽわドーナツパーティー♪|2|40コンボ以上で|55 → 110| 20秒毎に中確率で8秒間スコアが[highlight]55[/highlight]%UP<br>40コンボ以上でスコアが[highlight]110[/highlight]%UP|`/cards/172/skills/active/levels/1`|
|`card-04016-5-uniq-0079-00`<br>フワワ・アビスガード／フワワのFlowing Summer|1|ピュアタイプ2人以上で|50 → 100| 35秒毎に高確率で12秒間スコアが50%UP<br>ピュアタイプ2人以上でスコアが100%UP|`/cards/173/skills/active/levels/0`|
|`card-04016-5-uniq-0079-00`<br>フワワ・アビスガード／フワワのFlowing Summer|2|ピュアタイプ2人以上で|60 → 120| 35秒毎に高確率で12秒間スコアが[highlight]60[/highlight]%UP<br>ピュアタイプ2人以上でスコアが[highlight]120[/highlight]%UP|`/cards/173/skills/active/levels/1`|
|`card-04017-4-cmmn-0000-00`<br>モココ・アビスガード／パッと笑顔にモコモコライブ|1|ピュアタイプ2人以上で|35 → 70| 25秒毎に高確率で8秒間スコアが35%UP<br>ピュアタイプ2人以上でスコアが70%UP|`/cards/175/skills/active/levels/0`|
|`card-04017-4-cmmn-0000-00`<br>モココ・アビスガード／パッと笑顔にモコモコライブ|2|ピュアタイプ2人以上で|45 → 90| 25秒毎に高確率で8秒間スコアが[highlight]45[/highlight]%UP<br>ピュアタイプ2人以上でスコアが[highlight]90[/highlight]%UP|`/cards/175/skills/active/levels/1`|
|`card-04017-5-uniq-0080-00`<br>モココ・アビスガード／モココのBreezy Summer|1|ピュアタイプ2人以上で|50 → 100| 22秒毎に中確率で8秒間スコアが50%UP<br>ピュアタイプ2人以上でスコアが100%UP|`/cards/177/skills/active/levels/0`|
|`card-04017-5-uniq-0080-00`<br>モココ・アビスガード／モココのBreezy Summer|2|ピュアタイプ2人以上で|60 → 120| 22秒毎に中確率で8秒間スコアが[highlight]60[/highlight]%UP<br>ピュアタイプ2人以上でスコアが[highlight]120[/highlight]%UP|`/cards/177/skills/active/levels/1`|
|`card-06003-4-cmmn-0000-00`<br>一条莉々華／ずっきゅんばっきゅんLIVE♡|1|キュートタイプ2人以上で|35 → 70| 30秒毎に高確率で10秒間スコアが35%UP<br>キュートタイプ2人以上でスコアが70%UP|`/cards/183/skills/active/levels/0`|
|`card-06003-4-cmmn-0000-00`<br>一条莉々華／ずっきゅんばっきゅんLIVE♡|2|キュートタイプ2人以上で|40 → 80| 30秒毎に高確率で[highlight]11[/highlight]秒間スコアが[highlight]40[/highlight]%UP<br>キュートタイプ2人以上でスコアが[highlight]80[/highlight]%UP|`/cards/183/skills/active/levels/1`|
|`card-06004-5-uniq-0060-00`<br>儒烏風亭らでん／叡智を灯し、アートに導く|1|ライフ600以上で|50 → 95| 22秒毎に高確率で8秒間スコアが50%UP<br>ライフ600以上でスコアが95%UP|`/cards/188/skills/active/levels/0`|
|`card-06004-5-uniq-0060-00`<br>儒烏風亭らでん／叡智を灯し、アートに導く|2|ライフ600以上で|55 → 115| 22秒毎に高確率で8秒間スコアが[highlight]55[/highlight]%UP<br>ライフ600以上でスコアが[highlight]115[/highlight]%UP|`/cards/188/skills/active/levels/1`|
|`card-06005-4-cmmn-0000-00`<br>轟はじめ／番長の番長たる所以|1|ライフ600以上で|30 → 55| 27秒毎に高確率で11秒間スコアが30%UP<br>ライフ600以上でスコアが55%UP|`/cards/190/skills/active/levels/0`|
|`card-06005-4-cmmn-0000-00`<br>轟はじめ／番長の番長たる所以|2|ライフ600以上で|35 → 70| 27秒毎に高確率で11秒間スコアが[highlight]35[/highlight]%UP<br>ライフ600以上でスコアが[highlight]70[/highlight]%UP|`/cards/190/skills/active/levels/1`|
|`card-06005-5-uniq-0061-00`<br>轟はじめ／ガーリー番長のお裾分け|1|40コンボ以上で|50 → 100| 26秒毎に高確率で9秒間スコアが50%UP<br>40コンボ以上でスコアが100%UP|`/cards/191/skills/active/levels/0`|
|`card-06005-5-uniq-0061-00`<br>轟はじめ／ガーリー番長のお裾分け|2|40コンボ以上で|60 → 120| 26秒毎に高確率で9秒間スコアが[highlight]60[/highlight]%UP<br>40コンボ以上でスコアが[highlight]120[/highlight]%UP|`/cards/191/skills/active/levels/1`|
