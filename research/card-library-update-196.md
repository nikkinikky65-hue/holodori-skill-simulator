# ライブラリ192→196枚更新

固定commit: `ed117f1d53d4680228d22c7176e511a1c241c5fc`。本番Canonical/Runtimeを192件から196件へ更新する生成・検証記録。

## 入力

WORKSPACEの取得済み `python/output/master-20261022-retry/` のCard・Character・LangCard_Jpn・LangCharacter_Jpnを再利用。不足33テーブルは同一commitから既存fetch-masterの取得関数で新規 `master-196-dependencies/` に取得。元の取得フォルダは変更していない。

利用した全37テーブル:

- `Card`
- `CardLevel`
- `CardLevelLimit`
- `CardPotential`
- `CardPotentialUpgradeItem`
- `LangCard_Jpn`
- `LangCharacter_Jpn`
- `LangCharacterProduction_Jpn`
- `Character`
- `CharacterProduction`
- `CharacterGrouping`
- `LivePassiveSkill`
- `LivePassiveSkillLevel`
- `LivePassiveSkillEffect`
- `LiveActiveSkill`
- `LiveActiveSkillLevel`
- `LiveActiveSkillEffect`
- `LiveSpecialSkill`
- `LiveSpecialSkillLevel`
- `LiveSkillEffectTarget`
- `LiveSkillTrigger`
- `SkillTreeConnectEffect`
- `SkillTreeConnectEffectExtent`
- `LangGeneratedLivePassiveSkillLevel_Jpn`
- `LangGeneratedLivePassiveSkillEffect_Jpn`
- `LangGeneratedLiveActiveSkillLevel_Jpn`
- `LangGeneratedLiveActiveSkillEffect_Jpn`
- `LangGeneratedLiveSpecialSkillLevel_Jpn`
- `LangGeneratedLiveSkillEffectTarget_Jpn`
- `LangGeneratedLiveSkillTrigger_Jpn`
- `LangGeneratedSkillTreeConnectEffect_Jpn`
- `LangCharacterGrouping_Jpn`
- `Costume`
- `LangCostume_Jpn`
- `LiveLeaderSkill`
- `LangLiveLeaderSkill_Jpn`
- `LangGeneratedLiveLeaderSkill_Jpn`

統合cacheでは取得完了状態・commit・各テーブルSHA-256を検証し、既存のwrapperメタデータに基づいて複合キーと重複を検証した。id/data.idがある行は一致を検証した。統合manifestには入力captureのSHA-256と取得日時を残す。

## 生成結果

| 対象 | 更新前 | 更新後 |
|---|---:|---:|
| Canonicalカード | 192 | 196 |
| Runtimeカード | 192 | 196 |
| P/A/SP各レベル行 | 384 | 392 |
| Runtime特訓上限スナップショット | 960 | 980 |
| カード固有Leader | 138 | 142 |
| 共通衣装Leader | 54 | 54 |

Canonicalは5,831保持原行、22,596 JOIN、未解決参照0件。既存schema・型・保持原行・各カードの参照とsource値を検証した。

| 新規ID | メンバー | カード名 | 生成状況 |
|---|---|---|---|
| card-00027-5-uniq-0092-00 | 常闇トワ | ゆらゆら過ごす木陰のバカンス | ★5、P/A/SP Lv1/2、成長・特訓・開花・Leader参照を生成 |
| card-00032-5-uniq-0093-00 | 獅白ぼたん | 一心不乱のちゅるタイム | 同上 |
| card-03008-5-uniq-0095-00 | カエラ・コヴァルスキア | 木陰で紡ぐShiny Memory | 同上 |
| card-04014-5-uniq-0094-00 | 古石ビジュー | 笑顔輝くSand castle | 同上 |

## 旧192枚と保存互換

旧5,757保持原行を新commitと照合し、欠落0件。変更は `LangGeneratedLiveActiveSkillLevel_Jpn` の説明文384件の先頭ASCII空白削除だけで、ユーザーの明示承認を受けた。出典rawを旧値に書き戻すことはせず、新commitの原文を保持する。

Card原行、スキル/成長/特訓/開花の数値・条件・効果・参照ID、Character等の他原行は同一。既存CanonicalカードオブジェクトとRuntime全内容についても、Active説明文の先頭空白とsource位置を除き一致することを検証した。Canonical/RuntimesのSHA・版・source pointer位置・取得日時は生成データとして変わる。

`card-library-baseline-192.json` は更新直前の実データから自動生成した保存互換baseline。旧185枚の互換データもそのまま保持する。旧185枚と192枚のCanonical SHA・Runtime版・commitを持つ保存済み参照は、カードごとの同一性を照合したものだけ許可する。先頭空白以外の違いまで無視することはない。計算ロジック・UI・画像・保存形式は変更していない。

## 再利用手順

WORKSPACEの `python/` から:

```sh
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -B main.py update-library \
  --production ../../holodori-skill-simulator \
  --source-dir output/master-20261022-retry \
  --source-dir output/master-196-dependencies \
  --commit ed117f1d53d4680228d22c7176e511a1c241c5fc \
  --expected-count 196 \
  --allow-active-leading-space
```

通常はWORKSPACE内の作業用コピーで生成・検証する。反映する場合だけ `--apply` を追加する。別commit・別取得パスも同じ入口で扱える。不足取得を許可する場合だけ `--fetch-missing` を付ける。作業・ログ・比較レポート・生成物ハッシュは `python/output/library-updates/<実行ID>/` に保存する。人手で大容量JSONを編集せず、既存生成器を呼び出す。

## 検証

- 更新前192枚の既存回帰を先に実行してPASS。
- 全9生成器の生成と `--check` によるバイト再現一致。
- Canonicalのschema、原行・fact・型・全JOIN、各カードの成長等の原行網羅。
- Runtime全196枚の原情報射影・ポインタ・各P/A/SP392行・統計スナップショット980行。
- Leader142カード固有＋54共通の元データJOINと原文保持・再生成一致。
- `tests/verify.py` 全既存回帰。既存192枚の保存SHA/版/commit互換、新規4枚×Lv1/2のParameter・SP・Timeline・固定seed Simulationを追加確認。
- `tests/release-integrity.test.py` 6テスト。空白例外の限定・数値/本文/欠落の拒否・旧保存互換の引継ぎを確認。
- WORKSPACEの既存19テスト＋更新ガード7テスト、計26テスト。

件数固定だった生成器の総数検証は元データの原行網羅検証へ変更した。テストの既存192枚に関する期待値は旧baselineのカード集合に限定して保持し、効果テスト自体は新規を含む全データに実行する。新規4枚は追加統合テストでも確認する。

## 未対応・既存の保留範囲

カエラ・ビジューの条件付きSP発動率UPは、原データと条件を保持するが既存エンジンの方針どおり条件評価を保留する。トワ・ぼたんの無条件SP発動率UPは既存の専用確率Engine経路に従う。主Score Supportは4枚とも既存経路で処理する。新しい条件・効果の推測実装、Connect/board処理の拡張、画像更新は行っていない。ブラウザーGUIでの操作検証は今回未実施。commit・pushは行わない。
