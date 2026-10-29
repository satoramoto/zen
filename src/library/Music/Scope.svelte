<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../view/Tree.svelte';
  import { musicScopeView, type MusicScopeProps } from './Scope.model';
  import './base.css';
  let { children, ...props }: MusicScopeProps & { children?: Snippet } = $props();
</script>

<Tree tree={musicScopeView(props)} slots={{ children }} />
