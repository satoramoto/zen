import { useForm } from '../../../layout/assembly';
import { Text } from '../../../primitives/Text';
import { StatusDot } from '../../../components/core/StatusDot/StatusDot';
import type { RigDevice, RigInput, SignalState } from '../../set';
import { RIG_HEALTH_FORMS, type RigHealthForm } from './RigHealth.forms';
import './RigHealth.css';

export interface RigHealthProps {
  /** Draw this form, outside an assembled screen (a screen's own choice wins inside one). */
  form?: RigHealthForm;
  inputs: readonly RigInput[];
  devices: readonly RigDevice[];
  /** The last seconds of DSP load, oldest first (0–1). */
  load: readonly number[];
  xruns?: number;
  /** Buffer size in frames. */
  frames?: number;
  /** Launch quantize and count-in: `'1 bar'`. */
  quantize?: string;
  countIn?: string;
  /** An input or a device was picked: open its settings. */
  onOpen?: (id: string) => void;
  className?: string;
}

const SIGNAL_WORD: Record<SignalState, string> = { ok: 'ok', low: 'low', none: 'no signal' };

/**
 * **Job.** The one line that says the rig is fine — or exactly what isn't — without taking the
 * eye: every input's signal, every controller's link, the engine's load.
 *
 * **Representation.** A status strip: the launch quantize first (it changes what every press
 * does), then each input as a dot and a sliver of its level (a silent input is the hollow dot and
 * its words, the only thing on the strip that asks for attention), the controllers as dots, and
 * the DSP load as a sparkline so a spike is a shape, not a number.
 *
 * **Behaviour.** Controlled: an input or device asks `onOpen(id)`.
 *
 * **Forms** (`RIG_HEALTH_FORMS`): `strip` everything, `dots` dots and the load.
 */
export function RigHealth({ form: given, inputs, devices, load, xruns = 0, frames, quantize, countIn, onOpen, className }: RigHealthProps) {
  const form = useForm(RIG_HEALTH_FORMS, given);
  const last = load.length ? load[load.length - 1] : 0;
  const peak = load.reduce((m, v) => Math.max(m, v), 0);
  const spark = load.map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / Math.max(load.length - 1, 1)) * 60).toFixed(1)} ${(16 - (v / Math.max(peak, 0.25)) * 14).toFixed(1)}`).join('');
  const full = form === 'strip';

  return (
    <div className={`lv-rig${className ? ` ${className}` : ''}`} data-form={form} role="status" aria-label="Rig status">
      {full && quantize && (
        <Text role="caption" tabular className="lv-rig__group">
          Q {quantize}
          {countIn ? ` · count-in ${countIn}` : ''}
        </Text>
      )}
      <div className="lv-rig__group">
        {full && (
          <Text role="caption" tone="muted" case="label">
            In
          </Text>
        )}
        {inputs.map((i) => (
          <button key={i.id} type="button" className="lv-rig__item" data-state={i.state} disabled={!onOpen} onClick={() => onOpen?.(i.id)} aria-label={`${i.name} input, ${SIGNAL_WORD[i.state]}`}>
            <StatusDot hue={i.state === 'ok' ? 'ok' : i.state === 'low' ? 't' : 'd'} hollow={i.state === 'none'} />
            <Text role="caption">{i.name}</Text>
            {full && i.state !== 'none' && (
              <span className="lv-rig__level" aria-hidden="true">
                <span style={{ width: `${i.level * 100}%` }} />
              </span>
            )}
            {i.state !== 'ok' && (
              <Text role="caption" tone={i.state === 'none' ? 'danger' : 'warning'}>
                {SIGNAL_WORD[i.state]}
              </Text>
            )}
          </button>
        ))}
      </div>
      <div className="lv-rig__group">
        {full && (
          <Text role="caption" tone="muted" case="label">
            Control
          </Text>
        )}
        {devices.map((d) => (
          <button key={d.id} type="button" className="lv-rig__item" disabled={!onOpen} onClick={() => onOpen?.(d.id)} aria-label={`${d.name}, ${d.connected ? 'connected' : 'not connected'}`}>
            <StatusDot hue={d.connected ? 'ok' : 'd'} hollow={!d.connected} />
            {full && (
              <Text role="caption" tone={d.connected ? undefined : 'muted'}>
                {d.name}
              </Text>
            )}
          </button>
        ))}
      </div>
      <div className="lv-rig__group lv-rig__load">
        <svg viewBox="0 0 60 18" aria-hidden="true">
          <path d={spark} />
        </svg>
        <Text role="caption" tabular tone={xruns > 0 ? 'warning' : 'secondary'}>
          cpu {Math.round(last * 100)}% · {xruns} xruns{full && frames ? ` · ${frames} frames` : ''}
        </Text>
      </div>
    </div>
  );
}

RigHealth.forms = RIG_HEALTH_FORMS;
