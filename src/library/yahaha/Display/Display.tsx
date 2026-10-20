import { useRef, type CSSProperties } from 'react';
import { useChosenForm, useForm } from '../../layout/assembly/forms';
import { AccentBlock } from '../AccentBlock/AccentBlock';
import { useTip } from '../AccentBlock/useTip';
import { Button } from '../../components/core/Button/Button';
import { BarBeat } from '../../components/music/BarBeat/BarBeat';
import { ChordReadout } from '../../components/music/ChordReadout/ChordReadout';
import { PartMarks } from '../../components/music/PartMarks/PartMarks';
import { SectionName } from '../../components/music/SectionName/SectionName';
import { TempoReadout } from '../../components/music/TempoReadout/TempoReadout';
import { Stack } from '../../primitives/Stack';
import { Text } from '../../primitives/Text';
import { DisplayArt } from '../DisplayArt/DisplayArt';
import { OneTouchPicker } from '../OneTouchPicker/OneTouchPicker';
import { WaitingChip } from '../WaitingChip/WaitingChip';
import { DISPLAY_FORMS } from './Display.forms';
import { DISPLAY_SIZES, PART_TIP, displayForm, displayMeasuresWidth, displayView, type DisplayModelProps, type DisplayPartView, type TipAction } from './Display.model';
import { useFit, useWide } from './useFit';
import './Display.css';

// The props and the view are framework-free, in the model; `Display.svelte` renders the same view.
export type { TipAction };
export { DISPLAY_FORMS, DISPLAY_CAPS, DISPLAY_GROWTH, DISPLAY_CHROME, DISPLAY_CONTENT, displayLengthCss, type DisplayForm } from './Display.forms';
export {
  AUTO_FULL_WIDTH,
  DISPLAY_SIZES,
  type DisplayDensity,
  type DisplayModelProps,
  type DisplayNowPlaying,
  type DisplayPart,
  type DisplayStyle,
} from './Display.model';

export type DisplayProps = DisplayModelProps;

/**
 * Display: the Stage's hero, what the band is doing right now.
 *
 * **Job.** Answer, from a metre away and mid-song, three questions in order: which section is
 * playing (and what comes next), which chord the band hears, and how fast. Then, quieter, which
 * style is loaded and its One Touch, and where the bar is. Every control the hero owns sits next
 * to what it changes: ‹ › and the name step and browse styles, One Touch applies, the tempo's
 * − + Tap and Style tempo set the tempo. This is the Stage's only Tap.
 *
 * **Changed.** *Hierarchy:* the original set chord, section and tempo in three competing hues in
 * three equal thirds. Here they share neutral ink and are ranked by size and place: the section
 * largest (up to three numeral sizes at `full`, 96 at numeral 32), the only thing on a solid fill,
 * the `--selected` block (a solid fill means "sounding", `hues.ts`); the tempo next (up to 2.625),
 * the loudest number; the chord a step behind (up to 2.25). Each starts at the pack's numeral size
 * and takes a share of the room past its form's least, on both axes, up to its own cap per form
 * (`DISPLAY_CAPS`, `DISPLAY_GROWTH`), so the ranking holds at every size and no box at least the
 * form's least is overflowed (typography.md, "Type Scale"). A long section name steps all three
 * down together (by tenths, to 0.6) until they fit the row, so the section is never cut, the
 * chord keeps its cell and the ranking holds.
 * *Hierarchy, one place per job:* what's next is said once, a "then" tab hanging flush under the
 * section block: `--text-1` on `--surface-2`, an arrow in the next role (`--accent`,
 * `SECTION_STATE_COLOUR.next`) and the next section's name at 35% of the section's size (never
 * below heading size, so about 34px under a 96px block rather than a 14px footnote), with when
 * ("fill after bar 4") under them at label size, so the tab is never wider than the block needs.
 * Where the bar is is drawn, not written: four beat cells under the tempo (the lit beat in
 * `--text-1`, beat 1 marked), where the old full-width beat bar made a 300px slab louder than the
 * chord; at `full` the cells are `--space-2` thick, enough to read from a metre. *Rhythm, room to
 * breathe:* the groups (header, readouts, the beat and the
 * tempo keys) stand a step further apart on the `--space-*` scale than the controls inside them,
 * so each reads as one group; spacing makes the room, never smaller or fainter text (color.md).
 * *Hierarchy, quiet chrome:* the "Section / Chord / Tempo" captions are gone (a block, a chord
 * symbol and a number with BPM name themselves), so that row goes to the readouts; the style
 * header and One Touch keep one control-height line above them, the applied One Touch underlined
 * rather than a second solid block, the style name without a chevron between ‹ and ›. Where the
 * header is short the genre · metre drops whole before the style's name would end in an ellipsis
 * (measured, like the section's fit). *Colour meaning:* sections take no hue; the tempo's ± keys
 * are neutral at rest (transport wears its hue only while active); the only hues left are the four
 * part dots, which mean the same part as the mixer and keyboard (color.md, "Semantic colours").
 * *Forms* (`DISPLAY_FORMS`, docs/assembly.md): `full` (the roomy chrome, the large caps),
 * `compact` (tight padding, a short rule, thinner beat cells, caps 1.875 / 1.625 / 1.375 numeral
 * sizes) and `minimal` (Tap and Style tempo move into the header beside One Touch, whose caption
 * goes; no rule; a hairline beat; caps 1.25 / 1.125 / 1). Each form's needs are in scale units,
 * from the same steps and Text roles as Display.css, and the hero never draws below its form's
 * least (`min-width`, `min-height`). Which form: the `form` prop wins; then the form the assembled
 * screen chose for the hero's region; then `density` (`auto`, the default, is compact below a
 * 1200 CSS pixel wide hero). The fingering keeps one line with an ellipsis past sixteen
 * characters; the notes stand over it. The parts (standalone only) are a fourth column from a
 * 900px hero, outside `minimal`; the forms leave them out.
 * *Affordance:* Tap is a real key, and the style's tempo, once a hidden double-click, is a visible
 * quiet "Style tempo" key beside it (the double-click still works). It says which tempo it goes
 * back to, so it is never mistaken for the transport's section reset; when the tempo already is
 * the style's (`styleTempo`), it takes the unavailable face (`--text-3`, `aria-disabled`, still
 * focusable), since there is nothing to reset.
 * *Materials:* every part is named (`data-part`), and the hero is the display window, made of the
 * theme's `screen` (`data-material="screen"`), so the readouts on it (tempo, chord, beat) drop
 * windows of their own; a part's dot is lit (`--lit` in its hue, `--mat-lit-glow`) unless the part
 * is off. The `--selected` block, the "then" tab and the part hues still say what they say,
 * whatever the material.
 *
 * **Kept.** The data and every callback of the original (prev/next/browse, One Touch, a part's
 * sound list, tempo up/down holds, drag/scroll/keys on the number, back to the style's tempo); the
 * button names ("Next style (Track right)", "Sunday Drive Pop: open the Browser", "Left sound: 33
 * Finger Bass…", "Apply One Touch 3…", "Tempo up (Scene Launch)", "Back to the style's tempo");
 * "Stopped" and "Sync Start armed" under the section; the beat's states; the chord stepping down
 * to fit; the sizes reaching each primitive through its own `size` option (and BarBeat's
 * `thickness`), never by overriding its CSS; the app's `tipAction` on every control, applied once
 * each (the primitives apply it to their own).
 *
 * **Tuning knobs.** `--yh-display-min-w`, `--yh-display-min-h` (the form's least, set inline
 * from `DISPLAY_FORMS`), `--yh-display-room-w`, `--yh-display-room-h` (the room past it),
 * `--yh-display-cap-*` (each readout's cap: section, tempo, chord; set per form),
 * `--yh-display-fit` (the row's fit step, from `data-fit`), `--yh-display-section`,
 * `--yh-display-tempo`, `--yh-display-chord` (the readouts' sizes, from the room, cap and fit;
 * `DISPLAY_SIZES` hands them to the primitives), `--yh-display-chord-w` (the chord column's
 * least), `--yh-display-beat-line` (the beat cells' thickness, per form), `--yh-display-then-hue`
 * (the "then" arrow's colour, the next role from `hues.ts`), `--yh-display-part-hue` (a part's
 * dot, its hue from `hues.ts`).
 */
export function Display(props: DisplayProps) {
  const { style, nowPlaying, art = false, tipAction, onPrev, onNext, onBrowse, onOneTouch, onSound, onTempoUp, onTempoDown, onTempo, onTap, onStyleTempo } = props;
  // The form: the `form` prop, then the assembled screen's choice, then `density`.
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const fromScreen = useForm(DISPLAY_FORMS, props.form);
  const chosen = useChosenForm();
  const wide = useWide(root, displayMeasuresWidth(props, chosen));
  const { form, byDensity } = displayForm(props, fromScreen, chosen, wide);
  const view = displayView(props, form, byDensity);
  useFit(frame, view.fitKey);
  const { line } = view;

  const tempoKeys = (
    <Stack direction="row" gap={1} align="center" className="yh-display__tempo-keys" data-part="tempo-keys">
      <Button
        label="Tap"
        size="md"
        hold
        name="Tap tempo"
        tip="tempo.tap"
        tipAction={tipAction}
        onHold={(down) => down && onTap?.()}
        onPress={onTap}
      />
      <Button
        label="Style tempo"
        size="md"
        variant="quiet"
        disabled={view.atStyleTempo}
        name="Back to the style's tempo"
        tip="tempo.reset"
        tipAction={tipAction}
        onPress={onStyleTempo}
      />
    </Stack>
  );

  return (
    <Text as="div" size="inherit" ref={root} className={view.root.className} {...view.root.attrs} style={view.rootStyle as CSSProperties}>
      {art && (
        <div className="yh-display__art" data-part="art">
          <DisplayArt />
        </div>
      )}

      {/* The frame holds the sizes: a container query styles only what is inside the container. */}
      <div ref={frame} className="yh-display__frame" data-part="frame" data-fit="1">
        <header className="yh-display__header" data-part="header">
          <Stack direction="row" gap={1} align="center" className="yh-display__style" data-part="style" role="group" aria-label="Style">
            <Button symbol="prev" size="icon" variant="quiet" name="Previous style (Track left)" tip="style.prev" tipAction={tipAction} onPress={onPrev} />
            <span className="yh-display__style-name" data-part="style-name" title={view.name}>
              <AccentBlock
                as="button"
                label={view.name}
                name={`${view.name}: open the Browser`}
                chevron={false}
                tip="browser.open"
                tipAction={tipAction}
                onPress={onBrowse}
              />
            </span>
            <Button symbol="next" size="icon" variant="quiet" name="Next style (Track right)" tip="style.next" tipAction={tipAction} onPress={onNext} />
            {view.queued ? (
              <span className="yh-display__queued" data-part="queued" title={`Next style: ${view.queued}`}>
                <WaitingChip label={view.queued} hue="a" size="line" />
              </span>
            ) : (
              view.meta && (
                <Text size="label" tabular className="yh-display__meta" data-part="meta" title={view.meta}>
                  {view.meta}
                </Text>
              )
            )}
          </Stack>
          <div className="yh-display__ots" data-part="one-touch">
            <OneTouchPicker applied={style.oneTouch ?? 0} count={style.oneTouchCount ?? 4} tipAction={tipAction} onApply={onOneTouch} />
          </div>
          {view.tempoKeysInHeader && tempoKeys}
        </header>

        <div className="yh-display__readouts" data-part="readouts">
          <div className="yh-display__cell yh-display__section" data-part="section" role="group" aria-label="Section">
            <div className="yh-display__now" data-part="now" role="img" aria-label={view.nowLabel} data-live={view.nowLive}>
              <SectionName label={nowPlaying.playing} idle={!view.running} size={DISPLAY_SIZES.section} />
            </div>
            {view.hasLine && (
              <Text as="p" size="label" className="yh-display__next" data-part="next">
                {line.status && (
                  <Text size="label" className="yh-display__status" data-part="status">
                    {line.status}
                  </Text>
                )}
                {view.hasThen && (
                  <Text size="label" className="yh-display__then" data-part="then" data-docked={view.thenDocked} style={view.thenStyle as CSSProperties}>
                    <span className="yh-display__then-arrow" data-part="then-arrow" aria-hidden="true" />
                    <span className="yh-display__then-word" data-part="then-word">then </span>
                    {line.next && (
                      <Text weight="strong" leading="tight" className="yh-display__then-name" data-part="then-name">
                        {line.next}
                      </Text>
                    )}
                    {line.when && <span className="yh-display__when" data-part="when">{line.when}</span>}
                  </Text>
                )}
              </Text>
            )}
          </div>

          <div className="yh-display__cell yh-display__chord" data-part="chord">
            <ChordReadout {...nowPlaying.chord} tip="fingering.select" tipAction={tipAction} size={DISPLAY_SIZES.chord} />
          </div>

          <div className="yh-display__cell yh-display__tempo" data-part="tempo" role="group" aria-label="Tempo and Tap">
            <TempoReadout
              bpm={nowPlaying.bpm}
              size={DISPLAY_SIZES.tempo}
              tipAction={tipAction}
              onTempo={onTempo}
              onPlus={onTempoUp}
              onMinus={onTempoDown}
              onReset={onStyleTempo}
            />
            <div className="yh-display__beat" data-part="beat">
              <BarBeat beat={view.beat} beats={view.beats} thickness={DISPLAY_SIZES.beat} />
            </div>
            {!view.tempoKeysInHeader && tempoKeys}
          </div>

          {view.parts.length > 0 && (
            <Stack as="ul" gap={0} className="yh-display__parts" data-part="parts" aria-label="Sounds">
              {view.parts.map((p) => (
                <PartRow key={p.id} part={p} tipAction={tipAction} onSound={onSound} />
              ))}
            </Stack>
          )}
        </div>
      </div>
    </Text>
  );
}

/** The forms, for a region to add up (`Display.forms`). */
Display.forms = DISPLAY_FORMS;

export default Display;

function PartRow({ part: p, tipAction, onSound }: { part: DisplayPartView; tipAction?: TipAction; onSound?: DisplayProps['onSound'] }) {
  const ref = useRef<HTMLButtonElement>(null);
  useTip(ref, { tip: PART_TIP, tipAction });
  // The " · " before the tail is CSS, so a one-row parts strip can drop the name and keep "off".
  return (
    <li>
      <Text
        as="button"
        size="label"
        leading="normal"
        ref={ref}
        className="yh-display__part"
        {...p.attrs}
        style={p.style as CSSProperties}
        onClick={() => onSound?.(p.id)}
      >
        <span className="yh-display__part-dot" data-part="part-dot" data-lit={p.lit} aria-hidden="true" />
        <Stack as="span" direction="row" gap={2} align="center" className="yh-display__part-sound" data-part="part-sound" aria-hidden="true">
          <span className="yh-display__part-name" data-part="part-name">{p.sound}</span>
          <PartMarks edited={p.edited} missing={p.missing} failed={p.failed} />
        </Stack>
        <Text size="caption" leading="normal" case="label" className="yh-display__part-part" data-part="part-part" aria-hidden="true">
          <span className="yh-display__part-label" data-part="part-label">{p.name}</span>
          {p.tail && <span className="yh-display__part-tail" data-part="part-tail">{p.tail}</span>}
        </Text>
      </Text>
    </li>
  );
}
