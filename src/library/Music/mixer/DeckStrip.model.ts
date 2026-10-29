import { component, flag, h, wire, type Child, type Handler, type Handlers, type Node } from '../../view/Tree.model';
import type { DeckControl, MixerDeck, MixerViewProps } from './model';
import { knobStackTree } from './KnobStack.model';
import { mixerSectionTree, mixerStyleText, separatorView } from './Separator.model';
import { phonesIconView } from './ContextControls.model';

export type DeckStripProps = Pick<MixerViewProps, 'commands' | 'readFrame' | 'theme' | 'params' | 'deckProps'> & {
  deck: MixerDeck;
  index: number;
  loopBeats: number;
};

/** Beats read as bars where they divide into them: what a DJ counts. */
export const beatsText = (beats: number): string => beats % 4 === 0
  ? `${beats / 4} ${beats === 4 ? 'bar' : 'bars'} · ${beats} beats`
  : `${beats} ${beats === 1 ? 'beat' : 'beats'}`;

const identityLabel = (ink: string): string => `color-mix(in srgb, ${ink} 45%, var(--caption))`;
const nativeNames: Record<string, string> = { className: 'class', tabIndex: 'tabindex', htmlFor: 'for', readOnly: 'readonly', autoFocus: 'autofocus' };

/** Host listeners are handlers, never callback values hidden in tree data. */
function hostAttributes(host: Record<string, unknown>, handlers: Handlers): { attrs: Record<string, string | undefined>; on: Record<string, string>; captures: string[] } {
  const attrs: Record<string, string | undefined> = {};
  const on: Record<string, string> = {};
  const captured: Record<string, Handler> = {};
  for (const [name, value] of Object.entries(host)) {
    if (/^on[A-Z]/.test(name) && typeof value === 'function') {
      const capture = name.endsWith('Capture');
      const nativeName = name.slice(2, capture ? -7 : undefined);
      const event = ({ DoubleClick: 'dblclick', Focus: 'focusin', Blur: 'focusout' } as Record<string, string>)[nativeName] ?? nativeName.toLowerCase();
      const key = `host:${name}`;
      handlers[key] = value as Handler;
      if (capture) captured[event] = value as Handler;
      else on[event] = key;
    } else if (name === 'ref' && typeof value === 'function') {
      handlers.hostRef = value as Handler;
    } else if (!['children', 'style', 'className', 'ref', 'key'].includes(name) && value !== undefined && value !== null && typeof value !== 'function' && typeof value !== 'object') {
      const attribute = nativeNames[name] ?? name;
      attrs[attribute] = typeof value === 'boolean' && !name.startsWith('aria-') && !name.startsWith('data-') && !['draggable', 'contentEditable', 'spellCheck'].includes(name)
        ? value ? '' : undefined : String(value);
    }
  }
  if (Object.keys(captured).length) handlers.hostCapture = (event: Event) => captured[event.type]?.(event);
  return { attrs, on, captures: Object.keys(captured) };
}

/** Source deck anatomy. The host alone owns playback, queueing and DSP decisions. */
export function deckStripModel({ deck: d, index, commands, readFrame, theme, params, deckProps, loopBeats }: DeckStripProps): { tree: Node; handlers: Handlers } {
  const handlers: Handlers = {};
  const { level: LEVEL, trim: TRIM, send: SEND, eq: EQ, filter: FILTER } = params;
  const deckName = `Deck ${index + 1}`;
  const ready = d.status === 'ready';
  const paint = (stemId: string) => theme.stems[stemId] ?? theme.primary;
  const stemStyle = (stemId: string) => `--stem-ink: ${paint(stemId)}; --stem-label: ${identityLabel(paint(stemId))}`;
  const listen = (key: string, prop: string, fn: Handler): Record<string, string> => {
    handlers[key] = fn;
    return { [prop]: key };
  };
  const control = (name: string, props: Record<string, unknown>, key: string, event: string, fn: Handler, children?: Child[]) =>
    component(name, props, { on: listen(key, event, fn), ...(children ? { slots: { children } } : {}) });
  const button = (props: Record<string, unknown>, key: string, fn: Handler, ...children: Child[]) => control('MusicButton', props, key, 'onPress', fn, children);
  const toggle = (props: Record<string, unknown>, key: string, fn: Handler, ...children: Child[]) => control('MusicToggle', props, key, 'onChange', fn, children);
  const face = (props: Record<string, unknown>, key: string, fn: Handler, ...children: Child[]) => control('MusicButtonFace', { size: 'medium', ...props }, key, 'onClick', fn, children);
  const knob = (props: Record<string, unknown>, key: string, fn: Handler) => control('MusicKnob', props, key, 'onChange', fn);
  const deckKnob = (name: string, controlName: DeckControl, param: unknown, value: number, hint: string, extra: Record<string, unknown> = {}) =>
    knob({ ink: 'var(--amber)', name, label: `${deckName} ${controlName === 'sendA' ? 'effects send A' : controlName === 'sendB' ? 'effects send B' : controlName === 'filterResonance' ? 'filter resonance' : name.toLowerCase()}`, param, value, hint, ...extra }, controlName, (value: number) => commands.setDeck(d.id, controlName, value));
  const columnRule = () => separatorView({ orientation: 'vertical', className: 'play-column-rule' });
  const host = (deckProps?.(d.id) ?? {}) as Record<string, unknown>;
  const native = hostAttributes(host, handlers);
  const hostStyle = mixerStyleText(host.style as object | string | undefined);

  const tree = wire(h('div', {
    ...native.attrs,
    class: `play-deck ${host.className ?? ''}`,
    style: `${hostStyle ? `${hostStyle}; ` : ''}--play-stems: ${d.stems.length}; --deck-ink: ${theme.decks[d.id]?.ink ?? theme.primary}`,
  },
  h('div', { class: 'play-track' },
    h('b', { class: 'play-letter' }, d.letter),
    h('div', {}, h('h3', {}, d.track?.title ?? 'Empty deck'), h('p', {}, d.track?.artist ?? d.message ?? d.status)),
    h('span', {}, d.track?.bpm != null && Number.isFinite(d.track.bpm) && d.track.bpm > 0 ? `${Math.round(d.track.bpm)} BPM` : null,
      h('br'), d.syncLeader ? 'LEADER' : d.track?.key ?? '')),
  mixerSectionTree('play-performance', [
    h('fieldset', { class: 'play-grid', 'data-full': flag(d.full), disabled: ready ? undefined : '' },
      separatorView({ orientation: 'vertical', className: 'play-hot-cue-divider' }),
      h('span', { class: 'play-axis' }, 'Hot cue'), h('span', { 'aria-hidden': 'true' }),
      d.stems.map(stem => ({ ...h('span', { class: 'play-stem-name', style: stemStyle(stem.id) }, stem.name), key: `heading:${stem.id}` })),
      d.sections.map(section => ({ ...h('div', { class: 'play-launch-row' },
        d.full ? toggle({
          title: 'Hot cue: jump to this section and continue playing', on: d.fullSection === section.id,
          label: `${deckName}: launch ${section.name} full mix${d.fullQueued === section.id ? ', queued' : ''}`,
          hint: 'Jumps this deck to that part of the song and keeps playing. It waits for the next bar unless launch timing is set to Now.',
        }, `launch:${section.id}`, () => commands.launch(d.id, section.id), section.name) : button({
          label: `${deckName}: launch ${section.name} all stems`, title: 'Hot cue: jump to this section and continue playing',
          hint: 'Jumps every stem on this deck to that part of the song and keeps playing. It waits for the next bar unless launch timing is set to Now.',
        }, `launch:${section.id}`, () => commands.launch(d.id, section.id), section.name),
        h('span', { 'aria-hidden': 'true' }),
        d.stems.map(stem => {
          const active = stem.selected === section.id, queued = stem.queued === section.id;
          return { ...h('div', { class: 'play-cell', 'data-active': flag(active), 'data-queued': flag(queued), style: stemStyle(stem.id) },
            toggle({
              disabled: !ready || !stem.available, on: active, ink: paint(stem.id), title: 'Loop this section on this stem', width: 34,
              label: `${deckName}: ${section.name} ${stem.name}${queued ? ', queued' : active ? ', selected' : ''}`,
              hint: `Loops that part of the song on ${stem.name.toLowerCase()} alone. The deck's other stems stay wherever they are, which is how a part is built up piece by piece.`,
            }, `launch:${section.id}:${stem.id}`, () => commands.launch(d.id, section.id, stem.id), queued ? '◷' : active ? '▶' : '▷')), key: `cell:${stem.id}` };
        })), key: `section:${section.id}` })),
      button({ label: `${deckName}: stop all stems`, hint: 'Stops every stem on this deck at the next launch point. The other decks carry on.' },
        'stop', () => commands.launch(d.id, null), (d.full ? d.fullQueued === null : d.stems.every(stem => stem.queued === null)) ? '◷ Stop' : 'Stop'),
      h('span', { 'aria-hidden': 'true' }),
      d.stems.map(stem => ({ ...button({
        disabled: !ready || !stem.available, label: `${deckName}: stop ${stem.name}`, width: 34,
        hint: `Stops ${stem.name.toLowerCase()} on this deck and leaves its other stems playing.`,
      }, `stop:${stem.id}`, () => commands.launch(d.id, null, stem.id), '■'), key: `stop:${stem.id}` }))),
    h('div', { class: 'play-deck-status' }, d.status !== 'empty' && d.status !== 'loading' && d.message ? h('span', { role: 'status' }, d.message) : null),
    h('div', { class: 'play-deck-loops', role: 'group', 'aria-label': `${deckName} loop` },
      button({
        disabled: !ready || !commands.deckLoopIn, label: `${deckName} loop in`, title: 'Mark loop start and Cue',
        hint: 'Marks the start of a loop where this deck is playing now. Press Out to close it and the deck begins repeating. Pressed again inside a running loop, it brings the loop’s front up to here.',
      }, 'loopIn', () => commands.deckLoopIn?.(d.id), 'In'),
      button({
        disabled: !d.canLoopOut || !commands.deckLoopOut, label: `${deckName} loop out`, title: 'Mark loop end and repeat',
        hint: 'Closes the loop here and starts it repeating. Pressed again inside a running loop, it pulls the loop’s tail back to here.',
      }, 'loopOut', () => commands.deckLoopOut?.(d.id), 'Out'),
      toggle({
        disabled: !ready || d.loop?.end == null || !commands.setDeckLoopEnabled, on: d.loop?.enabled ?? false,
        label: `${deckName} loop enabled`, title: d.loop?.enabled ? 'Exit loop, preserving its region' : 'Reloop saved region',
        hint: 'Leaves the loop and plays on, or drops back into the loop this deck has saved. The loop is kept either way.',
      }, 'loopEnabled', (on: boolean) => commands.setDeckLoopEnabled?.(d.id, on), d.loop?.enabled ? 'Exit' : d.loop?.start != null && d.loop.end == null ? 'Out…' : '↻'),
      commands.resizeLoop ? h('div', { class: 'wdg wdg-control-group play-loop-move', role: 'group', 'aria-label': `${deckName} loop length` },
        face({ disabled: !d.loop?.enabled || !d.gridAvailable, 'aria-label': `${deckName} halve loop`, title: 'Halve the loop, keeping In' }, 'halveLoop', () => commands.resizeLoop?.(d.id, .5), '½'),
        face({ disabled: !d.loop?.enabled || !d.gridAvailable, 'aria-label': `${deckName} double loop`, title: 'Double the loop, keeping In' }, 'doubleLoop', () => commands.resizeLoop?.(d.id, 2), '2×')) : null,
      commands.moveLoop ? h('div', { class: 'wdg wdg-control-group play-loop-move', role: 'group', 'aria-label': `${deckName} move loop` },
        face({ disabled: !d.loop?.enabled || !d.gridAvailable, 'aria-label': `${deckName} move loop back`, title: 'Slide the loop back one beat, leaving the playhead' }, 'loopBack', () => commands.moveLoop?.(d.id, -1), '←'),
        face({ disabled: !d.loop?.enabled || !d.gridAvailable, 'aria-label': `${deckName} move loop ahead`, title: 'Slide the loop ahead one beat, leaving the playhead' }, 'loopAhead', () => commands.moveLoop?.(d.id, 1), '→')) : null,
      h('div', { class: 'play-quick-loop-group' },
        commands.quickLoop ? face({
          className: 'play-quick-loop', disabled: !d.gridAvailable, 'aria-label': `${deckName} quick loop`,
          title: `${d.loop?.enabled ? 'Exit loop' : 'Quick loop'} · ${beatsText(loopBeats)}`, 'aria-pressed': d.loop?.enabled ?? false,
        }, 'quickLoop', () => commands.quickLoop?.(d.id), `↻ ${loopBeats}`) : null,
        commands.setSlip ? component('MusicContextControls', {
          label: `${deckName} loop settings`, active: !!d.slip, title: `Loop settings${d.slip ? ' · Slip on' : ''}`,
        }, { slots: { face: ['···'], children: [
          h('label', {}, 'Loop target', wire(h('select', {
            'aria-label': `${deckName} loop target`, disabled: d.loop?.start != null && d.loop.end === null ? '' : undefined,
            value: d.loopFocus ? 'focus' : 'deck',
          }, h('option', { value: 'deck' }, 'Active stems'), h('option', { value: 'focus' }, 'Focus only')),
          { on: listen('loopFocus', 'change', (event: Event) => commands.setLoopFocus?.(d.id, (event.target as HTMLSelectElement).value === 'focus')) })),
          h('label', { class: 'play-context-check' }, wire(h('input', {
            type: 'checkbox', 'aria-label': `${deckName} Slip loops`, checked: d.slip ? '' : undefined,
          }), { on: listen('slip', 'change', () => commands.setSlip?.(d.id, !d.slip)) }), 'Slip loops'),
        ] } }) : null)),
  ]),
  mixerSectionTree('play-effects', [
    deckKnob('FX A', 'sendA', SEND, d.sendA, 'How much of this deck reaches the shared FX A effect. Taken after the fader, so it falls away as you fade the deck out.'),
    columnRule(), h('div', { class: 'play-filter-pair' },
      deckKnob('Filter', 'filter', FILTER, d.filter, 'Sweeps a filter across this deck. Left takes the top off, right takes the bottom out, and the middle is untouched.'),
      params.filterResonance ? deckKnob('Resonance', 'filterResonance', params.filterResonance, d.filterResonance ?? 0, 'Emphasizes the filter cutoff on this deck. At center, Filter stays neutral. Resonance can raise peaks; lower Trim if needed.') : null),
    columnRule(), deckKnob('FX B', 'sendB', SEND, d.sendB, 'How much of this deck reaches the shared FX B effect. Taken after the fader, so it falls away as you fade the deck out.'),
  ]),
  mixerSectionTree('play-channel', [
    knobStackTree(d.stems.map(stem => ({ ...knob({
      disabled: d.full || !ready || !stem.available, name: stem.name, label: `${deckName} ${stem.name} level`,
      param: params.stemLevel ?? LEVEL, value: stem.level, display: params.stemLevelDisplay?.(stem.level), ink: paint(stem.id),
      hint: `How loud ${stem.name.toLowerCase()} is inside this deck, before the deck fader. Turn it down to play the song without it.`,
    }, `stemLevel:${stem.id}`, (value: number) => commands.setStemLevel(d.id, stem.id, value)), key: stem.id })), { stems: true, full: d.full }),
    columnRule(),
    h('div', { class: 'play-level-stack' }, h('div', { class: 'play-channel-fader' },
      control('MusicSlider', {
        name: '', showValue: false, label: `${deckName} level`, param: LEVEL, value: d.gain, length: 'auto',
        hint: "This deck's level in the mix. The top of its travel is unity, so it only ever takes away — Trim is where a quiet track gets louder.",
      }, 'gain', 'onChange', (value: number) => commands.setDeck(d.id, 'gain', value)),
      ['left', 'right'].map((side, channel) => ({ ...h('div', { class: 'play-meter-column' },
        control('MusicFrameMeter', { label: `${deckName} ${side} output` }, `meter:${side}`, 'sample', () => readFrame().decks[d.id]?.stereo?.[channel] ?? 0),
        h('span', {}, side === 'left' ? 'L' : 'R')), key: side })))),
    columnRule(),
    knobStackTree([
      deckKnob('Trim', 'trim', TRIM, d.trim, 'Lifts or cuts the deck before everything else, from −24 to +12 dB. This is what matches a quiet record to a loud one, not the fader.', { className: 'play-trim', origin: 'center' }),
      ...['High', 'Mid', 'Low'].map((name, band) => ({ ...knob({
        name, label: `${deckName} ${name}`, param: EQ, origin: 'center', value: d.eq[band],
        hint: `Lifts or cuts this deck's ${name.toLowerCase()} band. It rests at 0 dB, which is the record as it was, and cuts much further than it lifts.`,
      }, `eq:${band}`, (value: number) => commands.setDeckEq(d.id, band, value)), key: name })),
    ]),
  ]),
  h('div', { class: 'play-deck-footer' },
    h('div', { class: 'play-routing-section' }, separatorView(), h('div', { class: 'play-route' },
      toggle({
        disabled: !ready || !d.stems.some(stem => stem.available), on: d.full, label: `${deckName} original full mix`,
        title: 'Use the original unseparated track instead of stems',
        hint: 'Plays the original recording instead of its separated stems. The stem controls go quiet, since there are no stems to move.',
      }, 'full', (value: boolean) => commands.setDeck(d.id, 'full', value), 'Full'), columnRule(),
      control('MusicSegmented', {
        name: '', label: `${deckName} crossfade assignment`, items: ['A', 'Thru', 'B'], index: d.route,
        hint: 'Which side of the crossfader this deck answers to. Thru takes it off the crossfader altogether, so it plays wherever the crossfader sits.',
      }, 'route', 'onChange', (value: number) => commands.setDeck(d.id, 'route', value)), columnRule(),
      toggle({
        on: d.cue, label: `${deckName} headphone cue`, title: 'Headphone monitoring',
        hint: 'Sends this deck to the headphones only. It is taken before the fader and the crossfader, so you can hear a deck the audience cannot.',
      }, 'cue', (value: boolean) => commands.setDeck(d.id, 'cue', value), phonesIconView())), separatorView()),
    h('div', { class: 'play-deck-transport', role: 'group', 'aria-label': `${deckName} transport` },
      toggle({
        className: 'play-transport-button play-transport-play', on: d.playing ?? false, disabled: !ready || !commands.setDeckPlaying,
        label: `${deckName} play/pause`, title: commands.setDeckPlaying ? 'Play / Pause' : 'Deck playback is not connected yet',
        hint: "Plays or pauses this deck on its own, from where it left off. The header's play button moves every loaded deck at once.",
      }, 'playing', (playing: boolean) => commands.setDeckPlaying?.(d.id, d.cueHeld ? true : playing), d.playing ? 'Ⅱ' : '▶'),
      component('MusicMomentary', { held: d.cueHeld ?? false, disabled: !ready || !commands.cueDeck, label: `${deckName} transport cue` }, {
        on: { ...listen('cueHold', 'onHold', (held: boolean) => commands.cueDeck?.(d.id, held)), ...listen('cueTakeover', 'onTakeover', () => commands.setDeckPlaying?.(d.id, true)) },
        slots: { children: ['CUE'] },
      }),
      toggle({
        className: 'play-transport-button', on: d.synced ?? false, disabled: !ready || !commands.setDeckSync,
        label: `${deckName} sync`, title: commands.setDeckSync ? 'Sync deck to the shared tempo and beat' : 'Deck playback is not connected yet',
        hint: 'Holds this deck to the shared tempo and to the beat the other decks are on. It needs a saved beat grid to know where its beats are; without one the deck plays at the speed it was recorded.',
      }, 'synced', (synced: boolean) => commands.setDeckSync?.(d.id, synced), 'Sync'),
      commands.beatJump ? h('div', { class: 'play-beat-jump', role: 'group', 'aria-label': `${deckName} beat jump` },
        h('div', { class: 'wdg wdg-control-group play-beat-jump-pair' },
          face({ disabled: !d.gridAvailable, 'aria-label': `${deckName} jump forward one beat`, title: 'Advance active stems together by 1 beat' }, 'jumpAhead', () => commands.beatJump?.(d.id, 1), h('span', { class: 'play-jump-stacked' }, '↑'), h('span', { class: 'play-jump-abreast' }, '→')),
          face({ disabled: !d.gridAvailable, 'aria-label': `${deckName} jump backward one beat`, title: 'Rewind active stems together by 1 beat' }, 'jumpBack', () => commands.beatJump?.(d.id, -1), h('span', { class: 'play-jump-stacked' }, '↓'), h('span', { class: 'play-jump-abreast' }, '←')))) : null)),
  ), { on: native.on, bind: [
    ...(native.captures.length ? [['musicDeckHost', { captures: native.captures, onCapture: 'hostCapture' }]] as [string, object][] : []),
    ...(handlers.hostRef ? [['ref', { onRef: 'hostRef' }]] as [string, object][] : []),
  ] });
  return { tree, handlers };
}

export const deckStripView = (props: DeckStripProps): Node => deckStripModel(props).tree;
export const deckStripHandlers = (props: DeckStripProps): Handlers => deckStripModel(props).handlers;
