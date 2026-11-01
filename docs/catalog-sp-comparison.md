# カード図鑑：SP比較モード（試験実装）

対象は `card-catalog.html`。初期表示の「詳細」と既存の所持・育成編集を維持し、「SP」のみ追加する。ステータス・Active・Passive表示モードは未実装のため選択不可。既存のタレント・Passiveスキル・文字検索・レアリティ・タイプ絞り込みは両モード共通で、切替時に保持する。

## データと表示

Canonicalの既存Runtime投影 `data/runtime-cards.json` を既存adapterで読み込む。生成器、Canonical、Runtime、計算エンジン、保存形式は変更しない。

| 列 | 取得元・表示単位 |
| --- | --- |
| Thumb | 既存CardImageResolverのcandidatesからkind=thumbのみ。未登録・失敗時は画像なし。Thin/Fullのリクエストなし |
| カード／タレント | card.name / card.member.name |
| 効果時間 | skills.special.levels[].raw.effectDurationMillisecondを秒表示 |
| 効果量 | effects[].effect.raw.type=SCORE_UP_EFFECT_UP_PERMIL_UPのvalue（‰→%）。スコアサポートの効果量であり、スコア全体の倍率ではない |
| 発動率UP（%） | LIVE_ACTIVE_SKILL_ACTIVATION_PROBABILITY_UP_PERMIL_UP。既存ActivationProbabilityEngine.fromScheduleの単位変換を利用し、rateを%表示。SP自体の発動確率ではなくActive発動率への補正 |
| ライフ回復 | LIFE_RECOVERYのraw.valueを数値表示 |
| 判定強化 | JUDGEMENT_ENHANCEのeffect.description。実データに数値がないため説明文のみ、数値ソートなし |

上記のtypeには共通接頭辞 `LiveActiveSkillEffectType_LIVE_ACTIVE_SKILL_EFFECT_TYPE_` が付く。条件はcondition.descriptionを併記し、成立判定しない。既知の装飾タグは既存skillDescriptionTextで除去し、全項目をtextContentで出力する。

複数効果は原データ順ですべて表示する。数値列は昇順／降順に対応し、複数値の場合は表示順の辞書式比較、同値は従来のカード順を維持。「—」は両方向で末尾。未知の効果は計算せずカード情報欄に未対応として表示する。推測値は補完しない。

## 育成状態

SPレベルは既存 `canonicalBloomLevels(card, opening).special` で選択する。初期値は開花0、最大育成は開花5、保存状態はカードごとの既存保存値（未保存は既存仕様どおり0）。カスタムはSPに関係する開花の初期／保存／最大を指定する。特訓はSPに影響しないため項目を設けない。

全表示カードに同じモードを適用するが、保存値はカード別。変更時に表示と現在のソートを更新し、保存データを書き換えない。編成内のSP適用・条件・リーダー等を計算する画面ではない。

## レイアウト・画像

1カード1行、カード名とタレント名を上下に表示。左2列を横方向、見出しを縦方向に固定。表領域内で縦横スクロールし、狭幅ではカード列を小さくする。Thumbは2行程度の高さ（PC48px、狭幅40px）で正方形・contain表示、欠損時も枠を維持。画像取得元・Worker設定と認証は既存resolverに従う。

## 検証

`python3 tests/verify-catalog-sp.py` は全201枚・402レベル、単位、条件、開花、複数効果、未知／欠損、ソート、データ不変を検証する。実データの効果エントリーはスコアサポート402、発動率UP94、ライフ回復46、判定強化44。これらはカード数ではなく両レベル合計。現在の未知効果は0。

`python3 tests/verify-parameter-comparison-browser.py --page catalog-sp-browser.html` は隔離Chromeで1280/768/390px、モード・育成・保存不変・既存絞り込み・ソート・固定列／見出し・画像成功／欠損を検証する。画像成功はローカルモックを使い、実Worker認証成功を意味しない。

今後の課題は実環境での操作感確認と、追加される未知効果の表示対応。今回SP・Activeの新たな検索条件や、既存エンジンの対応範囲拡張は行わない。

### 2026-11-01の検証結果

- `tests/verify.py`（SPデータ検証を追加）成功。
- SPブラウザ検証成功。既存ブラウザ検証は編成Thumb／TOTAL、Parameter比較、最適化、編成CRUD、編成一覧、カードのタレント絞り込みが成功。
- 既存の `unit-card-picker-browser`、`talent-filter-browser`、`catalog-passive-filter-browser`、`card-display-order-browser`、`card-export-browser` は旧ライブラリ件数の固定期待値で失敗。変更前の公開用でも同じ5件が失敗することを確認。期待値・検証条件は本作業では変更していない。
- 新規データテストの初回実行はJavaScriptCoreにブラウザのURLがないため失敗。既存テストと同じURL／documentスタブを追加後に成功。実装や実データの期待値は緩和していない。
