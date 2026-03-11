/**
 * app.js — UI イベント制御・強度計算・コピー処理
 */

import { GENERIC_PRESETS, SERVICE_PRESETS, HOSTING_PRESETS, AMBIGUOUS_CHARS, CUSTOM_STORAGE_KEY, CUSTOM_PRESET_MAX } from './presets.js';
import { buildCharPool, generatePasswords, calcStrength } from './generator.js';

// ─── 記号リスト（チェックボックス単位） ─────────────────────────────────────
const SYMBOL_CHARS = [
	'!', '"', '#', '$', '%', '&', "'", '(',
	')', '*', '+', ',', '-', '.', '/', ':',
	';', '<', '=', '>', '?', '@', '[', '\\',
	']', '^', '_', '`', '{', '|', '}', '~',
];

// ─── DOM 参照 ──────────────────────────────────────────────────────────────
const elUpper = document.getElementById('use-upper');
const elLower = document.getElementById('use-lower');
const elDigits = document.getElementById('use-digits');
const elSymbolToggle = document.getElementById('use-symbols');
const elSymbolGrid = document.getElementById('symbol-grid');
const elGenericPreset = document.getElementById('generic-preset');
const elServicePreset = document.getElementById('service-preset');
const elServiceNote = document.getElementById('service-preset-note');
const elDeleteCustomBtn = document.getElementById('btn-delete-custom');
const elAddCustomBtn = document.getElementById('btn-add-custom');
const elDialog = document.getElementById('dialog-custom-preset');
const elDialogSymbols = document.getElementById('custom-symbols');
const elDialogNote = document.getElementById('custom-note');
const elDialogCancel = document.getElementById('btn-dialog-cancel');
const elDialogAdd = document.getElementById('btn-dialog-add');
const elLengthSlider = document.getElementById('length-slider');
const elLengthNumber = document.getElementById('length-number');
const elExclude = document.getElementById('exclude-input');
const elAmbiguousBtn = document.getElementById('btn-ambiguous');
const elCount = document.getElementById('generate-count');
const elGenerateBtn = document.getElementById('btn-generate');
const elResults = document.getElementById('results');
const elError = document.getElementById('error-message');

// ─── 初期化 ────────────────────────────────────────────────────────────────

/** 汎用プリセットボタンを生成 */
const initGenericPresets = () => {
	GENERIC_PRESETS.forEach(preset => {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'preset-btn';
		btn.dataset.presetId = preset.id;
		btn.textContent = preset.label;
		btn.addEventListener('click', () => applyGenericPreset(preset));
		elGenericPreset.appendChild(btn);
	});
};

/**
 * サービス別プリセットの <option> を <optgroup> でグループ分けして生成（再描画対応）
 * カスタムプリセットを追加・削除するたびに呼び出す。
 */
const renderServicePresets = () => {
	const currentValue = elServicePreset.value;
	elServicePreset.innerHTML = '';

	const defaultOpt = document.createElement('option');
	defaultOpt.value = '';
	defaultOpt.textContent = '— サービスを選択 —';
	elServicePreset.appendChild(defaultOpt);

	// 主要サービス
	const groupService = document.createElement('optgroup');
	groupService.label = '主要サービス';
	SERVICE_PRESETS.forEach(preset => {
		const opt = document.createElement('option');
		opt.value = preset.id;
		opt.textContent = preset.label;
		groupService.appendChild(opt);
	});
	elServicePreset.appendChild(groupService);

	// レンタルサーバー
	const groupHosting = document.createElement('optgroup');
	groupHosting.label = 'レンタルサーバー';
	HOSTING_PRESETS.forEach(preset => {
		const opt = document.createElement('option');
		opt.value = preset.id;
		opt.textContent = preset.label;
		groupHosting.appendChild(opt);
	});
	elServicePreset.appendChild(groupHosting);

	// カスタム
	const customs = loadCustomPresets();
	if (customs.length > 0) {
		const groupCustom = document.createElement('optgroup');
		groupCustom.label = 'カスタム';
		customs.forEach(preset => {
			const opt = document.createElement('option');
			opt.value = preset.id;
			opt.textContent = preset.label;
			groupCustom.appendChild(opt);
		});
		elServicePreset.appendChild(groupCustom);
	}

	// 選択状態を復元（削除された場合は空に戻る）
	if ([...elServicePreset.options].some(o => o.value === currentValue)) {
		elServicePreset.value = currentValue;
	}
};

/** 記号チェックボックスグリッドを生成 */
const initSymbolGrid = () => {
	SYMBOL_CHARS.forEach(ch => {
		const label = document.createElement('label');
		label.className = 'symbol-check';

		const cb = document.createElement('input');
		cb.type = 'checkbox';
		cb.value = ch;
		cb.checked = true;
		cb.addEventListener('change', updateStrengthDisplay);

		const span = document.createElement('span');
		span.textContent = ch;

		label.appendChild(cb);
		label.appendChild(span);
		elSymbolGrid.appendChild(label);
	});
};

// ─── プリセット適用 ────────────────────────────────────────────────────────

/** 汎用プリセット適用 */
const applyGenericPreset = (preset) => {
	const symbolSet = new Set(preset.symbols);
	getSymbolCheckboxes().forEach(cb => {
		cb.checked = symbolSet.has(cb.value);
	});

	// 記号なしプリセットのとき記号トグルを OFF にする
	if (preset.id === 'none') {
		elSymbolToggle.checked = false;
		elSymbolGrid.classList.add('disabled');
	} else {
		elSymbolToggle.checked = true;
		elSymbolGrid.classList.remove('disabled');
	}

	// アクティブ状態
	document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
	document.querySelector(`[data-preset-id="${preset.id}"]`)?.classList.add('active');

	// サービスプリセットをリセット
	elServicePreset.value = '';
	elServiceNote.textContent = '';

	updateStrengthDisplay();
};

/** サービス別プリセット適用 */
const applyServicePreset = (presetId) => {
	if (!presetId) {
		elServiceNote.textContent = '';
		elDeleteCustomBtn.hidden = true;
		return;
	}

	const allPresets = [...SERVICE_PRESETS, ...HOSTING_PRESETS, ...loadCustomPresets()];
	const preset = allPresets.find(p => p.id === presetId);
	if (!preset) return;

	// カスタムプリセットのみ削除ボタンを表示
	elDeleteCustomBtn.hidden = !presetId.startsWith('custom-');

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

	// サービスプリセット選択時は大文字・小文字・数字を必ず ON に戻す
	elUpper.checked = true;
	elLower.checked = true;
	elDigits.checked = true;

	// 注記表示
	elServiceNote.textContent = preset.note ?? '';

	// 汎用プリセットのアクティブを外す
	document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

	updateStrengthDisplay();
};

// ─── カスタムプリセット CRUD ───────────────────────────────────────────────

/**
 * ASCII 表示可能範囲 (0x21–0x7E) のうち英数字以外のみ許可
 * @param {string} raw ユーザー入力値
 * @returns {string} サニタイズ済み文字列
 */
const sanitizeCustomSymbols = (raw) =>
	[...raw]
		.filter(ch => {
			const cp = ch.codePointAt(0);
			return cp >= 0x21 && cp <= 0x7E && !/[A-Za-z0-9]/.test(ch);
		})
		.join('');

/** localStorage からカスタムプリセット配列を読み込む */
const loadCustomPresets = () => {
	try {
		const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed;
	} catch {
		return [];
	}
};

/** カスタムプリセット配列を localStorage に保存する */
const saveCustomPresets = (presets) => {
	localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(presets));
};

/** カスタムプリセットを追加する */
const addCustomPreset = (label, symbols, note) => {
	const presets = loadCustomPresets();
	if (presets.length >= CUSTOM_PRESET_MAX) return false;
	presets.push({
		id: `custom-${Date.now()}`,
		label,
		symbols,
		note,
	});
	saveCustomPresets(presets);
	return true;
};

/** カスタムプリセットを ID で削除する */
const deleteCustomPreset = (id) => {
	const presets = loadCustomPresets().filter(p => p.id !== id);
	saveCustomPresets(presets);
};

/** ダイアログを開く */
const openDialog = () => {
	elDialogSymbols.value = '';
	elDialogNote.value = '';
	elDialog.showModal();
	elDialogSymbols.focus();
};

/** ダイアログを閉じる */
const closeDialog = () => {
	elDialog.close();
};

/** ダイアログの「追加する」処理 */
const handleDialogAdd = () => {
	const presets = loadCustomPresets();
	const label = `カスタム ${presets.length + 1}`;
	const symbols = sanitizeCustomSymbols(elDialogSymbols.value);
	const note = elDialogNote.value.trim();

	const added = addCustomPreset(label, symbols, note);
	if (!added) return; // 上限超過時はサイレントに無視（追加ボタンを disabled にする戻値を待って拡張できる）

	closeDialog();
	const customs = loadCustomPresets();
	const newPreset = customs[customs.length - 1];
	renderServicePresets();
	elServicePreset.value = newPreset.id;
	applyServicePreset(newPreset.id);
};

// ─── ヘルパー ──────────────────────────────────────────────────────────────

const getSymbolCheckboxes = () =>
	[...elSymbolGrid.querySelectorAll('input[type="checkbox"]')];

const getCheckedSymbols = () => {
	if (!elSymbolToggle.checked) return '';
	return getSymbolCheckboxes()
		.filter(cb => cb.checked)
		.map(cb => cb.value)
		.join('');
};

const getCurrentOptions = () => ({
	useUpper: elUpper.checked,
	useLower: elLower.checked,
	useDigits: elDigits.checked,
	symbols: getCheckedSymbols(),
	exclude: elExclude.value,
	length: parseInt(elLengthSlider.value, 10),
	count: parseInt(elCount.value, 10),
});

// ─── 強度表示 ──────────────────────────────────────────────────────────────

const STRENGTH_CLASSES = ['strength-weak', 'strength-fair', 'strength-strong', 'strength-very-strong'];

const updateStrengthDisplay = () => {
	const opts = getCurrentOptions();
	const pool = buildCharPool(opts);
	const { label, level } = calcStrength(pool, opts.length);

	const indicator = document.getElementById('strength-indicator');
	const strengthLabel = document.getElementById('strength-label');
	if (!indicator || !strengthLabel) return;

	indicator.className = 'strength-indicator ' + (STRENGTH_CLASSES[level] ?? '');
	indicator.dataset.level = level;
	indicator.setAttribute('aria-valuenow', level);
	strengthLabel.textContent = label;
};

// ─── パスワード生成・表示 ──────────────────────────────────────────────────

const renderResults = (passwords) => {
	elResults.innerHTML = '';

	passwords.forEach((pw, i) => {
		const card = document.createElement('div');
		card.className = 'password-card';

		const pwText = document.createElement('span');
		pwText.className = 'password-text';
		pwText.textContent = pw;
		pwText.setAttribute('aria-label', `生成されたパスワード ${i + 1}`);

		const copyBtn = document.createElement('button');
		copyBtn.type = 'button';
		copyBtn.className = 'btn-copy';
		copyBtn.textContent = 'コピー';
		copyBtn.setAttribute('aria-label', `パスワード ${i + 1} をクリップボードにコピー`);

		copyBtn.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(pw);
				copyBtn.textContent = 'コピー済！';
				copyBtn.classList.add('copied');
				setTimeout(() => {
					copyBtn.textContent = 'コピー';
					copyBtn.classList.remove('copied');
				}, 2000);
			} catch {
				copyBtn.textContent = '失敗';
			}
		});

		card.appendChild(pwText);
		card.appendChild(copyBtn);
		elResults.appendChild(card);
	});
};

const handleGenerate = () => {
	elError.textContent = '';

	const opts = getCurrentOptions();
	const { passwords, error } = generatePasswords(opts);

	if (error) {
		elError.textContent = error;
		elResults.innerHTML = '';
		return;
	}

	renderResults(passwords);
};

// ─── イベント登録 ──────────────────────────────────────────────────────────

/** パスワード長スライダー ↔ 数値入力 連動 */
elLengthSlider.addEventListener('input', () => {
	elLengthNumber.value = elLengthSlider.value;
	updateStrengthDisplay();
});

elLengthNumber.addEventListener('input', () => {
	const val = Math.min(64, Math.max(8, parseInt(elLengthNumber.value, 10) || 8));
	elLengthNumber.value = val;
	elLengthSlider.value = val;
	updateStrengthDisplay();
});

/** 記号トグル */
elSymbolToggle.addEventListener('change', () => {
	elSymbolGrid.classList.toggle('disabled', !elSymbolToggle.checked);
	updateStrengthDisplay();
});

/** 紛らわしい文字を除くボタン */
elAmbiguousBtn.addEventListener('click', () => {
	elExclude.value = AMBIGUOUS_CHARS;
	updateStrengthDisplay();
});

/** サービスプリセット */
elServicePreset.addEventListener('change', () => {
	applyServicePreset(elServicePreset.value);
});

/** カスタムプリセット削除ボタン */
elDeleteCustomBtn.addEventListener('click', () => {
	const id = elServicePreset.value;
	if (!id.startsWith('custom-')) return;
	deleteCustomPreset(id);
	renderServicePresets();
	elServicePreset.value = '';
	elServiceNote.textContent = '';
	elDeleteCustomBtn.hidden = true;
	applyServicePreset('');
});

/** カスタムプリセット追加ボタン */
elAddCustomBtn.addEventListener('click', openDialog);

/** ダイアログ: キャンセル */
elDialogCancel.addEventListener('click', closeDialog);

/** ダイアログ: 追加する */
elDialogAdd.addEventListener('click', handleDialogAdd);

/** ダイアログ: Escape キー / backdrop クリックで閉じる */
elDialog.addEventListener('cancel', (e) => {
	e.preventDefault();
	closeDialog();
});

/** 文字種チェックボックス */
[elUpper, elLower, elDigits].forEach(el => {
	el.addEventListener('change', updateStrengthDisplay);
});

/** 除外文字入力 */
elExclude.addEventListener('input', updateStrengthDisplay);

/** 生成ボタン */
elGenerateBtn.addEventListener('click', handleGenerate);

// ─── テーマ切り替え ────────────────────────────────────────────────────────

const DARK_THEME = 'dark';
const THEME_STORAGE_KEY = 'pg-theme';

const applyTheme = (isDark) => {
	if (isDark) {
		document.documentElement.setAttribute('data-theme', DARK_THEME);
	} else {
		document.documentElement.removeAttribute('data-theme');
	}

	const btn = document.getElementById('btn-theme-toggle');
	if (!btn) return;
	btn.setAttribute('aria-label', isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
	btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
	btn.querySelector('.theme-toggle-icon').textContent = isDark ? '☀️' : '🌙';
	btn.querySelector('.theme-toggle-label').textContent = isDark ? 'ライト' : 'ダーク';
};

const initTheme = () => {
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	const isDark = stored !== null ? stored === DARK_THEME : prefersDark;
	applyTheme(isDark);
};

document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
	const isDark = document.documentElement.getAttribute('data-theme') !== DARK_THEME;
	localStorage.setItem(THEME_STORAGE_KEY, isDark ? DARK_THEME : 'light');
	applyTheme(isDark);
});

// ─── 起動 ──────────────────────────────────────────────────────────────────
initTheme();
initGenericPresets();
renderServicePresets();
initSymbolGrid();
updateStrengthDisplay();
