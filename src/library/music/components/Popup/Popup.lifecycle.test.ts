// @vitest-environment jsdom
// Listener/top-layer lifecycle only; the visible behaviour is exercised in the stories.
import { afterEach, expect, it, vi } from 'vitest';
import { bindPopup } from './Popup.input';

afterEach(() => { document.body.replaceChildren(); });
it('shows while bound, excludes its live anchor, and removes global dismissal listeners on destroy', () => {
  const root = document.createElement('div'), trigger = document.createElement('button'), panel = document.createElement('div');
  root.append(trigger, panel);
  document.body.append(root);
  const show = vi.fn(), hide = vi.fn(), onDismiss = vi.fn();
  panel.showPopover = show;
  panel.hidePopover = hide;
  const binding = bindPopup(panel, { onDismiss });
  expect(show).toHaveBeenCalledOnce();
  trigger.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  panel.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
  expect(onDismiss).not.toHaveBeenCalled();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  document.body.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
  expect(onDismiss.mock.calls).toEqual([['escape'], ['pointer'], ['wheel']]);
  binding.destroy();
  expect(hide).toHaveBeenCalledOnce();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  expect(onDismiss).toHaveBeenCalledTimes(3);
});
