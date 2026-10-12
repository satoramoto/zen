import { Fragment, useEffect, useRef, type CSSProperties } from 'react';
import { Group } from '../../layout/Group';
import { Region } from '../../layout/Region';
import { Stack } from '../../primitives/Stack';
import { Tabs, type TabItem } from '../../layout/Tabs';
import { Text } from '../../primitives/Text';
import { PART_HUE_INDEX, type Part } from '../hues';
import { Button } from '../../components/core/Button/Button';
import { Fader, type FaderHue } from '../../components/music/Fader/Fader';
import { LampButton, type LampHue } from '../../components/core/LampButton/LampButton';
import { PartMarks } from '../../components/music/PartMarks/PartMarks';
import { visibleMarks } from '../../components/music/PartMarks/marks';
import { useForm } from '../../layout/assembly';
import { FADER_BANK_FORMS, type FaderBankForm } from './FaderBank.forms';
import './FaderBank.css';

export { FADER_BANK_FORMS, type FaderBankForm } from './FaderBank.forms';

/** The app's tooltip hook (the original's Svelte `use:tip`): called with the node and the key. */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => void | { update?: (key: string) => void; destroy?: () => void };

/** One of the strips: its Fader and the name button under it. */
export interface FaderStrip {
  /** What the callbacks carry ("right1", "style", "fader7", "master"). Unique in the bank. */
  id: string;
  /** The name under the fader ("Right 1", "Style", "—"). */
  tag: string;
  /** The sound or what the strip scales, under the name ("Stage Grand"). Optional. */
  sound?: string;
  /** The strip's identity: a part (`r1` `r2` `r3` `l`) wears its part hue; `a` (Style), `t2` (Multi Pad) and `t` (Master) are neutral. */
  hue: 'r1' | 'r2' | 'r3' | 'l' | 'a' | 't2' | 't';
  /** `part`, `group`, `master` live; `off` a part switched off; `parked` an unused fader. */
  kind: 'part' | 'group' | 'master' | 'off' | 'parked';
  /** The text at the top of the fader: the level ("90"), or the layer and value ("Rev 40"). */
  value: string;
  /** The set level, 0–127. */
  level: number;
  /** The meters and the peak line, 0–1 of the travel. */
  meter: number;
  meter2: number;
  peak: number;
  /** Where the hardware fader is (0–127) while it's away from the level (soft takeover). */
  away?: number;
  /** The marks after the name. */
  edited?: boolean;
  missing?: boolean;
  failed?: boolean;
  /** The fader's accessible name ("Right 1 · Stage Grand, level 90"). */
  faderName: string;
  /** The name button's accessible name ("Right 1, Stage Grand: open Channel"). Parked: none, not pressable. */
  openName?: string;
  /** The fader's tooltip key. */
  tip?: string;
  /** The name button's tooltip key (not for a parked strip, whose name is not a button). */
  openTip?: string;
}

/** One lamp: a part's on/off, or a Launchkey function. */
export interface BankLamp {
  /** What the callbacks carry ("right1", "harmArp"). A part lamp's id names the strip it sits under. */
  id: string;
  /** The word on the face ("On", "Harm/Arp"). */
  label: string;
  /** Lit. */
  on: boolean;
  /** The part for a part lamp (it wears that part's hue), `t` (neutral) for a function, `lamp` the Looper looping. */
  hue?: Part | 't' | 'lamp';
  /** Record lamp: lit and waiting draw in the record colour. */
  rec?: boolean;
  /** The waiting (armed) face while not lit. */
  waiting?: boolean;
  /** The accessible name ("Right 1 on. Long press: swap mode …"). */
  name?: string;
  /** The tooltip key. */
  tip?: string;
  /** It has a long press (swap mode, Loop rec, Sound held): `onLampLong` and `onLampRelease` are wired. */
  long?: boolean;
}

export interface FaderBankProps {
  /** The strips, left to right (the board's nine). */
  strips: FaderStrip[];
  /** The fader pages (Panel, Style): the views of the mixer's Region (`FaderBankRegion`). */
  pageTabs: TabItem[];
  /** The chosen page's id; `strips` are that page's. */
  page: string;
  /** The fader layers (Vol, Pan, Reverb, Chorus, Delay): the switch in the Region's `aside`. */
  layerTabs: TabItem[];
  /** The chosen layer's id; any but the first gives the part strips the layer look and the header its word. */
  layer: string;
  /** The part lamps, each under the strip with its id (else under strips 1–4 in order). */
  partLamps: BankLamp[];
  /** The Launchkey function lamps (fader buttons 5–8). */
  functionLamps: BankLamp[];
  /** The app's tooltip hook, passed to every control that has a tooltip key. */
  tipAction?: TipAction;
  /** A page tab was chosen. */
  onChoosePage?: (id: string) => void;
  /** A layer tab was chosen. */
  onChooseLayer?: (id: string) => void;
  /** A fader asked for a level (0–127). */
  onLevel?: (id: string, level: number) => void;
  /** A strip's name was pressed (open Channel, Effects, …). */
  onOpen?: (id: string) => void;
  /** A lamp asked to be switched to `on`. */
  onLamp?: (id: string, on: boolean) => void;
  /** A lamp with `long` was held. */
  onLampLong?: (id: string) => void;
  /** The hold on a `long` lamp ended. */
  onLampRelease?: (id: string) => void;
  /** The fader page button (the Launchkey's master fader button) was pressed: flip the page. */
  onPageButton?: () => void;
  /** The page button was held (the fader picker on the pads). */
  onPageLong?: () => void;
  /** The hold on the page button ended. */
  onPageRelease?: () => void;
  /**
   * The form (`FADER_BANK_FORMS`): `tall` (the board's strips) or `short` (much less height, every
   * control kept). Default: the form the assembled screen chose for the region, else `tall`.
   */
  form?: FaderBankForm;
}

type Cluster = 'parts' | 'groups' | 'empty' | 'master';

const clusterOf = (strip: FaderStrip): Cluster =>
  strip.kind === 'part' || strip.kind === 'off'
    ? 'parts'
    : strip.kind === 'parked'
      ? 'empty'
      : strip.kind === 'master'
        ? 'master'
        : 'groups';

const isPartHue = (hue: string | undefined): hue is Part => hue === 'r1' || hue === 'r2' || hue === 'r3' || hue === 'l';

/** A Yahaha strip or lamp identity on the library's slots: a part becomes its hue slot (`hues.ts`). */
const faderHue = (hue: FaderStrip['hue']): FaderHue => (isPartHue(hue) ? PART_HUE_INDEX[hue] : hue);
const lampHue = (hue: BankLamp['hue']): LampHue | undefined => (isPartHue(hue) ? PART_HUE_INDEX[hue] : hue);

/** Which way the hardware fader must travel to pick the level up. */
const takeoverWay = (strip: FaderStrip) =>
  strip.away === undefined ? undefined : strip.away < strip.level ? 'up' : strip.away > strip.level ? 'down' : 'at';

/** The grid's tracks: one per strip, plus a divider track where a new cluster (other than the empty slots) begins. */
function layout(strips: FaderStrip[]) {
  const tracks: string[] = [];
  const columns: number[] = [];
  const dividers: number[] = [];
  strips.forEach((strip, i) => {
    const cluster = clusterOf(strip);
    if (i > 0 && cluster !== 'empty' && cluster !== clusterOf(strips[i - 1])) {
      tracks.push('var(--space-1)');
      dividers.push(tracks.length);
    }
    // Master is a little wider. A parked fader keeps a real strip's place and full height, like the
    // hardware fader it mirrors, at three quarters of a strip's width, so live names ("Multi Pad")
    // and keys keep theirs. A live strip never goes below its content (its name, its key; the
    // sound ellipsizes), so the least width FADER_BANK_FORMS declares is the least it takes.
    tracks.push(
      cluster === 'master'
        ? 'minmax(min-content, 1.25fr)'
        : cluster === 'empty'
          ? 'minmax(var(--space-4), 0.75fr)'
          : 'minmax(min-content, 1fr)',
    );
    columns.push(tracks.length);
  });
  return { template: tracks.join(' '), columns, dividers };
}

function useTip(tipAction: TipAction | undefined, key: string | undefined) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !tipAction || key === undefined) return;
    const handle = tipAction(node, key);
    return () => handle?.destroy?.();
  }, [tipAction, key]);
  return ref;
}

/** Whether the strip draws any PartMarks (edited, missing, failed, off). */
const hasMarks = (strip: FaderStrip) =>
  strip.kind !== 'parked' &&
  visibleMarks({ edited: strip.edited, missing: strip.missing, failed: strip.failed, off: strip.kind === 'off' }).length > 0;

function StripName({
  strip,
  marksLine,
  tipAction,
  onOpen,
}: {
  strip: FaderStrip;
  marksLine: boolean;
  tipAction?: TipAction;
  onOpen?: (id: string) => void;
}) {
  const ref = useTip(tipAction, strip.openTip);
  const off = strip.kind === 'off';
  // No native `title`: the app's tooltip (tipAction with openTip) explains the button, and a
  // title would show a second, browser tooltip over it.
  return (
    <Text
      as="button"
      size="inherit"
      leading="snug"
      ref={ref}
      type="button"
      className="yh-faderbank__name"
      aria-label={strip.openName ?? strip.tag}
      data-tip={strip.openTip}
      onClick={() => onOpen?.(strip.id)}
    >
      <Text size="label" weight="strong" leading="snug" className="yh-faderbank__tag-text">{strip.tag}</Text>
      <Text size="caption" leading="snug" className="yh-faderbank__sound">{strip.sound ?? ' '}</Text>
      {/* The marks take their own line under the sound, so they never take its width. While any
          strip in the bank has marks, every strip keeps the line, so the faders above end level. */}
      {marksLine && (
        <span className="yh-faderbank__marks">
          <PartMarks size="strip" edited={strip.edited} missing={strip.missing} failed={strip.failed} off={off} />
        </span>
      )}
    </Text>
  );
}

/**
 * FaderBank: the Stage's mixer.
 *
 * **Job.** Show, from a metre away mid-song, how loud each of the four parts is, which are
 * sounding and which are off, what the Style, Multi Pad and Master faders are at, and whether a
 * hardware fader has to be moved through its level before it takes over again; and let a player
 * change any of it, switch the fader page (Panel, Style) and layer (Vol … Delay), and reach the
 * Launchkey's fader-button functions.
 *
 * **Changed.** *Colour meaning* (`hues.ts`, `color.md` §3): the four parts are the only hued
 * things in the bank, and each wears its hue three times in one column (fader fill, name,
 * On lamp) so the mixer agrees with the keyboard zones and sound row; Style, Multi Pad and Master
 * are neutral, and the function lamps light in neutral ink. *Grouping and hierarchy*
 * (`craft-details.md`, proximity): the strips fall into clusters with a hairline between them,
 * parts | Style and Multi Pad | Master, instead of nine equal columns; Master is set apart on its
 * own raised plate, a little wider, as the last word on loudness; the plate fills its column, so
 * its edge lines up with the bank's, and Master sits inset on it. *Mapping and one empty-slot
 * vocabulary*: the unused faders 7 and 8 are real strips in their hardware places, one to one as
 * KnobBank's eight knobs and PadBank's sixteen pads are, each the banks' one empty-slot face: a
 * faint wash (`--text-1` at 6%, `--radius-control`) over the strip's whole footprint, with no
 * groove, cap, value, name or edge and no hover or press give, exactly as an empty pad. A thin
 * groove there read as a stray hairline between Multi Pad and Master; a strip-wide wash reads as
 * a slot. They take three quarters of a live strip's width, so at a 1217 × 752 Stage the live
 * names and keys ("Multi Pad", "Off") keep the room they need whole. *Room to breathe*
 * (`craft-details.md`, proximity): a full step of air between the tab row and the strips, between
 * strips, around Master on its plate and above the Functions rule, so the clusters read as groups
 * by space as much as by hairline; no text got smaller for it. In a 1217 × 752 Stage's narrower
 * mixer the strips step back to the tighter gap, so "Multi Pad" keeps its name whole. *Numerals*: each level is the Fader's large
 * tabular numeral; under it the part's name in its hue and its sound in muted text, so a column
 * reads "72 · Right 2 · Silk Strings" top to bottom. The part's marks (edited, ⚠ missing, ✕
 * failed, "off") take their own line under the sound, so they never cut the sound's name; while
 * any strip has marks every strip keeps that line, so the faders end level. Each Fader fills its
 * strip's height (`fillHeight`). *Off reads as off*: the name fades in its
 * own hue with the word "off", the fader and meters dim, and the lamp below says Off unlit; three
 * cues, none of them colour alone. *Soft takeover* is a state, so it is `--warning`: the Fader
 * draws a dashed ghost cap where the hardware is with an arrow saying which way to move it, and
 * the strip is outlined, so the column itself says it twice in shape; the words ("Soft takeover
 * Right 2 move up to 72") are a status for assistive tech only, since a fourth visible cue at the
 * foot only repeated the column and was cut to "Soft take…" in narrow packs. *One key height*
 * (rhythm): the part On lamps, the page button under Master (like the Launchkey's master fader
 * button) and the four function lamps are all `cell` keys, so the region has one key height; the
 * function lamps keep their own row under a hairline, since they are not mixer controls, but lose
 * the "Functions" caption, which only named a row of keys that name themselves. Whether a lamp is
 * on is the LampButton's own face (outline in its hue and a lit LED; solid fills are kept for
 * what sounds or runs), so the fader fill stays the loudest "on" in the column. *Clutter*: the
 * "Faders" title and the "Layer" word are gone: the page tabs (Panel, Style) and the layer tabs
 * (Vol … Delay) name themselves. A non-Vol layer shows as its chosen tab and turns the
 * part strips to the neutral layer look, with the layer word over each number ("Rev 40").
 * *Tabs in the region* (2026-10, layout primitives): the bank draws no tab row of its own. Its
 * pages are the views of the screen's mixer `Region` and its layers the `Tabs` in that region's
 * `aside` (`FaderBankRegion` builds both); the bank renders the chosen page's strips.
 *
 * **Kept.** Holds no state: every change is a callback with the strip's or lamp's id. The
 * "Functions" group (a library `Group`) and the takeover status. Each
 * strip is a Fader (a vertical slider with keys, wheel and drag) over a name button that opens
 * the part's page; the parked faders stay disabled sliders named "Fader 7 unused". The part
 * lamps' long press (swap mode), the Sound and Looper holds, and the page button's tap to flip
 * and hold for the fader picker. Every accessible name and tooltip key of the original; tooltips
 * come only from `tipAction` (each control applies it once; the region's tabs carry their keys as
 * `data-tip`), never a native `title`, so no control shows two.
 *
 * **Headless** (2026-10): the bank paints no panel of its own (it sits inside a screen's
 * `Region`, on the theme's `plate` material); Master's plate (`data-part="plate"`) is that
 * material again, raised inside it, and each strip's look comes from the Fader's own materials, so a material set restyles the
 * mixer without touching it.
 *
 * **Forms** (2026-10, assembly): `tall → short` (`FADER_BANK_FORMS`, `FaderBank.forms`), read with
 * `useForm` (a `form` prop wins; `FaderBankRegion` passes it through) and carried as `data-form`.
 * They declare the body only, in scale units, and the CSS keeps to the same steps. `short` keeps
 * every strip, key and mark and takes every step tighter: the Fader's gap a `--space-1`, no foot
 * under its travel, no padding round the name, Master's plate inset a `--space-1`, a tighter
 * column, row and foot gap. Both fill the box they are given; the travel takes what is left. Each
 * strip track is at least its content (`minmax(min-content, …)`), and the sound line has no
 * inline size of its own (it ellipsizes to the strip), so the least width is the names' and keys'.
 */
export function FaderBank({
  strips,
  pageTabs,
  page,
  layerTabs,
  layer,
  partLamps,
  functionLamps,
  tipAction,
  onLevel,
  onOpen,
  onLamp,
  onLampLong,
  onLampRelease,
  onPageButton,
  onPageLong,
  onPageRelease,
  form: given,
}: FaderBankProps) {
  const form = useForm(FADER_BANK_FORMS, given);
  const layered = layerTabs.length > 0 && layer !== layerTabs[0].id;
  const word = (tab: TabItem | undefined) => (typeof tab?.label === 'string' ? tab.label : (tab?.name ?? ''));
  const pageLabel = word(pageTabs.find((tab) => tab.id === page));
  const otherLabel = word(pageTabs.find((tab) => tab.id !== page));

  const { template, columns, dividers } = layout(strips);
  const partStrips = strips.flatMap((strip, i) => (clusterOf(strip) === 'parts' ? [i] : []));
  const masterAt = strips.findIndex((strip) => strip.kind === 'master');
  const pageColumn = columns[masterAt >= 0 ? masterAt : strips.length - 1] ?? 1;
  const away = strips.filter((strip) => strip.kind !== 'parked' && strip.away !== undefined);
  const marksLine = strips.some(hasMarks);

  const lampColumn = (lamp: BankLamp, i: number) => {
    const at = strips.findIndex((strip) => strip.id === lamp.id);
    return columns[at >= 0 ? at : (partStrips[i] ?? i)] ?? i + 1;
  };

  const lamp = (item: BankLamp) => (
    <LampButton
      label={item.label}
      on={item.on}
      hue={lampHue(item.hue)}
      rec={item.rec}
      waiting={item.waiting}
      size="cell"
      name={item.name}
      tip={item.tip}
      tipAction={tipAction}
      onToggle={(on) => onLamp?.(item.id, on)}
      onLongPress={item.long ? () => onLampLong?.(item.id) : undefined}
      onLongRelease={item.long ? () => onLampRelease?.(item.id) : undefined}
    />
  );

  // Soft takeover in words, for assistive tech only: on screen the strip's dashed outline and the
  // Fader's ghost cap and arrow already say it, in the column itself.
  const note =
    away.length > 0 ? (
      <span className="yh-faderbank__takeover yh-faderbank__visually-hidden" role="status">
        {away.length === 1 && 'Soft takeover '}
        <span>
          {away.map((strip, i) => {
            const way = takeoverWay(strip);
            return (
              <Fragment key={strip.id}>
                {i > 0 && ', '}
                {strip.tag}
                {way === 'up' ? ' move up to' : way === 'down' ? ' move down to' : ' at'} {strip.value}
              </Fragment>
            );
          })}
        </span>
      </span>
    ) : undefined;

  return (
    <Stack gap={form === 'short' ? 1 : 4} className="yh-faderbank" data-part="root" data-form={form} data-layered={layered || undefined}>
      <div className="yh-faderbank__grid" style={{ gridTemplateColumns: template } as CSSProperties}>
        {dividers.map((column) => (
          <span key={`divider-${column}`} className="yh-faderbank__divider" style={{ gridColumn: column }} aria-hidden="true" />
        ))}
        {masterAt >= 0 && <span className="yh-faderbank__plate" data-part="plate" style={{ gridColumn: columns[masterAt] }} aria-hidden="true" />}

        {strips.map((strip, i) => {
          const parked = strip.kind === 'parked';
          const part = clusterOf(strip) === 'parts';
          return (
            <Stack
              key={strip.id}
              gap={1}
              className="yh-faderbank__strip"
              style={{ gridColumn: columns[i] }}
              data-kind={strip.kind}
              data-hue={isPartHue(strip.hue) ? PART_HUE_INDEX[strip.hue] : undefined}
              data-away={!parked ? takeoverWay(strip) : undefined}
            >
              <Fader
                name={strip.faderName}
                value={strip.value}
                level={strip.level}
                meter={strip.meter}
                meter2={strip.meter2}
                peak={strip.peak}
                away={strip.away}
                kind={strip.kind}
                hue={faderHue(strip.hue)}
                layered={layered && part}
                empty={parked}
                fillHeight
                tip={strip.tip}
                tipAction={tipAction}
                onlevel={(level) => onLevel?.(strip.id, level)}
              />
              {parked ? (
                <Text size="inherit" leading="snug" className="yh-faderbank__name" aria-hidden="true">
                  <Text size="label" weight="strong" leading="snug" className="yh-faderbank__tag-text">{' '}</Text>
                  <Text size="caption" leading="snug" className="yh-faderbank__sound">{' '}</Text>
                  {marksLine && <span className="yh-faderbank__marks" />}
                </Text>
              ) : (
                <StripName strip={strip} marksLine={marksLine} tipAction={tipAction} onOpen={onOpen} />
              )}
            </Stack>
          );
        })}

        {partLamps.map((item, i) => (
          <div key={item.id} className="yh-faderbank__lamp" style={{ gridColumn: lampColumn(item, i) }}>
            {lamp(item)}
          </div>
        ))}
        <div className="yh-faderbank__lamp yh-faderbank__lamp--page" style={{ gridColumn: pageColumn }}>
          <Button
            label={pageLabel}
            size="cell"
            name={`Fader page is ${pageLabel}: click for ${otherLabel}`}
            tip="mixer.page"
            tipAction={tipAction}
            onPress={onPageButton}
            onLongPress={onPageLong}
            onLongRelease={onPageRelease}
          />
        </div>
      </div>

      {functionLamps.length > 0 && (
        <div className="yh-faderbank__foot">
          <Group name="Functions" label={false} gap={3} className="yh-faderbank__functions">
            {functionLamps.map((item) => (
              <Fragment key={item.id}>{lamp(item)}</Fragment>
            ))}
          </Group>
        </div>
      )}
      {note}
    </Stack>
  );
}

export interface FaderBankRegionProps extends FaderBankProps {
  /** The region's name. Default "Mixer". */
  name?: string;
  /** The grid area the region fills in its screen. */
  area?: string;
  className?: string;
}

/**
 * The mixer as a screen region: a library `Region` whose views are the fader pages (Panel,
 * Style), with the layer `Tabs` (Vol … Delay) in its `aside`, and the FaderBank for the chosen
 * page as its body. The page and layer stay the caller's (`page`, `onChoosePage`, `layer`,
 * `onChooseLayer`), so the master fader button can flip the page too.
 */
export function FaderBankRegion({ name = 'Mixer', area, className, ...bank }: FaderBankRegionProps) {
  const body = <FaderBank {...bank} />;
  const aside =
    bank.layerTabs.length > 0 ? (
      <Tabs
        name="Fader layer"
        items={bank.layerTabs}
        value={bank.layer}
        onChange={(id) => bank.onChooseLayer?.(id)}
        tipAction={bank.tipAction}
      />
    ) : undefined;
  return (
    <Region
      name={name}
      area={area}
      className={className}
      aside={aside}
      view={bank.page}
      onView={(id) => bank.onChoosePage?.(id)}
      tipAction={bank.tipAction}
    >
      {bank.pageTabs.length > 0
        ? bank.pageTabs.map((tab) => (
            <Region.View key={tab.id} id={tab.id} label={tab.label} name={tab.name} disabled={tab.disabled} tip={tab.tip}>
              {body}
            </Region.View>
          ))
        : body}
    </Region>
  );
}

/** The forms, for a region to add up (`docs/assembly.md`). */
FaderBank.forms = FADER_BANK_FORMS;

export default FaderBank;
