# 播放器能力矩陣（Stage 0）

> 程式版本：`src/features/players/types.ts` 的 `PLANNED_CAPABILITIES`。
> **本表與程式由單元測試 `types.test.ts` 比對，修改任一方須同步修改另一方。**
>
> 圖例：✅ 規劃支援（PDF 由本專案實作）｜❌ 不支援，工作台不得顯示對應控制項｜❓ 未驗證，**視同不支援**，直到實機驗證並記錄證據

## 1. 工作台可控制的能力

| 能力 | PDF（PDF.js） | PowerPoint 嵌入 | Canva 嵌入 | 說明 |
|---|---|---|---|---|
| `canNavigatePages` | ✅ | ❌ | ❌ | 嵌入為跨網域 iframe；無官方文件證實的父頁面翻頁 API。翻頁只能透過播放器自身的原生控制。 |
| `canReadCurrentPage` | ✅ | ❌ | ❌ | 父頁面不可讀取跨網域 iframe DOM；不得以猜測或計數模擬頁碼。 |
| `canReadTotalPages` | ✅ | ❌ | ❌ | 同上。 |
| `canZoom` | ✅ | ❌ | ❌ | 嵌入只能調整「容器大小」（並排縮放模式），不是內容縮放。 |
| `canRestoreProgress` | ✅ | ❓ | ❓ | PDF：工作台自行保存頁碼。嵌入：只有在 iframe **未被卸載**時，原生播放器的進度才可能保留；切換教材時是否保留 iframe 是 Stage 2 的策略決定，需實測。 |
| `hasNativeControls` | ❌ | ❓ | ❓ | 預期 PowerPoint／Canva 嵌入有原生翻頁控制，但仍需以實際教材確認（含 sandbox 設定下是否可用）。 |

> PDF 欄為**規劃目標**：Stage 0 只驗證 PDF.js 可在部署環境載入與渲染，翻頁等功能於 Stage 1 實作並測試後才算完成。

## 2. 嵌入播放器的狀態區分（SPEC §9.3）

| 狀態 | 意義 | 判斷依據 |
|---|---|---|
| `loading` | iframe 已建立，等待 load 事件 | 系統建立 iframe |
| `frame-loaded` | iframe load 事件已觸發 | **不代表**內容可用：被拒絕嵌入、需登入、權限錯誤頁面也會觸發 load |
| 內容可用（人工確認） | 教師目視確認教材可操作 | 父頁面無法判斷；第一版不自動判定 |
| `error` | 網址驗證失敗、建立失敗 | 系統可判斷的錯誤 |

## 3. 已驗證／未驗證清單

| 項目 | 狀態 | 證據 |
|---|---|---|
| PDF.js worker 在 `/Teaching-Studio/` 子路徑 production build 以 Web Worker 載入並渲染 | 已驗證（本機 vite preview、Chromium） | `tests/e2e/stage0.spec.ts` |
| 同上於 WebKit（iPad 模擬） | 待 CI 執行 | CI `validate` |
| 同上於 GitHub Pages 正式網址 | **未驗證**（需合併 main 並啟用 Pages Actions） | — |
| 同上於 iPad Safari 實機、Windows Chrome／Edge 實機 | **未驗證**（需使用者操作） | — |
| 嵌入網址白名單驗證、拒絕不安全輸入、不注入貼入 HTML | 已驗證（單元＋e2e，未連線外部） | `embedSource.test.ts`、e2e |
| 調整容器寬度不重建 iframe（DOM 節點不變） | 已驗證（本機，未連線外部） | e2e |
| PowerPoint／Canva 實際內容可在 iframe 顯示 | **未驗證**（本開發環境無法連線 canva.com／microsoft.com，需使用者以實際教材測試） | `docs/EMBED_FEASIBILITY.md` |
| 嵌入原生控制、動畫、影音、全螢幕、鍵盤 | **未驗證** | 同上 |
| 最小必要 sandbox 權限 | **未驗證** | 同上 |
| 任何官方 postMessage 控制 API | **未找到官方依據，不列為功能** | — |
