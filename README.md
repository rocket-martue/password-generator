# Password Generator

サービスごとに異なる記号ポリシーに対応した、ブラウザで動作するパスワード生成 Web アプリ。

## 特徴

- **サービス別プリセット** — Amazon・Google・GitHub など主要サービスの記号ポリシーを参考値として収録
- **記号の個別制御** — チェックボックスで使用する記号を 1 文字単位で調整可能
- **暗号学的に安全な乱数** — `window.crypto.getRandomValues()` を使用（`Math.random()` 不使用）
- **完全クライアントサイド** — サーバー通信なし。入力したデータは外部に送信されない
- **強度インジケーター** — エントロピーベースで 4 段階評価
- **ライト / ダークテーマ切り替え** — デフォルトはライトテーマ。ボタンでトグル、設定は `localStorage` に保存

## 機能

### 文字種設定
- 大文字 (A-Z) / 小文字 (a-z) / 数字 (0-9) / 記号 のオン・オフ

### 記号プリセット
| プリセット | 内容 |
|---|---|
| 全記号 | `!"#$%&'()*+,-./:;<=>?@[\]^_{|}~` |
| 標準セット | `!@#$%^&*()-_=+` |
| シンプル | `!@#$%` |
| 記号なし | 英字・数字のみ |
| サービス別 | Amazon / Google / GitHub / Apple / Microsoft / Twitter(X) / LINE |

> サービス別プリセットはポリシー変更の可能性があるため「参考値」として提供しています。

### その他の設定
- **パスワード長** — スライダーと数値入力で 8〜64 文字
- **除外文字** — 自由入力 or「紛らわしい文字を除く（`0 O l 1 I | !`）」ワンクリック
- **生成件数** — 1〜5 件を同時生成

### 結果表示
- カード形式で表示、各カードにコピーボタン
- コピー後「コピー済！」フィードバック

## ファイル構成

```
password-generator/
├── index.html          # メイン HTML・全 UI 構造
├── css/
│   └── style.css       # ライト / ダークテーマ デザイン（SCSS コンパイル済み）
├── scss/
│   ├── style.scss      # エントリポイント
│   ├── _variables.scss # CSS カスタムプロパティ（ライト :root + ダーク [data-theme=dark]）
│   └── ...             # パーシャル各種
└── js/
    ├── presets.js      # プリセット定義データ（サービス別・汎用）
    ├── generator.js    # パスワード生成ロジック（Web Crypto API）
    └── app.js          # UI イベント制御・強度計算・コピー処理・テーマ切り替え
```

## 技術スタック

- HTML5 / CSS3（CSS Variables）/ Vanilla JS（ES2020+、ES Modules）
- スタイル管理: SCSS（`scss/` → `css/style.css` へコンパイル）
- 外部ライブラリ・フレームワーク: **なし**
- 乱数生成: `window.crypto.getRandomValues()`
- クリップボード: `navigator.clipboard.writeText()`
- テーマ保存: `localStorage`

## ホスティング

[Cloudflare Pages](https://pages.cloudflare.com/) で公開。`main` ブランチへの push で自動デプロイ。

## セキュリティ

- 乱数生成に `Math.random()` は使用しない
- クライアントサイドのみで完結し、パスワードを外部へ送信しない
- DOM 操作は `textContent` を使用し、`innerHTML` への直接代入は行わない（XSS 対策）

## ブラウザ対応

Web Crypto API および ES Modules に対応したモダンブラウザ（Chrome / Edge / Firefox / Safari 最新版）

## ライセンス

MIT
