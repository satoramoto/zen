<!--
  SendReadout: the Svelte renderer of `sendReadoutView` (SendReadout.model.ts), the same markup,
  classes and attributes as `SendReadout.tsx`; see SendReadout.tsx for the job. `onPress` is a prop.
-->
<script lang="ts">
  import Text from '../../../primitives/Text.svelte';
  import { sendReadoutView, type SendReadoutModelProps } from './SendReadout.model';
  import './SendReadout.css';

  let props: SendReadoutModelProps = $props();
  const view = $derived(sendReadoutView(props));
</script>

<button class={view.button.className} {...view.button.attrs} onclick={() => props.onPress?.()}
  >{#each view.sends as send (send.word.content)}<span class={send.className} {...send.attrs}
      ><Text {...send.word.text} class={send.word.className}>{send.word.content}</Text><Text {...send.level.text} class={send.level.className}
        >{send.level.content}</Text
      ></span
    >{/each}</button
>
