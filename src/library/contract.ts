// The token contract: the only values library components may read.
// A design system is four independent facets, so any palette can be worn with any faces, scale
// and materials. Values live in the facet files under themes/; components reference the CSS
// variables produced by toCssVars().

type Four = readonly [string, string, string, string];
type Two = readonly [string, string];
type Five = readonly [string, string, string, string, string];
type Six = readonly [string, string, string, string, string, string];
type Three = readonly [string, string, string];

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
  /** Categorical hues: parts, tags, groups. Five slots, `--hue-1` … `--hue-5`. */
  hues: Five;
  /** Text drawn on a solid hue. */
  onHue: string;
  /**
   * Two role hues, each for one job an app names (Yahaha: role 1 is the current style, role 2 the
   * controls that move time). They are not categorical, never index a list, and stay perceptually
   * clear of the five `hues`, of success, warning and danger, and of each other.
   */
  roles: Two;
  /** Text drawn on a solid role fill; AA against it. */
  roleText: Two;
  /** Lamp bloom radius; 0px for flat palettes. */
  bloom: string;
  /** The instrument extension: a drawn keyboard's white and black keys. White keys are light and
   *  black keys dark in every mode, so the keyboard reads as one. */
  keys: { white: string; black: string };
  /** Optional instrument paint. Source identities and related deck shades are deliberately not
   * the five mutually separated categorical hues: a family may contain neighbouring shades.
   * Old palettes omit this and inherit their existing hues, roles, surfaces and ink. */
  instrument?: InstrumentScheme;
}

/** Framework-free colours for dense instruments, analysis displays and related source families.
 * All entries are colours, so the existing skin import/export and colour controls can edit them. */
export interface InstrumentScheme {
  sources: Six;
  decks: Four;
  spectral: Three;
  waveformBase: string;
  signal: string;
  positive: string;
  negative: string;
  info: string;
  preview: string;
  idle: string;
  focus: string;
  highlight: string;
  borderQuiet: string;
  borderControl: string;
  surface: {
    rail: string;
    selected: string;
    control: string;
    stats: string;
    cell: string;
    cellMuted: string;
    sunken: string;
    band: string;
    laneHead: string;
    outside: string;
    manual: string;
  };
}

/** A palette's optional instrument roles, with colour-valued fallbacks (also usable by canvas).
 * No defaults from a different pack are ever introduced into an old palette. */
export function instrumentScheme(p: Scheme): InstrumentScheme {
  return p.instrument ?? {
    sources: [...p.hues, p.roles[0]],
    decks: [p.roles[0], `color-mix(in srgb, ${p.roles[0]} 85%, ${p.text[0]})`, p.roles[1], `color-mix(in srgb, ${p.roles[1]} 85%, ${p.text[0]})`],
    spectral: [p.hues[0], p.hues[1], p.hues[2]],
    waveformBase: p.text[2],
    signal: p.success,
    positive: p.success,
    negative: p.danger,
    info: p.hues[0],
    preview: p.roles[0],
    idle: p.borderStrong,
    focus: p.borderStrong,
    highlight: p.text[0],
    borderQuiet: p.border,
    borderControl: p.borderStrong,
    surface: {
      rail: p.surface[0], selected: p.surface[3], control: p.surface[2], stats: p.surface[1],
      cell: p.surface[2], cellMuted: p.surface[1], sunken: p.surface[0], band: p.surface[0],
      laneHead: p.surface[3], outside: p.surface[1], manual: p.surface[2],
    },
  };
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
  /** Mathematics: what MathML (and the `math` text role) is set in. A math face (OpenType MATH
   *  table) first, ending in the generic `math`. */
  math: string;
  weightBody: number;
  weightStrong: number;
  weightDisplay: number;
  weightNumeral: number;
  tracking: string;
  trackingDisplay: string;
  labelCase: 'none' | 'uppercase';
  /** Custom variable-font axes; `wght` is left to the weight roles. */
  variation?: Partial<Record<'sans' | 'display' | 'mono' | 'readout', string>>;
  weightMedium?: number;
  weightBold?: number;
  trackingTight?: string;
  trackingSlight?: string;
  trackingLabel?: string;
  trackingCaps?: string;
  /** Inherited text leading; instruments may retain the browser's normal font metrics. */
  lineHeight?: string;
}

/** One density's coupled spacing, controls and text metrics. */
export interface ScaleMetrics {
  /** Base spacing unit in px. */
  unit: number;
  /** Control height in px. */
  control: number;
  /** Type sizes in px. */
  sizes: { caption: number; body: number; label: number; heading: number; display: number; numeral: number };
  /** Additional dense-UI text roles. Outside sizes so its existing indexed contract stays total. */
  controlText?: number;
  leadText?: number;
}

/** Scale: general UI metrics plus optional dense instrument roles, all owned by one facet. */
export interface Scale extends ScaleMetrics {
  id: string;
  label: string;
  /** A dense instrument does not shrink general app controls below their layout/target floors. */
  instrument?: ScaleMetrics;
}

/** Instrument density follows ordinary scale edits unless the facet explicitly supplies it. */
export function instrumentScale(s: Scale): Required<ScaleMetrics> {
  const v = s.instrument ?? s;
  return { unit: v.unit, control: v.control, sizes: v.sizes, controlText: v.controlText ?? v.sizes.label, leadText: v.leadText ?? v.sizes.body };
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
  /** The opaque fill used instead under reduced transparency or more contrast (library.css), as
   *  `Layer.solid` is for layers. Left out, it is `fill` (a fill that is already opaque). */
  solid?: string;
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
  /**
   * The depth stack: how each layer of the screen is drawn and composited over the one behind it.
   * Flat systems read depth as tone steps, hardware as bevels and cast shadows, glass as frosted
   * panes that blur what's beneath. Regions sit on `base`, popovers on `float`, sheets on
   * `overlay`. See `Layer`.
   */
  layers: Record<LayerName, Layer>;
  /** How much of the picture's ambient light each layer takes (`LayerAmbient`); a layer left out
   *  takes none. */
  ambient?: Partial<Record<LayerName, LayerAmbient>>;
  /** The text steps on each layer (`LayerInk`); a layer left out keeps the palette's. Beside
   *  `ambient` rather than on `Layer`, which holds only CSS strings. */
  ink?: Partial<Record<LayerName, LayerInk>>;
  /**
   * The graph's parts, as layers: `node` a chip's face (`Device`), `zone` the frame grouping chips.
   * Unset, a node is drawn as `layers.raised` and a zone as a faint tint with no blur. A glass set
   * gives both a frosted pane.
   */
  graph?: { node?: Layer; zone?: Layer };
  /** The one light source every edge and cast shadow agrees on, as a CSS angle (`180deg`: from above). */
  light: string;
  /** Region spacing: `inset` is the padding around a region's body and `gap` the space between
   *  regions, as CSS lengths that may read the scale (`var(--space-3)`). `head` is the region
   *  header strip: its own padding (`inset`) and the rule under it (a box-shadow, or no shadow). */
  plate: { inset: string; gap: string; head: { inset: string; rule: string } };
  /** Switches in a region header (and anywhere `Tabs` is used). `track` is what the tabs sit in,
   *  `tab` a resting tab, `chosen` the chosen one; `ink`/`chosenInk` their text colours; `pad` the
   *  track's padding, `gap` the space between tabs, `tabPad` a tab's own padding. */
  tabs: {
    track: Material;
    tab: Material;
    chosen: Material;
    ink: string;
    chosenInk: string;
    pad: string;
    gap: string;
    tabPad: string;
  };
  /** Recessed tracks: fader grooves, knob rings, meter channels. */
  well: Material;
  /** Readout windows: tempo, bar, chord, the display. */
  screen: Material;
  /** Pressable faces: pads, buttons, tabs. `pressed` is the shadow while held or on. */
  key: Material & { pressed: string };
  /** Things you grab: fader caps, knob bodies. */
  handle: Material;
  /** Lit indicators: the glow's blur `radius` and its `strength` (how much of the lit colour, a
   *  percentage). Every element in a scope gets `--mat-lit-glow` built from these and its own
   *  `--lit` (library.css), because a custom property resolves `var()` where it is declared: the
   *  scope can't hold a glow that reads each lamp's colour. */
  lit: { radius: string; strength: string };
  /** The keyboard focus ring: its `ink` (default `var(--accent)`) and its `offset` from the edge
   *  (default `2px`), as `--focus-ring` and `--focus-ring-offset`. A system whose focus ring is
   *  the controls' ink rather than the accent (visuals) sets `ink`. */
  focus?: { ink?: string; offset?: string };
  /** A shader material (docs/shader-graph.md) drawn over a layer's CSS fill and under its
   *  content, where WebGL2 allows; the CSS layer is the fallback. A layer left out has none. */
  shaders?: Partial<Record<LayerName, 'water' | 'ether' | 'glass'>>;
  /** Optional dense-instrument finishes. The defaults read the material's ordinary layers;
   * only a source with different popup corners or shadow recipes needs to supply them. */
  instrument?: {
    popupRadius: string;
    contextShadow: string;
    contextShadowInk: string;
    shadowEdge: string;
    scrim: string;
    waveformStrength: string;
    spectralStrength: string;
    spectralMode: 'spectral' | 'deck';
    /** CSS color-scheme for native form controls; `var(--scheme)` follows the Zen mode. */
    nativeColorScheme: string;
    /** A printed marker (flat instruments) or a physical cap dressed by handle material. */
    handlePaint: 'marker' | 'material';
    /** A free control's handle shadow; a mixer fader uses handle.shadow directly. */
    freeHandleShadow: string;
  };
}

/** Virtual optional finish defaults. Skin validation and partial overrides use the same values
 * as CSS emission, without adding frozen mixflow values to a legacy facet. */
export function instrumentFinish(m: Materials): NonNullable<Materials['instrument']> {
  return m.instrument ?? {
    popupRadius: m.radiusCard,
    contextShadow: 'var(--layer-float-cast)',
    contextShadowInk: 'var(--instrument-shadow-edge)',
    shadowEdge: 'oklch(from var(--surface-0) calc(l * 0.25) c h / 0.6)',
    scrim: 'color-mix(in srgb, var(--surface-0) 60%, transparent)',
    waveformStrength: '65%', spectralStrength: '100', spectralMode: 'spectral',
    nativeColorScheme: 'var(--scheme)',
    handlePaint: 'material', freeHandleShadow: 'var(--mat-handle-shadow)',
  };
}

/**
 * The layers of a screen, back to front: `ground` the window or desktop behind everything (native
 * frost in a glass app), `base` regions and plates, `raised` controls standing on a plate, `float`
 * popovers, menus and a dragged item, `overlay` sheets and modals, `top` toasts and hints.
 */
export const LAYERS = ['ground', 'base', 'raised', 'float', 'overlay', 'top'] as const;
export type LayerName = (typeof LAYERS)[number];

/** How one layer is drawn and composited. Values are CSS and may read palette variables. */
export interface Layer {
  /** Its fill; translucent where the layer behind should show through. */
  fill: string;
  /** The opaque fill used instead wherever translucency can't composite (over a native view: an
   *  `Opaque` scope). Equal to `fill` when the layer is already opaque. */
  solid: string;
  /** A background layer over the fill (grain, brushing), or `none`. */
  texture: string;
  /** The backdrop-filter applied to what's behind it (`blur(28px) saturate(1.6)`), or `none`. */
  backdrop: string;
  /** The shadow it casts onto the layer behind (a box-shadow; never `none`, use `0 0 0 0 transparent`). */
  cast: string;
  /** Its edge: hairlines and the specular highlight on its lit side (a box-shadow, inset). */
  edge: string;
}

/**
 * The text steps on a layer, where the palette's own would not hold their contrast (glass, whose
 * tone follows whatever is behind it): `secondary` replaces `--text-3` (captions) and `faint`
 * `--text-4` (icons, the faintest marks) inside every surface of the layer. Emitted as
 * `--layer-<name>-text-3` and `-text-4`; `Surface` sets them.
 */
export interface LayerInk {
  secondary: string;
  faint: string;
}

/**
 * How much of the ambient light (the picture's colour, `AMBIENT_VARS`) a layer takes, at full
 * `--ambient-strength` (`Materials.ambient`). Plain values only (never `var(--ambient-*)`: the
 * scope would resolve it to the fallbacks); `Surface` builds the mix on each element
 * (`Surface.css`, from `--ambient-held` and `--ambient-light`), from the region its `ambient` prop
 * names. With no `Ambient` above (strength 0) the layer looks exactly as it does without one.
 */
export interface LayerAmbient {
  /** The share of the ambient colour laid over its fill, a percentage (`'24%'`). */
  fill: string;
  /** The share in a specular edge on its lit side (`light`), a percentage. */
  edge: string;
  /** The share in a coloured glow it casts onto what's behind, a percentage. */
  cast: string;
  /** The OKLab lightness band (`[min, max]`, numbers 0–1, may `calc()` with `--scheme-light`) the
   *  colour is held to before it tints the fill, so no picture can take text below its contrast. */
  lightness: readonly [string, string];
}

/** A layer that takes no ambient light. */
const NO_AMBIENT: LayerAmbient = { fill: '0%', edge: '0%', cast: '0%', lightness: ['0', '1'] };

/** A graph zone without a `graph.zone` of its own: a faint tint of the ink, no blur, edge or cast. */
const PLAIN_ZONE: Layer = {
  fill: 'color-mix(in oklab, var(--text-1) 3%, transparent)',
  solid: 'color-mix(in oklab, var(--text-1) 3%, var(--surface-1))',
  texture: 'none',
  backdrop: 'none',
  cast: '0 0 0 0 transparent',
  edge: '0 0 0 0 transparent',
};

/** The graph's own layers (`Materials.graph`), emitted as `--layer-node-*` and `--layer-zone-*`. */
export const GRAPH_LAYERS = ['node', 'zone'] as const;

export interface Facets {
  palette: Palette;
  faces: Faces;
  scale: Scale;
  materials: Materials;
}

/** Contract variables the scope stylesheet (library.css) builds on every element instead of
 *  `toCssVars`, because they read a variable each element sets for itself (`--lit`, the ambient
 *  region and band: see `AMBIENT_VARS`). */
export const SCOPE_VARS = ['--mat-lit-glow', '--ambient-light', '--ambient-held'] as const;

/**
 * Ambient light: the colour of the picture a screen shows (the preview video), which components
 * and materials may read to react to it. An `Ambient` primitive (`primitives/Ambient`) samples
 * its source and writes these on its own element, eased over time; the theme scope sets the
 * neutral fallbacks below, so CSS that reads them works with no `Ambient` around.
 * - `--ambient-avg`: the whole picture's average colour (`oklab(...)`).
 * - `--ambient-left`, `--ambient-right`, `--ambient-top`, `--ambient-bottom`, `--ambient-centre`:
 *   the light from each region (a quarter at each side, a third at top and bottom, the middle).
 * - `--ambient-strength`: 0–1, how much to tint by it: 0 with no picture (or no Ambient), eased
 *   up once samples arrive. Mix by it, so a screen with no picture looks exactly as before:
 *   `color-mix(in oklab, var(--ambient-avg) calc(var(--ambient-strength) * 30%), var(--layer-float-fill))`.
 *
 * A custom property resolves `var()` where it is declared, so a value built from these in
 * `toCssVars` (on the scope) reads the fallbacks: read them on the element (as `--mat-lit-glow` is).
 *
 * Built per element by the scope stylesheet (library.css, `SCOPE_VARS`), for layers that take
 * the light (`Materials.ambient`):
 * - `--ambient-light`: the region an element takes (`data-ambient`, `Surface`'s `ambient`),
 *   inherited by what's inside; unset means `--ambient-avg`.
 * - `--ambient-held`: that colour with its OKLab lightness held to `--ambient-l-min`..`-l-max`
 *   (the layer's band, which `Surface` sets; `0`..`1` on the scope).
 */
export const AMBIENT_REGIONS = ['avg', 'left', 'right', 'top', 'bottom', 'centre'] as const;
export type AmbientRegion = (typeof AMBIENT_REGIONS)[number];
export const AMBIENT_VARS = [...AMBIENT_REGIONS.map((r) => `--ambient-${r}` as const), '--ambient-strength'] as const;

/** The ambient variables with no picture: a mid surface of the scheme, at strength 0. */
export const AMBIENT_FALLBACKS: Record<(typeof AMBIENT_VARS)[number], string> = {
  '--ambient-avg': 'var(--surface-2)',
  '--ambient-left': 'var(--surface-2)',
  '--ambient-right': 'var(--surface-2)',
  '--ambient-top': 'var(--surface-2)',
  '--ambient-bottom': 'var(--surface-2)',
  '--ambient-centre': 'var(--surface-2)',
  '--ambient-strength': '0',
};

/** Each spacing step's multiple of the scale unit: `--space-N` is `SPACE_STEPS[N - 1] * unit`. */
export const SPACE_STEPS = [1, 2, 3, 4, 6, 8] as const;

/**
 * How much a screen matters, part by part, highest first. A screen's regions name one of these as
 * their `priority`; the solver steps the lowest down first, so `now` (what's playing) never
 * shrinks first. `chrome` is page furniture.
 */
export const RANKS = ['now', 'next', 'controls', 'context', 'chrome'] as const;
export type Rank = (typeof RANKS)[number];

/**
 * How a pack prefers to spend room when a screen is short of it (`docs/assembly.md`).
 * - `roomy`: keep regions at their ideal size; step a form down sooner (fewer, roomier things).
 * - `balanced`: halfway between a form's least and its ideal before stepping down.
 * - `dense`: keep the richest form that fits at its least (more things, tighter).
 */
export type Density = 'roomy' | 'balanced' | 'dense';

/**
 * A system's layout principles: data the assembly solver (`layout/assembly`) reads, beside the
 * facets it resolves sizes from. Each theme pack carries one.
 */
export interface PackPrinciples {
  /** The least a target may be on screen, in CSS px: the solver never zooms a control below it. */
  minTarget: number;
  density: Density;
  /** Spacing steps: `body` between the groups in a region's body, `group` between the controls in a group. */
  gaps: { body: 0 | 1 | 2 | 3 | 4 | 5 | 6; group: 0 | 1 | 2 | 3 | 4 | 5 | 6 };
  /** The rank ladder, highest first; default `RANKS`. A pack may reorder it, never drop a rank. */
  ranks?: readonly Rank[];
  /** The source rules these encode, in plain words (`principles/*.md`, `STAGE.md`). */
  notes: string[];
}
const MATERIAL_ROLES = ['well', 'screen', 'key', 'handle'] as const;

export function toCssVars({ palette, faces: t, scale: s, materials: m }: Facets, mode: Mode): Record<string, string> {
  const p = palette[mode];
  const instrument = instrumentScheme(p);
  const finish = instrumentFinish(m);
  const dense = instrumentScale(s);
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
    '--font-math': t.math,
    '--font-sans-axes': t.variation?.sans ?? 'normal',
    '--font-display-axes': t.variation?.display ?? 'normal',
    '--font-mono-axes': t.variation?.mono ?? 'normal',
    '--font-readout-axes': t.variation?.readout ?? 'normal',
    '--weight-body': String(t.weightBody),
    '--weight-strong': String(t.weightStrong),
    '--weight-display': String(t.weightDisplay),
    '--weight-numeral': String(t.weightNumeral),
    '--weight-medium': String(t.weightMedium ?? Math.round((t.weightBody + t.weightStrong) / 2)),
    '--weight-bold': String(t.weightBold ?? Math.max(t.weightStrong, t.weightDisplay)),
    '--tracking': t.tracking,
    '--tracking-display': t.trackingDisplay,
    '--tracking-tight': t.trackingTight ?? t.tracking,
    '--tracking-slight': t.trackingSlight ?? t.tracking,
    '--tracking-label': t.trackingLabel ?? t.tracking,
    '--tracking-caps': t.trackingCaps ?? t.trackingDisplay,
    '--line-height': t.lineHeight ?? '1.4',
    '--label-case': t.labelCase,

    '--radius-control': m.radiusControl,
    '--radius-card': m.radiusCard,
    '--radius-input': m.radiusInput,
    '--radius-pill': m.radiusPill,
    '--border-width': m.borderWidth,
    '--input-fill': m.input === 'filled' ? 'var(--surface-2)' : 'transparent',
    '--input-border-sides': m.input === 'box' ? m.borderWidth : '0px',
    '--input-border-bottom': m.input === 'filled' ? '0px' : m.borderWidth,
    '--mat-plate-inset': m.plate.inset,
    '--mat-plate-gap': m.plate.gap,
    '--mat-plate-head-inset': m.plate.head.inset,
    '--mat-plate-head-rule': m.plate.head.rule,
    '--mat-tabs-ink': m.tabs.ink,
    '--mat-tabs-chosen-ink': m.tabs.chosenInk,
    '--mat-tabs-pad': m.tabs.pad,
    '--mat-tabs-gap': m.tabs.gap,
    '--mat-tabs-tab-pad': m.tabs.tabPad,
    '--mat-key-pressed': m.key.pressed,
    '--mat-lit-radius': m.lit.radius,
    '--mat-lit-strength': m.lit.strength,
    '--light-angle': m.light,
    '--focus-ring': m.focus?.ink ?? 'var(--accent)',
    '--focus-ring-offset': m.focus?.offset ?? '2px',

    '--control-h': `${s.control}px`,
    '--size-control': `${s.controlText ?? s.sizes.label}px`,
    '--size-lead': `${s.leadText ?? s.sizes.body}px`,
    '--instrument-control-h': `${dense.control}px`,
    '--instrument-size-control': `${dense.controlText}px`,
    '--instrument-size-lead': `${dense.leadText}px`,

    '--instrument-waveform-base': instrument.waveformBase,
    '--instrument-signal': instrument.signal,
    '--instrument-positive': instrument.positive,
    '--instrument-negative': instrument.negative,
    '--instrument-info': instrument.info,
    '--instrument-preview': instrument.preview,
    '--instrument-idle': instrument.idle,
    '--instrument-focus': instrument.focus,
    '--instrument-highlight': instrument.highlight,
    '--instrument-border-quiet': instrument.borderQuiet,
    '--instrument-border-control': instrument.borderControl,
    '--instrument-popup-radius': finish.popupRadius,
    '--instrument-context-shadow': finish.contextShadow,
    '--instrument-context-shadow-ink': finish.contextShadowInk,
    '--instrument-shadow-edge': finish.shadowEdge,
    '--instrument-scrim': finish.scrim,
    '--instrument-waveform-strength': finish.waveformStrength,
    '--instrument-spectral-strength': finish.spectralStrength,
    '--instrument-spectral-mode': finish.spectralMode,
    '--instrument-native-color-scheme': finish.nativeColorScheme,
    // CSS's empty-token / guaranteed-invalid switch defers the local marker colour to each
    // handle. Do not put var(--wdg-marker) here: it would resolve too early, on the theme scope.
    '--instrument-handle-marker-switch': finish.handlePaint === 'marker' ? ' ' : 'initial',
    '--instrument-free-handle-shadow': finish.freeHandleShadow,
  };
  instrument.sources.forEach((v, i) => (vars[`--instrument-source-${i + 1}`] = v));
  instrument.decks.forEach((v, i) => (vars[`--instrument-deck-${i + 1}`] = v));
  instrument.spectral.forEach((v, i) => (vars[`--instrument-spectral-${['low', 'mid', 'high'][i]}`] = v));
  for (const [role, value] of Object.entries(instrument.surface)) {
    vars[`--instrument-surface-${role.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`] = value;
  }
  for (const role of MATERIAL_ROLES) {
    vars[`--mat-${role}-fill`] = m[role].fill;
    vars[`--mat-${role}-solid`] = m[role].solid ?? m[role].fill;
    vars[`--mat-${role}-shadow`] = m[role].shadow;
    vars[`--mat-${role}-texture`] = m[role].texture;
  }
  for (const name of LAYERS) {
    const l = m.layers[name];
    vars[`--layer-${name}-fill`] = l.fill;
    vars[`--layer-${name}-solid`] = l.solid;
    vars[`--layer-${name}-texture`] = l.texture;
    vars[`--layer-${name}-backdrop`] = l.backdrop;
    vars[`--layer-${name}-cast`] = l.cast;
    vars[`--layer-${name}-edge`] = l.edge;
    vars[`--layer-${name}-text-3`] = m.ink?.[name]?.secondary ?? 'var(--text-3)';
    vars[`--layer-${name}-text-4`] = m.ink?.[name]?.faint ?? 'var(--text-4)';
    const a = m.ambient?.[name] ?? NO_AMBIENT;
    vars[`--layer-${name}-ambient-fill`] = a.fill;
    vars[`--layer-${name}-ambient-edge`] = a.edge;
    vars[`--layer-${name}-ambient-cast`] = a.cast;
    vars[`--layer-${name}-ambient-l-min`] = a.lightness[0];
    vars[`--layer-${name}-ambient-l-max`] = a.lightness[1];
  }
  const graph: Record<(typeof GRAPH_LAYERS)[number], Layer> = {
    node: m.graph?.node ?? m.layers.raised,
    zone: m.graph?.zone ?? PLAIN_ZONE,
  };
  for (const name of GRAPH_LAYERS) {
    const l = graph[name];
    vars[`--layer-${name}-fill`] = l.fill;
    vars[`--layer-${name}-solid`] = l.solid;
    vars[`--layer-${name}-texture`] = l.texture;
    vars[`--layer-${name}-backdrop`] = l.backdrop;
    vars[`--layer-${name}-cast`] = l.cast;
    vars[`--layer-${name}-edge`] = l.edge;
  }
  for (const part of ['track', 'tab', 'chosen'] as const) {
    vars[`--mat-tabs-${part}-fill`] = m.tabs[part].fill;
    vars[`--mat-tabs-${part}-shadow`] = m.tabs[part].shadow;
    vars[`--mat-tabs-${part}-texture`] = m.tabs[part].texture;
  }
  p.surface.forEach((v, i) => (vars[`--surface-${i}`] = v));
  p.text.forEach((v, i) => (vars[`--text-${i + 1}`] = v));
  p.hues.forEach((v, i) => (vars[`--hue-${i + 1}`] = v));
  for (const [role, px] of Object.entries(s.sizes)) vars[`--size-${role}`] = `${px}px`;
  SPACE_STEPS.forEach((n, i) => (vars[`--space-${i + 1}`] = `${n * s.unit}px`));
  for (const [role, px] of Object.entries(dense.sizes)) vars[`--instrument-size-${role}`] = `${px}px`;
  SPACE_STEPS.forEach((n, i) => (vars[`--instrument-space-${i + 1}`] = `${n * dense.unit}px`));
  Object.assign(vars, AMBIENT_FALLBACKS);
  vars['--ambient-l-min'] = '0';
  vars['--ambient-l-max'] = '1';
  return vars;
}
