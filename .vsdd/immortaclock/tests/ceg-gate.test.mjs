import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadCore } from './_load.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cegTool = process.env.CEG_TOOL ?? resolve(here, '..', 'ceg.mjs');
const specsDir = resolve(here, '..', 'specs');

const cegDepsCount = (id) => {
  const r = spawnSync('node', [cegTool, 'deps', id, '--specs', specsDir], { encoding: 'utf8' });
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
  const m = r.stdout.match(/\((\d+)\)/);
  assert.ok(m, `deps 出力を parse できない: ${id}\n${r.stdout}`);
  return Number(m[1]);
};

test('CEG: graph is consistent (no missing deps, no cycles)', () => {
  const r = spawnSync('node', [cegTool, 'validate', '--specs', specsDir], { encoding: 'utf8' });
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
});

// === PROP-FL-3: アプリの FEATURES.deps が CEG の推移的依存数と一致する (coherence) ===
test('CEG↔FEATURES: 各機能の宣言依存数が ceg.mjs deps と一致', () => {
  const C = loadCore();
  for (const f of C.FEATURES) {
    const actual = cegDepsCount(f.specId);
    assert.equal(f.deps, actual, `${f.specId}: 宣言 ${f.deps} != CEG ${actual}`);
  }
});
