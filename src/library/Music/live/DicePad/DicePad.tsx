import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { DICE_PAD_FORMS } from './DicePad.forms';
import { dicePadHandlers, dicePadView, type DicePadProps } from './DicePad.model';
import '../../base.css';
import '../live.css';
import './DicePad.css';

export { DICE_MOVES, DICE_ROW, DICE_WORDS, SCALE_LOCKS, canRoll, type DiceMove, type DicePadProps, type ScaleLock } from './DicePad.model';
export { DICE_PAD_FORMS, type DicePadForm } from './DicePad.forms';

/**
 * The happy accidents in mix[flow]'s face: MUTATE, SHAKE, ROTATE, RATIO ↑, KEEP and REVERT as the
 * Music buttons the orbits already carry, each over the wireframe's caption; the scale lock; the one
 * CHAOS macro. Every move but SHAKE aims at the selected `target`, and can't ask without one. It
 * rolls nothing: a press asks `onDice(move)`, the lock `onScaleLock`, the macro `onChaos` (0–1);
 * a move missing from `moves` is drawn disabled. Forms (`DICE_PAD_FORMS`): `full`, and `row` the
 * ONE board's dice row.
 */
export function DicePad(props: DicePadProps) {
  const form = useForm(DICE_PAD_FORMS, props.form);
  return <Tree tree={dicePadView(props, form)} handlers={dicePadHandlers(props)} />;
}

DicePad.forms = DICE_PAD_FORMS;

export default DicePad;
