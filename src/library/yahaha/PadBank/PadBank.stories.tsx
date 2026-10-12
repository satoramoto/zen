import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { PadBank, type PadItem } from './PadBank';
import { padBanks, padsByBank, quickRackPads, quickRackStorePads } from './PadBank.fixtures';

/**
 * The Stage's Pads region: the bank tabs after the title and sixteen pads across the region.
 * Compare each story with its namesake under "Yahaha baseline / Components / PadBank": the same
 * names; the Sections bank's data has moved to SongForm, so the board shows Quick Racks. `lit` is
 * the flash phase of armed and queued pads; a tab choice is a callback with the bank's index.
 */
const meta = {
  title: 'Library/Yahaha/Components/PadBank',
  component: PadBank,
  decorators: [
    withLibraryTheme,
    (Story) => (
      <div style={{ width: 552 }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    pads: quickRackPads,
    banks: padBanks,
    bank: 0,
    lit: true,
    tipAction: fn(),
    onBank: fn(),
    onPress: fn(),
  },
  argTypes: {
    pads: { control: 'object' },
    banks: { control: 'object' },
    bank: { control: { type: 'number', min: 0, max: padBanks.length - 1, step: 1 } },
    lit: { control: 'boolean' },
    columns: { control: { type: 'inline-radio' }, options: [8, 4] },
    bankName: { control: 'text' },
  },
} satisfies Meta<typeof PadBank>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board: the Quick Racks bank, Rack 1 loaded and OTS 1 on. A tab click asks for that bank. */
export const Board: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Pads' })).toBeInTheDocument();
    await expect(canvas.getAllByRole('tab').map((t) => t.textContent)).toEqual(padBanks);
    await expect(canvas.getByRole('tab', { name: 'Quick Racks' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('button', { name: 'Rack 1 (pad 1)' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('tab', { name: 'Chord' }));
    await expect(args.onBank).toHaveBeenCalledWith(1);
  },
};

/**
 * A 4 × 4 grid (`columns` 4), as in the golden Stage's pads block: pads 1–4, 5–8, 9–12 and 13–16
 * row by row, in a block about 464 × 232 that the pads stretch to fill.
 */
export const FourByFour: Story = {
  args: { columns: 4 },
  decorators: [
    (Story) => (
      <div style={{ width: 464, height: 232 }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector<HTMLElement>('.yh-padbank__pads');
    await expect(grid?.dataset.columns).toBe('4');
  },
};

/** The flash's off phase, with Store armed: the rack slots and Store keep ARMED; their wash and ring rest. */
export const FlashOff: Story = { args: { pads: quickRackStorePads, lit: false } };

/** New: Store armed, the flash's on phase: every rack slot and Store wait for the slot to store into. */
export const StoreArmed: Story = { args: { pads: quickRackStorePads } };

/** New: the Chord bank: its unassigned top row is eight empty faces, the switches below read as the bank. */
export const ChordBank: Story = { args: { bank: 1, pads: padsByBank[1] } };

/** New: only five pads given: the bank still draws all sixteen, the rest empty, as on the hardware. */
export const FewerPads: Story = { args: { pads: quickRackPads.slice(0, 5) } };

/** New: only five pads given, as a 4 × 4 grid. */
export const FewerPadsFourByFour: Story = { args: { pads: quickRackPads.slice(0, 5), columns: 4 } };

/** New: the Multi Pads bank, Pad 1 playing. */
export const MultiPadsBank: Story = { args: { bank: 2, pads: padsByBank[2] } };

/** New: the Setup bank: Single fingering and Stop Style chosen. */
export const SetupBank: Story = { args: { bank: 3, pads: padsByBank[3] } };

/** New: a pad the engine lights for a part wears that part's hue (Right 2 here); nothing else does. */
export const PartLit: Story = {
  args: {
    bank: 2,
    pads: padsByBank[2].map((pad, i): PadItem => (i === 1 ? { ...pad, family: 'r2', state: 'playing' } : pad)),
  },
};

/** New: the region at a 1440 × 900 Stage (about 552px wide), two rows of eight. */
export const At1440: Story = {};

/** New: the region at a 1217 × 752 Stage (about 464px wide), two rows of eight. */
export const At1217: Story = {
  args: { bank: 1, pads: padsByBank[1] },
  decorators: [
    (Story) => (
      <div style={{ width: 464 }}>
        <Story />
      </div>
    ),
  ],
};

/** New: a working bank: tabs switch bank, a press toggles a pad on and off. */
export const Playground: Story = {
  render: function Render(args) {
    const [bank, setBank] = useState(args.bank ?? 0);
    const [sets, setSets] = useState<PadItem[][]>(padsByBank);
    return (
      <PadBank
        {...args}
        bank={bank}
        pads={sets[bank]}
        onBank={(i) => {
          args.onBank?.(i);
          setBank(i);
        }}
        onPress={(i) => {
          args.onPress?.(i);
          setSets((all) =>
            all.map((set, b) =>
              b !== bank
                ? set
                : set.map((pad, p) => (p === i ? { ...pad, state: pad.state === 'playing' ? 'idle' : 'playing' } : pad)),
            ),
          );
        }}
      />
    );
  },
};
