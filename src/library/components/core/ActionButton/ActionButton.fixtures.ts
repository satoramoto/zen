// ActionButton's stories as plain props: ActionButton.stories.tsx draws them with either renderer,
// and the tree snapshot (src/library/view/snapshot.test.ts) prints every instance. A fixture's
// `children` is the face's text; the stories with icons add theirs in React.
import { defineFixtures } from '../../../fixtures';
import type { ActionButtonModelProps } from './ActionButton.model';

/** The controls. */
export const actionButtonArgTypes = {
  tone: { control: 'inline-radio', options: ['normal', 'quiet', 'danger'] },
  width: { control: { type: 'number', min: 24, max: 320 } },
} as const;

export const actionButtonStories = defineFixtures<ActionButtonModelProps>()({
  Normal: { args: { children: 'Export' } },
  IconOnly: { args: { tone: 'quiet', label: 'Close', title: 'Close (Esc)' } },
  Captioned: { args: { name: 'Stems', children: 'Write', hint: 'Writes each part to its own file' } },
  Danger: { args: { tone: 'danger', children: 'Delete' } },
  FixedWidth: { args: { width: 160, children: 'Replace' } },
  Disabled: { args: { disabled: true, children: 'Export' } },
});
