import { Button } from '../../components/core/Button/Button';
import { LampButton } from '../../components/core/LampButton/LampButton';
import { Pad } from '../../components/music/Pad/Pad';
import { Stack } from '../../primitives/Stack';
import { Text } from '../../primitives/Text';
import { useForm } from '../../layout/assembly';
import { FORM_FORMS, TRANSPORT_FORMS } from './SongForm.forms';
import { songFormView, type SongFormProps, type StepView } from './SongForm.model';
import './SongForm.css';

export { FORM_FORMS, TRANSPORT_FORMS, SONG_FORM_FORMS, BOTH_GAP, BREAKS } from './SongForm.forms';
export type { FormFormId, TransportFormId, SongFormFormId } from './SongForm.forms';
export {
  FORM,
  BREAK,
  SECTION_LABEL,
  songFormView,
  type SectionId,
  type SectionDef,
  type SongFormPart,
  type SongFormProps,
  type SongFormSectionPart,
  type SongFormView,
} from './SongForm.model';

/** One step: its wrapping `div` and the Pad inside. */
function Step({ step }: { step: StepView }) {
  return (
    <div className={step.className} {...step.attrs}>
      <Pad {...step.pad} />
    </div>
  );
}

/**
 * SongForm: the Stage's song form and transport, one region for every control that moves the band
 * through the song.
 *
 * **Job.** Show the song as it runs, Intro → Main A–D → Ending, with what sounds now filled and
 * what comes next marked on it, so a player sees where they are in the form and where they are
 * heading from a metre away; and hold every transport key in one cluster, with Start / Stop the one
 * thing to find without looking.
 *
 * **Changed.** *One place per job* (STAGE.md 3): the original spread transport over three places
 * (SectionRow's top row, TransportColumn's icon column, pad 16 on the Sections bank) and sections
 * over a 4 × 4 grid mixed with Sync Start, Tap and Start / Stop. Here the form holds only sections
 * and Break, the cluster every key that moves time (Auto Fill included: it is a time key, hues.ts),
 * and Tap goes to the Display. "Next" is said once on screen, in the hero: the form has no title
 * and no cue line of its own (*hierarchy*); the cue is still spoken, as visually hidden status
 * text. *Sections read as the song's form* (STAGE.md 4; layout.md, grouping by proximity): one
 * strip of one primitive at one height, three captioned parts left to right with arrows between
 * them, each step named by its letter or numeral in the readout face, then Break behind a seam. The
 * steps fill the height of the region's container (the Stage's strip sets it), so the screen sizes
 * the form without reaching into it (*alignment*). The part captions sit in the strip's top
 * padding, quiet (one caption recipe), with no rules under them: the arrows carry the order.
 * *Colour meaning* (`hues.ts`; color.md, "state changes: structure, not circus"): a solid fill
 * means sounding or running, nothing else. The playing section is the `--selected` fill and the
 * only one; stopped, the section the band will start from is underlined, not filled. Next rings in
 * `--accent` with a NEXT tag (shape as well as colour); absent sections are a dashed empty edge,
 * announced unavailable (`aria-disabled`, still focusable) and deaf to presses (*affordance*). In
 * the cluster, the transport hue appears only on an active key (armed, queued, on) and on Start's
 * fill; at rest every other key is neutral, so an armed Sync Start is the only ring of its colour.
 * Accomp, Auto Fill and a running Fade show "on" as an outline (and the lamp's lit LED), never a
 * fill. *Hierarchy*: Start / Stop is the cluster's one `tall` key and its widest, its word the
 * action it will take: stopped, the `primary` fill in `--transport`; running, an outline in
 * `--success` (a state, not the transport's identity), so mid-song the hero's section and chord
 * outrank it. Every other key is one cell at one rank, `secondary` (Reset included), Accomp a mode
 * in one cell rather than a key ranked like Start; one gap between all of them (*rhythm*). *Room to
 * breathe* (layout.md, spacing on one scale; proximity): steps inside a part sit close, the parts
 * and Break's seam well apart, the captions a clear step above their steps, and the keys one step
 * apart, all on the `--space-*` scale, with no text made smaller to buy the room. *Scale with the
 * reading distance*: the form alone (the Stage's strip) sets its letters and numerals at numeral
 * size, read from a metre; and the transport alone fills the height it is given, its labels
 * growing with its keys once it is five control heights tall (body size, Start / Stop at display),
 * so a big key never carries a small word and the screen needn't reach in to size them. *Waiting
 * is one face*: Sync Start armed, a queued fill and a fade-in waiting for Start use the waiting
 * ring, flashing with the queued section on the parent's `lit`. The width breakpoints are counted
 * in control heights (the region's `em` is `--control-h`), so a denser or airier pack changes
 * layout where its keys stop fitting.
 *
 * **Forms** (`SongForm.forms.ts`, docs/assembly.md). Each half declares what its own box needs in
 * scale units, read from the lengths this CSS sets, and fills whatever box it is given. The
 * transport: `keys` (two rows, Start / Stop tall at the left; fills the height beside the hero,
 * labels growing past five control heights) → `tight` (Start / Stop tall at the left, a column a
 * job in three rows, never taller than the hero's least form) → `compact` (Start / Stop tall down
 * the left, a row a job in two columns, about 12 control heights wide). The form: `strip` (captions over the steps)
 * → `folded` (each caption before its steps: shorter, wider). Both: the form over the transport,
 * `full` (strip) → `short` (folded). A half reads its form with `useForm` (by its part name in a
 * region whose form names its parts), or takes `transportForm` / `formForm`; it carries
 * `data-form`, and a form changes only SongForm's own shape.
 *
 * **Kept.** Every control the originals had for these jobs and its callback (renamed React-style):
 * the ten sections and Break, Start / Stop (with hold-to-fade-stop from TransportColumn's Stop),
 * Sync Start, Sync Stop, Auto Fill, Fill ▲ / ▼, Fade, Reset and Accomp; fully controlled (a press
 * only calls back); the tooltip keys; spoken names that say the state ("Main B, playing", "Main C,
 * next, after bar 4", "Main A, starts here", "Intro III, not in this style"); the spoken cue; the
 * parent-driven flash (`lit`); the keyboard order and every spoken name, unchanged by the new
 * sizes and spacing.
 *
 * **Tuning knobs.** `--yh-sf-step-font` (the steps' letter and numeral size: body, switched up to
 * heading and numeral by the width container queries as the strip widens; `BREAKS`).
 *
 * The decisions live in `songFormView` (SongForm.model.ts); this renders it, as `SongForm.svelte` does.
 */
export function SongForm(props: SongFormProps) {
  // Each half reads its own form: by its part name inside a region whose form names its parts
  // (`both` on an assembled screen), else the region's form.
  const formId = useForm(FORM_FORMS, props.formForm, 'form');
  const transportId = useForm(TRANSPORT_FORMS, props.transportForm, 'transport');
  const { root, inner, form, transport } = songFormView(props, formId, transportId);

  return (
    <Text as="div" className={root.className} {...root.attrs}>
      <Text as="div" className={inner.className} {...inner.attrs}>
        {form && (
          <Stack {...form.stack} className={form.className} {...form.attrs}>
            <span className={form.cue.className} {...form.cue.attrs}>
              {form.cue.word}
            </span>
            <Stack {...form.parts.stack} className={form.parts.className} {...form.parts.attrs}>
              {form.items.map((p) => (
                <Stack key={p.part} {...p.stack} className={p.className} {...p.attrs}>
                  {p.arrow && (
                    <Text {...p.arrow.text} className={p.arrow.className} {...p.arrow.attrs}>
                      {p.arrow.word}
                    </Text>
                  )}
                  <Text {...p.caption.text} className={p.caption.className} {...p.caption.attrs}>
                    {p.caption.word}
                  </Text>
                  <div className={p.steps.className} {...p.steps.attrs}>
                    {p.items.map((s) => (
                      <Step key={s.id} step={s} />
                    ))}
                  </div>
                </Stack>
              ))}
            </Stack>
            <Stack {...form.mods.stack} className={form.mods.className} {...form.mods.attrs}>
              <div className={form.modSteps.className} {...form.modSteps.attrs}>
                <Step step={form.brk} />
              </div>
            </Stack>
          </Stack>
        )}

        {transport && (
          <div className={transport.className} {...transport.attrs}>
            <div className={transport.start.className} {...transport.start.attrs}>
              <Button {...transport.startButton} />
            </div>
            {transport.keys.map((k) => (
              <div key={k.key} className={k.className} {...k.attrs}>
                {k.kind === 'button' ? <Button {...k.button} /> : <LampButton {...k.lamp} />}
              </div>
            ))}
          </div>
        )}
      </Text>
    </Text>
  );
}

export default SongForm;
