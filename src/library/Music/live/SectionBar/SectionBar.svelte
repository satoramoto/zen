<!-- SectionBar: the model's tree drawn by the Svelte `Tree`, as SectionBar.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { SECTION_BAR_FORMS } from './SectionBar.forms';
  import { sectionBarHandlers, sectionBarView, type SectionBarProps } from './SectionBar.model';
  import '../../base.css';
  import '../live.css';
  import './SectionBar.css';

  interface Props extends Omit<SectionBarProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(SECTION_BAR_FORMS, () => props.form);
</script>

<Tree tree={sectionBarView({ ...props, className }, form.current)} handlers={sectionBarHandlers(props)} />
