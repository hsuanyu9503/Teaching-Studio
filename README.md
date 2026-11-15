# Teaching Studio｜通用教學簡報工作台

**教材播放載體＋即時教學輔助工具。** 在同一個網站載入 PDF、PowerPoint 網頁版與 Canva 官方嵌入教材，排成單次課程播放清單，並在課堂中使用計時器、抽籤器與 QR Code 產生器。純前端、部署於 GitHub Pages；本機 PDF 不上傳。

> **目前進度：Stage 0（專案初始化與技術基線）**，工作台功能尚未開發。進度與待辦見 [`docs/HANDOFF.md`](docs/HANDOFF.md)、[`docs/STAGE0_REPORT.md`](docs/STAGE0_REPORT.md)。

## 文件

| 文件 | 內容 |
|---|---|
| [`docs/PROJECT_SPEC_V1.0.md`](docs/PROJECT_SPEC_V1.0.md) | 正式規格原文 |
| [`docs/SPEC.md`](docs/SPEC.md) | 功能編號、範圍、驗收情境對照 |
| [`docs/TECH.md`](docs/TECH.md) | 技術選型、依賴、部署、PDF.js |
| [`docs/STATE_ARCHITECTURE.md`](docs/STATE_ARCHITECTURE.md) | 狀態管理與播放器生命週期 |
| [`docs/PLAYER_CAPABILITIES.md`](docs/PLAYER_CAPABILITIES.md) | 播放器能力矩陣（已驗證／未驗證） |
| [`docs/EMBED_FEASIBILITY.md`](docs/EMBED_FEASIBILITY.md) | PowerPoint／Canva 嵌入可行性驗證步驟 |
| [`CLAUDE.md`](CLAUDE.md)、[`docs/WORKFLOW.md`](docs/WORKFLOW.md)、[`docs/RISK_POLICY.md`](docs/RISK_POLICY.md)、[`docs/CODE_REVIEW.md`](docs/CODE_REVIEW.md) | AI Web Starter Kit V1.2 協作與審查規範 |

## 本機開發

需求：Node.js 24 LTS（內建 npm 11）、Python 3.10+（審查包與打包腳本）。

```bash
npm ci
npm run dev        # http://localhost:5173/Teaching-Studio/
npm run check && npm run lint && npm run typecheck && npm test && npm run build
npm run e2e        # 需要 Playwright 瀏覽器：npx playwright install chromium
```

## 部署

合併 `main` 後由 GitHub Actions（`.github/workflows/pages.yml`）自動建置並部署至 `https://hsuanyu9503.github.io/Teaching-Studio/`。**合併 main 即代表同意發布。** 首次啟用前的 GitHub 設定見 [`docs/STAGE0_REPORT.md`](docs/STAGE0_REPORT.md) §6。

## 角色

使用者：需求決策、實機測試、最終驗收與合併核准｜Claude Code：技術分析、開發、測試、文件、PR｜ChatGPT：需求協作、獨立程式差異審查、驗收協助。
