# カード単位のユーザー状態

`user-card-state.js`が、localStorageの`holodori-user-card-state-v1`を管理する。

```json
{
  "version": 1,
  "cards": {
    "外部カードID": {"owned": false, "training": 0, "opening": 0}
  }
}
```

- `owned`: boolean。OFFでも育成設定は保持する。
- `training`: 整数0〜4。
- `opening`: 整数0〜5。共通adapterへ渡す際に既存のbloom引数として使用する。
- 未登録カードの初期値は非所持・特訓0・開花0。閲覧・検索だけでは書き込まない。
- `readUserCardStates()` / `getUserCardState()`で読み、`updateUserCardState(cardId, patch)`で操作した項目だけ更新する。更新直前に再読込し、他カード・未知のカードID・ルートとカードの追加項目を保持する。
- JSON破損、未対応version、不正な既存値は上書きしない。書込み失敗は呼出元へ伝え、UIは保存済み値へ戻してカード内にエラーを表示する。
- A/Bの一時状態、メンバーライブラリ、編成保存には読み書きしない。既存データから所持・育成を推定移行しない。以前の閲覧用メモリー状態は永続保存されていなかったため移行対象がない。
- 計算済みP/T/S、スキル、Canonical rawは保存しない。表示時に同じRuntime Catalogと共通adapterから再計算する。
- Card Libraryの特訓・開花はステッパーで変更し、上下限ボタンを無効化する。非所持でも変更可能。SP→A→Pの順で選択Lvと効果を表示する。
- この段階では所持フィルタや編成への自動反映はしない。データはブラウザー・オリジン単位で保存され、アカウント同期はない。

検証: `python3 -B tests/verify.py`（user-card-state単体テストを含む）、`tests/browser.html`（Chrome）、`tests/navigation-browser.html`（PC/狭幅）、`tests/runtime-catalog.test.py`、Canonical/Runtime生成スクリプトの`--check`。

## カード画面JSONエクスポート（2026-10-11）

共有メンバーライブラリのマニュアル入力出力とは別。カード画面のフィルター上部に「所持・育成JSONを出力」を追加。現在の保存内容をクリック時に読み取り、検索・レア度・属性絞り込みに依存せず出力する。保存への書き込みなし。

形式は `format: holodori-user-card-state-export`、`version: 1`。exportedAtはUTC ISO日時。sourceはページ、storageKey、storagePresent、Runtime dataset参照情報。cardsは全Runtime IDと保存済みIDの和集合で、各行にcardId、inCatalog、saved、stateを持つ。未保存はsaved=false/state=null。保存済み未所持はsaved=true/state.owned=false。training/openingの明示0は0のまま。マスターから除外されたIDもinCatalog=falseで保持する。

savedDataは元ストアのJSON値全体（存在しなければnull）。拡張フィールド、明示nullを保持し、未設定フィールドは補完しない。現行保存ではowned/training/openingは必須。不正・未対応形式はエラー表示し、既定値へ補正して出力しない。発動頻度UPはこのストアに存在せず出力しない。A/Bや共有Libraryの設定を混ぜない。

JSONダウンロードはBlobとして生成。保存形式・カードマスター・計算エンジン変更なし、インポートなし。

テスト：user-card-state.test.jsで未保存/未所持/0/null/拡張項目/未知ID/不正入力/書き込み非干渉。card-export-browser.htmlでChrome 1100px/360px、Blob内容とファイル名、検索中でも185件、チェック/育成・絞り込み・再読込復元・保存文字列不変を確認。
