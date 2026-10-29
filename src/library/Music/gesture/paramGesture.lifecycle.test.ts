/** Narrow store lifecycle coverage only; visible behavior is exercised by the Music story plays. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindParamGesture } from './paramGesture';
import { bindNumberFieldEditor } from '../controls/NumberField.input';
import { bindWake } from '../controls/wake';

const param = { kind: 'float', min: 0, max: 100, defaultValue: 50 } as const;
function pointer(node: HTMLElement, name: string, fields: Record<string, number> = {}) {
  const event = new Event(name, { bubbles: true, cancelable: true });
  Object.assign(event, { pointerId: 1, button: 0, clientX: 100, clientY: 100, ...fields });
  node.dispatchEvent(event);
}
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); document.body.replaceChildren(); });

describe('Music parameter store lifecycle', () => {
  it('drops queued writes and listeners when destroyed, including pointer capture', () => {
    const node = document.createElement('div');
    document.body.append(node);
    const setCapture = vi.fn();
    const releaseCapture = vi.fn();
    node.setPointerCapture = setCapture;
    node.hasPointerCapture = () => true;
    node.releasePointerCapture = releaseCapture;
    const onChange = vi.fn();
    const onRelease = vi.fn();
    const binding = bindParamGesture(node, { param, value: 25, onChange, onRelease, pointerFocus: true });
    pointer(node, 'pointerdown');
    pointer(node, 'pointermove', { clientY: 80 });
    expect(node.hasAttribute('data-dragging')).toBe(true);
    binding.destroy();
    vi.runAllTimers();
    expect(onChange).not.toHaveBeenCalled();
    expect(onRelease).not.toHaveBeenCalled();
    expect(releaseCapture).toHaveBeenCalledWith(1);
    expect(node.hasAttribute('data-dragging')).toBe(false);
    expect(node.hasAttribute('data-pointer-focus')).toBe(false);
    pointer(node, 'pointerdown');
    node.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    vi.runAllTimers();
    expect(setCapture).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('flushes through the latest callbacks once on capture loss, then stops tracking', () => {
    const node = document.createElement('div');
    const oldChange = vi.fn();
    const onChange = vi.fn();
    const onRelease = vi.fn();
    const binding = bindParamGesture(node, { param, value: 25, onChange: oldChange });
    pointer(node, 'pointerdown');
    pointer(node, 'pointermove', { clientY: 80 });
    binding.update({ param, value: 80, onChange, onRelease });
    pointer(node, 'lostpointercapture');
    expect(oldChange).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onRelease).toHaveBeenCalledTimes(1);
    pointer(node, 'pointermove', { clientY: 20 });
    pointer(node, 'pointerup');
    vi.runAllTimers();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onRelease).toHaveBeenCalledTimes(1);
    binding.destroy();
  });

  it('closes an editor exactly once and detaches its callbacks on destroy', () => {
    const input = document.createElement('input');
    document.body.append(input);
    const onCommit = vi.fn();
    const onCancel = vi.fn();
    const onDraft = vi.fn();
    const binding = bindNumberFieldEditor(input, { onCommit, onCancel, onDraft });
    expect(document.activeElement).toBe(input);
    input.value = '62';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    input.dispatchEvent(new Event('blur'));
    expect(onDraft).toHaveBeenCalledOnce();
    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
    binding.destroy();
    input.dispatchEvent(new Event('input'));
    expect(onDraft).toHaveBeenCalledOnce();
  });

  it('cancels the wake clock when the widget unmounts', () => {
    const node = document.createElement('div');
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    const binding = bindWake(node, { live: 0.5, reading: '50' });
    binding.update({ live: 0.8, reading: '80' });
    const properties = node.style.cssText;
    binding.destroy();
    expect(cancel).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(node.style.cssText).toBe(properties);
  });
});
