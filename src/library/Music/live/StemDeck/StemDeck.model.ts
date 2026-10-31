// StemDeck's model: a song's separated stems on one deck (the stems wireframe: drums, bass, vocals,
// other, each routed to a track or the playback deck), and the tree both renderers draw from them.
// No framework: `StemDeck.tsx` and `StemDeck.svelte` both pass `stemDeckView` and `stemDeckHandlers`
// to their `Tree`. Each lane is mix[flow]'s waveform (`MusicWaveform`, drawn from the host's measured
// peaks) under its ink letter, name, route and a mute toggle (`MusicToggle`, as TrackStrips' M).
// It holds no state and plays nothing: a toggle only asks `onMute`. The playhead, the section
// marks and whether a stem is audible are the host's to say; a lane with no peaks says so rather
// than drawing a waveform it doesn't have.
import { component, each, h, styleText, when, type ChildArg, type Handlers, type Node } from '../../../view/Tree.model';
import type { Peak } from '../../music/levels';
import { inkStyle, liveHead, livePane, liveReading, type StemInk } from '../live.model';
import { dbText } from '../TrackStrips/TrackStrips.model';
import type { StemDeckForm } from './StemDeck.forms';

/** One separated stem. */
export interface DeckStem {
  /** What `onMute` carries. Unique on the deck. */
  id: string;
  /** `'Drums'`. Its first letter is the toggle's word in `toggles`. */
  name: string;
  ink: StemInk;
  /** Where it plays: `'DRUMS track'`, `'PLAYBACK (bed)'`. */
  to?: string;
  muted?: boolean;
  /** Its gain, 0–1 (1 is unity), read as dB. Left out: no reading. */
  gain?: number;
  /** The host's measured envelope of the stem. Left out or empty: no waveform, and the lane says so. */
  peaks?: readonly Peak[];
  /** False: the host can't play it now (not separated yet, not loaded). Drawn, not pressable; `reason` says why. */
  available?: boolean;
  reason?: string;
}

/** A section's mark along the song: where it starts (0–1 of the song) and its name. */
export interface DeckMarker {
  at: number;
  name: string;
}

export interface StemDeckProps {
  /** The song on the deck: `'Hidden Signals'`. */
  title: string;
  /** The host's reading under it: `'120 · Am · warped'`. */
  sub?: string;
  stems: readonly DeckStem[];
  /** Section marks along the lanes, from the host's beat map. */
  markers?: readonly DeckMarker[];
  /** The playhead, 0–1 of the song. Left out (or non-finite): none is drawn. */
  position?: number;
  /** A stem's toggle was pressed: ask to mute or unmute it. Without it the deck is read-only. */
  onMute?: (id: string) => void;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: StemDeckForm;
  className?: string;
}

const LANE_HEIGHT = 36;
const finite = (n: number | undefined): n is number => n !== undefined && Number.isFinite(n);
const pct = (n: number): string => `${(Math.min(1, Math.max(0, n)) * 100).toFixed(2)}%`;
const keyed = (child: ChildArg, key: string): ChildArg => (child && typeof child === 'object' ? { ...(child as Node), key } : child);

/**
 * A stem's toggle. In a lane it is an M lamp, lit while muted (TrackStrips' M); in the ONE board's
 * strip it is the stem's letter, lit while it plays. Either asks `onMute` to flip it.
 */
function muteToggle(stem: DeckStem, inert: boolean, text: string, lit: 'muted' | 'audible'): ChildArg {
  const unavailable = stem.available === false;
  const muted = stem.muted === true;
  const name = lit === 'muted' ? `Mute ${stem.name}` : `${stem.name} audible`;
  return keyed(
    component(
      'MusicToggle',
      {
        on: lit === 'muted' ? muted : !muted && !unavailable,
        label: `${name}${unavailable ? `, unavailable${stem.reason ? `: ${stem.reason}` : ''}` : ''}`,
        disabled: inert || unavailable,
        ink: `var(--stem-${stem.ink})`,
        className: 'live-stems-toggle',
      },
      { on: { onChange: `mute:${stem.id}` }, slots: { children: [text] } },
    ),
    'mute',
  );
}

function lane(stem: DeckStem, inert: boolean): Node {
  const peaks = stem.available === false ? undefined : stem.peaks;
  return h(
    'div',
    {
      class: 'live-stems-lane',
      'data-part': 'lane',
      'data-stem': stem.id,
      'data-muted': stem.muted ? 'true' : undefined,
      'data-unavailable': stem.available === false ? 'true' : undefined,
      role: 'group',
      'aria-label': `${stem.name} stem${stem.muted ? ', muted' : ''}`,
      style: inkStyle(stem.ink),
    },
    h(
      'div',
      { class: 'live-stems-head', 'data-part': 'head' },
      h('span', { class: 'live-mark', 'aria-hidden': 'true' }, stem.name.slice(0, 1)),
      h('span', { class: 'live-stems-name' }, stem.name),
      when(stem.to !== undefined, () => h('span', { class: 'live-stems-to', 'data-part': 'to' }, `→ ${stem.to}`)),
      muteToggle(stem, inert, 'M', 'muted'),
      liveReading(finite(stem.gain) ? dbText(stem.gain) : '—', { 'data-part': 'gain' }),
    ),
    h(
      'div',
      { class: 'live-stems-well', 'data-part': 'well' },
      peaks && peaks.length
        ? component('MusicWaveform', { peaks, ink: `var(--stem-${stem.ink})`, height: LANE_HEIGHT, label: `${stem.name}: measured stem envelope`, className: 'live-stems-wave' })
        : h('span', { class: 'live-axis live-stems-none', 'data-part': 'no-waveform' }, stem.available === false ? stem.reason ?? 'unavailable' : 'no waveform'),
    ),
  );
}

/**
 * The tree StemDeck draws. `lanes`: the head (the song and the host's reading), the section marks
 * over the lanes and one lane per stem — its ink letter, name, route, mute toggle and gain over its
 * waveform in a well — with the host's playhead across them. `toggles`: the ONE board's deck strip,
 * a toggle per stem (its first letter) in a row. `form` is the binding's (`useForm` / `getForm`).
 */
export function stemDeckView({ title, sub, stems, markers = [], position, onMute, className }: StemDeckProps, form: StemDeckForm): Node {
  const inert = onMute === undefined;
  if (form === 'toggles') {
    return livePane(
      'stems',
      { class: className, 'data-form': form, 'data-inert': inert ? 'true' : undefined, role: 'group', 'aria-label': `${title} stems` },
      stems.length === 0
        ? h('span', { class: 'live-axis', 'data-part': 'empty' }, 'No stems')
        : h('div', { class: 'live-stems-toggles', 'data-part': 'toggles' }, ...each(stems, (st) => st.id, (st) => h('span', { class: 'live-stems-chip', style: inkStyle(st.ink) }, muteToggle(st, inert, st.name.slice(0, 1), 'audible')))),
    );
  }
  const head = liveHead({ title, sub: sub ?? (inert ? 'read-only' : undefined), aside: `${stems.length} ${stems.length === 1 ? 'stem' : 'stems'}` });
  return livePane(
    'stems',
    { class: className, 'data-form': form, 'data-inert': inert ? 'true' : undefined, role: 'group', 'aria-label': `${title} stems` },
    head,
    stems.length === 0
      ? h('div', { class: 'live-stems-empty', 'data-part': 'empty' }, h('span', { class: 'live-axis' }, 'No stems'))
      : h(
          'div',
          { class: 'live-stems-body', 'data-part': 'body' },
          h(
            'div',
            { class: 'live-stems-marks', 'data-part': 'marks', 'aria-label': 'Sections', role: markers.length ? 'list' : undefined },
            ...each(markers, (m) => `${m.name}@${m.at}`, (m) => h('span', { class: 'live-stems-mark', role: 'listitem', style: styleText({ left: pct(m.at) }) }, m.name)),
          ),
          h('div', { class: 'live-stems-lanes', 'data-part': 'lanes' }, ...each(stems, (st) => st.id, (st) => lane(st, inert))),
          when(finite(position), () =>
            h('span', { class: 'live-stems-playhead', 'data-part': 'playhead', 'aria-hidden': 'true', style: styleText({ '--live-stems-at': pct(position!) }) }),
          ),
        ),
  );
}

/** The callbacks the tree names: one mute per stem (`mute:<id>`), carrying its id. An unavailable stem asks nothing. */
export function stemDeckHandlers({ stems, onMute }: StemDeckProps): Handlers {
  const handlers: Handlers = {};
  for (const st of stems) handlers[`mute:${st.id}`] = () => {
    if (st.available !== false) onMute?.(st.id);
  };
  return handlers;
}
