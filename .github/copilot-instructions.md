# Copilot Instructions — Password Generator

## プロジェクト概要

サーバーレス・スタンドアロンの **HTML / CSS / Vanilla JS** 製パスワード生成 Web アプリ。  
サービスごとに許可される記号が異なる問題を解決するため、サービス別プリセットと記号チェックボックスを組み合わせた UI を提供する。

---

## 技術スタック

| 項目 | 内容 |
|---|---|
| HTML | HTML5 セマンティックマークアップ |
| CSS | カスタムプロパティ（CSS Variables）、ライトテーマ（デフォルト）+ ダークテーマ切り替え |
| JavaScript | Vanilla JS（ES2020+）、モジュール構成 |
| 乱数生成 | `window.crypto.getRandomValues()` のみ（`Math.random()` 禁止） |
| クリップボード | `navigator.clipboard.writeText()`（非同期） |
| 外部依存 | **なし**（フレームワーク・ライブラリ不使用） |

---

## ホスティング

| 項目 | 内容 |
|---|---|
| プラットフォーム | **Cloudflare Pages** |
| デプロイ方式 | GitHub リポジトリ連携（`main` ブランチへの push で自動デプロイ） |
| ビルドコマンド | なし（スタティックサイトのためビルド不要） |
| 公開ディレクトリ | `/`（リポジトリルート） |
| カスタムドメイン | 未設定（必要に応じて追加） |

---

## ファイル構成

```
password-generator/
├── .github/
│   └── copilot-instructions.md
├── ..local-docs/   # 開発用ドキュメント（機能設計など）
├── .docs/
│   ├── plan-passwordGenerator.prompt.md
│   └── hosting-comparison.md   # GitHub Pages vs Cloudflare Pages 比較検討
├── index.html          # メイン HTML・全 UI 構造
├── css/
│   └── style.css       # ライト / ダークテーマ デザイン（SCSS コンパイル済み）
└── js/
    ├── presets.js      # プリセット定義データ（サービス別・汎用）
    ├── generator.js    # パスワード生成ロジック（Web Crypto API）
    └── app.js          # UI イベント制御・強度計算・コピー処理・テーマ切り替え
```

---

## コーディング規約

### JavaScript

- **ES2020+** 構文を使用（`const` / `let`、アロー関数、テンプレートリテラル、Optional Chaining など）
- `var` は使用禁止
- ファイルは ES Modules（`type="module"`）として記述する
- 関数は単一責務の原則に従い、小さく保つ
- マジックナンバーは名前付き定数で定義する
- `Math.random()` の使用は**絶対禁止**。乱数生成は必ず `window.crypto.getRandomValues()` を使用する

### HTML

- セマンティックタグを使用（`<section>`、`<label>`、`<output>` など）
- すべてのフォームコントロールには `<label>` を明示的に関連付ける（`for` 属性または `aria-label`）
- アクセシビリティのため `aria-*` 属性を適切に設定する

### CSS

- CSS カスタムプロパティ（`--variable-name`）でテーマカラーを管理する
- クラス名は kebab-case（例: `.password-card`、`.strength-bar`）
- セレクターの詳細度を低く保ち、ID セレクターは使用しない
- **デフォルトはライトテーマ**（背景: `#ffffff` 系、アクセント: 紫〜青グラデーション）
- ダークテーマは `[data-theme="dark"]` セレクタで上書き（背景: `#0f0f1a` 系）
- テーマ変数は `scss/_variables.scss` の `:root`（ライト）と `[data-theme="dark"]`（ダーク）で一元管理

---

## 機能仕様

### セキュリティ要件（必須）

- 乱数生成には必ず `window.crypto.getRandomValues()` を使用する
- クライアントサイドのみで完結し、外部サーバーへのデータ送信は行わない
- 文字プールが空の状態での生成はエラー表示し、処理を中断する

### パスワード生成ロジック（generator.js）

1. 有効な文字種（大文字・小文字・数字・記号）から文字プールを構築
2. 除外文字をプールから削除
3. `window.crypto.getRandomValues()` で暗号学的に安全な乱数を生成
4. 指定長のパスワードを生成して返す

### 強度計算ロジック

- エントロピー = `log2(文字プールサイズ) × パスワード長`
- 4段階表示: 弱（< 40bit）/ 普通（< 60bit）/ 強（< 80bit）/ 非常に強い（≥ 80bit）

### プリセット（presets.js）

- 汎用プリセットとサービス別プリセットをオブジェクト配列で定義する
- サービス別の記号ポリシーは変更される可能性があるため「参考値」として注釈を表示する

---

## 禁止事項

- `Math.random()` の使用
- 外部ライブラリ・フレームワークの導入
- サーバーへのデータ通信
- `innerHTML` への未サニタイズ文字列の直接代入（XSS 対策のため `textContent` を使用）
- グローバル変数へのデータ保存（パスワード文字列は変数に長期保持しない）
