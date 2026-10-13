# カードライブラリ差分更新（2026-10-13）

## 取得元・鮮度

- 取得元：[HolodoriDB / holodori-db-jpn-diff](https://github.com/HolodoriDB/holodori-db-jpn-diff)
- 更新前：`e43f062c32ff4e04567235efcd58448cd6b10f35`
- 更新後：[6680c7c37a8a3b3d56d919df823dca318db0d802](https://github.com/HolodoriDB/holodori-db-jpn-diff/tree/6680c7c37a8a3b3d56d919df823dca318db0d802)
- GitHub APIのデフォルトブランチ最新commitを確認。commit日時：2026-10-06 13:18:22 UTC。
- 取得完了：2026-10-13 00:26:42.944313 UTC（日本時間09:26）。全37テーブルを同一commitに固定。
- [取得記録・テーブルSHA](card-library-update-source.json)。公開リポジトリ内での最新を確認したもので、ゲーム実装との同時性や未公開データの不存在を保証するものではない。

## 差分（ID基準）

| 区分 | 件数 | 内容 |
|---|---:|---|
| 新規カード | 7 | すべて★5 |
| 既存Card行の更新 | 0 | 185 IDを維持 |
| 既存カードのスキル・成長・属性など計算情報更新 | 0 | 全185枚のCanonical計算情報・Runtime内容ハッシュ一致（sourceポインター位置を除く） |
| Character表示メタデータ更新 | 54レコード | `color5`追加。対応する旧185枚のCanonical memberFactsにも反映。計算には使用しない |
| 削除候補 | 0 | 旧185枚は全件維持 |
| 変換不能カード | 0 | 192枚すべてschema・JOIN検証PASS |

| タレント | カード名 | Card ID | Activeの未接続部分 |
|---|---|---|---|
| 宝鐘マリン | お宝独占♡ウォーターキャノン | card-00023-5-uniq-0085-00 | なし |
| 雪花ラミィ | 火照りを鎮める癒しの一口 | card-00030-5-uniq-0089-00 | ライフ600以上の置換効果（Lv1/2） |
| 尾丸ポルカ | 幸せ分け合うMeat For You | card-00034-5-uniq-0090-00 | なし |
| 博衣こより | 振り向きざまのaventure | card-00037-5-uniq-0086-00 | ライフ600以上の置換効果（Lv1/2） |
| こぼ・かなえる | 波間に揺れるBody ＆ Soul | card-03009-5-uniq-0088-00 | なし |
| ハコス・ベールズ | これがボクのイチオシ！ | card-04012-5-uniq-0087-00 | Promise2人以上の置換効果（Lv1/2） |
| 一条莉々華 | 夏夜を彩るBrilliant Smile | card-06003-5-uniq-0091-00 | なし |

機械可読差分：[card-library-update.json](card-library-update.json)。比較用の旧185枚の意味内容ハッシュ・Character値：[baseline](card-library-baseline-185.json)。過去のCanonical全文はGit履歴に保持し、原本の値を推測変更しない。

## 生成結果・計算接続

- Canonical：192枚、sourceRecords 5,757、JOIN 22,106、未解決JOIN 0。既存schemaは変更なし。
- Runtime：192枚（★3 54／★4 54／★5 84）。P/A/SP各384レベル、各特訓上限のステータス960行。完全な成長値はCanonicalに保持。
- 所属：54メンバー・15グループ・192カード対応。追加ハコスのJOINからPromise人数条件の正規行を取得。以前Leaderで必要だった原文照合fallbackは、正規条件が解決する経路へ自然に移る。
- Parameter Passive：旧145→152カード、290→304行が現行Engine gateでsupported。今回の7枚／14行も既存式・既存Selection経路。非Parameter Passiveは40枚／80行のまま。全パラ順位・同値等の既存暫定仕様の確度を上げたわけではない。
- 新Active：7枚／14行の基本効果を接続。3枚／6行の条件付き置換は原文・条件・効果を保持し、現在の基本効果のみの計算方針を維持。推測で条件評価を追加しない。
- 新SP：7枚／14行の主Score Supportと持続時間を既存経路へ接続。新規未接続SP効果は0。旧条件付きSP・確率等の未解決事項は維持。
- Leader：カード固有138件（Parameterを含む126、Supportを含む30、うち複合18）、共通衣装54件。新7件のParameter 5行・Support 4行を既存ルール生成で接続。Parameter専用Engineの分類は完全108／複合のSupportを別扱い18／Supportのみ12。Support Engine併用では全138件に既存の効果実行経路がある。
- 新しい計算式・効果enumの推測実装はなし。Active条件置換、Connect／Board等の従来未接続部分は別途残る。

## 保存互換性

カードID、所持・育成キー、編成スナップショット形式は変更しない。旧Runtimeと計算内容が一致した185 IDだけについて、生成データの `dataset.compatibleSelections` に旧Canonical SHA・旧Runtime版・旧commitを登録する。`canonicalDatasetMatches()` はこの限定リストを確認する。新7枚や未知hashを旧データ扱いにしない。

Runtimeローダーの「185件固定」検査は、非空・ID一意の検査へ変更（192件と元データ一致はデータテストで検証）。計算エンジンは変更なし。各HTMLの共通Adapter参照revisionを更新した。

## 再取得・再生成

取得は外部キャッシュへ行い、全テーブルを同じcommitへ固定する。

```sh
python3 -B research/fetch_card_sources.py --commit 6680c7c37a8a3b3d56d919df823dca318db0d802 --output /tmp/holodori-latest-tables
python3 -B research/holodoridb_all_card_survey.py --commit 6680c7c37a8a3b3d56d919df823dca318db0d802 --source-dir /tmp/holodori-latest-tables
python3 -B research/capture_leader_source.py --source-dir /tmp/holodori-latest-tables
python3 -B research/build_canonical_cards.py
python3 -B research/build_runtime_catalog.py
python3 -B research/build_affiliation_catalog.py
python3 -B research/build_leader_catalog.py
python3 -B research/audit_unit_leaders.py
python3 -B research/build_leader_parameter_rules.py
python3 -B research/audit_unit_passives.py
python3 -B research/audit_passive_condition_gaps.py
python3 -B research/audit_card_library_update.py
```

再取得時は取得日時が変わる。保存済みsurvey／leader-sourceから後続generatorの `--check` がバイト一致することを検証する。Leader監査のC分類は原本Effect group参照の欠落という旧監査軸で、開発者承認・実測による現行接続状態と混同しない。raw条件未観測監査もEngineのunsupported件数とは別。

## 検証結果

- `tests/verify.py`：全自動回帰PASS。既存の実測fixture・CASE C・Parameter・Memory・Enhancement・Leader・Timeline・固定seed Simulationを含む。
- `tests/runtime-catalog.test.py` / `tests/leader-catalog.test.py`：元データ保持・全件射影・再生成一致PASS。
- Canonical/schema、Runtime、所属、Leader一覧、Leaderルール、Passive/Leader監査、差分監査の再生成一致PASS。
- 新 `tests/card-library-update.test.js`：旧185枚の保存参照互換、新7枚のLv1/2・SP・Parameter・固定seed PASS。
- Chrome `card-library-update-browser.html`：新7枚の検索・スキル表示・選択・計算・保存／一覧／復元、所持非干渉、1100px/360px PASS。
- Chrome `browser.html` / `navigation-browser.html` / `unit-formation-browser.html`：PASS。
- `unit-simulator-browser.html`：既知の `three candidates deferred` でFAIL（旧所属Passiveの期待値）。今回も同じ失敗、計算側は変更していない。

commit / pushは実施しない。
