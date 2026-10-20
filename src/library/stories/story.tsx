// Story helper (not shipped): every story of a view-tree component, built from its fixtures, for
// zen's one Storybook. `const story = fixtureStories<Story>(Button, ButtonSvelte)`, then
// `export const Board: Story = story(s.Board, { play })`: a fixture with `items` draws them in a
// row, one with `args` alone draws the component. `withRenderer` (first in the meta's
// `decorators`, so inside the theme) draws it with React's `Tree`, or, with the toolbar's Renderer on Svelte, mounts the Svelte
// component with the same args, so the play functions exercise either renderer.
import { createElement, useLayoutEffect, useRef, type ComponentType } from 'react';
import type { Decorator } from '@storybook/react-vite';
import { mount, unmount, type Component } from 'svelte';
import { instances, type StoryFixture } from '../fixtures';
import Render from '../svelte/stories/Render.svelte';
import Row from '../svelte/stories/Row.svelte';
import { Tree } from '../view/Tree';
import TreeSvelte from '../view/Tree.svelte';
import type { Handlers, Node } from '../view/Tree.model';

/** The row a story's `items` draw in, the same as `Row.svelte`'s. */
const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' } as const;

/** A story drawn as a view tree: its tree and handlers from the story's args. */
export type StoryView<A> = (args: A) => { tree: Node; handlers?: Handlers };

/** What `withRenderer` needs to draw a story in Svelte: the `.svelte` component and the fixture, or
 *  the story's view tree (`treeStory`). */
type SvelteStory = { component: unknown; fixture: StoryFixture<object> } | { view: StoryView<any> };

/** Mounts a Svelte component into the story (again when its props change), unmounted on the way out. */
function SvelteMount({ component, props }: { component: unknown; props: Record<string, unknown> }) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const app = mount(component as Component<Record<string, unknown>>, { target: host.current!, props });
    return () => {
      void unmount(app);
    };
  }, [component, props]);
  return createElement('div', { ref: host, style: { display: 'contents' } });
}

/** The Renderer toolbar: React draws the story as written; Svelte mounts the story's fixture with
 *  the Svelte component and the story's args. A story with no fixture (a custom layout) stays React. */
export const withRenderer: Decorator = (Story, { globals, parameters, args }) => {
  const svelte = parameters.svelte as SvelteStory | undefined;
  if (globals.renderer !== 'svelte') return createElement(Story);
  if (!svelte) {
    return createElement(
      'div',
      { style: { display: 'grid', gap: 'var(--space-2)' } },
      createElement('small', { style: { opacity: 0.6 } }, 'Drawn by React: this story has a custom layout, with no fixture to draw in Svelte.'),
      createElement(Story),
    );
  }
  if ('view' in svelte) return createElement(SvelteMount, { component: TreeSvelte, props: { ...svelte.view(args) } });
  const { component, fixture } = svelte;
  return fixture.items
    ? createElement(SvelteMount, { component: Row, props: { component, args, items: fixture.items } })
    : createElement(SvelteMount, { component: Render, props: { component, props: args } });
};

/** A story object's shape, enough for the factory (the caller's `StoryObj` type checks the rest). */
interface StoryLike {
  args?: object;
  parameters?: object;
  render?: unknown;
}

/**
 * A story per fixture for `component` (React) and `svelte` (the `.svelte` file's default export):
 * its `args`, a row `render` for its `items`, the fixture for `withRenderer`, then `extra` (a
 * `play`, or a `render` of its own).
 */
export function fixtureStories<S extends StoryLike>(component: ComponentType<any>, svelte: unknown) {
  return (fixture: StoryFixture<object>, extra: Partial<S> = {}): S => {
    // A `render` of its own is a layout the fixture doesn't describe: that story stays React.
    const story: StoryLike = {
      args: fixture.args,
      parameters: 'render' in extra ? {} : { svelte: { component: svelte, fixture } satisfies SvelteStory },
    };
    if (fixture.items) {
      const items = instances({ items: fixture.items });
      story.render = (args: object) =>
        createElement('div', { style: row }, ...items.map((item, i) => createElement(component, { key: i, ...args, ...item })));
    }
    return { ...story, ...extra } as S;
  };
}

/**
 * A story drawn as a view tree (a composite's sample: components by name in each other's slots):
 * React's `Tree` renders `view(args)`, and with Renderer on Svelte, `withRenderer` mounts Svelte's
 * `Tree` with the same tree and handlers.
 */
export function treeStory<A>(view: StoryView<A>): { render: (args: A) => ReturnType<typeof createElement>; parameters: { svelte: SvelteStory } } {
  return { render: (args) => createElement(Tree, view(args)), parameters: { svelte: { view } } };
}
