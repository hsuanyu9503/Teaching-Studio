import { useState } from 'react';
import { parseEmbedSource, type EmbedParseResult } from '../features/players/embed/embedSource';

/**
 * Stage 0：PowerPoint／Canva 官方嵌入最小可行性驗證（SPEC §9、§10）。
 *
 * - iframe 一律由本頁依驗證後網址建立，不注入貼入的 HTML。
 * - 提供 sandbox 模式切換，以實測決定 Stage 2 的最小必要權限（SPEC §17.1）。
 * - load 事件只代表 iframe 容器已載入，內容是否可用需由使用者目視確認（SPEC §9.3）。
 */

type SandboxMode = 'restricted' | 'none';
const SANDBOX_RESTRICTED =
  'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation';

export function EmbedPanel() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<EmbedParseResult | null>(null);
  const [sandbox, setSandbox] = useState<SandboxMode>('restricted');
  const [narrow, setNarrow] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [loadEvents, setLoadEvents] = useState<string[]>([]);

  const check = () => {
    setResult(parseEmbedSource(input));
    setLoadEvents([]);
  };

  const ok = result?.ok ? result : null;

  return (
    <section className="diag-card" aria-labelledby="embed-title">
      <h2 id="embed-title">2. PowerPoint／Canva 官方嵌入檢查</h2>
      <p>
        貼上 PowerPoint 網頁版「內嵌」程式碼／網址，或 Canva「嵌入」程式碼／智慧嵌入連結。
        請使用<strong>不含學生個資</strong>的測試教材。
      </p>
      <label htmlFor="embed-input">嵌入程式碼或網址</label>
      <textarea
        id="embed-input"
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
        autoComplete="off"
      />
      <div className="diag-row">
        <button type="button" onClick={check}>驗證並載入</button>
        <label>
          sandbox：
          <select value={sandbox} onChange={(e) => setSandbox(e.target.value as SandboxMode)}>
            <option value="restricted">限制（預設）</option>
            <option value="none">不設 sandbox（比較用）</option>
          </select>
        </label>
      </div>

      <output data-testid="embed-result" data-status={result ? (result.ok ? 'accepted' : 'rejected') : 'idle'}>
        {result && !result.ok && (
          <p className="diag-fail">
            未接受（{result.reason}）：{result.message}
          </p>
        )}
        {ok && (
          <p className="diag-pass">
            已接受：{ok.provider === 'canva' ? 'Canva' : 'PowerPoint'}，iframe 網址 <code>{ok.embedSrc}</code>
          </p>
        )}
      </output>

      {ok && (
        <>
          <div className="diag-row">
            <button type="button" onClick={() => setNarrow((n) => !n)}>
              切換容器寬度（目前：{narrow ? '60%' : '100%'}）
            </button>
            <button type="button" onClick={() => setReloadNonce((n) => n + 1)}>重新載入</button>
            <a href={ok.openUrl} target="_blank" rel="noopener noreferrer">在原始頁面開啟 ↗</a>
          </div>
          <div className="diag-frame-outer" style={{ width: narrow ? '60%' : '100%' }}>
            <div className="diag-frame-box">
              <iframe
                key={`${ok.embedSrc}|${sandbox}|${reloadNonce}`}
                title="嵌入教材測試"
                src={ok.embedSrc}
                {...(sandbox === 'restricted' ? { sandbox: SANDBOX_RESTRICTED } : {})}
                allow="fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={() => setLoadEvents((ev) => [...ev, new Date().toLocaleTimeString('zh-TW')])}
              />
            </div>
          </div>
          <p data-testid="embed-load-count">
            iframe load 事件次數：{loadEvents.length}
            {loadEvents.length > 0 && `（${loadEvents.join('、')}）`}。
            切換容器寬度後次數不應增加；load 事件<strong>不代表</strong>教材已可操作，請依下方清單目視確認。
          </p>
          <ul className="diag-checklist">
            <li>教材內容是否實際顯示（不是空白、登入頁或「拒絕連線」）？</li>
            <li>原生翻頁控制是否可用？鍵盤方向鍵在點選教材後是否可翻頁？</li>
            <li>動畫、轉場、影片是否播放？</li>
            <li>原生全螢幕按鈕的行為？</li>
            <li>sandbox「限制」與「不設」兩種模式結果是否不同？</li>
          </ul>
        </>
      )}
    </section>
  );
}
