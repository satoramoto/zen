// The token contract: the only values library components may read.
// A design system is four independent facets, so any palette can be worn with any faces, scale
// and materials. Values live in the facet files under themes/; components reference the CSS
// variables produced by toCssVars().

type Four = readonly [string, string, string, string];
type Two = readonly [string, string];

export type Mode = 'light' | 'dark';

/** One mode's colour roles. Each value keeps the role its source gave it. */
export interface Scheme {
  /** Ground, then three raised levels. */
  surface: Four;
  /** Primary, secondary, muted, faint. */
  text: Four;
  border: string;
  borderStrong: string;
  /** The one filled call to action. */
  action: string;
  actionText: string;
  /** A chosen tab, row or toggle. */
  selected: string;
  selectedText: string;
  /** Focus rings, carets, small highlights. */
  accent: string;
  success: string;
  warning: string;
  danger: string;
  /** Text drawn on a solid success, warning or danger fill. Each meets WCAG AA (4.5:1) against its fill. */
  successText: string;
  warningText: string;
  dangerText: string;
  /** Categorical hues: parts, tags, groups. */
  hues: Four;
  /** Text drawn on a solid hue. */
  onHue: string;
  /**
   * Two role hues, each for one job an app names (Yahaha: role 1 is the current style, role 2 the
   * controls that move time). They are not categorical, never index a list, and stay perceptually
   * clear of the four `hues`, of success, warning and danger, and of each other.
   */
  roles: Two;
  /** Text drawn on a solid role fill; AA against it. */
  roleText: Two;
  /** Lamp bloom radius; 0px for flat palettes. */
  bloom: string;
  /** The instrument extension: a drawn keyboard's white and black keys. White keys are light and
   *  black keys dark in every mode, so the keyboard reads as one. */
  keys: { white: string; black: string };
}

/** Colour, in both modes. A scope follows the system's light/dark preference unless told otherwise. */
export interface Palette {
  id: string;
  label: string;
  light: Scheme;
  dark: Scheme;
}

/** Faces: families, weights, tracking and label case. Sizes live in the scale. */
export interface Faces {
  id: string;
  label: string;
  sans: string;
  display: string;
  mono: string;
  /** Numerals and readouts (tempo, levels). */
  readout: string;
  weightBody: number;
  weightStrong: number;
  weightDisplay: number;
  weightNumeral: number;
  tracking: string;
  trackingDisplay: string;
  labelCase: 'none' | 'uppercase';
}

/** Scale: type sizes, the spacing unit and control height together, so text and controls grow as one. */
export interface Scale {
  id: string;
  label: string;
  /** Base spacing unit in px. */
  unit: number;
  /** Control height in px. */
  control: number;
  /** Type sizes in px. */
  sizes: { caption: number; body: number; label: number; heading: number; display: number; numeral: number };
}

/** One material: what a part is made of. Values are CSS and may read palette variables. */
export interface Material {
  /** A background: a colour, a gradient, or layers of both. */
  fill: string;
  /** A box-shadow: edges, bevels, insets and drop shadows. Never `none` (it is invalid inside the
   *  shadow lists components build); flat is `0 0 0 0 transparent`. */
  shadow: string;
  /** A background layer drawn over the fill: grip lines, ticks, grain. `none` for plain. */
  texture: string;
}

/**
 * Materials: what each part of a control is made of, and its shape. A component's parts declare a
 * role (a fader cap is a `handle`, its groove a `well`); the material set decides how that role
 * looks. Lit parts set `--lit` to their colour and read `--mat-lit-glow`.
 */
export interface Materials {
  id: string;
  label: string;
  radiusControl: string;
  radiusCard: string;
  radiusInput: string;
  radiusPill: string;
  borderWidth: string;
  /** How fields are drawn. */
  input: 'filled' | 'box' | 'underline';
  /** Panels and cards: what a region sits on. */
  plate: Material;
  /** Recessed tracks: fader grooves, knob rings, meter channels. */
  well: Material;
  /** Readout windows: tempo, bar, chord, the display. */
  screen: Material;
  /** Pressable faces: pads, buttons, tabs. `pressed` is the shadow while held or on. */
  key: Material & { pressed: string };
  /** Things you grab: fader caps, knob bodies. */
  handle: Material;
  /** Lit indicators. `glow` is a box-shadow that reads `var(--lit)`. */
  lit: { glow: string };
}

export interface Facets {
  palette: Palette;
  faces: Faces;
  scale: Scale;
  materials: Materials;
}

const SPACE_STEPS = [1, 2, 3, 4, 6, 8] as const;
const MATERIAL_ROLES = ['plate', 'well', 'screen', 'key', 'handle'] as const;

export function toCssVars({ palette, faces: t, scale: s, materials: m }: Facets, mode: Mode): Record<string, string> {
  const p = palette[mode];
  const vars: Record<string, string> = {
    '--scheme': mode,
    // The mode as a number CSS can compute with: 1 in light, 0 in dark. Multiply it in calc() to
    // switch a value by mode (never light-dark(): the build rewrites it into variables only a
    // literal color-scheme sets).
    '--scheme-light': mode === 'light' ? '1' : '0',
    '--border': p.border,
    '--border-strong': p.borderStrong,
    '--action': p.action,
    '--action-text': p.actionText,
    '--selected': p.selected,
    '--selected-text': p.selectedText,
    '--accent': p.accent,
    '--success': p.success,
    '--warning': p.warning,
    '--danger': p.danger,
    '--success-text': p.successText,
    '--warning-text': p.warningText,
    '--danger-text': p.dangerText,
    '--on-hue': p.onHue,
    '--role-1': p.roles[0],
    '--role-1-text': p.roleText[0],
    '--role-2': p.roles[1],
    '--role-2-text': p.roleText[1],
    '--key-white': p.keys.white,
    '--key-black': p.keys.black,
    '--bloom': p.bloom,

    '--font-sans': t.sans,
    '--font-display': t.display,
    '--font-mono': t.mono,
    '--font-readout': t.readout,
    '--weight-body': String(t.weightBody),
    '--weight-strong': String(t.weightStrong),
    '--weight-display': String(t.weightDisplay),
    '--weight-numeral': String(t.weightNumeral),
    '--tracking': t.tracking,
    '--tracking-display': t.trackingDisplay,
    '--label-case': t.labelCase,

    '--radius-control': m.radiusControl,
    '--radius-card': m.radiusCard,
    '--radius-input': m.radiusInput,
    '--radius-pill': m.radiusPill,
    '--border-width': m.borderWidth,
    '--input-fill': m.input === 'filled' ? 'var(--surface-2)' : 'transparent',
    '--input-border-sides': m.input === 'box' ? m.borderWidth : '0px',
    '--input-border-bottom': m.input === 'filled' ? '0px' : m.borderWidth,
    '--mat-key-pressed': m.key.pressed,
    '--mat-lit-glow': m.lit.glow,

    '--control-h': `${s.control}px`,
  };
  for (const role of MATERIAL_ROLES) {
    vars[`--mat-${role}-fill`] = m[role].fill;
    vars[`--mat-${role}-shadow`] = m[role].shadow;
    vars[`--mat-${role}-texture`] = m[role].texture;
  }
  p.surface.forEach((v, i) => (vars[`--surface-${i}`] = v));
  p.text.forEach((v, i) => (vars[`--text-${i + 1}`] = v));
  p.hues.forEach((v, i) => (vars[`--hue-${i + 1}`] = v));
  for (const [role, px] of Object.entries(s.sizes)) vars[`--size-${role}`] = `${px}px`;
  SPACE_STEPS.forEach((n, i) => (vars[`--space-${i + 1}`] = `${n * s.unit}px`));
  return vars;
}
