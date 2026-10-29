import { component, h, slot, wire, type Handlers, type Root } from '../../view/Tree.model';
import type { MixerCommands, MixerDeck, MixerFrame } from './model';

export interface WaveControlsProps {
  deck: MixerDeck;
  commands: MixerCommands;
  index: number;
  readFrame(): MixerFrame;
}

/** Omit children for the binding's slot, or inline a function-free subtree in an assembled mixer. */
export function waveControlsView({ deck: d, commands: c, index }: WaveControlsProps, children: Root = slot('children')): Root {
  const focus = d.full ? 'full' : d.focus ?? d.stems.find((stem) => stem.available)?.id ?? '';
  const stem = d.stems.find((stem) => stem.id === focus);
  const playing = d.full ? d.playing : stem?.playing;
  const held = d.full ? d.cueHeld : stem?.cueHeld;
  if (d.status === 'loading') return h('div', {
    class: 'play-wave-loading', role: 'status', 'aria-label': `Deck ${index + 1} loading`,
  }, h('span', {}, d.message ?? 'Loading…'));
  return [
    d.status === 'ready' ? h('div', {
      class: 'play-wave-tools', role: 'group', 'aria-label': `Deck ${index + 1} waveform controls`,
    },
    component('MusicContextControls', {
      label: `Deck ${index + 1} waveform settings`, title: 'Choose movement scope and zoom',
    }, { slots: { face: ['···'], children: [
      h('label', { class: 'play-context-check' }, wire(h('input', {
        type: 'checkbox', disabled: !d.independentStems ? '' : undefined, checked: d.moveTogether ? '' : undefined,
      }), { on: { change: 'moveTogether' } }), 'Move active stems together'),
      h('div', { class: 'play-context-row' },
        h('span', {}, `Zoom · ${d.zoom === 0 ? 'Whole track' : `${d.zoom ?? 32} beats`}`),
        component('MusicButtonFace', { size: 'medium', 'aria-label': `Deck ${index + 1} zoom in`, title: 'Zoom in' }, {
          on: { onClick: 'zoomIn' }, slots: { children: ['+'] },
        }),
        component('MusicButtonFace', { size: 'medium', 'aria-label': `Deck ${index + 1} zoom out`, title: 'Zoom out' }, {
          on: { onClick: 'zoomOut' }, slots: { children: ['−'] },
        })),
      !d.full ? h('p', {}, `Every stem has a lane. Point at one to work on it; ${stem?.name ?? 'the focused stem'} is focused now.`) : null,
      !d.independentStems ? h('p', {}, 'Hot cues keep stems together. Launch a stem cell to enable separate movement.') : null,
      h('p', {}, `Drag ${d.moveTogether ? 'active stems' : 'focus'} while playing or paused. Escape cancels. Left/right move ⅛ beat, Shift one beat; up/down change lane.`),
    ] } }),
    component('MusicButtonFace', {
      size: 'medium', 'aria-label': `Deck ${index + 1} show whole waveform`, title: 'Show the entire source waveform', 'aria-pressed': d.zoom === 0,
    }, { on: { onClick: 'fit' }, slots: { children: ['Fit'] } }),
    component('MusicButtonFace', {
      size: 'medium', disabled: !c.setStemPlaying, 'aria-label': `Deck ${index + 1} focused play/pause`,
      title: `Play / pause ${stem?.name ?? 'original'} only`, 'aria-pressed': playing ?? false,
    }, { on: { onClick: 'play' }, slots: { children: [playing ? 'Ⅱ' : '▶'] } }),
    component('MusicMomentary', { label: `Deck ${index + 1} focused cue`, held: held ?? false }, {
      key: focus, on: { onHold: 'cue', onTakeover: 'takeover' }, slots: { children: ['CUE'] },
    })) : null,
    wire(h('div', {
      class: 'play-wave-gesture', role: 'slider', 'aria-valuemin': '0', 'aria-valuemax': '0', 'aria-valuenow': '0',
      tabindex: d.status === 'ready' ? '0' : '-1', 'aria-label': `Deck ${index + 1} waveform position`,
      'aria-valuetext': `0.000 seconds · ${d.full ? 'Full track' : stem?.name ?? 'Focus'} · ${d.moveTogether ? 'Move active stems together' : 'Move focused stem'}`,
    }, children), { bind: [['musicWaveControls', {
      deckId: d.id, ready: d.status === 'ready', full: d.full, focus,
      sourceName: d.full ? 'Full track' : stem?.name ?? 'Focus',
      lanes: d.stems.filter((source) => source.available).map((source) => source.id),
      beats: d.waveform?.visible ?? d.zoom ?? 32, moveTogether: d.moveTogether ?? false,
      readFrame: 'readFrame', moveDeck: 'moveDeck', setFocus: 'setFocus',
    }]] }),
  ];
}

export function waveControlsHandlers({ deck: d, commands: c, readFrame }: WaveControlsProps): Handlers {
  const focus = d.full ? 'full' : d.focus ?? d.stems.find((stem) => stem.available)?.id ?? '';
  const stem = d.stems.find((stem) => stem.id === focus);
  const playing = d.full ? d.playing : stem?.playing;
  const held = d.full ? d.cueHeld : stem?.cueHeld;
  return {
    readFrame, moveDeck: c.moveDeck?.bind(c), setFocus: c.setFocus?.bind(c),
    moveTogether: () => c.setMoveTogether?.(d.id, !d.moveTogether),
    zoomIn: () => c.setZoom?.(d.id, (d.zoom || 64) / 2),
    zoomOut: () => c.setZoom?.(d.id, (d.zoom || 32) * 2),
    fit: () => c.setZoom?.(d.id, d.zoom === 0 ? 32 : 0),
    play: () => d.full ? c.setDeckPlaying?.(d.id, held ? true : !playing) : c.setStemPlaying?.(d.id, focus, held ? true : !playing),
    cue: (on: boolean) => d.full ? c.cueDeck?.(d.id, on) : c.cueStem?.(d.id, focus, on),
    takeover: () => d.full ? c.setDeckPlaying?.(d.id, true) : c.setStemPlaying?.(d.id, focus, true),
  };
}
