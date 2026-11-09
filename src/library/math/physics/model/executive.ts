// The guidance computer's executive, minimally: a model of why the 1202 happened, not an AGC
// emulator. Each two-second cycle the computer has a budget of time; the descent's jobs need most
// of it, the rendezvous radar's mis-phased angle signals steal some, and a crew-requested monitor
// display adds more. Work that doesn't finish waits in its core set (and VAC area) while the next
// cycle's jobs are scheduled. When a new job finds no free core set the executive raises 1202
// (EXECUTIVE.agc line 207); no free VAC area, 1201 (line 146). Either goes through BAILOUT
// (ALARM_AND_ABORT.agc line 189): every job is dropped, the restart-protected ones (guidance and
// navigation) are put back, and work that isn't protected (the extra display) is shed.
import { src } from './sources';

export type JobKind = 'servicer' | 'guidance' | 'display' | 'monitor';

export interface Job {
  kind: JobKind;
  /** Work left, as a share of one cycle. */
  remaining: number;
  /** Interpretive jobs need a VAC area as well as a core set. */
  vac: boolean;
  /** Restart-protected work is put back after a restart; the rest is shed. */
  protected: boolean;
  priority: number;
}

export interface ExecutiveState {
  jobs: Job[];
  /** Whether the crew has a monitor display (V16N68) running. */
  monitor: boolean;
}

export interface CycleLoad {
  /** The share of the cycle the rendezvous radar steals (0 when its switch is set right). */
  radarSteal: number;
  /** Extra work from the descent phase (approach is busier than braking). */
  phaseExtra?: number;
}

export interface CycleResult {
  state: ExecutiveState;
  /** The alarm raised this cycle, if any. */
  alarm?: 1201 | 1202;
  /** How busy the computer was: the share of the cycle spent working (1 when it ran out of time). */
  busy: number;
}

export const CORE_SETS = src('coreSets');
export const VAC_AREAS = src('vacAreas');

/** The jobs each cycle schedules: the servicer (navigation, interpretive), guidance, the display. */
function cycleJobs(load: CycleLoad, monitor: boolean): Job[] {
  const base = src('executiveLoad') + (load.phaseExtra ?? 0);
  const jobs: Job[] = [
    { kind: 'servicer', remaining: base * 0.55, vac: true, protected: true, priority: 3 },
    { kind: 'guidance', remaining: base * 0.35, vac: false, protected: true, priority: 3 },
    { kind: 'display', remaining: base * 0.1, vac: false, protected: false, priority: 1 },
  ];
  if (monitor) jobs.push({ kind: 'monitor', remaining: src('monitorLoad'), vac: true, protected: false, priority: 1 });
  return jobs;
}

export const startExecutive = (): ExecutiveState => ({ jobs: [], monitor: false });

/** One cycle: schedule this cycle's jobs (raising an alarm if a pool runs out), then spend the cycle's time on them by priority. */
export function runCycle(state: ExecutiveState, load: CycleLoad): CycleResult {
  let jobs = [...state.jobs];
  let monitor = state.monitor;
  let alarm: 1201 | 1202 | undefined;
  for (const job of cycleJobs(load, monitor)) {
    const cores = jobs.length;
    const vacs = jobs.filter((j) => j.vac).length;
    if (cores >= CORE_SETS) {
      alarm = 1202;
      break;
    }
    if (job.vac && vacs >= VAC_AREAS) {
      alarm = 1201;
      break;
    }
    jobs.push(job);
  }
  if (alarm) {
    // BAILOUT: drop everything, put back what restarts protect (one fresh pass of each), shed the rest.
    jobs = cycleJobs(load, false).filter((j) => j.protected);
    monitor = false;
  }
  // Spend the cycle: the radar's stolen time is gone before any job runs.
  let budget = Math.max(0, 1 - load.radarSteal);
  const order = [...jobs].sort((a, b) => b.priority - a.priority);
  for (const job of order) {
    const spent = Math.min(budget, job.remaining);
    job.remaining -= spent;
    budget -= spent;
    if (budget <= 1e-9) break;
  }
  const left = jobs.filter((j) => j.remaining > 1e-9);
  return { state: { jobs: left, monitor }, alarm, busy: 1 - budget };
}

/** The crew calls up a monitor display (V16N68), which adds its work each cycle until a restart sheds it. */
export const requestMonitor = (state: ExecutiveState): ExecutiveState => ({ ...state, monitor: true });
