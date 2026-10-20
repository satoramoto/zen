// SearchField's stories as plain props: SearchField.stories.tsx draws them with either renderer, and
// the tree snapshot (src/library/view/snapshot.test.ts) prints every instance.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { SearchFieldModelProps } from './SearchField.model';

/** The controls. */
export const searchFieldArgTypes = {
  value: { control: 'text' },
  label: { control: 'text' },
  placeholder: { control: 'text' },
  width: { control: { type: 'number', min: 80, step: 10 } },
  tip: { control: 'text' },
} as const;

/** Every story's args underneath its own. */
export const searchFieldArgs = {
  value: '',
  label: 'Search styles',
  placeholder: 'Search',
  width: 280,
  tip: 'library.search',
} as const satisfies FixtureProps<SearchFieldModelProps>;

export const searchFieldStories = defineFixtures<SearchFieldModelProps>()({
  Empty: { args: { ...searchFieldArgs } },
  Filled: { args: { ...searchFieldArgs, value: 'coastal' } },
  EscapeBubbles: { args: { ...searchFieldArgs, label: 'Search sounds', placeholder: 'Search sounds', width: 240 } },
  LongQuery: { args: { ...searchFieldArgs, value: 'user styles on the external drive', width: 180 } },
  RefDisabledTitle: {
    args: { ...searchFieldArgs, title: 'Search presets (⌘F)', label: 'Search presets', width: 200 },
    items: [{}, { label: 'Search presets (disabled)', value: 'coastal', disabled: true, title: 'Nothing to search' }],
  },
});
