// Shared parts for the prime-wave figures: a slider for a prime count that steps through round
// numbers, and a canvas that paints with the contract's colours and repaints on a theme change.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Param } from '../../components/core/Param/param';
import { stepDetent, type ParamKeyStep } from '../../components/core/Param/paramGesture';
import { Slider } from '../../components/core/Slider/Slider';
import './primes.css';

/** Round numbers from 1 to 100,000, for the arrow keys to step a count through. */
export const COUNT_LADDER = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 5000, 8000, 10000, 15000, 20000, 30000, 50000, 75000, 100000];

/** The arrows step through the ladder (within `max`); Shift jumps three rungs. */
export const ladderKeys =
  (max: number): ParamKeyStep =>
  ({ key, shiftKey }, value) => {
    const way = key === 'ArrowRight' || key === 'ArrowUp' ? 1 : key === 'ArrowLeft' || key === 'ArrowDown' ? -1 : 0;
    if (!way) return undefined;
    const rungs = COUNT_LADDER.filter((v) => v <= max);
    if (!rungs.includes(max)) rungs.push(max);
    let next = value;
    for (let i = 0; i < (shiftKey ? 3 : 1); i++) next = stepDetent(rungs, next, way as 1 | -1);
    return next;
  };

/** Arrow keys move by `step` (Shift: four steps), so a slider over multiples of `step` actually moves. */
export const stepKeys =
  (step: number, min: number, max: number): ParamKeyStep =>
  ({ key, shiftKey }, value) => {
    const way = key === 'ArrowRight' || key === 'ArrowUp' ? 1 : key === 'ArrowLeft' || key === 'ArrowDown' ? -1 : 0;
    if (!way) return undefined;
    const next = Math.round(value / step) * step + way * step * (shiftKey ? 4 : 1);
    return Math.max(min, Math.min(max, next));
  };

/** A count slider, 1 to `max`, with more travel at the low end and the arrow keys on round numbers. */
export function CountSlider({ value, max, onChange, name = 'Primes', min = 1 }: { value: number; max: number; onChange(v: number): void; name?: string; min?: number }) {
  const param: Param = { kind: 'int', min, max, defaultValue: Math.min(max, 20), exponent: max > 1000 ? 4 : max > 100 ? 2.5 : 1.5, steps: max - min + 1, name };
  return (
    <Slider
      param={param}
      value={value}
      onChange={(v) => onChange(Math.max(min, Math.min(max, Math.round(v))))}
      keyStep={ladderKeys(max)}
      orientation="horizontal"
      layout="row"
      length="auto"
      name={name}
      display={value.toLocaleString('en')}
    />
  );
}

export type Rgb = [number, number, number];

/**
 * The contract colours named by `vars`, as RGB (0–255), read from the element's own computed
 * style and read again when anything up the tree changes its theme (style, class, data-mode,
 * data-theme). Render the returned swatches inside the figure so they resolve in its scope.
 */
export function usePalette(vars: string[]): { colors: Rgb[]; swatches: ReactNode } {
  const host = useRef<HTMLSpanElement>(null);
  const [colors, setColors] = useState<Rgb[]>([]);
  const key = vars.join(',');
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const probe = document.createElement('canvas').getContext('2d');
    const read = () => {
      const next = [...element.children].map((child): Rgb => {
        const css = getComputedStyle(child).color;
        if (!probe) return [128, 128, 128];
        probe.fillStyle = '#000';
        probe.fillStyle = css;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        return [r, g, b];
      });
      setColors((old) => (old.length === next.length && old.every((c, i) => c.join() === next[i].join()) ? old : next));
    };
    read();
    const observer = new MutationObserver(read);
    for (let node: HTMLElement | null = element; node; node = node.parentElement)
      observer.observe(node, { attributes: true, attributeFilter: ['style', 'class', 'data-mode', 'data-theme'] });
    const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : undefined;
    media?.addEventListener('change', read);
    return () => {
      observer.disconnect();
      media?.removeEventListener('change', read);
    };
  }, [key]);
  const swatches = (
    <span ref={host} className="zen-primes__swatches" aria-hidden="true">
      {vars.map((v) => (
        <i key={v} style={{ color: `var(${v})` }} />
      ))}
    </span>
  );
  return { colors, swatches };
}

/** Mix two RGB colours: t = 0 gives `a`, 1 gives `b`. */
export const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** A colour for a signed value in [−1, 1]: `low` below 0, `mid` at 0, `high` above. */
export const signed = (low: Rgb, mid: Rgb, high: Rgb, v: number): Rgb => (v < 0 ? mix(mid, low, Math.min(1, -v)) : mix(mid, high, Math.min(1, v)));

export interface RasterProps {
  /** Pixels across and down: the sampling resolution, shown scaled to the figure's width. */
  width: number;
  height: number;
  /** The drawing in words, for assistive technology. */
  label: string;
  /** Fill the image, given the palette. Called when the inputs (`deps`) or the palette change. */
  paint(image: ImageData, colors: Rgb[]): void;
  /** The contract colours `paint` receives, in order. */
  palette: string[];
  /** Repaint when any of these change. */
  deps: unknown[];
  /** Draw each pixel as a square (crisp) rather than smoothed: shows the sampling as it is. */
  pixelated?: boolean;
  /** A shape for the drawing: a disc clips to a circle. */
  shape?: 'square' | 'disc';
  /** Whether the content is the size of the box (the default) or wider. */
  className?: string;
}

/**
 * **Job.** A raster figure: an ImageData of `width` × `height`, painted by the caller with colours
 * read from the contract, scaled to the figure's width (pixelated, so the sampling shows as it is),
 * repainted when its inputs or the theme change. It is an image with a description.
 */
export function Raster({ width, height, label, paint, palette, deps, pixelated = true, shape = 'square', className = '' }: RasterProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { colors, swatches } = usePalette(palette);
  useEffect(() => {
    const c = canvas.current;
    if (!c || colors.length !== palette.length) return;
    const context = c.getContext('2d');
    if (!context) return;
    const image = context.createImageData(width, height);
    paint(image, colors);
    context.putImageData(image, 0, 0);
    c.dataset.painted = String(Number(c.dataset.painted ?? 0) + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors, width, height, ...deps]);
  return (
    <div className={`zen-primes__raster ${className}`} data-shape={shape}>
      {swatches}
      <canvas ref={canvas} width={width} height={height} className="zen-primes__canvas" data-pixelated={pixelated ? '' : undefined} role="img" aria-label={label} />
    </div>
  );
}

/** A caption under a figure, polite to assistive technology. */
export function Caption({ children }: { children: ReactNode }) {
  return (
    <p className="zen-primes__caption" aria-live="polite">
      {children}
    </p>
  );
}

/** A number in words for a description: "20,000". */
export const many = (n: number) => n.toLocaleString('en');
