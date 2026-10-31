// SongCard's model: the song now and the song next, as the ONE wireframe's header card has them
// (SONG 3/7 · 120 · Am, the name, NEXT · Big Red · 128 · E · cued, JAM from here), and the tree both
// renderers draw from them. No framework: `SongCard.tsx` and `SongCard.svelte` both pass
// `songCardView` and `songCardHandlers` to their `Tree`. It holds no state: JAM only asks `onJam`.
// Which song plays, which is cued and when it lands are the host's to say.
import { component, h, when, type Handlers, type Node } from '../../../view/Tree.model';
import { livePane, liveReading } from '../live.model';
import type { SongCardForm } from './SongCard.forms';

/** A song as the card names it. */
export interface CardSong {
  id: string;
  name: string;
  tempo?: number;
  /** `'Am'`. */
  key?: string;
}

/** The song after this one: cued (it lands next, in `barsToCue`) or just ahead in the setlist. */
export interface CardNext extends CardSong {
  cued?: boolean;
  /** Bars until it lands, when cued. */
  barsToCue?: number;
}

export interface SongCardProps {
  /** The song playing. Left out: between songs, or a jam. */
  song?: CardSong;
  /** Its place in the setlist, 1-based, and the setlist's length: `SONG 3/7`. */
  index?: number;
  total?: number;
  next?: CardNext;
  /** The host is in a jam: no song, free. */
  jam?: boolean;
  /** JAM was pressed: ask the host to go free from here (or back). Without it there's no JAM. */
  onJam?: () => void;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: SongCardForm;
  className?: string;
}

const bars = (n: number): string => `${n} ${n === 1 ? 'bar' : 'bars'}`;
/** A song's mono reading: `120 · Am`. */
export const songReading = ({ tempo, key }: CardSong): string => [tempo !== undefined && Number.isFinite(tempo) ? String(tempo) : undefined, key].filter(Boolean).join(' · ');
const nextWord = (n: CardNext): string => (n.cued ? (n.barsToCue !== undefined ? `cued · in ${bars(n.barsToCue)}` : 'cued') : 'next');

/**
 * The tree SongCard draws. `card`: the place in the set and the song's reading over its name, the
 * next song (cued or not) under it, and JAM at the right, lit while the host jams. `chip`: one line,
 * the song now and the one next, nothing to press. `form` is the binding's (`useForm` / `getForm`).
 */
export function songCardView({ song, index, total, next, jam = false, onJam, className }: SongCardProps, form: SongCardForm): Node {
  const place = index !== undefined ? `Song ${index}${total !== undefined ? `/${total}` : ''}` : jam ? 'Jam' : 'Song';
  const name = song?.name ?? (jam ? 'Free · jam' : 'between songs');
  if (form === 'chip') {
    const text = `${index !== undefined ? `${index}${total !== undefined ? `/${total}` : ''} ` : ''}${name}${next ? ` → ${next.name}${next.cued && next.barsToCue !== undefined ? ` in ${bars(next.barsToCue)}` : ''}` : ''}`;
    return livePane('song', { class: className, 'data-form': form, role: 'status', 'aria-label': text }, h('span', { class: 'live-song-chip', 'data-part': 'chip' }, text));
  }
  return livePane(
    'song',
    { class: className, 'data-form': form, 'data-jam': jam ? 'true' : undefined, role: 'group', 'aria-label': `${place}: ${name}` },
    h(
      'div',
      { class: 'live-song-now', 'data-part': 'now' },
      h('div', { class: 'live-song-line' }, h('span', { class: 'live-axis', 'data-part': 'place' }, place), when(song !== undefined, () => liveReading(songReading(song!), { 'data-part': 'reading' }))),
      h('h3', { class: 'live-song-name', 'data-part': 'name' }, name),
      when(next !== undefined, () =>
        h(
          'div',
          { class: 'live-song-line live-song-next', 'data-part': 'next', 'data-cued': next!.cued ? 'true' : undefined },
          h('span', { class: 'live-axis' }, `Next · ${next!.name}${songReading(next!) ? ` · ${songReading(next!)}` : ''}`),
          h('span', { class: 'live-song-cue', 'data-part': 'cue' }, nextWord(next!)),
        ),
      ),
    ),
    when(onJam !== undefined, () =>
      component('MusicToggle', { on: jam, label: jam ? 'Jam, playing' : 'Jam from here', className: 'live-song-jam' }, { on: { onChange: 'jam' }, slots: { children: ['JAM'] } }),
    ),
  );
}

/** The callback the tree names: JAM. */
export function songCardHandlers({ onJam }: SongCardProps): Handlers {
  return { jam: () => onJam?.() };
}
