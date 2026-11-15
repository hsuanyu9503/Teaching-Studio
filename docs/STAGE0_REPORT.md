# Stage 0 交付報告｜初始化與技術基線

> 狀態：**待審查**（使用者＋ChatGPT）｜日期：2026-11-15｜分支：`claude/peaceful-euler-jpfp04`
> PR、Commit 與 CI 資訊見 §10 與 `docs/HANDOFF.md`。
> 規則：「已通過」只列實際執行並有輸出的項目；未執行、僅人工檢視、需使用者操作的項目分開列出。

## 1. 本階段開發目標（SPEC §18 Stage 0）

建立可持續開發、測試、部署與審查的專案基礎；確認技術選型；建立能力矩陣與狀態架構；評估 PDF.js worker 部署；提供 PowerPoint／Canva 嵌入最小可行性驗證方式；建立測試與 CI 基線。**不實作 Stage 1–5 功能。**

## 2. Repository 與環境檢查結果（§21 第 1、2 項）

| 項目 | 實際狀態（2026-11-15 檢查） | 證據 |
|---|---|---|
| `hsuanyu9503/Teaching-Studio` | 公開；`main` 只有 1 個 commit `02d3bfe`（"Create 6"），內含一個只有換行字元的檔案 `6`；**沒有 Starter Kit 文件** | `git log`、檔案列表 |
| Starter Kit V1.2 | 位於另一個 repository `hsuanyu9503/AI-Web-Starter-Kit-V1-2`（`main` = `e5c91f1`），以唯讀方式取得並導入本專案 | `git rev-parse HEAD` |
| `main` 分支保護 | **未啟用**（GitHub API：`protected: false`） | `list_branches` |
| GitHub Pages | **已啟用，但來源為「Deploy from a branch」**（存在 `pages-build-deployment` 動態工作流程，2026-11-16 00:18 +08:00 建立）。Starter Kit 要求「GitHub Actions」 | `actions/workflows` |
| GitHub Actions 工作流程 | 本 PR 之前無任何自訂 workflow | 同上 |
| 開發分支 | `claude/peaceful-euler-jpfp04`（Claude Code 雲端分支，符合 Kit `claude/*` 規範） | `git branch` |
| Claude 開發環境 | Node 22.23.4／npm 10.9.9（另以 npx 使用 npm 11.12.1）、Python 3.13、Playwright 1.63 + Chromium（**無 WebKit**） | 指令輸出 |
| 外部網路 | npm registry 可用；`www.canva.com`、`support.microsoft.com` **被網路政策阻擋** | WebFetch 錯誤 |
| 帳號權限 | Claude 可推送本 repository 的開發分支、建立 PR；**無法**變更 repository 設定（Pages、Rulesets） | — |

## 3. 實際完成內容（§21 第 3–8 項）

| 項目 | 成果 |
|---|---|
| 需求與範圍整理 | `docs/PROJECT_SPEC_V1.0.md`（原文）、`docs/SPEC.md`（F-001～F-015、情境對照、範圍外清單、不可變更條件） |
| 技術選型與依賴 | `docs/TECH.md` §3–4：React 19.3.1、TypeScript 6.0.3、Vite 8.3.5、pdfjs-dist 6.5.438、Vitest 5.0.5、Playwright 1.63.0 等，版本固定並提交 lockfile；QR 函式庫建議 `qrcode-generator`（Stage 3 才安裝） |
| 專案基線 | React + TS + Vite 多入口（`index.html` 佔位畫面、`diagnostics.html` 驗證頁）、ESLint、三組 tsconfig、Vitest、Playwright、`base=/Teaching-Studio/` |
| 目錄結構 | `src/app`、`src/features/{materials,players,timer,picker,qrcode,presentation}`、`components`、`hooks`、`utils`、`tests/{e2e,governance}`；尚無內容者以 `.gitkeep` 保留 |
| 播放器能力矩陣 | `docs/PLAYER_CAPABILITIES.md` + `src/features/players/types.ts`，兩者由測試比對；未驗證能力 `❓` 一律視同不支援 |
| 狀態架構 | `docs/STATE_ARCHITECTURE.md`：五領域 store、PlayerState 與實例分離、不重新掛載規則、PDF 資源策略、iframe 策略選項、計時以時間戳記、抽籤公平性與耗盡處理、Escape 優先順序 |
| 嵌入可行性驗證方式 | `docs/EMBED_FEASIBILITY.md` + `diagnostics.html` 嵌入檢查（白名單驗證、系統建立 iframe、sandbox 比較、寬度切換不重載、load≠可用） |
| Pages／worker 驗證方式 | `docs/TECH.md` §6 + `diagnostics.html` PDF.js 檢查（真 worker／fake worker 區分、HTTP 與 MIME、渲染耗時、User-Agent） |
| Starter Kit 導入 | `CLAUDE.md`（加專案補充）、`docs/`、`templates/`、`.github/`（CI／Pages／Release／PR 模板／Issue 模板）、`scripts/`（審查包、打包、驗證）、治理測試；改寫為 Vite 架構 |
| 安全基線 | ESLint 禁止 HTML 注入與 eval；`scripts/check.mjs` 禁止永久儲存、外部 QR／分析服務、機密檔名、dist 根路徑錯誤 |

## 4. 變更檔案與模組摘要

| 路徑 | 類型 | 說明 |
|---|---|---|
| `package.json`、`package-lock.json` | 新增 | 依賴與指令；版本固定 |
| `vite.config.ts`、`tsconfig*.json`、`eslint.config.js`、`playwright.config.ts` | 新增 | 建置、型別、lint、e2e 設定 |
| `index.html`、`diagnostics.html` | 新增 | 入口（相對路徑） |
| `src/app/*` | 新增 | Stage 0 佔位畫面、全域樣式（暫定 Tokens）、測試 |
| `src/features/players/types.ts`(+test) | 新增 | 播放器介面、能力矩陣 |
| `src/features/players/embed/embedSource.ts`(+test) | 新增 | 嵌入網址白名單驗證（Stage 0 驗證用，Stage 2 擴充） |
| `src/diagnostics/*` | 新增 | Stage 0 技術驗證頁 |
| `public/samples/stage0-sample.pdf`、`scripts/make_sample_pdf.py` | 新增 | 可重現的診斷用 PDF（無個資） |
| `scripts/check.mjs` | 改寫 | 由 Kit 版改為 Vite 架構＋隱私規則 |
| `scripts/export_review_packet.py`、`verify_release.py` | 沿用 | Kit 原檔 |
| `scripts/package_release.py` | 沿用（1 行） | `website_source` 描述改為 `vite build -> dist/` |
| `.github/workflows/ci.yml` | 改寫 | `validate`：npm ci → check → lint → typecheck → test → build → check → e2e（Chromium＋WebKit） |
| `.github/workflows/pages.yml`、`release.yml` | 小幅修改 | Node 24、npm 11、`npm ci`；觸發條件與權限不變 |
| `tests/e2e/stage0.spec.ts`、`tests/governance/*` | 新增／沿用 | e2e；Kit 治理測試（路徑調整）＋專案 CI 規則測試 |
| `docs/*`、`templates/*`、`CLAUDE.md`、`README.md`、`QUICKSTART.md` | 新增 | 規格、架構、Kit 文件 |

未刪除既有檔案 `6`（見 §6 C-6）。

## 5. 重要架構決策（待核准）

1. **Node 24 LTS + npm 11.12.1**：npm 10 無法安裝 vitest ≥4.1（已重現 arborist 錯誤），且 npm 10／11 lockfile 不相容。詳見 `TECH.md` §4。
2. **TypeScript 6.0**（非 7.0）：配合 typescript-eslint 支援範圍。
3. **不引入狀態管理套件**：各領域 store + `useSyncExternalStore`。
4. **多入口建置**：診斷頁與工作台分開，驗證頁不混入正式功能。
5. **不使用前端路由**：避免 GitHub Pages 重新整理 404。
6. **嵌入能力保守宣告**：PowerPoint／Canva 不宣稱任何工作台控制能力；進度保留標示未驗證。
7. **嵌入 iframe 預設策略（提案）**：切換教材時卸載非作用中 iframe，避免背景聲音（Stage 2 實測後決定）。

## 6. 可執行項目、需使用者協助的設定、未驗證假設（§21 第 10 項）

### A. Claude 已執行

見 §3、§7。

### B. 需要使用者在 GitHub 設定（Claude 無權限）

| # | 設定 | 位置 | 時機 |
|---|---|---|---|
| B-1 | Pages 來源改為 **GitHub Actions** | Settings → Pages → Build and deployment → Source | **合併本 PR 之前**；否則合併後「Deploy from a branch」會直接發布未建置的原始碼 |
| B-2 | `github-pages` environment 限制只允許 `main` 部署 | Settings → Environments → github-pages | B-1 後 |
| B-3 | `main` Ruleset：要求 PR、禁止 force push、要求狀態檢查 `validate` | Settings → Rules → Rulesets | 本 PR 的 CI 成功執行一次後（`validate` 才會出現在選單）；單人 repository 不要要求另一位審查者 |
| B-4 | 確認 Actions 權限允許 workflow 執行與 Pages 部署 | Settings → Actions → General | B-1 時一併確認 |

### C. 需要使用者操作或決定

| # | 項目 |
|---|---|
| C-1 | 審查本 PR 與 Stage 0 文件；確認風險等級（Claude 初評 L3，見 §9） |
| C-2 | 合併後，在正式網址 `https://hsuanyu9503.github.io/Teaching-Studio/diagnostics.html` 以 **Windows Chrome、Edge、iPad Safari** 各執行一次 PDF.js 檢查並截圖 |
| C-3 | 依 `EMBED_FEASIBILITY.md` §3 以實際 PowerPoint／Canva 測試教材驗證並填寫 §4 結果表 |
| C-4 | 決定：Escape 是否可直接退出展示模式（`STATE_ARCHITECTURE.md` §4 優先 4） |
| C-5 | 決定：`view.officeapps.live.com` Office 檢視器是否列入第一版（目前不支援） |
| C-6 | 決定：`main` 上的空白檔案 `6` 是否刪除（看起來是建立 repository 時的佔位檔；本 PR 未動它） |

### D. 尚未驗證的假設

| # | 假設 | 驗證方式 |
|---|---|---|
| D-1 | PowerPoint／Canva 嵌入網址格式（`EMBED_FEASIBILITY.md` §2） | C-3 |
| D-2 | 嵌入內容在 restricted sandbox 下可用；原生控制、動畫、影音、全螢幕的支援程度 | C-3 |
| D-3 | GitHub Pages 以 JavaScript MIME 提供 `.mjs` worker | C-2（驗證頁顯示 Content-Type） |
| D-4 | pdfjs-dist 6 現代版建置可在使用者的 iPad Safari 版本執行 | C-2；失敗則 Stage 1 改用 legacy build |
| D-5 | WebKit（Playwright iPad 模擬）e2e 通過 | CI（本環境無 WebKit，未在本機執行） |
| D-6 | 以 `Date.now()` 計時在 iPad 休眠恢復後正確 | Stage 3 實機 |
| D-7 | CJK PDF 在設定 cMap 後正確顯示 | Stage 1 |

## 7. 自動化測試結果（本機）

執行環境：Linux 容器、Node 22.23.4、npm 11.12.1（npx）、Chromium（Playwright 1.63）。Node 24 環境由 CI 執行。

| 測試 | 結果 | 證據 |
|---|---|---|
| `npm ci`（npm 11.12.1，乾淨安裝） | 通過 | 見 PR 說明輸出摘要 |
| `npm run check`（建置前／後） | 通過 | 同上 |
| `npm run lint` | 通過（0 問題） | 同上 |
| `npm run typecheck` | 通過 | 同上 |
| `npm test`：Vitest | 通過（3 檔、27 項） | 同上 |
| `npm test`：治理規則 | 通過（11 項） | 同上 |
| `npm run build` | 通過 | 同上 |
| `npm run e2e`（Chromium） | 通過（8 項） | 同上 |
| `npm run e2e`（WebKit iPad 模擬） | **未在本機執行**（無 WebKit）；由 CI 執行 | CI `validate` |
| `npm audit --omit=dev` | 0 個漏洞 | — |
| 能力矩陣文件一致性測試的有效性 | 已以刻意修改文件確認測試會失敗，再還原 | — |

e2e 涵蓋：子路徑入口頁無 console 錯誤；相對路徑導覽；PDF.js 以真 Web Worker 載入、worker 位於 `/Teaching-Studio/assets/` 且為 JavaScript MIME、canvas 中央像素為藍色；拒絕 `javascript:`、`<script>`、仿冒網域、`1drv.ms` 且不建立 iframe、不觸發 dialog；接受 Canva 嵌入碼時忽略貼入的 `onload`／`sandbox` 屬性；切換容器寬度 iframe 節點不變（外部請求在測試中全部阻擋）。

## 8. 人工測試結果與待人工驗收

- Claude 已執行：無實機測試（開發環境無 Windows／iPad，也無法連線 Canva／Microsoft）。
- 待使用者：C-2、C-3（見 §6）。

## 9. 風險、已知限制與注意事項

**風險初評：L3**。理由：新增 GitHub Pages 部署工作流程（`pages: write`、`id-token: write`）與 Release 工作流程（`contents: write`），依 `RISK_POLICY.md`「涉及部署權限……即使只改一行也視為 L3」；同時建立全部依賴（依賴選型屬 L3 範例）。無正式資料、無機密、無資料庫。最終等級由使用者決定。

| # | 風險 | 影響 | 緩解 |
|---|---|---|---|
| R-1 | Pages 來源仍為「Deploy from a branch」時合併 | 發布原始碼而非網站 | B-1 必須在合併前完成 |
| R-2 | `main` 未受保護 | 任何可寫入者可直接推送並觸發部署 | B-3 |
| R-3 | 嵌入格式假設錯誤或被平台阻擋 | Stage 2 範圍調整 | C-3 為 Stage 2 進入條件 |
| R-4 | npm 版本綁定 | 使用者本機需 Node 24 | 文件化；CI 固定 npm 版本 |
| R-5 | dev 依賴 minimatch 中度 ReDoS | 僅影響 lint 工具 | 追蹤上游 |
| R-6 | `.mjs` MIME、iPad 相容性 | worker 退回主執行緒或無法執行 | D-3、D-4 驗證；備案已記錄 |
| R-7 | PDF.js worker 1.27 MB | 首次載入較慢 | Stage 1 只在需要時載入 PDF 模組（動態 import） |
| R-8 | 尚無 CSP | 防禦縱深不足 | Stage 2 提案 |

安全：無機密、無個資、無外部分析；診斷頁只在使用者主動貼上網址時連線至白名單官方網域。

## 10. CI、部署狀態與審查證據

- PR、Head SHA、CI 執行結果：見 `docs/HANDOFF.md` 與 PR 說明（PR 建立後填寫）。
- 部署：**尚未部署**。需完成 B-1 並經使用者核准合併。
- 審查證據包（`.review-packets/`，不提交 Git；已以 Kit 腳本內建規則及人工搜尋確認不含個資或權杖）：
  - 完整差異：`PR_REVIEW_PACKET-<head>.md`（約 393 KB，低於 Kit 512 KiB 上限）。
  - 分批（便於審查，合計涵蓋 lockfile 以外全部 90 個路徑）：`PR1-src-*`（原始碼、測試、腳本）、`PR1-github-*`（工作流程與設定）、`PR1-docs-*`（文件與範本）。
  - `package-lock.json`（4,248 行）只在完整差異中，建議審查重點為 `package.json` 的固定版本與 `npm audit` 結果。

## 11. Stage 1 進入條件

1. 本 PR 經 ChatGPT 依 L3（或使用者決定的等級）完成獨立審查，BLOCKER／HIGH 全部解除。
2. CI `validate` 在最新 Head SHA 成功（含 WebKit）。
3. 使用者完成 B-1～B-3，核准並合併；Pages 部署成功，正式網址可開啟。
4. C-2：至少 Windows Chrome 與 iPad Safari 在正式網址 PDF.js 檢查「通過」（Edge 可同時進行）；若 iPad 失敗，Stage 1 先處理 legacy build。
5. 技術選型（`TECH.md` §8）與狀態架構經使用者核准。
6. C-3 嵌入實測**不是** Stage 1 的進入條件，但**是** Stage 2 的進入條件；建議在 Stage 1 開發期間進行。
