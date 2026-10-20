// RackCell's stories as plain props: RackCell.stories.tsx (React) and RackCell.stories.svelte.ts
// (Svelte) both draw them, and parity.test.tsx renders every one in both. The mark is a React node
// or a Svelte snippet, so each Storybook adds its own (Modified, LongName); InRow's SoundCells are
// React's own layout around the cell.
import { defineFixtures } from '../../../fixtures';
import type { RackCellModelProps } from './RackCell.model';

/** The controls, the same in both Storybooks. */
export const rackCellArgTypes = {
  rack: { control: 'text' },
  slot: { control: 'text' },
  label: { control: 'text' },
  name: { control: 'text' },
  tip: { control: 'text' },
} as const;

export const rackCellStories = defineFixtures<RackCellModelProps>()({
  Board: { args: { rack: 'Sunday drive', slot: 'A1', label: 'Rack', tip: 'nav.rack' } },
  NoSlot: { args: { rack: 'Ballad night', slot: '' } },
  Modified: { args: { rack: 'Sunday drive', slot: 'A1' } },
  LongName: { args: { rack: 'Saturday wedding set, second half with horns', slot: 'B4' } },
  Empty: { args: { rack: '', slot: '' } },
  InRow: { args: { rack: 'Sunday drive', slot: 'A1' } },
});
