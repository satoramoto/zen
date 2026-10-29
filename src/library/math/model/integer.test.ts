import { describe, expect, it } from 'vitest';
import { createIntegerPoints, evaluatePredicate, integerProperties, parsePredicate, relatedIntegerIds, validateDomain, validatePredicate, type Placement, type Predicate } from './integer';
import { captureExperiment, defaultExperiment, parseExperiment, serializeExperiment, validateExperiment } from './experiment';

const grid: Placement = { kind: 'grid', width: 10, depth: 10 };

describe('bounded exact integer model', () => {
  it('rejects fractional, reversed, unbounded, and oversize domains', () => {
    for (const domain of [
      { start: 1.5, end: 100, step: 1 }, { start: 0, end: 100, step: 1 },
      { start: 100, end: 1, step: 1 }, { start: 1, end: 100, step: 0 },
      { start: 1, end: 100001, step: 1 }, { start: 1, end: Infinity, step: 1 },
      { start: 1, end: 1000001, step: 1000 },
    ]) expect(validateDomain(domain)).not.toBeNull();
    expect(validateDomain({ start: 1, end: 100000, step: 1 })).toBeNull();
  });
  it('counts primes across a large exact domain', () => {
    let count=0;for(let n=1;n<=100000;n++)if(evaluatePredicate(n,{kind:'prime'}))count++;
    expect(count).toBe(9592);
  });
  it('keeps exact identities and range-step semantics across all placements', () => {
    const domain = { start: 11, end: 24, step: 3 };
    for (const kind of ['line', 'grid', 'snake', 'ulam', 'volume'] as const) {
      const points = createIntegerPoints(domain, { ...grid, kind, width: 2, depth: 2 });
      expect(points.map(p => p.id)).toEqual(['11', '14', '17', '20', '23']);
      expect(new Set(points.map(p => `${p.x},${p.y},${p.z}`)).size).toBe(5);
    }
  });
  it('places the first Ulam turn and volume boundaries consistently', () => {
    expect(createIntegerPoints({ start: 1, end: 9, step: 1 }, { ...grid, kind: 'ulam' }).map(p => [p.x, p.y]))
      .toEqual([[0,0],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]]);
    const p = createIntegerPoints({ start: 1, end: 101, step: 1 }, { ...grid, kind: 'volume' });
    expect(p[99]).toMatchObject({ n: 100, x: 9, y: 9, z: 0 });
    expect(p[100]).toMatchObject({ n: 101, x: 0, y: 0, z: 1 });
  });
  it('finds exact factors, divisor multiplicities, and the special status of one', () => {
    expect(integerProperties(36)).toEqual({ value: 36, factors: [{ prime: 2, exponent: 2 }, { prime: 3, exponent: 2 }], divisors: [1,2,3,4,6,9,12,18,36], divisorCount: 9, distinctPrimeFactorCount: 2, isPrime: false, isSquare: true, isCube: false });
    expect(integerProperties(1)).toMatchObject({ factors: [], divisors: [1], isPrime: false, isSquare: true, isCube: true });
    expect(integerProperties(999983)).toMatchObject({ isPrime: true, divisorCount: 2 });
    expect(integerProperties(1000000)).toMatchObject({ isCube: true, isSquare: true });
  });
  it('computes intersections independently of layout and layer visibility', () => {
    const a: Predicate = { kind: 'multiple', divisor: 3 }, b: Predicate = { kind: 'square' };
    const points = createIntegerPoints({ start: 1, end: 400, step: 1 }, grid);
    expect(points.filter(p => evaluatePredicate(p.n, { kind: 'and', left: a, right: b })).map(p => p.n)).toEqual([9,36,81,144,225,324]);
    for (let n = 1; n <= 100; n++) {
      expect(evaluatePredicate(n, { kind: 'difference', left: a, right: b })).toBe(n % 3 === 0 && !Number.isInteger(Math.sqrt(n)));
      expect(evaluatePredicate(n, { kind: 'xor', left: a, right: b })).toBe((n % 3 === 0) !== Number.isInteger(Math.sqrt(n)));
    }
  });
  it('reports selected divisors only inside the visible mathematical domain', () => {
    const points = createIntegerPoints({ start: 10, end: 40, step: 1 }, grid);
    expect(relatedIntegerIds(36, points, 'divisors')).toEqual(['12', '18']);
    expect(relatedIntegerIds(12, points, 'multiples')).toEqual(['24', '36']);
  });
  it('parses only the stated predicate grammar without executing code', () => {
    expect(parsePredicate(' n % 3 == 0 ')).toEqual({ kind: 'multiple', divisor: 3 });
    expect(parsePredicate('n mod 7 = 2')).toEqual({ kind: 'residue', modulus: 7, remainder: 2 });
    expect(parsePredicate('is_square(n)')).toEqual({ kind: 'square' });
    for (const source of ['n % 0 == 0', 'n % 3 == 3', 'n % 3 == -1', 'is_square(n); alert(1)', 'n.constructor', '']) expect(() => parsePredicate(source)).toThrow();
    expect(validatePredicate({ kind: 'multiple', divisor: NaN })).toBe(false);
    let nested: Predicate = { kind: 'square' };
    for (let i = 0; i < 10; i++) nested = { kind: 'and', left: nested, right: { kind: 'prime' } };
    expect(validatePredicate(nested)).toBe(false);
  });
});

describe('experiment documents', () => {
  it('preserves view settings in exports and snapshots while accepting older documents', () => {
    const state = defaultExperiment();
    expect(state.view).toEqual({ labels: false, sizeByDivisors: false, onlyMatches: false });
    state.view = { labels: true, sizeByDivisors: true, onlyMatches: true };
    const snapshot = captureExperiment(state, 'view', 'Filtered view');
    state.view.labels = false;
    const restored = parseExperiment(serializeExperiment(state, [snapshot]));
    expect(restored.experiment.view).toEqual({ labels: false, sizeByDivisors: true, onlyMatches: true });
    expect(restored.snapshots[0]!.experiment.view).toEqual({ labels: true, sizeByDivisors: true, onlyMatches: true });
    delete state.view;
    expect(validateExperiment(state)).toBeNull();
    expect(parseExperiment(serializeExperiment(state)).experiment.view).toBeUndefined();
  });
  it('rejects malformed optional view settings', () => {
    const base = defaultExperiment();
    for (const view of [null, [], true, {}, { labels: 'true', sizeByDivisors: false, onlyMatches: false }, { labels: true, sizeByDivisors: false }]) {
      expect(validateExperiment({ ...base, view })).toBe('Invalid view settings.');
      expect(() => parseExperiment(JSON.stringify({ format: 'zen-spatial-studio', version: 1, experiment: { ...base, view }, snapshots: [] }))).toThrow('Invalid view settings.');
    }
  });
  it('round-trips the full state and isolated snapshots', () => {
    const state = defaultExperiment();
    const snapshot = captureExperiment(state, 'first', 'Original grid');
    state.placement.kind = 'volume';
    state.layers[0]!.visible = false;
    const restored = parseExperiment(serializeExperiment(state, [snapshot]));
    expect(restored.experiment).toEqual(state);
    expect(restored.snapshots[0]!.experiment.placement.kind).toBe('grid');
    expect(restored.snapshots[0]!.experiment.layers[0]!.visible).toBe(true);
  });
  it('rejects invalid selection, geometry, predicates, and version before restoring', () => {
    const base = defaultExperiment();
    expect(validateExperiment({ ...base, selectedId: '401' })).not.toBeNull();
    expect(validateExperiment({ ...base, domain: { start: 1, end: 100, step: 2 }, selectedId: '36' })).not.toBeNull();
    expect(validateExperiment({ ...base, camera: { ...base.camera, zoom: NaN } })).not.toBeNull();
    expect(validateExperiment({ ...base, slice: 2 })).not.toBeNull();
    expect(validateExperiment({ ...base, placement: { ...base.placement, width: 0 } })).not.toBeNull();
    expect(validateExperiment({ ...base, layers: [base.layers[0], base.layers[0]] })).not.toBeNull();
    expect(validateExperiment({ ...base, layers: [{ ...base.layers[0], predicate: { kind: 'multiple', divisor: 0 } }] })).not.toBeNull();
    expect(() => parseExperiment('{')).toThrow('valid JSON');
    expect(() => parseExperiment('{"format":"zen-spatial-studio","version":2}')).toThrow('Unsupported');
  });
});
