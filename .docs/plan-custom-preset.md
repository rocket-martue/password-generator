# Plan: カスタムサービスプリセット機能

対応 Issue: https://github.com/rocket-martue/password-generator/issues/1

---

## 要望の整理

- **① レンタルサーバープリセットの追加** — エックスサーバー・さくらのレンタルサーバー・ロリポップ！・ConoHa WING などを組み込み済みプリセットとして追加
- **② カスタムサービス登録** — ユーザー自身がサービス名・記号・文字数条件を登録・削除できる機能

---

## データ設計

### カスタムプリセットの保存先

`localStorage`（キー: `pg-custom-presets`）に JSON 配列で保存する。

```json
[
  {
    "id": "custom-1741689600000",
    "label": "マイサービス",
    "symbols": "!@#$%",
    "note": "ユーザーが追加したカスタムプリセット"
  }
]
```

- `id` は `"custom-" + Date.now()` で生成（ユーザー入力は使用しない）
- `label` はサービス名（必須）
- `symbols` は使用する記号文字列（空文字 = 記号なし）
- `note` は任意の注記（省略可）

---

## UI 設計

### サービス別セレクト（`#service-preset`）

`<optgroup>` でグループ分けする。

```
— サービスを選択 —（デフォルト）
━━ 主要サービス ━━
  Amazon / Google / GitHub / Apple / Microsoft / Twitter / LINE
━━ レンタルサーバー ━━
  エックスサーバー / さくらのレンタルサーバー / ロリポップ！ / ConoHa WING
━━ カスタム ━━
  （ユーザー登録分）
```

### サービス別セレクト下部

```
注記エリア（#service-preset-note）
  + カスタム選択時のみ「削除」ボタンを追加表示
  + 「＋ カスタムを追加」ボタン（常時表示）
```

### カスタム追加ダイアログ（`<dialog id="dialog-custom-preset">`）

| フィールド | 要素 | バリデーション |
|---|---|---|
| サービス名 | `<input type="text">` | 必須・最大 40 文字 |
| 使用する記号 | `<input type="text">` | 任意・空 = 記号なし・ASCII 表示可能範囲のみ許可 |
| 注記 | `<input type="text">` | 任意・最大 100 文字 |

ボタン構成: `キャンセル` / `追加する`

> 記号入力欄は `sanitizeCustomSymbols()` でサニタイズしてから保存・使用する（→ 後述）。

---

## ファイル変更範囲

| ファイル | 変更内容 |
|---|---|
| `js/presets.js` | `HOSTING_PRESETS` 配列追加・`CUSTOM_STORAGE_KEY` 定数追加 |
| `js/app.js` | カスタムプリセット CRUD・`<dialog>` 制御・セレクト再描画処理 |
| `index.html` | `<dialog>` 要素追加・「＋ カスタムを追加」ボタン追加 |
| `scss/_preset.scss` | `<optgroup>` スタイル追加・削除ボタンスタイル追加 |
| `scss/_dialog.scss` | 新規作成：モーダルダイアログスタイル |
| `scss/style.scss` | `@use "dialog"` 追記 |

---

## レンタルサーバープリセットの記号ポリシー（参考値）

各サービスの公式ポリシーは変更される場合があります。最新情報は公式サイトを参照してください。

| サービス | 使用可能記号 | 備考 |
|---|---|---|
| エックスサーバー | `!#$%&'()*+,-./:;<=>?@[\]^_`{|}~` | ASCIIの多くの記号が利用可能（参考値） |
| さくらのレンタルサーバー | なし（英数字のみを推奨） | FTPパスワードなどは記号不可のサービスあり（参考値） |
| ロリポップ！ | なし（英数字のみを推奨） | 同上（参考値） |
| ConoHa WING | `!#$%&'()*+,-./:;<=>?@[\]^_`{|}~` | 英大文字・小文字・数字・記号が各1文字以上必要（参考値） |

---

## セキュリティ要件

参照: [`..local-docs/feature-custom-symbol-input.md`](../..local-docs/feature-custom-symbol-input.md)

- localStorage に保存する値はユーザー入力のため、DOM への反映は必ず `textContent` を使用（`innerHTML` 禁止）
- `<option>` 要素も `option.textContent = label` で設定
- `id` はユーザー入力を使わず `"custom-" + Date.now()` で生成
- `<dialog>` は `showModal()` / `close()` で JS から開閉制御する
- `form-action 'none'` の CSP があるため `<form>` の `action` は設定しない（submit は JS で処理）
- localStorage に保存するデータ量は合理的な範囲（件数上限 50 件程度）に制限する

### 記号入力のサニタイズ（`sanitizeCustomSymbols()`）

制御文字・サロゲートペア混入を防ぐため、ASCII 表示可能範囲（`0x21`〜`0x7E`）のみ許可するサニタイズ関数を `app.js` に追加する。

```js
// app.js に追加
const sanitizeCustomSymbols = (raw) =>
	[...raw]
		.filter(ch => {
			const cp = ch.codePointAt(0);
			return cp >= 0x21 && cp <= 0x7E;
		})
		.join('');
```

- `buildCharPool()` は既に `symbols` を文字列として受け取る設計のため、サニタイズ済み文字列をそのまま渡せる
- `buildCharPool()` 内の `new Set()` で重複も自動排除されるため、サニタイズ関数での重複除去は不要
- 強度表示は既存の `calcStrength()` がプールサイズを参照するため、自動的に反映される

---

## 実装順序

1. `js/presets.js` — `HOSTING_PRESETS` 追加・`CUSTOM_STORAGE_KEY` 定数追加
2. `index.html` — `<dialog>` 要素・「追加」ボタン追加・セレクトを `<optgroup>` 対応に変更
3. `js/app.js` — カスタムプリセット CRUD 実装・セレクト再描画・ダイアログ制御
4. `scss/_dialog.scss` — モーダルスタイル作成
5. `scss/_preset.scss` — `<optgroup>` スタイル・削除ボタン追加
6. `scss/style.scss` — `@use "dialog"` 追記
7. SCSS コンパイル → `css/style.css` 更新

---

## 未決事項

- さくらのレンタルサーバー・ロリポップ！の記号ポリシーは「記号なし推奨」として登録するか、プリセット自体を除外するか → **記号なし（空文字）で登録・注記に説明を添える** 方針で進める
- カスタムプリセットの件数上限 → **50 件** とする（localStorage の容量を考慮）
- ダイアログのアニメーション → CSS `@starting-style` / `transition` で実装（モダンブラウザのみ対応）
