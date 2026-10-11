import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../storybook';
import { SectionName } from './SectionName';

/** The playing section's name on the display, in its section colour with the palette's bloom. */
const meta = {
  title: 'Library/Yahaha/Primitives/SectionName',
  component: SectionName,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    label: { control: 'text' },
    hue: { control: 'select', options: ['intro', 'main', 'ending', 'brk', 'fill'] },
    idle: { control: 'boolean' },
  },
} satisfies Meta<typeof SectionName>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board: "Main B", in the main colour with its bloom. */
export const Board: Story = {
  args: { label: 'Main B', hue: 'main' },
};

/** Stopped: the picked Main in muted text, no bloom. */
export const Idle: Story = {
  args: { label: 'Main A', hue: 'main', idle: true },
};

/** An intro, in the intro colour. */
export const Intro: Story = {
  args: { label: 'Intro II', hue: 'intro' },
};

/** Every section kind side by side, to check the colours stay distinct under each pack. */
export const AllKinds: Story = {
  args: { label: 'Main A' },
  render: () => (
    <div className="lib-row" style={{ gap: 'var(--space-6)' }}>
      <SectionName label="Intro I" hue="intro" />
      <SectionName label="Main A" hue="main" />
      <SectionName label="Break" hue="brk" />
      <SectionName label="Fill" hue="fill" />
      <SectionName label="Ending II" hue="ending" />
      <SectionName label="Main B" hue="main" idle />
    </div>
  ),
};

/** No section: the dash keeps the line's height. */
export const Empty: Story = {
  args: { label: '', hue: 'main' },
};
