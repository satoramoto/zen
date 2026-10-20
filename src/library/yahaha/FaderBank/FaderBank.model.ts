// FaderBank's model: its props, and the tree it draws (the grid's tracks, the cluster dividers,
// Master's plate, each strip's Fader and name, the lamps, the page button, the function row and the
// soft-takeover note), plus FaderBankRegion's tree (the mixer's Region round the bank). No
// framework: `FaderBank.tsx` (React) and `FaderBank.svelte` (Svelte) both pass `faderBankView` to
// their `Tree`; the name button's tooltip is the kernel's `tip` store. See FaderBank.tsx for the job.
import { PART_HUE_INDEX, type Part } from '../hues';
import type { FaderHue } from '../../components/music/Fader/Fader.model';
import type { LampHue } from '../../components/core/LampButton/LampButton.model';
import { visibleMarks } from '../../components/music/PartMarks/marks';
import type { TabItemModel } from '../../layout/Tabs.model';
import { stackView } from '../../primitives/Stack.model';
import { textView } from '../../primitives/Text.model';
import { component, each, h, styleText, when, wire, type Child, type ComponentNode, type Handlers, type Node } from '../../view/Tree.model';
import type { TipAction } from '../../view/tip';
import type { FaderBankForm } from './FaderBank.forms';

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
  /** The part for a part lamp (it wears that part's hue), `t` (neutral) for a function, `lamp` the Looper looping, `ok` running / success (`--success`). */
  hue?: Part | 't' | 'lamp' | 'ok';
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

/** A grid cell's column. */
const column = (n: number) => styleText({ 'grid-column': String(n) });

/**
 * A lamp: its LampButton with its data props, its toggle by key (`lamp:<id>`), and, when it has a
 * long press, its hold and release (`lampLong:<id>`, `lampRelease:<id>`).
 */
const lampNode = (item: BankLamp): ComponentNode =>
  component(
    'LampButton',
    { label: item.label, on: item.on, hue: lampHue(item.hue), rec: item.rec, waiting: item.waiting, size: 'cell', name: item.name, tip: item.tip },
    {
      on: {
        tipAction: 'tipAction',
        onToggle: `lamp:${item.id}`,
        ...(item.long ? { onLongPress: `lampLong:${item.id}`, onLongRelease: `lampRelease:${item.id}` } : {}),
      },
      key: `lamp:${item.id}`,
    },
  );

/** A Text primitive as its element: the Text model's class and attributes, then `attrs`. */
function text(tag: string, model: Parameters<typeof textView>[0], attrs: Record<string, string | undefined>, ...children: (Child | null)[]): Node {
  const view = textView(model);
  return h(tag, { class: view.className, ...view.attrs, ...attrs }, ...children);
}

const word = <L>(tab: TabItemModel<L> | undefined) => (typeof tab?.label === 'string' ? tab.label : (tab?.name ?? ''));

/** One strip: a Stack holding its Fader (`level:<id>`) and the name under it (a button opening
 *  `open:<id>`, with the `tip` store; a parked strip's is a blank, hidden placeholder). */
function stripNode(strip: FaderStrip, at: number, layered: boolean, marksLine: boolean): Node {
  const parked = strip.kind === 'parked';
  const part = clusterOf(strip) === 'parts';
  const stack = stackView({ gap: 1, className: 'yh-faderbank__strip' });
  const fader = component(
    'Fader',
    {
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
    { on: { tipAction: 'tipAction', onlevel: `level:${strip.id}` } },
  );
  const tag = text('span', { size: 'label', weight: 'strong', leading: 'snug', className: 'yh-faderbank__tag-text' }, {}, parked ? BLANK : strip.tag);
  const sound = text('span', { size: 'caption', leading: 'snug', className: 'yh-faderbank__sound' }, {}, parked ? BLANK : (strip.sound ?? BLANK));
  // The marks take their own line under the sound, so they never take its width. While any strip in
  // the bank has marks, every strip keeps the line, so the faders above end level.
  const marks = when(marksLine, () =>
    h(
      'span',
      { class: 'yh-faderbank__marks' },
      when(!parked, () =>
        component('PartMarks', { size: 'strip', edited: strip.edited, missing: strip.missing, failed: strip.failed, off: strip.kind === 'off' }),
      ),
    ),
  );
  const nameModel = { size: 'inherit', leading: 'snug', className: 'yh-faderbank__name' } as const;
  // No native `title`: the app's tooltip (tipAction with openTip) explains the button, and a title
  // would show a second, browser tooltip over it.
  const name = parked
    ? text('span', nameModel, { 'aria-hidden': 'true' }, tag, sound, marks)
    : wire(text('button', nameModel, { type: 'button', 'aria-label': strip.openName ?? strip.tag, 'data-tip': strip.openTip }, tag, sound, marks), {
        on: { click: `open:${strip.id}` },
        bind: [['tip', { tip: strip.openTip, tipAction: 'tipAction' }]],
      });
  return h(
    'div',
    {
      class: stack.className,
      ...stack.attrs,
      style: column(at),
      'data-kind': strip.kind,
      'data-hue': isPartHue(strip.hue) ? String(PART_HUE_INDEX[strip.hue]) : undefined,
      'data-away': !parked ? takeoverWay(strip) : undefined,
    },
    fader,
    name,
  );
}

/**
 * The tree FaderBank draws in the chosen `form`: the root Stack; the grid of dividers, Master's
 * plate, the strips, the part lamps in their cells and the page button under Master; the function
 * row; the soft-takeover status. Callbacks are by key: `level:<id>`, `open:<id>`, `lamp:<id>`,
 * `lampLong:<id>`, `lampRelease:<id>`, `page`, `pageLong`, `pageRelease`, `tipAction`
 * (`faderBankHandlers`). `form` is the binding's (`useForm` / `getForm`).
 */
export function faderBankView<L>(props: FaderBankModelProps<L>, form: FaderBankForm): Node {
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

  const root = stackView({ gap: form === 'short' ? 1 : 4, className: 'yh-faderbank' });
  const keyed = (node: Node, key: string): Node => ({ ...node, key });

  const grid = h(
    'div',
    { class: 'yh-faderbank__grid', style: styleText({ 'grid-template-columns': template }) },
    each(dividers, (n) => `divider-${n}`, (n) => h('span', { class: 'yh-faderbank__divider', style: column(n), 'aria-hidden': 'true' })),
    masterAt >= 0
      ? keyed(h('span', { class: 'yh-faderbank__plate', style: column(columns[masterAt]), 'data-part': 'plate', 'aria-hidden': 'true' }), 'plate')
      : null,
    each(strips, (strip) => `strip:${strip.id}`, (strip, i) => stripNode(strip, columns[i], layered, marksLine)),
    each(partLamps, (item) => `cell:${item.id}`, (item, i) => h('div', { class: 'yh-faderbank__lamp', style: column(lampColumn(item, i)) }, lampNode(item))),
    keyed(
      h(
        'div',
        { class: 'yh-faderbank__lamp yh-faderbank__lamp--page', style: column(pageColumn) },
        component(
          'Button',
          { label: pageLabel, size: 'cell', name: `Fader page is ${pageLabel}: click for ${otherLabel}`, tip: 'mixer.page' },
          {
            on: {
              tipAction: 'tipAction',
              onPress: 'page',
              ...(props.onPageLong ? { onLongPress: 'pageLong' } : {}),
              ...(props.onPageRelease ? { onLongRelease: 'pageRelease' } : {}),
            },
          },
        ),
      ),
      'page',
    ),
  );

  return h(
    'div',
    { class: root.className, ...root.attrs, 'data-part': 'root', 'data-form': form, 'data-layered': layered ? 'true' : undefined },
    grid,
    when(functionLamps.length > 0, () =>
      h(
        'div',
        { class: 'yh-faderbank__foot' },
        component(
          'Group',
          { name: 'Functions', label: false, gap: 3, className: 'yh-faderbank__functions', class: 'yh-faderbank__functions' },
          { slots: { children: functionLamps.map(lampNode) } },
        ),
      ),
    ),
    // Soft takeover in words, for assistive tech only: on screen the strip's dashed outline and the
    // Fader's ghost cap and arrow already say it, in the column itself.
    when(away.length > 0, () =>
      h(
        'span',
        { class: 'yh-faderbank__takeover yh-faderbank__visually-hidden', role: 'status' },
        away.length === 1 ? 'Soft takeover ' : null,
        h(
          'span',
          {},
          away
            .map((strip) => {
              const way = takeoverWay(strip);
              return `${strip.tag}${way === 'up' ? ' move up to' : way === 'down' ? ' move down to' : ' at'} ${strip.value}`;
            })
            .join(', '),
        ),
      ),
    ),
  );
}

/** The callbacks FaderBank's tree names, each carrying its strip's or lamp's id. */
export function faderBankHandlers<L>(props: FaderBankModelProps<L>): Handlers {
  const handlers: Handlers = {
    tipAction: props.tipAction,
    page: () => props.onPageButton?.(),
    pageLong: props.onPageLong,
    pageRelease: props.onPageRelease,
  };
  for (const strip of props.strips) {
    handlers[`level:${strip.id}`] = (level: number) => props.onLevel?.(strip.id, level);
    handlers[`open:${strip.id}`] = () => props.onOpen?.(strip.id);
  }
  for (const lamp of [...props.partLamps, ...props.functionLamps]) {
    handlers[`lamp:${lamp.id}`] = (on: boolean) => props.onLamp?.(lamp.id, on);
    handlers[`lampLong:${lamp.id}`] = () => props.onLampLong?.(lamp.id);
    handlers[`lampRelease:${lamp.id}`] = () => props.onLampRelease?.(lamp.id);
  }
  return handlers;
}

/** The bank's callbacks, which FaderBankRegion passes on to its FaderBank when they are set. */
const BANK_CALLBACKS = [
  'onLevel',
  'onOpen',
  'onLamp',
  'onLampLong',
  'onLampRelease',
  'onPageButton',
  'onPageLong',
  'onPageRelease',
  'tipAction',
] as const;

/**
 * The tree FaderBankRegion draws: a library `Region` whose views are the fader pages (`views`, the
 * chosen one `view`, `onView` → `choosePage`), the layer `Tabs` in its `aside` (only when there are
 * layer tabs; `onChange` → `chooseLayer`), and the FaderBank as its body, with every bank callback
 * that is set passed on by its own name. `className` is the region's class (passed as `className`
 * and `class`, Region's React and Svelte names). Tab labels are passed through as given, so the
 * tree is plain data only while they are strings.
 */
export function faderBankRegionView<L>({ name = 'Mixer', area, className, ...bank }: FaderBankRegionModelProps<L> & { className?: string }): ComponentNode {
  const data = Object.fromEntries(Object.entries(bank).filter(([, value]) => typeof value !== 'function'));
  const callbacks = Object.fromEntries(BANK_CALLBACKS.filter((key) => bank[key] !== undefined).map((key) => [key, key]));
  return component(
    'Region',
    { name, area, className, class: className, views: bank.pageTabs, view: bank.page },
    {
      on: { onView: 'choosePage', tipAction: 'tipAction' },
      slots: {
        ...(bank.layerTabs.length > 0
          ? {
              aside: [
                component('Tabs', { name: 'Fader layer', items: bank.layerTabs, value: bank.layer }, { on: { onChange: 'chooseLayer', tipAction: 'tipAction' } }),
              ],
            }
          : {}),
        children: [component('FaderBank', data, { on: callbacks })],
      },
    },
  );
}

/** The callbacks FaderBankRegion's tree names: the page and layer choices, the tooltip action, and
 *  the bank's own callbacks under their own names. */
export function faderBankRegionHandlers<L>(props: FaderBankRegionModelProps<L>): Handlers {
  const handlers: Handlers = {
    choosePage: (id: string) => props.onChoosePage?.(id),
    chooseLayer: (id: string) => props.onChooseLayer?.(id),
  };
  for (const key of BANK_CALLBACKS) handlers[key] = props[key];
  return handlers;
}
