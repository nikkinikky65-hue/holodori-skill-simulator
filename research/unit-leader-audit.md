# Leader 142件の元データ参照監査

この監査のC分類・numericConfirmed=0は原本effect参照の裏付けを示す旧監査軸。開発者承認・実測による現在の計算接続状況とは別。計算仕様は [Leader Parameter接続](leader-parameter-integration.md) および [差分更新](card-library-update.md) を参照。

## 全体集計

```json
{
  "leaderCount": 142,
  "effectRowCount": 162,
  "parameterIncluded": 130,
  "parameterExcluded": 12,
  "singleParameter": 110,
  "compound": 20,
  "classification": {
    "A": 0,
    "B": 0,
    "C": 142
  },
  "conditionLeaderCounts": {
    "not_stated": 66,
    "affiliation_count": 41,
    "attribute_count": 35
  },
  "effectRowCounts": {
    "S": 28,
    "all_parameter": 51,
    "P": 26,
    "T": 25,
    "score_support": 32
  },
  "targetLeaderCounts": {
    "all_members_from_text": 142
  },
  "selectCountLeaderCounts": {
    "all_no_fixed_N": 142
  },
  "conditionGroups": 18,
  "resolvedConditionGroups": 18,
  "effectGroups": 24,
  "resolvedEffectGroups": 0,
  "existingConditionResolverCompatibleLeaders": 76,
  "existingResolversOnly": 0,
  "numericConfirmed": 0,
  "parameterNumericUnconfirmed": 130,
  "commonEffectsExcluded": 54
}
```

## 条件参照

| 参照ID | 状態 | Leader数 |
|---|---|---:|
| live_skill_trigger-deck_card_attribute-attribute_1-2 | attribute_count / reference_resolved | 13 |
| live_skill_trigger-deck_card_attribute-attribute_2-2 | attribute_count / reference_resolved | 13 |
| live_skill_trigger-deck_card_attribute-attribute_3-2 | attribute_count / reference_resolved | 9 |
| live_skill_trigger-deck_card_character_grouping-grp-advent-2 | affiliation_count / reference_resolved | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-gamers-2 | affiliation_count / reference_resolved | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-gen_0-2 | affiliation_count / reference_resolved | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-gen_1-2 | affiliation_count / reference_resolved | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-gen_2-2 | affiliation_count / reference_resolved | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-gen_3-2 | affiliation_count / reference_resolved | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-gen_4-2 | affiliation_count / reference_resolved | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-gen_5-2 | affiliation_count / reference_resolved | 2 |
| live_skill_trigger-deck_card_character_grouping-grp-holox-2 | affiliation_count / reference_resolved | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-indonesia-gen_1-2 | affiliation_count / reference_resolved | 2 |
| live_skill_trigger-deck_card_character_grouping-grp-indonesia-gen_2-2 | affiliation_count / reference_resolved | 2 |
| live_skill_trigger-deck_card_character_grouping-grp-indonesia-gen_3-2 | affiliation_count / reference_resolved | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-myth-2 | affiliation_count / reference_resolved | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-promise-2 | affiliation_count / reference_resolved | 3 |
| live_skill_trigger-deck_card_character_grouping-grp-regloss-2 | affiliation_count / reference_resolved | 2 |

今回、追加カードのJOIN到達範囲にPromise人数条件が入り、18種類すべての条件参照を回収した。原文から未定義の効果を推測補完していない。

## 効果と共通化

全件の原文・効果率・対象・条件・元レコード参照は `unit-leader-audit.json` に保持。対象は全員、順位選択は不要。Effect原本group参照先は引き続き保存データ内にないため、原文からの意味解釈とraw定義確認を区別する。

基礎衣装54件はカード固有Leaderと分離し、自動付与しない。

再生成: `python3 -B research/audit_unit_leaders.py` / `--check`。旧131件・条件17/18件という履歴はGit上の前版および既存調査メモに保持。
