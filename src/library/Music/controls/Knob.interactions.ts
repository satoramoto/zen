/** Story interaction checks: the same controlled host and gestures run under either Renderer. */
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import type { ParameterHarnessProps } from './KnobHarness.model';
export const percentage = { kind: 'float', min: 0, max: 100, defaultValue: 50, unit: 'percent', name: 'Amount' } as const;
export async function exerciseParameter({ canvasElement, args }: { canvasElement: HTMLElement; args: ParameterHarnessProps }) {
  const canvas = within(canvasElement);
  const surface = () => canvas.getByRole('slider');
  const value = async (next: number) => waitFor(() => expect(Number(surface().getAttribute('aria-valuenow'))).toBeCloseTo(next, 5));
  const horizontal = args.control === 'number' || args.orientation === 'horizontal';
  const travel = args.travel ?? (args.control === 'slider' && args.length !== 'auto' && args.layout !== 'inside' ? args.length ?? 27 : 200);
  const at = (distance: number) => ({ pointerId: 31, button: 0, clientX: 100 + (horizontal ? distance : 0), clientY: 100 - (horizontal ? 0 : distance) });
  const fine = { ctrlKey: true, metaKey: true };
  await value(25);
  // Grab, don't jump. Fine can be taken in the middle without changing the anchor.
  await fireEvent.pointerDown(surface(), at(0));
  await value(25);
  await fireEvent.pointerMove(surface(), at(travel / 10));
  await value(35);
  // A controlled host update during the gesture must not re-anchor the hand.
  await fireEvent.click(canvas.getByRole('button', { name: 'Host update' }));
  await value(80);
  await fireEvent.pointerMove(surface(), { ...at(travel / 5), ...fine });
  await value(36);
  await fireEvent.pointerUp(surface(), at(travel / 5));
  await expect(args.onRelease).toHaveBeenCalled();
  await fireEvent.click(canvas.getByRole('button', { name: 'Host update' }));
  await value(80);
  await fireEvent.keyDown(surface(), { key: 'ArrowRight' });
  await value(81);
  await fireEvent.keyDown(surface(), { key: 'ArrowRight', ...fine });
  await value(81.1);
  await fireEvent.keyDown(surface(), { key: 'Home' }); await value(0);
  await fireEvent.keyDown(surface(), { key: 'End' }); await value(100);
  await fireEvent.keyDown(surface(), { key: 'PageDown' }); await value(90);
  // A click pair after a drag resets; a synthetic dblclick immediately after movement must not.
  await userEvent.dblClick(surface());
  await value(50);
  await fireEvent.pointerDown(surface(), at(0));
  await fireEvent.pointerMove(surface(), at(travel / 10));
  await value(60);
  await fireEvent.keyDown(surface(), { key: 'Escape' });
  await value(50);
  await expect(surface()).not.toHaveAttribute('data-dragging');
}
export async function exerciseDisabled({ canvasElement, args }: { canvasElement: HTMLElement; args: ParameterHarnessProps }) {
  const surface = within(canvasElement).getByRole('slider');
  await expect(surface).toHaveAttribute('aria-disabled', 'true');
  await expect(surface).toHaveAttribute('tabindex', '-1');
  await fireEvent.pointerDown(surface, { pointerId: 2, button: 0, clientX: 100, clientY: 100 });
  await fireEvent.pointerMove(surface, { pointerId: 2, clientX: 200, clientY: 0 });
  await fireEvent.pointerUp(surface, { pointerId: 2 });
  await fireEvent.keyDown(surface, { key: 'End' });
  await fireEvent.doubleClick(surface);
  await expect(surface).toHaveAttribute('aria-valuenow', '25');
  await expect(args.onChange).not.toHaveBeenCalled();
}
