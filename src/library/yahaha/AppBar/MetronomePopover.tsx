import { useRef, type KeyboardEvent } from 'react';
import { LampButton } from '../../components/core/LampButton/LampButton';
import { LineSlider } from '../../components/core/LineSlider/LineSlider';
import { SettingsRow } from '../../components/core/SettingsRow/SettingsRow';
import { Text } from '../../primitives/Text';
import { isOwnKey, METRONOME_LABEL_WIDTH, metronomePopoverView, type MetronomePopoverModelProps } from './MetronomePopover.model';
import { useDismiss } from './usePopover';
import './MetronomePopover.css';

// The props and the popover are framework-free, in the model; `MetronomePopover.svelte` renders the same view.
export type { MetronomePopoverModelProps } from './MetronomePopover.model';
export type MetronomePopoverProps = MetronomePopoverModelProps;

/**
 * MetronomePopover: the metronome's settings, opened from the app bar's Metronome ▾.
 *
 * **Job.** Set the click once, before or between songs: on or off, how loud, and whether the
 * first beat rings a bell. A player wants the three answers at a glance and nothing else.
 *
 * **Changed.** *Hierarchy:* the box is a raised plate (the materials' `plate`, under a
 * `--border-strong` hairline) instead of a ground-coloured box with an inset line, so it reads
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
export function MetronomePopover(props: MetronomePopoverProps) {
  const { tipAction, onOn, onVolume, onBell, onClose } = props;
  const view = metronomePopoverView(props);
  const box = useRef<HTMLDivElement>(null);

  // Esc and a press outside close it. A press on the opener is left to the opener (it toggles).
  useDismiss(box, view.id, onClose);

  const ownKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isOwnKey(event.key)) event.stopPropagation();
  };

  return (
    <Text as="div" ref={box} className={view.className} {...view.attrs} ariaRole="dialog" tabIndex={-1} onKeyDown={ownKeys}>
      <Text role="label" tone="primary" className="yh-metronome-popover__title" data-part="title">
        Metronome
      </Text>
      <SettingsRow id={view.rowIds.on} label="On/off" labelWidth={METRONOME_LABEL_WIDTH}>
        <LampButton
          label={view.onLabel}
          on={view.on}
          size="sm"
          name="Metronome on/off"
          tip="metronome.on"
          tipAction={tipAction}
          onToggle={(next) => onOn?.(next)}
        />
      </SettingsRow>
      <SettingsRow id={view.rowIds.volume} label="Volume" labelWidth={METRONOME_LABEL_WIDTH}>
        <LineSlider
          value={view.volume}
          min={0}
          max={127}
          name="Metronome volume"
          width={120}
          tip="metronome.volume"
          tipAction={tipAction}
          onchange={(v) => onVolume?.(v)}
        />
      </SettingsRow>
      <SettingsRow id={view.rowIds.bell} label="Bell on beat 1" labelWidth={METRONOME_LABEL_WIDTH}>
        <LampButton
          label={view.bellLabel}
          on={view.bell}
          size="sm"
          name="Bell on beat 1"
          tip="metronome.bell"
          tipAction={tipAction}
          onToggle={(next) => onBell?.(next)}
        />
      </SettingsRow>
      {view.note && (
        <Text as="p" size="caption" className="yh-metronome-popover__note" data-part="note">
          The built-in synth isn't running: the click can't sound.
        </Text>
      )}
    </Text>
  );
}

export default MetronomePopover;
