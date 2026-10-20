import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { KNOB_BANK_FORMS, KnobBankRegion, type KnobItem } from './KnobBank';
import {
  KNOB_BANK_FORM_WIDTHS,
  KNOB_BANK_WIDTH,
  KNOB_BANK_WIDTH_1217,
  knobBankArgTypes,
  knobBankBoard,
  knobBankStories as s,
  knobsByPage,
} from './KnobBank.fixtures';
import { instances } from '../../fixtures';

// Every story's args come from KnobBank.fixtures.ts, which the Svelte stories and the parity test share.

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
    // The region's width on the board's Stage; a story may set its own (`parameters.width`).
    (Story, { parameters }) => (
      <div style={{ width: (parameters.width as number | string | undefined) ?? KNOB_BANK_WIDTH }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    ...knobBankBoard,
    tipAction: fn(),
    onPage: fn(),
    onPress: fn(),
    onStep: fn(),
  },
  argTypes: knobBankArgTypes,
} satisfies Meta<typeof KnobBankRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board: the Style page chosen; knob 7 unused. A tab click asks for that page's index. */
export const Board: Story = {
  args: s.Board.args,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Style' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('img', { name: 'Knob 7: unused' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('tab', { name: 'Reverb' }));
    await expect(args.onPage).toHaveBeenCalledWith(3);
  },
};

/** The Reverb page chosen. */
export const ReverbPage: Story = { args: s.ReverbPage.args };

/** New: the Reverb page with its own knobs: the parts' sends on 1–4 wear their parts' hues. */
export const ReverbSends: Story = { args: s.ReverbSends.args };

/** New: the Rack page, the parts' volumes on 1–4 in their hues; Harmony, Metronome and Tempo in ink. */
export const RackPage: Story = { args: s.RackPage.args };

/** New: the Pan page: text values ("C", "L24") read in the ring like numbers. */
export const PanPage: Story = { args: s.PanPage.args };

/** New: the Chorus page, with an unmapped slot before the return. */
export const ChorusPage: Story = { args: s.ChorusPage.args };

/** New: only three knobs given: the bank still draws all eight, the rest unused, as on the hardware. */
export const FewerKnobs: Story = { args: s.FewerKnobs.args };

/** New: no page list, only the page's name as the one tab (a swap page). */
export const PageLabelOnly: Story = { args: s.PageLabelOnly.args };

/** New: the region at a 1440 × 900 Stage (about 552px wide). */
export const At1440: Story = { args: s.At1440.args };

/** New: the region at a 1217 × 752 Stage (about 464px wide): rings shrink to their slots. */
export const At1217: Story = {
  args: s.At1217.args,
  decorators: [
    (Story) => (
      <div style={{ width: KNOB_BANK_WIDTH_1217 }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * New: the bank's forms (`KNOB_BANK_FORMS`), each at about its least width at the compact scale
 * (plus the region's plate): `labelled`, every name whole and the full ring; `compact`, names
 * that may break across their two lines and rings down to one target. The page tabs set the
 * compact width. Choose a form with the `form` control on the other stories.
 */
export const Forms: Story = {
  args: s.Forms.args,
  parameters: { width: 'auto' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24, justifyItems: 'start' }}>
      {instances(s.Forms).map(({ form }) => (
        <div key={form} style={{ width: KNOB_BANK_FORM_WIDTHS[form ?? ''] }} data-testid={`form-${form}`}>
          <KnobBankRegion {...args} form={form} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const f of KNOB_BANK_FORMS) {
      const box = within(within(canvasElement).getByTestId(`form-${f.id}`));
      await expect(box.getByRole('tabpanel').querySelector('[data-form]')).toHaveAttribute('data-form', f.id);
      await expect(box.getByRole('button', { name: /^Knob 6: Metronome/ })).toBeInTheDocument();
      await expect(box.getByRole('img', { name: 'Knob 7: unused' })).toBeInTheDocument();
    }
  },
};

/** New: a working bank: tabs switch page, keys / drag / wheel step a knob's level 0–127. */
export const Playground: Story = {
  args: s.Playground.args,
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
