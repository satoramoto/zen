import { Tree } from '../../../foundation/view/Tree';
import { useThemeScope } from '../../../theme';
import { displayHandlers, displayView, type DisplayModelProps } from './Display.model';
import '../../../primitives/Text/Text.css';
import './Display.css';

// The props and the tree are framework-free, in the model; this file and `Display.svelte` only
// hand its tree to their `Tree`, with the scope's facets (the display's dark ground is the pack's
// own dark values).
export type { DisplayModelProps } from './Display.model';
export type DisplayProps = DisplayModelProps;

/**
 * The Push 3's display: a 960 by 160 screen in eight columns, drawn from a `Screen` description.
 *
 * **Job.** Show what the device shows. It is given plain data (`project` returns it) and draws
 * it: a top row over the upper display buttons, a body, a bottom row over the lower ones, and
 * overlays. It does not know which screen it is drawing, and works with no surface around it.
 *
 * **Scale.** Everything inside is sized in the display's own pixels (`--push-px`, a 960th of its
 * width), so it scales as a whole and nothing reflows. Type is the pack's faces at three sizes
 * fixed in those pixels (label, value, large).
 *
 * **Parts.** `[data-row='top'|'bottom']` hold eight `.push-display__tab` cells (`data-col`,
 * `data-selected`, `data-dim`); `.push-display__body` holds `.push-display__cell`s (`data-type`,
 * `data-col`, `data-span`, `data-touched`, `data-disabled`); `[data-overlay]` are notices,
 * dialogs, text entry, the battery mark, the count-in bar and a progress bar. The contents are
 * existing components: `KnobReadout`, `Toggle`, `Slider`, `FolderList`, `Trace`, `Text`.
 *
 * **Ground.** `dark` (the default) keeps a dark screen whatever the pack's mode.
 *
 * **Tuning knobs.** `--push-type-label`, `--push-type-value`, `--push-type-large`.
 */
export function Display(props: DisplayProps) {
  const scope = useThemeScope();
  return <Tree tree={displayView(props, scope?.facets)} handlers={displayHandlers(props)} />;
}

export default Display;
