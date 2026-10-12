import type { CSSProperties, ReactNode } from 'react';
import './Screen.css';

export interface ScreenProps {
  /** The screen's accessible name ("Stage"). */
  name: string;
  /** `grid-template-areas` naming where each region goes, one string per row. */
  areas?: string[];
  /** `grid-template-columns`; default one equal column per name in the first row. */
  columns?: string;
  /** `grid-template-rows`; default `auto` for each row. */
  rows?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * **Job.** A whole screen as a named grid of regions. The app decides what goes where; the theme
 * decides how far apart regions sit (`--mat-plate-gap`). Regions place themselves with `area`.
 */
export function Screen({ name, areas, columns, rows, className, style, children }: ScreenProps) {
  const grid: CSSProperties = {};
  if (areas) {
    grid.gridTemplateAreas = areas.map((row) => `"${row}"`).join(' ');
    grid.gridTemplateColumns = columns ?? `repeat(${areas[0].trim().split(/\s+/).length}, minmax(0, 1fr))`;
    grid.gridTemplateRows = rows ?? `repeat(${areas.length}, auto)`;
  } else {
    if (columns) grid.gridTemplateColumns = columns;
    if (rows) grid.gridTemplateRows = rows;
  }
  return (
    <div
      className={`lib-screen${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={name}
      data-part="screen"
      style={{ ...grid, ...style }}
    >
      {children}
    </div>
  );
}
