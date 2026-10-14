import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { EveryPack, withLibraryTheme } from '../storybook';
import type { ModeChoice } from '../theme';
import { packs } from '../themes/packs';
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

/**
 * The focus ring in every pack: `--focus-ring` and `--focus-ring-offset`, from the materials'
 * `focus` setting. The accent just outside the edge by default; in visuals the controls' ink
 * (`--text-2`) on the edge, as visuals' own `--vs-focus-ring` drew it. Tab through to see each.
 */
export const FocusInEveryPack: Story = {
  name: 'Focus in every pack',
  render: (_args, { globals }) => (
    <EveryPack mode={globals.mode as ModeChoice}>
      <Surface
        as="button"
        material="key"
        className={focusRing}
        style={{ height: 'var(--control-h)', padding: '0 var(--space-3)', border: 0, cursor: 'pointer' }}
      >
        <Text role="label">Focus me</Text>
      </Surface>
    </EveryPack>
  ),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button', { name: 'Focus me' });
    await expect(buttons).toHaveLength(packs.length);
    for (const [i, pack] of packs.entries()) {
      await userEvent.tab();
      const style = getComputedStyle(buttons[i]);
      await expect(buttons[i]).toHaveFocus();
      await expect(style.outlineStyle).toBe('solid');
      await expect(style.outlineOffset).toBe(pack.facets.materials.focus?.offset ?? '2px');
    }
  },
};
