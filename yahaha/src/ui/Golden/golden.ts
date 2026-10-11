/**
 * Golden: the names the primitives take, and the pure parts of the system (the checks the overlay
 * runs and the spiral's geometry), kept here so they can be tested without layout.
 *
 * Sizing is CSS: every primitive turns its props into CSS expressions over the interval, shape and
 * fib tokens (tokens/golden.css) and container query units. Nothing here measures to size a box.
 */

/** A ratio, named as a musical interval; `phi` is the golden ratio, `phi2` and `phi3` its powers. */
export type Interval =
  | 'unison'
  | 'minor-third'
  | 'major-third'
  | 'fourth'
  | 'root2'
  | 'fifth'
  | 'phi'
  | 'major-sixth'
  | 'octave'
  | 'phi2'
  | 'double-octave'
  | 'phi3'
  | 'phi4'

/** A control's interval, set by the tuning (`--shape-<name>`). */
export type Shape = 'knob' | 'fader' | 'pad' | 'button' | 'steps'

/** Anything that names a ratio: an interval or a shape. */
export type Ratio = Interval | Shape

/** A ratio for a row's or a column's cell: the cell's length over the cross size (`phi`), or its inverse (`1:phi`). */
export type Cell = Ratio | `1:${Ratio}`

/** A step of the fib spacing scale (`--fib-<n>`). */
export type Fib = 'fib-2' | 'fib-3' | 'fib-5' | 'fib-8' | 'fib-13' | 'fib-21' | 'fib-34' | 'fib-55' | 'fib-89' | 'fib-144'

/** A side a cut is taken from. */
export type Side = 'top' | 'right' | 'bottom' | 'left'

/** A box's turn: a wide box's interval is width over height, a tall one's height over width. */
export type Orient = 'wide' | 'tall'

/** What GoldenSplit takes: a square, the golden section's major or minor part, or a strip in an interval. */
export type Take = 'square' | 'major' | 'minor' | Ratio

/** The existing size tokens a GoldenBand may be sized by: header rows, hit targets, a line of text, the frame's strips. */
export type BandSize =
  | 'label-height'
  | 'label-lines-2'
  | 'bar-height'
  | 'group-header-height'
  | 'control-height'
  | 'control-height-compact'
  | 'tab-block'
  | 'keys-height'
  | 'chip-height-display'

/** The tunings: a set of shapes each (tokens/golden.css). */
export type Tuning = 'phi' | 'just' | 'root2'

export const TUNINGS: { id: Tuning; title: string }[] = [
  { id: 'phi', title: 'Phi' },
  { id: 'just', title: 'Just' },
  { id: 'root2', title: 'Root-two' },
]

export const INTERVALS: Record<Interval, number> = {
  unison: 1,
  'minor-third': 6 / 5,
  'major-third': 5 / 4,
  fourth: 4 / 3,
  root2: Math.SQRT2,
  fifth: 3 / 2,
  phi: (1 + Math.sqrt(5)) / 2,
  'major-sixth': 5 / 3,
  octave: 2,
  phi2: ((1 + Math.sqrt(5)) / 2) ** 2,
  'double-octave': 4,
  phi3: ((1 + Math.sqrt(5)) / 2) ** 3,
  phi4: ((1 + Math.sqrt(5)) / 2) ** 4,
}

export const PHI = INTERVALS.phi

/** How each shape stands when nothing says otherwise. */
export const SHAPE_ORIENT: Record<Shape, Orient> = {
  knob: 'tall',
  fader: 'tall',
  pad: 'wide',
  button: 'wide',
  steps: 'wide',
}

const SHAPES = new Set<string>(Object.keys(SHAPE_ORIENT))

export function isShape(ratio: string): ratio is Shape {
  return SHAPES.has(ratio)
}

/** The CSS value of a ratio: `var(--interval-phi)` or `var(--shape-knob)`. */
export function ratioVar(ratio: Ratio): string {
  return isShape(ratio) ? `var(--shape-${ratio})` : `var(--interval-${ratio})`
}

/** A box's turn: the one asked for, else the shape's own, else wide. */
export function orientOf(ratio: Ratio, orient?: Orient): Orient {
  return orient ?? (isShape(ratio) ? SHAPE_ORIENT[ratio] : 'wide')
}

/** The CSS value of a fib step. */
export function fibVar(step: Fib): string {
  return `var(--${step})`
}

/** A cell's ratio and whether it is the inverse (`1:phi`). */
export function parseCell(cell: Cell): { ratio: Ratio; inverse: boolean } {
  return cell.startsWith('1:') ? { ratio: cell.slice(2) as Ratio, inverse: true } : { ratio: cell as Ratio, inverse: false }
}

/** A row's (or column's) track for a cell: its length from the cross size, `100cqh * phi` or `100cqh / phi`. */
export function cellTrack(cell: Cell, cross: 'cqh' | 'cqw'): string {
  const { ratio, inverse } = parseCell(cell)
  return `calc(100${cross} ${inverse ? '/' : '*'} ${ratioVar(ratio)})`
}

/**
 * A weighted grid's column tracks: each column's share its interval, as `minmax(0, <n>fr)` (the
 * number computed here, since CSS can't multiply an `fr`).
 */
export function weightTracks(weights: Interval[]): string {
  return weights.map((w) => `minmax(0, ${+INTERVALS[w].toFixed(6)}fr)`).join(' ')
}

/** A cell's value when it is a fixed interval; undefined for a shape (the tuning decides it). */
export function cellValue(cell: Cell): number | undefined {
  const { ratio, inverse } = parseCell(cell)
  if (isShape(ratio)) return undefined
  const v = INTERVALS[ratio]
  return inverse ? 1 / v : v
}

/** Within this much, two ratios are the same (0.5 %: a px or so at the Stage's sizes). */
export const TOLERANCE = 0.005

/**
 * Whether a row's cells add up to its box, from the names alone: their sum (each cell over the
 * cross size) against the box's interval. Undefined when a shape is involved: then only the
 * overlay's measurement can tell.
 */
export function addsUp(cells: Cell[], box: Ratio | undefined): { adds: boolean; sum: number; box: number } | undefined {
  if (box === undefined || isShape(box)) return undefined
  let sum = 0
  for (const cell of cells) {
    const v = cellValue(cell)
    if (v === undefined) return undefined
    sum += v
  }
  const want = INTERVALS[box]
  return { adds: Math.abs(sum - want) / want <= TOLERANCE, sum, box: want }
}

/** A rectangle, in px or in fractions of a box. */
export type Rect = { x: number; y: number; w: number; h: number }

/**
 * The spiral's slots in a wide phi box, as fractions of its width and height: `count - 1` squares
 * cut off in turn (left, bottom, right, top, …), then the remainder.
 */
export function spiralSlots(count: number): Rect[] {
  const slots: Rect[] = []
  // Work in units of the height: the box is PHI × 1.
  let r: Rect = { x: 0, y: 0, w: PHI, h: 1 }
  for (let i = 0; i < count - 1; i++) {
    const side = i % 4
    const s = Math.min(r.w, r.h)
    if (side === 0) {
      slots.push({ x: r.x, y: r.y, w: s, h: s })
      r = { x: r.x + s, y: r.y, w: r.w - s, h: r.h }
    } else if (side === 1) {
      slots.push({ x: r.x, y: r.y + r.h - s, w: s, h: s })
      r = { x: r.x, y: r.y, w: r.w, h: r.h - s }
    } else if (side === 2) {
      slots.push({ x: r.x + r.w - s, y: r.y, w: s, h: s })
      r = { x: r.x, y: r.y, w: r.w - s, h: r.h }
    } else {
      slots.push({ x: r.x, y: r.y, w: s, h: s })
      r = { x: r.x, y: r.y + s, w: r.w, h: r.h - s }
    }
  }
  slots.push(r)
  return slots.map((s) => ({ x: s.x / PHI, y: s.y, w: s.w / PHI, h: s.h }))
}

/** The order the spiral cuts its squares off in: each turn takes the next side. */
const SPIRAL_SIDES: Side[] = ['left', 'bottom', 'right', 'top']

/**
 * One square cut off a side of a rectangle: where its quarter arc starts (the corner on the box's
 * edge it enters from), where it ends (the inner corner), and what is left. Undefined when that
 * side can't take a square (a left or right cut off a tall box, a top or bottom cut off a wide one).
 */
function cutSquare(r: Rect, side: Side): { s: number; start: [number, number]; end: [number, number]; rest: Rect } | undefined {
  const s = Math.min(r.w, r.h)
  if ((side === 'left' || side === 'right') && r.w < r.h) return undefined
  if ((side === 'top' || side === 'bottom') && r.h < r.w) return undefined
  if (side === 'left') return { s, start: [r.x, r.y], end: [r.x + s, r.y + s], rest: { x: r.x + s, y: r.y, w: r.w - s, h: r.h } }
  if (side === 'bottom')
    return { s, start: [r.x, r.y + r.h], end: [r.x + s, r.y + r.h - s], rest: { x: r.x, y: r.y, w: r.w, h: r.h - s } }
  if (side === 'right')
    return { s, start: [r.x + r.w, r.y + s], end: [r.x + r.w - s, r.y], rest: { x: r.x, y: r.y, w: r.w - s, h: r.h } }
  return { s, start: [r.x + s, r.y], end: [r.x, r.y + s], rest: { x: r.x, y: r.y + s, w: r.w, h: r.h - s } }
}

/**
 * Which way a spiral turns. `ccw` cuts its squares off in the order left, bottom, right, top, …
 * (the default, and the only order before `Turn` existed); `cw` is its mirror, left, top, right,
 * bottom, …, so `from: 'right', turn: 'cw'` cuts right, bottom, left, top.
 */
export type Turn = 'cw' | 'ccw'

/** A side seen in the mirror (top and bottom swap): a cw spiral is a ccw one mirrored top to bottom. */
const MIRROR: Record<Side, Side> = { left: 'left', right: 'right', top: 'bottom', bottom: 'top' }

type Arc = { s: number; start: [number, number]; end: [number, number] }

/**
 * The ccw squares cut off a rectangle in turn, the first off `from`, until they are under `min` or
 * `turns` have been cut: each one's arc (start, size, end), and the rectangle left.
 */
function spiralCuts(box: Rect, turns: number, from: Side, min: number): { arcs: Arc[]; rest: Rect } {
  let r = { ...box }
  let k = SPIRAL_SIDES.indexOf(from)
  const arcs: Arc[] = []
  for (let i = 0; i < turns; i++) {
    if (Math.min(r.w, r.h) < min) break
    let cut = cutSquare(r, SPIRAL_SIDES[k % 4])
    if (!cut) {
      k++
      cut = cutSquare(r, SPIRAL_SIDES[k % 4])
    }
    if (!cut) break
    arcs.push({ s: cut.s, start: cut.start, end: cut.end })
    r = cut.rest
    k++
  }
  return { arcs, rest: r }
}

/**
 * The golden spiral's SVG path in a rectangle, wide or tall: a quarter arc in each square cut off
 * it in turn, the first off `from`, then round in the order left, bottom, right, top, … (`ccw`, the
 * default) or its mirror, left, top, right, bottom, … (`cw`), until the squares are under a px. A
 * side that can't take a square (`left` off a tall box) passes its turn to the next, so a ccw spiral
 * from the left of a tall box starts at its bottom. In a phi box the arcs join up; in any other box
 * a straight segment bridges each gap.
 */
export function spiralPath(box: Rect, turns = 12, from: Side = 'left', turn: Turn = 'ccw'): string {
  const cw = turn === 'cw'
  // A cw spiral is the ccw spiral from the mirrored side, mirrored top to bottom about the box.
  const flip = (p: [number, number]): [number, number] => (cw ? [p[0], 2 * box.y + box.h - p[1]] : p)
  const { arcs } = spiralCuts(box, turns, cw ? MIRROR[from] : from, 1)
  let d = ''
  let at: [number, number] | undefined
  for (const arc of arcs) {
    const [sx, sy] = flip(arc.start)
    const [ex, ey] = flip(arc.end)
    if (!at) d = `M ${sx} ${sy}`
    else if (Math.abs(at[0] - sx) > 0.5 || Math.abs(at[1] - sy) > 0.5) d += ` L ${sx} ${sy}`
    d += ` A ${arc.s} ${arc.s} 0 0 ${cw ? 1 : 0} ${ex} ${ey}`
    at = [ex, ey]
  }
  return d || `M ${box.x} ${box.y}`
}

/**
 * The spiral's pole: the point its squares converge on (where the eye lands), for the same `from`
 * and `turn` as `spiralPath`. In a 1398 × 864 box it is about (1010, 238) from the left ccw, and
 * about (388, 238) from the right cw.
 */
export function spiralPole(box: Rect, from: Side = 'left', turn: Turn = 'ccw'): [number, number] {
  const cw = turn === 'cw'
  const { rest } = spiralCuts(box, 64, cw ? MIRROR[from] : from, 1e-3)
  const x = rest.x + rest.w / 2
  const y = rest.y + rest.h / 2
  return [x, cw ? 2 * box.y + box.h - y : y]
}

/** One slot as measured: its box, its content's scroll size, and what it is called. */
export type SlotMeasure = {
  rect: Rect
  /** The slot's client size and scroll size: content past the client size overflows. */
  client: { w: number; h: number }
  scroll: { w: number; h: number }
  /** Text cut short inside it (an ellipsis): each clipped element's text. */
  clipped: string[]
  /** What to call it in a report: its label or its text. */
  name: string
  /** A Golden primitive (a cut), not a leaf. */
  cut: boolean
  /** How deep its slots holder is: 0 for the outermost in the overlay, +1 per holder around it. */
  depth?: number
  /** The index (in the groups measured) of the nearest named node it is in, if any. */
  group?: number
}

/** A fitted box as measured: the shape it holds, its size, and the room around it in its slot. */
export type BoxMeasure = { shape: string; rect: Rect; slot: Rect }

/** A row or column as measured: its cells' lengths against its own. */
export type LineMeasure = { name: string; rect: Rect; along: number; sum: number; declared?: boolean }

/** A named node (`data-golden-name`) as measured: its root's rect, and its fitted box if it has a shape. */
export type GroupMeasure = { name: string; depth: number; rect: Rect; fit?: Rect }

/**
 * A spiral to draw: its box, the side its first square is cut off, which way it turns (`ccw` when
 * absent), the depth it is at, and whether its orientation was set on the node (`data-spiral-from`
 * or `data-spiral-turn`): then the overlay also marks its pole.
 */
export type SpiralMeasure = Rect & { from?: Side; turn?: Turn; depth?: number; explicit?: boolean }

/**
 * A named node in the report: its size, its spare (for a fitted node, the room its fit leaves in its
 * root; else 0), and what overflows in it. A slot's overflow is counted in its nearest named node
 * only (the deepest owner), not in every named node around it, so the groups' overflow adds up to
 * the report's.
 */
export type GroupReport = { name: string; depth: number; w: number; h: number; spareW: number; spareH: number; overflow: string[] }

/** What GoldenOverlay finds: the data a story's `play` asserts on, and the report it draws. */
export type GoldenReport = {
  /** Every slot, as a rectangle relative to the overlay, with its nesting depth. */
  slots: { rect: Rect; off: boolean; depth: number }[]
  /** Slots whose content is too big for them, by name ("Retrig rate"). */
  overflow: string[]
  /** Rows and columns whose cells don't add up to their box. */
  rowsOff: string[]
  /** Rows and columns checked. */
  rows: number
  /** Each fitted box (GoldenBox, a fitted grid cell): its size and its spare, the room left in its slot. */
  boxes: { shape: string; w: number; h: number; spareW: number; spareH: number }[]
  /** Where a spiral is drawn: each phi box, and each golden-section split (`major`, `minor`). */
  spirals: SpiralMeasure[]
  /** Each named node, outermost first (document order). */
  groups: GroupReport[]
}

const PX = 1

/** A slot overflows when its content is a px or more past it, or when text in it is cut short. */
export function overflows(slot: SlotMeasure): boolean {
  return slot.scroll.w > slot.client.w + PX || slot.scroll.h > slot.client.h + PX || slot.clipped.length > 0
}

/** A measured row adds up when its cells' lengths sum to its own, within a px. */
export function lineAddsUp(line: LineMeasure): boolean {
  if (line.declared !== undefined) return line.declared
  return Math.abs(line.sum - line.along) <= PX
}

/** The report, from what was measured. */
export function report(
  slots: SlotMeasure[],
  boxes: BoxMeasure[],
  lines: LineMeasure[],
  spirals: SpiralMeasure[],
  groups: GroupMeasure[] = [],
): GoldenReport {
  const overflow: string[] = []
  const owned: string[][] = groups.map(() => [])
  const marked = slots.map((slot) => {
    const off = overflows(slot)
    if (off) {
      const names = slot.clipped.length > 0 ? slot.clipped : [slot.name]
      overflow.push(...names)
      if (slot.group !== undefined && owned[slot.group]) owned[slot.group].push(...names)
    }
    return { rect: slot.rect, off, depth: slot.depth ?? 0 }
  })
  const rowsOff = lines.filter((line) => !lineAddsUp(line)).map((line) => line.name)
  return {
    slots: marked,
    overflow,
    rowsOff,
    rows: lines.length,
    boxes: boxes.map((b) => ({
      shape: b.shape,
      w: b.rect.w,
      h: b.rect.h,
      spareW: Math.max(0, b.slot.w - b.rect.w),
      spareH: Math.max(0, b.slot.h - b.rect.h),
    })),
    spirals,
    groups: groups.map((g, i) => ({
      name: g.name,
      depth: g.depth,
      w: g.rect.w,
      h: g.rect.h,
      spareW: g.fit ? Math.max(0, g.rect.w - g.fit.w) : 0,
      spareH: g.fit ? Math.max(0, g.rect.h - g.fit.h) : 0,
      overflow: owned[i],
    })),
  }
}

/** The report's groups, a line each: "hero 1398 × 282 · spare 0 × 0 · overflow 0". */
export function groupLines(r: GoldenReport): string[] {
  return r.groups.map((g) => {
    const names = [...new Set(g.overflow)]
    const more = names.length === 0 ? '' : ` (${names.slice(0, 4).join(', ')}${names.length > 4 ? ', …' : ''})`
    return `${g.name} ${Math.round(g.w)} × ${Math.round(g.h)} · spare ${Math.round(g.spareW)} × ${Math.round(g.spareH)} · overflow ${g.overflow.length}${more}`
  })
}

/** A report in one line: "knob 54 × 88 · spare 0 × 27 · overflow 2 (Retrig rate, StyMuteA) · rows add up". */
export function summary(r: GoldenReport, shape?: string): string {
  const parts: string[] = []
  const box = shape ? r.boxes.find((b) => b.shape === shape) : r.boxes[0]
  if (box) {
    parts.push(`${box.shape} ${Math.round(box.w)} × ${Math.round(box.h)}`)
    parts.push(`spare ${Math.round(box.spareW)} × ${Math.round(box.spareH)}`)
  }
  const names = [...new Set(r.overflow)]
  parts.push(names.length === 0 ? 'no overflow' : `overflow ${r.overflow.length} (${names.slice(0, 4).join(', ')}${names.length > 4 ? ', …' : ''})`)
  if (r.rows > 0) parts.push(r.rowsOff.length === 0 ? 'rows add up' : `${r.rowsOff.length} of ${r.rows} rows don't add up`)
  return parts.join(' · ')
}
