import { useForm } from '../../../layout/assembly';
import { Text } from '../../../primitives/Text';
import { Segmented } from '../../../components/core/Segmented/Segmented';
import { Button } from '../../../components/core/Button/Button';
import { frac, sector } from '../../geometry';
import { LANDING_LENGTHS, LANDING_TARGETS, type LandingLength, type LandingTarget } from '../../set';
import { LANDING_DIAL_FORMS, type LandingDialForm } from './LandingDial.forms';
import './LandingDial.css';

export interface LandingDialProps {
  /** Draw this form, outside an assembled screen (a screen's own choice wins inside one). */
  form?: LandingDialForm;
  /** The transition carrying the set there: `'RISER'`. */
  via: string;
  /** What it lands on: `'Wire'`. */
  lands: string;
  /** About it: `'118 · G'`. */
  landsHint?: string;
  /** What hits on the one when it lands: `'DROP'`. */
  hit?: string;
  target: LandingTarget;
  onTarget?: (target: LandingTarget) => void;
  /** The transition's length in bars. */
  length: LandingLength;
  onLength?: (length: LandingLength) => void;
  /** Whole bars left before it lands. With `armed` false nothing is counting. */
  barsLeft: number;
  /** The set clock in beats: the current bar's sweep. */
  beat: number;
  armed: boolean;
  onCancel?: () => void;
  className?: string;
}

const TARGET_LABELS: Record<LandingTarget, string> = { song: 'Next song', section: 'Next section', scene: 'Next scene' };

/**
 * **Job.** Answer "when does it land, and on what?" while a transition is carrying the set
 * somewhere: the one question a player asks mid-riser.
 *
 * **Representation.** A countdown ring cut into the transition's bars: bars gone are solid, the
 * bar now fills as its beats pass, bars to come are a faint track. The number of bars left sits
 * in the middle at display size; what it lands on and what hits on the one sit under it. The
 * target and length switches set up the next one. Disarmed, the ring is a dashed outline.
 *
 * **Behaviour.** Controlled: the switches ask `onTarget`/`onLength`, Cancel asks `onCancel`.
 *
 * **Forms** (`LANDING_DIAL_FORMS`): `dial` the ring over its switches, `chip` one line.
 */
export function LandingDial({ form: given, via, lands, landsHint, hit, target, onTarget, length, onLength, barsLeft, beat, armed, onCancel, className }: LandingDialProps) {
  const form = useForm(LANDING_DIAL_FORMS, given);
  const gone = Math.max(0, length - barsLeft);
  const inBar = frac(beat / 4);
  const gap = 0.006;
  const say = armed ? `${via} lands on ${lands} in ${barsLeft} ${barsLeft === 1 ? 'bar' : 'bars'}` : `${via} to ${lands}, not armed`;

  const ring = (r0: number, r1: number) =>
    Array.from({ length }, (_, i) => {
      const a = i / length + gap;
      const b = (i + 1) / length - gap;
      const state = !armed ? 'off' : i < gone ? 'gone' : i === gone ? 'now' : 'ahead';
      return (
        <g key={i} className="lv-land__bar" data-state={state} data-down={i === length - 1 ? 'true' : undefined}>
          <path d={sector(0, 0, r0, r1, a, b)} />
          {state === 'now' && <path className="lv-land__fill" d={sector(0, 0, r0, r1, a, a + (b - a) * inBar)} />}
        </g>
      );
    });

  if (form === 'chip') {
    return (
      <div className={`lv-land${className ? ` ${className}` : ''}`} data-form={form} data-armed={armed ? 'true' : undefined} role="status" aria-label={say}>
        <svg viewBox="-12 -12 24 24" className="lv-land__mini" aria-hidden="true">
          {ring(6, 11)}
        </svg>
        <Text role="label" tabular>
          {armed ? barsLeft : '–'}
        </Text>
        <Text role="caption" tone="secondary" truncate>
          {via} → {lands}
        </Text>
      </div>
    );
  }

  return (
    <div className={`lv-land${className ? ` ${className}` : ''}`} data-form={form} data-armed={armed ? 'true' : undefined}>
      <svg viewBox="-100 -100 200 200" className="lv-land__ring" role="img" aria-label={say}>
        {ring(70, 96)}
        <text className="lv-land__count" y={4} fontSize={54}>
          {armed ? barsLeft : '–'}
        </text>
        <text className="lv-land__unit" y={26} fontSize={10}>
          {armed ? (barsLeft === 1 ? 'bar to land' : 'bars to land') : 'not armed'}
        </text>
        <text className="lv-land__via" y={-38} fontSize={10}>
          {via}
        </text>
      </svg>
      <div className="lv-land__says">
        <Text role="label">
          lands on <b>{lands}</b>
          {landsHint ? ` · ${landsHint}` : ''}
        </Text>
        {hit && (
          <Text role="caption" tone="secondary">
            {hit} hits the one
          </Text>
        )}
      </div>
      <div className="lv-land__switches">
        <Segmented name="Lands on" items={LANDING_TARGETS.map((t) => TARGET_LABELS[t])} index={LANDING_TARGETS.indexOf(target)} onChange={(i) => onTarget?.(LANDING_TARGETS[i])} disabled={!onTarget} />
        <Segmented name="Bars" items={LANDING_LENGTHS.map(String)} index={LANDING_LENGTHS.indexOf(length)} onChange={(i) => onLength?.(LANDING_LENGTHS[i])} disabled={!onLength} />
        <Button label="Cancel" size="md" variant="quiet" onPress={onCancel} disabled={!onCancel || !armed} />
      </div>
    </div>
  );
}

LandingDial.forms = LANDING_DIAL_FORMS;
