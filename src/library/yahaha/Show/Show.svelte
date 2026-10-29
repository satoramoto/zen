<!--
  Show: the model's tree (`showView`, Show.model.ts) drawn by the Svelte `Tree`, as `Show.tsx`
  draws it with the React one; see Show.tsx for the job. The open tab is local state.
-->
<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { SHOW_START } from './Show.spec';
  import { showHandlers, showTab, showView, type ShowModelProps } from './Show.model';
  import '../../primitives/Text.css';
  import './Show.css';

  interface Props extends ShowModelProps {
    active?: string;
    class?: string;
  }

  let { active: start = SHOW_START, class: className, ...props }: Props = $props();
  let active = $state(start);
  const tab = $derived(showTab(active));
  const handlers = $derived(
    showHandlers({
      ...props,
      onTab: (id: string) => {
        active = id;
        props.onTab?.(id);
      },
    }),
  );
</script>

<Tree tree={showView({ ...props, active, className }, tab)} {handlers} />
