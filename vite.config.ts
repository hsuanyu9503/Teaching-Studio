/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 專案站台路徑：https://<owner>.github.io/Teaching-Studio/
// 可用 VITE_BASE 覆寫（例如自訂網域時設為 "/"）。必須以 "/" 開頭與結尾。
const base = process.env.VITE_BASE ?? '/Teaching-Studio/';
if (!base.startsWith('/') || !base.endsWith('/')) {
  throw new Error(`VITE_BASE 必須以 "/" 開頭與結尾，目前為：${base}`);
}

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        diagnostics: resolve(import.meta.dirname, 'diagnostics.html'),
      },
    },
  },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    restoreMocks: true,
  },
});
