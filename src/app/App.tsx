/**
 * Stage 0 佔位入口。工作台介面（SPEC §5）於 Stage 1 開發，此處不實作任何教材或工具功能。
 */
export function App() {
  return (
    <main id="main" className="stage0">
      <h1>Teaching Studio</h1>
      <p className="stage0-sub">通用教學簡報工作台</p>
      <p>目前為 <strong>Stage 0：專案初始化與技術基線</strong>，工作台功能將於 Stage 1 起陸續開發。</p>
      <p>
        <a className="stage0-link" href="./diagnostics.html">開啟 Stage 0 技術驗證頁 →</a>
      </p>
    </main>
  );
}
