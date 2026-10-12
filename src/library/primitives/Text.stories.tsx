import type { Meta, StoryObj } from '@storybook/react-vite';
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
};

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
      <Text role={role} tone={tone === 'inherit' ? undefined : tone} truncate={truncate} tabular={tabular} as="p">
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
              <Text key={tone} role={role} tone={tone}>
                {SAMPLE[role]}
              </Text>
            ))}
          </div>
        ))}
      </div>
    </div>
  ),
};
