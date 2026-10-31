import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { SONG_CARD_FORMS } from './SongCard.forms';
import { songCardHandlers, songCardView, type SongCardProps } from './SongCard.model';
import '../../base.css';
import '../live.css';
import './SongCard.css';

export { songReading, type CardNext, type CardSong, type SongCardProps } from './SongCard.model';
export { SONG_CARD_FORMS, type SongCardForm } from './SongCard.forms';

/**
 * The song now and the song next, in mix[flow]'s face: the ONE board's header card. Its place in
 * the set and its reading (`Song 3/7`, `120 · Am`) over its name; the next song under it, its cue
 * word in the accent when the host has cued it; JAM at the right, lit while the host jams. It holds
 * no state: JAM asks `onJam()`, and without `onJam` there is no JAM. Forms (`SONG_CARD_FORMS`):
 * `card`, and `chip` one status line.
 */
export function SongCard(props: SongCardProps) {
  const form = useForm(SONG_CARD_FORMS, props.form);
  return <Tree tree={songCardView(props, form)} handlers={songCardHandlers(props)} />;
}

SongCard.forms = SONG_CARD_FORMS;

export default SongCard;
