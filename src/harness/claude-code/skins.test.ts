import { describe, expect, it } from 'vitest';
import file from './kit/skins.ts?raw';
import { packs } from '../../library/themes/packs';
import { SKINS } from './kit/skins';
import { C, FILL, GRAY, INK, MUTED, RAMP, SKIN, STATUS, THEME_KEY, isKitColor, levelColor, termInk, wear } from './kit/tokens';
import { packSkins, skinsSource } from './skins';

/** awesome-claude's kit/tokens.ts before it moved into zen: the look the Claude Code pack keeps. */
const LEGACY = {
  C: { ok: '#5bc08a', warn: '#e3a33b', bad: '#e5636f', blue: '#6c8ef5', purple: '#9d85e8', cyan: '#4fb3c8', slate: '#8c9bb5', orchid: '#c58ad6' },
  RAMP: { blue: ['#6c8ef5', '#4c68c9', '#a9bbf9', '#38509e'], slate: ['#8c9bb5', '#6f7c93', '#a7b2c6', '#5b667a'] },
  MUTED: '#8e8e93',
  GRAY: { light: '#b9b9b6', mid: '#8a8a87', dark: '#62625f' },
  FILL: { selected: 'rgba(108,142,245,0.13)', selectedBlurred: 'rgba(108,142,245,0.065)' },
};

describe('Claude Code skins', () => {
  it('kit/skins.ts is what the packs give (run `npx tsx scripts/harness-skins.ts` if not)', () => {
    expect(file).toBe(skinsSource());
  });

  it('every pack has a skin', () => {
    expect(Object.keys(SKINS)).toEqual(packs.map((p) => p.id));
  });

  it('the kit starts in the Claude Code pack, drawing the look awesome-claude drew', () => {
    expect(SKIN).toBe('claude-code');
    expect(C).toEqual(LEGACY.C);
    expect(INK).toBe(LEGACY.C.slate);
    expect(RAMP).toEqual(LEGACY.RAMP);
    expect(MUTED).toBe(LEGACY.MUTED);
    expect(GRAY).toEqual(LEGACY.GRAY);
    expect(FILL).toMatchObject(LEGACY.FILL);
  });

  it('every skin keeps one value per meaning: no status or chart shade shares a value, no grey takes one of theirs', () => {
    for (const [id, s] of Object.entries(packSkins())) {
      const all = [s.ok, s.warn, s.bad, s.blue, s.purple, s.cyan, s.slate, s.orchid, ...s.ramp.blue, ...s.ramp.slate, s.muted, ...Object.values(s.gray)];
      for (const v of all) expect(v, id).toMatch(/^#[0-9a-f]{6}$/);
      // A ramp's base is its meaning's own value.
      expect(s.ramp.blue[0], id).toBe(s.blue);
      expect(s.ramp.slate[0], id).toBe(s.slate);
      const meanings = [s.ok, s.warn, s.bad, s.blue, s.purple, s.cyan, s.orchid, ...s.ramp.blue.slice(1), ...s.ramp.slate];
      expect(new Set(meanings).size, id).toBe(meanings.length);
      for (const grey of [s.muted, ...Object.values(s.gray)]) expect(meanings, `${id} ${grey}`).not.toContain(grey);
    }
  });

  it('wearing a pack recolours the app surfaces and keeps every meaning on its terminal theme key', () => {
    try {
      wear('linear');
      const s = SKINS.linear;
      expect(SKIN).toBe('linear');
      expect(C.ok).toBe(s.ok);
      expect(INK).toBe(s.slate);
      expect(MUTED).toBe(s.muted);
      expect(STATUS.running.color).toBe(s.blue);
      expect(STATUS.merged.color).toBe(s.purple);
      expect(levelColor(95)).toBe(s.bad);
      expect(levelColor(10)).toBe(s.slate);
      expect(termInk(s.ok)).toEqual({ color: 'success' });
      expect(termInk(s.bad)).toEqual({ color: 'error' });
      expect(termInk(s.warn)).toEqual({ color: 'warning' });
      expect(termInk(s.blue)).toEqual({ color: 'suggestion' });
      expect(termInk(s.purple)).toEqual({ color: 'merged' });
      expect(termInk(s.muted)).toEqual({ dimColor: true });
      expect(termInk(s.slate)).toEqual({});
      expect(termInk(s.orchid)).toEqual({ dimColor: true });
      // The last skin's values mean nothing now: they draw as any other raw colour.
      expect(THEME_KEY[LEGACY.C.ok]).toBeUndefined();
      expect(isKitColor(LEGACY.C.ok)).toBe(false);
    } finally {
      wear('claude-code');
    }
    expect(C).toEqual(LEGACY.C);
    expect(termInk(LEGACY.C.ok)).toEqual({ color: 'success' });
  });
});
