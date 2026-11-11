// CodeImage's stories as plain props: CodeImage.stories.tsx draws each with either renderer's
// `Tree`, and the tree snapshot records every instance.
import { defineFixtures } from '../../fixtures';
import type { CodeImageModelProps } from './CodeImage.model';

/** The controls. */
export const codeImageArgTypes = {
  text: { control: 'text' },
  label: { control: 'text' },
} as const;

export const codeImageStories = defineFixtures<CodeImageModelProps>()({
  Address: { args: { text: 'https://example.com/learn' } },
  Long: { args: { text: `https://example.com/lessons/${'pads-and-expression/'.repeat(8)}start`, label: 'Code for the lesson' } },
  // More than a code here can hold: nothing is drawn.
  TooLong: { args: { text: 'x'.repeat(300) } },
});
