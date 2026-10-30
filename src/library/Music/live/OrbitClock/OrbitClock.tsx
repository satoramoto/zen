import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { ORBIT_CLOCK_FORMS } from './OrbitClock.forms';
import { orbitClockHandlers, orbitClockView, type OrbitClockProps } from './OrbitClock.model';
import '../../base.css';
import '../live.css';
import './OrbitClock.css';

export { BEAD_STATES, meetText, orbitHand, orbitMeet, type BeadState, type OrbitClockProps, type OrbitGenerator } from './OrbitClock.model';
export { ORBIT_CLOCK_FORMS, type OrbitClockForm } from './OrbitClock.forms';

/**
 * The generators in time, together, in mix[flow]'s face: one thin ring per generator, its steps as
 * beads (hits in the track's stem ink, rests as pinpricks), a hand with a short tail sweeping at
 * that generator's own cycle length, the bead under the hand lit. Rings of different lengths fan
 * out and come back; the hub says the chord and when every hand next meets at twelve o'clock.
 * Chaos is the faint dashed arc round the outside. Clock-free: `beat` places every hand. A ring or
 * its row asks `onSelect(track)`; the dice (Mutate, Shake all, Keep, Revert) ask their callbacks.
 * Forms (`ORBIT_CLOCK_FORMS`): `full` the rings beside the list and dice, `orbits` the rings alone.
 */
export function OrbitClock(props: OrbitClockProps) {
  const form = useForm(ORBIT_CLOCK_FORMS, props.form);
  return <Tree tree={orbitClockView(props, form)} handlers={orbitClockHandlers(props)} />;
}

OrbitClock.forms = ORBIT_CLOCK_FORMS;

export default OrbitClock;
