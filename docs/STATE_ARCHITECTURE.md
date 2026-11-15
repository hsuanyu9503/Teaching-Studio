# 狀態管理與播放器生命週期架構（Stage 0 提案）

> 狀態：**提案，待 Stage 0 審查核准**。Stage 0 只建立型別骨架（`src/features/players/types.ts`），以下各 store 於對應階段實作。
> 依據：SPEC 原文 §6.3、§7、§11、§12.2、§13.3、§15.3、§16.1、§16.2。

## 1. 選型：每個領域一個輕量 store，不引入狀態管理套件

| 方案 | 結論 |
|---|---|
| 單一 React Context + useReducer | ❌ 任何狀態變化（例如計時器每秒更新）都會讓整棵樹重新渲染，包含播放器 |
| Redux／Zustand 等套件 | 可行，但第一版規模不需要額外依賴 |
| **各領域獨立 store + `useSyncExternalStore`**（建議） | ✅ 無額外依賴；元件只訂閱自己需要的片段；計時器時鐘可在 React 之外運作；store 為純 TypeScript，易於單元測試 |

- 每個 store：`getSnapshot()`、`subscribe()`、明確的 action 方法；狀態轉換寫成**純函式 reducer**，單元測試直接測 reducer。
- Store 實例在 App 根部建立一次，以 Context 傳遞「store 參考」（不是狀態值），因此 Context 本身不會觸發重新渲染。
- 不寫入 `localStorage`／`sessionStorage`／IndexedDB（SPEC §6.4、§17.1）；`scripts/check.mjs` 會阻擋。

## 2. 五個狀態領域（SPEC §16.1）

```text
MaterialStore      教材清單、順序、目前播放 id
PlayerStateStore   每份教材的播放狀態（以 materialId 為鍵），與播放器實例分離
ToolStores         TimerStore／PickerStore／QrStore，彼此獨立
PresentationStore  準備／展示模式、全螢幕狀態
LayoutStore        側欄、抽屜模式、迷你浮窗位置、大型展示
```

依賴方向單向：Layout／Presentation **不得**寫入 Material、Player、Tool；切換教材只改 `activeId`，**不碰** ToolStores。

### 2.1 MaterialState

```ts
type Material =
  | { id: MaterialId; title: string; sourceType: 'pdf'; file: File /* 僅存於記憶體 */ }
  | { id: MaterialId; title: string; sourceType: 'powerpoint-embed' | 'canva-embed'; embedSrc: string; openUrl: string };
interface MaterialState { items: readonly Material[]; activeId: MaterialId | null; }
```

- `id` 以 `crypto.randomUUID()` 產生，**不以名稱識別**（§6.1）；`order` 以陣列順序表示，避免兩份資料不一致。
- 嵌入教材只保存**驗證後**由系統組出的網址，不保存使用者貼入的 HTML。
- 移除教材時同步移除其 PlayerState、釋放資源；失敗教材移除不影響其他項目（§6.2）。

### 2.2 PlayerState（與播放器實例分離）

```ts
type PlaybackState =
  | { kind: 'pdf'; page: number; numPages: number | null; zoom: 'fit' | number; view: 'single' | 'continuous';
      loading: LoadingStatus; error: PlayerError | null }
  | { kind: 'embed'; loading: LoadingStatus; error: PlayerError | null; reloadNonce: number };
```

- 頁碼存在 store，不存在元件內部 state，所以播放器卸載後再掛載仍可回到原頁（§6.3 範例：PDF A 第 12 頁）。
- 嵌入教材**沒有** page 欄位：不可讀取就不建立欄位，避免 UI 誤用（§7.2）。

### 2.3 ToolState

**TimerStore**（§12.2）

```ts
type TimerState =
  | { status: 'idle'; mode: 'down' | 'up'; durationMs: number }
  | { status: 'running'; mode; durationMs; startedAtMs: number; accumulatedMs: number }
  | { status: 'paused'; mode; durationMs; accumulatedMs: number }
  | { status: 'completed'; mode; durationMs; completedAtMs: number };
```

- 經過時間 = `accumulatedMs + (now - startedAtMs)`，**由時間戳記計算**，不累加 setInterval 次數。
- tick（requestAnimationFrame 或 250ms interval）只負責「觸發重新計算與畫面更新」，被背景節流也不影響正確性；`visibilitychange` 回到前景時立即重新計算並判定是否已完成。
- 時間來源採 `Date.now()`：裝置休眠期間 `performance.now()` 在部分平台不前進，會造成倒數停滯；以 `Math.max(0, …)` 防止時鐘回撥產生負值。此取捨需在 iPad 實機驗證。
- `start` 在 running 狀態為 no-op（重複點擊）；全應用**只有一個** TimerStore，迷你浮窗、抽屜、大型展示都訂閱同一份狀態。
- 音效：在使用者第一次按「開始」時建立／resume `AudioContext`；不保證休眠時準時發聲（§12.3）。

**PickerStore**（§13）

- 候選項目為 `{ entryId, label }`；名單模式每一行有獨立 `entryId`，同名不同人可區分（§13.2）。
- 候選池 = 設定（範圍或名單）− 排除 −（不重複模式下）已抽出；以純函式由設定與歷史**推導**，不另存一份可能不一致的池。
- 變更範圍／名單／排除設定時：若已有抽籤歷史，需確認後重設歷史，避免新設定與舊歷史混合（§13.3）。
- 隨機：`crypto.getRandomValues` + 拒絕取樣（rejection sampling）避免模數偏差，確保每個合法候選機率相同。
- **先決定結果、再播放動畫**；動畫期間鎖定抽取按鈕，防止快速連點重複執行。池為空時 `draw()` 回傳明確的「已抽完」結果，不產生無效值。

**QrStore**（§14）：保存輸入字串、正規化後的實際編碼網址、驗證錯誤。網址無效時清除舊 QR Code 顯示。

### 2.4 PresentationState

```ts
interface PresentationState {
  mode: 'prepare' | 'present';
  fullscreen: 'none' | 'native' | 'pseudo'; // pseudo = 工作台內部 CSS 最大化，UI 文字不得稱為「全螢幕」
}
```

- `native` 只在 `fullscreenchange` 確認 `document.fullscreenElement === 工作台根元素` 後才設定；`requestFullscreen` 失敗或 API 不存在時提供 `pseudo`（§15.2）。
- 使用者以瀏覽器原生方式退出全螢幕時，由 `fullscreenchange` 同步回 `none`。

### 2.5 LayoutState

```ts
interface LayoutState {
  materialsPanelOpen: boolean;
  drawer: 'collapsed' | 'side' | 'overlay';
  activeTool: 'timer' | 'picker' | 'qr';
  miniTimer: { visible: boolean; x: number; y: number }; // 以可視區域比例儲存，旋轉／縮放後重新夾限
  bigDisplay: null | 'timer' | 'picker' | 'qr';
}
```

- 進入展示模式時套用「教材清單收合、抽屜收合」的**預設值**，但不清除工具狀態（§5.3）。
- 關閉大型展示後，焦點回到開啟它的按鈕（保存觸發元素參考）。

## 3. 播放器生命週期（SPEC §16.2）

### 3.1 不重新掛載的結構規則

1. 工作台根元素與「播放區容器」在整個應用生命週期中**位置固定**，Layout／Presentation 變更只改 CSS class 與 grid 欄寬，不改變 React 樹的父子結構。
2. 抽屜、浮層、大型展示、迷你浮窗以**兄弟節點**（必要時 portal）呈現，不包住播放器。
3. **不得搬移 iframe 的 DOM 位置**：瀏覽器在 iframe 被移到另一個父節點時會重新載入。
4. 播放器的 React `key` 只使用 `materialId`（嵌入另加使用者主動的 `reloadNonce`），不使用索引、模式或版面狀態。
5. 不使用路由切換工作台畫面；全螢幕以工作台根元素為目標（§15.1）。
6. Stage 1／4 以測試驗證：切換版面前後，播放器 DOM 節點為同一個（e2e 以 element handle 比對）、PDF 頁碼不變、iframe load 次數不增加。Stage 0 的驗證頁已示範此檢查方式。

### 3.2 PDF 資源策略

- 開啟中的 `PDFDocumentProxy` 以 LRU 快取保留「目前＋最近使用」少量份數（建議 2 份，Stage 1 依記憶體實測調整），被淘汰時 `destroy()`；需要時從記憶體中的 `File` 重新開啟並由 PlayerState 恢復頁碼。
- 每次渲染前取消前一個 `RenderTask`，並以遞增 render token 丟棄過期結果，避免快速翻頁時舊頁覆蓋新頁（§8.2）。
- 容器尺寸以 `ResizeObserver` 監看，debounce 後重新計算 scale；canvas 尺寸考量 `devicePixelRatio` 並設上限，避免 iPad 記憶體不足。
- 卸載時：取消渲染、`page.cleanup()`、`doc.destroy()`、釋放 Object URL、將 canvas 尺寸設為 0。

### 3.3 嵌入 iframe 策略（Stage 2 決策點）

| 方案 | 進度保留 | 背景聲音 | 記憶體 |
|---|---|---|---|
| **A. 切換教材時卸載非作用中 iframe**（建議預設） | 不保留（返回時重新載入）→ `canRestoreProgress = false` | 不會發生 | 受控 |
| B. 保留非作用中 iframe（隱藏） | 可能保留 | **可能持續播放**（無法從父頁面暫停跨網域影音），違反 §16.2 | 隨教材數成長 |

建議 Stage 2 採 A，並在 UI 清楚標示「返回此教材時會從頭載入」。若實測後使用者希望保留進度，再評估「僅保留最近一份且確認無影音」等折衷，須經核准。

## 4. 鍵盤與 Escape 優先順序（SPEC §15.3）

全域 keydown 監聽掛在工作台根部，依序判斷：

1. 焦點在可編輯元素（`input`、`textarea`、`select`、`[contenteditable]`）或對話框內 → **不攔截**。
2. 焦點在 `button`／`a` 且按鍵為空白鍵或 Enter → 交給元素原生行為，**不翻頁**（避免按工具按鈕時重複觸發）。
3. 有修飾鍵（Ctrl／Alt／Meta）→ 不攔截，保留瀏覽器快捷鍵。

Escape 由高到低：

| 優先 | 狀態 | Escape 行為 |
|---|---|---|
| 0 | 瀏覽器原生全螢幕 | **由瀏覽器處理**（通常先退出全螢幕，頁面可能收不到該 keydown）；以 `fullscreenchange` 同步狀態，不阻止原生退出 |
| 1 | 大型展示開啟 | 關閉大型展示，焦點回到觸發按鈕 |
| 2 | 工具浮層（overlay）開啟 | 關閉浮層 |
| 3 | 工作台內部最大化（pseudo） | 退出內部最大化 |
| 4 | 展示模式 | **待使用者決定**：Escape 是否直接退出展示模式（風險：課堂中誤觸）；建議僅以明確按鈕退出 |

- 焦點在跨網域 iframe 內時，按鍵事件**不會**傳到父頁面，這是瀏覽器安全限制而非錯誤；教師需點擊教材外區域才能使用工作台快捷鍵。Stage 2 需在 UI 提示。
- PDF 翻頁鍵：← 上一頁；→、空白鍵 下一頁；不對嵌入教材發出任何模擬翻頁。

## 5. 測試策略對應

| 層級 | 工具 | 範圍 |
|---|---|---|
| 純函式／reducer | Vitest | 計時（以假時鐘）、抽籤公平性（統計與耗盡）、QR 網址正規化、嵌入網址驗證 |
| 元件 | Vitest + Testing Library（jsdom） | 控制項依能力顯示、焦點回復、鍵盤規則 |
| 端對端 | Playwright（production build、`/Teaching-Studio/` 子路徑）Chromium＋WebKit | 播放器不重新掛載、頁碼保留、Pages 路徑、worker |
| 實機 | 使用者 | Windows Chrome／Edge、iPad Safari、投影、手機掃描 QR、實際嵌入教材 |
