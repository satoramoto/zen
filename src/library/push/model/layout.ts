// The Push 3's controls as one table: every control's id, cluster, legend, spoken name, and its
// box in millimetres on the unit's face (openspec: push-surface). Plain data, no renderer.
//
// Sources.
// - Size: 380 mm wide by 318 mm deep, from Ableton's technical specifications
//   (https://www.ableton.com/en/push/tech-specs/, "Size and weight").
// - Places: measured from the manual's control figure
//   (https://ableton-production.imgix.net/push-manual/PushControls.png), whose body is 1032 by 858
//   pixels. Widths are scaled by 380 / 1032; heights by 318 / 858, which differs from the width's
//   scale by 0.7 percent (the figure is drawn very slightly shallow).
// - Names and legends: the manual's control reference.
//
// A control's id never changes with mode. Rows and columns count from the top left, as the scene
// buttons and the Session grid do: `pad-1-1` is the top left pad, `pad-8-1` the bottom left.

/** The unit's face, in millimetres. */
export const BODY = { width: 380, height: 318 } as const;

/** The display's resolution, in its own pixels: eight columns of 120. */
export const DISPLAY = { width: 960, height: 160, columns: 8 } as const;

export type ControlKind = 'pad' | 'button' | 'encoder' | 'wheel' | 'strip' | 'display';

/** The unit's clusters, as the manual groups them. */
export type Cluster =
  | 'encoders' | 'upper' | 'display' | 'lower' // the display block
  | 'pads' | 'scenes' | 'strip' // the pad block
  | 'top-left' | 'volume' | 'edit' | 'track' | 'tempo' | 'timing' | 'length' | 'record' | 'play' // the left column
  | 'top-right' | 'browse' | 'jog' | 'main' | 'dpad' | 'pad-mode' | 'repeat' | 'clip-edit' | 'page' | 'modifiers'; // the right column

/** The four regions the surface can be drawn in part as. */
export type Region = 'display' | 'pads' | 'left' | 'right';

/** What lamp the control has: none, one colour (white), or any colour. */
export type LampKind = 'none' | 'white' | 'colour';

export interface Control {
  /** Stable for ever: `pad-3-5`, `encoder-4`, `capture`. */
  id: string;
  kind: ControlKind;
  cluster: Cluster;
  region: Region;
  /** What the unit prints on it: a word, or a sign standing for the unit's icon. Empty for a pad, an encoder, the strip and the display. */
  legend: string;
  /** The manual's name for it, spoken by assistive technology. */
  name: string;
  /** The box, in millimetres from the face's top left. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Round (the rotary controls). */
  round?: boolean;
  lamp: LampKind;
  /** Pads, display buttons, scene buttons and encoders: 1 to 8. */
  row?: number;
  col?: number;
}

const KY = BODY.height / 315.93; // the figure's body is 315.93 mm deep at the width's scale
const round1 = (n: number) => Math.round(n * 10) / 10;

/** A box from the figure's measures (millimetres at the width's scale), with its depth corrected. */
const box = (x: number, y: number, w: number, h: number) => ({ x: round1(x), y: round1(y * KY), w: round1(w), h: round1(h * KY) });

/** The eight columns: left edge of column `c` (1 to 8) of a row of parts `w` wide, centred on the column. */
const COLUMN_PITCH = 29;
const COLUMN_CENTRE_1 = 87.25;
const columnCentre = (c: number) => COLUMN_CENTRE_1 + COLUMN_PITCH * (c - 1);
const inColumn = (c: number, w: number) => columnCentre(c) - w / 2;

/** The eight pad rows: top edge of row `r` (1 at the top). */
const ROW_PITCH = 21.78;
const ROW_TOP_1 = 131.8;
const rowTop = (r: number) => ROW_TOP_1 + ROW_PITCH * (r - 1);

const REGION: Record<Cluster, Region> = {
  encoders: 'display', upper: 'display', display: 'display', lower: 'display',
  pads: 'pads', scenes: 'pads', strip: 'pads',
  'top-left': 'left', volume: 'left', edit: 'left', track: 'left', tempo: 'left', timing: 'left', length: 'left', record: 'left', play: 'left',
  'top-right': 'right', browse: 'right', jog: 'right', main: 'right', dpad: 'right', 'pad-mode': 'right', repeat: 'right', 'clip-edit': 'right', page: 'right', modifiers: 'right',
};

type Part = Omit<Control, 'region'>;
const part = (id: string, kind: ControlKind, cluster: Cluster, legend: string, name: string, b: ReturnType<typeof box>, lamp: LampKind, more: Partial<Control> = {}): Part =>
  ({ id, kind, cluster, legend, name, ...b, lamp, ...more });

/** `n` buttons side by side in one block of the figure. */
function across(cluster: Cluster, x: number, y: number, w: number, h: number, items: [id: string, legend: string, name: string][], lamp: LampKind = 'white'): Part[] {
  const each = w / items.length;
  return items.map(([id, legend, name], i) => part(id, 'button', cluster, legend, name, box(x + each * i, y, each, h), lamp));
}

/** `n` buttons stacked in one block of the figure. */
function down(cluster: Cluster, x: number, y: number, w: number, h: number, items: [id: string, legend: string, name: string][], lamp: LampKind = 'white'): Part[] {
  const each = h / items.length;
  return items.map(([id, legend, name], i) => part(id, 'button', cluster, legend, name, box(x, y + each * i, w, each), lamp));
}

const eight = [1, 2, 3, 4, 5, 6, 7, 8];

/** The scene buttons' printed repeat intervals, top to bottom. */
export const REPEAT_INTERVALS = ['1/32t', '1/32', '1/16t', '1/16', '1/8t', '1/8', '1/4t', '1/4'] as const;

const parts: Part[] = [
  // The display block, top to bottom.
  ...eight.map((c) => part(`encoder-${c}`, 'encoder', 'encoders', '', `Encoder ${c}`, box(inColumn(c, 12.2), 15.5, 12.2, 12.2), 'none', { round: true, col: c })),
  ...eight.map((c) => part(`upper-${c}`, 'button', 'upper', '', `Upper display button ${c}`, box(inColumn(c, 25.8), 36.5, 25.8, 12.2), 'colour', { col: c })),
  // Measured at 72.9 and 231.2 wide; set to exactly the eight columns, so each display column is centred under its encoder.
  part('display', 'display', 'display', '', 'Display', box(COLUMN_CENTRE_1 - COLUMN_PITCH / 2, 59.7, COLUMN_PITCH * 8, 41.2), 'none'),
  ...eight.map((c) => part(`lower-${c}`, 'button', 'lower', '', `Lower display button ${c}`, box(inColumn(c, 25.8), 111.6, 25.8, 12.5), 'colour', { col: c })),

  // The pad block.
  ...eight.flatMap((r) => eight.map((c) => part(`pad-${r}-${c}`, 'pad', 'pads', '', `Pad row ${r} column ${c}`, box(inColumn(c, 26.5), rowTop(r), 26.5, 19.3), 'colour', { row: r, col: c }))),
  ...eight.map((r) => part(`scene-${r}`, 'button', 'scenes', REPEAT_INTERVALS[r - 1], `Scene ${r}, repeat interval ${REPEAT_INTERVALS[r - 1]}`, box(313.4, rowTop(r), 12.5, 18.8), 'colour', { row: r })),
  part('strip', 'strip', 'strip', '', 'Touch strip', box(43.4, 131.5, 20.3, 172), 'white'),

  // The left column, top to bottom.
  ...across('top-left', 7.7, 36.5, 56, 12.2, [['sets', 'Sets', 'Sets'], ['setup', 'Setup', 'Setup'], ['learn', 'Learn', 'Learn'], ['user', 'User', 'User']]),
  part('volume', 'encoder', 'volume', '', 'Volume', box(9.2, 68.1, 23.9, 23.9), 'none', { round: true }),
  part('undo', 'button', 'edit', 'Undo', 'Undo', box(51.2, 59.7, 12.5, 12.2), 'white'),
  part('save', 'button', 'edit', 'Save', 'Save', box(51.2, 88.7, 12.5, 12.2), 'white'),
  ...across('track', 7.7, 111.6, 56, 12.5, [['lock', 'Lock', 'Lock'], ['stop-clip', '□', 'Stop Clip'], ['mute', 'M', 'Mute'], ['solo', 'S', 'Solo']], 'colour'),
  part('tempo', 'encoder', 'tempo', '', 'Swing & Tempo', box(13.3, 132.2, 15.8, 15.8), 'none', { round: true }),
  ...down('timing', 7.7, 153.9, 26.9, 40.5, [['tap-tempo', 'Tap Tempo', 'Tap Tempo'], ['metronome', '○●', 'Metronome'], ['quantize', 'Quantize', 'Quantize']]),
  ...down('length', 7.7, 206.9, 26.9, 21.7, [['fixed-length', 'Fixed Length', 'Fixed Length'], ['automate', 'Automate', 'Automate']], 'colour'),
  ...down('record', 7.7, 240.8, 26.9, 40.9, [['new', 'New', 'New'], ['capture', '[ ]', 'Capture'], ['record', '○', 'Record']], 'colour'),
  part('play', 'button', 'play', '▷', 'Play', box(7.7, 284.6, 26.9, 18.8), 'colour'),

  // The right column, top to bottom.
  ...across('top-right', 313.4, 36.5, 56.3, 12.2, [['device', 'Device', 'Device'], ['mix', 'Mix', 'Mix'], ['clip', 'Clip', 'Clip'], ['session-screen', 'Session', 'Session Screen']]),
  part('add', 'button', 'browse', '+', 'Add', box(313.4, 59.3, 12.5, 12.5), 'white'),
  part('swap', 'button', 'browse', '⇄', 'Swap', box(313.4, 88.7, 12.5, 12.2), 'white'),
  part('jog', 'wheel', 'jog', '', 'Jog wheel', box(333.2, 61.5, 37.9, 37.6), 'none', { round: true }),
  part('main', 'button', 'main', 'Main', 'Main', box(313.4, 111.6, 12.5, 12.5), 'white'),
  part('dpad-up', 'button', 'dpad', '▴', 'Session D-pad up', box(346.1, 111.6, 12.2, 13.6), 'white'),
  part('dpad-left', 'button', 'dpad', '◂', 'Session D-pad left', box(332.5, 125.2, 13.6, 12.2), 'white'),
  part('dpad-centre', 'button', 'dpad', '·', 'Session D-pad centre', box(346.1, 125.2, 12.2, 12.2), 'white'),
  part('dpad-right', 'button', 'dpad', '▸', 'Session D-pad right', box(358.3, 125.2, 13.6, 12.2), 'white'),
  part('dpad-down', 'button', 'dpad', '▾', 'Session D-pad down', box(346.1, 137.4, 12.2, 13.6), 'white'),
  ...across('pad-mode', 332.5, 153.9, 39.4, 15.65, [['note', 'Note', 'Note'], ['session', 'Session', 'Session']]),
  ...across('pad-mode', 332.5, 169.55, 39.4, 15.65, [['scale', 'Scale', 'Scale'], ['layout', 'Layout', 'Layout']]),
  ...across('repeat', 332.5, 197.4, 39.4, 18.8, [['repeat', 'Repeat', 'Repeat'], ['accent', 'Accent', 'Accent']]),
  ...across('clip-edit', 332.5, 219.1, 39.4, 14.9, [['double-loop', 'Double Loop', 'Double Loop'], ['duplicate', 'Duplicate', 'Duplicate']]),
  ...across('clip-edit', 332.5, 234, 39.4, 14.9, [['convert', 'Convert', 'Convert'], ['delete', 'Delete', 'Delete']]),
  part('octave-up', 'button', 'page', '▴', 'Octave Up', box(345.6, 251.9, 13.2, 13), 'white'),
  part('page-left', 'button', 'page', '◂', 'Page Left', box(332.5, 264.9, 19.7, 13), 'white'),
  part('page-right', 'button', 'page', '▸', 'Page Right', box(352.2, 264.9, 19.7, 13), 'white'),
  part('octave-down', 'button', 'page', '▾', 'Octave Down', box(345.6, 277.9, 13.2, 13), 'white'),
  ...across('modifiers', 332.5, 293.8, 39.4, 9.2, [['shift', 'Shift', 'Shift'], ['select', 'Select', 'Select']], 'none'),
];

/** Every control of the unit, in reading order by cluster. */
export const CONTROLS: readonly Control[] = parts.map((p) => ({ ...p, region: REGION[p.cluster] }));

const BY_ID = new Map(CONTROLS.map((c) => [c.id, c]));

/** The control with this id, or undefined: the surface has nothing else. */
export const control = (id: string): Control | undefined => BY_ID.get(id);
export const isControl = (id: unknown): id is string => typeof id === 'string' && BY_ID.has(id);

/** The controls of one region, cluster or kind. */
export const controlsIn = (region: Region): Control[] => CONTROLS.filter((c) => c.region === region);
export const controlsOf = (cluster: Cluster): Control[] => CONTROLS.filter((c) => c.cluster === cluster);

/** Ids by place. Rows and columns are 1 to 8 from the top left. */
export const padId = (row: number, col: number) => `pad-${row}-${col}`;
export const encoderId = (col: number) => `encoder-${col}`;
export const upperId = (col: number) => `upper-${col}`;
export const lowerId = (col: number) => `lower-${col}`;
export const sceneId = (row: number) => `scene-${row}`;

/** A pad id's row and column, or undefined for any other id. */
export function padAt(id: string): { row: number; col: number } | undefined {
  const m = /^pad-([1-8])-([1-8])$/.exec(id);
  return m ? { row: Number(m[1]), col: Number(m[2]) } : undefined;
}

/** The number at the end of a numbered control's id (`encoder-4` gives 4), for the given stem. */
export function indexOf(id: string, stem: 'encoder' | 'upper' | 'lower' | 'scene'): number | undefined {
  const m = new RegExp(`^${stem}-([1-8])$`).exec(id);
  return m ? Number(m[1]) : undefined;
}

/** The centre of a control, in millimetres. */
export const centre = (c: Control) => ({ x: c.x + c.w / 2, y: c.y + c.h / 2 });

/** The display's lit area inside its glass: 960 by 160 pixels across the glass's width, centred. */
export function displayArea(): { x: number; y: number; w: number; h: number; mmPerPixel: number } {
  const glass = control('display')!;
  const mmPerPixel = glass.w / DISPLAY.width;
  const h = DISPLAY.height * mmPerPixel;
  return { x: glass.x, y: round1(glass.y + (glass.h - h) / 2), w: glass.w, h: round1(h), mmPerPixel };
}

/** The box that holds a region's controls, in millimetres. */
export function regionBox(region: Region): { x: number; y: number; w: number; h: number } {
  const list = controlsIn(region);
  const x0 = Math.min(...list.map((c) => c.x));
  const y0 = Math.min(...list.map((c) => c.y));
  const x1 = Math.max(...list.map((c) => c.x + c.w));
  const y1 = Math.max(...list.map((c) => c.y + c.h));
  return { x: round1(x0), y: round1(y0), w: round1(x1 - x0), h: round1(y1 - y0) };
}
