import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { LANDING_DIAL_FORMS } from './LandingDial.forms';
import { landingDialHandlers, landingDialView, type LandingDialProps } from './LandingDial.model';
import '../../base.css';
import '../live.css';
import './LandingDial.css';

export {
  LANDING_BAR_STATES,
  LANDING_LENGTHS,
  LANDING_TARGETS,
  TARGET_LABELS,
  landingBars,
  type LandingBarState,
  type LandingDialProps,
  type LandingLength,
  type LandingTarget,
} from './LandingDial.model';
export { LANDING_DIAL_FORMS, type LandingDialForm } from './LandingDial.forms';

/**
 * "When does it land, and on what?" in mix[flow]'s face: a countdown ring cut into the
 * transition's bars — bars gone solid `--primary`, the bar now filling with the beat, bars ahead
 * faint cells, the landing downbeat a rule at twelve — with the bars left in big mono in its
 * middle, the transition above, what it lands on and what hits on the one under it. Disarmed, the
 * ring is dashed and nothing counts. Controlled: the switches ask `onTarget`/`onLength`, Cancel
 * asks `onCancel`. Forms (`LANDING_DIAL_FORMS`): `dial` the ring over its switches, `chip` one line.
 */
export function LandingDial(props: LandingDialProps) {
  const form = useForm(LANDING_DIAL_FORMS, props.form);
  return <Tree tree={landingDialView(props, form)} handlers={landingDialHandlers(props)} />;
}

LandingDial.forms = LANDING_DIAL_FORMS;

export default LandingDial;
