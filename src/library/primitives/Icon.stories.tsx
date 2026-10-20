import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../storybook';
import { Icon } from './Icon';
import { Text } from './Text';
import { iconArgTypes, iconArgs, iconProps, iconStories as s, type IconArgs } from './Icon.fixtures';

// The args, controls and each story's icons come from Icon.fixtures.ts, which the Svelte stories
// and the parity test share.

/** A play triangle and a stop square: one stroked, one filled. */
function Play() {
  return <path d="M7 5l12 7-12 7z" />;
}
function Stop() {
  return <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none" />;
}

const meta: Meta<IconArgs> = {
  title: 'Design OS/Primitives/Icon',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: iconArgs,
  argTypes: iconArgTypes,
  render: (args) => (
    <div style={{ padding: 'var(--space-4)' }}>
      <Icon {...iconProps(args)}>
        <Play />
      </Icon>
    </div>
  ),
};
export default meta;
type Story = StoryObj<IconArgs>;

/** One icon: every control changes it. */
export const Playground: Story = {};

/** Every size, beside text in the same role so the two line up. */
export const Sizes: Story = {
  render: () => (
    <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}>
      {(s.Sizes.items ?? []).map(({ size = 'body' }) => (
        <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Icon size={size}>
            <Play />
          </Icon>
          <Icon size={size}>
            <Stop />
          </Icon>
          <Text role={size === 'control' ? 'body' : size}>{size}</Text>
        </div>
      ))}
    </div>
  ),
};

/** Every tone. */
export const Tones: Story = {
  render: () => (
    <div style={{ padding: 'var(--space-4)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
      {(s.Tones.items ?? []).map((props) => (
        <div key={String(props.tone)} style={{ display: 'grid', justifyItems: 'center', gap: 'var(--space-1)' }}>
          <Icon {...props}>
            <Play />
          </Icon>
          <Text role="caption" tone="muted">
            {String(props.tone)}
          </Text>
        </div>
      ))}
    </div>
  ),
};
