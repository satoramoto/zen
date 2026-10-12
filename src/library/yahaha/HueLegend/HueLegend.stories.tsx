import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../storybook';
import { Pad } from '../../components/music';
import { Group } from '../../layout';
import { PART_HUE_INDEX } from '../hues';
import { HueLegend, PART_LEGEND } from './HueLegend';

const meta = {
  title: 'Yahaha/Primitives/HueLegend',
  component: HueLegend,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { items: PART_LEGEND },
  argTypes: {
    items: { control: 'object' },
  },
} satisfies Meta<typeof HueLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The part legend: Right 1, Right 2, Right 3, Left, each in its part's hue. Sections need no key: they take no hue. */
export const Board: Story = {};

/** In place: the legend in a header over a row of part pads, so the key and the parts can be read together. */
export const OverPads: Story = {
  render: (args) => (
    <div style={{ maxWidth: 560 }}>
      <Group name="Parts" aside={<HueLegend {...args} />}>
        {(args.items ?? PART_LEGEND).map((item, i) => (
          <Pad
            key={item.label}
            label={item.label}
            family="util"
            hue={item.part ? PART_HUE_INDEX[item.part] : undefined}
            state={i === 0 ? 'playing' : 'idle'}
          />
        ))}
      </Group>
    </div>
  ),
};
