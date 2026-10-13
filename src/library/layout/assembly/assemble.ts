// The solver: a screen spec, the room and the principles in; a placement out. Pure and
// deterministic: no DOM, no randomness, the same answer for the same input (docs/assembly.md).
import type { Density } from '../../contract';
import type { Aspect, Form, Nest, Placed, Placement, Principles, Rect, RegionSpec, Row, ScreenSpec } from './types';
import { resolveLength, resolveNeed } from './units';

/** How far from a form's least toward its ideal the fit test aims, per density. */
export const DENSITY_AIM: Record<Density, number> = { dense: 0, balanced: 0.5, roomy: 1 };

/** Sub-pixel slack in every comparison. */
const EPS = 0.5;

type Axis = 'w' | 'h';
interface RegionNode {
  kind: 'region';
  spec: RegionSpec;
  prio: number;
  /** Reading order. */
  order: number;
}
interface StackNode {
  kind: 'row' | 'col';
  kids: Node[];
}
type Node = RegionNode | StackNode;

interface Size {
  w: number;
  h: number;
}
interface Info {
  min: Size;
  ideal: Size;
  max: Size;
  grow: { w: boolean; h: boolean };
  prio: number;
}

const isNest = (x: RegionSpec | Nest): x is Nest => 'rows' in x;
const other = (a: Axis): Axis => (a === 'w' ? 'h' : 'w');

/** The solver's working state for one screen. */
class Solver {
  /** The body's regions, in reading order: the only ones that step down. */
  readonly regions: RegionNode[] = [];
  /** Every region, header and footer included. */
  readonly all = new Map<string, RegionNode>();
  readonly partner = new Map<string, string>();
  readonly steps = new Map<string, number>();
  /** Each region's width from a first placement: what a `ratio` form's height follows. */
  readonly widths = new Map<string, number>();
  readonly spec: ScreenSpec;
  readonly p: Principles;
  readonly body: StackNode;

  constructor(spec: ScreenSpec, p: Principles) {
    this.spec = spec;
    this.p = p;
    const add = (s: RegionSpec): RegionNode => {
      if (this.all.has(s.id)) throw new Error(`assembly: region id '${s.id}' is used twice`);
      if (!s.forms.length) throw new Error(`assembly: region '${s.id}' has no forms`);
      const node: RegionNode = { kind: 'region', spec: s, prio: this.prio(s), order: this.all.size };
      this.all.set(s.id, node);
      this.steps.set(s.id, 0);
      return node;
    };
    for (const s of spec.header ?? []) add(s);
    const rows = (list: readonly Row[]): StackNode => ({
      kind: 'col',
      kids: list.map((row) => ({ kind: 'row', kids: row.map((x) => (isNest(x) ? rows(x.rows) : this.track(add(x)))) })),
    });
    this.body = rows(spec.rows);
    for (const s of spec.footer ?? []) add(s);
    this.pairs();
  }

  private track(n: RegionNode): RegionNode {
    this.regions.push(n);
    return n;
  }

  private prio(s: RegionSpec): number {
    const v = s.priority ?? 'controls';
    return typeof v === 'number' ? v : this.p.ranks[v];
  }

  /** Checks every pair shares a stack, sits in two of its rows, and is first or last in both. */
  private pairs() {
    const where = new Map<string, { col: StackNode; row: number; first: boolean; last: boolean }>();
    const walk = (col: StackNode) =>
      col.kids.forEach((row, ri) => {
        const kids = (row as StackNode).kids;
        kids.forEach((k, i) => {
          if (k.kind === 'region') where.set(k.spec.id, { col, row: ri, first: i === 0, last: i === kids.length - 1 });
          else walk(k);
        });
      });
    walk(this.body);
    for (const [a, b] of this.spec.pairs ?? []) {
      const A = where.get(a);
      const B = where.get(b);
      if (!A || !B) throw new Error(`assembly: pair ${a}/${b} names a region that isn't in the body`);
      if (A.col !== B.col || A.row === B.row) throw new Error(`assembly: pair ${a}/${b} must sit in two rows of one stack`);
      if (!((A.first && B.first) || (A.last && B.last))) throw new Error(`assembly: pair ${a}/${b} must be first in both rows or last in both`);
      if (this.partner.has(a) || this.partner.has(b)) throw new Error(`assembly: a region can be in one pair only`);
      this.partner.set(a, b);
      this.partner.set(b, a);
    }
  }

  form(r: RegionNode): Form {
    return r.spec.forms[this.steps.get(r.spec.id) ?? 0];
  }

  /** The plate round a region's form: inset on every side, plus the head strip. */
  chrome(s: RegionSpec): Size {
    const { inset, head } = this.p.plate;
    const plate = s.plate !== false;
    return {
      w: plate ? inset.left + inset.right : 0,
      h: (plate ? inset.top + inset.bottom : 0) + (s.head ? head.top + head.bottom + this.p.scale.control : 0),
    };
  }

  /** A region's own size at aim `k` (0 its form's least, 1 its ideal), plate included. */
  own(r: RegionNode, k: number): Size {
    const f = this.form(r);
    const c = this.chrome(r.spec);
    const lerp = (a: Axis) => {
      const lo = resolveLength(f.min[a], this.p);
      const hi = Math.max(lo, resolveLength(f.ideal[a], this.p));
      return c[a] + lo + (hi - lo) * k;
    };
    return { w: lerp('w'), h: lerp('h') };
  }

  /** As `own`, with a paired region's width the wider of the pair. */
  size(r: RegionNode, k: number): Size {
    const s = this.own(r, k);
    const mate = this.partner.get(r.spec.id);
    if (mate) s.w = Math.max(s.w, this.own(this.byId(mate), k).w);
    return s;
  }

  byId(id: string): RegionNode {
    const r = this.all.get(id);
    if (!r) throw new Error(`assembly: no region '${id}'`);
    return r;
  }

  /** Room a node takes at aim `k`. */
  measure(n: Node, k: number): Size {
    if (n.kind === 'region') return this.size(n, k);
    const main: Axis = n.kind === 'row' ? 'w' : 'h';
    const sizes = n.kids.map((c) => this.measure(c, k));
    const gaps = Math.max(0, n.kids.length - 1) * this.p.plate.gap;
    const along = sizes.reduce((t, s) => t + s[main], 0) + gaps;
    const across = Math.max(0, ...sizes.map((s) => s[other(main)]));
    return main === 'w' ? { w: along, h: across } : { w: across, h: along };
  }

  info(n: Node): Info {
    if (n.kind === 'region') {
      const min = this.size(n, 0);
      const ideal = this.size(n, 1);
      const f = this.form(n);
      const c = this.chrome(n.spec);
      const cap = (a: Axis) => (f.max?.[a] === undefined ? Infinity : Math.max(ideal[a], c[a] + resolveLength(f.max[a]!, this.p)));
      const max = { w: cap('w'), h: cap('h') };
      const grow = { w: !!f.grow?.w, h: !!f.grow?.h };
      // Height follows width, once the width is known (the second placement pass).
      const w = this.widths.get(n.spec.id);
      if (f.ratio && w !== undefined) {
        const fixed = f.ratio.fixed ? resolveNeed(f.ratio.fixed, this.p) : { w: 0, h: 0 };
        const h = Math.max(min.h, c.h + fixed.h + (Math.max(0, w - c.w - fixed.w) * f.ratio.h) / f.ratio.w);
        ideal.h = h;
        max.h = h;
        grow.h = false;
      }
      return { min, ideal, max, grow, prio: n.prio };
    }
    const main: Axis = n.kind === 'row' ? 'w' : 'h';
    const cross = other(main);
    const kids = n.kids.map((c) => this.info(c));
    const gaps = Math.max(0, kids.length - 1) * this.p.plate.gap;
    const add = (pick: (i: Info) => number) => kids.reduce((t, i) => t + pick(i), 0) + gaps;
    const top = (pick: (i: Info) => number) => Math.max(0, ...kids.map(pick));
    const out = (along: number, acr: number): Size => (main === 'w' ? { w: along, h: acr } : { w: acr, h: along });
    const growMain = kids.some((i) => i.grow[main]);
    const growCross = kids.some((i) => i.grow[cross]);
    return {
      min: out(add((i) => i.min[main]), top((i) => i.min[cross])),
      ideal: out(add((i) => i.ideal[main]), top((i) => i.ideal[cross])),
      max: out(
        add((i) => (i.grow[main] ? i.max[main] : i.ideal[main])),
        growCross ? top((i) => (i.grow[cross] ? i.max[cross] : 0)) : Infinity,
      ),
      grow: main === 'w' ? { w: growMain, h: growCross } : { w: growCross, h: growMain },
      prio: top((i) => i.prio),
    };
  }

  /**
   * Splits `total` along an axis: everyone gets their least; then, highest priority first, each
   * tier is raised toward its ideal (in proportion to what it still lacks); then the spare goes to
   * the growers, highest priority first, in proportion to their ideals, up to their max.
   */
  split(infos: Info[], axis: Axis, total: number): number[] {
    const gaps = Math.max(0, infos.length - 1) * this.p.plate.gap;
    const out = infos.map((i) => i.min[axis]);
    let avail = total - gaps - out.reduce((t, v) => t + v, 0);
    if (avail <= 0) return out;
    const tiers = [...new Set(infos.map((i) => i.prio))].sort((a, b) => b - a);
    for (const tier of tiers) {
      const idx = infos.map((_, n) => n).filter((n) => infos[n].prio === tier);
      const lack = idx.map((n) => Math.max(0, infos[n].ideal[axis] - out[n]));
      const want = lack.reduce((t, v) => t + v, 0);
      if (want <= 0) continue;
      const take = Math.min(avail, want);
      idx.forEach((n, j) => (out[n] += (lack[j] * take) / want));
      avail -= take;
      if (avail <= EPS / 10) return out;
    }
    for (const tier of tiers) {
      let open = infos.map((_, n) => n).filter((n) => infos[n].prio === tier && infos[n].grow[axis] && out[n] < infos[n].max[axis]);
      while (avail > 1e-6 && open.length) {
        const weight = open.reduce((t, n) => t + Math.max(1, infos[n].ideal[axis]), 0);
        let given = 0;
        for (const n of open) {
          const add = Math.min((avail * Math.max(1, infos[n].ideal[axis])) / weight, infos[n].max[axis] - out[n]);
          out[n] += add;
          given += add;
        }
        avail -= given;
        open = open.filter((n) => out[n] < infos[n].max[axis] - 1e-6);
        if (given <= 1e-9) break;
      }
      if (avail <= 1e-6) break;
    }
    return out;
  }

  /** Places a node in `rect`; `fixed` holds paired widths already decided. */
  place(n: Node, rect: Rect, out: Record<string, Rect>, fixed: Map<string, number>) {
    if (n.kind === 'region') {
      out[n.spec.id] = rect;
      return;
    }
    if (n.kind === 'col') {
      const caps = this.pairCaps(n, rect.w);
      const hs = this.split(n.kids.map((c) => this.info(c)), 'h', rect.h);
      let y = rect.y;
      n.kids.forEach((row, i) => {
        this.placeRow(row as StackNode, { x: rect.x, y, w: rect.w, h: hs[i] }, out, fixed, caps);
        y += hs[i] + this.p.plate.gap;
      });
      return;
    }
    this.placeRow(n, rect, out, fixed, new Map());
  }

  private placeRow(row: StackNode, rect: Rect, out: Record<string, Rect>, fixed: Map<string, number>, caps: Map<string, number>) {
    const infos = row.kids.map((k) => {
      const i = this.info(k);
      if (k.kind !== 'region') return i;
      const id = k.spec.id;
      const w = fixed.get(id);
      if (w !== undefined) return { ...i, min: { ...i.min, w }, ideal: { ...i.ideal, w }, max: { ...i.max, w }, grow: { ...i.grow, w: false } };
      const cap = caps.get(id);
      if (cap === undefined) return i;
      const c = Math.max(i.min.w, cap);
      return { ...i, ideal: { ...i.ideal, w: Math.min(i.ideal.w, c) }, max: { ...i.max, w: Math.min(i.max.w, c) } };
    });
    const ws = this.split(infos, 'w', rect.w);
    let x = rect.x;
    row.kids.forEach((k, i) => {
      if (k.kind === 'region') {
        const mate = this.partner.get(k.spec.id);
        if (mate && !fixed.has(k.spec.id)) {
          fixed.set(k.spec.id, ws[i]);
          fixed.set(mate, ws[i]);
        }
      }
      this.place(k, { x, y: rect.y, w: ws[i], h: rect.h }, out, fixed);
      x += ws[i] + this.p.plate.gap;
    });
  }

  /** The widest a pair may be in this stack: what each of its two rows leaves after the others' least. */
  private pairCaps(col: StackNode, width: number): Map<string, number> {
    const caps = new Map<string, number>();
    const rowOf = new Map<string, StackNode>();
    for (const row of col.kids) for (const k of (row as StackNode).kids) if (k.kind === 'region') rowOf.set(k.spec.id, row as StackNode);
    for (const [a, b] of this.partner) {
      if (caps.has(a) || !rowOf.has(a) || !rowOf.has(b)) continue;
      let cap = Infinity;
      for (const id of [a, b]) {
        const row = rowOf.get(id)!;
        const others = row.kids.filter((k) => !(k.kind === 'region' && k.spec.id === id));
        const least = others.reduce((t, k) => t + this.info(k).min.w, 0);
        cap = Math.min(cap, width - least - others.length * this.p.plate.gap);
      }
      caps.set(a, cap);
      caps.set(b, cap);
    }
    return caps;
  }

  /** Whether the body fits `room` at aim `k`, and on which axes it overflows. */
  private over(room: Size, k: number) {
    const m = this.measure(this.body, k);
    return { m, w: m.w > room.w + EPS, h: m.h > room.h + EPS };
  }

  /**
   * Steps regions down until the body fits `room` at aim `k`, then steps back up what it no
   * longer needs.
   *
   * Down: the lowest priority goes first, strictly. In the lowest-priority tier that has a region
   * whose next form is smaller on an overflowing axis, the one whose step also shrinks the body
   * goes (the later in reading order on a tie), else the first such. Stops when it fits, or when no
   * region's next form is smaller where it overflows (every region at its last form, or none
   * helps).
   *
   * Back up: a step taken early may turn out not to be needed once a later one has made room (a
   * short region beside a tall one). Highest priority first, each stepped region tries its richer
   * form again and keeps it if the body still fits; repeated until nothing changes.
   */
  stepDown(room: Size, k: number, log: string[]): boolean {
    const order = [...this.regions].sort((a, b) => a.prio - b.prio || b.order - a.order);
    const at = (r: RegionNode) => this.steps.get(r.spec.id) ?? 0;
    const trial = <T,>(r: RegionNode, delta: number, fn: () => T): T => {
      const id = r.spec.id;
      const was = at(r);
      this.steps.set(id, was + delta);
      const out = fn();
      this.steps.set(id, was);
      return out;
    };
    let fits = false;
    for (;;) {
      const o = this.over(room, k);
      if (!o.w && !o.h) {
        fits = true;
        break;
      }
      const smaller = (before: Size, after: Size) => (o.w && after.w < before.w - 1e-6) || (o.h && after.h < before.h - 1e-6);
      // A step helps when its next form is smaller where the body overflows, and it doesn't trade
      // that for an overflow it makes worse on the other axis (sixteen pads in one row are
      // shorter than two rows of eight, but no help on a screen they're then too wide for).
      const harmless = () => {
        const m = this.measure(this.body, k);
        return m.w <= Math.max(o.m.w, room.w) + EPS && m.h <= Math.max(o.m.h, room.h) + EPS;
      };
      const useful = order.filter((r) => {
        if (at(r) >= r.spec.forms.length - 1) return false;
        const before = this.own(r, k);
        return trial(r, 1, () => smaller(before, this.own(r, k)) && harmless());
      });
      if (!useful.length) break;
      const tier = useful[0].prio;
      const inTier = useful.filter((r) => r.prio === tier);
      const pick = inTier.find((r) => trial(r, 1, () => smaller(o.m, this.measure(this.body, k)))) ?? inTier[0];
      log.push(`${pick.spec.id}: ${pick.spec.forms[at(pick)].id} → ${pick.spec.forms[at(pick) + 1].id}`);
      this.steps.set(pick.spec.id, at(pick) + 1);
    }
    if (!fits) return false;
    this.takeBack(room, k, log);
    return true;
  }

  /**
   * Highest priority first, each stepped region tries its richer form again and keeps it if the
   * body still fits `room` at aim `k`; repeated until nothing changes.
   */
  takeBack(room: Size | { free: Size }, k: number, log: string[]) {
    const order = [...this.regions].sort((a, b) => a.prio - b.prio || b.order - a.order);
    const at = (r: RegionNode) => this.steps.get(r.spec.id) ?? 0;
    const trial = (r: RegionNode, fn: () => boolean): boolean => {
      const id = r.spec.id;
      const was = at(r);
      this.steps.set(id, was - 1);
      const out = fn();
      this.steps.set(id, was);
      return out;
    };
    for (let changed = true; changed; ) {
      changed = false;
      for (const r of [...order].reverse()) {
        if (at(r) === 0) continue;
        const before = this.measure(this.body, k);
        const ok = trial(r, () => {
          if ('free' in room) {
            // Free: no larger on either axis than the body already is, or than `free` holds.
            const m = this.measure(this.body, k);
            return m.w <= Math.max(before.w, room.free.w) + 1e-6 && m.h <= Math.max(before.h, room.free.h) + 1e-6;
          }
          const o = this.over(room, k);
          return !o.w && !o.h;
        });
        if (!ok) continue;
        log.push(`${r.spec.id}: ${r.spec.forms[at(r)].id} → ${r.spec.forms[at(r) - 1].id}`);
        this.steps.set(r.spec.id, at(r) - 1);
        changed = true;
      }
    }
  }
}

/**
 * The room a screen is laid out in, inside a window of `win` px: the whole window, or with an
 * `aspect` the largest room of that ratio that fits (`contain`), centred, its offset in whole px.
 * The bands are what the window has left over, each side of the room.
 */
export function fitAspect(win: { w: number; h: number }, aspect?: Aspect): { room: Rect; bands: Rect[] } {
  if (!aspect) return { room: { x: 0, y: 0, w: win.w, h: win.h }, bands: [] };
  const { ratio, fit = 'contain' } = aspect;
  if (!(ratio > 0) || !Number.isFinite(ratio)) throw new Error(`assembly: aspect ratio must be a positive number, not ${ratio}`);
  if (fit !== 'contain') throw new Error(`assembly: aspect fit '${String(fit)}' is not supported`);
  const w = Math.min(win.w, win.h * ratio);
  const h = Math.min(win.h, win.w / ratio);
  const x = Math.floor((win.w - w) / 2);
  const y = Math.floor((win.h - h) / 2);
  const bands: Rect[] = [];
  // Thinner than a hair is float noise, not a band.
  const keep = (r: Rect) => r.w > 1e-6 && r.h > 1e-6 && bands.push(r);
  if (win.w - w > 1e-6) {
    keep({ x: 0, y: 0, w: x, h: win.h });
    keep({ x: x + w, y: 0, w: win.w - x - w, h: win.h });
  } else if (win.h - h > 1e-6) {
    keep({ x: 0, y: 0, w: win.w, h: y });
    keep({ x: 0, y: y + h, w: win.w, h: win.h - y - h });
  }
  return { room: { x, y, w, h }, bands };
}

/**
 * Assembles a screen into a window of `win` px under `principles`.
 *
 * 0. The room: the whole window, or with `spec.aspect` the largest room of that ratio inside it,
 *    centred (`fitAspect`). Everything below happens in the room; the rest of the window is bands.
 * 1. Every region starts at its first (richest) form. The header and footer are fixed: their first
 *    form at its ideal height, full width, and they never step down or zoom.
 * 2. While the body overflows its room, aiming each form between its least and its ideal by the
 *    pack's density (`DENSITY_AIM`), the lowest-priority region steps down one form; once it
 *    fits, any step a later one made unnecessary is taken back, highest priority first.
 * 3. If that runs out of steps that help, it starts again from the first forms aiming at their least (dense).
 * 4. Only when no step down helps any more is the body zoomed, by the one factor that fits its
 *    least; never below `minTarget / control`, where it overflows instead (`overflow`).
 * 5. The room is then split: least first, raised toward ideal by priority, spare to the growers
 *    by priority. Regions stretch across their row or stack.
 */
export function assemble(spec: ScreenSpec, win: { w: number; h: number }, principles: Principles): Placement {
  const fitted = fitAspect(win, spec.aspect);
  const room = { w: fitted.room.w, h: fitted.room.h };
  const s = new Solver(spec, principles);
  const p = principles;
  const gap = p.plate.gap;

  // Fixed zones.
  const fixedZone = (list: readonly RegionSpec[] = []) => {
    const hs = list.map((r) => s.size(s.byId(r.id), 1).h);
    return { hs, h: hs.reduce((t, v) => t + v, 0) + Math.max(0, hs.length - 1) * gap };
  };
  const head = fixedZone(spec.header);
  const foot = fixedZone(spec.footer);
  const headH = head.h;
  const footH = foot.h;
  const edge = resolveLength(spec.edge ?? 0, p);
  const inner = Math.max(0, room.w - 2 * edge);
  const bodyY = headH + (spec.header?.length ? gap : 0);
  const bodyH = Math.max(0, room.h - bodyY - footH - (spec.footer?.length ? gap : 0) - edge);
  const body: Size = { w: inner, h: bodyH };

  // Forms.
  const steps: string[] = [];
  const aim = DENSITY_AIM[p.density];
  let fits = s.stepDown(body, aim, steps);
  if (!fits && aim > 0) {
    for (const r of s.regions) s.steps.set(r.spec.id, 0);
    steps.length = 0;
    fits = s.stepDown(body, 0, steps);
  }

  // Zoom.
  let zoom = 1;
  let overflow = false;
  if (!fits) {
    // A step that turned out to cost the body nothing (the row it sits in is set by another
    // region now) is taken back first: it never helped.
    s.takeBack({ free: { w: 0, h: 0 } }, 0, steps);
    const floor = Math.min(1, p.minTarget / p.scale.control);
    const zoomFor = () => {
      const least = s.measure(s.body, 0);
      return Math.min(1, body.w / Math.max(1, least.w), body.h / Math.max(1, least.h));
    };
    zoom = zoomFor();
    // Below the floor, a step that only traded one axis for the other may be what stops the
    // floor holding it (a transport taller than the hero beside it): take back what the floor's
    // room still holds, and zoom again.
    if (zoom < floor - 1e-9) {
      const was = new Map(s.steps);
      const logged = steps.length;
      s.takeBack({ free: { w: body.w / floor, h: body.h / floor } }, 0, steps);
      if (zoomFor() >= floor - 1e-9) zoom = zoomFor();
      else {
        // It overflows anyway: keep the leaner forms.
        for (const [id, n] of was) s.steps.set(id, n);
        steps.length = logged;
      }
    }
    if (zoom < floor - 1e-9) {
      zoom = floor;
      overflow = true;
    }
    // Under the zoom, a step that never helped the binding row (a narrower transport beside a
    // hero while the row below sets the width) is taken back if the zoomed room still holds it.
    if (!overflow) s.takeBack({ w: body.w / zoom, h: body.h / zoom }, 0, steps);
  }
  const layout = { w: body.w / zoom, h: body.h / zoom };

  // Placement.
  let rects: Record<string, Rect> = {};
  s.place(s.body, { x: 0, y: 0, ...layout }, rects, new Map());
  // Widths never depend on heights, so a second pass with every width known lets a `ratio`
  // form's height follow its width.
  if (s.regions.some((r) => s.form(r).ratio)) {
    for (const r of s.regions) s.widths.set(r.spec.id, rects[r.spec.id].w);
    rects = {};
    s.place(s.body, { x: 0, y: 0, ...layout }, rects, new Map());
  }
  const placed: Record<string, Placed> = {};
  const put = (id: string, rect: Rect, zone: Placed['zone']) => {
    const r = s.byId(id);
    const step = s.steps.get(id) ?? 0;
    const form = r.spec.forms[step];
    placed[id] = { id, form: form.id, step, rect, zone, ...(form.parts ? { parts: form.parts } : {}) };
  };
  let y = 0;
  (spec.header ?? []).forEach((r, i) => {
    put(r.id, { x: 0, y, w: room.w, h: head.hs[i] }, 'header');
    y += head.hs[i] + gap;
  });
  for (const r of s.regions) put(r.spec.id, rects[r.spec.id], 'body');
  y = 0;
  (spec.footer ?? []).forEach((r, i) => {
    put(r.id, { x: 0, y, w: inner, h: foot.hs[i] }, 'footer');
    y += foot.hs[i] + gap;
  });

  return {
    room: fitted.room,
    bands: fitted.bands,
    regions: placed,
    order: [...(spec.header ?? []).map((r) => r.id), ...s.regions.map((r) => r.spec.id), ...(spec.footer ?? []).map((r) => r.id)],
    zones: {
      header: { x: 0, y: 0, w: room.w, h: headH },
      body: { x: edge, y: bodyY, w: body.w, h: body.h },
      footer: { x: edge, y: room.h - edge - footH, w: inner, h: footH },
    },
    zoom,
    layout,
    overflow,
    steps,
  };
}
