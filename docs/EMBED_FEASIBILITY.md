# PowerPoint／Canva 官方嵌入：最小可行性驗證（Stage 0）

> 狀態：**驗證工具已完成，實際教材驗證尚未執行**。
> 原因：Claude 的開發環境網路政策不允許連線 `www.canva.com`、`support.microsoft.com` 等網域，無法以真實教材測試，也無法在本環境取得官方說明頁全文。以下網址格式為**未驗證假設**，須由使用者以實際教材驗證後才能列為 Stage 2 正式支援格式。

## 1. 驗證工具

`diagnostics.html`（Stage 0 技術驗證頁）第 2 區：

- 貼上嵌入程式碼或網址 → 以白名單驗證 → 由頁面自行建立 iframe（不注入貼入的 HTML、不沿用貼入的屬性）。
- sandbox 兩種模式比較：「限制」=`allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation`；「不設 sandbox」。
- 「切換容器寬度」：驗證調整容器不重新載入 iframe（load 次數不應增加）。
- 「重新載入」、「在原始頁面開啟」替代操作。
- 明確顯示：load 事件次數**不代表**內容可用，需目視確認。

網址：本機 `npm run dev` 後開 `http://localhost:5173/Teaching-Studio/diagnostics.html`；部署後為 `https://hsuanyu9503.github.io/Teaching-Studio/diagnostics.html`（**需先完成 GitHub Pages 設定與合併，見 STAGE0_REPORT §6**）。

> 必須在**正式部署網址**再測一次：第三方網站可能依嵌入來源（Referer／frame-ancestors）決定是否允許，localhost 結果不能代表正式環境（SPEC §17.2）。

## 2. 目前假設的官方格式（未驗證）

| 來源 | 接受的輸入 | 系統建立的 iframe src | 依據 | 狀態 |
|---|---|---|---|---|
| Canva 嵌入程式碼／智慧嵌入連結 | `https://www.canva.com/design/{designId}/{token}/view`（可帶查詢參數）或含此網址的 iframe 程式碼 | `https://www.canva.com/design/{designId}/{token}/view?embed` | Canva 說明中心「Embedding designs」描述以「分享 → 嵌入」取得 HTML 嵌入碼或智慧嵌入連結；`?embed` 格式來自既有嵌入碼慣例 | ❓ 未驗證 |
| Canva 編輯連結 `/design/{id}/edit`、`canva.link` 短網址 | 拒絕，提示改用「嵌入」 | — | 編輯連結需登入 | ❓ 未驗證 |
| PowerPoint 網頁版（個人 OneDrive） | `https://onedrive.live.com/embed?...` 或含此網址的 iframe 內嵌碼 | 同輸入（只保留 https、移除 fragment） | Microsoft 支援文章「Embed a presentation in a web page or blog」：PowerPoint 網頁版「檔案 → 共用 → 內嵌」產生 iframe 內嵌碼，桌面版無此功能 | ❓ 未驗證 |
| PowerPoint（公司／學校 SharePoint、OneDrive for Business） | `https://{tenant}.sharepoint.com/...?...action=embedview...` | 同輸入 | 既有內嵌碼慣例；**組織政策可能停用外部嵌入** | ❓ 未驗證 |
| `1drv.ms` 短網址、OneDrive 一般檢視／編輯連結、SharePoint 一般分享連結 | 拒絕，提示「一般分享連結不保證可以嵌入」 | — | 社群回報一般分享連結放入 iframe 已不可靠（非官方說法） | ❓ 未驗證 |
| `view.officeapps.live.com/op/embed.aspx` | 目前拒絕 | — | 屬於 Office Online 檢視器，會由 Microsoft 伺服器抓取公開檔案網址；是否納入第一版需使用者決定 | 待決策 |

### 已知風險（來自搜尋結果，非官方保證）

- Canva 工程部落格提到大多數 Canva 頁面基於安全理由**不可被 iframe 嵌入**，只有官方嵌入格式可以；因此一般 `/view` 連結必須轉成嵌入格式，不可直接放入 iframe。
- Microsoft 社群 2026 年 8 月有回報 OneDrive 內嵌 PowerPoint 顯示空白或錯誤；若發生需先檢查 Microsoft 365 服務狀態，不能直接判定為本專案問題。
- Microsoft 可能更新內嵌網址格式（例如新的 OneDrive 網址）。若使用者取得的內嵌碼被本工具拒絕，請回報**去除 authkey 等權杖後**的網址形狀，再更新白名單規則（需重新審查）。

## 3. 使用者驗證步驟

**請使用不含學生姓名、照片等個資的測試教材**（SPEC §10.2）。建議準備：

1. 一份 PowerPoint，含 ≥3 張投影片、至少一個動畫、一個轉場、一段影片（可選）。上傳至 OneDrive，在 PowerPoint 網頁版「檔案 → 共用 → 內嵌」取得內嵌碼。
2. 同一份簡報的一般分享連結（用來確認會被拒絕且提示正確）。
3. 一份 Canva 簡報，含 ≥3 頁與動畫；「分享 → 查看全部 → 嵌入」取得嵌入碼與智慧嵌入連結。
4. 一份**未公開**的 Canva 設計連結（用來確認權限錯誤時工作台不崩潰）。

每個瀏覽器（Windows Chrome、Windows Edge、iPad Safari）在**正式部署網址**執行：

1. 開啟 `diagnostics.html`，貼上內嵌碼 → 「驗證並載入」。
2. 依頁面清單目視確認：內容是否顯示、原生翻頁、動畫／轉場／影片、原生全螢幕按鈕、鍵盤（點選教材後按方向鍵）。
3. 按「切換容器寬度」兩次，確認 load 次數不增加、教材停留在同一頁。
4. sandbox 改「不設 sandbox」重測，記錄差異。
5. 截圖（遮蔽網址中的 `authkey`、token 等權杖）。

## 4. 驗證結果紀錄（待填）

| # | 來源／格式 | 瀏覽器 | 是否被接受 | 內容顯示 | 原生翻頁 | 動畫／轉場 | 影音 | 原生全螢幕 | 寬度切換不重載 | 限制 sandbox 可用 | 備註 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | PowerPoint 內嵌碼 | Chrome | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | |
| 2 | PowerPoint 內嵌碼 | Edge | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | |
| 3 | PowerPoint 內嵌碼 | iPad Safari | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | |
| 4 | PowerPoint 一般分享連結 | 任一 | 未執行（預期拒絕） | — | — | — | — | — | — | — | |
| 5 | Canva 嵌入碼 | Chrome | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | |
| 6 | Canva 嵌入碼 | Edge | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | |
| 7 | Canva 嵌入碼 | iPad Safari | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | 未執行 | |
| 8 | Canva 未公開設計 | 任一 | 未執行 | 未執行 | — | — | — | — | — | — | 預期顯示權限錯誤，工作台不受影響 |

驗證完成後，Claude 依結果更新 `PLAYER_CAPABILITIES.md`（❓ → ✅／❌）與 `embedSource.ts` 白名單規則，並作為 Stage 2 的進入條件。

## 5. 參考來源

- Microsoft 支援：[Embed a presentation in a web page or blog](https://support.microsoft.com/en-us/powerpoint/embed-a-presentation-in-a-web-page-or-blog)（經搜尋摘要取得，本環境無法直接開啟全文）
- Canva 說明中心：[Embedding designs and unpublishing embeds](https://www.canva.com/help/embed-designs/)、[Embed media](https://www.canva.com/help/embed-media/)（同上）
- Canva 工程部落格：[How Canva makes content embeddable](https://medium.com/canva/how-canva-makes-content-embeddable-b5c070a36ce)
- Microsoft Tech Community（非官方）：[OneDrive embedded PowerPoint slides showing blank page or error](https://techcommunity.microsoft.com/discussions/onedriveforbusiness/onedrive-embedded-powerpoint-slides-showing-blank-page-or-error/4549841)
