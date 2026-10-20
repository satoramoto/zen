// Radio's stories as plain props: Radio.stories.tsx draws them (with either renderer's `Tree`), and
// the tree snapshot (`src/library/view/snapshot.test.ts`) prints every instance.
import { defineFixtures } from '../../../fixtures';
import { checkSheet } from '../Checkbox/Checkbox.fixtures';
import type { RadioModelProps } from './Radio.model';

export { checkArgTypes as radioArgTypes } from '../Checkbox/Checkbox.fixtures';

export const radioStories = defineFixtures<RadioModelProps>()({
  /** A group of three sharing a name, Fill picked. */
  Group: {
    items: ['Fill', 'Fit', 'Stretch'].map((name, i) => ({ name: 'fit', value: name, defaultChecked: i === 0, children: name })),
  },
  Checked: { items: checkSheet(true) },
  Unchecked: { items: checkSheet(false) },
  Mixed: { items: checkSheet('mixed') },
});
