<!--
  FolderList: the model's tree (`folderListView`, FolderList.model.ts) drawn by the Svelte `Tree`,
  as `FolderList.tsx` draws it with the React one; see FolderList.tsx for the job. The clicks, keys
  and focus are the `folderList` store the tree binds (`folderListKeys.ts`); the roving tab stop is
  view state (`viewState.ts`).
-->
<script lang="ts">
  import { fromStore } from 'svelte/store';
  import Tree from '../../../view/Tree.svelte';
  import { viewState } from '../../music/viewState';
  import { folderListHandlers, folderListView, type FolderListLocal, type FolderListModelProps } from './FolderList.model';
  import '../../../primitives/Text.css';
  import './FolderList.css';

  let props: FolderListModelProps = $props();
  const local = viewState<FolderListLocal | null>(null);
  const current = fromStore(local);
</script>

<Tree tree={folderListView(props, current.current)} handlers={folderListHandlers(props, local.set)} />
