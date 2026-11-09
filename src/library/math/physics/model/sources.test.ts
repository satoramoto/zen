import { describe, expect, it } from 'vitest';
import { afterIgnition, allDescentSources, getSeconds, HISTORICAL, toGet } from './sources';
import { sourcesMarkdown } from './sourcesDoc';
import sourcesFile from '../SOURCES.md?raw';

describe('every number has a source', () => {
  it('each value cites a Luminary 099 file and line, or says why it is an approximation', () => {
    for (const v of allDescentSources()) {
      expect(Boolean(v.cite) || Boolean(v.approximation), v.name).toBe(true);
      if (v.cite) {
        expect(v.cite.file, v.name).toMatch(/\.agc$/);
        expect(v.cite.line, v.name).toBeGreaterThan(0);
        expect(v.cite.label.length, v.name).toBeGreaterThan(0);
      }
    }
  });
  it('SOURCES.md is written from the registry (run `npx tsx scripts/physics-sources.ts` if not)', () => {
    expect(sourcesFile).toBe(sourcesMarkdown());
  });
  it('mission times convert both ways', () => {
    expect(afterIgnition(HISTORICAL.approachPhase)).toBeCloseTo(506.99, 2);
    expect(toGet(afterIgnition(HISTORICAL.landing))).toBe('102:45:39');
    expect(getSeconds('102:33:05.01')).toBeCloseTo(102 * 3600 + 33 * 60 + 5.01, 6);
  });
});
