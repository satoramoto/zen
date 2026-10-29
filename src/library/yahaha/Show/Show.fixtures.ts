// Show's stories as plain props: Show.stories.tsx draws them (React or Svelte, by the toolbar's
// Renderer). The dataset is the show's own (Show.data.ts); stories only pick the tab.
import { defineFixtures } from '../../fixtures';
import type { ShowModelProps } from './Show.model';

/** The controls, the same in both Storybooks. */
export const showArgTypes = {
  active: { control: 'select', options: ['stage', 'grid', 'arp', 'mix', 'stems'] },
  jam: { control: 'boolean' },
  onTab: { control: false },
  onJam: { control: false },
  onLaunch: { control: false },
  onFire: { control: false },
  disabled: { control: 'boolean' },
} as const;

/** Every story's args by export name. */
export const showStories = defineFixtures<ShowModelProps>()({
  Default: { args: { active: 'stage' } },
  Session: { args: { active: 'grid' } },
  ArpFollow: { args: { active: 'arp' } },
  MixSends: { args: { active: 'mix' } },
  Stems: { args: { active: 'stems' } },
  NoJam: { args: { active: 'stage', jam: false } },
  Disabled: { args: { active: 'stage', disabled: true } },
});
