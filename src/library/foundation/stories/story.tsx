// Story helper (not shipped): every story of a view-tree component, built from its fixtures, for
// zen's one Storybook. `const story = fixtureStories<Story>(Button, ButtonSvelte)`, then
// `export const Board: Story = story(s.Board, { play })`: a fixture with `items` draws them in a
// row, one with `args` alone draws the component. `withRenderer` (first in the meta's
// `decorators`, so inside the theme) draws it with React's `Tree`, or, with the toolbar's Renderer on Svelte, mounts the Svelte
// component with the same args, or with Renderer on DOM draws the part with the DOM renderer, so the
// play functions exercise each renderer.
import { createElement, useLayoutEffect, useRef, type ComponentType } from 'react';
import type { Decorator } from '@storybook/react-vite';
import { mount, unmount, type Component } from 'svelte';
import { instances, type StoryFixture } from '../../fixtures';
import Render from '../svelte/stories/Render.svelte';
import Row from '../svelte/stories/Row.svelte';
import { liveProps, type LiveProps } from '../svelte/stories/props.svelte';
import { Tree } from '../view/Tree';
import TreeSvelte from '../view/Tree.svelte';
import { useThemeScope } from '../../theme';
import { themeScopeContext } from '../svelte/theme.svelte';
import type { Handlers, Node } from '../view/Tree.model';
import { mountTree, type DomScope } from '../view/Tree.dom';
import { domComponent, domParts, mountPart } from '../view/domComponents';
import { coreStores } from '../view/coreStores';
import { textFill } from '../view/dom';
import { reactComponent } from '../view/reactComponents';
import { Icon } from '../../primitives/Icon/Icon';
import { Hole, Opaque } from '../../primitives/Surface/Surface';
import { VoteControl } from '../../components/VoteControl/VoteControl';
import { Gate } from '../../components/Gate/Gate';
import { NamePicker } from '../../components/NamePicker/NamePicker';

/** The row a story's `items` draw in, the same as `Row.svelte`'s. */
const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' } as const;

/** A story drawn as a view tree: its tree and handlers from the story's args. */
export type StoryView<A> = (args: A) => { tree: Node; handlers?: Handlers };

/** What `withRenderer` needs to draw a story in Svelte: the `.svelte` component and the fixture, or
 *  the story's view tree (`treeStory`). */
type SvelteStory = { component: unknown; fixture: StoryFixture<object> } | { view: StoryView<any> };

/** Mounts a Svelte component into the story (again when the component or the theme scope change),
 *  unmounted on the way out. New props (a story host applying an intent to its args) reach the same
 *  instance, so a drag in progress and the focus survive them. The React scope's facets and
 *  principles reach it as Svelte's scope context, so `getThemeScope()` (a Surface's pack shaders, an
 *  assembled screen's principles) reads what React's `useThemeScope()` does. */
function SvelteMount({ component, props }: { component: unknown; props: Record<string, unknown> }) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<LiveProps<Record<string, unknown>> | null>(null);
  const scope = useThemeScope();
  const facets = scope?.facets;
  const principles = scope?.principles;
  useLayoutEffect(() => {
    const context = themeScopeContext(facets ? { facets, principles } : null);
    const held = liveProps(props);
    live.current = held;
    const app = mount(component as Component<Record<string, unknown>>, { target: host.current!, props: held.props, context });
    return () => {
      live.current = null;
      void unmount(app);
    };
    // New props go through `live` (below): a change of props alone never remounts.
  }, [component, facets, principles]);
  useLayoutEffect(() => {
    live.current?.set(props);
  }, [props]);
  return createElement('div', { ref: host, style: { display: 'contents' } });
}

/** The parts drawn directly rather than by name in React (no registry entry), by DOM part name. */
const DIRECT: Record<string, unknown> = { Icon, Hole, Opaque, VoteControl, Gate, NamePicker };

/** The DOM part a story's React component is, or null when the DOM renderer has none. */
function domNameOf(component: unknown): string | null {
  for (const name of Object.keys(domParts())) {
    if (DIRECT[name] === component) return name;
    try {
      if (reactComponent(name) === component) return name;
    } catch {
      // Not in React's registry: only in DIRECT.
    }
  }
  return null;
}

/** Whether the DOM renderer draws every part `tree` names (it draws the core alone). */
function domDraws(tree: unknown): boolean {
  if (tree === null || typeof tree !== 'object') return true;
  if (Array.isArray(tree)) return tree.every(domDraws);
  const node = tree as { component?: string; children?: unknown[]; slots?: Record<string, unknown> };
  if (node.component !== undefined && node.component !== 'Context' && !(node.component in domParts())) return false;
  return (node.children ?? []).every(domDraws) && Object.values(node.slots ?? {}).every(domDraws);
}

/** A fixture's props for the DOM renderer: a string `children` as its text, as `Render.svelte` draws it. */
const domProps = (props: Record<string, unknown>) => (typeof props.children === 'string' ? { ...props, children: textFill(props.children) } : props);

/** Draws a story with the DOM renderer: the part named `name` with the args (once per item, in a
 *  row, for a fixture's `items`), or a view tree. New args reach the same parts, so focus and a drag
 *  in progress survive them; the React scope's facets reach them as the DOM scope. */
function DomMount({ name, view, args, items }: { name?: string; view?: StoryView<any>; args: Record<string, unknown>; items?: Record<string, unknown>[] }) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<((args: Record<string, unknown>) => void) | null>(null);
  const theme = useThemeScope();
  const scope: DomScope | null = theme ? { facets: theme.facets as DomScope['facets'], principles: theme.principles } : null;
  useLayoutEffect(() => {
    const target = host.current!;
    if (view) {
      const context = (a: Record<string, unknown>) => {
        const drawn = view(a);
        return [drawn.tree, { slots: {}, handlers: drawn.handlers ?? {}, stores: coreStores, components: domComponent, contexts: {}, scope, svg: false }] as const;
      };
      const tree = mountTree(target, null, ...context(args));
      live.current = (a) => tree.update(...context(a));
      return () => {
        live.current = null;
        tree.destroy();
      };
    }
    const parts = (items ?? [{}]).map((item) => mountPart(target, name!, domProps({ ...args, ...item }), { scope }));
    live.current = (a) => parts.forEach((part, i) => part.update(domProps({ ...a, ...(items?.[i] ?? {}) }), { scope }));
    return () => {
      live.current = null;
      for (const part of parts) part.destroy();
    };
    // New args go through `live` (below): a change of args alone never remounts.
  }, [name, view, theme?.facets, theme?.principles]);
  useLayoutEffect(() => {
    live.current?.(args);
  }, [args]);
  return createElement('div', { ref: host, style: items ? row : { display: 'contents' } });
}

/** The Renderer toolbar: React draws the story as written; Svelte mounts the story's fixture with
 *  the Svelte component and the story's args. A story with no fixture (a custom layout) stays React. */
export const withRenderer: Decorator = (Story, { globals, parameters, args, component: metaComponent }) => {
  const svelte = parameters.svelte as SvelteStory | undefined;
  if (globals.renderer !== 'svelte' && globals.renderer !== 'dom') return createElement(Story);
  const dom = globals.renderer === 'dom';
  const domName = dom && svelte && !('view' in svelte) ? domNameOf((parameters.reactComponent as unknown) ?? metaComponent) : null;
  const domless = dom && svelte && ('view' in svelte ? !domDraws(svelte.view(args).tree) : !domName);
  if (!svelte || domless) {
    return createElement(
      'div',
      { style: { display: 'grid', gap: 'var(--space-2)' } },
      createElement('small', { style: { opacity: 0.6 } }, `Drawn by React: this story has ${svelte ? 'parts the DOM renderer does not draw' : 'a custom layout, with no fixture'} to draw in ${dom ? 'the DOM renderer' : 'Svelte'}.`),
      createElement(Story),
    );
  }
  if (dom) {
    if ('view' in svelte) return createElement(DomMount, { view: svelte.view, args });
    const items = svelte.fixture.items ? (instances({ items: svelte.fixture.items }) as Record<string, unknown>[]) : undefined;
    return createElement(DomMount, { name: domName!, args, items });
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
      parameters: 'render' in extra ? {} : { svelte: { component: svelte, fixture } satisfies SvelteStory, reactComponent: component },
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
