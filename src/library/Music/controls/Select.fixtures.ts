import { defineFixtures } from '../../fixtures';
import type { SelectModelProps } from './Select.model';

export const selectStories = defineFixtures<SelectModelProps>()({
  Default: { args: {} },
  PointerAndDismiss: { args: {} },
  Typeahead: { args: {} },
  LongList: { args: { items: Array.from({ length: 48 }, (_, i) => `Preset ${String(i + 1).padStart(2, '0')}`), index: 39 } },
  Empty: { args: { items: [], index: 0 } },
  Disabled: { args: { disabled: true } },
});
