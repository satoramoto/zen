import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { P, Reading } from '../../layouts/Reading/Reading';
import { Peek } from './Peek';

// Stories tagged browser here open popovers and dialogs: they play in a real browser, not on zen-stories' virtual DOM.
/** A mention of another entry with its head as a preview: hover to peek, tap or click to toggle. */
const meta = {
  title: 'Compendium/Components/Peek',
  component: Peek,
  decorators: [withLibraryTheme],
  args: {
    entry: {
      title: 'Overtone',
      kind: 'Concept',
      standing: 'established',
      summary: 'Any frequency a vibrating body sounds above its lowest. For an ideal string the overtones are whole-number multiples of the fundamental.',
    },
    children: 'overtones',
  },
  render: (args) => (
    <Reading>
      <P>
        The <Peek {...args} /> of an ideal string are whole multiples of its fundamental.
      </P>
    </Reading>
  ),
  tags: ['browser'],
} satisfies Meta<typeof Peek>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A click opens the preview; Escape closes it. */
export const ClickToggles: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const words = canvas.getByRole('button', { name: 'overtones' });
    await userEvent.click(words);
    const panel = await within(document.body).findByRole('dialog', { name: args.entry.title });
    expect(panel).toHaveTextContent(args.entry.summary);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull());
  },
};
