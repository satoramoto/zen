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
 * purpose). *Contrast*: the sun sits in the top-right, away from the readouts' middle band, and
 * is mixed down into the sky so the brightest thing on the display stays the chord. *Theme
 * honesty*: the glow is the palette's `--bloom`; in flat palettes (bloom 0) the sun is a crisp
 * flat disc and the hills are hard-edged shapes, as those sources ask, while Push keeps its glow.
 * The picture fills its box at the original's 528 × 300 proportion instead of fixed pixels.
 *
 * **Kept.** Purely decorative and hidden from assistive tech; the two hills and the sun; the fade
 * from the ground on the left (and `fade` off to show it bare) so readouts over the art stay clear.
 */
export function DisplayArt({ fade = true }: DisplayArtProps) {
  return (
    <div className="yh-displayart" data-fade={fade} aria-hidden="true">
      <div className="yh-displayart__sun">
        <div className="yh-displayart__disc" />
      </div>
      <div className="yh-displayart__hill" data-hill="far" />
      <div className="yh-displayart__hill" data-hill="near" />
      {fade && <div className="yh-displayart__fade" />}
    </div>
  );
}
