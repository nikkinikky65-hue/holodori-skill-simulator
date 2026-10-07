# 所属Passiveの順位選択：適用根拠の確認

確認日: 2026-10-02。今回の変更はこの調査記録のみ。所属対象15カード/30行の限定条件対応を維持する。

## 結論

既存順位処理は存在するが、所属対象へ一般化できる検証根拠を現在の資料から確認できなかった。候補3人以上をbaseTotal上位2人へ確定するSelection Resolverの接続は行わない。条件成立と対象選択unresolvedを引き続き分離する。完全対応40/80、限定条件対応15/30、未対応90/180は不変。

## 既存処理と根拠の範囲

- `parameter-rules.js::calculatePassiveEffects` は入力member.baseのP/T/Sを合計しbaseTotalを生成する。新Parameter Engineは開花適用後のカードP/T/Sをbaseへ渡す。Passive、Memory、Board、衣装、Enhancement Bonusは順位値に含まれない。特訓は参照CardLevelを通じて含まれる。
- `resolvePassiveTargets` は候補をbaseTotal降順、同値はformationIndex（入力編成順）昇順で並べ、targetCount人を選ぶ。slot番号の大小によるソートではない。
- 同関数には属性・所属の両方の候補抽出分岐があり、技術的には所属へも利用できる。しかし、分岐が存在すること自体は所属で実測確認済みである証拠にはならない。
- `tests/parameter-rules.test.js` のCASE Cは属性対象。baseTotalは7268/8078/7392/8060/7392で、上位2枠は2,4、上位3枠は2,4,3。同値7392の枠3/5は編成順で解決する。Passive4532、Memory2451、Enhancement1397を検証する。
- 他の順位・Board非干渉テストも属性対象。所属の既存テストは人数判定・候補2人への適用・3人時の保留を検証しており、順位選択のゲーム実測fixtureではない。
- `research/unit-passive-audit.md` の「対象順位・所属の根拠と未解明事項」は、CASE C以外の所属対象等へ一般化する範囲を未確認としている。
- 監査JSON、Runtime、Canonical由来target情報の15カード/30行は所属ID・targetCount=2を保持する。原文は「所属2人以上で所属2人のparameterがUP」。比較基数・並べ替え・同値規則は記載されていない。RuntimeとCanonicalの対応は既存整合性テストで確認した。

## 維持する動作

条件未満はinactive、候補2人はその2人へ適用、候補3人以上は条件satisfiedかつtarget selection unresolved。所属情報欠落もunresolved。trace・率合算後ceil・Memory・Enhancement・Timeline・Simulationは変更しない。

## 根拠追加後の共通化境界

候補抽出はTarget Resolver、候補内の選択はSelection Resolverとする。既存ソート・sliceを共通関数へ抽出し、旧resolvePassiveTargetsと新Selection Resolverから同じ処理を呼ぶ。baseTotalの生成はcalculatePassiveEffects側に維持し、Selection側で再計算しない。

候補のcard/slot、baseTotal、順位、選択数、選択/除外、同値集合、tie-break、結果/理由をtraceへ保持する構造が利用できる。ただしこの構造・関数は今回は未実装。

属性35カードでも順位選択部は共用候補となる。別途、属性候補の抽出、属性人数条件との分離、カードごとの対象人数の橋渡しが必要。条件未観測55カードを同時に有効化しない。

## 追加実測

1. 所属対象Passiveのsourceを1枚、同所属を3人以上にし、他のPassive等を抑えた編成で各人への補正を記録する。各人の開花後・外部補正前P/T/Sと合計も記録する。
2. baseTotal順位と補正対象parameter単独の順位が異なる組合せで、対象2人がどちらに一致するかを確認する。sourceが上位外になる編成も確認する。
3. 育成状態で2位/3位のbaseTotalを入れ替え、補正対象が追従するか確認する。可能なら所属4人以上でも確認する。
4. 選択境界の同値2人を作り、編成順だけを交換して対象の変化を確認する。属性CASE Cのtie規則を所属でも使用できるか分けて検証する。
5. Board・衣装等のみを変えた際に対象が変わらないか確認する。単一所属の観測から全所属へ一般化する根拠は別途記録する。

## 検証結果

- `python3 -B tests/verify.py`: PASS。既存40カード、限定15カード、CASE C、Memory、Enhancement、Timeline、固定seed Simulation、保存互換性を含む。
- `python3 -B tests/runtime-catalog.test.py`: PASS。完全Canonical/schema不変、Runtime再生成一致。
- `python3 -B tests/leader-catalog.test.py`: PASS。
- `python3 -B research/audit_unit_passives.py --check`: PASS。監査件数・再生成一致。
- UI/実行コードの変更がないため今回Chrome再実行は省略。新規Selection動作のテストは、未実装のため追加していない。
