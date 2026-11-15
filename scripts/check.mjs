// Teaching Studio 結構與安全基線檢查（沿用 Starter Kit V1.2 scripts/check.mjs，改寫為 React + Vite 架構）。
// 這是基礎檢查，不是完整安全稽核。
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fail = (msg) => { console.error(`檢查失敗：${msg}`); process.exitCode = 1; };

// 1. Starter Kit 必要治理文件 + 本專案必要文件
const required = [
  'README.md', 'QUICKSTART.md', 'CLAUDE.md',
  'docs/SPEC.md', 'docs/PROJECT_SPEC_V1.0.md', 'docs/DESIGN.md', 'docs/TECH.md', 'docs/HANDOFF.md',
  'docs/WORKFLOW.md', 'docs/DATA_SAFETY.md', 'docs/RELEASE_AUTOMATION.md', 'docs/CODE_REVIEW.md',
  'docs/RISK_POLICY.md', 'docs/REVIEW_LOG.md', 'docs/PLAYER_CAPABILITIES.md', 'docs/STATE_ARCHITECTURE.md',
  'docs/EMBED_FEASIBILITY.md', 'docs/STAGE0_REPORT.md',
  'templates/CHATGPT_TO_CLAUDE.md', 'templates/CLAUDE_TO_CHATGPT.md', 'templates/CLAUDE_GITHUB_TASK.md',
  'templates/CHATGPT_CODE_REVIEW.md', 'templates/CHATGPT_REVIEW_REQUEST.md',
  'templates/REVIEW_FIX_HANDOFF.md', 'templates/CLAUDE_REVIEW_RESPONSE.md',
  'scripts/export_review_packet.py', 'scripts/package_release.py', 'scripts/verify_release.py',
  '.github/workflows/ci.yml', '.github/workflows/pages.yml', '.github/workflows/release.yml',
  'package-lock.json', 'index.html', 'vite.config.ts', 'src/main.tsx',
];
for (const f of required) {
  try { await stat(join(root, f)); } catch { fail(`缺少必要檔案 ${f}`); }
}

// 2. HTML 入口：繁中、viewport、不使用根路徑資源（GitHub Pages 子路徑）
for (const html of ['index.html', 'diagnostics.html']) {
  const text = await readFile(join(root, html), 'utf8');
  if (!text.includes('lang="zh-Hant"')) fail(`${html} 請設定 lang="zh-Hant"`);
  if (!text.includes('name="viewport"')) fail(`${html} 缺少 viewport`);
  if (/\b(?:src|href)\s*=\s*["']\/(?!\/)/i.test(text)) fail(`${html} 使用根路徑資源，可能破壞 GitHub Pages 子路徑部署`);
}

// 3. 原始碼隱私與安全規則（SPEC §6.4、§14.3、§17.1）
async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}
const srcFiles = (await walk(join(root, 'src'))).filter((f) => /\.(?:ts|tsx|js|jsx|css|html)$/.test(f));
const isTest = (f) => /\.test\.tsx?$/.test(f) || f.includes(`${join('src', 'test')}`);
const rules = [
  // 預設不永久保存教材、學生名單、網址；如日後需要，須經核准後加入白名單。
  { re: /\b(?:localStorage|sessionStorage|indexedDB)\b/, msg: '不得預設使用瀏覽器永久儲存（SPEC §6.4、§17.1）' },
  // 不使用外部 QR Code API、分析服務。
  { re: /api\.qrserver\.com|chart\.googleapis\.com|quickchart\.io|google-analytics|googletagmanager|gtag\(|plausible\.io|clarity\.ms/i, msg: '不得連線外部 QR Code API 或分析服務（SPEC §14.3、§17.1）' },
  { re: /dangerouslySetInnerHTML|\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|document\.write\(/, msg: '不得直接注入 HTML（SPEC §17.1）' },
  { re: /\beval\(|new Function\(/, msg: '不得動態執行程式碼（SPEC §17.1）' },
];
for (const file of srcFiles) {
  if (isTest(file)) continue;
  const text = await readFile(file, 'utf8');
  for (const { re, msg } of rules) if (re.test(text)) fail(`${relative(root, file)}：${msg}`);
}

// 4. 不可提交機密檔名
const tracked = [...await walk(join(root, 'src')), ...await walk(join(root, 'public'))];
for (const f of tracked) {
  if (/(?:^|[\\/])\.env(?:\.|$)|secret|credential|\.pem$|\.key$/i.test(relative(root, f))) fail(`可疑機密檔名：${relative(root, f)}`);
}

// 5. 若已建置，檢查 dist 內 HTML 只引用 base 路徑下的資源
try {
  const base = process.env.VITE_BASE ?? '/Teaching-Studio/';
  for (const html of ['index.html', 'diagnostics.html']) {
    const text = await readFile(join(root, 'dist', html), 'utf8');
    for (const m of text.matchAll(/\b(?:src|href)\s*=\s*["'](\/[^"']*)["']/gi)) {
      if (!m[1].startsWith(base)) fail(`dist/${html} 引用了 base（${base}）以外的根路徑：${m[1]}`);
    }
  }
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
  console.log('（略過 dist 檢查：尚未建置）');
}

if (!process.exitCode) {
  console.log(`檢查通過：${required.length} 個必要檔案、HTML 入口、${srcFiles.length} 個原始碼檔案的隱私／安全規則。`);
  console.log('注意：這是基礎結構檢查，不是完整安全稽核。');
}
