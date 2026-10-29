// @vitest-environment jsdom
// Narrow store lifecycle evidence, not model/appearance tests (those are story plays).
import { afterEach, expect, it, vi } from 'vitest';
import { bindMomentary } from './Momentary.input';

afterEach(() => { document.body.replaceChildren(); });
function mount() {
  const node = document.createElement('button');
  document.body.append(node);
  return node;
}
function pointer(node: HTMLElement, type: string, pointerId = 1, button = 0) {
  const event = new MouseEvent(type, { button, bubbles: true, cancelable: true });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  node.dispatchEvent(event);
}
function key(node: HTMLElement, type: string, value: string, repeat = false) {
  node.dispatchEvent(new KeyboardEvent(type, { key: value, repeat, cancelable: true }));
}

it('releases exactly once on cancel, capture loss and window blur; removes listeners on destroy', () => {
  const node = mount(), onHold = vi.fn();
  const binding = bindMomentary(node, { onHold });
  for (const cancel of [() => pointer(node, 'pointercancel'), () => pointer(node, 'lostpointercapture'), () => window.dispatchEvent(new Event('blur'))]) {
    pointer(node, 'pointerdown');
    cancel();
    pointer(node, 'pointerup');
  }
  expect(onHold.mock.calls).toEqual([[true], [false], [true], [false], [true], [false]]);
  binding.destroy();
  pointer(node, 'pointerdown');
  window.dispatchEvent(new Event('blur'));
  expect(onHold).toHaveBeenCalledTimes(6);
});

it('ends a live hold on disable or destroy using the latest callback', () => {
  const node = mount(), first = vi.fn(), latest = vi.fn();
  const binding = bindMomentary(node, { onHold: first });
  pointer(node, 'pointerdown');
  binding.update({ disabled: true, onHold: latest });
  expect(first.mock.calls).toEqual([[true]]);
  expect(latest.mock.calls).toEqual([[false]]);
  pointer(node, 'pointerdown');
  expect(latest).toHaveBeenCalledTimes(1);
  binding.update({ disabled: false, onHold: latest });
  pointer(node, 'pointerdown');
  binding.destroy();
  expect(latest.mock.calls).toEqual([[false], [true], [false]]);
});

it('owns one pointer; keyboard Space supports Enter takeover, repeat suppression, Escape and focus cancellation', () => {
  const node = mount(), onHold = vi.fn(), onTakeover = vi.fn();
  const binding = bindMomentary(node, { onHold, onTakeover });
  pointer(node, 'pointerdown', 1);
  pointer(node, 'pointerup', 2);
  expect(onHold.mock.calls).toEqual([[true]]);
  pointer(node, 'pointerup', 1);
  key(node, 'keydown', ' ');
  key(node, 'keydown', ' ', true);
  key(node, 'keydown', 'Enter');
  key(node, 'keyup', 'Enter');
  expect(onTakeover).toHaveBeenCalledOnce();
  expect(onHold).toHaveBeenLastCalledWith(true);
  key(node, 'keyup', ' ');
  key(node, 'keydown', 'Enter');
  key(node, 'keyup', 'Enter');
  key(node, 'keydown', ' ');
  key(node, 'keydown', 'Escape');
  key(node, 'keyup', ' ');
  key(node, 'keydown', ' ');
  node.dispatchEvent(new Event('blur'));
  expect(onHold.mock.calls).toEqual([[true], [false], [true], [false], [true], [false], [true], [false], [true], [false]]);
  binding.destroy();
});
