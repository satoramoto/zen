// Clock/state lifecycle only. UI behaviour belongs to MixerView's Storybook plays.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePreviewMixer, type PreviewClock } from './usePreviewMixer';

function controlledClock() {
  let now = 0;
  let serial = 0;
  const pending = new Map<number, FrameRequestCallback>();
  const clock: PreviewClock = {
    now: () => now,
    requestFrame: callback => { const handle = ++serial; pending.set(handle, callback); return handle; },
    cancelFrame: handle => { pending.delete(handle); },
  };
  return {
    clock,
    get pending() { return pending.size; },
    step(milliseconds: number) {
      now += milliseconds;
      const callbacks = [...pending.values()];
      pending.clear();
      for (const callback of callbacks) callback(now);
    },
  };
}

describe('usePreviewMixer clock/state lifecycle', () => {
  it('has a stable, read-only frame sampler and allocates no stopped clock', () => {
    const timer = controlledClock();
    const { result, rerender, unmount } = renderHook(() => usePreviewMixer({ clock: timer.clock, initialBeat: 12.5 }));
    const readFrame = result.current.readFrame;
    expect(timer.pending).toBe(0);
    expect(result.current.state.beat).toBe(12);
    expect(readFrame().decks['deck-a'].beat).toBe(12.5);
    const before = readFrame();
    expect(readFrame()).toEqual(before);
    act(() => result.current.commands.setDeck('deck-a', 'gain', 25));
    rerender();
    expect(result.current.readFrame).toBe(readFrame);
    expect(result.current.state.decks[0].gain).toBe(25);
    expect(readFrame()).toEqual(before);
    unmount();
    expect(timer.pending).toBe(0);
  });

  it('advances fractionally, caps background catch-up, and cancels on pause/unmount', () => {
    const timer = controlledClock();
    const { result, unmount } = renderHook(() => usePreviewMixer({ clock: timer.clock }));
    act(() => result.current.commands.setRunning(true));
    expect(timer.pending).toBe(1);
    act(() => timer.step(100));
    expect(result.current.readFrame().decks['deck-a'].beat).toBeCloseTo(124 / 600);
    expect(result.current.state.beat).toBe(0);
    act(() => timer.step(10_000));
    expect(result.current.readFrame().decks['deck-a'].beat).toBeCloseTo(2 * 124 / 600);
    act(() => result.current.commands.setRunning(false));
    expect(timer.pending).toBe(0);
    const paused = result.current.readFrame();
    act(() => timer.step(10_000));
    expect(result.current.readFrame()).toEqual(paused);
    act(() => result.current.commands.setRunning(true));
    act(() => timer.step(100));
    expect(result.current.readFrame().decks['deck-a'].beat).toBeCloseTo(3 * 124 / 600);
    unmount();
    expect(timer.pending).toBe(0);
  });

  it('holds queued choices while paused, commits at the launch boundary and flushes Now', () => {
    const timer = controlledClock();
    const { result } = renderHook(() => usePreviewMixer({ clock: timer.clock }));
    act(() => result.current.commands.setMaster('bpm', 120));
    act(() => result.current.commands.setLaunchBeats?.(8));
    act(() => result.current.commands.setRunning(true));
    act(() => result.current.commands.launch('deck-a', 'verse', 'drums'));
    expect(result.current.state.decks[0].stems[0]).toMatchObject({ selected: 'drop', queued: 'verse' });
    act(() => result.current.commands.setRunning(false));
    act(() => timer.step(10_000));
    expect(result.current.state.decks[0].stems[0].queued).toBe('verse');
    act(() => result.current.commands.setRunning(true));
    for (let i = 0; i < 21; i++) act(() => timer.step(100));
    expect(result.current.state.beat).toBe(4);
    expect(result.current.state.decks[0].stems[0].queued).toBe('verse');
    for (let i = 0; i < 20; i++) act(() => timer.step(100));
    expect(result.current.state.decks[0].stems[0]).toMatchObject({ selected: 'verse', queued: undefined });
    act(() => result.current.commands.launch('deck-a', null, 'bass'));
    expect(result.current.state.decks[0].stems[1].queued).toBeNull();
    act(() => result.current.commands.setLaunchBeats?.(0));
    expect(result.current.state.decks[0].stems[1]).toMatchObject({ selected: null, queued: undefined });
  });

  it('wraps the host loop and Stop clears pending selections, loops and position', () => {
    const timer = controlledClock();
    const { result } = renderHook(() => usePreviewMixer({ clock: timer.clock, initialBeat: 4 }));
    act(() => result.current.commands.setMaster('bpm', 120));
    act(() => result.current.commands.loopIn());
    act(() => result.current.commands.setRunning(true));
    for (let i = 0; i < 11; i++) act(() => timer.step(100));
    act(() => result.current.commands.loopOut());
    expect(result.current.state.loop).toEqual({ start: 4, end: 6, enabled: true });
    act(() => result.current.commands.setLoopEnabled(true));
    for (let i = 0; i < 12; i++) act(() => timer.step(100));
    expect(result.current.readFrame().decks['deck-a'].beat).toBeCloseTo(4.4);
    act(() => result.current.commands.launch('deck-b', 'build'));
    act(() => result.current.commands.stopAll());
    expect(timer.pending).toBe(0);
    expect(result.current.state).toMatchObject({ running: false, beat: 0, loop: { start: null, end: null, enabled: false } });
    for (const deck of result.current.state.decks) {
      expect(deck.loop).toEqual({ start: null, end: null, enabled: false });
      expect(deck.fullSection).toBeNull();
      expect(deck.fullQueued).toBeUndefined();
      expect(deck.stems.every(stem => stem.selected === null && stem.queued === undefined)).toBe(true);
    }
    expect(result.current.readFrame().decks['deck-b'].beat).toBe(0);
    expect(result.current.readFrame().masterLevel).toBe(0);
  });
});
