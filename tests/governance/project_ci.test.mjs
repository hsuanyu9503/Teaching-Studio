import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = (p) => readFile(new URL(`../../${p}`, import.meta.url), 'utf8');

test('CI 必要檢查名稱為 validate，且執行完整檢查與 e2e', async () => {
  const ci = await read('.github/workflows/ci.yml');
  assert.match(ci, /\n {2}validate:\n/);
  assert.match(ci, /pull_request:/);
  assert.match(ci, /permissions:\s*\n\s*contents: read/);
  for (const cmd of ['npm ci', 'npm run check', 'npm run lint', 'npm run typecheck', 'npm test', 'npm run build', 'npm run e2e']) {
    assert.ok(ci.includes(`run: ${cmd}`), cmd);
  }
  assert.match(ci, /node-version: '24'/);
  assert.match(ci, /npm@11\.12\.1/);
});

test('Pages 只部署 Vite 建置輸出 dist，且建置前安裝 lockfile 依賴', async () => {
  const pages = await read('.github/workflows/pages.yml');
  assert.match(pages, /run: npm ci/);
  assert.match(pages, /path: dist/);
  assert.match(pages, /github\.ref == 'refs\/heads\/main'/);
});

test('Vite base 對應 GitHub Pages repository 子路徑', async () => {
  const cfg = await read('vite.config.ts');
  assert.match(cfg, /'\/Teaching-Studio\/'/);
});

test('CLAUDE.md 規定分階段開發，未驗收不得進入下一階段', async () => {
  const s = await read('CLAUDE.md');
  assert.match(s, /不得開始下一個 Stage/);
  assert.match(s, /不得直接修改、強制推送或自行合併 `main`/);
});

test('不使用外部 QR API 或分析服務的依賴', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const deps = Object.keys(pkg.dependencies ?? {});
  assert.deepEqual(deps.sort(), ['pdfjs-dist', 'react', 'react-dom']);
});
