import { useControlled } from '../../useControlled';
import type { Param } from '../../../../components/Param/param';
import { Slider } from '../../../../components/Slider/Slider';
import { Text } from '../../../../primitives/Text/Text';
import { step, stepCoefficient, stepPartial } from '../../model/fourier';
import '../../fourier.css';

export interface StepSeriesProps {
  /** How many cosines are added, 1 to 60. Default 3. */
  terms?: number;
  onTerms?(terms: number): void;
  /** Where on the rod to watch the sum close in, 0 to 1. Default 0.25. */
  probe?: number;
  onProbe?(x: number): void;
}

const TERMS: Param = { kind: 'int', min: 1, max: 60, defaultValue: 3, steps: 60, name: 'Cosines', shortName: 'terms' };
const PROBE: Param = { kind: 'float', min: 0, max: 1, defaultValue: 0.25, name: 'Probe', shortName: 'x' };
const W = 360;
const H = 180;
const PAD = 14;
const STEPS = 400;
const px = (x: number) => PAD + x * (W - 2 * PAD);
const py = (y: number) => H / 2 - y * (H / 2 - PAD) * 0.8;

function curve(y: (x: number) => number): string {
  let d = '';
  for (let i = 0; i <= STEPS; i++) {
    const x = i / STEPS;
    d += `${i === 0 ? 'M' : 'L'}${px(x).toFixed(1)} ${py(y(x)).toFixed(1)}`;
  }
  return d;
}

/**
 * The step (1 on the left half of the rod, −1 on the right) and its cosine series cut off after
 * some number of terms. The probe watches one point: the list is the sequence of partial sums
 * there, closing in on 1, on −1, or, at the jump itself, staying at 0.
 */
export function StepSeries({ terms: termsProp, onTerms, probe: probeProp, onProbe }: StepSeriesProps) {
  const [termsRaw, setTermsRaw] = useControlled(termsProp, onTerms, 3);
  const [probeRaw, setProbe] = useControlled(probeProp, onProbe, 0.25);
  const terms = Math.max(1, Math.min(60, Math.round(termsRaw)));
  const x = Math.max(0, Math.min(1, probeRaw));
  const setTerms = (v: number) => setTermsRaw(Math.round(v));
  const sequence = Array.from({ length: terms }, (_, k) => stepPartial(x, k + 1));
  const value = sequence[terms - 1];
  const heading = x < 0.5 ? 1 : x > 0.5 ? -1 : 0;
  return (
    <div className="zen-fourier">
      <svg viewBox={`0 0 ${W} ${H}`} className="zen-fourier__graph" role="img" aria-label={`The step and its first ${terms} cosines; at x = ${x.toFixed(2)} the sum is ${value.toFixed(3)}`}>
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} className="zen-fourier__axis" />
        <path d={`M${px(0)} ${py(1)} L${px(0.5)} ${py(1)} M${px(0.5)} ${py(-1)} L${px(1)} ${py(-1)}`} className="zen-fourier__trace--faint" />
        {terms > 1 && <path d={curve((v) => stepPartial(v, terms - 1))} className="zen-fourier__trace--mode" />}
        <path d={curve((v) => stepPartial(v, terms))} className="zen-fourier__trace" />
        <line x1={px(x)} y1={PAD} x2={px(x)} y2={H - PAD} className="zen-fourier__probe" />
        <circle cx={px(x)} cy={py(value)} r={4} className="zen-fourier__dot--probe" />
        <circle cx={px(x)} cy={py(step(x))} r={3} className="zen-fourier__dot--centre" />
      </svg>
      <div className="zen-fourier__controls">
        <Slider param={TERMS} value={terms} onChange={setTerms} orientation="horizontal" layout="row" length="auto" name="Cosines" display={String(terms)} />
        <Slider param={PROBE} value={x} onChange={setProbe} orientation="horizontal" layout="row" length="auto" name="Probe x" display={x.toFixed(2)} />
        <Text role="caption" tone="secondary" aria-live="polite">
          Latest cosine: {stepCoefficient(terms - 1).toFixed(3)} · cos({2 * terms - 1}πx). At x = {x.toFixed(2)} the sums head for {heading}:
        </Text>
        <ol className="zen-fourier__sequence" aria-label={`Partial sums at x = ${x.toFixed(2)}`}>
          {sequence.slice(-12).map((s, i) => (
            <li key={i}>
              <Text role="caption" tone={i === Math.min(12, terms) - 1 ? 'accent' : 'muted'} tabular>
                {s.toFixed(3)}
              </Text>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
