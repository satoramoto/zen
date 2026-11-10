import { useMemo } from 'react';
import { useControlled } from '../../useControlled';
import { Button } from '../../../../components/Button/Button';
import type { Param } from '../../../../components/Param/param';
import { Select } from '../../../../components/Select/Select';
import { Slider } from '../../../../components/Slider/Slider';
import { Stack } from '../../../../primitives/Stack/Stack';
import { Text } from '../../../../primitives/Text/Text';
import { mul, turn, type Complex } from '../../model/complex';
import { coefficient, PATH_NAMES, PATHS, samplePath, type PathName } from '../../model/fourier';
import { Arrow, describe, Dot, frame, Plane, Trace } from '../Plane/Plane';
import { useClock } from '../../useClock';
import '../../fourier.css';

export interface CoefficientFinderProps {
  path?: PathName;
  onPath?(path: PathName): void;
  /** Which arrow to find, −5 to 5. Default 0: the centre. */
  turns?: number;
  onTurns?(n: number): void;
  /** Draw the drawing spun back by `n` turns (the second pane). Default yes. */
  unspin?: boolean;
  autoplay?: boolean;
}

const TURNS: Param = { kind: 'int', min: -5, max: 5, defaultValue: 0, steps: 11, name: 'Which arrow', shortName: 'n' };
const SAMPLES = 400;

/**
 * How a coefficient is found. The centre of the drawing is its average point, and that is c₀,
 * because every turning arrow averages to nothing over a whole cycle. For any other `n`, first
 * spin the whole drawing back by `n` turns: the arrow that turned `n` times now holds still and
 * every other one still makes whole turns, so the average of the spun drawing is cₙ. The dots
 * run through both drawings at the same time; the marked point is the average.
 */
export function CoefficientFinder({ path: pathProp, onPath, turns: turnsProp, onTurns, unspin = true, autoplay = false }: CoefficientFinderProps) {
  const [path, setPath] = useControlled<PathName>(pathProp, onPath, 'heart');
  const [turnsRaw, setTurns] = useControlled(turnsProp, onTurns, 0);
  const n = Math.round(turnsRaw);
  const clock = useClock(10, autoplay);
  const samples = useMemo(() => samplePath(PATHS[path], SAMPLES), [path]);
  const spun = useMemo(() => samples.map((z, i) => mul(z, turn(-n, i / SAMPLES))), [samples, n]);
  const c = useMemo(() => coefficient(samples, n), [samples, n]);
  const c0 = useMemo(() => coefficient(samples, 0), [samples]);
  const at = Math.min(SAMPLES - 1, Math.floor(clock.t * SAMPLES));
  const f = frame(220, 1.6);
  const pane = (points: Complex[], centre: Complex, label: string, lit: boolean) => (
    <Plane f={f} label={label}>
      <Trace f={f} points={points} className={lit ? 'zen-fourier__trace--second' : 'zen-fourier__trace--faint'} closed />
      <Dot f={f} at={points[at]} className={lit ? 'zen-fourier__dot--second' : 'zen-fourier__dot'} />
      <Arrow f={f} from={{ re: 0, im: 0 }} to={centre} className="zen-fourier__arrow zen-fourier__arrow--lit" />
      <Dot f={f} at={centre} className="zen-fourier__dot--centre" r={4.5} />
    </Plane>
  );
  return (
    <div className="zen-fourier">
      <div className="zen-fourier__panes">
        {pane(samples, c0, `The ${path}; its average point, c₀, has ${describe(c0)}`, false)}
        {unspin && pane(spun, c, `The ${path} spun back ${n} turn${Math.abs(n) === 1 ? '' : 's'}; its average point, c${n}, has ${describe(c)}`, true)}
      </div>
      <div className="zen-fourier__controls">
        <Slider param={TURNS} value={n} onChange={(v) => setTurns(Math.round(v))} orientation="horizontal" layout="row" length="auto" name="Which arrow" display={String(n)} />
        <Stack direction="row" gap={2} wrap align="center">
          <Button label={clock.playing ? 'Pause' : 'Play'} on={clock.playing} onPress={clock.toggle} />
          <Select items={PATH_NAMES} index={PATH_NAMES.indexOf(path)} onChange={(i) => setPath(PATH_NAMES[i])} label="Drawing" name="Drawing" />
          <Text role="caption" tone="secondary" aria-live="polite">
            {n === 0
              ? `The average of the drawing is c₀: ${describe(c0)}.`
              : `Spun back ${n} turn${Math.abs(n) === 1 ? '' : 's'}, the drawing's average is c${n}: ${describe(c)}.`}
          </Text>
        </Stack>
      </div>
    </div>
  );
}
