import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../../../components/Button/Button';
import { Segmented } from '../../../../components/Segmented/Segmented';
import { useControlled } from '../../../fourier/useControlled';
import { MeshView } from '../../../lab/components/MeshView/MeshView';
import type { TriangleMesh } from '../../../lab/geometry';
import { boxField, planeMesh, spread, sphereMesh, type Ramp } from '../../model/fields';
import { clampCount, firstPrimes } from '../../model/primes';
import { Caption, CountSlider, many, Raster, signed, usePalette, type Rgb } from '../../parts';
import '../../../lab/lab.css';
import '../../primes.css';

export type FieldShapeKind = 'plane' | 'sphere';

export interface FieldShapeProps {
  /** How many primes, from 2 up: 1 to 2,000. Default 200. */
  count?: number;
  onCount?(n: number): void;
  /** The box field as a height surface, or wrapped onto a sphere. Default 'plane'. */
  shape?: FieldShapeKind;
  onShape?(shape: FieldShapeKind): void;
  /** Turn about the vertical (polar) axis, in degrees, 0–359. Default 30. */
  turn?: number;
  onTurn?(degrees: number): void;
  /** Tilt towards the viewer, in degrees, −60 to 60. Default 20. */
  tilt?: number;
  onTilt?(degrees: number): void;
}

export const MAX_SHAPE = 2000;
const R = 96;
const FLAT = 192;
const PALETTE = ['--hue-2', '--surface-2', '--hue-1'];
const GREY: Rgb = [128, 128, 128];
const unit = (c: Rgb | undefined): [number, number, number] => {
  const [r, g, b] = c ?? GREY;
  return [r / 255, g / 255, b / 255];
};
const wrapTurn = (d: number) => ((Math.round(d) % 360) + 360) % 360;
const clampTilt = (d: number) => Math.max(-60, Math.min(60, Math.round(d)));

/** Tilt a mesh's positions about the x axis (towards the viewer), the same way the sphere is tilted. */
function tilted(mesh: TriangleMesh, radians: number): TriangleMesh {
  if (!radians) return mesh;
  const [c, s] = [Math.cos(radians), Math.sin(radians)];
  const positions = mesh.positions.slice();
  for (let k = 0; k < positions.length; k += 3) {
    const [y, z] = [positions[k + 1], positions[k + 2]];
    positions[k + 1] = y * c - z * s;
    positions[k + 2] = y * s + z * c;
  }
  return { ...mesh, positions };
}

/**
 * The box field G(x, y) = (1/N) Σ cos(2πpx)·cos(2πpy) in 3D: as a height surface (height and
 * colour from the value) or, by the switch, the same values wrapped onto a sphere (x round the
 * equator, y from pole to pole, radius 1 + ε·G). Drag to orbit; the turn and tilt buttons rotate
 * the mesh itself, for the keyboard. Without WebGL the flat field is drawn as a raster as well.
 */
export function FieldShape({ count: countProp, onCount, shape: shapeProp, onShape, turn: turnProp, onTurn, tilt: tiltProp, onTilt }: FieldShapeProps) {
  const [countRaw, setCount] = useControlled(countProp, onCount, 200);
  const [shape, setShape] = useControlled(shapeProp, onShape, 'plane' as FieldShapeKind);
  const [turnRaw, setTurn] = useControlled(turnProp, onTurn, 30);
  const [tiltRaw, setTilt] = useControlled(tiltProp, onTilt, 20);
  const { count, clamped } = clampCount(countRaw, MAX_SHAPE);
  const turn = wrapTurn(turnRaw);
  const tilt = clampTilt(tiltRaw);
  const sphere = shape === 'sphere';

  const { colors, swatches } = usePalette(PALETTE);
  const ramp = useMemo<Ramp>(() => ({ low: unit(colors[0]), mid: unit(colors[1]), high: unit(colors[2]) }), [colors]);
  const field = useMemo(() => boxField(firstPrimes(count), R), [count]);
  const mesh = useMemo(() => {
    const rotation = (turn * Math.PI) / 180;
    const lean = (tilt * Math.PI) / 180;
    return sphere ? sphereMesh(field, R, ramp, 0.06, rotation, lean) : tilted(planeMesh(field, R, ramp, 0.6, rotation), lean);
  }, [field, ramp, sphere, turn, tilt]);

  // MeshView says on its root whether WebGL came up; anything but loading or ready means no 3D.
  const host = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const read = () => {
      const state = element.querySelector('[data-renderer-state]')?.getAttribute('data-renderer-state') ?? 'loading';
      setUnavailable(state !== 'loading' && state !== 'ready');
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(element, { subtree: true, attributes: true, attributeFilter: ['data-renderer-state'] });
    return () => observer.disconnect();
  }, []);

  const flat = useMemo(() => (unavailable ? boxField(firstPrimes(count), FLAT) : undefined), [unavailable, count]);
  const paintFlat = (image: ImageData, [low, mid, high]: Rgb[]) => {
    if (!flat) return;
    const s = spread(flat);
    for (let k = 0; k < flat.length; k++) {
      const [r, g, b] = signed(low, mid, high, flat[k] / s);
      image.data.set([r, g, b, 255], k * 4);
    }
  };

  const primesText = `${many(count)} prime${count === 1 ? "'s" : "s'"}`;
  const label = `${primesText} box field ${sphere ? 'on a sphere' : 'as a plane'}, turned ${turn}°, tilted ${tilt}°`;
  return (
    <div className="zen-primes" role="group" aria-label={label}>
      {swatches}
      <div ref={host}>
        <MeshView mesh={mesh} />
      </div>
      {flat && <Raster width={FLAT} height={FLAT} label={`${primesText} box field, drawn flat because 3D is unavailable`} paint={paintFlat} palette={PALETTE} deps={[flat]} />}
      <div className="zen-primes__controls">
        <CountSlider value={count} max={MAX_SHAPE} onChange={setCount} />
        <div className="zen-primes__row">
          <Segmented items={['Plane', 'Sphere']} index={sphere ? 1 : 0} onChange={(i) => setShape(i === 0 ? 'plane' : 'sphere')} label="Shape" />
          <Button label="Turn left" size="md" onPress={() => setTurn(wrapTurn(turn - 15))} />
          <Button label="Turn right" size="md" onPress={() => setTurn(wrapTurn(turn + 15))} />
          <Button label="Tilt up" size="md" onPress={() => setTilt(clampTilt(tilt - 10))} />
          <Button label="Tilt down" size="md" onPress={() => setTilt(clampTilt(tilt + 10))} />
        </div>
        <Caption>
          <span data-part="description">{label}.</span> {clamped ? `At most ${many(MAX_SHAPE)} primes here; showing ${many(MAX_SHAPE)}. ` : ''}
          The same values as the flat field, wrapped onto a sphere: across becomes round the equator, up becomes pole to pole. The sphere's neat symmetry comes from the wrapping, which joins the left edge to the right and squeezes the top and bottom rows into points.
        </Caption>
      </div>
    </div>
  );
}
