# 更新：所属対象14種の開発者承認接続（2026-10-10）

今回の指示により、下記の旧「保留」は変更した。実機による確定ではなく、**条件参照なし・追加条件原文なしの所属最大2人P/T/S補正**を開発者承認の暫定解釈として接続する。

- Canonicalは不変。Runtime生成時に元level factsの `liveSkillTriggerGroupId` の存在を `condition.referenceState`（present/absent）として保持。未観測という元情報は保持する。既存Runtimeのrawがこの参照の有無を落としていたため、単なるunobservedだけでは承認対象を判定しない。
- Engineはunobserved＋referenceState=absent＋CHARACTER_GROUPING＋targetCount=2＋単一P/T/S効果だけを限定対応とする。所属IDやカード名に特例なし。全データテストで14種/28行に一致。
- 参照presentで未解決、証拠フィールドなし、属性対象、Supportはこの経路へ入れない。
- 条件traceに `developer-approved-no-additional-condition` と承認解釈IDを保持。実機確定の条件として記録しない。
- Target Resolverの最大人数モードだけ追加。0人は対象なし、1人はその人、2人は全員。3人以上は候補をtraceに残しselection unresolved。所属情報不足もunresolved。既存明示条件付き15種の「ちょうど2人」モードは不変。
- Passive補正は既存calculatePassiveEffectsの率合算→ceilを再利用。Memory基数は不変、Passive増分は既存Enhancement式へ正常に反映する。
- 完全75/150、限定29/58、未対応41/82へ更新。今回の14/28を完全対応とは呼ばない。Support21/42は保留のまま。
- 全14種×Lv1/Lv2×候補0/1/2/3、欠落参照、所属欠落、非対象、複数source率合算をテスト。候補0は実機編成を捏造せず、計算層のsynthetic fixtureで確認。

残る実機検証は特に所属候補3人以上の選択規則。今回採用した最大人数解釈も実測済みへ格上げしない。

以下は承認前の調査履歴。`passive-condition-gaps.json` は元データの証拠不足分類であり実装対応数ではない。最新実装対応数は `unit-passive-audit.json` を参照。

# Promise対象Passiveの条件参照監査

2026-10-10。対象は保存済みの正規データ。計算・Canonical・Runtimeを変更しない。

## 結論

**今回は接続0行、保留4行。分類C（発動条件の意味を確定する証拠不足）であり、Leaderと同じ参照欠落ではない。** 原文は対象を指定しているが人数条件を記載していない。「条件なし」とも「2人以上が必要」とも生成しない。所属候補3人以上では、これとは独立して選択規則も未解決。

|カードID / カード|Passive原文 Lv1 → Lv2|対象|
|---|---|---|
|`card-04007-5-uniq-0047-00` IRyS / nephilim sonority|Promise2人のテクニックが32%UP → 43%UP|grp-promise、2人、T|
|`card-04010-4-cmmn-0000-00` クロニー / 刻を忘れるパフォーマンス|Promise2人のテクニックが21%UP → 32%UP|grp-promise、2人、T|

Passive IDはそれぞれ `live_passive_skill-<カードID>`。LivePassiveSkillマスターにあるのはIDのみで、独立したスキル名は収録されていない。カード名をスキル名として補完しない。JSONにはhighlightを含む原文を保存。

## 原本からResolverまで

1. `holodoridb-all-card-survey.json` のLivePassiveSkillLevelに `liveSkillTriggerGroupId` 自体が存在しない。sourceWrapperは行のキーを保持し、fieldsが取得データを保持する。今回の調査は保存済みsnapshotを対象とし、上流最新データの再取得はしていない。
2. CanonicalのsourceRecords.fieldsとsnapshot.fieldsは一致。レベルfactsにも全フィールドが保存されている。
3. `build_canonical_cards.py` は参照フィールドが存在するときだけconditionを生成する。今回は存在しないため未観測annotationを付ける。
4. `build_runtime_catalog.py` はこれを `state: unobserved / evaluationStatus: unresolved` として保持する。既存の条件を途中で落とした形跡はない。
5. `UnitParameterEngine.resolveInput()` は未観測をunsupportedとして止める。人数Resolver・Target Resolverには到達しない。SupportもScheduledSupportEngineでunresolved-conditionとして止める。

[Leaderの解決](promise-leader-resolution.md)では、原文に「Promiseが2人以上で」があり、元Leader行にもtrigger参照IDがあった。今回は両方ともない。「Promise2人の」はLiveSkillEffectTargetの原文とも一致する**対象**指定であり、条件閾値へ転用できない。

CharacterGrouping `grp-promise`、所属Runtime、カード→character対応は解決済み。所属不足ではない。接続済み所属Passive15種は明示的な人数条件を持ち、2人時だけ対象確定、3人以上でselection unresolved。属性順位を所属へ流用する根拠もない。

## 全76種の機械監査

再実行：[audit_passive_condition_gaps.py](audit_passive_condition_gaps.py)、結果：[passive-condition-gaps.json](passive-condition-gaps.json)。`--check`で一致確認可能。185カード370行の条件存在一致を確認し、そのうち未観測152行を抽出。全対象の原文・rawレベル・対象・効果・参照・入力SHAを記録。

|群|カード/行|既存データで即接続|回収対象の欠落参照IDを特定|条件意味の追加確認|候補超過の選択検証も必要|
|---|---:|---:|---:|---:|---:|
|Parameter 属性対象|41/82|0|0|41/82|0（既存属性順位は条件解決後に再利用候補）|
|Parameter 所属対象|14/28|0|0|14/28|14/28|
|Support 属性対象|21/42|0|0|21/42|21/42|
|合計|76/152|0|0|76/152|35/70|

追加要件の列は重複集計。全件で対象上限2、原文に人数条件記載なし、保存済みレベルにtrigger参照なし。A（生成時欠落）・B（参照伝達欠落）は0。主分類Cが76種。Dだけで解決するものは0で、35種に将来の選択検証依存がある。完全な元仕様や明示的な「参照なし＝無条件」の根拠を回収できれば実機検証を減らせるが、現資料では未確定。原文が見つからないのではなく、原文が条件を述べていない。

Parameter対応数は完全75/150、限定15/30、未対応55/110のまま。Leaderは131件対応を維持。Support未観測21/42も維持。

## 最小の実機検証

1. IRySまたはクロニーの対象カードを固定し、独立Leader補正・他Passive・Board・衣装等を固定または差し引ける状態にする。候補**1人（発動元のみ）→2人→3人**を比較し、各人のT増分とPassive内訳を記録。開花・特訓・カードLvも記録する。2人目には対象Passiveを持たないPromiseカードを優先し、複数source混入を避ける。
2. 1人で加算されれば「少なくとも2人必須」は否定される。1人では加算なし・2人で加算なら人数要件を支持するが、1回で他条件まで無条件と断定しない。0人はsource自身がPromiseなので通常編成ではこのPassiveを保持したまま作れない。0人はResolver単体テストに限定し、架空の実機編成を提案しない。
3. 3人では開花後baseTotal順位と編成順を逆にし、対象2人を記録。そのまま順番のみ交換して再確認。結果により編成順・baseTotal仮説を区別する。ランダム性は反復が必要。別のPromise sourceでも再確認して2カードへ一般化する。
4. Support21種は代表1枚で対象属性1人→2人、Active表示追加補正を観測。候補3人では同様に順位と編成順を逆にする。Leader/SP Supportや他Supportを外し、発動ごとの基礎倍率を記録。Parameter順位からSupport順位を推定しない。

条件意味が確認できれば候補数が対象上限以下の接続を検討できる。候補超過の所属/Support選択は別途解禁する。属性41種の既存順位再利用も、条件仕様を確認してから行う。

## 検証と変更範囲

- 新規Promise Passiveテスト：4行の保留、所属人数0/1/2/3、条件不成立と未観測保留の区別、未観測sourceから対象外へ適用しないこと。
- 既存全回帰：複数Passive、CASE C、Memory、Enhancement、Leader131、Timeline、固定seed。
- 監査の再生成一致、Canonical/Runtime整合性・再生成、Leader配信整合性。
- 変更は本レポート、新監査スクリプト/JSON、専用テストとテスト登録のみ。今回のEngine・Resolver・UI・配信データ変更なし。前工程のLeader変更には触れない。commit/pushなし。
