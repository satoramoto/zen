<!--
  DeviceFace: the model's tree (`deviceFaceView`, DeviceFace.model.ts) drawn by the Svelte `Tree`,
  as `DeviceFace.tsx` draws it with the React one; see DeviceFace.tsx for the job. The params are
  a `params` snippet.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { DEVICE_FACE_FORMS } from './DeviceFace.forms';
  import { deviceFaceHandlers, deviceFaceView, type DeviceFaceModelProps } from './DeviceFace.model';
  import '../../core/Button/Button.css';
  import '../../core/LampButton/LampButton.css';
  import './DeviceFace.css';

  interface Props extends Omit<DeviceFaceModelProps, 'className'> {
    class?: string;
    params?: Snippet;
  }

  let { class: className, params, ...props }: Props = $props();
  const form = getForm(DEVICE_FACE_FORMS);
</script>

<Tree tree={deviceFaceView({ ...props, className }, form.current)} slots={{ params }} handlers={deviceFaceHandlers(props)} />
