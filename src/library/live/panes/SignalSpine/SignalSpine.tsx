import { Fragment } from 'react';
import { useForm } from '../../../layout/assembly';
import { Text } from '../../../primitives/Text';
import { Button } from '../../../components/core/Button/Button';
import { arc, frac } from '../../geometry';
import type { ChainStage, LoopLayer, SetTrack } from '../../set';
import { SIGNAL_SPINE_FORMS, type SignalSpineForm } from './SignalSpine.forms';
import './SignalSpine.css';

export interface SignalSpineProps {
  /** Draw this form, outside an assembled screen (a screen's own choice wins inside one). */
  form?: SignalSpineForm;
  track: SetTrack;
  /** The stages, in signal order. The looper is the one with id `looper`. */
  chain: readonly ChainStage[];
  /** The looper's layers, oldest first: the base is the heartwood. */
  layers: readonly LoopLayer[];
  /** The loop's length in bars. */
  loopBars: number;
  /** The set clock, in beats: the rings' sweep. */
  beat: number;
  /** Where it goes: `['Main L/R', 'IEM 2']`. */
  outs?: readonly string[];
  /** 0–1, the output's level. */
  level?: number;
  onPrev?: () => void;
  onNext?: () => void;
  /** A cartridge was picked: open its options. */
  onStage?: (stage: string) => void;
  /** Peel the newest layer. */
  onUndo?: () => void;
  onMuteLayer?: (layer: string) => void;
  className?: string;
}

/**
 * **Job.** One track as what it is: a signal path. What comes in, what plays it, what makes the
 * sound, what the looper has caught, where it goes — and which layers of the loop are live.
 *
 * **Representation.** A spine of cartridges on one cable, signal flowing left to right (beads
 * travel the cable while the clock runs). The looper's cartridge holds the loop as tree rings: the
 * base take is the heartwood, every overdub a ring outside it, a muted ring dashed; one sweep
 * runs round all of them at the loop's length. Undo peels the outermost ring, as it would on the
 * hardware.
 *
 * **Behaviour.** Controlled: cartridges ask `onStage(id)`, the arrows `onPrev`/`onNext`, the rings
 * `onMuteLayer(id)`, Undo `onUndo()`.
 *
 * **Forms** (`SIGNAL_SPINE_FORMS`): `chain` left to right, `column` stacked.
 */
export function SignalSpine({ form: given, track, chain, layers, loopBars, beat, outs = [], level = 0, onPrev, onNext, onStage, onUndo, onMuteLayer, className }: SignalSpineProps) {
  const form = useForm(SIGNAL_SPINE_FORMS, given);
  const phase = frac(beat / (loopBars * 4));
  const ringGap = layers.length > 0 ? 34 / layers.length : 0;

  const rings = (
    <svg className="lv-spine__rings" viewBox="-50 -50 100 100" role="img" aria-label={`${layers.length} layers, ${loopBars} bars`}>
      {layers.map((l, i) => {
        const r = 12 + (i + 1) * ringGap;
        return (
          <g key={l.id} className="lv-spine__ring" data-kind={l.kind} data-muted={l.muted ? 'true' : undefined}>
            <circle r={r} className="lv-spine__ring-band" style={{ strokeWidth: ringGap * 0.7 }} />
            {!l.muted && <path className="lv-spine__ring-sweep" d={arc(0, 0, r, phase - 0.12, phase)} style={{ strokeWidth: ringGap * 0.7 }} />}
          </g>
        );
      })}
      <text className="lv-spine__bars" dy="0.35em" fontSize={11}>
        {loopBars}
      </text>
    </svg>
  );

  const cartridge = (s: ChainStage) => {
    if (s.id === 'looper') {
      return (
        <div className="lv-spine__cart" data-stage="looper" key={s.id}>
          <button type="button" className="lv-spine__head" disabled={!onStage} onClick={() => onStage?.(s.id)}>
            <Text role="caption" tone="muted" case="label">
              {s.title}
            </Text>
            <Text role="label">{s.value}</Text>
          </button>
          <div className="lv-spine__looper">
            {rings}
            <ol className="lv-spine__layers" reversed>
              {[...layers].reverse().map((l, i) => (
                <li key={l.id}>
                  <button type="button" className="lv-spine__layer" aria-pressed={!l.muted} disabled={!onMuteLayer} onClick={() => onMuteLayer?.(l.id)}>
                    <Text role="caption" tabular>
                      L{layers.length - i} · {l.kind} · {l.at}
                    </Text>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div className="lv-spine__params">
            {s.params?.map((p) => (
              <Text key={p.name} role="caption" tone="secondary" tabular>
                {p.name} <b>{p.value}</b>
              </Text>
            ))}
            <Button label="Undo" size="md" variant="quiet" onPress={onUndo} disabled={!onUndo || layers.length < 2} />
          </div>
        </div>
      );
    }
    return (
      <div className="lv-spine__cart" data-stage={s.id} data-bypass={s.bypass ? 'true' : undefined} key={s.id}>
        <button type="button" className="lv-spine__head" disabled={!onStage} onClick={() => onStage?.(s.id)}>
          <Text role="caption" tone="muted" case="label">
            {s.title}
          </Text>
          <Text role="label">{s.bypass ? 'thru' : s.value}</Text>
        </button>
        <ul className="lv-spine__options">
          {s.options.map((o) => (
            <li key={o}>
              <Text role="caption" tone="faint">
                {o}
              </Text>
            </li>
          ))}
        </ul>
        {s.params && (
          <div className="lv-spine__params">
            {s.params.map((p) => (
              <Text key={p.name} role="caption" tone="secondary" tabular>
                {p.name} <b>{p.value}</b>
              </Text>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`lv-spine${className ? ` ${className}` : ''}`} data-form={form} data-hue={track.hue}>
      <div className="lv-spine__bar">
        <Button symbol="prev" size="icon" name="Previous track" onPress={onPrev} disabled={!onPrev} />
        <Text role="heading">{track.name}</Text>
        <Text role="caption" tone="muted">
          {track.source}
        </Text>
        <Button symbol="next" size="icon" name="Next track" onPress={onNext} disabled={!onNext} />
      </div>
      <div className="lv-spine__chain">
        {chain.map((s) => (
          <Fragment key={s.id}>
            {cartridge(s)}
            <span className="lv-spine__cable" aria-hidden="true" />
          </Fragment>
        ))}
        <div className="lv-spine__out">
          <Text role="caption" tone="muted" case="label">
            Out
          </Text>
          <span className="lv-spine__level" aria-label={`level ${Math.round(level * 100)}%`} role="meter" aria-valuenow={Math.round(level * 100)} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ height: `${level * 100}%` }} />
          </span>
          {outs.map((o) => (
            <Text key={o} role="caption" tone="secondary">
              {o}
            </Text>
          ))}
        </div>
      </div>
    </div>
  );
}

SignalSpine.forms = SIGNAL_SPINE_FORMS;
