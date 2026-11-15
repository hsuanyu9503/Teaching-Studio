import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App（Stage 0 佔位）', () => {
  it('顯示專案名稱與相對路徑的驗證頁連結（GitHub Pages 子路徑相容）', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Teaching Studio');
    expect(screen.getByRole('link', { name: /技術驗證頁/ })).toHaveAttribute('href', './diagnostics.html');
  });
});
