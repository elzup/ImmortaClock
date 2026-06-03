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
  const ids = ['lang', 'clock', 'effective', 'accuracy', 'tableTitle', 'thead', 'footer', 'layers'];
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

// === PROP-UI-1: 行数 == レイヤ数 ===
test('PROP-UI-1: 描画行数とレイヤ数が一致', () => {
  const { doc, C } = boot('ja-JP');
  assert.equal(doc._byId.layers.children.length, C.LAYERS.length);
});

// === PROP-UI-2 / PROP-UI-4: severity と unused クラス ===
test('PROP-UI-2/4: <10年は danger、appliesNow=false は unused クラス', () => {
  const { doc, C } = boot('ja-JP');
  const rows = doc._byId.layers.children;
  C.LAYERS.forEach((layer, i) => {
    const cls = rows[i].className;
    const y = C.computeYearsLeft(layer, new Date(Date.UTC(2026, 0, 1))).years;
    if (isFinite(y) && y < 10) assert.match(cls, /danger/, `${layer.id} should be danger`);
    if (!layer.appliesNow) assert.match(cls, /unused/, `${layer.id} should be unused`);
  });
});

// === PROP-UI-3 / REQ-UI-4: 言語トグルで文言が ja<->en で変わる ===
test('PROP-UI-3: 言語トグルで footer/title が切替わる', () => {
  const { doc } = boot('ja-JP');
  const footerJa = doc._byId.footer.textContent;
  const titleJa = doc._byId.tableTitle.textContent;
  assert.match(doc._byId.lang.textContent, /EN/); // ja時はトグルにENと出る
  doc._byId.lang.click(); // → en へ
  assert.notEqual(doc._byId.footer.textContent, footerJa);
  assert.notEqual(doc._byId.tableTitle.textContent, titleJa);
  assert.equal(doc._byId.lang.textContent, '日本語');
});

// === REQ-I18N-3: navigator.language=en は英語起動 ===
test('REQ-I18N-3: 非ja ロケールは英語で起動', () => {
  const { doc } = boot('en-US');
  assert.match(doc._byId.lang.textContent, /日本語/); // en時はトグルに日本語と出る
  assert.match(doc._byId.footer.textContent, /single HTML file/);
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
