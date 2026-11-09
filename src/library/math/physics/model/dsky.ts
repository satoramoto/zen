// The DSKY during the descent: what the crew read and keyed. Pure model: no framework.
//
// The registers show the nouns the descent programs display, with the quantities, units and
// formats of Luminary 099's noun tables (PINBALL_NOUN_TABLES.agc): VEL3 is XXXX.X ft/s (line 85),
// COMP ALT is XXXXX. ft (line 108), POS7 is XXXX.X nautical miles (line 106), MIN/SEC is minutes
// and seconds. Each program shows its monitor noun with verb 06; the crew can call up V16N68 (a
// monitor), V05N09 (the alarm codes), and V06 with a descent noun. An alarm lights PROG; KEY REL
// gives the display back to the program's monitor noun; RSET turns the lamps off; PRO proceeds
// (on V99N62, before ignition, it lights the engine).
import type { DescentProgram, DescentReadout } from './lunarDescent';

const FT = 0.3048;
const NMI = 1852;

export type RegisterFormat = 'VEL3' | 'COMP ALT' | 'POS7' | 'MIN/SEC' | '2INT';

export interface NounRegister {
  /** What the register shows, in words. */
  label: string;
  format: RegisterFormat;
  /** The quantity in SI units (or seconds, or a pair of integers for 2INT). */
  value: (r: DescentReadout & { lpdTime: number; lpdAngle: number; deltaH: number }) => number | [number, number];
}

export interface Noun {
  noun: number;
  title: string;
  registers: [NounRegister, NounRegister, NounRegister];
  /** Where the noun's entries are in PINBALL_NOUN_TABLES.agc. */
  line: number;
}

const altitudeRate: NounRegister = { label: 'Altitude rate', format: 'VEL3', value: (r) => r.altitudeRate };
const altitude: NounRegister = { label: 'Altitude', format: 'COMP ALT', value: (r) => r.altitude };

/** The descent nouns, from PINBALL_NOUN_TABLES.agc. */
export const NOUNS: Record<number, Noun> = {
  60: { noun: 60, title: 'Horizontal velocity, altitude rate, altitude', line: 714, registers: [{ label: 'Horizontal velocity', format: 'VEL3', value: (r) => r.horizontal }, altitudeRate, altitude] },
  63: { noun: 63, title: 'Absolute value of velocity, altitude rate, altitude', line: 723, registers: [{ label: 'Speed', format: 'VEL3', value: (r) => r.speed }, altitudeRate, { ...altitude, label: 'Altitude' }] },
  64: { noun: 64, title: 'Time left for redesignation and LPD angle, altitude rate, altitude', line: 726, registers: [{ label: 'Redesignation time and LPD angle', format: '2INT', value: (r) => [r.lpdTime, r.lpdAngle] }, altitudeRate, altitude] },
  68: { noun: 68, title: 'Slant range to landing site, time to go in braking, altitude difference', line: 738, registers: [{ label: 'Slant range', format: 'POS7', value: (r) => r.slantRange }, { label: 'Time to go', format: 'MIN/SEC', value: (r) => -r.ttf }, { label: 'ΔH (radar − computed)', format: 'COMP ALT', value: (r) => r.deltaH }] },
};

/** The noun each program shows with verb 06. */
export const MONITOR_NOUN: Record<DescentProgram, number> = { P63: 63, P64: 64, P65: 60, P66: 60 };

/** A register's five digits and sign, as the DSKY lit them. */
export function formatRegister(format: RegisterFormat, value: number | [number, number]): string {
  if (format === '2INT') {
    const [a, b] = value as [number, number];
    const two = (n: number) => String(Math.max(0, Math.min(99, Math.round(n)))).padStart(2, '0');
    return `+${two(a)} ${two(b)}`;
  }
  const v = value as number;
  if (!Number.isFinite(v)) return '+99999';
  const sign = v < 0 ? '−' : '+';
  const digits = (n: number) => String(Math.min(99999, Math.round(Math.abs(n)))).padStart(5, '0');
  switch (format) {
    case 'VEL3':
      return sign + digits((v / FT) * 10); // XXXX.X ft/s: the last digit is tenths
    case 'COMP ALT':
      return sign + digits(v / FT); // XXXXX. ft
    case 'POS7':
      return sign + digits((v / NMI) * 10); // XXXX.X nautical miles
    case 'MIN/SEC': {
      const total = Math.min(59 * 60 + 59, Math.round(Math.abs(v)));
      return `${sign}${String(Math.floor(total / 60)).padStart(2, '0')} ${String(total % 60).padStart(2, '0')}`;
    }
  }
}

/** A register's value in words, with its unit: "−52.3 ft/s". */
export function readRegister(format: RegisterFormat, value: number | [number, number]): string {
  switch (format) {
    case 'VEL3':
      return `${((value as number) / FT).toFixed(1)} ft/s`;
    case 'COMP ALT':
      return `${Math.round((value as number) / FT)} ft`;
    case 'POS7':
      return `${((value as number) / NMI).toFixed(1)} nautical miles`;
    case 'MIN/SEC': {
      const total = Math.round(Math.abs(value as number));
      return `${Math.floor(total / 60)} min ${total % 60} s`;
    }
    case '2INT': {
      const [a, b] = value as [number, number];
      return `${Math.round(a)} s and ${Math.round(b)}°`;
    }
  }
}

export type DskyKey = 'VERB' | 'NOUN' | 'ENTR' | 'CLR' | 'PRO' | 'KEY REL' | 'RSET' | `${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;

export interface DskyState {
  program: DescentProgram | null;
  verb: number;
  noun: number;
  /** What the crew is keying: a verb or noun being entered, and its digits. */
  entry: { into: 'verb' | 'noun'; digits: string } | null;
  /** The display the crew called up, when it isn't the program's own. */
  called: boolean;
  /** Program alarms, oldest first (V05N09 shows the first, second and last). */
  alarms: number[];
  /** Lamps. */
  prog: boolean;
  oprErr: boolean;
  keyRel: boolean;
  /** Flashing verb and noun: the computer is waiting for the crew (V99N62 before ignition). */
  flashing: boolean;
}

export const startDsky = (): DskyState => ({ program: 'P63', verb: 99, noun: 62, entry: null, called: false, alarms: [], prog: false, oprErr: false, keyRel: false, flashing: true });

/** Follow the descent: its program, and any new alarms. */
export function followDescent(d: DskyState, program: DescentProgram, alarms: number[], ignited: boolean): DskyState {
  let next = { ...d };
  // Once the engine is lit, V99N62 (flashing or answered with PRO) gives way to the program's monitor noun.
  if (ignited && (d.flashing || (d.verb === 99 && d.noun === 62))) next = { ...next, flashing: false, verb: 6, noun: MONITOR_NOUN[program] };
  if (program !== d.program) {
    next = { ...next, program };
    if (!next.called && !next.flashing) next = { ...next, verb: 6, noun: MONITOR_NOUN[program] };
    else if (next.called) next = { ...next, keyRel: true };
  }
  if (alarms.length > d.alarms.length) next = { ...next, alarms: [...alarms], prog: true };
  return next;
}

export interface KeyResult {
  dsky: DskyState;
  /** PRO on V99N62: light the engine. */
  proceed?: boolean;
  /** The crew called up V16N68: the executive carries a monitor display. */
  monitor?: boolean;
}

const KNOWN: { verb: number; noun: number }[] = [
  { verb: 16, noun: 68 },
  { verb: 6, noun: 68 },
  { verb: 5, noun: 9 },
  { verb: 6, noun: 60 },
  { verb: 6, noun: 63 },
  { verb: 6, noun: 64 },
];

/** A key press. */
export function pressKey(d: DskyState, key: DskyKey): KeyResult {
  if (key === 'VERB' || key === 'NOUN') return { dsky: { ...d, entry: { into: key === 'VERB' ? 'verb' : 'noun', digits: '' } } };
  if (/^\d$/.test(key)) {
    if (!d.entry || d.entry.digits.length >= 2) return { dsky: { ...d, oprErr: true } };
    const digits = d.entry.digits + key;
    const next = { ...d, entry: { ...d.entry, digits } };
    if (digits.length === 2) return { dsky: d.entry.into === 'verb' ? { ...next, verb: Number(digits) } : { ...next, noun: Number(digits) } };
    return { dsky: next };
  }
  if (key === 'CLR') return { dsky: { ...d, entry: d.entry ? { ...d.entry, digits: '' } : null } };
  if (key === 'ENTR') {
    if (!KNOWN.some((k) => k.verb === d.verb && k.noun === d.noun)) return { dsky: { ...d, entry: null, oprErr: true } };
    return { dsky: { ...d, entry: null, called: true }, monitor: d.verb === 16 && d.noun === 68 };
  }
  if (key === 'PRO') {
    if (d.flashing && d.verb === 99 && d.noun === 62) return { dsky: { ...d, flashing: false }, proceed: true };
    return { dsky: d };
  }
  if (key === 'KEY REL') {
    if (!d.called) return { dsky: d };
    const program = d.program ?? 'P63';
    return { dsky: { ...d, called: false, keyRel: false, verb: 6, noun: MONITOR_NOUN[program] } };
  }
  // RSET: the alarm and operator-error lamps go out.
  return { dsky: { ...d, prog: false, oprErr: false } };
}

/** The three registers the DSKY shows now. */
export function registers(d: DskyState, r: DescentReadout & { lpdTime: number; lpdAngle: number; deltaH: number }): string[] {
  if (d.verb === 5 && d.noun === 9) {
    const codes = d.alarms.length ? [d.alarms[0], d.alarms[1] ?? 0, d.alarms[d.alarms.length - 1]] : [0, 0, 0];
    return codes.map((c) => `+${String(c).padStart(5, '0')}`);
  }
  const noun = NOUNS[d.noun];
  if (!noun || d.flashing) return ['', '', ''];
  return noun.registers.map((reg) => formatRegister(reg.format, reg.value(r)));
}
