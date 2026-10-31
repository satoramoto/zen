import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { STEM_DECK_FORMS } from './StemDeck.forms';
import { stemDeckHandlers, stemDeckView, type StemDeckProps } from './StemDeck.model';
import '../../base.css';
import '../live.css';
import './StemDeck.css';

export { type DeckMarker, type DeckStem, type StemDeckProps } from './StemDeck.model';
export { STEM_DECK_FORMS, type StemDeckForm } from './StemDeck.forms';

/**
 * A song's separated stems on one deck, in mix[flow]'s face: a lane per stem in its ink — letter,
 * name, where it plays, an M toggle and its gain over the host's measured waveform — with the
 * host's section marks along the top and its playhead across the lanes. A lane with no envelope
 * says so. It holds no state and plays nothing: a toggle asks `onMute(id)`, and without `onMute`
 * the deck is read-only. Forms (`STEM_DECK_FORMS`): `lanes` the deck, `toggles` the ONE board's
 * strip of one toggle per stem.
 */
export function StemDeck(props: StemDeckProps) {
  const form = useForm(STEM_DECK_FORMS, props.form);
  return <Tree tree={stemDeckView(props, form)} handlers={stemDeckHandlers(props)} />;
}

StemDeck.forms = STEM_DECK_FORMS;

export default StemDeck;
