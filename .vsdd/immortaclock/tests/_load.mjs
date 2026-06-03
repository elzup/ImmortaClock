import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const HTML_PATH = resolve(here, '..', '..', '..', 'index.html');
export const html = readFileSync(HTML_PATH, 'utf8');

export function scriptText() {
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('no <script> in index.html');
  return m[1];
}

// document 未注入で実行 → 純粋ロジックのみ。global.ImmortaClock に露出される。
export function loadCore() {
  new Function(scriptText())();
  const C = globalThis.ImmortaClock;
  if (!C) throw new Error('ImmortaClock not exported');
  return C;
}
