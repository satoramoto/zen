// Screen's stories as plain data: `screenStories` (each story's Screen, the regions' names standing
// in as the grid's text) for the tree snapshot, and `screenSample`, the stories' composed screen as
// a view tree (Screen.stories.tsx draws it with either renderer's `Tree`). The assembled screen's
// stories are Assembly.fixtures.ts.
import { defineFixtures } from '../fixtures';
import { component, h, type Node } from '../view/Tree.model';
import type { ScreenModelProps } from './Screen.model';

/** The arrangements the story switches between: each grid's areas and tracks. */
export const ARRANGEMENTS: Record<string, { areas: string[]; columns?: string; rows?: string }> = {
  'Hero over two': { areas: ['hero hero', 'mixer pads'], columns: 'minmax(0, 1.4fr) minmax(0, 1fr)', rows: 'auto minmax(0, 1fr)' },
  'Three across': { areas: ['hero mixer pads'] },
  'Sidebar and main': { areas: ['pads hero', 'pads mixer'], columns: 'minmax(180px, 1fr) minmax(0, 3fr)', rows: 'auto minmax(0, 1fr)' },
  Stacked: { areas: ['hero', 'mixer', 'pads'] },
};

/** The stories' controls: which arrangement, and whether the header and footer are drawn. */
export interface ScreenArgs {
  arrangement: string;
  header: boolean;
  footer: boolean;
}

export const screenArgs: ScreenArgs = { arrangement: 'Hero over two', header: true, footer: true };

export const screenArgTypes = {
  arrangement: { control: 'select', options: Object.keys(ARRANGEMENTS) },
  header: { control: 'boolean' },
  footer: { control: 'boolean' },
} as const;

/** Each story's args over `screenArgs`. */
export const screenStoryArgs = {
  Default: {},
  GridOnly: { header: false, footer: false },
} satisfies Record<string, Partial<ScreenArgs>>;

export const HEADER_NOTE = 'Header: fixed, never scrolls with the grid';
export const FOOTER_NOTE = 'Footer: fixed at the bottom';

/** The Screen props (and header and footer text) for a story's args. */
export const screenProps = ({ arrangement, header, footer }: ScreenArgs): ScreenModelProps & { header?: string; footer?: string } => ({
  name: 'Stage',
  ...ARRANGEMENTS[arrangement],
  header: header ? HEADER_NOTE : undefined,
  footer: footer ? FOOTER_NOTE : undefined,
});

/** The parity fixtures: each story's Screen, and every arrangement. */
export const screenStories = defineFixtures<ScreenModelProps & { header?: string; footer?: string }>()({
  Default: { args: { ...screenProps({ ...screenArgs, ...screenStoryArgs.Default }), children: 'hero, mixer, pads' } },
  GridOnly: { args: { ...screenProps({ ...screenArgs, ...screenStoryArgs.GridOnly }), children: 'hero, mixer, pads' } },
  Arrangements: {
    args: { name: 'Stage', children: 'hero, mixer, pads' },
    items: Object.values(ARRANGEMENTS),
  },
});

/* ---------- the stories as a view tree (a composite: Screen holding Regions) ---------- */

/** A muted caption line inside a region. */
const note = (text: string): Node => h('p', { style: 'margin: 0; color: var(--text-3); font-size: var(--size-caption)' }, text);

/** A Region (a registered component) holding `text`. */
const region = (props: Record<string, string>, text: string) => component('Region', props, { slots: { children: [note(text)] } });

/** A story's tree: Screen (in a frame the height of the canvas) with the app bar and keys as Regions
 *  in its header and footer slots, and a Region per grid area in its children. */
export function screenSample(args: ScreenArgs): Node {
  const { header, footer, ...props } = screenProps(args);
  return h(
    'div',
    { style: 'height: calc(100vh - 2 * var(--space-6))' },
    component('Screen', props as Record<string, unknown>, {
      slots: {
        ...(header ? { header: [region({ name: 'App bar' }, HEADER_NOTE)] } : {}),
        ...(footer ? { footer: [region({ name: 'Keys' }, FOOTER_NOTE)] } : {}),
        children: [
          region({ name: 'Hero', label: 'Hero', area: 'hero' }, 'area="hero"'),
          region({ name: 'Mixer', label: 'Mixer', area: 'mixer' }, 'area="mixer"'),
          region({ name: 'Pads', label: 'Pads', area: 'pads' }, 'area="pads"'),
        ],
      },
    }),
  );
}
