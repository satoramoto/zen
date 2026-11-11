// What sits over whatever screen is shown: a notice for a moment, and the status marks (openspec:
// push-display, "A notice overlays any screen", "Status marks sit over every screen").
import { NOTICE_MS } from '../timing';
import type { Ctx, Layer } from '../engine';

/** Show a notice over the screen from now for its time. */
export function notify(ctx: Ctx, text: string, value?: string): void {
  ctx.state.notice = { text, ...(value === undefined ? {} : { value }), until: ctx.input.time + NOTICE_MS };
}

/** The battery level under which its mark is drawn over every screen. */
export const LOW_BATTERY = 7;

export const overlays: Layer = {
  name: 'overlays',
  paint(paint) {
    const { state, set, screen } = paint;
    // A touched Volume or Swing & Tempo encoder shows what it is set to, for as long as it is touched.
    if (state.touched.includes('volume')) screen.overlays.push({ type: 'notice', text: `Volume: ${set.unit.volumeTarget}`, value: set.unit.volume.display });
    else if (state.touched.includes('tempo')) screen.overlays.push(state.tempoMode === 'tempo' ? { type: 'notice', text: 'Tempo', value: `${set.transport.tempo.toFixed(2)} BPM` } : { type: 'notice', text: 'Swing', value: `${set.transport.swing} %` });
    else if (state.notice) screen.overlays.push({ type: 'notice', text: state.notice.text, ...(state.notice.value === undefined ? {} : { value: state.notice.value }) });
    const battery = set.unit.battery;
    if (battery && battery.percent < LOW_BATTERY) screen.overlays.push({ type: 'battery', percent: battery.percent, charging: battery.charging, low: true });
    if (set.transport.countingIn !== undefined) screen.overlays.push({ type: 'count-in', fraction: set.transport.countingIn });
  },
};
