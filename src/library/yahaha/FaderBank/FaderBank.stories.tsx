import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { FaderBankRegion, type BankLamp, type FaderStrip } from './FaderBank';
import { faderPageTabs, functionLamps, layerTabs, panelStrips, partLamps, reverbStrips, styleStrips } from './FaderBank.fixtures';

/** The mixer's region on a 1440×900 Stage (the board's band: 702×368). */
const BOARD = { width: 702, height: 368 };
/** The same region on a 1217×752 Stage. */
const SMALL = { width: 593, height: 311 };

const inRegion =
  (size: { width: number; height: number }): Decorator =>
  (Story) => (
    <div style={{ display: 'grid', width: size.width, height: size.height }}>
      <Story />
    </div>
  );

/**
 * The Stage's mixer, as the Stage draws it: one `Region` named Mixer whose views are the fader
 * pages (Panel, Style), with the layer Tabs in its aside, and the FaderBank as its body: the
 * strips in three clusters (the four parts in their hues, Style and Multi Pad, Master on its plate), each part's On lamp under it, the page
 * button under Master, and the Launchkey function lamps in their own row. Every change is a
 * callback carrying the strip's or lamp's id.
 */
const meta = {
  title: 'Library/Yahaha/Components/FaderBank',
  component: FaderBankRegion,
  decorators: [inRegion(BOARD), withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    strips: panelStrips,
    pageTabs: faderPageTabs,
    page: 'panel',
    layerTabs,
    layer: 'volume',
    partLamps,
    functionLamps,
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
  argTypes: {
    strips: { control: 'object' },
    pageTabs: { control: 'object' },
    page: { control: 'select', options: faderPageTabs.map((tab) => tab.id) },
    layerTabs: { control: 'object' },
    layer: { control: 'select', options: layerTabs.map((tab) => tab.id) },
    partLamps: { control: 'object' },
    functionLamps: { control: 'object' },
  },
} satisfies Meta<typeof FaderBankRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board: Panel page, Vol layer, Right 2 away, Right 3 off and missing, faders 7 and 8 parked. */
export const Board: Story = {};

/**
 * The page button under Master: a click flips the page (`onPageButton`); a hold (or right-click)
 * calls `onPageLong` and its release `onPageRelease`, never `onPageButton`.
 */
export const PageButtonHold: Story = {
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

/** The Reverb layer: "Faders · Reverb", the part strips in the neutral layer look with "Rev" over each value, no meters. */
export const ReverbLayer: Story = {
  args: { layer: 'reverb', strips: reverbStrips },
};

/** Added: the region a 1217×752 Stage gives the mixer (593×311). */
export const SmallStage: Story = {
  decorators: [inRegion(SMALL)],
};

/** Added: the Style page: faders 1–8 are the style's parts, all neutral (no keyboard part, no hue); 9 stays Master. */
export const StylePage: Story = {
  args: { page: 'style', strips: styleStrips },
};

/** Added: the hardware fader above the level, so Right 2 reads "↓ 72", and Left away below at the same time. */
export const TakeoverBothWays: Story = {
  args: {
    strips: panelStrips.map((strip) =>
      strip.id === 'right2' ? { ...strip, away: 110 } : strip.id === 'left' ? { ...strip, away: 20 } : strip,
    ),
  },
};

/** Added: every part off; the On lamps unlit, each name faded in its own hue with "off". */
export const AllPartsOff: Story = {
  args: {
    strips: panelStrips.map((strip): FaderStrip =>
      strip.kind === 'part' || strip.kind === 'off' ? { ...strip, kind: 'off', away: undefined, meter: 0, meter2: 0, peak: 0 } : strip,
    ),
    partLamps: partLamps.map((lamp): BankLamp => ({ ...lamp, on: false, label: 'Off' })),
  },
};

/** Added: wired to state, so faders, tabs and lamps move. */
export const Live: Story = {
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
