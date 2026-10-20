// The runner's canvas as a framework-free store (docs/shader-graph.md, "ShaderCanvas"):
// `ShaderCanvas.tsx` binds it from layout effects, and a view tree binds it as the `shader` store.
import { MAX_PARAMS } from './types';
import { invalidate, pageTime, register, setFrag, setParams, unregister, type ShaderTarget } from './context';

/** What `bindShader` draws: `ShaderCanvasProps` without the element's own attributes. */
export interface ShaderParams {
  /** The fragment shader; null draws nothing. */
  frag: string | null;
  /** `uParams`, up to 64. */
  params?: ArrayLike<number>;
  /** Controlled time in seconds; unset, the page-wide clock. */
  time?: number;
  /** Default true: a frame per display frame while visible. False: draw on change only. */
  animate?: boolean;
  /** Render resolution as a fraction of device pixels (DPR capped at 2); default 0.5. */
  scale?: number;
  /** `uRadius` in CSS px; default the parent's computed corner radius. */
  radius?: number;
  /** Track the pointer over the parent element into `uPointer`. */
  interactive?: boolean;
  /** A GLSL compile or link failure; the canvas then draws nothing. */
  onError?: (message: string) => void;
}

/** A bound canvas: `update` with the latest params, `destroy` when the canvas goes. */
export interface ShaderBinding {
  update(params: ShaderParams): void;
  destroy(): void;
}

/** The scope variables `uTheme` reads, in slot order: ground, ink, accent, hue 1–5. */
const THEME_VARS = ['--surface-0', '--text-1', '--accent', '--hue-1', '--hue-2', '--hue-3', '--hue-4', '--hue-5'] as const;

// Any CSS colour (oklch, color-mix, named) to sRGB 0–1, through a 1×1 2D context. Cached by the
// string, so the once-a-second theme read is a style lookup and a few map hits.
let probe: CanvasRenderingContext2D | null | undefined;
const resolved = new Map<string, readonly [number, number, number]>();
function resolveColour(value: string): readonly [number, number, number] {
  const key = value.trim();
  const hit = resolved.get(key);
  if (hit) return hit;
  if (probe === undefined) {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    probe = c.getContext('2d', { willReadFrequently: true });
  }
  let rgb: readonly [number, number, number] = [0, 0, 0];
  if (probe && key) {
    probe.globalCompositeOperation = 'copy';
    probe.fillStyle = 'transparent';
    probe.fillStyle = key;
    probe.fillRect(0, 0, 1, 1);
    const d = probe.getImageData(0, 0, 1, 1).data;
    rgb = [d[0] / 255, d[1] / 255, d[2] / 255];
  }
  if (resolved.size > 256) resolved.clear();
  resolved.set(key, rgb);
  return rgb;
}

/** A corner radius in CSS px from a computed `border-top-left-radius` (a percentage of the short side). */
function radiusOf(el: Element | null): number {
  if (!el) return 0;
  const raw = getComputedStyle(el).borderTopLeftRadius.split(' ')[0] ?? '';
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return 0;
  if (raw.endsWith('%')) {
    const r = el.getBoundingClientRect();
    return (Math.min(r.width, r.height) * n) / 100;
  }
  return n;
}

const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

const NOTHING: ShaderBinding = { update() {}, destroy() {} };

/**
 * Makes `node` (a `<canvas>`) a shader target: registers it with the page's shared context
 * (`context.ts`), keeps its backing size (ResizeObserver, DPR changes), theme and corner current,
 * re-measures when `scale` or `radius` change, and tracks the pointer over its parent while
 * `interactive`. `update` takes the latest params (the frag, params, time and animate it draws;
 * `onError`, `scale` and `radius` are read live); `destroy` unregisters it. Anything but a canvas
 * with a 2D context binds nothing.
 */
export function bindShader(node: HTMLElement, initial: ShaderParams): ShaderBinding {
  const canvas = node as HTMLCanvasElement;
  const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!ctx) return NOTHING;
  let p = initial;
  const scaleOf = () => p.scale ?? 0.5;
  let cssW = 0;
  let cssH = 0;

  const t: ShaderTarget = {
    canvas,
    ctx,
    frag: null,
    params: new Float32Array(MAX_PARAMS),
    time: undefined,
    animate: true,
    px: dpr() * scaleOf(),
    radius: 0,
    pointer: [0, 0, -1, 0],
    theme: new Float32Array(THEME_VARS.length * 3),
    dark: 0,
    refresh() {
      let changed = false;
      const style = getComputedStyle(canvas);
      THEME_VARS.forEach((name, i) => {
        const rgb = resolveColour(style.getPropertyValue(name));
        for (let k = 0; k < 3; k++) {
          if (t.theme[i * 3 + k] !== Math.fround(rgb[k])) {
            t.theme[i * 3 + k] = rgb[k];
            changed = true;
          }
        }
      });
      const [r, g, b] = [t.theme[0], t.theme[1], t.theme[2]];
      const dark = 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5 ? 1 : 0;
      const rad = p.radius ?? radiusOf(canvas.parentElement);
      if (dark !== t.dark || rad !== t.radius) changed = true;
      t.dark = dark;
      t.radius = rad;
      return changed;
    },
    onError: (message) => p.onError?.(message),
    visible: false,
    dirty: true,
    reported: new Set(),
  };

  const resize = () => {
    const px = dpr() * scaleOf();
    const w = Math.max(1, Math.round(cssW * px));
    const h = Math.max(1, Math.round(cssH * px));
    t.px = px;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    t.refresh();
    invalidate(t);
  };

  const sizes = new ResizeObserver((entries) => {
    const box = entries[entries.length - 1].contentRect;
    cssW = box.width;
    cssH = box.height;
    resize();
  });
  sizes.observe(canvas);

  // A DPR change (zoom, a move to another screen): a one-shot query for the current ratio.
  let ratio: MediaQueryList | undefined;
  const onRatio = () => {
    resize();
    watchRatio();
  };
  const watchRatio = () => {
    ratio?.removeEventListener('change', onRatio);
    ratio = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    ratio.addEventListener('change', onRatio);
  };
  watchRatio();

  t.refresh();
  register(t);

  // The pointer over the parent, in the coord units (CSS px / 100 from the canvas's top-left).
  let unpoint: (() => void) | undefined;
  const point = () => {
    const host = canvas.parentElement;
    if (!host) return;
    const at = (e: PointerEvent, inside: number) => {
      const r = canvas.getBoundingClientRect();
      t.pointer[0] = (e.clientX - r.left) / 100;
      t.pointer[1] = (e.clientY - r.top) / 100;
      t.pointer[3] = inside;
      invalidate(t);
    };
    const move = (e: PointerEvent) => at(e, 1);
    const leave = (e: PointerEvent) => at(e, 0);
    const down = (e: PointerEvent) => {
      t.pointer[2] = pageTime();
      at(e, 1);
    };
    host.addEventListener('pointerenter', move);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    host.addEventListener('pointerdown', down);
    unpoint = () => {
      host.removeEventListener('pointerenter', move);
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
      host.removeEventListener('pointerdown', down);
      t.pointer[0] = t.pointer[1] = t.pointer[3] = 0;
      t.pointer[2] = -1;
      invalidate(t);
    };
  };

  // What it draws; a new scale or radius re-measures; `interactive` starts or stops the pointer.
  let scale: number | undefined;
  let radius: number | undefined;
  let interactive = false;
  const apply = (first: boolean) => {
    setFrag(t, p.frag);
    setParams(t, p.params);
    const animate = p.animate ?? true;
    if (t.time !== p.time || t.animate !== animate) {
      t.time = p.time;
      t.animate = animate;
      invalidate(t);
    }
    if (first || p.scale !== scale || p.radius !== radius) {
      scale = p.scale;
      radius = p.radius;
      resize();
    }
    const nextInteractive = p.interactive ?? false;
    if (nextInteractive !== interactive) {
      interactive = nextInteractive;
      unpoint?.();
      unpoint = undefined;
      if (interactive) point();
    }
  };
  apply(true);

  return {
    update(next) {
      p = next;
      apply(false);
    },
    destroy() {
      unpoint?.();
      unpoint = undefined;
      sizes.disconnect();
      ratio?.removeEventListener('change', onRatio);
      unregister(t);
    },
  };
}
