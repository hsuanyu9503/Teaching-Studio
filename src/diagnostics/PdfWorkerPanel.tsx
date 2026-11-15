import { useRef, useState } from 'react';
import { runPdfWorkerCheck, type PdfWorkerReport } from './pdfWorkerCheck';

type State =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'done'; report: PdfWorkerReport }
  | { kind: 'error'; message: string };

export function PdfWorkerPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<State>({ kind: 'idle' });

  const run = async () => {
    if (!canvasRef.current || state.kind === 'running') return;
    setState({ kind: 'running' });
    try {
      const sample = new URL('samples/stage0-sample.pdf', document.baseURI).href;
      const report = await runPdfWorkerCheck(canvasRef.current, sample);
      setState({ kind: 'done', report });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? `${e.name}: ${e.message}` : String(e) });
    }
  };

  const r = state.kind === 'done' ? state.report : null;
  const pass = r !== null && r.realWorker && 'status' in r.workerHttp && r.workerHttp.status === 200 && r.numPages === 2;

  return (
    <section className="diag-card" aria-labelledby="pdf-title">
      <h2 id="pdf-title">1. PDF.js worker 載入檢查</h2>
      <p>以內建 2 頁範例 PDF 測試 worker 路徑與渲染。此檢查不會讀取或上傳你的檔案。</p>
      <button type="button" onClick={run} disabled={state.kind === 'running'}>
        {state.kind === 'running' ? '檢查中…' : '執行 PDF.js 檢查'}
      </button>
      <div className="diag-canvas-wrap">
        <canvas ref={canvasRef} data-testid="pdf-canvas" aria-label="範例 PDF 第 1 頁渲染結果" />
      </div>
      <output data-testid="pdf-result" data-status={state.kind === 'done' ? (pass ? 'pass' : 'fail') : state.kind}>
        {state.kind === 'error' && <p className="diag-fail">失敗：{state.message}</p>}
        {r && (
          <>
            <p className={pass ? 'diag-pass' : 'diag-fail'}>{pass ? '通過：worker 以 Web Worker 執行並成功渲染。' : '未通過：請截圖下列資訊回報。'}</p>
            <dl className="diag-dl">
              <dt>PDF.js 版本</dt><dd>{r.pdfjsVersion}</dd>
              <dt>Worker 路徑</dt><dd><code>{r.workerSrc}</code></dd>
              <dt>Worker HTTP</dt>
              <dd>{'status' in r.workerHttp ? `${r.workerHttp.status}（${r.workerHttp.contentType ?? '無 Content-Type'}）` : `錯誤：${r.workerHttp.error}`}</dd>
              <dt>執行方式</dt><dd data-testid="pdf-real-worker">{r.realWorker ? 'Web Worker' : '主執行緒（fake worker，未通過）'}</dd>
              <dt>頁數</dt><dd>{r.numPages}</dd>
              <dt>第 1 頁渲染耗時</dt><dd>{r.renderMs} ms</dd>
              <dt>瀏覽器</dt><dd><code>{r.userAgent}</code></dd>
            </dl>
          </>
        )}
      </output>
    </section>
  );
}
