import './Ring.css';

/**
 * **Job.** The focus ring every control uses: a `--focus-ring` outline (the accent, unless the
 * pack's materials set `focus.ink`) `--focus-ring-offset` outside the edge while focused from the
 * keyboard (`:focus-visible`), nothing else changes. Add the class to the
 * focusable element: `className={focusRing}`.
 */
export const focusRing = 'lib-focus-ring';

/**
 * **Job.** The press ring every pressable control uses: an inset `--accent` outline while
 * `aria-pressed="true"`, `data-pressed` or `:active`. It is an outline, so it composes with a
 * `Surface`'s shadow list. Where both apply, the focus ring wins.
 */
export const pressRing = 'lib-press-ring';
