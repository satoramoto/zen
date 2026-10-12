import type { CSSProperties, ReactNode } from 'react';
import './Group.css';

export interface GroupProps {
  /** The group's accessible name; also its visible label unless `label` is given. */
  name: string;
  /** A visible label; `false` hides it (the name stays for assistive tech). */
  label?: ReactNode | false;
  /** Header content on the right: a page switch, a count. */
  aside?: ReactNode;
  /** How the controls flow: a row (default) or a column. */
  direction?: 'row' | 'column';
  /** Wrap controls onto more lines when the row is full. */
  wrap?: boolean;
  /** The grid area this group fills inside its region. */
  area?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * **Job.** A labelled cluster of controls inside a region: the transport block, one fader page's
 * strips, a row of One Touch numbers. Every group's header looks the same, and the scale sets
 * its spacing, so clusters read alike across the app.
 */
export function Group({ name, label, aside, direction = 'row', wrap = false, area, className, style, children }: GroupProps) {
  const shown = label === false ? null : (label ?? name);
  return (
    <div
      className={`lib-group${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={name}
      data-part="group"
      style={area ? { gridArea: area, ...style } : style}
    >
      {(shown || aside) && (
        <div className="lib-group__head" data-part="head">
          {shown && <span className="lib-group__label">{shown}</span>}
          {aside && <span className="lib-group__aside">{aside}</span>}
        </div>
      )}
      <div className="lib-group__body" data-part="body" data-direction={direction} data-wrap={wrap || undefined}>
        {children}
      </div>
    </div>
  );
}
