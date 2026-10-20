// AppBar's model: its props, the tree it draws from them (the header and its row: the name, the
// page nav, the now-playing words, the `end` slot, the global switches with the metronome's
// popover, the connections and Panic) and the handlers that tree names. No framework: `AppBar.tsx`
// (React) and `AppBar.svelte` (Svelte) both pass `appBarView` and `appBarHandlers` to their `Tree`;
// focus back to the ▾ is the `focusReturn` store (`popover.ts`, registered in `view/stores.ts`).
import type { TipAction } from '../../components/core/Button/Button.model';
import type { TabItemModel } from '../../layout/Tabs.model';
import { stackView, type StackModelProps } from '../../primitives/Stack.model';
import { textView, type TextModelProps } from '../../primitives/Text.model';
import { component, h, slot, styleText, when, wire, type Child, type Handlers, type Node } from '../../view/Tree.model';
import type { HealthTarget } from '../HealthSlot/HealthSlot.model';

export type { HealthTarget, TipAction };

/** Every AppBar prop but its `end` slot (a React node or a Svelte snippet); `L` is a tab's label. */
export interface AppBarModelProps<L = string> {
  /** The display pages, left of the hairline (Stage … Harm/Arp). */
  displayTabs: TabItemModel<L>[];
  /** The full pages, right of the hairline (Library, Settings). */
  fullTabs: TabItemModel<L>[];
  /** The `id` of the page shown; null: none. */
  chosen?: string | null;
  /** Called with a page's `id` on a click. The parent moves `chosen`. */
  onChoose?: (id: string) => void;
  /** The app's tooltip action, applied to every element here that carries a tooltip key. */
  tipAction?: TipAction;

  /** True while the Launchkey is connected: a filled dot; otherwise a hollow ring. */
  launchkey?: boolean;
  /** HealthSlot: the first keyboard part (0–3: R1 R2 R3 L) whose plugin failed. */
  failedPart?: 0 | 1 | 2 | 3 | null;
  /** HealthSlot: false when there is no audio. */
  synthOn?: boolean;
  /** HealthSlot: audio dropouts in the last 30 s. */
  dropouts?: number;
  /** HealthSlot: the buffer in use, in frames; null when unknown. */
  bufferFrames?: number | null;
  /** HealthSlot: the CPU load, 1.0 = the whole buffer; null before the first meters frame. */
  cpu?: number | null;
  /** HealthSlot: called with where to fix the trouble. */
  onHealth?: (target: HealthTarget) => void;

  /** The metronome on. */
  metronome?: boolean;
  /** Called with the state asked for when Metronome (or the popover's On/Off) is pressed. */
  onMetronome?: (on: boolean) => void;
  /** The metronome's settings popover is open. */
  metronomeOpen?: boolean;
  /** Called when the ▾ beside Metronome is pressed (opens or closes its settings). */
  onMetronomeSettings?: () => void;
  /** Called on Esc or a press outside the open popover: the parent closes it. */
  onMetronomeClose?: () => void;
  /** The popover's id, for the ▾'s `aria-controls`. */
  metronomeId?: string;
  /** The click's volume, 0–127. */
  metronomeVolume?: number;
  /** Called with the volume asked for (0–127). */
  onMetronomeVolume?: (volume: number) => void;
  /** A bell on the first beat of each bar. */
  metronomeBell?: boolean;
  /** Called with the state asked for when the bell's On/Off is pressed. */
  onMetronomeBell?: (on: boolean) => void;
  /** The click can sound (the built-in synth is running). */
  metronomeAudible?: boolean;

  /** Unison on. */
  unison?: boolean;
  /** Called with the state asked for when Unison is pressed. */
  onUnison?: (on: boolean) => void;
  /** Help mode on: the ? is lit. */
  help?: boolean;
  /** Called with the state asked for when ? is pressed. */
  onHelp?: (on: boolean) => void;
  /** Called when Panic is pressed (all notes off). */
  onPanic?: () => void;

  /** Off the Stage: the style and its tempo ("Sunday Drive Pop 104 BPM"). Omit on the Stage. */
  nowPlaying?: { style: string; tempo: number };
  /** The bar's width in px. Default: fills its container. */
  width?: number;
}

/** Which of AppBar's slots the caller filled: an empty `end` draws no group. */
export interface AppBarSlots {
  /** An `end` was given (a React node, a Svelte snippet). */
  end?: boolean;
}

/** A Text primitive as its element: Text's class and attributes, then the caller's. */
const text = (tag: string, props: TextModelProps, attrs: Record<string, string | undefined>, ...children: (Child | null)[]): Node => {
  const view = textView(props);
  return h(tag, { class: view.className, ...view.attrs, ...attrs }, ...children);
};

/** A Stack primitive as its element: the caller's attributes, then Stack's class and attributes. */
const stack = (tag: string, props: StackModelProps, attrs: Record<string, string | undefined>, ...children: (Child | null)[]): Node => {
  const view = stackView(props);
  return h(tag, { ...attrs, class: view.className, ...view.attrs }, ...children);
};

const separator = () => component('Separator');

/**
 * The bar AppBar draws from its props: a `header` (a label Text) holding one row of the name, the
 * page nav (two Tabs runs split by a Separator), the now-playing words off the Stage, the `end`
 * slot behind a hairline when filled, the global switches (Metronome, its ▾ and, while open, its
 * MetronomePopover; Unison; ?), the connections (Launchkey, HealthSlot) and Panic. Children are
 * drawn by name; the ▾'s box binds `focusReturn`, so focus goes back to the ▾ when the popover
 * closes with focus fallen to the page.
 *
 * `tipAction` reaches the children as a prop, not a handler key, so it keeps its identity across
 * renders and their tips are not reapplied each time. A tab's label (`L`) may be a React node or a
 * Svelte snippet: the tabs go to `Tabs` as they are.
 */
export function appBarView<L>(props: AppBarModelProps<L>, slots: AppBarSlots = {}): Node {
  const {
    displayTabs,
    fullTabs,
    chosen = null,
    tipAction,
    launchkey = true,
    failedPart = null,
    synthOn = true,
    dropouts = 0,
    bufferFrames = null,
    cpu = null,
    metronome = false,
    metronomeOpen = false,
    metronomeId = 'metronome-settings',
    metronomeVolume = 100,
    metronomeBell = false,
    metronomeAudible = true,
    unison = false,
    help = false,
    nowPlaying,
    width,
  } = props;
  const launchkeyLabel = launchkey ? 'Launchkey connected' : 'Launchkey not connected';
  const row = { direction: 'row', align: 'center' } as const;
  return text(
    'header',
    { size: 'label', className: 'yh-appbar' },
    { 'data-part': 'root', style: styleText(width === undefined ? undefined : { width: `${width}px` }) },
    stack(
      'div',
      { ...row, className: 'yh-appbar__row' },
      { 'data-part': 'row' },
      text('span', { size: 'label', weight: 'strong', className: 'yh-appbar__name' }, { 'data-part': 'name' }, 'yahaha'),
      stack(
        'nav',
        { ...row, gap: 0, className: 'yh-appbar__nav' },
        { 'data-part': 'nav', 'aria-label': 'Pages' },
        component('Tabs', { name: 'Display pages', items: displayTabs, value: chosen, tipAction }, { on: { onChange: 'choose' } }),
        h('span', { class: 'yh-appbar__runs-gap', 'data-part': 'runs-gap' }, separator()),
        component('Tabs', { name: 'Full pages', items: fullTabs, value: chosen, tipAction }, { on: { onChange: 'choose' } }),
      ),
      h(
        'span',
        { class: 'yh-appbar__middle', 'data-part': 'middle' },
        nowPlaying
          ? h(
              'span',
              { class: 'yh-appbar__playing', 'data-part': 'playing', 'aria-label': `Style ${nowPlaying.style}, ${nowPlaying.tempo} BPM` },
              text('span', { size: 'label', weight: 'strong', tabular: true, className: 'yh-appbar__style' }, { 'data-part': 'style' }, nowPlaying.style),
              text('span', { role: 'numeral', size: 'label', className: 'yh-appbar__tempo' }, { 'data-part': 'tempo' }, String(nowPlaying.tempo)),
              h('span', { class: 'yh-appbar__unit', 'data-part': 'unit' }, 'BPM'),
            )
          : null,
      ),
      when(slots.end === true, () => stack('span', { ...row, className: 'yh-appbar__end' }, { 'data-part': 'end' }, separator(), slot('end'))),
      stack(
        'span',
        { ...row, className: 'yh-appbar__switches' },
        { 'data-part': 'switches', role: 'group', 'aria-label': 'Global switches' },
        stack(
          'span',
          { ...row, gap: 0, className: 'yh-appbar__metronome' },
          { 'data-part': 'metronome', role: 'group', 'aria-label': 'Metronome' },
          component(
            'LampButton',
            { label: 'Metronome', on: metronome, hue: metronome ? 'role-2' : 't', join: 'start', name: 'Metronome', tip: 'metronome.on', tipAction },
            { on: { onToggle: 'metronome' } },
          ),
          wire(
            h(
              'span',
              { class: 'yh-appbar__caret', 'data-part': 'caret' },
              component(
                'Button',
                {
                  symbol: 'caret',
                  size: 'caret',
                  join: 'end',
                  popup: 'dialog',
                  expanded: metronomeOpen,
                  controls: metronomeId,
                  name: 'Metronome settings: on/off, volume, bell on beat 1',
                  tip: 'metronome.settings',
                  tipAction,
                },
                { on: { onPress: 'settings' } },
              ),
            ),
            { bind: [['focusReturn', { open: metronomeOpen }]] },
          ),
          when(metronomeOpen, () =>
            h(
              'span',
              { class: 'yh-appbar__popover', 'data-part': 'popover' },
              component(
                'MetronomePopover',
                { id: metronomeId, on: metronome, volume: metronomeVolume, bell: metronomeBell, audible: metronomeAudible, tipAction },
                { on: { onOn: 'metronome', onVolume: 'volume', onBell: 'bell', onClose: 'close' } },
              ),
            ),
          ),
        ),
        component('LampButton', { label: 'Unison', on: unison, name: 'Unison', tip: 'transport.unison', tipAction }, { on: { onToggle: 'unison' } }),
        component(
          'Button',
          { label: '?', size: 'icon', on: help, pressed: help, name: 'Help mode: point at any control to learn what it does', tip: 'app.help', tipAction },
          { on: { onPress: 'help' } },
        ),
      ),
      stack(
        'span',
        { ...row, className: 'yh-appbar__status' },
        { 'data-part': 'status', role: 'group', 'aria-label': 'Connections' },
        separator(),
        stack(
          'span',
          { ...row, gap: 2, className: 'yh-appbar__launchkey' },
          { 'data-part': 'launchkey', role: 'status', title: launchkeyLabel, 'data-connected': launchkey ? 'true' : 'false', 'aria-label': launchkeyLabel },
          component('StatusDot', { hue: launchkey ? 'ok' : 'd', hollow: !launchkey }),
          text('span', { size: 'label', case: 'label', className: 'yh-appbar__launchkey-word' }, { 'data-part': 'launchkey-word' }, 'Launchkey'),
        ),
        h(
          'span',
          { class: 'yh-appbar__health', 'data-part': 'health' },
          component('HealthSlot', { failedPart, synthOn, dropouts, bufferFrames, cpu, tipAction }, { on: { onOpen: 'health' } }),
        ),
      ),
      stack(
        'span',
        { ...row, className: 'yh-appbar__panic' },
        { 'data-part': 'panic' },
        separator(),
        component('Button', { label: 'Panic', hue: 'rec', name: 'Panic: all notes off', tip: 'transport.panic', tipAction }, { on: { onPress: 'panic' } }),
      ),
    ),
  );
}

/** The callbacks `appBarView`'s tree names: the tabs' `choose`, the switches', the popover's, the
 *  health slot's and Panic's. `help` asks for the opposite of `help`. */
export function appBarHandlers<L>(props: AppBarModelProps<L>): Handlers {
  return {
    choose: (id: string) => props.onChoose?.(id),
    metronome: (next: boolean) => props.onMetronome?.(next),
    settings: () => props.onMetronomeSettings?.(),
    volume: (v: number) => props.onMetronomeVolume?.(v),
    bell: (next: boolean) => props.onMetronomeBell?.(next),
    close: () => props.onMetronomeClose?.(),
    unison: (next: boolean) => props.onUnison?.(next),
    help: () => props.onHelp?.(!(props.help ?? false)),
    health: (target: HealthTarget) => props.onHealth?.(target),
    panic: () => props.onPanic?.(),
  };
}
