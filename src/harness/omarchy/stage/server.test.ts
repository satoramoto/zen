// @vitest-environment node
// The stage starts a limited number of sessions at once, however many stories ask.
import { describe, expect, it } from 'vitest';
import { limiter, MAX_STARTING } from './server.mjs';

describe('the stage starts a limited number of sessions at once', () => {
  it('starts four of six at once, the other two as those finish loading, and all six play', async () => {
    expect(MAX_STARTING).toBe(4);
    const start = limiter(MAX_STARTING);
    let loading = 0;
    let most = 0;
    const started: number[] = [];
    const finished: number[] = [];
    // Each "session" takes a different time to load, as Quickshell does.
    const session = (n: number) => start(async () => {
      started.push(n);
      most = Math.max(most, ++loading);
      await new Promise((r) => setTimeout(r, 20 + (n % 3) * 15));
      loading--;
      finished.push(n);
      return n;
    });
    const ready = await Promise.all([1, 2, 3, 4, 5, 6].map(session));
    expect(ready).toEqual([1, 2, 3, 4, 5, 6]);
    expect(most).toBe(4);
    // The fifth and sixth started only after one of the first four had finished loading.
    expect(started.slice(0, 4)).toEqual([1, 2, 3, 4]);
    expect(started.indexOf(5)).toBeGreaterThan(-1);
    expect(finished.length).toBe(6);
  });

  it('lets a request over the limit wait its turn, not fail, when one before it fails', async () => {
    const start = limiter(1);
    const first = start(async () => { throw new Error('Quickshell exited while loading'); });
    const second = start(async () => 'played');
    await expect(first).rejects.toThrow('Quickshell exited while loading');
    await expect(second).resolves.toBe('played');
  });
});
