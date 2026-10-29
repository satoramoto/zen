<script lang="ts">
  import Tree from '../../view/Tree.svelte';
  import { sliderHandlers, sliderView, type SliderProps } from './Slider.model';
  import './parameters.css';
  let props: SliderProps = $props();
</script>
<Tree tree={sliderView(props)} handlers={sliderHandlers(props)} />
