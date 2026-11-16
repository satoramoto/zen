// The DOM renderer (`foundation/view/Tree.dom.ts`): zen's view trees drawn straight into the DOM,
// with no framework, as the Hotwire entry draws them. Each story is a scenario of
// `library-dom-renderer`; the Core plays drawn with `--renderer dom` show the rest of its parts'
// behaviour. A story draws into a host element of its own, React drawing only the host.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createElement, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { flushSync as flushSvelte, mount, unmount, type Component } from 'svelte';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { scenario } from 'story-spec';
import { withLibraryTheme } from '../../storybook';
import { instances } from '../../fixtures';
import Render from '../../foundation/svelte/stories/Render.svelte';
import { textFill } from '../../foundation/view/dom';
import { DOM_FIXTURES } from '../../foundation/view/domFixtures';
import { domParts, mountPart } from '../../foundation/view/domComponents';
import { maskIds, serialize } from '../../foundation/view/domText';
import { reactComponent } from '../../foundation/view/reactComponents';
import { svelteComponent } from '../../foundation/view/svelteComponents';
import { Icon } from '../../primitives/Icon/Icon';
import IconSvelte from '../../primitives/Icon/Icon.svelte';
import { Hole, Opaque } from '../../primitives/Surface/Surface';
import HoleSvelte from '../../primitives/Hole/Hole.svelte';
import OpaqueSvelte from '../../primitives/Opaque/Opaque.svelte';
import { VoteControl } from '../../components/VoteControl/VoteControl';
import VoteControlSvelte from '../../components/VoteControl/VoteControl.svelte';

const meta = {
  title: 'Core/Screens/DOM renderer',
  decorators: [withLibraryTheme],
  parameters: { layout: 'padded', spec: { capability: 'library-dom-renderer', change: 'rails-dom-renderer' } },
  render: () => createElement('div', { 'data-testid': 'host' }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const hostOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-testid="host"]')!;

/** The parts neither registry holds by name (a binding draws them directly). */
const DIRECT: Record<string, [ComponentType<any>, unknown]> = { Hole: [Hole, HoleSvelte], Opaque: [Opaque, OpaqueSvelte], Icon: [Icon, IconSvelte], VoteControl: [VoteControl, VoteControlSvelte] };

/** Generated ids masked, and VoteControl's own (`lib-vote-<n>`, a count of the controls made so far). */
const mask = (dom: string) => maskIds(dom).replace(/lib-vote-\d+/g, 'lib-vote-n');

/** `props` drawn by each renderer into its own box in `host`, each box's DOM as text, then taken away. */
function threeWays(host: HTMLElement, name: string, props: Record<string, unknown>) {
  const [react, svelte] = DIRECT[name] ?? [reactComponent(name), svelteComponent(name)];
  const boxes = [0, 1, 2].map(() => host.appendChild(document.createElement('div')));
  const root = createRoot(boxes[0]);
  flushSync(() => root.render(createElement(react, props)));
  const app = mount(Render, { target: boxes[1], props: { component: svelte as Component<any>, props } });
  flushSvelte();
  const { children, ...rest } = props;
  const part = mountPart(boxes[2], name, typeof children === 'string' ? { ...rest, children: textFill(children) } : props);
  const drawn = boxes.map((box) => mask(serialize(box)));
  root.unmount();
  void unmount(app);
  part.destroy();
  for (const box of boxes) box.remove();
  return drawn;
}

export const EveryFixtureMatches: Story = scenario({
  name: 'Every fixture matches across three renderers',
  requirement: 'A part draws the same DOM in every renderer',
  shall: 'A converted core part drawn by the DOM renderer SHALL produce the same elements, attributes and text as the React and Svelte renderers for every one of its fixtures.',
  when: 'each fixture of a converted part is drawn by the React, Svelte and DOM renderers',
  then: 'the three DOMs are identical',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    const differ: string[] = [];
    let drawn = 0;
    for (const [name, fixtures] of Object.entries(DOM_FIXTURES)) {
      for (const [story, fixture] of Object.entries(fixtures ?? {})) {
        for (const props of instances(fixture)) {
          const [react, svelte, dom] = threeWays(host, name, props as Record<string, unknown>);
          drawn++;
          if (react === '' || svelte !== react || dom !== react) differ.push(`${name} / ${story}`);
        }
      }
    }
    host.dataset.drawn = String(drawn);
    host.dataset.differ = differ.join(', ');
  },
  check: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    await expect(host.dataset.differ).toBe('');
    await expect(Number(host.dataset.drawn)).toBeGreaterThan(500);
  },
}) as Story;

export const CompositeDrawsItsParts: Story = scenario({
  name: 'A composite draws its parts',
  requirement: 'The core parts are available by name',
  shall: 'Every converted core control, and every primitive and layout those controls draw, SHALL be drawable by its registered name. A part that draws another SHALL draw it through the same registry.',
  when: 'a Popover is drawn by name with the DOM renderer',
  then: 'the layer and surface it is made of are drawn too, as in the other renderers',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    const [react, , dom] = threeWays(host, 'Popover', { role: 'dialog', label: 'Details', id: 'details', anchor: { left: 0, top: 0, bottom: 0 } });
    host.dataset.react = react;
    host.dataset.dom = dom;
    mountPart(host, 'Popover', { role: 'dialog', label: 'Details', id: 'details', anchor: { left: 0, top: 0, bottom: 0 }, children: textFill('Hello') });
  },
  check: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    await expect(host.dataset.dom).toBe(host.dataset.react);
    const panel = host.querySelector('[role="dialog"][aria-label="Details"]')!;
    await expect(panel.classList.contains('lib-layer')).toBe(true);
    await expect(panel.classList.contains('lib-surface')).toBe(true);
    await expect(panel).toHaveTextContent('Hello');
  },
}) as Story;

export const UnknownNameSaysSo: Story = scenario({
  name: 'An unknown name is an error that says so',
  requirement: 'The core parts are available by name',
  when: 'a name that no part has is drawn',
  then: 'drawing fails with an error naming the part and where parts are registered',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    try {
      mountPart(host, 'Gauge', {});
    } catch (error) {
      host.dataset.error = (error as Error).message;
    }
  },
  check: async ({ canvasElement }) => {
    const said = hostOf(canvasElement).dataset.error ?? '';
    await expect(said).toContain('"Gauge"');
    await expect(said).toContain('src/library/foundation/view/domComponents.ts');
    await expect(Object.keys(domParts())).not.toContain('Gauge');
  },
}) as Story;

const pick = fn();

export const SelectPicksWithKeys: Story = scenario({
  name: 'A select opens and picks with the keyboard',
  requirement: 'Behaviour is the part\'s own',
  shall: 'A part drawn by the DOM renderer SHALL behave as it does in the other renderers: its handlers fire on the same events and its stores (long press, keys, popover placement) are applied to its elements.',
  when: 'a Select drawn by the DOM renderer is focused and the person presses ArrowDown then Enter',
  then: 'its change callback receives the next member\'s index',
  act: async ({ canvasElement }) => {
    pick.mockClear();
    const host = hostOf(canvasElement);
    mountPart(host, 'Select', { items: ['Best published', 'Median submission'], index: 0, name: 'Figure to beat', onChange: pick });
    host.querySelector<HTMLElement>('[role="combobox"]')!.focus();
    await userEvent.keyboard('{ArrowDown}');
  },
  check: async () => {
    await expect(pick).toHaveBeenLastCalledWith(1);
  },
}) as Story;

export const FocusSurvivesNewValue: Story = scenario({
  name: 'Focus survives a new value',
  requirement: 'An update patches in place',
  shall: 'Giving a mounted part new props SHALL update its existing elements rather than replace them, so focus, a press in progress and a store\'s state survive the update.',
  when: 'a focused Segmented receives a new value',
  then: 'the same element keeps focus and the new segment reads as chosen',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    const props = (index: number) => ({ items: ['One', 'Two', 'Three'], index, label: 'Count', onChange: () => {} });
    const part = mountPart(host, 'Segmented', props(0));
    const first = host.querySelector('button')!;
    first.focus();
    first.dataset.first = '';
    part.update(props(1));
  },
  check: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    const first = host.querySelector('button')!;
    await expect(first.hasAttribute('data-first')).toBe(true);
    await expect(document.activeElement).toBe(first);
    const buttons = Array.from(host.querySelectorAll('button'));
    await expect(buttons[1].getAttribute('aria-checked') ?? buttons[1].getAttribute('aria-pressed')).toBe('true');
  },
}) as Story;

export const PopoverCleanedUp: Story = scenario({
  name: 'An open popover is cleaned up',
  requirement: 'Destroying leaves nothing behind',
  shall: 'Destroying a mounted part SHALL remove what it drew, destroy every store it applied and remove every listener it added, including anything it placed outside its element.',
  when: 'a part with an open popover is destroyed',
  then: 'the popover\'s layer is gone from the document and no store or listener of it remains',
  act: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    const dismiss = fn();
    const part = mountPart(host, 'Popover', { role: 'dialog', label: 'Away', anchor: { left: 0, top: 0, bottom: 0 }, portal: true, onDismiss: dismiss, children: textFill('Moved out') });
    await waitFor(() => expect(document.querySelector('[role="dialog"][aria-label="Away"]')).not.toBeNull());
    // Portalled: drawn outside the host.
    host.dataset.inside = String(host.contains(document.querySelector('[role="dialog"][aria-label="Away"]')));
    part.destroy();
    // Escape and a press outside would have reached a dismissal still bound.
    await userEvent.keyboard('{Escape}');
    await userEvent.click(document.body);
    host.dataset.dismissed = String(dismiss.mock.calls.length);
  },
  check: async ({ canvasElement }) => {
    const host = hostOf(canvasElement);
    await expect(host.dataset.inside).toBe('false');
    await expect(document.querySelector('[role="dialog"][aria-label="Away"]')).toBeNull();
    await expect(host.dataset.dismissed).toBe('0');
    await expect(host.childNodes).toHaveLength(0);
  },
}) as Story;
