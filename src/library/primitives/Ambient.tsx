import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { AMBIENT_VARS } from '../contract';
import { easeFactor, oklabCss, regionBuffer, REGION_COUNT, sampleRegions, scratchBuffer, smoothToward, type Pixels } from './Ambient.model';

/** What an Ambient samples: a playing video, a canvas, an image, an image URL, or a function returning pixels (or null: no picture). */
export type AmbientSource = HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | string | (() => Pixels | null) | null | undefined;

export interface AmbientProps extends HTMLAttributes<HTMLDivElement> {
  source: AmbientSource;
  /** Samples a second; default 10. Halved (down to 1) while a sample costs over 1 ms. */
  rate?: number;
  /** The easing's time constant in ms; default 600. */
  smoothing?: number;
  /** Ease five times slower (at least 3 s) and sample at most twice a second: the app's Reduce flashing. `prefers-reduced-motion` does the same. */
  reduce?: boolean;
  /** The `--ambient-strength` it eases up to while it has a picture, 0–1; default 1. */
  strength?: number;
  children?: ReactNode;
}

/** The sampling canvas: small, so a sample is a few hundred pixels. */
const W = 16;
const H = 9;
/** A sample's budget in ms; over it, the rate halves. */
const BUDGET = 1;

/**
 * **Job.** Ambient light from a picture. It samples `source` into a 16 × 9 canvas `rate` times a
 * second, averages each region (`avg`, `left`, `right`, `top`, `bottom`, `centre`) in linear
 * light, eases the colours in OKLab, and writes them as the contract's `--ambient-*` variables on
 * its own element, so anything inside can tint by them (`AMBIENT_VARS` in `contract.ts`). Outside
 * one, the theme scope's neutral fallbacks hold, at strength 0.
 *
 * It pauses while the tab is hidden. A cross-origin picture it can't read (a tainted canvas) keeps
 * the last colours. Each step clamps its time, so nothing jumps after a pause. Under `reduce` or
 * `prefers-reduced-motion` the colours drift slowly instead.
 *
 * **Tuning knobs.** None: it writes only the contract's `--ambient-*` variables.
 */
export function Ambient({ source, rate = 10, smoothing = 600, reduce = false, strength = 1, className, children, ...rest }: AmbientProps) {
  const ref = useRef<HTMLDivElement>(null);
  const opts = useRef({ rate, smoothing, reduce, strength });
  opts.current = { rate, smoothing, reduce, strength };
  const fn = useRef<(() => Pixels | null) | null>(null);
  fn.current = typeof source === 'function' ? source : null;
  // Eased colours and strength outlive a source change, so a new picture eases in from the old.
  const state = useRef<{ current: Float32Array; target: Float32Array; level: number; seeded: boolean } | null>(null);
  if (!state.current) state.current = { current: regionBuffer(), target: regionBuffer(), level: 0, seeded: false };

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof document === 'undefined') return;
    const s = state.current!;
    const acc = scratchBuffer();
    const written: string[] = new Array(REGION_COUNT + 1).fill('');
    let ctx: CanvasRenderingContext2D | null = null;
    let tainted = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = 0;
    let slow = 1;
    let stopped = false;
    const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

    let image: HTMLImageElement | null = null;
    if (typeof source === 'string') {
      image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.src = source;
    }

    const canvas = (): CanvasRenderingContext2D | null => {
      if (ctx) return ctx;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      try {
        ctx = c.getContext('2d', { willReadFrequently: true });
      } catch {
        ctx = null;
      }
      return ctx;
    };

    /** Reads the picture into `s.target`; false when there's no picture to read. */
    const read = (): boolean => {
      if (typeof source === 'function') {
        const px = fn.current?.() ?? null;
        return px ? sampleRegions(px, s.target, acc) : false;
      }
      const drawable = image ?? source;
      if (!drawable || typeof drawable === 'string') return false;
      if (drawable instanceof HTMLVideoElement && drawable.readyState < 2) return s.seeded;
      if (drawable instanceof HTMLImageElement && !(drawable.complete && drawable.naturalWidth > 0)) return s.seeded;
      if (tainted) return s.seeded;
      const c = canvas();
      if (!c) return false;
      try {
        c.drawImage(drawable, 0, 0, W, H);
        return sampleRegions(c.getImageData(0, 0, W, H), s.target, acc);
      } catch {
        // A cross-origin picture taints the canvas: keep the last colours.
        tainted = true;
        return s.seeded;
      }
    };

    const write = () => {
      for (let k = 0; k <= REGION_COUNT; k++) {
        const v = k < REGION_COUNT ? (s.seeded ? oklabCss(s.current, k) : '') : s.level > 0.0005 ? s.level.toFixed(3) : '';
        if (v === written[k]) continue;
        written[k] = v;
        if (v) el.style.setProperty(AMBIENT_VARS[k], v);
        else el.style.removeProperty(AMBIENT_VARS[k]);
      }
    };

    const step = () => {
      timer = undefined;
      if (stopped || document.hidden) return;
      const o = opts.current;
      const calm = o.reduce || !!motion?.matches;
      const now = performance.now();
      const has = read();
      const cost = performance.now() - now;
      slow = cost > BUDGET ? Math.min(slow * 2, 16) : Math.max(1, slow / 1.25);
      if (has && !s.seeded) {
        s.current.set(s.target);
        s.seeded = true;
      }
      const hz = Math.max(1, Math.min(calm ? 2 : 60, o.rate)) / slow;
      const interval = 1000 / hz;
      // Clamped, so a stall (a hidden tab, a slow frame) eases on rather than jumps.
      const dt = last ? Math.min(now - last, Math.max(interval * 2, 250)) : 0;
      last = now;
      const tau = calm ? Math.max(o.smoothing * 5, 3000) : o.smoothing;
      const k = easeFactor(dt, tau);
      if (s.seeded) smoothToward(s.current, s.target, k);
      const goal = has ? Math.min(1, Math.max(0, o.strength)) : 0;
      s.level += (goal - s.level) * k;
      write();
      timer = setTimeout(step, interval);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
      } else if (timer === undefined) {
        last = 0;
        step();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    step();
    return () => {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      if (image) image.src = '';
    };
    // A function source is read through `fn`, so a new closure each render doesn't restart sampling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof source === 'function' ? 'function' : source]);

  return (
    <div ref={ref} className={`lib-ambient${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </div>
  );
}
