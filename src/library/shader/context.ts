// The page's one WebGL2 context, shared by every ShaderCanvas (docs/shader-graph.md,
// "ShaderCanvas"). Browsers cap live contexts at about 16, so a page of glass surfaces can't
// have one each. Every target renders, in turn, into the bottom-left corner of one hidden canvas
// (grown, never shrunk, to the largest target) and is copied straight out with `drawImage` into
// that target's own visible 2D canvas, before the next target overwrites the corner.
//
// One `requestAnimationFrame` loop serves every target; it draws only targets on screen
// (one shared IntersectionObserver), runs only while some visible target animates or changed,
// and stops while the tab is hidden. Programs are cached by frag string and freed when no
// target uses them.
import { MAX_PARAMS } from './types';
import { compile, drawFullscreen, type Program } from './gl';

/** One ShaderCanvas as the shared context sees it. The canvas component owns and fills it. */
export interface ShaderTarget {
  /** The visible canvas and its 2D context, which receive a copy of each frame. */
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** Read through `setFrag` so the program cache counts its users. */
  frag: string | null;
  /** `uParams`: always MAX_PARAMS long. */
  params: Float32Array;
  /** Controlled time; undefined: the page clock. */
  time: number | undefined;
  animate: boolean;
  /** Device pixels per CSS pixel (DPR capped at 2, times the render scale). */
  px: number;
  radius: number;
  /** Pointer x, y (CSS px / 100), the page time of the last press (-1: none), 1 when inside. */
  pointer: [number, number, number, number];
  /** `uTheme`: 7 × vec3, sRGB 0–1. */
  theme: Float32Array;
  dark: number;
  /** Re-read the theme and radius; true when anything changed. Called about once a second. */
  refresh(): boolean;
  /** A GLSL failure; the context calls it once per frag string. */
  onError(message: string): void;
  /** Set by the context. */
  visible: boolean;
  dirty: boolean;
  reported: Set<string>;
}

interface ProgramEntry {
  program: Program | null;
  error: string | null;
}

interface Shared {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  lost: boolean;
  maxSize: number;
}

const targets = new Set<ShaderTarget>();
const byCanvas = new WeakMap<Element, ShaderTarget>();
const programs = new Map<string, ProgramEntry>();
const users = new Map<string, number>();
let shared: Shared | null | undefined;
let current: WebGLProgram | null = null;
let raf = 0;
let themeTimer: ReturnType<typeof setInterval> | undefined;
let observer: IntersectionObserver | undefined;
let reducedMotion: MediaQueryList | undefined;
let clockStart: number | undefined;

/** Seconds since the page first used a shader: one clock, so neighbouring surfaces are in phase. */
export function pageTime(): number {
  const now = performance.now();
  if (clockStart === undefined) clockStart = now;
  return (now - clockStart) / 1000;
}

/** Whether this is a real browser that might have WebGL (not the server, not jsdom). */
export function browserMayHaveGL(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined' && !/jsdom/i.test(navigator.userAgent);
}

/** The shared context, created on first call; null when WebGL2 isn't available here. */
export function sharedContext(): WebGL2RenderingContext | null {
  if (shared === undefined) shared = createShared();
  return shared && !shared.lost ? shared.gl : null;
}

/** Whether the shared context could be created (true while it's merely lost: it comes back). */
export function webgl2Available(): boolean {
  if (shared === undefined) shared = createShared();
  return shared !== null;
}

function createShared(): Shared | null {
  if (!browserMayHaveGL()) return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
  });
  if (!gl) return null;
  const s: Shared = { canvas, gl, lost: false, maxSize: 0 };
  setup(s);
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    s.lost = true;
    current = null;
    programs.clear();
    stop();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    s.lost = false;
    setup(s);
    // Rebuild every program still in use from its frag string, then redraw everything.
    for (const frag of users.keys()) build(frag);
    for (const t of targets) t.dirty = true;
    kick();
  });
  return s;
}

function setup(s: Shared) {
  const { gl } = s;
  const viewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
  s.maxSize = Math.min(viewport[0], viewport[1], gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number);
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.SCISSOR_TEST);
  gl.clearColor(0, 0, 0, 0);
  current = null;
}

function build(frag: string): ProgramEntry {
  const gl = sharedContext();
  let entry: ProgramEntry;
  if (!gl) entry = { program: null, error: 'WebGL2 is not available' };
  else {
    try {
      entry = { program: compile(gl, frag, 'material'), error: null };
    } catch (e) {
      entry = { program: null, error: e instanceof Error ? e.message : String(e) };
    }
  }
  programs.set(frag, entry);
  return entry;
}

function release(frag: string | null) {
  if (frag === null) return;
  const n = (users.get(frag) ?? 1) - 1;
  if (n > 0) {
    users.set(frag, n);
    return;
  }
  users.delete(frag);
  const entry = programs.get(frag);
  programs.delete(frag);
  if (entry?.program && shared && !shared.lost) {
    if (current === entry.program.program) current = null;
    shared.gl.deleteProgram(entry.program.program);
  }
}

/** Change a target's frag, keeping the program cache's counts right. */
export function setFrag(t: ShaderTarget, frag: string | null) {
  if (t.frag === frag) return;
  if (targets.has(t)) {
    release(t.frag);
    if (frag !== null) users.set(frag, (users.get(frag) ?? 0) + 1);
  }
  t.frag = frag;
  invalidate(t);
}

/** Copy params into a target's `uParams`; marks it dirty only when a value changed. */
export function setParams(t: ShaderTarget, params: ArrayLike<number> | undefined) {
  const out = t.params;
  const n = Math.min(params?.length ?? 0, MAX_PARAMS);
  let changed = false;
  for (let i = 0; i < MAX_PARAMS; i++) {
    const v = i < n ? Number(params![i]) || 0 : 0;
    if (out[i] !== v) {
      out[i] = v;
      changed = true;
    }
  }
  if (changed) invalidate(t);
}

export function register(t: ShaderTarget) {
  if (targets.has(t)) return;
  targets.add(t);
  byCanvas.set(t.canvas, t);
  if (t.frag !== null) users.set(t.frag, (users.get(t.frag) ?? 0) + 1);
  if (targets.size === 1) start();
  observe().observe(t.canvas);
  t.dirty = true;
}

export function unregister(t: ShaderTarget) {
  if (!targets.delete(t)) return;
  observer?.unobserve(t.canvas);
  byCanvas.delete(t.canvas);
  release(t.frag);
  if (targets.size === 0) {
    stop();
    if (themeTimer !== undefined) clearInterval(themeTimer);
    themeTimer = undefined;
    document.removeEventListener('visibilitychange', onVisibility);
    reducedMotion?.removeEventListener('change', onMotion);
  }
}

/** Ask for a redraw of one target on the next frame (if it's on screen). */
export function invalidate(t: ShaderTarget) {
  t.dirty = true;
  if (t.visible) kick();
}

/** True under `prefers-reduced-motion: reduce`: every target then draws on change only. */
function reduced(): boolean {
  return reducedMotion?.matches ?? false;
}

function observe(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      let any = false;
      for (const e of entries) {
        const t = byCanvas.get(e.target);
        if (!t) continue;
        t.visible = e.isIntersecting;
        any ||= t.visible;
      }
      if (any) kick();
    });
  }
  return observer;
}

function start() {
  document.addEventListener('visibilitychange', onVisibility);
  reducedMotion ??= window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.addEventListener('change', onMotion);
  themeTimer ??= setInterval(onThemeTick, 1000);
}

function onVisibility() {
  if (document.hidden) stop();
  else kick();
}

function onMotion() {
  for (const t of targets) t.dirty = true;
  kick();
}

function onThemeTick() {
  if (document.hidden) return;
  let any = false;
  for (const t of targets) {
    if (!t.visible) continue;
    if (t.refresh()) {
      t.dirty = true;
      any = true;
    }
  }
  if (any) kick();
}

function stop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

const animating = (t: ShaderTarget) => t.animate && t.time === undefined && !reduced();

function kick() {
  if (raf || document.hidden || (shared && shared.lost)) return;
  for (const t of targets) {
    if (t.visible && (t.dirty || animating(t))) {
      raf = requestAnimationFrame(frame);
      return;
    }
  }
}

function frame() {
  raf = 0;
  const now = pageTime();
  let again = false;
  for (const t of targets) {
    if (!t.visible) continue;
    const anim = animating(t);
    if (anim || t.dirty) {
      t.dirty = false;
      render(t, now);
    }
    again ||= anim;
  }
  if (again) kick();
}

function blank(t: ShaderTarget) {
  t.ctx.clearRect(0, 0, t.canvas.width, t.canvas.height);
}

function render(t: ShaderTarget, now: number) {
  const width = t.canvas.width;
  const height = t.canvas.height;
  const gl = t.frag === null || width < 1 || height < 1 ? null : sharedContext();
  if (!gl || !shared || t.frag === null) return blank(t);
  const entry = programs.get(t.frag) ?? build(t.frag);
  if (!entry.program) {
    blank(t);
    if (entry.error && !t.reported.has(t.frag)) {
      t.reported.add(t.frag);
      t.onError(entry.error);
    }
    return;
  }

  // Render at the target's size, or the largest the driver allows (scaled up in the copy).
  const fit = Math.min(1, shared.maxSize / Math.max(width, height));
  const w = Math.max(1, Math.floor(width * fit));
  const h = Math.max(1, Math.floor(height * fit));
  const glc = shared.canvas;
  if (glc.width < w || glc.height < h) {
    glc.width = Math.max(glc.width, w);
    glc.height = Math.max(glc.height, h);
  }

  const p = entry.program;
  if (current !== p.program) {
    gl.useProgram(p.program);
    current = p.program;
  }
  gl.viewport(0, 0, w, h);
  gl.scissor(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  let loc = p.uniform('uRes');
  if (loc) gl.uniform2f(loc, w, h);
  if ((loc = p.uniform('uPx'))) gl.uniform1f(loc, t.px * (w / width));
  if ((loc = p.uniform('uTime'))) gl.uniform1f(loc, t.time ?? now);
  if ((loc = p.uniform('uPointer'))) {
    const [x, y, pressAt, inside] = t.pointer;
    gl.uniform4f(loc, x, y, pressAt < 0 ? 1e3 : Math.max(0, now - pressAt), inside);
  }
  if ((loc = p.uniform('uRadius'))) gl.uniform1f(loc, t.radius);
  if ((loc = p.uniform('uTheme'))) gl.uniform3fv(loc, t.theme);
  if ((loc = p.uniform('uDark'))) gl.uniform1f(loc, t.dark);
  if ((loc = p.uniform('uParams'))) gl.uniform1fv(loc, t.params);
  drawFullscreen(gl);

  // GL's origin is bottom-left: the w×h corner we drew is at the bottom of the hidden canvas.
  const ctx = t.ctx;
  ctx.globalCompositeOperation = 'copy';
  ctx.drawImage(glc, 0, glc.height - h, w, h, 0, 0, width, height);
}
