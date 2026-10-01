# リーダースキル一覧（表示専用）

## 調査結果

既存CanonicalのCard source factsには `rewardCostumeId` が131枚に存在するが、Costume / LiveLeaderSkill / リーダー原文は従来の調査対象外。既存のP/A/SPをリーダーへ読み替えず、同じ固定commitから次の5テーブルを追加取得した。

- [Costume](https://github.com/HolodoriDB/holodori-db-jpn-diff/blob/e43f062c32ff4e04567235efcd58448cd6b10f35/Costume.json)
- LiveLeaderSkill
- LangCostume_Jpn
- LangLiveLeaderSkill_Jpn（空配列）
- LangGeneratedLiveLeaderSkill_Jpn

`holodoridb-leader-source.json`は取得時のJSON値を保持し、テーブル別URL・取得内容をローカルに保存した時刻・ハッシュを記録する。原本バイト列そのものではなく、JSONを再シリアライズした記録である。既存原本・Canonical・schemaは変更しない。

## 対応関係

`Canonical Card.rewardCostumeId → Costume.id → Costume.liveLeaderSkillId → LiveLeaderSkill.descriptionLangId → LangGeneratedLiveLeaderSkill_Jpn.text`

131枚（★4 54枚、★5 77枚）は上記の明示的な参照で結合でき、Character IDの一致も検査する。ID文字列の命名パターンから関係を推測しない。表示のメンバー・カード名・レア度は既存Runtime Catalogを使用する。

LiveLeaderSkillは185件。今回の固定版ではnameLangIdがなく、LangLiveLeaderSkill_Jpnも0件のため、スキル名はnullとして「名称未収録」と表示する。衣装名をスキル名として扱わない。原文の装飾タグのみ表示時に取り除き、数値・条件・複数行は保持する。

## 共通効果

カードの衣装報酬とは結合されない「デフォルト」衣装に、54件のリーダー参照があり、いずれも原文は「全員の全パラメータが15%UP」。主一覧から除外し、`commonEffects[]`で別管理する。ページでは「共通効果」の折りたたみ内に参考表示する。共通衣装に紐づくCharacter IDからタレントを表示するが、`cardIds: []`のままにしてカードへ付与しない。

★3カード54枚のCard行にはrewardCostumeIdがないため、デフォルト衣装のID中に似た文字列があっても★3固有リーダーとは推定しない。取得Costumeは193件で、残る8件はデフォルト衣装だがliveLeaderSkillIdが存在しない。効果を補完せずcoverageに記録する。LiveLeaderSkill全185件は主131件＋共通54件で網羅する。

## 派生データと実行時境界

`build_leader_catalog.py`は完全Canonical・既存Runtime・追加原本から `data/runtime-leader-skills.json` を決定的に生成する。カード本文の第二DBを手入力で作らない。補助カタログは129,561 bytes（表示分類追加後）。カード用Runtime/schemaには項目を追加しない。

leader.htmlは既存カードRuntimeと補助カタログだけを読み込み、Canonical SHA一致を確認してカードIDで結合する。完全Canonicalや研究原本をブラウザーへ配信しない。commonEffectsは拡張用の別枠であり、自動適用・設定登録機能はない。

ナビは共通site-navigation.jsで「カード → リーダー → イベント編成探索」とする。既存所持情報・A/B・Library・保存編成へは一切書き込まない。リーダー/共通効果の内部計算式、総合力・探索・最適化への適用は行わない。

## 再生成・検証

```
python3 -B research/build_leader_catalog.py
python3 -B research/build_leader_catalog.py --check
python3 -B tests/leader-catalog.test.py
python3 -B tests/runtime-catalog.test.py
python3 -B tests/verify.py
```

Chromeのtests/browser.htmlで全主一覧の効果原文、共通効果分離、保存非干渉、研究データ未fetchを検証する。tests/navigation-browser.htmlは5面の遷移とPC/スマホ幅を検証する。

## 効果別比較表示

生成時に原文から表示専用 `presentation` を派生する。計算用の効果・条件定義とは区別し、原文descriptionと出典は維持する。各行を `effects[]` に保持し、効果名・%・条件文・対象「全員」・原文行を保存する。未知の文型は推測せず「未分類」で原文を表示する。

主131件を、センスUP 21件、テクニックUP 20件、パフォーマンスUP 22件、全パラメータUP 42件、スコアサポート10件、複合効果16件へ分類する。単一効果は%降順、複合は効果の組合せと両方の%でまとめる。同一カードは1回だけ掲載する。条件はタレント名の横へ表示し、異なる条件の複合は各効果に条件を添える。

原文・レア度・衣装名・未収録のスキル名は各カードの詳細で確認できる。共通54件は分類へ混ぜず従来の別枠で保持する。Canonical・カードRuntime・原本・保存形式・計算ロジックには変更しない。
