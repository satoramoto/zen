// What a Push scenario's play does and reads, in the words of the scenarios: press, hold, latch,
// turn and touch on the surface; the lamps, the display and what the device asked. Everything goes
// through the DOM the surface draws, with real pointer and key events, so a play exercises either
// renderer the same way.
import jsQR from 'jsqr';
import { expect, fireEvent, waitFor } from 'storybook/test';
import { lampShadeCss, lampVar, type LampShade } from '../../foundation/themes/lamps';
import { HOLD_MS } from '../model/timing';
import type { PushInput, PushIntent, PushSet } from '../model/types';
import type { EmulatorHandle } from './Emulator/handle';
import type { PlayContext } from './scenario';

export const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
/** Long enough for a hold to have matured and been drawn. */
export const HOLD = HOLD_MS + 120;

/** A control's cell, by its id in the layout table. */
export function cell(canvas: HTMLElement, id: string): HTMLElement {
  const found = canvas.querySelector<HTMLElement>(`[data-control="${id}"]`);
  if (!found) throw new Error(`The surface has no control ${id}`);
  return found;
}

/** The element inside a cell that takes focus and keys: its button. */
export const face = (canvas: HTMLElement, id: string): HTMLElement => cell(canvas, id).querySelector<HTMLElement>('button, [role="slider"]') ?? cell(canvas, id);

let pointer = 10;
const at = (el: HTMLElement, x = 0.5, y = 0.5) => {
  const r = el.getBoundingClientRect();
  return { clientX: r.left + r.width * x, clientY: r.top + r.height * (1 - y) };
};

export interface Touch {
  id: number;
  el: HTMLElement;
  /** Move to a place on the control: across from the left and up from the bottom, 0 to 1 (beyond 1 is past its edge). */
  move(x: number, y?: number, more?: Record<string, unknown>): Promise<void>;
  up(): Promise<void>;
}

/** Put a pointer down on a control and keep it there. `x` and `y` are where on it, 0 to 1 from the bottom left. */
export async function down(canvas: HTMLElement, id: string, more: { x?: number; y?: number; pointerType?: string; pressure?: number; altKey?: boolean } = {}): Promise<Touch> {
  const el = cell(canvas, id);
  const target = face(canvas, id);
  const pointerId = ++pointer;
  const { x = 0.5, y = 0.5, pointerType = 'mouse', pressure = 0.5, altKey = false } = more;
  const base = { pointerId, pointerType, button: 0, buttons: 1, bubbles: true, isPrimary: true };
  await fireEvent.pointerDown(target, { ...base, ...at(el, x, y), pressure, altKey });
  return {
    id: pointerId,
    el,
    async move(mx, my = y, extra = {}) {
      await fireEvent.pointerMove(target, { ...base, ...at(el, mx, my), pressure, ...extra });
    },
    async up() {
      await fireEvent.pointerUp(target, { ...base, buttons: 0, ...at(el, x, y), pressure: 0 });
    },
  };
}

/** Press a control and let go, after `hold` milliseconds if given. */
export async function press(canvas: HTMLElement, id: string, hold = 0, more: Parameters<typeof down>[2] = {}): Promise<void> {
  const touch = await down(canvas, id, more);
  if (hold) await wait(hold);
  await touch.up();
}

/** Latch a control down with the surface's hold gesture (a right-click), or let a latched one go. */
export async function latch(canvas: HTMLElement, id: string): Promise<void> {
  await fireEvent.contextMenu(face(canvas, id), { bubbles: true });
}

/** Hold some controls (latched), do something, and let them go. */
export async function holding(canvas: HTMLElement, ids: string | string[], during: () => Promise<void>): Promise<void> {
  const list = Array.isArray(ids) ? ids : [ids];
  for (const id of list) await latch(canvas, id);
  await during();
  for (const id of [...list].reverse()) await latch(canvas, id);
}

/** Turn a rotary control by steps (positive: clockwise), with its arrow keys: each key down is a touch, a step, and its key up the release. */
export async function turn(canvas: HTMLElement, id: string, steps: number): Promise<void> {
  const knob = face(canvas, id);
  const key = steps >= 0 ? 'ArrowUp' : 'ArrowDown';
  for (let i = 0; i < Math.abs(steps); i++) {
    await fireEvent.keyDown(knob, { key, code: key, bubbles: true });
    await fireEvent.keyUp(knob, { key, code: key, bubbles: true });
  }
}

/** Touch a rotary control without turning it, do something, and let go. */
export async function touching(canvas: HTMLElement, id: string, during: () => Promise<void> = async () => {}): Promise<void> {
  const touch = await down(canvas, id);
  await during();
  await touch.up();
}

/** Nudge the jog wheel: -1 left, 1 right. */
export async function nudge(canvas: HTMLElement, side: -1 | 1): Promise<void> {
  const el = canvas.querySelector<HTMLElement>(`[data-nudge="${side}"] button`);
  if (!el) throw new Error('The surface has no jog wheel');
  await fireEvent.pointerDown(el, { pointerId: ++pointer, button: 0, bubbles: true });
}

/** Press the jog wheel, the Volume encoder or the Swing & Tempo encoder. */
export async function click(canvas: HTMLElement, id: string): Promise<void> {
  await fireEvent.click(face(canvas, id), { bubbles: true, detail: 1 });
}

/** A key down and up on a control's face. */
export async function key(canvas: HTMLElement, id: string, name: string, more: Record<string, unknown> = {}): Promise<void> {
  const el = face(canvas, id);
  const code = name === ' ' ? 'Space' : name.length === 1 ? `Key${name.toUpperCase()}` : name;
  await fireEvent.keyDown(el, { key: name, code, bubbles: true, ...more });
  await fireEvent.keyUp(el, { key: name, code, bubbles: true, ...more });
}

/** Report an input the face has no control for (a pedal), the way a page does: a `pushinput` event on the surface. */
export async function report(canvas: HTMLElement, control: string, kind: PushInput['kind'], more: Partial<PushInput> = {}): Promise<void> {
  const surface = canvas.querySelector('.push-surface');
  if (!surface) throw new Error('No surface on the page');
  surface.dispatchEvent(new CustomEvent('pushinput', { detail: { control, kind, ...more } }));
  await wait(20);
}
/** Tap a footswitch: 1 or 2. */
export async function pedal(canvas: HTMLElement, n: 1 | 2, hold = 0): Promise<void> {
  await report(canvas, `pedal-${n}`, 'down');
  if (hold) await wait(hold);
  await report(canvas, `pedal-${n}`, 'up');
}

/* ---------- reading ---------- */

/** A control's lamp as drawn: its state, and the colour it was given (a `--push-lamp-N` or a meaning's variable). */
export function lamp(canvas: HTMLElement, id: string): { state: string; colour: string } {
  const el = cell(canvas, id);
  return { state: el.dataset.lamp ?? 'none', colour: el.style.getPropertyValue('--push-lamp') };
}
export const lampState = (canvas: HTMLElement, id: string) => lamp(canvas, id).state;

/** The display, and what it reads. */
export const display = (canvas: HTMLElement): HTMLElement => canvas.querySelector<HTMLElement>('.push-display')!;
export const screenKind = (canvas: HTMLElement) => display(canvas).dataset.kind;
export const screenText = (canvas: HTMLElement) => (display(canvas).textContent ?? '').replace(/\s+/g, ' ').trim();
/** A cell of the top or bottom row, 1 to 8. */
export const tab = (canvas: HTMLElement, row: 'top' | 'bottom', col: number): HTMLElement => display(canvas).querySelector<HTMLElement>(`.push-display__tab[data-row="${row}"][data-col="${col}"]`)!;
/** The body cell that starts at a column. */
export const column = (canvas: HTMLElement, col: number): HTMLElement | null => display(canvas).querySelector<HTMLElement>(`.push-display__cell[data-col="${col}"]`);
export const overlay = (canvas: HTMLElement, kind: string): HTMLElement | null => display(canvas).querySelector<HTMLElement>(`[data-overlay="${kind}"]`);

/** The emulator as the app: its Set, and a way to give a new one. */
export function app(canvas: HTMLElement): EmulatorHandle {
  const root = canvas.querySelector('.push-emulator') as (HTMLElement & { pushEmulator?: EmulatorHandle }) | null;
  if (!root?.pushEmulator) throw new Error('No emulator on the page');
  return root.pushEmulator;
}
/** The app gives a new Set. */
export async function given(canvas: HTMLElement, change: (set: PushSet) => void): Promise<void> {
  app(canvas).change(change);
  await wait(30);
}

type Spy = { mock: { calls: unknown[][] } };
/** Every intent the device has asked in this story, oldest first. */
export const asked = (context: PlayContext): PushIntent[] => (context.args.onIntent as unknown as Spy).mock.calls.map((c) => c[0] as PushIntent);
export const actions = (context: PlayContext): string[] => asked(context).map((i) => i.action);
/** Every input the surface has reported in this story. */
export const inputs = (context: PlayContext): PushInput[] => (context.args.onInput as unknown as Spy).mock.calls.map((c) => c[0] as PushInput);
/** The inputs reported for one control, as `kind` words. */
export const kinds = (context: PlayContext, id: string): string[] => inputs(context).filter((i) => i.control === id).map((i) => i.kind);
/** Forget what was asked and reported so far, so a check reads only what the When did. */
export function forget(context: PlayContext): void {
  for (const spy of [context.args.onIntent, context.args.onInput, context.args.onState]) (spy as unknown as { mockClear(): void }).mockClear();
}

/** The last intent asked with this action, or a failure that lists what was asked. */
export function intent(context: PlayContext, action: string): PushIntent {
  const found = asked(context).filter((i) => i.action === action).at(-1);
  if (!found) throw new Error(`The device did not ask "${action}". It asked: ${actions(context).join(', ') || 'nothing'}`);
  return found;
}

export { expect, waitFor };

/* ---------- setting a scenario up ---------- */

/** Select a track in a Set (and its first device), as a play's `set`. */
export const onTrack = (id: string, more: (set: PushSet) => void = () => {}) => (set: PushSet) => {
  set.selection.track = id;
  set.selection.device = [...set.tracks, ...set.returns, set.main].find((t) => t.id === id)?.devices[0]?.id;
  more(set);
};

/** The intents asked with one action, in order. */
export const all = (context: PlayContext, action: string): PushIntent[] => asked(context).filter((i) => i.action === action);

/** The wheel on a control: `notches` up (positive) or down. */
export async function wheel(canvas: HTMLElement, id: string, notches: number): Promise<void> {
  for (let i = 0; i < Math.abs(notches); i++) await fireEvent.wheel(face(canvas, id), { deltaY: notches > 0 ? -100 : 100, bubbles: true });
}

/** The pads whose note is `pitch`, from the lamps' own colour is not enough: ask the model's grid through the Set. */
export const pads = (canvas: HTMLElement): HTMLElement[] => [...canvas.querySelectorAll<HTMLElement>('[data-kind="pad"]')];

/** A pad's feel element: where the input store writes a held pad's pressure and touch. */
export const feel = (canvas: HTMLElement, id: string): HTMLElement => cell(canvas, id).querySelector<HTMLElement>('.push-surface__feel')!;

/** The colour seen at an element: every ground from `root` (default: the theme scope) down to it, one over the other, so a see-through fill reads as it looks. */
export function groundOf(el: Element, root: Element | null = el.closest('[data-mode]')): [number, number, number] {
  const chain: Element[] = [];
  for (let at: Element | null = el; at; at = at.parentElement) {
    chain.unshift(at);
    if (at === root) break;
  }
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  for (const at of chain) {
    context.fillStyle = getComputedStyle(at).backgroundColor;
    context.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/** A computed colour as red, green and blue, 0 to 255, whatever format the browser words it in. */
export function rgbOf(colour: string): [number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.fillStyle = colour;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}
/** The colour an element is filled with. */
export const fillOf = (el: Element) => rgbOf(getComputedStyle(el).backgroundColor);

/** The colour an unlit lamp is mixed toward, as the surface around `el` has it (dark on a dark body, pale on a light one). */
export function unlitOf(el: Element): [number, number, number] {
  const probe = document.createElement('span');
  probe.style.background = 'var(--push-unlit)';
  el.appendChild(probe);
  const colour = fillOf(probe);
  probe.remove();
  return colour;
}
/** How far apart two colours are, in RGB. */
export const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
/**
 * How lit a lamp looks: how far its colour is from an unlit one. A dimmer lamp is nearer the unlit
 * colour, which is darker on a dark body and paler on a light one, so this reads the same in both modes.
 */
export const litness = (el: Element) => distance(groundOf(el), unlitOf(el));
/** Whether two lamps are the same colour at different strengths: their colours point the same way from unlit. */
export function sameHue(a: Element, b: Element): boolean {
  const u = unlitOf(a);
  const [x, y] = [groundOf(a), groundOf(b)].map((c) => c.map((v, i) => v - u[i]));
  const dot = x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  return dot / (Math.hypot(...x) * Math.hypot(...y) || 1) > 0.95;
}

/** The words in the top or bottom row's eight cells. */
export const rowTexts = (canvas: HTMLElement, row: 'top' | 'bottom'): string[] => [1, 2, 3, 4, 5, 6, 7, 8].map((c) => (tab(canvas, row, c)?.textContent ?? '').trim());
/** The words of every body cell, by its first column. */
export const bodyTexts = (canvas: HTMLElement): Record<number, string> => Object.fromEntries([...display(canvas).querySelectorAll<HTMLElement>('.push-display__cell')].map((el) => [Number(el.dataset.col), (el.textContent ?? '').replace(/\s+/g, ' ').trim()]));
/** The columns that have a body cell. */
export const columns = (canvas: HTMLElement): number[] => [...display(canvas).querySelectorAll<HTMLElement>('.push-display__cell')].map((el) => Number(el.dataset.col)).sort((a, b) => a - b);
/** Hold a control with a pointer for as long as `during` takes. */
export async function holdDown(canvas: HTMLElement, id: string, during: () => Promise<void>, before = 0): Promise<void> {
  const touch = await down(canvas, id);
  if (before) await wait(before);
  await during();
  await touch.up();
}

/* ---------- lamp colours, as the surface writes them ---------- */

/** A table colour, or a shade of it, as a cell's `--push-lamp` reads. */
export const tableLamp = (index: number, shade: LampShade = 'lit') => lampShadeCss(lampVar(index), shade, 'var(--push-unlit)');
/** White, or a shade of it. */
export const whiteLamp = (shade: LampShade = 'lit') => lampShadeCss('var(--push-white)', shade, 'var(--push-unlit)');
/** The grey of an empty pad or step. */
export const GREY = whiteLamp('dark');
/** The colours that mean a state. */
export const GREEN = 'var(--success)';
export const RED = 'var(--danger)';
/** A pad's lamp colour, by row and column from the top left. */
export const padColour = (canvas: HTMLElement, row: number, col: number) => lamp(canvas, `pad-${row}-${col}`).colour;
/** Press a pad by row and column. */
export const hit = (canvas: HTMLElement, row: number, col: number, hold = 0) => press(canvas, `pad-${row}-${col}`, hold);

/** An element's words, each run of text apart from the next: a name and its value read "Name value". */
export function words(el: Element | null | undefined): string {
  if (!el) return '';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const out: string[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) if (node.textContent?.trim()) out.push(node.textContent.trim());
  return out.join(' ');
}
/** The parameter cell that starts at a column, as words. */
export const paramText = (canvas: HTMLElement, col: number) => {
  // A choice's other choices, dim beside or beneath the current one, are not its reading.
  const el = display(canvas).querySelector(`[data-type="param"][data-col="${col}"]`)?.cloneNode(true) as Element | undefined;
  el?.querySelectorAll('[data-part="choice"]').forEach((other) => other.remove());
  return words(el);
};
/** The choices a parameter shows after its current one, dim. */
export const otherChoices = (canvas: HTMLElement, col: number): string[] => [...display(canvas).querySelectorAll(`[data-type="param"][data-col="${col}"] [data-part="choice"]`)].map((el) => (el.textContent ?? '').trim());

/** The lists on the display, left to right: each one's name, its rows, the row marked in it, and whether it is an enclosing menu. */
export function lists(canvas: HTMLElement): { label: string; rows: string[]; chosen: string; enclosing: boolean }[] {
  return [...display(canvas).querySelectorAll<HTMLElement>('.push-display__cell[data-type="list"]')].map((el) => {
    const rows = [...el.querySelectorAll<HTMLElement>('.yh-folder-list__row')];
    const name = (row: HTMLElement | undefined) => (row?.querySelector('.yh-folder-list__label')?.textContent ?? '').replace(/\s+/g, ' ').trim();
    return { label: el.querySelector('[aria-label]')?.getAttribute('aria-label') ?? '', rows: rows.map(name), chosen: name(rows.find((r) => r.getAttribute('aria-current') === 'true')), enclosing: el.hasAttribute('data-enclosing') };
  });
}
/** Press D-pad buttons in turn: `go(c, 'down', 'down', 'centre')`. */
export async function go(canvas: HTMLElement, ...ways: ('up' | 'down' | 'left' | 'right' | 'centre')[]): Promise<void> {
  for (const way of ways) await press(canvas, `dpad-${way}`);
}

/* ---------- a code image ---------- */

/**
 * What a code image on the screen says, read back from what is drawn: its marks are laid out as
 * the pixels a camera would see (dark on white, with its margin) and decoded. `undefined` when
 * there is no code, or it does not read.
 */
export function readCode(root: Element | null | undefined): string | undefined {
  const svg = root?.querySelector('.lib-codeimage svg');
  const d = svg?.querySelector('[data-part="modules"]')?.getAttribute('d');
  const side = Number(svg?.getAttribute('viewBox')?.split(' ')[2]);
  if (!d || !side) return undefined;
  const scale = 4;
  const data = new Uint8ClampedArray(side * scale * side * scale * 4).fill(255);
  for (const [, x, y, w] of d.matchAll(/M(\d+) (\d+)h(\d+)v1/g)) {
    for (let dy = 0; dy < scale; dy++)
      for (let px = Number(x) * scale; px < (Number(x) + Number(w)) * scale; px++) {
        const at = ((Number(y) * scale + dy) * side * scale + px) * 4;
        data[at] = data[at + 1] = data[at + 2] = 0;
      }
  }
  return jsQR(data, side * scale, side * scale)?.data;
}
