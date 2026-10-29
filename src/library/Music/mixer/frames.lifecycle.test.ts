import { afterEach, expect, it, vi } from 'vitest';
import { bindFrameMeter, bindFramePlayhead, bindFramePosition, bindFrameWaveLane } from './frames.bind';
import type { MixerFrame } from './model';

afterEach(() => vi.restoreAllMocks());

function clock() {
  let id = 0;
  const pending = new Map<number, FrameRequestCallback>();
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((draw) => { pending.set(++id, draw); return id; });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((key) => { pending.delete(key); });
  vi.spyOn(window.performance, 'now').mockReturnValue(0);
  return {
    pending,
    tick(now: number) {
      const batch = [...pending.values()];
      pending.clear();
      batch.forEach((draw) => draw(now));
    },
  };
}
const snapshot: MixerFrame = { decks: { a: { beat: 1, level: 0.5 } }, masterLevel: 0 };

it('keeps one meter loop through callback updates and cancels queued/stale work on destruction', () => {
  const time = clock();
  const root = document.createElement('div');
  root.innerHTML = '<div role="meter"></div>';
  const first = vi.fn(() => 1), latest = vi.fn(() => 0);
  const binding = bindFrameMeter(root, { sample: first });
  expect(time.pending.size).toBe(1);
  expect(first).not.toHaveBeenCalled();
  time.tick(16);
  binding.update({ sample: latest });
  time.tick(32);
  expect(first).toHaveBeenCalledTimes(1);
  expect(latest).toHaveBeenCalledTimes(1);
  expect(time.pending.size).toBe(1);
  const stale = [...time.pending.values()][0]!;
  binding.destroy();
  expect(time.pending.size).toBe(0);
  stale(48);
  expect(latest).toHaveBeenCalledTimes(1);
  expect(time.pending.size).toBe(0);
});

it.each([
  ['playhead', bindFramePlayhead],
  ['position reading', bindFramePosition],
] as const)('updates the %s reader without restarting its loop and releases it on unmount', (_, bind) => {
  const time = clock();
  const first = vi.fn(() => snapshot), latest = vi.fn(() => snapshot);
  const binding = bind(document.createElement('span'), { deckId: 'a', readFrame: first });
  expect(first).toHaveBeenCalledTimes(1);
  binding.update({ deckId: 'b', readFrame: latest });
  expect(time.pending.size).toBe(1);
  time.tick(16);
  expect(first).toHaveBeenCalledTimes(1);
  expect(latest).toHaveBeenCalledTimes(2);
  binding.destroy();
  time.tick(32);
  expect(latest).toHaveBeenCalledTimes(2);
  expect(time.pending.size).toBe(0);
});

it('replaces a wave lane reader/range in place and cancels the lane loop when it is removed', () => {
  const time = clock();
  const node = document.createElement('div');
  node.innerHTML = '<div class="play-wave-scroll"></div><span class="play-playhead"></span><span class="play-slip-marker"></span>';
  const first = vi.fn(() => snapshot), latest = vi.fn(() => snapshot);
  const params = { deckId: 'a', laneId: 'drums', fixed: false, start: 0, visible: 32, length: 128, readFrame: first };
  const binding = bindFrameWaveLane(node, params);
  binding.update({ ...params, fixed: true, visible: 128, readFrame: latest });
  expect(time.pending.size).toBe(1);
  time.tick(16);
  expect(first).toHaveBeenCalledTimes(1);
  expect(latest).toHaveBeenCalledTimes(2);
  binding.destroy();
  time.tick(32);
  expect(latest).toHaveBeenCalledTimes(2);
  expect(time.pending.size).toBe(0);
});
