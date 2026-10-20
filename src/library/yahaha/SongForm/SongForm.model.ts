// SongForm's model: its props, the song's form, and the tree a renderer draws (the root, the form
// with its parts, steps and spoken cue, and the transport's keys, each control a Pad, Button or
// LampButton drawn by name). No framework: `SongForm.tsx` (React) and `SongForm.svelte` (Svelte)
// both pass `songFormView` to their `Tree`, after reading each half's form (`useForm` / `getForm`).
import type { ButtonModelProps } from '../../components/core/Button/Button.model';
import type { PadState, TipAction } from '../../components/music/Pad/Pad.model';
import { stackView, type StackModelProps } from '../../primitives/Stack.model';
import { textView, type TextModelProps } from '../../primitives/Text.model';
import { component, each, h, type Child, type Handlers, type Node } from '../../view/Tree.model';
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

/** Every section, in the form's order, then Break. */
const SECTIONS: readonly SectionDef[] = [...FORM.flatMap((p) => p.steps), BREAK];

/** Every section's full name, by id. */
export const SECTION_LABEL: Record<SectionId, string> = Object.fromEntries(SECTIONS.map((s) => [s.id, s.label])) as Record<SectionId, string>;

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

/** What SongForm draws: its tree. */
export type SongFormView = Node;

type Attrs = Record<string, string | undefined>;

/** A Stack element: the caller's attributes, then the Stack's class and `data-*` (as `Stack.tsx` orders them). */
const stack = (tag: 'div' | 'ol' | 'li', props: StackModelProps, attrs: Attrs, ...children: (Child | null)[]): Node => {
  const view = stackView(props);
  return h(tag, { ...attrs, class: view.className, ...view.attrs }, ...children);
};

/** A Text element: the Text's class and `data-*`, then the caller's attributes (as `Text.tsx` orders them). */
const text = (tag: 'div' | 'span', props: TextModelProps, attrs: Attrs, ...children: (Child | null)[]): Node => {
  const view = textView(props);
  return h(tag, { class: view.className, ...view.attrs, ...attrs }, ...children);
};

/** A section's handler key (its Pad's `onPress`). */
const sectionKey = (id: SectionId) => `section:${id}`;

/** Every child control's tooltip goes through `handlers.tipAction`. */
const TIP = { tipAction: 'tipAction' } as const;

/**
 * The tree. `formId` and `transportId` are each half's form, as `useForm` / `getForm` read them
 * (by part name: `form`, `transport`).
 */
export function songFormView(props: SongFormProps, formId: FormFormId, transportId: TransportFormId): Node {
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
    onStopWithFade,
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

  /** One step: its wrapping `div` and the Pad inside. */
  const step = (s: SectionDef): Node => {
    const state = stateOf(s.id);
    return h(
      'div',
      {
        class: 'yh-songform__step',
        'data-part': 'step',
        'data-section': s.id,
        'data-state': state,
        'data-start': state === 'playing' && !running ? 'true' : undefined,
      },
      component(
        'Pad',
        {
          label: s.step,
          state: padState(s.id),
          lit,
          tagCorner: true,
          accentNext: true,
          fillCell: true,
          disabled: missing.has(s.id),
          name: nameOf(s),
          tip: s.tip,
        },
        { on: { onPress: sectionKey(s.id), ...TIP } },
      ),
    );
  };

  const steps = (...children: Node[]) => h('div', { class: 'yh-songform__steps', 'data-part': 'steps' }, ...children);

  // The cue: spoken only. "Next" is drawn once on screen, in the hero, and on the form's NEXT tag.
  const nextLabel = next && !missing.has(next) ? SECTION_LABEL[next].replace(NB, ' ') : '';
  const when = nextAt ? `, ${nextAt}` : '';
  const cues: string[] = [];
  if (fillPending) cues.push(nextLabel ? `Fill, then ${nextLabel}${when}` : 'Fill');
  else if (nextLabel) cues.push(`Next: ${nextLabel}${when}`);
  if (!running && syncStart) cues.push('Starts with the first chord');

  const form =
    part === 'transport'
      ? null
      : stack(
          'div',
          { direction: 'row', gap: 6, align: 'stretch', className: 'yh-songform__form' },
          { 'data-part': 'form', 'data-form': formId, role: 'group', 'aria-label': 'Sections' },
          h('span', { class: 'yh-songform__cue', 'data-part': 'cue', role: 'status' }, cues.join('. ')),
          stack(
            'ol',
            { direction: 'row', gap: 6, align: 'stretch', className: 'yh-songform__parts' },
            { 'data-part': 'groups' },
            ...each(
              FORM,
              (p) => p.part,
              ({ part: p, caption, steps: defs }, i) =>
                stack(
                  'li',
                  { direction: 'column', gap: 0, className: 'yh-songform__part' },
                  { 'data-part': 'group', 'data-group': p },
                  // The arrow between parts: the song runs left to right.
                  i > 0
                    ? text('span', { tone: 'muted', leading: 'tight', className: 'yh-songform__arrow' }, { 'data-part': 'arrow', 'aria-hidden': 'true' }, '→')
                    : null,
                  text(
                    'span',
                    { role: 'caption', tone: 'muted', case: 'label', className: 'yh-songform__caption' },
                    { 'data-part': 'caption', 'aria-hidden': 'true' },
                    caption,
                  ),
                  steps(...each(defs, (s) => s.id, step)),
                ),
            ),
          ),
          stack(
            'div',
            { direction: 'column', gap: 0, className: 'yh-songform__mods' },
            { 'data-part': 'mods', role: 'group', 'aria-label': 'Insert' },
            steps(step(BREAK)),
          ),
        );

  const fadeFace: Pick<ButtonModelProps, 'on' | 'waiting'> = fading ? (running ? { on: true } : { waiting: true }) : {};

  /** One transport key: its wrapping `div` and its Button or LampButton, `press` its handler key. */
  const key = (name: string, kind: 'Button' | 'LampButton', control: Record<string, unknown>, press: string): Node => ({
    ...h(
      'div',
      { class: 'yh-songform__key', 'data-part': 'key', 'data-key': name },
      component(kind, control, { on: { [kind === 'Button' ? 'onPress' : 'onToggle']: press, ...TIP } }),
    ),
    key: name,
  });

  const transport =
    part === 'form'
      ? null
      : h(
          'div',
          { class: 'yh-songform__transport', 'data-part': 'transport', 'data-form': transportId, role: 'group', 'aria-label': 'Transport' },
          h(
            'div',
            { class: 'yh-songform__start', 'data-part': 'start' },
            component(
              'Button',
              {
                label: running ? 'Stop' : 'Start',
                size: 'cell',
                tall: true,
                variant: running ? 'secondary' : 'primary',
                hue: running ? 'ok' : 'role-2',
                pressed: running,
                name: running ? 'Start / Stop, running (hold to stop with a fade)' : 'Start / Stop, stopped',
                tip: 'transport.start_stop',
              },
              // Held while running: stop with a fade (a Button with no `onLongPress` has no long press).
              { on: { onPress: 'startStop', ...(running && onStopWithFade !== undefined ? { onLongPress: 'stopWithFade' } : {}), ...TIP } },
            ),
          ),
          key(
            'sync-start',
            'Button',
            {
              label: 'Sync Start',
              size: 'cell',
              hue: 'role-2',
              waiting: syncStart,
              lit,
              pressed: syncStart,
              name: syncStart ? 'Sync Start, armed' : 'Sync Start',
              tip: 'transport.sync_start',
            },
            'syncStart',
          ),
          key(
            'sync-stop',
            'Button',
            { label: 'Sync Stop', size: 'cell', hue: 'role-2', waiting: syncStop, pressed: syncStop, tip: 'transport.sync_stop' },
            'syncStop',
          ),
          key(
            'fill-up',
            'Button',
            {
              label: 'Fill',
              symbol: 'up',
              size: 'cell',
              hue: 'role-2',
              waiting: fillPending === 'up',
              lit,
              name: `Fill Up: a fill, then the next Main up${fillPending === 'up' ? ', queued' : ''}`,
              tip: 'transport.fill_up',
            },
            'fillUp',
          ),
          key(
            'fill-down',
            'Button',
            {
              label: 'Fill',
              symbol: 'down',
              size: 'cell',
              hue: 'role-2',
              waiting: fillPending === 'down',
              lit,
              name: `Fill Down: a fill, then the next Main down${fillPending === 'down' ? ', queued' : ''}`,
              tip: 'transport.fill_down',
            },
            'fillDown',
          ),
          key(
            'fade',
            'Button',
            {
              label: 'Fade',
              size: 'cell',
              ...fadeFace,
              lit,
              pressed: fading,
              name: fading ? (running ? 'Fade, fading' : 'Fade in, waiting for Start') : running ? 'Fade out' : 'Fade in',
              tip: 'transport.fade',
            },
            'fade',
          ),
          key(
            'reset',
            'Button',
            { label: 'Reset', size: 'cell', name: 'Section reset: restart the section from its first bar', tip: 'transport.section_reset' },
            'reset',
          ),
          key('accomp', 'LampButton', { label: 'Accomp', name: 'Accomp (ACMP)', size: 'cell', on: accomp, tip: 'transport.acmp' }, 'accomp'),
          key('auto-fill', 'LampButton', { label: 'Auto Fill', size: 'cell', hue: 'role-2', on: autoFill, tip: 'transport.auto_fill' }, 'autoFill'),
        );

  // The root is a Text only for its size (one control height, the container queries' em); the
  // inner body Text sets the real type back to the body recipe.
  return text(
    'div',
    { className: 'yh-songform' },
    { 'data-part': 'root', 'data-half': part, 'data-form': rootForm },
    text('div', { className: 'yh-songform__inner' }, { 'data-part': 'inner' }, form, transport),
  );
}

/** The callbacks `songFormView`'s tree names: each section's press (`section:<id>`), the transport's
 *  keys (a switch asks for the state it doesn't have) and the tooltip action. */
export function songFormHandlers(props: SongFormProps): Handlers {
  const { syncStart = false, syncStop = false } = props;
  return {
    ...Object.fromEntries(SECTIONS.map((s) => [sectionKey(s.id), () => props.onSection?.(s.id)])),
    startStop: props.onStartStop,
    stopWithFade: props.onStopWithFade,
    syncStart: () => props.onSyncStart?.(!syncStart),
    syncStop: () => props.onSyncStop?.(!syncStop),
    fillUp: props.onFillUp,
    fillDown: props.onFillDown,
    fade: props.onFade,
    reset: props.onReset,
    accomp: props.onAccomp,
    autoFill: props.onAutoFill,
    tipAction: props.tipAction,
  };
}
