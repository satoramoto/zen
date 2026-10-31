<!-- StemDeck: the model's tree drawn by the Svelte `Tree`, as StemDeck.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { STEM_DECK_FORMS } from './StemDeck.forms';
  import { stemDeckHandlers, stemDeckView, type StemDeckProps } from './StemDeck.model';
  import '../../base.css';
  import '../live.css';
  import './StemDeck.css';

  interface Props extends Omit<StemDeckProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(STEM_DECK_FORMS, () => props.form);
</script>

<Tree tree={stemDeckView({ ...props, className }, form.current)} handlers={stemDeckHandlers(props)} />
