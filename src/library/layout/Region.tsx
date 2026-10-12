import { Children, isValidElement, useId, useState, type CSSProperties, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
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
  /** Header content on the right: a layer switch, a count. */
  aside?: ReactNode;
  /** The chosen view's id (controlled). Without it the region keeps its own choice. */
  view?: string;
  /** The first view shown when uncontrolled; default the first. */
  defaultView?: string;
  /** Called with the id a tab asks for. */
  onView?: (id: string) => void;
  /** The grid area this region fills in its screen. */
  area?: string;
  className?: string;
  style?: CSSProperties;
  /** Content, or `Region.View` children: then the header shows a tab per view and the body the chosen one. */
  children?: ReactNode;
}

/**
 * **Job.** One named block of a screen: the hero, the mixer, the pads. A screen is a few
 * high-level regions that stay put; what changes is the view inside them, chosen by the tabs in
 * the region's own header. So every page of an app keeps one frame, and tabs look and behave
 * the same everywhere.
 *
 * **Look.** The region is drawn by the theme's `plate` material (fill, shadow, texture,
 * `--mat-plate-inset` inside, `--radius-card`); its tabs are `key` faces, the chosen one solid
 * `--selected`. Screens space regions by `--mat-plate-gap`.
 *
 * **Behaviour.** Tabs are a `tablist`: ← → move between views (skipping disabled ones), Home and
 * End jump to the ends, and the body is the `tabpanel`. With `view` the choice is the caller's
 * (a hardware button may change it too); without, the region keeps it.
 */
function RegionRoot({ name, label, aside, view, defaultView, onView, area, className, style, children }: RegionProps) {
  const views = Children.toArray(children).filter(
    (c): c is ReactElement<RegionViewProps> => isValidElement(c) && c.type === RegionView,
  );
  const [own, setOwn] = useState(defaultView ?? views[0]?.props.id);
  const chosenId = view ?? own;
  const chosen = views.find((v) => v.props.id === chosenId) ?? views[0];
  const uid = useId();

  const choose = (id: string) => {
    if (view === undefined) setOwn(id);
    onView?.(id);
  };
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const live = views.filter((v) => !v.props.disabled);
    const at = live.findIndex((v) => v.props.id === chosen?.props.id);
    let next = -1;
    if (event.key === 'ArrowRight') next = (at + 1) % live.length;
    else if (event.key === 'ArrowLeft') next = (at - 1 + live.length) % live.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = live.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const id = live[next].props.id;
    choose(id);
    document.getElementById(`${uid}-tab-${id}`)?.focus();
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
          {tabbed && (
            <div className="lib-region__tabs" role="tablist" aria-label={name} data-part="tabs" onKeyDown={keyDown}>
              {views.map(({ props: v }) => {
                const on = v.id === chosen?.props.id;
                return (
                  <button
                    key={v.id}
                    id={`${uid}-tab-${v.id}`}
                    type="button"
                    role="tab"
                    className="lib-region__tab"
                    data-part="tab"
                    aria-selected={on}
                    aria-controls={`${uid}-panel`}
                    aria-label={v.name}
                    aria-disabled={v.disabled || undefined}
                    tabIndex={on ? 0 : -1}
                    data-tip={v.tip}
                    onClick={() => !v.disabled && !on && choose(v.id)}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}
          {aside && <span className="lib-region__aside">{aside}</span>}
        </header>
      )}
      <div
        className="lib-region__body"
        data-part="body"
        id={tabbed ? `${uid}-panel` : undefined}
        role={tabbed ? 'tabpanel' : undefined}
        aria-labelledby={tabbed && chosen ? `${uid}-tab-${chosen.props.id}` : undefined}
      >
        {tabbed ? chosen?.props.children : children}
      </div>
    </section>
  );
}

export const Region = Object.assign(RegionRoot, { View: RegionView });
