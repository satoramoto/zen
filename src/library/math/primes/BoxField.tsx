import { useMemo } from 'react';
import type { Param } from '../../components/core/Param/param';
import { Slider } from '../../components/core/Slider/Slider';
import { useControlled } from '../fourier/useControlled';
import { boxField } from './model/fields';
import { clampCount, firstPrimes } from './model/primes';
import { Caption, CountSlider, many, signed, Raster, stepKeys } from './parts';
import './primes.css';

export interface BoxFieldProps {
  /** How many primes, 1 to 2,000. Default 300. */
  count?: number;
  onCount?(n: number): void;
  /** Pixels across, 64 to 384. Default 256. */
  resolution?: number;
  onResolution?(px: number): void;
}

export const MAX_BOX = 2000;
const RESOLUTION: Param = { kind: 'int', min: 64, max: 384, defaultValue: 256, steps: 11, name: 'Resolution' };

/**
 * The 1D waves made two-dimensional: prime p's standing wave in a square, cos(2π·p·x)·cos(2π·p·y),
 * summed over the first N primes and painted, positive in one hue, negative in another. It is
 * symmetric across both midlines and the diagonal because each term is; the fine texture changes
 * with the resolution, because the waves are far finer than a pixel.
 */
export function BoxField({ count: countProp, onCount, resolution: resolutionProp, onResolution }: BoxFieldProps) {
  const [countRaw, setCount] = useControlled(countProp, onCount, 300);
  const [resolutionRaw, setResolution] = useControlled(resolutionProp, onResolution, 256);
  const { count, clamped } = clampCount(countRaw, MAX_BOX);
  const res = Math.max(64, Math.min(384, Math.round(resolutionRaw / 32) * 32));
  const field = useMemo(() => boxField(firstPrimes(count), res), [count, res]);
  // Most of the field sits near 0 with a few strong points: scale by its spread so the texture shows.
  const gain = useMemo(() => {
    let s = 0;
    for (let i = 0; i < field.length; i++) s += field[i] * field[i];
    return 1 / Math.max(1e-6, 2.5 * Math.sqrt(s / field.length));
  }, [field]);
  const label = `${many(count)} primes' standing waves in a square, summed, at ${res} × ${res} pixels: symmetric across both midlines and the diagonal, positive and negative in two colours.`;
  const paint = (image: ImageData, [low, mid, high]: [number, number, number][]) => {
    const d = image.data;
    for (let i = 0; i < res * res; i++) {
      const [r, g, b] = signed(low, mid, high, field[i] * gain);
      d[i * 4] = r;
      d[i * 4 + 1] = g;
      d[i * 4 + 2] = b;
      d[i * 4 + 3] = 255;
    }
  };
  return (
    <div className="zen-primes">
      <Raster width={res} height={res} label={label} paint={paint} palette={['--hue-2', '--surface-2', '--hue-1']} deps={[field, gain, res]} />
      <div className="zen-primes__controls">
        <CountSlider value={count} max={MAX_BOX} onChange={setCount} />
        <Slider param={RESOLUTION} value={res} onChange={(v) => setResolution(Math.round(v / 32) * 32)} keyStep={stepKeys(32, 64, 384)} orientation="horizontal" layout="row" length="auto" name="Resolution" display={`${res} px`} />
        <Caption>
          {clamped ? `This figure stops at ${many(MAX_BOX)} primes. ` : ''}
          Each prime is a standing wave in the square, across and up at once. The picture is symmetric across both midlines and the diagonal because every single wave is: that symmetry is the
          square’s, not the primes’. The fine texture changes when you change the resolution, because the waves are much finer than a pixel.
        </Caption>
      </div>
    </div>
  );
}
