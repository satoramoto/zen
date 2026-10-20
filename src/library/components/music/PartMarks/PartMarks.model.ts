// PartMarks' model: its props and the tree both renderers draw from them (the root Text, binding
// the app's tooltip through the `tip` store, and one node per visible mark: the edited ring, the
// warning and danger icons, the words). No framework: `PartMarks.tsx` (React) and `PartMarks.svelte`
// (Svelte) both pass `partMarksView` and `partMarksHandlers` to their `Tree`. The facts and their
// precedence are `marks.ts`.
import type { TipAction } from '../../../view/tip';
import { textView, type TextModelProps } from '../../../primitives/Text.model';
import { each, h, wire, type Handlers, type Node } from '../../../view/Tree.model';
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

/** A Text's attributes (its class and `data-*`). */
function text(props: TextModelProps): Record<string, string | undefined> {
  const view = textView(props);
  return { class: view.className, ...view.attrs };
}

/** One mark: the edited ring, an icon (an `svg` of its paths and dot), or a word (a Text). */
function markView(mark: Mark): Node {
  const attrs = { 'data-mark': mark, 'data-tone': TONE[mark] };
  if (mark === 'edited') return h('span', { class: 'yh-partmarks__dot', 'data-part': 'dot', ...attrs });
  const icon = ICONS[mark];
  if (icon)
    return h(
      'svg',
      { class: 'yh-partmarks__icon', 'data-part': 'icon', ...attrs, viewBox: '0 0 12 12' },
      each(icon.paths, (d) => d, (d) => h('path', { d })),
      icon.dot ? h('circle', icon.dot) : null,
    );
  return h('span', { ...text({ size: 'inherit', leading: 'tight', case: 'label', className: 'yh-partmarks__word' }), 'data-part': 'word', ...attrs }, mark);
}

/** The tree PartMarks draws (the root caption Text, strong and tight, binding `tip`, and its
 *  marks), or null when no mark shows. */
export function partMarksView({
  edited = false,
  missing = false,
  failed = false,
  off = false,
  bass = false,
  size = 'cell',
  tip,
}: PartMarksModelProps): Node | null {
  const shown = visibleMarks({ edited, missing, failed, off, bass });
  if (shown.length === 0) return null;
  return wire(
    h(
      'span',
      {
        ...text({ size: 'caption', weight: 'strong', leading: 'tight', className: 'yh-partmarks' }),
        'data-part': 'root',
        'data-size': size,
        'data-tip': tip,
        'aria-hidden': 'true',
      },
      each(shown, (mark) => mark, markView),
    ),
    { bind: [['tip', { tip, tipAction: 'tipAction' }]] },
  );
}

/** The callbacks `partMarksView`'s tree names: the app's tooltip action. */
export function partMarksHandlers(props: PartMarksModelProps): Handlers {
  return { tipAction: props.tipAction };
}
