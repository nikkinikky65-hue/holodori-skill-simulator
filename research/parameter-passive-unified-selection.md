# Parameter Passive：属性・所属共通の対象選択

2026-10-11。ユーザーの11実機観測と今回の採用指示に基づく更新。

## 採用仕様と実装

属性・所属の候補抽出後、P効果は開花後P、T効果はT、S効果はSで降順。全パラ効果は開花後TOTAL上位の同じN人を選ぶ暫定仕様。同値は編成左側優先を維持するが未検証。自己対象は選択不要。候補数がN以下なら全候補を対象とする。明示発動条件は従来どおり先に評価し、不成立・情報不足を区別する。

自己強化を含む全Passiveは、対象選択時の比較値や次のPassiveの基数へ先行反映しない。選択後に対象parameter別の率を合算し、開花後値に対して一度ceilする。baseTotalはTOTALのまま。

- `passive-target-resolver.js::resolve` は所属候補抽出までを担当。過剰候補を直ちにunresolvedにする処理を撤去し、共通Selectionへ渡す。
- `passive-selection-resolver.js::resolve` は既存単項比較を所属にも許可。比較parameter、comparisonValue、実機一致モデル、全パラ/同値の暫定状態をtraceへ保持。
- `unit-parameter-engine.js::calculateUnitParameter` は条件判定後、属性/所属の候補を既存calculatePassiveEffectsが用意した不変のbase値へ結び付け、同じSelection→Effect経路を使う。Conditionに数えたメンバーとSelection候補・選択・除外を別々に追跡可能。
- `parameter-rules.js::resolvePassiveTargets` の旧呼び出し経路も属性・所属に同じ比較parameterを渡す。自己対象、率合算、ceilは変更しない。

## 11観測の独立再計算

入力ID・Lv・開花・順番はユーザー提供。No.6/7の複数候補は追加回答で確定。RuntimeのtrainingStagesからLvを解決し、既存calculateMemberParameterで開花後値とPassive Lvを取得する。データ・実測値の調整なし。

|No.|メンバーパラメーター（実測＝再計算）|Passive（実測＝再計算）|誤差|
|---|---:|---:|---:|
|1|49917|7997|0 / 0|
|2|49917|7997|0 / 0|
|3|40202|6324|0 / 0|
|4|40134|6412|0 / 0|
|5|54754|9394|0 / 0|
|6|94397|5122|0 / 0|
|7|97715|14332|0 / 0|
|8|80423|7033|0 / 0|
|9|56915|5491|0 / 0|
|10|57987|9408|0 / 0|
|11|61599|8011|0 / 0|

No.1〜5は `tests/parameter-ranking-observations.test.js`、No.6〜11は `tests/parameter-affiliation-observations.json` と `.test.js` に収録。No.7は全員開花0。No.6は水着ラプラス・通常アーニャ、No.7は水着アーニャ。個人別加算はモデル計算であり実機直接観測ではない。

## 自己強化先行・旧順位との比較

比較モデルはテスト内だけでSelectionへ渡す比較値を変更し、製品の計算基数・率集計・ceilをそのまま使う。自己強化先行モデルでは、既存Evaluatorで成立した自己Passive増分だけを候補比較値へ加える。元baseや実際の加算基数は変更しない。

|No.|単項・自己先行なし|旧TOTAL順位|自己強化先行順位|
|---|---:|---:|---:|
|9|5491|4931|5449|
|10|9408|9394|9394|

**No.10の比較モデルには提供記録との相違がある。** 依頼文は旧TOTAL/自己先行を9395と報告しているが、既存率合算→ceilを再利用した独立再計算は両方9394。新モデル9408の実測一致には影響しない。提供値9395を消去・上書きせず、比較モデルの実装/中間値の差を検証待ちとする。元の比較計算記録がないため、差1の原因を断定しない。

旧TOTALでのNo.10個人加算（P/T/S）は、はあと748/1154/560、ビジュー1039/0/819、アキ1485/858/592、ロボ子0/1016/0、ネリッサ0/0/1123。合計9394。再照合に使える中間値として残す。

## Advent超過候補

No.11のネリッサS23%は、候補S 4882/4732/3557からネリッサ・モココを選択。各source増分1123/1089＝2212、他の増分5799、合計8011。比較用TOTAL順位7707、左側優先7741も再計算で一致。

所属の候補超過はこの1編成が実測支持。今回の共通化はユーザー承認された実機一致モデルであり、全所属・全カードが個別に実測されたことを意味しない。Support選択には一般化しない。

## CASE C・既存機能

[前工程記録](parameter-ranking-update.md)と元fixtureを保持。旧手入力・旧観測4532は履歴、新モデル4858は計算期待値として分離。Memory2451は不変。Enhancement1397→1405はPassive差による既存基数への波及で、式は変更なし。

Parameter対応数：完全145種/290行、限定0、unsupported0（採用モデル上）。完全対応は実機完全確定を意味しない。全パラ複数対象と同値は暫定、データ不足は実行時unresolvedを維持。Support40種/80行はParameter外で、既存動作のまま。

## 検証

`tests/verify.py` PASS：11観測、自己先行比較（No.10差異は上記明記）、既存属性35+41種、所属15+14種の不成立/候補超過/参照不足、複数source率合算・ceil、全パラ/同値暫定、CASE C旧新、Leader131、Memory/Enhancement、Support、Timeline/固定seed。

Runtime/Canonical不変・再生成一致、Leaderライブラリ整合性、Passive監査再生成一致も確認。UIは変更していないためブラウザー表示テストは今回追加していない。

Canonical・Runtime本体、保存形式、Leader/Memory/Board/Enhancementの計算式、Active/SP、スコアSimulationのコードは変更していない。commit/pushなし。
