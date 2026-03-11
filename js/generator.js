/**
 * generator.js — パスワード生成ロジック
 *
 * 乱数生成には window.crypto.getRandomValues() のみを使用する。
 * Math.random() の使用は禁止。
 */

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';

/**
 * 文字プールを構築する
 *
 * @param {object} options
 * @param {boolean} options.useUpper    大文字を含める
 * @param {boolean} options.useLower    小文字を含める
 * @param {boolean} options.useDigits   数字を含める
 * @param {string}  options.symbols     使用する記号文字列
 * @param {string}  options.exclude     除外する文字列
 * @returns {string} 重複なしの文字プール
 */
export const buildCharPool = ({ useUpper, useLower, useDigits, symbols, exclude }) => {
	let pool = '';
	if (useUpper) pool += UPPERCASE;
	if (useLower) pool += LOWERCASE;
	if (useDigits) pool += DIGITS;
	if (symbols) pool += symbols;

	// 重複除去 & 除外文字を削除
	const excludeSet = new Set(exclude ?? '');
	return [...new Set(pool)].filter(ch => !excludeSet.has(ch)).join('');
};

/**
 * 暗号学的に安全な乱数インデックスを生成する
 *
 * 剰余バイアスを避けるため、poolSize の倍数に収まるまで再試行する。
 *
 * @param {number} poolSize
 * @returns {number}
 */
const secureRandIndex = (poolSize) => {
	const MAX_BYTE = 256;
	const limit = MAX_BYTE - (MAX_BYTE % poolSize);
	const buf = new Uint8Array(1);

	let val;
	do {
		window.crypto.getRandomValues(buf);
		val = buf[0];
	} while (val >= limit);

	return val % poolSize;
};

/**
 * パスワードを生成する
 *
 * @param {object} options
 * @param {boolean} options.useUpper    大文字を含める
 * @param {boolean} options.useLower    小文字を含める
 * @param {boolean} options.useDigits   数字を含める
 * @param {string}  options.symbols     使用する記号文字列
 * @param {string}  options.exclude     除外する文字列
 * @param {number}  options.length      パスワード長（8〜64）
 * @param {number}  options.count       生成件数（1〜5）
 * @returns {{ passwords: string[], error: string|null }}
 */
export const generatePasswords = (options) => {
	const pool = buildCharPool(options);

	if (pool.length === 0) {
		return { passwords: [], error: '文字種が選択されていません。大文字・小文字・数字・記号のいずれかを有効にしてください。' };
	}

	const { length, count } = options;
	const passwords = [];

	for (let i = 0; i < count; i++) {
		let pw = '';
		for (let j = 0; j < length; j++) {
			pw += pool[secureRandIndex(pool.length)];
		}
		passwords.push(pw);
	}

	return { passwords, error: null };
};

/**
 * パスワード強度をエントロピーで評価する
 *
 * エントロピー = log2(文字プールサイズ) × パスワード長
 *
 * @param {string} pool   文字プール
 * @param {number} length パスワード長
 * @returns {{ label: string, level: 0|1|2|3 }}
 *   level: 0=弱, 1=普通, 2=強, 3=非常に強い
 */
export const calcStrength = (pool, length) => {
	if (pool.length === 0 || length === 0) {
		return { label: '—', level: 0 };
	}

	const entropy = Math.log2(pool.length) * length;

	if (entropy < 40) return { label: '弱', level: 0 };
	if (entropy < 60) return { label: '普通', level: 1 };
	if (entropy < 80) return { label: '強', level: 2 };
	return { label: '非常に強い', level: 3 };
};
