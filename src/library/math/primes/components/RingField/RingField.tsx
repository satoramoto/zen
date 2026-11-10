import { useMemo } from 'react';
import { Checkbox } from '../../../../components/Checkbox/Checkbox';
import type { Param } from '../../../../components/Param/param';
import { Slider } from '../../../../components/Slider/Slider';
import { useControlled } from '../../../fourier/useControlled';
import { averagedRadialProfile, radialProfile, spread } from '../../model/fields';
import { clampCount, firstPrimes, MAX_PRIMES } from '../../model/primes';
import { Caption, CountSlider, many, mix, Raster, stepKeys } from '../../parts';
import '../../primes.css';

export interface RingFieldProps {
  /** How many primes, 1 to 100,000. Default 20,000. */
  count?: number;
  onCount?(n: number): void;
  /** The radius at the disc's edge, 1 to 6. Default 3. */
  extent?: number;
  onExtent?(r: number): void;
  /** Pixels across the disc, 96 to 768. Default 384. */
  resolution?: number;
  onResolution?(px: number): void;
  /** Average each pixel over its own width instead of taking the value at its centre. Default false. */
  averaged?: boolean;
  onAveraged?(on: boolean): void;
}

const RESOLUTION: Param = { kind: 'int', min: 96, max: 768, defaultValue: 384, steps: 28, name: 'Resolution' };
const EXTENT: Param = { kind: 'int', min: 1, max: 6, defaultValue: 3, steps: 6, name: 'Radius at the edge' };

/**
 * Thousands of prime waves summed by radius: F(r) = (1/N)·Σ cos(2π·p·r), painted as a disc of
 * rings, light where the waves agree and dark where they cancel. The rings at whole numbers (every
 * wave is at a crest) and halves (every odd prime is in a trough) are the arithmetic's. Each pixel
 * shows the field at its own radius, as a plain plot does: thin rings there, flat grey between,
 * where thousands of waves cancel. Averaged over each pixel's width, the waves finer than a pixel
 * cancel out and the slow waves of the smallest primes are left: rings at other simple fractions
 * appear too. The video's cross and moiré near the centre are not made by this construction.
 */
export function RingField({
  count: countProp,
  onCount,
  extent: extentProp,
  onExtent,
  resolution: resolutionProp,
  onResolution,
  averaged: averagedProp,
  onAveraged,
}: RingFieldProps) {
  const [countRaw, setCount] = useControlled(countProp, onCount, 20_000);
  const [extentRaw, setExtent] = useControlled(extentProp, onExtent, 3);
  const [resolutionRaw, setResolution] = useControlled(resolutionProp, onResolution, 384);
  const [averaged, setAveraged] = useControlled(averagedProp, onAveraged, false);
  const { count, clamped } = clampCount(countRaw, MAX_PRIMES);
  const extent = Math.max(1, Math.min(6, Math.round(extentRaw)));
  // An even number of pixels, so the centre falls between four.
  const res = Math.max(96, Math.min(768, Math.round(resolutionRaw / 2) * 2));
  const half = res / 2;
  // One profile sample per pixel of radius, out to the corner: the value at that radius, or its
  // mean over the pixel's width (each wave weighted by sinc(p·width), so the fine ones average away).
  const profile = useMemo(() => {
    const primes = firstPrimes(count);
    const step = extent / half;
    const reach = Math.ceil(half * Math.SQRT2) + 2;
    return averaged ? averagedRadialProfile(primes, step, reach) : radialProfile(primes, step * (reach - 1), reach);
  }, [count, extent, half, averaged]);
  // The averaged rings are faint (the fine waves cancel): scale the paint to the profile's own range.
  const scale = useMemo(() => spread(profile), [profile]);
  const label =
    `${many(count)} prime waves summed by radius, out to radius ${extent}, at ${res} × ${res} pixels${averaged ? ', each pixel averaged over its width' : ', each pixel taking the value at its centre'}: ` +
    `bright rings at whole-number radii, dark rings at halves${averaged ? ', and fainter rings at other simple fractions' : ', flat grey between'}.`;
  const paint = (image: ImageData, [ink, paper]: [number, number, number][]) => {
    const d = image.data;
    for (let i = 0; i < res; i++)
      for (let j = 0; j < res; j++) {
        const dx = j - half + 0.5;
        const dy = i - half + 0.5;
        const rPx = Math.hypot(dx, dy);
        const o = (i * res + j) * 4;
        if (rPx > half) {
          d[o + 3] = 0;
          continue;
        }
        // Between the two profile samples either side of the pixel's radius.
        const k = Math.floor(rPx);
        const t = rPx - k;
        const v = profile[k] * (1 - t) + profile[k + 1] * t;
        const [r, g, b] = mix(ink, paper, (Math.max(-1, Math.min(1, v / scale)) + 1) / 2);
        d[o] = r;
        d[o + 1] = g;
        d[o + 2] = b;
        d[o + 3] = 255;
      }
  };
  return (
    <div className="zen-primes">
      <Raster width={res} height={res} label={label} paint={paint} palette={['--text-1', '--surface-1']} deps={[profile, res, averaged, scale]} shape="disc" />
      <div className="zen-primes__controls">
        <CountSlider value={count} max={MAX_PRIMES} onChange={setCount} />
        <Slider param={RESOLUTION} value={res} onChange={(v) => setResolution(Math.round(v / 2) * 2)} keyStep={stepKeys(32, 96, 768)} orientation="horizontal" layout="row" length="auto" name="Resolution" display={`${res} px`} />
        <Slider param={EXTENT} value={extent} onChange={(v) => setExtent(Math.round(v))} orientation="horizontal" layout="row" length="auto" name="Radius at the edge" display={String(extent)} />
        <div className="zen-primes__row">
          <Checkbox checked={averaged} onChange={setAveraged} size="small">
            Average each pixel
          </Checkbox>
        </div>
        <Caption>
          {clamped ? `This figure stops at ${many(MAX_PRIMES)} primes. ` : ''}
          The bright rings at whole numbers and dark rings at halves are the arithmetic: at a whole-number radius every wave is at a crest, and at a half every prime but 2 is odd, so every
          other wave is in a trough.{' '}
          {averaged
            ? 'Averaged over each pixel, the waves finer than a pixel cancel out, and the slow waves of the smallest primes are left: they line up at other simple fractions too, a third, a quarter, a sixth, and draw rings there.'
            : 'Between those rings the thousands of waves cancel to flat grey. Each pixel shows the field at its own radius; tick Average each pixel to see what a pixel’s width holds.'}{' '}
          The video’s pictures also show a cross and moiré near the centre; this construction does not make them, and the video does not give its own.
        </Caption>
      </div>
    </div>
  );
}
