<!-- LandingDial: the model's tree drawn by the Svelte `Tree`, as LandingDial.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { LANDING_DIAL_FORMS } from './LandingDial.forms';
  import { landingDialHandlers, landingDialView, type LandingDialProps } from './LandingDial.model';
  import '../../base.css';
  import '../live.css';
  import './LandingDial.css';

  interface Props extends Omit<LandingDialProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(LANDING_DIAL_FORMS, () => props.form);
</script>

<Tree tree={landingDialView({ ...props, className }, form.current)} handlers={landingDialHandlers(props)} />
