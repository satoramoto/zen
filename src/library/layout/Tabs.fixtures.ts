// Tabs' stories as plain props: Tabs.stories.tsx (React) and Tabs.stories.svelte.ts (Svelte) both
// draw them, and the parity test renders every one in both.
import { defineFixtures } from '../fixtures';
import type { TabItemModel, TabsModelProps } from './Tabs.model';

/** The mixer's views, the stories' choices. */
export const VIEWS: TabItemModel[] = [
  { id: 'faders', label: 'Faders' },
  { id: 'sends', label: 'Sends' },
  { id: 'parts', label: 'Parts' },
  { id: 'fx', label: 'Effects' },
];

/** The controls, the same in both Storybooks. */
export const tabsArgTypes = {
  name: { control: 'text' },
  value: { control: 'select', options: [null, ...VIEWS.map((t) => t.id)] },
  items: { control: 'object' },
} as const;

export const tabsStories = defineFixtures<TabsModelProps>()({
  Default: { args: { name: 'Mixer view', items: VIEWS.slice(0, 3), value: 'faders' } },
  Two: { args: { name: 'Layer', items: VIEWS.slice(0, 2), value: 'faders' } },
  WithDisabled: {
    args: { name: 'Mixer view', items: VIEWS.map((t, i) => (i === 1 ? { ...t, disabled: true } : t)), value: 'faders' },
  },
  NoneChosen: { args: { name: 'Mixer view', items: VIEWS.slice(0, 3), value: null } },
});
