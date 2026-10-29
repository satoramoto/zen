import type { Scheme } from '../../contract';
import { mixflowInstrument } from '../../themes/palettes';
import {
  MIXFLOW_DARK_SURFACES, MIXFLOW_DEFAULT_SPECTRAL, MIXFLOW_ROLES, mixflowColor, mixflowOnPrimary,
  type MixflowReferenceTheme,
} from '../../themes/mixflow-reference';
import { SKIN_FORMAT, SKIN_VERSION, normalizeSkin, validateSkin, type Skin } from '../../theme-editor/skin';
import { isSpectralStyle, type SpectralStyle } from './spectral';

type Obj = Record<string, unknown>;
const object = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const within = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

/** Accepts the original complete, finite v1 documents, including documents saved before later
 * surface roles and optional spectral paint existed. Storage/fallback policy stays with the host. */
export function isMixflowTheme(value: unknown): value is MixflowReferenceTheme {
  if (!object(value) || value.version !== 1 || !object(value.colors) || !object(value.surfaces) || !object(value.variation)) return false;
  const { colors, surfaces, variation } = value;
  if (!MIXFLOW_ROLES.every((role) => {
    const t = colors[role];
    return object(t) && within(t.h, 0, 360) && t.h < 360 && within(t.s, 0, 100) && within(t.l, 0, 100)
      && (role !== 'signal' || within(t.h, 120, 160));
  })) return false;
  if (!Object.keys(MIXFLOW_DARK_SURFACES).every((role) => surfaces[role] === undefined || typeof surfaces[role] === 'string' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(surfaces[role]))) return false;
  return within(variation.warmth, -40, 40) && within(variation.saturation, -30, 30)
    && within(variation.lightness, -20, 20) && within(variation.strength, 0, 100)
    && (value.spectral === undefined || isSpectralStyle(value.spectral));
}

export interface MixflowSkinOptions { id?: string; label?: string }
export type MixflowSkinImport =
  | { ok: true; skin: Skin; warnings: string[]; /** Original optional waveform finish for a host's explicit paint override. */ spectral: SpectralStyle }
  | { ok: false; errors: string[] };

/** Converts saved widgets Theme JSON into the existing Zen portable skin format. All six source
 * identities, all four derived deck shades, spectral colours and both strengths survive. The
 * derived shades are concrete colour overrides, not a second theme context or a frozen CSS root. */
export function importMixflowTheme(value: unknown, options: MixflowSkinOptions = {}): MixflowSkinImport {
  if (!isMixflowTheme(value)) return { ok: false, errors: ['Expected a complete widgets v1 theme (finite role tones, variation and optional spectral style).'] };
  const s = { ...MIXFLOW_DARK_SURFACES, ...value.surfaces }, spectral = value.spectral ?? MIXFLOW_DEFAULT_SPECTRAL;
  const instrument = mixflowInstrument(value);
  // Zen colour overrides are deliberately #rrggbb, so importing a translucent colour as solid
  // must never happen silently. The source outside-area tint has its alpha in Music/theme.css.
  const translucent = Object.entries(s).filter(([role, color]) => role !== 'outside' && color.length === 9 && color.slice(7).toLowerCase() !== 'ff');
  if (translucent.length) return { ok: false, errors: [`Zen skin colour roles are solid #rrggbb; translucent saved surfaces need an explicit material: ${translucent.map(([role]) => role).join(', ')}.`] };
  const solid = (color: string) => color.slice(0, 7).toLowerCase();
  const palette: Partial<Scheme> = {
    surface: [s.background, s.panel, s.control, s.selected].map(solid) as unknown as Scheme['surface'],
    text: [s.text, s.ui, s.detail, s.caption].map(solid) as unknown as Scheme['text'],
    border: solid(s.border), borderStrong: solid(s.focus), action: mixflowColor(value.colors.primary),
    actionText: mixflowOnPrimary(value),
    warning: solid(s.caution),
    instrument: {
      ...instrument,
      waveformBase: solid(instrument.waveformBase), positive: solid(instrument.positive), negative: solid(instrument.negative),
      info: solid(instrument.info), preview: solid(instrument.preview), idle: solid(instrument.idle), focus: solid(instrument.focus),
      borderQuiet: solid(instrument.borderQuiet), borderControl: solid(instrument.borderControl),
      surface: Object.fromEntries(Object.entries(instrument.surface).map(([role, color]) => [role, solid(color)])) as unknown as typeof instrument.surface,
    },
  };
  const skin: Skin = normalizeSkin({
    format: SKIN_FORMAT, version: SKIN_VERSION, id: options.id ?? 'mixflow-imported', label: options.label ?? 'mix[flow] (imported)', base: 'mixflow',
    // The source document has one (dark) mode. The new light mode remains the pack's derived one.
    overrides: {
      palette: { dark: palette },
      materials: { instrument: { waveformStrength: `${value.variation.strength}%`, spectralStrength: String(spectral.strength), spectralMode: spectral.mode } },
    },
  });
  const checked = validateSkin(skin);
  if (!checked.ok) return checked;
  const warnings: string[] = [];
  if (s.outside.length === 9 && s.outside.slice(7).toLowerCase() !== 'b3') warnings.push('The outside-area tint uses the reference #b3 alpha (179/255); its saved custom alpha is not represented by a palette colour role.');
  if (spectral.waveform) warnings.push('The optional waveform finish is returned as spectral metadata; the Zen skin carries band colours, mode and strength. Pass the finish through the waveform paint override if needed.');
  return { ok: true, skin: checked.skin, warnings, spectral };
}

/** JSON counterpart. Never reads localStorage or replaces a host's saved skin on a parse failure. */
export function parseMixflowTheme(text: string, options?: MixflowSkinOptions): MixflowSkinImport {
  let value: unknown;
  try { value = JSON.parse(text); }
  catch (error) { return { ok: false, errors: [`Not JSON: ${error instanceof Error ? error.message : String(error)}`] }; }
  return importMixflowTheme(value, options);
}
