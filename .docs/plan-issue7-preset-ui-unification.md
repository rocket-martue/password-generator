# 実装計画：プリセット UI 統合（issue #7）

## 概要

サービス別・レンタルサーバー別プリセットの `<select>` UI を廃止し、汎用プリセットと同じボタン形式に統合する。

- グループ見出し（h4 / section-title）は表示しない
- 汎用・サービス別・レンタルサーバー別・カスタムをすべて1つの `.preset-group` に並べる
- プリセットボタンをクリックしたとき、note があれば既存の noteエリア（`#service-preset-note`）に表示（B案）

---

## 変更対象ファイル

| ファイル | 変更内容 |
|---|---|
| `index.html` | `<select id="service-preset">` 周辺の HTML を削除 / noteエリアを残す |
| `js/app.js` | `renderServicePresets()` → ボタン描画に変更。`applyServicePreset()` → `applyPresetWithNote()` に統合 |
| `scss/_preset.scss` | `<select>` 専用スタイル削除。カスタム削除ボタンの配置調整 |
| `css/style.css` | SCSSコンパイル後の更新 |

---

## HTML 変更仕様

### 削除する要素

```html
<!-- 以下をすべて削除 -->
<label for="service-preset" class="section-title service-preset-label">サービス別</label>
<select id="service-preset" class="select" aria-label="サービス別プリセットを選択"></select>
```

### 変更後の構造

```html
<!-- 記号プリセット -->
<h3 class="section-title">記号プリセット</h3>
<div class="form-group">
  <!-- 汎用プリセット（既存）+ サービス別・レンタルサーバー別・カスタムを同一グループで表示 -->
  <div id="generic-preset" class="preset-group" role="group" aria-label="記号プリセット"></div>

  <!-- note・削除ボタン・カスタム追加ボタンは現状維持 -->
  <div class="service-note-row">
    <p id="service-preset-note" class="service-note" aria-live="polite"></p>
    <button type="button" id="btn-delete-custom" class="btn btn-danger btn-delete-custom"
      aria-label="選択中のカスタムプリセットを削除" hidden>削除</button>
  </div>
  <button type="button" id="btn-add-custom" class="btn btn-secondary btn-add-custom"
    aria-label="カスタムプリセットを追加">＋ カスタムを追加</button>
</div>
```

`aria-label` を「汎用プリセット」→「記号プリセット」に変更して統合を反映する。

---

## JS 変更仕様

### 削除する処理

- `const elServicePreset = document.getElementById('service-preset');`
- `const renderServicePresets = () => { ... };`（select の `<option>` 生成）
- `elServicePreset.addEventListener('change', ...)` イベント
- `applyGenericPreset()` 内の `elServicePreset.value = '';` リセット処理
- `applyServicePreset()` の冒頭 `elServicePreset.value` 参照

### 追加・変更する処理

#### `renderServiceButtons()` — 新関数（`renderServicePresets` の置き換え）

```js
const renderServiceButtons = () => {
  // サービス別・レンタルサーバー別・カスタムのボタンを
  // 既存の #generic-preset グループに追記する
  // （汎用プリセットボタンは initGenericPresets() で生成済み）

  // 1. 既存のサービス/カスタムボタンのみ削除（data-preset-group 属性で識別）
  elGenericPreset
    .querySelectorAll('[data-preset-group="service"], [data-preset-group="custom"]')
    .forEach(el => el.remove());

  // 2. SERVICE_PRESETS + HOSTING_PRESETS のボタンを追加
  [...SERVICE_PRESETS, ...HOSTING_PRESETS].forEach(preset => {
    const btn = createServicePresetBtn(preset, 'service');
    elGenericPreset.appendChild(btn);
  });

  // 3. カスタムプリセットのボタンを追加
  loadCustomPresets().forEach(preset => {
    const btn = createServicePresetBtn(preset, 'custom');
    elGenericPreset.appendChild(btn);
  });
};

const createServicePresetBtn = (preset, group) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'preset-btn';
  btn.dataset.presetId = preset.id;
  btn.dataset.presetGroup = group;
  btn.textContent = preset.label;
  btn.addEventListener('click', () => applyServicePreset(preset));
  return btn;
};
```

#### `applyServicePreset()` — preset オブジェクトを受け取る形に変更

```js
// 変更前: applyServicePreset(presetId: string)
// 変更後: applyServicePreset(preset: object)
const applyServicePreset = (preset) => {
  // カスタムのみ削除ボタンを表示
  elDeleteCustomBtn.hidden = !preset.id.startsWith('custom-');

  const symbolSet = new Set(preset.symbols.replace(/\s/g, ''));
  getSymbolCheckboxes().forEach(cb => {
    cb.checked = symbolSet.has(cb.value);
  });

  if (preset.symbols === '') {
    elSymbolToggle.checked = false;
    elSymbolGrid.classList.add('disabled');
  } else {
    elSymbolToggle.checked = true;
    elSymbolGrid.classList.remove('disabled');
  }

  elUpper.checked = true;
  elLower.checked = true;
  elDigits.checked = true;

  // note 表示（B案: 全プリセット共通で表示）
  elServiceNote.textContent = preset.note ?? '';

  // 汎用プリセットのアクティブ状態を外し、選択ボタンをアクティブに
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-preset-id="${preset.id}"]`)?.classList.add('active');

  updateStrengthDisplay();
};
```

#### `applyGenericPreset()` の変更点

```js
// サービスプリセットのリセット処理を削除（select が無くなるため）
// elServicePreset.value = '';  ← 削除
// elServiceNote.textContent = '';  ← 削除（汎用選択時はnoteをクリア）
```

→ 汎用プリセット選択時は note をクリアする（`elServiceNote.textContent = '';`）と `elDeleteCustomBtn.hidden = true;` を残す

#### カスタムプリセット CRUD の変更点

- `handleDialogAdd()` の末尾： `renderServicePresets()` → `renderServiceButtons()`
  - `elServicePreset.value = newPreset.id;` → 削除
  - `applyServicePreset(newPreset.id)` → `applyServicePreset(newPreset)` に変更
- `elDeleteCustomBtn` クリック時：
  - `elServicePreset.value = '';` → 削除
  - `applyServicePreset('')` → `elServiceNote.textContent = ''; elDeleteCustomBtn.hidden = true;` に変更
  - `renderServicePresets()` → `renderServiceButtons()`

#### `initGenericPresets()` の変更点

- `applyGenericPreset()` 内で、サービスボタンのアクティブを外す処理は `document.querySelectorAll('.preset-btn')` で全ボタン対象になるため追加対応不要

---

## SCSS 変更仕様

### 削除するスタイル

```scss
// _preset.scss から削除
.service-preset-label { ... }
.select optgroup { ... }
.btn-primary { ... }  // ← ダイアログ追加ボタン専用なのでそちらへ移動確認
```

`<select>` 要素自体は `count-select`（生成件数）で引き続き使用されるため、`.select` クラス本体は残す。記号プリセット用の `select` 固有スタイルのみ削除。

---

## 起動処理の変更

```js
// 変更前
initTheme();
initGenericPresets();
renderServicePresets();  // ← 変更
initSymbolGrid();
updateStrengthDisplay();

// 変更後
initTheme();
initGenericPresets();
renderServiceButtons();  // ← renderServicePresets から変更
initSymbolGrid();
updateStrengthDisplay();
```

---

## 未変更の要素

- `elServiceNote` (`#service-preset-note`) — そのまま使用
- `elDeleteCustomBtn` (`#btn-delete-custom`) — そのまま使用
- `elAddCustomBtn` (`#btn-add-custom`) — そのまま使用
- `<dialog id="dialog-custom-preset">` — 変更なし
- カスタムプリセットの localStorage 仕様 — 変更なし

---

## 注意点

- `elServicePreset` の DOM 参照は完全に削除する（使用箇所は app.js 全体で `renderServicePresets`・`applyServicePreset`・各イベントリスナーの3箇所）
- `<select>` 削除後も生成件数の `<select id="generate-count">` は残るため、`.select` スタイルのスコープに注意
