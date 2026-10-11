import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { ChosenTabs } from './ChosenTabs';
import { displayPageTabs, faderPageTabs, fullPageTabs, layerTabs } from './ChosenTabs.fixtures';

/** Every fixture tab's id, for the `chosen` control. */
const ALL_IDS = [...new Set([displayPageTabs, fullPageTabs, faderPageTabs, layerTabs].flat().map((tab) => tab.id))];

/**
 * The one tab style for every one-of-many choice in a header: a run of labels on a hairline, the
 * chosen one a `--selected` block standing on it. Every `size` draws the same; it sets only the
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

/** A disabled tab: "Style" muted, skipped by clicks and arrows. */
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
