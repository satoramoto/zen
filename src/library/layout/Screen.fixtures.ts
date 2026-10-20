// Screen's stories as plain data: Screen.stories.tsx (React) and Screen.stories.svelte.ts (Svelte)
// both draw them, and parity.test.tsx renders every story's Screen in both (the regions' names
// standing in as the grid's text). The assembled screen's stories are Assembly.fixtures.ts.
import { defineFixtures } from '../fixtures';
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
