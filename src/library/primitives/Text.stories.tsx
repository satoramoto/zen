import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withLibraryTheme } from '../storybook';
import { Text, TEXT_ROLES, TEXT_TONES, type TextTone } from './Text';
import { BASEL, HARMONIC, SAMPLE, textArgTypes, textArgs, textProps, type TextArgs } from './Text.fixtures';

/** `on-solid` is ink for a solid action fill, so it is shown on `--action`; every other tone on the page. */
const ground = (tone: TextTone | 'inherit'): CSSProperties =>
  tone === 'on-solid'
    ? { background: 'var(--action)', borderRadius: 'var(--radius-control)', padding: 'var(--space-1) var(--space-2)' }
    : {};

// The args, controls and specimens come from Text.fixtures.ts, which the Svelte stories and the parity test share.
const meta: Meta<TextArgs> = {
  title: 'Design OS/Primitives/Text',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: textArgs,
  argTypes: textArgTypes,
  render: (args) => (
    <div style={{ width: args.width, padding: 'var(--space-4)' }}>
      <Text {...textProps(args)} as="p" style={ground(args.tone)}>
        {args.text}
      </Text>
    </div>
  ),
};
export default meta;
type Story = StoryObj<TextArgs>;

/** One specimen: every control changes it (narrow the width with truncate on to see the ellipsis). */
export const Playground: Story = {};

/** Every role (rows) in every tone (columns). */
export const AllRolesAndTones: Story = {
  name: 'All roles and tones',
  render: () => (
    <div style={{ padding: 'var(--space-4)', overflowX: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `auto repeat(${TEXT_TONES.length}, auto)`,
          gap: 'var(--space-2) var(--space-3)',
          alignItems: 'baseline',
        }}
      >
        <span />
        {TEXT_TONES.map((tone) => (
          <Text key={tone} role="caption" tone="muted">
            {String(tone)}
          </Text>
        ))}
        {TEXT_ROLES.map((role) => (
          <div key={role} style={{ display: 'contents' }}>
            <Text role="caption" tone="muted">
              {role}
            </Text>
            {TEXT_TONES.map((tone) => (
              <Text key={tone} role={role} tone={tone} style={ground(tone)}>
                {SAMPLE[role]}
              </Text>
            ))}
          </div>
        ))}
      </div>
    </div>
  ),
};

/** The `math` role around MathML in running text: the formula takes `--font-math`, not the
 *  browser's own math face, and sits on the paragraph's baseline. */
export const MathInText: Story = {
  name: 'Math in running text',
  render: () => (
    <div style={{ maxWidth: 520, padding: 'var(--space-4)' }}>
      <Text as="p" role="body" tone="primary">
        The <Text tone="accent">n</Text>th harmonic of a string sounds at{' '}
        <Text role="math" size="inherit" data-testid="harmonic" dangerouslySetInnerHTML={{ __html: HARMONIC }} />, and the
        reciprocal squares sum to <Text role="math" size="inherit" dangerouslySetInnerHTML={{ __html: BASEL }} />.
      </Text>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const math = canvasElement.querySelector('[data-testid="harmonic"] math');
    await expect(math).not.toBeNull();
    await expect(getComputedStyle(math!).fontFamily).toContain('Math');
  },
};
