<!-- DicePad: the model's tree drawn by the Svelte `Tree`, as DicePad.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { DICE_PAD_FORMS } from './DicePad.forms';
  import { dicePadHandlers, dicePadView, type DicePadProps } from './DicePad.model';
  import '../../base.css';
  import '../live.css';
  import './DicePad.css';

  interface Props extends Omit<DicePadProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(DICE_PAD_FORMS, () => props.form);
</script>

<Tree tree={dicePadView({ ...props, className }, form.current)} handlers={dicePadHandlers(props)} />
