# 機能対応計画：パスワード強度の評価を5段階に変更する

> 作成日: 2026-03-12  
> 対象 Issue: [#9 パスワード強度の評価を5段階に変更する](https://github.com/rocket-martue/password-generator/issues/9)  
> 作業ブランチ: `feature/issue-9-strength-5levels`  
> ステータス: 実装済み（2026-03-12 マージ）

---

## 概要

現在4段階で評価しているパスワード強度を、以下の5段階に変更する。

| level | ラベル | 意味 |
|---|---|---|
| 0 | 非常に脆弱 | 極めて予測されやすいパスワード |
| 1 | 脆弱 | 十分なエントロピーがなく危険 |
| 2 | 普通 | 最低限の強度はあるが推奨されない |
| 3 | 強力 | 十分なセキュリティ強度がある |
| 4 | 非常に強力 | 高エントロピーで強固なパスワード |

---

## 現状の実装

### `js/generator.js` — `calcStrength()`

```js
// 現行: 4段階 (level 0〜3)
if (entropy < 40) return { label: '弱', level: 0 };
if (entropy < 60) return { label: '普通', level: 1 };
if (entropy < 80) return { label: '強', level: 2 };
return { label: '非常に強い', level: 3 };
```

戻り値の型: `{ label: string, level: 0|1|2|3 }`

### `js/app.js` — `STRENGTH_CLASSES`

```js
// 現行: 4クラス
const STRENGTH_CLASSES = [
  'strength-weak',
  'strength-fair',
  'strength-strong',
  'strength-very-strong'
];
```

### `scss/_strength.scss` — data-level ごとの表示

```scss
// 現行: 4段階 (data-level 0〜3)
&[data-level="0"]::after { width: 25%; background: var(--danger); }
&[data-level="1"]::after { width: 50%; background: var(--warning); }
&[data-level="2"]::after { width: 75%; background: var(--success); }
&[data-level="3"]::after { width: 100%; background: linear-gradient(...); }
```

---

## 変更対象ファイルと実装内容

### 1. `js/generator.js` — エントロピー閾値と戻り値の変更

#### 新しいエントロピー区分

| level | ラベル | エントロピー閾値 | 根拠 |
|---|---|---|---|
| 0 | 非常に脆弱 | < 30 bit | 辞書攻撃・ブルートフォースで即突破 |
| 1 | 脆弱 | < 55 bit | 現行の「弱」基準を継承 |
| 2 | 普通 | < 70 bit | 現行の「普通」基準を継承 |
| 3 | 強力 | < 96 bit | 英数字フル（62文字）×16文字が届かない水準 |
| 4 | 非常に強力 | ≥ 96 bit | 記号を含む3種類以上の文字種が必要 |

> **追加制約**: 文字種が3カテゴリ未満（英字のみ等）の場合は level 4 に到達しない。

#### 変更後コード

```js
/**
 * @returns {{ label: string, level: 0|1|2|3|4 }}
 *   level: 0=非常に脆弱, 1=脆弱, 2=普通, 3=強力, 4=非常に強力
 */
export const calcStrength = (pool, length) => {
  if (pool.length === 0 || length === 0) {
    return { label: '—', level: 0 };
  }

  const entropy = Math.log2(pool.length) * length;

  // 文字カテゴリ数（大文字/小文字/数字/記号）を判定
  const categoryCount = [
    /[A-Z]/.test(pool), /[a-z]/.test(pool),
    /[0-9]/.test(pool), /[^A-Za-z0-9]/.test(pool),
  ].filter(Boolean).length;

  // 3カテゴリ未満は level 4 に到達しない
  const maxLevel = categoryCount >= 3 ? 4 : 3;

  let rawLevel;
  if (entropy < 30) rawLevel = 0;
  else if (entropy < 55) rawLevel = 1;
  else if (entropy < 70) rawLevel = 2;
  else if (entropy < 96) rawLevel = 3;
  else rawLevel = 4;

  const level = Math.min(rawLevel, maxLevel);
  const LABELS = ['非常に脆弱', '脆弱', '普通', '強力', '非常に強力'];
  return { label: LABELS[level], level };
};
```

---

### 2. `js/app.js` — `STRENGTH_CLASSES` を5要素に拡張

#### 変更後コード

```js
const STRENGTH_CLASSES = [
  'strength-very-weak',   // level 0: 非常に脆弱
  'strength-weak',        // level 1: 脆弱
  'strength-fair',        // level 2: 普通
  'strength-strong',      // level 3: 強力
  'strength-very-strong', // level 4: 非常に強力
];
```

`indicator.setAttribute('aria-valuemax', 4)` も合わせて更新する（現在は 3 で固定されているかHTML側で確認要）。

---

### 3. `scss/_strength.scss` — バー幅とカラーを5段階に拡張

#### 変更後コード

```scss
// 5段階 (data-level 0〜4)
&[data-level="0"]::after {
  width: 20%;
  background: var(--danger);         // 非常に脆弱: 赤
}
&[data-level="1"]::after {
  width: 40%;
  background: var(--warning);        // 脆弱: オレンジ
}
&[data-level="2"]::after {
  width: 60%;
  background: var(--caution);        // 普通: 黄
}
&[data-level="3"]::after {
  width: 80%;
  background: var(--success);        // 強力: 緑
}
&[data-level="4"]::after {
  width: 100%;
  background: linear-gradient(90deg, var(--accent-from), var(--accent-to));
                                     // 非常に強力: グラデーション
}
```

> **注意**: `--caution` 変数が `scss/_variables.scss` に存在するか確認が必要。  
> 存在しない場合は `#eab308`（黄色系）を追加定義する。

---

### 4. `scss/_variables.scss` — `--caution` カラー変数の確認・追加（必要な場合）

```scss
// ライトテーマ
:root {
  --caution: #ca8a04;  /* 黄: level 2 (普通) に使用 */
}

// ダークテーマ
[data-theme="dark"] {
  --caution: #fbbf24;
}
```

---

### 5. `index.html` — aria 属性の確認・更新

`aria-valuemax` が `3` にハードコードされていた場合、`4` に更新する。

```html
<!-- 変更前 -->
<div id="strength-indicator" ... aria-valuemax="3">

<!-- 変更後 -->
<div id="strength-indicator" ... aria-valuemax="4">
```

---

## 影響範囲の整理

| ファイル | 変更の性質 | 影響度 |
|---|---|---|
| `js/generator.js` | `calcStrength()` の閾値・ラベル・戻り値の型変更 | 中（ロジック変更） |
| `js/app.js` | `STRENGTH_CLASSES` の要素数変更 | 小（定数のみ） |
| `scss/_strength.scss` | `data-level` ごとのスタイル変更 | 小（ビジュアル） |
| `scss/_variables.scss` | `--caution` 変数の追加（必要な場合） | 小 |
| `index.html` | `aria-valuemax` の値変更（確認後） | 極小 |
| `css/style.css` | SCSS コンパイル後の成果物 | コンパイルで自動反映 |

---

## 実装チェックリスト

- [x] `js/generator.js` — `calcStrength()` を5段階に更新
- [x] `js/generator.js` — JSDoc コメントの型定義を `0|1|2|3|4` に更新
- [x] `js/app.js` — `STRENGTH_CLASSES` を5要素に更新
- [x] `scss/_variables.scss` — `--caution` 変数の有無を確認・追加
- [x] `scss/_strength.scss` — `data-level` を5段階に更新
- [x] `index.html` — `aria-valuemax` の値を確認・更新
- [x] `css/style.css` — SCSS をコンパイルして反映
- [x] ブラウザで動作確認（各エントロピー帯でラベル・バーが正しく表示される）
- [x] PR 作成して Issue #9 にリンク

---

## 動作確認の観点

| 確認項目 | 確認方法 |
|---|---|
| level 0（非常に脆弱）が表示される | 長さ6・数字のみ → エントロピー ≈ 20 bit |
| level 1（脆弱）が表示される | 長さ8・小文字のみ → エントロピー ≈ 38 bit |
| level 2（普通）が表示される | 長さ12・小文字のみ → エントロピー ≈ 56 bit |
| level 3（強力）が表示される | 長さ16・大小英字のみ → エントロピー ≈ 91 bit（カテゴリ2種でキャップ） |
| level 4（非常に強力）が表示される | 長さ16・全文字種 → エントロピー ≈ 104 bit |
| バー幅が 20/40/60/80/100% になる | 目視確認 |
| ダークテーマでも視認性がある | テーマ切り替えで確認 |
| 空の文字プールで '—' が表示される | 全文字種を OFF |
