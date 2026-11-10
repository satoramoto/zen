// ControlPanel's model: a grid of the person's own controls, each bound to one of the app's
// parameters, in mix[flow]'s face, and the tree both renderers draw. No framework: `ControlPanel.tsx`
// and `ControlPanel.svelte` hand `controlPanelView` and `controlPanelHandlers` to their `Tree`,
// with the panel's own visual state and the surface's mode. It holds no app state: values are the
// app's readings; a move asks `onParam`, a press `onTrigger`; building asks `onCells` with the next
// cells; learn mode asks `onLearn` and `onForget`. The grid's geometry is `layouts/cells.ts`.
import { clipped, freePositions, moveTo, place, removeCell, resizeTo } from '../../../../layouts/cells';
import { component, h, styleText, wire, type Child, type ChildArg, type Handlers, type Node } from '../../../../foundation/view/Tree.model';
import type { Param } from '../../../model/param/param';
import { format } from '../../../model/param/format';
import { livePane } from '../../live.model';

/** The kinds of control a cell can hold. */
export const CONTROL_KINDS = ['fader', 'knob', 'toggle', 'button', 'pad', 'xy'] as const;
export type ControlKind = (typeof CONTROL_KINDS)[number];

/** How a parameter moves: along a range, on or off, or fired. */
export const CONTROL_ROLES = ['continuous', 'switch', 'trigger'] as const;
export type ControlRole = (typeof CONTROL_ROLES)[number];

/** The role each kind plays: what parameters its sheet offers. */
export const ROLE_OF: Readonly<Record<ControlKind, ControlRole>> = { fader: 'continuous', knob: 'continuous', xy: 'continuous', toggle: 'switch', button: 'trigger', pad: 'trigger' };

/** A kind's words. */
export const KIND_LABEL: Readonly<Record<ControlKind, string>> = { fader: 'Fader', knob: 'Knob', toggle: 'Toggle', button: 'Button', pad: 'Pad', xy: 'XY' };

/** A kind's size when first placed, in cells. */
export const KIND_SIZE: Readonly<Record<ControlKind, { w: number; h: number }>> = { fader: { w: 1, h: 2 }, knob: { w: 1, h: 1 }, toggle: { w: 1, h: 1 }, button: { w: 1, h: 1 }, pad: { w: 1, h: 1 }, xy: { w: 2, h: 2 } };

/** One of the app's parameters a control can move. */
export interface ControlParam {
  id: string;
  label: string;
  /** Where it belongs, for the sheet: `'FX'`. */
  group?: string;
  /** Its range, unit and format (the Music `Param`). */
  param: Param;
  role: ControlRole;
}

/** One cell's control: its kind, what it moves, its words, its place on the grid. Plain data, stored in the region's settings. */
export interface ControlCell {
  id: string;
  control: ControlKind;
  /** The parameter it moves (an XY's horizontal one). */
  param?: string;
  /** An XY's vertical parameter. */
  paramY?: string;
  /** Its words, else the parameter's label, else the kind's. */
  label?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ControlPanelProps {
  /** The panel's controls (the region's `cells` setting). */
  cells: readonly ControlCell[];
  /** The grid's size. */
  columns: number;
  rows: number;
  /** What a control can move. */
  params: readonly ControlParam[];
  /** Each parameter's value now, by id: the app's readings. */
  values: Readonly<Record<string, number>>;
  /** A continuous control or a switch was moved: the value it asks for. */
  onParam?: (move: { param: string; value: number }) => void;
  /** A button or pad was pressed (`down`) or released. */
  onTrigger?: (press: { param: string; down: boolean }) => void;
  /**
   * A gesture on a continuous control (a fader, a knob, an XY: both its parameters) began (`down`) or
   * ended: every `onParam` of that gesture falls between the two, so the app can make one undo step
   * of a drag, or write automation while a hand is on the control.
   */
  onTouch?: (touch: { param: string; down: boolean }) => void;
  /** Building: the panel's next cells (the app saves them as the region's settings). */
  onCells?: (next: readonly ControlCell[]) => void;
  /** Learn mode is on (the app's). A press asks to learn instead of moving. */
  learning?: boolean;
  /** The parameter the app is waiting to map. */
  learnTarget?: string;
  /** Each mapped parameter's mapping, in the app's words: `'CC 21 · ch 1'`. */
  mappings?: Readonly<Record<string, string>>;
  onLearn?: (param: string) => void;
  onForget?: (param: string) => void;
  className?: string;
}

/** The panel's own visual state: the control whose sheet is open, the cell a kind is being picked for, a drag's preview. */
export interface ControlPanelUi {
  selected?: string;
  adding?: { x: number; y: number };
  preview?: readonly ControlCell[];
}

export const CONTROL_PANEL_REST: ControlPanelUi = {};

/** A cell's words. */
export const controlLabel = (cell: ControlCell, params: readonly ControlParam[]): string => cell.label ?? params.find((p) => p.id === cell.param)?.label ?? KIND_LABEL[cell.control];

const gridArea = (c: { x: number; y: number; w: number; h: number }, columns: number, rows: number) =>
  styleText({ 'grid-column': `${c.x + 1} / span ${Math.max(1, Math.min(c.w, columns - c.x))}`, 'grid-row': `${c.y + 1} / span ${Math.max(1, Math.min(c.h, rows - c.y))}` });

/** The first word group of a mapping: `CC 21 · ch 1` → `CC 21`. */
const shortMapping = (m: string): string => m.split('·')[0].trim();

/** One control drawn for play: its Music control on the app's value, or the state that says why it can't move. */
function controlNode(cell: ControlCell, props: ControlPanelProps, inert: boolean): Child {
  const { params, values } = props;
  const label = controlLabel(cell, params);
  const p = params.find((x) => x.id === cell.param);
  const py = params.find((x) => x.id === cell.paramY);
  if (cell.param === undefined || (cell.control === 'xy' && cell.paramY === undefined)) {
    return h('div', { class: 'live-controls-unbound', 'data-part': 'unbound', role: 'note', 'aria-label': `${label}: no parameter` }, h('span', { class: 'live-axis' }, `${label} · no parameter`));
  }
  if (!p || (cell.control === 'xy' && !py)) {
    return h('div', { class: 'live-controls-unbound', 'data-part': 'missing', role: 'note', 'aria-label': `${label}: parameter missing` }, h('span', { class: 'live-axis' }, `${label} · parameter missing`));
  }
  const value = values[p.id] ?? p.param.defaultValue;
  const key = (k: string) => `${k}:${cell.id}`;
  switch (cell.control) {
    case 'fader':
      return component('MusicSlider', { name: label, label, param: p.param, value, display: format(p.param, value), length: 'auto', disabled: inert }, { on: { onChange: key('param') } });
    case 'knob':
      return component('MusicKnob', { name: label, label, param: p.param, value, display: format(p.param, value), disabled: inert }, { on: { onChange: key('param') } });
    case 'toggle':
      return component('MusicToggle', { on: value > (p.param.min + p.param.max) / 2, label, disabled: inert, className: 'live-controls-switch' }, { on: { onChange: key('switch') }, slots: { children: [label] } });
    case 'button':
    case 'pad':
      return component('MusicToggle', { on: value > (p.param.min + p.param.max) / 2, momentary: true, label, disabled: inert, className: cell.control === 'pad' ? 'live-controls-pad' : 'live-controls-button' }, { on: { onChange: key('trigger') }, slots: { children: [label] } });
    case 'xy': {
      const frac = (q: ControlParam, v: number) => (v - q.param.min) / (q.param.max - q.param.min || 1);
      return component(
        'MusicThrowPads',
        { pads: [{ id: cell.id, name: label, x: frac(p, value), y: frac(py!, values[py!.id] ?? py!.param.defaultValue), xLabel: p.label, yLabel: py!.label }], form: 'one' },
        { on: inert ? {} : { onMove: key('xy') } },
      );
    }
  }
}

/** The panel's tools while building: what is being added, or the open control's sheet. */
function toolsNode(props: ControlPanelProps, ui: ControlPanelUi): ChildArg {
  const { cells, params } = props;
  if (ui.adding) {
    const at = ui.adding;
    return h(
      'div',
      { class: 'live-controls-tools', 'data-part': 'adding', role: 'toolbar', 'aria-label': `Add a control at column ${at.x + 1}, row ${at.y + 1}` },
      h('span', { class: 'live-axis' }, `Add at ${at.x + 1}·${at.y + 1}`),
      ...CONTROL_KINDS.map((k) => component('MusicButton', { label: `add a ${KIND_LABEL[k].toLowerCase()} here` }, { on: { onPress: `add:${k}` }, slots: { children: [KIND_LABEL[k]] }, key: k })),
      component('MusicButton', { label: 'cancel adding', tone: 'quiet' }, { on: { onPress: 'add:cancel' }, slots: { children: ['Cancel'] } }),
    );
  }
  const cell = cells.find((c) => c.id === ui.selected);
  if (!cell) return null;
  const label = controlLabel(cell, params);
  const offered = params.filter((p) => p.role === ROLE_OF[cell.control]);
  const pick = (which: 'param' | 'paramY', name: string) =>
    component(
      'Select',
      { items: ['None', ...offered.map((p) => (p.group ? `${p.group} · ${p.label}` : p.label))], index: Math.max(0, offered.findIndex((p) => p.id === cell[which]) + 1), label: name, name },
      { on: { onChange: `pick-${which}:${cell.id}` }, key: which },
    );
  return h(
    'div',
    { class: 'live-controls-tools', 'data-part': 'sheet', role: 'group', 'aria-label': `${label} control` },
    h('span', { class: 'live-axis' }, label),
    component('Segmented', { items: CONTROL_KINDS.map((k) => KIND_LABEL[k]), index: CONTROL_KINDS.indexOf(cell.control), label: `${label} kind` }, { on: { onChange: `kind:${cell.id}` }, key: 'kind' }),
    pick('param', cell.control === 'xy' ? `${label} horizontal parameter` : `${label} parameter`),
    cell.control === 'xy' ? pick('paramY', `${label} vertical parameter`) : null,
    // Its words: saved when the field is left or Enter is pressed; empty goes back to the parameter's.
    wire(h('input', { class: 'live-controls-label', 'data-part': 'label', value: cell.label ?? '', placeholder: controlLabel({ ...cell, label: undefined }, params), 'aria-label': `${label} label` }), {
      on: { change: `label:${cell.id}` },
    }),
    component('MusicButton', { label: `remove ${label}`, tone: 'danger' }, { on: { onPress: `remove:${cell.id}` }, slots: { children: ['Remove'] }, key: 'remove' }),
    component('MusicButton', { label: `close ${label}`, tone: 'quiet' }, { on: { onPress: 'deselect' }, slots: { children: ['Done'] }, key: 'done' }),
  );
}

/**
 * The tree ControlPanel draws: the tools while building, then the grid, each cell its control at
 * its place. Building (`building`: the surface edits and the tab is unlocked), every empty position
 * is an add button and every control wears a tag (drag to move, arrows to step, Shift+arrows to
 * resize, press for its sheet) and a corner handle. In learn mode every control is covered by a
 * learn button; a mapped one wears its mapping's mark either way.
 */
export function controlPanelView(props: ControlPanelProps, ui: ControlPanelUi, building: boolean): Node {
  const { columns, rows, params, learning, learnTarget, mappings, className } = props;
  const size = { columns, rows };
  const cells = ui.preview ?? props.cells;
  const inert = props.onParam === undefined && props.onTrigger === undefined;
  return livePane(
    'controls',
    { class: className, 'aria-label': 'Controls', 'data-building': building ? 'true' : undefined, 'data-learning': learning ? 'true' : undefined },
    building ? toolsNode(props, ui) : null,
    h(
      'div',
      { class: 'live-controls-grid', 'data-part': 'grid', style: styleText({ 'grid-template-columns': `repeat(${columns}, minmax(0, 1fr))`, 'grid-template-rows': `repeat(${rows}, minmax(0, 1fr))` }) },
      ...(building
        ? freePositions(cells, size).map((at) =>
            wire(h('button', { class: 'live-controls-empty', type: 'button', 'data-part': 'empty', 'data-at': `${at.x},${at.y}`, 'aria-label': `add a control at column ${at.x + 1}, row ${at.y + 1}`, style: gridArea({ ...at, w: 1, h: 1 }, columns, rows) }, '+'), {
              on: { click: `empty:${at.x},${at.y}` },
            }),
          )
        : []),
      ...cells.map((cell) => {
        const label = controlLabel(cell, params);
        const mapping = cell.param !== undefined ? mappings?.[cell.param] : undefined;
        const pending = learning && cell.param !== undefined && cell.param === learnTarget;
        const learnable = learning === true && !building && cell.param !== undefined;
        const playing = !(inert || building || learnable);
        const node = h(
          'div',
          {
            class: 'live-controls-cell',
            'data-part': 'cell',
            'data-cell': cell.id,
            'data-control': cell.control,
            'data-selected': building && ui.selected === cell.id ? 'true' : undefined,
            'data-pending': pending ? 'true' : undefined,
            'data-clipped': clipped(cell, size) ? 'true' : undefined,
            style: gridArea(cell, columns, rows),
          },
          controlNode(cell, props, !playing),
          mapping ? h('span', { class: 'live-controls-map', 'data-part': 'mapping', title: mapping }, shortMapping(mapping)) : null,
          learnable
            ? h(
                'div',
                { class: 'live-controls-learn', 'data-part': 'learn' },
                wire(h('button', { type: 'button', class: 'live-controls-learnhit', 'aria-label': pending ? `${label}: waiting for a control` : `learn ${label}` }), { on: { click: `learn:${cell.id}` } }),
                mapping ? wire(h('button', { type: 'button', class: 'live-controls-forget', 'aria-label': `forget ${label}’s mapping` }, '×'), { on: { click: `forget:${cell.id}` } }) : null,
              )
            : null,
          building
            ? h(
                'div',
                { class: 'live-controls-edit', 'data-part': 'edit' },
                wire(
                  h('button', { type: 'button', class: 'live-controls-tag', 'data-part': 'tag', 'aria-label': `${label} control`, 'aria-expanded': ui.selected === cell.id ? 'true' : 'false' }, label),
                  { on: { click: `select:${cell.id}`, keydown: `key:${cell.id}` }, bind: [['liveCellDrag', { id: cell.id, mode: 'move', onPreview: `preview:${cell.id}`, onCommit: `commit:${cell.id}` }]] },
                ),
                wire(h('span', { class: 'live-controls-corner', 'data-part': 'corner', 'aria-hidden': 'true' }), {
                  bind: [['liveCellDrag', { id: cell.id, mode: 'resize', onPreview: `preview:${cell.id}`, onCommit: `commit:${cell.id}` }]],
                }),
              )
            : null,
        );
        // A continuous control tells the app when a hand is on it (`onTouch`), while it is played.
        return ROLE_OF[cell.control] === 'continuous' && props.onTouch ? wire(node, { bind: [['liveTouch', { disabled: !playing, onTouch: `touch:${cell.id}` }]] }) : node;
      }),
    ),
  );
}

/** The panel's visual state: read when a handler runs, and written. */
export interface ControlPanelStore {
  get(): ControlPanelUi;
  set(ui: ControlPanelUi): void;
}

/** A fresh cell id. */
const nextId = (cells: readonly ControlCell[]): string => {
  let n = cells.length + 1;
  while (cells.some((c) => c.id === `c${n}`)) n++;
  return `c${n}`;
};

/** The callbacks the tree names. Every building edit asks `onCells` with the whole next cells. */
export function controlPanelHandlers(props: ControlPanelProps, store: ControlPanelStore): Handlers {
  const { cells, columns, rows, params, onParam, onTrigger, onTouch, onCells, onLearn, onForget } = props;
  const size = { columns, rows };
  const visual = (change: Partial<ControlPanelUi>) => store.set({ ...store.get(), ...change });
  const save = (next: readonly ControlCell[]) => {
    if (next !== cells) onCells?.(next);
  };
  const handlers: Handlers = {
    'add:cancel': () => visual({ adding: undefined }),
    deselect: () => visual({ selected: undefined }),
  };
  for (const k of CONTROL_KINDS) {
    handlers[`add:${k}`] = () => {
      const at = store.get().adding;
      if (!at) return;
      const cell: ControlCell = { id: nextId(cells), control: k, ...at, ...KIND_SIZE[k] };
      const next = place(cells, cell, size);
      visual({ adding: undefined, selected: next ? cell.id : undefined });
      if (next) save(next);
    };
  }
  for (const at of freePositions(cells, size)) handlers[`empty:${at.x},${at.y}`] = () => visual({ adding: at, selected: undefined });
  for (const cell of cells) {
    const id = cell.id;
    const update = (change: Partial<ControlCell>) => save(cells.map((c) => (c.id === id ? { ...c, ...change } : c)));
    const p = params.find((x) => x.id === cell.param);
    const py = params.find((x) => x.id === cell.paramY);
    if (p) {
      handlers[`param:${id}`] = (value: number) => onParam?.({ param: p.id, value });
      handlers[`switch:${id}`] = (on: boolean) => onParam?.({ param: p.id, value: on ? p.param.max : p.param.min });
      handlers[`trigger:${id}`] = (down: boolean) => onTrigger?.({ param: p.id, down });
      if (py)
        handlers[`xy:${id}`] = ({ x, y }: { x: number; y: number }) => {
          onParam?.({ param: p.id, value: p.param.min + x * (p.param.max - p.param.min) });
          onParam?.({ param: py.id, value: py.param.min + y * (py.param.max - py.param.min) });
        };
      // A continuous control's gesture: its parameter (an XY's two) touched, then let go.
      if (ROLE_OF[cell.control] === 'continuous')
        handlers[`touch:${id}`] = (down: boolean) => {
          onTouch?.({ param: p.id, down });
          if (cell.control === 'xy' && py) onTouch?.({ param: py.id, down });
        };
      handlers[`learn:${id}`] = () => onLearn?.(p.id);
      handlers[`forget:${id}`] = () => onForget?.(p.id);
    }
    handlers[`select:${id}`] = () => visual({ selected: store.get().selected === id ? undefined : id, adding: undefined });
    handlers[`remove:${id}`] = () => {
      visual({ selected: undefined });
      save(removeCell(cells, id));
    };
    handlers[`kind:${id}`] = (i: number) => {
      const control = CONTROL_KINDS[i];
      if (!control || control === cell.control) return;
      // A new kind keeps the parameter only when it plays the same role.
      const keep = ROLE_OF[control] === ROLE_OF[cell.control];
      update({ control, param: keep ? cell.param : undefined, paramY: control === 'xy' && keep ? cell.paramY : undefined });
    };
    // The sheet's picks: index 0 is None, then the parameters of the control's role.
    const offered = params.filter((x) => x.role === ROLE_OF[cell.control]);
    handlers[`pick-param:${id}`] = (i: number) => update({ param: i === 0 ? undefined : offered[i - 1]?.id });
    handlers[`pick-paramY:${id}`] = (i: number) => update({ paramY: i === 0 ? undefined : offered[i - 1]?.id });
    handlers[`label:${id}`] = (event: Event) => {
      const text = (event.target as HTMLInputElement).value.trim();
      if ((text || undefined) !== cell.label) update({ label: text || undefined });
    };
    handlers[`preview:${id}`] = (next: { x: number; y: number; w: number; h: number } | null) => {
      if (!next) return visual({ preview: undefined });
      const moved = next.w === cell.w && next.h === cell.h ? moveTo(cells, id, next.x, next.y, size) : resizeTo(cells, id, next.w, next.h, size);
      visual({ preview: moved });
    };
    handlers[`commit:${id}`] = (next: { x: number; y: number; w: number; h: number }) => {
      visual({ preview: undefined });
      save(next.w === cell.w && next.h === cell.h ? moveTo(cells, id, next.x, next.y, size) : resizeTo(cells, id, next.w, next.h, size));
    };
    handlers[`key:${id}`] = (event: KeyboardEvent) => {
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (!d) return;
      event.preventDefault();
      save(event.shiftKey ? resizeTo(cells, id, cell.w + d[0], cell.h + d[1], size) : moveTo(cells, id, cell.x + d[0], cell.y + d[1], size));
    };
  }
  return handlers;
}
