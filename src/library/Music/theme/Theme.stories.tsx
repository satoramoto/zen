import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { Mode } from '../../contract';
import { withLibraryTheme } from '../../storybook';
import { useSystemMode, type ModeChoice } from '../../theme';
import { SkinScope } from '../../theme-editor/SkinScope';
import { FACET_LISTS, FACET_NAMES, resolveSkin, serializeSkin, skinFromPack, swapFacet, type Skin } from '../../theme-editor/skin';
import { ThemeEditor } from '../../theme-editor/ThemeEditor/ThemeEditor';
import { InstrumentSwatches, InstrumentSkinRoundTrip } from '../../theme-editor/ThemeEditor/ThemeEditor.stories';
import { packs } from '../../themes/packs';
import { Knob } from '../controls/Knob';
import { Slider } from '../controls/Slider';
import { NumberField } from '../controls/NumberField';
import { Toggle } from '../controls/Toggle';
import { Waveform } from '../music/Waveform';
import { Meter } from '../music/Meter';
import { waveformPeaks, waveformSpectrum } from '../music/Waveform.fixtures';
import type { Param } from '../param/param';
import '../base.css';
import './Theme.story.css';

const level: Param = { kind: 'float', min: 0, max: 100, defaultValue: 65, unit: 'percent' };
const packId = (value: unknown) => typeof value === 'string' && packs.some((p) => p.id === value) ? value : packs[0].id;
function startingSkin(globals: Record<string, unknown>) {
  let skin = skinFromPack(packId(globals.theme));
  for (const facet of FACET_NAMES) {
    const id = globals[facet];
    if (typeof id === 'string' && FACET_LISTS[facet].some((f) => f.id === id)) skin = swapFacet(skin, facet, id);
  }
  return skin;
}

/** An app-owned, controlled skin, edited by Zen's existing editor. No playback clock, remount
 * keys, ThemeRoot or forced inner pack: toolbar changes and every editor facet stay in charge. */
function ThemeHost({ globals }: { globals: Record<string, unknown> }) {
  const system = useSystemMode(), choice = (globals.mode as ModeChoice | undefined) ?? 'system';
  const [skin, setSkin] = useState<Skin>(() => startingSkin(globals));
  const [mode, setMode] = useState<Mode>(choice === 'system' ? system : choice);
  const [sourceLevel, setSourceLevel] = useState(65), [deckLevel, setDeckLevel] = useState(65);
  const [held, setHeld] = useState(false);
  useEffect(() => setSkin(startingSkin(globals)), [globals.theme, globals.palette, globals.faces, globals.scale, globals.materials]);
  useEffect(() => setMode(choice === 'system' ? system : choice), [choice, system]);
  const desktop = resolveSkin(skin).pack.desktop?.[mode];
  return <div style={{ background: desktop }}>
    <SkinScope skin={skin} mode={mode}>
      <div className="music-theme-story">
        <div className="music-theme-story__editor">
          <ThemeEditor skin={skin} onChange={setSkin} mode={mode} onModeChange={setMode} />
          <details><summary>Edited skin JSON</summary><pre className="music-theme-story__json" data-testid="edited-skin-json">{serializeSkin(skin)}</pre></details>
        </div>
        <section className="zen-music wdg music-theme-story__preview" aria-label="Paused Music specimen">
          <p>Paused measured data — edit a source, deck or spectral swatch. The same canvases repaint; no clock or remount is involved.</p>
          <div className="music-theme-story__controls">
            <Knob param={level} value={sourceLevel} onChange={setSourceLevel} name="Source 1" label="Source monitor" ink="var(--stem-drums)" />
            <Knob param={level} value={deckLevel} onChange={setDeckLevel} name="Deck B" label="Deck monitor" ink="var(--deck-b)" />
            <Toggle on={held} onChange={setHeld} name="Face" label="Material face">Hold</Toggle>
            <Slider param={level} value={deckLevel} onChange={setDeckLevel} name="Handle" label="Material handle" length={76} />
            <NumberField param={level} value={sourceLevel} onChange={setSourceLevel} name="Screen" label="Material readout" showFill={false} />
            <Meter value={sourceLevel / 100} name="Well" label="Material well" length={80} />
          </div>
          <div className="music-theme-story__wave"><span>Source 1 paint</span><Waveform peaks={waveformPeaks} ink="var(--stem-drums)" height={64} label="Paused source waveform" /></div>
          <div className="music-theme-story__wave"><span>Deck B paint</span><Waveform peaks={waveformPeaks} ink="var(--deck-b-waveform)" height={64} label="Paused deck waveform" /></div>
          <div className="music-theme-story__wave"><span>Low / mid / high spectral paint</span><Waveform peaks={waveformPeaks} spectrum={waveformSpectrum} ink="var(--instrument-waveform-base)" height={64} label="Paused spectral waveform" /></div>
        </section>
      </div>
    </SkinScope>
  </div>;
}

const meta = {
  id: 'music-theme',
  title: 'Music/Themes/Theme editor', decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Existing Zen ThemeEditor, live Music controls and paused measured waveforms, all wearing one controlled Zen skin. The toolbar chooses the starting pack and facets; edits and legacy facet swaps use normal skin JSON, not an alternate Music theme root. React-only editor harness; Music renderers share the same canvas stores.' } } },
  render: (_args, { globals }) => <ThemeHost globals={globals} />,
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const LiveEditor: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const read = (name: string) => canvas.getByRole('img', { name }) as HTMLCanvasElement;
    const source = read('Paused source waveform'), deck = read('Paused deck waveform'), spectral = read('Paused spectral waveform');
    const stable = () => {
      expect(read('Paused source waveform')).toBe(source);
      expect(read('Paused deck waveform')).toBe(deck);
      expect(read('Paused spectral waveform')).toBe(spectral);
    };
    const text = () => canvas.getByTestId('edited-skin-json').textContent!;
    const choose = async (label: string, name: string) => {
      await userEvent.click(canvas.getByRole('combobox', { name: label }));
      await userEvent.click(await canvas.findByRole('option', { name }));
    };
    await waitFor(() => expect(source.width > 0 && deck.width > 0 && spectral.width > 0).toBe(true));
    let saved = '';
    const images = new Map<HTMLCanvasElement, string>();
    await step('source, deck and spectral edits repaint paused canvases without remounting', async () => {
      for (const [name, node] of [['Source 1', source], ['Deck B', deck], ['Low frequencies', spectral]] as const) {
        const before = node.toDataURL();
        canvas.getByRole('slider', { name: `${name} hue` }).focus();
        await userEvent.keyboard('{PageUp}');
        await waitFor(() => expect(node.toDataURL()).not.toBe(before));
        stable();
      }
      const monitor = canvas.getByRole('slider', { name: 'Source monitor' });
      monitor.focus();
      await userEvent.keyboard('{ArrowUp}');
      await expect(monitor).toHaveAttribute('aria-valuenow', '66');
    });
    await step('instrument density edits resize the actual control without shrinking general app controls', async () => {
      const specimen = canvas.getByRole('region', { name: 'Paused Music specimen' });
      const monitor = within(specimen).getByRole('slider', { name: 'Source monitor' });
      const before = monitor.getBoundingClientRect().width;
      const generalHeight = getComputedStyle(specimen).getPropertyValue('--control-h');
      await userEvent.click(canvas.getByRole('tab', { name: /^Scale(, changed)?$/ }));
      canvas.getByRole('slider', { name: 'Instrument control height' }).focus();
      await userEvent.keyboard('{ArrowUp}');
      await waitFor(() => expect(monitor.getBoundingClientRect().width).toBeGreaterThan(before));
      await expect(getComputedStyle(specimen).getPropertyValue('--control-h')).toBe(generalHeight);
      await expect(JSON.parse(text()).overrides.scale.instrument.control).toBe(23);
      stable();
    });
    await step('wear legacy facets while keeping instrument edits and finish overrides', async () => {
      await userEvent.click(canvas.getByRole('tab', { name: /^Palette(, changed)?$/ }));
      await choose('Palette from', 'Linear');
      await userEvent.click(canvas.getByRole('tab', { name: /^Materials(, changed)?$/ }));
      canvas.getByRole('slider', { name: 'Waveform colour strength' }).focus();
      await userEvent.keyboard('{PageDown}');
      await choose('Materials from', 'Linear (6px, layered)');
      await expect(JSON.parse(text()).facets).toMatchObject({ palette: 'linear', materials: 'linear' });
      await expect(JSON.parse(text()).overrides.materials.instrument.waveformStrength).toBe('55%');
      await waitFor(() => expect(deck.toDataURL()).not.toBe(source.toDataURL()));
      stable();
      for (const node of [source, deck, spectral]) images.set(node, node.toDataURL());
      saved = text();
    });
    await step('round-trip normal skin JSON and restore the same paused paint on the same nodes', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /^Reset to / }));
      await userEvent.click(canvas.getByRole('button', { name: 'Paste JSON' }));
      await userEvent.click(canvas.getByRole('textbox', { name: 'Skin JSON to import' }));
      await userEvent.paste(saved);
      await userEvent.click(canvas.getByRole('button', { name: 'Import pasted JSON' }));
      await waitFor(() => expect(canvas.getByText(/^Imported .* from JSON\.$/)).toBeVisible());
      await expect(text()).toBe(saved);
      for (const [node, image] of images) await waitFor(() => expect(node.toDataURL()).toBe(image));
      stable();
    });
  },
};

/** Music/* discovery includes the existing editor's complete swatch and legacy-swap plays. */
export const AllInstrumentSwatches: Story = { ...InstrumentSwatches, render: meta.render };
export const LegacyFacetRoundTrip: Story = { ...InstrumentSkinRoundTrip, render: meta.render };

/** Every material role changes real paint, not only the corner radius. Source geometry stays
 * fixed while Hardware and Frost provide fills, textures, shadows and pressed treatment. */
export const MaterialFacetPaint: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const specimen = within(canvas.getByRole('region', { name: 'Paused Music specimen' }));
    const face = specimen.getByRole('button', { name: 'Material face' });
    const well = specimen.getByRole('meter', { name: 'Material well' });
    const screen = specimen.getByRole('slider', { name: 'Material readout' });
    const track = specimen.getByRole('slider', { name: 'Material handle' });
    const handle = track.querySelector<HTMLElement>('.wdg-slider-thumb')!;
    const parts = [face, well, screen, handle];
    const paint = (node: HTMLElement) => {
      const css = getComputedStyle(node);
      return `${css.backgroundColor}|${css.backgroundImage}|${css.boxShadow}`;
    };
    await canvasElement.ownerDocument.fonts.ready;
    const original = parts.map(paint);
    const boxes = parts.map((node) => { const { width, height } = node.getBoundingClientRect(); return { width, height }; });
    const choose = async (name: string) => {
      await userEvent.click(canvas.getByRole('combobox', { name: 'Materials from' }));
      await userEvent.click(await canvas.findByRole('option', { name }));
    };
    let hardware: string[] = [];
    await userEvent.click(canvas.getByRole('tab', { name: /^Materials(, changed)?$/ }));
    await step('Hardware dresses faces, wells, screens and handles without changing geometry', async () => {
      await choose('Hardware (bevelled caps, inset wells, LCD)');
      await waitFor(() => {
        hardware = parts.map(paint);
        for (let i = 0; i < parts.length; i++) expect(hardware[i]).not.toBe(original[i]);
      });
      await expect(getComputedStyle(face).backgroundImage).toContain('linear-gradient');
      await expect(getComputedStyle(well).backgroundImage).toContain('linear-gradient');
      await expect(getComputedStyle(screen).backgroundImage).toContain('radial-gradient');
      await expect(getComputedStyle(handle).backgroundImage).toContain('repeating-linear-gradient');
      await expect(getComputedStyle(handle).boxShadow).not.toBe('none');
      for (let i = 0; i < parts.length; i++) {
        const { width, height } = parts[i].getBoundingClientRect();
        await expect({ width, height }).toEqual(boxes[i]);
      }
      const resting = getComputedStyle(face).boxShadow;
      await userEvent.click(face);
      await expect(face).toHaveAttribute('aria-pressed', 'true');
      await expect(getComputedStyle(face).boxShadow).not.toBe(resting);
    });
    await step('Frost supplies a different material finish for every part', async () => {
      await choose('Frost (visual[flow] glass)');
      await waitFor(() => { for (let i = 0; i < parts.length; i++) expect(paint(parts[i])).not.toBe(hardware[i]); });
      await expect(getComputedStyle(handle).backgroundImage).not.toContain('repeating-linear-gradient');
      await expect(getComputedStyle(handle).boxShadow).not.toBe('none');
      await expect(specimen.getByRole('button', { name: 'Material face' })).toBe(face);
      await expect(specimen.getByRole('meter', { name: 'Material well' })).toBe(well);
    });
  },
};
