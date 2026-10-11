import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { ChosenTabs, type TabItem } from '../ChosenTabs/ChosenTabs';
import { HealthSlot, type HealthTarget } from '../HealthSlot/HealthSlot';
import { LampButton, type TipAction } from '../LampButton/LampButton';
import { Separator } from '../Separator/Separator';
import { StatusDot } from '../StatusDot/StatusDot';
import { MetronomePopover } from './MetronomePopover';
import './AppBar.css';

export type { HealthTarget } from '../HealthSlot/HealthSlot';
export type { TabItem } from '../ChosenTabs/ChosenTabs';

export interface AppBarProps {
  /** The display pages, left of the hairline (Stage … Harm/Arp). */
  displayTabs: TabItem[];
  /** The full pages, right of the hairline (Library, Settings). */
  fullTabs: TabItem[];
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
  /** Extra controls after the page nav, before the switches, behind a hairline of their own. */
  end?: ReactNode;
}

/**
 * AppBar: the bar on top of every page.
 *
 * **Job.** Say which page this is and go to another in one click; hold the few switches that act
 * on the whole instrument (Metronome and its settings, Unison, Help, Panic); and say, without
 * being asked, whether the Launchkey and the audio are fine. Mid-song a player only glances at it
 * for Panic or a failed sound; everything else must stay quiet.
 *
 * **Changed.** *One place per job:* the original split the bar's job across two rows, the page
 * nav up here and Metronome, Unison, Help and Panic at the end of the transport row; the global
 * switches now live here, so the transport row holds only transport. *Order and alignment:* the
 * page nav starts right after the name and keeps its x on every page; the style and tempo shown
 * off the Stage sit in the flexible middle and give way (ellipsis) before anything else does, so
 * the tabs never jump. The bar reads left to right as where you are → what you can switch → how
 * things are → the emergency stop. *Colour has one meaning* (`hues.ts`): the switches are neutral
 * lamps (the metronome and Unison belong to no part), the chosen page is the bar's one
 * `--selected` block, Launchkey uses `--success` only when connected, and only Panic and trouble
 * in the health slot wear `--danger`. *Affordance without noise:* Panic takes the far right
 * corner, the one place a hand finds without looking, set apart by a hairline; at rest it is an
 * outlined key with the danger outline and its label in primary text, and only a hover or press
 * fills it, so it is found at once and never shouts while nothing is wrong
 * (`references/color.md`, "State changes: structure, not circus"). The health slot has a fixed
 * width, so trouble appearing never moves Panic. The heavy 2px header rule is now the chrome's own
 * hairline, which the chosen tab stands on (`references/craft-details.md`, borders). *Rhythm:*
 * heights follow `--control-h` and gaps `--space-*`, so every density pack scales the bar as one.
 * The bar is a size container: as it narrows towards 1217 px the name steps aside, the gaps and
 * tab padding tighten and the Launchkey word gives way to its dot (its spoken name and title
 * stay); no control or label is ever dropped.
 *
 * **Kept.** Controlled throughout: `chosen` names the page and a click only calls `onChoose`;
 * every switch only asks for its next state. The two tab runs split by a hairline, page tabs as
 * buttons with `aria-current` inside a "Pages" nav, the Launchkey status with its spoken name,
 * the health slot and where it sends you, the metronome's ▾ with `aria-haspopup`,
 * `aria-expanded` and `aria-controls`, the popover's Esc and press-outside, every tooltip key,
 * `nowPlaying` off the Stage, the fixed `width` and the `end` slot.
 */
export function AppBar({
  displayTabs,
  fullTabs,
  chosen = null,
  onChoose,
  tipAction,
  launchkey = true,
  failedPart = null,
  synthOn = true,
  dropouts = 0,
  bufferFrames = null,
  cpu = null,
  onHealth,
  metronome = false,
  onMetronome,
  metronomeOpen = false,
  onMetronomeSettings,
  onMetronomeClose,
  metronomeId = 'metronome-settings',
  metronomeVolume = 100,
  onMetronomeVolume,
  metronomeBell = false,
  onMetronomeBell,
  metronomeAudible = true,
  unison = false,
  onUnison,
  help = false,
  onHelp,
  onPanic,
  nowPlaying,
  width,
  end,
}: AppBarProps) {
  const caretBox = useRef<HTMLSpanElement>(null);

  // When the popover closes with focus inside it, focus would fall to the page: give it back to ▾.
  const wasOpen = useRef(metronomeOpen);
  useEffect(() => {
    if (wasOpen.current && !metronomeOpen) {
      const active = document.activeElement;
      if (active === null || active === document.body) caretBox.current?.querySelector('button')?.focus();
    }
    wasOpen.current = metronomeOpen;
  }, [metronomeOpen]);

  const style: CSSProperties | undefined = width === undefined ? undefined : { width: `${width}px` };

  return (
    <header className="yh-appbar" style={style}>
      <div className="yh-appbar__row">
        <span className="yh-appbar__name">yahaha</span>

        <nav className="yh-appbar__nav" aria-label="Pages">
          <ChosenTabs tabs={displayTabs} chosen={chosen} size="page" onChoose={onChoose} tipAction={tipAction} />
          <span className="yh-appbar__runs-gap">
            <Separator />
          </span>
          <ChosenTabs tabs={fullTabs} chosen={chosen} size="page" onChoose={onChoose} tipAction={tipAction} />
        </nav>

        <span className="yh-appbar__middle">
          {nowPlaying && (
            <span className="yh-appbar__playing" aria-label={`Style ${nowPlaying.style}, ${nowPlaying.tempo} BPM`}>
              <span className="yh-appbar__style">{nowPlaying.style}</span>
              <span className="yh-appbar__tempo">{nowPlaying.tempo}</span>
              <span className="yh-appbar__unit">BPM</span>
            </span>
          )}
        </span>

        {end !== undefined && (
          <span className="yh-appbar__end">
            <Separator />
            {end}
          </span>
        )}

        <span className="yh-appbar__switches" role="group" aria-label="Global switches">
          <span className="yh-appbar__metronome" role="group" aria-label="Metronome">
            <LampButton
              label="Metronome"
              on={metronome}
              join="start"
              name="Metronome"
              tip="metronome.on"
              tipAction={tipAction}
              onToggle={(next) => onMetronome?.(next)}
            />
            <span ref={caretBox} className="yh-appbar__caret">
              <Button
                symbol="caret"
                size="caret"
                join="end"
                popup="dialog"
                expanded={metronomeOpen}
                controls={metronomeId}
                name="Metronome settings: on/off, volume, bell on beat 1"
                tip="metronome.settings"
                tipAction={tipAction}
                onPress={() => onMetronomeSettings?.()}
              />
            </span>
            {metronomeOpen && (
              <span className="yh-appbar__popover">
                <MetronomePopover
                  id={metronomeId}
                  on={metronome}
                  volume={metronomeVolume}
                  bell={metronomeBell}
                  audible={metronomeAudible}
                  tipAction={tipAction}
                  onOn={(next) => onMetronome?.(next)}
                  onVolume={(v) => onMetronomeVolume?.(v)}
                  onBell={(next) => onMetronomeBell?.(next)}
                  onClose={() => onMetronomeClose?.()}
                />
              </span>
            )}
          </span>
          <LampButton
            label="Unison"
            on={unison}
            name="Unison"
            tip="transport.unison"
            tipAction={tipAction}
            onToggle={(next) => onUnison?.(next)}
          />
          <Button
            label="?"
            size="icon"
            on={help}
            pressed={help}
            name="Help mode: point at any control to learn what it does"
            tip="app.help"
            tipAction={tipAction}
            onPress={() => onHelp?.(!help)}
          />
        </span>

        <span className="yh-appbar__status" role="group" aria-label="Connections">
          <Separator />
          <span
            className="yh-appbar__launchkey"
            role="status"
            title={launchkey ? 'Launchkey connected' : 'Launchkey not connected'}
            data-connected={launchkey ? 'true' : 'false'}
            aria-label={launchkey ? 'Launchkey connected' : 'Launchkey not connected'}
          >
            <StatusDot hue={launchkey ? 'ok' : 'd'} hollow={!launchkey} />
            <span className="yh-appbar__launchkey-word">Launchkey</span>
          </span>
          <span className="yh-appbar__health">
            <HealthSlot
              failedPart={failedPart}
              synthOn={synthOn}
              dropouts={dropouts}
              bufferFrames={bufferFrames}
              cpu={cpu}
              tipAction={tipAction}
              onOpen={onHealth}
            />
          </span>
        </span>

        <span className="yh-appbar__panic">
          <Separator />
          <Button
            label="Panic"
            hue="rec"
            name="Panic: all notes off"
            tip="transport.panic"
            tipAction={tipAction}
            onPress={() => onPanic?.()}
          />
        </span>
      </div>
    </header>
  );
}

export default AppBar;
