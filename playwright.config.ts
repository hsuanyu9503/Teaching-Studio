import { defineConfig, devices } from '@playwright/test';

// 對 production build（vite preview）測試，路徑包含 GitHub Pages 子路徑 /Teaching-Studio/。
const base = process.env.VITE_BASE ?? '/Teaching-Studio/';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:4173${base}`,
    trace: 'off',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    // WebKit 引擎近似 iPad Safari，但不能取代實機驗收（SPEC §4.1）。CI 才安裝 WebKit。
    ...(process.env.E2E_WEBKIT ? [{ name: 'webkit-ipad', use: { ...devices['iPad (gen 7)'] } }] : []),
  ],
  webServer: {
    command: 'npm run preview',
    url: `http://localhost:4173${base}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
