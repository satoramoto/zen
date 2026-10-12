import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../../storybook';
import { PartMarks } from './PartMarks';
import { marksText } from './marks';

const meta = {
  title: 'Design OS/Components/Music/PartMarks',
  component: PartMarks,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    edited: { control: 'boolean' },
    missing: { control: 'boolean' },
    failed: { control: 'boolean' },
    off: { control: 'boolean' },
    bass: { control: 'boolean' },
    size: { control: 'select', options: ['cell', 'strip'] },
  },
} satisfies Meta<typeof PartMarks>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A part's sound cell (Right 2 on Yahaha's Stage board): the sound was edited, so the dot. */
export const Board: Story = { args: { edited: true } };

/** Right 3's plugin isn't installed: the warning triangle alone. */
export const Missing: Story = { args: { missing: true } };

/** The part's plugin failed to load or crashed: the danger cross alone. */
export const Failed: Story = { args: { failed: true } };

/** The part is off: the word in faint text, so the silent part recedes. */
export const Off: Story = { args: { off: true } };

/** The part plays the bass: the word in secondary text ("bass" wins over "off"). */
export const Bass: Story = { args: { off: true, bass: true } };

/** Every mark that can show at once, at the strip's tighter gap. */
export const Strip: Story = { args: { edited: true, failed: true, bass: true, size: 'strip' } };

const PARTS = [
  { part: 'Right 1', sound: 'Grand Piano', facts: {} },
  { part: 'Right 2', sound: 'Strings', facts: { edited: true } },
  { part: 'Right 3', sound: 'Analog Brass', facts: { missing: true } },
  { part: 'Left', sound: 'Fingered Bass', facts: { edited: true, failed: true, bass: true } },
  { part: 'Right 4', sound: 'Choir Aahs', facts: { off: true } },
];

/** The marks in place after each sound name, as a column of sound cells: the problems stand out by shape. */
export const InSoundCells: Story = {
  render: () => (
    <div className="lib-stack" style={{ maxWidth: 280 }}>
      {PARTS.map(({ part, sound, facts }) => (
        <div key={part} className="lib-row" aria-label={`${part}: ${sound}${marksText(facts)}`} role="group">
          <span style={{ color: 'var(--text-3)', fontSize: 'var(--size-caption)', width: 56 }}>{part}</span>
          <span>{sound}</span>
          <PartMarks {...facts} />
        </div>
      ))}
    </div>
  ),
};
