import { Children, isValidElement, useId, useState, useSyncExternalStore, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import type { TipAction } from '../components/core/Button/Button.model';
import type { Step } from '../primitives/step';
import { Tree } from '../view/Tree';
import { localState } from './local';
import { cssText, isSlotContent, regionHandlers, regionInitialView, regionView, regionViewSlot, type RegionViewItem } from './Region.model';
import '../primitives/Text.css';
import './Region.css';

// The tree, the choice of view and the tabs' ids are framework-free, in the model; this file and
// `Region.svelte` only hand its tree to their `Tree`, with the label, aside and bodies as slots.
export {
  regionView,
  regionHandlers,
  regionIds,
  regionInitialView,
  regionViewSlot,
  chosenView,
  type RegionModelProps,
  type RegionDrawProps,
  type RegionViewItem,
} from './Region.model';

export interface RegionViewProps {
  /** The view's id, as `view` / `onView` name it. */
  id: string;
  /** The tab's label: text (the tabs' items are data). */
  label: ReactNode;
  /** The tab's accessible name when the label isn't plain text. */
  name?: string;
  /** Shown but not choosable (a page the current state has none of). */
  disabled?: boolean;
  /** The tooltip key, rendered as `data-tip` on the tab. */
  tip?: string;
  children?: ReactNode;
}

/** One body of a Region. Only the chosen view renders. */
export function RegionView(_: RegionViewProps): ReactElement | null {
  return null; // Region reads its props and draws the chosen one's children.
}

export interface RegionProps {
  /** The region's accessible name ("Mixer", "Song form"). */
  name: string;
  /** A visible header label; omit for a region that needs none. */
  label?: ReactNode;
  /** Header content on the right: a second switch (use `Tabs`), a count. */
  aside?: ReactNode;
  /** The views as data (as Svelte's `views`), each drawing `children` as its body; or give
   *  `Region.View` children instead. */
  views?: RegionViewItem<ReactNode>[];
  /** The chosen view's id (controlled). Without it the region keeps its own choice. */
  view?: string;
  /** The first view shown when uncontrolled; default the first. */
  defaultView?: string;
  /** Called with the id a tab asks for. */
  onView?: (id: string) => void;
  /** The grid area this region fills in its screen. */
  area?: string;
  /** The app's tooltip action, passed to the views' tabs (each tab with a `tip` gets it). */
  tipAction?: TipAction;
  /** The space between the Groups in the body, as a scale step (1–6 are `--space-1` to `--space-6`). Default none. */
  gap?: Step;
  /**
   * How the region takes its height. `fill` (default): the box its screen gives it; its content
   * never holds the region open. `content`: exactly its header plus its body's content, so an
   * `auto` grid row sized by it never collapses when the screen has no spare height.
   */
  fit?: 'fill' | 'content';
  className?: string;
  style?: CSSProperties;
  /** Content, or `Region.View` children: then the header shows a tab per view and the body the chosen one. */
  children?: ReactNode;
}

/**
 * **Job.** One named block of a screen: the hero, the mixer, the pads. A screen is a few
 * high-level regions that stay put; what changes is the view inside them, chosen by the tabs in
 * the region's own header. So every page of an app keeps one frame, and switches look and behave
 * the same everywhere.
 *
 * **Look.** The region is drawn by the theme's `plate` material (fill, shadow, texture,
 * `--mat-plate-inset` inside, `--radius-card`). Its header is part of the plate: a strip along
 * the top edge, ruled off from the body, holding the views' `Tabs` (a well track with the chosen
 * view raised as a key), the label and the aside. Screens space regions by `--mat-plate-gap`.
 *
 * **Behaviour.** With `view` the choice is the caller's (a hardware button may change it too);
 * without, the region keeps it. The body is the tabs' `tabpanel`.
 *
 * **Spacing.** The body stacks its Groups in a column; `gap` sets the scale step between them
 * (unset: none, the Groups sit as they are).
 */
function RegionRoot({ name, label, aside, views: given, view, defaultView, onView, area, tipAction, gap, fit, className, style, children }: RegionProps) {
  const drawn = Children.toArray(children).filter((c): c is ReactElement<RegionViewProps> => isValidElement(c) && c.type === RegionView);
  const views = given ?? drawn.map(({ props: v }) => ({ id: v.id, label: v.label, name: v.name, disabled: v.disabled, tip: v.tip }));
  const bodies = Object.fromEntries(given ? given.map((v) => [regionViewSlot(v.id), children]) : drawn.map(({ props: v }) => [regionViewSlot(v.id), v.children]));
  const [own] = useState(() => localState(regionInitialView(views, defaultView)));
  const chosen = useSyncExternalStore(own.subscribe, own.get);
  const uid = useId();
  const tree = regionView(
    {
      name,
      area,
      gap,
      fit,
      className,
      style: cssText(style),
      views,
      view,
      tipAction,
      label: typeof label === 'string' ? label : undefined,
      aside: typeof aside === 'string' ? aside : undefined,
    },
    { label: isSlotContent(label), aside: isSlotContent(aside) },
    { uid, own: chosen },
  );
  return <Tree tree={tree} slots={{ label, aside, children, ...bodies }} handlers={regionHandlers({ view, onView, tipAction }, own, uid)} />;
}

export const Region = Object.assign(RegionRoot, { View: RegionView });
