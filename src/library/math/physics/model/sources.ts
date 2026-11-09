// Every number the Apollo 11 descent uses, with where it comes from. A value either cites the
// Luminary 099 source (file and line, in the public chrislgarry/Apollo-11 repository at commit
// e7576d50) or is an approximation with its reason. `SOURCES.md` lists the same entries for a
// reader; a test holds the two together.

/** The pinned commit of the public Apollo 11 source the citations refer to. */
export const SOURCE_COMMIT = 'e7576d50f7c279a707cfaa71be2020592dbf43a8';
export const SOURCE_REPO = 'https://github.com/chrislgarry/Apollo-11';

/** The mission timeline the historical checks cite: NASA SP-4029, Apollo by the Numbers, Apollo 11 timeline. */
export const TIMELINE_SOURCE = 'NASA SP-4029, Apollo by the Numbers: Apollo 11 timeline (history.nasa.gov/SP-4029/Apollo_11i_Timeline.htm)';

export interface Citation {
  /** A Luminary 099 file, e.g. `CONTROLLED_CONSTANTS.agc`. */
  file: string;
  line: number;
  /** The label or comment at that line, as written. */
  label: string;
}

export interface SourcedValue {
  /** The name the model uses. */
  name: string;
  value: number;
  unit: string;
  /** What it is, in words. */
  what: string;
  /** Where it comes from in the flight software, when it does. */
  cite?: Citation;
  /** Why it is an approximation, when it is one (a pad-loaded value the source doesn't hold, or a simplification). */
  approximation?: string;
}

const LB_TO_N = 4.4482216152605;
const LB_TO_KG = 0.45359237;
const FT = 0.3048;

/** The descent's numbers, by the name the model uses. */
export const DESCENT_SOURCES = {
  thrust: {
    name: 'DPS thrust',
    value: 9817.5 * LB_TO_N,
    unit: 'N',
    what: 'The descent engine’s rated thrust: 9,817.5 lbf.',
    cite: { file: 'CONTROLLED_CONSTANTS.agc', line: 36, label: 'FDPS 2DEC 4.3670 B-7 # 9817.5 LBS FORCE IN NEWTONS' },
  },
  massFlow: {
    name: 'DPS mass flow',
    value: 32.62 * LB_TO_KG,
    unit: 'kg/s',
    what: 'Propellant flow at rated thrust: 32.62 lb/s.',
    cite: { file: 'CONTROLLED_CONSTANTS.agc', line: 37, label: 'MDOTDPS 2DEC 0.1480 B-3 # 32.62 LBS/SEC IN KGS/CS' },
  },
  fullThrottle: {
    name: 'FMAXODD',
    value: 4.81454413e4,
    unit: 'N',
    what: 'The thrust at full throttle (the saturated, “odd” full-throttle position).',
    cite: { file: 'CONTROLLED_CONSTANTS.agc', line: 128, label: 'FMAXODD DEC +3841 # FSAT +4.81454413 E+4' },
  },
  maxPositionable: {
    name: 'FMAXPOS',
    value: 4.34546769e4,
    unit: 'N',
    what: 'The highest thrust the throttle is positioned to below full throttle.',
    cite: { file: 'CONTROLLED_CONSTANTS.agc', line: 129, label: 'FMAXPOS DEC +3467 # FMAX +4.34546769 E+4' },
  },
  throttleLag: {
    name: 'THROTLAG',
    value: 0.2,
    unit: 's',
    what: 'The engine’s response lag the throttle command compensates for.',
    cite: { file: 'CONTROLLED_CONSTANTS.agc', line: 130, label: 'THROTLAG DEC +20 # TAU (TH) +1.99999999 E-1' },
  },
  guidancePeriod: {
    name: 'Servicer cycle',
    value: 2,
    unit: 's',
    what: 'Guidance runs once per servicer pass, every two seconds.',
    cite: { file: 'SERVICER.agc', line: 73, label: 'CA 2SECS # WAIT TWO SECONDS FOR READACCS' },
  },
  coreSets: {
    name: 'Core sets',
    value: 7,
    unit: 'jobs',
    what: 'How many jobs the executive can hold at once: 84 registers of core sets at 12 registers each.',
    cite: { file: 'ERASABLE_ASSIGNMENTS.agc', line: 374, label: '# DYNAMICALLY ALLOCATED CORE SETS FOR JOBS (84D)' },
  },
  vacAreas: {
    name: 'VAC areas',
    value: 5,
    unit: 'areas',
    what: 'How many interpretive jobs can hold a vector accumulator at once (VAC1 to VAC5).',
    cite: { file: 'ERASABLE_ASSIGNMENTS.agc', line: 434, label: 'VAC1USE ERASE … VAC5 ERASE +42D (lines 434–443)' },
  },
  rodClick: {
    name: 'RODSCALE',
    value: 1 * FT,
    unit: 'm/s',
    what: 'How much one click of the rate-of-descent switch changes the commanded descent rate: 1 ft/s.',
    cite: { file: 'ERASABLE_ASSIGNMENTS.agc', line: 1391, label: 'RODSCALE EQUALS LRWVFF +1 # I(1) CLICK SCALE FACTOR FOR ROD' },
    approximation: 'RODSCALE is pad-loaded, so the source names it but holds no value; 1 ft/s per click is the value the crews describe.',
  },
  rodTimeConstant: {
    name: 'TAUROD',
    value: 1.5,
    unit: 's',
    what: 'The time constant in which P66 drives the descent rate to the commanded rate.',
    cite: { file: 'ERASABLE_ASSIGNMENTS.agc', line: 1392, label: 'TAUROD EQUALS RODSCALE +1 # I(2) TIME CONSTANT FOR R.O.D.' },
    approximation: 'Pad-loaded; 1.5 s is chosen for a steady response.',
  },
  brakingEnd: {
    name: 'TENDBRAK',
    value: 60,
    unit: 's',
    what: 'Braking gives way to approach when the time to go to the braking target falls below this.',
    cite: { file: 'LUNAR_LANDING_GUIDANCE_EQUATIONS.agc', line: 692, label: 'EXTLOGIC … CA TENDBRAK # WCHPHASE = 0 BRAKQUAD' },
    approximation: 'TENDBRAK is pad-loaded (ERASABLE_ASSIGNMENTS.agc line 2096, “LANDING PHASE SWITCHING CRITERION”); 60 s is chosen so high gate falls near the flown altitude.',
  },
  approachEnd: {
    name: 'TENDAPPR',
    value: 12,
    unit: 's',
    what: 'The approach phase hands over to automatic vertical descent (P65) when its time to go falls below this.',
    cite: { file: 'ERASABLE_ASSIGNMENTS.agc', line: 2097, label: 'TENDAPPR ERASE # B(1) LANDING PHASE SWITCHING CRITERION.' },
    approximation: 'Pad-loaded; 12 s is chosen so the vertical descent starts near low gate.',
  },
  // Targets (pad-loaded in the flight, so approximations here). The guidance frame has its origin at the
  // landing site: x downrange (negative before the site), y up.
  brakingTargetX: { name: 'RBRFG (downrange)', value: -2000, unit: 'm', what: 'Braking target position, downrange.', approximation: 'Pad-loaded (RBRFG, used as RDG at LUNAR_LANDING_GUIDANCE_EQUATIONS.agc line 1435). The braking targets and the ignition range were searched together so high gate falls near the flown 507 s and 7,000 ft.' },
  brakingTargetY: { name: 'RBRFG (altitude)', value: 600, unit: 'm', what: 'Braking target position, altitude.', approximation: 'Pad-loaded; see RBRFG.' },
  brakingTargetVX: { name: 'VBRFG (downrange)', value: 40, unit: 'm/s', what: 'Braking target velocity, downrange.', approximation: 'Pad-loaded (VBRFG, line 1436).' },
  brakingTargetVY: { name: 'VBRFG (altitude)', value: -30, unit: 'm/s', what: 'Braking target velocity, altitude rate.', approximation: 'Pad-loaded; see VBRFG.' },
  brakingTargetAX: { name: 'ABRFG (downrange)', value: -2.5, unit: 'm/s²', what: 'Braking target acceleration, downrange.', approximation: 'Pad-loaded (ABRFG, line 1437).' },
  brakingTargetAY: { name: 'ABRFG (altitude)', value: 0, unit: 'm/s²', what: 'Braking target acceleration, altitude.', approximation: 'Pad-loaded; see ABRFG.' },
  approachTargetX: { name: 'RAPFG (downrange)', value: -30, unit: 'm', what: 'Approach target position, downrange: just short of the site.', approximation: 'Pad-loaded (RAPFG); chosen to end at low gate over the site.' },
  approachTargetY: { name: 'RAPFG (altitude)', value: 30, unit: 'm', what: 'Approach target altitude: low gate.', approximation: 'Pad-loaded; see RAPFG.' },
  approachTargetVX: { name: 'VAPFG (downrange)', value: 1.5, unit: 'm/s', what: 'Approach target velocity, downrange.', approximation: 'Pad-loaded (VAPFG).' },
  approachTargetVY: { name: 'VAPFG (altitude)', value: -1.0, unit: 'm/s', what: 'Approach target altitude rate.', approximation: 'Pad-loaded; see VAPFG.' },
  approachTargetAX: { name: 'AAPFG (downrange)', value: 0, unit: 'm/s²', what: 'Approach target acceleration, downrange.', approximation: 'Pad-loaded (AAPFG).' },
  approachTargetAY: { name: 'AAPFG (altitude)', value: 0, unit: 'm/s²', what: 'Approach target acceleration, altitude.', approximation: 'Pad-loaded; see AAPFG.' },
  verticalRate: {
    name: 'P65 descent rate',
    value: -3 * FT,
    unit: 'm/s',
    what: 'The descent rate the automatic vertical phase (P65) holds to touchdown: 3 ft/s.',
    approximation: 'P65 takes its rate from VDGVERT, which is set at run time (LUNAR_LANDING_GUIDANCE_EQUATIONS.agc line 1033); 3 ft/s is the documented automatic landing rate.',
  },
  p66Start: {
    name: 'P66 starts at the current rate',
    value: 1,
    unit: '',
    what: 'Entering P66 sets the desired altitude rate to the current altitude rate.',
    cite: { file: 'LUNAR_LANDING_GUIDANCE_EQUATIONS.agc', line: 147, label: 'DCA HDOTDISP # SET DESIRED ALTITUDE RATE = CURRENT / DXCH VDGVERT # ALTITUDE RATE.' },
  },
  rodUpdate: {
    name: 'Each click updates the rate',
    value: 1,
    unit: '',
    what: 'Each click of the rate switch adds RODSCALE to the desired altitude rate.',
    cite: { file: 'LUNAR_LANDING_GUIDANCE_EQUATIONS.agc', line: 953, label: 'DAS VDGVERT # UPDATE DESIRED ALTITUDE RATE.' },
  },
  p66Entry: {
    name: 'A click in auto switches to P66',
    value: 1,
    unit: '',
    what: 'During automatic landing, a click of the rate switch moves the program into P66.',
    cite: { file: 'LUNAR_LANDING_GUIDANCE_EQUATIONS.agc', line: 205, label: 'CA RODCOUNT # NO. HAS THE ROD SWITCH BEEN "CLICKED"? … TCF STARTP66 # YES. SWITCH INTO THE ROD MODE.' },
  },
  guidanceLaw: {
    name: 'Quadratic guidance',
    value: 1,
    unit: '',
    what: 'Commanded acceleration: ACG = ADG + 6(VDG + VG)/TTF + 12(RDG − RG)/TTF², TTF the (negative) time to go.',
    cite: { file: 'LUNAR_LANDING_GUIDANCE_EQUATIONS.agc', line: 530, label: '# MAIN GUIDANCE EQUATION … ACG = ADG + 6(VDG + VG)/TTF + 12(RDG - RG)/(TTF)(TTF)' },
  },
  timeToGo: {
    name: 'Time to go',
    value: 1,
    unit: '',
    what: 'TTF is the root of the downrange jerk equation JDG·TTF³ + 6·ADG·TTF² + (18·VDG + 6·VG)·TTF + 24(RDG − RG) = 0, found by iteration from the last value.',
    cite: { file: 'LUNAR_LANDING_GUIDANCE_EQUATIONS.agc', line: 516, label: 'TC ROOTPSRS # YIELDS TTF/8 IN MPAC' },
    approximation: 'The jerk target JDG is taken as zero (JBRFG and JAPFG are pad-loaded), so the equation is quadratic, and LEADTIME’s lag compensation (line 547) is left out. Without them the solved time to go lags as the vehicle slows, so here it may not fall behind the clock: each pass it is at least the last value plus the two-second period.',
  },
  alarm1202: {
    name: '1202',
    value: 1202,
    unit: 'code',
    what: 'No core sets available: the executive could not hold another job.',
    cite: { file: 'EXECUTIVE.agc', line: 207, label: 'TC BAILOUT1 # NO CORE SETS AVAILABLE. / OCT 1202' },
  },
  alarm1201: {
    name: '1201',
    value: 1201,
    unit: 'code',
    what: 'No VAC areas available: the executive could not give an interpretive job its work area.',
    cite: { file: 'EXECUTIVE.agc', line: 146, label: 'TC BAILOUT1 / OCT 1201 # NO VAC AREAS.' },
  },
  restart: {
    name: 'BAILOUT',
    value: 1,
    unit: '',
    what: 'An alarm through BAILOUT restarts the computer: jobs are dropped and the restart-protected ones (guidance) carry on.',
    cite: { file: 'ALARM_AND_ABORT.agc', line: 189, label: 'BAILOUT1 INHINT' },
  },
  executiveLoad: {
    name: 'Descent load',
    value: 0.85,
    unit: 'of each cycle',
    what: 'The share of each two-second cycle the descent’s own jobs need.',
    approximation: 'A model of the cause, not an emulation: the AGC’s actual timing isn’t simulated. 85% is the figure usually given for the descent’s load.',
  },
  radarSteal: {
    name: 'Rendezvous radar steal',
    value: 0.13,
    unit: 'of each cycle',
    what: 'The time the rendezvous radar’s mis-phased angle signals stole from the computer, as counter increments.',
    approximation: 'The figure usually given is about 13–15%; 13% is used.',
  },
  monitorLoad: {
    name: 'Monitor display load',
    value: 0.08,
    unit: 'of each cycle',
    what: 'The extra work of a crew-requested monitor display (V16N68) each cycle.',
    approximation: 'Chosen so that the extra display tips the load over, as it did when Aldrin called up N68.',
  },
  throttleRecovery: {
    name: 'Throttle recovery',
    value: 0.57,
    unit: 'of full thrust',
    what: 'Above this share of full thrust the engine stays at full throttle; below it the throttle follows guidance.',
    cite: { file: 'THROTTLE_CONTROL_ROUTINES.agc', line: 108, label: '# (BELOW 55%) THE QUANTITY -(FMAXODD - FP) IS COMPUTED …' },
    approximation: 'The flight software throttles between FMAXPOS and FMAXODD by its own logic; a single 57% threshold stands in for it. With it, and without the jerk targets, the model throttles down at about 200 s where Apollo 11 did at 386 s (102:39:31); the timing of high gate and landing is matched instead.',
  },
  lpdAngle: {
    name: 'LPD angle',
    value: 1,
    unit: '°',
    what: 'N64’s landing point designator angle: where the site sits on the window’s reticle.',
    cite: { file: 'PINBALL_NOUN_TABLES.agc', line: 726, label: 'ECADR FUNNYDSP # 64 2INT 2INT' },
    approximation: 'Measured here between the line of sight to the site and the LM’s downward thrust axis; the window’s own geometry is left out.',
  },
  deltaH: {
    name: 'ΔH',
    value: 0,
    unit: 'm',
    what: 'N68’s third register: landing-radar altitude minus computed altitude.',
    cite: { file: 'PINBALL_NOUN_TABLES.agc', line: 740, label: 'ECADR DELTAH # 68 COMP ALT DP1' },
    approximation: 'Always 0: the model has no landing radar, so its altitude is exact.',
  },
  // The vehicle and the starting point (not in the flight software).
  massAtIgnition: { name: 'LM mass at ignition', value: 15095, unit: 'kg', what: 'Eagle’s mass at powered descent ignition (about 33,280 lb).', approximation: 'Mission data, not the flight software; rounded.' },
  descentPropellant: { name: 'Descent propellant at ignition', value: 8248, unit: 'kg', what: 'Usable descent propellant at ignition (about 18,184 lb).', approximation: 'Mission data, rounded.' },
  ignitionAltitude: { name: 'Ignition altitude', value: 15000, unit: 'm', what: 'Altitude at powered descent ignition (about 49,000 ft).', approximation: 'Mission data, rounded; the descent orbit’s low point.' },
  ignitionSpeed: { name: 'Ignition speed', value: 1692, unit: 'm/s', what: 'Orbital speed at ignition.', approximation: 'From the descent orbit (60 by 8 nautical miles) at its low point, rounded.' },
  ignitionRange: { name: 'Ignition range', value: 460000, unit: 'm', what: 'Ground distance from ignition to the landing site.', approximation: 'Searched with the braking targets so the braking phase lasts about as long as it did; the flight’s own ignition point came from the ignition algorithm.' },
  touchdownVertical: { name: 'Touchdown vertical limit', value: 10 * FT, unit: 'm/s', what: 'The highest safe descent rate at contact: 10 ft/s.', approximation: 'The LM landing gear design limit, not a flight-software value.' },
  touchdownHorizontal: { name: 'Touchdown horizontal limit', value: 4 * FT, unit: 'm/s', what: 'The highest safe sideways speed at contact: 4 ft/s.', approximation: 'The LM landing gear design limit, not a flight-software value.' },
  moonMu: { name: 'Lunar GM', value: 4.9048695e12, unit: 'm³/s²', what: 'The Moon’s gravitational parameter.', approximation: 'Modern value; the flight software carries its own (MUM).' },
  moonRadius: { name: 'Lunar radius at the site', value: 1.7356e6, unit: 'm', what: 'The Moon’s radius at Tranquility Base (lower than the mean 1,737.4 km).', approximation: 'Rounded; the flight used RLS, the landing site vector, pad-loaded.' },
} satisfies Record<string, SourcedValue>;

export type DescentSourceKey = keyof typeof DESCENT_SOURCES;

/** A value by its key. */
export const src = (key: DescentSourceKey): number => DESCENT_SOURCES[key].value;

/** Every entry, for SOURCES.md and the story that shows them. */
export const allDescentSources = (): SourcedValue[] => Object.values(DESCENT_SOURCES);

/** The historical events the checks compare with, as seconds after ignition (102:33:05.01 GET). */
export const IGNITION_GET = 102 * 3600 + 33 * 60 + 5.01;
export const HISTORICAL = {
  alarms: [
    { code: 1202, get: '102:38:22' },
    { code: 1202, get: '102:39:02' },
    { code: 1201, get: '102:42:18' },
    { code: 1202, get: '102:42:43' },
    { code: 1202, get: '102:42:58' },
  ],
  throttleRecovery: '102:39:31',
  approachPhase: '102:41:32',
  rateOfDescentPhase: '102:43:22',
  landing: '102:45:39.9',
} as const;

/** "hhh:mm:ss(.s)" ground elapsed time to seconds. */
export function getSeconds(get: string): number {
  const [h, m, s] = get.split(':').map(Number);
  return h * 3600 + m * 60 + s;
}

/** Seconds after ignition to "hhh:mm:ss" ground elapsed time. */
export function toGet(secondsAfterIgnition: number): string {
  const total = Math.floor(IGNITION_GET + secondsAfterIgnition);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** A historical event's time after ignition. */
export const afterIgnition = (get: string) => getSeconds(get) - IGNITION_GET;
