// The compiler (docs/shader-graph.md, "The compiler"): a Circuit module → one GLSL ES 3.00
// fragment shader, the `uParams` slots its unwired number inlets ride, and what was wrong with it.
// Pure: the same circuit gives the same result, nothing is mutated, and nothing throws.
//
// How it goes:
// 1. Flatten. Buses are expanded with the model's `flatten`; every module instance is inlined, its
//    chips renamed `${instance}.${inner}` (recursively). Instance pins become aliases: a trace into
//    instance pin X feeds the inner inlet X maps; a trace out of pin Y reads the inner outlet Y maps.
// 2. Walk back from `out`, resolving each inlet to the leaf outlet that feeds it (or to nothing),
//    breaking cycles and refusing kind mismatches. Only what's reached compiles.
// 3. Number every unwired number inlet on a reached chip, in module order then spec order.
// 4. Emit one variable per used outlet, in dependency order, then the clamped, dithered output.
import { flatten, type Chip, type Circuit, type End as ModelEnd, type Json, type Module, type PinEnd, type Trace } from '../graph/model/circuit';
import { PREAMBLE, helperCode } from './glsl';
import { SHADER_NODES } from './nodes';
import { GLSL_TYPE, MAX_PARAMS, PIN_KINDS, type CompileResult, type NodeInput, type NodeSpec, type ParamSlot, type PinKind, type ShaderError } from './types';

/** A pin on a flattened chip: `chip` is its path (`smoke.warp`). */
interface End {
  chip: string;
  pin: string;
}
const keyOf = (e: End) => `${e.chip}\u0000${e.pin}`;

interface Leaf {
  path: string;
  chip: Chip;
  spec?: NodeSpec;
  /** True for a chip of the compiled module itself, not inside an instance. */
  top: boolean;
}

interface Inlet {
  id: string;
  kind: PinKind;
  input?: NodeInput;
}

interface Flat {
  leaves: Leaf[];
  byPath: Map<string, Leaf>;
  /** Instance path → its module, for knob labels. */
  instances: Map<string, Module>;
  /** An inlet (a leaf's, or an instance's in pin) → the outlet end its trace comes from. */
  feeds: Map<string, End>;
  /** An inner inlet → the instance in pin that maps to it. */
  inAlias: Map<string, End>;
  /** An instance out pin → the inner outlet it maps. */
  outAlias: Map<string, End>;
  errors: ShaderError[];
}

const own = <T>(record: Record<string, T> | undefined, key: string): T | undefined =>
  record && Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
const isPinEnd = (e: ModelEnd | undefined): e is PinEnd => !!e && typeof (e as PinEnd).chip === 'string' && typeof (e as PinEnd).pin === 'string';
const isKind = (k: unknown): k is PinKind => (PIN_KINDS as readonly unknown[]).includes(k);
const specOf = (type: string): NodeSpec | undefined => own(SHADER_NODES, type);

/** A merge chip's kind: its out pin's, else its first in pin's, else colour. */
function mergeKind(chip: Chip): PinKind {
  const pins = chip.pins ?? [];
  const out = pins.find((p) => p.side === 'out' && p.id === 'out');
  if (isKind(out?.kind)) return out.kind;
  const first = pins.find((p) => p.side === 'in');
  return isKind(first?.kind) ? first.kind : 'colour';
}

function inletsOf(leaf: Leaf): Inlet[] {
  if (!leaf.spec) return [];
  if (leaf.chip.type === 'merge') {
    const kind = mergeKind(leaf.chip);
    return (leaf.chip.pins ?? []).filter((p) => p.side === 'in').map((p) => ({ id: p.id, kind }));
  }
  return leaf.spec.inputs.map((input) => ({ id: input.id, kind: input.kind, input }));
}

function outletKind(leaf: Leaf, pin: string): PinKind | undefined {
  if (!leaf.spec) return undefined;
  if (leaf.chip.type === 'merge') return pin === 'out' ? mergeKind(leaf.chip) : undefined;
  return leaf.spec.outputs.find((o) => o.id === pin)?.kind;
}

// ---------------------------------------------------------------------------------------------
// 1. Flatten

function expand(circuit: Circuit, moduleId: string, prefix: string, stack: string[], f: Flat): void {
  const m = own(circuit.modules, moduleId);
  if (!m) return;
  let traces: Trace[];
  try {
    traces = flatten(circuit, moduleId);
  } catch (e) {
    f.errors.push({ message: `module "${moduleId}": ${(e as Error).message}` });
    traces = (m.traces ?? []).filter((t) => isPinEnd(t.from) && isPinEnd(t.to));
  }

  for (const chip of m.chips ?? []) {
    const path = prefix + chip.id;
    if (chip.module !== undefined) {
      const inner = own(circuit.modules, chip.module);
      if (!inner) {
        f.errors.push({ chip: path, message: `no module "${chip.module}"` });
        continue;
      }
      if (stack.includes(chip.module)) {
        f.errors.push({ chip: path, message: `module "${chip.module}" contains itself` });
        continue;
      }
      f.instances.set(path, inner);
      for (const p of inner.inPins ?? []) {
        if (!isPinEnd(p.maps)) continue;
        const target = keyOf({ chip: `${path}.${p.maps.chip}`, pin: p.maps.pin });
        if (!f.inAlias.has(target)) f.inAlias.set(target, { chip: path, pin: p.id });
      }
      for (const p of inner.outPins ?? []) {
        if (isPinEnd(p.maps)) f.outAlias.set(keyOf({ chip: path, pin: p.id }), { chip: `${path}.${p.maps.chip}`, pin: p.maps.pin });
      }
      expand(circuit, chip.module, `${path}.`, [...stack, chip.module], f);
    } else {
      const spec = specOf(chip.type);
      if (!spec) f.errors.push({ chip: path, message: `unknown chip type "${chip.type}"` });
      const leaf: Leaf = { path, chip, spec, top: prefix === '' };
      f.leaves.push(leaf);
      f.byPath.set(path, leaf);
    }
  }

  // Whether `chip` has a pin `pin` on `side`, as the compiler reads it. Chips it can't judge
  // (an unknown type or module) are let through: they read as unwired anyway.
  const hasPin = (chip: Chip, pin: string, side: 'in' | 'out'): boolean => {
    if (chip.module !== undefined) {
      const inner = own(circuit.modules, chip.module);
      return !inner || (side === 'in' ? inner.inPins : inner.outPins).some((p) => p.id === pin);
    }
    const spec = specOf(chip.type);
    if (!spec) return true;
    if (chip.type === 'merge') return side === 'out' ? pin === 'out' : (chip.pins ?? []).some((p) => p.side === 'in' && p.id === pin);
    return side === 'in' ? spec.inputs.some((i) => i.id === pin) : spec.outputs.some((o) => o.id === pin);
  };

  for (const t of traces) {
    if (!isPinEnd(t.from) || !isPinEnd(t.to)) continue;
    const from = (m.chips ?? []).find((c) => c.id === (t.from as PinEnd).chip);
    const to = (m.chips ?? []).find((c) => c.id === (t.to as PinEnd).chip);
    if (!from || !to) {
      const missing = from ? t.to.chip : t.from.chip;
      f.errors.push({ chip: prefix + missing, message: `a trace names a missing chip "${missing}"` });
      continue;
    }
    if (!hasPin(from, t.from.pin, 'out')) {
      f.errors.push({ chip: prefix + from.id, pin: t.from.pin, message: `a trace names a missing out pin "${t.from.pin}"` });
      continue;
    }
    if (!hasPin(to, t.to.pin, 'in')) {
      f.errors.push({ chip: prefix + to.id, pin: t.to.pin, message: `a trace names a missing in pin "${t.to.pin}"` });
      continue;
    }
    const inlet = keyOf({ chip: prefix + to.id, pin: t.to.pin });
    if (!f.feeds.has(inlet)) f.feeds.set(inlet, { chip: prefix + from.id, pin: t.from.pin });
  }
}

function flattenAll(circuit: Circuit, root: string): Flat {
  const f: Flat = { leaves: [], byPath: new Map(), instances: new Map(), feeds: new Map(), inAlias: new Map(), outAlias: new Map(), errors: [] };
  expand(circuit, root, '', [root], f);
  return f;
}

// ---------------------------------------------------------------------------------------------
// 2. Resolve

const HOPS = 4096;

/** Follow instance out pins down to a leaf's outlet; null if it leads nowhere. */
function resolveOutlet(f: Flat, end: End): End | null {
  let at = end;
  for (let n = 0; n < HOPS; n++) {
    if (f.byPath.has(at.chip)) return at;
    const next = f.outAlias.get(keyOf(at));
    if (!next) return null;
    at = next;
  }
  return null;
}

/**
 * What feeds a leaf's inlet: the leaf outlet it is wired to (through any instance pins), and the
 * instance in pins it passes through on the way out (innermost first), whose outermost names its
 * knob when nothing is wired.
 */
function resolveInlet(f: Flat, end: End): { from: End | null; wired: boolean; chain: End[] } {
  let at = end;
  const chain: End[] = [];
  for (let n = 0; n < HOPS; n++) {
    const fed = f.feeds.get(keyOf(at));
    if (fed) return { from: resolveOutlet(f, fed), wired: true, chain };
    const up = f.inAlias.get(keyOf(at));
    if (!up) break;
    chain.push(up);
    at = up;
  }
  return { from: null, wired: false, chain };
}

// ---------------------------------------------------------------------------------------------
// Knob values: shared by compile (each slot's value) and paramValues (live edits).

function findChip(circuit: Circuit, moduleId: string, path: string, depth: number): Chip | undefined {
  const m = own(circuit.modules, moduleId);
  if (!m || depth > 64) return undefined;
  const direct = (m.chips ?? []).find((c) => c.id === path);
  if (direct) return direct;
  for (const c of m.chips ?? []) {
    if (c.module === undefined || !path.startsWith(`${c.id}.`)) continue;
    const hit = findChip(circuit, c.module, path.slice(c.id.length + 1), depth + 1);
    if (hit) return hit;
  }
  return undefined;
}

const finite = (v: Json | undefined): v is number => typeof v === 'number' && Number.isFinite(v);

/** A chip's number for `param`: its own, else (an instance) what its module pin maps to, else the spec default. */
function chipKnob(circuit: Circuit, chip: Chip, param: string, depth: number): number | undefined {
  const v = chip.params?.[param];
  if (finite(v)) return v;
  if (chip.module !== undefined) {
    const inner = own(circuit.modules, chip.module);
    const pin = inner?.inPins?.find((p) => p.id === param);
    if (!inner || !pin || !isPinEnd(pin.maps) || depth > 64) return undefined;
    const innerChip = (inner.chips ?? []).find((c) => c.id === (pin.maps as PinEnd).chip);
    return innerChip ? chipKnob(circuit, innerChip, pin.maps.pin, depth + 1) : undefined;
  }
  if (chip.type === 'merge') return 0;
  return specOf(chip.type)?.inputs.find((i) => i.id === param)?.default;
}

function knobValue(circuit: Circuit, root: string, chip: string, param: string): number | undefined {
  const hit = findChip(circuit, root, chip, 0);
  return hit ? chipKnob(circuit, hit, param, 0) : undefined;
}

// ---------------------------------------------------------------------------------------------
// The compiler

type Source = { wire: End } | { slot: number } | { fallback: string };

const comment = (s: string) => s.replace(/[^\w.\- ]/g, '_');

export function compileCircuit(circuit: Circuit, module?: string): CompileResult {
  try {
    return compileInner(circuit, module ?? circuit.board);
  } catch (e) {
    return { frag: null, params: [], errors: [{ message: `could not compile: ${(e as Error)?.message ?? String(e)}` }] };
  }
}

function compileInner(circuit: Circuit, root: string): CompileResult {
  if (!own(circuit.modules, root)) return { frag: null, params: [], errors: [{ message: `no module "${root}"` }] };
  const f = flattenAll(circuit, root);
  const errors = f.errors;

  const outs = f.leaves.filter((l) => l.top && l.chip.type === 'out');
  if (!outs.length) return { frag: null, params: [], errors: [...errors, { message: 'no out chip: nothing to draw' }] };
  for (const extra of outs.slice(1)) errors.push({ chip: extra.path, message: 'more than one out chip; the first is used' });
  const out = outs[0];

  // Walk back from out. state: 1 on the stack, 2 done.
  const state = new Map<string, 1 | 2>();
  const order: Leaf[] = [];
  const resolved = new Map<string, Map<string, { from: End | null; chain: End[] }>>();
  const visit = (leaf: Leaf) => {
    state.set(leaf.path, 1);
    const ins = new Map<string, { from: End | null; chain: End[] }>();
    for (const inlet of inletsOf(leaf)) {
      const r = resolveInlet(f, { chip: leaf.path, pin: inlet.id });
      let from = r.from;
      const chain = r.wired ? [] : r.chain;
      if (from) {
        const src = f.byPath.get(from.chip)!;
        const kind = outletKind(src, from.pin);
        if (!src.spec) from = null; // an unknown type, already reported: reads as unwired
        else if (!kind) {
          errors.push({ chip: src.path, pin: from.pin, message: `no outlet "${from.pin}" on a ${src.chip.type} chip` });
          from = null;
        } else if (kind !== inlet.kind) {
          errors.push({ chip: leaf.path, pin: inlet.id, message: `a ${kind} can't feed the ${inlet.kind} inlet "${inlet.id}"` });
          from = null;
        } else if (state.get(src.path) === 1) {
          errors.push({ chip: leaf.path, pin: inlet.id, message: `inlet "${inlet.id}" closes a cycle` });
          from = null;
        } else if (!state.has(src.path)) visit(src);
      }
      ins.set(inlet.id, { from, chain });
    }
    resolved.set(leaf.path, ins);
    state.set(leaf.path, 2);
    order.push(leaf);
  };
  visit(out);

  // Slots, in module order then inlet order; and each inlet's source.
  const slots: ParamSlot[] = [];
  const sources = new Map<string, Source>();
  const used = new Set<string>();
  for (const leaf of f.leaves) {
    const ins = resolved.get(leaf.path);
    if (!ins) continue;
    for (const inlet of inletsOf(leaf)) {
      const r = ins.get(inlet.id)!;
      const at = keyOf({ chip: leaf.path, pin: inlet.id });
      if (r.from) {
        sources.set(at, { wire: r.from });
        used.add(keyOf(r.from));
      } else if (inlet.kind === 'number') {
        const knob = r.chain[r.chain.length - 1];
        const slot: ParamSlot = { index: slots.length, chip: knob ? knob.chip : leaf.path, param: knob ? knob.pin : inlet.id, value: 0 };
        slot.value = knobValue(circuit, root, slot.chip, slot.param) ?? inlet.input?.default ?? 0;
        const input = inlet.input;
        const modulePin = knob ? f.instances.get(knob.chip)?.inPins.find((p) => p.id === knob.pin) : undefined;
        const label = modulePin?.label ?? input?.label;
        if (input?.min !== undefined) slot.min = input.min;
        if (input?.max !== undefined) slot.max = input.max;
        if (input?.step !== undefined) slot.step = input.step;
        if (label !== undefined) slot.label = label;
        if (input?.unit !== undefined) slot.unit = input.unit;
        sources.set(at, { slot: slot.index });
        slots.push(slot);
      } else {
        const merging = leaf.chip.type === 'merge';
        const fallback = inlet.input?.fallback ?? (inlet.kind === 'point' ? (merging ? 'vec2(0.0)' : 'coord') : 'vec4(0.0)');
        sources.set(at, { fallback });
      }
    }
  }
  if (slots.length > MAX_PARAMS) {
    errors.push({ message: `${slots.length} unwired number inlets; at most ${MAX_PARAMS} fit in uParams` });
    return { frag: null, params: slots, errors };
  }

  // Emit, in dependency order.
  const names = new Map<string, string>();
  const lines: string[] = [];
  const helpers: string[] = [];
  const expr = (s: Source | undefined): string => {
    if (!s) return 'vec4(0.0)';
    if ('wire' in s) return names.get(keyOf(s.wire)) ?? 'vec4(0.0)';
    if ('slot' in s) return `uParams[${s.slot}]`;
    return s.fallback;
  };
  let outExpr = 'vec4(0.0)';
  for (const leaf of order) {
    const spec = leaf.spec!;
    const inlets = inletsOf(leaf);
    const merging = leaf.chip.type === 'merge';
    const inputs: Record<string, string> = {};
    inlets.forEach((inlet, n) => {
      inputs[merging ? String(n) : inlet.id] = expr(sources.get(keyOf({ chip: leaf.path, pin: inlet.id })));
    });
    if (leaf === out) {
      outExpr = inputs.c ?? 'vec4(0.0)';
      continue;
    }
    const options = optionsOf(leaf, errors);
    let wrote = false;
    const outlets = merging ? [{ id: 'out', kind: mergeKind(leaf.chip) }] : spec.outputs;
    for (const o of outlets) {
      const end = { chip: leaf.path, pin: o.id };
      if (!used.has(keyOf(end))) continue;
      const name = `v${names.size}`;
      names.set(keyOf(end), name);
      lines.push(`  ${GLSL_TYPE[o.kind]} ${name} = ${spec.emit(inputs, options, o.id)}; // ${comment(leaf.path)}.${comment(o.id)}`);
      wrote = true;
    }
    if (wrote) helpers.push(...(spec.helpers ?? []));
  }
  helpers.push('hash');

  const frag = `${PREAMBLE}${helperCode(helpers)}
void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 coord = uv * uRes / max(uPx, 1e-4) / 100.0;
${lines.join('\n')}
  vec4 colour = clamp(${outExpr}, 0.0, 1.0);
  colour.rgb = min(colour.rgb, vec3(colour.a));
  float dither = (zHash(gl_FragCoord.xy) - 0.5) / 255.0;
  colour.a = clamp(colour.a + dither, 0.0, 1.0);
  colour.rgb = clamp(colour.rgb + dither, vec3(0.0), vec3(colour.a));
  fragColor = colour;
}
`;
  return { frag, params: slots, errors };
}

function optionsOf(leaf: Leaf, errors: ShaderError[]): Record<string, string> {
  const options: Record<string, string> = {};
  for (const [name, o] of Object.entries(leaf.spec?.options ?? {})) {
    const v = leaf.chip.params?.[name];
    if (typeof v === 'string' && o.values.includes(v)) options[name] = v;
    else {
      if (typeof v === 'string') errors.push({ chip: leaf.path, pin: name, message: `"${v}" isn't a ${name} (${o.values.join(', ')}); using ${o.default}` });
      options[name] = o.default;
    }
  }
  if (leaf.chip.type === 'merge') options.kind = mergeKind(leaf.chip);
  return options;
}

/** `uParams` for the slots, read afresh from the circuit: editing a param needs no recompile. */
export function paramValues(circuit: Circuit, slots: ParamSlot[], module?: string): Float32Array {
  const out = new Float32Array(MAX_PARAMS);
  const values = slotValues(circuit, slots, module);
  (slots ?? []).forEach((s, n) => {
    if (s.index >= 0 && s.index < MAX_PARAMS) out[s.index] = values[n];
  });
  return out;
}

/** Each slot's current value read from the circuit, at full precision (in slot order). */
export function slotValues(circuit: Circuit, slots: ParamSlot[], module?: string): number[] {
  const root = module ?? circuit?.board;
  return (slots ?? []).map((s) => {
    try {
      return knobValue(circuit, root, s.chip, s.param) ?? s.value;
    } catch {
      return s.value;
    }
  });
}

/**
 * Everything the frag and slots depend on and nothing else: number params and presentation
 * (positions, labels of chips, styles, zones, layout) are left out, so equal keys ⇒ equal frag and
 * slots, and turning a knob or dragging a chip keeps the key.
 */
export function structureKey(circuit: Circuit, module?: string): string {
  try {
    const root = module ?? circuit.board;
    const seen = new Set<string>();
    const mods: unknown[] = [];
    const strings = (params: Chip['params']) =>
      params ? Object.keys(params).sort().filter((k) => typeof params[k] === 'string').map((k) => [k, params[k]]) : [];
    const walk = (id: string) => {
      if (seen.has(id)) return;
      seen.add(id);
      const m = own(circuit.modules, id);
      if (!m) {
        mods.push([id, null]);
        return;
      }
      mods.push([
        id,
        (m.chips ?? []).map((c) => [
          c.id,
          c.type,
          c.module ?? null,
          c.type === 'merge' ? (c.pins ?? []).map((p) => [p.id, p.side, p.kind ?? null]) : 0,
          strings(c.params),
        ]),
        (m.traces ?? []).map((t) => [t.from, t.to]),
        (m.buses ?? []).map((b) => b.id),
        (m.inPins ?? []).map((p) => [p.id, p.maps, p.label ?? null]),
        (m.outPins ?? []).map((p) => [p.id, p.maps]),
      ]);
      for (const c of m.chips ?? []) if (c.module !== undefined) walk(c.module);
    };
    walk(root);
    return JSON.stringify([root, mods]);
  } catch {
    return 'unreadable';
  }
}
