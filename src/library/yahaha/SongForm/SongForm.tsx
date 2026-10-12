import { Button } from '../../components/core/Button/Button';
import { LampButton } from '../../components/core/LampButton/LampButton';
import { Pad, type PadState, type TipAction } from '../../components/music/Pad/Pad';
import { Stack } from '../../layout/Stack';
import { Text } from '../../primitives/Text';
import type { SectionState } from '../hues';
import './SongForm.css';

/** A section of the song, in the order the song runs, plus Break. */
export type SectionId =
  | 'intro1'
  | 'intro2'
  | 'intro3'
  | 'mainA'
  | 'mainB'
  | 'mainC'
  | 'mainD'
  | 'ending1'
  | 'ending2'
  | 'ending3'
  | 'break';

type Part = 'intro' | 'main' | 'ending';

interface SectionDef {
  id: SectionId;
  /** The step's face inside its part ("I", "B"); the part's caption says which part. */
  step: string;
  /** The full name, spoken and used in the cue ("Main B"). */
  label: string;
  tip: string;
}

const NB = ' ';

/** The song's form: its three parts in order, each its steps in order. */
export const FORM: readonly { part: Part; caption: string; steps: readonly SectionDef[] }[] = [
  {
    part: 'intro',
    caption: 'Intro',
    steps: [
      { id: 'intro1', step: 'I', label: `Intro${NB}I`, tip: 'section.intro1' },
      { id: 'intro2', step: 'II', label: `Intro${NB}II`, tip: 'section.intro2' },
      { id: 'intro3', step: 'III', label: `Intro${NB}III`, tip: 'section.intro3' },
    ],
  },
  {
    part: 'main',
    caption: 'Main',
    steps: [
      { id: 'mainA', step: 'A', label: `Main${NB}A`, tip: 'section.main_a' },
      { id: 'mainB', step: 'B', label: `Main${NB}B`, tip: 'section.main_b' },
      { id: 'mainC', step: 'C', label: `Main${NB}C`, tip: 'section.main_c' },
      { id: 'mainD', step: 'D', label: `Main${NB}D`, tip: 'section.main_d' },
    ],
  },
  {
    part: 'ending',
    caption: 'Ending',
    steps: [
      { id: 'ending1', step: 'I', label: `Ending${NB}I`, tip: 'section.ending1' },
      { id: 'ending2', step: 'II', label: `Ending${NB}II`, tip: 'section.ending2' },
      { id: 'ending3', step: 'III', label: `Ending${NB}III`, tip: 'section.ending3' },
    ],
  },
];

const BREAK: SectionDef = { id: 'break', step: 'Break', label: 'Break', tip: 'section.break' };

/** Every section's full name, by id. */
export const SECTION_LABEL: Record<SectionId, string> = Object.fromEntries(
  [...FORM.flatMap((p) => p.steps), BREAK].map((s) => [s.id, s.label]),
) as Record<SectionId, string>;

export interface SongFormProps {
  /** The style is running: Start / Stop shows Stop on the running face, and is pressed. */
  running?: boolean;
  /** What plays now; while stopped, the section the band will start from (underlined, not filled). */
  playing?: SectionId;
  /** What is queued to play next (marked NEXT on the form). */
  next?: SectionId;
  /** When the queued change lands ("after bar 4"): spoken with the next section and in the cue. */
  nextAt?: string;
  /** Sections this style doesn't have: drawn as absent, and a press does nothing. */
  absent?: readonly SectionId[];
  /** A fill is queued by Fill ▲ or Fill ▼: that key waits, and the spoken cue says "Fill, then …". */
  fillPending?: 'up' | 'down';
  /** Accompaniment (ACMP) on. */
  accomp?: boolean;
  /** Sync Start armed: the style starts with the first chord played. */
  syncStart?: boolean;
  /** Sync Stop on: the style stops when every key of the chord section is released. */
  syncStop?: boolean;
  /** Auto Fill on: every section change plays a fill first. */
  autoFill?: boolean;
  /** A fade is under way (or, while stopped, a fade-in waits for Start). */
  fading?: boolean;
  /** The flash phase of the queued section and the waiting keys; the parent drives it. */
  lit?: boolean;
  /** The app's tooltip action, passed to every control. */
  tipAction?: TipAction;
  /** A section (or Break) was pressed: queue it (PadBank's `onpress` on a section pad). */
  onSection?: (id: SectionId) => void;
  /** Start / Stop pressed (SectionRow's and TransportColumn's `onstartstop`, pad 16). */
  onStartStop?: () => void;
  /** Start / Stop held while running: stop with a fade (TransportColumn's `onstoplong`). */
  onStopWithFade?: () => void;
  /** Accomp pressed, with the state asked for (SectionRow's `onaccomp`). */
  onAccomp?: (on: boolean) => void;
  /** Sync Start pressed, with the state asked for (SectionRow's `onsyncstart`; the Sync Start pad). */
  onSyncStart?: (on: boolean) => void;
  /** Sync Stop pressed, with the state asked for (the Sync Stop pad). */
  onSyncStop?: (on: boolean) => void;
  /** Auto Fill pressed, with the state asked for (the Auto Fill pad). */
  onAutoFill?: (on: boolean) => void;
  /** Fill ▲ pressed: a fill, then the next Main up (SectionRow's and TransportColumn's `onfillup`). */
  onFillUp?: () => void;
  /** Fill ▼ pressed: a fill, then the next Main down (`onfilldown`). */
  onFillDown?: () => void;
  /** Fade pressed (`onfade`). */
  onFade?: () => void;
  /** Reset pressed: restart the section from its first bar (`onreset`). */
  onReset?: () => void;
  /**
   * Which half to draw: `both` (the default), or only the `form` or the `transport`, for a screen
   * that places them apart (the Stage's stacked layout puts the transport beside the hero). The
   * form's steps fill the height of the region's container when it has one (the Stage's strip),
   * and are two control heights tall otherwise; alone, they read at numeral size. The transport
   * alone fills the height its container gives it (never less than its two key rows), and its
   * labels grow with its keys once it is five control heights tall.
   */
  part?: SongFormPart;
}

/** Which half of the region a SongForm draws. */
export type SongFormPart = 'both' | 'form' | 'transport';

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
 * **Kept.** Every control the originals had for these jobs and its callback (renamed React-style):
 * the ten sections and Break, Start / Stop (with hold-to-fade-stop from TransportColumn's Stop),
 * Sync Start, Sync Stop, Auto Fill, Fill ▲ / ▼, Fade, Reset and Accomp; fully controlled (a press
 * only calls back); the tooltip keys; spoken names that say the state ("Main B, playing", "Main C,
 * next, after bar 4", "Main A, starts here", "Intro III, not in this style"); the spoken cue; the
 * parent-driven flash (`lit`); the keyboard order and every spoken name, unchanged by the new
 * sizes and spacing.
 *
 * **Tuning knobs.** `--yh-sf-step-font` (the steps' letter and numeral size: heading beside the
 * transport, numeral in the form alone, switched down by the width container queries).
 */
export function SongForm({
  running = false,
  playing,
  next,
  nextAt,
  absent = [],
  fillPending,
  accomp = false,
  syncStart = false,
  syncStop = false,
  autoFill = false,
  fading = false,
  lit = true,
  tipAction,
  onSection,
  onStartStop,
  onStopWithFade,
  onAccomp,
  onSyncStart,
  onSyncStop,
  onAutoFill,
  onFillUp,
  onFillDown,
  onFade,
  onReset,
  part = 'both',
}: SongFormProps) {
  const missing = new Set(absent);

  const stateOf = (id: SectionId): SectionState =>
    missing.has(id) ? 'absent' : id === playing ? 'playing' : id === next ? 'next' : 'idle';

  // Only a sounding section fills: stopped, the section the band starts from is an idle pad,
  // underlined (data-start) and named "starts here".
  const padState = (id: SectionId): PadState => {
    const state = stateOf(id);
    if (state === 'absent') return 'dark';
    if (state === 'playing') return running ? 'playing' : 'idle';
    return state;
  };

  const nameOf = (s: SectionDef): string => {
    const label = s.label.replace(NB, ' ');
    switch (stateOf(s.id)) {
      case 'absent':
        return `${label}, not in this style`;
      case 'playing':
        return running ? `${label}, playing` : `${label}, starts here`;
      case 'next':
        return `${label}, next${nextAt ? `, ${nextAt}` : ''}`;
      default:
        return label;
    }
  };

  const section = (s: SectionDef) => {
    const state = stateOf(s.id);
    return (
      <div
        key={s.id}
        className="yh-songform__step"
        data-part="step"
        data-section={s.id}
        data-state={state}
        data-start={(state === 'playing' && !running) || undefined}
      >
        <Pad
          label={s.step}
          state={padState(s.id)}
          lit={lit}
          tagCorner
          accentNext
          fillCell
          disabled={missing.has(s.id)}
          name={nameOf(s)}
          tip={s.tip}
          tipAction={tipAction}
          onPress={() => onSection?.(s.id)}
        />
      </div>
    );
  };

  // The cue: spoken only. "Next" is drawn once on screen, in the hero, and on the form's NEXT tag.
  const nextLabel = next && !missing.has(next) ? SECTION_LABEL[next].replace(NB, ' ') : '';
  const when = nextAt ? `, ${nextAt}` : '';
  const cues: string[] = [];
  if (fillPending) cues.push(nextLabel ? `Fill, then ${nextLabel}${when}` : 'Fill');
  else if (nextLabel) cues.push(`Next: ${nextLabel}${when}`);
  if (!running && syncStart) cues.push('Starts with the first chord');

  const fadeFace = fading ? (running ? { on: true } : { waiting: true }) : {};

  return (
    <div className="yh-songform" data-part="root" data-half={part}>
      <div className="yh-songform__inner" data-part="inner">
        {part !== 'transport' && (
          <Stack
            direction="row"
            gap={6}
            align="stretch"
            className="yh-songform__form"
            data-part="form"
            role="group"
            aria-label="Sections"
          >
            <span className="yh-songform__cue" data-part="cue" role="status">
              {cues.join('. ')}
            </span>
            <Stack as="ol" direction="row" gap={6} align="stretch" className="yh-songform__parts" data-part="groups">
              {FORM.map(({ part, caption, steps }) => (
                <Stack as="li" key={part} direction="column" gap={0} className="yh-songform__part" data-part="group" data-group={part}>
                  <Text role="caption" tone="muted" className="yh-songform__caption" data-part="caption" aria-hidden="true">
                    {caption}
                  </Text>
                  <div className="yh-songform__steps" data-part="steps">{steps.map((s) => section(s))}</div>
                </Stack>
              ))}
            </Stack>
            <Stack direction="column" gap={0} className="yh-songform__mods" data-part="mods" role="group" aria-label="Insert">
              <div className="yh-songform__steps" data-part="steps">{section(BREAK)}</div>
            </Stack>
          </Stack>
        )}

        {part !== 'form' && (
          <div className="yh-songform__transport" data-part="transport" role="group" aria-label="Transport">
            <div className="yh-songform__start" data-part="start">
              <Button
                label={running ? 'Stop' : 'Start'}
                size="cell"
                tall
                variant={running ? 'secondary' : 'primary'}
                hue={running ? 'ok' : 'role-2'}
                pressed={running}
                name={running ? 'Start / Stop, running (hold to stop with a fade)' : 'Start / Stop, stopped'}
                tip="transport.start_stop"
                tipAction={tipAction}
                onPress={onStartStop}
                onLongPress={running ? onStopWithFade : undefined}
              />
            </div>
            <div className="yh-songform__key" data-part="key" data-key="sync-start">
              <Button
                label="Sync Start"
                size="cell"
                hue="role-2"
                waiting={syncStart}
                lit={lit}
                pressed={syncStart}
                name={syncStart ? 'Sync Start, armed' : 'Sync Start'}
                tip="transport.sync_start"
                tipAction={tipAction}
                onPress={() => onSyncStart?.(!syncStart)}
              />
            </div>
            <div className="yh-songform__key" data-part="key" data-key="sync-stop">
              <Button
                label="Sync Stop"
                size="cell"
                hue="role-2"
                waiting={syncStop}
                pressed={syncStop}
                tip="transport.sync_stop"
                tipAction={tipAction}
                onPress={() => onSyncStop?.(!syncStop)}
              />
            </div>
            <div className="yh-songform__key" data-part="key" data-key="fill-up">
              <Button
                label="Fill"
                symbol="up"
                size="cell"
                hue="role-2"
                waiting={fillPending === 'up'}
                lit={lit}
                name={`Fill Up: a fill, then the next Main up${fillPending === 'up' ? ', queued' : ''}`}
                tip="transport.fill_up"
                tipAction={tipAction}
                onPress={onFillUp}
              />
            </div>
            <div className="yh-songform__key" data-part="key" data-key="fill-down">
              <Button
                label="Fill"
                symbol="down"
                size="cell"
                hue="role-2"
                waiting={fillPending === 'down'}
                lit={lit}
                name={`Fill Down: a fill, then the next Main down${fillPending === 'down' ? ', queued' : ''}`}
                tip="transport.fill_down"
                tipAction={tipAction}
                onPress={onFillDown}
              />
            </div>
            <div className="yh-songform__key" data-part="key" data-key="fade">
              <Button
                label="Fade"
                size="cell"
                {...fadeFace}
                lit={lit}
                pressed={fading}
                name={fading ? (running ? 'Fade, fading' : 'Fade in, waiting for Start') : running ? 'Fade out' : 'Fade in'}
                tip="transport.fade"
                tipAction={tipAction}
                onPress={onFade}
              />
            </div>
            <div className="yh-songform__key" data-part="key" data-key="reset">
              <Button
                label="Reset"
                size="cell"
                name="Section reset: restart the section from its first bar"
                tip="transport.section_reset"
                tipAction={tipAction}
                onPress={onReset}
              />
            </div>
            <div className="yh-songform__key" data-part="key" data-key="accomp">
              <LampButton
                label="Accomp"
                name="Accomp (ACMP)"
                size="cell"
                on={accomp}
                tip="transport.acmp"
                tipAction={tipAction}
                onToggle={onAccomp}
              />
            </div>
            <div className="yh-songform__key" data-part="key" data-key="auto-fill">
              <LampButton
                label="Auto Fill"
                size="cell"
                hue="role-2"
                on={autoFill}
                tip="transport.auto_fill"
                tipAction={tipAction}
                onToggle={onAutoFill}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SongForm;
