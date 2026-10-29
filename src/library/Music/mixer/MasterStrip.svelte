<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { masterStripHandlers, masterStripView, type MasterStripProps } from './MasterStrip.model';
  import './mixer.css';

  let props: MasterStripProps = $props();
</script>

<Tree tree={masterStripView(props)} handlers={masterStripHandlers(props)} />
