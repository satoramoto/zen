import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { Fader } from './Fader';

const NONE = 'none';

/**
 * One strip's fader: the level as a numeral, a groove filled in the strip's part hue, an
 * overhanging cap at the set level and one quiet neutral meter beside the groove. When the hardware
 * fader is away from the level, a dashed warning outline marks where it is and an arrow says which
 * way to move it. Controlled: a drag, a key or the wheel asks for a level through `onlevel`.
 */
const meta = {
  title: 'Library/Yahaha/Primitives/Fader',
  component: Fader,
  decorators: [withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    name: 'Right 1 · Stage Grand, level 90',
    value: '90',
    level: 90,
    meter: 0.62,
    meter2: 0.58,
    peak: 0.7,
    kind: 'part',
    hue: 'r1',
    layered: false,
    width: 66,
    tip: 'mixer.panel.right1',
    onlevel: fn(),
    tipAction: fn(),
  },
  argTypes: {
    name: { control: 'text' },
    value: { control: 'text' },
    level: { control: { type: 'range', min: 0, max: 127, step: 1 } },
    meter: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    meter2: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    peak: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    away: {
      control: 'select',
      options: [NONE, 0, 32, 50, 64, 100, 127],
      mapping: { [NONE]: undefined },
    },
    kind: { control: 'select', options: ['part', 'group', 'master', 'off', 'parked'] },
    hue: { control: 'select', options: ['r1', 'r2', 'r3', 'l', 'a', 't2', 't'] },
    layered: { control: 'boolean' },
    width: { control: 'number' },
    fillHeight: { control: 'boolean' },
    tip: { control: 'text' },
  },
} satisfies Meta<typeof Fader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Right 1 on the board: level 90, the groove filled in its part hue, meters at 0.62. */
export const Board: Story = {};

/** Right 2, its hardware fader away at 50: the warning outline there and an up arrow (soft takeover). */
export const Away: Story = {
  args: {
    name: 'Right 2 · Silk Strings, level 72, hardware fader away (soft takeover)',
    value: '72',
    level: 72,
    meter: 0.45,
    meter2: 0.42,
    peak: 0.55,
    hue: 'r2',
    away: 50,
  },
};

/** Right 3, switched off: the numeral muted, no meter, the fill at 35% and a grey cap. */
export const Off: Story = {
  args: {
    name: 'Right 3 · Brass Section, level 64',
    value: '64',
    level: 64,
    meter: 0,
    meter2: 0,
    peak: 0,
    kind: 'off',
    hue: 'r3',
  },
};

/** The Style volume: a group fader, neutral (not a part). */
export const Group: Story = {
  args: { name: 'Style volume, level 100', value: '100', level: 100, meter: 0.7, meter2: 0.65, peak: 0.78, kind: 'group', hue: 'a' },
};

/** Master, neutral. */
export const Master: Story = {
  args: { name: 'Master, level 100', value: '100', level: 100, meter: 0.72, meter2: 0.67, peak: 0.8, kind: 'master', hue: 't' },
};

/** An unused fader: a dashed groove, nothing else. */
export const Parked: Story = {
  args: { name: 'Fader 7 unused', value: '', level: 0, meter: 0, meter2: 0, peak: 0, kind: 'parked', hue: 't' },
};

/** The Reverb layer: no meters, a neutral fill, "Rev" as a label over its number. */
export const Layered: Story = {
  args: { name: 'Right 1 · Stage Grand, Rev 40', value: 'Rev 40', level: 40, layered: true },
};

/** Added: an empty hardware slot (`empty`): a faint solid groove, the banks' one empty-slot look. */
export const Empty: Story = {
  args: { name: 'Left · no voice', value: '', level: 0, meter: 0, meter2: 0, peak: 0, kind: 'parked', hue: 'l', empty: true },
};

/** Added: the hardware fader above the level, so the arrow points down. */
export const AwayAbove: Story = {
  args: { ...Away.args, name: 'Right 2 · Silk Strings, level 72, hardware fader away above', away: 110 },
};

/** Added: a board of strips side by side, as the mixer shows them. */
export const Strip: Story = {
  render: (args) => (
    <div className="lib-row" style={{ alignItems: 'stretch', flexWrap: 'nowrap' }}>
      <Fader {...args} />
      <Fader {...args} {...Away.args} />
      <Fader {...args} {...Off.args} />
      <Fader {...args} name="Left · Bass, level 80" value="80" level={80} hue="l" meter={0.5} meter2={0.48} peak={0.6} />
      <Fader {...args} {...Group.args} />
      <Fader {...args} {...Master.args} />
      <Fader {...args} {...Parked.args} />
    </div>
  ),
};

/** Added: `fillHeight`, the fader taking a tall container's height; a drag still tracks the rail. */
export const FillHeight: Story = {
  args: { fillHeight: true },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(var(--control-h) * 10)' }}>
      <Fader {...args} />
    </div>
  ),
};

/** Added: wired to state, so a drag, the keys and the wheel move it. */
export const Live: Story = {
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
