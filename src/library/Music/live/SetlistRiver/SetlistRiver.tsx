import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { SETLIST_RIVER_FORMS } from './SetlistRiver.forms';
import { setlistRiverHandlers, setlistRiverView, type SetlistRiverProps } from './SetlistRiver.model';
import '../../base.css';
import '../live.css';
import './SetlistRiver.css';

export {
  SCENE_STATES,
  SONG_STATES,
  clock,
  contourPath,
  riverSpan,
  tempoBand,
  type RiverScene,
  type RiverSong,
  type SceneState,
  type SetlistRiverProps,
  type SongState,
} from './SetlistRiver.model';
export { SETLIST_RIVER_FORMS, type SetlistRiverForm } from './SetlistRiver.forms';

/**
 * The whole night as one timeline, in mix[flow]'s face: each song a cell as wide as its planned
 * minutes, so the set reads as time, not a list. Over the songs the tempo contour, drawn as a
 * waveform lane (each song a plateau at its BPM, its mono BPM over it, the jumps between them the
 * transitions the band has to make); under them a minute ruler. Played songs are hatched and
 * dimmed; the song now is edged in the accent and opens into its scenes (launch cells, the playing
 * one filled); the cued song is dashed with its countdown; a jam is a dashed free stretch. One 1px
 * playhead runs through every band. Controlled: a song asks `onPick(id)`, a scene `onScene(id)`;
 * without them the river is read-only. Forms (`SETLIST_RIVER_FORMS`): `river` the head, contour,
 * songs with scenes and ruler; `strip` the songs alone.
 */
export function SetlistRiver(props: SetlistRiverProps) {
  const form = useForm(SETLIST_RIVER_FORMS, props.form);
  return <Tree tree={setlistRiverView(props, form)} handlers={setlistRiverHandlers(props)} />;
}

SetlistRiver.forms = SETLIST_RIVER_FORMS;

export default SetlistRiver;
