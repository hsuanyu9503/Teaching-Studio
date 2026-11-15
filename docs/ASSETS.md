# 網站美術素材

- 由程式引用、需經 Vite 雜湊處理的素材（圖示、插畫）：放在 `src/assets/`。
- 需固定網址的靜態檔（例如診斷用範例 PDF）：放在 `public/`，以相對 base 的路徑引用。
- 每批正式素材依 `templates/VISUAL_HANDOFF.md` 記錄用途、尺寸、裁切規則，並更新 `docs/DESIGN.md`。

Stage 0 尚無正式美術素材。`public/samples/stage0-sample.pdf` 為 `scripts/make_sample_pdf.py` 產生的診斷用檔案，不含任何個資。
