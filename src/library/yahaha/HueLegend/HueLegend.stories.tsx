import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../storybook';
import { Pad, SectionHead } from '../../components';
import { HueLegend, SECTION_HUE } from './HueLegend';

const meta = {
  title: 'Library/Yahaha/Primitives/HueLegend',
  component: HueLegend,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: {
    items: [
      { label: 'Intro', hue: 'intro' },
      { label: 'Main', hue: 'main' },
      { label: 'Ending', hue: 'ending' },
      { label: 'Break', hue: 'brk' },
      { label: 'Fill', hue: 'fill' },
    ],
  },
  argTypes: {
    items: { control: 'object' },
  },
} satisfies Meta<typeof HueLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The section legend on the board: Intro, Main, Ending, Break, Fill. */
export const Board: Story = {};

/** In place: the pads header's legend over a row of section pads, so the key and the pads can be read together. */
export const OverPads: Story = {
  render: (args) => (
    <div className="lib-stack" style={{ maxWidth: 560 }}>
      <SectionHead aside={<HueLegend {...args} />}>Sections</SectionHead>
      <div className="lib-row" style={{ flexWrap: 'nowrap' }}>
        {args.items.map((item, i) => (
          <div key={item.label} style={{ flex: 1, display: 'grid' }}>
            <Pad hue={SECTION_HUE[item.hue]} state={i === 1 ? 'playing' : i === 3 ? 'queued' : 'idle'}>
              {item.label}
            </Pad>
          </div>
        ))}
      </div>
    </div>
  ),
};
