// SongForm's model: its props, the song's form, and the view a renderer draws (the root, the form
// with its parts, steps and spoken cue, and the transport's keys, each with the props its control
// takes). No framework: `SongForm.tsx` (React) and `SongForm.svelte` (Svelte) both render
// `songFormView`, after reading each half's form (`useForm` / `getForm`).
import type { ButtonModelProps } from '../../components/core/Button/Button.model';
import type { LampButtonModelProps } from '../../components/core/LampButton/LampButton.model';
import type { PadModelProps, PadState, TipAction } from '../../components/music/Pad/Pad.model';
import type { StackModelProps } from '../../primitives/Stack.model';
import type { ElementView, TextModelProps } from '../../primitives/Text.model';
import type { SectionState } from '../hues';
import type { FormFormId, TransportFormId } from './SongForm.forms';

export type { TipAction };

/** A section of the song, in the order the song runs, plus Break. */
export type SectionId =
  | 'intro1'
  | 'intro2'
  | 'intro3'
  | 'mainA'
  | 'mainB'
  | 'mainC'
  | 'mainD'
  | 'ending1'
  | 'ending2'
  | 'ending3'
  | 'break';

export type SongFormSectionPart = 'intro' | 'main' | 'ending';

export interface SectionDef {
  id: SectionId;
  /** The step's face inside its part ("I", "B"); the part's caption says which part. */
  step: string;
  /** The full name, spoken and used in the cue ("Main B"). */
  label: string;
  tip: string;
}

/** A no-break space: a section's name never wraps between its words. */
const NB = ' ';

/** The song's form: its three parts in order, each its steps in order. */
export const FORM: readonly { part: SongFormSectionPart; caption: string; steps: readonly SectionDef[] }[] = [
  {
    part: 'intro',
    caption: 'Intro',
    steps: [
      { id: 'intro1', step: 'I', label: `Intro${NB}I`, tip: 'section.intro1' },
      { id: 'intro2', step: 'II', label: `Intro${NB}II`, tip: 'section.intro2' },
      { id: 'intro3', step: 'III', label: `Intro${NB}III`, tip: 'section.intro3' },
    ],
  },
  {
    part: 'main',
    caption: 'Main',
    steps: [
      { id: 'mainA', step: 'A', label: `Main${NB}A`, tip: 'section.main_a' },
      { id: 'mainB', step: 'B', label: `Main${NB}B`, tip: 'section.main_b' },
      { id: 'mainC', step: 'C', label: `Main${NB}C`, tip: 'section.main_c' },
      { id: 'mainD', step: 'D', label: `Main${NB}D`, tip: 'section.main_d' },
    ],
  },
  {
    part: 'ending',
    caption: 'Ending',
    steps: [
      { id: 'ending1', step: 'I', label: `Ending${NB}I`, tip: 'section.ending1' },
      { id: 'ending2', step: 'II', label: `Ending${NB}II`, tip: 'section.ending2' },
      { id: 'ending3', step: 'III', label: `Ending${NB}III`, tip: 'section.ending3' },
    ],
  },
];

export const BREAK: SectionDef = { id: 'break', step: 'Break', label: 'Break', tip: 'section.break' };

/** Every section's full name, by id. */
export const SECTION_LABEL: Record<SectionId, string> = Object.fromEntries(
  [...FORM.flatMap((p) => p.steps), BREAK].map((s) => [s.id, s.label]),
) as Record<SectionId, string>;

/** Which half of the region a SongForm draws. */
export type SongFormPart = 'both' | 'form' | 'transport';

export interface SongFormProps {
  /** The style is running: Start / Stop shows Stop on the running face, and is pressed. */
  running?: boolean;
  /** What plays now; while stopped, the section the band will start from (underlined, not filled). */
  playing?: SectionId;
  /** What is queued to play next (marked NEXT on the form). */
  next?: SectionId;
  /** When the queued change lands ("after bar 4"): spoken with the next section and in the cue. */
  nextAt?: string;
  /** Sections this style doesn't have: drawn as absent, and a press does nothing. */
  absent?: readonly SectionId[];
  /** A fill is queued by Fill ▲ or Fill ▼: that key waits, and the spoken cue says "Fill, then …". */
  fillPending?: 'up' | 'down';
  /** Accompaniment (ACMP) on. */
  accomp?: boolean;
  /** Sync Start armed: the style starts with the first chord played. */
  syncStart?: boolean;
  /** Sync Stop on: the style stops when every key of the chord section is released. */
  syncStop?: boolean;
  /** Auto Fill on: every section change plays a fill first. */
  autoFill?: boolean;
  /** A fade is under way (or, while stopped, a fade-in waits for Start). */
  fading?: boolean;
  /** The flash phase of the queued section and the waiting keys; the parent drives it. */
  lit?: boolean;
  /** The app's tooltip action, passed to every control. */
  tipAction?: TipAction;
  /** A section (or Break) was pressed: queue it (PadBank's `onpress` on a section pad). */
  onSection?: (id: SectionId) => void;
  /** Start / Stop pressed (SectionRow's and TransportColumn's `onstartstop`, pad 16). */
  onStartStop?: () => void;
  /** Start / Stop held while running: stop with a fade (TransportColumn's `onstoplong`). */
  onStopWithFade?: () => void;
  /** Accomp pressed, with the state asked for (SectionRow's `onaccomp`). */
  onAccomp?: (on: boolean) => void;
  /** Sync Start pressed, with the state asked for (SectionRow's `onsyncstart`; the Sync Start pad). */
  onSyncStart?: (on: boolean) => void;
  /** Sync Stop pressed, with the state asked for (the Sync Stop pad). */
  onSyncStop?: (on: boolean) => void;
  /** Auto Fill pressed, with the state asked for (the Auto Fill pad). */
  onAutoFill?: (on: boolean) => void;
  /** Fill ▲ pressed: a fill, then the next Main up (SectionRow's and TransportColumn's `onfillup`). */
  onFillUp?: () => void;
  /** Fill ▼ pressed: a fill, then the next Main down (`onfilldown`). */
  onFillDown?: () => void;
  /** Fade pressed (`onfade`). */
  onFade?: () => void;
  /** Reset pressed: restart the section from its first bar (`onreset`). */
  onReset?: () => void;
  /**
   * Which half to draw: `both` (the default: the form over the transport), or only the `form` or
   * the `transport`, for a screen that places them apart (the Stage puts the transport beside the
   * hero). Each half fills the box it is given; its forms (`FORM_FORMS`, `TRANSPORT_FORMS`,
   * `SONG_FORM_FORMS` for both) say what that box must hold.
   */
  part?: SongFormPart;
  /**
   * The transport's form, pinned: `keys` (two rows, Start / Stop tall), `tight` (three rows,
   * Start / Stop tall) or `compact` (Start / Stop down the left, a row a job). Unset, the
   * assembled screen's choice for the region (its `transport` part in `both`), else `keys`.
   */
  transportForm?: TransportFormId;
  /**
   * The song form strip's form, pinned: `strip` (captions over the steps) or `folded` (each
   * caption before its steps, shorter). Unset, the assembled screen's choice (its `form` part in
   * `both`), else `strip`.
   */
  formForm?: FormFormId;
}

/** A Stack the renderer draws: its own props, its class and attributes. */
export interface StackView extends ElementView {
  stack: Omit<StackModelProps, 'className'> & { as?: 'ol' | 'li' };
}

/** A Text the renderer draws: its props, class, attributes and words. */
export interface TextView extends ElementView {
  text: TextModelProps;
  word: string;
}

/** One step: its wrapping `div` and the Pad inside. */
export interface StepView extends ElementView {
  id: SectionId;
  pad: PadModelProps;
}

/** One part of the form: its `li` Stack, the arrow before it (none for the first), its caption and steps. */
export interface PartView extends StackView {
  part: SongFormSectionPart;
  arrow?: TextView;
  caption: TextView;
  steps: ElementView;
  items: StepView[];
}

/** The form half. */
export interface FormView extends StackView {
  /** The spoken cue: a visually hidden status `span`. */
  cue: ElementView & { word: string };
  /** The `ol` of parts. */
  parts: StackView;
  items: PartView[];
  /** The insert group (Break), its steps `div` and Break's step. */
  mods: StackView;
  modSteps: ElementView;
  brk: StepView;
}

/** One transport key: its wrapping `div`, and a Button's or a LampButton's props. */
export type KeyView = ElementView & { key: string } & (
    | { kind: 'button'; button: ButtonModelProps }
    | { kind: 'lamp'; lamp: LampButtonModelProps }
  );

/** The transport half: its group `div`, Start / Stop's cell and the other keys. */
export interface TransportView extends ElementView {
  start: ElementView;
  startButton: ButtonModelProps;
  keys: KeyView[];
}

/** What a renderer draws: two Texts (root, inner) around the halves it draws. */
export interface SongFormView {
  root: ElementView;
  inner: ElementView;
  form?: FormView;
  transport?: TransportView;
}

const key = (name: string): ElementView => ({ className: 'yh-songform__key', attrs: { 'data-part': 'key', 'data-key': name } });

/**
 * The view. `formId` and `transportId` are each half's form, as `useForm` / `getForm` read them
 * (by part name: `form`, `transport`).
 */
export function songFormView(props: SongFormProps, formId: FormFormId, transportId: TransportFormId): SongFormView {
  const {
    running = false,
    playing,
    next,
    nextAt,
    absent = [],
    fillPending,
    accomp = false,
    syncStart = false,
    syncStop = false,
    autoFill = false,
    fading = false,
    lit = true,
    tipAction,
    onSection,
    onStartStop,
    onStopWithFade,
    onAccomp,
    onSyncStart,
    onSyncStop,
    onAutoFill,
    onFillUp,
    onFillDown,
    onFade,
    onReset,
    part = 'both',
  } = props;
  const rootForm = part === 'form' ? formId : part === 'transport' ? transportId : undefined;
  const missing = new Set(absent);

  const stateOf = (id: SectionId): SectionState =>
    missing.has(id) ? 'absent' : id === playing ? 'playing' : id === next ? 'next' : 'idle';

  // Only a sounding section fills: stopped, the section the band starts from is an idle pad,
  // underlined (data-start) and named "starts here".
  const padState = (id: SectionId): PadState => {
    const state = stateOf(id);
    if (state === 'absent') return 'dark';
    if (state === 'playing') return running ? 'playing' : 'idle';
    return state;
  };

  const nameOf = (s: SectionDef): string => {
    const label = s.label.replace(NB, ' ');
    switch (stateOf(s.id)) {
      case 'absent':
        return `${label}, not in this style`;
      case 'playing':
        return running ? `${label}, playing` : `${label}, starts here`;
      case 'next':
        return `${label}, next${nextAt ? `, ${nextAt}` : ''}`;
      default:
        return label;
    }
  };

  const step = (s: SectionDef): StepView => {
    const state = stateOf(s.id);
    return {
      id: s.id,
      className: 'yh-songform__step',
      attrs: {
        'data-part': 'step',
        'data-section': s.id,
        'data-state': state,
        'data-start': state === 'playing' && !running ? 'true' : undefined,
      },
      pad: {
        label: s.step,
        state: padState(s.id),
        lit,
        tagCorner: true,
        accentNext: true,
        fillCell: true,
        disabled: missing.has(s.id),
        name: nameOf(s),
        tip: s.tip,
        tipAction,
        onPress: () => onSection?.(s.id),
      },
    };
  };

  // The cue: spoken only. "Next" is drawn once on screen, in the hero, and on the form's NEXT tag.
  const nextLabel = next && !missing.has(next) ? SECTION_LABEL[next].replace(NB, ' ') : '';
  const when = nextAt ? `, ${nextAt}` : '';
  const cues: string[] = [];
  if (fillPending) cues.push(nextLabel ? `Fill, then ${nextLabel}${when}` : 'Fill');
  else if (nextLabel) cues.push(`Next: ${nextLabel}${when}`);
  if (!running && syncStart) cues.push('Starts with the first chord');

  const stepsView: ElementView = { className: 'yh-songform__steps', attrs: { 'data-part': 'steps' } };

  const form: FormView | undefined =
    part === 'transport'
      ? undefined
      : {
          stack: { direction: 'row', gap: 6, align: 'stretch' },
          className: 'yh-songform__form',
          attrs: { 'data-part': 'form', 'data-form': formId, role: 'group', 'aria-label': 'Sections' },
          cue: { className: 'yh-songform__cue', attrs: { 'data-part': 'cue', role: 'status' }, word: cues.join('. ') },
          parts: {
            stack: { as: 'ol', direction: 'row', gap: 6, align: 'stretch' },
            className: 'yh-songform__parts',
            attrs: { 'data-part': 'groups' },
          },
          items: FORM.map(({ part: p, caption, steps }, i) => ({
            part: p,
            stack: { as: 'li', direction: 'column', gap: 0 },
            className: 'yh-songform__part',
            attrs: { 'data-part': 'group', 'data-group': p },
            // The arrow between parts: the song runs left to right.
            arrow:
              i > 0
                ? {
                    text: { tone: 'muted', leading: 'tight' },
                    className: 'yh-songform__arrow',
                    attrs: { 'data-part': 'arrow', 'aria-hidden': 'true' },
                    word: '→',
                  }
                : undefined,
            caption: {
              text: { role: 'caption', tone: 'muted', case: 'label' },
              className: 'yh-songform__caption',
              attrs: { 'data-part': 'caption', 'aria-hidden': 'true' },
              word: caption,
            },
            steps: stepsView,
            items: steps.map(step),
          })),
          mods: {
            stack: { direction: 'column', gap: 0 },
            className: 'yh-songform__mods',
            attrs: { 'data-part': 'mods', role: 'group', 'aria-label': 'Insert' },
          },
          modSteps: stepsView,
          brk: step(BREAK),
        };

  const fadeFace: Pick<ButtonModelProps, 'on' | 'waiting'> = fading ? (running ? { on: true } : { waiting: true }) : {};

  const transport: TransportView | undefined =
    part === 'form'
      ? undefined
      : {
          className: 'yh-songform__transport',
          attrs: { 'data-part': 'transport', 'data-form': transportId, role: 'group', 'aria-label': 'Transport' },
          start: { className: 'yh-songform__start', attrs: { 'data-part': 'start' } },
          startButton: {
            label: running ? 'Stop' : 'Start',
            size: 'cell',
            tall: true,
            variant: running ? 'secondary' : 'primary',
            hue: running ? 'ok' : 'role-2',
            pressed: running,
            name: running ? 'Start / Stop, running (hold to stop with a fade)' : 'Start / Stop, stopped',
            tip: 'transport.start_stop',
            tipAction,
            onPress: onStartStop,
            onLongPress: running ? onStopWithFade : undefined,
          },
          keys: [
            {
              ...key('sync-start'),
              key: 'sync-start',
              kind: 'button',
              button: {
                label: 'Sync Start',
                size: 'cell',
                hue: 'role-2',
                waiting: syncStart,
                lit,
                pressed: syncStart,
                name: syncStart ? 'Sync Start, armed' : 'Sync Start',
                tip: 'transport.sync_start',
                tipAction,
                onPress: () => onSyncStart?.(!syncStart),
              },
            },
            {
              ...key('sync-stop'),
              key: 'sync-stop',
              kind: 'button',
              button: {
                label: 'Sync Stop',
                size: 'cell',
                hue: 'role-2',
                waiting: syncStop,
                pressed: syncStop,
                tip: 'transport.sync_stop',
                tipAction,
                onPress: () => onSyncStop?.(!syncStop),
              },
            },
            {
              ...key('fill-up'),
              key: 'fill-up',
              kind: 'button',
              button: {
                label: 'Fill',
                symbol: 'up',
                size: 'cell',
                hue: 'role-2',
                waiting: fillPending === 'up',
                lit,
                name: `Fill Up: a fill, then the next Main up${fillPending === 'up' ? ', queued' : ''}`,
                tip: 'transport.fill_up',
                tipAction,
                onPress: onFillUp,
              },
            },
            {
              ...key('fill-down'),
              key: 'fill-down',
              kind: 'button',
              button: {
                label: 'Fill',
                symbol: 'down',
                size: 'cell',
                hue: 'role-2',
                waiting: fillPending === 'down',
                lit,
                name: `Fill Down: a fill, then the next Main down${fillPending === 'down' ? ', queued' : ''}`,
                tip: 'transport.fill_down',
                tipAction,
                onPress: onFillDown,
              },
            },
            {
              ...key('fade'),
              key: 'fade',
              kind: 'button',
              button: {
                label: 'Fade',
                size: 'cell',
                ...fadeFace,
                lit,
                pressed: fading,
                name: fading ? (running ? 'Fade, fading' : 'Fade in, waiting for Start') : running ? 'Fade out' : 'Fade in',
                tip: 'transport.fade',
                tipAction,
                onPress: onFade,
              },
            },
            {
              ...key('reset'),
              key: 'reset',
              kind: 'button',
              button: {
                label: 'Reset',
                size: 'cell',
                name: 'Section reset: restart the section from its first bar',
                tip: 'transport.section_reset',
                tipAction,
                onPress: onReset,
              },
            },
            {
              ...key('accomp'),
              key: 'accomp',
              kind: 'lamp',
              lamp: {
                label: 'Accomp',
                name: 'Accomp (ACMP)',
                size: 'cell',
                on: accomp,
                tip: 'transport.acmp',
                tipAction,
                onToggle: onAccomp,
              },
            },
            {
              ...key('auto-fill'),
              key: 'auto-fill',
              kind: 'lamp',
              lamp: {
                label: 'Auto Fill',
                size: 'cell',
                hue: 'role-2',
                on: autoFill,
                tip: 'transport.auto_fill',
                tipAction,
                onToggle: onAutoFill,
              },
            },
          ],
        };

  return {
    // The root is a Text only for its size (one control height, the container queries' em); the
    // inner body Text sets the real type back to the body recipe.
    root: { className: 'yh-songform', attrs: { 'data-part': 'root', 'data-half': part, 'data-form': rootForm } },
    inner: { className: 'yh-songform__inner', attrs: { 'data-part': 'inner' } },
    form,
    transport,
  };
}
