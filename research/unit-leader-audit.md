# Leader 147件の元データ参照監査

この監査のC分類・numericConfirmed=0は原本effect参照の裏付けを示す旧監査軸。開発者承認・実測による現在の計算接続状況とは別。計算仕様は [Leader Parameter接続](leader-parameter-integration.md) および [差分更新](card-library-update.md) を参照。

## 全体集計

```json
{
  "leaderCount": 147,
  "effectRowCount": 168,
  "parameterIncluded": 135,
  "parameterExcluded": 12,
  "singleParameter": 114,
  "compound": 21,
  "classification": {
    "A": 0,
    "B": 0,
    "C": 147
  },
  "conditionLeaderCounts": {
    "not_stated": 66,
    "affiliation_count": 43,
    "attribute_count": 38
  },
  "effectRowCounts": {
    "S": 29,
    "all_parameter": 52,
    "P": 27,
    "T": 27,
    "score_support": 33
  },
  "targetLeaderCounts": {
    "all_members_from_text": 147
  },
  "selectCountLeaderCounts": {
    "all_no_fixed_N": 147
  },
  "conditionGroups": 18,
  "resolvedConditionGroups": 18,
  "effectGroups": 24,
  "resolvedEffectGroups": 0,
  "existingConditionResolverCompatibleLeaders": 81,
  "existingResolversOnly": 0,
  "numericConfirmed": 0,
  "parameterNumericUnconfirmed": 135,
  "commonEffectsExcluded": 54
}
```

## 条件参照

| 参照ID | 状態 | Leader数 |
|---|---|---:|
| live_skill_trigger-deck_card_attribute-attribute_1-2 | attribute_count / reference_resolved | 13 |
| live_skill_trigger-deck_card_attribute-attribute_2-2 | attribute_count / reference_resolved | 15 |
| live_skill_trigger-deck_card_attribute-attribute_3-2 | attribute_count / reference_resolved | 10 |
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
| live_skill_trigger-deck_card_character_grouping-grp-regloss-2 | affiliation_count / reference_resolved | 4 |

今回、追加カードのJOIN到達範囲にPromise人数条件が入り、18種類すべての条件参照を回収した。原文から未定義の効果を推測補完していない。

## 効果と共通化

全件の原文・効果率・対象・条件・元レコード参照は `unit-leader-audit.json` に保持。対象は全員、順位選択は不要。Effect原本group参照先は引き続き保存データ内にないため、原文からの意味解釈とraw定義確認を区別する。

基礎衣装54件はカード固有Leaderと分離し、自動付与しない。

再生成: `python3 -B research/audit_unit_leaders.py` / `--check`。旧131件・条件17/18件という履歴はGit上の前版および既存調査メモに保持。
