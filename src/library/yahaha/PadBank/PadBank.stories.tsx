import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { PadBankRegion, type PadItem } from './PadBank';
import {
  allPadBanks,
  allPadsByBank,
  chordPads,
  multiPadPads,
  quickRackPads,
  quickRackStorePads,
  sectionPads,
  setupPads,
} from './PadBank.fixtures';

/** Every pad on the canvas is a square: its rendered width and height agree to half a pixel. */
async function expectSquarePads(canvasElement: HTMLElement) {
  const faces = canvasElement.querySelectorAll<HTMLElement>('.yh-padbank__cell > *');
  await expect(faces.length).toBe(16);
  for (const face of faces) {
    const { width, height } = face.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(Math.abs(width - height)).toBeLessThan(0.5);
  }
}

/** The bank indexes in `allPadBanks`. */
const SECTIONS = 0;
const QUICK_RACKS = 1;
const CHORD = 2;
const MULTI_PADS = 3;
const SETUP = 4;

/**
 * The Stage's Pads region, as the Stage draws it: one `Region` named Pads whose views are the
 * banks, and the PadBank's sixteen square pads as its body. Compare each
 * story with its namesake under "Yahaha baseline / Components / PadBank": the same names; the
 * baseline's board is the Sections bank, which is `Sections` here, and `Board` shows Quick Racks.
 * `lit` is the flash phase of armed and queued pads; a tab choice is a callback with the bank's
 * index.
 */
const meta = {
  title: 'Library/Yahaha/Components/PadBank',
  component: PadBankRegion,
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
    banks: allPadBanks,
    bank: QUICK_RACKS,
    lit: true,
    tipAction: fn(),
    onBank: fn(),
    onPress: fn(),
  },
  argTypes: {
    pads: { control: 'object' },
    banks: { control: 'object' },
    bank: { control: { type: 'number', min: 0, max: allPadBanks.length - 1, step: 1 } },
    lit: { control: 'boolean' },
    columns: { control: { type: 'inline-radio' }, options: [8, 4] },
    bankName: { control: 'text' },
  },
} satisfies Meta<typeof PadBankRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board: the Quick Racks bank, Rack 1 loaded and OTS 1 on. A tab click asks for that bank. */
export const Board: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('tab').map((t) => t.textContent)).toEqual(allPadBanks);
    await expect(canvas.getByRole('tab', { name: 'Quick Racks' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('button', { name: /^Rack\s1 \(pad 1\)$/ })).toHaveAttribute('aria-pressed', 'true');
    await expectSquarePads(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'Chord' }));
    await expect(args.onBank).toHaveBeenCalledWith(CHORD);
  },
};

/**
 * New: the board's Sections bank, as the Launchkey lays it out: Main B playing (the solid fill: it
 * is sounding), Main C next (`--accent`), Start / Stop running (`--success`); Intro III and Ending
 * III absent from this style; the other transport pads neutral at rest.
 */
export const Sections: Story = {
  args: { pads: sectionPads, bank: SECTIONS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Sections' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('button', { name: 'Main B, playing' })).toHaveAttribute('data-on-face', 'fill');
    await expect(canvas.getByRole('button', { name: /^Start \/ Stop, running/ })).toHaveAttribute('data-tone', 'success');
    await expectSquarePads(canvasElement);
  },
};

/**
 * A 4 × 4 grid (`columns` 4), as in the golden Stage's pads block: pads 1–4, 5–8, 9–12 and 13–16
 * row by row, in a block about 464 × 232: the pads are squares sized by its height, centred.
 */
export const FourByFour: Story = {
  args: { columns: 4 },
  decorators: [
    (Story) => (
      <div style={{ width: 464, height: 232, display: 'grid' }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector<HTMLElement>('.yh-padbank__pads');
    await expect(grid?.dataset.columns).toBe('4');
    await expectSquarePads(canvasElement);
  },
};

/** The flash's off phase, with Store armed: the rack slots and Store keep ARMED; their wash and ring rest. */
export const FlashOff: Story = { args: { pads: quickRackStorePads, lit: false } };

/** New: Store armed, the flash's on phase: every rack slot and Store wait for the slot to store into. */
export const StoreArmed: Story = { args: { pads: quickRackStorePads } };

/** New: the Chord bank: its unassigned top row is eight empty faces, the switches below read as the bank. */
export const ChordBank: Story = { args: { bank: CHORD, pads: chordPads } };

/** New: only five pads given: the bank still draws all sixteen, the rest empty, as on the hardware. */
export const FewerPads: Story = { args: { pads: quickRackPads.slice(0, 5) } };

/** New: only five pads given, as a 4 × 4 grid. */
export const FewerPadsFourByFour: Story = { args: { pads: quickRackPads.slice(0, 5), columns: 4 } };

/** New: the Multi Pads bank, Pad 1 playing. */
export const MultiPadsBank: Story = { args: { bank: MULTI_PADS, pads: multiPadPads } };

/** New: the Setup bank: Single fingering and Stop Style chosen. */
export const SetupBank: Story = { args: { bank: SETUP, pads: setupPads } };

/** New: a pad the engine lights for a part wears that part's hue (Right 2 here); nothing else does. */
export const PartLit: Story = {
  args: {
    bank: MULTI_PADS,
    pads: multiPadPads.map((pad, i): PadItem => (i === 1 ? { ...pad, family: 'r2', state: 'playing' } : pad)),
  },
};

/** New: the region at a 1440 × 900 Stage (about 552px wide), two rows of eight. */
export const At1440: Story = {};

/** New: the region at a 1217 × 752 Stage (about 464px wide), two rows of eight. */
export const At1217: Story = {
  args: { bank: CHORD, pads: chordPads },
  decorators: [
    (Story) => (
      <div style={{ width: 464 }}>
        <Story />
      </div>
    ),
  ],
};

/** New: a wide, short region (552 × 120): the pads stay squares, sized by the height, the row centred. */
export const ShortRegion: Story = {
  args: { pads: sectionPads, bank: SECTIONS },
  decorators: [
    (Story) => (
      <div style={{ width: 552, height: 120, display: 'grid' }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expectSquarePads(canvasElement);
  },
};

/** New: a working bank: tabs switch bank, a press toggles a pad on and off. */
export const Playground: Story = {
  render: function Render(args) {
    const [bank, setBank] = useState(args.bank ?? 0);
    const [sets, setSets] = useState<PadItem[][]>(allPadsByBank);
    return (
      <PadBankRegion
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
