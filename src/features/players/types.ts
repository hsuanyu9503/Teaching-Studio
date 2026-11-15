/**
 * 播放器共用介面與能力宣告（SPEC §7）。
 *
 * Stage 0 只定義型別與能力矩陣；Adapter 實作於 Stage 1（PDF）與 Stage 2（嵌入）。
 * 工作台必須依 capabilities 決定顯示哪些控制項，不得假設所有播放器能力相同。
 */

export type SourceType = 'pdf' | 'powerpoint-embed' | 'canva-embed';

/** 能力狀態：true＝已實作且驗證；false＝不支援；'unverified'＝尚待實機驗證，不得當作功能顯示。 */
export type Capability = boolean | 'unverified';

export interface PlayerCapabilities {
  /** 工作台可自行發出上一頁／下一頁／跳頁。 */
  readonly canNavigatePages: Capability;
  /** 工作台可讀取目前頁碼。 */
  readonly canReadCurrentPage: Capability;
  /** 工作台可讀取總頁數。 */
  readonly canReadTotalPages: Capability;
  /** 工作台可控制縮放（非僅調整容器大小）。 */
  readonly canZoom: Capability;
  /** 切換教材後可恢復播放進度。 */
  readonly canRestoreProgress: Capability;
  /** 播放器本身提供原生控制列（翻頁、全螢幕等）。 */
  readonly hasNativeControls: Capability;
}

/**
 * 載入狀態。第三方 iframe 的 load 事件只代表「容器已載入」，不代表內容可用（SPEC §9.3）。
 */
export type LoadingStatus =
  | 'idle'
  | 'loading'
  | 'ready' // 本機 PDF：已解析並可渲染
  | 'frame-loaded' // iframe load 事件已觸發，實際內容無法由父頁面判斷
  | 'error';

export interface PlayerError {
  readonly code: string;
  /** 給教師看的繁體中文訊息。 */
  readonly message: string;
}

/** 播放器生命週期（Stage 1／2 由各 Adapter 實作）。 */
export interface PlayerAdapter {
  readonly sourceType: SourceType;
  readonly capabilities: PlayerCapabilities;
  /** 釋放 PDF Document、渲染任務、Canvas、Object URL 等資源。 */
  dispose(): void;
}

/**
 * 能力矩陣（docs/PLAYER_CAPABILITIES.md 為人類可讀版本，兩者需保持一致，測試會比對）。
 *
 * - PDF：由 PDF.js 自行渲染，能力在 Stage 1 實作後才轉為 true；目前標記為規劃目標。
 * - 第三方嵌入：跨網域 iframe，父頁面不得存取 DOM；未經官方文件證實的 postMessage API 不列為功能。
 */
export const PLANNED_CAPABILITIES: Readonly<Record<SourceType, PlayerCapabilities>> = {
  pdf: {
    canNavigatePages: true,
    canReadCurrentPage: true,
    canReadTotalPages: true,
    canZoom: true,
    canRestoreProgress: true,
    hasNativeControls: false,
  },
  'powerpoint-embed': {
    canNavigatePages: false,
    canReadCurrentPage: false,
    canReadTotalPages: false,
    canZoom: false,
    canRestoreProgress: 'unverified',
    hasNativeControls: 'unverified',
  },
  'canva-embed': {
    canNavigatePages: false,
    canReadCurrentPage: false,
    canReadTotalPages: false,
    canZoom: false,
    canRestoreProgress: 'unverified',
    hasNativeControls: 'unverified',
  },
};

/** 只有明確為 true 的能力才可顯示對應控制項；'unverified' 視同不支援。 */
export function isUsable(capability: Capability): boolean {
  return capability === true;
}
