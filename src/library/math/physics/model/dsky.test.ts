import { describe, expect, it } from 'vitest';
import { followDescent, formatRegister, MONITOR_NOUN, NOUNS, pressKey, readRegister, registers, startDsky, type DskyKey, type DskyState } from './dsky';
import { dskyReadout, flyToEnd, ignitionState, NO_LOAD } from './lunarDescent';

const press = (d: DskyState, keys: DskyKey[]) => keys.reduce((s, k) => pressKey(s, k).dsky, d);

describe('the registers', () => {
  it('format as the noun tables say: VEL3 tenths of ft/s, COMP ALT ft, POS7 tenths of nautical miles, MIN/SEC', () => {
    expect(formatRegister('VEL3', -10 * 0.3048)).toBe('−00100');
    expect(formatRegister('COMP ALT', 7000 * 0.3048)).toBe('+07000');
    expect(formatRegister('POS7', 2 * 1852)).toBe('+00020');
    expect(formatRegister('MIN/SEC', 125)).toBe('+02 05');
    expect(formatRegister('2INT', [41, 47])).toBe('+41 47');
    expect(readRegister('VEL3', -10 * 0.3048)).toBe('-10.0 ft/s');
  });
  it('show each program’s monitor noun after ignition', () => {
    expect(MONITOR_NOUN).toEqual({ P63: 63, P64: 64, P65: 60, P66: 60 });
    expect(NOUNS[63].registers.map((r) => r.format)).toEqual(['VEL3', 'VEL3', 'COMP ALT']);
    let d = startDsky();
    expect(d.flashing && d.verb === 99 && d.noun === 62).toBe(true);
    d = followDescent(d, 'P63', [], true);
    expect([d.verb, d.noun]).toEqual([6, 63]);
    const s = flyToEnd(ignitionState(NO_LOAD), 1500, (x) => x.t > 100);
    const regs = registers(d, dskyReadout(s));
    expect(regs[0]).toMatch(/^\+\d{5}$/);
    expect(regs[2]).toMatch(/^\+\d{5}$/);
    d = followDescent(d, 'P64', [], true);
    expect([d.verb, d.noun]).toEqual([6, 64]);
  });
});

describe('the keys', () => {
  it('PRO on V99N62 lights the engine', () => {
    const r = pressKey(startDsky(), 'PRO');
    expect(r.proceed).toBe(true);
    expect(r.dsky.flashing).toBe(false);
    // Once lit, the display moves to P63's monitor noun.
    expect([followDescent(r.dsky, 'P63', [], true).verb, followDescent(r.dsky, 'P63', [], true).noun]).toEqual([6, 63]);
  });
  it('an alarm lights PROG, V05N09 shows its code, KEY REL gives the monitor noun back, RSET puts the lamp out', () => {
    let d = followDescent(startDsky(), 'P63', [], true);
    d = followDescent(d, 'P63', [1202], true);
    expect(d.prog).toBe(true);
    d = press(d, ['VERB', '0', '5', 'NOUN', '0', '9', 'ENTR']);
    expect([d.verb, d.noun]).toEqual([5, 9]);
    const s = flyToEnd(ignitionState(NO_LOAD), 1500, (x) => x.t > 100);
    expect(registers(d, dskyReadout(s))[0]).toBe('+01202');
    d = pressKey(d, 'KEY REL').dsky;
    expect([d.verb, d.noun]).toEqual([6, 63]);
    d = pressKey(d, 'RSET').dsky;
    expect(d.prog).toBe(false);
  });
  it('V16N68 asks the executive for a monitor; an unknown pair lights OPR ERR', () => {
    const r = ['VERB', '1', '6', 'NOUN', '6', '8'].reduce((s, k) => pressKey(s, k as DskyKey).dsky, followDescent(startDsky(), 'P63', [], true));
    const entered = pressKey(r, 'ENTR');
    expect(entered.monitor).toBe(true);
    const bad = press(followDescent(startDsky(), 'P63', [], true), ['VERB', '3', '7', 'NOUN', '0', '1', 'ENTR']);
    expect(bad.oprErr).toBe(true);
  });
});
