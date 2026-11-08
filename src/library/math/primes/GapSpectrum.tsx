import { useMemo } from 'react';
import { Checkbox } from '../../components/core/Checkbox/Checkbox';
import type { Param } from '../../components/core/Param/param';
import type { ParamKeyStep } from '../../components/core/Param/paramGesture';
import { Segmented } from '../../components/core/Segmented/Segmented';
import { Slider } from '../../components/core/Slider/Slider';
import { useControlled } from '../fourier/useControlled';
import { MAX_PRIMES, clampCount, firstPrimes, gaps, histogram } from './model/primes';
import { columnsOf, gapTones, indicator, indicatorAt, magnitude, peaks, simpleFraction } from './model/spectrum';
import { Caption, CountSlider, many } from './parts';
import './primes.css';

export type GapSignal = 'gaps' | 'indicator';

export interface GapSpectrumProps {
  /** How many primes, from 2: 2 to 100,000 (a larger request is clamped and the caption says so). Default 10,000. */
  count?: number;
  onCount?(n: number): void;
  /** The signal: the gaps played as tones, or the prime indicator (1 at a prime, 0 elsewhere). Default 'gaps'. */
  signal?: GapSignal;
  onSignal?(signal: GapSignal): void;
  /** Show the histogram of gap sizes under the spectrum. Default true. */
  histogram?: boolean;
  onHistogram?(on: boolean): void;
  /** The gap size picked out, its spike and bar in the accent. Default 6. */
  chosen?: number;
  onChosen?(gap: number): void;
}

/** The indicator's longest signal: 2¹⁷ = 131,072 numbers, which keeps its transform near 0.1 s. */
export const MAX_INDICATOR = 1 << 17;
const W = 560;
const LEFT = 28;
const RIGHT = 20;
const PANEL = 130;
const COLUMNS = 600;
const GAP_MIN = 2;
const GAP_MAX = 40;

/** Fractions of the sampling rate as one glyph where Unicode has one: ½, ⅓, ⅙, ⅕ … */
const GLYPHS: Record<string, string> = {
  '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
  '1/6': '⅙', '5/6': '⅚', '1/7': '⅐', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞', '1/9': '⅑', '1/10': '⅒',
};
const fraction = (a: number, q: number) => GLYPHS[`${a}/${q}`] ?? `${a}/${q}`;

/** Arrow keys step the gap size through the even numbers (Shift: three steps). */
const evenKeys: ParamKeyStep = ({ key, shiftKey }, value) => {
  const way = key === 'ArrowRight' || key === 'ArrowUp' ? 1 : key === 'ArrowLeft' || key === 'ArrowDown' ? -1 : 0;
  if (!way) return undefined;
  const even = value % 2 === 0 ? value : way > 0 ? value - 1 : value + 1;
  return Math.max(GAP_MIN, Math.min(GAP_MAX, even + way * 2 * (shiftKey ? 3 : 1)));
};
const gapParam: Param = { kind: 'int', min: GAP_MIN, max: GAP_MAX, defaultValue: 6, steps: GAP_MAX - GAP_MIN + 1, name: 'Gap size' };

interface GapsResult {
  kind: 'gaps';
  gapCount: number;
  largest: number;
  counts: Map<number, number>;
  bars: [number, number][];
  /** The spectrum in columns, in units of gaps (a bin's magnitude over segment/2). */
  columns: Float64Array;
  /** The three tallest spikes, as gap sizes. */
  top: number[];
}

interface IndicatorResult {
  kind: 'indicator';
  length: number;
  primes: number;
  capped: boolean;
  columns: Float64Array;
  named: { a: number; q: number; f: number; value: number }[];
  at: number[];
}

function computeGaps(count: number): GapsResult {
  const g = gaps(firstPrimes(count));
  const { signal, segment, baseBin } = gapTones(g);
  const spectrum = magnitude(signal);
  let largest = 1;
  for (let i = 0; i < g.length; i++) largest = Math.max(largest, g[i]);
  const upTo = Math.min(spectrum.length, (largest + 2) * baseBin);
  const columns = columnsOf(spectrum, COLUMNS, upTo).map((v) => v / (segment / 2));
  const bars = histogram(g);
  const top = peaks(spectrum, 3, Math.max(1, Math.floor(baseBin / 2))).map((p) => Math.round(p.bin / baseBin));
  return { kind: 'gaps', gapCount: g.length, largest, counts: new Map(bars), bars, columns, top };
}

function computeIndicator(count: number): IndicatorResult {
  const primes = firstPrimes(count);
  const last = primes[primes.length - 1];
  let length = 1024;
  while (length <= last && length < MAX_INDICATOR) length <<= 1;
  const spectrum = magnitude(indicator(length));
  const inside = Math.round(spectrum[0]);
  const named = peaks(spectrum, 5, Math.max(3, Math.round(length / 2600))).flatMap((p) => {
    const f = p.bin / length;
    const s = simpleFraction(f, 12, 2 / length);
    return s ? [{ a: s.a, q: s.q, f, value: p.value / Math.max(1, inside) }] : [];
  });
  const columns = columnsOf(spectrum, COLUMNS, spectrum.length).map((v) => v / Math.max(1, inside));
  const at = [2, 3, 6, 5].map((q) => indicatorAt(length, 1, q));
  return { kind: 'indicator', length, primes: inside, capped: last >= length, columns, named, at };
}

/**
 * The gaps between the first N primes, each played as a short tone at g times a base frequency,
 * then Fourier-transformed: the magnitude spectrum's spikes sit at the gap sizes, each as tall as
 * that gap is common, beside the histogram that counts them, with the chosen gap's spike and bar
 * picked out together. Or the prime indicator (1 at a prime, 0 elsewhere, up to a power of two
 * no larger than 2¹⁷) as the signal, whose spectrum peaks at simple fractions of the sampling rate.
 */
export function GapSpectrum({ count: countProp, onCount, signal: signalProp, onSignal, histogram: histogramProp, onHistogram, chosen: chosenProp, onChosen }: GapSpectrumProps) {
  const [countRaw, setCount] = useControlled(countProp, onCount, 10_000);
  const [signal, setSignal] = useControlled(signalProp, onSignal, 'gaps' as GapSignal);
  const [showBars, setShowBars] = useControlled(histogramProp, onHistogram, true);
  const [chosenRaw, setChosen] = useControlled(chosenProp, onChosen, 6);
  const clamp = clampCount(countRaw, MAX_PRIMES);
  const count = Math.max(2, clamp.count);
  const chosen = Math.max(1, Math.round(chosenRaw));
  const result = useMemo(() => (signal === 'indicator' ? computeIndicator(count) : computeGaps(count)), [count, signal]);
  const limit = clamp.clamped ? ` Limited to ${many(MAX_PRIMES)} primes, the most this figure computes.` : '';
  const plotW = W - LEFT - RIGHT;

  let drawing;
  let label: string;
  let caption: string;
  if (result.kind === 'gaps') {
    const span = result.largest + 2;
    const x = (g: number) => LEFT + (g / span) * plotW;
    const maxCount = Math.max(1, ...result.bars.map(([, c]) => c));
    const top1 = 18;
    const base1 = top1 + PANEL;
    const top2 = base1 + 36;
    const base2 = top2 + PANEL;
    const H = (showBars ? base2 : base1) + 30;
    const y1 = (v: number) => base1 - (Math.min(v, maxCount * 1.05) / maxCount) * PANEL;
    const y2 = (v: number) => base2 - (v / maxCount) * PANEL;
    let d = `M${LEFT} ${base1}`;
    result.columns.forEach((v, c) => {
      d += `L${x(((c + 0.5) / COLUMNS) * span).toFixed(2)} ${y1(v).toFixed(2)}`;
    });
    const ticks = [2, 6, 10, ...Array.from({ length: Math.floor(span / 10) }, (_, i) => (i + 2) * 10)].filter((t) => t <= span);
    const chosenCount = result.counts.get(chosen) ?? 0;
    const barW = Math.max(1, (plotW / span) * 0.7);
    const axisY = showBars ? base2 : base1;
    const [a, b, c] = result.top;
    const occur = (g: number | undefined) => (g === undefined ? '' : many(result.counts.get(g) ?? 0));
    label =
      `The gaps between the first ${many(count)} primes (${many(result.gapCount)} gaps) played as tones and Fourier-transformed. ` +
      `The tallest spikes are at ${[a, b, c].filter((g) => g !== undefined).join(', ')} times the base frequency: the commonest gap sizes, occurring ${[a, b, c].filter((g) => g !== undefined).map(occur).join(', ')} times. ` +
      `Every spike sits at an even gap size except the single gap of 1, between 2 and 3. Gap ${chosen} is picked out: ${many(chosenCount)} gaps.` +
      (showBars ? ' The histogram of gap sizes is drawn under the spectrum on the same scale.' : '');
    caption =
      "The spikes are the gap sizes, and each spike's height is how often that gap occurs: the same as the bars. " +
      'Gaps of 6 are commonest because a gap of 6 can start from a prime of either kind (one more or one less than a multiple of 6), while gaps of 2 or 4 can start from only one kind.' +
      limit;
    drawing = (
      <div className="zen-primes__scroll">
      <svg viewBox={`0 0 ${W} ${H}`} className="zen-primes__svg zen-primes__svg--wide" role="img" aria-label={label}>
        <text x={LEFT} y={12} className="zen-primes__label">
          spectrum
        </text>
        <line x1={LEFT} y1={base1} x2={W - RIGHT} y2={base1} className="zen-primes__axis" />
        <path d={d} className="zen-primes__spike" />
        <line x1={x(chosen)} y1={base1} x2={x(chosen)} y2={y1(chosenCount)} className="zen-primes__mark zen-primes__mark--near" />
        {showBars && (
          <g>
            {/* At the right, above the short bars of large gaps, clear of the tallest bar's count. */}
            <text x={W - RIGHT} y={top2 - 6} textAnchor="end" className="zen-primes__label">
              how many gaps of each size
            </text>
            <line x1={LEFT} y1={base2} x2={W - RIGHT} y2={base2} className="zen-primes__axis" />
            {result.bars.map(([g, n]) => (
              <rect
                key={g}
                x={x(g) - barW / 2}
                y={y2(n)}
                width={barW}
                height={Math.max(0.5, base2 - y2(n))}
                className={`zen-primes__bar${g === chosen ? ' zen-primes__bar--chosen' : ''}`}
                data-gap={g}
                style={{ cursor: 'pointer' }}
                onClick={() => setChosen(g)}
              >
                <title>{`Gap ${g}: ${many(n)}`}</title>
              </rect>
            ))}
          </g>
        )}
        {/* The chosen gap's count, top left of the histogram, where no bar reaches it. */}
        <text x={LEFT} y={(showBars ? top2 : 12) - 6} textAnchor="start" className="zen-primes__label" data-part="chosen-count">
          {`gap ${chosen}: ${many(chosenCount)}`}
        </text>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} y1={axisY} x2={x(t)} y2={axisY + 4} className="zen-primes__axis" />
            <text x={x(t)} y={axisY + 15} textAnchor="middle" className="zen-primes__label">
              {t}
            </text>
          </g>
        ))}
        <text x={W - RIGHT} y={axisY + 27} textAnchor="end" className="zen-primes__label">
          gap size (× the base frequency)
        </text>
      </svg>
      </div>
    );
  } else {
    const H = 18 + PANEL + 50;
    const base = 18 + PANEL + 14;
    const x = (f: number) => LEFT + (f / 0.5) * plotW;
    const y = (v: number) => base - Math.min(1.05, v) * PANEL;
    let d = `M${LEFT} ${base}`;
    result.columns.forEach((v, c) => {
      d += `L${x(((c + 0.5) / COLUMNS) * 0.5).toFixed(2)} ${y(v).toFixed(2)}`;
    });
    const names = result.named.map((p) => fraction(p.a, p.q));
    const [half, third, sixth, fifth] = result.at.map((v) => v.toFixed(2));
    const reach = `the numbers 0 to ${many(result.length - 1)} (2^${Math.log2(result.length)} samples, holding ${many(result.primes)} primes)`;
    label =
      `The prime indicator, 1 at each prime and 0 elsewhere, over ${reach}, Fourier-transformed. ` +
      `Apart from zero, its largest peaks are at ${names.join(', ')} of the sampling rate.`;
    caption =
      `The peaks fall at simple fractions of the sampling rate because primes avoid multiples of 2, 3, 5 and so on: every prime but 2 is odd, so the signal flips sign every other step at ½ and all the primes add up there. ` +
      `At ½, ⅓, ⅙ and ⅕ the spectrum is ${half}, ${third}, ${sixth} and ${fifth} of the number of primes. ` +
      `The signal covers ${reach}` +
      (result.capped ? `, its limit of ${many(MAX_INDICATOR)} numbers, so it holds fewer than the first ${many(count)} primes.` : '.') +
      limit;
    drawing = (
      <div className="zen-primes__scroll">
      <svg viewBox={`0 0 ${W} ${H}`} className="zen-primes__svg zen-primes__svg--wide" role="img" aria-label={label}>
        <line x1={LEFT} y1={base} x2={W - RIGHT} y2={base} className="zen-primes__axis" />
        <path d={d} className="zen-primes__spike" />
        {result.named.map((p) => (
          <text key={`${p.a}/${p.q}`} x={x(p.f)} y={Math.max(12, y(p.value) - 6)} textAnchor={p.f > 0.48 ? 'end' : 'middle'} className="zen-primes__label" data-part="peak">
            {fraction(p.a, p.q)}
          </text>
        ))}
        <text x={LEFT} y={base + 15} textAnchor="middle" className="zen-primes__label">
          0
        </text>
        <text x={W - RIGHT} y={base + 15} textAnchor="end" className="zen-primes__label">
          half the sampling rate
        </text>
        <text x={W - RIGHT} y={base + 30} textAnchor="end" className="zen-primes__label">
          frequency (share of the sampling rate)
        </text>
      </svg>
      </div>
    );
  }

  return (
    <div className="zen-primes">
      {drawing}
      <div className="zen-primes__controls">
        <CountSlider value={count} min={2} max={MAX_PRIMES} onChange={setCount} />
        <div className="zen-primes__row">
          <Segmented items={['Gaps as tones', 'Prime indicator']} index={signal === 'gaps' ? 0 : 1} onChange={(i) => setSignal(i === 0 ? 'gaps' : 'indicator')} label="Signal" />
          {signal === 'gaps' && (
            <Checkbox checked={showBars} onChange={setShowBars} size="small">
              Show the histogram
            </Checkbox>
          )}
        </div>
        {signal === 'gaps' && (
          <Slider
            param={gapParam}
            value={chosen}
            onChange={(v) => setChosen(Math.max(GAP_MIN, Math.min(GAP_MAX, 2 * Math.round(v / 2))))}
            keyStep={evenKeys}
            orientation="horizontal"
            layout="row"
            length="auto"
            name="Gap size"
            display={String(chosen)}
          />
        )}
        <Caption>{caption}</Caption>
      </div>
    </div>
  );
}
