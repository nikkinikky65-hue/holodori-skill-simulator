# Unit Parameter Passive全件監査

## 属性対象の順位選択接続（最新）

属性対象＋属性人数条件の35カード/70行を実データ確認後に完全対応へ移動した。全件で条件属性＝対象属性、条件人数2、単一P/T/S補正。対象2人が12カード/24行、対象3人が23カード/46行。その他の条件はない。条件2人・対象3人で候補2人の場合は既存slice動作に従い候補2人へ適用する。

| 区分 | 接続前カード/行 | 接続後カード/行 |
|---|---:|---:|
| 完全対応 | 40/80 | 75/150 |
| 限定条件対応 | 15/30 | 15/30 |
| 未対応 | 90/180 | 55/110 |

所属15カードは変更せず、候補3人以上の選択を保留する。未対応55カードは属性対象＋条件未観測41、所属対象＋条件未観測14。全70行の条件・対象・率・原文は監査JSONの固定IDリスト（tests/attribute-target-expected-cards.json）に対応するrowsから参照できる。

属性順位はCASE Cの既存規則（開花後P/T/S合計降順、同値は入力編成順）を再利用。既存rank処理を共有し、所属へ一般化しない。tests/attribute-target.test.jsで全70行×人数1〜5、CASE C、同値、非対象除外、複数sourceと既存計算との一致を検証した。

以下は過去工程の記録。

## 所属対象の限定条件対応

所属2人以上→所属2人補正の15カード/30行をpartialへ分類した。条件未満はinactive、候補ちょうど2人はresolved、3人以上は条件satisfied＋target selection unresolved。情報不足もunresolved。完全対応へは数えない。

| 区分 | カード | 行 |
|---|---:|---:|
| 完全対応 | 40 | 80 |
| 限定条件対応 | 15 | 30 |
| 未対応 | 90 | 180 |
| Parameter非対象 | 40 | 80 |

未対応は属性対象＋属性人数35/70、属性対象＋未観測41/82、所属対象＋未観測14/28。JSONのstatusはsupported/partial/unsupported/non-parameter、partialGroupsで限定群を確認できる。最新入力SHAと実Engine判定に基づき再生成した。下記は初回・所属self接続時の履歴。

## 所属self接続後の再監査（2026-10-02）

最新JSONは所属人数Resolver接続後の実Engine判定。以下の初回監査本文は変更前の記録として残す。

| Parameter Passive | 接続前 | 接続後 |
|---|---:|---:|
| 対応済み（カード/行） | 29 / 58 | 40 / 80 |
| 未対応（カード/行） | 116 / 232 | 105 / 210 |

self＋所属人数の11カード/22行のみが移動した。残りは属性対象＋属性人数35/70、所属対象＋所属人数15/30、属性対象＋条件未観測41/82、所属対象＋条件未観測14/28。Parameter非対象40/80と条件未観測55/110は不変。対応済みは静的なロジック対応を意味し、所属カタログ欠落時や5枠未確定時は実行結果unresolvedとなる。

今回の所属参照はCanonicalの明示Card.characterIdとCharacterGrouping.characterIds。既存計算式・他者対象・順位処理は変更していない。11カードの固定監査IDリストはtests/affiliation-expected-cards.jsonに保持する。

## 以下、初回監査の記録

監査日: 2026-10-02。監査のみ。計算コード・UI・Canonical・Runtime・保存形式は変更していない。

## 1. 現状・単位

185カードに各1 Passive（CanonicalのLivePassiveSkill IDも185種）、各Lv1/Lv2で370行。レベル違いは効果量違いで、Effect/Target/Condition/対応状態の分類は同一と検証した。以下の「カード数」はPassive数と一致するが、共通ロジック数ではない。

`audit_unit_passives.py`が実際の`UnitParameterEngine.resolveInput()`をJavaScriptCoreで呼び、Runtime全370行を分類する。支持判定の再実装はしない。対応済みとはEvaluatorへ渡せる意味であり、ある特定編成で発動する意味ではない。

- 全Passive: **185種 / 370行**
- Parameter対象: **145種 / 290行**
- 対応済みParameter: **29種 / 58行**（self + 属性人数条件 + 全パラUP）
- 未対応Parameter: **116種 / 232行、未対応カード116枚**
- Parameter非対象: **40種 / 80行**（LIVE_ACTIVE_SKILL_EFFECT_UP、原文のスコアサポート）
- Effect自体が不明でParameter対象か判定不能: **0**
- Parameter対象だが条件の有無を判定不能: **55種 / 110行**（未対応116種の内数）

全件一覧は `unit-passive-audit.json` のrows。カードID・名前・タレント・Passive ID・Lv・原文・Canonical pointer・生のtarget/condition・実判定理由・主分類・dependencyを収録する。入力SHAを記録し、再生成差分でデータ/コード変更を検知する。

## 2. Effect / Target / Condition集計

数値は「カード / レベル行」。軸をまたいで足さない。

| Effect | 全件 | 未対応Parameter |
|---|---:|---:|
| P up | 36 / 72 | 36 / 72 |
| T up | 34 / 68 | 34 / 68 |
| S up | 34 / 68 | 34 / 68 |
| all parameter up | 41 / 82 | 12 / 24 |
| Support（Parameter外） | 40 / 80 | 対象外 |

all parameter upはP/T/S全項への補正であり、Board等のTOTAL専用補正とは区別する。

| Target | 全件 | 未対応Parameter |
|---|---:|---:|
| self | 40 / 80 | 11 / 22 |
| attribute members | 106 / 212 | 76 / 152 |
| generation/group members | 39 / 78 | 29 / 58 |

| Condition | 全件 | 未対応Parameter |
|---|---:|---:|
| 属性人数 | 73 / 146 | 35 / 70 |
| 期生・所属人数 | 36 / 72 | 26 / 52 |
| unknown/unobserved | 76 / 152 | 55 / 110 |

条件未観測にはtrigger参照がないが、現Canonicalでは明示noneではない。alwaysへ置き換えない。観測条件は属性2/3人、所属2人。単なるパーティ総人数条件ではない。

## 3. 実判定理由と潜在dependency

Engineの最初の拒否理由は「自己以外の対象・順位選択は未接続」105カード/210行、「属性人数以外の条件は未接続」11/22。

前者は条件検査より先に返るため、条件未観測や所属対応不足を隠す。この2理由だけをロジック種類と解釈せず、次の5群へ分解する。

| 群 | Target | Condition | Effect | カード / 行 | 追加要件・難易度 |
|---|---|---|---|---:|---|
| A | 属性のN人 | 属性人数 | P/T/S | 35 / 70 | 既存属性判定とbaseTotal順位選択の橋渡し。中 |
| B | self | 所属人数 | 全パラ | 11 / 22 | group ID→所属集合の接続。対象順位なし。比較的低〜中 |
| C | 所属の2人 | 所属人数 | P/T/S | 15 / 30 | 所属解決＋既存順位選択。中 |
| D | 属性の2人 | 未観測 | P/T/S、全パラ1カード | 41 / 82 | 属性対象選択に加え、未観測条件の意味の検証が必要。保留 |
| E | 所属の2人 | 未観測 | P/T/S | 14 / 28 | 所属解決＋対象選択＋未観測条件の検証。保留 |

Aの対象数は2人12カード/24行、3人23カード/46行。Bの対象は常に自己。C/D/Eは2人。主分類は排他的、dependencyは重複する。

## 4. 共通Evaluator候補と到達範囲

新しい効果式は不要な可能性が高い。既存`PARAMETER_PASSIVE_TYPES`と`calculatePassiveEffects()`はP/T/S/all、率集約後ceilを実装済み。必要なのは主に次の3つの境界処理。

1. **属性/所属の対象集合→N人選択を既存Evaluatorへ接続**。属性経路だけならAの35/70。所属メンバー解決もあればCの15/30も対象。効果値をpermilから既存percentへ渡し、対象・条件を混同しない。
2. **group IDによる所属解決・人数判定**。単独追加の確実な候補はBの11/22。1と組み合わせるとCの15/30も追加対象。所属ターゲット/条件が別groupを指す可能性をデータ契約として保持する。
3. **条件未観測を解決する証拠・正規化契約**。コードを増やすだけでは処理可能にならない。証拠が得られ、1/2の対応も揃う場合に限りD/Eの55/110が追加候補。

組合せの件数は重複加算しない。1（属性）+2でA+B=46/92、所属対象選択まで接続するとA+B+C=61/122。既存29/58と合わせて90/180。未観測のD/Eまで解決できればParameter145/290へ到達する。これらは必要条件を満たした場合の上限であり、今回対応済みになった件数ではない。

難易度は作業依存の相対評価。Aは件数が多いが対象選択の適用範囲確認が必要、Bは対象順位を伴わないが所属データの橋渡しが必要。D/Eは検証待ちで、実装量だけで評価できない。

## 5. 対象順位・所属の根拠と未解明事項

既存`resolvePassiveTargets()`は対象集合を**開花後・Board等を除くbaseTotal降順、同値は編成順**で並べN人を選ぶ。`tests/parameter-rules.test.js`のCASE Cでは対象順、同値、Board非干渉を検証している。Pの高い順など、新しいparameter別ランキングを推測しない。

Runtimeのtargetにはattribute/groupとtargetCountがあり、top/bottomや順位基数を直接記述するフィールドはない。「top N」は既存Evaluatorを再利用する際の追加要件として記録し、rawの明示指定とは呼ばない。CASE C以外の所属対象等へ既存選択仕様を一般化する範囲は次工程で確認する。

Canonicalには`CharacterGrouping.characterIds`と`Character.regularCharacterGroupingIds`が存在する。従って所属情報が完全に無いわけではない。一方、現在のRuntime memberは表示名・runtime IDの候補対応が中心で、Engine入力に所属集合が接続されていない。表示名やID文字列から所属を推測せず、原本の明示参照を使う設計が必要。今回データ投影は変更しない。

条件未観測55カードは「効果種不明」とは異なる。trigger欠落がゲーム仕様上alwaysなのか、採取範囲の欠落なのかを確認する。原文に条件が書かれないだけでnoneへ確定しない。

## 6. 候補カテゴリの有無

- 他者へ作用し得る属性/所属対象: 未対応Parameter105/210。ただし**自分以外**という明示除外ではない。sourceが候補に含まれる場合もあり得る。
- 複数対象: 同105/210（2人または3人）。全員対象と読み替えない。
- 複数parameter: 未対応全パラ12/24。単一all効果であり複数effect行ではない。
- 条件付き: 未対応Parameter61/122に人数条件を観測。他55/110は不明。
- 明示的な編成全体対象、one ally、others限定、特定メンバー条件/対象、bottom N、parameter順位条件、Active状態依存、Special状態依存、時刻依存、TOTAL専用効果: **今回の370行では該当構造なし**。
- 複合effect/複数selector/複数condition clause: 今回観測なし（未観測条件を除く）。全パラUPを複合effectと数えない。
- Support/スコア系Parameter非対象: 40/80。effect enumのACTIVEという語はActive状態への依存を意味しない。Parameter未対応116カードの実装件数に混ぜない。
- always明示: 0。unobservedをalwaysへ統合しない。

## 7. 次工程候補

A:既存順位選択へのRuntime bridge検証、B:所属参照の投影契約、C:A/Bの共通部品を組合せた検証、D/E:条件未観測の原本/ゲーム実測確認。順序は制約であり、優劣や実装の承認ではない。

未知の式を増やすより、既存のEffect適用、Condition評価、Target集合/順位の境界に対応契約を作る。未確認の場合は引き続きunsupportedを返す。

## 8. 再実行・不変性検証

```
python3 -B research/audit_unit_passives.py
python3 -B research/audit_unit_passives.py --check
python3 -B tests/verify.py
python3 -B tests/runtime-catalog.test.py
python3 -B tests/leader-catalog.test.py
```

監査スクリプトは全185カード/370行、一意(cardId,Lv)、各2Lv、ロジック分類のLv間一致、Canonical SHA一致を検査する。`--check`は成果物を書かずJSONのバイト再生成一致を確認する。

既存verifyはParameter、Passive、CASE C、Memory、Enhancement、外部TOTAL、Timeline、固定seed Simulation、保存互換性を含む。今回の差分は新規監査ファイルのみで、計算・データの入力SHAも記録する。既存結果の不変性を、無変更確認と既存回帰で検証する。

実行結果（今回）: 上記監査の再生成一致、verify、Runtime整合性、Leader整合性はすべてPASS。Chrome headlessのtests/unit-simulator-browser.html、tests/browser.html、tests/navigation-browser.htmlもPASS（1100px/360pxを含む）。既存テストファイルは変更していない。新規監査スクリプト内に集計・一意性・レベル間分類の検査を追加した。
