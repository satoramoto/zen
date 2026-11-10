import { useMemo } from 'react';
import { useControlled } from '../../useControlled';
import { Button } from '../../../../components/Button/Button';
import type { Param } from '../../../../components/Param/param';
import { Select } from '../../../../components/Select/Select';
import { Slider } from '../../../../components/Slider/Slider';
import { Stack } from '../../../../primitives/Stack/Stack';
import { Text } from '../../../../primitives/Text/Text';
import { bySize, chain, PATH_NAMES, PATHS, samplePath, series, trace, type PathName } from '../../model/fourier';
import { Arrow, Dot, frame, Orbit, Plane, Trace } from '../Plane/Plane';
import { useClock } from '../../useClock';
import '../../fourier.css';

export interface EpicyclesProps {
  /** The drawing to take apart. Default the heart. */
  path?: PathName;
  onPath?(path: PathName): void;
  /** How many arrows, 1 to 101 (odd: the still one and pairs turning each way). Default 21. */
  arrows?: number;
  onArrows?(arrows: number): void;
  /** Seconds per cycle of the drawing. Default 12. */
  period?: number;
  /** Start playing. Default no. */
  autoplay?: boolean;
}

const ARROWS: Param = { kind: 'int', min: 1, max: 101, defaultValue: 21, steps: 51, name: 'Arrows', shortName: 'arrows' };
const SAMPLES = 1024;

/**
 * Arrows tip to tail, each turning a whole number of times per cycle, the last tip drawing the
 * shape: a complex Fourier series. The arrows' starting sizes and angles are the coefficients,
 * found from the drawing; with more arrows the trace closes in on it.
 */
export function Epicycles({ path: pathProp, onPath, arrows: arrowsProp, onArrows, period = 12, autoplay = false }: EpicyclesProps) {
  const [path, setPath] = useControlled<PathName>(pathProp, onPath, 'heart');
  const [arrowsRaw, setArrowsRaw] = useControlled(arrowsProp, onArrows, 21);
  const arrows = Math.max(1, Math.min(101, Math.round(arrowsRaw)));
  const setArrows = (v: number) => setArrowsRaw(Math.max(1, Math.min(101, Math.round(v) | 1)));
  const clock = useClock(period, autoplay);
  const terms = useMemo(() => bySize(series(samplePath(PATHS[path], SAMPLES), (arrows - 1) / 2)), [path, arrows]);
  const drawn = useMemo(() => trace(terms, 400), [terms]);
  const target = useMemo(() => samplePath(PATHS[path], 400), [path]);
  const joints = chain(terms, clock.t);
  const f = frame(320, 1.6);
  const soFar = drawn.slice(0, Math.floor(clock.t * 400) + 1);
  return (
    <div className="zen-fourier">
      <Plane f={f} label={`${arrows} arrows drawing the ${path}, at ${(clock.t * 100).toFixed(0)}% of the cycle`}>
        <Trace f={f} points={target} className="zen-fourier__trace--faint" closed />
        {joints.slice(0, -1).map((from, i) => (
          <Orbit key={`o${i}`} f={f} centre={from} radius={Math.hypot(joints[i + 1].re - from.re, joints[i + 1].im - from.im)} />
        ))}
        {joints.slice(0, -1).map((from, i) => (
          <Arrow key={`a${i}`} f={f} from={from} to={joints[i + 1]} className={i === joints.length - 2 ? 'zen-fourier__arrow zen-fourier__arrow--lit' : 'zen-fourier__arrow'} />
        ))}
        <Trace f={f} points={soFar} />
        <Dot f={f} at={joints[joints.length - 1]} />
      </Plane>
      <div className="zen-fourier__controls">
        <Slider param={ARROWS} value={arrows} onChange={setArrows} orientation="horizontal" layout="row" length="auto" name="Arrows" display={String(arrows)} />
        <Stack direction="row" gap={2} wrap align="center">
          <Button label={clock.playing ? 'Pause' : 'Play'} on={clock.playing} onPress={clock.toggle} />
          <Select items={PATH_NAMES} index={PATH_NAMES.indexOf(path)} onChange={(i) => setPath(PATH_NAMES[i])} label="Drawing" name="Drawing" />
          <Text role="caption" tone="muted" aria-live="polite">
            {arrows === 1 ? 'One still arrow: the drawing’s centre.' : `${arrows} arrows: the still one and ${(arrows - 1) / 2} pairs turning each way.`}
          </Text>
        </Stack>
      </div>
    </div>
  );
}
