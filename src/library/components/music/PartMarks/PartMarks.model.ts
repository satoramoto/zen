// PartMarks' model: its props and what it draws from them (the root Text's attributes and one
// view per visible mark: the edited ring, the warning and danger icons, the words). No framework:
// `PartMarks.tsx` (React) and `PartMarks.svelte` (Svelte) both render `partMarksView`. The facts
// and their precedence are `marks.ts`.
import type { TipAction } from '../../core/Button/Button.model';
import type { ElementView } from '../../../primitives/Text.model';
import { visibleMarks, type Mark } from './marks';

export type { TipAction };

/** Every PartMarks prop (it takes no framework children). */
export interface PartMarksModelProps {
  /** The part's sound was changed since it was loaded: the dot. */
  edited?: boolean;
  /** The part's plugin isn't installed: the warning triangle. Wins over `failed`. */
  missing?: boolean;
  /** The part's plugin failed to load or crashed: the danger cross, drawn only when `missing` is false. */
  failed?: boolean;
  /** The part is off and silent: the word "off". Not drawn when `bass` is true. */
  off?: boolean;
  /** The part plays the bass line (in Yahaha, the Style's bass under Manual Bass): the word "bass". */
  bass?: boolean;
  /** The gap between marks: `cell` (the sound cell) or `strip` (the tighter fader strip name). */
  size?: 'cell' | 'strip';
  /** The tooltip key, rendered as `data-tip` on the marks while any show. */
  tip?: string;
  /** The app's tooltip action, applied with `tip` when both are set and a mark shows. */
  tipAction?: TipAction;
}

/** Which contract role each mark draws in; kept as `data-tone` so tests and parents can read it. */
const TONE: Record<Mark, string> = {
  edited: 'text',
  missing: 'warning',
  failed: 'danger',
  off: 'faint',
  bass: 'muted',
};

/** The icons' strokes (a 12×12 box) and their filled dot, if any. */
const ICONS: Partial<Record<Mark, { paths: string[]; dot?: { cx: string; cy: string; r: string } }>> = {
  missing: { paths: ['M6 1.25 11 10.25H1Z', 'M6 4.75v2.5'], dot: { cx: '6', cy: '8.6', r: '0.5' } },
  failed: { paths: ['M2.75 2.75 9.25 9.25M9.25 2.75 2.75 9.25'] },
};

/** One drawn mark: the edited ring, an icon (an `svg` of `paths` and `dot`), or a word (a Text). */
export type MarkView =
  | { kind: 'dot'; mark: Mark; className: string; attrs: Record<string, string | undefined> }
  | {
      kind: 'icon';
      mark: Mark;
      className: string;
      attrs: Record<string, string | undefined>;
      paths: string[];
      dot: { cx: string; cy: string; r: string } | null;
    }
  | { kind: 'word'; mark: Mark; className: string; attrs: Record<string, string | undefined>; word: string };

/** What a renderer draws: the root (a caption Text, strong, tight) and its marks; null when none show. */
export interface PartMarksView {
  root: ElementView;
  marks: MarkView[];
}

/** The marks PartMarks draws from its props, or null for nothing. */
export function partMarksView({
  edited = false,
  missing = false,
  failed = false,
  off = false,
  bass = false,
  size = 'cell',
  tip,
}: PartMarksModelProps): PartMarksView | null {
  const shown = visibleMarks({ edited, missing, failed, off, bass });
  if (shown.length === 0) return null;
  return {
    root: { className: 'yh-partmarks', attrs: { 'data-part': 'root', 'data-size': size, 'data-tip': tip, 'aria-hidden': 'true' } },
    marks: shown.map((mark): MarkView => {
      if (mark === 'edited') return { kind: 'dot', mark, className: 'yh-partmarks__dot', attrs: { 'data-part': 'dot', 'data-mark': mark, 'data-tone': TONE[mark] } };
      const icon = ICONS[mark];
      if (icon)
        return {
          kind: 'icon',
          mark,
          className: 'yh-partmarks__icon',
          attrs: { 'data-part': 'icon', 'data-mark': mark, 'data-tone': TONE[mark], viewBox: '0 0 12 12' },
          paths: icon.paths,
          dot: icon.dot ?? null,
        };
      return { kind: 'word', mark, className: 'yh-partmarks__word', attrs: { 'data-part': 'word', 'data-mark': mark, 'data-tone': TONE[mark] }, word: mark };
    }),
  };
}
