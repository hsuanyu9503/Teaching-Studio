/**
 * 第三方官方嵌入來源驗證（SPEC §9.2、§10.2、§17.1）。
 *
 * Stage 0：最小可行性驗證用（diagnostics.html）。Stage 2 會在實機驗證結果確認後擴充。
 *
 * 原則：
 * - 只接受白名單主機，以解析後的 URL.hostname 完整比對，不使用字串包含比對。
 * - 使用者貼上的 HTML 僅用 DOMParser 解析（不執行 script、不插入 DOM），只讀取 iframe 的 src。
 * - 由系統自行組出 iframe src；不沿用貼入程式碼的其他屬性（sandbox、allow、style、事件等）。
 * - 下列網址格式來自官方說明與既有經驗，**尚未在本專案以實際教材驗證**，見 docs/EMBED_FEASIBILITY.md。
 */

export type EmbedProvider = 'canva' | 'powerpoint';

export type EmbedRejectReason =
  | 'empty'
  | 'too-long'
  | 'no-iframe-src'
  | 'multiple-iframes'
  | 'not-url'
  | 'not-https'
  | 'credentials-in-url'
  | 'non-default-port'
  | 'local-file'
  | 'share-link-not-embed'
  | 'malformed'
  | 'unsupported-host';

export type EmbedParseResult =
  | {
      readonly ok: true;
      readonly provider: EmbedProvider;
      /** 系統組出、可放入 iframe 的網址。 */
      readonly embedSrc: string;
      /** 「在原始頁面開啟」用的網址。 */
      readonly openUrl: string;
    }
  | {
      readonly ok: false;
      readonly reason: EmbedRejectReason;
      readonly message: string;
      readonly provider?: EmbedProvider;
    };

export const MAX_INPUT_LENGTH = 8192;

const CANVA_HOSTS = new Set(['www.canva.com', 'canva.com']);
const CANVA_ID = '[A-Za-z0-9_-]{6,64}';
const CANVA_VIEW_PATH = new RegExp(`^/design/(${CANVA_ID})/(${CANVA_ID})/(?:view|watch)/?$`);
const CANVA_EDIT_PATH = new RegExp(`^/design/${CANVA_ID}(?:/${CANVA_ID})?/edit/?$`);
/** 單一子網域標籤，例如 contoso.sharepoint.com、contoso-my.sharepoint.com。 */
const SHAREPOINT_HOST = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.sharepoint\.com$/;

const SHARE_HINT_PPT =
  '這是一般分享連結，不保證可以嵌入。請在 PowerPoint 網頁版選「檔案 → 共用 → 內嵌」，複製內嵌程式碼或其中的網址。';
const SHARE_HINT_CANVA =
  '這是 Canva 編輯或短網址連結，不是嵌入連結。請在 Canva 選「分享 → 查看全部 → 嵌入」，複製嵌入程式碼或智慧嵌入連結。';

const reject = (
  reason: EmbedRejectReason,
  message: string,
  provider?: EmbedProvider,
): EmbedParseResult => (provider ? { ok: false, reason, message, provider } : { ok: false, reason, message });

/** 從貼入內容取得候選網址：純網址直接回傳；HTML 片段只取唯一 iframe 的 src。 */
export function extractCandidate(input: string): { url: string } | { error: EmbedParseResult } {
  const trimmed = input.trim();
  if (!trimmed) return { error: reject('empty', '請貼上嵌入網址或嵌入程式碼。') };
  if (trimmed.length > MAX_INPUT_LENGTH) return { error: reject('too-long', '內容過長，請只貼上嵌入程式碼或網址。') };
  if (!trimmed.startsWith('<')) return { url: trimmed };

  // DOMParser 產生的文件不會執行 script，也不會被插入目前頁面。
  const doc = new DOMParser().parseFromString(trimmed, 'text/html');
  const frames = doc.querySelectorAll('iframe');
  if (frames.length === 0) return { error: reject('no-iframe-src', '貼入的程式碼中找不到 iframe 網址。') };
  if (frames.length > 1) return { error: reject('multiple-iframes', '一次只能加入一份嵌入教材，請只貼上一個 iframe。') };
  const src = frames[0]?.getAttribute('src')?.trim();
  if (!src) return { error: reject('no-iframe-src', '貼入的 iframe 沒有 src 網址。') };
  return { url: src };
}

export function parseEmbedSource(input: string): EmbedParseResult {
  const candidate = extractCandidate(input);
  if ('error' in candidate) return candidate.error;
  const raw = candidate.url;

  if (/\.(pptx?|ppsx?|potx?)(?:$|[?#])/i.test(raw) && !/^https:\/\//i.test(raw)) {
    return reject(
      'local-file',
      '本機 PPT／PPTX 檔案不支援直接播放。請匯出成 PDF 後以 PDF 加入，或上傳至 OneDrive 後使用官方內嵌。',
      'powerpoint',
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return reject('not-url', '無法辨識的網址格式。');
  }
  if (url.protocol !== 'https:') return reject('not-https', '只接受 https:// 開頭的官方嵌入網址。');
  if (url.username || url.password) return reject('credentials-in-url', '網址不可包含帳號或密碼。');
  if (url.port) return reject('non-default-port', '官方嵌入網址不應指定連接埠。');

  const host = url.hostname; // URL 已轉為小寫並處理 IDN
  url.hash = '';

  // ---- Canva ----
  if (CANVA_HOSTS.has(host)) {
    const view = CANVA_VIEW_PATH.exec(url.pathname);
    if (view) {
      const [, designId, token] = view;
      const viewUrl = `https://www.canva.com/design/${designId}/${token}/view`;
      return { ok: true, provider: 'canva', embedSrc: `${viewUrl}?embed`, openUrl: viewUrl };
    }
    if (CANVA_EDIT_PATH.test(url.pathname)) return reject('share-link-not-embed', SHARE_HINT_CANVA, 'canva');
    return reject('malformed', '無法辨識的 Canva 網址，請使用「嵌入」功能提供的連結。', 'canva');
  }
  if (host === 'canva.link') return reject('share-link-not-embed', SHARE_HINT_CANVA, 'canva');

  // ---- PowerPoint 網頁版／OneDrive ----
  if (host === 'onedrive.live.com') {
    if (url.pathname === '/embed' && url.search.length > 1) {
      const src = `https://onedrive.live.com/embed${url.search}`;
      return { ok: true, provider: 'powerpoint', embedSrc: src, openUrl: src };
    }
    return reject('share-link-not-embed', SHARE_HINT_PPT, 'powerpoint');
  }
  if (host === '1drv.ms') return reject('share-link-not-embed', SHARE_HINT_PPT, 'powerpoint');
  if (SHAREPOINT_HOST.test(host)) {
    if (url.searchParams.get('action') === 'embedview') {
      const src = url.toString();
      return { ok: true, provider: 'powerpoint', embedSrc: src, openUrl: src };
    }
    return reject('share-link-not-embed', SHARE_HINT_PPT, 'powerpoint');
  }

  return reject(
    'unsupported-host',
    '目前只支援 Canva（www.canva.com）與 PowerPoint 網頁版／OneDrive（onedrive.live.com、*.sharepoint.com）的官方嵌入。',
  );
}
