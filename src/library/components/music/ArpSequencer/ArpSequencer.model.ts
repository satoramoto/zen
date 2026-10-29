// ArpSequencer's model: its props and the tree both renderers draw from them (the chord it
// follows, the degree legend, the 16 × 8 step grid with its stalks and ties, the mode Segmented and
// the four Knobs). No framework: `ArpSequencer.tsx` (React) and `ArpSequencer.svelte` (Svelte) both
// pass `arpSequencerView` and `arpSequencerHandlers` to their `Tree`, with the form the assembled
// screen chose. The grid draws `Segmented` and `Knob` by name, through the view registry.
import { focusRing, pressRing } from '../../../primitives/Ring';
import { surfaceNode } from '../../../primitives/Surface.model';
import { textNode } from '../../../primitives/Text.model';
import { component, each, h, styleText, when, wire, type ComponentNode, type Handlers, type Node } from '../../../view/Tree.model';
import { ARP_DEGREES, ARP_MODES, type ArpState, type ArpStep, type LiveChord } from '../live.model';
import type { ArpSequencerForm } from './ArpSequencer.forms';

/** Every ArpSequencer prop (it takes no framework children). */
export interface ArpSequencerModelProps {
  /** The steps, their mode and the four knobs. Its first sixteen steps are the grid's columns. */
  state: ArpState;
  /** The progression the arp follows. */
  chords: readonly LiveChord[];
  /** Which chord it follows now: an index into `chords`. Default 0. */
  index?: number;
  /** Read-only: the grid, the mode and the knobs are drawn, nothing calls back. */
  disabled?: boolean;
  /** A cell was pressed with that step's next value: toggled on/off, or moved to another degree. */
  onStep?: (index: number, step: ArpStep) => void;
  /** The whole next state: a degree row swapped, the mode chosen, or a knob turned. */
  onState?: (state: ArpState) => void;
}

/** The grid's sixteen columns, whatever the state's array holds. */
export const ARP_COLUMNS = 16;

/** A column with no step of its own: off, on the root. */
const OFF_STEP: ArpStep = { on: false, degree: 0 };

/** One knob step as a fraction of its ladder (a 4 px drag, a key, a wheel notch). */
const KNOB_STEP = 0.02;

/** The rows, top to bottom: the highest degree at the top, the root at the bottom. */
export const ARP_ROWS: readonly number[] = ARP_DEGREES.map((_, degree) => degree).reverse();

/**
 * What a degree sounds as over the chord's voicing: the chord's notes are in degree order (root,
 * third, fifth, seventh …), and the compound degrees repeat one of them an octave up. A chord with
 * fewer notes than the degree falls back round its own notes; with none, "—".
 */
const NOTE_OF_DEGREE = [0, 1, 2, 3, 1, 3, 0, 0] as const;

/** The note a degree sounds as, or "—" when the chord's voicing is unknown. */
export function degreeNote(degree: number, notes: readonly string[]): string {
  if (notes.length === 0) return '—';
  return notes[NOTE_OF_DEGREE[degree] % notes.length];
}

/** The steps the grid draws: the state's first sixteen, with an off root for any it omits. */
export function arpColumns(state: ArpState): readonly ArpStep[] {
  return Array.from({ length: ARP_COLUMNS }, (_, i) => state.steps[i] ?? OFF_STEP);
}

/** A pressed cell's step: its own degree toggles `on`; another degree moves the step there, on. */
export function arpNextStep(step: ArpStep, degree: number): ArpStep {
  return step.degree === degree ? { ...step, on: !step.on } : { ...step, degree, on: true };
}

/** Two degrees swapped, every step following its degree: what a degree row's press asks for. */
export function arpSwapDegrees(state: ArpState, a: number, b: number): ArpState {
  return {
    ...state,
    steps: state.steps.map((step) => (step.degree === a ? { ...step, degree: b } : step.degree === b ? { ...step, degree: a } : step)),
  };
}

/** A step's spoken name: where it is, what it sounds as, and what it is doing. */
function cellName(step: ArpStep, stepIndex: number, degree: number, notes: readonly string[], here: boolean): string {
  const sound = degreeNote(degree, notes);
  const base = `Step ${stepIndex + 1}, ${ARP_DEGREES[degree]}${sound === '—' ? '' : ` = ${sound}`}`;
  if (!here) return `${base}, set`;
  return `${base}, ${step.on ? 'on' : 'off'}${step.tie ? ', tied' : ''}${step.velocity === undefined ? '' : `, velocity ${Math.round(step.velocity * 100)}%`}`;
}

/** One grid cell: a well Surface button, its velocity stalk when the step is on, a tie bar into the next column. */
function cellView(step: ArpStep, stepIndex: number, degree: number, notes: readonly string[], form: ArpSequencerForm, disabled: boolean): Node {
  const here = step.degree === degree;
  const on = here && step.on;
  const tie = on && step.tie === true && stepIndex < ARP_COLUMNS - 1;
  const velocity = Math.min(1, Math.max(0, step.velocity ?? 0.6));
  const cell = surfaceNode(
    {
      as: 'button',
      material: 'well',
      radius: 'control',
      border: here ? 'strong' : true,
      className: `yh-arp__cell ${focusRing} ${pressRing}`,
    },
    {
      type: 'button',
      'data-part': 'cell',
      'data-step': String(stepIndex),
      'data-degree': String(degree),
      'data-on': on ? 'true' : 'false',
      'data-here': here ? 'true' : undefined,
      'data-tie': tie ? 'true' : undefined,
      'aria-pressed': on ? 'true' : 'false',
      'aria-label': cellName(step, stepIndex, degree, notes, here),
      disabled: disabled ? '' : undefined,
    },
    h(
      'span',
      { class: 'yh-arp__meter', 'data-part': 'meter', 'aria-hidden': 'true' },
      on ? h('span', { class: 'yh-arp__stalk', 'data-part': 'stalk', style: styleText({ '--yh-arp-velocity': String(velocity) }) }) : null,
    ),
    when(tie, () => h('span', { class: 'yh-arp__tie', 'data-part': 'tie', 'aria-hidden': 'true' })),
  );
  return wire(cell, disabled ? {} : { on: { click: `cell${stepIndex}_${degree}` } });
}

/** One degree row: its label button (full only) and the sixteen cells. */
function rowView(
  degree: number,
  row: number,
  steps: readonly ArpStep[],
  notes: readonly string[],
  form: ArpSequencerForm,
  disabled: boolean,
): Node {
  const above = ARP_ROWS[row - 1];
  const below = ARP_ROWS[row + 1];
  const neighbour = above ?? below ?? degree;
  return h(
    'div',
    { class: 'yh-arp__row', 'data-part': 'row', 'data-degree': String(degree) },
    form === 'full'
      ? wire(
          textNode(
            { as: 'button', role: 'caption', weight: 'strong', leading: 'tight', className: `yh-arp__degree ${focusRing} ${pressRing}` },
            {
              type: 'button',
              'data-part': 'degree',
              'data-degree': String(degree),
              'aria-label': `Swap degree ${ARP_DEGREES[degree]} with ${ARP_DEGREES[neighbour]}`,
              disabled: disabled ? '' : undefined,
            },
            ARP_DEGREES[degree],
          ),
          disabled ? {} : { on: { click: `swap${degree}` } },
        )
      : null,
    each(
      steps,
      (_, i) => String(i),
      (step, i) => cellView(step, i, degree, notes, form, disabled),
    ),
  );
}

/** A percentage of a 0–1 value, the four knobs' readout. */
const pct = (fraction: number) => `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`;

/** One of the four knobs, drawn by name with its step handler. */
function knob(label: string, name: string, value: string, fraction: number, handler: string, disabled: boolean): ComponentNode {
  return component(
    'Knob',
    { label, name, value, fraction },
    disabled ? {} : { on: { onstep: handler } },
  );
}

/**
 * The tree ArpSequencer draws in the chosen `form`: the head (the chord it follows and, in full, what
 * every degree sounds as), the grid (the degree rows reversed, one cell per step per degree, with
 * stalks and ties), and the foot (the mode Segmented and Rate / Oct / Gate / Swing). Compact drops
 * the degree labels and the degree readout; the 16 × 8 grid stays whole.
 */
export function arpSequencerView({ state, chords, index = 0, disabled = false }: ArpSequencerModelProps, form: ArpSequencerForm): Node {
  const chord = chords[Math.min(Math.max(index, 0), Math.max(chords.length - 1, 0))];
  const notes = chord?.notes ?? [];
  const steps = arpColumns(state);
  return h(
    'div',
    {
      class: 'yh-arp',
      'data-part': 'root',
      'data-form': form,
      'data-disabled': disabled ? 'true' : undefined,
      role: 'group',
      'aria-label': `Arpeggiator${chord ? ` on ${chord.name}` : ''}`,
    },
    h(
      'div',
      { class: 'yh-arp__head', 'data-part': 'head' },
      h(
        'div',
        { class: 'yh-arp__follow', 'data-part': 'follow' },
        textNode({ role: 'caption', case: 'label', leading: 'tight', className: 'yh-arp__follow-label' }, { 'data-part': 'follow-label' }, 'Arp follows'),
        textNode(
          { role: 'heading', leading: 'tight', tone: chord ? 'primary' : 'muted', className: 'yh-arp__chord' },
          { 'data-part': 'chord' },
          chord ? chord.name : '—',
        ),
      ),
      when(form === 'full' && chord !== undefined, () =>
        h(
          'div',
          { class: 'yh-arp__legend', 'data-part': 'legend' },
          each(
            ARP_DEGREES,
            (degree) => degree,
            (degree, degreeIndex) =>
              textNode(
                { role: 'caption', leading: 'tight', className: 'yh-arp__degree-note' },
                { 'data-part': 'degree-note', 'data-degree': String(degreeIndex) },
                `${degree} = ${degreeNote(degreeIndex, notes)}`,
              ),
          ),
        ),
      ),
    ),
    h(
      'div',
      { class: 'yh-arp__grid', 'data-part': 'grid' },
      each(
        ARP_ROWS,
        (degree) => String(degree),
        (degree, row) => rowView(degree, row, steps, notes, form, disabled),
      ),
    ),
    h(
      'div',
      { class: 'yh-arp__foot', 'data-part': 'foot' },
      component(
        'Segmented',
        { items: [...ARP_MODES], index: Math.max(0, ARP_MODES.indexOf(state.mode)), name: 'Mode', label: 'Arpeggiator mode', disabled },
        disabled ? {} : { on: { onChange: 'mode' } },
      ),
      h(
        'div',
        { class: 'yh-arp__knobs', 'data-part': 'knobs' },
        knob('Rate', 'Arpeggiator rate', pct(state.rate), state.rate, 'rate', disabled),
        knob('Oct', 'Arpeggiator octaves', String(state.octaves), (Math.min(4, Math.max(1, state.octaves)) - 1) / 3, 'oct', disabled),
        knob('Gate', 'Arpeggiator gate', pct(state.gate), state.gate, 'gate', disabled),
        knob('Swing', 'Arpeggiator swing', pct(state.swing), state.swing, 'swing', disabled),
      ),
    ),
  );
}

/** The callbacks the tree names: a cell per step and degree, a degree row's swap, the mode and the four knobs. */
export function arpSequencerHandlers({ state, disabled = false, onStep, onState }: ArpSequencerModelProps): Handlers {
  if (disabled) return {};
  const handlers: Handlers = {};
  const steps = arpColumns(state);
  steps.forEach((step, i) => {
    ARP_DEGREES.forEach((_, degree) => {
      handlers[`cell${i}_${degree}`] = () => onStep?.(i, arpNextStep(step, degree));
    });
  });
  ARP_ROWS.forEach((degree, row) => {
    const neighbour = ARP_ROWS[row - 1] ?? ARP_ROWS[row + 1] ?? degree;
    handlers[`swap${degree}`] = () => onState?.(arpSwapDegrees(state, degree, neighbour));
  });
  handlers.mode = (next: number) => {
    const mode = ARP_MODES[next];
    if (mode !== undefined) onState?.({ ...state, mode });
  };
  handlers.rate = (delta: number) => onState?.({ ...state, rate: Math.min(1, Math.max(0, state.rate + delta * KNOB_STEP)) });
  handlers.gate = (delta: number) => onState?.({ ...state, gate: Math.min(1, Math.max(0, state.gate + delta * KNOB_STEP)) });
  handlers.swing = (delta: number) => onState?.({ ...state, swing: Math.min(1, Math.max(0, state.swing + delta * KNOB_STEP)) });
  handlers.oct = (delta: number) => onState?.({ ...state, octaves: Math.min(4, Math.max(1, Math.round(state.octaves + delta))) });
  return handlers;
}
