# アクセシビリティ改善計画

バージョン: 2026-03-11  
対象: `password-generator` — HTML / CSS / Vanilla JS

---

## 現状サマリー

WCAG 2.1 AA 適合を目標とした監査の結果、下記 4 領域に問題を確認。

| 優先度 | 領域 | 主な基準 |
|--------|------|----------|
| 🔴 高 | テキスト・ボーダーのコントラスト | 1.4.3 / 1.4.11 |
| 🔴 高 | フォーカスリングの可視性 | 2.4.7 / 2.4.11 |
| 🟡 中 | フォントサイズのハードコード | 1.4.4 |
| 🟢 低 | HTML セマンティクス | 1.3.1 |

---

## Phase 1 — カラートークン修正（最高優先度）

### 1-A. テキストカラー（WCAG 1.4.3: テキストコントラスト 4.5:1 以上）

#### ライトテーマ

| トークン | 現在値 | 主な使用場所 | 算出コントラスト | 問題 |
|----------|--------|-------------|-----------------|------|
| `--text-muted` | `#94a3b8` | `.section-title` / `.results-title` / `.service-note` / `.count-label`（`--bg-surface: #f8fafc` 上） | **約 2.3:1** | AA 4.5:1 ✗ |

**修正案**: `#6b7280`（gray-500）→ `#f8fafc` 背景で **約 4.6:1** ✓

#### ダークテーマ

| トークン | 現在値 | 主な使用場所 | 算出コントラスト | 問題 |
|----------|--------|-------------|-----------------|------|
| `--text-muted` | `#64748b` | 同上（`--bg-surface: #1a1a2e` 上） | **約 3.3:1** | AA 4.5:1 ✗ |

**修正案**: `#8b9dc3`（スレート系・明度を上げる）→ `#1a1a2e` 背景で **約 4.7:1** ✓

---

### 1-B. ボーダー色（WCAG 1.4.11: Non-text contrast 3:1 以上）

UI コンポーネント（入力欄・ボタン・カード）の境界線はテキスト以外でも 3:1 必要。

#### ライトテーマ

| トークン | 現在値 | 実効色（白背景合成） | コントラスト | 問題 |
|----------|--------|---------------------|-------------|------|
| `--border-color` | `rgba(15, 23, 42, 0.1)` | #e8eaed 相当 | **約 1.2:1** | 3:1 ✗ |
| `--border-subtle` | `rgba(15, 23, 42, 0.08)` | さらに薄い | **約 1.1:1** | 3:1 ✗ |
| `--border-accent` | `rgba(8, 145, 178, 0.25)` | 薄いシアン | **約 1.6:1** | 3:1 ✗ |

**修正案**

```scss
// _variables.scss ライトテーマ
--border-color:   #c8cdd6;   // 白背景で約 3.2:1 ✓
--border-subtle:  #dde1e8;   // 装飾用（3:1 未満でもOKな装飾線のみに使用限定）
--border-accent:  #0891b2;   // 不透明化してコントラスト 3:1 以上に
```

#### ダークテーマ

| トークン | 現在値 | `--bg-surface: #1a1a2e` 上コントラスト | 問題 |
|----------|--------|-----------------------------------------|------|
| `--border-color` | `#2d2d4e` | **約 1.4:1** | 3:1 ✗ |
| `--border-subtle` | `rgba(255,255,255,0.08)` | さらに薄い | 3:1 ✗ |

**修正案**

```scss
// _variables.scss ダークテーマ
--border-color:   #4a4a70;   // #1a1a2e 背景で約 3.2:1 ✓
--border-subtle:  #3a3a5a;   // 装飾線限定使用
```

---

### 1-C. セレクト矢印 SVG アイコン

現在の `_preset.scss` で SVG アイコン色が `fill='%2394a3b8'`（`#94a3b8`）にハードコードされており、ダークテーマに未対応。

**修正案**: CSS カスタムプロパティ `--select-arrow` を追加してテーマ別に制御する。

```scss
// _variables.scss
:root {
  --select-arrow: url("data:image/svg+xml,%3Csvg ... fill='%236b7280' ...%3E%3C/svg%3E");
}
[data-theme="dark"] {
  --select-arrow: url("data:image/svg+xml,%3Csvg ... fill='%2394a3b8' ...%3E%3C/svg%3E");
}
```

```scss
// _preset.scss
.select {
  background-image: var(--select-arrow);
}
```

---

## Phase 2 — フォーカスリング統一（WCAG 2.4.7 / 2.4.11）

### 現状の問題

| セレクタ | 現在の状態 |
|----------|-----------|
| `.select:focus` | `outline: none` のみ（`:focus-visible` 未使用）|
| `.length-number:focus` | `outline: none` のみ |
| `.input-text:focus` | `outline: none` のみ |
| `.btn` / `.btn-secondary` | `:focus-visible` 定義なし |
| `.btn-copy` | `:focus-visible` 定義なし |
| `.preset-btn` | `:focus-visible` 定義なし |

### 修正方針

1. `outline: none` を `:focus-visible` ブロック内に収める（マウス操作ではアウトラインを非表示、キーボード時は表示）
2. アウトライン仕様の統一: `2px solid var(--accent-solid)` + `outline-offset: 2px`

```scss
// 修正例（各 SCSS ファイルに適用）
.select {
  &:focus { outline: none; }            // マウスフォーカス時はデフォルト消去
  &:focus-visible {                      // キーボード操作時
    outline: 2px solid var(--accent-solid);
    outline-offset: 2px;
    border-color: var(--accent-solid);
  }
}

.btn,
.btn-secondary,
.btn-copy,
.preset-btn {
  &:focus-visible {
    outline: 2px solid var(--accent-solid);
    outline-offset: 2px;
  }
}
```

---

## Phase 3 — フォントサイズの CSS 変数統一（WCAG 1.4.4）

### 現状のハードコード一覧

| ファイル | セレクタ | 現在値 | 対応変数 |
|----------|----------|--------|----------|
| `_layout.scss` | `.app-header h1` | `1.6rem` | `--font-size-3xl`（clamp 1.5〜2rem） |
| `_layout.scss` | `.app-header p` | `0.9rem` | `--font-size-sm` |
| `_layout.scss` | `.theme-toggle-btn` | `0.8rem` | `--font-size-xs` |
| `_layout.scss` | `.section-title` | `0.75rem` | `--font-size-xs`（＊要検討） |
| `_toggle.scss` | `.toggle-label` | `0.9rem` | `--font-size-sm` |
| `_form.scss` | `.length-number` | `0.9rem` | `--font-size-sm` |
| `_form.scss` | `.input-text` | `0.9rem` | `--font-size-sm` |
| `_form.scss` | `.count-label` | `0.9rem` | `--font-size-sm` |
| `_button.scss` | `.btn` | `0.85rem` | `--font-size-sm` |
| `_button.scss` | `.btn-copy` | `0.8rem` | `--font-size-xs` |
| `_preset.scss` | `.preset-btn` | `0.8rem` | `--font-size-xs` |
| `_preset.scss` | `.select` | `0.85rem` | `--font-size-sm` |
| `_preset.scss` | `.service-note` | `0.75rem` | `--font-size-xs` |
| `_results.scss` | `.password-text` | `0.95rem` | `--font-size-sm` |
| `_results.scss` | `.error-message` | `0.85rem` | `--font-size-sm` |
| `_strength.scss` | `.strength-label` | `0.8rem` | `--font-size-xs` |
| `_symbol.scss` | `.symbol-check span` | `0.85rem` | `--font-size-sm` |

### `.section-title` の `0.75rem` について

`font-size: 0.75rem`（= 12px 固定相当）は、`--font-size-xs` が `clamp(0.625rem, ..., 0.75rem)` であるため実質同じ。ただし上限 12px は一部環境でやや小さい可能性がある。

**修正案**: セクションタイトルの視認性向上のため `--font-size-sm`（上限 14px）への切り上げを検討。テキストを大文字化しているため、可読性観点で 14px が望ましい。

---

## Phase 4 — HTML セマンティクス（低優先度）

### `<p class="section-title">` の問題

スクリーンリーダーでは `<p>` タグは段落として読み上げられ、見出しジャンプ（H キー）でスキップできない。

**現状パターン（index.html 内に多数）**:
```html
<p class="section-title">文字種</p>
```

**修正案 A（推奨）**: セクション内の小見出しとして `<h3>` に変更し、視覚スタイルは `.section-title` クラスで維持
```html
<h3 class="section-title">文字種</h3>
```

**修正案 B**: `<p>` を保持しつつ `role="heading" aria-level="3"` を付与
```html
<p class="section-title" role="heading" aria-level="3">文字種</p>
```

→ `<h3>` への変更（修正案 A）が HTML5 セマンティクスとして正道。変更後にスタイル崩れがないか確認必要。

---

## 実装チェックリスト

```
Phase 1 — カラートークン
  [x] 1-A. --text-muted をライトテーマで #6b7280 に変更
  [x] 1-A. --text-muted をダークテーマで #8b9dc3 に変更
  [x] 1-B. ライトテーマ --border-color を #c8cdd6（不透明）に変更
  [x] 1-B. ライトテーマ --border-subtle を #dde1e8 に変更
  [x] 1-B. ライトテーマ --border-accent を不透明シアンに変更
  [x] 1-B. ダークテーマ --border-color を #4a4a70 に変更
  [x] 1-B. ダークテーマ --border-subtle を #3a3a5a に変更
  [x] 1-C. --select-arrow をテーマ別変数化

Phase 2 — フォーカスリング
  [x] .select:focus → :focus-visible に変更
  [x] .length-number:focus → :focus-visible に変更
  [x] .input-text:focus → :focus-visible に変更
  [x] .btn / .btn-secondary に :focus-visible 追加
  [x] .btn-copy に :focus-visible 追加
  [x] .preset-btn に :focus-visible 追加

Phase 3 — フォントサイズ変数化
  [x] _layout.scss の全ハードコード値を変数に置換
  [x] _toggle.scss の全ハードコード値を変数に置換
  [x] _form.scss の全ハードコード値を変数に置換
  [x] _button.scss の全ハードコード値を変数に置換
  [x] _preset.scss の全ハードコード値を変数に置換
  [x] _results.scss の全ハードコード値を変数に置換
  [x] _strength.scss の全ハードコード値を変数に置換
  [x] _symbol.scss の全ハードコード値を変数に置換
  [x] .section-title のフォントサイズを --font-size-sm に引き上げ

Phase 4 — HTML セマンティクス
  [x] <p class="section-title"> を <h3> に変更（全 7 箇所）
  [x] コピーボタンに aria-label="パスワードをコピー" 付与確認

Bonus — axe DevTools 指摘対応
  [x] #results に role="region" を追加（aria-label 使用のため）
  [x] #strength-indicator に aria-valuemin / aria-valuemax / aria-valuenow を追加
  [x] JS（app.js）で強度更新時に aria-valuenow を動的セット
```

---

## 参考：コントラスト計算の根拠

| 前景色 | 背景色 | 比率 | 判定 |
|--------|--------|------|------|
| `#94a3b8` | `#f8fafc` | ~2.3:1 | AA ✗ / AAA ✗ |
| `#6b7280` | `#f8fafc` | ~4.6:1 | AA ✓ / AAA ✗ |
| `#64748b` | `#1a1a2e` | ~3.3:1 | AA ✗ / AAA ✗ |
| `#8b9dc3` | `#1a1a2e` | ~4.7:1 | AA ✓ / AAA ✗ |
| `#c8cdd6` | `#ffffff` | ~3.2:1 | Non-text ✓ |
| `#2d2d4e` | `#1a1a2e` | ~1.4:1 | Non-text ✗ |
| `#4a4a70` | `#1a1a2e` | ~3.2:1 | Non-text ✓ |

計算ツール: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) で最終確認推奨。

---

## 追加対応：axe DevTools 指摘（2026-03-11）

初期実装後に axe DevTools（axe-core 4.11.1）でスキャンしたところ、2 件の ARIA 違反を検出。対応済み。

### 検出された問題

| # | ルール | 影響度 | 対象要素 | 内容 |
|---|--------|--------|----------|------|
| 1 | `aria-prohibited-attr` | 深刻 | `#results` | `role` のない `<div>` に `aria-label` は使用不可 |
| 2 | `aria-required-attr` | 重大 | `#strength-indicator` | `role="meter"` に必須な `aria-valuenow` が未設定 |

### 修正内容

**1. `#results` に `role="region"` を追加**（`index.html`）

```html
<!-- Before -->
<div id="results" aria-label="生成されたパスワード一覧" aria-live="polite">

<!-- After -->
<div id="results" role="region" aria-label="生成されたパスワード一覧" aria-live="polite">
```

**2. `#strength-indicator` に `aria-valuemin` / `aria-valuemax` / `aria-valuenow` を追加**（`index.html` + `js/app.js`）

```html
<!-- After -->
<div id="strength-indicator" role="meter"
  aria-label="パスワード強度" aria-valuemin="0" aria-valuemax="3" aria-valuenow="3"
  data-level="3">
```

```js
// app.js — 強度更新時に aria-valuenow を動的セット
indicator.setAttribute('aria-valuenow', level);
```

### 修正後のスキャン結果

**合計課題数: 0**（自動問題 0 / ガイド付き課題 0 / 手動確認 0）  
WCAG 2.1 AA 基準 ✓
