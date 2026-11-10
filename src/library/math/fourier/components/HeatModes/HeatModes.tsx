import { useEffect } from 'react';
import { useControlled } from '../../useControlled';
import { Button } from '../../../../components/Button/Button';
import type { Param } from '../../../../components/Param/param';
import { Slider } from '../../../../components/Slider/Slider';
import { Stack } from '../../../../primitives/Stack/Stack';
import { Text } from '../../../../primitives/Text/Text';
import { decayRate, heatMode, heatSum } from '../../model/fourier';
import { useClock } from '../../useClock';
import '../../fourier.css';

export interface HeatModesProps {
  /** Time since the rods met, 0 to 0.25. Default 0. */
  time?: number;
  onTime?(t: number): void;
  /** The starting height of each mode, mode 0 first. Default a lopsided bump. */
  amplitudes?: number[];
  /** Draw each mode on its own under the sum. Default yes. */
  showModes?: boolean;
}

const TIME: Param = { kind: 'float', min: 0, max: 0.25, defaultValue: 0, name: 'Time', shortName: 't' };
const DEFAULT_AMPLITUDES = [0.1, 0.8, -0.5, 0.35, 0.25];
const W = 360;
const H = 170;
const PAD = 14;
const STEPS = 120;

/** A curve y(x) over the rod, 0 to 1, as a path. */
function curve(y: (x: number) => number): string {
  let d = '';
  for (let i = 0; i <= STEPS; i++) {
    const x = i / STEPS;
    d += `${i === 0 ? 'M' : 'L'}${(PAD + x * (W - 2 * PAD)).toFixed(1)} ${(H / 2 - y(x) * (H / 2 - PAD)).toFixed(1)}`;
  }
  return d;
}

/**
 * Heat on a rod as a sum of cosine modes, each of which keeps its shape and only shrinks over
 * time, faster by the square of its frequency: so a profile built from several modes smooths
 * out as time passes, the wiggles dying first. Adding modes is allowed because the heat
 * equation is linear.
 */
export function HeatModes({ time: timeProp, onTime, amplitudes = DEFAULT_AMPLITUDES, showModes = true }: HeatModesProps) {
  const clock = useClock(6);
  const [held, setHeld] = useControlled(timeProp, onTime, 0);
  // While playing the clock is the time and reports it; otherwise the held value is.
  const t = clock.playing ? clock.t * TIME.max : held;
  const setT = (v: number) => {
    clock.pause();
    setHeld(v);
  };
  // A page holding the time hears the clock tick.
  useEffect(() => {
    if (clock.playing) onTime?.(clock.t * TIME.max);
  }, [clock.playing, clock.t]); // eslint-disable-line react-hooks/exhaustive-deps
  const alive = amplitudes.map((a, n) => Math.abs(a) * Math.exp(-decayRate(n) * t));
  return (
    <div className="zen-fourier">
      <svg viewBox={`0 0 ${W} ${H}`} className="zen-fourier__graph" role="img" aria-label={`Temperature along the rod after time ${t.toFixed(3)}: the sum of ${amplitudes.length} modes`}>
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} className="zen-fourier__axis" />
        {showModes && amplitudes.map((a, n) => <path key={n} d={curve((x) => a * heatMode(x, n, t))} className="zen-fourier__trace--mode" />)}
        <path d={curve((x) => heatSum(x, amplitudes, t))} className="zen-fourier__trace" />
      </svg>
      <div className="zen-fourier__controls">
        <Slider param={TIME} value={t} onChange={setT} orientation="horizontal" layout="row" length="auto" name="Time" display={t.toFixed(3)} />
        <Stack direction="row" gap={2} wrap align="center">
          <Button label={clock.playing ? 'Pause' : 'Play'} on={clock.playing} onPress={clock.toggle} />
          <Button label="Reset" variant="secondary" onPress={() => { clock.scrub(0); setT(0); }} />
        </Stack>
        <ul className="zen-fourier__sequence" aria-label="How much of each mode is left">
          {amplitudes.map((a, n) => (
            <li key={n}>
              <Text role="caption" tone={alive[n] > 0.02 ? 'primary' : 'muted'} tabular>
                mode {n}: {(100 * (a === 0 ? 0 : alive[n] / Math.abs(a))).toFixed(0)}%
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
