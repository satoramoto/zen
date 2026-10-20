import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, treeStory, withRenderer } from '../../stories/story';
import { KNOB_BANK_FORMS, KnobBankRegion, type KnobBankRegionProps, type KnobItem } from './KnobBank';
import KnobBankRegionSvelte from './KnobBankRegion.svelte';
import {
  KNOB_BANK_WIDTH,
  KNOB_BANK_WIDTH_1217,
  knobBankArgTypes,
  knobBankBoard,
  knobBankFormsSample,
  knobBankStories as s,
  knobsByPage,
} from './KnobBank.fixtures';

// Every story is built from KnobBank.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`.

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
    withRenderer,
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
const story = fixtureStories<Story>(KnobBankRegion, KnobBankRegionSvelte);

/** The board: the Style page chosen; knob 7 unused. A tab click asks for that page's index. */
export const Board: Story = {
  ...story(s.Board),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Style' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('img', { name: 'Knob 7: unused' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('tab', { name: 'Reverb' }));
    await expect(args.onPage).toHaveBeenCalledWith(3);
  },
};

/** The Reverb page chosen. */
export const ReverbPage: Story = story(s.ReverbPage);

/** New: the Reverb page with its own knobs: the parts' sends on 1–4 wear their parts' hues. */
export const ReverbSends: Story = story(s.ReverbSends);

/** New: the Rack page, the parts' volumes on 1–4 in their hues; Harmony, Metronome and Tempo in ink. */
export const RackPage: Story = story(s.RackPage);

/** New: the Pan page: text values ("C", "L24") read in the ring like numbers. */
export const PanPage: Story = story(s.PanPage);

/** New: the Chorus page, with an unmapped slot before the return. */
export const ChorusPage: Story = story(s.ChorusPage);

/** New: only three knobs given: the bank still draws all eight, the rest unused, as on the hardware. */
export const FewerKnobs: Story = story(s.FewerKnobs);

/** New: no page list, only the page's name as the one tab (a swap page). */
export const PageLabelOnly: Story = story(s.PageLabelOnly);

/** New: the region at a 1440 × 900 Stage (about 552px wide). */
export const At1440: Story = story(s.At1440);

/** New: the region at a 1217 × 752 Stage (about 464px wide): rings shrink to their slots. */
export const At1217: Story = { ...story(s.At1217), parameters: { ...story(s.At1217).parameters, width: KNOB_BANK_WIDTH_1217 } };

/**
 * New: the bank's forms (`KNOB_BANK_FORMS`), each at about its least width at the compact scale
 * (plus the region's plate): `labelled`, every name whole and the full ring; `compact`, names
 * that may break across their two lines and rings down to one target. The page tabs set the
 * compact width. Choose a form with the `form` control on the other stories. A view tree
 * (`knobBankFormsSample`, KnobBank.fixtures.ts), so either renderer draws it.
 */
const forms = treeStory((args: KnobBankRegionProps) => ({
  tree: knobBankFormsSample(args),
  handlers: { page: args.onPage, press: args.onPress, step: args.onStep, tipAction: args.tipAction },
}));
export const Forms: Story = {
  args: s.Forms.args,
  render: forms.render,
  parameters: { width: 'auto', ...forms.parameters },
  play: async ({ canvasElement }) => {
    for (const f of KNOB_BANK_FORMS) {
      const box = within(within(canvasElement).getByTestId(`form-${f.id}`));
      await expect(box.getByRole('tabpanel').querySelector('[data-form]')).toHaveAttribute('data-form', f.id);
      await expect(box.getByRole('button', { name: /^Knob 6: Metronome/ })).toBeInTheDocument();
      await expect(box.getByRole('img', { name: 'Knob 7: unused' })).toBeInTheDocument();
    }
  },
};

/** New: a working bank: tabs switch page, keys / drag / wheel step a knob's level 0–127. Drawn by
 *  React only: its page and knob state live in the story's own `render`. */
export const Playground: Story = story(s.Playground, {
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
});
