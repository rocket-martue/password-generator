# Fix: CSP の img-src 設定不備により OG image が表示されない

## 関連コミット

- `dcc4741` fix: CSP の img-src に 'self' を追加して OG image を配信可能にする

---

## 問題の概要

X（Twitter）でサイト URL を共有した際に、OG image（`/images/password-generator-ogp.png`）が表示されない。

---

## 原因

Content-Security-Policy（CSP）の `img-src` ディレクティブが `data:` のみを許可しており、`'self'`（自サイトオリジン）が含まれていなかった。

```
# 修正前
img-src data:;
```

この設定により、X のクローラーが `https://password-generator-15a.pages.dev/images/password-generator-ogp.png` を取得しようとしても、CSP ポリシー違反となり画像を読み込めなかった。

### 影響箇所

CSP は 2 か所で定義されている。両方に同一の問題があった。

| ファイル | 役割 |
|---|---|
| `index.html` の `<meta http-equiv="Content-Security-Policy">` | HTML 内 CSP（ブラウザ直参照） |
| `_headers` の `Content-Security-Policy` | Cloudflare Pages HTTP レスポンスヘッダー |

> **注意**: `_headers` は Cloudflare Pages がレスポンスヘッダーとして付与するファイル。`index.html` 内の `<meta>` タグと `_headers` の両方で CSP を定義しているため、**変更時は必ず両方を同期させる**こと。

---

## 修正内容

`img-src` に `'self'` を追加した。

```diff
- img-src data:;
+ img-src 'self' data:;
```

### 修正ファイル

- `index.html`（L24-25）
- `_headers`（L3）

---

## CSP 設定の全体像（修正後）

```
default-src 'self';
script-src  'self';
style-src   'self';
img-src     'self' data:;
object-src  'none';
base-uri    'self';
form-action 'none';
frame-ancestors 'none';
```

| ディレクティブ | 許可値 | 理由 |
|---|---|---|
| `default-src` | `'self'` | 原則自オリジンのみ |
| `script-src` | `'self'` | 外部スクリプト不使用 |
| `style-src` | `'self'` | 外部スタイルシート不使用 |
| `img-src` | `'self' data:` | OG image 等の自サイト画像 + data URI（アイコン等） |
| `object-src` | `'none'` | Flash/Java プラグイン拒否 |
| `base-uri` | `'self'` | base タグの悪用防止 |
| `form-action` | `'none'` | フォーム送信先なし（完全クライアントサイド） |
| `frame-ancestors` | `'none'` | iframe 埋め込み拒否（クリックジャッキング対策） |

---

## 教訓

1. **CSP の `img-src` に `'self'` がないと、自サイトの画像すら読み込めない**。`default-src 'self'` がフォールバックになるが、`img-src` を明示した時点で `default-src` は適用されなくなる。
2. **OG image が表示されない場合、CSP を疑う**。SNS クローラーも CSP の影響を受ける。
3. **CSP の定義箇所が複数ある場合は必ず同期する**。このプロジェクトでは `index.html`（meta タグ）と `_headers`（Cloudflare Pages）の 2 か所。
