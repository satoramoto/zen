// The circuit model's contract (docs/circuit-model.md, behaviours 1–20 and 17a–17h), tested on
// the plain-JSON model and its pure operations only. Each test names the behaviour it holds.
import { describe, expect, it } from 'vitest';
import {
  CircuitError,
  addBus,
  addModule,
  connect,
  disconnect,
  emptyCircuit,
  flatten,
  moveChip,
  pinsOf,
  placeChip,
  removeBus,
  removeChip,
  validate,
  type Chip,
  type Circuit,
  type CircuitErrorCode,
  type Issue,
  type Module,
  type Pin,
  type PinEnd,
  type Trace,
} from './circuit';

// ---------------------------------------------------------------------------------------------
// Fixtures: literal JSON, so a broken operation can't break the setup of another's test.

const pin = (id: string, side: Pin['side'], extra: Partial<Pin> = {}): Pin => ({ id, side, ...extra });
const end = (chip: string, p: string): PinEnd => ({ chip, pin: p });
const trace = (id: string, from: Trace['from'], to: Trace['to'], extra: Partial<Trace> = {}): Trace => ({ id, from, to, ...extra });
const chip = (id: string, pins: Pin[], extra: Partial<Chip> = {}): Chip => ({ id, type: id, x: 0, y: 0, pins, ...extra });
const mod = (id: string, extra: Partial<Module> = {}): Module => ({ id, chips: [], traces: [], inPins: [], outPins: [], ...extra });

/** A module used as a sub-circuit: env → vca inside, gate in, audio out, a level control. */
function voice(): Module {
  return mod('voice', {
    chips: [
      chip('env', [pin('gate', 'in', { kind: 'gate' }), pin('out', 'out')]),
      chip('vca', [pin('in', 'in', { kind: 'audio' }), pin('cv', 'in', { param: true }), pin('out', 'out', { kind: 'audio' })], { params: { level: 0.5 } }),
    ],
    traces: [trace('v1', end('env', 'out'), end('vca', 'cv'))],
    inPins: [{ id: 'gate', kind: 'gate', label: 'Gate', maps: end('env', 'gate') }],
    outPins: [{ id: 'out', kind: 'audio', label: 'Out', maps: end('vca', 'out') }],
    controls: [{ id: 'level', label: 'Level', maps: { chip: 'vca', param: 'level' } }],
  });
}

/**
 * The board: osc → vcf, an lfo, an amp, one voice instance, and every presentation hint and
 * unknown field the model must carry along untouched.
 */
function circuit(): Circuit {
  return {
    version: 1,
    board: 'board',
    modules: {
      board: mod('board', {
        chips: [
          chip('osc', [pin('out', 'out', { kind: 'audio', placement: 'e' }), pin('fm', 'in', { param: true, placement: { face: 'n', at: 0.25 } })], {
            x: 10,
            y: 20,
            colour: 'teal',
            meta: { note: 'kept', nested: [1, 2] },
          }),
          chip('lfo', [pin('out', 'out', { placement: { x: 0.5, y: 1 } })], { x: 10, y: 200 }),
          chip('vcf', [pin('in', 'in', { kind: 'audio', placement: 'auto' }), pin('cut', 'in', { param: true }), pin('out', 'out')], { x: 200, y: 20, zone: 'z1' }),
          chip('amp', [pin('in', 'in'), pin('out', 'out')], { x: 400, y: 20 }),
          chip('v1', [pin('ignored', 'out')], { module: 'voice', x: 200, y: 200 }),
        ],
        traces: [trace('t1', end('osc', 'out'), end('vcf', 'in'), { kind: 'audio', note: 'kept' })],
        zones: [{ id: 'z1', label: 'Filter' }],
        layout: 'radial',
        routing: 'trace',
        author: 'ryan',
      }),
      voice: voice(),
    },
  };
}

/** Clone, then freeze deep: a mutating operation throws in strict-mode code instead of passing. */
function frozen<T>(value: T): T {
  const copy = structuredClone(value);
  const freeze = (v: unknown) => {
    if (v && typeof v === 'object') {
      Object.freeze(v);
      for (const child of Object.values(v)) freeze(child);
    }
  };
  freeze(copy);
  return copy;
}

function codeOf(fn: () => unknown): CircuitErrorCode | 'no-throw' | 'not-a-circuit-error' {
  try {
    fn();
  } catch (e) {
    return e instanceof CircuitError ? e.code : 'not-a-circuit-error';
  }
  return 'no-throw';
}

/** Expect `fn(input)` to throw that `CircuitError` code and leave the input as it was. */
function expectRefused(c: Circuit, fn: (c: Circuit) => unknown, code: CircuitErrorCode) {
  const before = structuredClone(c);
  expect(codeOf(() => fn(c))).toBe(code);
  expect(c).toEqual(before);
}

const board = (c: Circuit) => c.modules[c.board];
const traceIds = (ts: Trace[]) => ts.map((t) => t.id).sort();
const has = (issues: Issue[], code: CircuitErrorCode, path?: string | RegExp) =>
  issues.some((i) => i.code === code && (path === undefined || (typeof path === 'string' ? i.path === path : path.test(i.path))));

/** A board with one bus `main`, its source osc.out, and a tap into vcf.cut. */
function bussed(): Circuit {
  const c = circuit();
  board(c).buses = [{ id: 'main', label: 'Main', kind: 'cv' }, { id: 'spare' }];
  board(c).traces.push(
    trace('src', end('lfo', 'out'), { bus: 'main' }),
    trace('tap1', { bus: 'main' }, end('vcf', 'cut'), { kind: 'cv', role: 'modulation', amount: -0.5 }),
    trace('tap2', { bus: 'main' }, end('amp', 'in'), { kind: 'audio' }),
  );
  return c;
}

// Every state-changing operation, each with a call that succeeds on `circuit()` / `bussed()`.
const OPS: [string, (c: Circuit) => Circuit][] = [
  ['addModule', (c) => addModule(c, mod('extra'))],
  ['placeChip', (c) => placeChip(c, 'board', chip('new', [pin('in', 'in')]))],
  ['removeChip', (c) => removeChip(c, 'board', 'amp')],
  ['moveChip', (c) => moveChip(c, 'board', 'amp', 5, 6)],
  ['connect', (c) => connect(c, 'board', trace('n', end('lfo', 'out'), end('osc', 'fm'), { role: 'modulation', amount: 0.5 }))],
  ['disconnect', (c) => disconnect(c, 'board', 't1')],
  ['addBus', (c) => addBus(c, 'board', { id: 'other' })],
  ['removeBus', (c) => removeBus(c, 'board', 'spare')],
];

// ---------------------------------------------------------------------------------------------

describe('1. every operation is pure', () => {
  it.each(OPS)('%s returns a new circuit and leaves its frozen input deep-equal', (_, op) => {
    const input = frozen(bussed());
    const next = op(input);
    expect(next).not.toBe(input);
    expect(input).toEqual(bussed());
  });

  it('the queries (pinsOf, flatten, validate) leave their frozen input deep-equal', () => {
    const input = frozen(bussed());
    pinsOf(input, 'board', 'v1');
    flatten(input, 'board');
    validate(input);
    expect(input).toEqual(bussed());
  });
});

describe('2. unknown fields pass through every operation', () => {
  it.each(OPS)('%s keeps the extra fields on chips, traces and modules', (_, op) => {
    const next = board(op(bussed()));
    expect(next.author).toBe('ryan');
    const osc = next.chips.find((c) => c.id === 'osc')!;
    expect(osc.colour).toBe('teal');
    expect(osc.meta).toEqual({ note: 'kept', nested: [1, 2] });
    const t1 = next.traces.find((t) => t.id === 't1');
    if (t1) expect(t1.note).toBe('kept'); // disconnect removes t1 itself
  });

  it('keeps unknown fields on the chip it places and the trace it connects', () => {
    let c = placeChip(circuit(), 'board', chip('new', [pin('in', 'in')], { tag: { a: 1 } }));
    c = connect(c, 'board', trace('n', end('amp', 'out'), end('new', 'in'), { wire: 'red' }));
    expect(board(c).chips.find((x) => x.id === 'new')!.tag).toEqual({ a: 1 });
    expect(board(c).traces.find((t) => t.id === 'n')!.wire).toBe('red');
  });

  it('moveChip keeps the moved chip\'s unknown fields', () => {
    const osc = board(moveChip(circuit(), 'board', 'osc', 1, 2)).chips.find((x) => x.id === 'osc')!;
    expect(osc.colour).toBe('teal');
  });
});

describe('3. naming something that does not exist throws its unknown-* code, input unchanged', () => {
  const T = (from: Trace['from'], to: Trace['to']) => trace('n', from, to);
  it.each<[string, (c: Circuit) => unknown, CircuitErrorCode]>([
    ['placeChip into an unknown module', (c) => placeChip(c, 'nope', chip('x', [])), 'unknown-module'],
    ['placeChip an instance of an unknown module', (c) => placeChip(c, 'board', chip('x', [], { module: 'nope' })), 'unknown-module'],
    ['placeChip into an unknown zone', (c) => placeChip(c, 'board', chip('x', [], { zone: 'nope' })), 'unknown-zone'],
    ['addModule holding an instance of an unknown module', (c) => addModule(c, mod('m', { chips: [chip('x', [], { module: 'nope' })] })), 'unknown-module'],
    ['removeChip in an unknown module', (c) => removeChip(c, 'nope', 'osc'), 'unknown-module'],
    ['removeChip of an unknown chip', (c) => removeChip(c, 'board', 'nope'), 'unknown-chip'],
    ['moveChip in an unknown module', (c) => moveChip(c, 'nope', 'osc', 0, 0), 'unknown-module'],
    ['moveChip of an unknown chip', (c) => moveChip(c, 'board', 'nope', 0, 0), 'unknown-chip'],
    ['connect in an unknown module', (c) => connect(c, 'nope', T(end('osc', 'out'), end('amp', 'in'))), 'unknown-module'],
    ['connect from an unknown chip', (c) => connect(c, 'board', T(end('nope', 'out'), end('amp', 'in'))), 'unknown-chip'],
    ['connect to an unknown chip', (c) => connect(c, 'board', T(end('osc', 'out'), end('nope', 'in'))), 'unknown-chip'],
    ['connect from an unknown pin', (c) => connect(c, 'board', T(end('osc', 'nope'), end('amp', 'in'))), 'unknown-pin'],
    ['connect to an unknown pin', (c) => connect(c, 'board', T(end('osc', 'out'), end('amp', 'nope'))), 'unknown-pin'],
    ['connect to an instance\'s own (ignored) pin', (c) => connect(c, 'board', T(end('v1', 'ignored'), end('amp', 'in'))), 'unknown-pin'],
    ['connect within a chip\'s module, to a pin of a chip in another module', (c) => connect(c, 'voice', T(end('osc', 'out'), end('vca', 'in'))), 'unknown-chip'],
    ['disconnect in an unknown module', (c) => disconnect(c, 'nope', 't1'), 'unknown-module'],
    ['disconnect an unknown trace', (c) => disconnect(c, 'board', 'nope'), 'unknown-trace'],
    ['addBus to an unknown module', (c) => addBus(c, 'nope', { id: 'b' }), 'unknown-module'],
    ['removeBus in an unknown module', (c) => removeBus(c, 'nope', 'main'), 'unknown-module'],
    ['pinsOf in an unknown module', (c) => pinsOf(c, 'nope', 'osc'), 'unknown-module'],
    ['pinsOf an unknown chip', (c) => pinsOf(c, 'board', 'nope'), 'unknown-chip'],
    ['flatten an unknown module', (c) => flatten(c, 'nope'), 'unknown-module'],
  ])('%s', (_, fn, code) => expectRefused(bussed(), fn, code));
});

describe('4. duplicate ids', () => {
  it('placeChip throws duplicate-id for a chip id already in the module', () => {
    expectRefused(circuit(), (c) => placeChip(c, 'board', chip('osc', [])), 'duplicate-id');
  });
  it('connect throws duplicate-id for a trace id already in the module', () => {
    expectRefused(circuit(), (c) => connect(c, 'board', trace('t1', end('amp', 'out'), end('osc', 'fm'))), 'duplicate-id');
  });
  it('addModule throws duplicate-id for a module id already in the circuit', () => {
    expectRefused(circuit(), (c) => addModule(c, mod('voice')), 'duplicate-id');
  });
  it('ids are unique per module only: the same chip and trace ids may live in two modules', () => {
    let c = placeChip(circuit(), 'voice', chip('osc', [pin('out', 'out')]));
    c = connect(c, 'voice', trace('t1', end('osc', 'out'), end('vca', 'in')));
    expect(c.modules.voice.chips.map((x) => x.id)).toContain('osc');
    expect(traceIds(c.modules.voice.traces)).toContain('t1');
    expect(validate(c)).toEqual([]);
  });
});

describe('5. connect throws wrong-side unless out pin → in pin (through pinsOf)', () => {
  it.each<[string, Trace['from'], Trace['to']]>([
    ['from an in pin', end('vcf', 'in'), end('amp', 'in')],
    ['to an out pin', end('osc', 'out'), end('amp', 'out')],
    ['both reversed', end('amp', 'in'), end('osc', 'out')],
    ['from an instance\'s in pin (module inPin)', end('v1', 'gate'), end('amp', 'in')],
    ['to an instance\'s out pin (module outPin)', end('osc', 'out'), end('v1', 'out')],
  ])('%s', (_, from, to) => expectRefused(circuit(), (c) => connect(c, 'board', trace('n', from, to)), 'wrong-side'));

  it('an instance\'s module pins connect on their own sides', () => {
    let c = connect(circuit(), 'board', trace('a', end('lfo', 'out'), end('v1', 'gate')));
    c = connect(c, 'board', trace('b', end('v1', 'out'), end('amp', 'in')));
    expect(traceIds(board(c).traces)).toEqual(['a', 'b', 't1']);
  });

  it('a chip may call an in pin and an out pin by the same id; each end resolves on its own side', () => {
    let c = placeChip(circuit(), 'board', chip('mix', [pin('x', 'in'), pin('x', 'out')]));
    c = connect(c, 'board', trace('a', end('osc', 'out'), end('mix', 'x')));
    c = connect(c, 'board', trace('b', end('mix', 'x'), end('amp', 'in')));
    expect(traceIds(board(c).traces)).toEqual(['a', 'b', 't1']);
  });
});

describe('6. connect throws self-loop when both ends are on one chip', () => {
  it('on a plain chip, out → in', () => {
    expectRefused(circuit(), (c) => connect(c, 'board', trace('n', end('vcf', 'out'), end('vcf', 'cut'))), 'self-loop');
  });
  it('on a module instance, out → in', () => {
    expectRefused(circuit(), (c) => connect(c, 'board', trace('n', end('v1', 'out'), end('v1', 'gate'))), 'self-loop');
  });
});

describe('7. amount: -1..1, and only on a modulation trace', () => {
  const mo = (amount?: number, role?: Trace['role']) =>
    trace('n', end('lfo', 'out'), end('osc', 'fm'), { ...(role ? { role } : {}), ...(amount === undefined ? {} : { amount }) });

  it.each([-1, 0, 1, 0.5])('accepts amount %s on a modulation trace', (amount) => {
    const c = connect(circuit(), 'board', mo(amount, 'modulation'));
    expect(board(c).traces.find((t) => t.id === 'n')!.amount).toBe(amount);
  });
  it('accepts a modulation trace with no amount', () => {
    expect(traceIds(board(connect(circuit(), 'board', mo(undefined, 'modulation'))).traces)).toContain('n');
  });
  it.each([-1.0001, 1.0001, -2, 2])('throws bad-amount for %s, just outside', (amount) => {
    expectRefused(circuit(), (c) => connect(c, 'board', mo(amount, 'modulation')), 'bad-amount');
  });
  it('throws bad-amount for an amount on an explicit signal trace', () => {
    expectRefused(circuit(), (c) => connect(c, 'board', mo(0.5, 'signal')), 'bad-amount');
  });
  it('throws bad-amount for an amount on a trace with no role (signal by default), even 0', () => {
    expectRefused(circuit(), (c) => connect(c, 'board', mo(0)), 'bad-amount');
  });
});

describe('8. fan-in and fan-out', () => {
  it('an in pin takes several traces', () => {
    let c = connect(circuit(), 'board', trace('a', end('lfo', 'out'), end('vcf', 'in')));
    c = connect(c, 'board', trace('b', end('amp', 'out'), end('vcf', 'in')));
    expect(board(c).traces.filter((t) => (t.to as PinEnd).chip === 'vcf' && (t.to as PinEnd).pin === 'in')).toHaveLength(3);
  });
  it('an out pin feeds several traces', () => {
    let c = connect(circuit(), 'board', trace('a', end('osc', 'out'), end('amp', 'in')));
    c = connect(c, 'board', trace('b', end('osc', 'out'), end('v1', 'gate')));
    expect(board(c).traces.filter((t) => (t.from as PinEnd).chip === 'osc')).toHaveLength(3);
  });
});

describe('9. removeChip removes the chip, its traces, and module pins / controls mapping to it', () => {
  it('drops traces to and from the chip, and keeps the rest', () => {
    let c = connect(circuit(), 'board', trace('a', end('vcf', 'out'), end('amp', 'in')));
    c = connect(c, 'board', trace('b', end('lfo', 'out'), end('osc', 'fm'), { role: 'modulation' }));
    c = removeChip(c, 'board', 'vcf');
    expect(board(c).chips.map((x) => x.id)).not.toContain('vcf');
    expect(traceIds(board(c).traces)).toEqual(['b']);
  });
  it('drops a bus source trace from the removed chip, and the bus stays', () => {
    const c = removeChip(bussed(), 'board', 'lfo');
    expect(traceIds(board(c).traces)).toEqual(['t1', 'tap1', 'tap2']);
    expect(board(c).buses!.map((b) => b.id)).toContain('main');
  });
  it('drops every ModulePin and Control mapping to the chip, and keeps the others', () => {
    const c = removeChip(circuit(), 'voice', 'vca');
    const v = c.modules.voice;
    expect(v.outPins).toEqual([]);
    expect(v.controls ?? []).toEqual([]);
    expect(v.inPins.map((p) => p.id)).toEqual(['gate']);
    expect(v.traces).toEqual([]);
  });
  it('removing a chip a ModulePin maps to drops, in every module, the traces into that pin on instances', () => {
    let c = addModule(circuit(), mod('rack', { chips: [chip('inner', [], { module: 'voice' }), chip('src', [pin('out', 'out')])] }));
    c = placeChip(c, 'board', chip('rk', [], { module: 'rack' }));
    c = connect(c, 'board', trace('toGate', end('lfo', 'out'), end('v1', 'gate')));
    c = connect(c, 'board', trace('fromOut', end('v1', 'out'), end('amp', 'in')));
    c = connect(c, 'rack', trace('innerGate', end('src', 'out'), end('inner', 'gate')));
    c = removeChip(c, 'voice', 'env');
    expect(c.modules.voice.inPins).toEqual([]);
    expect(traceIds(board(c).traces)).toEqual(['fromOut', 't1']);
    expect(c.modules.rack.traces).toEqual([]);
    expect(pinsOf(c, 'board', 'v1').map((p) => p.id)).toEqual(['out']);
    expect(validate(c)).toEqual([]);
  });
  it('removing the only chip leaves an empty module', () => {
    const c = removeChip(placeChip(emptyCircuit(), 'board', chip('a', [])), 'board', 'a');
    expect(c).toEqual(emptyCircuit());
  });
});

describe('10. moveChip changes only that chip\'s x and y', () => {
  it.each([
    [5, 6],
    [-40.5, 0],
  ])('to (%s, %s)', (x, y) => {
    const before = circuit();
    const after = moveChip(before, 'board', 'osc', x, y);
    const expected = circuit();
    const osc = board(expected).chips.find((c) => c.id === 'osc')!;
    osc.x = x;
    osc.y = y;
    expect(after).toEqual(expected);
  });
});

describe('11. disconnect removes only that trace', () => {
  it('keeps every other trace, in order', () => {
    const c = disconnect(bussed(), 'board', 'tap1');
    const expected = bussed();
    board(expected).traces = board(expected).traces.filter((t) => t.id !== 'tap1');
    expect(c).toEqual(expected);
  });
  it('removing the last trace leaves none', () => {
    expect(board(disconnect(circuit(), 'board', 't1')).traces).toEqual([]);
  });
});

describe('12. emptyCircuit', () => {
  it('returns the board-only circuit with board id "board" by default', () => {
    expect(emptyCircuit()).toEqual({
      version: 1,
      board: 'board',
      modules: { board: { id: 'board', chips: [], traces: [], inPins: [], outPins: [] } },
    });
  });
  it('takes another board id', () => {
    expect(emptyCircuit('main')).toEqual({
      version: 1,
      board: 'main',
      modules: { main: { id: 'main', chips: [], traces: [], inPins: [], outPins: [] } },
    });
  });
  it('returns a fresh circuit each call', () => {
    expect(emptyCircuit()).not.toBe(emptyCircuit());
  });
});

describe('13. a circuit survives a JSON round trip', () => {
  /** True when the value is only plain objects, arrays and JSON scalars. */
  function plain(v: unknown): boolean {
    if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) return true;
    if (Array.isArray(v)) return v.every(plain);
    if (typeof v === 'object') return Object.getPrototypeOf(v) === Object.prototype && Object.values(v as object).every((x) => x === undefined || plain(x));
    return false;
  }
  it('the fixture and the result of every operation are plain JSON and round-trip deep-equal', () => {
    const results = [bussed(), emptyCircuit(), ...OPS.map(([, op]) => op(bussed()))];
    for (const c of results) {
      expect(plain(c)).toBe(true);
      expect(JSON.parse(JSON.stringify(c))).toEqual(c);
    }
  });
});

describe('14. a chip with `module` is an instance: pinsOf gives the module\'s pins', () => {
  it('gives inPins as side in and outPins as side out, with id, kind and label, ignoring the chip\'s own pins', () => {
    const pins = pinsOf(circuit(), 'board', 'v1');
    expect(pins).toHaveLength(2);
    expect(pins).toContainEqual(expect.objectContaining({ id: 'gate', side: 'in', kind: 'gate', label: 'Gate' }));
    expect(pins).toContainEqual(expect.objectContaining({ id: 'out', side: 'out', kind: 'audio', label: 'Out' }));
    expect(pins.map((p) => p.id)).not.toContain('ignored');
  });
  it('gives a plain chip its own pins', () => {
    expect(pinsOf(circuit(), 'board', 'amp')).toEqual([pin('in', 'in'), pin('out', 'out')]);
  });
  it('gives an instance of a module with no module pins none', () => {
    const c = placeChip(addModule(circuit(), mod('bare')), 'board', chip('b', [pin('own', 'in')], { module: 'bare' }));
    expect(pinsOf(c, 'board', 'b')).toEqual([]);
  });
});

describe('15. one module, many instances, never clashing', () => {
  it('two instances on the board and one inside another module each take their own traces', () => {
    let c = addModule(circuit(), mod('rack', { chips: [chip('inner', [], { module: 'voice' }), chip('src', [pin('out', 'out')])] }));
    c = placeChip(c, 'board', chip('v2', [], { module: 'voice' }));
    c = connect(c, 'board', trace('a', end('lfo', 'out'), end('v1', 'gate')));
    c = connect(c, 'board', trace('b', end('lfo', 'out'), end('v2', 'gate')));
    c = connect(c, 'rack', trace('a', end('src', 'out'), end('inner', 'gate')));
    expect(board(c).traces.map((t) => t.to)).toEqual(expect.arrayContaining([end('v1', 'gate'), end('v2', 'gate')]));
    expect(c.modules.rack.traces.map((t) => t.id)).toEqual(['a']);
    expect(validate(c)).toEqual([]);
  });
});

describe('16. no module may contain itself, directly or through others', () => {
  it('addModule of a module holding an instance of itself throws cycle-in-modules', () => {
    expectRefused(circuit(), (c) => addModule(c, mod('loop', { chips: [chip('me', [], { module: 'loop' })] })), 'cycle-in-modules');
  });
  it('placeChip of an instance of a module into itself throws cycle-in-modules', () => {
    expectRefused(circuit(), (c) => placeChip(c, 'voice', chip('me', [], { module: 'voice' })), 'cycle-in-modules');
  });
  it('placeChip of an instance of the board into the board throws cycle-in-modules', () => {
    expectRefused(circuit(), (c) => placeChip(c, 'board', chip('me', [], { module: 'board' })), 'cycle-in-modules');
  });
  it('placeChip closing an indirect cycle (A ⊃ B ⊃ C, then A into C) throws cycle-in-modules', () => {
    let c = addModule(circuit(), mod('C'));
    c = addModule(c, mod('B', { chips: [chip('c', [], { module: 'C' })] }));
    c = addModule(c, mod('A', { chips: [chip('b', [], { module: 'B' })] }));
    expectRefused(c, (x) => placeChip(x, 'C', chip('a', [], { module: 'A' })), 'cycle-in-modules');
    // B into C is a cycle too (C ⊂ B), one level shallower.
    expectRefused(c, (x) => placeChip(x, 'C', chip('b', [], { module: 'B' })), 'cycle-in-modules');
  });
  it('reuse without a cycle (a diamond: A and B both hold C, the board holds both) is accepted', () => {
    let c = addModule(circuit(), mod('C'));
    c = addModule(c, mod('A', { chips: [chip('c', [], { module: 'C' })] }));
    c = addModule(c, mod('B', { chips: [chip('c', [], { module: 'C' })] }));
    c = placeChip(c, 'board', chip('a', [], { module: 'A' }));
    c = placeChip(c, 'board', chip('b', [], { module: 'B' }));
    expect(validate(c)).toEqual([]);
  });
});

describe('17. a new module pin shows on every instance through pinsOf', () => {
  it('adding an in and an out pin to the module reaches both instances, which stay unchanged', () => {
    const c = placeChip(circuit(), 'board', chip('v2', [], { module: 'voice' }));
    const instancesBefore = structuredClone(board(c).chips.filter((x) => x.module === 'voice'));
    const grown: Circuit = {
      ...c,
      modules: {
        ...c.modules,
        voice: {
          ...c.modules.voice,
          inPins: [...c.modules.voice.inPins, { id: 'amp', maps: end('vca', 'in') }],
          outPins: [...c.modules.voice.outPins, { id: 'env', maps: end('env', 'out') }],
        },
      },
    };
    for (const id of ['v1', 'v2']) {
      const pins = pinsOf(grown, 'board', id);
      expect(pins).toContainEqual(expect.objectContaining({ id: 'amp', side: 'in' }));
      expect(pins).toContainEqual(expect.objectContaining({ id: 'env', side: 'out' }));
    }
    expect(board(grown).chips.filter((x) => x.module === 'voice')).toEqual(instancesBefore);
  });
});

describe('17g. placement, layout and routing never affect the rules', () => {
  it('an out pin and an in pin on the same face, or swapped faces, connect by side alone', () => {
    let c = placeChip(circuit(), 'board', chip('a', [pin('o', 'out', { placement: 'w' }), pin('i', 'in', { placement: 'w' })]));
    c = placeChip(c, 'board', chip('b', [pin('o', 'out', { placement: 'w' }), pin('i', 'in', { placement: 'e' })]));
    c = connect(c, 'board', trace('ab', end('a', 'o'), end('b', 'i')));
    c = connect(c, 'board', trace('ba', end('b', 'o'), end('a', 'i')));
    expect(traceIds(board(c).traces)).toEqual(['ab', 'ba', 't1']);
    expect(validate(c)).toEqual([]);
  });
  it('an in pin placed on the trailing face is still an in pin: wrong-side as a source', () => {
    const c = placeChip(circuit(), 'board', chip('a', [pin('i', 'in', { placement: 'e' })]));
    expectRefused(c, (x) => connect(x, 'board', trace('n', end('a', 'i'), end('amp', 'in'))), 'wrong-side');
  });
  it.each<[string, Pin['placement']]>([
    ['auto', 'auto'],
    ['a face', 's'],
    ['at 0', { face: 'n', at: 0 }],
    ['at 1', { face: 'w', at: 1 }],
    ['x, y at the corners', { x: 0, y: 1 }],
  ])('validate accepts a well-formed placement (%s)', (_, placement) => {
    const c = circuit();
    board(c).chips[3].pins[0].placement = placement;
    expect(validate(c)).toEqual([]);
  });
  it.each(['free', 'radial', 'lr', 'tb'] as const)('validate accepts layout %s', (layout) => {
    const c = circuit();
    board(c).layout = layout;
    expect(validate(c)).toEqual([]);
  });
  it.each(['curve', 'trace'] as const)('validate accepts routing %s', (routing) => {
    const c = circuit();
    board(c).routing = routing;
    expect(validate(c)).toEqual([]);
  });
  it.each<[string, unknown, string]>([
    ['an unlisted keyword', 'middle', 'placement'],
    ['an unknown face', 'x', 'placement'],
    ['an unknown face with at', { face: 'up', at: 0.5 }, 'placement'],
    ['at just above 1', { face: 'n', at: 1.01 }, 'placement'],
    ['at just below 0', { face: 'n', at: -0.01 }, 'placement'],
    ['x outside 0..1', { x: 1.5, y: 0.5 }, 'placement'],
    ['y outside 0..1', { x: 0.5, y: -1 }, 'placement'],
  ])('validate reports a malformed placement (%s) at its path', (_, placement, field) => {
    const c = circuit();
    (board(c).chips[3].pins[0] as { placement?: unknown }).placement = placement;
    const issues = validate(c);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code: 'bad-hint', module: 'board' });
    expect(issues[0].path).toContain(`chips[3].pins[0].${field}`);
  });
  it.each<[string, string]>([
    ['layout', 'spiral'],
    ['routing', 'zigzag'],
  ])('validate reports a malformed module %s at its path', (field, value) => {
    const c = circuit();
    (board(c) as unknown as Record<string, unknown>)[field] = value;
    const issues = validate(c);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code: 'bad-hint', module: 'board' });
    expect(issues[0].path).toContain(field);
  });
});

describe('17h. placement, layout and routing survive every operation unchanged', () => {
  it.each(OPS)('%s', (_, op) => {
    const next = board(op(bussed()));
    expect(next.layout).toBe('radial');
    expect(next.routing).toBe('trace');
    const osc = next.chips.find((c) => c.id === 'osc')!;
    expect(osc.pins.map((p) => p.placement)).toEqual(['e', { face: 'n', at: 0.25 }]);
    expect(next.chips.find((c) => c.id === 'lfo')!.pins[0].placement).toEqual({ x: 0.5, y: 1 });
  });
});

describe('17a. addBus and removeBus', () => {
  it('adds a bus to a module with no buses yet, and a second one beside it', () => {
    let c = addBus(circuit(), 'board', { id: 'a', label: 'A', kind: 'cv' });
    c = addBus(c, 'board', { id: 'b' });
    expect(board(c).buses).toEqual([{ id: 'a', label: 'A', kind: 'cv' }, { id: 'b' }]);
  });
  it('throws duplicate-id for a bus id already in the module', () => {
    expectRefused(bussed(), (c) => addBus(c, 'board', { id: 'main' }), 'duplicate-id');
  });
  it('the same bus id may exist in two modules', () => {
    const c = addBus(bussed(), 'voice', { id: 'main' });
    expect(c.modules.voice.buses!.map((b) => b.id)).toEqual(['main']);
  });
  it('removeBus throws unknown-bus for a bus that does not exist', () => {
    expectRefused(bussed(), (c) => removeBus(c, 'board', 'nope'), 'unknown-bus');
  });
  it('removeBus of the only bus leaves the module with none', () => {
    const c = removeBus(addBus(circuit(), 'board', { id: 'a' }), 'board', 'a');
    expect(board(c).buses ?? []).toEqual([]);
  });
});

describe('17b. connect with a bus end', () => {
  const withBus = () => addBus(circuit(), 'board', { id: 'b' });
  it('to: {bus} makes the trace the bus\'s source', () => {
    const c = connect(withBus(), 'board', trace('s', end('lfo', 'out'), { bus: 'b' }));
    expect(board(c).traces.find((t) => t.id === 's')!.to).toEqual({ bus: 'b' });
  });
  it('a second source throws bus-has-source', () => {
    expectRefused(bussed(), (c) => connect(c, 'board', trace('s2', end('osc', 'out'), { bus: 'main' })), 'bus-has-source');
  });
  it('from: {bus} makes a tap, and a bus takes many taps', () => {
    let c = connect(bussed(), 'board', trace('tap3', { bus: 'main' }, end('osc', 'fm')));
    c = connect(c, 'board', trace('tap4', { bus: 'main' }, end('v1', 'gate')));
    expect(board(c).traces.filter((t) => 'bus' in t.from)).toHaveLength(4);
  });
  it('both ends a bus throws bus-to-bus', () => {
    expectRefused(bussed(), (c) => connect(c, 'board', trace('n', { bus: 'main' }, { bus: 'spare' })), 'bus-to-bus');
  });
  it('a bus to itself throws bus-to-bus', () => {
    expectRefused(bussed(), (c) => connect(c, 'board', trace('n', { bus: 'spare' }, { bus: 'spare' })), 'bus-to-bus');
  });
  it('an unknown bus as source target throws unknown-bus', () => {
    expectRefused(bussed(), (c) => connect(c, 'board', trace('n', end('osc', 'out'), { bus: 'nope' })), 'unknown-bus');
  });
  it('an unknown bus as tap throws unknown-bus', () => {
    expectRefused(bussed(), (c) => connect(c, 'board', trace('n', { bus: 'nope' }, end('amp', 'in'))), 'unknown-bus');
  });
  it('a tap into an out pin throws wrong-side', () => {
    expectRefused(bussed(), (c) => connect(c, 'board', trace('n', { bus: 'main' }, end('amp', 'out'))), 'wrong-side');
  });
  it('a source from an in pin throws wrong-side', () => {
    expectRefused(bussed(), (c) => connect(c, 'board', trace('n', end('amp', 'in'), { bus: 'spare' })), 'wrong-side');
  });
  it('a tap still follows the amount rule', () => {
    expectRefused(bussed(), (c) => connect(c, 'board', trace('n', { bus: 'main' }, end('osc', 'fm'), { amount: 0.2 })), 'bad-amount');
  });
});

describe('17c. taps before a source', () => {
  it('a bus takes taps with no source; flatten leaves them out until a source exists', () => {
    let c = addBus(circuit(), 'board', { id: 'b' });
    c = connect(c, 'board', trace('tap', { bus: 'b' }, end('amp', 'in')));
    expect(traceIds(flatten(c, 'board'))).toEqual(['t1']);
    c = connect(c, 'board', trace('src', end('lfo', 'out'), { bus: 'b' }));
    expect(traceIds(flatten(c, 'board'))).toEqual(['t1', 'tap']);
  });
});

describe('17d. removeBus removes the bus and every trace to or from it', () => {
  it('drops the source and every tap, and keeps the other buses and traces', () => {
    const c = removeBus(bussed(), 'board', 'main');
    expect(board(c).buses!.map((b) => b.id)).toEqual(['spare']);
    expect(traceIds(board(c).traces)).toEqual(['t1']);
    expect(validate(c)).toEqual([]);
  });
});

describe('17e. flatten', () => {
  it('turns each tap into a direct trace from the source out pin, keeping its id, kind, role and amount', () => {
    const flat = flatten(bussed(), 'board');
    expect(traceIds(flat)).toEqual(['t1', 'tap1', 'tap2']);
    expect(flat.find((t) => t.id === 'tap1')).toMatchObject({
      from: end('lfo', 'out'),
      to: end('vcf', 'cut'),
      kind: 'cv',
      role: 'modulation',
      amount: -0.5,
    });
    expect(flat.find((t) => t.id === 'tap2')).toMatchObject({ from: end('lfo', 'out'), to: end('amp', 'in'), kind: 'audio' });
    expect(flat.find((t) => t.id === 'tap2')!.role ?? 'signal').toBe('signal');
  });
  it('passes traces without a bus through unchanged', () => {
    expect(flatten(bussed(), 'board').find((t) => t.id === 't1')).toEqual(board(circuit()).traces[0]);
  });
  it('leaves no bus end in its output', () => {
    for (const t of flatten(bussed(), 'board')) {
      expect('bus' in t.from).toBe(false);
      expect('bus' in t.to).toBe(false);
    }
  });
  it('a module with no buses flattens to its own traces', () => {
    expect(flatten(circuit(), 'board')).toEqual(board(circuit()).traces);
  });
  it('an empty module flattens to nothing', () => {
    expect(flatten(emptyCircuit(), 'board')).toEqual([]);
  });
  it('a bus with a source and no taps adds nothing', () => {
    const c = connect(addBus(circuit(), 'board', { id: 'b' }), 'board', trace('src', end('lfo', 'out'), { bus: 'b' }));
    expect(traceIds(flatten(c, 'board'))).toEqual(['t1']);
  });
});

describe('17f. a bus belongs to its module', () => {
  it('a module cannot reach its parent\'s bus by name: unknown-bus', () => {
    expectRefused(bussed(), (c) => connect(c, 'voice', trace('n', { bus: 'main' }, end('vca', 'in'))), 'unknown-bus');
  });
  it('validate reports a bus end naming a bus of another module', () => {
    const c = bussed();
    c.modules.voice.traces.push(trace('n', { bus: 'main' }, end('vca', 'in')));
    const issues = validate(c);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code: 'unknown-bus', module: 'voice', path: 'traces[1].from.bus' });
  });
  it('a bus feeds a sub-module through one of its instance\'s in pins', () => {
    const c = connect(bussed(), 'board', trace('n', { bus: 'main' }, end('v1', 'gate')));
    expect(flatten(c, 'board').find((t) => t.id === 'n')).toMatchObject({ from: end('lfo', 'out'), to: end('v1', 'gate') });
  });
});

describe('18. validate never throws, and reports one issue per problem with code, module and path', () => {
  it('returns [] for a valid circuit, with modules, buses, hints and unknown fields', () => {
    expect(validate(bussed())).toEqual([]);
    expect(validate(emptyCircuit())).toEqual([]);
  });
  it.each<[string, unknown]>([
    ['no modules at all', { version: 1, board: 'board', modules: {} }],
    ['a module missing its arrays', { version: 1, board: 'board', modules: { board: { id: 'board' } } }],
    ['a trace with no ends', { version: 1, board: 'board', modules: { board: { ...mod('board'), traces: [{ id: 't' }] } } }],
    ['a chip with no pins array', { version: 1, board: 'board', modules: { board: { ...mod('board'), chips: [{ id: 'c', type: 'c', x: 0, y: 0 }] } } }],
  ])('does not throw on %s, and reports something', (_, bad) => {
    let issues: Issue[] = [];
    expect(() => (issues = validate(bad as Circuit))).not.toThrow();
    expect(issues.length).toBeGreaterThan(0);
  });
  it('reports two independent problems as two issues', () => {
    const c = circuit();
    board(c).traces.push(trace('a', end('nope', 'out'), end('amp', 'in')));
    board(c).chips[3].zone = 'nope';
    const issues = validate(c);
    expect(issues).toHaveLength(2);
    expect(has(issues, 'unknown-chip', 'traces[1].from.chip')).toBe(true);
    expect(has(issues, 'unknown-zone', 'chips[3].zone')).toBe(true);
  });
  it('names the module the problem is in', () => {
    const c = circuit();
    c.modules.voice.traces[0] = trace('v1', end('env', 'nope'), end('vca', 'cv'));
    expect(validate(c)).toEqual([expect.objectContaining({ code: 'unknown-pin', module: 'voice', path: 'traces[0].from.pin' })]);
  });
});

describe('19. what validate reports', () => {
  /** A circuit with one problem planted in it. */
  const planted = (plant: (c: Circuit) => void) => {
    const c = bussed();
    plant(c);
    return validate(c);
  };

  it('a missing board module', () => {
    const issues = planted((c) => {
      c.board = 'nope';
    });
    expect(has(issues, 'unknown-module', 'board')).toBe(true);
  });
  it('a modules key that differs from its module\'s id', () => {
    const issues = planted((c) => {
      c.modules.other = mod('different');
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('key-mismatch');
  });
  it.each<[string, (c: Circuit) => void, string]>([
    ['chips', (c) => board(c).chips.push(chip('osc', [])), 'chips[5].id'],
    ['traces', (c) => board(c).traces.push(trace('t1', end('amp', 'out'), end('osc', 'fm'))), 'traces[4].id'],
    ['buses', (c) => board(c).buses!.push({ id: 'main' }), 'buses[2].id'],
    ['pins on one side of a chip', (c) => board(c).chips[3].pins.push(pin('in', 'in')), 'chips[3].pins[2].id'],
    ['module in pins', (c) => c.modules.voice.inPins.push({ id: 'gate', maps: end('env', 'gate') }), 'inPins[1].id'],
    ['zones', (c) => board(c).zones!.push({ id: 'z1' }), 'zones[1].id'],
  ])('duplicate ids among %s', (_, plant, path) => {
    expect(has(planted(plant), 'duplicate-id', path)).toBe(true);
  });
  it.each<[string, Trace, CircuitErrorCode, string]>([
    ['from an unknown chip', trace('x', end('nope', 'out'), end('amp', 'in')), 'unknown-chip', 'traces[4].from.chip'],
    ['to an unknown chip', trace('x', end('osc', 'out'), end('nope', 'in')), 'unknown-chip', 'traces[4].to.chip'],
    ['from an unknown pin', trace('x', end('osc', 'nope'), end('amp', 'in')), 'unknown-pin', 'traces[4].from.pin'],
    ['to an unknown pin', trace('x', end('osc', 'out'), end('amp', 'nope')), 'unknown-pin', 'traces[4].to.pin'],
    ['to an unknown bus', trace('x', end('osc', 'out'), { bus: 'nope' }), 'unknown-bus', 'traces[4].to.bus'],
  ])('a trace %s', (_, t, code, path) => {
    expect(planted((c) => board(c).traces.push(t))).toEqual([expect.objectContaining({ code, module: 'board', path })]);
  });
  it.each<[string, Trace, CircuitErrorCode]>([
    ['running the wrong way', trace('x', end('amp', 'in'), end('osc', 'out')), 'wrong-side'],
    ['into an instance\'s out pin', trace('x', end('osc', 'out'), end('v1', 'out')), 'wrong-side'],
    ['looping on one chip', trace('x', end('vcf', 'out'), end('vcf', 'in')), 'self-loop'],
    ['with a bus at both ends', trace('x', { bus: 'main' }, { bus: 'spare' }), 'bus-to-bus'],
    ['as a second bus source', trace('x', end('osc', 'out'), { bus: 'main' }), 'bus-has-source'],
  ])('a trace %s', (_, t, code) => {
    const issues = planted((c) => board(c).traces.push(t));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code, module: 'board' });
    // A second bus source may be reported on either source; every other case on the new trace.
    expect(issues[0].path).toMatch(code === 'bus-has-source' ? /^traces\[(1|4)\]/ : /^traces\[4\]/);
  });
  it.each<[string, Partial<Trace>]>([
    ['amount above 1', { role: 'modulation', amount: 1.5 }],
    ['amount below -1', { role: 'modulation', amount: -1.0001 }],
    ['amount on a signal trace', { amount: 0.5 }],
  ])('a trace with %s', (_, extra) => {
    const issues = planted((c) => board(c).traces.push(trace('x', end('lfo', 'out'), end('osc', 'fm'), extra)));
    expect(issues).toEqual([expect.objectContaining({ code: 'bad-amount', module: 'board', path: 'traces[4].amount' })]);
  });
  it.each<[string, (c: Circuit) => void, CircuitErrorCode, string]>([
    ['a ModulePin mapping to an unknown chip', (c) => (c.modules.voice.inPins[0].maps = end('nope', 'gate')), 'unknown-chip', 'inPins[0].maps.chip'],
    ['a ModulePin mapping to an unknown pin', (c) => (c.modules.voice.outPins[0].maps = end('vca', 'nope')), 'unknown-pin', 'outPins[0].maps.pin'],
    ['a Control mapping to an unknown chip', (c) => (c.modules.voice.controls![0].maps = { chip: 'nope', param: 'level' }), 'unknown-chip', 'controls[0].maps.chip'],
  ])('%s', (_, plant, code, path) => {
    expect(planted(plant)).toEqual([expect.objectContaining({ code, module: 'voice', path })]);
  });
  it.each<[string, (c: Circuit) => void, CircuitErrorCode, string]>([
    ['a chip instance of an unknown module', (c) => (board(c).chips[4].module = 'nope'), 'unknown-module', 'chips[4].module'],
    ['a chip in an unknown zone', (c) => (board(c).chips[0].zone = 'nope'), 'unknown-zone', 'chips[0].zone'],
    ['a tap from an unknown bus', (c) => (board(c).traces[2].from = { bus: 'nope' }), 'unknown-bus', 'traces[2].from.bus'],
  ])('%s', (_, plant, code, path) => {
    expect(planted(plant)).toEqual([expect.objectContaining({ code, module: 'board', path })]);
  });
  it('a module holding an instance of itself', () => {
    const issues = planted((c) => c.modules.voice.chips.push(chip('me', [], { module: 'voice' })));
    expect(has(issues, 'cycle-in-modules')).toBe(true);
    expect(issues.find((i) => i.code === 'cycle-in-modules')!.path).toMatch(/^chips\[/);
  });
  it('an indirect cycle among modules', () => {
    const issues = planted((c) => {
      c.modules.a = mod('a', { chips: [chip('b', [], { module: 'b' })] });
      c.modules.b = mod('b', { chips: [chip('a', [], { module: 'a' })] });
    });
    expect(has(issues, 'cycle-in-modules')).toBe(true);
    expect(issues.every((i) => i.code === 'cycle-in-modules')).toBe(true);
  });
});

describe('20. whatever the operations build validates to []', () => {
  it('stays valid after every step of a session built from emptyCircuit', () => {
    const steps: ((c: Circuit) => Circuit)[] = [
      (c) => addModule(c, voice()),
      (c) => placeChip(c, 'board', chip('lfo', [pin('out', 'out')], { x: 1, y: 2 })),
      (c) => placeChip(c, 'board', chip('osc', [pin('fm', 'in', { param: true }), pin('out', 'out', { kind: 'audio' })])),
      (c) => placeChip(c, 'board', chip('v1', [], { module: 'voice' })),
      (c) => placeChip(c, 'board', chip('v2', [], { module: 'voice' })),
      (c) => connect(c, 'board', trace('m', end('lfo', 'out'), end('osc', 'fm'), { role: 'modulation', amount: 1 })),
      (c) => addBus(c, 'board', { id: 'gate' }),
      (c) => connect(c, 'board', trace('g1', { bus: 'gate' }, end('v1', 'gate'))),
      (c) => connect(c, 'board', trace('gs', end('lfo', 'out'), { bus: 'gate' })),
      (c) => connect(c, 'board', trace('g2', { bus: 'gate' }, end('v2', 'gate'))),
      (c) => moveChip(c, 'board', 'v2', 300, 40),
      (c) => removeChip(c, 'voice', 'vca'), // its out pin isn't wired on the board
      (c) => disconnect(c, 'board', 'g1'),
      (c) => removeChip(c, 'voice', 'env'), // its gate pin is tapped on v2: that tap goes too (9)
      (c) => removeChip(c, 'board', 'lfo'),
      (c) => removeBus(c, 'board', 'gate'),
      (c) => removeChip(c, 'board', 'v1'),
    ];
    let c = emptyCircuit();
    expect(validate(c)).toEqual([]);
    for (const [i, step] of steps.entries()) {
      c = step(c);
      expect([i, validate(c)]).toEqual([i, []]);
    }
  });
});
