import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { CHORD_COMPASS_FORMS } from './ChordCompass.forms';
import { chordCompassHandlers, chordCompassView, type ChordCompassProps } from './ChordCompass.model';
import '../../base.css';
import '../live.css';
import './ChordCompass.css';

export { FOLLOW_MODES, MAJORS, MINORS, loopPath, placeChord, type ChordCompassProps, type CompassChord, type CompassRing, type FollowMode } from './ChordCompass.model';
export { CHORD_COMPASS_FORMS, type ChordCompassForm } from './ChordCompass.forms';

/**
 * Where the harmony is and where it's going, in mix[flow]'s face: the circle of fifths (majors
 * outside, relative minors inside) as flat wedges, the song's key a faint `--primary` tint three
 * slots wide, the chord now solid `--primary`, the next outlined. The progression loop is a thin
 * closed path between its chords — a ii–V–I a short hop, a borrowed chord a long line across — and
 * the move about to happen is its one strong segment, ending on a ring. Controlled: a wedge asks
 * `onPick(name)`, the follow switch `onFollow`, the lock `onBassLock`. Forms
 * (`CHORD_COMPASS_FORMS`): `wheel` the wheel beside a readout column, `dial` the wheel alone with
 * the chord and the next one in its hub.
 */
export function ChordCompass(props: ChordCompassProps) {
  const form = useForm(CHORD_COMPASS_FORMS, props.form);
  return <Tree tree={chordCompassView(props, form)} handlers={chordCompassHandlers(props)} />;
}

ChordCompass.forms = CHORD_COMPASS_FORMS;

export default ChordCompass;
