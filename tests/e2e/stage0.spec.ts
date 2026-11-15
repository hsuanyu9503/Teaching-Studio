import { expect, test } from '@playwright/test';

// 針對 production build（vite preview，base = /Teaching-Studio/）執行。
// 注意：通過代表本機 preview 可用，不代表 GitHub Pages 正式環境已驗證（SPEC §17.2）。

test('入口頁在子路徑下載入，且不出現 console 錯誤', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const res = await page.goto('./');
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Teaching Studio');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');
  expect(errors).toEqual([]);
});

test('從入口頁連到驗證頁（相對路徑）', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: /技術驗證頁/ }).click();
  await expect(page).toHaveURL(/\/Teaching-Studio\/diagnostics\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Stage 0');
});

test('PDF.js worker 以真正的 Web Worker 載入並渲染範例 PDF', async ({ page }) => {
  const workerRequests: { url: string; status: number; type: string | undefined }[] = [];
  page.on('response', (r) => {
    if (r.url().includes('pdf.worker')) workerRequests.push({ url: r.url(), status: r.status(), type: r.headers()['content-type'] });
  });
  await page.goto('./diagnostics.html');
  await page.getByRole('button', { name: '執行 PDF.js 檢查' }).click();
  const result = page.getByTestId('pdf-result');
  await expect(result).toHaveAttribute('data-status', 'pass', { timeout: 20_000 });
  await expect(page.getByTestId('pdf-real-worker')).toHaveText('Web Worker');

  // worker 路徑必須位於 /Teaching-Studio/assets/，並以 JavaScript MIME 提供
  expect(workerRequests.length).toBeGreaterThan(0);
  for (const w of workerRequests) {
    expect(w.url).toMatch(/\/Teaching-Studio\/assets\/pdf\.worker\.min-[\w-]+\.mjs$/);
    expect(w.status).toBe(200);
    expect(w.type).toMatch(/javascript/);
  }

  // 實際像素：第 1 頁中央為藍色方塊（非白底、非空白 canvas）
  const pixel = await page.getByTestId('pdf-canvas').evaluate((c: HTMLCanvasElement) => {
    const ctx = c.getContext('2d')!;
    return Array.from(ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data);
  });
  const [r, g, b] = pixel as [number, number, number, number];
  expect(b).toBeGreaterThan(150);
  expect(r).toBeLessThan(100);
  expect(g).toBeLessThan(150);
});

test.describe('嵌入來源驗證（不連線外部網站）', () => {
  test.beforeEach(async ({ page }) => {
    // 測試只驗證本機行為；阻擋所有外部請求，避免 CI 依賴第三方網站。
    await page.route(/^https:\/\/(?!localhost)/, (route) => route.abort());
    await page.goto('./diagnostics.html');
  });

  for (const bad of [
    'javascript:alert(1)',
    '<script>alert(1)</script>',
    'https://evil.example/https://www.canva.com/design/DAGabc1234/XyZ_tok-en9/view',
    'https://1drv.ms/p/s!Abc123',
  ]) {
    test(`拒絕且不建立 iframe：${bad}`, async ({ page }) => {
      let dialog = false;
      page.on('dialog', async (d) => { dialog = true; await d.dismiss(); });
      await page.getByLabel('嵌入程式碼或網址').fill(bad);
      await page.getByRole('button', { name: '驗證並載入' }).click();
      await expect(page.getByTestId('embed-result')).toHaveAttribute('data-status', 'rejected');
      await expect(page.locator('iframe')).toHaveCount(0);
      expect(dialog).toBe(false);
    });
  }

  test('接受 Canva 嵌入程式碼，iframe 屬性由系統決定；調整寬度不重建 iframe', async ({ page }) => {
    const code = '<div><iframe onload="alert(1)" sandbox="allow-top-navigation" src="https://www.canva.com/design/DAGabc1234/XyZ_tok-en9/view?embed"></iframe></div>';
    await page.getByLabel('嵌入程式碼或網址').fill(code);
    await page.getByRole('button', { name: '驗證並載入' }).click();
    await expect(page.getByTestId('embed-result')).toHaveAttribute('data-status', 'accepted');
    const frame = page.locator('iframe');
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute('src', 'https://www.canva.com/design/DAGabc1234/XyZ_tok-en9/view?embed');
    const sandbox = await frame.getAttribute('sandbox');
    expect(sandbox).not.toContain('allow-top-navigation');
    expect(await frame.getAttribute('onload')).toBeNull();

    const handle = await frame.elementHandle();
    await page.getByRole('button', { name: /切換容器寬度/ }).click();
    await expect(page.getByRole('button', { name: /切換容器寬度/ })).toContainText('60%');
    // 同一個 DOM 節點（未重新掛載）
    expect(await handle!.evaluate((el) => el.isConnected)).toBe(true);
  });
});
