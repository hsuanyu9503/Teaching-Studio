import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PLANNED_CAPABILITIES, isUsable, type PlayerCapabilities } from './types';

describe('播放器能力矩陣', () => {
  it('未驗證能力不得當作可用', () => {
    expect(isUsable('unverified')).toBe(false);
    expect(isUsable(false)).toBe(false);
    expect(isUsable(true)).toBe(true);
  });

  it('第三方嵌入不宣稱工作台可翻頁、讀頁碼或縮放（SPEC §7.2）', () => {
    for (const type of ['powerpoint-embed', 'canva-embed'] as const) {
      const c = PLANNED_CAPABILITIES[type];
      expect(isUsable(c.canNavigatePages)).toBe(false);
      expect(isUsable(c.canReadCurrentPage)).toBe(false);
      expect(isUsable(c.canReadTotalPages)).toBe(false);
      expect(isUsable(c.canZoom)).toBe(false);
    }
  });

  it('與 docs/PLAYER_CAPABILITIES.md 的表格一致', () => {
    const doc = readFileSync(resolve(process.cwd(), 'docs/PLAYER_CAPABILITIES.md'), 'utf8');
    const label = (v: PlayerCapabilities[keyof PlayerCapabilities]) =>
      v === true ? '✅' : v === false ? '❌' : '❓';
    const keys: (keyof PlayerCapabilities)[] = [
      'canNavigatePages', 'canReadCurrentPage', 'canReadTotalPages',
      'canZoom', 'canRestoreProgress', 'hasNativeControls',
    ];
    for (const key of keys) {
      const row = doc.split('\n').find((line) => line.startsWith(`| \`${key}\``));
      expect(row, key).toBeDefined();
      const cells = row!.split('|').map((s) => s.trim());
      // | key | PDF | PowerPoint | Canva | 說明 |
      expect(cells[2]!.startsWith(label(PLANNED_CAPABILITIES.pdf[key])), `${key} PDF`).toBe(true);
      expect(cells[3]!.startsWith(label(PLANNED_CAPABILITIES['powerpoint-embed'][key])), `${key} PPT`).toBe(true);
      expect(cells[4]!.startsWith(label(PLANNED_CAPABILITIES['canva-embed'][key])), `${key} Canva`).toBe(true);
    }
  });
});
