import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cegTool = process.env.CEG_TOOL ?? resolve(here, '..', 'ceg.mjs');
const specsDir = resolve(here, '..', 'specs');

test('CEG: graph is consistent (no missing deps, no cycles)', () => {
  const r = spawnSync('node', [cegTool, 'validate', '--specs', specsDir], { encoding: 'utf8' });
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
});
