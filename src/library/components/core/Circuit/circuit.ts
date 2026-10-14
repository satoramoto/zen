// The Circuit model (`docs/circuit-model.md`): plain JSON, pure operations, drawn by `Graph`
// through `useCircuit`. Nothing here knows what a chip is for: `type`, `kind` and `style` are the
// host's words, carried and never read.
import type { PortSide } from '../Graph/graphContext';

export type { PortSide } from '../Graph/graphContext';

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export type Face = 'n' | 'e' | 's' | 'w';

export interface Pin {
  /** Unique among this chip's pins on the same side. */
  id: string;
  side: PortSide;
  /** An opaque type tag; also the style hook (`data-kind`). */
  kind?: string;
  label?: string;
  /** An in pin that drives a parameter rather than carrying the signal. */
  param?: boolean;
  /** Where the pin sits on the chip. Presentation only: `side` alone decides direction. */
  placement?: 'auto' | Face | { face: Face; at: number } | { x: number; y: number };
}

export interface Chip {
  /** Unique within its Module. */
  id: string;
  /** The host's chip type, opaque to zen. */
  type: string;
  x: number;
  y: number;
  /** Ignored when `module` is set (pins come from the module). */
  pins: Pin[];
  params?: Record<string, Json>;
  /** The id of a Module in the same Circuit: this chip is an instance of it. */
  module?: string;
  /** The id of a Zone in the same Module. */
  zone?: string;
  /** A host style variant, opaque. */
  style?: string;
  collapsed?: boolean;
  [extra: string]: unknown;
}

export interface PinEnd {
  chip: string;
  pin: string;
}
export interface BusEnd {
  bus: string;
}
export type End = PinEnd | BusEnd;

/** A named rail: one out pin feeds it, any number of in pins tap it. Purely presentational. */
export interface Bus {
  id: string;
  label?: string;
  kind?: string;
}

export interface Trace {
  /** Unique within its Module. */
  id: string;
  /** Always an out pin (or a bus, for a tap). */
  from: End;
  /** Always an in pin (or a bus, for its source). */
  to: End;
  kind?: string;
  /** Default `'signal'`. */
  role?: 'signal' | 'modulation';
  /** Modulation depth, -1..1. */
  amount?: number;
  label?: string;
  [extra: string]: unknown;
}

export interface ModulePin {
  /** Unique among the module's inPins (or outPins). */
  id: string;
  kind?: string;
  label?: string;
  /** The inner chip pin this module pin stands for. */
  maps: End;
}

export interface Control {
  id: string;
  label?: string;
  maps: { chip: string; param: string };
}

export interface Zone {
  id: string;
  label?: string;
}

export interface Module {
  id: string;
  chips: Chip[];
  traces: Trace[];
  /** Pins this module shows on its instances' leading edge. */
  inPins: ModulePin[];
  /** ... and trailing edge. */
  outPins: ModulePin[];
  controls?: Control[];
  zones?: Zone[];
  buses?: Bus[];
  /** Presentation only. Default `'free'` (positions as stored). */
  layout?: 'free' | 'radial' | 'lr' | 'tb';
  /** Presentation only. Default `'curve'`; `'trace'` is straight runs with 45° bends. */
  routing?: 'curve' | 'trace';
  [extra: string]: unknown;
}

export interface Circuit {
  version: 1;
  /** The id of the top-level Module. */
  board: string;
  /** Keyed by `Module.id`. */
  modules: Record<string, Module>;
}

export type CircuitErrorCode =
  | 'unknown-module'
  | 'unknown-chip'
  | 'unknown-pin'
  | 'unknown-trace'
  | 'unknown-zone'
  | 'duplicate-id'
  | 'wrong-side'
  | 'self-loop'
  | 'cycle-in-modules'
  | 'bad-amount'
  | 'unknown-bus'
  | 'bus-has-source'
  | 'bus-to-bus';

export class CircuitError extends Error {
  readonly code: CircuitErrorCode;
  constructor(code: CircuitErrorCode, message: string) {
    super(message);
    this.name = 'CircuitError';
    this.code = code;
  }
}

export interface Issue {
  code: CircuitErrorCode;
  module: string;
  path: string;
  message: string;
}

// ---------------------------------------------------------------------------------------------
// Reading

const isBus = (end: End): end is BusEnd => typeof (end as BusEnd).bus === 'string';

function moduleOf(circuit: Circuit, id: string): Module {
  const m = Object.prototype.hasOwnProperty.call(circuit.modules, id) ? circuit.modules[id] : undefined;
  if (!m) throw new CircuitError('unknown-module', `no module "${id}"`);
  return m;
}

function chipOf(m: Module, id: string): Chip {
  const chip = m.chips.find((c) => c.id === id);
  if (!chip) throw new CircuitError('unknown-chip', `no chip "${id}" in module "${m.id}"`);
  return chip;
}

function modulePinAsPin(p: ModulePin, side: PortSide): Pin {
  const pin: Pin = { id: p.id, side };
  if (p.kind !== undefined) pin.kind = p.kind;
  if (p.label !== undefined) pin.label = p.label;
  return pin;
}

function pinsOfChip(circuit: Circuit, chip: Chip): Pin[] {
  if (chip.module === undefined) return chip.pins;
  const inner = moduleOf(circuit, chip.module);
  return [...inner.inPins.map((p) => modulePinAsPin(p, 'in')), ...inner.outPins.map((p) => modulePinAsPin(p, 'out'))];
}

/**
 * Pins a chip actually has: its own `pins`, or, for an instance, its module's inPins (side `in`)
 * and outPins (side `out`), using the ModulePin id, kind and label.
 */
export function pinsOf(circuit: Circuit, module: string, chip: string): Pin[] {
  return pinsOfChip(circuit, chipOf(moduleOf(circuit, module), chip));
}

/** Modules `id` contains an instance of, directly. Unknown ids are skipped. */
const childrenOf = (circuit: Circuit, id: string): string[] =>
  (circuit.modules[id]?.chips ?? []).flatMap((c) => (c.module === undefined ? [] : [c.module]));

/** Whether `from` contains, directly or through other modules, an instance of `target`. */
function reaches(circuit: Circuit, from: string, target: string): boolean {
  const seen = new Set<string>();
  const stack = [from];
  while (stack.length) {
    const at = stack.pop()!;
    for (const child of childrenOf(circuit, at)) {
      if (child === target) return true;
      if (!seen.has(child)) {
        seen.add(child);
        stack.push(child);
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------------------------
// Writing: every operation copies the path it changes and nothing else.

function withModule(circuit: Circuit, m: Module): Circuit {
  return { ...circuit, modules: { ...circuit.modules, [m.id]: m } };
}

export function emptyCircuit(boardId = 'board'): Circuit {
  return { version: 1, board: boardId, modules: { [boardId]: { id: boardId, chips: [], traces: [], inPins: [], outPins: [] } } };
}

export function addModule(circuit: Circuit, module: Module): Circuit {
  if (Object.prototype.hasOwnProperty.call(circuit.modules, module.id))
    throw new CircuitError('duplicate-id', `module "${module.id}" already exists`);
  const next = withModule(circuit, module);
  // The new module must be as sound as any operation would leave it.
  const issue = issuesOfModule(next, module.id)[0] ?? cycleIssues(next).find((i) => i.module === module.id);
  if (issue) throw new CircuitError(issue.code, issue.message);
  return next;
}

export function placeChip(circuit: Circuit, module: string, chip: Chip): Circuit {
  const m = moduleOf(circuit, module);
  if (m.chips.some((c) => c.id === chip.id)) throw new CircuitError('duplicate-id', `chip "${chip.id}" already in module "${module}"`);
  if (chip.module !== undefined) {
    moduleOf(circuit, chip.module);
    if (chip.module === module || reaches(circuit, chip.module, module))
      throw new CircuitError('cycle-in-modules', `module "${module}" would contain itself through "${chip.module}"`);
  }
  if (chip.zone !== undefined && !(m.zones ?? []).some((z) => z.id === chip.zone))
    throw new CircuitError('unknown-zone', `no zone "${chip.zone}" in module "${module}"`);
  if (chip.module === undefined) {
    const seen = new Set<string>();
    for (const p of chip.pins ?? []) {
      const key = `${p.side} ${p.id}`;
      if (seen.has(key)) throw new CircuitError('duplicate-id', `chip "${chip.id}" has two ${p.side} pins "${p.id}"`);
      seen.add(key);
    }
  }
  return withModule(circuit, { ...m, chips: [...m.chips, chip] });
}

const touches = (end: End, chip: string) => !isBus(end) && end.chip === chip;

export function removeChip(circuit: Circuit, module: string, chip: string): Circuit {
  const m = moduleOf(circuit, module);
  chipOf(m, chip);
  const next: Module = {
    ...m,
    chips: m.chips.filter((c) => c.id !== chip),
    traces: m.traces.filter((t) => !touches(t.from, chip) && !touches(t.to, chip)),
    inPins: m.inPins.filter((p) => !touches(p.maps, chip)),
    outPins: m.outPins.filter((p) => !touches(p.maps, chip)),
  };
  if (m.controls) next.controls = m.controls.filter((c) => c.maps.chip !== chip);
  return dropInstanceTraces(withModule(circuit, next), m, (end) => touches(end, chip));
}

/**
 * A module pin that went (its `maps` matched `gone` in the module as it was) goes from every
 * instance too, so every trace to or from it on an instance is dropped.
 */
function dropInstanceTraces(circuit: Circuit, was: Module, gone: (maps: End) => boolean): Circuit {
  const goneIn = new Set(was.inPins.filter((p) => gone(p.maps)).map((p) => p.id));
  const goneOut = new Set(was.outPins.filter((p) => gone(p.maps)).map((p) => p.id));
  if (!goneIn.size && !goneOut.size) return circuit;
  let out = circuit;
  for (const host of Object.values(circuit.modules)) {
    const instances = new Set(host.chips.filter((c) => c.module === was.id).map((c) => c.id));
    if (!instances.size) continue;
    const dangles = (end: End, pins: Set<string>) => !isBus(end) && instances.has(end.chip) && pins.has(end.pin);
    const traces = host.traces.filter((t) => !dangles(t.from, goneOut) && !dangles(t.to, goneIn));
    if (traces.length !== host.traces.length) out = withModule(out, { ...out.modules[host.id], traces });
  }
  return out;
}

export function moveChip(circuit: Circuit, module: string, chip: string, x: number, y: number): Circuit {
  const m = moduleOf(circuit, module);
  chipOf(m, chip);
  return withModule(circuit, { ...m, chips: m.chips.map((c) => (c.id === chip ? { ...c, x, y } : c)) });
}

/** Throws what `connect` would for one end, given the side the end must be. */
function checkEnd(circuit: Circuit, m: Module, end: End, side: PortSide): void {
  if (isBus(end)) {
    if (!(m.buses ?? []).some((b) => b.id === end.bus)) throw new CircuitError('unknown-bus', `no bus "${end.bus}" in module "${m.id}"`);
    return;
  }
  const pins = pinsOfChip(circuit, chipOf(m, end.chip));
  if (pins.some((p) => p.id === end.pin && p.side === side)) return;
  if (pins.some((p) => p.id === end.pin))
    throw new CircuitError('wrong-side', `pin "${end.chip}/${end.pin}" isn't an ${side} pin`);
  throw new CircuitError('unknown-pin', `no pin "${end.pin}" on chip "${end.chip}"`);
}

function amountIssue(trace: Trace): string | null {
  if (trace.amount === undefined) return null;
  if (trace.role !== 'modulation') return `trace "${trace.id}" has an amount but isn't a modulation`;
  if (typeof trace.amount !== 'number' || !(trace.amount >= -1 && trace.amount <= 1))
    return `trace "${trace.id}" amount ${trace.amount} is outside -1..1`;
  return null;
}

export function connect(circuit: Circuit, module: string, trace: Trace): Circuit {
  const m = moduleOf(circuit, module);
  if (m.traces.some((t) => t.id === trace.id)) throw new CircuitError('duplicate-id', `trace "${trace.id}" already in module "${module}"`);
  if (isBus(trace.from) && isBus(trace.to)) throw new CircuitError('bus-to-bus', `trace "${trace.id}" has a bus at both ends`);
  checkEnd(circuit, m, trace.from, 'out');
  checkEnd(circuit, m, trace.to, 'in');
  if (!isBus(trace.from) && !isBus(trace.to) && trace.from.chip === trace.to.chip)
    throw new CircuitError('self-loop', `trace "${trace.id}" loops on chip "${trace.from.chip}"`);
  const bad = amountIssue(trace);
  if (bad) throw new CircuitError('bad-amount', bad);
  const to = trace.to;
  if (isBus(to) && m.traces.some((t) => isBus(t.to) && t.to.bus === to.bus))
    throw new CircuitError('bus-has-source', `bus "${to.bus}" already has a source`);
  return withModule(circuit, { ...m, traces: [...m.traces, trace] });
}

export function disconnect(circuit: Circuit, module: string, trace: string): Circuit {
  const m = moduleOf(circuit, module);
  if (!m.traces.some((t) => t.id === trace)) throw new CircuitError('unknown-trace', `no trace "${trace}" in module "${module}"`);
  return withModule(circuit, { ...m, traces: m.traces.filter((t) => t.id !== trace) });
}

export function addBus(circuit: Circuit, module: string, bus: Bus): Circuit {
  const m = moduleOf(circuit, module);
  const buses = m.buses ?? [];
  if (buses.some((b) => b.id === bus.id)) throw new CircuitError('duplicate-id', `bus "${bus.id}" already in module "${module}"`);
  return withModule(circuit, { ...m, buses: [...buses, bus] });
}

export function removeBus(circuit: Circuit, module: string, bus: string): Circuit {
  const m = moduleOf(circuit, module);
  const buses = m.buses ?? [];
  if (!buses.some((b) => b.id === bus)) throw new CircuitError('unknown-bus', `no bus "${bus}" in module "${module}"`);
  const onBus = (end: End) => isBus(end) && end.bus === bus;
  const next = withModule(circuit, {
    ...m,
    buses: buses.filter((b) => b.id !== bus),
    traces: m.traces.filter((t) => !onBus(t.from) && !onBus(t.to)),
    inPins: m.inPins.filter((p) => !onBus(p.maps)),
    outPins: m.outPins.filter((p) => !onBus(p.maps)),
  });
  return dropInstanceTraces(next, m, onBus);
}

/**
 * The module's traces with every bus expanded: one trace source → tap per tap, keeping the tap's
 * id, kind, role and amount. A bus's source trace isn't returned, and taps on a bus with no source
 * are left out. Traces without a bus pass through.
 */
export function flatten(circuit: Circuit, module: string): Trace[] {
  const m = moduleOf(circuit, module);
  const sources = new Map<string, End>();
  for (const t of m.traces) if (isBus(t.to) && !sources.has(t.to.bus)) sources.set(t.to.bus, t.from);
  return m.traces.flatMap((t) => {
    if (isBus(t.to)) return [];
    if (!isBus(t.from)) return [t];
    const source = sources.get(t.from.bus);
    return source && !isBus(source) ? [{ ...t, from: source }] : [];
  });
}

// ---------------------------------------------------------------------------------------------
// validate

function duplicates<T extends { id: string }>(
  items: readonly T[] | undefined,
  path: string,
  module: string,
  what: string,
  out: Issue[],
): void {
  const seen = new Set<string>();
  (items ?? []).forEach((item, i) => {
    if (seen.has(item.id)) out.push({ code: 'duplicate-id', module, path: `${path}[${i}].id`, message: `duplicate ${what} id "${item.id}"` });
    seen.add(item.id);
  });
}

/**
 * Checks one end against the module, pushing at most one issue. Returns whether the end resolved
 * to a pin of the wanted side (or a known bus).
 */
function endIssue(circuit: Circuit, m: Module, end: End, side: PortSide, path: string, out: Issue[]): boolean {
  const push = (code: CircuitErrorCode, at: string, message: string) => out.push({ code, module: m.id, path: `${path}.${at}`, message });
  if (isBus(end)) {
    if ((m.buses ?? []).some((b) => b.id === end.bus)) return true;
    push('unknown-bus', 'bus', `no bus "${end.bus}"`);
    return false;
  }
  const chip = m.chips.find((c) => c.id === end?.chip);
  if (!chip) {
    push('unknown-chip', 'chip', `no chip "${end?.chip}"`);
    return false;
  }
  // An instance of an unknown module is reported on the chip; its pins can't be judged.
  if (chip.module !== undefined && !circuit.modules[chip.module]) return false;
  const pins = pinsOfChip(circuit, chip);
  if (pins.some((p) => p.id === end.pin && p.side === side)) return true;
  if (pins.some((p) => p.id === end.pin)) push('wrong-side', 'pin', `pin "${end.chip}/${end.pin}" isn't an ${side} pin`);
  else push('unknown-pin', 'pin', `no pin "${end.pin}" on chip "${end.chip}"`);
  return false;
}

function issuesOfModule(circuit: Circuit, id: string): Issue[] {
  const m = circuit.modules[id];
  const out: Issue[] = [];
  if (!m) return out;
  const push = (code: CircuitErrorCode, path: string, message: string) => out.push({ code, module: id, path, message });
  const zones = new Set((m.zones ?? []).map((z) => z.id));

  duplicates(m.chips, 'chips', id, 'chip', out);
  m.chips.forEach((chip, i) => {
    if (chip.module === undefined) {
      duplicates(
        (chip.pins ?? []).filter((p) => p.side === 'in'),
        `chips[${i}].pins`,
        id,
        'in pin',
        out,
      );
      duplicates(
        (chip.pins ?? []).filter((p) => p.side === 'out'),
        `chips[${i}].pins`,
        id,
        'out pin',
        out,
      );
    } else if (!circuit.modules[chip.module]) push('unknown-module', `chips[${i}].module`, `no module "${chip.module}"`);
    if (chip.zone !== undefined && !zones.has(chip.zone)) push('unknown-zone', `chips[${i}].zone`, `no zone "${chip.zone}"`);
  });

  duplicates(m.zones, 'zones', id, 'zone', out);
  duplicates(m.buses, 'buses', id, 'bus', out);
  duplicates(m.traces, 'traces', id, 'trace', out);
  duplicates(m.inPins, 'inPins', id, 'in pin', out);
  duplicates(m.outPins, 'outPins', id, 'out pin', out);
  duplicates(m.controls, 'controls', id, 'control', out);

  const fed = new Set<string>();
  m.traces.forEach((t, i) => {
    const path = `traces[${i}]`;
    if (isBus(t.from) && isBus(t.to)) {
      push('bus-to-bus', path, `trace "${t.id}" has a bus at both ends`);
      return;
    }
    const a = endIssue(circuit, m, t.from, 'out', `${path}.from`, out);
    const b = endIssue(circuit, m, t.to, 'in', `${path}.to`, out);
    if (a && b && !isBus(t.from) && !isBus(t.to) && t.from.chip === t.to.chip)
      push('self-loop', `${path}.to.chip`, `trace "${t.id}" loops on chip "${t.from.chip}"`);
    const bad = amountIssue(t);
    if (bad) push('bad-amount', `${path}.amount`, bad);
    if (isBus(t.to)) {
      if (fed.has(t.to.bus)) push('bus-has-source', `${path}.to.bus`, `bus "${t.to.bus}" has more than one source`);
      fed.add(t.to.bus);
    }
  });

  m.inPins.forEach((p, i) => endIssue(circuit, m, p.maps, 'in', `inPins[${i}].maps`, out));
  m.outPins.forEach((p, i) => endIssue(circuit, m, p.maps, 'out', `outPins[${i}].maps`, out));
  (m.controls ?? []).forEach((c, i) => {
    if (!m.chips.some((chip) => chip.id === c.maps.chip)) push('unknown-chip', `controls[${i}].maps.chip`, `no chip "${c.maps.chip}"`);
  });
  return out;
}

/** One issue per module that contains an instance of itself, on the first chip that leads back. */
function cycleIssues(circuit: Circuit): Issue[] {
  const out: Issue[] = [];
  for (const [key, m] of Object.entries(circuit.modules)) {
    const i = m.chips.findIndex((c) => c.module !== undefined && (c.module === key || reaches(circuit, c.module, key)));
    if (i >= 0)
      out.push({ code: 'cycle-in-modules', module: key, path: `chips[${i}].module`, message: `module "${key}" contains itself through "${m.chips[i].module}"` });
  }
  return out;
}

/** Every problem with the circuit, one issue each. Never throws; `[]` for a sound circuit. */
export function validate(circuit: Circuit): Issue[] {
  const out: Issue[] = [];
  try {
    if (!circuit.modules[circuit.board])
      out.push({ code: 'unknown-module', module: circuit.board, path: 'board', message: `no board module "${circuit.board}"` });
    for (const [key, m] of Object.entries(circuit.modules)) {
      if (m.id !== key)
        out.push({ code: 'unknown-module', module: key, path: `modules.${key}.id`, message: `module keyed "${key}" says its id is "${m.id}"` });
      out.push(...issuesOfModule(circuit, key));
    }
    out.push(...cycleIssues(circuit));
  } catch (e) {
    // A shape too broken to walk (missing arrays) is still an answer, not a throw.
    out.push({ code: 'unknown-module', module: circuit?.board ?? '', path: '', message: `unreadable circuit: ${(e as Error).message}` });
  }
  return out;
}
