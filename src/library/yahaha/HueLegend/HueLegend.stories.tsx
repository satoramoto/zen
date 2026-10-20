import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { Pad } from '../../components/music';
import { Group } from '../../layout';
import { PART_HUE_INDEX } from '../hues';
import { HueLegend, PART_LEGEND } from './HueLegend';
import HueLegendSvelte from './HueLegend.svelte';
import { hueLegendArgTypes, hueLegendStories as s } from './HueLegend.fixtures';

// Every story is built from HueLegend.fixtures.ts (`story(s.Name)`), which the tree snapshot shares;
// the toolbar's Renderer draws it with React's or Svelte's `Tree`.
const meta = {
  title: 'Yahaha/Primitives/HueLegend',
  component: HueLegend,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  argTypes: hueLegendArgTypes,
} satisfies Meta<typeof HueLegend>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(HueLegend, HueLegendSvelte);

/** The part legend: Right 1, Right 2, Right 3, Left, each in its part's hue. Sections need no key: they take no hue. */
export const Board: Story = story(s.Board);

/**
 * In place: the legend in a header over a row of part pads, so the key and the parts can be read
 * together. React only: Pad and Group are not registered tree components yet, so this layout keeps
 * its own `render`.
 */
export const OverPads: Story = story(s.OverPads, {
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
});
