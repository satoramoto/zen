import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../storybook';
import { focusRing, pressRing } from './Ring';
import { Surface } from './Surface';
import { Text } from './Text';

const meta: Meta = {
  title: 'Design OS/Primitives/Ring',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

function Toggle() {
  const [on, setOn] = useState(false);
  return (
    <Surface
      as="button"
      material="key"
      pressed={on}
      aria-pressed={on}
      className={`${focusRing} ${pressRing}`}
      onClick={() => setOn((v) => !v)}
      style={{ height: 'var(--control-h)', padding: '0 var(--space-3)', border: 0, cursor: 'pointer' }}
    >
      <Text role="label">{on ? 'On' : 'Off'}</Text>
    </Surface>
  );
}

/** Tab to the first button for the focus ring; click the second to toggle its press ring (and hold either for `:active`). */
export const FocusAndPress: Story = {
  name: 'Focus and press',
  render: () => (
    <div style={{ padding: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)' }}>
      <Surface
        as="button"
        material="key"
        className={focusRing}
        style={{ height: 'var(--control-h)', padding: '0 var(--space-3)', border: 0, cursor: 'pointer' }}
      >
        <Text role="label">Focus me</Text>
      </Surface>
      <Toggle />
    </div>
  ),
};
