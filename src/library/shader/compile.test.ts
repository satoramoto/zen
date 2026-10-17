import { describe, expect, it } from 'vitest';
import type { Chip, Circuit, Module, Trace } from '../graph/model/circuit';
import { compileCircuit, paramValues, structureKey } from './compile';
import { GLSL_HELPERS, helperCode } from './glsl';
import { SHADER_NODES, shaderChip } from './nodes';
import { MAX_PARAMS } from './types';

// --- builders ------------------------------------------------------------------------------------

let traceId = 0;
/** A trace from 'chip.pin' to 'chip.pin' (or '@bus'). */
function wire(from: string, to: string): Trace {
  const end = (s: string) => (s.startsWith('@') ? { bus: s.slice(1) } : { chip: s.slice(0, s.lastIndexOf('.')), pin: s.slice(s.lastIndexOf('.') + 1) });
  return { id: `t${traceId++}`, from: end(from), to: end(to) };
}
const mod = (id: string, chips: Chip[], traces: Trace[], extra: Partial<Module> = {}): Module => ({ id, chips, traces, inPins: [], outPins: [], ...extra });
const circuit = (board: Module, ...others: Module[]): Circuit => ({
  version: 1,
  board: board.id,
  modules: Object.fromEntries([board, ...others].map((m) => [m.id, m])),
});
const chip = (type: string, id: string, params?: Chip['params']) => shaderChip(type, id, 0, 0, params);
const mergeChip = (id: string, kind: 'colour' | 'number', ins: string[]): Chip => ({
  id,
  type: 'merge',
  x: 0,
  y: 0,
  pins: [...ins.map((p) => ({ id: p, side: 'in' as const, kind })), { id: 'out', side: 'out' as const, kind }],
});

/** coord → noise → fade.amount; theme → fade.c; fade → out. */
function noiseOverTheme(noiseParams?: Chip['params'], themeParams?: Chip['params']): Circuit {
  return circuit(
    mod(
      'board',
      [chip('coord', 'coord'), chip('noise', 'noise', noiseParams), chip('theme', 'theme', themeParams), chip('fade', 'fade'), chip('out', 'out')],
      [wire('coord.p', 'noise.p'), wire('noise.n', 'fade.amount'), wire('theme.c', 'fade.c'), wire('fade.c', 'out.c')],
    ),
  );
}

/** The variable a frag declares for a flattened outlet ('chip.outlet'), from its comment. */
function varOf(frag: string, outlet: string): string | undefined {
  const line = frag.split('\n').find((l) => l.trimEnd().endsWith(`// ${outlet}`));
  return line?.match(/\b(v\d+) =/)?.[1];
}

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object') {
    Object.values(o).forEach(deepFreeze);
    Object.freeze(o);
  }
  return o;
}

// --- the compiler ----------------------------------------------------------------------------------

describe('compileCircuit', () => {
  it('compiles a reached chain into a GLSL ES 3.00 shader with one slot per unwired number inlet', () => {
    const r = compileCircuit(noiseOverTheme());
    expect(r.errors).toEqual([]);
    expect(r.frag).toMatch(/^#version 300 es\n/);
    for (const u of ['uRes', 'uPx', 'uTime', 'uPointer', 'uRadius', 'uTheme[8]', 'uDark', 'uParams[64]'])
      expect(r.frag).toContain(u);
    expect(r.params.map((s) => [s.index, s.chip, s.param, s.value])).toEqual([
      [0, 'noise', 'scale', 1],
      [1, 'theme', 'alpha', 1],
    ]);
    expect(r.params[0]).toMatchObject({ min: 0.1, max: 8, label: 'Scale' });
    expect(r.frag).toContain('zFbm(');
    expect(r.frag).toContain('uParams[0]');
    expect(r.frag).toContain('uParams[1]');
    expect(r.frag).toContain('fragColor = ');
  });

  it("reads a chip's number params as slot values and its string params as options", () => {
    const c = noiseOverTheme({ scale: 2.5 }, { slot: 'accent', alpha: 0.4 });
    const r = compileCircuit(c);
    expect(r.params.map((s) => s.value)).toEqual([2.5, 0.4]);
    expect(r.frag).toContain('uTheme[2]');
    const values = paramValues(c, r.params);
    expect(values).toHaveLength(MAX_PARAMS);
    expect(values[0]).toBe(2.5);
    expect(values[1]).toBeCloseTo(0.4);
  });

  it('keeps the frag and structureKey when a param or position changes, and changes both on a rewire', () => {
    const a = noiseOverTheme({ scale: 1 });
    const b = noiseOverTheme({ scale: 3 });
    b.modules.board.chips[1] = { ...b.modules.board.chips[1], x: 400, y: 120 };
    const ra = compileCircuit(a);
    const rb = compileCircuit(b);
    expect(structureKey(b)).toBe(structureKey(a));
    expect(rb.frag).toBe(ra.frag);
    expect(paramValues(b, ra.params)[0]).toBe(3);

    const rewired = noiseOverTheme();
    rewired.modules.board.traces = rewired.modules.board.traces.filter((t) => !('chip' in t.to && t.to.chip === 'fade' && t.to.pin === 'amount'));
    expect(structureKey(rewired)).not.toBe(structureKey(a));
    const rr = compileCircuit(rewired);
    expect(rr.frag).not.toBe(ra.frag);
    expect(rr.params.map((s) => `${s.chip}.${s.param}`)).toEqual(['theme.alpha', 'fade.amount']);
  });

  it('changes the structureKey and frag when an option changes', () => {
    const a = noiseOverTheme(undefined, { slot: 'ink' });
    const b = noiseOverTheme(undefined, { slot: 'hue-3' });
    expect(structureKey(a)).not.toBe(structureKey(b));
    expect(compileCircuit(a).frag).toContain('uTheme[1]');
    expect(compileCircuit(b).frag).toContain('uTheme[5]');
  });

  it('compiles only chips reached back from out', () => {
    const c = noiseOverTheme();
    c.modules.board.chips.push(chip('warp', 'loose'), chip('caustics', 'idle'));
    c.modules.board.traces.push(wire('loose.p', 'idle.p'));
    const r = compileCircuit(c);
    expect(r.frag).not.toContain('zWarp');
    expect(r.frag).not.toContain('zCaustics');
    expect(r.params.some((s) => s.chip === 'loose' || s.chip === 'idle')).toBe(false);
  });

  it('gives unwired point and colour inlets their fallbacks', () => {
    const c = circuit(
      mod('board', [chip('gradient', 'g'), chip('noise', 'n'), chip('mix', 'mix'), chip('out', 'out')], [wire('g.n', 'mix.t'), wire('mix.c', 'out.c')]),
    );
    const r = compileCircuit(c);
    expect(r.frag).toMatch(/zGradient\(uv, uParams\[0\]\)/);
    expect(r.frag).toMatch(/mix\(vec4\(0\.0\), vec4\(0\.0\), clamp\(v\d+, 0\.0, 1\.0\)\)/);
    // an unwired noise point would read the fragment's coord, but this noise isn't reached
    expect(r.frag).not.toContain('zFbm');
  });

  it('outputs a clamped premultiplied colour with a dither of at most half a step', () => {
    const r = compileCircuit(noiseOverTheme());
    expect(r.frag).toMatch(/clamp\(v\d+, 0\.0, 1\.0\)/);
    expect(r.frag).toContain('min(colour.rgb, vec3(colour.a))');
    expect(r.frag).toContain('(zHash(gl_FragCoord.xy) - 0.5) / 255.0');
  });
});

describe('compile errors', () => {
  it('reports a kind mismatch and reads that inlet as unwired', () => {
    const c = noiseOverTheme();
    c.modules.board.traces = c.modules.board.traces.map((t) => ('chip' in t.from && t.from.chip === 'noise' ? wire('coord.p', 'fade.amount') : t));
    const r = compileCircuit(c);
    expect(r.frag).not.toBeNull();
    expect(r.errors).toContainEqual(expect.objectContaining({ chip: 'fade', pin: 'amount' }));
    expect(r.params.map((s) => `${s.chip}.${s.param}`)).toContain('fade.amount');
  });

  it('breaks a cycle at the inlet that closes it', () => {
    const c = circuit(
      mod(
        'board',
        [chip('math', 'm1'), chip('math', 'm2'), chip('tint', 'tint'), chip('out', 'out')],
        [wire('m1.n', 'm2.a'), wire('m2.n', 'm1.a'), wire('m2.n', 'tint.r'), wire('tint.c', 'out.c')],
      ),
    );
    const r = compileCircuit(c);
    expect(r.frag).not.toBeNull();
    expect(r.errors).toEqual([expect.objectContaining({ chip: 'm1', pin: 'a', message: expect.stringMatching(/cycle/) })]);
    expect(r.params.map((s) => `${s.chip}.${s.param}`)).toContain('m1.a');
  });

  it('reports an unknown chip type and reads its outlets as unwired', () => {
    const c = noiseOverTheme();
    c.modules.board.chips[1] = { ...c.modules.board.chips[1], type: 'bogus' };
    const r = compileCircuit(c);
    expect(r.frag).not.toBeNull();
    expect(r.errors).toContainEqual(expect.objectContaining({ chip: 'noise', message: expect.stringMatching(/unknown chip type/) }));
    expect(r.params.map((s) => `${s.chip}.${s.param}`)).toContain('fade.amount');
  });

  it('reports a trace naming a missing pin and ignores it', () => {
    const c = noiseOverTheme();
    c.modules.board.traces.push(wire('coord.nope', 'fade.amount'));
    const r = compileCircuit(c);
    expect(r.errors).toContainEqual(expect.objectContaining({ chip: 'coord', pin: 'nope' }));
    expect(r.frag).not.toBeNull();
  });

  it('is fatal without an out chip, and uses the first of several', () => {
    const none = circuit(mod('board', [chip('coord', 'coord'), chip('noise', 'n')], [wire('coord.p', 'n.p')]));
    const r = compileCircuit(none);
    expect(r.frag).toBeNull();
    expect(r.errors.length).toBeGreaterThan(0);

    const two = noiseOverTheme();
    two.modules.board.chips.push(chip('out', 'out2'));
    const r2 = compileCircuit(two);
    expect(r2.frag).not.toBeNull();
    expect(r2.errors).toEqual([expect.objectContaining({ chip: 'out2' })]);
    expect(r2.params).toHaveLength(2);
  });

  it(`is fatal past ${MAX_PARAMS} slots`, () => {
    const tints = Array.from({ length: 17 }, (_, i) => chip('tint', `t${i}`)); // 4 numbers each: 68
    const merge = mergeChip('m', 'colour', tints.map((_, i) => `in${i}`));
    const c = circuit(mod('board', [...tints, merge, chip('out', 'out')], [...tints.map((t, i) => wire(`${t.id}.c`, `m.in${i}`)), wire('m.out', 'out.c')]));
    const r = compileCircuit(c);
    expect(r.frag).toBeNull();
    expect(r.params).toHaveLength(68);
    expect(r.errors).toContainEqual(expect.objectContaining({ message: expect.stringMatching(/64/) }));
  });

  it('never throws, even on a circuit too broken to read', () => {
    expect(compileCircuit({} as Circuit).frag).toBeNull();
    expect(compileCircuit(null as unknown as Circuit).errors.length).toBeGreaterThan(0);
    expect(compileCircuit(noiseOverTheme(), 'nowhere').frag).toBeNull();
    expect(() => structureKey(null as unknown as Circuit)).not.toThrow();
    expect(() => paramValues({} as Circuit, [{ index: 0, chip: 'x', param: 'y', value: 2 }])).not.toThrow();
  });
});

describe('modules, merges and buses', () => {
  // A smoke module: p → warp → noise → n, with the warp's amount as a knob.
  const smoke = mod(
    'smoke',
    [chip('warp', 'warp'), chip('noise', 'noise')],
    [wire('warp.p', 'noise.p')],
    {
      inPins: [
        { id: 'p', kind: 'point', maps: { chip: 'warp', pin: 'p' } },
        { id: 'amount', kind: 'number', label: 'Turbulence', maps: { chip: 'warp', pin: 'amount' } },
      ],
      outPins: [{ id: 'n', kind: 'number', maps: { chip: 'noise', pin: 'n' } }],
    },
  );
  const withSmoke = (instanceParams?: Chip['params']) =>
    circuit(
      mod(
        'board',
        [{ id: 'cloud', type: 'module', module: 'smoke', x: 0, y: 0, pins: [], ...(instanceParams ? { params: instanceParams } : {}) }, chip('theme', 'theme'), chip('fade', 'fade'), chip('out', 'out')],
        [wire('cloud.n', 'fade.amount'), wire('theme.c', 'fade.c'), wire('fade.c', 'out.c')],
      ),
      smoke,
    );

  it('inlines an instance with dotted ids, its in pins as knobs', () => {
    const r = compileCircuit(withSmoke({ amount: 1.2 }));
    expect(r.errors).toEqual([]);
    expect(r.params.map((s) => [s.chip, s.param, s.value])).toEqual([
      ['cloud', 'amount', 1.2],
      ['cloud.warp', 'scale', 1],
      ['cloud.warp', 'speed', 0.05],
      ['cloud.noise', 'scale', 1],
      ['theme', 'alpha', 1],
    ]);
    expect(r.params[0].label).toBe('Turbulence');
    expect(r.frag).toContain('zWarp(coord, uParams[0]');
  });

  it("reads an unset knob from the inner chip, and updates live from the instance's params", () => {
    const unset = withSmoke();
    const r = compileCircuit(unset);
    expect(r.params[0]).toMatchObject({ chip: 'cloud', param: 'amount', value: 0.5 });
    const set = withSmoke({ amount: 1.7 });
    expect(structureKey(set)).toBe(structureKey(unset));
    expect(paramValues(set, r.params)[0]).toBeCloseTo(1.7);
  });

  it('wires through instance pins, recursively', () => {
    // outer wraps smoke, exposing its knob and its output; the board feeds outer a drifting point.
    const outer = mod('outer', [{ id: 's', type: 'module', module: 'smoke', x: 0, y: 0, pins: [] }], [], {
      inPins: [
        { id: 'p', kind: 'point', maps: { chip: 's', pin: 'p' } },
        { id: 'k', kind: 'number', maps: { chip: 's', pin: 'amount' } },
      ],
      outPins: [{ id: 'n', kind: 'number', maps: { chip: 's', pin: 'n' } }],
    });
    const c = circuit(
      mod(
        'board',
        [chip('coord', 'coord'), chip('drift', 'drift'), { id: 'o', type: 'module', module: 'outer', x: 0, y: 0, pins: [], params: { k: 0.9 } }, chip('tint', 'tint'), chip('out', 'out')],
        [wire('coord.p', 'drift.p'), wire('drift.p', 'o.p'), wire('o.n', 'tint.alpha'), wire('tint.c', 'out.c')],
      ),
      outer,
      smoke,
    );
    const r = compileCircuit(c);
    expect(r.errors).toEqual([]);
    expect(r.params.find((s) => s.chip === 'o' && s.param === 'k')?.value).toBe(0.9);
    expect(r.params.some((s) => s.chip === 'o.s.noise' && s.param === 'scale')).toBe(true);
    const driftVar = varOf(r.frag!, 'drift.p');
    expect(r.frag).toContain(`zWarp(${driftVar}, `);
  });

  it('writes a module once as a helper and inlines it at every use', () => {
    const c = withSmoke();
    c.modules.board.chips.push({ id: 'cloud2', type: 'module', module: 'smoke', x: 0, y: 0, pins: [] }, chip('mix', 'mix'));
    c.modules.board.traces = [wire('cloud.n', 'fade.amount'), wire('theme.c', 'fade.c'), wire('fade.c', 'mix.a'), wire('cloud2.n', 'mix.t'), wire('mix.c', 'out.c')];
    const r = compileCircuit(c);
    expect(r.frag!.match(/zWarp\(/g)).toHaveLength(3); // the definition and two calls
    expect(r.frag!.match(/vec2 zWarp\(/g)).toHaveLength(1);
    expect(r.params.filter((s) => s.param === 'amount').map((s) => s.chip)).toEqual(['cloud', 'cloud2']);
  });

  it('merges colours over each other in pin order, and sums numbers', () => {
    const c = circuit(
      mod(
        'board',
        [chip('tint', 'low'), chip('tint', 'high'), mergeChip('m', 'colour', ['first', 'second']), chip('value', 'a'), chip('value', 'b'), mergeChip('sum', 'number', ['x', 'y']), chip('fade', 'fade'), chip('out', 'out')],
        [wire('high.c', 'm.second'), wire('low.c', 'm.first'), wire('a.n', 'sum.x'), wire('b.n', 'sum.y'), wire('m.out', 'fade.c'), wire('sum.out', 'fade.amount'), wire('fade.c', 'out.c')],
      ),
    );
    const r = compileCircuit(c);
    expect(r.errors).toEqual([]);
    const f = r.frag!;
    expect(f).toContain(`zOver(${varOf(f, 'low.c')}, ${varOf(f, 'high.c')})`);
    expect(f).toContain(`(${varOf(f, 'a.n')} + ${varOf(f, 'b.n')})`);
  });

  it('expands buses: one source feeds every tap', () => {
    const c = circuit(
      mod(
        'board',
        [chip('value', 'level'), chip('tint', 'tint'), chip('out', 'out')],
        [wire('level.n', '@b'), wire('@b', 'tint.r'), wire('@b', 'tint.g'), wire('tint.c', 'out.c')],
        { buses: [{ id: 'b' }] },
      ),
    );
    const r = compileCircuit(c);
    expect(r.errors).toEqual([]);
    expect(r.params.map((s) => `${s.chip}.${s.param}`)).toEqual(['level.value', 'tint.b', 'tint.alpha']);
    const v = varOf(r.frag!, 'level.n');
    expect(r.frag).toContain(`vec3(${v}, ${v}, uParams[1])`);
  });

  it('is pure: the same frozen circuit gives the same result and is left as it was', () => {
    const c = deepFreeze(withSmoke({ amount: 1 }));
    const before = JSON.stringify(c);
    const a = compileCircuit(c);
    const b = compileCircuit(c);
    expect(b).toEqual(a);
    expect(structureKey(c)).toBe(structureKey(c));
    paramValues(c, a.params);
    expect(JSON.stringify(c)).toBe(before);
  });
});

// --- the node library ------------------------------------------------------------------------------

describe('SHADER_NODES', () => {
  const balanced = (s: string) => {
    let depth = 0;
    for (const ch of s) {
      if (ch === '(' || ch === '{' || ch === '[') depth++;
      if (ch === ')' || ch === '}' || ch === ']') depth--;
      if (depth < 0) return false;
    }
    return depth === 0;
  };

  it('has every node in the contract', () => {
    expect(Object.keys(SHADER_NODES).sort()).toEqual(
      ['coord', 'uv', 'time', 'pointer', 'value', 'theme', 'tint', 'transform', 'drift', 'warp', 'swirl', 'ripple', 'noise', 'caustics', 'rim', 'sheen', 'gradient', 'math', 'smooth', 'mix', 'fade', 'hue', 'levels', 'blend', 'merge', 'out'].sort(),
    );
  });

  it.each(Object.values(SHADER_NODES))('$type emits a balanced expression calling only helpers it brings', (spec) => {
    expect(spec.type).toBe(Object.keys(SHADER_NODES).find((k) => SHADER_NODES[k] === spec));
    for (const h of spec.helpers ?? []) expect(GLSL_HELPERS).toHaveProperty(h);
    const code = helperCode(spec.helpers ?? []);
    const optionSets = Object.keys(spec.options ?? {}).length
      ? Object.entries(spec.options!).flatMap(([name, o]) => o.values.map((v) => ({ [name]: v })))
      : [{}];
    const inputs = Object.fromEntries(spec.inputs.map((i, n) => [i.id, `in${n}`]));
    if (spec.type === 'merge') Object.assign(inputs, { 0: 'in0', 1: 'in1' });
    for (const opts of optionSets)
      for (const o of spec.outputs.length ? spec.outputs : [{ id: '' }]) {
        const e = spec.emit(inputs, opts, o.id);
        expect(e.length).toBeGreaterThan(0);
        expect(balanced(e)).toBe(true);
        for (const call of e.match(/\bz[A-Z]\w*(?=\()/g) ?? []) expect(code).toMatch(new RegExp(`\\b${call}\\(`));
      }
  });

  it('keeps every helper balanced and free of colour literals and lengths', () => {
    for (const [name, src] of Object.entries(GLSL_HELPERS)) {
      expect(balanced(src), name).toBe(true);
      expect(src, name).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\d+px/);
    }
  });

  it('builds chips with pins from the spec', () => {
    const c = shaderChip('warp', 'w', 10, 20, { amount: 1 });
    expect(c).toMatchObject({ id: 'w', type: 'warp', x: 10, y: 20, params: { amount: 1 } });
    expect(c.pins).toEqual([
      { id: 'p', side: 'in', kind: 'point', label: 'Point' },
      { id: 'amount', side: 'in', kind: 'number', label: 'Amount', param: true },
      { id: 'scale', side: 'in', kind: 'number', label: 'Scale', param: true },
      { id: 'speed', side: 'in', kind: 'number', label: 'Speed', param: true },
      { id: 'p', side: 'out', kind: 'point', label: 'Point' },
    ]);
    expect(shaderChip('merge', 'm', 0, 0).pins).toEqual([{ id: 'out', side: 'out', kind: 'colour', label: 'Out' }]);
  });
});
