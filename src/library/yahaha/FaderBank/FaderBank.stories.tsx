import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../stories/story';
import type { Handlers } from '../../view/Tree.model';
import { FaderBankRegion, type FaderBankRegionProps } from './FaderBank';
import FaderBankRegionSvelte from './FaderBankRegion.svelte';
import {
  BOARD_REGION,
  SMALL_REGION,
  faderBankArgTypes,
  faderBankFormsSample,
  faderBankStories as s,
  styleStrips,
} from './FaderBank.fixtures';

// Every story but Live is built from FaderBank.fixtures.ts (`story(s.Name)`, the Forms story a view
// tree), which the tree snapshot shares; the toolbar's Renderer draws it with React or Svelte.

/** The region's box: `parameters.region` (default the board's), or `'none'` for a story that sizes its own. */
const inRegion: Decorator = (Story, { parameters }) => {
  const size = (parameters.region ?? BOARD_REGION) as { width: number; height: number } | 'none';
  if (size === 'none') return <Story />;
  return (
    <div style={{ display: 'grid', width: size.width, height: size.height }}>
      <Story />
    </div>
  );
};

/**
 * The Stage's mixer, as the Stage draws it: one `Region` named Mixer whose views are the fader
 * pages (Panel, Style), with the layer Tabs in its aside, and the FaderBank as its body: the
 * strips in three clusters (the four parts in their hues, Style and Multi Pad, Master on its plate), each part's On lamp under it, the page
 * button under Master, and the Launchkey function lamps in their own row. Every change is a
 * callback carrying the strip's or lamp's id.
 */
const meta = {
  title: 'Yahaha/Components/FaderBank',
  component: FaderBankRegion,
  decorators: [withRenderer, inRegion, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    strips: s.Board.args!.strips!,
    pageTabs: s.Board.args!.pageTabs!,
    page: s.Board.args!.page!,
    layerTabs: s.Board.args!.layerTabs!,
    layer: s.Board.args!.layer!,
    partLamps: s.Board.args!.partLamps!,
    functionLamps: s.Board.args!.functionLamps!,
    tipAction: fn(),
    onChoosePage: fn(),
    onChooseLayer: fn(),
    onLevel: fn(),
    onOpen: fn(),
    onLamp: fn(),
    onLampLong: fn(),
    onLampRelease: fn(),
    onPageButton: fn(),
    onPageLong: fn(),
    onPageRelease: fn(),
  },
  argTypes: faderBankArgTypes,
} satisfies Meta<typeof FaderBankRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

const story = fixtureStories<Story>(FaderBankRegion, FaderBankRegionSvelte);

/** The Forms tree, its callbacks the story's spies by their own names. */
const forms = treeStory((args: FaderBankRegionProps) => ({
  tree: faderBankFormsSample(args),
  handlers: Object.fromEntries(Object.entries(args).filter(([, value]) => typeof value === 'function')) as Handlers,
}));

/** The board: Panel page, Vol layer, Right 2 away, Right 3 off and missing, faders 7 and 8 parked. */
export const Board: Story = story(s.Board);

/**
 * The page button under Master: a click flips the page (`onPageButton`); a hold (or right-click)
 * calls `onPageLong` and its release `onPageRelease`, never `onPageButton`.
 */
export const PageButtonHold: Story = {
  ...story(s.PageButtonHold),
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: /^Fader page is Panel/ });
    await userEvent.click(button);
    await expect(args.onPageButton).toHaveBeenCalledTimes(1);
    await fireEvent.contextMenu(button);
    await expect(args.onPageLong).toHaveBeenCalledTimes(1);
    await expect(args.onPageRelease).toHaveBeenCalledTimes(1);
    await expect(args.onPageButton).toHaveBeenCalledTimes(1);
  },
};

/**
 * Added: the sound names pressable (`onSound`), for an app whose Display shows no parts column: each
 * part's sound under its name is its own button (tooltip key `soundTip`) calling `onSound(part)`;
 * the name still opens the part (`onOpen`).
 */
export const SoundPress: Story = {
  ...story(s.Board),
  args: { ...s.Board.args, onSound: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Right 1 sound: Stage Grand, choose a sound' }));
    await expect(args.onSound).toHaveBeenCalledWith('r1');
    await userEvent.click(canvas.getByRole('button', { name: 'Left sound: Finger Bass, choose a sound' }));
    await expect(args.onSound).toHaveBeenLastCalledWith('l');
    await userEvent.click(canvas.getByRole('button', { name: 'Right 1, Stage Grand: open Channel' }));
    await expect(args.onOpen).toHaveBeenCalledWith('right1');
    await expect(args.onSound).toHaveBeenCalledTimes(2);
  },
};

/** The Reverb layer: "Faders · Reverb", the part strips in the neutral layer look with "Rev" over each value, no meters. */
export const ReverbLayer: Story = story(s.ReverbLayer);

const small = story(s.SmallStage);
/** Added: the region a 1217×752 Stage gives the mixer (593×311). */
export const SmallStage: Story = { ...small, parameters: { ...small.parameters, region: SMALL_REGION } };

/**
 * Added: the two forms (`FaderBank.forms`), each in a region the size of its least at the compact
 * scale (the body plus a 12 px plate inset and a 36 px head): `tall` 565 × 354 (travel 3 control
 * heights) and `short` 549 × 266 (travel 1 control height and a `--space-3`). Every strip, key,
 * mark and tab is in both.
 */
export const Forms: Story = {
  args: s.Forms.args,
  parameters: { region: 'none', ...forms.parameters },
  render: forms.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const form of ['tall', 'short']) {
      const region = canvas.getByRole('region', { name: `Mixer, ${form}` });
      await expect(region.querySelector('.yh-faderbank')).toHaveAttribute('data-form', form);
      await expect(within(region).getAllByRole('slider')).toHaveLength(9);
      await expect(within(region).getByRole('button', { name: /^Fader page is Panel/ })).toBeInTheDocument();
    }
  },
};

/** Added: the Style page: faders 1–8 are the style's parts, all neutral (no keyboard part, no hue); 9 stays Master. */
export const StylePage: Story = story(s.StylePage);

/** Added: the hardware fader above the level, so Right 2 reads "↓ 72", and Left away below at the same time. */
export const TakeoverBothWays: Story = story(s.TakeoverBothWays);

/** Added: every part off; the On lamps unlit, each name faded in its own hue with "off". */
export const AllPartsOff: Story = story(s.AllPartsOff);

/** Added: a function lamp in the `ok` hue (running / success): Harm/Arp lit in `--success`. */
export const LampOk: Story = {
  ...story(s.LampOk),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Harmony/Arpeggio on (running)' })).toHaveAttribute('data-hue', 'ok');
  },
};

/** Added: wired to state, so faders, tabs and lamps move. Drawn by React only (its state is a React
 *  `useState`; the Renderer toolbar says so). */
export const Live: Story = {
  args: s.Live.args,
  render: function Live(args) {
    const [strips, setStrips] = useState(args.strips);
    const [page, setPage] = useState(args.page);
    const [layer, setLayer] = useState(args.layer);
    const [lamps, setLamps] = useState(args.partLamps);
    const [functions, setFunctions] = useState(args.functionLamps);
    const level = (id: string, next: number) =>
      setStrips((all) => all.map((s) => (s.id === id ? { ...s, level: next, value: String(next), away: undefined } : s)));
    const lamp = (id: string, on: boolean) => {
      setLamps((all) => all.map((l) => (l.id === id ? { ...l, on, label: on ? 'On' : 'Off' } : l)));
      setStrips((all) => all.map((s) => (s.id === id ? { ...s, kind: on ? 'part' : 'off' } : s)));
      setFunctions((all) => all.map((l) => (l.id === id ? { ...l, on } : l)));
    };
    return (
      <FaderBankRegion
        {...args}
        strips={page === 'style' ? styleStrips : strips}
        page={page}
        layer={layer}
        partLamps={lamps}
        functionLamps={functions}
        onLevel={level}
        onLamp={lamp}
        onChoosePage={setPage}
        onChooseLayer={setLayer}
        onPageButton={() => setPage((p) => (p === 'panel' ? 'style' : 'panel'))}
      />
    );
  },
};
