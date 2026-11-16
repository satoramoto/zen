// zen's parts in a Hotwire page (`hotwire.ts`): placeholders written as a server writes them,
// brought in by real Turbo (a lazy frame, a stream, a morph) and drawn by the `zen` Stimulus
// controller. Responses are stubbed, Turbo Drive is off so the Storybook page never navigates,
// and Turbo's page cache is played as Turbo does it: `turbo:before-cache`, a copy of the page
// taken, the page replaced, the copy put back. Each story is a scenario of `library-hotwire`.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createElement } from 'react';
import { Application, Controller } from '@hotwired/stimulus';
import { morphChildren, renderStreamMessage, session } from '@hotwired/turbo';
import { expect, userEvent, waitFor } from 'storybook/test';
import { scenario } from 'story-spec';
import { withLibraryTheme } from '../../storybook';
import { registerZen } from '../../hotwire';

// Frames and streams only: links and forms in Storybook stay Storybook's.
session.drive = false;

/** Records what reaches it: a `zen:change` event's detail, a native `change`'s field. */
class Probe extends Controller<HTMLElement> {
  heard(event: CustomEvent<unknown[]>) {
    this.element.dataset.heard = JSON.stringify(event.detail);
  }
  changed(event: Event) {
    const field = event.target as HTMLInputElement;
    this.element.dataset.changed = `${field.name}=${field.value}`;
  }
}

/** A Stimulus application on the story's host, with zen's controllers and the probe. */
function start(host: HTMLElement) {
  const application = Application.start(host);
  registerZen(application);
  application.register('probe', Probe);
  return application;
}

/** `/zen-hotwire/<name>` answered with `pages[name]`, until the story ends. */
function serve(pages: Record<string, string>) {
  const real = window.fetch;
  window.fetch = (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href);
    const page = url.pathname.startsWith('/zen-hotwire/') ? pages[url.pathname.slice('/zen-hotwire/'.length)] : undefined;
    if (page === undefined) return real(input, init);
    return Promise.resolve(new Response(page, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
  };
  return () => {
    window.fetch = real;
  };
}

const json = (value: unknown) => JSON.stringify(value).replace(/'/g, '&#39;');

/** A Select placeholder, as Market's `zen_select` writes one. */
const select = (index: number, attrs = '') =>
  `<div data-controller="zen" data-zen-part-value="Select" data-zen-props-value='${json({ items: ['Best published', 'Median submission'], index, name: 'Figure to beat' })}' data-zen-field-value="basis" data-zen-values-value='${json(['top', 'median'])}'${attrs}></div>`;

/** A Button placeholder; `icon`, markup for its icon slot. */
const button = (label: string, icon = '') =>
  `<div data-controller="zen" data-zen-part-value="Button" data-zen-props-value='${json({ label })}'>${icon ? `<template data-zen-slot="icon">${icon}</template>` : ''}</div>`;

const meta = {
  title: 'Core/Screens/Hotwire',
  decorators: [withLibraryTheme],
  tags: ['browser'],
  parameters: { layout: 'padded', spec: { capability: 'library-hotwire', change: 'rails-dom-renderer' } },
  render: () => createElement('div', { 'data-testid': 'host' }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const hostOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-testid="host"]')!;
const comboboxes = (root: ParentNode) => Array.from(root.querySelectorAll<HTMLElement>('[role="combobox"]'));

export const LazyFrame: Story = scenario({
  name: 'A part loads in a lazy frame',
  requirement: 'A placeholder in the HTML becomes the part',
  shall: 'An element that names a part and carries its props as JSON SHALL be drawn as that part when it enters the document, by any route: the first page load, a Turbo visit, a frame or a stream.',
  when: 'a lazy Turbo frame loads HTML holding a Select placeholder',
  then: 'a Select is drawn in the frame with the placeholder\'s members and value',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    const stop = serve({ filters: `<turbo-frame id="filters">${select(1)}</turbo-frame>` });
    start(host);
    host.innerHTML = '<turbo-frame id="filters" src="/zen-hotwire/filters" loading="lazy">Loading…</turbo-frame>';
    await waitFor(() => expect(comboboxes(host)).toHaveLength(1), { timeout: 5000 });
    stop();
  },
  check: async ({ canvasElement }) => {
    const frame = hostOf(canvasElement).querySelector('turbo-frame')!;
    const [field] = comboboxes(frame);
    await expect(field).toHaveTextContent('Median submission');
    await expect(frame.querySelector<HTMLInputElement>('input[name="basis"]')!.value).toBe('median');
  },
}) as Story;

export const Stream: Story = scenario({
  name: 'A part arrives in a stream',
  requirement: 'A placeholder in the HTML becomes the part',
  when: 'a Turbo stream replaces an element with HTML holding a Button placeholder',
  then: 'the Button is drawn where the element was',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    start(host);
    host.innerHTML = '<p>Before</p><span id="watch">☆</span><p>After</p>';
    renderStreamMessage(`<turbo-stream action="replace" target="watch"><template><div id="watch">${button('Watch')}</div></template></turbo-stream>`);
    await waitFor(() => expect(host.querySelector('#watch button')).not.toBeNull());
  },
  check: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    const watch = host.querySelector('#watch')!;
    await expect(watch.querySelector('button')).toHaveTextContent('Watch');
    await expect(watch.previousElementSibling).toHaveTextContent('Before');
    await expect(watch.nextElementSibling).toHaveTextContent('After');
  },
}) as Story;

export const FrameReplace: Story = scenario({
  name: 'A frame replaces its contents',
  requirement: 'A part removed from the page is destroyed',
  shall: 'A drawn part SHALL be destroyed when its element leaves the document, whether a frame, a stream or a visit removed it.',
  when: 'a frame holding a part with an open menu loads new contents',
  then: 'the part and its menu are gone and nothing of it remains in the document',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    const stop = serve({ first: `<turbo-frame id="swap">${select(0)}</turbo-frame>`, second: '<turbo-frame id="swap"><p>Nothing to choose</p></turbo-frame>' });
    start(host);
    host.innerHTML = '<turbo-frame id="swap" src="/zen-hotwire/first"></turbo-frame>';
    await waitFor(() => expect(comboboxes(host)).toHaveLength(1), { timeout: 5000 });
    await userEvent.click(comboboxes(host)[0]);
    await waitFor(() => expect(document.querySelector('[role="listbox"]')).not.toBeNull());
    host.querySelector('turbo-frame')!.setAttribute('src', '/zen-hotwire/second');
    await waitFor(() => expect(host).toHaveTextContent('Nothing to choose'), { timeout: 5000 });
    stop();
  },
  check: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    await expect(comboboxes(document)).toHaveLength(0);
    await expect(document.querySelector('[role="listbox"]')).toBeNull();
    await expect(host.querySelector('input[name="basis"]')).toBeNull();
  },
}) as Story;

export const NewProps: Story = scenario({
  name: 'The server sends a new value',
  requirement: 'New props update the part in place',
  shall: 'Changing a placeholder\'s props attribute SHALL update the drawn part in place.',
  when: 'a placeholder\'s props are changed to a new value while it is drawn',
  then: 'the part shows the new value and keeps focus if it had it',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    start(host);
    host.innerHTML = select(0);
    await waitFor(() => expect(comboboxes(host)).toHaveLength(1));
    const field = comboboxes(host)[0];
    field.dataset.first = '';
    field.focus();
    host.querySelector('[data-controller="zen"]')!.setAttribute('data-zen-props-value', JSON.stringify({ items: ['Best published', 'Median submission'], index: 1, name: 'Figure to beat' }));
    await waitFor(() => expect(comboboxes(host)[0]).toHaveTextContent('Median submission'));
  },
  check: async ({ canvasElement }) => {
    const [field] = comboboxes(hostOf(canvasElement));
    await expect(field.hasAttribute('data-first')).toBe(true);
    await expect(document.activeElement).toBe(field);
    await expect(hostOf(canvasElement).querySelector<HTMLInputElement>('input[name="basis"]')!.value).toBe('median');
  },
}) as Story;

export const Morph: Story = scenario({
  name: 'A page refresh morphs',
  requirement: 'A morph keeps the drawn part',
  shall: 'A Turbo morph of the page SHALL not wipe a drawn part back to its placeholder; the part takes the morphed placeholder\'s props in place.',
  when: 'a page with a focused Select is refreshed by morphing and the server\'s value differs',
  then: 'the Select is still drawn, still focused, and shows the server\'s value',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    start(host);
    host.innerHTML = `<h2>Board</h2>${select(0, ' id="basis"')}<p>12 coins</p>`;
    await waitFor(() => expect(comboboxes(host)).toHaveLength(1));
    const field = comboboxes(host)[0];
    field.dataset.first = '';
    field.focus();
    const fresh = document.createElement('div');
    fresh.innerHTML = `<h2>Board</h2>${select(1, ' id="basis"')}<p>14 coins</p>`;
    morphChildren(host, fresh);
    await waitFor(() => expect(host).toHaveTextContent('14 coins'));
  },
  check: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    const fields = comboboxes(host);
    await expect(fields).toHaveLength(1);
    await expect(fields[0].hasAttribute('data-first')).toBe(true);
    await expect(document.activeElement).toBe(fields[0]);
    await waitFor(() => expect(fields[0]).toHaveTextContent('Median submission'));
  },
}) as Story;

export const Cache: Story = scenario({
  name: 'Back to a cached page',
  requirement: 'The page cache holds no stale part',
  shall: 'A page restored from Turbo\'s cache SHALL draw its parts afresh from their placeholders, never show the drawing taken when it was cached as if it were live.',
  when: 'the person visits another page and goes back',
  then: 'each part is drawn once, works, and has no duplicate beside it',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    start(host);
    host.innerHTML = `<form data-controller="probe" data-action="change->probe#changed">${select(0)}${button('Apply')}</form>`;
    await waitFor(() => expect(comboboxes(host)).toHaveLength(1));
    // Turbo caches the page: before-cache, then a copy of the page as it is.
    document.dispatchEvent(new Event('turbo:before-cache', { bubbles: true }));
    const snapshot = host.cloneNode(true) as HTMLElement;
    host.dataset.cached = String(comboboxes(snapshot).length);
    // Another page, then back: the copy is put back.
    host.replaceChildren(Object.assign(document.createElement('p'), { textContent: 'Another page' }));
    host.replaceChildren(...Array.from(snapshot.childNodes));
    await waitFor(() => expect(comboboxes(host)).toHaveLength(1));
    comboboxes(host)[0].focus();
    await userEvent.keyboard('{ArrowDown}');
  },
  check: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    await expect(host.dataset.cached).toBe('0');
    await expect(comboboxes(host)).toHaveLength(1);
    await expect(host.querySelectorAll('button')).toHaveLength(2);
    await expect(host.querySelectorAll('input[name="basis"]')).toHaveLength(1);
    await expect(host.querySelector('form')!.dataset.changed).toBe('basis=median');
  },
}) as Story;

export const Events: Story = scenario({
  name: 'A Stimulus action hears a change',
  requirement: 'Callbacks are DOM events',
  shall: 'A part\'s callbacks SHALL be dispatched as bubbling events on its placeholder, named for the callback, with the callback\'s arguments in the event\'s detail.',
  when: 'a Select\'s member is chosen inside an element whose action listens for `zen:change`',
  then: 'the action runs with the chosen index in the event\'s detail',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    start(host);
    host.innerHTML = `<section data-controller="probe" data-action="zen:change->probe#heard">${select(0)}</section>`;
    await waitFor(() => expect(comboboxes(host)).toHaveLength(1));
    await userEvent.click(comboboxes(host)[0]);
    await userEvent.click(await waitFor(() => document.querySelector<HTMLElement>('[role="option"]:nth-child(2)')!));
  },
  check: async ({ canvasElement }) => {
    await expect(hostOf(canvasElement).querySelector('section')!.dataset.heard).toBe('[1]');
  },
}) as Story;

export const FormField: Story = scenario({
  name: 'A filter form submits the chosen value',
  requirement: 'A part with a value is a form field',
  shall: 'A part given a field name SHALL keep a named form value in step with what it shows and announce a change as a native field does, so a server form submits it and existing change handlers run.',
  when: 'a Select named `basis` is changed inside a form whose actions listen for `change`',
  then: 'the form\'s `change` actions run with `basis` and the chosen value, and submitting it sends them',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    start(host);
    host.innerHTML = `<form data-controller="probe" data-action="change->probe#changed">${select(0)}<input name="sort" value="headroom" type="hidden"></form>`;
    await waitFor(() => expect(comboboxes(host)).toHaveLength(1));
    comboboxes(host)[0].focus();
    await userEvent.keyboard('{ArrowDown}');
  },
  check: async ({ canvasElement }) => {
    const form = hostOf(canvasElement).querySelector('form')!;
    await expect(form.dataset.changed).toBe('basis=median');
    const sent = new FormData(form);
    await expect(sent.get('basis')).toBe('median');
    await expect(sent.get('sort')).toBe('headroom');
  },
}) as Story;

export const KeptWithoutServer: Story = scenario({
  name: 'A choice is kept without the server',
  requirement: 'A part with a value is a form field',
  when: 'a value part is changed and the server sends nothing back',
  then: 'the part shows the new value',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    start(host);
    host.innerHTML = select(0);
    await waitFor(() => expect(comboboxes(host)).toHaveLength(1));
    comboboxes(host)[0].focus();
    await userEvent.keyboard('{ArrowDown}');
  },
  check: async ({ canvasElement }) => {
    await expect(comboboxes(hostOf(canvasElement))[0]).toHaveTextContent('Median submission');
  },
}) as Story;

export const ServerSlot: Story = scenario({
  name: 'A button with a server-rendered icon',
  requirement: 'Slots are filled from server HTML',
  shall: 'A part\'s slots SHALL be fillable with markup the server wrote inside its placeholder.',
  when: 'a Button placeholder holds a template for its icon slot with an SVG',
  then: 'the Button draws that SVG in its icon place',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    start(host);
    host.innerHTML = button('Watch', '<svg data-icon="star" viewBox="0 0 16 16"><path d="M8 1l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z"/></svg>');
    await waitFor(() => expect(host.querySelector('button')).not.toBeNull());
  },
  check: async ({ canvasElement }) => {
    const pressed = hostOf(canvasElement).querySelector('button')!;
    await expect(pressed.querySelector('svg[data-icon="star"]')).not.toBeNull();
    await expect(pressed).toHaveTextContent('Watch');
  },
}) as Story;

export const SystemDark: Story = scenario({
  name: 'The system turns dark',
  requirement: 'A theme scope from markup',
  shall: 'An element marked with a pack and a mode SHALL be scoped to that pack\'s theme, following the system\'s light or dark setting when the mode says so.',
  when: 'the scope\'s mode follows the system and the system switches to dark',
  then: 'the scoped element\'s colours switch to the pack\'s dark ones without a reload',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    // The system's light/dark setting, played: a media query list the story switches.
    const real = window.matchMedia;
    const heard = new Set<() => void>();
    const dark = { matches: false, media: '(prefers-color-scheme: dark)', addEventListener: (_: string, f: () => void) => heard.add(f), removeEventListener: (_: string, f: () => void) => heard.delete(f) };
    window.matchMedia = ((query: string) => (query.includes('prefers-color-scheme') ? dark : real.call(window, query))) as typeof window.matchMedia;
    start(host);
    host.innerHTML = `<div data-controller="zen-theme" data-zen-theme-pack-value="linear" data-zen-theme-mode-value="system">${button('Apply')}</div>`;
    const scope = host.firstElementChild as HTMLElement;
    await waitFor(() => expect(scope).toHaveAttribute('data-mode', 'light'));
    scope.dataset.light = scope.style.cssText;
    dark.matches = true;
    for (const f of heard) f();
    window.matchMedia = real;
  },
  check: async ({ canvasElement }) => {
    const scope = hostOf(canvasElement).firstElementChild as HTMLElement;
    await expect(scope).toHaveAttribute('data-mode', 'dark');
    await expect(scope).toHaveAttribute('data-zen-pack', 'linear');
    await expect(scope.classList.contains('lib-scope')).toBe(true);
    await expect(scope.style.cssText).not.toBe(scope.dataset.light);
  },
}) as Story;
