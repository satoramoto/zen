import { useControlled } from '../../useControlled';
import { Button } from '../../../../components/Button/Button';
import type { Param } from '../../../../components/Param/param';
import { Slider } from '../../../../components/Slider/Slider';
import { Stack } from '../../../../primitives/Stack/Stack';
import { Text } from '../../../../primitives/Text/Text';
import { mul, polar, turn, ZERO } from '../../model/complex';
import { Arrow, describe, Dot, frame, Orbit, Plane } from '../Plane/Plane';
import { useClock } from '../../useClock';
import '../../fourier.css';

export interface RotatingVectorProps {
  /** Turns per cycle, −5 to 5; negative turns the other way. Default 1. */
  turns?: number;
  onTurns?(n: number): void;
  /** The coefficient's size, 0 to 1.5. Default 1. */
  size?: number;
  onSize?(r: number): void;
  /** The coefficient's angle in degrees, −180 to 180. Default 0. */
  angle?: number;
  onAngle?(deg: number): void;
  autoplay?: boolean;
}

const TURNS: Param = { kind: 'int', min: -5, max: 5, defaultValue: 1, steps: 11, name: 'Turns per cycle', shortName: 'n' };
const SIZE: Param = { kind: 'float', min: 0, max: 1.5, defaultValue: 1, name: 'Size', shortName: '|c|' };
const ANGLE: Param = { kind: 'int', min: -180, max: 180, defaultValue: 0, steps: 361, name: 'Starting angle', shortName: '∠c' };

/**
 * One term of the series: `c · e^{n·2πi·t}`. The unit arrow walks the circle `n` times per cycle;
 * the coefficient `c` sets where it starts (its angle) and how long it is (its size). Nothing
 * else about it ever changes.
 */
export function RotatingVector({ turns: turnsProp, onTurns, size: sizeProp, onSize, angle: angleProp, onAngle, autoplay = false }: RotatingVectorProps) {
  const [turnsRaw, setTurns] = useControlled(turnsProp, onTurns, 1);
  const [r, setSize] = useControlled(sizeProp, onSize, 1);
  const [angleRaw, setAngle] = useControlled(angleProp, onAngle, 0);
  const n = Math.round(turnsRaw);
  const deg = Math.round(angleRaw);
  const clock = useClock(6, autoplay);
  const c = polar(r, (deg * Math.PI) / 180);
  const z = mul(c, turn(n, clock.t));
  const f = frame(300, 1.7);
  const ticks = Array.from({ length: Math.max(1, Math.abs(n) * 8) }, (_, i) => mul(c, turn(n, (i / Math.max(1, Math.abs(n) * 8)) * Math.min(clock.t, 1))));
  return (
    <div className="zen-fourier">
      <Plane f={f} unitCircle label={`An arrow of size ${r.toFixed(2)} starting at ${deg}°, turning ${n} times per cycle; now at ${(clock.t * 100).toFixed(0)}% of the cycle`}>
        <Orbit f={f} centre={ZERO} radius={r} />
        <Arrow f={f} from={ZERO} to={c} className="zen-fourier__arrow zen-fourier__arrow--second" />
        {ticks.map((p, i) => (
          <Dot key={i} f={f} at={p} r={1.5} className="zen-fourier__dot--second" />
        ))}
        <Arrow f={f} from={ZERO} to={z} className="zen-fourier__arrow zen-fourier__arrow--lit" />
        <Dot f={f} at={z} />
        <text x={f.x(c) + 6} y={f.y(c) - 6} className="zen-fourier__label">
          c
        </text>
      </Plane>
      <div className="zen-fourier__controls">
        <Slider param={TURNS} value={n} onChange={(v) => setTurns(Math.round(v))} orientation="horizontal" layout="row" length="auto" name="Turns per cycle" display={String(n)} />
        <Slider param={SIZE} value={r} onChange={setSize} orientation="horizontal" layout="row" length="auto" name="Size" display={r.toFixed(2)} />
        <Slider param={ANGLE} value={deg} onChange={(v) => setAngle(Math.round(v))} orientation="horizontal" layout="row" length="auto" name="Starting angle" display={`${deg}°`} />
        <Stack direction="row" gap={2} wrap align="center">
          <Button label={clock.playing ? 'Pause' : 'Play'} on={clock.playing} onPress={clock.toggle} />
          <Text role="caption" tone="secondary" aria-live="polite">
            c has {describe(c)}; the arrow {n === 0 ? 'never moves' : `turns ${Math.abs(n)} time${Math.abs(n) === 1 ? '' : 's'} ${n > 0 ? 'anticlockwise' : 'clockwise'} per cycle`}.
          </Text>
        </Stack>
      </div>
    </div>
  );
}
