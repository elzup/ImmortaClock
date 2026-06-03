import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCore } from './_load.mjs';

const C = loadCore();
const layer = (id) => C.LAYERS.find((l) => l.id === id);

// === PROP-CLK-1 (FIND-009 修正): 固定入力に対する具体的期待値 ===
test('PROP-CLK-1: format は固定入力で具体値を返す (TZ非依存)', () => {
  // local 構成 → getHours 等(local)と round-trip するため任意TZで安定
  const d = new Date(2026, 5, 3, 12, 1, 9);
  assert.equal(C.format(d), '2026-06-03 12:01:09');
  assert.equal(C.format(new Date(2001, 0, 5, 0, 0, 0)), '2001-01-05 00:00:00');
});

// === PROP-CLK-2: フォーマット正規表現 (property) ===
test('PROP-CLK-2: format は YYYY-MM-DD HH:MM:SS に一致', () => {
  const re = /^\d+-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  for (let i = 0; i < 500; i++) {
    const d = new Date(Math.floor(Math.random() * 8.6e12 * 30));
    if (isNaN(d.getTime())) continue;
    assert.match(C.format(d), re);
  }
});

// === humanizeYears (FIND-004 修正): 丸めが誤差を水増ししない ===
test('humanizeYears: 万年は小数1桁で誤差を隠さない', () => {
  assert.equal(C.humanizeYears(15000, 'ja'), '1.5万年');
  assert.equal(C.humanizeYears(273734, 'ja'), '27.4万年');
  assert.equal(C.humanizeYears(30, 'ja'), '30年');
  assert.equal(C.humanizeYears(Infinity, 'ja'), '∞');
  assert.equal(C.humanizeYears(273734, 'en'), '274k yr');
  assert.equal(C.humanizeYears(30, 'en'), '30 yr');
});

// === design:i18n: t と二言語データ ===
test('PROP-I18N-1: 全レイヤ label/killer が ja/en を持つ', () => {
  for (const l of C.LAYERS) {
    for (const k of ['label', 'killer']) {
      assert.ok(l[k] && typeof l[k].ja === 'string' && l[k].ja, `${l.id}.${k}.ja`);
      assert.ok(typeof l[k].en === 'string' && l[k].en, `${l.id}.${k}.en`);
    }
  }
});
test('PROP-I18N-2: t は言語選択とフォールバック', () => {
  assert.equal(C.t({ ja: 'あ', en: 'a' }, 'ja'), 'あ');
  assert.equal(C.t({ ja: 'あ', en: 'a' }, 'en'), 'a');
  assert.equal(C.t({ en: 'a' }, 'ja'), 'a'); // ja欠落→en
  assert.equal(C.t(null, 'ja'), '');
});

// === design:layers ===
test('PROP-LY-1: Layer id は一意', () => {
  const ids = C.LAYERS.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
});
test('PROP-LY-3: 全Layerが impact と appliesNow を持つ', () => {
  for (const l of C.LAYERS) {
    assert.ok(['fatal', 'accuracy', 'cosmetic'].includes(l.impact), `${l.id}.impact`);
    assert.equal(typeof l.appliesNow, 'boolean', `${l.id}.appliesNow`);
  }
});
test('REQ-LY-2: 必須レイヤを網羅', () => {
  const ids = new Set(C.LAYERS.map((l) => l.id));
  for (const need of ['host', 'framework', 'tls', 'browser', 'html', 'tz', 'time-api', 'encoding', 'date-limit', 'leap-second', 'time-t-2038', 'physical']) {
    assert.ok(ids.has(need), `missing layer: ${need}`);
  }
});

// === spec:longevity (FIND-001 修正: UTC基準で TZ非依存) ===
test('REQ-LV-1: computable は getUTCFullYear 基準で確定 (TZ非依存)', () => {
  const now = new Date(Date.UTC(2026, 0, 1));
  assert.equal(C.computeYearsLeft(layer('leap-second'), now).years, 9); // 2035-2026
  assert.equal(C.computeYearsLeft(layer('date-limit'), now).years, C.dateLimitYear() - 2026);
});
test('PROP-LV-1: computable yearsLeft >= 0 (property)', () => {
  const comps = C.LAYERS.filter((l) => l.kind === 'computable');
  for (let i = 0; i < 500; i++) {
    const now = new Date(Math.floor(Math.random() * 8.6e12 * 30));
    if (isNaN(now.getTime())) continue;
    for (const l of comps) {
      const y = C.computeYearsLeft(l, now).years;
      assert.ok(y >= 0 || !isFinite(y), `${l.id} -> ${y}`);
    }
  }
});
test('PROP-LV-2: date-limit > leap-second', () => {
  const now = new Date(Date.UTC(2026, 0, 1));
  assert.ok(C.computeYearsLeft(layer('date-limit'), now).years > C.computeYearsLeft(layer('leap-second'), now).years);
});
test('REQ-LV-7: 到来済み computable は 0 にクランプ', () => {
  const far = new Date(Date.UTC(3000, 0, 1));
  assert.equal(C.computeYearsLeft(layer('leap-second'), far).years, 0);
});
test('REQ-LV-3: appliesNow=false は basisKey=unused で反実仮想を出す', () => {
  const now = new Date(Date.UTC(2026, 0, 1));
  const r = C.computeYearsLeft(layer('framework'), now);
  assert.equal(r.basisKey, 'unused');
  assert.ok(r.years > 0, '反実仮想の年数が出る (該当なしで終わらせない)');
});

// === REQ-LV-5/6 + PROP-LV-4: 描画寿命 / 精度寿命の律速 ===
test('REQ-LV-5: 描画寿命は browser(30,medium,fatal,使用中)が律速', () => {
  const now = new Date(Date.UTC(2026, 0, 1));
  const eff = C.effectiveLife(now);
  assert.ok(eff, '律速が出る');
  assert.equal(eff.layer.id, 'browser');
  assert.equal(eff.years, 30);
});
test('REQ-LV-6: 精度寿命は tz(accuracy,使用中)が律速', () => {
  const now = new Date(Date.UTC(2026, 0, 1));
  const acc = C.accuracyLife(now);
  assert.ok(acc);
  assert.equal(acc.layer.id, 'tz');
});
test('PROP-LV-4: 描画寿命に unused/cosmetic/accuracy/low は寄与しない', () => {
  const now = new Date(Date.UTC(2026, 0, 1));
  const eff = C.effectiveLife(now);
  // host(low), framework(unused), leap-second/2038/tls(cosmetic), tz(accuracy) はいずれも 30 未満を含むが除外される
  assert.equal(eff.years, 30);
});
test('PROP-LV-3: 描画寿命 <= 律速候補の全レイヤ (property)', () => {
  for (let i = 0; i < 80; i++) {
    const yr = 2000 + Math.floor(Math.random() * 30);
    const now = new Date(Date.UTC(yr, 0, 1));
    const eff = C.effectiveLife(now);
    if (!eff) continue;
    for (const l of C.LAYERS) {
      if (!(l.impact === 'fatal' && l.appliesNow && !(l.kind === 'heuristic' && l.confidence === 'low'))) continue;
      const y = C.computeYearsLeft(l, now).years;
      if (y == null || !isFinite(y)) continue;
      assert.ok(eff.years <= y, `eff ${eff.years} <= ${l.id} ${y}`);
    }
  }
});
