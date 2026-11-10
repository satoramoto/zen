// Small helpers the physics scenario plays share: press a simulator button, key the DSKY, read a readout.
import { expect, userEvent, waitFor, within } from 'storybook/test';

export const canvasOf = (el: HTMLElement) => within(el);

export async function press(el: HTMLElement, name: string | RegExp, times = 1) {
  const c = within(el);
  for (let i = 0; i < times; i++) await userEvent.click(c.getByRole('button', { name }));
}

/** Key a sequence on the DSKY: `key(el, 'VERB 1 6 NOUN 6 8 ENTR')`. */
export async function key(el: HTMLElement, keys: string) {
  const pad = within(within(el).getByRole('group', { name: 'DSKY keyboard' }));
  const names = keys.match(/KEY REL|VERB|NOUN|ENTR|CLR|PRO|RSET|\d/g) ?? [];
  for (const k of names) await userEvent.click(pad.getByRole('button', { name: /^\d$/.test(k) ? `Key ${k}` : k }));
}

/** A readout's numeric value (`data-value`). */
export const readout = (el: HTMLElement, name: string) => Number(el.querySelector<HTMLElement>(`[data-readout="${name}"]`)!.dataset.value);

/** Keep a number between a scenario's When and Then. */
export const remember = (el: HTMLElement, name: string, value: number) => {
  el.dataset[name] = String(value);
};
export const recall = (el: HTMLElement, name: string) => Number(el.dataset[name]);

export const flightLog = (el: HTMLElement) => [...within(el).getByRole('list', { name: 'Flight log' }).querySelectorAll('li')].map((li) => ({ kind: li.dataset.kind, text: li.textContent ?? '' }));

export async function status(el: HTMLElement, text: string | RegExp) {
  await waitFor(() => expect(within(el).getByRole('status')).toHaveTextContent(text));
}
