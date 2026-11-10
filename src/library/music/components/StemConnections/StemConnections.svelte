<script lang="ts">
  import Tree from '../../../foundation/view/Tree.svelte';
  import { stemConnectionsView } from './StemConnections.model';
</script>

<Tree tree={stemConnectionsView()} />
