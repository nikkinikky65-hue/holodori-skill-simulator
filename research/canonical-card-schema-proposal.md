# Canonical Card Schema案（設計提案・未実装）

## 目的と境界

本案は [holodoridb-all-card-survey.json](holodoridb-all-card-survey.json) に収録された185カードおよびJOIN済みソース行の全フィールドを、HolodoriDBのJOIN構造から独立したカード概念と、追跡可能な原情報の両方で表現するための提案です。機械可読な形の骨格は [canonical-card-schema-proposal.schema.json](canonical-card-schema-proposal.schema.json) にあります。

これは**設計案**であり、既存コード・保存データに適用するCanonical schemaの確定ではありません。全カードの変換、Card Library・シミュレーター・Eventへの接続、データの表示は行っていません。

ソース固定情報はHolodoriDB日本語差分リポジトリ `HolodoriDB/holodori-db-jpn-diff`、commit `e43f062c32ff4e04567235efcd58448cd6b10f35`。未確定enumや数値の意味・単位・丸めを推測して正規化せず、変換候補を記録する場合はraw値と分離し、根拠・確度を付けます。

## 分離方針

提案するデータセットは次の二層です。

1. **カード概念層 `cards[]`** — identity/classification/progression/skills等、ゲーム上のカードのまとまりを表す。HolodoriDBの`group_id`や具体的テーブル名をカード属性として埋め込まない。
2. **出典証拠層 `sourceRecords[]` と `joins[]`** — ソース行を`(table, sourceId)`で識別し、元wrapper、元fields、JOIN辺を保持する。概念層の各観測値は`fact`として出典行・フィールドを指し、元のJSON型・文字列表現を`rawValue`で維持する。

HolodoriDBの複合キーを持つ行では、`sourceId`に調査JSONと同じ安定したwrapper由来キー（例:`group_id=...;level=...`）を使い、`sourceWrapper`も残す。カード内のローカルIDと外部のIDは別物として扱い、HolodoriDBのIDをLibraryの`id`に代入しない。

### 提案する共通形

- `sourceDataset`: repository / commit SHA /取得日時 /対象範囲。
- `cards[]`: 1件のカード概念。`sourceCard`、`identity`、`classification`、`progression`、`skills`、`otherSourceRefs`、`sourceFieldFacts`を持つ。
- `sourceRecords[]`: JOINで到達した原行をテーブル別に重複排除して格納。`fields`は任意のJSON objectであり、未知フィールドも保持する。
- `joins[]`: `from/to`のtable-qualified source ref、source/target field、元join値を記録。データベース上のリンクであって、ゲーム上の意味を主張しない。
- `unresolvedReferences[]`: 参照先欠落を既定値で補わず記録。
- `fact`: `{source:{table,sourceId}, sourceField, rawValue, semanticCandidate?, annotations?}`。意味を判断できないenumはraw値のみでもよい。候補値は`status=candidate`または`unresolved`とし、raw値を書き換えない。

### スキルのゲーム概念と出典参照

各スキルはlevelごとの原情報を保持しつつ、スキル種別ごとのゲーム概念を別フィールドにします。全source field/group IDも`facts[]`・`sourceReferences[]`に保持します。

- **Active:** 1つのbase effectと0..N個の`conditionalOverrides[]`を持ちます。条件が成立した場合はbase effectに加算せず、条件に対応するupper/replacement effectで置換します。複数条件に同時成立する場合の優先順位が未定義なら、schemaは暗黙の選択規則を設けず、候補とraw参照を保持します。
- **Activeの条件:** 編成依存条件（属性枚数、所属/グループ人数）は編成から評価する条件として分類します。Combo/LIFEのようなプレイヤー状態依存条件はraw条件とbase/upper valueの関係を保持しますが、動的なCombo/LIFE時系列は計算しません。両方をconditionのsource facts/referencesとして残します。
- **Passive:** 各levelは単一の`effect`、単一の`target`、optionalな`condition`を持ちます。条件が無いことと、source上の条件fieldが未観測であることは区別します。
- **Special:** 各levelは0..N個の`effects[]`を持ちます。primaryとadditionalは独立した第二効果であり、Activeのreplacementとは異なります。各Special効果は個別にoptional conditionを持てます。
- **条件参照:** trigger/effect groupを元field名・raw join値・source refで保存します。ゲーム動作への分類は上記の明示ルールに沿って行い、未分類のraw enumを推測で別条件へ読み替えません。

これはデータ表現の設計です。現行rulesに対してActive replacement、Special condition付き複数効果、編成条件評価を実装する指示ではありません。

### 値・単位・enum

- `rawValue`はHolodoriDB値そのもの。たとえば`"450"`は数値450へ変えず文字列のまま保持。
- enumは完全なraw文字列で保持。画面向けラベル、Library ID、`score_up`等への対応は別の`semanticCandidate`にのみ置く。
- milliseconds、permil、count、確率係数等を変換する場合でもsource factは残す。意味・単位が確定していない値には単位を付与しない。
- Localizationはlocale付き別factと出典language rowで保持し、ゲーム用タグ・highlightタグを除去しない。
- キー不在、明示的null、空文字、0は異なる状態として保存する。

## 185カードの構造観測

以下は固定commitの調査JSON集計です。件数は明記した通りカード数、レベル行出現数または重複排除後のsource row数で異なります。

| 分類 | 観測された構造 | 件数 |
| --- | --- | ---: |
| Card | 全カード行 / 一意ID / 日本語名JOIN | 185 / 185 / 185 |
| レア度 | ★5 / ★4 / ★3 | 77 / 54 / 54 |
| Passive level | Lv.1・Lv.2 | 185カードすべて |
| Passive level行 | trigger参照なし / trigger参照あり | 152 / 218（計370行） |
| Passive効果type | all parameter / active-skill-effect-up / performance / sense / technique | 82 / 80 / 72 / 68 / 68（レベル行参照） |
| Passive trigger type | deck attribute / deck character grouping | 146 / 72（level行参照） |
| Passive targetの参照出現 | attribute / character grouping / self | 212 / 78 / 80（計370） |
| Active level | Lv.1・Lv.2 | 185カードすべて |
| Active level行 | condition付きupper effectなし / condition付きupper effectあり | 228 / 142（計370行） |
| Active効果type | base effect / 条件成立時にbaseを置換するupper effect | 370 / 142 |
| Active trigger type | combo threshold / deck attribute / life threshold / deck character grouping | 44 / 56 / 40 / 2（level行参照） |
| Special level | Lv.1・Lv.2 | 185カードすべて |
| Special level行 | 独立した第二効果なし / 第二効果あり（conditionなし） / 第二効果あり（optional conditionあり） | 196 / 108 / 66（計370行） |
| Special第二効果 type | activation probability / life recovery / judgement enhance | 84 / 46 / 44 |
| Special optional condition type | deck attribute / deck character grouping / combo threshold / life threshold | 20 / 16 / 16 / 14（level行参照） |
| CardLevel | 参照group 19種。最大Lv.60 / 70 / 80のカード | 54 / 54 / 77 |
| CardLevel source row | 重複排除後 / カード別参照数合計 | 1,290 / 13,180 |
| CardLevelLimit | 特訓段階0〜4と対応level capのprofileが3種類 | ★3: 54 / ★4: 54 / ★5: 77 |
| CardPotential | ブルーム段階に対応する5 upgrade step構造が2種類 | 131 / 54 |

種類別raw enum、フィールド形状、level/potential profile、追加effect・trigger group ID、source rowは調査JSONの`coverage`および`joinedSourceRows`を参照してください。上記分類は構造の棚卸しで、ゲームルールの意味付けではありません。

### schema案が吸収する例外

- `Card`の一部fieldは全185行に存在するわけではありません。例: `skillTreeConnectEffectId`、衣装報酬IDは131行、各種音声IDと`acquireReward`は77行、その他54/108行で欠落するfieldがあります。欠落を空欄デフォルトにしないよう、source field presenceを保存します。
- `CardLevel`は同じテーブルでも`exp`、`liveDeckPowerPermyriadUp`が無い行形状があります。進行度欄を固定必須プロパティだけにせず、level row factsを保持します。
- `CardLevelLimit`の初回特訓上限行ではdata側に`limitBreakCount`と`consumptions`が無いsource shapeがあり、wrapperに`limit_break_count`があります。wrapper/data両方の原情報を保存し、Canonical側では特訓段階として保持します。
- P/A/SPの各level行で任意のcondition/effect参照の有無が異なります。Activeの追加effect参照は独立加算ではなくconditional replacement、Specialの追加effect参照は独立した第二効果として分けます。
- SPとActiveの効果が同じ`LiveActiveSkillEffect`に保存されています。ドメイン上のSP/A区分はカードから辿った参照役割として表し、source table名をスキル種別に誤変換しません。
- effectにtargetの無い構造があり、trigger行のfield shapeも複数あります。target / triggerは効果から独立したsource rowとして参照し、未存在を補完しません。
- `CardPotential`をブルーム段階として表し、stepごとのeffect type/valueを保持します。★3 step 5はConnect levelではなく別のall-parameter effect raw typeです。段階の構造は保持しますが、未確定の数値効果を別意味へ変換しません。
- `CardLevelLimit`を特訓段階として表し、stageごとの上限・素材等のraw factsを保持します。3種類のCardLevelLimit profileと3種類のCardLevel row field shapeを保持します。
- Connect / skill-tree / board効果は現段階の実装対象外です。調査データにあるsource row/refを証拠層で残す場合でも、progression計算やLibraryへ接続しません。

## 現行Card Library / rulesとの対応案

対応は「観測値をどの欄へ候補表示できるか」の調査表であり、変換仕様ではありません。

| 提案domain | HolodoriDB source facts / refs | 現行Card Library | 現行rules・差分/未確定事項 |
| --- | --- | --- | --- |
| identity.sourceId | `Card.id` | `id`はローカル生成ID。置換せず、外部ID用拡張・別層候補 | 直接計算接続なし。source IDを新しい正本IDに確定しない |
| identity.name | `Card.nameLangId` → `LangCard_Jpn.text` | `cardName` | ラベル候補としては直接対応しやすい。locale/rawタグ保持は現欄にない |
| identity.member | `Card.characterId` → `Character.id`、Character/production fields | `talentId` | `HOLO_MEMBERS` IDと外部IDの同一性を保証する対応表なし。名前による候補だけでは確定不可 |
| classification.rarity | `Card.rarity` raw enum | `rarity` numeric 3/4/5 | enum-to-numberは明示的なmapping tableが必要。rawを併存 |
| classification.attribute | `Card.attributeType` raw enum | `type` cute/pure/happy | 属性enumの変換表を決める必要あり。単一カードdescriptionから全mappingを一般化しない |
| progression.level rows | `CardLevel.group_id/level` + data fields | `progression.level`, `stats.*` | Library levelは1数値。CardLevel曲線/base raw値を表せない。丸め/parameter formula未確定 |
| progression.trainingStages | `CardLevelLimit` wrapper `limit_break_count` + data `levelLimit` / `consumptions` | `progression.training` 0..4の候補 | 特訓段階として対応。現行画面・rulesのtraining値のゲーム計算妥当性、段階の初期値等は実装前に別途確認。source wrapper/data両方を残す |
| progression.bloomSteps | `CardPotential` `upgradeCount/effectType/value` | `progression.bloom` 0..5の候補 | ブルーム段階として対応。effect type/valueはraw保持し、既存bloom補正計算へ自動接続しない |
| progression.parameter inputs | `Card.performancePermilMultiply`, `techniquePermilMultiply`, `sensePermilMultiply`; CardLevel base | `stats.total/performance/technique/sense` | 現欄は手入力の最終値。per-mil inputs/raw base/final provenanceを別途保持する必要あり |
| skills.passive.levels[].effect | `LivePassiveSkillLevel` + `LivePassiveSkillEffect` + target/optional condition | `skills.passive.effect`単一type/value/condition/target | 一件のP effect + target + optional conditionに対応。source enum/value/raw refsは独立して保持し、未対応typeはrulesで実行しない |
| Passive condition | Passive effect/levelのoptional condition facts | Pの`condition`/`conditionCount` | optionalで保持。現行rulesが扱う既知条件以外は自動解釈せず、今回追加ルールだけからActive向けの条件評価をPassiveへ拡張しない |
| skills.active.levels[].baseEffect | Active level primary group → `LiveActiveSkillEffect` | `skills.active.effectType`, `boost`, `interval`, `duration`, `probability`, `description` | 現行単一Active欄はbase effectのみ候補として表せる |
| skills.active.levels[].conditionalOverrides[] | Active level additional group + `LiveSkillTrigger` | 直接対応欄なし | 条件成立時にbaseを置き換えるupper effect。加算扱いは禁止。編成依存条件はformationから解決し、Combo/LIFEは条件とbase/upperを保持するだけで動的評価しない |
| Active formation conditions | `LiveSkillTrigger` raw type/threshold/attribute/group refs | 現行Active rulesに条件欄なし | 属性枚数・所属/グループ人数として与えられた編成依存条件は編成状態から解決する。ここでいう解決は条件成立判定までで、Player-stateの時系列シミュレーションを意味しない |
| Active cycle/chance | `coolTimeMillisecond`, `activationProbabilityPermilMultiply`, `effectDurationMillisecond`; generated description | 秒周期、low/mid/high | unit conversion/probability mappingは別途確認。Combo/LIFEは時系列simulationなし |
| skills.special.levels[].effects[] | `LiveSpecialSkillLevel` → `LiveActiveSkillEffect` primary/additional groups | `skills.special.effects[]` + description | 各effectを独立した効果として保持し、optional conditionもeffect単位に付ける。Activeのreplacement意味を流用しない。現Library保存時のeffect type重複除去は原情報保持と両立するか要検討 |
| skill descriptions | generated `Lang*` rows | `description` fields | タグ付きraw textとlocale/source idを現欄は区別しない |
| other Card fields | Card raw field bag (asset/reward/voice/anchor/order等) | 一部`outfitSkill`, extensions | `Card`にoutfit-skill definitionは直接無い。名称/効果の推定・画像/報酬接続をしない |
| Connect / board | `Card.skillTreeConnectEffectId` → `SkillTreeConnectEffect` / extent | 対象外（証拠層のみ必要に応じて保持） | 今回のCanonical runtime domain・rules実装対象外。UI/計算に接続しない |

### rules側の明示的な対応制限

- [card-rules.js](../card-rules.js) はCard v2 defaults、手入力構造、既知のskill type、Bloom effect categoryを定義します。現行型をこの提案schemaの正規型とはみなしません。
- [parameter-rules.js](../parameter-rules.js) は`baseStats`・board・outfitRates・現行Pパラメータtypeを計算します。CardLevelのbase valueやpermil multiplierを自動流用しません。
- [support-rules.js](../support-rules.js) は既存Active boostと一部P score-supportを扱います。提案するActiveの置換条件、編成依存条件評価、Specialの個別条件付き効果は未実装です。Combo/LIFEの動的評価、特殊効果処理も接続しません。
- [CARD_SKILLS.md](../CARD_SKILLS.md) の保存形式は`version: 2`、`skills.passive.effect`単一object、SP `effects[]`、A単一効果等です。本提案はその形式を変更しません。

## 実装判断前に確定が必要な事項

1. 採用するsource evidenceの粒度（source rows全保存か、field factsと外部参照のみか）と保持期間。
2. canonicalなstable card keyと、各言語の表示名・Locale policy。
3. enumの管理方法（raw-onlyで進めるか、version付き明示mappingを別ファイルで持つか）。
4. `CardLevel`由来のstat導出・bloom効果・端数処理を、確定済み値としてどこまで別計算モデルにするか。
5. Card library編集保存でインポート由来のunknown/raw/provenance dataをどう保全するか。現フォームはunknownsを保持する箇所もある一方、一部の選択肢は既知の手入力項目へ絞られます。
6. Activeに複数replacement conditionが同時成立した場合の優先順位。仕様根拠がなければ実装時も未解決扱いとする。
7. 編成依存条件がformation changeで再評価されるタイミングと、対象編成の定義。

## 作業境界

今回追加するのは本提案文書とJSON Schema案のみです。185件のsource rowをこのCanonical案へ変換すること、schemaの実装・既存ファイルへの統合、ユーザー画面への表示は次の判断まで行いません。
