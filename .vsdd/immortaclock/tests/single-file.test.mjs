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

// === INV-SF-4: ES2020識別子 globalThis を使っていない (ES2015以下を維持) ===
test('INV-SF-4: globalThis を使わない (FIND-002)', () => {
  const scriptBody = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.equal(/\bglobalThis\b/.test(scriptBody), false, 'globalThis を使用している');
});
