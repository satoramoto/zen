<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { stemConnectionsView } from './StemConnections.model';
</script>

<Tree tree={stemConnectionsView()} />
