#!/usr/bin/env python3
"""產生 Stage 0 診斷用的 2 頁 16:9 範例 PDF（無外部依賴、內容固定，可重現）。

第 1 頁中央為藍色方塊、第 2 頁為橘色方塊，供 e2e 測試檢查實際渲染像素。
用法：python3 scripts/make_sample_pdf.py public/samples/stage0-sample.pdf
"""
import sys
from pathlib import Path

W, H = 960, 540
PAGES = [((0.18, 0.40, 0.75), "Teaching Studio Stage 0 - Page 1"),
         ((0.95, 0.55, 0.10), "Teaching Studio Stage 0 - Page 2")]


def build() -> bytes:
    objs: list[bytes] = []
    kids = []
    font_id = 3 + len(PAGES) * 2
    for i, ((r, g, b), text) in enumerate(PAGES):
        page_id, content_id = 3 + i * 2, 4 + i * 2
        kids.append(f"{page_id} 0 R")
        stream = (f"{r} {g} {b} rg 330 120 300 300 re f\n"
                  f"BT /F1 32 Tf 0 0 0 rg 230 470 Td ({text}) Tj ET\n").encode()
        objs.append(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {W} {H}] "
                    f"/Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>".encode())
        objs.append(b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"endstream")
    catalog = b"<< /Type /Catalog /Pages 2 0 R >>"
    pages = f"<< /Type /Pages /Kids [{' '.join(kids)}] /Count {len(PAGES)} >>".encode()
    font = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    all_objs = [catalog, pages, *objs, font]

    out = bytearray(b"%PDF-1.7\n%\xe2\xe3\xcf\xd3\n")
    offsets = []
    for n, body in enumerate(all_objs, start=1):
        offsets.append(len(out))
        out += f"{n} 0 obj\n".encode() + body + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(all_objs) + 1}\n0000000000 65535 f \n".encode()
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(all_objs) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    return bytes(out)


if __name__ == "__main__":
    target = Path(sys.argv[1] if len(sys.argv) > 1 else "public/samples/stage0-sample.pdf")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(build())
    print(f"已產生 {target}（{target.stat().st_size} bytes）")
