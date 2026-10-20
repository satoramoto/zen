import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../../storybook';
import { PartMarks } from './PartMarks';
import { partMarksArgTypes, partMarksStories as s, soundCells } from './PartMarks.fixtures';
import { marksText } from './marks';

// Every story's args come from PartMarks.fixtures.ts, which the Svelte stories and the parity test share.
const meta = {
  title: 'Design OS/Components/Music/PartMarks',
  component: PartMarks,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: partMarksArgTypes,
} satisfies Meta<typeof PartMarks>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A part's sound cell (Right 2 on Yahaha's Stage board): the sound was edited, so the dot. */
export const Board: Story = { args: s.Board.args };

/** Right 3's plugin isn't installed: the warning triangle alone. */
export const Missing: Story = { args: s.Missing.args };

/** The part's plugin failed to load or crashed: the danger cross alone. */
export const Failed: Story = { args: s.Failed.args };

/** The part is off: the word in faint text, so the silent part recedes. */
export const Off: Story = { args: s.Off.args };

/** The part plays the bass: the word in secondary text ("bass" wins over "off"). */
export const Bass: Story = { args: s.Bass.args };

/** Every mark that can show at once, at the strip's tighter gap. */
export const Strip: Story = { args: s.Strip.args };

/** The marks in place after each sound name, as a column of sound cells: the problems stand out by shape. */
export const InSoundCells: Story = {
  render: () => (
    <div className="lib-specimens"style={{ maxWidth: 280 }}>
      {soundCells.map(({ part, sound, facts }) => (
        <div key={part} className="lib-row" aria-label={`${part}: ${sound}${marksText(facts)}`} role="group">
          <span style={{ color: 'var(--text-3)', fontSize: 'var(--size-caption)', width: 56 }}>{part}</span>
          <span>{sound}</span>
          <PartMarks {...facts} />
        </div>
      ))}
    </div>
  ),
};
