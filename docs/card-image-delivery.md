# 公開用のカード画像配信

`card-image-resolver.js` の `const source = 'worker';` が切り替え箇所。`local` にすると従来の `assets/cards/` を参照する。公開用には画像本体を配置・追跡しないため、通常はworkerを使用する。

WORKSPACEの84カード・252画像の対応表をそのまま使用する。Thin→Thumb→Fullを順に試し、すべて失敗・未登録の場合は従来の公開用と同じ画像領域なしの表示へ戻る。Parameter計算、編成入力・保存には画像取得結果を渡さない。

Worker: https://holodori-image-proxy.nikkinikky65.workers.dev/
パス: `/cards/{thin|thumb|full}/{filename}.png`

認証情報は埋め込まない。Access/R2設定は変更しない。認証失敗・欠損・ネットワーク失敗はimg.onerrorでは区別できない。GitHub Pages上での認証済み/未認証の差はデプロイ後に別途確認する。Workerへの直接アクセス成功だけではクロスサイト画像表示成功とはいえず、認証CookieのSameSite・第三者Cookie制限も確認する。トークンやCookieの値は記録・共有しない。

## ローカル検証

```sh
python3 -B tests/verify-card-image-delivery.py
python3 -B tests/verify-parameter-comparison.py
python3 -B tests/verify.py
python3 -B tests/verify-parameter-comparison-browser.py
python3 -B tests/verify-parameter-comparison-browser.py --page unit-parameter-comparison-browser.html
```

ブラウザーテストはテスト用HTTPサーバーがWorker URLだけをローカルの模擬レスポンスに置き換える。通常404、画像成功テストではメモリ上の小さなSVGを返す。カード画像ファイルは不要。これは実Worker・Accessの認証成功を確認するものではない。

2026-10-31: 画像表示テストは201枚に合わせ、成功・Thumb/Fullへのフォールバック・全失敗、1920/1280/768/390px、計算値・保存・Active操作を検証。既存の他画面のブラウザーテストには196枚を期待するものが残り、今回の変更前から件数で失敗する。これらの期待値は本変更では修正しない。

## 2026-11-05 公開用WebPへの参照切替

公開Resolverは非公開変換台帳の93枚・279公開名に切替。source=workerを維持し、Full/Thumb/Thinはcards/full/・cards/thumb/・cards/portrait/のWebPを参照する。Thin→Thumb→Full優先順とThumb限定UIは変更しない。カードIDは保存互換性のため維持、画像パスの内部asset IDは除去。上記旧84枚・PNGパスの記述は本節で置き換える。

R2キーはユーザー訂正確認による（Thinの格納先はportrait/）。独立したWorker取得確認は全候補HTTP403のため未完了で、画像本体の存在・Content-Type・Access認証後の表示は断定しない。Cloudflare設定変更や認証回避は行っていない。台帳とmanifest、共通assetsのWebPハッシュを279件照合（ローカルThumb相当はportrait/へ移動済み）。localモードは公開名のassets/cards/{kind}パスを返すが、公開リポジトリへ画像は配置しない。

### R2階層の訂正

ユーザー確認済みの実キーは `cards/webp/full/`・`cards/webp/thumb/`・`cards/webp/portrait/`。公開Resolverの全279パスにwebp/を追加する。Thinの論理種別とフォールバック順は維持。旧節のwebp/なしのURLは本節で置き換える。Worker・Access設定は変更しない。実配信の認証後確認は別途必要。

### 確定したWebP配信構造（過去の階層訂正に優先）

Worker URLは `/cards/full/{公開名}.webp`・`/cards/thumb/{公開名}.webp`・`/cards/portrait/{公開名}.webp`。Workerがassets/を付加し、R2の `assets/cards/{full|thumb|portrait}/{公開名}.webp` を参照する（ユーザーが正常動作確認済み）。Resolverは先頭assets/のみ除去し、Worker URLにassets/やwebp/を含めない。内部画像種別thinとThin→Thumb→Fullの順序は維持し、thinのURLディレクトリだけportraitにする。93枚の公開名は変更しない。WORKSPACE側のResolver・画像参照は変更しない。
