import { component, h, styleText, wire, type Handlers, type Root } from '../../view/Tree.model';
import { meterView } from '../music/Meter.model';
import type { MixerCommands, MixerDeck, MixerFrame, MixerTheme } from './model';

export interface FrameMeterProps { sample(): number; label: string }
export interface FramePlayheadProps { readFrame(): MixerFrame; deckId: string }
export interface FrameWaveformProps {
  deck: MixerDeck;
  index: number;
  ink: string;
  readFrame(): MixerFrame;
  theme: MixerTheme;
  commands: MixerCommands;
}

export function frameMeterView({ label }: FrameMeterProps) {
  return wire(meterView({ ink: 'var(--play-signal)', name: '', label, orientation: 'vertical', length: 210, value: 0 }), {
    bind: [['musicFrameMeter', { sample: 'sample' }]],
  });
}
export const frameMeterHandlers = ({ sample }: FrameMeterProps): Handlers => ({ sample });

export function framePlayheadView({ deckId }: FramePlayheadProps) {
  return wire(h('span', { class: 'play-playhead' }), { bind: [['musicFramePlayhead', { deckId, readFrame: 'readFrame' }]] });
}
export const framePlayheadHandlers = ({ readFrame }: FramePlayheadProps): Handlers => ({ readFrame });

/** Markers remain in source coordinates; only the scroll strip and live heads move each frame. */
export function frameWaveformView({ deck, index, ink, theme }: FrameWaveformProps): Root {
  const range = deck.waveform;
  if (!range) return [];
  const alone = range.lanes.length === 1;
  return [
    ...range.lanes.map((lane) => {
      const focused = alone || lane.id === deck.focus;
      const paint = theme.stems[lane.id] ?? ink;
      return {
        ...wire(h('div', {
          class: 'play-wave-source',
          'data-focused': String(focused),
          'aria-label': `Deck ${index + 1} ${lane.name} waveform`,
          style: styleText({ '--stem-ink': paint }),
        },
        h('div', { class: 'play-wave-scroll', style: styleText({ width: `${range.length / range.visible * 100}%` }) },
          component('MusicWaveform', {
            visibleShare: Math.min(1, range.visible / range.length), peaks: lane.peaks, spectrum: lane.spectrum,
            ink: paint, height: 48, label: `Deck ${index + 1} ${lane.name} on the shared beat grid`,
          }),
          h('span', {
            class: 'play-wave-grid',
            'data-grid': range.visible <= 48 ? 'beats' : range.visible <= 160 ? 'bars' : 'faint',
            style: styleText({ 'background-size': `${100 / range.length}% 100%, ${400 / range.length}% 100%` }),
          }),
          lane.cue !== undefined && lane.cue !== lane.stemCue ? h('span', {
            class: 'play-cue-marker', style: styleText({ left: `${(lane.cue - range.start) / range.length * 100}%`, top: alone ? '32px' : undefined }),
          }, alone ? 'DECK CUE' : null) : null,
          lane.stemCue !== undefined ? h('span', {
            class: 'play-cue-marker', style: styleText({ left: `${(lane.stemCue - range.start) / range.length * 100}%`, top: alone ? '16px' : undefined }),
          }, alone ? 'CUE' : null) : null,
          lane.loop ? h('div', {
            class: 'play-loop-region', 'data-enabled': String(lane.loop.enabled),
            style: styleText({
              left: `${(lane.loop.start - range.start) / range.length * 100}%`,
              width: `${Math.max(0, (lane.loop.end ?? lane.loop.start) - lane.loop.start) / range.length * 100}%`,
              '--loop-ink': paint,
            }),
          }, alone ? h('span', {}, lane.loop.end === null ? 'IN' : `↻ ${Number((lane.loop.end - lane.loop.start).toFixed(1))} beats`) : null) : null),
        !alone ? h('span', { class: 'play-wave-source-name' }, lane.name) : null,
        h('span', { class: 'play-playhead', style: 'left: 25%' }),
        h('span', { class: 'play-slip-marker', hidden: '' })), {
          on: { pointerdown: `focus:${lane.id}` },
          bind: [['musicFrameWaveLane', {
            deckId: deck.id, laneId: lane.id, fixed: range.fixed ?? false,
            start: range.start, visible: range.visible, length: range.length, readFrame: 'readFrame',
          }]],
        }),
        key: lane.id,
      };
    }),
    deck.track ? wire(h('span', { class: 'play-wave-position' }), {
      bind: [['musicFramePosition', { deckId: deck.id, readFrame: 'readFrame' }]],
    }) : null,
  ];
}

export function frameWaveformHandlers({ deck, readFrame, commands }: FrameWaveformProps): Handlers {
  const alone = deck.waveform?.lanes.length === 1;
  return {
    readFrame,
    ...Object.fromEntries((deck.waveform?.lanes ?? []).map((lane) => [
      `focus:${lane.id}`, () => { if (!alone) commands.setFocus?.(deck.id, lane.id); },
    ])),
  };
}
