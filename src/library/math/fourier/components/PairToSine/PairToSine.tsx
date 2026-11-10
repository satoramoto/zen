import { useControlled } from '../../useControlled';
import { Button } from '../../../../components/Button/Button';
import type { Param } from '../../../../components/Param/param';
import { Slider } from '../../../../components/Slider/Slider';
import { Stack } from '../../../../primitives/Stack/Stack';
import { Text } from '../../../../primitives/Text/Text';
import { add, conj, mul, polar, turn, ZERO } from '../../model/complex';
import { Arrow, Dot, frame, Orbit, Plane } from '../Plane/Plane';
import { useClock } from '../../useClock';
import '../../fourier.css';

export interface PairToSineProps {
  /** The pair's frequency, 1 to 6: one arrow turns `n` times anticlockwise, the other `n` times clockwise. Default 1. */
  frequency?: number;
  onFrequency?(n: number): void;
  /** The coefficient's starting angle in degrees; its mirror is the other arrow's. Default 0. */
  angle?: number;
  onAngle?(deg: number): void;
  autoplay?: boolean;
}

const FREQ: Param = { kind: 'int', min: 1, max: 6, defaultValue: 1, steps: 6, name: 'Frequency', shortName: 'n' };
const ANGLE: Param = { kind: 'int', min: -180, max: 180, defaultValue: 0, steps: 361, name: 'Starting angle', shortName: '∠c' };
const GW = 360;
const GH = 150;
const PAD = 12;

/**
 * Two arrows of the same size turning opposite ways, one's coefficient the mirror of the
 * other's: their sum never leaves the real line, and there it goes back and forth as a cosine.
 * This is what a real-valued wave looks like from the drawing's point of view: a very flat
 * drawing. The graph beside it is the usual picture, the real part against time.
 */
export function PairToSine({ frequency: freqProp, onFrequency, angle: angleProp, onAngle, autoplay = false }: PairToSineProps) {
  const [freqRaw, setFreq] = useControlled(freqProp, onFrequency, 1);
  const [angleRaw, setAngle] = useControlled(angleProp, onAngle, 0);
  const n = Math.round(freqRaw);
  const deg = Math.round(angleRaw);
  const clock = useClock(8, autoplay);
  const c = polar(0.5, (deg * Math.PI) / 180);
  const a = mul(c, turn(n, clock.t));
  const b = mul(conj(c), turn(-n, clock.t));
  const sum = add(a, b);
  const f = frame(220, 1.25);
  const real = (t: number) => Math.cos(n * 2 * Math.PI * t + (deg * Math.PI) / 180);
  const gx = (t: number) => PAD + t * (GW - 2 * PAD);
  const gy = (y: number) => GH / 2 - y * (GH / 2 - PAD);
  const soFar = Array.from({ length: Math.floor(clock.t * 200) + 1 }, (_, i) => {
    const t = i / 200;
    return `${i === 0 ? 'M' : 'L'}${gx(t).toFixed(1)} ${gy(real(t)).toFixed(1)}`;
  }).join('');
  return (
    <div className="zen-fourier">
      <div className="zen-fourier__panes">
        <Plane f={f} unitCircle label={`Two arrows turning ${n} times each way; their sum is on the real line at ${sum.re.toFixed(2)}`}>
          <Orbit f={f} centre={ZERO} radius={0.5} />
          <Arrow f={f} from={ZERO} to={a} className="zen-fourier__arrow zen-fourier__arrow--lit" />
          <Arrow f={f} from={a} to={sum} className="zen-fourier__arrow zen-fourier__arrow--second" />
          <Dot f={f} at={sum} className="zen-fourier__dot--centre" r={4.5} />
        </Plane>
        <svg viewBox={`0 0 ${GW} ${GH}`} className="zen-fourier__graph" role="img" aria-label={`The sum's real part against time: a cosine with ${n} cycles`}>
          <line x1={PAD} y1={GH / 2} x2={GW - PAD} y2={GH / 2} className="zen-fourier__axis" />
          <path d={Array.from({ length: 201 }, (_, i) => `${i === 0 ? 'M' : 'L'}${gx(i / 200).toFixed(1)} ${gy(real(i / 200)).toFixed(1)}`).join('')} className="zen-fourier__trace--faint" />
          <path d={soFar} className="zen-fourier__trace" />
          <circle cx={gx(clock.t)} cy={gy(sum.re)} r={4.5} className="zen-fourier__dot--centre" />
        </svg>
      </div>
      <div className="zen-fourier__controls">
        <Slider param={FREQ} value={n} onChange={(v) => setFreq(Math.round(v))} orientation="horizontal" layout="row" length="auto" name="Frequency" display={String(n)} />
        <Slider param={ANGLE} value={deg} onChange={(v) => setAngle(Math.round(v))} orientation="horizontal" layout="row" length="auto" name="Starting angle" display={`${deg}°`} />
        <Stack direction="row" gap={2} wrap align="center">
          <Button label={clock.playing ? 'Pause' : 'Play'} on={clock.playing} onPress={clock.toggle} />
          <Text role="caption" tone="secondary" aria-live="polite">
            The sum stays on the real line: cos({n === 1 ? '2πt' : `${n}·2πt`}{deg ? ` ${deg > 0 ? '+' : '−'} ${Math.abs(deg)}°` : ''}), {n} cycle{n === 1 ? '' : 's'} per turn of the clock.
          </Text>
        </Stack>
      </div>
    </div>
  );
}
