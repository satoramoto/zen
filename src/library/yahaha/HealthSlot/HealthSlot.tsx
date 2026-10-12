import { useEffect, useState } from 'react';
import type { TipAction } from '../Pad/Pad';
import { StatusDot } from '../StatusDot/StatusDot';
import { health, type HealthTarget } from './health';
import './HealthSlot.css';

export type { HealthTarget } from './health';

export interface HealthSlotProps {
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

/**
 * Splits "CPU 74%" into words and numerals, so the counts can wear the readout face. A digit
 * inside a name ("R3 failed") is part of the name and stays in its face.
 */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(/(?<![\p{L}\d])(\d+%?)/u).map((part, i) =>
        i % 2 ? (
          <span key={i} className="yh-health-slot__num" data-part="num">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * The state's shape. Calm and off are the app bar's status lamp, the same `StatusDot` the
 * Launchkey wears (filled `ok` when fine, a hollow faint ring when there is no audio); trouble is
 * the danger chip's triangle, drawn as StatusLine's error mark.
 */
function Mark({ state }: { state: 'calm' | 'off' | 'trouble' }) {
  return (
    <span className="yh-health-slot__mark" data-part="mark" data-state={state} aria-hidden="true">
      {state === 'trouble' ? (
        <svg className="yh-health-slot__triangle" data-part="triangle" width="12" height="12" viewBox="0 0 12 12">
          <path d="M6 1.5 L11 10.5 H1 Z" />
          <path d="M6 5 V7.4" />
          <circle cx="6" cy="8.9" r="0.6" />
        </svg>
      ) : (
        <StatusDot hue={state === 'calm' ? 'ok' : 'd'} hollow={state === 'off'} />
      )}
    </span>
  );
}

/**
 * HealthSlot: the app bar's audio health.
 *
 * **Job.** Say "Audio" quietly while the sound is fine, and name the one trouble that matters
 * (a failed plugin, no audio, dropouts, a busy CPU) as a button that opens where to fix it. A
 * player glances at it between songs: calm must fade into the bar, trouble must be found at once.
 *
 * **Changed.** *Colour meaning, never colour alone:* every state now has a shape as well as a
 * colour (color.md, "Semantic Colors": semantics work through pairs). Calm and off wear the same
 * `StatusDot` as the Launchkey beside it, filled `ok` when fine and a hollow faint ring when the
 * audio is off, so the bar's two connections say "fine" with one mark, not a round dot and a
 * square one; trouble is the danger chip with its triangle. The chip is the same recipe as
 * StatusLine's error (12% `--danger` tint inside a 35% edge, the triangle, strong `--text-1`, one
 * space step shorter than a control), so the Stage has one look for "something is wrong", and its
 * words stay in primary text so they keep full contrast under every pack (color.md, "Contrast and
 * Readability"). *Hierarchy:* every state is at label size and in sentence case: calm "Audio" is
 * quiet by colour (faint text), not by a smaller size and a different case, so the slot has one
 * type treatment; trouble is the loudest thing in it, in the strong weight. *Numerals:* the counts
 * and the CPU percentage are drawn in the readout face with tabular figures, so "CPU 74%" doesn't
 * jitter as it changes (typography.md, "Tabular Numbers"); a digit in a part's name ("R3 failed")
 * stays in the name's face, so the name isn't set in two. *Affordance:* a trouble row is a framed, tinted
 * button and every clickable row takes a hover tint and a pointer, so it reads as something to
 * press; the original was bare text with no hover. Focus is a `:focus-visible` ring in the accent
 * (craft-details.md, "Focus States"). `tipAction` runs the app's tooltip action, in Pad's handle
 * shape, on whichever element carries `tip`, moving to the new one when calm turns to trouble.
 *
 * **Kept.** The one pure `health()` choice and its order (a silent failed plugin first), the exact
 * texts, "Audio off" staying neutral yet clickable, the hidden polite live region that says
 * "Audio health: …", buttons named by their visible text only, the calm text hidden from screen
 * readers, `tip` as `data-tip` on whichever element shows (null turns it off), the ellipsis when the
 * slot is narrow, and no motion beyond a hover fade (off under reduced motion).
 */
export function HealthSlot({
  failedPart = null,
  synthOn = true,
  dropouts = 0,
  bufferFrames = null,
  cpu = null,
  width,
  tip = 'app.health',
  tipAction,
  onOpen,
}: HealthSlotProps) {
  const shown = health({ failedPart, synthOn, dropouts, bufferFrames, cpu });
  const state = shown.target === null ? 'calm' : shown.hue === 'ending' ? 'trouble' : 'off';
  const dataTip = tip ?? undefined;
  const target = shown.target;
  // The element carrying `data-tip`: the button in trouble, the calm text otherwise.
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!node || !tipAction || dataTip === undefined) return;
    const handle = tipAction(node, dataTip);
    return () => handle?.destroy?.();
  }, [node, dataTip, tipAction]);

  return (
    <span
      className={`yh-health-slot${width === undefined ? ' yh-health-slot--fill' : ''}`}
      data-part="root"
      data-hue={shown.hue}
      data-state={state}
      style={width === undefined ? undefined : { width: `${width}px` }}
    >
      <span role="status" className="yh-health-slot__live" data-part="live">
        {shown.label}
      </span>
      {target ? (
        <button
          ref={setNode}
          type="button"
          className="yh-health-slot__button"
          data-part="button"
          data-tip={dataTip}
          onClick={() => onOpen?.(target)}
        >
          <Mark state={state} />
          <span className="yh-health-slot__text" data-part="text">
            <Words text={shown.text} />
          </span>
        </button>
      ) : (
        <span className="yh-health-slot__calm" data-part="calm">
          <Mark state={state} />
          <span ref={setNode} className="yh-health-slot__text" data-part="text" aria-hidden="true" data-tip={dataTip}>
            {shown.text}
          </span>
        </span>
      )}
    </span>
  );
}
