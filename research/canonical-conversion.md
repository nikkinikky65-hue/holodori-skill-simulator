# 全185カードCanonical変換と呼び出し

`canonical-cards.json`は、固定commit `e43f062c32ff4e04567235efcd58448cd6b10f35` の既存調査JSONを変換した成果物。上流の再取得は行わない。

既存の `canonical-card-schema-proposal.schema.json` とサクラBloom fixtureは変更しない。schemaが要求する `proposalStatus: proposal-not-implemented` も維持している。この文字列、および旧設計文書・fixtureの「未接続」は当時の境界を示すものであり、現在は別のadapterが全185件を限定的にUIへ接続する。

## 再生成・検証

Python 3と`jsonschema`（Draft 2020-12対応）が必要。

```sh
python3 -B research/build_canonical_cards.py
python3 -B research/build_canonical_cards.py --check
python3 -B tests/verify.py
```

`--check`は再生成結果と保存済み成果物のバイト一致を検査し、書き込みを行わない。入力SHA-256と元の取得日時を記録するため、同じ入力から同じ成果物が生成される。

検証対象：185件のID一致・一意性、5,626原行の全fields/wrapper保持、21,267 JOINの両端とキー一致、factのraw値・JSON型・出典整合、P/A/SP各370レベル、成長曲線13,180行参照、各カード5特訓段階・5ブルーム段階。未解決参照は0件。条件のないPは明示的なnoneにしない。

P条件あり218レベル、Active条件付き置換142レベル、Special独立第二効果174レベル（うち条件付き66）の構造を検証する。スキルごとの元のgroup参照・効果順序も検証する。Connect/board関連原行は証拠層にのみ保持する。

## runtimeとの境界

- 全185件は検索付きの共通カード選択UIから呼び出せる。P/A/SPレベルは個別指定。
- メンバーは、出典の日本語名と`members.js`の名前が一意に完全一致した場合のみ対応候補として使用。54人すべて一致。名称の曖昧検索や外部IDのLibrary IDへの代入は行わない。
- 属性は、出典targetのraw enumと日本語localizationのattributeタグの対応を根拠付き候補として保持。レア度も明示的な既知enum対応候補。
- Active基本効果のみ既存計算へ接続。全370レベルの表示倍率を日本語説明と照合する。確率は説明の低/中/高であり、raw確率係数を数値確率へ推測変換しない。
- Pは条件が観測された場合も未評価。条件参照がない場合はunresolved。Specialは独立した各効果とレベル行の持続時間を保持し、個別効果の時間を推定せず、shortや常時Score Supportへ適用しない。
- A面の各枠には詳細を表示しない。P/A/SPの情報はRuntime由来の`canonicalExpansion`としてメモリー内に保持する。保存するのはID・独立レベル・データセット識別子の`canonicalSelection`だけとする。詳細は選択ダイアログ内の折りたたみ欄で確認できる。
- 枠リセットは、その枠の手入力値・Library/Canonical参照・展開情報・発動頻度UPを初期値へ戻す。その枠の最適化上限も初期値12に戻す。曲設定・他枠・Library・保存済み編成・元Canonicalデータは変更しない。
- Libraryへの自動登録は行わない。ユーザーが明示的に「保存」を操作する既存機能は維持する。

`tests/browser.html`は専用プロファイルとローカルHTTPサーバーで実行する。カード名/メンバー名検索、サクラBloomと別カードの呼び出し、独立レベル、手編集、詳細非表示、枠リセット後の再読込、他枠のCanonical状態・Library・保存済み編成・原データの保全を検証する。

完全Canonicalは原情報保持を優先した約32MBの正本として維持する。ブラウザーはそこから生成した `data/runtime-cards.json` のみを取得する。生成・保持契約・原本の保存状況は [runtime-catalog.md](runtime-catalog.md) を参照。同一ページ内はPromiseを共有し、選択中の1枚だけを展開する。
