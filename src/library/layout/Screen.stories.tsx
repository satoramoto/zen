import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../storybook';
import { Region } from './Region';
import { Screen } from './Screen';
import { FOOTER_NOTE, HEADER_NOTE, screenArgTypes, screenArgs, screenProps, screenStoryArgs, type ScreenArgs } from './Screen.fixtures';

const note = (text: string) => <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 'var(--size-caption)' }}>{text}</p>;

const meta: Meta<ScreenArgs> = {
  title: 'Design OS/Layout/Screen',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: screenArgs,
  argTypes: screenArgTypes,
  render: (args) => {
    const { name, areas, columns, rows, header, footer } = screenProps(args);
    return (
      <div style={{ height: 'calc(100vh - 2 * var(--space-6))' }}>
        <Screen
          name={name}
          areas={areas}
          columns={columns}
          rows={rows}
          header={header ? <Region name="App bar">{note(HEADER_NOTE)}</Region> : undefined}
          footer={footer ? <Region name="Keys">{note(FOOTER_NOTE)}</Region> : undefined}
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
export const Default: Story = { args: screenStoryArgs.Default };

/** The grid alone, no header or footer. */
export const GridOnly: Story = { args: screenStoryArgs.GridOnly };
