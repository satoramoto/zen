import { afterEach, expect, it, vi } from 'vitest';
import { keyed } from '../../view/stores';
import { bindWaveControls, type WaveControlsParams } from './WaveControls.input';

afterEach(() => vi.restoreAllMocks());

function surface() {
  const pending = new Map<number, FrameRequestCallback>();
  let next = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((draw) => { pending.set(++next, draw); return next; });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => { pending.delete(id); });
  const node = document.createElement('div');
  node.tabIndex = 0;
  document.body.append(node);
  vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({ width: 200 } as DOMRect);
  const release = vi.fn();
  Object.assign(node, { setPointerCapture: vi.fn(), hasPointerCapture: () => true, releasePointerCapture: release });
  const pointer = (type: string) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, { button: 0, pointerId: 1, clientX: 100 });
    node.dispatchEvent(event);
  };
  return { node, pending, release, pointer };
}

function initial(): WaveControlsParams {
  return {
    deckId: 'a', ready: true, full: false, focus: 'drums', sourceName: 'Drums', lanes: ['drums', 'bass'], beats: 32, moveTogether: false,
    readFrame: vi.fn(() => ({ decks: {}, masterLevel: 0 })), moveDeck: vi.fn(), setFocus: vi.fn(),
  };
}

it('retains a focused gesture through live updates, then cancels and releases every listener/frame on unmount', () => {
  const view = surface();
  const params = initial();
  const latestRead = vi.fn(() => ({ decks: {}, masterLevel: 0 })), latestMove = vi.fn();
  const binding = bindWaveControls(view.node, params);
  view.pointer('pointerdown');
  expect(view.node).toHaveFocus();
  binding.update({ ...params, readFrame: latestRead, moveDeck: latestMove });
  expect(view.node).toHaveFocus();
  expect(view.pending.size).toBe(1);
  expect(params.moveDeck).toHaveBeenCalledTimes(1);
  expect(latestMove).not.toHaveBeenCalled();
  expect(latestRead).toHaveBeenCalledTimes(1);
  binding.destroy();
  expect(latestMove).toHaveBeenCalledExactlyOnceWith('a', 'cancel');
  expect(view.release).toHaveBeenCalledExactlyOnceWith(1);
  expect(view.pending.size).toBe(0);
  view.pointer('pointerdown');
  view.node.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
  window.dispatchEvent(new Event('blur'));
  expect(latestMove).toHaveBeenCalledTimes(1);
  view.node.remove();
});

it('uses latest keyed handlers but the original gesture deck when the host replaces the bound deck', () => {
  const view = surface();
  const params = initial();
  let handlers = { readFrame: params.readFrame, moveDeck: params.moveDeck, setFocus: params.setFocus };
  const store = keyed(bindWaveControls, ['readFrame', 'moveDeck', 'setFocus']);
  const data = { ...params, readFrame: 'readFrame', moveDeck: 'moveDeck', setFocus: 'setFocus' };
  const binding = store(view.node, data, (key) => handlers[key as keyof typeof handlers])!;
  view.pointer('pointerdown');
  const latestMove = vi.fn();
  handlers = { ...handlers, moveDeck: latestMove };
  binding.update?.({ ...data, deckId: 'b' });
  expect(latestMove).toHaveBeenCalledExactlyOnceWith('a', 'cancel');
  binding.destroy?.();
  expect(latestMove).toHaveBeenCalledTimes(1);
  expect(view.pending.size).toBe(0);
  view.node.remove();
});

it('cancels an active transaction when it is disabled, without committing again on pointer release', () => {
  const view = surface();
  const params = initial();
  const binding = bindWaveControls(view.node, params);
  view.pointer('pointerdown');
  binding.update({ ...params, ready: false });
  view.pointer('pointerup');
  expect(params.moveDeck).toHaveBeenLastCalledWith('a', 'cancel');
  expect(params.moveDeck).toHaveBeenCalledTimes(2);
  binding.destroy();
  expect(view.pending.size).toBe(0);
  view.node.remove();
});
