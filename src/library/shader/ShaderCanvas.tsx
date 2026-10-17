// The runner's canvas (docs/shader-graph.md, "ShaderCanvas").
import { useLayoutEffect, useRef } from 'react';
import { MAX_PARAMS, type ShaderCanvasProps } from './types';
import { invalidate, pageTime, register, setFrag, setParams, unregister, type ShaderTarget } from './context';

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

/**
 * **Job.** Draw one fragment shader behind a box: the runner a shader material rides. Every
 * ShaderCanvas on the page shares one WebGL2 context and one frame loop (`context.ts`); this
 * component is a plain 2D canvas that receives a copy of its frame, so a page can hold dozens.
 *
 * It sets the contract's uniforms: `uRes` and `uPx` from its backing size (CSS size × DPR capped
 * at 2 × `scale`), `uTime` from the page clock (or `time`, controlled), `uPointer` from the pointer
 * over its parent (`interactive`), `uRadius` (`radius`, or the parent's corner), `uTheme` and
 * `uDark` from its scope's `--surface-0`, `--text-1`, `--accent` and `--hue-1…4` (read on mount,
 * on resize and at most once a second), and `uParams` from `params`.
 *
 * It animates only while on screen and the tab is visible; with `animate={false}` or under
 * reduced motion it draws only when its frag, params, time, size or theme change. A GLSL failure
 * calls `onError` once per frag and draws nothing. It has no look of its own: the caller places
 * and sizes it (`className`, `style`), usually absolutely over its parent. Hidden from assistive
 * technology.
 */
export function ShaderCanvas({ frag, params, time, animate = true, scale = 0.5, radius, interactive = false, onError, ...rest }: ShaderCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const target = useRef<ShaderTarget | null>(null);
  const remeasure = useRef<(() => void) | undefined>(undefined);
  const live = useRef({ onError, radius, scale });

  useLayoutEffect(() => {
    live.current = { onError, radius, scale };
  });

  // Mount: build the target, register it, and keep its size, theme and radius current.
  useLayoutEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let cssW = 0;
    let cssH = 0;

    const t: ShaderTarget = {
      canvas,
      ctx,
      frag: null,
      params: new Float32Array(MAX_PARAMS),
      time: undefined,
      animate: true,
      px: dpr() * live.current.scale,
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
        const rad = live.current.radius ?? radiusOf(canvas.parentElement);
        if (dark !== t.dark || rad !== t.radius) changed = true;
        t.dark = dark;
        t.radius = rad;
        return changed;
      },
      onError: (message) => live.current.onError?.(message),
      visible: false,
      dirty: true,
      reported: new Set(),
    };

    const resize = () => {
      const px = dpr() * live.current.scale;
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
    target.current = t;
    register(t);
    remeasure.current = resize;
    return () => {
      remeasure.current = undefined;
      sizes.disconnect();
      ratio?.removeEventListener('change', onRatio);
      unregister(t);
      target.current = null;
    };
  }, []);

  // What it draws.
  useLayoutEffect(() => {
    const t = target.current;
    if (!t) return;
    setFrag(t, frag);
    setParams(t, params);
    if (t.time !== time || t.animate !== animate) {
      t.time = time;
      t.animate = animate;
      invalidate(t);
    }
  }, [frag, params, time, animate]);

  // Resolution and radius: re-measure.
  useLayoutEffect(() => {
    remeasure.current?.();
  }, [scale, radius]);

  // The pointer over the parent, in the coord units (CSS px / 100 from the canvas's top-left).
  useLayoutEffect(() => {
    const t = target.current;
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!t || !canvas || !host || !interactive) return;
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
    return () => {
      host.removeEventListener('pointerenter', move);
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
      host.removeEventListener('pointerdown', down);
      t.pointer[0] = t.pointer[1] = t.pointer[3] = 0;
      t.pointer[2] = -1;
      invalidate(t);
    };
  }, [interactive]);

  return <canvas ref={ref} aria-hidden {...rest} />;
}
