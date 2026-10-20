// PageList's stories as plain props: PageList.stories.tsx draws them (with either renderer's `Tree`),
// and the tree snapshot (`src/library/view/snapshot.test.ts`) prints every instance.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { PageItem, PageListModelProps } from './PageList.model';

/** The Settings page's six pages, as the Settings screen lists them: names only. */
export const settingsPages: PageItem[] = [
  { id: 'chord', label: 'Chord & Split', tip: 'settings.tab.chord' },
  { id: 'style', label: 'Style', tip: 'settings.tab.style' },
  { id: 'keyboard', label: 'Keyboard', tip: 'settings.tab.keyboard' },
  { id: 'pedals', label: 'Pedals', tip: 'settings.tab.controllers' },
  { id: 'system', label: 'System', tip: 'settings.tab.system' },
  { id: 'launchkey', label: 'Controller', tip: 'settings.tab.launchkey' },
];

/** The controls. */
export const pageListArgTypes = {
  pages: { control: 'object' },
  chosen: { control: 'select', options: [null, ...settingsPages.map((page) => page.id)] },
  label: { control: 'text' },
} as const;

/** The Settings screen's left column, Chord & Split open. Every story starts from it. */
const board: FixtureProps<PageListModelProps> = { pages: settingsPages, chosen: 'chord', label: 'Settings pages' };

export const pageListStories = defineFixtures<PageListModelProps>()({
  Board: { args: board },
  Keys: { args: board },
  SystemOpen: { args: { ...board, chosen: 'system' } },
  NoneOpen: { args: { ...board, chosen: null } },
  LongNames: {
    args: {
      ...board,
      chosen: 'midi',
      pages: [
        ...settingsPages.slice(0, 2),
        { id: 'midi', label: 'MIDI Input & Output Routing', tip: 'settings.tab.midi' },
        { id: 'backup', label: 'Backup, Restore and Factory Reset', tip: 'settings.tab.backup' },
      ],
    },
  },
});
