import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { SIGNAL_SPINE_FORMS } from './SignalSpine.forms';
import { signalSpineHandlers, signalSpineView, type SignalSpineProps } from './SignalSpine.model';
import '../../base.css';
import '../live.css';
import './SignalSpine.css';

export {
  SPINE_LAYER_KINDS,
  ringLayout,
  type SignalSpineProps,
  type SpineLayer,
  type SpineLayerKind,
  type SpineParam,
  type SpineParamChange,
  type SpineStage,
  type SpineTrack,
} from './SignalSpine.model';
export { SIGNAL_SPINE_FORMS, type SignalSpineForm } from './SignalSpine.forms';

/**
 * One track as its signal path, in mix[flow]'s face: cartridges on one cable (Input → Generator →
 * Instrument → Looper → FX → Out), each like the mixer's FX unit — a select-like head with the
 * chosen option over small knobs and mono readings. A bypassed stage is dashed and reads "thru".
 * The looper, outlined in the track's ink, holds its layers as rings: the base innermost, each
 * overdub a ring outside it, a muted ring dashed, one sweep at the loop's length from `beat`;
 * Undo peels the outer ring. Out is a meter in a well (and a fader with `onLevel`). Controlled:
 * heads ask `onStage(id)`, rings `onMuteLayer(id)`, arrows `onPrev`/`onNext`, knobs `onParam`.
 * Forms (`SIGNAL_SPINE_FORMS`): `chain` left to right, `column` stacked.
 */
export function SignalSpine(props: SignalSpineProps) {
  const form = useForm(SIGNAL_SPINE_FORMS, props.form);
  return <Tree tree={signalSpineView(props, form)} handlers={signalSpineHandlers(props)} />;
}

SignalSpine.forms = SIGNAL_SPINE_FORMS;

export default SignalSpine;
