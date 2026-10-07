# Leader 131件監査

対象は保存済み固定commitのカード対応Leaderのみ。監査のみで計算・UI・Canonical・Runtimeは変更しない。

## 全体集計

```json
{
  "leaderCount": 131,
  "effectRowCount": 147,
  "parameterIncluded": 121,
  "parameterExcluded": 10,
  "singleParameter": 105,
  "compound": 16,
  "classification": {
    "A": 0,
    "B": 0,
    "C": 131
  },
  "conditionLeaderCounts": {
    "not_stated": 64,
    "affiliation_count": 36,
    "attribute_count": 29,
    "unknown": 2
  },
  "effectRowCounts": {
    "S": 24,
    "all_parameter": 50,
    "P": 25,
    "T": 22,
    "score_support": 26
  },
  "targetLeaderCounts": {
    "all_members_from_text": 131
  },
  "selectCountLeaderCounts": {
    "all_no_fixed_N": 131
  },
  "conditionGroups": 18,
  "resolvedConditionGroups": 17,
  "effectGroups": 24,
  "resolvedEffectGroups": 0,
  "existingConditionResolverCompatibleLeaders": 65,
  "existingResolversOnly": 0,
  "numericConfirmed": 0,
  "parameterNumericUnconfirmed": 121,
  "commonEffectsExcluded": 54
}
```

## A / B / Cと確定度

A 0、B 0、C 131。全件で元Leader行の効果group参照はあるが、参照先のLivePassiveSkillEffect行が保存済みデータにないため。名前の似たIDからeffect enumやpermilを復元しない。原文の%・対象・parameter種別は記録できるが、raw定義確定とは扱わない。
数値計算式確認済みは0。Parameterを含む121件は未確認、Supportのみ10件はParameter計算対象外。A/B/Cと数値確認fieldは別管理であり、将来Aへ移っても計算可能とは限らない。

## 条件18種類

| 参照ID | 意味/状態 | Leader数 |
|---|---|---:|
| live_skill_trigger-deck_card_attribute-attribute_1-2 | attribute_count / CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_1 / count=2 | 9 |
| live_skill_trigger-deck_card_attribute-attribute_2-2 | attribute_count / CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_2 / count=2 | 11 |
| live_skill_trigger-deck_card_attribute-attribute_3-2 | attribute_count / CardAttributeType_CARD_ATTRIBUTE_TYPE_ATTRIBUTE_3 / count=2 | 9 |
| live_skill_trigger-deck_card_character_grouping-grp-advent-2 | affiliation_count / grp-advent / count=2 | 2 |
| live_skill_trigger-deck_card_character_grouping-grp-gamers-2 | affiliation_count / grp-gamers / count=2 | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-gen_0-2 | affiliation_count / grp-gen_0 / count=2 | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-gen_1-2 | affiliation_count / grp-gen_1 / count=2 | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-gen_2-2 | affiliation_count / grp-gen_2 / count=2 | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-gen_3-2 | affiliation_count / grp-gen_3 / count=2 | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-gen_4-2 | affiliation_count / grp-gen_4 / count=2 | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-gen_5-2 | affiliation_count / grp-gen_5 / count=2 | 2 |
| live_skill_trigger-deck_card_character_grouping-grp-holox-2 | affiliation_count / grp-holox / count=2 | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-indonesia-gen_1-2 | affiliation_count / grp-indonesia-gen_1 / count=2 | 2 |
| live_skill_trigger-deck_card_character_grouping-grp-indonesia-gen_2-2 | affiliation_count / grp-indonesia-gen_2 / count=2 | 2 |
| live_skill_trigger-deck_card_character_grouping-grp-indonesia-gen_3-2 | affiliation_count / grp-indonesia-gen_3 / count=2 | 2 |
| live_skill_trigger-deck_card_character_grouping-grp-myth-2 | affiliation_count / grp-myth / count=2 | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-promise-2 | unknown / 参照先欠落 / count=None | 2 |
| live_skill_trigger-deck_card_character_grouping-grp-regloss-2 | affiliation_count / grp-regloss / count=2 | 2 |

17種類はCanonicalのLiveSkillTrigger.groupIdへ明示joinできる。残りはPromise人数条件で2カードに該当。原文はPromiseが2人以上だが、実行用所属ID/人数条件を文字列やID名から生成しない。Canonicalおよび元調査snapshotで参照欠落。
条件記載なし64件はtrigger参照も欠落。明示alwaysを意味するschema根拠は未確認なのでnot_statedとして保持する。原文上所属人数条件は38件（解決36＋Promise未解決2）、属性人数条件29件。

## 効果・複合の照合

元LiveLeaderSkill → descriptionLangId → LangGeneratedLiveLeaderSkill_Jpnをjoinして原文と配信descriptionを照合し、既存presentation生成関数で表示構造の一致を確認する。presentationだけから計算仕様を確定しない。
効果groupは24種類、保存済みCanonical/調査snapshotとの一致0。Leader追加原本はCostume/Leader/言語の5テーブルで、効果テーブル自体が含まれない。JSONは原本行・primary/additionalの参照と欠落理由を保持する。
単一Parameter105件（P22/T20/S21/all42）、Supportのみ10件。複合16件はall+Support8、P+Support3、S+Support3、T+Support2。計147効果行。
複合はprimary/additionalのeffect参照とtrigger参照が別fieldなので、2効果として記録できる。原文Parameter部分の意味候補は独立して読める。ただし追加効果の発動評価・独立性・計算の根拠は不十分で、全体はCのまま。Parameterだけ接続しない。Support10件の原文・条件・対象も全件JSONに保持。

## Resolver適合と共通化候補

全員targetは現在のTarget Resolverにない。よって既存Resolverのみで端から端まで処理できるものは0。Selectionは全131件で原文上不要。所属人数条件を所属targetへ取り違えない。
既存Condition Resolverと同型の参照が揃うLeaderは65件（属性29＋所属36）。残る66件は条件記載なし64＋参照欠落2。
構造追加の候補はall_members target（131件の対象表現をカバー）、source=leader（131件の出典を分離）、独立effect配列（複合16件）。Parameter型P/T/S/allは既存Effect表現と同型で121件分の候補になる。これらは表現可能件数であり、新しく正しく数値計算できる件数ではない。
PassiveのcalculatePassiveEffectsは対象parameter率合算後ceil。calculateOutfitEffectsは明示baseに率を掛け各項ceil。ただしLeader原文からoutfitRatesへ変換する根拠や、Leaderと衣装補正の同一性を確定したfixtureはない。どちらの式も今回Leaderへ流用しない。

## 計算仕様の確定度

| 項目 | 判定 |
|---|---|
| 原文・カード衣装Leaderの明示join、primary/additional参照 | 確認済み |
| 全員対象、Parameter名、% | 原文で確認済み。raw effect参照は未解決 |
| P/T/Sへ作用しTOTAL直接倍率ではないという解釈 | データ上は推測可能だが未検証 |
| Base/Bloom/Passive/Memory/Board/衣装の何を基数へ含むか | 不明 |
| source別ceilか率合算後ceilか、Passiveと合算か独立か | 不明 |
| Leader選出・複数sourceの適用範囲、Support発動境界 | 不明 |
| Leader数値計算とPassive数値計算の共通性 | 未確認 |

CASE CのPassive4532/Memory2451/Enhancement1397は既存基盤の回帰根拠であり、Leader式の実測根拠ではない。

## 次工程と共通54件との境界

まず固定commitに対応する不足効果レコードとPromise条件の原本を確認する。今回は新規取得せず、既存保有データの欠落として報告する。その後、単一Parameter・参照解決済み条件群からLeader有無で比較できる実測fixtureを作り、基数、丸め、Passiveとの合算を分離検証する。現時点で数値計算へ即接続できる群はない。
共通54件は監査leadersへ混ぜず、skillIdの重複なしを検査。デフォルト衣装との明示関係だけを保持し、cardIds空のまま。★3やカードへの自動付与なし。

## 再生成と検証

`python3 -B research/audit_unit_leaders.py` でJSONと本レポートを生成。`--check`は両方のバイト一致を検査し書き込まない。131一意ID、147効果行、参照/原文/presentation一致、共通54分離、入力SHAとcommitを検査する。
既存検証コマンド: `python3 -B tests/verify.py`、`python3 -B tests/runtime-catalog.test.py`、`python3 -B tests/leader-catalog.test.py`、`python3 -B research/audit_unit_passives.py --check`。2026-10-07実行は全てPASS（CASE C 4532/2451/1397、Memory、Enhancement、Timeline、固定seed Simulationを含む）。Leader監査--checkもPASS。開始時の既存ファイルSHA照合で変更なしを確認。UI変更なしのためChrome再実行は不要。
