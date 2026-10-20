// Disclosure's stories as plain props: Disclosure.stories.tsx draws them (with either renderer's
// `Tree`), and the tree snapshot (`src/library/view/snapshot.test.ts`) prints every instance. No
// callbacks: the stories add their own `onChange` spies.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import { CONTROL_SIZES } from '../Toggle/sizes';
import type { DisclosureModelProps } from './Disclosure.model';

/** The controls. */
export const disclosureArgTypes = {
  size: { control: 'select', options: CONTROL_SIZES },
  disabled: { control: 'boolean' },
  defaultExpanded: { control: 'boolean' },
} as const;

/** Every size, enabled and disabled, closed or open. */
const sheet = (expanded: boolean): FixtureProps<DisclosureModelProps>[] =>
  CONTROL_SIZES.flatMap((size) => [
    { 'aria-label': `${size}, idle`, size, defaultExpanded: expanded },
    { 'aria-label': `${size}, disabled`, size, defaultExpanded: expanded, disabled: true },
  ]);

export const disclosureStories = defineFixtures<DisclosureModelProps>()({
  Playground: { args: { 'aria-label': 'Advanced', size: 'regular', defaultExpanded: false, disabled: false, controls: 'advanced-panel' } },
  Closed: { items: sheet(false) },
  Open: { items: sheet(true) },
});
