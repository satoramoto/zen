import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../storybook';
import { Region } from './Region';
import { Screen } from './Screen';

const ARRANGEMENTS: Record<string, { areas: string[]; columns?: string; rows?: string }> = {
  'Hero over two': { areas: ['hero hero', 'mixer pads'], columns: 'minmax(0, 1.4fr) minmax(0, 1fr)', rows: 'auto minmax(0, 1fr)' },
  'Three across': { areas: ['hero mixer pads'] },
  'Sidebar and main': { areas: ['pads hero', 'pads mixer'], columns: 'minmax(180px, 1fr) minmax(0, 3fr)', rows: 'auto minmax(0, 1fr)' },
  Stacked: { areas: ['hero', 'mixer', 'pads'] },
};

const note = (text: string) => <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 'var(--size-caption)' }}>{text}</p>;

interface ScreenArgs {
  arrangement: keyof typeof ARRANGEMENTS;
  header: boolean;
  footer: boolean;
}

const meta: Meta<ScreenArgs> = {
  title: 'Design OS/Layout/Screen',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { arrangement: 'Hero over two', header: true, footer: true },
  argTypes: {
    arrangement: { control: 'select', options: Object.keys(ARRANGEMENTS) },
    header: { control: 'boolean' },
    footer: { control: 'boolean' },
  },
  render: ({ arrangement, header, footer }) => {
    const grid = ARRANGEMENTS[arrangement];
    return (
      <div style={{ height: 'calc(100vh - 2 * var(--space-6))' }}>
        <Screen
          name="Stage"
          areas={grid.areas}
          columns={grid.columns}
          rows={grid.rows}
          header={header ? <Region name="App bar">{note('Header: fixed, never scrolls with the grid')}</Region> : undefined}
          footer={footer ? <Region name="Keys">{note('Footer: fixed at the bottom')}</Region> : undefined}
        >
          <Region name="Hero" label="Hero" area="hero">
            {note('area="hero"')}
          </Region>
          <Region name="Mixer" label="Mixer" area="mixer">
            {note('area="mixer"')}
          </Region>
          <Region name="Pads" label="Pads" area="pads">
            {note('area="pads"')}
          </Region>
        </Screen>
      </div>
    );
  },
};
export default meta;
type Story = StoryObj<ScreenArgs>;

/** A fixed header, a named grid of regions spaced by the plate gap, and a fixed footer. Change the arrangement: the regions move, the frame stays. */
export const Default: Story = {};

/** The grid alone, no header or footer. */
export const GridOnly: Story = { args: { header: false, footer: false } };
