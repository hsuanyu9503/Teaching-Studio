import { describe, expect, it } from 'vitest';
import { parseEmbedSource } from './embedSource';

const CANVA_VIEW = 'https://www.canva.com/design/DAGabc1234/XyZ_tok-en9/view';

describe('parseEmbedSource — Canva', () => {
  it('接受 view 連結並由系統組出 ?embed 網址', () => {
    const r = parseEmbedSource(`${CANVA_VIEW}?utm_content=x&utm_medium=embeds#frag`);
    expect(r).toEqual({ ok: true, provider: 'canva', embedSrc: `${CANVA_VIEW}?embed`, openUrl: CANVA_VIEW });
  });

  it('從嵌入程式碼只擷取 iframe src，忽略其他屬性與 script', () => {
    const code = `<div style="position:relative"><iframe loading="lazy" onload="alert(1)" src="${CANVA_VIEW}?embed" allow="fullscreen"></iframe></div><script>alert(1)</script><a href="${CANVA_VIEW}">x</a>`;
    const r = parseEmbedSource(code);
    expect(r.ok && r.embedSrc).toBe(`${CANVA_VIEW}?embed`);
  });

  it('編輯連結與短網址提示改用嵌入', () => {
    expect(parseEmbedSource('https://www.canva.com/design/DAGabc1234/edit')).toMatchObject({ ok: false, reason: 'share-link-not-embed' });
    expect(parseEmbedSource('https://canva.link/abcdef')).toMatchObject({ ok: false, reason: 'share-link-not-embed' });
  });

  it('不接受仿冒網域', () => {
    for (const u of [
      'https://www.canva.com.evil.example/design/DAGabc1234/XyZ_tok-en9/view',
      'https://evil.example/https://www.canva.com/design/DAGabc1234/XyZ_tok-en9/view',
      'https://wwwcanva.com/design/DAGabc1234/XyZ_tok-en9/view',
      'https://www.canva.com@evil.example/design/DAGabc1234/XyZ_tok-en9/view',
    ]) {
      expect(parseEmbedSource(u).ok, u).toBe(false);
    }
  });
});

describe('parseEmbedSource — PowerPoint', () => {
  it('接受 OneDrive /embed', () => {
    const u = 'https://onedrive.live.com/embed?resid=ABC%21123&authkey=%21XYZ&em=2';
    expect(parseEmbedSource(`<iframe src="${u}" width="962" height="565" frameborder="0">這是內嵌的 Office 簡報。</iframe>`))
      .toEqual({ ok: true, provider: 'powerpoint', embedSrc: u, openUrl: u });
  });

  it('接受 SharePoint action=embedview', () => {
    const u = 'https://contoso.sharepoint.com/:p:/r/sites/t/_layouts/15/Doc.aspx?sourcedoc=%7B1%7D&action=embedview&wdAr=1.77';
    const r = parseEmbedSource(u);
    expect(r.ok && r.provider).toBe('powerpoint');
  });

  it('一般分享連結提示改用內嵌', () => {
    for (const u of [
      'https://1drv.ms/p/s!Abc123',
      'https://onedrive.live.com/edit?id=ABC',
      'https://contoso.sharepoint.com/:p:/g/personal/x/EabcDEF?e=123',
    ]) {
      expect(parseEmbedSource(u), u).toMatchObject({ ok: false, reason: 'share-link-not-embed', provider: 'powerpoint' });
    }
  });

  it('不接受多層子網域或仿冒的 sharepoint 主機', () => {
    expect(parseEmbedSource('https://a.b.sharepoint.com/x?action=embedview').ok).toBe(false);
    expect(parseEmbedSource('https://contoso.sharepoint.com.evil.example/x?action=embedview').ok).toBe(false);
  });

  it('本機 PPTX 不被誤認為已支援格式（SPEC §9.1）', () => {
    expect(parseEmbedSource('C:\\教材\\第一課.pptx')).toMatchObject({ ok: false, reason: 'local-file' });
    expect(parseEmbedSource('lesson.ppt')).toMatchObject({ ok: false, reason: 'local-file' });
  });
});

describe('parseEmbedSource — 通用安全規則', () => {
  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['javascript:alert(1)', 'not-https'],
    ['data:text/html,<script>alert(1)</script>', 'not-https'],
    ['http://www.canva.com/design/DAGabc1234/XyZ_tok-en9/view', 'not-https'],
    ['https://user:pw@www.canva.com/design/DAGabc1234/XyZ_tok-en9/view', 'credentials-in-url'],
    ['https://www.canva.com:8443/design/DAGabc1234/XyZ_tok-en9/view', 'non-default-port'],
    ['not a url', 'not-url'],
    ['https://example.com/slides', 'unsupported-host'],
    ['<p>no frame</p>', 'no-iframe-src'],
    ['<iframe></iframe>', 'no-iframe-src'],
    ['<iframe src="https://a"></iframe><iframe src="https://b"></iframe>', 'multiple-iframes'],
    ['<iframe src="javascript:alert(1)"></iframe>', 'not-https'],
    ['x'.repeat(9000), 'too-long'],
  ])('%s → %s', (input, reason) => {
    expect(parseEmbedSource(input)).toMatchObject({ ok: false, reason });
  });
});
