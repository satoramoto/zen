// Separator's stories as plain props, and the rows they stand in as view trees: Separator.stories.tsx
// draws each with either renderer's `Tree`, and the tree snapshot records every instance.
import { defineFixtures } from '../../../fixtures';
import { component, h, type Node } from '../../../view/Tree.model';
import { separatorView, type SeparatorModelProps } from './Separator.model';

/** The controls. */
export const separatorArgTypes = {
  length: { control: 'inline-radio', options: ['short', 'full'] },
} as const;

/** The InAppBar story's row: tab labels, `|` where a Separator splits the groups, the chosen tab. */
export const APP_BAR = ['Stage', 'Harm/Arp', '|', 'Library', 'Mixer', '|', 'Settings'];
export const APP_BAR_CHOSEN = 'Harm/Arp';

export const separatorStories = defineFixtures<SeparatorModelProps>()({
  Board: { args: { length: 'short' } },
  Full: { args: { length: 'full' } },
  // Each separator on the bar is a bare `<Separator />`.
  InAppBar: { args: {} },
});

/** Board: the line in a control-high row. */
export const separatorBoard = (args: SeparatorModelProps): Node => h('div', { class: 'lib-row', style: 'height: var(--control-h)' }, separatorView(args));

/** Full: the line spanning a row half again as high, stretched. */
export const separatorFull = (args: SeparatorModelProps): Node =>
  h('div', { class: 'lib-row', style: 'height: calc(var(--control-h) * 1.5); align-items: stretch' }, separatorView(args));

/** InAppBar: the app bar's tab runs (quiet Buttons, by name), split by Separators. */
export const separatorAppBar = (args: SeparatorModelProps): Node =>
  h(
    'div',
    { class: 'lib-row', style: 'flex-wrap: nowrap' },
    APP_BAR.map((label, i) =>
      label === '|'
        ? { ...separatorView(args), key: String(i) }
        : component('Button', { variant: 'quiet', label, chosen: label === APP_BAR_CHOSEN || undefined }, { key: String(i) }),
    ),
  );
