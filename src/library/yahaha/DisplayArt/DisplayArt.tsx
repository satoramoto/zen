import './DisplayArt.css';

export interface DisplayArtProps {
  /** The fade from the ground on the left, which keeps the readouts over the art brighter. */
  fade?: boolean;
}

/**
 * DisplayArt: the display's background picture at its right edge.
 *
 * **Job.** Give the display a sense of place (a low sun over two hills) behind the readouts,
 * without ever competing with them: a player reads the chord and tempo over it, so the art is
 * the quietest layer on the screen and is never read for information.
 *
 * **Changed.** *Colour meaning*: the original painted a violet bloom and its own sky, hill and
 * fade colours, eleven private tokens. Here the whole picture is built from the theme: sky and
 * hills are the ground and surface steps tinted with `--accent`, the sun is the accent itself, and
 * no categorical hue appears, so the four part hues keep their one meaning and the art follows
 * every palette, light ones included (color.md › tinted neutrals; fewer colours, stricter
 * purpose). *Contrast*: the sun sits low in the bottom-right quarter, setting behind the far hill,
 * since the Display's tempo stands top right and the sun used to sit right behind its number; it
 * is mixed down into the sky so the brightest thing on the display stays the readouts, and the
 * fade from the ground now runs to 85% of the width, under the tempo too. *Theme
 * honesty*: the glow is the palette's `--bloom`; in flat palettes (bloom 0) the sun is a crisp
 * flat disc and the hills are hard-edged shapes, as those sources ask, while Push keeps its glow.
 * *Scheme*: the mixes switch on `--scheme-light`, so a light palette paints a day (pale sky,
 * hills deepening towards the viewer, a near-white sun) instead of the night's silhouettes, which
 * on a light ground left the near hill paler than the sky; the near hill's accent stops at 24%
 * (it was 48%, the loudest colour on a light screen); dark palettes are unchanged.
 * The picture fills its box at the original's 528 × 300 proportion instead of fixed pixels.
 * *Materials:* the parts are named (`data-part`: art, sun, disc, hill, fade). The picture is
 * drawn, not made of anything, so it reads no material; the display window behind it does.
 *
 * **Kept.** Purely decorative and hidden from assistive tech; the two hills and the sun; the fade
 * from the ground on the left (and `fade` off to show it bare) so readouts over the art stay clear.
 *
 * **Tuning knobs.** `--yh-displayart-sky`, `--yh-displayart-far`, `--yh-displayart-near`,
 * `--yh-displayart-sun` (the picture's four colours: the sky, the far and near hills and the sun,
 * each a theme mix that switches on `--scheme-light`).
 */
export function DisplayArt({ fade = true }: DisplayArtProps) {
  return (
    <div className="yh-displayart" data-part="art" data-fade={fade} aria-hidden="true">
      <div className="yh-displayart__sun" data-part="sun">
        <div className="yh-displayart__disc" data-part="disc" />
      </div>
      <div className="yh-displayart__hill" data-part="hill" data-hill="far" />
      <div className="yh-displayart__hill" data-part="hill" data-hill="near" />
      {fade && <div className="yh-displayart__fade" data-part="fade" />}
    </div>
  );
}
