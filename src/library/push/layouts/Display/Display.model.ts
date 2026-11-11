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
import { iconNode } from '../../../primitives/Icon/Icon.model';
import { textNode } from '../../../primitives/Text/Text.model';
import { component, h, styleText, wire, type Child, type ChildArg, type Handlers, type Node } from '../../../foundation/view/Tree.model';
import { DISPLAY, encoderId } from '../../model/layout';
import type { BodyCell, ListCell, ListItem, Overlay, ParamCell, Picture, PushFrame, PushInput, RowCell, Screen } from '../../model/types';
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
  midi: '♪', audio: '∿', group: '▣', return: '↩', main: '▬', instrument: '♪', effect: '∿', 'midi-effect': '⋯', rack: '▤', 'drum-rack': '▦', folder: '▸', left: '‹', right: '›', close: '✕', plus: '+', check: '✓', 'switch-on': '■', 'switch-off': '□', map: '⇤',
};
const ICON_NAME: Record<NonNullable<RowCell['icon']>, string> = {
  midi: 'MIDI track', audio: 'audio track', group: 'group', return: 'return', main: 'Main', instrument: 'instrument', effect: 'effect', 'midi-effect': 'MIDI effect', rack: 'Rack', 'drum-rack': 'Drum Rack', folder: 'folder', left: 'more to the left', right: 'more to the right', close: 'close', plus: 'add', check: 'done', 'switch-on': 'on', 'switch-off': 'off', map: 'map to a macro',
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
    // A pair of options at one button: the current one lit, the other dim beside it.
    cell.options
      ? h('span', { class: 'push-display__options', 'data-part': 'options', role: 'group', 'aria-label': `${cell.label}: ${cell.options[cell.chosen ?? 0] ?? ''}` }, ...cell.options.map((option, i) => textNode({ role: 'label', leading: 'tight' }, { 'data-part': 'option', 'data-current': i === (cell.chosen ?? 0) ? 'true' : undefined, key: String(i) }, option)))
      : cell.label
        ? textNode({ role: 'label', leading: 'tight', truncate: true }, { 'data-part': 'label' }, cell.label)
        : null,
    cell.armed ? h('span', { class: 'push-display__armed', 'data-part': 'armed', role: 'img', 'aria-label': 'armed' }) : null,
    cell.progress === undefined
      ? null
      : h('span', { class: 'push-display__progress', 'data-part': 'progress', role: 'progressbar', 'aria-label': 'clip progress', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(cell.progress * 100)), style: styleText({ '--push-fraction': String(cell.progress) }) }),
  );
}

const TEXT_ROLE = { label: 'label', value: 'numeral', large: 'display' } as const;
const LEVEL = { kind: 'float', min: 0, max: 1, defaultValue: 0 } as const;

/** The small pictures a setting's value can carry, each a few strokes in a 24 by 24 box; `fill` marks a filled shape, `dots` a dotted line. */
const PICTURES: Record<Picture, { d: string; fill?: boolean; dots?: boolean }[]> = {
  finger: [{ d: 'M2 4h14v11H2z' }, { d: 'M9 6h5v5H9z', fill: true }, { d: 'M12 10v8l-2-2M12 13l5 2v4l-2 3' }],
  pad: [{ d: 'M2 4h18v15H2z' }, { d: 'M7 8h8v7H7z', fill: true }],
  input: [{ d: 'M1 12h13M10 8l4 4-4 4' }, { d: 'M10 4h10v16H10' }],
  output: [{ d: 'M10 12h13M19 8l4 4-4 4' }, { d: 'M14 4H4v16h10' }],
  on: [{ d: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', fill: true }],
  off: [{ d: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM5.6 5.6l12.8 12.8' }],
  scene: [{ d: 'M2 4h20M2 12h20M2 16h20M2 20h20', dots: true }, { d: 'M2 8h20', fill: true }],
  clip: [{ d: 'M4 2v20M12 2v20M16 2v20M20 2v20', dots: true }, { d: 'M8 2v20', fill: true }],
  width: [{ d: 'M2 4h20v16H2z' }, { d: 'M9 4h6v16H9z', fill: true }],
  height: [{ d: 'M2 4h20v16H2z' }, { d: 'M2 8h20v8H2z', fill: true }],
};
const PICTURE_NAME: Record<Picture, string> = { finger: 'finger', pad: 'pad', input: 'input', output: 'output', on: 'on', off: 'off', scene: 'scene', clip: 'clip', width: 'width', height: 'height' };

function picture(name: Picture): Node {
  return iconNode(
    { label: PICTURE_NAME[name] },
    { 'data-part': 'picture', 'data-picture': name },
    ...PICTURES[name].map((p, i) => h('path', { d: p.d, 'data-fill': p.fill ? 'true' : undefined, 'data-dots': p.dots ? 'true' : undefined, key: String(i) })),
  );
}

/** How many of a choice's choices each layout shows, starting at the current one. */
const CHOICES_SHOWN = { stack: 3, single: 1, row: 4 } as const;

/** A parameter: an arc, a centred arc, a switch, a bar, a value with a small picture, or a choice with the choices after it. */
function param(cell: ParamCell & { col: number }): ChildArg {
  const hue = cell.colour === undefined ? {} : { hue: 1 };
  const name = `${cell.name} ${cell.value}${cell.unit ?? ''}`;
  const label = textNode({ role: 'label', truncate: true, leading: 'tight' }, { 'data-part': 'name' }, cell.name);
  if (cell.picture) {
    // A setting with a picture: its name, its value large, and the picture where a dial would be.
    const reading = cell.unit ? ([cell.value, cell.unit] as const) : splitUnit(cell.value);
    return [
      label,
      h('div', { class: 'push-display__reading', 'data-part': 'reading', role: 'group', 'aria-label': name }, textNode({ role: TEXT_ROLE.large, leading: 'tight' }, { 'data-part': 'value' }, reading[0]), reading[1] ? textNode({ role: 'label', leading: 'tight' }, { 'data-part': 'unit' }, reading[1]) : null),
      picture(cell.picture),
    ];
  }
  const layout = cell.layout ?? (cell.style === 'value' && cell.choices?.length ? 'row' : undefined);
  if (layout && cell.choices?.length) {
    // The current choice lit, and the ones after it dim: beneath it, or beside it in a row. A `list` shows them all, small.
    const at = Math.min(cell.choices.length - 1, Math.max(0, cell.chosen ?? 0));
    const shown = layout === 'list' ? cell.choices.map((c, i) => [c, i] as const) : cell.choices.slice(at, at + CHOICES_SHOWN[layout]).map((c, i) => [c, at + i] as const);
    const role = layout === 'list' ? 'label' : layout === 'row' ? 'numeral' : TEXT_ROLE.large;
    return [
      label,
      h(
        'div',
        { class: 'push-display__choices', 'data-part': 'choices', 'data-layout': layout, role: 'group', 'aria-label': name },
        ...shown.map(([c, i]) => textNode({ role, leading: 'tight', truncate: layout !== 'row', tone: i === at ? undefined : 'muted', ...(layout === 'list' && i === at ? { weight: 'strong' as const } : {}) }, { 'data-part': i === at ? 'value' : 'choice', 'data-current': i === at ? 'true' : undefined, key: String(i) }, c)),
      ),
    ];
  }
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
  const dial = { fraction: cell.fraction, name, ...(cell.style === 'bipolar' ? { origin: 'center' } : {}), ...hue };
  const on = { on: { onstep: `turn:${cell.col}` } };
  // As on the unit: the name, the reading at the large size with its unit small beside it, and the dial under them.
  const reading = cell.unit ? ([cell.value, cell.unit] as const) : splitUnit(cell.value);
  return [
    textNode({ role: 'label', truncate: true, leading: 'tight' }, { 'data-part': 'name' }, cell.name),
    h('div', { class: 'push-display__reading', 'data-part': 'reading' }, textNode({ role: TEXT_ROLE.large, leading: 'tight' }, { 'data-part': 'value' }, reading[0]), reading[1] ? textNode({ role: 'label', leading: 'tight' }, { 'data-part': 'unit' }, reading[1]) : null),
    component('KnobReadout', { label: '', value: '', unit: '', ...dial }, on),
  ];
}

/** "-3.0 dB" as its number and its unit. A reading that is not one number, a space and a unit ("C", "25R", "1/8", "Off", "90 to 110") is all value. */
export function splitUnit(reading: string): [string, string] {
  const parts = /^([-+−]?\d[\d.,]*)(?:\s+([^\d\s/][^\d]*)|(%))$/.exec(reading);
  return parts ? [parts[1], parts[2] ?? parts[3]] : [reading, ''];
}

function list(cell: ListCell): ChildArg {
  const view = listWindow(cell.items, cell.chosen);
  const items = cell.loading ? [{ id: 'loading', label: 'Loading…', disabled: true }] : view.items.map(({ id, label, mark, disabled }) => ({ id, label, count: mark, disabled }));
  return [
    component('FolderList', { label: cell.label, items, chosen: cell.chosen ?? null }),
    view.more.above ? h('span', { class: 'push-display__more', 'data-more': 'above', role: 'img', 'aria-label': 'more above' }, textNode({ role: 'caption', tone: 'muted' }, {}, '▴')) : null,
    view.more.below ? h('span', { class: 'push-display__more', 'data-more': 'below', role: 'img', 'aria-label': 'more below' }, textNode({ role: 'caption', tone: 'muted' }, {}, '▾')) : null,
  ];
}


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
        disabled: cell.dim,
        ...(cell.colour === undefined ? {} : { hue: 1 }),
      });
    }
    case 'meter':
      // A stereo meter the frame reader moves, a mark at the volume, and the reading.
      return [
        cell.titled ? textNode({ role: 'label', truncate: true, leading: 'tight' }, { 'data-part': 'name' }, cell.name) : null,
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
    case 'wave': {
      // A sample or an audio clip: its peaks in view as a band, the lit stretch and the markers where they fall in view.
      const span = Math.max(1e-6, cell.to - cell.from);
      const first = Math.floor(cell.from * (cell.peaks.length - 1));
      const last = Math.ceil(cell.to * (cell.peaks.length - 1));
      const place = (at: number) => (at - cell.from) / span;
      const inView = (at: number) => at >= cell.from - 1e-9 && at <= cell.to + 1e-9;
      return component('PushTrace', {
        band: cell.peaks.slice(Math.max(0, first), Math.max(first + 2, last + 1)),
        region: cell.region ? [Math.min(1, Math.max(0, place(cell.region[0]))), Math.min(1, Math.max(0, place(cell.region[1])))] : undefined,
        markers: cell.markers.filter((m) => inView(m.at)).map((m) => ({ at: place(m.at), name: m.kind, strong: m.kind !== 'slice' })),
        name: cell.label ?? 'Waveform',
        disabled: cell.dim,
        ...(cell.colour === undefined ? {} : { hue: 1 }),
      });
    }
    case 'roll': {
      // The clip's notes. A note's colour is a hue slot: the cell restates up to four slots as the colours the notes
      // use (a Drum Rack's pads), and the fifth as white for a selected note.
      const colours = [...new Set(cell.notes.map((n) => n.colour ?? cell.colour).filter((c): c is number => c !== undefined))].slice(0, 4);
      const slot = (colour: number | undefined) => (colour === undefined ? undefined : ((Math.max(0, colours.indexOf(colour)) + 1) as 1 | 2 | 3 | 4));
      const rows = cell.pitches.length;
      const span = Math.max(1e-6, cell.to - cell.from);
      const pct = (n: number) => `${Math.round(n * 10000) / 100}%`;
      const row = (pitch: number) => cell.pitches.indexOf(pitch);
      const most = Math.max(1, ...(cell.density ?? []));
      return h(
        'div',
        {
          class: 'push-display__roll',
          'data-part': 'roll',
          'data-highlight': cell.notes.some((n) => n.highlighted) ? 'true' : undefined,
          style: styleText({ ...Object.fromEntries(colours.map((c, i) => [`--hue-${i + 1}`, colourCss(c)])), '--hue-5': 'var(--push-white)' }),
        },
        cell.density
          ? h('div', { class: 'push-display__density', 'data-part': 'density', 'aria-hidden': 'true' }, ...cell.density.map((count, i) => h('span', { 'data-count': String(count), style: styleText({ '--push-fraction': String(count / most) }), key: String(i) })))
          : null,
        component('FormScope', { form: 'compact' }, {
          slots: {
            children: [
              component('PianoRoll', {
                keys: cell.pitches.map((pitch) => ({ pitch, label: '', black: [1, 3, 6, 8, 10].includes(((pitch % 12) + 12) % 12) })),
                notes: cell.notes.filter((n) => n.start < cell.to && n.start + n.length > cell.from).map((n) => ({ id: n.id, from: Math.max(cell.from, n.start), to: Math.min(cell.to, n.start + n.length), pitch: n.pitch, hue: n.selected ? 5 : slot(n.colour ?? cell.colour), level: n.muted ? 0.15 : n.velocity / 127, ...(n.highlighted ? { emphasis: true } : {}) })),
                from: cell.from,
                to: cell.to,
                beatsPerBar: cell.beatsPerBar,
                ...(cell.playhead === undefined || cell.playhead < cell.from || cell.playhead > cell.to ? {} : { playhead: (cell.playhead - cell.from) / span }),
              }),
            ],
          },
        }),
        h(
          'div',
          { class: 'push-display__marks', 'aria-hidden': 'true' },
          cell.loop ? h('span', { class: 'push-display__loop', 'data-part': 'loop', style: styleText({ left: pct(Math.max(0, (cell.loop[0] - cell.from) / span)), width: pct(Math.max(0, (Math.min(cell.to, cell.loop[1]) - Math.max(cell.from, cell.loop[0])) / span)) }) }) : null,
          ...(cell.markers ?? []).filter((m) => m.at >= cell.from && m.at <= cell.to).map((m) => h('span', { class: 'push-display__mark', 'data-part': 'mark', 'data-kind': m.kind, style: styleText({ left: pct((m.at - cell.from) / span) }) })),
          cell.box && rows
            ? h('span', {
                class: 'push-display__box',
                'data-part': 'box',
                style: styleText({ left: pct(Math.max(0, (cell.box.from - cell.from) / span)), width: pct(Math.max(0, (Math.min(cell.to, cell.box.to) - Math.max(cell.from, cell.box.from)) / span)), top: pct(Math.max(0, row(cell.box.high)) / rows), height: pct((Math.max(0, row(cell.box.low)) - Math.max(0, row(cell.box.high)) + 1) / rows) }),
              })
            : null,
        ),
      );
    }
    case 'code':
      return component('CodeImage', { text: cell.text, label: cell.label });
    case 'grid':
      // The Set's clips: a row per scene, a block per clip in its colour, and the scene's number or name at the right.
      return h(
        'div',
        { class: 'push-display__grid', 'data-part': 'grid', role: 'table', 'aria-label': 'Clips' },
        ...cell.rows.map((row, r) =>
          h(
            'div',
            { class: 'push-display__grid-row', role: 'row', 'data-row': String(r + 1) },
            ...row.map((clip, c) =>
              h(
                'span',
                {
                  class: 'push-display__slot',
                  role: 'cell',
                  'data-col': String(c + 1),
                  'data-state': clip?.state,
                  'data-selected': clip?.selected ? 'true' : undefined,
                  'data-empty': !clip || clip.colour === undefined ? 'true' : undefined,
                  style: styleText({ '--push-lamp': clip?.colour === undefined ? undefined : colourCss(clip.colour) }),
                },
                clip && clip.colour !== undefined ? component('Pad', { label: clip.label, name: `${clip.label}${clip.state && clip.state !== 'stopped' ? `, ${clip.state}` : ''}`, fillCell: true, state: 'playing', hue: 1 }) : null,
              ),
            ),
            // The label is a Text inside its own box: a class on the Text itself would replace the classes that size it.
            h('span', { class: 'push-display__scene', 'data-part': 'scene', role: 'rowheader' }, textNode({ role: 'caption', leading: 'tight', truncate: true }, {}, cell.labels?.[r] ?? '')),
          ),
        ),
      );
    default:
      return null;
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
      'data-under': (cell.type === 'trace' || cell.type === 'wave' || cell.type === 'roll') && cell.under ? 'true' : undefined,
      'data-disabled': p?.disabled || (cell.type === 'text' && cell.tone === 'dim') || (cell.type === 'meter' && cell.dim) || ((cell.type === 'trace' || cell.type === 'wave') && cell.dim) ? 'true' : undefined,
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
      return box('dialog', { role: 'dialog', 'aria-label': o.title }, label(o.title, 'title', 'value'), o.text ? label(o.text, 'text') : null, o.code ? label(o.code, 'code', 'large') : null, o.image && o.address ? component('CodeImage', { text: o.address }) : null, o.address ? label(o.address, 'address') : null);
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
