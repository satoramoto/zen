import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { PROGRESSION_STRIP_FORMS } from './ProgressionStrip.forms';
import { progressionStripHandlers, progressionStripView, type ProgressionStripProps } from './ProgressionStrip.model';
import '../../base.css';
import '../live.css';
import './ProgressionStrip.css';

export {
  CHORD_STATES,
  PROGRESSION_FOLLOWS,
  chordProgress,
  chordState,
  type ChordState,
  type ProgressionFollow,
  type ProgressionChord,
  type ProgressionStripProps,
} from './ProgressionStrip.model';
export { PROGRESSION_STRIP_FORMS, type ProgressionStripForm } from './ProgressionStrip.forms';

/**
 * The progression loop the band follows, in mix[flow]'s face: a row of launch cells, each chord's
 * name over its notes and as wide as its beats; the chord now filled with the accent, the next one
 * outlined in it, the selection on a 2px foot rule; a thin bar under the row for where the loop is
 * (from `beat`). The head carries the loop's length, the Follow switch (Live / Loop) and the
 * Mutate / Keep / Revert buttons. It holds no state: a press asks `onSelect`, `onFollow` or the
 * button's callback, and a missing callback leaves that part read-only. Forms
 * (`PROGRESSION_STRIP_FORMS`): `full` name over notes, `compact` names in 24px cells.
 */
export function ProgressionStrip(props: ProgressionStripProps) {
  const form = useForm(PROGRESSION_STRIP_FORMS, props.form);
  return <Tree tree={progressionStripView(props, form)} handlers={progressionStripHandlers(props)} />;
}

ProgressionStrip.forms = PROGRESSION_STRIP_FORMS;

export default ProgressionStrip;
