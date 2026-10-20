import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withLibraryTheme } from '../storybook';
import { treeStory, withRenderer } from '../stories/story';
import { Text } from './Text';
import { BASEL, HARMONIC, textArgTypes, textArgs, textGrid, textPlayground, type TextArgs } from './Text.fixtures';

// The args, controls and story trees come from Text.fixtures.ts (`textNode`, the element `Text`
// draws); the toolbar's Renderer draws them with React's or Svelte's `Tree`.
const playground = treeStory<TextArgs>((args) => ({ tree: textPlayground(args) }));

const meta: Meta<TextArgs> = {
  title: 'Design OS/Primitives/Text',
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: textArgs,
  argTypes: textArgTypes,
};
export default meta;
type Story = StoryObj<TextArgs>;

/** One specimen: every control changes it (narrow the width with truncate on to see the ellipsis). */
export const Playground: Story = { ...playground };

/** Every role (rows) in every tone (columns). */
export const AllRolesAndTones: Story = {
  name: 'All roles and tones',
  ...treeStory<TextArgs>(() => ({ tree: textGrid() })),
};

/** The `math` role around MathML in running text: the formula takes `--font-math`, not the
 *  browser's own math face, and sits on the paragraph's baseline. Drawn by React: the formulas are
 *  MathML markup set as inner HTML, which a view tree doesn't hold. */
export const MathInText: Story = {
  name: 'Math in running text',
  render: () => (
    <div style={{ maxWidth: 520, padding: 'var(--space-4)' }}>
      <Text as="p" role="body" tone="primary">
        The <Text tone="accent">n</Text>th harmonic of a string sounds at{' '}
        <Text role="math" size="inherit" data-testid="harmonic" dangerouslySetInnerHTML={{ __html: HARMONIC }} />, and the
        reciprocal squares sum to <Text role="math" size="inherit" dangerouslySetInnerHTML={{ __html: BASEL }} />.
      </Text>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const math = canvasElement.querySelector('[data-testid="harmonic"] math');
    await expect(math).not.toBeNull();
    await expect(getComputedStyle(math!).fontFamily).toContain('Math');
  },
};
