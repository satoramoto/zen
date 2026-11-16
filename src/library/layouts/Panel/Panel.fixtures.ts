// Panel's stories as plain props: Panel.stories.tsx draws them with any renderer, and the tree
// snapshot records every one.
import { defineFixtures } from '../../fixtures';
import type { PanelModelProps } from './Panel.model';

export const panelStories = defineFixtures<PanelModelProps & { children?: string }>()({
  /** A titled panel linking to its page, with words beside the title and a body. */
  Coins: { args: { title: 'Coins in reach', href: '#board', aside: 'most headroom first', children: 'Sixteen coins.' } },
  /** No body: its empty message. */
  Empty: { args: { title: 'Feed', aside: '0 in the last day', empty: 'Nothing yet. The feed starts after the second collector run.' } },
  /** A third-level heading with no aside. */
  Nested: { args: { title: 'Sources', level: 3, children: 'Three collectors.' } },
});
