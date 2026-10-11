import { useEffect, useRef, type KeyboardEvent } from 'react';
import { LampButton, type TipAction } from '../LampButton/LampButton';
import { LineSlider } from '../LineSlider/LineSlider';
import { SettingsRow } from '../SettingsRow/SettingsRow';
import './MetronomePopover.css';

export interface MetronomePopoverProps {
  /** The popover's id: the opener's `aria-controls` names it. */
  id?: string;
  /** The metronome on. */
  on?: boolean;
  /** The click's volume, 0–127. */
  volume?: number;
  /** A bell on the first beat of each bar. */
  bell?: boolean;
  /** The click can sound (the built-in synth is running); false shows a caption saying it can't. */
  audible?: boolean;
  /** The app's tooltip action, applied to every control with its key. */
  tipAction?: TipAction;
  /** Called with the state asked for when the metronome's On/Off is pressed. */
  onOn?: (on: boolean) => void;
  /** Called with the volume asked for (0–127). */
  onVolume?: (volume: number) => void;
  /** Called with the state asked for when the bell's On/Off is pressed. */
  onBell?: (on: boolean) => void;
  /** Called on Esc or a press outside the popover (not on its opener, which toggles it itself). */
  onClose?: () => void;
}

/** Keys the popover's own controls handle (the slider's steps): they stop here, so the window's
 * shortcuts (style step, pad page) don't also act on them. */
const OWN_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']);

/**
 * MetronomePopover: the metronome's settings, opened from the app bar's Metronome ▾.
 *
 * **Job.** Set the click once, before or between songs: on or off, how loud, and whether the
 * first beat rings a bell. A player wants the three answers at a glance and nothing else.
 *
 * **Changed.** *Hierarchy:* the box is a raised card (`--surface-1`, a `--border-strong` hairline
 * and the pack's `--shadow-card`) instead of a ground-coloured box with an inset line, so it reads
 * as lifted above the Stage rather than printed on it (`references/craft-details.md`, layered
 * surfaces). The title is the one strong line; rows share one label column, so the three values
 * start on one vertical (alignment). *Colour meaning:* every control is neutral; the metronome
 * belongs to no part (`hues.ts`). *Contrast:* the "can't sound" caption is `--text-2`, not a faint
 * caption ink, because it explains why nothing happens (`references/color.md`, 4.5:1 for text).
 *
 * **Kept.** Controlled: every change is a callback and it holds no state. On/Off and Bell as
 * lamps, Volume as a 0–127 line slider, their names and tips; Esc (caught before the window's
 * shortcuts) and a press outside (except on the opener, `[aria-controls=<id>]`) call `onClose`;
 * the slider's arrow keys never reach the window. Where it sits is the parent's: it draws in place.
 */
export function MetronomePopover({
  id = 'metronome-settings',
  on = false,
  volume = 100,
  bell = false,
  audible = true,
  tipAction,
  onOn,
  onVolume,
  onBell,
  onClose,
}: MetronomePopoverProps) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  // Esc and a press outside close it. A press on the opener is left to the opener (it toggles).
  useEffect(() => {
    const keydown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // In the capture phase, so the window's own key handlers never see this Esc.
      event.stopPropagation();
      event.preventDefault();
      close.current?.();
    };
    const pointerdown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !box.current || box.current.contains(target)) return;
      if (target instanceof Element && target.closest(`[aria-controls="${id}"]`)) return;
      close.current?.();
    };
    window.addEventListener('keydown', keydown, true);
    window.addEventListener('pointerdown', pointerdown, true);
    return () => {
      window.removeEventListener('keydown', keydown, true);
      window.removeEventListener('pointerdown', pointerdown, true);
    };
  }, [id]);

  const ownKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (OWN_KEYS.has(event.key)) event.stopPropagation();
  };

  return (
    <div
      ref={box}
      className="yh-metronome-popover"
      id={id}
      role="dialog"
      tabIndex={-1}
      aria-label="Metronome settings"
      onKeyDown={ownKeys}
    >
      <span className="yh-metronome-popover__title">Metronome</span>
      <SettingsRow label="On/off" labelWidth={104}>
        <LampButton
          label={on ? 'On' : 'Off'}
          on={on}
          size="sm"
          name="Metronome on/off"
          tip="metronome.on"
          tipAction={tipAction}
          onToggle={(next) => onOn?.(next)}
        />
      </SettingsRow>
      <SettingsRow label="Volume" labelWidth={104}>
        <LineSlider
          value={volume}
          min={0}
          max={127}
          name="Metronome volume"
          width={120}
          tip="metronome.volume"
          tipAction={tipAction}
          onchange={(v) => onVolume?.(v)}
        />
      </SettingsRow>
      <SettingsRow label="Bell on beat 1" labelWidth={104}>
        <LampButton
          label={bell ? 'On' : 'Off'}
          on={bell}
          size="sm"
          name="Bell on beat 1"
          tip="metronome.bell"
          tipAction={tipAction}
          onToggle={(next) => onBell?.(next)}
        />
      </SettingsRow>
      {!audible && <p className="yh-metronome-popover__note">The built-in synth isn't running: the click can't sound.</p>}
    </div>
  );
}

export default MetronomePopover;
