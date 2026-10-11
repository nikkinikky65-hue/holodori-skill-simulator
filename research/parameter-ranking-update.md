> 2026-10-11更新：属性・所属Parameter対象選択を共通単項順位へ統合。11観測一致。完全145種/290行（採用モデル上）、限定0、unsupported0。全パラ・同値は暫定。No.10比較モデルの提供値との差1を含む詳細は[parameter-passive-unified-selection.md](parameter-passive-unified-selection.md)。以下は旧段階の記録。

# 属性Parameter Passive順位改修

2026-10-10。ユーザー提示の新実機観測に基づくモデル更新。

## 仕様

属性対象だけ、P効果は開花後P、T効果はT、S効果はSで降順。全パラ効果は開花後TOTALで同じN人を選ぶ暫定仕様。同値は編成順を維持するが未検証と明記。所属・自己対象は従来のまま。baseTotalの意味を変更しない。率合算→各項ceilも変更しない。

parameter-rules.jsのpassiveRankingParameter/passiveRankingValueで比較値を分離し、rankPassiveCandidatesに比較parameterを渡す。旧resolvePassiveTargetsも属性に限り新比較値を使用する。Selection Resolverと新Engineは同じ関数を使用し、traceにcomparisonValue、parameter、model、tieBreakStatusを保持する。

## 実測との照合

|観測|報告メンバーパラメーター|報告Passive|再計算|誤差|
|---|---:|---:|---|---|
|レイネ08 キュート|49917|7997|49917 / 7997|0 / 0|
|レイネ09 キュート|49917|7997|49917 / 7997|0 / 0|
|レイネ07 キュート|40202|6324|40202 / 6324|0 / 0|
|レイネ07 ハッピー|40134|6412|40134 / 6412|0 / 0|
|レイネ07 ピュア|54754|9394|54754 / 9394|0 / 0|

08/09は tests/parameter-ranking-observations.test.js にカードID・Lv・開花5・入力順・期待値を保持。Runtimeから対応上限Lvのtraining stageとP/A/SP Lvを取得し、calculateMemberParameterで再計算。個人別加算1272/800/1650/3480/795も一致するが、これは実機直接観測ではなくモデル内訳。

07の3編成は追加回答でカードID・Lv・編成順が提供された。全員開花5、キュート/ハッピー全員Lv20、ピュアはクロニー/ころね/シオリLv40・ねね/ロボ子Lv20として独立テストへ収録。RuntimeのtrainingStagesからLvを解決して再計算し、5観測すべて誤差0を確認。期待値の調整なし。

## CASE C

元カード、手入力ステータス、効果量、過去報告値は保存。tests/parameter-rules.test.jsの旧CASE C部分だけテスト内で旧TOTAL順位を明示し、終了時に新順位を復元する。製品側に旧モデル切替を追加しない。

|モデル|Passive|Memory|Enhancement|合計|
|---|---:|---:|---:|---:|
|旧履歴|4532|2451|1397|61255|
|新計算|4858|2451|1405|61589|

新個人Passive合計820/1290/1587/637/524。新Enhancement268/300/290/283/264。Enhancement式を変更したのではなくPassive増分の既存基数への波及。新値を過去実測と呼ばない。旧CASE Cの信頼性は新しいCanonical由来観測より低いという今回の判断に従う。

## テスト・境界

全回帰 tests/verify.py PASS。属性35種・追加41種の候補数境界、非属性除外、率合算・ceil、同値暫定順序、P/T/S/全パラ比較、08/09、CASE C旧新、所属29種、Support、Leader131件、Memory/Enhancement、Timeline/固定seedを確認。

Canonical/Runtime整合性・再生成とPassive監査再生成も確認。対応数は完全116/232、限定29/58、Parameter unsupported0で不変。実機一致モデルと全面的な仕様確定を混同しない。

全パラ複数対象と同値優先順位は暫定。所属候補3人以上・Support選択へ一般化しない。Canonical/Runtime/保存形式、Leader/Memory/Board/Enhancement計算式、Active/SP/Simulationの実装変更なし。commit/pushなし。
