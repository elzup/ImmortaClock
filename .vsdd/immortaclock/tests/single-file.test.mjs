import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html } from './_load.mjs';

// === PROP-SF-1 (FIND-007): 単一ファイル・外部依存ゼロを回帰固定 ===
test('PROP-SF-1: 外部 script/link/import/require/fetch を持たない', () => {
  // 外部URLを指す src= / href= が無い (アンカー # やデータURIは許容しない素朴チェック)
  const externalSrc = html.match(/\b(src|href)\s*=\s*["'](https?:|\/\/)/i);
  assert.equal(externalSrc, null, `外部参照: ${externalSrc && externalSrc[0]}`);

  // <script src=...> や <link href=...> 自体が無い
  assert.equal(/<script[^>]+\bsrc=/i.test(html), false, '<script src> がある');
  assert.equal(/<link[^>]+\bhref=/i.test(html), false, '<link href> がある');

  // JS の動的依存 (module/CommonJS/network) が無い
  const scriptBody = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.equal(/\bimport\s/.test(scriptBody), false, 'import がある');
  assert.equal(/\brequire\s*\(/.test(scriptBody), false, 'require( がある');
  assert.equal(/\bfetch\s*\(/.test(scriptBody), false, 'fetch( がある');
  assert.equal(/\bXMLHttpRequest\b/.test(scriptBody), false, 'XHR がある');
  assert.equal(/\bimportScripts\b/.test(scriptBody), false, 'importScripts がある');
});

// === REQ-UI-5: innerHTML 混入禁止 (textContent/createElement のみ) ===
// 注: API リスク表の説明文に "innerHTML" の語が出るため、危険なのは「代入」のみを禁止する
test('REQ-UI-5: innerHTML / outerHTML / insertAdjacentHTML への代入が無い', () => {
  const scriptBody = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.equal(/\.innerHTML\s*=/.test(scriptBody), false, 'innerHTML への代入がある');
  assert.equal(/\.outerHTML\s*=/.test(scriptBody), false, 'outerHTML への代入がある');
  assert.equal(/insertAdjacentHTML/.test(scriptBody), false, 'insertAdjacentHTML を使用している');
});

// === INV-SF-4: ES2020+ 構文 (optional chaining / nullish) を使わない ===
test('INV-SF-4: ES2020+ (?. / ??) を使わない', () => {
  const scriptBody = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.equal(/\?\./.test(scriptBody), false, 'optional chaining ?. がある');
  assert.equal(/\?\?/.test(scriptBody), false, 'nullish coalescing ?? がある');
});

// === INV-SF-4: ES5 構文のみ (var/function。const/let/arrow/template literal 不使用) ===
// 実行可能エンジン集合を ES2015 の上位集合に保ち、寿命を ≥ にする (redundancy 原理)。
test('INV-SF-4: ES5 構文のみ (const/let/arrow/template literal を使わない)', () => {
  const scriptBody = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.equal(/\bconst\s/.test(scriptBody), false, 'const がある (ES2015)');
  assert.equal(/\blet\s/.test(scriptBody), false, 'let がある (ES2015)');
  assert.equal(/=>/.test(scriptBody), false, 'arrow 関数がある (ES2015)');
  assert.equal(/`/.test(scriptBody), false, 'template literal (バッククォート) がある (ES2015)');
});

// === INV-SF-4: ES2020識別子 globalThis を使っていない (ES2015以下を維持) ===
test('INV-SF-4: globalThis を使わない (FIND-002)', () => {
  const scriptBody = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.equal(/\bglobalThis\b/.test(scriptBody), false, 'globalThis を使用している');
});
