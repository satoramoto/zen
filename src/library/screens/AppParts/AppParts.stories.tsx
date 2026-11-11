import type { Meta, StoryObj } from '@storybook/react-vite';
import { createElement, useLayoutEffect, useRef, useState } from 'react';
import { mount, unmount, type Component } from 'svelte';
import { expect, userEvent, within } from 'storybook/test';
import { scenario } from 'story-spec';
import { withLibraryTheme } from '../../storybook';
import { keyed, registerStores } from '../../view';
import { Tree, registerComponents } from '../../view-react';
import { Tree as SvelteTree, registerComponents as registerSvelteComponents } from '../../view-svelte';
import { checkBindingsOnly, checkContract, checkTiers, memoryFiles } from '../../checks';
import { appTree, bindAppHold, holdLog } from './appGauge';
import { AppGauge } from './AppGauge.story';
import AppGaugeSvelte from './AppGauge.story.svelte';

// The app's part and store, registered as an app registers them: once each renderer.
registerComponents({ AppGauge });
registerSvelteComponents({ AppGauge: AppGaugeSvelte as unknown as Component<any> });
registerStores({ appHold: keyed(bindAppHold, []) });

/** One tree drawn by React's Tree and by Svelte's, side by side, until Remove takes both away. */
function BothRenderers() {
  const [shown, setShown] = useState(true);
  const svelteHost = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!shown || !svelteHost.current) return;
    const app = mount(SvelteTree, { target: svelteHost.current, props: { tree: appTree() } });
    return () => void unmount(app);
  }, [shown]);
  return createElement('div', null,
    shown && createElement('section', { 'aria-label': 'React' }, createElement(Tree, { tree: appTree() })),
    shown && createElement('section', { 'aria-label': 'Svelte', ref: svelteHost }),
    createElement('button', { type: 'button', onClick: () => setShown(false) }, 'Remove'),
  );
}

/** What a registration said: the error it was refused with, or that it was taken. */
function Registration() {
  let said = 'registered';
  try {
    registerComponents({ Button: AppGauge });
  } catch (error) {
    said = (error as Error).message;
  }
  return createElement('p', { role: 'status' }, said);
}

const dirty = memoryFiles({
  'app/Gauge/Gauge.css': '.app-gauge {\n  inline-size: var(--control-h);\n  color: #ff3300;\n}\n',
  'app/Gauge/Gauge.tsx': "import { Tree } from '@satoramoto/zen/view/react';\nexport const Gauge = () => <Tree tree={gaugeView()} />;\n",
});
const clean = memoryFiles({
  'app/Gauge/Gauge.css': '.app-gauge {\n  inline-size: var(--control-h);\n  color: var(--text-1);\n}\n',
  'app/Gauge/Gauge.tsx': "import { Tree } from '@satoramoto/zen/view/react';\nexport const Gauge = () => <Tree tree={gaugeView()} />;\n",
});

/** The three checks run on an app's folder, and what each reported. */
function Checks({ files }: { files: ReturnType<typeof memoryFiles> }) {
  const reports = [
    ['Contract', checkContract(files, { folders: ['app'] }).map((f) => `${f.file}:${f.line} ${f.message}`)],
    ['Tiers', checkTiers(files, { folders: ['app'], readAs: 'area' }).failures],
    ['Bindings only', checkBindingsOnly(files, { folders: ['app'] })],
  ] as const;
  return createElement('dl', null, ...reports.flatMap(([name, found]) => [
    createElement('dt', { key: `${name}-t` }, name),
    createElement('dd', { key: `${name}-d`, 'data-check': name }, found.length ? found.join('\n') : 'Nothing'),
  ]));
}

const meta = {
  title: 'Core/Screens/App parts',
  decorators: [withLibraryTheme],
  parameters: { spec: {
    capability: 'library-extension',
    purpose: 'How an app outside zen builds view-tree parts the zen way: registering its own parts and stores with zen\'s runtime in both renderers, and running zen\'s rule checks on its own folders.',
  } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const AnAppsPartInAZenTree: Story = scenario({
  name: "An app's part in a zen tree",
  requirement: 'An app registers its own parts by name',
  shall: "An app SHALL be able to register its own view-tree parts with zen's runtime, once for each renderer, so that a model's `component` node naming one is drawn by that part; a name zen already has SHALL be refused.",
  when: 'an app registers a part named `AppGauge` for React and for Svelte and a tree names it',
  then: "each renderer draws the app's part in its place",
  check: ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const side of ['React', 'Svelte']) {
      const gauge = within(canvas.getByRole('region', { name: side })).getByRole('meter', { name: 'App gauge' });
      expect(gauge).toHaveAttribute('value', '3');
    }
  },
}, { render: () => createElement(BothRenderers) });

export const ATakenName: Story = scenario({
  requirement: 'An app registers its own parts by name',
  shall: "An app SHALL be able to register its own view-tree parts with zen's runtime, once for each renderer, so that a model's `component` node naming one is drawn by that part; a name zen already has SHALL be refused.",
  when: 'an app registers a part named `Button`',
  then: 'the registration is refused with a message naming the part zen already has',
  check: ({ canvasElement }) => {
    expect(within(canvasElement).getByRole('status')).toHaveTextContent('"Button" is zen\'s own part');
  },
}, { render: () => createElement(Registration) });

export const AStoreBoundInBothRenderers: Story = scenario({
  requirement: 'An app registers its own stores by name',
  shall: 'An app SHALL be able to register a store by name, and a tree that binds that name SHALL apply the store in both renderers.',
  when: 'an app registers a store `appHold` and a tree binds it to an element',
  then: 'the store is applied to that element in React and in Svelte, and removed when it unmounts',
  act: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvasElement.dataset.bound = [...canvasElement.querySelectorAll<HTMLElement>('[data-part="held"]')].map((el) => el.dataset.held).join(' ');
    holdLog.length = 0;
    await userEvent.click(canvas.getByRole('button', { name: 'Remove' }));
  },
  check: ({ canvasElement }) => {
    expect(canvasElement.dataset.bound).toBe('bound bound');
    expect(holdLog).toEqual(['removed', 'removed']);
  },
}, { render: () => createElement(BothRenderers) });

export const ALiteralColourInAnAppsPart: Story = scenario({
  name: "A literal colour in an app's part",
  requirement: 'The rule checks run on any folder',
  shall: "zen's contract check, tier rules and bindings-only rule SHALL each be callable on a folder an app names, returning what breaks the rule with its file and line.",
  when: "an app's stylesheet has a literal colour and the contract check is run on its folder",
  then: 'the check reports that file and line',
  check: ({ canvasElement }) => {
    expect(canvasElement.querySelector('[data-check="Contract"]')).toHaveTextContent('app/Gauge/Gauge.css:3 app/Gauge/Gauge.css has a colour literal');
  },
}, { render: () => createElement(Checks, { files: dirty }) });

export const ACleanFolder: Story = scenario({
  requirement: 'The rule checks run on any folder',
  shall: "zen's contract check, tier rules and bindings-only rule SHALL each be callable on a folder an app names, returning what breaks the rule with its file and line.",
  when: "the three checks are run on a folder that keeps zen's rules",
  then: 'each reports nothing',
  check: ({ canvasElement }) => {
    for (const name of ['Contract', 'Tiers', 'Bindings only']) expect(canvasElement.querySelector(`[data-check="${name}"]`)).toHaveTextContent(/^Nothing$/);
  },
}, { render: () => createElement(Checks, { files: clean }) });
