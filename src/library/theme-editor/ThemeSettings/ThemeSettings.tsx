import { useState } from 'react';
import { Segmented } from '../../components/core';
import { Group } from '../../layout';
import { Stack, Text } from '../../primitives';
import { useSystemMode, type ModeChoice } from '../../theme';
import { ThemeEditor } from '../ThemeEditor';
import { ThemePicker } from '../ThemePicker';
import { isCustom } from '../skin';
import { useSkin } from '../SkinScope';
import './ThemeSettings.css';

const MODES: ModeChoice[] = ['system', 'light', 'dark'];

/**
 * The whole theme section of an app's settings, in one component: light/dark, the picker of every
 * pack, and the editor for the current skin (shown on demand, or at once when the skin is already
 * custom). Reads and changes the nearest `SkinProvider`; renders nothing outside one.
 */
export function ThemeSettings({ className }: { className?: string }) {
  const ctx = useSkin();
  const system = useSystemMode();
  const [editing, setEditing] = useState(() => (ctx ? isCustom(ctx.skin) : false));
  if (!ctx) return null;
  const { skin, setSkin, mode, setMode } = ctx;
  const worn = mode === 'system' ? system : mode;
  return (
    <Stack gap={5} className={['zen-theme-settings', className].filter(Boolean).join(' ')}>
      <Group name="Appearance" align="center">
        <Segmented
          label="Appearance"
          items={['System', 'Light', 'Dark']}
          index={MODES.indexOf(mode)}
          onChange={(i) => setMode(MODES[i])}
        />
      </Group>
      <Group name="Theme" direction="column" gap={3}>
        <ThemePicker value={skin} onChange={setSkin} mode={worn} />
      </Group>
      <Group
        name="Customise"
        direction="column"
        gap={3}
        aside={
          <Segmented label="Customise" items={['Hide', 'Edit']} index={editing ? 1 : 0} onChange={(i) => setEditing(i === 1)} />
        }
      >
        {editing ? (
          <ThemeEditor skin={skin} onChange={setSkin} mode={worn} onModeChange={(m) => setMode(m)} />
        ) : (
          <Text role="caption" tone="muted">
            Change colours, type, scale and materials over the chosen theme, then export it as JSON to wear in any zen app.
          </Text>
        )}
      </Group>
    </Stack>
  );
}
