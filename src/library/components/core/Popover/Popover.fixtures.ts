// Popover's stories as plain props: the tree snapshot (`src/library/view/snapshot.test.ts`) prints
// every instance. Popover.stories.tsx draws its stories with a trigger and live state of their own
// (a harness), so they stay React; these are the props each story hands its Popover.
import { defineFixtures } from '../../../fixtures';
import type { PopoverModelProps } from './Popover.model';

export const popoverStories = defineFixtures<PopoverModelProps>()({
  /** The harness's details card (Under, Escape, Flipped, Clamped, Scrolls, FromBox). */
  Under: { args: { role: 'dialog', label: 'Details', id: 'details' } },
  /** A menu from a sidebar. */
  OverSidebar: { args: { role: 'menu', label: 'More' } },
  /** A select's list, with a class on the panel. */
  Listbox: { args: { role: 'listbox', label: 'Style', id: 'style-menu', className: 'lib-select__menu' } },
  /** A word's preview in running text: `span`s, portalled, opened by hover. */
  InText: { args: { role: 'dialog', label: 'fundamental', inline: true, portal: true, hover: true } },
});
