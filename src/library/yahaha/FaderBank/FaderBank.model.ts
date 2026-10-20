// FaderBank's model: its props, and the view a renderer draws from them (the grid's tracks, the
// cluster dividers, Master's plate, each strip's Fader and name, the lamps, the page button, the
// function row and the soft-takeover note). No framework: `FaderBank.tsx` (React) and
// `FaderBank.svelte` (Svelte) both render `faderBankView`; the tooltip binding is a store beside it
// (`tip.ts`). See FaderBank.tsx for the job.
import { PART_HUE_INDEX, type Part } from '../hues';
import type { ButtonModelProps } from '../../components/core/Button/Button.model';
import type { FaderHue, FaderModelProps } from '../../components/music/Fader/Fader.model';
import type { LampButtonModelProps, LampHue } from '../../components/core/LampButton/LampButton.model';
import type { PartMarksModelProps } from '../../components/music/PartMarks/PartMarks.model';
import { visibleMarks } from '../../components/music/PartMarks/marks';
import type { TabItemModel } from '../../layout/Tabs.model';
import type { StyleDecls } from '../../layout/style';
import type { FaderBankForm } from './FaderBank.forms';
import type { TipAction } from './tip';

export type { TipAction };

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

/** FaderBank's props; `L` is a tab label (a string, a React node, a Svelte snippet). */
export interface FaderBankModelProps<L = string> {
  /** The strips, left to right (the board's nine). */
  strips: FaderStrip[];
  /** The fader pages (Panel, Style): the views of the mixer's Region (`FaderBankRegion`). */
  pageTabs: TabItemModel<L>[];
  /** The chosen page's id; `strips` are that page's. */
  page: string;
  /** The fader layers (Vol, Pan, Reverb, Chorus, Delay): the switch in the Region's `aside`. */
  layerTabs: TabItemModel<L>[];
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

/** FaderBankRegion's props beyond the bank's (each renderer adds its own class prop). */
export interface FaderBankRegionModelProps<L = string> extends FaderBankModelProps<L> {
  /** The region's name. Default "Mixer". */
  name?: string;
  /** The grid area the region fills in its screen. */
  area?: string;
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

/** Whether the strip draws any PartMarks (edited, missing, failed, off). */
const hasMarks = (strip: FaderStrip) =>
  strip.kind !== 'parked' &&
  visibleMarks({ edited: strip.edited, missing: strip.missing, failed: strip.failed, off: strip.kind === 'off' }).length > 0;

/** The empty line a name keeps its height with (a no-break space). */
export const BLANK = ' ';

/** An element: its class, attributes and inline style. */
export interface PlacedView {
  className: string;
  attrs: Record<string, string | undefined>;
  style: StyleDecls;
}

/** One strip: its Stack, its Fader and the name under it. */
export interface FaderStripView extends PlacedView {
  id: string;
  /** The Fader's data props (the renderer adds `tipAction` and `onlevel`). */
  fader: Omit<FaderModelProps, 'tipAction' | 'onlevel'>;
  /** A parked strip's name is a blank, hidden placeholder; a live one is a button. */
  parked: boolean;
  /** The name: the button's attributes (a live strip), its tag and sound lines. */
  name: {
    className: string;
    attrs: Record<string, string | undefined>;
    tip?: string;
    tag: string;
    sound: string;
  };
  /** The marks line under the sound (present while any strip has marks); its PartMarks, or null in a parked strip. */
  marks: { className: string; props: PartMarksModelProps | null } | null;
}

/** One lamp: its cell (part lamps only) and its LampButton's data props. */
export interface BankLampView {
  id: string;
  /** Long press wired (`onLampLong`, `onLampRelease`). */
  long: boolean;
  lamp: Omit<LampButtonModelProps, 'tipAction' | 'onToggle' | 'onLongPress' | 'onLongRelease'>;
}

export interface FaderBankView {
  /** The root Stack's gap, class and attributes. */
  root: { gap: 1 | 4; className: string; attrs: Record<string, string | undefined> };
  grid: { className: string; style: StyleDecls };
  dividers: (PlacedView & { key: string })[];
  /** Master's plate, when there is a Master. */
  plate: PlacedView | null;
  strips: FaderStripView[];
  /** The part lamps, each in its grid cell. */
  partLamps: (BankLampView & { cell: PlacedView })[];
  /** The page button's cell and its Button's data props. */
  page: { cell: PlacedView; button: Pick<ButtonModelProps, 'label' | 'size' | 'name' | 'tip'> };
  /** The function row, or null without function lamps. */
  functions: { className: string; group: { name: string; gap: 3; className: string }; lamps: BankLampView[] } | null;
  /** The soft-takeover words, for assistive tech; null while no hardware fader is away. */
  note: { className: string; attrs: Record<string, string | undefined>; lead: string; text: string } | null;
}

const lampView = (item: BankLamp): BankLampView => ({
  id: item.id,
  long: item.long === true,
  lamp: { label: item.label, on: item.on, hue: lampHue(item.hue), rec: item.rec, waiting: item.waiting, size: 'cell', name: item.name, tip: item.tip },
});

const word = <L>(tab: TabItemModel<L> | undefined) => (typeof tab?.label === 'string' ? tab.label : (tab?.name ?? ''));

/** What FaderBank draws, in the chosen `form`. */
export function faderBankView<L>(props: FaderBankModelProps<L>, form: FaderBankForm): FaderBankView {
  const { strips, pageTabs, page, layerTabs, layer, partLamps, functionLamps } = props;
  const layered = layerTabs.length > 0 && layer !== layerTabs[0].id;
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
  const column = (n: number): StyleDecls => ({ 'grid-column': String(n) });

  return {
    root: {
      gap: form === 'short' ? 1 : 4,
      className: 'yh-faderbank',
      attrs: { 'data-part': 'root', 'data-form': form, 'data-layered': layered ? 'true' : undefined },
    },
    grid: { className: 'yh-faderbank__grid', style: { 'grid-template-columns': template } },
    dividers: dividers.map((n) => ({
      key: `divider-${n}`,
      className: 'yh-faderbank__divider',
      attrs: { 'aria-hidden': 'true' },
      style: column(n),
    })),
    plate:
      masterAt >= 0
        ? { className: 'yh-faderbank__plate', attrs: { 'data-part': 'plate', 'aria-hidden': 'true' }, style: column(columns[masterAt]) }
        : null,
    strips: strips.map((strip, i): FaderStripView => {
      const parked = strip.kind === 'parked';
      const part = clusterOf(strip) === 'parts';
      return {
        id: strip.id,
        className: 'yh-faderbank__strip',
        attrs: {
          'data-kind': strip.kind,
          'data-hue': isPartHue(strip.hue) ? String(PART_HUE_INDEX[strip.hue]) : undefined,
          'data-away': !parked ? takeoverWay(strip) : undefined,
        },
        style: column(columns[i]),
        fader: {
          name: strip.faderName,
          value: strip.value,
          level: strip.level,
          meter: strip.meter,
          meter2: strip.meter2,
          peak: strip.peak,
          away: strip.away,
          kind: strip.kind,
          hue: faderHue(strip.hue),
          layered: layered && part,
          empty: parked,
          fillHeight: true,
          tip: strip.tip,
        },
        parked,
        // No native `title`: the app's tooltip (tipAction with openTip) explains the button, and a
        // title would show a second, browser tooltip over it.
        name: parked
          ? { className: 'yh-faderbank__name', attrs: { 'aria-hidden': 'true' }, tag: BLANK, sound: BLANK }
          : {
              className: 'yh-faderbank__name',
              attrs: { type: 'button', 'aria-label': strip.openName ?? strip.tag, 'data-tip': strip.openTip },
              tip: strip.openTip,
              tag: strip.tag,
              sound: strip.sound ?? BLANK,
            },
        // The marks take their own line under the sound, so they never take its width. While any
        // strip in the bank has marks, every strip keeps the line, so the faders above end level.
        marks: marksLine
          ? {
              className: 'yh-faderbank__marks',
              props: parked
                ? null
                : { size: 'strip', edited: strip.edited, missing: strip.missing, failed: strip.failed, off: strip.kind === 'off' },
            }
          : null,
      };
    }),
    partLamps: partLamps.map((item, i) => ({
      ...lampView(item),
      cell: { className: 'yh-faderbank__lamp', attrs: {}, style: column(lampColumn(item, i)) },
    })),
    page: {
      cell: { className: 'yh-faderbank__lamp yh-faderbank__lamp--page', attrs: {}, style: column(pageColumn) },
      button: { label: pageLabel, size: 'cell', name: `Fader page is ${pageLabel}: click for ${otherLabel}`, tip: 'mixer.page' },
    },
    functions:
      functionLamps.length > 0
        ? {
            className: 'yh-faderbank__foot',
            group: { name: 'Functions', gap: 3, className: 'yh-faderbank__functions' },
            lamps: functionLamps.map(lampView),
          }
        : null,
    // Soft takeover in words, for assistive tech only: on screen the strip's dashed outline and the
    // Fader's ghost cap and arrow already say it, in the column itself.
    note:
      away.length > 0
        ? {
            className: 'yh-faderbank__takeover yh-faderbank__visually-hidden',
            attrs: { role: 'status' },
            lead: away.length === 1 ? 'Soft takeover ' : '',
            text: away
              .map((strip) => {
                const way = takeoverWay(strip);
                return `${strip.tag}${way === 'up' ? ' move up to' : way === 'down' ? ' move down to' : ' at'} ${strip.value}`;
              })
              .join(', '),
          }
        : null,
  };
}
