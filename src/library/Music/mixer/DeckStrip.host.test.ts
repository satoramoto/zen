import { afterEach, expect, it, vi } from 'vitest';
import { bindDeckHost } from './DeckStrip.host';

afterEach(() => document.body.replaceChildren());

it('keeps host capture handlers current and removes old listeners on update and destroy', () => {
  const host = document.createElement('div');
  const child = document.createElement('button');
  host.append(child);
  document.body.append(host);
  const first = vi.fn();
  const next = vi.fn();
  const store = bindDeckHost(host, { captures: ['click'], onCapture: first });
  child.addEventListener('click', event => event.stopPropagation());
  child.click();
  expect(first).toHaveBeenCalledOnce();
  expect(first.mock.calls[0][0].target).toBe(child);
  store.update({ captures: ['click', 'drop'], onCapture: next });
  child.click();
  expect(first).toHaveBeenCalledOnce();
  expect(next).toHaveBeenCalledOnce();
  store.update({ captures: ['drop'], onCapture: next });
  child.click();
  expect(next).toHaveBeenCalledOnce();
  child.dispatchEvent(new Event('drop', { bubbles: true }));
  expect(next).toHaveBeenCalledTimes(2);
  store.destroy();
  child.dispatchEvent(new Event('drop', { bubbles: true }));
  expect(next).toHaveBeenCalledTimes(2);
});
