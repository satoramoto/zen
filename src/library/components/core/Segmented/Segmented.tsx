import { Tree } from '../../../view/Tree';
import { itemsOf, segmentedHandlers, segmentedView, type SegmentedModelProps } from './Segmented.model';
import '../../../primitives/Text.css';
import './Segmented.css';

// The props and the tree are framework-free, in the model; the behaviour is the `segmented` store
// (`segmentedInput.ts`). `Segmented.svelte` draws the same tree.
export { itemsOf };
export { bindSegmented, type SegmentedParams } from './segmentedInput';

export interface SegmentedProps extends SegmentedModelProps {
  onChange(next: number): void;
}

/**
 * An enum with every member on screen at once.
 *
 * **Job.** Choose one of a few where the alternatives are worth seeing (a filter type, a unit, a
 * direction). Drawn with the theme's tabs materials, so it is the same object as layout `Tabs`: a
 * track with the members printed in it and the chosen one standing out of it.
 *
 * **Behaviour.** A `radiogroup` of `radio` buttons (behaviour in the `segmented` store,
 * `segmentedInput.ts`). Click picks; ←
 * → (and ↑ ↓) move the choice by one, clamped, and focus follows it; only the chosen member takes
 * Tab. Disabled: the group is `aria-disabled` and every member disabled. `itemLabels` names a
 * glyph-only member for a screen reader while the glyph stays on screen.
 *
 * **Parts.** `root` (`data-orientation`, `data-disabled`), `caption` (the `name`), `track` (the
 * radiogroup, `--mat-tabs-track-*`), `segment` (each radio: `--mat-tabs-tab-*` at rest,
 * `--mat-tabs-chosen-*` when checked).
 */
export function Segmented(props: SegmentedProps) {
  return <Tree tree={segmentedView(props)} handlers={segmentedHandlers(props)} />;
}

export default Segmented;
