// StatusDot's stories as plain props: StatusDot.stories.tsx draws them with either renderer, and
// the tree snapshot records every instance. `statusDotFaces` is the Faces story's layout as a tree.
import { defineFixtures } from '../../../fixtures';
import { each, h, type Node } from '../../../view/Tree.model';
import { statusDotView, type StatusDotHue, type StatusDotModelProps } from './StatusDot.model';

export const HUES: StatusDotHue[] = ['ok', 'd', 't', 'intro', 'main', 'ending', 'brk', 'fill'];

/** The controls, the same in both Storybooks. */
export const statusDotArgTypes = {
  hue: { control: 'select', options: HUES },
  hollow: { control: 'boolean' },
  glow: { control: 'boolean' },
  size: { control: 'select', options: ['md', 'sm'] },
  visible: { control: 'boolean' },
  name: { control: 'text' },
} as const;

/** The word the Faces story writes beside a dot. */
export const faceWord = ({ hue = 'ok', hollow }: StatusDotModelProps): string => (hollow ? `${hue} armed` : hue);

export const statusDotStories = defineFixtures<StatusDotModelProps>()({
  Board: { args: { hue: 'ok' } },
  Section: { args: { hue: 'main' } },
  Intro: { args: { hue: 'intro' } },
  Stopped: { args: { hue: 'main', visible: false } },
  Disconnected: { args: { hue: 'd', hollow: true } },
  SyncStart: { args: { hue: 'ok', hollow: true } },
  Small: { args: { size: 'sm', hue: 't', glow: false } },
  Named: { args: { hue: 'ok', name: 'Running' } },
  NamedHollow: { args: { hue: 'ok', hollow: true, name: 'Sync start armed' } },
  NamedHidden: { args: { hue: 'ok', name: 'Running', visible: false } },
  // Every hue, solid then hollow, each beside its word (`faceWord`), two to a row.
  Faces: { items: HUES.flatMap((hue) => [{ hue }, { hue, hollow: true }]) },
});

/** The Faces story's grid: every Faces dot beside its word, two to a row. */
export function statusDotFaces(): Node {
  const dots = (statusDotStories.Faces.items ?? []) as StatusDotModelProps[];
  return h(
    'div',
    {
      style:
        'display: grid; grid-template-columns: repeat(2, auto); gap: var(--space-2) var(--space-5); font-family: var(--font-sans); font-size: var(--size-label); color: var(--text-2)',
    },
    each(dots, faceWord, (dot) => h('span', { style: 'display: inline-flex; align-items: center; gap: var(--space-2)' }, statusDotView(dot), faceWord(dot))),
  );
}
