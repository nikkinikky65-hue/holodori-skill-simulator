# Promise条件Leader 2件の解決（2026-10-10）

## 原因

所属定義がないのではなく、**人数条件のLiveSkillTrigger参照先行がローカルCanonical/調査snapshotに収録されていない**ことが原因だった。

1. 元Leader行は2件とも `liveSkillTriggerGroupId=live_skill_trigger-deck_card_character_grouping-grp-promise-2` を持つ。
2. 元日本語原文は `Promiseが2人以上で全員の全パラメータが50%UP`（IRyS）/40%（クロニー）。
3. 旧監査はtriggerレコードとのjoinだけを許可していたため、18条件グループ中この1種類をunknownへ分類。
4. 実行用投影がunknownをそのまま配信し、LeaderParameterEngine.resolveConditionはunresolvedを返す。PartyConditionResolverの所属判定へ到達していなかった。

他の所属Leader/自己所属Passiveは、解決済みaffiliationIdとrequiredCountを既存Resolverへ渡す。このResolverにPromiseだけを排除する実装はない。

## 既存の正規所属データ

完全Canonicalの `/sourceRecords/1603`：CharacterGrouping `grp-promise`。
`nameLangId=la-grp-promise` は `/sourceRecords/1807` のLangCharacterGrouping_Jpnで `Promise`。
メンバーは `chr-04007 / chr-04009 / chr-04010 / chr-04011 / chr-04012`。
`data/runtime-affiliations.json` に同じID・名前・characterIds・sourceが既に収録され、Card.characterId対応も存在する。新しい所属定義は不要。現185カードに対応するキャラクターはこのうちIRyS・クロニー・ベールズの3人。chr-04009/04011は所属原本に存在するが現カードRuntimeにはカードがないため、架空カードを生成しない。

## 解決方式

`build_leader_parameter_rules.py` の投影時に、unknown条件についてのみ次を全て確認する。

- 保存された正規原文の条件が `所属名がN人以上` と完全一致し、効果原文の先頭とも一致。
- 所属名が既存正規グループ名と一意に一致。
- 元Leaderのtrigger参照IDが同じgroup ID・人数の参照と一致。
- グループのsourceがCharacterGroupingの同IDで、characterIdsが存在。

人数は原文から取得し、ID末尾だけから推定しない。所属メンバーは既存CharacterGroupingのみ利用。カードIDに特例をハードコードしない。この証拠の交差照合による意味解決を実行用派生データだけへ保存する。
`resolutionEvidence` に根拠と `rawTriggerRecordMissing:true` を保持。存在しないtrigger行を生成・発見したことにはしない。旧監査の「raw参照未解決」はそのまま正しい履歴。

既存Condition Resolverが5人中の実メンバーを数える。独立Leader枠は人数に足さない。2人以上なら**全員**へ適用し、Promiseだけへ対象を絞らない。所属情報不足はfalseではなくunresolved。

## 全データ検索結果

Canonical、カードRuntime全185枚/P/A/SP全レベル、元全カード調査snapshot、Leader原本、Leader配信・監査をPromise/`grp-promise`で検索した。

- Leader条件：この2カード・2効果のみ。
- Passive：同2カードの「Promise2人のテクニックUP」、各Lv1/Lv2の計4行。IRyS32/43%、クロニー21/32%。これは**対象指定**で、条件人数の観測レコードがない。Leader原文をPassive条件へ移植しない。従来の条件未観測保留を維持。
- Active/SP：Promise条件・対象の該当なし。
- その他ヒット：Character/CharacterGrouping/言語・join・出典・同一行の重複参照。追加のスキル条件ではない。

## 接続結果

|範囲|完全対応|限定対応|未対応|
|---|---:|---:|---:|
|カード固有Leader全体（Parameter＋Support）|131|0|0|
|Parameter効果行|121|0|0|
|Support効果行|26|0|0|

共通衣装54件は別枠のまま。131件は実装対応数であり全131件のゲーム実測済みを意味しない。生trigger不足の研究上の注意は残すが、今回の明示原文・正規所属データで実行に必要な条件は解決できる。

## テスト

- 2Leader×Promise人数0/1/2/3、異なるPromiseキャラクターを用いて不成立・ちょうど成立・超過成立を確認。
- 対象は他所属を含む全員、所属カタログ欠落はunresolved。Parameter全121効果行・Support26行の既存全件テスト。
- `tests/verify.py`：PASS（CASE C/Memory/Enhancement/Passive/Timeline/固定seed等）。
- Runtime/Canonical不変・再生成、Leaderライブラリ整合性：PASS。
- 新Leader実行用投影の `--check`：PASS。
- Chrome Leader回帰：1100px/360px、Promise不足時inactive、他Leaderの表示/再計算：PASS。

変更は投影生成・その派生JSON・テスト・進捗記録。Canonical、所属Runtime、カードRuntime、元Leader配信、Resolver/計算式、保存形式は変更していない。commit/pushなし。
