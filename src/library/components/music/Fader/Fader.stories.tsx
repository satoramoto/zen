import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { instances } from '../../../fixtures';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { Fader } from './Fader';
import FaderSvelte from './Fader.svelte';
import { faderArgTypes, faderBoard, faderStories as s } from './Fader.fixtures';

// Every story is built from Fader.fixtures.ts (`story(s.Name)`), which the tree snapshot shares; the
// toolbar's Renderer draws it with React's or Svelte's `Tree`.

/**
 * One strip's fader: the level as a numeral, a groove filled in the strip's hue slot, an
 * overhanging cap at the set level and one quiet neutral meter beside the groove. When the hardware
 * fader is away from the level, a dashed warning outline marks where it is and an arrow says which
 * way to move it. Controlled: a drag, a key or the wheel asks for a level through `onlevel`.
 */
const meta = {
  title: 'Design OS/Components/Music/Fader',
  component: Fader,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { ...faderBoard, name: faderBoard.name!, onlevel: fn(), tipAction: fn() },
  argTypes: faderArgTypes,
} satisfies Meta<typeof Fader>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Fader, FaderSvelte);

/** Right 1 on the board (hue slot 1): level 90, the groove filled in its hue, meters at 0.62. */
export const Board: Story = story(s.Board);

/** Right 2, its hardware fader away at 50: the warning outline there and an up arrow (soft takeover). */
export const Away: Story = story(s.Away);

/** Right 3, switched off: the numeral muted, no meter, the fill at 35% and a grey cap. */
export const Off: Story = story(s.Off);

/** The Style volume: a group fader, neutral (`a`, no hue slot). */
export const Group: Story = story(s.Group);

/** Master, neutral. */
export const Master: Story = story(s.Master);

/** An unused fader: a dashed groove, nothing else. */
export const Parked: Story = story(s.Parked);

/** The Reverb layer: no meters, a neutral fill, "Rev" as a label over its number. */
export const Layered: Story = story(s.Layered);

/** Added: an empty hardware slot (`empty`): a faint solid groove, the banks' one empty-slot look. */
export const Empty: Story = story(s.Empty);

/** Added: the hardware fader above the level, so the arrow points down. */
export const AwayAbove: Story = story(s.AwayAbove);

/** Added: a board of strips side by side, as the mixer shows them (a stretched row, so React draws it). */
export const Strip: Story = story(s.Strip, {
  render: (args) => (
    <div className="lib-row" style={{ alignItems: 'stretch', flexWrap: 'nowrap' }}>
      {instances(s.Strip).map((item, i) => (
        <Fader key={i} {...args} {...item} />
      ))}
    </div>
  ),
});

/** Added: `fillHeight`, the fader taking a tall container's height; a drag still tracks the rail (a tall container, so React draws it). */
export const FillHeight: Story = story(s.FillHeight, {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(var(--control-h) * 10)' }}>
      <Fader {...args} />
    </div>
  ),
});

/** Added: wired to state, so a drag, the keys and the wheel move it (local state, so React draws it). */
export const Live: Story = story(s.Live, {
  render: function Live(args) {
    const [level, setLevel] = useState(args.level ?? 90);
    return (
      <Fader
        {...args}
        level={level}
        value={String(level)}
        name={`Right 1 · Stage Grand, level ${level}`}
        onlevel={(next) => {
          args.onlevel?.(next);
          setLevel(next);
        }}
      />
    );
  },
});
