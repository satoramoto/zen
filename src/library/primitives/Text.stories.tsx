import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { withLibraryTheme } from '../storybook';
import { Text, TEXT_ROLES, TEXT_TONES, type TextRole, type TextTone } from './Text';

const SAMPLE: Record<TextRole, string> = {
  display: 'Stage',
  numeral: '128.0',
  heading: 'Sections',
  body: 'Intro A',
  label: 'Tempo',
  caption: 'Bar 12',
  code: 'C#m7 / 0:42',
  math: 'fₙ = n·f₁',
};

/** `on-solid` is ink for a solid action fill, so it is shown on `--action`; every other tone on the page. */
const ground = (tone: TextTone | 'inherit'): CSSProperties =>
  tone === 'on-solid'
    ? { background: 'var(--action)', borderRadius: 'var(--radius-control)', padding: 'var(--space-1) var(--space-2)' }
    : {};

interface TextArgs {
  role: TextRole;
  tone: TextTone | 'inherit';
  truncate: boolean;
  tabular: boolean;
  text: string;
  width: number;
}

const meta: Meta<TextArgs> = {
  title: 'Design OS/Primitives/Text',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { role: 'heading', tone: 'primary', truncate: false, tabular: false, text: 'Main B into Fill A, then the ending', width: 360 },
  argTypes: {
    role: { control: 'select', options: TEXT_ROLES },
    tone: { control: 'select', options: ['inherit', ...TEXT_TONES] },
    truncate: { control: 'boolean' },
    tabular: { control: 'boolean' },
    text: { control: 'text' },
    width: { control: { type: 'range', min: 80, max: 900, step: 10 } },
  },
  render: ({ role, tone, truncate, tabular, text, width }) => (
    <div style={{ width, padding: 'var(--space-4)' }}>
      <Text
        role={role}
        tone={tone === 'inherit' ? undefined : tone}
        truncate={truncate}
        tabular={tabular}
        as="p"
        style={ground(tone)}
      >
        {text}
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

// React's JSX types have no MathML elements, so the specimens are markup.
const HARMONIC = '<math><msub><mi>f</mi><mi>n</mi></msub><mo>=</mo><mi>n</mi><msub><mi>f</mi><mn>1</mn></msub></math>';
const BASEL = '<math><mfrac><msup><mi>π</mi><mn>2</mn></msup><mn>6</mn></mfrac></math>';
