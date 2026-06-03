import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, scriptText } from './_load.mjs';

// ブラウザを開かずに「配線切れ・不可視要素・degrade欠落」を静的検査する。
// 実ブラウザでしか分からないのはピクセル単位の見え方だけ、という前提の補完。

const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const markup = html.replace(/<script>[\s\S]*?<\/script>/, '').replace(/<style>[\s\S]*?<\/style>/, '');
const script = scriptText();

// === 配線1: getElementById のターゲットが HTML に存在する (typo→null無言死を防ぐ) ===
test('wiring: 全 getElementById のターゲット id が markup に存在', () => {
  const ids = new Set();
  for (const m of markup.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
  const refs = new Set();
  for (const m of script.matchAll(/getElementById\("([^"]+)"\)/g)) refs.add(m[1]);
  assert.ok(refs.size > 0, 'getElementById 参照が抽出できている');
  for (const ref of refs) {
    assert.ok(ids.has(ref), `id="${ref}" が HTML に無い (getElementById が null になる)`);
  }
});

test('wiring: HTML の id に重複が無い', () => {
  const seen = new Set();
  for (const m of markup.matchAll(/\bid="([^"]+)"/g)) {
    assert.ok(!seen.has(m[1]), `重複 id: ${m[1]}`);
    seen.add(m[1]);
  }
});

// === 配線2: JS が使う CSS class が <style> に定義されている (無スタイル=不可視を防ぐ) ===
test('wiring: 主要 CSS class が <style> に定義済み', () => {
  // severity / 状態バッジ / リスク / 各セル種別
  const required = [
    'danger', 'warn', 'safe', 'muted', 'badge', 'state', 'escaped', 'na',
    'tier-core', 'tier-enhanced', 'tier-dev', 'dist-active', 'dist-planned', 'dist-candidate',
    'risk-low', 'risk-med', 'risk-high', 'basis', 'note', 'years', 'deps', 'lim', 'no', 'api'
  ];
  for (const cls of required) {
    assert.ok(new RegExp('\\.' + cls + '\\b').test(style), `.${cls} の CSS 定義が無い`);
  }
});

// === 配線3: 使用している CSS 変数がすべて :root で定義済み ===
test('wiring: var(--x) がすべて定義済み', () => {
  const used = new Set();
  for (const m of style.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) used.add(m[1]);
  const defined = new Set();
  for (const m of style.matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1]);
  assert.ok(used.size > 0, 'var() の使用が抽出できている');
  for (const v of used) {
    assert.ok(defined.has(v), `未定義の CSS 変数: ${v}`);
  }
});

// === REQ-UI-6: degrade — clamp()/system-ui に前置フォールバックがある ===
test('REQ-UI-6: #clock の clamp() に固定 font-size フォールバックが前置されている', () => {
  // `font-size: <固定>; font-size: clamp(...)` の順 (clamp 非対応は前者を採用)
  assert.match(style, /#clock\s*\{[^}]*font-size:\s*[^;]+;\s*font-size:\s*clamp\(/,
    'clamp() の前に固定 font-size フォールバックが無い');
});
test('REQ-UI-6: font-family が generic family (sans-serif) に着地する', () => {
  assert.match(style, /font-family:[^;]*\bsans-serif\b/, 'generic family sans-serif が無い');
  // system-ui は sans-serif より前 (非対応時に sans-serif へ degrade)
  const fam = style.match(/font-family:\s*([^;]+);/)[1];
  assert.ok(fam.indexOf('system-ui') < fam.indexOf('sans-serif'), 'system-ui は sans-serif より前に置く');
});
