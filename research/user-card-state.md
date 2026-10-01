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
