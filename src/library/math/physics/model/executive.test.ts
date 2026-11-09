import { describe, expect, it } from 'vitest';
import { CORE_SETS, requestMonitor, runCycle, startExecutive, VAC_AREAS, type ExecutiveState } from './executive';

const cycles = (state: ExecutiveState, n: number, load: { radarSteal: number; phaseExtra?: number }) => {
  const alarms: (number | undefined)[] = [];
  for (let i = 0; i < n; i++) {
    const r = runCycle(state, load);
    state = r.state;
    alarms.push(r.alarm);
  }
  return { state, alarms };
};

describe('the executive', () => {
  it('has the source’s seven core sets and five VAC areas', () => {
    expect(CORE_SETS).toBe(7);
    expect(VAC_AREAS).toBe(5);
  });
  it('keeps up with the descent’s own load, even with the radar stealing', () => {
    expect(cycles(startExecutive(), 50, { radarSteal: 0.13 }).alarms.filter(Boolean)).toEqual([]);
  });
  it('overflows into 1202 when a monitor display is added on top of the radar’s steal, and the restart sheds it', () => {
    const { state, alarms } = cycles(requestMonitor(startExecutive()), 12, { radarSteal: 0.13 });
    const first = alarms.findIndex(Boolean);
    expect(first).toBeGreaterThan(0);
    expect(alarms[first]).toBe(1202);
    // After the restart the monitor is gone and the descent's load fits again.
    expect(state.monitor).toBe(false);
    expect(alarms.slice(first + 1).filter(Boolean)).toEqual([]);
  });
  it('raises 1201 when the interpretive jobs run out of VAC areas first', () => {
    // Heavy interpretive work (a busy servicer) with nothing finishing fills the five VAC areas
    // before the seven core sets.
    let state: ExecutiveState = { jobs: Array.from({ length: VAC_AREAS - 1 }, () => ({ kind: 'servicer' as const, remaining: 1, vac: true, protected: true, priority: 3 })), monitor: false };
    state = { ...state, jobs: [...state.jobs, { kind: 'servicer', remaining: 1, vac: true, protected: true, priority: 3 }] };
    expect(runCycle(state, { radarSteal: 1 }).alarm).toBe(1201);
  });
});
