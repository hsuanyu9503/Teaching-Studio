/**
 * Stage 0：PDF.js worker 部署驗證（SPEC §8、§17.2）。
 *
 * 驗證重點：在 GitHub Pages 子路徑下 worker 檔案可被載入，且確實以 Web Worker 執行
 * （PDF.js 在 worker 載入失敗時可能改用主執行緒「fake worker」，畫面仍會出現，
 * 但效能與穩定性不同，因此必須明確區分）。
 */
import { GlobalWorkerOptions, PDFWorker, getDocument, version } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfWorkerReport {
  readonly pdfjsVersion: string;
  readonly workerSrc: string;
  /** worker 檔案 HTTP 狀態與 Content-Type。 */
  readonly workerHttp: { status: number; contentType: string | null } | { error: string };
  /** true：真正的 Web Worker；false：退回主執行緒。 */
  readonly realWorker: boolean;
  readonly numPages: number;
  readonly renderMs: number;
  readonly userAgent: string;
}

export async function runPdfWorkerCheck(canvas: HTMLCanvasElement, sampleUrl: string): Promise<PdfWorkerReport> {
  const workerSrc = new URL(workerUrl, document.baseURI).href;
  let workerHttp: PdfWorkerReport['workerHttp'];
  try {
    const res = await fetch(workerSrc, { cache: 'no-store' });
    workerHttp = { status: res.status, contentType: res.headers.get('content-type') };
  } catch (e) {
    workerHttp = { error: e instanceof Error ? e.message : String(e) };
  }

  const worker = new PDFWorker();
  const loadingTask = getDocument({ url: sampleUrl, worker });
  try {
    await worker.promise;
    const realWorker = typeof Worker !== 'undefined' && worker.port instanceof Worker;
    const doc = await loadingTask.promise;
    const started = performance.now();
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    await page.render({ canvas, viewport, transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0] }).promise;
    const renderMs = Math.round(performance.now() - started);
    page.cleanup();
    return {
      pdfjsVersion: version,
      workerSrc,
      workerHttp,
      realWorker,
      numPages: doc.numPages,
      renderMs,
      userAgent: navigator.userAgent,
    };
  } finally {
    await loadingTask.destroy();
    worker.destroy();
  }
}
