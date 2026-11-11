// Trace's stories as plain props.
import { defineFixtures } from '../../../fixtures';
import type { TraceModelProps } from './Trace.model';

const envelope: [number, number][] = [[0, 0], [0.05, 1], [0.35, 0.7], [0.7, 0.7], [1, 0]];
const filter: [number, number][] = [[0, 0.6], [0.5, 0.6], [0.6, 0.85], [0.66, 0.5], [0.8, 0.1], [1, 0]];
const saw: [number, number][] = Array.from({ length: 33 }, (_, i) => [i / 32, (i % 16) / 16] as [number, number]);

export const traceStories = defineFixtures<TraceModelProps>()({
  /** An envelope: attack, decay, sustain, release. */
  Envelope: { args: { points: envelope, name: 'Envelope' } },
  /** A filter's response, filled, in a hue. */
  Filled: { args: { points: filter, fill: true, hue: 2, name: 'Filter response' } },
  /** A waveform with a lit region and markers, one of them strong. */
  Marked: { args: { points: saw, region: [0.25, 0.75], markers: [{ at: 0.25, name: 'loop start' }, { at: 0.75, name: 'loop end' }, { at: 0.4, name: 'playhead', strong: true }], name: 'Oscillator shape' } },
  /** A sample's peaks as a band, with a lit stretch and markers at its start and end. */
  Band: { args: { band: Array.from({ length: 48 }, (_, i) => [0.5 - 0.45 * Math.exp(-i / 16) * Math.abs(Math.sin(i * 0.7)), 0.5 + 0.45 * Math.exp(-i / 16) * Math.abs(Math.sin(i * 0.7))] as [number, number]), region: [0.1, 0.6], markers: [{ at: 0.1, name: 'start', strong: true }, { at: 0.6, name: 'end', strong: true }], name: 'Sample' } },
  /** Dimmed: the thing it belongs to is off. */
  Disabled: { args: { points: envelope, fill: true, disabled: true, name: 'Envelope, off' } },
  /** Fewer than two points draw no line. */
  Empty: { args: { points: [], name: 'Nothing measured' } },
});
