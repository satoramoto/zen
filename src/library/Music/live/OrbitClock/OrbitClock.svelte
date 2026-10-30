<!-- OrbitClock: the model's tree drawn by the Svelte `Tree`, as OrbitClock.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { ORBIT_CLOCK_FORMS } from './OrbitClock.forms';
  import { orbitClockHandlers, orbitClockView, type OrbitClockProps } from './OrbitClock.model';
  import '../../base.css';
  import '../live.css';
  import './OrbitClock.css';

  interface Props extends Omit<OrbitClockProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(ORBIT_CLOCK_FORMS, () => props.form);
</script>

<Tree tree={orbitClockView({ ...props, className }, form.current)} handlers={orbitClockHandlers(props)} />
