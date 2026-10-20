import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../stories/story';
import { PAD_BANK_FORMS, PadBankRegion, type PadBankRegionProps, type PadItem } from './PadBank';
import PadBankRegionSvelte from './PadBankRegion.svelte';
import {
  BANK,
  PAD_BANK_FRAME_WIDTH,
  allPadBanks,
  allPadsByBank,
  padBankArgTypes,
  padBankBoxes,
  padBankFormsSample,
  padBankFrameWidths,
  padBankStories as s,
  type PadBankBox,
} from './PadBank.fixtures';

// Every story is built from PadBank.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`.

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
const CHORD = BANK.Chord;


/**
 * The Stage's Pads region, as the Stage draws it: one `Region` named Pads whose views are the
 * banks, and the PadBank's sixteen square pads as its body. Compare each
 * story with its namesake under "Yahaha baseline / Components / PadBank": the same names; the
 * baseline's board is the Sections bank, which is `Sections` here, and `Board` shows Quick Racks.
 * `lit` is the flash phase of armed and queued pads; a tab choice is a callback with the bank's
 * index.
 */
const meta = {
  title: 'Yahaha/Components/PadBank',
  component: PadBankRegion,
  decorators: [
    withRenderer,
    withLibraryTheme,
    // The frame: a 1440 Stage's pads (552) unless a story names its own (`parameters.frameWidth`),
    // and inside it the story's box (`parameters.box`: a grid when it has a height, so the region fills it).
    (Story, { parameters }) => {
      const box = parameters.box as PadBankBox | undefined;
      return (
        <div style={{ width: (parameters.frameWidth as number | undefined) ?? PAD_BANK_FRAME_WIDTH }}>
          {box ? (
            <div style={{ width: box.width, height: box.height, display: box.height ? 'grid' : undefined }}>
              <Story />
            </div>
          ) : (
            <Story />
          )}
        </div>
      );
    },
  ],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    pads: allPadsByBank[BANK.QuickRacks],
    ...s.Board.args,
    tipAction: fn(),
    onBank: fn(),
    onPress: fn(),
  },
  argTypes: padBankArgTypes,
} satisfies Meta<typeof PadBankRegion>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(PadBankRegion, PadBankRegionSvelte);

/** A story drawn in its box inside the frame (`padBankBoxes`). */
const boxed = (fixture: Parameters<typeof story>[0], box: PadBankBox | undefined, extra: Partial<Story> = {}): Story => {
  const base = story(fixture, extra);
  return { ...base, parameters: { ...base.parameters, box } };
};

/** The board: the Quick Racks bank, Rack 1 loaded and OTS 1 on. A tab click asks for that bank. */
export const Board: Story = {
  ...story(s.Board),
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
  ...story(s.Sections),
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
export const FourByFour: Story = boxed(s.FourByFour, padBankBoxes.FourByFour, {
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector<HTMLElement>('.yh-padbank__pads');
    await expect(grid?.dataset.columns).toBe('4');
    await expectSquarePads(canvasElement);
  },
});

/** The flash's off phase, with Store armed: the rack slots and Store keep ARMED; their wash and ring rest. */
export const FlashOff: Story = story(s.FlashOff);

/** New: Store armed, the flash's on phase: every rack slot and Store wait for the slot to store into. */
export const StoreArmed: Story = story(s.StoreArmed);

/** New: the Chord bank: its unassigned top row is eight empty faces, the switches below read as the bank. */
export const ChordBank: Story = story(s.ChordBank);

/** New: only five pads given: the bank still draws all sixteen, the rest empty, as on the hardware. */
export const FewerPads: Story = story(s.FewerPads);

/** New: only five pads given, as a 4 × 4 grid. */
export const FewerPadsFourByFour: Story = story(s.FewerPadsFourByFour);

/** New: the Multi Pads bank, Pad 1 playing. */
export const MultiPadsBank: Story = story(s.MultiPadsBank);

/** New: the Setup bank: Single fingering and Stop Style chosen. */
export const SetupBank: Story = story(s.SetupBank);

/** New: a pad the engine lights for a part wears that part's hue (Right 2 here); nothing else does. */
export const PartLit: Story = story(s.PartLit);

/** New: the region at a 1440 × 900 Stage (about 552px wide), two rows of eight. */
export const At1440: Story = story(s.At1440);

/** New: the region at a 1217 × 752 Stage (about 464px wide), two rows of eight. */
export const At1217: Story = boxed(s.At1217, padBankBoxes.At1217);

/** New: a wide, short region (552 × 120): the pads stay squares, sized by the height, the row centred. */
export const ShortRegion: Story = boxed(s.ShortRegion, padBankBoxes.ShortRegion, {
  play: async ({ canvasElement }) => {
    await expectSquarePads(canvasElement);
  },
});

/**
 * New: the bank's three forms (`PadBank.forms`), the Sections bank in each, each region as tall as
 * its form's ratio gives for the width, so the pads are squares with no band under them:
 * `two-rows` (two rows of eight, 1–8 over 9–16), `small` (the same two rows, but the waiting pads
 * show no NEXT / ARMED chip: the ring alone says it, so the pads may be smaller) and `one-row`
 * (sixteen in a row, 1–16), the same width, under half the height. An assembled screen picks one;
 * here it is the `form` prop. A view tree (`padBankFormsSample`, PadBank.fixtures.ts), so either
 * renderer draws it.
 */
const forms = treeStory((args: PadBankRegionProps) => ({
  tree: padBankFormsSample(args),
  handlers: { bank: args.onBank, press: args.onPress, tipAction: args.tipAction },
}));
export const Forms: Story = {
  args: s.Forms.args,
  render: forms.render,
  parameters: { frameWidth: padBankFrameWidths.Forms, ...forms.parameters },
  play: async ({ canvasElement }) => {
    const roots = [...canvasElement.querySelectorAll<HTMLElement>('.yh-padbank')];
    await expect(roots.map((r) => r.dataset.form)).toEqual(PAD_BANK_FORMS.map((f) => f.id));
    const tops: number[][] = [];
    for (const root of roots) {
      const faces = [...root.querySelectorAll<HTMLElement>('.yh-padbank__cell > *')];
      await expect(faces.length).toBe(16);
      for (const face of faces) {
        const { width, height } = face.getBoundingClientRect();
        await expect(width).toBeGreaterThan(0);
        await expect(Math.abs(width - height)).toBeLessThan(0.5);
      }
      tops.push([...new Set(faces.map((face) => Math.round(face.getBoundingClientRect().top)))]);
    }
    // Two rows of eight, the same small, then one row of sixteen.
    await expect(tops.map((t) => t.length)).toEqual([2, 2, 1]);
    // Small shows no waiting chip; two-rows keeps it.
    const tagShown = (root: HTMLElement) =>
      [...root.querySelectorAll<HTMLElement>('.yh-pad__tag')].some((t) => getComputedStyle(t).display !== 'none');
    await expect(roots.map(tagShown)).toEqual([true, false, true]);
  },
};

/** New: a working bank: tabs switch bank, a press toggles a pad on and off. Drawn by React only:
 *  its bank and pad state live in the story's own `render`. */
export const Playground: Story = story(s.Playground, {
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
});
