# Fix: Issue #3 — サービス選択時に大文字・小文字・数字を強制 ON

## 関連 Issue

- [#3 文字種をオフにした状態で、サービスを選択した時に大文字、小文字、数字がオフのままになる](https://github.com/rocket-martue/password-generator/issues/3)

---

## 問題の概要

`applyServicePreset` 関数はサービス別プリセット選択時に記号チェックボックスしか更新しない。  
そのため、ユーザーが大文字・小文字・数字のチェックボックスを手動でオフにした後にサービスを選択しても、OFF のまま維持されてしまう。

### 再現手順

1. 「大文字を使用」「小文字を使用」「数字を使用」のいずれかをオフにする
2. サービス別プリセット（select）から任意のサービス（例: Amazon）を選択
3. → オフにした文字種が OFF のままになる（= バグ）

---

## 原因

`js/app.js` の `applyServicePreset` 関数内で `elUpper.checked` / `elLower.checked` / `elDigits.checked` を操作していない。

```js
// 現状：記号チェックのみ更新しており、文字種は一切触れていない
const symbolSet = new Set(preset.symbols.replace(/\s/g, ''));
getSymbolCheckboxes().forEach(cb => {
  cb.checked = symbolSet.has(cb.value);
});
```

---

## 修正方針

`applyServicePreset` 内で記号チェックボックスの更新直後に、大文字・小文字・数字を `true` にセットする 3 行を追加する。

### 変更対象ファイル

- `js/app.js` — `applyServicePreset` 関数

### 変更内容

```js
// 記号チェックの更新直後に追加
elUpper.checked  = true;
elLower.checked  = true;
elDigits.checked = true;
```

---

## 対象外

- 汎用プリセット（`applyGenericPreset`）は変更しない
  - ボタンクリックは「記号の設定を変えたい」という意図であり、文字種まで操作する必要性が低い

---

## 検証手順

1. 大文字・小文字・数字のチェックボックスを手動でオフにする
2. サービス別プリセット（select）から任意のサービスを選択
3. 大文字・小文字・数字が自動で ON に戻ることを確認
4. 汎用プリセットのボタン（「全記号」「標準セット」など）を押しても大文字等は変化しないことを確認

---

## 影響範囲

- `js/app.js` 1 ファイルのみ
- 追加行数: 3 行
- 削除: なし
- 破壊的変更: なし
