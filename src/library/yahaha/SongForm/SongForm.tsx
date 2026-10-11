import { Button } from '../Button/Button';
import { LampButton } from '../LampButton/LampButton';
import { Pad, type PadState, type TipAction } from '../Pad/Pad';
import { WaitingChip } from '../WaitingChip/WaitingChip';
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
  /** What plays now; while stopped, the section the band will start from. */
  playing?: SectionId;
  /** What is queued to play next (marked NEXT on the form). */
  next?: SectionId;
  /** When the queued change lands, shown after it in the cue ("after bar 4"). */
  nextAt?: string;
  /** Sections this style doesn't have: drawn as absent, and a press does nothing. */
  absent?: readonly SectionId[];
  /** A fill is queued by Fill ▲ or Fill ▼: that key waits, and the cue says "Fill, then …". */
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
}

/**
 * SongForm: the Stage's song form and transport, one region for every control that moves the band
 * through the song.
 *
 * **Job.** Show the song as it runs, Intro → Main A–D → Ending, with what plays now filled and
 * what comes next marked on it, so a player sees where they are in the form and where they are
 * heading from a metre away; and hold every transport key in one cluster beside it, with Start /
 * Stop the one thing to find without looking.
 *
 * **Changed.** *One place per job* (STAGE.md 3): the original spread transport over three places
 * (SectionRow's top row, TransportColumn's icon column, pad 16 on the Sections bank) and sections
 * over a 4 × 4 grid mixed with Sync Start, Tap and Start / Stop. Here the form holds only
 * sections, the cluster only transport, and Tap goes to the Display. *Sections read as the song's
 * form* (STAGE.md 4; layout.md, grouping by proximity): three captioned parts run left to right
 * on one line with arrows between them, each step named by its letter or numeral under the part's
 * caption, so order and grouping carry meaning a grid can't. Break and Auto Fill sit apart as
 * modifiers of the form, not steps in it. *Colour meaning* (`hues.ts`; color.md, "state changes:
 * structure, not circus"): no section takes a hue; what plays is the `--selected` fill, what's
 * next rings in `--accent` with a NEXT tag (shape as well as colour), absent sections a dashed
 * empty edge. *Hierarchy*: Start / Stop is the only `primary` key, twice the others' height, on
 * `--action` when stopped and `--success` while running, its word the action it will take; the
 * rest are equal cells in two rows, grouped by job (sync, fills and fade, accompaniment, reset).
 * *Waiting is one face*: Sync Start armed, a queued fill, a fade-in waiting for Start all use the
 * waiting ring, and the cue line above the form says in words what's coming ("Fill, then Main C
 * after bar 4").
 *
 * **Kept.** Every control the originals had for these jobs and its callback (renamed React-style):
 * the ten sections and Break, Start / Stop (with hold-to-fade-stop from TransportColumn's Stop),
 * Sync Start, Sync Stop, Auto Fill, Fill ▲ / ▼, Fade, Reset and Accomp; fully controlled (a press
 * only calls back); the tooltip keys; spoken names that say the state ("Main B, playing", "Main C,
 * next, after bar 4", "Intro III, not in this style"); the parent-driven flash (`lit`).
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
}: SongFormProps) {
  const missing = new Set(absent);

  const stateOf = (id: SectionId): SectionState =>
    missing.has(id) ? 'absent' : id === playing ? 'playing' : id === next ? 'next' : 'idle';

  const PAD_STATE: Record<SectionState, PadState> = { playing: 'playing', next: 'next', idle: 'idle', absent: 'dark' };

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

  const section = (s: SectionDef, face = s.step) => (
    <div key={s.id} className="yh-songform__step" data-section={s.id} data-state={stateOf(s.id)}>
      <Pad
        label={face}
        state={PAD_STATE[stateOf(s.id)]}
        lit={lit}
        tagCorner
        name={nameOf(s)}
        tip={s.tip}
        tipAction={tipAction}
        onPress={() => {
          if (!missing.has(s.id)) onSection?.(s.id);
        }}
      />
    </div>
  );

  // The cue: what is coming, in words, quieter than the form.
  const nextLabel = next && !missing.has(next) ? SECTION_LABEL[next] : '';
  let cue = '';
  if (fillPending) cue = nextLabel ? `Fill, then ${nextLabel}` : 'Fill';
  else if (nextLabel) cue = nextLabel;
  const waitingFor = !running && syncStart ? 'Starts with the first chord' : '';

  const fadeFace = fading ? (running ? { on: true } : { waiting: true }) : {};

  return (
    <section className="yh-songform" aria-label="Song form and transport">
      <div className="yh-songform__inner">
        <div className="yh-songform__form" role="group" aria-label="Sections">
          <div className="yh-songform__head">
            <span className="yh-songform__title">Song form</span>
            <span className="yh-songform__cue" role="status">
              {cue && (
                <>
                  <WaitingChip label={cue} hue="t" />
                  {nextAt && <span className="yh-songform__when">{nextAt}</span>}
                </>
              )}
              {waitingFor && <span className="yh-songform__when">{waitingFor}</span>}
            </span>
          </div>
          <div className="yh-songform__line">
            <ol className="yh-songform__parts">
              {FORM.map(({ part, caption, steps }) => (
                <li key={part} className="yh-songform__part" data-part={part}>
                  <span className="yh-songform__caption" aria-hidden="true">
                    {caption}
                  </span>
                  <div className="yh-songform__steps">{steps.map((s) => section(s))}</div>
                </li>
              ))}
            </ol>
            <div className="yh-songform__mods" role="group" aria-label="Modifiers">
              <span className="yh-songform__caption" aria-hidden="true">
                Insert
              </span>
              <div className="yh-songform__steps">
                {section(BREAK)}
                <div className="yh-songform__step yh-songform__step--lamp">
                  <LampButton
                    label="Auto Fill"
                    size="cell"
                    on={autoFill}
                    tip="transport.auto_fill"
                    tipAction={tipAction}
                    onToggle={onAutoFill}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="yh-songform__transport" role="group" aria-label="Transport">
          <div className="yh-songform__start">
            <Button
              label={running ? 'Stop' : 'Start'}
              size="band"
              variant="primary"
              bar={running}
              pressed={running}
              name={running ? 'Start / Stop, running (hold to stop with a fade)' : 'Start / Stop, stopped'}
              tip="transport.start_stop"
              tipAction={tipAction}
              onPress={onStartStop}
              onLongPress={running ? onStopWithFade : undefined}
            />
          </div>
          <div className="yh-songform__key" data-key="sync-start">
            <Button
              label="Sync Start"
              size="cell"
              waiting={syncStart}
              pressed={syncStart}
              name={syncStart ? 'Sync Start, armed' : 'Sync Start'}
              tip="transport.sync_start"
              tipAction={tipAction}
              onPress={() => onSyncStart?.(!syncStart)}
            />
          </div>
          <div className="yh-songform__key" data-key="sync-stop">
            <Button
              label="Sync Stop"
              size="cell"
              waiting={syncStop}
              pressed={syncStop}
              tip="transport.sync_stop"
              tipAction={tipAction}
              onPress={() => onSyncStop?.(!syncStop)}
            />
          </div>
          <div className="yh-songform__key" data-key="accomp">
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
          <div className="yh-songform__key" data-key="fill-up">
            <Button
              label="Fill"
              symbol="up"
              size="cell"
              waiting={fillPending === 'up'}
              name={`Fill Up: a fill, then the next Main up${fillPending === 'up' ? ', queued' : ''}`}
              tip="transport.fill_up"
              tipAction={tipAction}
              onPress={onFillUp}
            />
          </div>
          <div className="yh-songform__key" data-key="fill-down">
            <Button
              label="Fill"
              symbol="down"
              size="cell"
              waiting={fillPending === 'down'}
              name={`Fill Down: a fill, then the next Main down${fillPending === 'down' ? ', queued' : ''}`}
              tip="transport.fill_down"
              tipAction={tipAction}
              onPress={onFillDown}
            />
          </div>
          <div className="yh-songform__key" data-key="fade">
            <Button
              label="Fade"
              size="cell"
              {...fadeFace}
              pressed={fading}
              name={fading ? (running ? 'Fade, fading' : 'Fade in, waiting for Start') : running ? 'Fade out' : 'Fade in'}
              tip="transport.fade"
              tipAction={tipAction}
              onPress={onFade}
            />
          </div>
          <div className="yh-songform__key" data-key="reset">
            <Button
              label="Reset"
              size="cell"
              variant="quiet"
              name="Section reset: restart the section from its first bar"
              tip="transport.section_reset"
              tipAction={tipAction}
              onPress={onReset}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default SongForm;
