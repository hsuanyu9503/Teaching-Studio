# TECH｜系統架構與技術決策

> 版本：T0.1（Stage 0 提案）　｜　最近更新：2026-11-15　｜　維護者：Claude　｜　**重要選型需經 Stage 0 審查核准**

## 1. 目前技術基底

- 架構：純前端 SPA（多入口：`index.html` 工作台、`diagnostics.html` Stage 0 驗證頁）；無後端、無資料庫、無帳號。
- 語言／框架：TypeScript 6 + React 19，Vite 8 建置。
- PDF：PDF.js（`pdfjs-dist`），worker 以 Vite `?url` 匯入並隨 build 輸出雜湊檔名。
- 部署：GitHub Pages（GitHub Actions 部署；合併 `main` 後自動部署，沿用 Starter Kit `pages.yml`）。
- 執行環境：**Node.js 24 LTS + npm 11.12.1**（見 §4）。
- 測試：Vitest（單元／元件，jsdom）、Playwright（e2e，對 production preview）、Node test runner（Starter Kit 治理規則）。

## 2. 指令

| 指令 | 用途 |
|---|---|
| `npm ci` | 依 `package-lock.json` 安裝（需 npm 11） |
| `npm run dev` | 開發伺服器 `http://localhost:5173/Teaching-Studio/` |
| `npm run check` | Starter Kit 結構檢查＋本專案隱私／安全規則（`scripts/check.mjs`） |
| `npm run lint` | ESLint（含禁止 HTML 注入、eval 規則） |
| `npm run typecheck` | `tsc -b` 型別檢查（app／test／node 三組設定） |
| `npm test` | Vitest 單元測試＋治理規則測試 |
| `npm run build` | 型別檢查後以 `base=/Teaching-Studio/` 建置至 `dist/` |
| `npm run e2e` | Playwright 對 `vite preview` 執行；`E2E_WEBKIT=1` 加跑 WebKit iPad 模擬 |
| `npm run review:packet` | 匯出固定 Head SHA 審查證據包（Starter Kit） |

## 3. 技術選型與依賴（提案）

選版原則：採**目前主線**的穩定版本，且發布已滿約兩週；以 `--save-exact` 固定版本，並提交 lockfile。2026-11-15 查詢 npm registry。

### 3.1 執行期依賴（會進入網站）

| 套件 | 版本 | 授權 | 發布日 | 用途／理由 |
|---|---|---|---|---|
| `react`、`react-dom` | 19.3.1 | MIT | 2026-10-14 | UI 框架（SPEC §16 建議） |
| `pdfjs-dist` | 6.5.438 | Apache-2.0 | 2026-11-01 | 本機 PDF 解析與渲染；Mozilla 維護 |

`npm audit --omit=dev`：**0 個漏洞**（2026-11-15）。

### 3.2 開發依賴

| 套件 | 版本 | 授權 | 備註 |
|---|---|---|---|
| `typescript` | 6.0.3 | Apache-2.0 | 未採 7.0：`typescript-eslint` 目前只支援 `<6.1` |
| `vite` | 8.3.5 | MIT | |
| `@vitejs/plugin-react` | 6.1.2 | MIT | |
| `vitest` | 5.0.5 | MIT | 需 npm 11 安裝（§4） |
| `jsdom` | 30.1.3 | MIT | |
| `@testing-library/react`／`jest-dom` | 16.3.3／7.0.1 | MIT | |
| `@playwright/test` | 1.63.0 | Apache-2.0 | 與開發環境預裝瀏覽器版本一致 |
| `eslint`、`@eslint/js` | 10.14.0、10.0.1 | MIT | |
| `typescript-eslint` | 8.72.1 | MIT | |
| `eslint-plugin-react-hooks` | 7.1.1 | MIT | |
| `globals`、`@types/*` | — | MIT | |

**已知開發依賴風險**：`npm audit` 回報 1 項中度公告（計為 8 個套件，皆在 `typescript-eslint` 依賴鏈中）：`minimatch` ReDoS（GHSA-g3hv-75wg-m249），目前相容範圍內無修正版。僅影響本機／CI 的 lint 工具，不進入網站建置；列入追蹤，待上游修正後升級。

### 3.3 後續階段預定依賴（Stage 0 不安裝）

| 用途 | 建議 | 理由 | 階段 |
|---|---|---|---|
| QR Code | `qrcode-generator` 2.0.4（MIT，無相依套件） | 純本機產生、可輸出至 canvas／PNG、可指定錯誤修正等級與留白；不呼叫任何外部 API（SPEC §14.3）。備選 `qrcode` 1.5.4 最後發布 2024-08 且有相依套件 | Stage 3，安裝前再確認版本 |
| 狀態管理 | 不另裝套件；`useSyncExternalStore` 自建輕量 store | 見 `STATE_ARCHITECTURE.md` §1 | Stage 1 起 |
| 拖曳排序 | 先評估原生 Pointer Events 自行實作（需同時支援觸控與非拖曳替代操作） | 避免大型依賴；若可及性或觸控品質不足再提案 | Stage 1 |

## 4. Node 24 + npm 11 的決策與證據

- 實測：npm 10.9.9（Node 22 內建）安裝 `vitest` ≥4.1 時 arborist 當機（`Cannot read properties of null (reading 'edgesOut')`，於解析 `@vitest/browser-*` 選用 peer 時發生）；空白專案亦可重現，npm 11 正常。
- npm 11 產生的 lockfile 以 npm 10 執行 `npm ci` 會因 `@emnapi/*` 項目判定不同步而失敗，因此**不可混用**。
- `vitest` 4.0.x 雖可用 npm 10 安裝，但只支援 Vite ≤7，會造成兩份 Vite。
- 決策：本機與 CI 統一 **Node 24 LTS + npm 11.12.1**（CI 以 `npm install -g npm@11.12.1` 固定）。`package.json` `engines.node` 為 `>=22.13`（pdfjs-dist 要求）。
- 影響：使用者若在自己的電腦開發，需安裝 Node 24 LTS（內建 npm 11）。

## 5. 目錄結構

```text
index.html / diagnostics.html   Vite 入口（相對路徑引用 ./src/...）
public/samples/                  診斷用範例 PDF（scripts/make_sample_pdf.py 產生）
src/app/                         應用入口、全域樣式（Stage 0 為佔位畫面）
src/features/materials/          教材清單與狀態（Stage 1）
src/features/players/            播放器共用型別、能力矩陣、embed/ 網址驗證
src/features/timer|picker|qrcode/ 課堂工具（Stage 3）
src/features/presentation/       展示／全螢幕管理（Stage 1、4）
src/components|hooks|utils/      共用（有需要才建立內容）
src/diagnostics/                 Stage 0 技術驗證頁（非正式功能，Stage 5 前決定是否保留）
tests/e2e/                       Playwright
tests/governance/                Starter Kit 治理規則測試
scripts/                         check、審查包、發布打包（Starter Kit）
```

空目錄以 `.gitkeep` 保留，不預先建立抽象層（SPEC §16）。

## 6. 部署與 PDF.js

### 6.1 GitHub Pages

- 專案站台網址：`https://hsuanyu9503.github.io/Teaching-Studio/`；`vite.config.ts` 預設 `base: '/Teaching-Studio/'`，可用 `VITE_BASE` 覆寫（自訂網域時設為 `/`）。
- 只有 Vite 處理後的 HTML 使用 `/Teaching-Studio/` 絕對路徑；原始 HTML 使用相對路徑；`npm run check` 會在建置後確認 `dist/*.html` 不引用 base 以外的根路徑。
- 不使用前端路由（避免 Pages 無 SPA fallback 導致重新整理 404）；工作台為單頁狀態切換。
- 部署流程沿用 Starter Kit：`pages.yml` 於 `main` push 時 `npm ci → check → test → build → check → deploy`。
- **目前狀態：Repository 的 Pages 設定為「Deploy from a branch」**（存在 `pages-build-deployment` 動態工作流程），必須改為「GitHub Actions」，否則合併後會直接發布原始碼而非 `dist/`。見 `STAGE0_REPORT.md` §6。

### 6.2 PDF.js worker

- 匯入方式：`import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'`，設定 `GlobalWorkerOptions.workerSrc`；建置輸出 `assets/pdf.worker.min-<hash>.mjs`（約 1.27 MB，未 gzip）。
- 驗證方式：`diagnostics.html` 建立明確的 `PDFWorker`，以 `worker.port instanceof Worker` 區分真正 Web Worker 與主執行緒 fake worker，並回報 worker HTTP 狀態與 Content-Type；e2e 額外檢查 canvas 實際像素。
- 風險：模組 worker 需要 JavaScript MIME。GitHub Pages 對 `.mjs` 的 Content-Type **需在正式網址確認**（驗證頁會顯示）。若不正確，備案為建置時將 worker 改名為 `.js`。
- **Stage 1 待辦**：`pdfjs-dist` 另附 `cmaps/`、`standard_fonts/`、`wasm/`。未嵌入字型的中文（CJK）PDF 需要 cMap 才能正確顯示，JPEG2000 等影像需要 wasm 解碼器。Stage 1 須將這些資料夾複製到 `dist/`（例如 `dist/pdfjs/`），並設定 `cMapUrl`、`standardFontDataUrl`、`wasmUrl`，以含中文的實際教材驗證。
- **相容性待驗證**：`pdfjs-dist` 6 的現代版建置需要較新的瀏覽器。若 iPad Safari 實機（驗證頁會顯示 User-Agent）無法執行，Stage 1 改用 `pdfjs-dist/legacy/build/pdf.mjs`。

## 7. 安全基線（SPEC §17.1）

已在 Stage 0 以工具強制：

- ESLint：禁止 `dangerouslySetInnerHTML`、`innerHTML`／`outerHTML` 指派、`insertAdjacentHTML`、`eval`、`new Function`。
- `scripts/check.mjs`：禁止 `localStorage`／`sessionStorage`／`indexedDB`、外部 QR Code API 與常見分析服務網域、HTML 注入、動態執行；禁止機密檔名。
- 嵌入網址：白名單主機完整比對、只接受 https、拒絕帳密與自訂連接埠、HTML 只經 DOMParser 讀取 iframe src、系統自行建立 iframe。

尚未處理（提案於 Stage 2）：Content-Security-Policy（`frame-src` 白名單、`script-src 'self'`、`worker-src 'self'`）。GitHub Pages 無法設定 HTTP 標頭，只能用 `<meta http-equiv>`；需與 Vite 開發模式、PDF.js wasm 的相容性一併驗證後再加入。

## 8. 技術變更提案

| 日期 | 需求 | 提案 | 影響範圍 | 風險 | 核准 |
|---|---|---|---|---|---|
| 2026-11-15 | Stage 0 技術基線 | §3 依賴版本、§4 Node 24／npm 11、§6 部署方式 | 全專案 | 依賴升級風險；npm 版本綁定 | 待核准 |
| 2026-11-15 | 狀態架構 | `STATE_ARCHITECTURE.md` | Stage 1–4 | — | 待核准 |
| 2026-11-15 | 嵌入 iframe 策略 | 切換教材時卸載非作用中 iframe（不保留第三方進度） | Stage 2 | 失去第三方進度，但避免背景播放聲音 | 待 Stage 2 實測後核准 |

## 9. 已知限制

- 純前端：無法儲存課程、無跨裝置同步（第一版範圍外）。
- 跨網域嵌入：工作台無法翻頁、讀頁碼、縮放內容；焦點在 iframe 內時鍵盤事件不會傳到工作台。
- GitHub Pages 無法自訂 HTTP 標頭（CSP、COOP 等只能有限度用 meta 設定）。
