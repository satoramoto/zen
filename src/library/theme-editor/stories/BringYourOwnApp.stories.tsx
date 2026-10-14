import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button, LineSlider, Segmented, Select, StatusDot, Toggle } from '../../components/core';
import { Group, Region } from '../../layout';
import { Stack, Surface, Text } from '../../primitives';
import { useSystemMode, type ModeChoice } from '../../theme';
import { packs } from '../../themes/packs';
import { SkinProvider } from '../SkinScope';
import { ThemeSettings } from '../ThemeSettings';
import { resolveSkin, skinFromPack } from '../skin';

/**
 * A sample app wearing a skin. It is built only from zen's components and contract variables,
 * knows nothing about themes, and is wrapped in a `SkinProvider`; its settings column is the one
 * component an app adds (`ThemeSettings`). Pick a pack or edit a colour and the whole app, the
 * settings included, re-skins as you go.
 */
function SampleApp() {
  const [view, setView] = useState(0);
  const [session, setSession] = useState(1);
  const [level, setLevel] = useState(72);
  const [send, setSend] = useState(30);
  const [loop, setLoop] = useState(true);
  const [sync, setSync] = useState(false);
  const [quantize, setQuantize] = useState(2);
  const [playing, setPlaying] = useState(false);
  const sessions = ['Morning sketch', 'Drum bus', 'Vocal comp', 'Final mix'];
  return (
    <Stack gap={4} style={{ minWidth: 0 }}>
      <Stack direction="row" align="center" justify="between" gap={3} wrap>
        <Text role="heading" truncate>
          Field recorder
        </Text>
        <Segmented label="View" items={['Session', 'Arrange', 'Mixer']} index={view} onChange={setView} />
      </Stack>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 'var(--space-4)' }}>
        <Region name="Sessions" fit="content">
          <Group name="Recent" direction="column" gap={1}>
            {sessions.map((s, i) => (
              <Button key={s} label={s} size="band" variant="quiet" chosen={i === session} onPress={() => setSession(i)} />
            ))}
          </Group>
        </Region>
        <Region name={sessions[session]} fit="content" aside={<StatusDot hue={playing ? 'ok' : 't'} glow={playing} name={playing ? 'Playing' : 'Stopped'} />}>
          <Group name="Transport" align="center">
            <Button label={playing ? 'Stop' : 'Play'} variant="primary" bar={playing} onPress={() => setPlaying((p) => !p)} />
            <Button label="Record" hue="rec" />
            <Button label="Loop" on={loop} pressed={loop} onPress={() => setLoop((l) => !l)} />
          </Group>
          <Group name="Levels" direction="column" gap={2}>
            <LineSlider name="Level" value={level} unit="%" onchange={setLevel} />
            <LineSlider name="Send" value={send} unit="%" onchange={setSend} />
          </Group>
          <Group name="Options" align="center" wrap>
            <Toggle label="Sync" on={sync} onChange={setSync}>
              Sync
            </Toggle>
            <Select name="Quantize" label="Quantize" items={['Off', '1/4', '1/8', '1/16']} index={quantize} onChange={setQuantize} />
          </Group>
          <Group name="Parts" align="center" wrap gap={2}>
            {([1, 2, 3, 4] as const).map((h) => (
              <Button key={h} label={`Part ${h}`} hue={h} />
            ))}
          </Group>
          <Text role="caption" tone="muted">
            {playing ? 'Recording to disk · 48 kHz' : 'Ready · 48 kHz · 3 h 12 min free'}
          </Text>
        </Region>
      </div>
    </Stack>
  );
}

const PAGE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
  gap: 'var(--space-6)',
  alignItems: 'start',
  padding: 'var(--space-5)',
  minHeight: '100vh',
};

/** The base pack's stand-in desktop behind a translucent ground, in the toolbar's mode (it sits
 *  outside the app's scope), as the toolbar decorator draws it. */
function Desktop({ base, mode, children }: { base: string; mode: ModeChoice; children: ReactNode }) {
  const system = useSystemMode();
  const desktop = resolveSkin(skinFromPack(base)).pack.desktop?.[mode === 'system' ? system : mode];
  return <div style={desktop ? { background: desktop } : undefined}>{children}</div>;
}

function Page({ globals }: { globals: Record<string, unknown> }) {
  const base = packOr(globals.theme);
  const mode = (globals.mode as ModeChoice | undefined) ?? 'system';
  return (
    <Desktop base={base} mode={mode}>
      <SkinProvider key={`${base} ${mode}`} defaultSkin={base} defaultMode={mode} bleed>
        <div style={PAGE}>
          <SampleApp />
          <Surface layer="base" style={{ padding: 'var(--space-4)', minWidth: 0 }}>
            <Stack gap={3}>
              <Text role="label" tone="muted">
                Settings
              </Text>
              <ThemeSettings />
            </Stack>
          </Surface>
        </div>
      </SkinProvider>
    </Desktop>
  );
}

const packOr = (id: unknown) => (typeof id === 'string' && packs.some((p) => p.id === id) ? id : packs[0].id);

const meta: Meta = {
  title: 'Design OS/Theme Editor/Bring your own app',
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => <Page globals={globals} />,
};
export default meta;
type Story = StoryObj;

/** The toolbar's pack to start; then pick and edit in the settings column. Choosing Linear re-skins the app. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('choose Linear', async () => {
      const linear = canvas.getByRole('radio', { name: /Linear/ });
      await userEvent.click(linear);
      await waitFor(() => expect(linear).toHaveAttribute('aria-checked', 'true'));
    });
  },
};

/** Starting from the glass pack, whose layers draw the shader material where WebGL2 allows. */
export const GlassPack: Story = { name: 'Glass pack', globals: { theme: 'visuals' } };

/** A phone-width window: the settings stack under the app. */
export const Narrow: Story = {
  render: (_args, { globals }) => (
    <div style={{ inlineSize: 360, maxInlineSize: '100%' }}>
      <Page globals={globals} />
    </div>
  ),
};
