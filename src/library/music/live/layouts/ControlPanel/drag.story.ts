// Story harness (not shipped): a drag on a fader's track, for the plays that ride one.
import { fireEvent } from 'storybook/test';

/** A drag on a fader's track, upward. */
export async function dragUp(el: HTMLElement, by = 60) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height * 0.7;
  await fireEvent.pointerDown(el, { pointerId: 5, button: 0, clientX: x, clientY: y });
  for (let i = 1; i <= 4; i++) await fireEvent.pointerMove(el, { pointerId: 5, clientX: x, clientY: y - (by * i) / 4 });
  await fireEvent.pointerUp(el, { pointerId: 5, clientX: x, clientY: y - by });
}
