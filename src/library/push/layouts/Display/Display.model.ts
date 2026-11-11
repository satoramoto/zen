// The Display's model: a `Screen` description drawn in the unit's 960 by 160 box (openspec:
// push-display). No framework: `Display.tsx` and `Display.svelte` both pass `displayView` and
// `displayHandlers` to their `Tree`, with the scope's facets (for the dark ground).
//
// The box is eight columns, a top row over the upper display buttons, a body, and a bottom row
// over the lower ones. Everything in it is an existing component in a cell the display owns
// (docs/push.md, "The fit review"): a parameter is a `KnobReadout`, a `Toggle`, a `Slider` or a
// `FolderList`; a list is a `FolderList`; a drawing is a `Trace`; words are `Text`. The cell says
// where it is and what colour it belongs to, by restating the variables those components read.
// The display knows a screen's parts, never which screen it is.
import { toCssVars, type Facets } from '../../../contract';
import { lampVars } from '../../../foundation/themes/lamps';
import { textNode } from '../../../primitives/Text/Text.model';
import { component, h, styleText, wire, type Child, type ChildArg, type Handlers, type Node } from '../../../foundation/view/Tree.model';
import { DISPLAY, encoderId } from '../../model/layout';
import type { BodyCell, ListCell, ListItem, Overlay, ParamCell, PushFrame, PushInput, RowCell, Screen } from '../../model/types';
import { colourCss } from '../lamp';

export interface DisplayModelProps {
  /** What to show. Without one, or with a `blank` one, the display is dark. */
  screen?: Screen;
  /** Keep a dark ground whatever the pack's mode, as a lit screen does. Default true. */
  dark?: boolean;
  /** The display's light, 0 to 100. Default 100. */
  light?: number;
  /** Called when a parameter on the screen is turned or switched with the pointer or keys: reported as its column's encoder. */
  onInput?: (input: PushInput) => void;
  /** The app's fast values (levels, the song position), read once a frame by the parts that move at their own rate. */
  frame?: () => PushFrame | undefined;
  className?: string;
}

/** How many rows of a list fit in the body. */
export const LIST_ROWS = 5;

/** The rows of a list in view, keeping the chosen one visible, and whether more exist above and below. */
export function listWindow(items: readonly ListItem[], chosen: string | undefined, rows = LIST_ROWS): { items: ListItem[]; more: { above: boolean; below: boolean } } {
  const at = Math.max(0, items.findIndex((i) => i.id === chosen));
  const start = Math.min(Math.max(0, at - Math.floor(rows / 2)), Math.max(0, items.length - rows));
  return { items: items.slice(start, start + rows), more: { above: start > 0, below: start + rows < items.length } };
}

const ICON: Record<NonNullable<RowCell['icon']>, string> = {
  midi: '♪', audio: '∿', group: '▣', return: '↩', main: '▬', instrument: '♪', effect: '∿', 'midi-effect': '⋯', rack: '▤', 'drum-rack': '▦', folder: '▸', left: '‹', right: '›', close: '✕', plus: '+', check: '✓',
};
const ICON_NAME: Record<NonNullable<RowCell['icon']>, string> = {
  midi: 'MIDI track', audio: 'audio track', group: 'group', return: 'return', main: 'Main', instrument: 'instrument', effect: 'effect', 'midi-effect': 'MIDI effect', rack: 'Rack', 'drum-rack': 'Drum Rack', folder: 'folder', left: 'more to the left', right: 'more to the right', close: 'close', plus: 'add', check: 'done',
};

const lamp = (colour: RowCell['colour'] | undefined) => (colour === undefined ? undefined : colourCss(colour));

/** One cell of the top or bottom row: a name in its colour, a solid block when selected. */
function tab(cell: RowCell | null, row: 'top' | 'bottom', col: number): Node {
  const base = { class: 'push-display__tab', 'data-row': row, 'data-col': String(col) };
  if (!cell) return h('div', { ...base, 'data-empty': 'true' });
  return h(
    'div',
    {
      ...base,
      'data-selected': cell.selected ? 'true' : undefined,
      'data-dim': cell.dim ? 'true' : undefined,
      'data-fold': cell.fold,
      'data-icon': cell.icon,
      style: styleText({ '--push-lamp': lamp(cell.colour) }),
    },
    cell.icon ? textNode({ role: 'label', leading: 'tight' }, { 'data-part': 'icon', role: 'img', 'aria-label': ICON_NAME[cell.icon] }, ICON[cell.icon]) : null,
    cell.label ? textNode({ role: 'label', leading: 'tight', truncate: true }, { 'data-part': 'label' }, cell.label) : null,
    cell.armed ? h('span', { class: 'push-display__armed', 'data-part': 'armed', role: 'img', 'aria-label': 'armed' }) : null,
    cell.progress === undefined
      ? null
      : h('span', { class: 'push-display__progress', 'data-part': 'progress', role: 'progressbar', 'aria-label': 'clip progress', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(cell.progress * 100)), style: styleText({ '--push-fraction': String(cell.progress) }) }),
  );
}

const LEVEL = { kind: 'float', min: 0, max: 1, defaultValue: 0 } as const;

/** A parameter: an arc, a centred arc, a switch, a bar, or a list of choices with the current one marked. */
function param(cell: ParamCell & { col: number }): ChildArg {
  const hue = cell.colour === undefined ? {} : { hue: 1 };
  const name = `${cell.name} ${cell.value}${cell.unit ?? ''}`;
  if (cell.style === 'choice') {
    const items = (cell.choices ?? []).map((label, i) => ({ id: String(i), label }));
    const view = listWindow(items, String(cell.chosen ?? 0), LIST_ROWS - 1);
    return [
      textNode({ role: 'caption', weight: 'strong', truncate: true, leading: 'tight' }, { 'data-part': 'name' }, cell.name),
      component('FolderList', { label: name, items: view.items, chosen: String(cell.chosen ?? 0) }),
    ];
  }
  if (cell.style === 'value') {
    return [
      textNode({ role: 'caption', weight: 'strong', truncate: true, leading: 'tight' }, { 'data-part': 'name' }, cell.name),
      textNode({ role: 'numeral', truncate: true, leading: 'tight' }, { 'data-part': 'value', 'aria-label': name }, `${cell.value}${cell.unit ?? ''}`),
    ];
  }
  if (cell.style === 'switch') {
    return component('Toggle', { on: cell.fraction >= 0.5, name: cell.name, label: name, layout: 'stacked', disabled: cell.disabled, ink: 'var(--push-lit)' }, { on: { onChange: `switch:${cell.col}` }, slots: { children: [cell.value] } });
  }
  if (cell.style === 'bar') {
    return component('Slider', { param: LEVEL, value: cell.fraction, name: cell.name, label: name, display: `${cell.value}${cell.unit ?? ''}`, layout: 'stacked', orientation: 'horizontal', length: 'auto', showValue: true, disabled: cell.disabled, ink: 'var(--push-lit)' }, { on: { onChange: 'none' } });
  }
  return component(
    'KnobReadout',
    { label: cell.name, value: cell.value, unit: cell.unit ?? '', fraction: cell.fraction, name, ...(cell.style === 'bipolar' ? { origin: 'center' } : {}), ...hue },
    { on: { onstep: `turn:${cell.col}` } },
  );
}

function list(cell: ListCell): ChildArg {
  const view = listWindow(cell.items, cell.chosen);
  const items = cell.loading ? [{ id: 'loading', label: 'Loading…', disabled: true }] : view.items.map(({ id, label, mark, disabled }) => ({ id, label, count: mark, disabled }));
  return [
    component('FolderList', { label: cell.label, items, chosen: cell.chosen ?? null }),
    view.more.above ? textNode({ role: 'caption', tone: 'muted' }, { class: 'push-display__more', 'data-more': 'above', 'aria-label': 'more above' }, '▴') : null,
    view.more.below ? textNode({ role: 'caption', tone: 'muted' }, { class: 'push-display__more', 'data-more': 'below', 'aria-label': 'more below' }, '▾') : null,
  ];
}

const TEXT_ROLE = { label: 'label', value: 'numeral', large: 'display' } as const;

function content(cell: BodyCell): ChildArg {
  switch (cell.type) {
    case 'param':
      return [param(cell), cell.automated ? h('span', { class: 'push-display__dot', 'data-part': 'automation' }, component('StatusDot', { hue: 't', size: 'sm', hollow: cell.overridden, name: cell.overridden ? 'automation overridden' : 'automated' })) : null];
    case 'list':
      return list(cell);
    case 'text':
      return textNode({ role: TEXT_ROLE[cell.size ?? 'label'], leading: 'tight', tone: cell.tone === 'dim' ? 'muted' : cell.tone === 'warn' ? 'warning' : undefined }, { 'data-part': 'text' }, cell.text);
    case 'trace': {
      const d = cell.drawing;
      return component('PushTrace', {
        points: d.points ?? [],
        fill: d.kind === 'filter' || d.kind === 'spectrum' || d.kind === 'envelope',
        region: d.region,
        markers: (d.markers ?? []).map((m) => ({ at: m.at, name: m.kind, strong: m.kind === 'playhead' || m.kind === 'selected' })),
        name: d.label ?? d.kind,
        ...(cell.colour === undefined ? {} : { hue: 1 }),
      });
    }
    case 'meter':
      // A stereo meter the frame reader moves, a mark at the volume, and the reading.
      return [
        wire(
          h(
            'div',
            { class: 'push-display__meter', 'data-part': 'meter', 'data-track': cell.track },
            component('MusicScope', { className: 'push-display__meters' }, { slots: { children: [component('MusicMeter', { name: '', label: 'Level, left', value: 0, peak: 0, orientation: 'vertical', ink: 'var(--push-lit)' }), component('MusicMeter', { name: '', label: 'Level, right', value: 0, peak: 0, orientation: 'vertical', ink: 'var(--push-lit)' })] } }),
            component('Slider', { param: LEVEL, value: cell.fraction, name: '', label: `${cell.name} ${cell.value}`, orientation: 'vertical', length: 'auto', showValue: false, fill: false, ink: 'var(--push-lit)' }, { on: { onChange: 'none' } }),
          ),
          { bind: [['pushFrameMeter', { track: cell.track, frame: 'frame' }]] },
        ),
        textNode({ role: 'numeral', leading: 'tight', truncate: true }, { 'data-part': 'value' }, cell.value),
      ];
    default:
      // The piano roll and the clip grid are drawn by the views that use them.
      return textNode({ role: 'caption', tone: 'muted' }, { 'data-part': 'text' }, cell.type);
  }
}

function body(cell: BodyCell): Node {
  const span = Math.max(1, Math.min(DISPLAY.columns - cell.col + 1, cell.span ?? 1));
  const p = cell.type === 'param' ? cell : undefined;
  const colour = 'colour' in cell ? cell.colour : undefined;
  return h(
    'div',
    {
      class: 'push-display__cell',
      'data-type': cell.type,
      'data-style': p?.style,
      'data-col': String(cell.col),
      'data-span': String(span),
      'data-touched': p?.touched || (cell.type === 'meter' && cell.touched) ? 'true' : undefined,
      'data-enclosing': cell.type === 'list' && cell.enclosing ? 'true' : undefined,
      'data-under': cell.type === 'trace' && cell.under ? 'true' : undefined,
      'data-disabled': p?.disabled || (cell.type === 'text' && cell.tone === 'dim') || (cell.type === 'meter' && cell.dim) ? 'true' : undefined,
      'data-align': cell.type === 'text' ? (cell.align ?? 'start') : undefined,
      'data-size': cell.type === 'text' ? (cell.size ?? 'label') : undefined,
      style: styleText({ 'grid-column': `${cell.col} / span ${span}`, '--push-lamp': lamp(colour) }),
    },
    content(cell),
  );
}

const label = (text: string, part: string, size: 'label' | 'value' | 'large' = 'label'): Child => textNode({ role: TEXT_ROLE[size], leading: 'tight' }, { 'data-part': part }, text);

function overlay(o: Overlay): Node {
  const box = (kind: string, attrs: Record<string, string | undefined>, ...children: ChildArg[]) => h('div', { class: 'push-display__overlay', 'data-overlay': kind, ...attrs }, ...children);
  switch (o.type) {
    case 'notice':
      return box('notice', { role: 'status' }, label(o.text, 'text'), o.value === undefined ? null : label(o.value, 'value', 'large'));
    case 'confirm':
      return box('confirm', { role: 'alertdialog', 'aria-label': o.text }, label(o.text, 'text', 'value'), label(`Press the jog wheel: ${o.yes}`, 'yes'), label(`✕: ${o.no}`, 'no'));
    case 'dialog':
      return box('dialog', { role: 'dialog', 'aria-label': o.title }, label(o.title, 'title', 'value'), o.text ? label(o.text, 'text') : null, o.code ? label(o.code, 'code', 'large') : null, o.address ? label(o.address, 'address') : null);
    case 'text-entry':
      return box(
        'text-entry',
        { role: 'dialog', 'aria-label': o.title },
        label(o.title, 'title'),
        h('div', { class: 'push-display__entry', 'data-part': 'entry', 'aria-label': `Text: ${o.text}` }, label(o.text.slice(0, o.caret), 'before', 'value'), h('span', { class: 'push-display__caret', 'data-part': 'caret', 'aria-hidden': 'true' }), label(o.text.slice(o.caret), 'after', 'value')),
        h('div', { class: 'push-display__characters', 'data-part': 'characters' }, ...charWindow(o.characters, o.highlighted).map(([c, i]) => h('span', { class: 'push-display__character', 'data-highlighted': i === o.highlighted ? 'true' : undefined, 'data-character': c }, label(c === ' ' ? '␣' : c, 'character', 'value')))),
      );
    case 'battery':
      return box('battery', { role: 'img', 'aria-label': `Battery ${o.percent} percent${o.charging ? ', charging' : ''}`, 'data-low': o.low ? 'true' : undefined, style: styleText({ '--push-fraction': String(o.percent / 100) }) }, h('span', { class: 'push-display__battery-fill', 'aria-hidden': 'true' }));
    case 'count-in':
      return box('count-in', { role: 'progressbar', 'aria-label': 'Count-in', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(o.fraction * 100)), style: styleText({ '--push-fraction': String(o.fraction) }) });
    case 'progress':
      return box('progress', { role: 'progressbar', 'aria-label': o.label, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(o.fraction * 100)), style: styleText({ '--push-fraction': String(o.fraction) }) }, label(o.label, 'text'), h('span', { class: 'push-display__bar', 'aria-hidden': 'true' }));
  }
}

/** The characters in view around the highlighted one, each with its index. */
export function charWindow(characters: readonly string[], highlighted: number, around = 12): [string, number][] {
  const start = Math.min(Math.max(0, highlighted - around), Math.max(0, characters.length - (around * 2 + 1)));
  return characters.slice(start, start + around * 2 + 1).map((c, i) => [c, start + i]);
}

const eight = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * The tree Display draws. `facets` is the scope's pack, read by the binding: with `dark` on, the
 * display restates the contract in the pack's dark values, so it stays a lit screen in light mode.
 */
export function displayView({ screen, dark = true, light = 100, className }: DisplayModelProps, facets?: Facets): Node {
  const blank = !screen || screen.kind === 'blank';
  const scope = dark && facets ? toCssVars(facets, 'dark') : {};
  return h(
    'div',
    {
      class: ['push-display', className].filter(Boolean).join(' '),
      'data-kind': screen?.kind ?? 'blank',
      'data-dark': dark ? 'true' : undefined,
      role: 'group',
      'aria-label': blank ? 'Display, blank' : `Display: ${screen.kind}`,
      style: styleText({ ...scope, ...lampVars(), '--push-light': String(Math.min(100, Math.max(0, light)) / 100) }),
    },
    blank
      ? null
      : h(
          'div',
          { class: 'push-display__screen' },
          h('div', { class: 'push-display__row', 'data-row': 'top', 'data-paging-left': screen.paging?.top?.left ? 'true' : undefined, 'data-paging-right': screen.paging?.top?.right ? 'true' : undefined }, ...eight.map((c) => tab(screen.top[c - 1] ?? null, 'top', c))),
          h('div', { class: 'push-display__body' }, ...screen.body.map(body)),
          h('div', { class: 'push-display__row', 'data-row': 'bottom' }, ...eight.map((c) => tab(screen.bottom[c - 1] ?? null, 'bottom', c))),
          screen.overlays.length ? h('div', { class: 'push-display__overlays' }, ...screen.overlays.map(overlay)) : null,
        ),
  );
}

/** The callbacks the tree names: a parameter turned or switched on the screen is its column's encoder turning. */
export function displayHandlers(props: DisplayModelProps): Handlers {
  const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());
  const handlers: Handlers = { none: () => {}, frame: props.frame };
  for (const c of eight) {
    handlers[`turn:${c}`] = (delta: number) => props.onInput?.({ control: encoderId(c), kind: 'turn', time: now(), value: delta });
    handlers[`switch:${c}`] = (on: boolean) => props.onInput?.({ control: encoderId(c), kind: 'turn', time: now(), value: on ? 1 : -1 });
  }
  return handlers;
}
