import { Children, isValidElement, useId, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import type { Step } from '../primitives/step';
import { Tabs, type TipAction } from './Tabs';
import './Region.css';

export interface RegionViewProps {
  /** The view's id, as `view` / `onView` name it. */
  id: string;
  /** The tab's label. */
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
  return null; // Region reads its props and renders the chosen one's children.
}

export interface RegionProps {
  /** The region's accessible name ("Mixer", "Song form"). */
  name: string;
  /** A visible header label; omit for a region that needs none. */
  label?: ReactNode;
  /** Header content on the right: a second switch (use `Tabs`), a count. */
  aside?: ReactNode;
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
function RegionRoot({ name, label, aside, view, defaultView, onView, area, tipAction, gap, className, style, children }: RegionProps) {
  const views = Children.toArray(children).filter(
    (c): c is ReactElement<RegionViewProps> => isValidElement(c) && c.type === RegionView,
  );
  const [own, setOwn] = useState(defaultView ?? views[0]?.props.id);
  const chosenId = view ?? own;
  const chosen = views.find((v) => v.props.id === chosenId) ?? views[0];
  const uid = useId();
  const tabId = (id: string) => `${uid}-tab-${id}`;

  const choose = (id: string) => {
    if (view === undefined) setOwn(id);
    onView?.(id);
  };

  const tabbed = views.length > 0;
  return (
    <section
      className={`lib-region${className ? ` ${className}` : ''}`}
      aria-label={name}
      data-part="region"
      data-tabbed={tabbed || undefined}
      style={area ? { gridArea: area, ...style } : style}
    >
      {(label || aside || tabbed) && (
        <header className="lib-region__head" data-part="head">
          {label && <span className="lib-region__label">{label}</span>}
          {tabbed && chosen && (
            <Tabs
              name={name}
              items={views.map(({ props: v }) => ({ id: v.id, label: v.label, name: v.name, disabled: v.disabled, tip: v.tip }))}
              value={chosen.props.id}
              onChange={choose}
              panelId={`${uid}-panel`}
              tabId={tabId}
              tipAction={tipAction}
            />
          )}
          {aside && <span className="lib-region__aside">{aside}</span>}
        </header>
      )}
      <div
        className="lib-region__body"
        data-part="body"
        data-gap={gap}
        id={tabbed ? `${uid}-panel` : undefined}
        role={tabbed ? 'tabpanel' : undefined}
        aria-labelledby={tabbed && chosen ? tabId(chosen.props.id) : undefined}
      >
        {tabbed ? chosen?.props.children : children}
      </div>
    </section>
  );
}

export const Region = Object.assign(RegionRoot, { View: RegionView });
