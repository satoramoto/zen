import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { Mode } from '../../contract';
import { useSystemMode, type ModeChoice } from '../../theme';
import { packs } from '../../themes/packs';
import { palettes } from '../../themes/palettes';
import { MIXFLOW_DEFAULT_THEME, mixflowColor, mixflowDeckTones } from '../../themes/mixflow-reference';
import { SkinScope } from '../SkinScope';
import { FACET_LISTS, FACET_NAMES, resolveSkin, serializeSkin, skinFromPack, swapFacet, type Skin } from '../skin';
import { ThemeEditor } from './ThemeEditor';

const packOr = (id: unknown) => (typeof id === 'string' && packs.some((p) => p.id === id) ? id : packs[0].id);
function startingSkin(globals: Record<string, unknown>) {
  let skin = skinFromPack(packOr(globals.theme));
  for (const facet of FACET_NAMES) {
    const id = globals[facet];
    if (typeof id === 'string' && FACET_LISTS[facet].some((f) => f.id === id)) skin = swapFacet(skin, facet, id);
  }
  return skin;
}

/**
 * The editor as an app holds it: the skin in state, worn by the `SkinScope` around the editor, so
 * every edit re-skins the editor itself. The toolbar's theme picks the starting pack and its mode
 * the starting palette mode; the editor's own Light/Dark switch then changes both what is edited
 * and what is worn.
 */
function Host({ globals, width, inspect = false }: { globals: Record<string, unknown>; width?: number; inspect?: boolean }) {
  const system = useSystemMode();
  const choice = (globals.mode as ModeChoice | undefined) ?? 'system';
  const [skin, setSkin] = useState<Skin>(() => startingSkin(globals));
  const [mode, setMode] = useState<Mode>(choice === 'system' ? system : choice);
  useEffect(() => setSkin(startingSkin(globals)), [globals.theme, globals.palette, globals.faces, globals.scale, globals.materials]);
  useEffect(() => setMode(choice === 'system' ? system : choice), [choice, system]);
  // A translucent ground needs something behind it: the pack's stand-in desktop.
  const desktop = resolveSkin(skin).pack.desktop?.[mode];
  return (
    <div style={{ background: desktop, minHeight: '100vh' }}>
      <SkinScope skin={skin} mode={mode}>
        <div style={width ? { inlineSize: width, maxInlineSize: '100%' } : undefined}>
          <ThemeEditor skin={skin} onChange={setSkin} mode={mode} onModeChange={setMode} />
          {inspect && <details><summary>Edited skin JSON</summary><pre data-testid="edited-skin-json">{serializeSkin(skin)}</pre></details>}
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

/** The same editor, including every instrument swatch. Looking at a source HSL value never
 * quantizes it; changing a value can use the native picker's ordinary hex format. */
export const InstrumentSwatches: Story = {
  globals: { theme: 'mixflow', mode: 'dark' },
  render: (_args, { globals }) => <Host globals={globals} inspect />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const skin = () => JSON.parse(canvas.getByTestId('edited-skin-json').textContent!) as Skin;
    const row = (name: string) => within(canvas.getByRole('group', { name }));
    const source = mixflowColor(MIXFLOW_DEFAULT_THEME.colors.drums);
    const deckB = mixflowColor(mixflowDeckTones(MIXFLOW_DEFAULT_THEME)[1]);
    await step('reading source HSL preserves exact paint and creates no overrides', async () => {
      await expect(row('Source 1').getByText(source)).toBeVisible();
      await expect(row('Deck B').getByText(deckB)).toBeVisible();
      await expect(skin().overrides).toBeUndefined();
      canvas.getByRole('slider', { name: 'Source 1 hue' }).focus();
      await userEvent.keyboard('{PageUp}');
      await waitFor(() => expect(skin().overrides?.palette?.dark?.instrument?.sources?.[0]).toMatch(HEX));
      await expect(row('Deck B').getByText(deckB)).toBeVisible();
      await expect(skin().overrides?.palette?.dark?.instrument?.decks).toBeUndefined();
      await userEvent.click(row('Source 1').getByRole('button', { name: 'Reset Source 1' }));
      await waitFor(() => expect(row('Source 1').getByText(source)).toBeVisible());
      await expect(skin().overrides).toBeUndefined();
    });
    await step('every instrument swatch can be changed in the existing palette panel', async () => {
      const names = [
        'Source 1', 'Source 2', 'Source 3', 'Source 4', 'Source 5', 'Source 6',
        'Deck A', 'Deck B', 'Deck C', 'Deck D', 'Low frequencies', 'Mid frequencies', 'High frequencies',
        'Waveform neutral', 'Signal', 'Positive signal', 'Negative signal', 'Information', 'Preview', 'Idle',
        'Instrument focus', 'Highlight', 'Quiet border', 'Control border', 'Rail', 'Chosen surface',
        'Control surface', 'Statistics', 'Cell', 'Muted cell', 'Sunken', 'Band', 'Lane heading', 'Outside area', 'Manual',
      ];
      for (const name of names) {
        const field = row(name);
        const before = field.getByLabelText(`${name} colour`) as HTMLInputElement;
        const value = before.value;
        field.getByRole('slider', { name: `${name} lightness` }).focus();
        await userEvent.keyboard('{PageDown}');
        await waitFor(() => expect((row(name).getByLabelText(`${name} colour`) as HTMLInputElement).value).not.toBe(value));
        await expect(row(name).getByRole('button', { name: `Reset ${name}` })).toBeVisible();
      }
    });
  },
};

/** Real edits, four legacy facet swaps, a normal JSON export/import and a per-colour reset.
 * Optional roles are validated and merged against the selected facets' own virtual defaults. */
export const InstrumentSkinRoundTrip: Story = {
  globals: { theme: 'mixflow', mode: 'dark' },
  render: (_args, { globals }) => <Host globals={globals} inspect />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const text = () => canvas.getByTestId('edited-skin-json').textContent!;
    const skin = () => JSON.parse(text()) as Skin;
    const tab = async (name: string) => userEvent.click(canvas.getByRole('tab', { name: new RegExp(`^${name}(, changed)?$`) }));
    const choose = async (label: string, name: string) => {
      await userEvent.click(canvas.getByRole('combobox', { name: label }));
      await userEvent.click(await canvas.findByRole('option', { name }));
    };
    let source = '', saved = '';
    await step('edit optional colour, finish, font axes and text metrics', async () => {
      canvas.getByRole('slider', { name: 'Source 1 hue' }).focus();
      await userEvent.keyboard('{PageUp}');
      source = skin().overrides!.palette!.dark!.instrument!.sources![0]!;
      await tab('Materials');
      canvas.getByRole('slider', { name: 'Waveform colour strength' }).focus();
      await userEvent.keyboard('{PageDown}');
      await choose('Materials from', 'Linear (6px, layered)');
      await tab('Type');
      const axes = canvas.getByRole('textbox', { name: 'sans variation axes' });
      await userEvent.clear(axes);
      await userEvent.type(axes, "'MONO' 0, 'CASL' 0.5");
      await choose('Type from', 'Linear (Inter)');
      await tab('Scale');
      canvas.getByRole('slider', { name: 'Control text size' }).focus();
      await userEvent.keyboard('{ArrowUp}');
      await choose('Scale from', 'Regular (5px)');
      await tab('Palette');
      await choose('Palette from', 'Linear');
      await expect(skin().facets).toEqual({ faces: 'linear', materials: 'linear', palette: 'linear', scale: 'regular' });
      await expect(skin().overrides?.palette?.dark?.instrument?.sources?.[0]).toBe(source);
      await expect(skin().overrides?.materials?.instrument?.waveformStrength).toBe('55%');
      await expect(skin().overrides?.faces?.variation?.sans).toBe("'MONO' 0, 'CASL' 0.5");
      await expect(skin().overrides?.scale?.controlText).toBe(11);
      saved = text();
    });
    await step('reset, import the edited JSON, and keep every optional override', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /^Reset to / }));
      await expect(skin().overrides).toBeUndefined();
      await userEvent.click(canvas.getByRole('button', { name: 'Paste JSON' }));
      await userEvent.click(canvas.getByRole('textbox', { name: 'Skin JSON to import' }));
      await userEvent.paste(saved);
      await userEvent.click(canvas.getByRole('button', { name: 'Import pasted JSON' }));
      await waitFor(() => expect(canvas.getByText(/^Imported .* from JSON\.$/)).toBeVisible());
      await expect(text()).toBe(saved);
      await tab('Materials');
      await expect(canvas.getByRole('slider', { name: 'Waveform colour strength' })).toHaveAttribute('aria-valuenow', '55');
      await tab('Palette');
      const row = within(canvas.getByRole('group', { name: 'Source 1' }));
      await expect((row.getByLabelText('Source 1 colour') as HTMLInputElement).value).toBe(source);
      await userEvent.click(row.getByRole('button', { name: 'Reset Source 1' }));
      const inherited = palettes.find((p) => p.id === 'linear')!.dark.hues[0];
      await waitFor(() => expect((within(canvas.getByRole('group', { name: 'Source 1' })).getByLabelText('Source 1 colour') as HTMLInputElement).value).toBe(inherited));
      await expect(skin().overrides?.palette).toBeUndefined();
    });
  },
};
