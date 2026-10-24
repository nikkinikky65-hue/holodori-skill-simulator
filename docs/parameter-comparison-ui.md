# 公開用Parameter比較UI（画像なし）

2026-10-24、WORKSPACEの比較表示を公開用の現行実装へ選択的に移植。ローカル実装・検証までで、commit・push・公開デプロイは行わない。

## 移植範囲

`unit-simulator.html` の「2. パラメーター」に5人の簡易／詳細比較を追加する。P/T/Sは縦方向に開花後実数値、適用済みPassive率の単純加算値、補正後の現在計算値を表示する。0%の文字は空欄だが、23pxの行高を維持する。5枠は折り返さず、幅が不足すると比較領域内で横スクロールする。従来の表とtraceは折りたたみ内に保持する。

表示用射影はWORKSPACEと同じ。開花後値は既存Memory traceのreferenceValue、Passive率/増分はpassive.ratesとpassive、補正後値はsubtotalから取得する。丸め後増分から実効率を逆算したり、率を乗算合成したりしない。補正元ごとの率は既存の適用済みtraceから示し、合算後ceilの増分を補正元別へ推定分割しない。

エンジンのfinalは未確定nullであり、UIは「現在計算値」と説明する。Board・衣装・EnhancementはTOTAL専用で、P/T/Sへ推定配分しない。未設定・未確定の補正は別途明示する。表示切替は保存形式・計算条件・シミュレーション入力に含めない。

## WORKSPACEとの違い

- 公開用196枚、開発用ルート192枚のライブラリはそれぞれ維持。Canonical・Runtime・所属・Leader生成物は転送しない。
- 公開側のメンバーフィルター、レア度順表示、Timeline最適化、SP順序保存を維持。古いWORKSPACE版のunit-simulator.js/htmlによる丸ごと上書きはしない。既存公開用コードにmount/render/clearだけを接続する。
- カード画像・画像対応表・ローカル画像resolverは公開用へコピーしない。デフォルトでは画像DOMを作らず、画像用の列・ラベル・余白も確保しない。画像URLの試行による404も発生させない。
- 将来は `UnitParameterComparison.mount(root, {imageResolver})` で `candidates(cardId)` を持つresolverを注入できる。WORKSPACEのresolverと同じ `{kind,url}` の候補形式を使用する。今回は注入せず、外部画像サーバーにも接続しない。
- 公開用で既に存在していたassetsの削除差分は今回の作業前からのもの。復元・削除・追跡状態変更は行わず、今回の画像差分を追加しない。

## 変更ファイル

- `unit-simulator.html`, `unit-simulator.js`: 選択的な画面接続とJSキャッシュrevision。
- `unit-parameter-comparison.js`, `unit-parameter-comparison.css`: 表示モジュールと画像なしレイアウト。
- `tests/unit-parameter-comparison.test.js`, `tests/verify-parameter-comparison.py`: 公開用エンジン値・複数Passive率の単純加算・空き枠・非破壊性。
- `tests/unit-parameter-comparison-browser.html`, `tests/verify-parameter-comparison-browser.py`: 画像リクエスト0件・レスポンシブ・保存読込・公開側固有機能のブラウザー回帰。
- 本文書。

## ローカル実行と検証

公開用リポジトリのルートから:

```sh
python3 -m http.server 8001 --bind 127.0.0.1
# http://127.0.0.1:8001/unit-simulator.html
```

`file://` 直接表示はJSONのfetchが制限されるため、HTTPを使用する。

```sh
python3 -B tests/verify.py
python3 -B tests/verify-parameter-comparison.py
python3 -B tests/verify-parameter-comparison-browser.py
```

MacのJavaScriptCoreとChrome headlessを使用。ブラウザーランナーは専用の一時プロファイル・ローカルHTTPサーバーを使い、ユーザーの保存データを使用しない。ログとスクリーンショットは一時フォルダへ出力し、リポジトリには追加しない。

確認内容:

- 簡易／詳細の390/768/1280/1920pxで5人同一行、数値と0%行の位置、狭幅スクロール、画像用の余白なし。
- 開花後値・Passive率/増分・補正後値が既存エンジンと一致。複数の適用済み補正率が単純加算と一致。表示処理によるmodel変更なし。
- 画像DOMなし、テストHTTPサーバーのassetsリクエスト0件。
- 編成保存・読込後の表示更新、空き枠の維持、100試行のActive実行。
- 公開側既存のカード選択、Timeline最適化（SP120順序）、編成CRUD・一覧・URL読込のブラウザーテスト。

画像の実配信、R2接続、確定していないTOTAL専用補正のP/T/S配分、交代候補の編成全体貢献度評価は未実装。

## Passive・Leaderの率表示

Passive率の右に、適用されたParameter Leader率との単純加算値を表示する。例: `+32%（112%）`、`（80%）`、`+32%`、両方0%なら空欄（行高維持）。P/T/Sごとに判定し、Leaderが0%なら括弧を省略する。詳細表ではPassive率・Leader率・合計率を個別にも確認できる。

Leader率は既存エンジンの `parameters.leaderResult.trace` のうち `status === 'applied'` かつ対象枠・Parameterが一致した効果の `effect.percent` を加算する。各メンバーに複製されたtraceを横断加算しない。未適用・未確定・Support効果は加算せず、条件判定と解放状態は既存の選択・エンジン処理に従う。最終値からの逆算や計算エンジンの変更は行わない。

## Leader説明文の装飾

表示専用の `skillDescriptionText` をリーダー選択欄・適用状況・リーダー一覧で共用する。実データのLeader説明にはattribute=cute/happy/pure、カード説明には同種のhighlightタグを確認。attributeとhighlightの開始・終了タグだけを除去し、中の日本語・改行は維持する。未知のタグ表記は保持する。出力はOptionまたはtextContentに渡し、HTMLとして解釈しない。原文・Canonical・計算・条件判定は変更しない。

## 最適化設定の表示

上限率の選択肢0/4/8/12%は維持し、新規画面の初期選択を既存の最大値12%とする。既存の保存形式には探索上限率の項目がないため、新たな永続化は追加しない。編成変更・読込では上限率の選択状態に触れない。

`talent-presentation.js` がタレントIDと正式名から表示名を解決する。短縮名はさくらみこ→みこ、こぼ・かなえる→こぼ、AZKi→AZKi、角巻わため→わため、星街すいせい→すいせいをIDで明示対応し、未定義は正式名、未選択は「未選択」を使う。正式名は別に保持しラベルのtitleでも確認できる。長い表示名は折り返し、入力欄の幅を確保する。画像・URL・アイコン取得処理は追加しない。将来のタレント表示情報はこの表示専用モジュールへ集約できる。最適化アルゴリズム、計算、内部ID、保存形式は変更しない。
