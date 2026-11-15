import { EmbedPanel } from './EmbedPanel';
import { PdfWorkerPanel } from './PdfWorkerPanel';

export function DiagnosticsApp() {
  return (
    <main id="main" className="diag">
      <header>
        <h1>Teaching Studio｜Stage 0 技術驗證頁</h1>
        <p>
          此頁僅供 Stage 0 可行性驗證，不是正式功能。所有檢查在瀏覽器本機執行；
          嵌入檢查只會連線到你貼上的 Canva／Microsoft 官方網址。
        </p>
        <p><a href="./">← 返回工作台</a></p>
      </header>
      <PdfWorkerPanel />
      <EmbedPanel />
    </main>
  );
}
