import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { Surface } from '../../primitives/Surface';
import { Text, type TextTone } from '../../primitives/Text';
import { Button } from '../../components/core/Button/Button';
import { StatusDot } from '../../components/core/StatusDot/StatusDot';
import { Device, DeviceEdge, DeviceMore, DevicePortRow } from '../view/Device/Device';
import { Graph, GraphNode, type GraphBus, type GraphCord, type GraphFace, type GraphView, type GraphZone } from '../view/Graph/Graph';
import { Port } from '../view/Graph/Port';
import { GraphPath, type GraphPathStep } from '../view/GraphPath/GraphPath';
import { NodeSheet, NodeSheetRow, NodeSheetSection, type NodeSheetPlace } from '../view/NodeSheet/NodeSheet';
import { Slider } from '../../components/core/Slider/Slider';
import { format } from '../../components/core/Param/format';
import type { Param } from '../../components/core/Param/param';
import { pinsOf, validate, type Chip, type Circuit, type Json, type Module, type Pin, type Trace } from '../model/circuit';
import { useCircuit, type CircuitBinding } from '../model/useCircuit';
import { CIRCUITS, KIND_HUE, PARAM_SPECS, SESSION_STATES, TYPE_NAMES, type KindInk, type SessionState } from './Circuit.fixtures';

// ---------------------------------------------------------------------------------------------
// Host concerns: names, inks, faces, new-trace kinds, param edits. None of these are the model's.

/** How many params a chip's face shows before the rest fold under a `DeviceMore` line. */
const FACE_PARAMS = 2;
/** A chip's rough box in module units, for choosing an auto pin's face before anything is measured. */
const CHIP_W = 160;
const CHIP_H = 96;
/** The `--space-6` the samples' positions were laid out at (a compact pack's); other packs stretch them. */
const BASE_STEP = 32;

const nameOf = (chip: Chip) => (typeof chip.name === 'string' ? chip.name : (TYPE_NAMES[chip.type] ?? chip.id));
const isPinEnd = (end: Trace['from']): end is { chip: string; pin: string } => 'chip' in end;
const hueOf = (kind: string | undefined): KindInk | undefined => (kind ? KIND_HUE[kind] : undefined);
/** A colour slot as a CSS colour: `--hue-n` or `--role-n`. */
const inkOf = (slot: KindInk | undefined, fallback = 'var(--text-3)') =>
  slot === undefined ? fallback : typeof slot === 'number' ? `var(--hue-${slot})` : `var(--${slot})`;

/** A trace the binding made has no kind: give it its out pin's kind (or its bus's) so it's inked. */
function inkNewTraces(circuit: Circuit, module: string): Circuit {
  const m = circuit.modules[module];
  if (!m || m.traces.every((t) => t.kind !== undefined)) return circuit;
  const traces = m.traces.map((t) => {
    if (t.kind !== undefined) return t;
    const kind = isPinEnd(t.from)
      ? pinsOf(circuit, module, t.from.chip).find((p) => p.side === 'out' && p.id === (t.from as { pin: string }).pin)?.kind
      : (m.buses ?? []).find((b) => b.id === (t.from as { bus: string }).bus)?.kind;
    return kind === undefined ? t : { ...t, kind };
  });
  return { ...circuit, modules: { ...circuit.modules, [module]: { ...m, traces } } };
}

function setParam(circuit: Circuit, module: string, chip: string, key: string, value: Json): Circuit {
  const m = circuit.modules[module];
  const chips = m.chips.map((c) => (c.id === chip ? { ...c, params: { ...c.params, [key]: value } } : c));
  return { ...circuit, modules: { ...circuit.modules, [module]: { ...m, chips } } };
}

function setAmount(circuit: Circuit, module: string, trace: string, amount: number): Circuit {
  const m = circuit.modules[module];
  const clamped = Math.max(-1, Math.min(1, amount));
  const traces = m.traces.map((t) => (t.id === trace ? { ...t, amount: clamped } : t));
  return { ...circuit, modules: { ...circuit.modules, [module]: { ...m, traces } } };
}

/** A numeric param's range: its spec, else 0–1 (widened to hold the value). */
function specOf(key: string, value: number): Param {
  const spec = PARAM_SPECS[key];
  if (spec) return spec;
  return { kind: 'float', min: Math.min(0, value), max: Math.max(1, value), defaultValue: value, name: key };
}

const valueText = (key: string, value: Json): string =>
  typeof value === 'number'
    ? format(specOf(key, value), value)
    : typeof value === 'string'
      ? value
      : typeof value === 'boolean'
        ? value
          ? 'on'
          : 'off'
        : JSON.stringify(value);

/** `--lib-cord-<kind>: var(--hue-n)` for every kind, and `active` (the current state's way out) in the accent. */
const INKS = {
  ...Object.fromEntries(Object.entries(KIND_HUE).map(([kind, hue]) => [`--lib-cord-${kind}`, inkOf(hue)])),
  '--lib-cord-active': 'var(--accent)',
} as CSSProperties;

/** The canvas: a ruled grid on the base layer, words knocked out of the cords in the same fill. */
const CANVAS = {
  ...INKS,
  '--lib-graph-rule': 'color-mix(in oklab, var(--border) 60%, transparent)',
  '--lib-graph-dot': 'color-mix(in oklab, var(--border-strong) 70%, transparent)',
  '--lib-graph-word-fill': 'var(--layer-base-solid)',
  '--lib-graph-cord-width': '1.75px',
} as CSSProperties;

// ---------------------------------------------------------------------------------------------
// Where a pin sits: its placement, or (auto, in a free layout) the face toward its one other end.

type Spot = { face: GraphFace; at?: number } | { x: number; y: number };

const nearestFace = (x: number, y: number): GraphFace => {
  const d = { n: y, s: 1 - y, w: x, e: 1 - x };
  return (Object.keys(d) as GraphFace[]).reduce((a, b) => (d[b] < d[a] ? b : a));
};

const towards = (dx: number, dy: number): GraphFace =>
  Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'e' : 'w') : dy >= 0 ? 's' : 'n';

/** Each pin's spot on its chip, or none for a pin that keeps its rail (in on the west, out on the east). */
function spotsOf(m: Module, chip: Chip, pins: Pin[]): Map<string, Spot> {
  const spots = new Map<string, Spot>();
  const auto: { key: string; face: GraphFace }[] = [];
  const centre = (c: Chip) => ({ x: c.x + CHIP_W / 2, y: c.y + CHIP_H / 2 });
  for (const p of pins) {
    const key = `${p.side}:${p.id}`;
    const pl = p.placement;
    if (typeof pl === 'string' && pl !== 'auto') spots.set(key, { face: pl });
    else if (pl && typeof pl === 'object' && 'face' in pl) spots.set(key, { face: pl.face, at: pl.at });
    else if (pl && typeof pl === 'object') spots.set(key, { x: pl.x, y: pl.y });
    else if ((m.layout ?? 'free') === 'free') {
      // Auto: the face toward its other end, when it has exactly one.
      const ends = m.traces.flatMap((t) => {
        const mine = p.side === 'out' ? t.from : t.to;
        const other = p.side === 'out' ? t.to : t.from;
        if (!isPinEnd(mine) || mine.chip !== chip.id || mine.pin !== p.id || !isPinEnd(other)) return [];
        const c = m.chips.find((x) => x.id === other.chip);
        return c ? [c] : [];
      });
      if (ends.length !== 1) continue;
      const a = centre(chip);
      const b = centre(ends[0]);
      const face = towards(b.x - a.x, b.y - a.y);
      if (face !== (p.side === 'in' ? 'w' : 'e')) auto.push({ key, face });
    }
  }
  // Auto pins sharing a face spread along it.
  for (const face of ['n', 'e', 's', 'w'] as GraphFace[]) {
    const on = auto.filter((a) => a.face === face);
    on.forEach((a, i) => spots.set(a.key, { face, at: (i + 1) / (on.length + 1) }));
  }
  return spots;
}

const faceOfSpot = (s: Spot): GraphFace => ('face' in s ? s.face : nearestFace(s.x, s.y));

// ---------------------------------------------------------------------------------------------
// The chip face

interface FaceProps {
  circuit: Circuit;
  module: string;
  chip: Chip;
  binding: CircuitBinding;
  connected: ReadonlySet<string>;
  selected: boolean;
  current: boolean;
  onSelect(): void;
  onEnter?(): void;
  more: boolean;
  onMore(next: boolean): void;
}

/** A small square in a kind's hue: the chip's identity at a glance. */
function KindMark({ hue }: { hue?: KindInk }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flex: 'none',
        width: 'var(--space-2)',
        height: 'var(--space-2)',
        borderRadius: 'calc(var(--radius-control) / 2)',
        background: inkOf(hue),
        alignSelf: 'flex-start',
        marginTop: 'calc(var(--space-1) + 1px)',
      }}
    />
  );
}

/** A merge's mark: its in pins drawn converging into one line out, in the quiet ink. */
function MergeMark({ inputs }: { inputs: number }) {
  const n = Math.max(2, inputs);
  const ys = Array.from({ length: n }, (_, i) => 1 + (10 * i) / (n - 1));
  return (
    <svg aria-hidden="true" width="14" height="12" viewBox="0 0 14 12" style={{ flex: 'none', overflow: 'visible', color: 'var(--text-3)' }}>
      {ys.map((y) => (
        <path key={y} d={`M1 ${y} C 5 ${y}, 5 6, 9 6`} fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      ))}
      <path d="M9 6 H13" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

/** The kind a chip is drawn in: its first out pin's, else its first pin's. */
const kindOfChip = (pins: readonly Pin[]) => pins.find((p) => p.side === 'out')?.kind ?? pins[0]?.kind;

/** One param as an inspector line: its name quiet on the left, its value on the right. */
function ParamLine({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', minWidth: 0 }}>
      <Text role="caption" tone="muted" truncate style={{ flex: '0 1 auto', minWidth: 0 }}>
        {name}
      </Text>
      <span style={{ flex: 1, minWidth: 'var(--space-2)', borderBottom: 'var(--border-width) dotted var(--border)', alignSelf: 'center' }} />
      <Text role="caption" tone="primary" truncate style={{ flex: '0 1 auto', minWidth: 0, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Text>
    </div>
  );
}

function ChipFace({ circuit, module, chip, binding, connected, selected, current, onSelect, onEnter, more, onMore }: FaceProps) {
  const m = circuit.modules[module];
  const pins = pinsOf(circuit, module, chip.id);
  const params = Object.entries(chip.params ?? {});
  const spots = spotsOf(m, chip, pins);
  const port = (p: Pin, placed?: Spot, named = !placed) => {
    const key = binding.portKeyOf(chip.id, p.id);
    return (
      <Port
        key={`${p.side}:${p.id}`}
        id={key}
        side={p.side}
        label={p.label ?? p.id}
        showLabel={named && p.label !== undefined}
        kind={p.kind}
        hue={hueOf(p.kind)}
        connected={connected.has(`${p.side}:${key}`)}
        shape={p.param ? 'diamond' : 'round'}
        {...(placed ? { face: faceOfSpot(placed) } : {})}
      />
    );
  };
  const placed = pins.filter((p) => spots.has(`${p.side}:${p.id}`));
  const railed = pins.filter((p) => !spots.has(`${p.side}:${p.id}`));
  // A param pin whose id names a param sits on that param's line; the rest go on the rails.
  const rowPins = railed.filter((p) => p.side === 'in' && p.param && chip.params && p.id in chip.params);
  const onRows = new Set(rowPins.map((p) => p.id));
  const inlets = railed.filter((p) => p.side === 'in' && !onRows.has(p.id));
  const outlets = railed.filter((p) => p.side === 'out');
  // The wiring as rows, in pins down the left and out pins down the right, so the params below
  // get the face's whole width.
  const wiring = Array.from({ length: Math.max(inlets.length, outlets.length) }, (_, n) => [inlets[n], outlets[n]] as const);
  const loose = params.filter(([k]) => !onRows.has(k));
  const shown = loose.slice(0, FACE_PARAMS);
  const hidden = loose.slice(FACE_PARAMS);
  const line = ([k, v]: [string, Json]) => <ParamLine key={k} name={k} value={valueText(k, v)} />;
  const body: ReactNode[] = [...shown.map(line)];
  // Opening grows the face in place; the sheet shows everything anyway.
  if (more) body.push(...hidden.map(line));
  if (hidden.length > 0)
    body.push(
      <DeviceMore key="more" open={more} onToggle={onMore} label={more ? 'Show fewer params' : `${hidden.length} more params`}>
        {more ? 'fewer' : `${hidden.length} more`}
      </DeviceMore>,
    );
  const isMerge = chip.type === 'merge';
  const kicker = chip.module ? (
    <Text role="caption" tone="muted" truncate>
      module · {chip.module}
    </Text>
  ) : current ? (
    <Text role="caption" tone="accent" truncate>
      current state
    </Text>
  ) : isMerge ? (
    `${inlets.length} into 1`
  ) : (
    chip.type
  );
  return (
    <Device
      name={nameOf(chip)}
      kicker={kicker}
      title={`${chip.type} · ${chip.id}`}
      selected={selected}
      onSelect={onSelect}
      pins="edge"
      {...(isMerge ? { headerStart: <MergeMark inputs={inlets.length} /> } : {})}
      headerEnd={
        onEnter ? (
          <Button size="icon" variant="quiet" symbol="next" name={`Enter ${nameOf(chip)}`} onPress={onEnter} />
        ) : current ? (
          <StatusDot hue="ok" name="Current state" />
        ) : undefined
      }
      portRows={
        wiring.length || rowPins.length ? (
          <>
            {wiring.map(([i, o], n) => (
              <DevicePortRow key={`w${n}`} {...(i ? { inlet: port(i) } : {})} {...(o ? { outlet: port(o) } : {})} />
            ))}
            {rowPins.map((p) => (
              <DevicePortRow key={p.id} inlet={port(p, undefined, false)}>
                <ParamLine name={p.label ?? p.id} value={valueText(p.id, chip.params![p.id])} />
              </DevicePortRow>
            ))}
          </>
        ) : undefined
      }
      edges={
        placed.length
          ? placed.map((p) => {
              const s = spots.get(`${p.side}:${p.id}`)!;
              return (
                <DeviceEdge key={`${p.side}:${p.id}`} {...s}>
                  {port(p, s)}
                </DeviceEdge>
              );
            })
          : undefined
      }
    >
      {body.length ? <div style={{ display: 'grid', gap: 'var(--space-1)', minWidth: 0 }}>{body}</div> : undefined}
    </Device>
  );
}

/** A module pin, drawn inside the module at its boundary: where the instance's pin comes in or goes out. */
function Terminal({ id, side, label, kind }: { id: string; side: 'in' | 'out'; label: string; kind?: string }) {
  return (
    <div style={{ '--lib-device-width': 'calc(var(--space-6) * 3.5)', ...(kind ? { '--lib-device-accent': inkOf(hueOf(kind)) } : {}) } as CSSProperties}>
      <Device
        name={label}
        kicker={side === 'in' ? 'module in' : 'module out'}
        pins="edge"
        {...(side === 'in'
          ? { outlets: <Port id={id} side="out" label={label} showLabel={false} kind={kind} hue={hueOf(kind)} connected /> }
          : { inlets: <Port id={id} side="in" label={label} showLabel={false} kind={kind} hue={hueOf(kind)} connected /> })}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Canvas furniture: the legend and the zoom controls.

function Legend({ kinds, modulation, bus }: { kinds: string[]; modulation: boolean; bus: boolean }) {
  const swatch = (ink: string, dash?: boolean, thick?: boolean) => (
    <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden="true" style={{ flex: 'none', overflow: 'visible' }}>
      <path d="M1 4 H17" stroke={ink} strokeWidth={thick ? 4 : 2} strokeLinecap={dash ? 'butt' : 'round'} strokeDasharray={dash ? '4 3' : undefined} />
    </svg>
  );
  if (kinds.length === 0) return null;
  const item = (key: string, mark: ReactNode, word: string) => (
    <li key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flex: 'none' }}>
      {mark}
      <Text role="caption" tone="secondary">
        {word}
      </Text>
    </li>
  );
  return (
    <ul
      aria-label="Legend"
      data-testid="legend"
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: 0, padding: 0, listStyle: 'none', flex: 1, minWidth: 0, overflow: 'hidden', justifyContent: 'flex-end' }}
    >
      {kinds.map((k) => item(k, swatch(inkOf(hueOf(k))), k))}
      {modulation && item('modulation', swatch('var(--text-3)', true), 'modulation')}
      {bus && item('bus', swatch('var(--text-3)', false, true), 'bus rail')}
    </ul>
  );
}

function ZoomBar({ view }: { view: RefObject<GraphView | null> }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flex: 'none' }}>
      <Button size="icon" variant="quiet" symbol="minus" name="Zoom out" onPress={() => view.current?.zoom?.(1 / 1.25)} />
      <Button size="icon" variant="quiet" symbol="plus" name="Zoom in" onPress={() => view.current?.zoom?.(1.25)} />
      <Button variant="quiet" label="Fit" name="Fit to view" onPress={() => view.current?.fit(1)} />
    </div>
  );
}

/** The stage's height: most of the window, never less than a comfortable minimum. */
const STAGE_H = 'max(calc(var(--space-6) * 16), calc(100vh - var(--space-6) * 6))';

// ---------------------------------------------------------------------------------------------
// The JSON panel: the live circuit, its validity and the module's controls.

const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;

/** The circuit's JSON, coloured by token: keys, strings, literals and numbers, punctuation quiet. */
function JsonText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  let n = 0;
  const push = (s: string, tone: TextTone) =>
    parts.push(
      <Text key={n++} role="code" tone={tone}>
        {s}
      </Text>,
    );
  for (const m of text.matchAll(TOKEN)) {
    if (m.index! > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      push(m[1], m[2] !== undefined ? 'secondary' : 'primary');
      if (m[2] !== undefined) push(m[2], 'faint');
    } else if (m[3] !== undefined || m[4] !== undefined) push(m[0], 'accent');
    else push(m[0], 'faint');
    last = m.index! + m[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

interface PanelProps {
  circuit: Circuit;
  module: string;
  onParam(chip: string, key: string, value: Json): void;
}

function CircuitPanel({ circuit, module, onParam }: PanelProps) {
  const issues = useMemo(() => validate(circuit), [circuit]);
  const json = useMemo(() => JSON.stringify(circuit, null, 2), [circuit]);
  const [copied, setCopied] = useState(false);
  const m = circuit.modules[module];
  const controls = m.controls ?? [];
  const lines = json.split('\n').length;
  return (
    <Surface
      layer="base"
      border
      style={{
        flex: '1 1 clamp(calc(var(--space-6) * 7), 30%, calc(var(--space-6) * 11))',
        maxWidth: 'calc(var(--space-6) * 12)',
        minWidth: 0,
        height: STAGE_H,
        display: 'grid',
        gridTemplateRows: 'auto auto 1fr',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-3)',
          boxShadow: 'inset 0 calc(var(--border-width) * -1) 0 var(--border)',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'grid', flex: 1, minWidth: 0 }}>
          <Text role="label" truncate>
            circuit.json
          </Text>
          <Text role="caption" tone={issues.length ? 'danger' : 'muted'} truncate data-testid="validity">
            {issues.length ? `${issues.length} issues` : 'valid'} · module {module} · {lines} lines
          </Text>
        </div>
        <StatusDot hue={issues.length ? 'd' : 'ok'} name={issues.length ? 'Has issues' : 'Valid'} />
        <Button
          variant="quiet"
          label={copied ? 'Copied' : 'Copy'}
          onPress={() => {
            void navigator.clipboard?.writeText(json).then(() => setCopied(true), () => undefined);
            setTimeout(() => setCopied(false), 1200);
          }}
        />
      </div>
      <div style={{ display: 'grid', gap: 'var(--space-2)', padding: controls.length || issues.length ? 'var(--space-3)' : 0, boxShadow: controls.length || issues.length ? 'inset 0 calc(var(--border-width) * -1) 0 var(--border)' : undefined }}>
        {issues.map((i, k) => (
          <Text key={k} role="caption" tone="danger" truncate>
            {i.path}: {i.message}
          </Text>
        ))}
        {controls.length > 0 && (
          <>
            <Text role="caption" case="label" tone="muted">
              Controls
            </Text>
            {controls.map((c) => {
              const chip = m.chips.find((x) => x.id === c.maps.chip);
              const value = chip?.params?.[c.maps.param];
              if (typeof value !== 'number') return null;
              return (
                <Slider
                  key={c.id}
                  param={specOf(c.maps.param, value)}
                  value={value}
                  onChange={(next) => onParam(c.maps.chip, c.maps.param, next)}
                  layout="row"
                  name={c.label ?? c.id}
                  label={c.label ?? c.id}
                  length="auto"
                />
              );
            })}
          </>
        )}
      </div>
      <pre style={{ margin: 0, overflow: 'auto', minHeight: 0, padding: 'var(--space-2) var(--space-3)', tabSize: 2 }} data-testid="circuit-json">
        <JsonText text={json} />
      </pre>
    </Surface>
  );
}

// ---------------------------------------------------------------------------------------------
// The workflow: one module of a circuit in state, drawn through `useCircuit`, entered and left by
// breadcrumbs, its JSON beside it.

interface Level {
  module: string;
  label: string;
  kicker?: string;
}

interface WorkflowProps {
  initial: Circuit;
  label: string;
  /** What the story shows, in a line, printed over the canvas. */
  blurb: string;
  /** Instance chips to enter on the way in, outermost first. */
  enter?: string[];
  /** A chip drawn as the current state: its ring, a lamp, and only its ways out at full ink. */
  current?: string;
}

function levelsFor(circuit: Circuit, enter: string[] = []): Level[] {
  const levels: Level[] = [{ module: circuit.board, label: 'Board' }];
  for (const id of enter) {
    const here = circuit.modules[levels[levels.length - 1].module];
    const chip = here?.chips.find((c) => c.id === id && c.module);
    if (!chip?.module || !circuit.modules[chip.module]) break;
    levels.push({ module: chip.module, label: nameOf(chip), kicker: chip.module });
  }
  return levels;
}

function Workflow({ initial, label, blurb, enter, current }: WorkflowProps) {
  const [circuit, setCircuit] = useState(initial);
  const [levels, setLevels] = useState<Level[]>(() => levelsFor(initial, enter));
  const mod = levels[levels.length - 1].module;
  const onChange = useCallback((next: Circuit) => setCircuit(inkNewTraces(next, mod)), [mod]);
  const binding = useCircuit(circuit, mod, onChange);
  const [selected, setSelected] = useState<string | null>(null);
  const [more, setMore] = useState<Record<string, boolean>>({});
  const [parked, setParked] = useState<NodeSheetPlace | null>(null);
  const [showJson, setShowJson] = useState(true);
  const anchor = useRef<HTMLDivElement | null>(null);
  const view = useRef<GraphView>(null);
  const m = circuit.modules[mod];
  // Module units are drawn at the pack's spacing: a chip is `--space-6` × 5 wide, so positions
  // stretch by the same step and a roomy pack's faces don't run into each other.
  const stage = useRef<HTMLDivElement | null>(null);
  const [unit, setUnit] = useState(1);
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const step = parseFloat(getComputedStyle(el).getPropertyValue('--space-6'));
    const next = Number.isFinite(step) && step > 0 ? step / BASE_STEP : 1;
    if (Math.abs(next - unit) > 0.001) setUnit(next);
  });
  const onMove = useCallback((id: string, x: number, y: number) => binding.onMove(id, Math.round(x / unit), Math.round(y / unit)), [binding, unit]);

  // Frame the module once it's drawn (after its faces and frames have measured), and again when
  // another module is shown, the pack's step changes or the panel shows or hides. A timer, not a
  // frame: a window behind others gets no frames.
  useEffect(() => setSelected(null), [mod]);
  useEffect(() => {
    const id = setTimeout(() => view.current?.fit(1), 80);
    return () => clearTimeout(id);
  }, [mod, unit, showJson]);

  const traceById = useMemo(() => new Map(m.traces.map((t) => [t.id, t])), [m.traces]);
  const cords: GraphCord[] = useMemo(
    () =>
      binding.cords.map((c) => {
        const t = c.id ? traceById.get(c.id) : undefined;
        const out: GraphCord = { ...c };
        if (t?.label) out.label = t.label;
        if (t?.role === 'modulation') {
          out.role = 'modulation';
          if (t.amount !== undefined) out.amount = t.amount;
        }
        if (t && !isPinEnd(t.from)) out.bus = t.from.bus;
        if (current) {
          if (c.from.startsWith(`${current}/`)) out.kind = 'active';
          else out.dim = true;
        }
        return out;
      }),
    [binding.cords, traceById, current],
  );

  /** A chip's width (a merge is narrow) and its kind's hue on the head's leading edge. */
  const chipStyle = (c: Chip) => {
    const hue = hueOf(kindOfChip(pinsOf(circuit, mod, c.id)));
    return {
      '--lib-device-width': c.type === 'merge' ? 'calc(var(--space-6) * 3.5)' : 'calc(var(--space-6) * 5)',
      ...(hue !== undefined ? { '--lib-device-accent': inkOf(hue) } : {}),
    } as CSSProperties;
  };

  // Inside a module, its pins stand at the boundary, wired to the inner pins they stand for.
  const terminals = useMemo(() => {
    if (mod === circuit.board || m.chips.length === 0) return [];
    const minX = Math.min(...m.chips.map((c) => c.x));
    const maxX = Math.max(...m.chips.map((c) => c.x));
    const yOf = (chip: string) => (m.chips.find((c) => c.id === chip)?.y ?? 0) + CHIP_H / 3;
    return [
      ...m.inPins.map((p) => ({ id: `⟨in⟩${p.id}`, side: 'in' as const, label: p.label ?? p.id, kind: p.kind, x: minX - CHIP_W - 60, y: 'chip' in p.maps ? yOf(p.maps.chip) : 0, maps: p.maps })),
      ...m.outPins.map((p) => ({ id: `⟨out⟩${p.id}`, side: 'out' as const, label: p.label ?? p.id, kind: p.kind, x: maxX + CHIP_W + 80, y: 'chip' in p.maps ? yOf(p.maps.chip) : 0, maps: p.maps })),
    ];
  }, [mod, circuit.board, m]);
  const boundary: GraphCord[] = terminals.flatMap((t) =>
    'chip' in t.maps
      ? [
          t.side === 'in'
            ? { from: `${t.id}/port`, to: binding.portKeyOf(t.maps.chip, t.maps.pin), kind: t.kind }
            : { from: binding.portKeyOf(t.maps.chip, t.maps.pin), to: `${t.id}/port`, kind: t.kind },
        ]
      : [],
  );

  // Buses: each rail fed by its source trace's out pin, placed by its hint.
  const buses: GraphBus[] = useMemo(
    () =>
      (m.buses ?? []).map((b) => {
        const source = m.traces.find((t) => !isPinEnd(t.to) && t.to.bus === b.id && isPinEnd(t.from));
        const from = source && isPinEnd(source.from) ? binding.portKeyOf(source.from.chip, source.from.pin) : undefined;
        return {
          id: b.id,
          ...(b.label ? { label: b.label } : {}),
          ...(b.kind ? { kind: b.kind } : {}),
          ...(from ? { from } : {}),
          ...(b.rail ? { axis: b.rail.axis, ...(b.rail.at !== undefined ? { at: b.rail.at * unit } : {}) } : {}),
        };
      }),
    [m.buses, m.traces, binding, unit],
  );
  const zones: GraphZone[] = useMemo(
    () => (m.zones ?? []).map((z) => ({ id: z.id, ...(z.label ? { label: z.label } : {}), nodes: m.chips.filter((c) => c.zone === z.id).map((c) => c.id) })),
    [m.zones, m.chips],
  );

  const connected = useMemo(
    () => new Set([...binding.cords, ...boundary].flatMap((c) => [`out:${c.from}`, `in:${c.to}`])),
    [binding.cords, boundary],
  );
  const kinds = useMemo(() => {
    const seen = new Set<string>();
    for (const c of m.chips) for (const p of pinsOf(circuit, mod, c.id)) if (p.kind) seen.add(p.kind);
    for (const t of m.traces) if (t.kind) seen.add(t.kind);
    return [...seen].filter((k) => KIND_HUE[k] !== undefined);
  }, [circuit, mod, m]);
  const chip = selected ? m.chips.find((c) => c.id === selected) : undefined;
  const enterChip = (c: Chip) => {
    if (!c.module || !circuit.modules[c.module]) return;
    setLevels((ls) => [...ls, { module: c.module!, label: nameOf(c), kicker: c.module }]);
  };
  const steps: GraphPathStep[] = levels.map((l) => ({ id: l.module, label: l.label, ...(l.kicker ? { kicker: l.kicker } : {}) }));

  return (
    <div style={{ display: 'grid', gap: 'var(--space-3)', color: 'var(--text-1)', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', minWidth: 0 }}>
        <div style={{ display: 'grid', flex: '1 1 calc(var(--space-6) * 10)', minWidth: 0 }}>
          <Text role="heading" truncate>
            {label}
          </Text>
          <Text role="caption" tone="muted" truncate>
            {blurb}
          </Text>
        </div>
        <Text role="caption" tone="muted" style={{ flex: 'none' }}>
          {m.chips.length} chips · {m.traces.length} traces{(m.buses ?? []).length ? ` · ${m.buses!.length} bus` : ''}
        </Text>
        <Button variant="quiet" label="JSON" name="Show the circuit JSON" pressed={showJson} chosen={showJson} onPress={() => setShowJson((s) => !s)} />
      </div>
      <div ref={stage} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'stretch', minWidth: 0 }}>
        <Surface
          layer="base"
          border
          style={{
            ...CANVAS,
            flex: '999 1 calc(var(--space-6) * 14)',
            minWidth: 0,
            height: STAGE_H,
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 'var(--space-1) var(--space-2)', boxShadow: 'inset 0 calc(var(--border-width) * -1) 0 var(--border)', minWidth: 0 }}>
            <GraphPath
              steps={steps}
              onNavigate={(i) => setLevels((ls) => ls.slice(0, i + 1))}
              end={
                levels.length > 1 ? (
                  <Button variant="quiet" symbol="up" label="Leave" name="Leave module" onPress={() => setLevels((ls) => ls.slice(0, -1))} />
                ) : (
                  <Text role="caption" tone="faint">
                    {m.routing === 'trace' ? 'trace routing' : 'curve routing'} · {m.layout ?? 'free'} layout
                  </Text>
                )
              }
            />
          </div>
          <div style={{ position: 'relative', minHeight: 0 }}>
            <Graph
              label={label}
              viewRef={view}
              cords={[...cords, ...boundary]}
              routing={m.routing ?? 'curve'}
              buses={buses}
              zones={zones}
              fitAlign="center"
              fitOnResize
              onConnect={binding.onConnect}
              onMove={onMove}
              onDisconnect={binding.onDisconnect}
              onClearSelection={() => setSelected(null)}
            >
              {m.chips.map((c) => (
                <GraphNode key={c.id} id={c.id} x={c.x * unit} y={c.y * unit}>
                  <div
                    ref={c.id === selected ? anchor : undefined}
                    style={chipStyle(c)}
                    onDoubleClick={c.module ? () => enterChip(c) : undefined}
                  >
                    <ChipFace
                      circuit={circuit}
                      module={mod}
                      chip={c}
                      binding={binding}
                      connected={connected}
                      selected={c.id === selected || c.id === current}
                      current={c.id === current}
                      onSelect={() => setSelected((s) => (s === c.id ? null : c.id))}
                      {...(c.module ? { onEnter: () => enterChip(c) } : {})}
                      more={!!more[c.id]}
                      onMore={(next) => setMore((all) => ({ ...all, [c.id]: next }))}
                    />
                  </div>
                </GraphNode>
              ))}
              {terminals.map((t) => (
                <GraphNode key={t.id} id={t.id} x={t.x * unit} y={t.y * unit}>
                  <Terminal id={`${t.id}/port`} side={t.side} label={t.label} kind={t.kind} />
                </GraphNode>
              ))}
            </Graph>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-1) var(--space-2)',
              boxShadow: 'inset 0 var(--border-width) 0 var(--border)',
              minWidth: 0,
            }}
          >
            <ZoomBar view={view} />
            <Legend kinds={kinds} modulation={m.traces.some((t) => t.role === 'modulation')} bus={(m.buses ?? []).length > 0} />
          </div>
          {chip && (
            <ChipSheet
              key={chip.id}
              circuit={circuit}
              module={mod}
              chip={chip}
              anchor={anchor}
              parked={parked}
              onPark={setParked}
              onDismiss={() => setSelected(null)}
              onParam={(key, value) => setCircuit((c) => setParam(c, mod, chip.id, key, value))}
              onAmount={(trace, amount) => setCircuit((c) => setAmount(c, mod, trace, amount))}
            />
          )}
        </Surface>
        {showJson && <CircuitPanel circuit={circuit} module={mod} onParam={(c, key, value) => setCircuit((was) => setParam(was, mod, c, key, value))} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The sheet: a chip's params and incoming traces, hung beside it.

interface SheetProps {
  circuit: Circuit;
  module: string;
  chip: Chip;
  anchor: RefObject<HTMLDivElement | null>;
  parked: NodeSheetPlace | null;
  onPark(at: NodeSheetPlace | null): void;
  onDismiss(): void;
  onParam(key: string, value: Json): void;
  onAmount(trace: string, amount: number): void;
}

function ChipSheet({ circuit, module, chip, anchor, parked, onPark, onDismiss, onParam, onAmount }: SheetProps) {
  const m = circuit.modules[module];
  const chipName = (id: string) => {
    const c = m.chips.find((x) => x.id === id);
    return c ? nameOf(c) : id;
  };
  const sourceName = (t: Trace) => (isPinEnd(t.from) ? chipName(t.from.chip) : ((m.buses ?? []).find((b) => b.id === (t.from as { bus: string }).bus)?.label ?? 'bus'));
  const incoming = m.traces.filter((t) => isPinEnd(t.to) && t.to.chip === chip.id);
  const outgoing = m.traces.filter((t) => isPinEnd(t.from) && t.from.chip === chip.id);
  /** The modulation landing on a param: a modulation trace into the param pin of that name. */
  const driverOf = (key: string) => incoming.find((t) => t.role === 'modulation' && isPinEnd(t.to) && t.to.pin === key);
  const params = Object.entries(chip.params ?? {});
  const traceLine = (t: Trace, other: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
      <KindMark hue={hueOf(t.kind)} />
      <Text role="caption" tone="secondary" truncate style={{ flex: 1, minWidth: 0 }}>
        {other}
      </Text>
      {(t.label || t.amount !== undefined) && (
        <Text role="caption" tone="muted" truncate>
          {t.label ?? ''}
          {t.amount !== undefined ? `${t.label ? ' · ' : ''}${Math.round(t.amount * 100)}%` : ''}
        </Text>
      )}
    </div>
  );
  return (
    <NodeSheet
      name={nameOf(chip)}
      about={chip.module ? `module ${chip.module}` : chip.type}
      anchor={anchor}
      parked={parked}
      onPark={onPark}
      onDismiss={onDismiss}
      label={`${nameOf(chip)} settings`}
    >
      {params.length > 0 && (
        <NodeSheetSection heading="Params">
          {params.map(([key, value]) => {
            const drive = driverOf(key);
            return (
              <NodeSheetRow key={key} name={key}>
                {typeof value === 'number' ? (
                  <Slider
                    param={specOf(key, value)}
                    value={value}
                    onChange={(next) => onParam(key, next)}
                    layout="row"
                    name=""
                    label={key}
                    length="auto"
                    {...(drive ? { driver: sourceName(drive), depth: drive.amount ?? 0, onDepth: (next: number) => onAmount(drive.id, next) } : {})}
                  />
                ) : (
                  <Text role="caption" tone="primary" truncate>
                    {valueText(key, value)}
                  </Text>
                )}
              </NodeSheetRow>
            );
          })}
        </NodeSheetSection>
      )}
      <NodeSheetSection heading="In">
        {incoming.length === 0 ? (
          <Text role="caption" tone="muted">
            Nothing feeds this chip.
          </Text>
        ) : (
          incoming.map((t) => (
            <NodeSheetRow key={t.id} name={(t.to as { pin: string }).pin} driver={t.role === 'modulation' ? sourceName(t) : undefined} title={t.id}>
              {traceLine(t, `from ${sourceName(t)}`)}
            </NodeSheetRow>
          ))
        )}
      </NodeSheetSection>
      {outgoing.length > 0 && (
        <NodeSheetSection heading="Out">
          {outgoing.map((t) => (
            <NodeSheetRow key={t.id} name={(t.from as { pin: string }).pin} title={t.id}>
              {traceLine(t, isPinEnd(t.to) ? `to ${chipName(t.to.chip)}` : `onto ${(m.buses ?? []).find((b) => b.id === (t.to as { bus: string }).bus)?.label ?? 'bus'}`)}
            </NodeSheetRow>
          ))}
        </NodeSheetSection>
      )}
    </NodeSheet>
  );
}

// ---------------------------------------------------------------------------------------------

const meta: Meta = {
  title: 'Design OS/Graph/Circuit/Samples',
  decorators: [withLibraryTheme],
  parameters: { layout: 'padded' },
};
export default meta;

const HOW =
  'Drag a chip to move it, drag from an out pin to an in pin to connect, click a cord and press Delete to remove it, click a chip\'s name for its sheet; the JSON beside the canvas is the live `Circuit`.';

const story = (line: string) => ({ docs: { description: { story: `${line} ${HOW}` } } });

const BLURB = {
  patch: 'Oscillator through a filter to the output, with an LFO modulating the cutoff by +40%.',
  diffusion: 'A diffusion pipeline: the checkpoint\u2019s VAE on a bus rail, four zones, and an upscale module placed twice.',
  session: 'The job lifecycle as a state machine: pass and fail leave from their own pins, Repair loops back.',
  tdd: 'Modules three deep: enter Feature, then TDD, by the breadcrumb trail or a chip\u2019s arrow.',
  brain: 'Threads that feed, dogfood and block each other, and three assistants tapping one context bus.',
  root: 'A seed whose roots leave from the face that points at each end: placed pins, trace routing.',
} as const;

const cordCount = (root: HTMLElement) => root.querySelectorAll('[data-part="cord"]:not([data-pending])').length;

export const Patch: StoryObj = {
  render: () => <Workflow initial={CIRCUITS.patch} label="Patch" blurb={BLURB.patch} />,
  parameters: story(`${BLURB.patch} The modulation is dashed with its amount by the cutoff\u2019s diamond pin; the module\u2019s \`controls\` show as sliders in the panel.`),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(cordCount(canvasElement)).toBe(3));
    await waitFor(() => expect(canvasElement.querySelector('[data-testid="validity"]')).toHaveTextContent('valid'));
    await waitFor(() => expect(canvasElement.querySelector('[data-part="cord"][data-role="modulation"]')).not.toBeNull());
    expect(canvasElement.querySelector('[data-part="cord-amount"]')).toHaveTextContent('+40%');
  },
};

export const Diffusion: StoryObj = {
  render: () => <Workflow initial={CIRCUITS.diffusion} label="Diffusion" blurb={BLURB.diffusion} />,
  parameters: story(`${BLURB.diffusion} Each VAE tap is a short stub off the rail; the upscale chips open with their arrow.`),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('[data-part="rail"]')).not.toBeNull());
    expect(canvasElement.querySelectorAll('[data-part="cord"][data-bus="vae"]')).toHaveLength(3);
    expect(canvasElement.querySelectorAll('[data-part="zone"]')).toHaveLength(4);
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Enter Upscale ×2' }));
    await waitFor(() => expect(within(canvasElement).getByRole('navigation', { name: 'Module path' })).toHaveTextContent('Upscale ×2'));
    await waitFor(() => expect(canvasElement.querySelector('[data-testid="validity"]')).toHaveTextContent('module upscale'));
    // And back out by the trail, so the story rests on the board.
    await userEvent.click(within(canvasElement).getByRole('button', { name: /Board/ }));
    await waitFor(() => expect(canvasElement.querySelector('[data-testid="validity"]')).toHaveTextContent('module board'));
  },
};

export const SessionLifecycle: StoryObj<{ mode: SessionState }> = {
  args: { mode: 'working' },
  argTypes: { mode: { control: 'select', options: SESSION_STATES } },
  render: ({ mode }) => <Workflow initial={CIRCUITS.session} label="Session lifecycle" blurb={BLURB.session} current={mode} />,
  parameters: story(`${BLURB.session} The \`mode\` control picks the current state: its ways out are drawn in the accent and the rest recede.`),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll('[data-part="cord-label"]').length).toBeGreaterThan(8));
    expect(canvasElement.querySelectorAll('[data-part="zone"]')).toHaveLength(4);
  },
};

export const TddModule: StoryObj<{ start: 'board' | 'feature' | 'tdd' }> = {
  args: { start: 'board' },
  argTypes: { start: { control: 'select', options: ['board', 'feature', 'tdd'] } },
  render: ({ start }) => (
    <Workflow
      key={start}
      initial={CIRCUITS.tdd}
      label="TDD module"
      blurb={BLURB.tdd}
      enter={start === 'board' ? [] : start === 'feature' ? ['feature'] : ['feature', 'tdd']}
    />
  ),
  parameters: story(`${BLURB.tdd} Inside a module its pins stand at the boundary, wired to the inner pins they map to; \`start\` opens at a level.`),
  play: async ({ canvasElement, args }) => {
    if (args.start !== 'board') return;
    const nav = () => within(canvasElement).getByRole('navigation', { name: 'Module path' });
    await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Enter Feature' }));
    await waitFor(() => expect(nav()).toHaveTextContent('Feature'));
    await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Enter TDD' }));
    await waitFor(() => expect(canvasElement.querySelector('[data-testid="validity"]')).toHaveTextContent('module tdd'));
    await userEvent.click(within(nav()).getByRole('button', { name: /Board/ }));
    await waitFor(() => expect(canvasElement.querySelector('[data-testid="validity"]')).toHaveTextContent('module board'));
  },
};

export const BrainBoard: StoryObj = {
  render: () => <Workflow initial={CIRCUITS.brain} label="Brain board" blurb={BLURB.brain} />,
  parameters: story(`${BLURB.brain} Each trace carries its verb; the lexicon feeds a vertical rail the assistants tap.`),
};

export const RootSystem: StoryObj = {
  render: () => <Workflow initial={CIRCUITS.root} label="Root system" blurb={BLURB.root} />,
  parameters: story(`${BLURB.root} \`layout: 'free'\`: the radial shape is in the stored positions.`),
};
