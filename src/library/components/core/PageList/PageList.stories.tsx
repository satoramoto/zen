import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { PageList } from './PageList';
import { settingsPages } from './PageList.fixtures';

/**
 * A vertical list of pages, one row each, the open one a `--selected` block. Page navigation:
 * buttons with `aria-current="page"`; ↑ ↓ Home End move focus and call `onChoose`. Controlled: the
 * parent moves `chosen`.
 */
const meta = {
  title: 'Design OS/Components/Core/PageList',
  component: PageList,
  decorators: [
    (Story) => (
      <div style={{ width: 220, padding: 'var(--space-4)' }}>
        <Story />
      </div>
    ),
    withLibraryTheme,
  ],
  parameters: { layout: 'fullscreen' },
  args: { pages: settingsPages, chosen: 'chord', label: 'Settings pages', onChoose: fn() },
  argTypes: {
    pages: { control: 'object' },
    chosen: { control: 'select', options: [null, ...settingsPages.map((page) => page.id)] },
    label: { control: 'text' },
  },
} satisfies Meta<typeof PageList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Settings screen's left column: Chord & Split open, then Style … Controller, names only. */
export const Board: Story = {};

/** Keys: ↑ ↓ wrap, Home and End jump; each move focuses the row and calls `onChoose`. */
export const Keys: Story = {};

/** The System page open: the block moves with `chosen`, and only that row is current. */
export const SystemOpen: Story = {
  args: { chosen: 'system' },
};

/** No page open: every row at rest. */
export const NoneOpen: Story = {
  args: { chosen: null },
};

/** A narrow column: long names end in an ellipsis and keep their first words. */
export const LongNames: Story = {
  args: {
    chosen: 'midi',
    pages: [
      ...settingsPages.slice(0, 2),
      { id: 'midi', label: 'MIDI Input & Output Routing', tip: 'settings.tab.midi' },
      { id: 'backup', label: 'Backup, Restore and Factory Reset', tip: 'settings.tab.backup' },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 160 }}>
        <Story />
      </div>
    ),
  ],
};
