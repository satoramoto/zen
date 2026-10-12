import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { KnobBankRegion, type KnobItem } from './KnobBank';
import { knobPages, knobsByPage, reverbKnobs, styleKnobs } from './KnobBank.fixtures';

/**
 * The Stage's Knobs region, as the Stage draws it: one `Region` named Knobs whose views are the
 * knob pages (no title: the tabs name the region), and the KnobBank's eight knobs as its body.
 * Compare each story with its namesake under "Yahaha baseline / Components / KnobBank": same names, same sample data. A tab choice is a callback with the page's index; every knob change
 * carries the knob's position.
 */
const meta = {
  title: 'Yahaha/Components/KnobBank',
  component: KnobBankRegion,
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
    knobs: styleKnobs,
    pages: knobPages,
    page: 0,
    tipAction: fn(),
    onPage: fn(),
    onPress: fn(),
    onStep: fn(),
  },
  argTypes: {
    knobs: { control: 'object' },
    pages: { control: 'object' },
    page: { control: { type: 'number', min: 0, max: knobPages.length - 1, step: 1 } },
    pageLabel: { control: 'text' },
  },
} satisfies Meta<typeof KnobBankRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board: the Style page chosen; knob 7 unused. A tab click asks for that page's index. */
export const Board: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Style' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('img', { name: 'Knob 7: unused' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('tab', { name: 'Reverb' }));
    await expect(args.onPage).toHaveBeenCalledWith(3);
  },
};

/** The Reverb page chosen. */
export const ReverbPage: Story = { args: { page: 3 } };

/** New: the Reverb page with its own knobs: the parts' sends on 1–4 wear their parts' hues. */
export const ReverbSends: Story = { args: { page: 3, knobs: reverbKnobs } };

/** New: the Rack page, the parts' volumes on 1–4 in their hues; Harmony, Metronome and Tempo in ink. */
export const RackPage: Story = { args: { page: 1, knobs: knobsByPage[1] } };

/** New: the Pan page: text values ("C", "L24") read in the ring like numbers. */
export const PanPage: Story = { args: { page: 2, knobs: knobsByPage[2] } };

/** New: the Chorus page, with an unmapped slot before the return. */
export const ChorusPage: Story = { args: { page: 4, knobs: knobsByPage[4] } };

/** New: only three knobs given: the bank still draws all eight, the rest unused, as on the hardware. */
export const FewerKnobs: Story = { args: { knobs: styleKnobs.slice(0, 3) } };

/** New: no page list, only the page's name as the one tab (a swap page). */
export const PageLabelOnly: Story = { args: { pages: [], pageLabel: 'Swap R1' } };

/** New: the region at a 1440 × 900 Stage (about 552px wide). */
export const At1440: Story = {};

/** New: the region at a 1217 × 752 Stage (about 464px wide): rings shrink to their slots. */
export const At1217: Story = {
  args: { page: 3, knobs: reverbKnobs },
  decorators: [
    (Story) => (
      <div style={{ width: 464 }}>
        <Story />
      </div>
    ),
  ],
};

/** New: a working bank: tabs switch page, keys / drag / wheel step a knob's level 0–127. */
export const Playground: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(args.page ?? 0);
    const [sets, setSets] = useState<KnobItem[][]>(knobsByPage);
    const step = (i: number, delta: number) => {
      args.onStep?.(i, delta);
      setSets((all) =>
        all.map((set, p) =>
          p !== page
            ? set
            : set.map((knob, k) => {
                const n = Number(knob.value);
                if (k !== i || Number.isNaN(n)) return knob;
                const max = knob.unit === '%' ? 100 : 127;
                const next = Math.min(max, Math.max(0, n + delta));
                return { ...knob, value: String(next), fraction: next / max };
              }),
        ),
      );
    };
    return (
      <KnobBankRegion
        {...args}
        page={page}
        knobs={sets[page]}
        onPage={(i) => {
          args.onPage?.(i);
          setPage(i);
        }}
        onStep={step}
      />
    );
  },
};
