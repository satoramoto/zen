// AppBar's model: its props and what it draws from them (the bar's width, the now-playing words, the
// metronome's hue, the Launchkey status, the props each child gets). No framework: `AppBar.tsx`
// (React) and `AppBar.svelte` (Svelte) both render `appBarView`; the popover's open/close handling
// is the `popover.ts` store.
import type { LampHue } from '../../components/core/LampButton/LampButton.model';
import type { StatusDotHue } from '../../components/core/StatusDot/StatusDot.model';
import type { TabItemModel, TipAction } from '../../layout/Tabs.model';
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

/** What a renderer draws (the props with their defaults, and what is derived from them). */
export interface AppBarView {
  /** The header's inline width (`style` for React, `styleText` for Svelte). */
  style: Record<string, string> | undefined;
  styleText: string | undefined;
  chosen: string | null;
  /** Off the Stage: the style, its tempo and their spoken words. */
  nowPlaying: { style: string; tempo: number; label: string } | null;
  metronome: { on: boolean; hue: LampHue; open: boolean; id: string; volume: number; bell: boolean; audible: boolean };
  unison: boolean;
  help: boolean;
  /** The Launchkey status: its spoken name and title, `data-connected`, and its dot. */
  launchkey: { label: string; connected: string; dot: { hue: StatusDotHue; hollow: boolean } };
  /** HealthSlot's props. */
  health: { failedPart: 0 | 1 | 2 | 3 | null; synthOn: boolean; dropouts: number; bufferFrames: number | null; cpu: number | null };
}

/** The bar AppBar draws from its props. */
export function appBarView<L>({
  chosen = null,
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
}: AppBarModelProps<L>): AppBarView {
  const launchkeyLabel = launchkey ? 'Launchkey connected' : 'Launchkey not connected';
  return {
    style: width === undefined ? undefined : { width: `${width}px` },
    styleText: width === undefined ? undefined : `width: ${width}px`,
    chosen,
    nowPlaying: nowPlaying ? { ...nowPlaying, label: `Style ${nowPlaying.style}, ${nowPlaying.tempo} BPM` } : null,
    metronome: {
      on: metronome,
      hue: metronome ? 'role-2' : 't',
      open: metronomeOpen,
      id: metronomeId,
      volume: metronomeVolume,
      bell: metronomeBell,
      audible: metronomeAudible,
    },
    unison,
    help,
    launchkey: {
      label: launchkeyLabel,
      connected: launchkey ? 'true' : 'false',
      dot: { hue: launchkey ? 'ok' : 'd', hollow: !launchkey },
    },
    health: { failedPart, synthOn, dropouts, bufferFrames, cpu },
  };
}
