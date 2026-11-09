import { describe, expect, it } from 'vitest';
import { APOLLO_11_LOAD, flyToEnd, ignite, ignitionState, NO_LOAD, quadraticGuidance, readout, stepDescent, timeToGo } from './lunarDescent';
import { afterIgnition, HISTORICAL, src } from './sources';
import { vec2 } from './vector2';

const FT = 0.3048;

describe('the guidance equations', () => {
  it('time to go is the negative root of the downrange equation', () => {
    const target = { r: vec2(-2000, 600), v: vec2(40, -30), a: vec2(-2.5, 0) };
    const rg = vec2(-100000, 8000);
    const vg = vec2(700, -30);
    const t = timeToGo(rg, vg, target, -200);
    expect(t).toBeLessThan(0);
    // It solves 6·ADG·T² + (18·VDG + 6·VG)·T + 24(RDG − RG) = 0.
    const residual = 6 * target.a.x * t * t + (18 * target.v.x + 6 * vg.x) * t + 24 * (target.r.x - rg.x);
    expect(Math.abs(residual)).toBeLessThan(1e-6 * 24 * Math.abs(target.r.x - rg.x));
  });
  it('the quadratic law lands on the target when followed exactly', () => {
    // Integrating ACG with a fresh TTF each step from an exact start reaches RDG with VDG.
    const target = { r: vec2(0, 0), v: vec2(0, 0), a: vec2(0, 0) };
    let r = vec2(-1000, 500);
    let v = vec2(30, -10);
    const dt = 0.01;
    for (let t = -60; t < -0.05; t += dt) {
      const a = quadraticGuidance(r, v, target, t);
      v = vec2(v.x + a.x * dt, v.y + a.y * dt);
      r = vec2(r.x + v.x * dt, r.y + v.y * dt);
    }
    expect(Math.hypot(r.x, r.y)).toBeLessThan(1);
    expect(Math.hypot(v.x, v.y)).toBeLessThan(0.5);
  });
});

describe('a nominal descent', () => {
  const end = flyToEnd(ignitionState(NO_LOAD));
  const programs = end.log.filter((e) => e.kind === 'program').map((e) => e.text.slice(0, 3));
  it('waits for PRO, then lands upright within the limits with propellant left', () => {
    expect(ignitionState().status).toBe('awaiting-ignition');
    expect(stepDescent(ignitionState(), 5).t).toBe(0);
    expect(end.status).toBe('landed');
    const touchdown = end.log.at(-1)!;
    expect(touchdown.kind).toBe('touchdown');
    expect(end.propellant).toBeGreaterThan(0);
    // Upright: the last guidance pass commanded thrust within a few degrees of local vertical.
    const beforeContact = flyToEnd(ignitionState(NO_LOAD), 1500, (s) => readout(s).altitude < 3);
    expect(readout(beforeContact).pitch).toBeLessThan(10);
  });
  it('switches P63, P64, P65 in that order', () => {
    expect(programs).toEqual(['P63', 'P64', 'P65']);
  });
  // Historical checks: Apollo 11 (NASA SP-4029 timeline), each with its tolerance.
  it('reaches high gate near Apollo 11’s 507 s (102:41:32), within 30 s', () => {
    const p64 = end.log.find((e) => e.text.startsWith('P64'))!;
    expect(Math.abs(p64.t - afterIgnition(HISTORICAL.approachPhase))).toBeLessThan(30);
  });
  it('reaches high gate near 7,000 ft, within 1,500 ft', () => {
    const atHighGate = flyToEnd(ignitionState(NO_LOAD), 1500, (s) => s.program === 'P64');
    expect(Math.abs(readout(atHighGate).altitude - 7000 * FT)).toBeLessThan(1500 * FT);
  });
  it('lands within 60 s of Apollo 11’s 755 s (102:45:39.9), which Armstrong lengthened by flying P66', () => {
    expect(Math.abs(end.t - afterIgnition(HISTORICAL.landing))).toBeLessThan(60);
  });
  it('touches down within the gear’s limits: 10 ft/s down, 4 ft/s across', () => {
    const text = end.log.at(-1)!.text;
    const [down, across] = [...text.matchAll(/([\d.]+) ft\/s/g)].map((m) => Number(m[1]));
    expect(down).toBeLessThanOrEqual(10);
    expect(across).toBeLessThanOrEqual(4);
  });
});

describe('the programs switch as they did', () => {
  it('braking gives way to approach when its time to go falls below TENDBRAK, and the LM pitches over', () => {
    let s = flyToEnd(ignitionState(NO_LOAD), 1500, (x) => x.program === 'P64');
    const atSwitch = readout(s).pitch;
    s = stepDescent(s, 30);
    expect(s.program).toBe('P64');
    // Pitch measured from local vertical: pitching over brings the window down toward the site.
    expect(readout(s).pitch).toBeLessThan(atSwitch - 5);
  });
  it('a click of the rate switch in automatic landing enters P66 at the current rate; each further click changes it by RODSCALE', () => {
    let s = flyToEnd(ignitionState(NO_LOAD), 1500, (x) => x.program === 'P64' && readout(x).altitude < 300);
    s = stepDescent(s, 2.1, { rodClicks: 1 });
    expect(s.program).toBe('P66');
    const entered = s.desiredRate;
    expect(entered).toBeCloseTo(readout(s).altitudeRate, 0);
    s = stepDescent(s, 2.1, { rodClicks: 1 });
    expect(s.desiredRate - entered).toBeCloseTo(src('rodClick'), 6);
    s = stepDescent(s, 2.1, { rodClicks: -2 });
    expect(s.desiredRate - entered).toBeCloseTo(-src('rodClick'), 6);
  });
  it('the crew can fly P66 to a landing', () => {
    let s = flyToEnd(ignitionState(NO_LOAD), 1500, (x) => x.program === 'P64' && readout(x).altitude < 150);
    s = stepDescent(s, 2.1, { rodClicks: 1 });
    while (s.status === 'flying' && s.t < 1500) {
      const want = readout(s).altitude > 30 ? -1.5 : -0.6;
      const clicks = Math.round((want - s.desiredRate) / src('rodClick'));
      s = stepDescent(s, 2, { rodClicks: Math.max(-1, Math.min(1, clicks)) });
    }
    expect(s.status).toBe('landed');
  });
});

describe('the 1202s', () => {
  it('extra load raises a 1202 and guidance carries on', () => {
    let s = ignite(ignitionState({ radarSteal: src('radarSteal'), monitorRequests: [] }));
    s = stepDescent(s, 60);
    expect(s.alarms).toEqual([]);
    s = stepDescent(s, 20, { monitor: true });
    expect(s.alarms[0]).toBe(1202);
    const before = readout(s).speed;
    s = stepDescent(s, 20);
    expect(s.status).toBe('flying');
    expect(readout(s).speed).toBeLessThan(before);
  });
  it('without the radar’s steal, the same display raises nothing', () => {
    let s = ignite(ignitionState(NO_LOAD));
    s = stepDescent(s, 60, { monitor: true });
    s = stepDescent(s, 60);
    expect(s.alarms).toEqual([]);
  });
  it('Apollo 11’s alarms come within 10 s of their times, and the descent still lands', () => {
    const end = flyToEnd(ignitionState(APOLLO_11_LOAD));
    expect(end.status).toBe('landed');
    const alarms = end.log.filter((e) => e.kind === 'alarm');
    expect(alarms).toHaveLength(HISTORICAL.alarms.length);
    alarms.forEach((a, i) => {
      expect(Math.abs(a.t - afterIgnition(HISTORICAL.alarms[i].get))).toBeLessThan(10);
      expect(a.get).toMatch(/^102:\d\d:\d\d$/);
      expect([1201, 1202]).toContain(a.code);
    });
  });
});
