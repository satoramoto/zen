// HealthSlot's model: its props and what it draws from them (the root's classes and data, the live
// words, the button or the calm text, the mark's state, the text split into words and numerals). No
// framework: `HealthSlot.tsx` (React) and `HealthSlot.svelte` (Svelte) both render `healthSlotView`.
import type { TipAction } from '../../components/music/Pad/Pad.model';
import { health, type HealthTarget } from './health';

export type { HealthTarget } from './health';
export type { TipAction };

/** Every HealthSlot prop (it has no children). */
export interface HealthSlotModelProps {
  /** The first keyboard part (0–3: R1 R2 R3 L) whose plugin failed and isn't missing (`firstFailedPart`). */
  failedPart?: 0 | 1 | 2 | 3 | null;
  /** False when there is no audio (`io.synth` is null). */
  synthOn?: boolean;
  /** Audio dropouts in the last 30 s, counted by the wiring. */
  dropouts?: number;
  /** The buffer in use, in frames (64 … 1024); null when unknown. */
  bufferFrames?: number | null;
  /** The CPU load, 1.0 = the whole buffer; null before the first meters frame. */
  cpu?: number | null;
  /** A fixed width in px. Default: fills its container's width. */
  width?: number;
  /** The tooltip key, as `data-tip` on the button (or the calm text); null turns it off. */
  tip?: string | null;
  /** The app's tooltip action, applied with `tip` to whichever element carries `data-tip`. */
  tipAction?: TipAction;
  /** Called with where to fix the trouble on a click, Enter or Space. */
  onOpen?: (target: HealthTarget) => void;
}

export type HealthState = 'calm' | 'off' | 'trouble';

/** One run of the shown text: words in the label face, or a count in the readout face. */
export interface HealthWord {
  text: string;
  numeral: boolean;
}

/** What a renderer draws. */
export interface HealthSlotView {
  /** The root's class, data and inline width (`style` for React, `styleText` for Svelte). */
  className: string;
  attrs: Record<string, string | undefined>;
  style: Record<string, string> | undefined;
  styleText: string | undefined;
  /** The hidden polite live region's words. */
  label: string;
  /** The visible text, and the same split into words and numerals (for the button). */
  text: string;
  words: HealthWord[];
  state: HealthState;
  /** Where a press goes; null when calm (no button). */
  target: HealthTarget | null;
  /** `data-tip` on whichever element shows. */
  tip: string | undefined;
}

/**
 * Splits "CPU 74%" into words and numerals, so the counts can wear the readout face. A digit inside
 * a name ("R3 failed") is part of the name and stays in its face. Empty runs are left out.
 */
export function healthWords(text: string): HealthWord[] {
  return text
    .split(/(?<![\p{L}\d])(\d+%?)/u)
    .map((part, i) => ({ text: part, numeral: i % 2 === 1 }))
    .filter((word) => word.text !== '');
}

/** The slot HealthSlot draws from its props. */
export function healthSlotView({
  failedPart = null,
  synthOn = true,
  dropouts = 0,
  bufferFrames = null,
  cpu = null,
  width,
  tip = 'app.health',
}: HealthSlotModelProps): HealthSlotView {
  const shown = health({ failedPart, synthOn, dropouts, bufferFrames, cpu });
  const state: HealthState = shown.target === null ? 'calm' : shown.hue === 'ending' ? 'trouble' : 'off';
  return {
    className: `yh-health-slot${width === undefined ? ' yh-health-slot--fill' : ''}`,
    attrs: { 'data-part': 'root', 'data-hue': shown.hue, 'data-state': state },
    style: width === undefined ? undefined : { width: `${width}px` },
    styleText: width === undefined ? undefined : `width: ${width}px`,
    label: shown.label,
    text: shown.text,
    words: healthWords(shown.text),
    state,
    target: shown.target,
    tip: tip ?? undefined,
  };
}
