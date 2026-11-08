import { useEffect, useMemo, useState } from 'react';
import type { Param } from '../../components/core/Param/param';
import { Slider } from '../../components/core/Slider/Slider';
import { useControlled } from '../fourier/useControlled';
import { clampCount, firstPrimes, MAX_PRIMES } from './model/primes';
import { wrappedRadius } from './model/waves';
import { Caption, CountSlider, many, mix, Raster, type Rgb } from './parts';
import './primes.css';

export interface WrappedWavesProps {
  /** How many primes, from 2 up: 1 to 100,000 (more is clamped, and the caption says so). Default 4. */
  count?: number;
  onCount?(n: number): void;
  /** How far each wave swings off the unit circle: 0.02 to 0.3. Default 0.12. */
  amplitude?: number;
  onAmplitude?(a: number): void;
}

/** Up to this many primes the waves are drawn as separate curves; above it, as a density disc. */
export const MAX_CURVES = 60;
/** Above this many primes the density is built in chunks over animation frames, with a status. */
const CHUNKED = 5000;
/** Angles each curve is sampled at for the density disc. */
const SAMPLES = 720;
/** The density disc's pixels across (and down). */
const PIXELS = 400;
/** The radius the drawing frame reaches, in curve units: room for 1 + the largest amplitude. */
const REACH = 1.34;
const SVG = 400;
const AMPLITUDE: Param = { kind: 'float', min: 0.02, max: 0.3, defaultValue: 0.12, name: 'Amplitude' };
const PALETTE = ['--surface-1', '--text-1'];
/** The time the chunked density may take per animation frame, in milliseconds. */
const FRAME_BUDGET = 12;

const clampAmplitude = (a: number) => Math.max(AMPLITUDE.min, Math.min(AMPLITUDE.max, a));

/** The closed curve of prime p as an SVG path, in a square frame of `size` px. */
function curvePath(p: number, amplitude: number, size: number): string {
  const n = Math.min(2400, Math.max(360, p * 12));
  const scale = size / 2 / REACH;
  const c = size / 2;
  let d = '';
  for (let i = 0; i < n; i++) {
    const theta = (i / n) * 2 * Math.PI;
    const r = wrappedRadius(p, theta, amplitude) * scale;
    d += `${i ? 'L' : 'M'}${(c + r * Math.cos(theta)).toFixed(2)} ${(c - r * Math.sin(theta)).toFixed(2)}`;
  }
  return `${d}Z`;
}

/**
 * Add the curves of `primes[from…to)` to a PIXELS² density buffer, each sampled at SAMPLES angles.
 * Each curve's angles are offset by a fraction of a step (from the golden ratio), so the samples
 * of different primes don't all fall on the same 720 spokes.
 */
function accumulate(density: Float32Array, primes: Int32Array, amplitude: number, from: number, to: number) {
  const scale = PIXELS / 2 / REACH;
  const c = PIXELS / 2;
  const step = (2 * Math.PI) / SAMPLES;
  for (let i = from; i < to; i++) {
    const p = primes[i];
    const offset = ((p * 0.6180339887) % 1) * step;
    for (let k = 0; k < SAMPLES; k++) {
      const theta = k * step + offset;
      const r = wrappedRadius(p, theta, amplitude) * scale;
      const x = Math.floor(c + r * Math.cos(theta));
      const y = Math.floor(c - r * Math.sin(theta));
      if (x >= 0 && x < PIXELS && y >= 0 && y < PIXELS) density[y * PIXELS + x] += 1;
    }
  }
}

interface Disc {
  /** What the density was built for. */
  count: number;
  amplitude: number;
  density: Float32Array;
}

/**
 * Primes wrapped round a circle: prime p is the closed curve r(θ) = 1 + a·sin(pθ), p bumps round
 * the loop. Up to 60 primes each curve is drawn; above that, the same curves are counted into a
 * raster (how many pass through each spot), shaded from the surface to the text colour on a log
 * scale, which is the video's grey disc. Large counts are counted in chunks over animation frames.
 */
export function WrappedWaves({ count: countProp, onCount, amplitude: amplitudeProp, onAmplitude }: WrappedWavesProps) {
  const [countRaw, setCount] = useControlled(countProp, onCount, 4);
  const [amplitudeRaw, setAmplitude] = useControlled(amplitudeProp, onAmplitude, 0.12);
  const { count, clamped } = clampCount(countRaw, MAX_PRIMES);
  const amplitude = clampAmplitude(amplitudeRaw);
  const curves = count <= MAX_CURVES;
  const primes = useMemo(() => firstPrimes(count), [count]);
  const [disc, setDisc] = useState<Disc>();
  const [progress, setProgress] = useState<number>();

  useEffect(() => {
    if (curves) return;
    const density = new Float32Array(PIXELS * PIXELS);
    if (count <= CHUNKED) {
      accumulate(density, primes, amplitude, 0, count);
      setDisc({ count, amplitude, density });
      setProgress(undefined);
      return;
    }
    let done = 0;
    let frame = 0;
    setProgress(0);
    const work = () => {
      const start = performance.now();
      while (done < count && performance.now() - start < FRAME_BUDGET) {
        const next = Math.min(count, done + 200);
        accumulate(density, primes, amplitude, done, next);
        done = next;
      }
      if (done < count) {
        setProgress(done);
        frame = requestAnimationFrame(work);
      } else {
        setDisc({ count, amplitude, density });
        setProgress(undefined);
      }
    };
    frame = requestAnimationFrame(work);
    return () => cancelAnimationFrame(frame);
  }, [curves, count, amplitude, primes]);

  const drawing = !curves && (progress !== undefined || disc?.count !== count || disc?.amplitude !== amplitude);
  const names = primes.length <= 8 ? Array.from(primes).join(', ') : `${primes.slice(0, 4).join(', ')} … ${many(primes[primes.length - 1])}`;
  const waves = `${many(count)} prime${count === 1 ? '' : 's'}`;
  const label = curves
    ? `${waves} (${names}) as curves wrapped round a circle, each swinging ${amplitude.toFixed(2)} off it`
    : `${waves} (${names}) wrapped round a circle, shown as a shaded disc of ${many(count)} waves, stronger where more curves pass${drawing ? ' (still drawing)' : ''}`;

  const paint = (image: ImageData, [low, high]: Rgb[]) => {
    const data = image.data;
    const density = disc?.density;
    let max = 0;
    if (density) for (let i = 0; i < density.length; i++) if (density[i] > max) max = density[i];
    const norm = max > 0 ? Math.log1p(max) : 1;
    for (let i = 0; i < PIXELS * PIXELS; i++) {
      const t = density && max > 0 ? Math.log1p(density[i]) / norm : 0;
      const [r, g, b] = mix(low, high, t);
      data[i * 4] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = b;
      data[i * 4 + 3] = 255;
    }
  };

  const status = progress !== undefined ? `Drawing ${many(progress)} of ${many(count)} waves…` : drawing ? `Drawing ${many(count)} waves…` : '';
  const limit = clamped ? ` That is this figure's limit: it draws at most ${many(MAX_PRIMES)} waves.` : '';
  const caption = curves
    ? 'Each curve is one prime bent round a circle: prime p goes out and in p times on the way round, so no two primes trace the same loop.'
    : `${status || `${many(count)} waves, one per prime, all wrapped round the same circle.`} The shading shows how many curves pass through each spot: the stronger the shade, the more curves.${limit}`;

  return (
    <div className="zen-primes">
      {curves ? (
        <svg viewBox={`0 0 ${SVG} ${SVG}`} className="zen-primes__svg" role="img" aria-label={label}>
          <circle cx={SVG / 2} cy={SVG / 2} r={SVG / 2 / REACH} className="zen-primes__axis" fill="none" />
          {Array.from(primes, (p, i) => (
            <path key={p} d={curvePath(p, amplitude, SVG)} className="zen-primes__wave" opacity={Math.max(0.25, 1 - i / Math.max(4, primes.length))} />
          ))}
        </svg>
      ) : (
        <Raster width={PIXELS} height={PIXELS} label={label} paint={paint} palette={PALETTE} deps={[disc]} pixelated={false} shape="disc" />
      )}
      <div className="zen-primes__controls">
        <CountSlider value={count} max={MAX_PRIMES} onChange={setCount} />
        <Slider
          param={AMPLITUDE}
          value={amplitude}
          onChange={(v) => setAmplitude(clampAmplitude(v))}
          orientation="horizontal"
          layout="row"
          length="auto"
          name="Amplitude"
          display={amplitude.toFixed(2)}
        />
        <Caption>{caption}</Caption>
      </div>
    </div>
  );
}
