<!--
  DisplayArt: the display's background picture at its right edge: a violet bloom over a dark sky
  with two hills, faded in from the ground on its left so the readouts over it stay brighter.
  Purely decorative; the theme picks its colours. `fade` off shows the art bare.

  Its glow is one bloom of the screen backdrop's language (Blooms, blooms.ts `gradient`): the same
  falloff, hue role (--bloom-a) and strength (--bloom-peak), so the art and the backdrop never show
  two kinds of glow. On a screen, the backdrop's anchor bloom sits where this glow sat.
-->
<script lang="ts">
  import { gradient } from '../Blooms/blooms'

  type Props = {
    /** The fade from the ground on the left, which keeps the readouts over the art brighter. */
    fade?: boolean
  }

  let { fade = true }: Props = $props()

  const glow = gradient('--bloom-a', 1)
</script>

<div class="art" aria-hidden="true">
  <div class="glow" style:background={glow}></div>
  {#if fade}<div class="fade"></div>{/if}
</div>

<style>
  .art {
    position: relative;
    overflow: hidden;
    width: var(--display-art-width);
    height: var(--display-height);
    background:
      radial-gradient(
        ellipse 80% 44% at 40% 104%,
        var(--art-hill-near) 0,
        var(--art-hill-near) 58%,
        transparent 60%
      ),
      radial-gradient(ellipse 70% 38% at 92% 100%, var(--art-hill-far) 0, var(--art-hill-far) 62%, transparent 64%),
      linear-gradient(180deg, var(--art-sky-top) 0%, var(--art-sky-mid) 55%, var(--art-sky-foot) 100%);
  }
  /* The bloom, centred where the old glow was (62% across, 44% down). */
  .glow {
    position: absolute;
    left: 62%;
    top: 44%;
    width: 90%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
  }
  .fade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      var(--art-fade-100) 0%,
      var(--art-fade-60) 22%,
      var(--art-fade-10) 60%,
      var(--art-fade-20) 100%
    );
  }
</style>
