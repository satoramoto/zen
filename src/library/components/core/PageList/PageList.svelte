<!--
  PageList: the model's tree (`pageListView`, PageList.model.ts) drawn by the Svelte `Tree`, as
  `PageList.tsx` draws it with the React one; see PageList.tsx for the job. The clicks and keys are
  the `pageList` store the tree binds (`pageListKeys.ts`).
-->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { pageListHandlers, pageListView, type PageListModelProps } from './PageList.model';
  import '../../../primitives/Text.css';
  import './PageList.css';

  let props: PageListModelProps = $props();
</script>

<Tree tree={pageListView(props)} handlers={pageListHandlers(props)} />
