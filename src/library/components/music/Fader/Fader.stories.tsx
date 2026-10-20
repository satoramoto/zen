import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { instances } from '../../../fixtures';
import { Fader } from './Fader';
import { faderArgTypes, faderBoard, faderStories as s } from './Fader.fixtures';

// Every story's args come from Fader.fixtures.ts, which the Svelte stories and the parity test share.

/**
 * One strip's fader: the level as a numeral, a groove filled in the strip's hue slot, an
 * overhanging cap at the set level and one quiet neutral meter beside the groove. When the hardware
 * fader is away from the level, a dashed warning outline marks where it is and an arrow says which
 * way to move it. Controlled: a drag, a key or the wheel asks for a level through `onlevel`.
 */
const meta = {
  title: 'Design OS/Components/Music/Fader',
  component: Fader,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { ...faderBoard, name: faderBoard.name!, onlevel: fn(), tipAction: fn() },
  argTypes: faderArgTypes,
} satisfies Meta<typeof Fader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Right 1 on the board (hue slot 1): level 90, the groove filled in its hue, meters at 0.62. */
export const Board: Story = { args: s.Board.args };

/** Right 2, its hardware fader away at 50: the warning outline there and an up arrow (soft takeover). */
export const Away: Story = { args: s.Away.args };

/** Right 3, switched off: the numeral muted, no meter, the fill at 35% and a grey cap. */
export const Off: Story = { args: s.Off.args };

/** The Style volume: a group fader, neutral (`a`, no hue slot). */
export const Group: Story = { args: s.Group.args };

/** Master, neutral. */
export const Master: Story = { args: s.Master.args };

/** An unused fader: a dashed groove, nothing else. */
export const Parked: Story = { args: s.Parked.args };

/** The Reverb layer: no meters, a neutral fill, "Rev" as a label over its number. */
export const Layered: Story = { args: s.Layered.args };

/** Added: an empty hardware slot (`empty`): a faint solid groove, the banks' one empty-slot look. */
export const Empty: Story = { args: s.Empty.args };

/** Added: the hardware fader above the level, so the arrow points down. */
export const AwayAbove: Story = { args: s.AwayAbove.args };

/** Added: a board of strips side by side, as the mixer shows them. */
export const Strip: Story = {
  args: s.Strip.args,
  render: (args) => (
    <div className="lib-row" style={{ alignItems: 'stretch', flexWrap: 'nowrap' }}>
      {instances(s.Strip).map((item, i) => (
        <Fader key={i} {...args} {...item} />
      ))}
    </div>
  ),
};

/** Added: `fillHeight`, the fader taking a tall container's height; a drag still tracks the rail. */
export const FillHeight: Story = {
  args: s.FillHeight.args,
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(var(--control-h) * 10)' }}>
      <Fader {...args} />
    </div>
  ),
};

/** Added: wired to state, so a drag, the keys and the wheel move it. */
export const Live: Story = {
  args: s.Live.args,
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
};
