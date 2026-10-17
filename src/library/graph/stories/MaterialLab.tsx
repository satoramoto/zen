// The material lab (docs/shader-graph.md, "Stories"): a shader material's circuit in the graph
// editor beside a surface wearing it. Turning a number updates the surface live through
// `uParams`; connecting or deleting a cord changes the circuit's structure and recompiles. With
// `meta`, the board's own backdrop is the material drawn on it.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { LayerName } from '../../contract';
import type { HueSlot } from '../../components/core/hue';
import { Surface } from '../../primitives/Surface';
import { Text } from '../../primitives/Text';
import { Button } from '../../components/core/Button/Button';
import { Select } from '../../components/core/Select/Select';
import { Slider } from '../../components/core/Slider/Slider';
import { format } from '../../components/core/Param/format';
import type { Param } from '../../components/core/Param/param';
import { Device, DevicePortRow } from '../view/Device/Device';
import { Graph, GraphNode, type GraphView } from '../view/Graph/Graph';
import { Port } from '../view/Graph/Port';
import { pinsOf, type Chip, type Circuit, type Json, type Pin, type Trace } from '../model/circuit';
import { useCircuit, type CircuitBinding } from '../model/useCircuit';
import { SHADER_NODES } from '../../shader/nodes';
import { structureKey } from '../../shader/compile';
import { useShaderMaterial } from '../../shader/useShaderMaterial';
import { ShaderCanvas } from '../../shader/ShaderCanvas';
import type { ParamSlot, PinKind, ShaderError, ShaderSource } from '../../shader/types';
import './MaterialLab.css';

// ---------------------------------------------------------------------------------------------
// Host concerns: the kinds' inks, chip names, and the edits the lab makes to its circuit.

/** Each pin kind's hue slot (the cords' inks in MaterialLab.css follow it). */
export const KIND_HUE: Record<PinKind, HueSlot> = { point: 1, number: 2, colour: 3 };
const KINDS: PinKind[] = ['point', 'number', 'colour'];
const HUE_INK: Record<HueSlot, string> = { 1: 'var(--hue-1)', 2: 'var(--hue-2)', 3: 'var(--hue-3)', 4: 'var(--hue-4)', 5: 'var(--hue-5)' };
const hueOf = (kind: string | undefined): HueSlot | undefined => (kind && kind in KIND_HUE ? KIND_HUE[kind as PinKind] : undefined);

/** The `--space-6` the materials' positions were laid out at (a compact pack's); other packs stretch them. */
const BASE_STEP = 32;

const specOf = (chip: Chip) => (Object.prototype.hasOwnProperty.call(SHADER_NODES, chip.type) ? SHADER_NODES[chip.type] : undefined);
const nameOf = (chip: Chip) => (typeof chip.name === 'string' ? chip.name : (specOf(chip)?.label ?? chip.type));
const isPinEnd = (end: Trace['from']): end is { chip: string; pin: string } => 'chip' in end;

/** A trace the binding made has no kind: give it its out pin's, so it's inked (and the compiler can check it). */
function inkNewTraces(circuit: Circuit): Circuit {
  const module = circuit.board;
  const m = circuit.modules[module];
  if (!m || m.traces.every((t) => t.kind !== undefined)) return circuit;
  const traces = m.traces.map((t) => {
    if (t.kind !== undefined || !isPinEnd(t.from)) return t;
    const from = t.from;
    const kind = pinsOf(circuit, module, from.chip).find((p) => p.side === 'out' && p.id === from.pin)?.kind;
    return kind === undefined ? t : { ...t, kind };
  });
  return { ...circuit, modules: { ...circuit.modules, [module]: { ...m, traces } } };
}

function setChipParam(circuit: Circuit, chip: string, key: string, value: Json): Circuit {
  const module = circuit.board;
  const m = circuit.modules[module];
  const chips = m.chips.map((c) => (c.id === chip ? { ...c, params: { ...c.params, [key]: value } } : c));
  return { ...circuit, modules: { ...circuit.modules, [module]: { ...m, chips } } };
}

/** A slot as a `Param` for a `Slider`: its range (widened to hold its value), step and unit. */
function paramOf(slot: ParamSlot): Param {
  const min = Math.min(slot.min ?? 0, slot.value);
  const max = Math.max(slot.max ?? 1, slot.value);
  return {
    kind: 'float',
    min,
    max,
    defaultValue: slot.value,
    unit: slot.unit ? 'custom' : 'float',
    ...(slot.unit ? { customUnit: slot.unit } : {}),
    ...(slot.step ? { steps: Math.round((max - min) / slot.step) + 1 } : {}),
    name: slot.label ?? slot.param,
  };
}

const errorText = (e: ShaderError) => `${e.chip ? `${e.chip}${e.pin ? `.${e.pin}` : ''}: ` : ''}${e.message}`;

// ---------------------------------------------------------------------------------------------
// The editor state: the circuit, its binding to the graph, the compiled material, the selection.

interface Editor {
  circuit: Circuit;
  binding: CircuitBinding;
  frag: string | null;
  params: Float32Array;
  slots: ParamSlot[];
  errors: ShaderError[];
  /** How many times the structure has changed (and so the frag been recompiled), counting the first. */
  compiles: number;
  selected: string | null;
  select(id: string | null): void;
  setParam(chip: string, key: string, value: Json): void;
}

function useMaterialEditor(initial: Circuit): Editor {
  const [circuit, setCircuit] = useState(initial);
  const onChange = useCallback((next: Circuit) => setCircuit(inkNewTraces(next)), []);
  const binding = useCircuit(circuit, circuit.board, onChange);
  const material = useShaderMaterial(circuit);
  const [selected, select] = useState<string | null>(null);
  // Count structure changes: useShaderMaterial recompiles exactly when this key changes.
  const key = useMemo(() => structureKey(circuit), [circuit]);
  const seen = useRef<{ key: string | null; n: number }>({ key: null, n: 0 });
  if (seen.current.key !== key) seen.current = { key, n: seen.current.n + 1 };
  const setParam = useCallback((chip: string, k: string, value: Json) => setCircuit((c) => setChipParam(c, chip, k, value)), []);
  return { circuit, binding, ...material, compiles: seen.current.n, selected, select, setParam };
}

// ---------------------------------------------------------------------------------------------
// The chip face: the node's label, its type (and options), its pins in their kinds' hues, and
// each number inlet on its own line with its value.

function ParamLine({ name, value }: { name: string; value: string }) {
  return (
    <div className="lib-material-lab__row">
      <Text role="caption" tone="muted" truncate style={{ flex: '0 1 auto', minWidth: 0 }}>
        {name}
      </Text>
      <span className="lib-material-lab__rule" />
      <Text role="caption" tone="primary" tabular style={{ flex: 'none' }}>
        {value}
      </Text>
    </div>
  );
}

interface FaceProps {
  chip: Chip;
  pins: Pin[];
  slots: ReadonlyMap<string, ParamSlot>;
  binding: CircuitBinding;
  connected: ReadonlySet<string>;
  selected: boolean;
  problem: boolean;
  onSelect(): void;
}

function ChipFace({ chip, pins, slots, binding, connected, selected, problem, onSelect }: FaceProps) {
  const spec = specOf(chip);
  const options = Object.entries(spec?.options ?? {}).map(([k, o]) => {
    const v = chip.params?.[k];
    return typeof v === 'string' && o.values.includes(v) ? v : o.default;
  });
  const port = (p: Pin, named = true) => {
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
        shape={p.side === 'in' && p.kind === 'number' ? 'diamond' : 'round'}
      />
    );
  };
  const numbers = pins.filter((p) => p.side === 'in' && p.kind === 'number');
  const inlets = pins.filter((p) => p.side === 'in' && p.kind !== 'number');
  const outlets = pins.filter((p) => p.side === 'out');
  const wiring = Array.from({ length: Math.max(inlets.length, outlets.length) }, (_, n) => [inlets[n], outlets[n]] as const);
  const valueOf = (p: Pin) => {
    if (connected.has(`in:${binding.portKeyOf(chip.id, p.id)}`)) return 'wired';
    const slot = slots.get(p.id);
    return slot ? format(paramOf(slot), slot.value) : '–';
  };
  return (
    <Device
      name={nameOf(chip)}
      kicker={chip.module ? `module · ${chip.module}` : [chip.type, ...options].join(' · ')}
      title={`${chip.type} · ${chip.id}`}
      selected={selected}
      problem={problem}
      onSelect={onSelect}
      pins="edge"
      portRows={
        wiring.length || numbers.length ? (
          <>
            {wiring.map(([i, o], n) => (
              <DevicePortRow key={`w${n}`} {...(i ? { inlet: port(i) } : {})} {...(o ? { outlet: port(o) } : {})} />
            ))}
            {numbers.map((p) => (
              <DevicePortRow key={p.id} inlet={port(p, false)}>
                <ParamLine name={p.label ?? p.id} value={valueOf(p)} />
              </DevicePortRow>
            ))}
          </>
        ) : undefined
      }
    />
  );
}

/** The kind a chip is drawn in: its first out pin's, else its first pin's. */
const kindOfChip = (pins: readonly Pin[]) => pins.find((p) => p.side === 'out')?.kind ?? pins[0]?.kind;

// ---------------------------------------------------------------------------------------------
// The board: the circuit's chips and cords in a `Graph`, with zoom and a legend underneath.

function Board({ editor, label, ground, meta }: { editor: Editor; label: string; ground?: ReactNode; meta?: boolean }) {
  const { circuit, binding, slots, errors, selected, select } = editor;
  const mod = circuit.board;
  const m = circuit.modules[mod];
  const view = useRef<GraphView>(null);
  // Module units are drawn at the pack's spacing, as the Circuit samples do.
  const box = useRef<HTMLDivElement | null>(null);
  const [unit, setUnit] = useState(1);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const step = parseFloat(getComputedStyle(el).getPropertyValue('--space-6'));
    const next = Number.isFinite(step) && step > 0 ? step / BASE_STEP : 1;
    if (Math.abs(next - unit) > 0.001) setUnit(next);
  });
  // Frame the board once its faces have measured, and again when the pack's step changes. A
  // timer, not a frame: a window behind others gets no frames.
  useEffect(() => {
    // Twice: the faces' fonts and widths can settle after the first measure.
    const ids = [80, 400].map((ms) => setTimeout(() => view.current?.fit(1), ms));
    return () => ids.forEach(clearTimeout);
  }, [unit]);
  const onMove = useCallback((id: string, x: number, y: number) => binding.onMove(id, Math.round(x / unit), Math.round(y / unit)), [binding, unit]);
  const connected = useMemo(() => new Set(binding.cords.flatMap((c) => [`out:${c.from}`, `in:${c.to}`])), [binding.cords]);
  const byChip = useMemo(() => {
    const map = new Map<string, Map<string, ParamSlot>>();
    for (const s of slots) {
      if (!map.has(s.chip)) map.set(s.chip, new Map());
      map.get(s.chip)!.set(s.param, s);
    }
    return map;
  }, [slots]);
  const faulty = useMemo(() => new Set(errors.flatMap((e) => (e.chip ? [e.chip] : []))), [errors]);
  const none = new Map<string, ParamSlot>();
  return (
    <Surface ref={box} layer="base" border className="lib-material-lab__editor" data-meta={meta ? '' : undefined} data-testid="material-board">
      {ground}
      <div className="lib-material-lab__graph">
        <Graph
          label={label}
          viewRef={view}
          minZoom={0.1}
          cords={binding.cords}
          fitAlign="center"
          fitOnResize
          onConnect={binding.onConnect}
          onMove={onMove}
          onDisconnect={binding.onDisconnect}
          onClearSelection={() => select(null)}
        >
          {m.chips.map((c) => {
            const pins = pinsOf(circuit, mod, c.id);
            const hue = hueOf(kindOfChip(pins));
            return (
              <GraphNode key={c.id} id={c.id} x={c.x * unit} y={c.y * unit}>
                <div className="lib-material-lab__chip" style={hue !== undefined ? ({ '--lib-device-accent': HUE_INK[hue] } as CSSProperties) : undefined}>
                  <ChipFace
                    chip={c}
                    pins={pins}
                    slots={byChip.get(c.id) ?? none}
                    binding={binding}
                    connected={connected}
                    selected={c.id === selected}
                    problem={faulty.has(c.id)}
                    onSelect={() => select(c.id === selected ? null : c.id)}
                  />
                </div>
              </GraphNode>
            );
          })}
        </Graph>
      </div>
      <div className="lib-material-lab__foot">
        <Button size="icon" variant="quiet" symbol="minus" name="Zoom out" onPress={() => view.current?.zoom?.(1 / 1.25)} />
        <Button size="icon" variant="quiet" symbol="plus" name="Zoom in" onPress={() => view.current?.zoom?.(1.25)} />
        <Button variant="quiet" label="Fit" name="Fit to view" onPress={() => view.current?.fit(1)} />
        <ul className="lib-material-lab__legend" aria-label="Legend">
          {KINDS.map((k) => (
            <li key={k}>
              <span aria-hidden="true" className="lib-material-lab__swatch" style={{ '--lib-material-lab-ink': HUE_INK[KIND_HUE[k]] } as CSSProperties} />
              <Text role="caption" tone="secondary">
                {k}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </Surface>
  );
}

// ---------------------------------------------------------------------------------------------
// The inspector: the readout, the compiler's errors, and the selected chip's numbers and options.

function Inspector({ editor, extra }: { editor: Editor; extra?: string[] }) {
  const { circuit, slots, errors, frag, compiles, selected, setParam } = editor;
  const chip = selected ? circuit.modules[circuit.board].chips.find((c) => c.id === selected) : undefined;
  const spec = chip ? specOf(chip) : undefined;
  const own = chip ? slots.filter((s) => s.chip === chip.id) : [];
  const lines = frag ? frag.split('\n').length : 0;
  const all = [...errors.map(errorText), ...(extra ?? [])];
  return (
    <Surface layer="base" border className="lib-material-lab__inspector" data-testid="material-inspector">
      <div className="lib-material-lab__section">
        <Text role="caption" tone="muted" truncate data-testid="material-readout">
          {slots.length} slots · {frag ? `${lines} lines` : 'no frag'} · compiled {compiles}×
        </Text>
        {all.length > 0 && (
          <ul aria-label="Compiler errors" data-testid="material-errors" style={{ display: 'grid', gap: 'var(--space-1)', margin: 0, padding: 0, listStyle: 'none' }}>
            {all.map((e, n) => (
              <li key={n} style={{ minWidth: 0 }}>
                <Text role="caption" tone="danger">
                  {e}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="lib-material-lab__section" data-testid="material-controls">
        {!chip ? (
          <Text role="caption" tone="muted">
            Select a chip to tune its numbers. Drag from an out pin to an in pin of the same kind to connect; click a cord and press Delete to remove it.
          </Text>
        ) : (
          <>
            <div style={{ display: 'grid', minWidth: 0 }}>
              <Text role="label" truncate>
                {nameOf(chip)}
              </Text>
              <Text role="caption" tone="muted">
                {spec?.description ?? `unknown node type “${chip.type}”`}
              </Text>
            </div>
            {Object.entries(spec?.options ?? {}).map(([k, o]) => {
              const v = chip.params?.[k];
              const at = Math.max(0, o.values.indexOf(typeof v === 'string' ? v : o.default));
              return <Select key={k} items={o.values} index={at} name={k} label={`${nameOf(chip)} ${k}`} onChange={(n) => setParam(chip.id, k, o.values[n])} />;
            })}
            {own.map((s) => (
              <Slider
                key={s.param}
                param={paramOf(s)}
                value={s.value}
                onChange={(next) => setParam(chip.id, s.param, next)}
                layout="row"
                name={s.label ?? s.param}
                label={`${nameOf(chip)} ${s.label ?? s.param}`}
                length="auto"
              />
            ))}
            {own.length === 0 && !spec?.options && (
              <Text role="caption" tone="muted">
                No unwired numbers to tune.
              </Text>
            )}
          </>
        )}
      </div>
    </Surface>
  );
}

// ---------------------------------------------------------------------------------------------
// The lab.

export interface MaterialLabProps {
  /** The material's circuit; the lab holds its own copy in state. */
  initial: Circuit;
  label: string;
  /** What the story shows, in a line. */
  blurb: string;
  /** ShaderCanvas render scale. */
  scale?: number;
  animate?: boolean;
  interactive?: boolean;
  /** The preview surface's layer, whose CSS material sits under the shader. Default `float`. */
  layer?: LayerName;
  /** Draw the material as the board's own backdrop instead of on a preview surface. */
  meta?: boolean;
  /** Controls at the end of the head (Meta's starting material). */
  headEnd?: ReactNode;
}

export function MaterialLab({ initial, label, blurb, scale = 0.5, animate = true, interactive = false, layer = 'float', meta, headEnd }: MaterialLabProps) {
  const editor = useMaterialEditor(initial);
  const { frag, params } = editor;
  const [glslErrors, setGlslErrors] = useState<string[]>([]);
  useEffect(() => setGlslErrors([]), [frag]);
  const shader: ShaderSource = useMemo(() => ({ frag, params, scale, animate, interactive }), [frag, params, scale, animate, interactive]);
  const m = editor.circuit.modules[editor.circuit.board];
  const ground = meta ? (
    <ShaderCanvas
      className="lib-material-lab__ground"
      data-testid="material-ground"
      frag={frag}
      params={params}
      scale={scale}
      animate={animate}
      interactive={interactive}
      onError={(e) => setGlslErrors([`GLSL: ${e}`])}
    />
  ) : undefined;
  return (
    <div className="lib-material-lab">
      <div className="lib-material-lab__head">
        <div className="lib-material-lab__title">
          <Text role="heading" truncate>
            {label}
          </Text>
          <Text role="caption" tone="muted" truncate>
            {blurb}
          </Text>
        </div>
        <Text role="caption" tone="muted" style={{ flex: 'none' }}>
          {m.chips.length} chips · {m.traces.length} traces
        </Text>
        {headEnd}
      </div>
      <div className="lib-material-lab__stage">
        <Board editor={editor} label={`${label} circuit`} ground={ground} meta={meta} />
        <div className="lib-material-lab__side">
          {!meta && (
            <div className="lib-material-lab__backdrop" data-testid="material-backdrop">
              <div className="lib-material-lab__words" aria-hidden="true">
                <Text role="display" tone="secondary">
                  {label}
                </Text>
                <Text role="display" tone="muted">
                  {label}
                </Text>
                <Text role="display" tone="secondary">
                  {label}
                </Text>
              </div>
              <Surface layer={layer} border className="lib-material-lab__pane" shader={shader} data-testid="material-surface">
                <Text role="heading" truncate>
                  {label}
                </Text>
                <Text role="caption" tone="muted">
                  A {layer} surface wearing the circuit beside it, over its own CSS material.
                </Text>
                <ParamLine name="Layer" value={layer} />
                <ParamLine name="Render scale" value={`${scale}×`} />
                <ParamLine name="Motion" value={animate ? (interactive ? 'animated · press for a ripple' : 'animated') : 'still: draws on change'} />
              </Surface>
            </div>
          )}
          <Inspector editor={editor} extra={glslErrors} />
        </div>
      </div>
    </div>
  );
}
