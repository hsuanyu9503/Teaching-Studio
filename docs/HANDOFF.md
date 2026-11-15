# HANDOFF｜當前工作與交接狀態

> 這份文件是跨 AI 對齊進度用的**最新狀態快照**，不是聊天紀錄。

## 目前狀態

- 專案：`Teaching Studio｜通用教學簡報工作台`
- 任務：`Stage 0：初始化與技術基線`
- 狀態：`待驗收`（PR 待審查；尚未部署）
- 基準分支：`main`
- 基準 Commit：`02d3bfea62a135487faeb88af75e202692927e72`
- 開發分支：`claude/peaceful-euler-jpfp04`
- 開發 PR：https://github.com/hsuanyu9503/Teaching-Studio/pull/1（draft）
- 規格版次：`PROJECT_SPEC V1.0／SPEC S1.0／DESIGN D0.1 草案／TECH T0.1 提案`
- 下一位負責人：`你`（GitHub 設定 B-1～B-3）＋ `ChatGPT`（L3 獨立審查）
- 最近更新：`2026-11-15`

## 已確認事項

- 規格 V1.0 收錄為 `docs/PROJECT_SPEC_V1.0.md`。
- Starter Kit V1.2 由 `hsuanyu9503/AI-Web-Starter-Kit-V1-2@e5c91f1` 導入並改寫為 Vite 架構。
- 交付內容與證據：`docs/STAGE0_REPORT.md`。

## 待確認／阻擋事項

- **合併前必須**：Settings → Pages 來源改為 GitHub Actions（目前為 Deploy from a branch）。
- `main` 尚未啟用 Ruleset（要求 PR、禁止 force push、必要檢查 `validate`）。
- 待決策：Escape 是否退出展示模式；Office 檢視器是否納入；檔案 `6` 是否刪除；技術選型與狀態架構核准；風險等級（初評 L3）。
- 待實機：正式網址 PDF.js 檢查（Windows Chrome／Edge、iPad Safari）；PowerPoint／Canva 實際教材嵌入測試（Stage 2 進入條件）。

## 測試結果快照

| 項目 | 結果（通過／失敗／未執行） | 證據 |
|---|---|---|
| npm ci／check／lint／typecheck | 通過 | 本機乾淨安裝，見 PR 說明 |
| npm test（Vitest 27＋治理 11） | 通過 | 同上 |
| npm run build | 通過 | 同上 |
| e2e Chromium（8） | 通過 | 同上 |
| e2e WebKit（iPad 模擬） | 未執行（本機無 WebKit）→ CI | CI `validate` |
| CI `validate` | 未確認（`2a9ffdf` 執行中） | https://github.com/hsuanyu9503/Teaching-Studio/actions/runs/43736950405 |
| GitHub Pages 正式部署 | 未執行 | 需設定與合併 |
| 實機驗收 | 未執行 | 需使用者 |

## 交接紀錄

| 日期 | 從 → 到 | 任務／版本／Commit | 下一步 |
|---|---|---|---|
| 2026-11-15 | 使用者 → Claude | 規格 V1.0，執行 Stage 0 | 初始化 |
| 2026-11-15 | Claude → 使用者／ChatGPT | Stage 0 PR（Head 見 PR） | GitHub 設定、L3 審查 |

> 規格的正式變更請同步修改 SPEC / DESIGN / TECH，不要只在這裡留下新決策。
