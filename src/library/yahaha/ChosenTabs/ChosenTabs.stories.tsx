import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { ChosenTabs } from './ChosenTabs';
import { displayPageTabs, faderPageTabs, fullPageTabs, layerTabs } from './ChosenTabs.fixtures';

/** Every fixture tab's id, for the `chosen` control. */
const ALL_IDS = [...new Set([displayPageTabs, fullPageTabs, faderPageTabs, layerTabs].flat().map((tab) => tab.id))];

/**
 * The one tab style for every one-of-many choice in a header: a run of labels on a hairline, the
 * chosen one in ink with a `--selected` rule under it (`look="underline"`, the default), or a
 * `--selected` block standing on it (`look="block"`). Every `size` draws the same; it sets only the
 * kind (page navigation or a tablist). The parent owns `chosen`; a click only calls `onChoose`.
 */
const meta = {
  title: 'Library/Yahaha/Primitives/ChosenTabs',
  component: ChosenTabs,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { tabs: displayPageTabs, onChoose: fn() },
  argTypes: {
    tabs: { control: 'object' },
    chosen: { control: 'select', options: [null, ...ALL_IDS] },
    size: { control: 'inline-radio', options: ['page', 'header', 'compact'] },
    label: { control: 'text' },
    dense: { control: 'boolean' },
    look: { control: 'inline-radio', options: ['underline', 'block'] },
  },
} satisfies Meta<typeof ChosenTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The app bar's first run: Stage chosen, Channel … Harm/Arp at rest. Page tabs are buttons with `aria-current`. */
export const Board: Story = {
  args: { tabs: displayPageTabs, chosen: 'stage', size: 'page' },
};

/** The band header's fader page: Panel on the same block as every other run. */
export const FaderPage: Story = {
  args: { tabs: faderPageTabs, chosen: faderPageTabs[0].id, label: 'Fader page (master button)' },
};

/** The band header's fader layer: a tablist of five, Vol chosen. */
export const Layers: Story = {
  args: { tabs: layerTabs, chosen: 'volume', label: 'Fader layer' },
};

/** Roving focus with automatic activation: → ← wrap, Home and End jump, each move calls `onChoose`. */
export const Arrows: Story = {
  args: { tabs: layerTabs, chosen: 'volume', label: 'Fader layer' },
};

/** A disabled tab: "Style" in `--text-3`, still readable, skipped by clicks and arrows. */
export const Disabled: Story = {
  args: {
    tabs: [faderPageTabs[0], { ...faderPageTabs[1], disabled: true }],
    chosen: 'panel',
    label: 'Fader page (master button)',
  },
};

/** Nothing chosen: every tab at rest, the first takes the Tab stop. */
export const NoneChosen: Story = {
  args: { tabs: layerTabs, chosen: null, label: 'Fader layer' },
};

/** Dense: the tighter side padding a narrow region (the knob bank on a 1217 × 752 Stage) needs, under the default for comparison. */
export const Dense: Story = {
  args: { tabs: layerTabs, chosen: 'volume', label: 'Fader layer', dense: true },
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--space-4)', justifyItems: 'start' }}>
      <ChosenTabs {...args} label="Fader layer (default)" dense={false} />
      <ChosenTabs {...args} />
    </div>
  ),
};

/**
 * New: `look="underline"`, the default. The chosen tab is ink at the strong weight with a 2px
 * `--selected` rule on the hairline; its width was reserved, so the run doesn't shift as the choice moves.
 */
export const Underline: Story = {
  args: { tabs: layerTabs, chosen: 'volume', label: 'Fader layer', look: 'underline' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const run = canvasElement.querySelector('.yh-chosen-tabs')!;
    await expect(run).toHaveAttribute('data-look', 'underline');
    const chosen = canvas.getByRole('tab', { selected: true });
    await expect(getComputedStyle(chosen).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    const pan = canvas.getByRole('tab', { name: 'Pan' });
    const before = pan.getBoundingClientRect().width;
    await userEvent.click(pan);
    await expect(args.onChoose).toHaveBeenCalledWith('pan');
    await expect(pan.getBoundingClientRect().width).toBe(before);
  },
};

/** New: `look="block"`, the solid `--selected` block, kept as an option, above the default underline for comparison. */
export const Block: Story = {
  args: { tabs: layerTabs, chosen: 'volume', label: 'Fader layer', look: 'block' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--space-4)', justifyItems: 'start' }}>
      <ChosenTabs {...args} />
      <ChosenTabs {...args} label="Fader layer (underline)" look="underline" />
    </div>
  ),
};

/** The app bar's two runs side by side, as the header lays them out. */
export const AppBar: Story = {
  args: { tabs: displayPageTabs },
  render: (args) => (
    <div className="lib-row" style={{ gap: 'var(--space-6)', alignItems: 'flex-end' }}>
      <ChosenTabs tabs={displayPageTabs} chosen="effects" size="page" onChoose={args.onChoose} />
      <ChosenTabs tabs={fullPageTabs} chosen={null} size="page" onChoose={args.onChoose} />
    </div>
  ),
};
