import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { PartMarks } from './PartMarks';
import PartMarksSvelte from './PartMarks.svelte';
import { partMarksArgTypes, partMarksStories as s, soundCells } from './PartMarks.fixtures';
import { marksText } from './marks';

// Every story is built from PartMarks.fixtures.ts (`story(s.Name)`), which the tree snapshot
// shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`.
const meta = {
  title: 'Design OS/Components/Music/PartMarks',
  component: PartMarks,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: partMarksArgTypes,
} satisfies Meta<typeof PartMarks>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(PartMarks, PartMarksSvelte);

/** A part's sound cell (Right 2 on Yahaha's Stage board): the sound was edited, so the dot. */
export const Board: Story = story(s.Board);

/** Right 3's plugin isn't installed: the warning triangle alone. */
export const Missing: Story = story(s.Missing);

/** The part's plugin failed to load or crashed: the danger cross alone. */
export const Failed: Story = story(s.Failed);

/** The part is off: the word in faint text, so the silent part recedes. */
export const Off: Story = story(s.Off);

/** The part plays the bass: the word in secondary text ("bass" wins over "off"). */
export const Bass: Story = story(s.Bass);

/** Every mark that can show at once, at the strip's tighter gap. */
export const Strip: Story = story(s.Strip);

/** The marks in place after each sound name, as a column of sound cells: the problems stand out by shape (a layout of its own, so React draws it). */
export const InSoundCells: Story = story(s.InSoundCells, {
  render: () => (
    <div className="lib-specimens" style={{ maxWidth: 280 }}>
      {soundCells.map(({ part, sound, facts }) => (
        <div key={part} className="lib-row" aria-label={`${part}: ${sound}${marksText(facts)}`} role="group">
          <span style={{ color: 'var(--text-3)', fontSize: 'var(--size-caption)', width: 56 }}>{part}</span>
          <span>{sound}</span>
          <PartMarks {...facts} />
        </div>
      ))}
    </div>
  ),
});
