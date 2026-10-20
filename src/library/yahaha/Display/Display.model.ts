// Display's model: its props and what the hero draws from them (the root's classes, `data-*` and
// inline style, the header's text, the section's "then" line, the part rows). No framework:
// `Display.tsx` (React) and `Display.svelte` (Svelte) both render `displayView`; the fit and the
// auto form's measuring are the store beside it (`fit.ts`).
import type { TipAction } from '../../components/core/Button/Button.model';
import type { ChordReadoutModelProps } from '../../components/music/ChordReadout/ChordReadout.model';
import { marksText } from '../../components/music/PartMarks/marks';
import type { ElementView } from '../../primitives/Text.model';
import { PART_HUE, SECTION_STATE_COLOUR, type Part } from '../hues';
import { DISPLAY_FORMS, displayLengthCss, type DisplayForm } from './Display.forms';

export type { TipAction };

/** The hero's form when nothing else picks one: see `DisplayModelProps.density`. */
export type DisplayDensity = 'auto' | 'full' | 'compact';

/** `auto` picks `full` from a hero this many CSS pixels wide, `compact` below. */
export const AUTO_FULL_WIDTH = 1200;

/**
 * The readouts' sizes, passed to each primitive's `size` (and BarBeat's `thickness`). Each is a
 * local variable the hero's CSS sets from its width (container units) and its density's cap, so
 * the primitives' own CSS is never overridden.
 */
export const DISPLAY_SIZES = {
  section: 'var(--yh-display-section)',
  chord: 'var(--yh-display-chord)',
  tempo: 'var(--yh-display-tempo)',
  beat: 'var(--yh-display-beat-line)',
} as const;

/** The loaded style: the header line, and One Touch. */
export interface DisplayStyle {
  /** The style's name ("Sunday Drive Pop"). Empty: "No style". */
  name: string;
  /** Its category ("Pop & Rock"). */
  category?: string;
  /** Its time signature ("4/4"). */
  timeSignature?: string;
  /** A style waiting for the bar line ("Coastal Highway"). Empty: none. */
  queued?: string;
  /** The applied One Touch, 1–4; 0 when none is. */
  oneTouch?: number;
  /** How many One Touch settings the style has (numbers past it are disabled). */
  oneTouchCount?: number;
}

/** What the band is playing: the section, what's next, the chord, the tempo and the beat. */
export interface DisplayNowPlaying {
  /** The playing section's shown name ("Main B"); stopped, the section the band starts on. */
  playing: string;
  /** The next (queued or armed) section ("Main C"). Empty: none. */
  next?: string;
  /** When the change lands ("fill after bar 4", "after bar 1"). Empty: nothing. */
  fill?: string;
  /** The current bar of the section, 1-based. Kept for callers; the beat cells show where the bar is. */
  bar?: number;
  /** Bars in the section. */
  bars?: number;
  /** The tempo in BPM. */
  bpm: number;
  /** The style's own tempo in BPM. When `bpm` equals it, the Style tempo key looks unavailable (nothing to reset). Omitted: the key always looks available. */
  styleTempo?: number;
  /** The band is running. False: "Stopped", the section without its live block, the beat at rest. */
  running?: boolean;
  /** Stopped with Sync Start armed: "Sync Start armed". */
  syncStart?: boolean;
  /** The chord readout: chord, extension, notes, fingering, held. */
  chord: ChordReadoutModelProps;
  /** The current beat, 1-based; 0 when stopped. */
  beat?: number;
  /** Beats in the bar: one segment each. */
  beats?: number;
}

/** One keyboard part's sound. */
export interface DisplayPart {
  /** Which part; it picks the part's hue (`hues.ts`). */
  id: Part;
  /** Its full name ("Right 1"). */
  name: string;
  /** The sound's number in its list. Spoken only. */
  number?: string;
  /** The sound's name. */
  sound: string;
  /** The part is off. */
  off?: boolean;
  /** Changed since it was loaded. */
  edited?: boolean;
  /** Its plugin isn't installed. */
  missing?: boolean;
  /** Its plugin failed. */
  failed?: boolean;
  /** It plays the Style's bass. */
  bass?: boolean;
}

export interface DisplayModelProps {
  /** The style header and One Touch. */
  style: DisplayStyle;
  /** Section, next, chord, tempo and beat. */
  nowPlaying: DisplayNowPlaying;
  /** The four parts' sounds, in order. Omitted or empty: no parts column (the Stage's mixer names them). */
  parts?: DisplayPart[];
  /** Draw the background art at the right edge. */
  art?: boolean;
  /**
   * The form to draw (`DISPLAY_FORMS`): `full`, `compact` or `minimal`. Wins over everything
   * else. Unset: the form the assembled screen chose for the hero's region (`useChosenForm()`),
   * and outside an assembled screen, `density`.
   */
  form?: DisplayForm;
  /**
   * Standalone only (no `form`, no assembled screen): `compact` or `full` picks that form;
   * `auto` (default) is `compact` while the hero is narrower than `AUTO_FULL_WIDTH` (1200 CSS
   * pixels, measured), `full` from there. Inside an assembled screen the screen's form wins.
   */
  density?: DisplayDensity;
  /** The app's tooltip hook, applied to every control (the primitives apply it to their own). */
  tipAction?: TipAction;
  /** ‹: the previous style. */
  onPrev?: () => void;
  /** ›: the next style. */
  onNext?: () => void;
  /** The style's name: opens Library › Styles. */
  onBrowse?: () => void;
  /** One Touch 1–4: applies it. */
  onOneTouch?: (n: number) => void;
  /** A part's row: opens its sound list. */
  onSound?: (part: Part) => void;
  /** Tempo + held (`true`) and released (`false`); from the keyboard, `true` then `false`. */
  onTempoUp?: (down: boolean) => void;
  /** Tempo − held and released, as `onTempoUp`. */
  onTempoDown?: (down: boolean) => void;
  /** A drag, scroll or arrow key on the tempo number asks for this tempo. */
  onTempo?: (bpm: number) => void;
  /** Tap: one tap, reported on press (pointer down, or Enter/Space). The caller times the taps. */
  onTap?: () => void;
  /** Back to the style's own tempo (the Style tempo key beside Tap, or a double-click on the number). */
  onStyleTempo?: () => void;
}

/** Inline style declarations, property to value (custom properties included). */
export type StyleMap = Record<string, string>;

/** A style map as an inline `style` string, or undefined for none. */
export function styleText(style: StyleMap | undefined): string | undefined {
  return style === undefined ? undefined : Object.entries(style).map(([property, value]) => `${property}: ${value}`).join('; ');
}

/** Each form's least as the CSS the readouts scale from (`--yh-display-min-w`, `-min-h`). */
const LEAST_CSS = Object.fromEntries(
  DISPLAY_FORMS.map((f): [DisplayForm, StyleMap] => [f.id, { '--yh-display-min-w': displayLengthCss(f.min.w), '--yh-display-min-h': displayLengthCss(f.min.h) }]),
) as Record<DisplayForm, StyleMap>;

/** Readout scales, largest first: the row takes the first at which the three readouts fit the hero's width. */
export const DISPLAY_FITS = ['1', '0.9', '0.8', '0.7', '0.6'] as const;

/**
 * Which form the hero draws: the `form` prop, then the assembled screen's choice (`fromScreen`,
 * from `useForm`/`getForm`; `chosen` is `null` outside an assembled screen), then `density`,
 * where `auto` is `wide` measured. `byDensity`: neither the prop nor a screen picked it.
 */
export function displayForm(
  { form: given, density = 'auto' }: Pick<DisplayModelProps, 'form' | 'density'>,
  fromScreen: DisplayForm,
  chosen: string | null,
  wide: boolean,
): { form: DisplayForm; byDensity: boolean } {
  const byDensity = given === undefined && chosen === null;
  const form: DisplayForm = !byDensity ? fromScreen : density === 'auto' ? (wide ? 'full' : 'compact') : density;
  return { form, byDensity };
}

/** Whether the hero's width picks its form (`density="auto"`, nothing else picking): only then is it measured. */
export function displayMeasuresWidth({ form, density = 'auto' }: Pick<DisplayModelProps, 'form' | 'density'>, chosen: string | null): boolean {
  return form === undefined && chosen === null && density === 'auto';
}

/** One part's row. */
export interface DisplayPartView {
  id: Part;
  /** The row button's `data-*`, ARIA and `data-tip`. */
  attrs: Record<string, string | undefined>;
  /** The row's inline style (its hue). */
  style: StyleMap;
  /** The dot's `data-lit`. */
  lit: string | undefined;
  /** The sound's name. */
  sound: string;
  /** The part's name ("Right 1"). */
  name: string;
  /** "bass", "off" or empty (the " · " before it is CSS). */
  tail: string;
  edited?: boolean;
  missing?: boolean;
  failed?: boolean;
}

/** The part row's tooltip key. */
export const PART_TIP = 'launchkey.fader_sound';

/** A part's row from its sound. */
export function displayPartView(p: DisplayPart): DisplayPartView {
  const off = !!p.off && !p.bass;
  return {
    id: p.id,
    attrs: {
      type: 'button',
      'data-part': 'part',
      'data-off': off ? 'true' : undefined,
      'aria-label': `${p.name} sound: ${p.number ? `${p.number} ` : ''}${p.sound}${marksText(p)}. Opens the quick sound list`,
      'data-tip': PART_TIP,
    },
    style: { '--yh-display-part-hue': PART_HUE[p.id] },
    lit: off ? undefined : 'true',
    sound: p.sound,
    name: p.name,
    tail: p.bass ? 'bass' : p.off ? 'off' : '',
    edited: p.edited,
    missing: p.missing,
    failed: p.failed,
  };
}

/** What a renderer draws. */
export interface DisplayView {
  /** The form drawn. */
  form: DisplayForm;
  /** The root (a `Text`, `size="inherit"`): its class and `data-*`. */
  root: ElementView;
  /** The root's inline style: the form's least. */
  rootStyle: StyleMap;
  /** The style's shown name ("No style" when blank). */
  name: string;
  /** The queued style, or empty. */
  queued: string;
  /** The genre · metre, or empty. */
  meta: string;
  /** The band is running. */
  running: boolean;
  /** The section's spoken name ("Playing Main B"). */
  nowLabel: string;
  /** The section's `data-live`. */
  nowLive: string | undefined;
  /** Stopped: the status word; then what's next and when. */
  line: { status: string; next: string; when: string };
  /** Whether the line under the section is drawn at all. */
  hasLine: boolean;
  /** Whether the "then" tab is drawn. */
  hasThen: boolean;
  /** The "then" tab's `data-docked`. */
  thenDocked: string | undefined;
  /** The "then" tab's inline style (the arrow's hue). */
  thenStyle: StyleMap;
  /** Already at the style's tempo: the Style tempo key has nothing to do. */
  atStyleTempo: boolean;
  /** The lit beat (0 at rest) and the beats in the bar. */
  beat: number;
  beats: number;
  /** Tap and Style tempo sit in the header (minimal) rather than under the tempo. */
  tempoKeysInHeader: boolean;
  /** The part rows; empty for no parts column. */
  parts: DisplayPartView[];
  /** Changes whenever what the fit measures may change: the fit runs again. */
  fitKey: string;
}

/**
 * What hangs under the section: stopped, the status word; then the "then" tab with what's next and
 * when. Where the bar is ("bar 3 of 4") is no longer written: the beat cells under the tempo say it.
 */
function thenLine(n: DisplayNowPlaying): { status: string; next: string; when: string } {
  const next = (n.next ?? '').trim();
  const fill = (n.fill ?? '').trim();
  if (!n.running) return { status: n.syncStart ? 'Sync Start armed' : 'Stopped', next, when: '' };
  return { status: '', next, when: fill };
}

/** The hero Display draws from its props, in the form `displayForm` picked. */
export function displayView(props: DisplayModelProps, form: DisplayForm, byDensity: boolean): DisplayView {
  const { style, nowPlaying, parts, density = 'auto' } = props;
  const name = style.name.trim() || 'No style';
  const queued = (style.queued ?? '').trim();
  const meta = [style.category, style.timeSignature].filter(Boolean).join(' · ');
  const running = nowPlaying.running ?? false;
  const line = thenLine(nowPlaying);
  const rows = (parts ?? []).map(displayPartView);
  const hasParts = rows.length > 0;
  const chord = nowPlaying.chord;
  return {
    form,
    root: {
      className: 'yh-display',
      attrs: {
        'data-part': 'display',
        'data-material': 'screen',
        'data-form': form,
        'data-density': byDensity ? density : undefined,
        'data-running': running ? 'true' : undefined,
        'data-parts': hasParts ? 'true' : undefined,
      },
    },
    rootStyle: LEAST_CSS[form],
    name,
    queued,
    meta,
    running,
    nowLabel: `${running ? 'Playing' : 'Stopped on'} ${nowPlaying.playing.trim() || 'no section'}`,
    nowLive: running ? 'true' : undefined,
    line,
    hasLine: !!(line.status || line.next || line.when),
    hasThen: !!(line.next || line.when),
    thenDocked: running ? 'true' : undefined,
    thenStyle: { '--yh-display-then-hue': SECTION_STATE_COLOUR.next },
    atStyleTempo: nowPlaying.styleTempo !== undefined && nowPlaying.bpm === nowPlaying.styleTempo,
    beat: running ? (nowPlaying.beat ?? 0) : 0,
    beats: nowPlaying.beats ?? 4,
    tempoKeysInHeader: form === 'minimal',
    parts: rows,
    fitKey: JSON.stringify([name, meta, queued, nowPlaying.playing, nowPlaying.bpm, chord.chord, chord.extension, hasParts, form]),
  };
}
