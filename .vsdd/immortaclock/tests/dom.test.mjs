import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scriptText } from './_load.mjs';

// --- 依存ゼロの最小 fake DOM (FIND-006: DOM層を実行して検証する) ---
class FakeEl {
  constructor(tag) {
    this.tagName = tag; this.children = []; this._text = '';
    this.className = ''; this.style = {}; this.attributes = {}; this._ev = {};
  }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
  appendChild(c) { this.children.push(c); return c; }
  setAttribute(k, v) { this.attributes[k] = v; }
  addEventListener(ev, fn) { this._ev[ev] = fn; }
  click() { if (this._ev.click) this._ev.click(); }
}

function makeDoc() {
  const ids = [
    'lang', 'clock', 'effective', 'accuracy', 'footer',
    'stackTitle', 'stackHead', 'layers',
    'featTitle', 'featHead', 'feat',
    'distTitle', 'distHead', 'dist',
    'apiTitle', 'apiHead', 'api',
    'devTitle', 'devHead', 'dev'
  ];
  const byId = {};
  ids.forEach((id) => { byId[id] = new FakeEl('div'); });
  return {
    readyState: 'complete',
    documentElement: new FakeEl('html'),
    getElementById: (id) => byId[id] || (byId[id] = new FakeEl('div')),
    createElement: (tag) => new FakeEl(tag),
    addEventListener: () => {},
    _byId: byId
  };
}

function boot(language) {
  const doc = makeDoc();
  globalThis.document = doc;
  // Node22 の navigator は getter-only のため defineProperty で差し替える
  Object.defineProperty(globalThis, 'navigator', { value: { language }, configurable: true, writable: true });
  globalThis.setInterval = () => 0; // タイマーで test プロセスを延命させない
  new Function(scriptText())(); // readyState=complete なので即 boot() が走る
  const C = globalThis.ImmortaClock;
  return { doc, C };
}

test.afterEach(() => {
  delete globalThis.document; delete globalThis.navigator; delete globalThis.setInterval;
});

// === PROP-UI-1: 統合表の行数 == 全レイヤ数。各テーブルが描画される ===
test('PROP-UI-1: 統合表の行数 == 全レイヤ数', () => {
  const { doc, C } = boot('ja-JP');
  assert.equal(doc._byId.layers.children.length, C.LAYERS.length);
});
test('全テーブルが対応データ件数の行を持つ', () => {
  const { doc, C } = boot('ja-JP');
  assert.equal(doc._byId.feat.children.length, C.FEATURES.length, '機能別寿命テーブル行数');
  assert.equal(doc._byId.dist.children.length, C.DISTRIBUTION.length, '配布冗長化テーブル行数');
  assert.equal(doc._byId.api.children.length, C.APIS.length, 'API テーブル行数');
  assert.equal(doc._byId.dev.children.length, C.DEV_DEPS.length, '開発時テーブル行数');
});
test('REQ-UI-10: 機能別寿命表に核(時計)バッジが出る', () => {
  const { doc } = boot('ja-JP');
  assert.match(doc._byId.feat.textContent, /核/, '核 バッジ');
  assert.match(doc._byId.feat.textContent, /時計表示/, '時計表示 行');
});
test('REQ-UI-11: 配布冗長化表に GitHub Pages と状態バッジが出る', () => {
  const { doc } = boot('ja-JP');
  assert.match(doc._byId.dist.textContent, /GitHub Pages/, 'GitHub Pages 行');
  assert.match(doc._byId.dist.textContent, /稼働|予定|候補/, '状態バッジ');
});
test('PROP-HOST-2: 配布表に稼働先の数だけ href 付きアンカーが描画される (REQ-HOST-5)', () => {
  const { doc, C } = boot('ja-JP');
  const anchors = [];
  doc._byId.dist.children.forEach((tr) => {
    tr.children.forEach((td) => {
      td.children.forEach((c) => { if (c.tagName === 'a' && c.href) anchors.push(c); });
    });
  });
  const activeCount = C.DISTRIBUTION.filter((d) => d.status === 'active').length;
  assert.equal(anchors.length, activeCount, '稼働先数とアンカー数が一致');
  anchors.forEach((a) => assert.match(a.href, /^https:\/\//, 'アンカー href は https URL'));
});

// === PROP-UI-2: active の<10年は danger クラス (統合表) ===
test('PROP-UI-2: active の<10年は danger クラス', () => {
  const { doc, C } = boot('ja-JP');
  const rows = doc._byId.layers.children;
  C.LAYERS.forEach((layer, i) => {
    if (!C.isActive(layer)) return;
    const y = C.computeYearsLeft(layer, new Date(Date.UTC(2026, 0, 1))).years;
    if (isFinite(y) && y < 10) assert.match(rows[i].className, /danger/, `${layer.id} should be danger`);
  });
});

// === PROP-UI-4: 統合表に 依存中/脱却/該当なし の状態バッジが出る ===
test('PROP-UI-4: 統合表に 依存中/脱却/該当なし の状態バッジが付与される', () => {
  const { doc } = boot('ja-JP');
  const txt = doc._byId.layers.textContent;
  assert.match(txt, /依存中/, '依存中 バッジ');
  assert.match(txt, /脱却/, '脱却 バッジ');
  assert.match(txt, /該当なし/, '該当なし バッジ');
});

// === PROP-UI-3 / REQ-UI-4: 言語トグルで文言が ja<->en で変わる ===
test('PROP-UI-3: 言語トグルで footer/stackTitle が切替わる', () => {
  const { doc } = boot('ja-JP');
  const footerJa = doc._byId.footer.textContent;
  const titleJa = doc._byId.stackTitle.textContent;
  assert.match(doc._byId.lang.textContent, /EN/); // ja時はトグルにENと出る
  doc._byId.lang.click(); // → en へ
  assert.notEqual(doc._byId.footer.textContent, footerJa);
  assert.notEqual(doc._byId.stackTitle.textContent, titleJa);
  assert.equal(doc._byId.lang.textContent, '日本語');
});

// === REQ-I18N-3: navigator.language=en は英語起動 ===
test('REQ-I18N-3: 非ja ロケールは英語で起動', () => {
  const { doc } = boot('en-US');
  assert.match(doc._byId.lang.textContent, /日本語/); // en時はトグルに日本語と出る
  assert.match(doc._byId.footer.textContent, /[Ss]ingle HTML file/);
});

// === REQ-CLK-1: clock に時刻が描画される ===
test('REQ-CLK-1: clock 要素に YYYY-MM-DD HH:MM:SS が入る', () => {
  const { doc } = boot('ja-JP');
  assert.match(doc._byId.clock.textContent, /^\d+-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
});

// === REQ-UI-3: 実効寿命サマリが描画される ===
test('REQ-UI-3: effective に律速サマリが描画される', () => {
  const { doc } = boot('ja-JP');
  assert.match(doc._byId.effective.textContent, /実効寿命/);
  assert.match(doc._byId.accuracy.textContent, /地域時刻/);
});
