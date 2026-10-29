// The original four-deck composition. The host remains authoritative for every musical state.
import { component, h, styleText, type Child, type Handler, type Handlers, type Node, type Root } from '../../view/Tree.model';
import { styleAttr } from '../../view/style';
import { scopedView, type MusicView } from '../compose';
import { deckStripModel } from './DeckStrip.model';
import { masterStripHandlers, masterStripView } from './MasterStrip.model';
import { waveControlsHandlers, waveControlsView } from './WaveControls.model';
import { framePlayheadHandlers, framePlayheadView, frameWaveformHandlers, frameWaveformView } from './frames.model';
import type { MixerViewProps } from './model';

/** Native host attributes on each waveform drop target; event handlers are kept out of attributes. */
function hostAttributes(props: Record<string, unknown> | undefined): Record<string, string | undefined> {
  const attrs: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(props ?? {})) {
    if (key === 'children' || key === 'ref' || key.startsWith('on') || value == null || typeof value === 'function') continue;
    if (key === 'className') attrs.class = String(value);
    else if (key === 'style' && typeof value === 'object') {
      attrs.style = styleAttr(value);
    } else {
      const name = ({ tabIndex: 'tabindex', contentEditable: 'contenteditable', spellCheck: 'spellcheck', htmlFor: 'for' } as Record<string, string>)[key] ?? key;
      attrs[name] = typeof value === 'boolean' ? (key.startsWith('aria-') || key.startsWith('data-') || ['draggable', 'contentEditable', 'spellCheck'].includes(key) ? String(value) : value ? '' : undefined) : String(value);
    }
  }
  return attrs;
}

function hostEvents(props: Record<string, unknown> | undefined, deckId: string): Record<string, string> {
  return Object.fromEntries(Object.entries(props ?? {}).filter(([key, value]) => /^on[A-Z]/.test(key) && !key.endsWith('Capture') && typeof value === 'function').map(([key]) => [key.slice(2).toLowerCase(), `host:${deckId}:${key}`]));
}

/** The same DOM anatomy as the reference, shared by React and Svelte. */
export function mixerModel(props: MixerViewProps): MusicView {
  const { state, commands, readFrame, theme, params, deckProps, externalTransport } = props;
  const { decks, beat, loop } = state;
  const common = { commands, readFrame, theme, params };
  const scopedPrimary = /^\s*var\(\s*--(?:primary|amber)\s*(?:,[^)]*)?\)\s*$/.test(theme.primary);
  const handlers: Handlers = {};
  const include = (tree: Root, callbacks: Handlers, prefix: string): Root => {
    const scoped = scopedView(tree, callbacks, prefix);
    Object.assign(handlers, scoped.handlers);
    return scoped.tree;
  };
  const tree = h('div', {
    class: 'zen-music wdg play-example',
    style: styleText({
      '--play-signal': theme.signal,
      '--primary': scopedPrimary ? undefined : theme.primary,
      '--amber': scopedPrimary ? undefined : theme.primary,
      '--play-deck-min': `${Math.max(200, ...decks.map((deck) => 56 + deck.stems.length * 36))}px`,
    }),
  },
  h('div', { class: 'play-timeline', 'aria-label': 'Four decks aligned to a shared 32-bar preview' }, decks.map((deck, index) => {
    const host = deckProps?.(deck.id) as Record<string, unknown> | undefined;
    const attrs = hostAttributes(host);
    for (const [key, value] of Object.entries(host ?? {})) {
      if (/^on[A-Z]/.test(key) && typeof value === 'function') handlers[`host:${deck.id}:${key}`] = value as Handler;
    }
    const captures = Object.entries(host ?? {}).filter(([key, value]) => /^on[A-Z].*Capture$/.test(key) && typeof value === 'function');
    if (captures.length) handlers[`capture:${deck.id}`] = (event: Event) => {
      for (const [key, callback] of captures) if (key.slice(2, -7).toLowerCase() === event.type) (callback as Handler)(event);
    };
    if (typeof host?.ref === 'function') handlers[`ref:${deck.id}`] = host.ref as Handler;
    const waveProps = { deck, index, commands, readFrame };
    const frameProps = { ...waveProps, ink: theme.decks[deck.id]?.waveform ?? theme.primary, theme };
    const playheadProps = { readFrame, deckId: deck.id };
    const waveChildren: Root = deck.waveform
      ? include(frameWaveformView(frameProps), frameWaveformHandlers(frameProps), `frame:${deck.id}`)
      : [
        component('MusicWaveform', { peaks: deck.peaks, ink: theme.decks[deck.id]?.waveform ?? theme.primary, height: 48, label: `Deck ${index + 1} waveform on the shared beat grid` }),
        loop.start !== null ? h('div', {
          class: 'play-loop-region', 'data-enabled': String(loop.enabled),
          style: styleText({ left: `${Math.max(0, loop.start - Math.floor(beat / 128) * 128) / 128 * 100}%`, width: `${Math.max(0, Math.min(128, (loop.end ?? loop.start) - Math.floor(beat / 128) * 128) - Math.max(0, loop.start - Math.floor(beat / 128) * 128)) / 128 * 100}%`, '--loop-ink': 'var(--amber)' }),
        }, h('span', {}, loop.end === null ? 'IN' : `↻ ${loop.end - loop.start} beats`)) : null,
        h('span', { class: 'play-wave-grid' }),
        ...(deck.track
          ? [include(framePlayheadView(playheadProps), framePlayheadHandlers(playheadProps), `playhead:${deck.id}`)]
          : [h('span', { class: 'play-playhead', style: 'left: 25%' })]),
      ].flat() as Child[];
    const row = h('div', {
      ...attrs,
      class: `play-wave-row ${attrs.class ?? ''}`,
      style: `${attrs.style ?? ''}; --deck-ink: ${theme.decks[deck.id]?.ink ?? theme.primary}`,
    },
    h('div', { class: 'play-wave-label' }, h('b', {}, deck.letter), h('span', {}, deck.track?.title ?? deck.message ?? 'Empty deck')),
    h('div', { class: 'play-wave-lane' }, include(waveControlsView(waveProps, waveChildren), waveControlsHandlers(waveProps), `wave:${deck.id}`)),
    );
    row.key = deck.id;
    row.on = hostEvents(host, deck.id);
    row.bind = [
      ...(captures.length ? [['musicDeckHost', { captures: captures.map(([key]) => key.slice(2, -7).toLowerCase()), onCapture: `capture:${deck.id}` }] as [string, object]] : []),
      ...(typeof host?.ref === 'function' ? [['ref', { onRef: `ref:${deck.id}` }] as [string, object]] : []),
    ];
    return row;
  })),
  h('div', { class: 'play-scroll' }, h('div', { class: 'play-decks' }, decks.flatMap((deck, index) => {
    const model = deckStripModel({ ...common, deckProps, deck, index, loopBeats: state.loopBeats });
    const strip = include(model.tree, model.handlers, `deck:${deck.id}`) as Node;
    strip.key = deck.id;
    const master = index === 1 ? include(masterStripView(props), masterStripHandlers(props), 'master') as Node : null;
    if (master) master.key = 'master';
    return [strip, master];
  }))),
  );
  return { tree, handlers };
}

/** Public model helpers; bindings use mixerModel once so both halves share one host snapshot. */
export const mixerView = (props: MixerViewProps): Node => mixerModel(props).tree as Node;
export const mixerHandlers = (props: MixerViewProps): Handlers => mixerModel(props).handlers;
