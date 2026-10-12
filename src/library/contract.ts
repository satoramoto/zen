// The token contract: the only values library components may read.
// A theme is four independent facets, so any palette can be worn with any
// type, chrome and density. Colour values live in the facet files under
// themes/; components reference the CSS variables produced by toCssVars().

type Four = readonly [string, string, string, string];

/** Colour roles. Each value keeps the role its source gave it. */
export interface Palette {
  id: string;
  label: string;
  scheme: 'dark' | 'light';
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
  /** Text drawn on a solid success, warning or danger fill: a running Start, an ARMED tag, a
   *  lit record lamp. Each meets WCAG AA (4.5:1) against its own fill. */
  successText: string;
  warningText: string;
  dangerText: string;
  /** Categorical hues: parts, tags, groups. */
  hues: Four;
  /** Text drawn on a solid hue. */
  onHue: string;
  /**
   * Two role hues, each naming exactly one thing; neither is categorical. `style` marks the
   * current style and what belongs to it (its name, its One Touch numbers, a queued style, the
   * Style fader group). `transport` marks the controls that move time (Start / Stop, sync, fills,
   * Tap, tempo up and down, the metronome, and their pad twins). They never stand for a part, a
   * section or a state, never index a list, and stay perceptually clear of the four `hues`, of
   * success, warning and danger, and of each other (`library.test.tsx` holds the distance).
   */
  style: string;
  /** Text drawn on a solid `style` fill; AA against it. */
  styleText: string;
  transport: string;
  /** Text drawn on a solid `transport` fill; AA against it. */
  transportText: string;
  /** A drawn keyboard's faces: white keys and black keys. In every scheme the white keys are
   *  light and the black keys dark, so the keyboard reads as one. */
  keyWhite: string;
  keyBlack: string;
  /** Lamp bloom radius; 0px for flat palettes. */
  bloom: string;
}

export interface TypeFacet {
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
  /** Sizes in px. */
  scale: { caption: number; body: number; label: number; heading: number; display: number; numeral: number };
}

/** Shape and framing: radius, borders, shadows, how fields and cards are drawn. */
export interface Chrome {
  id: string;
  label: string;
  radiusControl: string;
  radiusCard: string;
  radiusInput: string;
  radiusPill: string;
  borderWidth: string;
  card: { fill: 'surface' | 'none'; borderTop: string; borderSides: string; shadow: string };
  input: 'filled' | 'box' | 'underline';
}

export interface Density {
  id: string;
  label: string;
  /** Base spacing unit in px. */
  unit: number;
  /** Control height in px. */
  control: number;
}

export interface Facets {
  palette: Palette;
  type: TypeFacet;
  chrome: Chrome;
  density: Density;
}

const SPACE_STEPS = [1, 2, 3, 4, 6, 8] as const;

export function toCssVars({ palette: p, type: t, chrome: c, density: d }: Facets): Record<string, string> {
  const vars: Record<string, string> = {
    '--scheme': p.scheme,
    // The scheme as a number CSS can compute with: 1 in a light palette, 0 in a dark one.
    // Multiply it in calc() to switch a value by scheme (never light-dark(): the build rewrites
    // it into variables only a literal color-scheme sets).
    '--scheme-light': p.scheme === 'light' ? '1' : '0',
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
    '--style': p.style,
    '--style-text': p.styleText,
    '--transport': p.transport,
    '--transport-text': p.transportText,
    '--key-white': p.keyWhite,
    '--key-black': p.keyBlack,
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

    '--radius-control': c.radiusControl,
    '--radius-card': c.radiusCard,
    '--radius-input': c.radiusInput,
    '--radius-pill': c.radiusPill,
    '--border-width': c.borderWidth,
    '--card-fill': c.card.fill === 'surface' ? 'var(--surface-1)' : 'transparent',
    '--card-border-top': c.card.borderTop,
    '--card-border-sides': c.card.borderSides,
    '--shadow-card': c.card.shadow,
    '--input-fill': c.input === 'filled' ? 'var(--surface-2)' : 'transparent',
    '--input-border-sides': c.input === 'box' ? c.borderWidth : '0px',
    '--input-border-bottom': c.input === 'filled' ? '0px' : c.borderWidth,

    '--control-h': `${d.control}px`,
  };
  p.surface.forEach((v, i) => (vars[`--surface-${i}`] = v));
  p.text.forEach((v, i) => (vars[`--text-${i + 1}`] = v));
  p.hues.forEach((v, i) => (vars[`--hue-${i + 1}`] = v));
  for (const [role, px] of Object.entries(t.scale)) vars[`--size-${role}`] = `${px}px`;
  SPACE_STEPS.forEach((n, i) => (vars[`--space-${i + 1}`] = `${n * d.unit}px`));
  return vars;
}
