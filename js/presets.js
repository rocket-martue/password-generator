/**
 * presets.js — パスワード生成プリセット定義
 *
 * symbols: 使用を許可する記号文字列（空文字なら記号なし）
 * note: サービス別プリセットの注記（参考値であることを示す）
 */

/** 全記号 */
export const ALL_SYMBOLS = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

/** 汎用プリセット */
export const GENERIC_PRESETS = [
	{
		id: 'all',
		label: '全記号',
		symbols: ALL_SYMBOLS,
	},
	{
		id: 'standard',
		label: '標準セット',
		symbols: '!@#$%^&*()-_=+',
	},
	{
		id: 'simple',
		label: 'シンプル',
		symbols: '!@#$%',
	},
	{
		id: 'none',
		label: '記号なし',
		symbols: '',
	},
];

/**
 * サービス別プリセット
 *
 * 各サービスの記号ポリシーは変更される可能性があります。
 * 最新情報はご利用のサービスの公式サイトでご確認ください。
 */
export const SERVICE_PRESETS = [
	{
		id: 'amazon',
		label: 'Amazon',
		symbols: '! @ # $ % ^ & * ( ) _ + - = [ ] { } | \' " , . / < > ? `',
		note: '参考値。公式ポリシーは変更される場合があります。',
	},
	{
		id: 'google',
		label: 'Google',
		symbols: '! @ # $ % ^ & * ( ) _ + - = [ ] { } | \' " , . / < > ?',
		note: '参考値。公式ポリシーは変更される場合があります。',
	},
	{
		id: 'github',
		label: 'GitHub',
		symbols: '! @ # $ % ^ & * ( ) _ + - = [ ] { } | \' " , . / < > ? ` ~',
		note: '参考値。公式ポリシーは変更される場合があります。',
	},
	{
		id: 'apple',
		label: 'Apple / iCloud',
		symbols: '! @ # $ % ^ & * ( ) _ + - = [ ] { } | , . / < > ?',
		note: '参考値。公式ポリシーは変更される場合があります。',
	},
	{
		id: 'microsoft',
		label: 'Microsoft',
		symbols: '! @ # $ % ^ & * _ + - = , . / ? < >',
		note: '参考値。公式ポリシーは変更される場合があります。',
	},
	{
		id: 'twitter',
		label: 'Twitter / X',
		symbols: '! @ # $ % ^ & * ( ) _ + - = [ ] { } | \' " , . / < > ?',
		note: '参考値。公式ポリシーは変更される場合があります。',
	},
	{
		id: 'line',
		label: 'LINE',
		symbols: '! @ # $ % ^ & * ( ) _ - + = , . / ?',
		note: '参考値。公式ポリシーは変更される場合があります。',
	},
];

/**
 * レンタルサーバー別プリセット
 *
 * 各サービスの記号ポリシー・文字数制限は変更される可能性があります。
 * 最新情報はご利用のサービスの公式サイトでご確認ください。
 */
export const HOSTING_PRESETS = [
	{
		id: 'xserver',
		label: 'エックスサーバー',
		symbols: '!#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
		note: '参考値。公式ポリシーは変更される場合があります。',
	},
	{
		id: 'sakura-rs',
		label: 'さくらのレンタルサーバー',
		symbols: '',
		note: '参考値。英数字のみ推奨のサービスがあります。公式ポリシーは変更される場合があります。',
	},
	{
		id: 'lolipop',
		label: 'ロリポップ！',
		symbols: '',
		note: '参考値。英数字のみ推奨のサービスがあります。公式ポリシーは変更される場合があります。',
	},
	{
		id: 'conoha-wing',
		label: 'ConoHa WING',
		symbols: '!#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
		note: '参考値。英大文字・英小文字・数字・記号が各1文字以上必要です。公式ポリシーは変更される場合があります。',
	},
];

/** カスタムプリセットの localStorage キー */
export const CUSTOM_STORAGE_KEY = 'pg-custom-presets';

/** カスタムプリセットの件数上限 */
export const CUSTOM_PRESET_MAX = 50;

/** 紛らわしい文字セット */
export const AMBIGUOUS_CHARS = '0Ol1I|!';
