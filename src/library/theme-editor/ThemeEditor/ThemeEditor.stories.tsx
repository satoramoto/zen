import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { Mode } from '../../contract';
import { useSystemMode, type ModeChoice } from '../../theme';
import { packs } from '../../themes/packs';
import { SkinScope } from '../SkinScope';
import { resolveSkin, skinFromPack, type Skin } from '../skin';
import { ThemeEditor } from './ThemeEditor';

const packOr = (id: unknown) => (typeof id === 'string' && packs.some((p) => p.id === id) ? id : packs[0].id);

/**
 * The editor as an app holds it: the skin in state, worn by the `SkinScope` around the editor, so
 * every edit re-skins the editor itself. The toolbar's theme picks the starting pack and its mode
 * the starting palette mode; the editor's own Light/Dark switch then changes both what is edited
 * and what is worn.
 */
function Host({ globals, width }: { globals: Record<string, unknown>; width?: number }) {
  const system = useSystemMode();
  const choice = (globals.mode as ModeChoice | undefined) ?? 'system';
  const [skin, setSkin] = useState<Skin>(() => skinFromPack(packOr(globals.theme)));
  const [mode, setMode] = useState<Mode>(choice === 'system' ? system : choice);
  useEffect(() => setSkin(skinFromPack(packOr(globals.theme))), [globals.theme]);
  useEffect(() => setMode(choice === 'system' ? system : choice), [choice, system]);
  // A translucent ground needs something behind it: the pack's stand-in desktop.
  const desktop = resolveSkin(skin).pack.desktop?.[mode];
  return (
    <div style={{ background: desktop, minHeight: '100vh' }}>
      <SkinScope skin={skin} mode={mode}>
        <div style={width ? { inlineSize: width, maxInlineSize: '100%' } : undefined}>
          <ThemeEditor skin={skin} onChange={setSkin} mode={mode} onModeChange={setMode} />
        </div>
      </SkinScope>
    </div>
  );
}

const meta: Meta = {
  title: 'Design OS/Theme Editor/Editor',
  parameters: { layout: 'fullscreen' },
  render: (_args, { globals }) => <Host globals={globals} />,
};
export default meta;
type Story = StoryObj;

const HEX = /^#[0-9a-f]{6}$/;

/** The first pack (or the toolbar's). Changing the accent's hue changes its swatch and hex; Reset puts it back. */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const accent = () => canvas.getByRole('group', { name: 'Accent' });
    const hex = () => within(accent()).getByText(HEX).textContent;
    const swatch = () => within(accent()).getByLabelText('Accent colour') as HTMLInputElement;
    const before = hex();

    await step('turn the accent hue', async () => {
      canvas.getByRole('slider', { name: 'Accent hue' }).focus();
      await userEvent.keyboard('{PageUp}{PageUp}{PageUp}');
      await waitFor(() => expect(hex()).not.toBe(before));
      await expect(swatch().value).toBe(hex());
      await expect(canvas.getByRole('heading')).toHaveTextContent(/custom/);
    });

    await step('reset the accent', async () => {
      await userEvent.click(within(accent()).getByRole('button', { name: 'Reset Accent' }));
      await waitFor(() => expect(hex()).toBe(before));
      await expect(within(accent()).queryByRole('button', { name: 'Reset Accent' })).toBeNull();
    });

    await step('reset the whole skin', async () => {
      canvas.getByRole('slider', { name: 'Accent hue' }).focus();
      await userEvent.keyboard('{PageDown}');
      await waitFor(() => expect(hex()).not.toBe(before));
      await userEvent.click(canvas.getByRole('button', { name: /^Reset to / }));
      await waitFor(() => expect(hex()).toBe(before));
    });
  },
};

/** visual[flow]'s glass pack: its materials draw shaders, so the Shader tab is there. */
export const GlassPackWithShader: Story = {
  name: 'Glass pack with shader',
  globals: { theme: 'visuals' },
};

/** In a 360 px settings panel: labels sit above their controls and the controls wrap. */
export const Narrow: Story = {
  render: (_args, { globals }) => <Host globals={globals} width={360} />,
};
