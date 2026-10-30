import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { TRACK_STRIPS_FORMS } from './TrackStrips.forms';
import { trackStripsHandlers, trackStripsView, type TrackStripsProps } from './TrackStrips.model';
import '../../base.css';
import '../live.css';
import './TrackStrips.css';

export {
  STRIP_LEVEL,
  STRIP_SEND,
  dbText,
  percentText,
  type TrackReturn,
  type TrackSend,
  type TrackStrip,
  type TrackStripsProps,
} from './TrackStrips.model';
export { TRACK_STRIPS_FORMS, type TrackStripsForm } from './TrackStrips.forms';

/**
 * The looper's mixer, in mix[flow]'s face (DeckStrip's channel section, one narrow channel per
 * track): the track's letter in its ink and its name (a press selects it), two send knobs (A, B,
 * read in %), the fader beside its meter in a well with the level in dB under it, and M / S / ●
 * (arm lights red). FX A / FX B returns close the row at the right, a fader each. Holds no state:
 * every move asks a callback, and a part without one is drawn disabled. Forms
 * (`TRACK_STRIPS_FORMS`): `tall` everything, `short` without the send knobs.
 */
export function TrackStrips(props: TrackStripsProps) {
  const form = useForm(TRACK_STRIPS_FORMS, props.form);
  return <Tree tree={trackStripsView(props, form)} handlers={trackStripsHandlers(props)} />;
}

TrackStrips.forms = TRACK_STRIPS_FORMS;

export default TrackStrips;
