import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../../storybook';
import { Button } from '../Button/Button';
import { Separator } from './Separator';
import { APP_BAR, APP_BAR_CHOSEN, separatorArgTypes, separatorStories as s } from './Separator.fixtures';

const meta = {
  title: 'Design OS/Components/Core/Separator',
  component: Separator,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: separatorArgTypes,
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The app bar's hairline between Harm/Arp and Library: a short line, as tall as the tab labels. */
export const Board: Story = {
  args: s.Board.args,
  render: (args) => (
    <div className="lib-row" style={{ height: 'var(--control-h)' }}>
      <Separator {...args} />
    </div>
  ),
};

/** The line spanning the whole row. */
export const Full: Story = {
  args: s.Full.args,
  render: (args) => (
    <div className="lib-row" style={{ height: 'calc(var(--control-h) * 1.5)', alignItems: 'stretch' }}>
      <Separator {...args} />
    </div>
  ),
};

/** In place on an app bar: two tab runs and the right area, split by short lines. */
export const InAppBar: Story = {
  args: s.InAppBar.args,
  render: (args) => (
    <div className="lib-row" style={{ flexWrap: 'nowrap' }}>
      {APP_BAR.map((label, i) =>
        label === '|' ? (
          <Separator key={i} {...args} />
        ) : (
          <Button key={i} variant="quiet" label={label} chosen={label === APP_BAR_CHOSEN || undefined} />
        ),
      )}
    </div>
  ),
};
