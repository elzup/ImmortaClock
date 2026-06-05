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
test('PROP-LY-3: 全Layerが impact と status(3値) を持つ', () => {
  for (const l of C.LAYERS) {
    assert.ok(['fatal', 'accuracy', 'cosmetic'].includes(l.impact), `${l.id}.impact`);
    assert.ok(['active', 'escaped', 'na'].includes(l.status), `${l.id}.status`);
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
// === Task2: 依存状態(status)軸 と 推定根拠(basisKey)軸 の分離 ===
test('REQ-LV-3: 非依存(escaped/na)も反実仮想を出し、status と basis を分離する', () => {
  const now = new Date(Date.UTC(2026, 0, 1));
  const fw = C.computeYearsLeft(layer('framework'), now);
  assert.equal(fw.statusKey, 'escaped', 'framework は脱却');
  assert.equal(fw.basisKey, 'heuristic', '推定根拠は kind 由来 (不使用ではない)');
  assert.ok(fw.years > 0, '反実仮想の年数が出る (該当なしで終わらせない)');

  const leap = C.computeYearsLeft(layer('leap-second'), now);
  assert.equal(leap.statusKey, 'na', 'leap-second は該当なし');
  assert.equal(leap.basisKey, 'computable', '推定根拠は computable');
});
test('REQ-LV-4: basisKey は計算可能/推定の2値のみ (不使用を混入しない)', () => {
  for (const l of C.LAYERS) {
    const r = C.computeYearsLeft(l, new Date(Date.UTC(2026, 0, 1)));
    assert.ok(['computable', 'heuristic'].includes(r.basisKey), `${l.id}.basisKey=${r.basisKey}`);
    assert.equal(r.basisKey, l.kind, `${l.id}: basisKey は kind と一致`);
    assert.equal(r.statusKey, l.status, `${l.id}: statusKey は status と一致`);
  }
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
test('PROP-LV-4: 描画寿命に escaped/na・cosmetic・accuracy・low は寄与しない', () => {
  const now = new Date(Date.UTC(2026, 0, 1));
  const eff = C.effectiveLife(now);
  // host(low), framework(escaped), leap-second/2038(na)・tls(escaped/cosmetic), tz(accuracy) は 30 未満を含むが除外される
  assert.equal(eff.years, 30);
});
test('PROP-LV-3: 描画寿命 <= 律速候補の全レイヤ (property)', () => {
  for (let i = 0; i < 80; i++) {
    const yr = 2000 + Math.floor(Math.random() * 30);
    const now = new Date(Date.UTC(yr, 0, 1));
    const eff = C.effectiveLife(now);
    if (!eff) continue;
    for (const l of C.LAYERS) {
      if (!(l.impact === 'fatal' && C.isActive(l) && !(l.kind === 'heuristic' && l.confidence === 'low'))) continue;
      const y = C.computeYearsLeft(l, now).years;
      if (y == null || !isFinite(y)) continue;
      assert.ok(eff.years <= y, `eff ${eff.years} <= ${l.id} ${y}`);
    }
  }
});

// === Task3: 脱却テーブルが必須項目を含む ===
test('Task3: escaped に framework / tls / 永続state が含まれる', () => {
  const escaped = new Set(C.LAYERS.filter((l) => l.status === 'escaped').map((l) => l.id));
  for (const id of ['framework', 'tls', 'persistent-state']) {
    assert.ok(escaped.has(id), `escaped に ${id} が無い`);
  }
});

// === Task4: 使用API レガシー化リスク表 (design:used-apis) ===
test('design:used-apis: 各APIが since/risk(低中高)/普及/degrade を持つ', () => {
  assert.ok(C.APIS.length >= 5, 'API 行が十分にある');
  for (const a of C.APIS) {
    assert.ok(typeof a.api === 'string' && a.api, 'api 名');
    assert.ok(typeof a.since === 'string' && a.since, `${a.api}.since`);
    assert.ok(['low', 'med', 'high'].includes(a.risk), `${a.api}.risk=${a.risk}`);
    for (const k of ['adoption', 'degrade']) {
      assert.ok(a[k] && a[k].ja && a[k].en, `${a.api}.${k} は ja/en を持つ`);
    }
  }
});
test('REQ-API-1: 必須API/機能を網羅 (Date/navigator/DOM/ES2015/script/system-ui/clamp/var/tabular-nums)', () => {
  const names = C.APIS.map((a) => a.api).join(' | ');
  for (const need of ['Date', 'navigator.language', 'createElement', 'ES5', 'script', 'system-ui', 'clamp()', 'var()', 'tabular-nums']) {
    assert.ok(names.includes(need), `missing API row: ${need}`);
  }
});

// === design:feature-longevity: 機能別の寿命・必須度 (表5) ===
test('design:feature-longevity: tier(核/付加/開発時) と survives(二言語) を持つ', () => {
  assert.ok(C.FEATURES.length >= 4, 'feature 行が十分にある');
  const tiers = new Set(C.FEATURES.map((f) => f.tier));
  assert.ok(tiers.has('core'), 'core(核) が存在');
  for (const f of C.FEATURES) {
    assert.ok(['core', 'enhanced', 'dev'].includes(f.tier), `${f.specId}.tier=${f.tier}`);
    assert.ok(typeof f.specId === 'string' && f.specId.includes(':'), `${f.specId} は CEG ノード id`);
    assert.equal(typeof f.deps, 'number', `${f.specId}.deps は数値`);
    assert.ok(f.survives && f.survives.ja && f.survives.en, `${f.specId}.survives は ja/en`);
  }
});
test('REQ-FL-1: 時計(spec:clock)が tier=core で唯一の核', () => {
  const cores = C.FEATURES.filter((f) => f.tier === 'core');
  assert.equal(cores.length, 1, '核は1つ');
  assert.equal(cores[0].specId, 'spec:clock');
});
test('PROP-FL-2/REQ-FL-5: 核の依存数 <= 全 enhanced の依存数 (核は最も頑健)', () => {
  const core = C.FEATURES.find((f) => f.tier === 'core');
  const enhanced = C.FEATURES.filter((f) => f.tier === 'enhanced');
  for (const e of enhanced) {
    assert.ok(core.deps <= e.deps, `core(${core.deps}) <= ${e.specId}(${e.deps})`);
  }
});

// === design:hosting-redundancy: 配布の冗長化 (表6) ===
test('design:hosting-redundancy: 配布先が status/種別/運営/コスト を持つ', () => {
  assert.ok(C.DISTRIBUTION.length >= 2, '配布先が複数ある');
  const targets = C.DISTRIBUTION.map((d) => d.target).join(' | ');
  // REQ-HOST-4: 稼働中の配信は GitHub Pages + Cloudflare + GitLab Pages
  assert.match(targets, /GitHub Pages/, 'GitHub Pages を含む');
  assert.match(targets, /Cloudflare/, 'Cloudflare を含む');
  assert.match(targets, /GitLab/, 'GitLab を含む');
  for (const d of C.DISTRIBUTION) {
    assert.ok(['active', 'planned', 'candidate'].includes(d.status), `${d.target}.status=${d.status}`);
    for (const k of ['kind', 'operator', 'cost']) {
      assert.ok(d[k] && d[k].ja && d[k].en, `${d.target}.${k} は ja/en`);
    }
  }
});
test('PROP-HOST-1: 稼働(active)配布先は url を持ち 2 つ以上 (REQ-HOST-5)', () => {
  const active = C.DISTRIBUTION.filter((d) => d.status === 'active');
  assert.ok(active.length >= 2, `稼働先が 2 つ以上 (実際: ${active.length})`);
  for (const d of active) {
    assert.ok(typeof d.url === 'string' && /^https:\/\//.test(d.url), `${d.target}.url は https URL`);
  }
});
test('REQ-HOST-4: repo ミラーは無料・無制限のみ (GitLab/Codeberg)', () => {
  const mirrors = C.DISTRIBUTION.filter((d) => /mirror|ミラー/.test(d.kind.ja + d.kind.en));
  for (const m of mirrors) {
    assert.match(m.cost.ja + m.cost.en, /無制限|unlimited/, `${m.target} は無料・無制限であるべき`);
  }
});

// === Task5: 開発時依存表 (design:dev-deps) ===
test('design:dev-deps: 開発時依存は配布物に非搭載、用途は二言語', () => {
  assert.ok(C.DEV_DEPS.length >= 3, 'dev-dep 行が十分にある');
  const tools = C.DEV_DEPS.map((d) => d.tool).join(' ');
  // REQ-DEV-1: node:test / ceg.mjs / fake DOM / Node.js を明示
  assert.match(tools, /node:test/, 'node:test を明示');
  assert.match(tools, /ceg\.mjs/, 'ceg.mjs を明示');
  assert.match(tools, /fake DOM/, 'fake DOM を明示');
  assert.match(tools, /Node\.js/, 'Node.js を明示');
  for (const d of C.DEV_DEPS) {
    assert.ok(d.use && d.use.ja && d.use.en, `${d.tool}.use は ja/en を持つ`);
  }
});
