import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { RIG_HEALTH_FORMS } from './RigHealth.forms';
import { rigHealthHandlers, rigHealthView, type RigHealthProps } from './RigHealth.model';
import '../../base.css';
import '../live.css';
import './RigHealth.css';

export { SIGNAL_STATES, loadPath, type RigDevice, type RigHealthProps, type RigInput, type SignalState } from './RigHealth.model';
export { RIG_HEALTH_FORMS, type RigHealthForm } from './RigHealth.forms';

/**
 * The rig's one status line, in mix[flow]'s face: launch quantize first (it changes what every
 * press does), each input a dot, its name and a sliver of its level, each controller a dot, the
 * DSP load as a sparkline. Only trouble speaks up: a low input adds its word in the caution ink, a silent
 * one is a hollow red dot with a red outline. Read-only without `onOpen`; with it every input and
 * device asks `onOpen(id)`. Forms (`RIG_HEALTH_FORMS`): `strip` everything, `dots` the dots, the
 * trouble words and the load.
 */
export function RigHealth(props: RigHealthProps) {
  const form = useForm(RIG_HEALTH_FORMS, props.form);
  return <Tree tree={rigHealthView(props, form)} handlers={rigHealthHandlers(props)} />;
}

RigHealth.forms = RIG_HEALTH_FORMS;

export default RigHealth;
