import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../storybook';
import { Icon, ICON_SIZES, type IconSize } from './Icon';
import { Text, TEXT_TONES, type TextTone } from './Text';

/** A play triangle and a stop square: one stroked, one filled. */
function Play() {
  return <path d="M7 5l12 7-12 7z" />;
}
function Stop() {
  return <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none" />;
}

interface IconArgs {
  size: IconSize | 'default';
  tone: TextTone | 'inherit';
  label: string;
}

const meta: Meta<IconArgs> = {
  title: 'Design OS/Primitives/Icon',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { size: 'control', tone: 'primary', label: 'Play' },
  argTypes: {
    size: { control: 'select', options: ['default', ...ICON_SIZES] },
    tone: { control: 'select', options: ['inherit', ...TEXT_TONES] },
    label: { control: 'text' },
  },
  render: ({ size, tone, label }) => (
    <div style={{ padding: 'var(--space-4)' }}>
      <Icon size={size === 'default' ? undefined : size} tone={tone === 'inherit' ? undefined : tone} label={label || undefined}>
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
      {ICON_SIZES.map((size) => (
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
      {TEXT_TONES.map((tone) => (
        <div key={tone} style={{ display: 'grid', justifyItems: 'center', gap: 'var(--space-1)' }}>
          <Icon size="heading" tone={tone}>
            <Play />
          </Icon>
          <Text role="caption" tone="muted">
            {String(tone)}
          </Text>
        </div>
      ))}
    </div>
  ),
};
