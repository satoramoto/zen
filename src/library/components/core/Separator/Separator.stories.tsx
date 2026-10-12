import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../../storybook';
import { Button } from '../Button/Button';
import { Separator } from './Separator';

const meta = {
  title: 'Design OS/Components/Core/Separator',
  component: Separator,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    length: { control: 'inline-radio', options: ['short', 'full'] },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The app bar's hairline between Harm/Arp and Library: a short line, as tall as the tab labels. */
export const Board: Story = {
  args: { length: 'short' },
  render: (args) => (
    <div className="lib-row" style={{ height: 'var(--control-h)' }}>
      <Separator {...args} />
    </div>
  ),
};

/** The line spanning the whole row. */
export const Full: Story = {
  args: { length: 'full' },
  render: (args) => (
    <div className="lib-row" style={{ height: 'calc(var(--control-h) * 1.5)', alignItems: 'stretch' }}>
      <Separator {...args} />
    </div>
  ),
};

/** In place on an app bar: two tab runs and the right area, split by short lines. */
export const InAppBar: Story = {
  render: () => (
    <div className="lib-row" style={{ flexWrap: 'nowrap' }}>
      <Button variant="quiet" label="Stage" />
      <Button variant="quiet" label="Harm/Arp" chosen />
      <Separator />
      <Button variant="quiet" label="Library" />
      <Button variant="quiet" label="Mixer" />
      <Separator />
      <Button variant="quiet" label="Settings" />
    </div>
  ),
};
