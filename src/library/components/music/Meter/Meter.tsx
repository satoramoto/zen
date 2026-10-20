import type { CSSProperties } from 'react';
import { Text } from '../../../primitives/Text';
import { meterView, type MeterModelProps } from './Meter.model';
import '../../../primitives/Surface.css';
import './Meter.css';

// The props and the view are framework-free, in the model; `Meter.svelte` renders the same view.
export type { MeterLayout, MeterSide, MeterModelProps } from './Meter.model';

/** `live.meter~`: a level, read-only. Mirrors `@openflow/widgets` Meter. */
export type MeterProps = MeterModelProps;

/**
 * **Job.** Show a level that something else is driving (a signal, an envelope, an energy) so the
 * player can see what the picture is reacting to. It never invites a touch: it is not a disabled
 * slider.
 *
 * **Behaviour.** Read-only: no gesture, no focus, no write. `role="meter"` with `aria-valuenow` the
 * level as 0–100, named by `label`, else the caption. `value` and `peak` are clamped to 0–1 (a
 * non-finite value reads 0). `peak` is drawn as a line, not a second fill, because it answers a
 * different question (how far it has been, not where it is now).
 *
 * **Parts** (`data-part`). `caption`; `channel` the bar, a `well` surface (drawn with Surface's
 * attributes and stylesheet; it takes no layer, so it never wears a shader); `level` the lit fill
 * (`--lit`, `--mat-lit-glow`); `hold` the peak line; `readout` the reading, in the readout face
 * with tabular figures (laid over the bar when `inside`).
 */
export function Meter(props: MeterProps) {
  const view = meterView(props);
  const style = view.style as CSSProperties;
  return (
    <div className={view.root.className} {...view.root.attrs} style={style}>
      {view.caption && (
        <Text {...view.caption.text} className={view.caption.className} {...view.caption.attrs}>
          {view.caption.content}
        </Text>
      )}
      <div className={view.frame.className} {...view.frame.attrs}>
        <div className={view.channel.className} {...view.channel.attrs}>
          <i className={view.level.className} {...view.level.attrs} />
          {view.hold && <i className={view.hold.className} {...view.hold.attrs} />}
        </div>
      </div>
      {view.readout && (
        <Text {...view.readout.text} className={view.readout.className} {...view.readout.attrs}>
          {view.readout.content}
        </Text>
      )}
    </div>
  );
}
